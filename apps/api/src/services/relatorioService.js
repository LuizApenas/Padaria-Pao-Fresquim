import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { parseId } from "../utils/validation.js";

function parseDateFilter(value, fieldName, fallback) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`O filtro ${fieldName} deve conter uma data valida.`, 400);
  }

  return date;
}

function getDefaultDateRange() {
  const dataFim = new Date();
  dataFim.setHours(23, 59, 59, 999);

  const dataInicio = new Date(dataFim);
  dataInicio.setDate(dataInicio.getDate() - 29);
  dataInicio.setHours(0, 0, 0, 0);

  return { dataInicio, dataFim };
}

function formatDay(date) {
  return date.toISOString().slice(0, 10);
}

function buildDateBuckets(dataInicio, dataFim) {
  const buckets = new Map();
  const cursor = new Date(dataInicio);

  while (cursor <= dataFim) {
    buckets.set(formatDay(cursor), {
      date: formatDay(cursor),
      day: new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" })
        .format(cursor)
        .replace(".", "")
        .toUpperCase(),
      value: 0,
      orders: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}

export async function getRelatorioVendas({ dataInicio, dataFim, produtoId } = {}) {
  const defaultRange = getDefaultDateRange();
  const inicio = parseDateFilter(dataInicio, "dataInicio", defaultRange.dataInicio);
  const fim = parseDateFilter(dataFim, "dataFim", defaultRange.dataFim);

  fim.setHours(23, 59, 59, 999);

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
  const buckets = buildDateBuckets(inicio, fim);
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
  const hojeInicio = new Date();
  hojeInicio.setHours(0, 0, 0, 0);

  const hojeFim = new Date(hojeInicio);
  hojeFim.setHours(23, 59, 59, 999);

  const ontemInicio = new Date(hojeInicio);
  ontemInicio.setDate(ontemInicio.getDate() - 1);

  const ontemFim = new Date(ontemInicio);
  ontemFim.setHours(23, 59, 59, 999);

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
