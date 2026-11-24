// Mock "server-side" audit log for Entities (Company Identity).
// Written only by the API layer (api-client) on create/update — the UI only reads it.
// TODO: replace with a real server-side audit table when the backend is connected.
import { users } from "./mock-data";

export interface EntityAuditChange { field: string; oldValue: string; newValue: string; kind?: "changed" | "added" | "removed" }
export interface EntityAuditEvent {
  id: string; entityId: string; type: "Created" | "Updated";
  actorName: string; actorEmail?: string; actorEmployeeId?: string;
  at: string; // ISO
  changes: EntityAuditChange[];
}

type Raw = Record<string, any>;

// Sample demo events only.
const auditStore: EntityAuditEvent[] = [
  { id: "eaud-1", entityId: "ent-1", type: "Created", actorName: "System", at: "2026-01-01T09:00:00", changes: [{ field: "Company Code", oldValue: "", newValue: "ABC001", kind: "added" }] },
  { id: "eaud-2", entityId: "ent-1", type: "Updated", actorName: "Thana Pitak", actorEmail: "thana@company.com", actorEmployeeId: "MGR001", at: "2026-03-01T10:15:00",
    changes: [{ field: "Company Name Alias", oldValue: "", newValue: "\"ABC\"", kind: "added" }] },
  { id: "eaud-3", entityId: "ent-2", type: "Created", actorName: "System", at: "2026-01-01T09:00:00", changes: [{ field: "Company Code", oldValue: "", newValue: "CPA002", kind: "added" }] },
  { id: "eaud-4", entityId: "ent-3", type: "Created", actorName: "System", at: "2025-06-01T09:00:00", changes: [{ field: "Company Code", oldValue: "", newValue: "DEM003", kind: "added" }] },
  { id: "eaud-5", entityId: "ent-3", type: "Updated", actorName: "Thana Pitak", actorEmail: "thana@company.com", actorEmployeeId: "MGR001", at: "2026-01-01T11:30:00",
    changes: [{ field: "Status", oldValue: "Active", newValue: "Inactive", kind: "changed" }] },
];

function currentActor() {
  try {
    const id = localStorage.getItem("mock_auth_user_id");
    const u: any = users.find((x: any) => x.id === id);
    if (u) return { actorName: u.name, actorEmail: u.email, actorEmployeeId: u.employeeCode };
  } catch { /* no session */ }
  return { actorName: "System" };
}

const statusText = (s: unknown) => (s === "ACTIVE" ? "Active" : s === "INACTIVE" ? "Inactive" : String(s ?? ""));
const fmtD = (v: unknown) => { const s = String(v ?? "").slice(0, 10); if (!s) return ""; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
const branch = (t: Raw) => (t.branchType === "HEAD_OFFICE" ? "(Head Office)" : `(Branch ${t.branchNo || ""})`);
const addrText = (a?: Raw) => (a ? [a.addressLine1, a.subdistrict, a.district, a.province, a.postalCode, a.country].filter(Boolean).join(" ") : "");

function listDiff(field: string, before: string[], after: string[], out: EntityAuditChange[]) {
  after.filter((x) => !before.includes(x)).forEach((x) => out.push({ field, oldValue: "", newValue: `"${x}"`, kind: "added" }));
  before.filter((x) => !after.includes(x)).forEach((x) => out.push({ field, oldValue: `"${x}"`, newValue: "", kind: "removed" }));
}

export function diffEntity(before: Raw, after: Raw): EntityAuditChange[] {
  const out: EntityAuditChange[] = [];
  const scalar = (field: string, key: string, f: (v: unknown) => string = (v) => String(v ?? "")) => {
    if (!(key in after)) return;
    const o = f(before[key]), n = f(after[key]);
    if (o !== n) out.push({ field, oldValue: o, newValue: n, kind: "changed" });
  };
  scalar("Company Code", "companyCode");
  scalar("Status", "status", statusText);
  scalar("Legal Entity Name (TH)", "legalNameTh");
  scalar("Legal Entity Name (EN)", "legalNameEn");
  scalar("Effective Start Date", "effectiveStartDate", fmtD);
  scalar("Effective End Date", "effectiveEndDate", fmtD);

  if (Array.isArray(after.taxIds)) {
    const b: Raw[] = before.taxIds ?? [], a: Raw[] = after.taxIds;
    a.forEach((t, i) => {
      const prev = b.find((x) => x.taxId === t.taxId);
      const label = `Tax ID #${i + 1}`;
      if (!prev) out.push({ field: label, oldValue: "", newValue: `${t.taxId} ${branch(t)}`, kind: "added" });
      else {
        if (branch(prev) !== branch(t)) out.push({ field: label, oldValue: `${t.taxId} ${branch(prev)}`, newValue: `${t.taxId} ${branch(t)}`, kind: "changed" });
        if (!!prev.isPrimary !== !!t.isPrimary && t.isPrimary) out.push({ field: "Primary Tax ID", oldValue: b.find((x) => x.isPrimary)?.taxId ?? "", newValue: t.taxId, kind: "changed" });
      }
    });
    b.filter((t) => !a.some((x) => x.taxId === t.taxId)).forEach((t) => out.push({ field: "Tax ID", oldValue: `${t.taxId} ${branch(t)}`, newValue: "", kind: "removed" }));
  }
  if (Array.isArray(after.nameAliases)) listDiff("Company Name Alias", (before.nameAliases ?? []).map((x: Raw) => x.alias), after.nameAliases.map((x: Raw) => x.alias), out);
  if (Array.isArray(after.addresses)) {
    (["TH", "EN"] as const).forEach((lang) => {
      const o = addrText((before.addresses ?? []).find((x: Raw) => x.language === lang));
      const n = addrText(after.addresses.find((x: Raw) => x.language === lang));
      const norm = (s: string) => s.replace(/\s*Thailand$/, "");
      if (norm(o) !== norm(n)) out.push({ field: `Primary Address (${lang})`, oldValue: o, newValue: n, kind: "changed" });
    });
  }
  if (Array.isArray(after.addressAliases)) listDiff("Address Alias", (before.addressAliases ?? []).map((x: Raw) => x.alias), after.addressAliases.map((x: Raw) => x.alias), out);
  return out;
}

export function recordEntityCreated(ent: Raw) {
  auditStore.push({ id: `eaud-${Date.now()}`, entityId: String(ent.id), type: "Created", ...currentActor(), at: new Date().toISOString(),
    changes: [{ field: "Company Code", oldValue: "", newValue: String(ent.companyCode ?? ""), kind: "added" }] });
}
export function recordEntityUpdated(entityId: string, before: Raw, patch: Raw) {
  const changes = diffEntity(before, patch);
  if (!changes.length) return;
  auditStore.push({ id: `eaud-${Date.now()}`, entityId, type: "Updated", ...currentActor(), at: new Date().toISOString(), changes });
}
export function getEntityAudit(entityId: string): EntityAuditEvent[] {
  return auditStore.filter((e) => e.entityId === entityId).sort((a, b) => b.at.localeCompare(a.at)).map((e) => ({ ...e, changes: e.changes.map((c) => ({ ...c })) }));
}
