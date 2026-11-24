import { addMonths, format } from "date-fns";

// TODO: replace with the real AVG VAT Rate table (QA notes: accounting_config) once confirmed with the dev team.
export interface AvgVatRate {
  id: string;
  rate: number;
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
  updatedAt: string; // ISO
  deleted?: boolean; // soft delete keeps the audit trail
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
  return { target, rate: rates.find((r) => !r.deleted && r.from <= target && target <= r.to) };
}

export type AvgVatValidation = { error?: string; overlap?: AvgVatRate; gap?: boolean };

export function validateAvgVatRate(input: { rate: string; from: string; to: string }, rates: AvgVatRate[], editingId?: string): AvgVatValidation {
  if (input.rate.trim() === "" || isNaN(Number(input.rate)) || !input.from || !input.to) return { error: "required" };
  if (input.to < input.from) return { error: "range" };
  const others = rates.filter((r) => r.id !== editingId && !r.deleted);
  const overlap = others.find((r) => r.from <= input.to && input.from <= r.to);
  if (overlap) return { error: "overlap", overlap };
  const prev = others.filter((r) => r.to < input.from).sort((a, b) => b.to.localeCompare(a.to))[0];
  const gap = !!prev && toYmd(new Date(new Date(`${prev.to}T00:00:00`).getTime() + 86400000)) !== input.from;
  return { gap };
}

// Audit trail (append-only). TODO: move to the real backend table when confirmed.
export type AvgVatAuditType = "Created" | "Updated" | "Deleted";
export interface AvgVatAuditChange { field: string; oldValue: string; newValue: string }
export interface AvgVatAuditEvent {
  id: string; rateId: string; type: AvgVatAuditType;
  actorName: string; actorEmail?: string; actorEmployeeId?: string;
  at: string; // ISO
  changes: AvgVatAuditChange[];
}
const AUDIT_KEY = "avg-vat-rate-audit";
const AUDIT_SEED: AvgVatAuditEvent[] = SEED.map((r) => ({
  id: `aud-${r.id}`, rateId: r.id, type: "Created", actorName: "System", at: r.updatedAt,
  changes: [
    { field: "AVG VAT Rate %", oldValue: "", newValue: r.rate.toFixed(2) },
    { field: "Effective Date From", oldValue: "", newValue: r.from },
    { field: "Effective Date To", oldValue: "", newValue: r.to },
  ],
}));
export function loadAvgVatAudit(): AvgVatAuditEvent[] {
  try { const raw = localStorage.getItem(AUDIT_KEY); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } } catch { /* seed */ }
  return [...AUDIT_SEED];
}
export function appendAvgVatAudit(e: Omit<AvgVatAuditEvent, "id">) {
  const next = [...loadAvgVatAudit(), { ...e, id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }];
  localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
  return next;
}
export function diffAvgVatRate(a: AvgVatRate, b: AvgVatRate): AvgVatAuditChange[] {
  const out: AvgVatAuditChange[] = [];
  if (a.rate !== b.rate) out.push({ field: "AVG VAT Rate %", oldValue: a.rate.toFixed(2), newValue: b.rate.toFixed(2) });
  if (a.from !== b.from) out.push({ field: "Effective Date From", oldValue: a.from, newValue: b.from });
  if (a.to !== b.to) out.push({ field: "Effective Date To", oldValue: a.to, newValue: b.to });
  return out;
}
