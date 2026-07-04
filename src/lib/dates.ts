/** Date helpers — all app dates are local-timezone YYYY-MM-DD strings. */

export function todayStr(): string {
  return dateStr(new Date());
}

export function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(dateString: string, days: number): string {
  const d = new Date(dateString + "T12:00:00");
  d.setDate(d.getDate() + days);
  return dateStr(d);
}

export function daysAgo(n: number): string {
  return addDays(todayStr(), -n);
}

/** Monday of the week containing the given date. */
export function weekStart(dateString: string): string {
  const d = new Date(dateString + "T12:00:00");
  const dow = (d.getDay() + 6) % 7; // Mon=0
  return addDays(dateString, -dow);
}

export function formatShort(dateString: string): string {
  return new Date(dateString + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDay(dateString: string): string {
  return new Date(dateString + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" });
}

export function isToday(dateString: string): boolean {
  return dateString === todayStr();
}
