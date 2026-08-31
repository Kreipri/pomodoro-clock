import type { SessionLog, TrendDay } from "./types";

export function sessionDurationSeconds(log: SessionLog): number {
  if (Number.isFinite(log.actualSeconds)) return Math.max(0, log.actualSeconds ?? 0);
  return log.completed ? Math.max(0, log.minutes * 60 + (log.overtimeSeconds || 0)) : 0;
}

export function buildTrendDays(logs: SessionLog[], now = new Date()): TrendDay[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return {
      key: date.getTime(),
      label: new Intl.DateTimeFormat(undefined, { weekday: "narrow" }).format(date),
      focusMinutes: 0,
      breakMinutes: 0
    } satisfies TrendDay;
  });

  for (const log of logs) {
    const date = new Date(log.endedAt);
    date.setHours(0, 0, 0, 0);
    const day = days.find((item) => item.key === date.getTime());
    if (day) day[log.phase === "focus" ? "focusMinutes" : "breakMinutes"] += sessionDurationSeconds(log) / 60;
  }
  return days;
}

export function formatDuration(totalSeconds: number): string {
  const roundedMinutes = Math.round(totalSeconds / 60);
  if (roundedMinutes < 60) return `${roundedMinutes}m`;
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function formatTrendMinutes(minutes: number): string {
  return formatDuration(Math.round(minutes * 60));
}

export function formatLogTime(timestamp: number, now = new Date()): string {
  const date = new Date(timestamp);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const sameDay = (left: Date, right: Date) => left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
  const day = sameDay(date, now) ? "Today" : sameDay(date, yesterday) ? "Yesterday" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
  return `${day} · ${time}`;
}

export function trendChange(days: TrendDay[]): number {
  const previous = days.slice(1, 4).reduce((total, day) => total + day.focusMinutes, 0);
  const recent = days.slice(4).reduce((total, day) => total + day.focusMinutes, 0);
  if (previous === 0) return recent > 0 ? 100 : 0;
  return Math.round(((recent - previous) / previous) * 100);
}
