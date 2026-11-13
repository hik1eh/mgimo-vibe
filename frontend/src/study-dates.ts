const CAMPUS_TIMEZONE = "Europe/Moscow";
export function validDay(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
export function addDays(day: string, count: number) {
  const result = new Date(`${day}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + count);
  return result.toISOString().slice(0, 10);
}
export function monday(day: string) {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  return addDays(day, -((weekday + 6) % 7));
}
export function campusDay(value: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: CAMPUS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export const campusTime = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    timeZone: CAMPUS_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
export const dayLabel = (day: string, short = false) =>
  new Intl.DateTimeFormat("ru-RU", {
    timeZone: CAMPUS_TIMEZONE,
    day: "numeric",
    month: short ? "short" : "long",
    ...(!short ? ({ year: "numeric" } as const) : {}),
  }).format(new Date(`${day}T12:00:00Z`));
export const weekdayLabel = (day: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    timeZone: CAMPUS_TIMEZONE,
    weekday: "short",
  }).format(new Date(`${day}T12:00:00Z`));
