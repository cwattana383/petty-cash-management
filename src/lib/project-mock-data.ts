export interface ProjectRow {
  id: string;
  code: string;
  name: string;
  owner: string;
  active: boolean;
  updatedAt: string;
  creationDate: string; // ISO yyyy-mm-dd
  accountCode: string;
  accountName: string;
  effectiveFrom: string; // ISO
  effectiveTo: string; // ISO or ""
}

export const mockProjects: ProjectRow[] = [
  { id: "p1", code: "PRJ-001", name: "Digital Transformation 2026", owner: "Somsak Wichan", active: true, updatedAt: "22/04/2569 07:00:00", creationDate: "2026-01-15", accountCode: "5100-001", accountName: "Project Expenses", effectiveFrom: "2026-01-15", effectiveTo: "2026-12-31" },
  { id: "p2", code: "PRJ-002", name: "Branch Expansion - North", owner: "Wipa Sukjai", active: true, updatedAt: "22/04/2569 07:00:00", creationDate: "2026-02-01", accountCode: "5100-002", accountName: "Branch Setup", effectiveFrom: "2026-02-01", effectiveTo: "" },
  { id: "p3", code: "PRJ-003", name: "ERP Upgrade Phase 2", owner: "Pim Dee", active: true, updatedAt: "22/04/2569 07:00:00", creationDate: "2026-03-10", accountCode: "5200-001", accountName: "IT Infrastructure", effectiveFrom: "2026-03-10", effectiveTo: "2027-03-09" },
  { id: "p4", code: "PRJ-004", name: "Customer Loyalty Program", owner: "Somying Kaewsai", active: false, updatedAt: "22/04/2569 07:00:00", creationDate: "2025-11-01", accountCode: "5300-005", accountName: "Marketing Programs", effectiveFrom: "2025-11-01", effectiveTo: "2026-04-30" },
  { id: "p5", code: "PRJ-005", name: "Horeca", owner: "Anan Thongchai", active: true, updatedAt: "22/04/2569 07:00:00", creationDate: "2026-04-01", accountCode: "5400-001", accountName: "Horeca Channel", effectiveFrom: "2026-04-01", effectiveTo: "" },
  { id: "p6", code: "PRJ-006", name: "Shohuay", owner: "Niran Boonmee", active: true, updatedAt: "22/04/2569 07:00:00", creationDate: "2026-04-05", accountCode: "5400-002", accountName: "Traditional Trade", effectiveFrom: "2026-04-05", effectiveTo: "" },
  { id: "p7", code: "PRJ-007", name: "Top300", owner: "Suda Jaidee", active: true, updatedAt: "22/04/2569 07:00:00", creationDate: "2026-04-10", accountCode: "5400-003", accountName: "Top300 Accounts", effectiveFrom: "2026-04-10", effectiveTo: "" },
];

export function getProjectById(id: string): ProjectRow | undefined {
  return mockProjects.find((p) => p.id === id);
}
