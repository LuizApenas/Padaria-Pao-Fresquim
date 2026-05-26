// apps/api/src/utils/timezone.js
// Calendario operacional da padaria. Toda regra de "hoje", "semana",
// "mes corrente" e filtros por dia usa America/Sao_Paulo.

export const APP_TIMEZONE = "America/Sao_Paulo";

const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** YYYY-MM-DD do dia corrente em America/Sao_Paulo. */
export function todayIsoSp(date = new Date()) {
  return isoDateFormatter.format(date);
}

/** YYYY-MM-DD de N dias atras em America/Sao_Paulo. */
export function isoDateNDaysAgoSp(days, date = new Date()) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - days);
  return isoDateFormatter.format(d);
}

/** HH:MM no fuso de SP (usado pelo cron de cobranca). */
export function currentHhmmSp(date = new Date()) {
  return timeFormatter.format(date);
}

/**
 * Inicio (00:00:00 local) e fim (do dia seguinte em 00:00:00 local) de um
 * intervalo de YYYY-MM-DD..YYYY-MM-DD, ja como instantes UTC para passar ao
 * Prisma. Garante que "filtra vendas de 2026-05-25" pegue 00:00 ate 23:59:59
 * no horario de Sao Paulo (e nao em UTC).
 */
export function spDayBounds(isoStart, isoEnd) {
  const inicio = new Date(`${isoStart}T00:00:00-03:00`);
  const fim = new Date(`${isoEnd}T23:59:59.999-03:00`);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    return { inicio: null, fim: null };
  }

  return { inicio, fim };
}

/** Inicio e fim de hoje em SP, como instantes para consulta no banco. */
export function todayBoundsSp(date = new Date()) {
  const today = todayIsoSp(date);
  return spDayBounds(today, today);
}

/** Inicio e fim de ontem em SP, como instantes para consulta no banco. */
export function yesterdayBoundsSp(date = new Date()) {
  const yesterday = isoDateNDaysAgoSp(1, date);
  return spDayBounds(yesterday, yesterday);
}

/** Inicio do mes corrente em SP, como Date UTC. */
export function startOfMonthSp() {
  const today = todayIsoSp();
  const [year, month] = today.split("-").map(Number);
  return new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00-03:00`);
}

/** Inicio do mes seguinte em SP, como Date UTC (limite exclusivo). */
export function startOfNextMonthSp() {
  const today = todayIsoSp();
  const [year, month] = today.split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00-03:00`);
}
