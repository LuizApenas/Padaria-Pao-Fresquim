const APP_TIMEZONE = "America/Sao_Paulo";

const isoDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function todayIsoBr(date = new Date()): string {
  return isoDateFormatter.format(date);
}

export function isoDateNDaysAgoBr(days: number, date = new Date()): string {
  const cursor = new Date(date);
  cursor.setUTCDate(cursor.getUTCDate() - days);
  return isoDateFormatter.format(cursor);
}

export function startOfCurrentMonthIsoBr(date = new Date()): string {
  return `${todayIsoBr(date).slice(0, 8)}01`;
}
