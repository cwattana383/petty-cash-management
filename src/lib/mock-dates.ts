// Shared helper that moves every mock transaction date into
// "previous calendar month + current month up to today".
// Original seed dates (Jan–May 2026) are mapped in order, so a later
// original date always stays later (secondary dates never precede the
// transaction date). ~60% of the source range lands in last month,
// ~40% in this month (day 1 → today). Never produces a future date.

const SOURCE_START = Date.UTC(2026, 0, 1);
const SOURCE_END = Date.UTC(2026, 4, 31, 23, 59, 59);
const LAST_MONTH_SHARE = 0.6;

const pad = (n: number) => String(n).padStart(2, "0");
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** First day of the previous calendar month (local). */
export function firstDayOfLastMonth(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}

/** Date `offsetDays` before today (local, never in the future). */
export function generateMockDate(offsetDays: number, now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.max(0, offsetDays));
}

function mapTime(t: number, now = new Date()): number {
  const frac = Math.min(1, Math.max(0, (t - SOURCE_START) / (SOURCE_END - SOURCE_START)));
  const lastStart = firstDayOfLastMonth(now).getTime();
  const thisStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  if (frac < LAST_MONTH_SHARE) {
    return lastStart + (frac / LAST_MONTH_SHARE) * (thisStart - 1 - lastStart);
  }
  return thisStart + ((frac - LAST_MONTH_SHARE) / (1 - LAST_MONTH_SHARE)) * (now.getTime() - thisStart);
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** Remaps one ISO date / datetime string; values outside the seed window are left unchanged. */
export function rebaseMockDate(value: string): string {
  const m = DATE_RE.exec(value);
  if (m) {
    const t = Date.UTC(+m[1], +m[2] - 1, +m[3], 12);
    if (t < SOURCE_START || t > SOURCE_END) return value;
    return toIsoDate(new Date(mapTime(t)));
  }
  if (DATETIME_RE.test(value)) {
    const t = new Date(value).getTime();
    if (isNaN(t) || t < SOURCE_START || t > SOURCE_END) return value;
    return new Date(Math.min(mapTime(t), Date.now())).toISOString();
  }
  return value;
}

/** Deeply remaps every date string inside mock seed data. IDs are not touched. */
export function rebaseMockDates<T>(data: T): T {
  const walk = (v: unknown, key?: string): unknown => {
    if (typeof v === "string") return key && /id$|Id$|No$|number$|Number$/.test(key) ? v : rebaseMockDate(v);
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v && typeof v === "object") {
      for (const k of Object.keys(v as Record<string, unknown>)) {
        (v as Record<string, unknown>)[k] = walk((v as Record<string, unknown>)[k], k);
      }
      return v;
    }
    return v;
  };
  return walk(data) as T;
}
