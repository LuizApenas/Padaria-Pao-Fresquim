// apps/api/scripts/seed-maio-2026.js
// Generates May/2026 demo data: clock records and sales history.
import "dotenv/config";

import { prisma } from "../src/config/prisma.js";

const MAY_START = { year: 2026, month: 5, day: 1 };
const MAY_END = { year: 2026, month: 5, day: 31 };

const SHIFT_BY_ROLE = {
  PADEIRO: { entrada: [5, 30], saida: [14, 0] },
  ATENDENTE: { entrada: [8, 0], saida: [17, 30] },
  PROPRIETARIO: { entrada: [7, 0], saida: [18, 0] },
};

const PAYMENT_METHODS = ["PIX", "DINHEIRO", "DEBITO", "CREDITO", "FIADO"];
const PAYMENT_WEIGHTS = [40, 25, 15, 10, 10];

function buildDate({ year, month, day }, [hour, minute]) {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function eachDayInclusive(start, end) {
  const days = [];
  const cursor = new Date(start.year, start.month - 1, start.day);
  const last = new Date(end.year, end.month - 1, end.day);

  while (cursor <= last) {
    days.push({
      year: cursor.getFullYear(),
      month: cursor.getMonth() + 1,
      day: cursor.getDate(),
      weekday: cursor.getDay(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function jitterMinutes(baseHour, baseMinute, spread = 12) {
  const offset = Math.floor(Math.random() * (spread * 2 + 1)) - spread;
  const total = baseHour * 60 + baseMinute + offset;
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return [hour, minute];
}

function resolveShift(role, funcionarioId) {
  if (role === "ATENDENTE" && funcionarioId % 2 === 0) {
    return { entrada: [12, 0], saida: [20, 20] };
  }

  return SHIFT_BY_ROLE[role] ?? SHIFT_BY_ROLE.ATENDENTE;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(items) {
  return items[randomBetween(0, items.length - 1)];
}

function pickWeightedPayment() {
  const total = PAYMENT_WEIGHTS.reduce((sum, value) => sum + value, 0);
  let roll = Math.random() * total;

  for (let index = 0; index < PAYMENT_METHODS.length; index += 1) {
    roll -= PAYMENT_WEIGHTS[index];
    if (roll <= 0) {
      return PAYMENT_METHODS[index];
    }
  }

  return "PIX";
}

function toMoney(value) {
  return Number(value).toFixed(2);
}

async function seedPontoMaio() {
  const funcionarios = await prisma.funcionario.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, role: true },
    orderBy: { id: "asc" },
  });

  if (funcionarios.length === 0) {
    throw new Error("Nenhum funcionario ativo encontrado para gerar ponto de maio.");
  }

  const rangeStart = buildDate(MAY_START, [0, 0]);
  const rangeEnd = buildDate(MAY_END, [23, 59]);
  const funcionarioIds = funcionarios.map((item) => item.id);

  const deleted = await prisma.registroPonto.deleteMany({
    where: {
      funcionarioId: { in: funcionarioIds },
      dataHoraBatida: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
  });

  const days = eachDayInclusive(MAY_START, MAY_END).filter((day) => day.weekday !== 0);
  const records = [];

  for (const funcionario of funcionarios) {
    days.forEach((day, dayIndex) => {
      const shift = resolveShift(funcionario.role, funcionario.id);
      const [entradaHour, entradaMinute] = jitterMinutes(shift.entrada[0], shift.entrada[1]);
      const [saidaHour, saidaMinute] = jitterMinutes(shift.saida[0], shift.saida[1], 8);

      records.push(
        {
          funcionarioId: funcionario.id,
          tipoRegistro: "ENTRADA",
          dataHoraBatida: buildDate(day, [entradaHour, entradaMinute]),
        },
        {
          funcionarioId: funcionario.id,
          tipoRegistro: "SAIDA",
          dataHoraBatida: buildDate(day, [saidaHour, saidaMinute]),
        },
      );
    });
  }

  const batchSize = 250;
  let created = 0;

  for (let index = 0; index < records.length; index += batchSize) {
    const chunk = records.slice(index, index + batchSize);
    const result = await prisma.registroPonto.createMany({ data: chunk });
    created += result.count;
  }

  return {
    funcionarios: funcionarios.length,
    diasUteis: days.length,
    removidosNoPeriodo: deleted.count,
    registrosCriados: created,
    periodo: "01/05/2026 a 31/05/2026",
  };
}

function buildSaleItems(produtos) {
  const itemCount = randomBetween(1, 3);
  const shuffled = [...produtos].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, itemCount);
  let total = 0;

  const itens = selected.map((produto) => {
    const quantidade = randomBetween(1, 6);
    const unitPrice = Number(produto.precoBase);
    const subtotal = unitPrice * quantidade;
    total += subtotal;

    return {
      produtoId: produto.id,
      quantidade,
      subtotal: toMoney(subtotal),
    };
  });

  return {
    itens,
    valorTotal: toMoney(total),
  };
}

function resolveSaleStatus(formaPagamento) {
  const roll = Math.random();

  if (roll < 0.05) {
    return "CANCELADA";
  }

  if (roll < 0.12 && formaPagamento !== "FIADO") {
    return "PENDENTE";
  }

  return "CONCLUIDA";
}

async function atualizarSaldoFiado(clienteId, valor) {
  if (!clienteId || valor <= 0) {
    return;
  }

  await prisma.contaFiado.upsert({
    where: { clienteId },
    update: {
      saldoDevedor: {
        increment: toMoney(valor),
      },
    },
    create: {
      clienteId,
      saldoDevedor: toMoney(valor),
      statusNotificacao: "PENDENTE",
    },
  });
}

async function seedVendasMaio() {
  const [produtos, funcionarios, clientes] = await Promise.all([
    prisma.produto.findMany({ orderBy: { id: "asc" } }),
    prisma.funcionario.findMany({
      where: { ativo: true, role: { in: ["ATENDENTE", "PROPRIETARIO"] } },
      orderBy: { id: "asc" },
    }),
    prisma.cliente.findMany({ where: { ativo: true }, orderBy: { id: "asc" } }),
  ]);

  if (produtos.length === 0 || funcionarios.length === 0) {
    throw new Error("Produtos e funcionarios sao obrigatorios para gerar vendas de maio.");
  }

  const rangeStart = buildDate(MAY_START, [0, 0]);
  const rangeEnd = buildDate(MAY_END, [23, 59]);

  const deletedItens = await prisma.itemVenda.deleteMany({
    where: {
      venda: {
        dataHora: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
    },
  });

  const deletedVendas = await prisma.venda.deleteMany({
    where: {
      dataHora: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
  });

  const weekdays = eachDayInclusive(MAY_START, MAY_END).filter((day) => day.weekday !== 0);
  let vendasCriadas = 0;
  let fiadoAtualizado = 0;

  for (const day of weekdays) {
    const vendasNoDia = randomBetween(4, 9);

    for (let index = 0; index < vendasNoDia; index += 1) {
      const formaPagamento = pickWeightedPayment();
      const status = resolveSaleStatus(formaPagamento);
      const funcionario = pickRandom(funcionarios);
      const { itens, valorTotal } = buildSaleItems(produtos);
      const hour = randomBetween(6, 19);
      const minute = randomBetween(0, 59);

      let clienteId = null;

      if (formaPagamento === "FIADO" || Math.random() > 0.25) {
        clienteId = pickRandom(clientes).id;
      }

      if (formaPagamento === "FIADO" && !clienteId) {
        continue;
      }

      const venda = await prisma.venda.create({
        data: {
          dataHora: buildDate(day, [hour, minute]),
          valorTotal,
          formaPagamento,
          status,
          funcionarioId: funcionario.id,
          clienteId,
          itens: {
            create: itens,
          },
        },
      });

      vendasCriadas += 1;

      if (formaPagamento === "FIADO" && status !== "CANCELADA" && clienteId) {
        await atualizarSaldoFiado(clienteId, Number(valorTotal));
        fiadoAtualizado += 1;
      }
    }
  }

  return {
    itensRemovidos: deletedItens.count,
    vendasRemovidas: deletedVendas.count,
    vendasCriadas,
    vendasFiadoAtualizadas: fiadoAtualizado,
    diasUteis: weekdays.length,
    periodo: "01/05/2026 a 31/05/2026",
  };
}

async function main() {
  const ponto = await seedPontoMaio();
  const vendas = await seedVendasMaio();

  console.log(
    JSON.stringify(
      {
        mes: "05/2026",
        ponto,
        vendas,
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Erro ao gerar seeds de maio:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
