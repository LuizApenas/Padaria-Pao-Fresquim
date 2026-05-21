// apps/web/src/app/core/utils/sales-chart-aggregation.ts
import { DailySalesReport } from "../services/reports-api.service";

export type SalesChartPoint = {
  key: string;
  label: string;
  /** Second line under the bar (e.g. dd/MM or week range). */
  subLabel?: string;
  value: number;
  orders: number;
  hint?: string;
};

export function formatChartDateLabel(isoDate: string): string {
  const [, month, day] = isoDate.split("-");

  if (!month || !day) {
    return isoDate;
  }

  return `${day}/${month}`;
}

export function formatChartDateRangeLabel(start: string, end: string): string {
  if (start === end) {
    return formatChartDateLabel(start);
  }

  return `${formatChartDateLabel(start)} – ${formatChartDateLabel(end)}`;
}

type WeekBucket = SalesChartPoint & { rangeStart: string; rangeEnd: string };

export function aggregateDailyByWeek(daily: DailySalesReport[]): SalesChartPoint[] {
  const buckets = new Map<string, WeekBucket>();

  for (const item of daily) {
    const key = isoWeekKey(item.date);
    const existing = buckets.get(key);

    if (existing) {
      existing.value += item.value;
      existing.orders += item.orders;
      if (item.date < existing.rangeStart) {
        existing.rangeStart = item.date;
      }
      if (item.date > existing.rangeEnd) {
        existing.rangeEnd = item.date;
      }
      continue;
    }

    buckets.set(key, {
      key,
      label: `S${key.split("-W")[1] ?? ""}`,
      subLabel: formatChartDateLabel(item.date),
      value: item.value,
      orders: item.orders,
      hint: key,
      rangeStart: item.date,
      rangeEnd: item.date,
    });
  }

  return Array.from(buckets.values())
    .map(({ rangeStart, rangeEnd, ...point }) => ({
      ...point,
      subLabel: formatChartDateRangeLabel(rangeStart, rangeEnd),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function aggregateDailyByMonth(daily: DailySalesReport[]): SalesChartPoint[] {
  const buckets = new Map<string, SalesChartPoint>();

  for (const item of daily) {
    const key = item.date.slice(0, 7);
    const existing = buckets.get(key);

    if (existing) {
      existing.value += item.value;
      existing.orders += item.orders;
      continue;
    }

    buckets.set(key, {
      key,
      label: formatMonthLabel(key),
      subLabel: formatMonthYearLabel(key),
      value: item.value,
      orders: item.orders,
    });
  }

  return Array.from(buckets.values()).sort((a, b) => a.key.localeCompare(b.key));
}

export function dailyToChartPoints(daily: DailySalesReport[]): SalesChartPoint[] {
  return daily.map((item) => ({
    key: item.date,
    label: item.day,
    subLabel: formatChartDateLabel(item.date),
    value: item.value,
    orders: item.orders,
    hint: formatFullDateLabel(item.date),
  }));
}

function isoWeekKey(dateValue: string): string {
  const date = new Date(`${dateValue}T12:00:00`);
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);

  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, 1);

  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

function formatMonthYearLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${String(month).padStart(2, "0")}/${year}`;
}

function formatFullDateLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
