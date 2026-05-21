// apps/api/scripts/seed-ponto-historico.js
// Generates historical clock-in records for active employees (01/05 to 31/05).
import "dotenv/config";

import { prisma } from "../src/config/prisma.js";

const PERIOD_START = { year: 2026, month: 5, day: 1 };
const PERIOD_END = { year: 2026, month: 5, day: 31 };

const SHIFT_BY_ROLE = {
  PADEIRO: { entrada: [5, 30], saida: [14, 0] },
  ATENDENTE: { entrada: [8, 0], saida: [17, 30] },
  PROPRIETARIO: { entrada: [7, 0], saida: [18, 0] },
};

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

function resolveShift(role, funcionarioId, dayIndex) {
  if (role === "ATENDENTE" && funcionarioId % 2 === 0) {
    return { entrada: [12, 0], saida: [20, 20] };
  }

  return SHIFT_BY_ROLE[role] ?? SHIFT_BY_ROLE.ATENDENTE;
}

async function main() {
  const funcionarios = await prisma.funcionario.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, role: true },
    orderBy: { id: "asc" },
  });

  if (funcionarios.length === 0) {
    throw new Error("Nenhum funcionario ativo encontrado para gerar ponto.");
  }

  const rangeStart = buildDate(PERIOD_START, [0, 0]);
  const rangeEnd = buildDate(PERIOD_END, [23, 59]);
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

  const days = eachDayInclusive(PERIOD_START, PERIOD_END).filter((day) => day.weekday !== 0);
  const records = [];

  for (const funcionario of funcionarios) {
    days.forEach((day, dayIndex) => {
      const shift = resolveShift(funcionario.role, funcionario.id, dayIndex);
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

  console.log(
    JSON.stringify(
      {
        funcionarios: funcionarios.length,
        diasUteis: days.length,
        removidosNoPeriodo: deleted.count,
        registrosCriados: created,
        periodo: "01/05/2026 a 31/05/2026",
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
    console.error("Erro ao gerar ponto historico:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
