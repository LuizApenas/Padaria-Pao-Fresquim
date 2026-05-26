import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  APP_TIMEZONE,
  isoDateNDaysAgoSp,
  spDayBounds,
  todayBoundsSp,
  todayIsoSp,
  yesterdayBoundsSp,
} from "../utils/timezone.js";
import { parseId } from "../utils/validation.js";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function assertIsoDate(value, fieldName) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    throw new AppError(`O filtro ${fieldName} deve conter uma data valida no formato YYYY-MM-DD.`, 400);
  }
}

function parseDateRange(dataInicio, dataFim) {
  const inicioIso = dataInicio || isoDateNDaysAgoSp(29);
  const fimIso = dataFim || todayIsoSp();

  assertIsoDate(inicioIso, "dataInicio");
  assertIsoDate(fimIso, "dataFim");

  const { inicio, fim } = spDayBounds(inicioIso, fimIso);

  if (!inicio || !fim) {
    throw new AppError("Periodo invalido. Use datas no formato YYYY-MM-DD.", 400);
  }

  if (inicio > fim) {
    throw new AppError("dataInicio nao pode ser maior que dataFim.", 400);
  }

  return { inicioIso, fimIso, inicio, fim };
}

function formatDay(date) {
  // Sempre formata no fuso da padaria (America/Sao_Paulo) para que o eixo X
  // dos relatorios diarios bata com o calendario que o operador ve no balcao.
  return dayFormatter.format(date);
}

function buildDateBuckets(dataInicioIso, dataFimIso) {
  const buckets = new Map();
  const cursor = new Date(`${dataInicioIso}T12:00:00Z`);
  const end = new Date(`${dataFimIso}T12:00:00Z`);

  while (cursor <= end) {
    const date = cursor.toISOString().slice(0, 10);
    buckets.set(date, {
      date,
      day: new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: APP_TIMEZONE })
        .format(new Date(`${date}T12:00:00-03:00`))
        .replace(".", "")
        .toUpperCase(),
      value: 0,
      orders: 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return buckets;
}

export async function getRelatorioVendas({ dataInicio, dataFim, produtoId } = {}) {
  const { inicioIso, fimIso, inicio, fim } = parseDateRange(dataInicio, dataFim);

  const produtoFiltro = produtoId ? parseId(produtoId, "produtoId") : null;
  const where = {
    dataHora: {
      gte: inicio,
      lte: fim,
    },
    ...(produtoFiltro
      ? {
          itens: {
            some: {
              produtoId: produtoFiltro,
            },
          },
        }
      : {}),
  };

  const vendas = await prisma.venda.findMany({
    where,
    orderBy: { dataHora: "asc" },
    include: {
      itens: {
        include: {
          produto: true,
        },
      },
    },
  });

  const totalSold = vendas.reduce((total, venda) => total + Number(venda.valorTotal), 0);
  const buckets = buildDateBuckets(inicioIso, fimIso);
  const rankingByProduct = new Map();

  for (const venda of vendas) {
    const bucket = buckets.get(formatDay(venda.dataHora));

    if (bucket) {
      bucket.value += Number(venda.valorTotal);
      bucket.orders += 1;
    }

    for (const item of venda.itens) {
      const current = rankingByProduct.get(item.produtoId) ?? {
        id: item.produtoId,
        name: item.produto?.nome ?? "Produto nao informado",
        sales: 0,
        revenue: 0,
      };

      current.sales += item.quantidade;
      current.revenue += Number(item.subtotal);
      rankingByProduct.set(item.produtoId, current);
    }
  }

  return {
    totalSold,
    totalOrders: vendas.length,
    averageTicket: vendas.length ? totalSold / vendas.length : 0,
    dailySales: Array.from(buckets.values()),
    topProducts: Array.from(rankingByProduct.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5),
  };
}

export async function getRelatorioDevedores() {
  const contas = await prisma.contaFiado.findMany({
    where: {
      saldoDevedor: {
        gt: 0,
      },
    },
    orderBy: {
      saldoDevedor: "desc",
    },
    include: {
      cliente: {
        include: {
          vendas: {
            include: {
              itens: {
                include: {
                  produto: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return contas.map((conta) => ({
    clienteId: conta.clienteId,
    nome: conta.cliente.nome,
    telefone: conta.cliente.telefone,
    totalDevido: Number(conta.saldoDevedor),
    statusNotificacao: conta.statusNotificacao,
    produtosComprados: conta.cliente.vendas.flatMap((venda) =>
      venda.itens.map((item) => ({
        data: venda.dataHora,
        produto: item.produto?.nome ?? "Produto nao informado",
        quantidade: item.quantidade,
        subtotal: Number(item.subtotal),
      })),
    ),
  }));
}

export async function getRelatorioDashboard() {
  const { inicio: hojeInicio, fim: hojeFim } = todayBoundsSp();
  const { inicio: ontemInicio, fim: ontemFim } = yesterdayBoundsSp();

  const [hoje, ontem, clientesComFiado] = await prisma.$transaction([
    prisma.venda.aggregate({
      where: { dataHora: { gte: hojeInicio, lte: hojeFim } },
      _sum: { valorTotal: true },
      _avg: { valorTotal: true },
      _count: { id: true },
    }),
    prisma.venda.aggregate({
      where: { dataHora: { gte: ontemInicio, lte: ontemFim } },
      _sum: { valorTotal: true },
    }),
    prisma.contaFiado.count({
      where: {
        saldoDevedor: {
          gt: 0,
        },
      },
    }),
  ]);
  const totalHoje = Number(hoje._sum.valorTotal ?? 0);
  const totalOntem = Number(ontem._sum.valorTotal ?? 0);
  const comparativoOntem = totalOntem > 0 ? ((totalHoje - totalOntem) / totalOntem) * 100 : 0;

  return {
    totalSoldToday: totalHoje,
    salesCount: hoje._count.id,
    averageTicket: Number(hoje._avg.valorTotal ?? 0),
    debtClients: clientesComFiado,
    comparedToYesterday: comparativoOntem,
  };
}
