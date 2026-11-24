import { addMonths, format } from "date-fns";

// TODO: replace with the real AVG VAT Rate table (QA notes: accounting_config) once confirmed with the dev team.
export interface AvgVatRate {
  id: string;
  rate: number;
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
  updatedAt: string; // ISO
}

export type AvgVatStatus = "Active" | "Upcoming" | "Expired";

const KEY = "avg-vat-rates";
const SEED: AvgVatRate[] = [
  { id: "avg-2026", rate: 69.44, from: "2026-01-01", to: "2026-12-31", updatedAt: "2026-01-01T09:00:00" },
  { id: "avg-2027", rate: 71.44, from: "2027-01-01", to: "2027-12-31", updatedAt: "2026-01-01T09:00:00" },
];

export function loadAvgVatRates(): AvgVatRate[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; }
  } catch { /* fall back to seed */ }
  return [...SEED];
}
export function saveAvgVatRates(rates: AvgVatRate[]) { localStorage.setItem(KEY, JSON.stringify(rates)); }

export const toYmd = (d: Date) => format(d, "yyyy-MM-dd");

export function getAvgVatStatus(r: AvgVatRate, today: string = toYmd(new Date())): AvgVatStatus {
  if (today < r.from) return "Upcoming";
  if (today > r.to) return "Expired";
  return "Active";
}

export function sortAvgVatRates(rates: AvgVatRate[]) { return [...rates].sort((a, b) => b.from.localeCompare(a.from)); }

/** Rate lookup: transaction date + 1 month, find the period containing it. */
export function findApplicableRate(rates: AvgVatRate[], trnDate: string) {
  const target = toYmd(addMonths(new Date(`${trnDate}T00:00:00`), 1));
  return { target, rate: rates.find((r) => r.from <= target && target <= r.to) };
}

export type AvgVatValidation = { error?: string; overlap?: AvgVatRate; gap?: boolean };

export function validateAvgVatRate(input: { rate: string; from: string; to: string }, rates: AvgVatRate[], editingId?: string): AvgVatValidation {
  if (input.rate.trim() === "" || isNaN(Number(input.rate)) || !input.from || !input.to) return { error: "required" };
  if (input.to < input.from) return { error: "range" };
  const others = rates.filter((r) => r.id !== editingId);
  const overlap = others.find((r) => r.from <= input.to && input.from <= r.to);
  if (overlap) return { error: "overlap", overlap };
  const prev = others.filter((r) => r.to < input.from).sort((a, b) => b.to.localeCompare(a.to))[0];
  const gap = !!prev && toYmd(new Date(new Date(`${prev.to}T00:00:00`).getTime() + 86400000)) !== input.from;
  return { gap };
}
