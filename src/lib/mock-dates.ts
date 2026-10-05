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

// Distinct seed days (sorted). Mapped by rank so rows spread over many days.
const SEED_DAYS = ["2026-01-01,"2026-01-30,"2026-02-01,"2026-02-10,"2026-02-12,"2026-02-14,"2026-02-15,"2026-02-18,"2026-02-19,"2026-02-20,"2026-02-21,"2026-02-22,"2026-02-23,"2026-02-24,"2026-02-25,"2026-02-26,"2026-02-27,"2026-02-28,"2026-03-01,"2026-03-02,"2026-03-03,"2026-03-04,"2026-03-05,"2026-03-06,"2026-03-07,"2026-03-08,"2026-03-10,"2026-03-11,"2026-03-15,"2026-03-16,"2026-03-17,"2026-04-01,"2026-04-02,"2026-04-03,"2026-04-04,"2026-04-05,"2026-04-06,"2026-04-07,"2026-04-08,"2026-04-18,"2026-04-20,"2026-04-21,"2026-04-22,"2026-04-23,"2026-04-28,"2026-05-01,"2026-05-02,"2026-05-03,"2026-05-04,"2026-05-05,"2026-05-06,"2026-05-07,"2026-05-08,"2026-05-09,"2026-05-10,"2026-05-11,"2026-05-12,"2026-05-13,"2026-05-14,"2026-05-15,"2026-05-16,"2026-05-17].map((d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), 12));

function rankOf(t: number): number {
  // fractional rank with linear interpolation between neighbouring seed days
  if (t <= SEED_DAYS[0]) return 0;
  const last = SEED_DAYS.length - 1;
  if (t >= SEED_DAYS[last]) return last;
  let i = 0;
  while (SEED_DAYS[i + 1] < t) i++;
  return i + (t - SEED_DAYS[i]) / (SEED_DAYS[i + 1] - SEED_DAYS[i]);
}

function mapTime(t: number, now = new Date()): number {
  const frac = rankOf(t) / (SEED_DAYS.length - 1);
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
