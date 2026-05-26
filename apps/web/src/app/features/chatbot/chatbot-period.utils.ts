// apps/web/src/app/features/chatbot/chatbot-period.utils.ts
import { isoDateNDaysAgoBr, todayIsoBr } from "../../core/utils/br-date";

export type ChatbotPeriod = {
  dataInicio: string;
  dataFim: string;
  label: string;
};

const MONTHS: Record<string, number> = {
  janeiro: 1,
  jan: 1,
  fevereiro: 2,
  fev: 2,
  marco: 3,
  mar: 3,
  abril: 4,
  abr: 4,
  maio: 5,
  mai: 5,
  junho: 6,
  jun: 6,
  julho: 7,
  jul: 7,
  agosto: 8,
  ago: 8,
  setembro: 9,
  set: 9,
  outubro: 10,
  out: 10,
  novembro: 11,
  nov: 11,
  dezembro: 12,
  dez: 12,
};

const MONTH_LABELS = [
  "janeiro",
  "fevereiro",
  "marco",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function buildMonthPeriod(year: number, month: number): ChatbotPeriod {
  const lastDay = new Date(year, month, 0).getDate();

  return {
    dataInicio: formatIsoDate(year, month, 1),
    dataFim: formatIsoDate(year, month, lastDay),
    label: `${MONTH_LABELS[month - 1]} de ${year}`,
  };
}

function resolveYear(normalized: string, fallbackYear: number): number {
  const yearMatch = normalized.match(/\b(20\d{2})\b/);

  return yearMatch ? Number(yearMatch[1]) : fallbackYear;
}

export function parsePeriodFromMessage(input: string, referenceDate = new Date()): ChatbotPeriod | null {
  const normalized = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  const referenceYear = referenceDate.getFullYear();

  const numericMonthYear = normalized.match(/\b(\d{1,2})\s*\/\s*(20\d{2})\b/);
  if (numericMonthYear) {
    const month = Number(numericMonthYear[1]);
    const year = Number(numericMonthYear[2]);

    if (month >= 1 && month <= 12) {
      return buildMonthPeriod(year, month);
    }
  }

  const isoMonth = normalized.match(/\b(20\d{2})-(\d{2})\b/);
  if (isoMonth) {
    const year = Number(isoMonth[1]);
    const month = Number(isoMonth[2]);

    if (month >= 1 && month <= 12) {
      return buildMonthPeriod(year, month);
    }
  }

  for (const [name, month] of Object.entries(MONTHS)) {
    if (normalized.includes(name)) {
      return buildMonthPeriod(resolveYear(normalized, referenceYear), month);
    }
  }

  if (normalized.includes("semana")) {
    return {
      dataInicio: isoDateNDaysAgoBr(6, referenceDate),
      dataFim: todayIsoBr(referenceDate),
      label: "ultimos 7 dias",
    };
  }

  if (
    normalized.includes("mes") ||
    normalized.includes("mensal") ||
    normalized.includes("neste mes") ||
    normalized.includes("este mes")
  ) {
    return buildMonthPeriod(referenceYear, referenceDate.getMonth() + 1);
  }

  return null;
}
