import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PolicyManagement from "./PolicyManagement";
import PendingInvoiceNotificationPanel from "@/components/admin/PendingInvoiceNotificationPanel";
import PendingApprovalNotificationPanel from "@/components/admin/PendingApprovalNotificationPanel";
import MonthEndReportNotificationPanel from "@/components/admin/MonthEndReportNotificationPanel";
import ExpenseTypePanel from "@/components/admin/ExpenseTypePanel";
import CategoryPolicyRulesPanel from "@/components/admin/CategoryPolicyRulesPanel";
import DocumentTypePanel from "@/components/admin/DocumentTypePanel";
import InviteUserDialog from "@/components/admin/InviteUserDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Users,
  Shield,
  CircleDollarSign,
  GitBranch,
  Gauge,
  Bell,
  Receipt,
  ListChecks,
  Scale,
  UserCheck,
  Mail,
  MailPlus,
  AlertCircle,
  Plug,
  Clock,
  CalendarClock,
  Building2,
  Layers,
  MapPin,
  Search,
  Eye,
  Pencil,
  Ban,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Trash2,
  RotateCcw,
  CheckCircle,
  FileText,
} from "lucide-react";
import EntityDrawer from "@/components/admin/EntityDrawer";
import OcrValidationRulesPanel from "@/components/admin/OcrValidationRulesPanel";
import { CompanyIdentity, mockCompanyIdentities } from "@/components/admin/EntityTypes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- Sidebar menu definition ---
const adminMenu = [
  {
    group: "System Configuration",
    icon: Gauge,
    items: [
      { key: "entities", label: "Entities", icon: Building2 },
      { key: "ocr-validation", label: "OCR Validation Rules", icon: Gauge },
    ],
  },
  {
    group: "User Setup",
    icon: Users,
    items: [
      { key: "employees", label: "Employee Profiles", icon: Users },
      { key: "roles", label: "Roles & Permissions", icon: Shield },
    ],
  },
  {
    group: "Expense Configuration",
    icon: Shield,
    items: [
      { key: "documents", label: "Documents", icon: FileText },
      { key: "expense-type", label: "Expense Type", icon: Layers },
      { key: "mcc-policy", label: "Policy Management", icon: Shield },
    ],
  },
  {
    group: "Notification Setup",
    icon: Bell,
    items: [
      { key: "pending-invoice-email", label: "Pending Invoice Email", icon: Receipt },
      { key: "pending-approval-email", label: "Pending Approval Email", icon: UserCheck },
      { key: "month-end-report-email", label: "Month End Report — HR & Finance", icon: CalendarClock },
    ],
  },
];

// --- Mock data ---
interface MockEmployee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  roles: string[];
  branch: string;
  department: string;
  active: boolean;
}

const initialMockEmployees: MockEmployee[] = [
  { id: "1", employeeCode: "EMP001", name: "Somchai Jaidee", email: "somchai@cpaxtra.co.th", roles: ["Cardholder", "Admin"], branch: "HO", department: "Finance and Accounting", active: true },
  { id: "2", employeeCode: "EMP002", name: "Somying Rakdee", email: "somying@cpaxtra.co.th", roles: ["Approver"], branch: "Bangkok", department: "Marketing", active: true },
  { id: "3", employeeCode: "EMP003", name: "Prawit Munkong", email: "prawit@cpaxtra.co.th", roles: ["Cardholder"], branch: "Chiang Mai", department: "Engineering", active: true },
  { id: "4", employeeCode: "EMP004", name: "Wipa Sukjai", email: "wipa@cpaxtra.co.th", roles: ["Cardholder", "Approver"], branch: "HO", department: "HR", active: false },
  { id: "5", employeeCode: "EMP005", name: "Anan Sodsai", email: "anan@cpaxtra.co.th", roles: ["Cardholder"], branch: "Phuket", department: "Sales", active: true },
];

const roleColors: Record<string, string> = {
  Cardholder: "bg-blue-100 text-blue-800",
  Approver: "bg-purple-100 text-purple-800",
  Admin: "bg-red-100 text-red-800",
};

const mockRoles = [
  { id: "1", name: "Cardholder", permissions: ["Submit Claims", "View Own Claims", "Upload Documents"], userCount: 120 },
  { id: "2", name: "Approver", permissions: ["Approve Claims", "View Team Claims", "Submit Claims"], userCount: 15 },
  { id: "3", name: "Admin", permissions: ["Full Access", "Manage Users", "Manage Roles", "System Config"], userCount: 2 },
];

const mockCostCenters = [
  { code: "CC-100", name: "Sales Operations", dept: "Sales", assignedCount: 30 },
  { code: "CC-200", name: "Marketing Campaigns", dept: "Marketing", assignedCount: 12 },
  { code: "CC-300", name: "R&D", dept: "Engineering", assignedCount: 25 },
  { code: "CC-400", name: "Corporate Finance", dept: "Finance", assignedCount: 8 },
];

const mockApprovalLevels = [
  { level: 1, name: "Direct Manager", condition: "All claims", approver: "Line Manager" },
  { level: 2, name: "Department Head", condition: "Amount > 10,000 THB", approver: "Dept Head" },
  { level: 3, name: "VP Approval", condition: "Amount > 50,000 THB", approver: "VP" },
  { level: 4, name: "CFO Approval", condition: "Amount > 200,000 THB", approver: "CFO" },
];

const mockApprovalLimits = [
  { role: "Manager", minAmount: 0, maxAmount: 10000, currency: "THB" },
  { role: "Dept Head", minAmount: 10001, maxAmount: 50000, currency: "THB" },
  { role: "VP", minAmount: 50001, maxAmount: 200000, currency: "THB" },
  { role: "CFO", minAmount: 200001, maxAmount: 999999, currency: "THB" },
];

const mockNotifications = [
  { key: "claim_submitted", label: "Claim Submitted", desc: "Notify when a new claim is submitted", email: true, system: true },
  { key: "claim_approved", label: "Claim Approved", desc: "Notify when a claim is approved", email: true, system: true },
  { key: "claim_rejected", label: "Claim Rejected", desc: "Notify when a claim is rejected", email: true, system: false },
  { key: "need_info", label: "More Info Requested", desc: "Notify when more information is needed", email: true, system: true },
  { key: "reminder", label: "Pending Reminder", desc: "Remind approvers about pending claims", email: false, system: true },
];

const mockSyncSchedules = [
  { name: "Daily Sync", cron: "0 2 * * *", target: "SAP ERP", lastRun: "2026-02-10 02:00", status: "Success" },
  { name: "Hourly Claims Push", cron: "0 * * * *", target: "Oracle ERP", lastRun: "2026-02-10 14:00", status: "Success" },
  { name: "Weekly Reconciliation", cron: "0 3 * * 0", target: "SAP ERP", lastRun: "2026-02-09 03:00", status: "Failed" },
];

const mockSyncLogs = [
  { time: "2026-02-10 14:00:03", job: "Hourly Claims Push", records: 12, status: "Success", duration: "3.2s" },
  { time: "2026-02-10 02:00:15", job: "Daily Sync", records: 45, status: "Success", duration: "12.1s" },
  { time: "2026-02-09 03:00:08", job: "Weekly Reconciliation", records: 0, status: "Failed", duration: "0.8s" },
  { time: "2026-02-09 14:00:02", job: "Hourly Claims Push", records: 8, status: "Success", duration: "2.5s" },
];

// --- Mock data for Organization Data ---
const mockDepartments = [
  { code: "DEPT-IT", name: "Information Technology", head: "Somsak Wichan", employees: 25 },
  { code: "DEPT-MK", name: "Marketing", head: "Somying Kaewsai", employees: 12 },
  { code: "DEPT-HR", name: "Human Resources", head: "Wipa Sukjai", employees: 8 },
  { code: "DEPT-FN", name: "Finance", head: "Pim Dee", employees: 10 },
  { code: "DEPT-SL", name: "Sales", head: "Somchai Jaidee", employees: 30 },
];

const mockOrgCostCenters = [
  { code: "CC-100", name: "Sales Operations", entity: "CORP-01", department: "Sales", glAccount: "5100-001" },
  { code: "CC-200", name: "Marketing Campaigns", entity: "CORP-01", department: "Marketing", glAccount: "5200-001" },
  { code: "CC-300", name: "R&D", entity: "CORP-01", department: "Engineering", glAccount: "5300-001" },
  { code: "CC-400", name: "Corporate Finance", entity: "CORP-01", department: "Finance", glAccount: "5400-001" },
  { code: "CC-500", name: "Trading Ops", entity: "CORP-02", department: "Operations", glAccount: "5500-001" },
];

const mockBranches = [
  { code: "BRN-BKK", name: "Bangkok (Head Office)", region: "Central", address: "123 Sukhumvit Rd.", status: "Active" },
  { code: "BRN-CNX", name: "Chiang Mai", region: "North", address: "456 Nimman Rd.", status: "Active" },
  { code: "BRN-PKT", name: "Phuket", region: "South", address: "789 Patong Rd.", status: "Active" },
  { code: "BRN-KKN", name: "Khon Kaen", region: "Northeast", address: "321 Mittraphap Rd.", status: "Inactive" },
];

function EntitiesPanel() {
  const [entities, setEntities] = useState<CompanyIdentity[]>(mockCompanyIdentities);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<CompanyIdentity | null>(null);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit" | "create">("view");
  const pageSize = 10;

  const filtered = useMemo(() => {
    let list = entities;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.companyCode.toLowerCase().includes(q) ||
        e.legalNameTh.toLowerCase().includes(q) ||
        e.taxId.includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    return list;
  }, [entities, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getNextCode = () => {
    const nums = entities.map((e) => {
      const m = e.companyCode.match(/CORP-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    });
    const next = Math.max(0, ...nums) + 1;
    return `CORP-${String(next).padStart(2, "0")}`;
  };

  const openDrawer = (entity: CompanyIdentity | null, mode: "view" | "edit" | "create") => {
    setSelectedEntity(entity);
    setDrawerMode(mode);
    setDrawerOpen(true);
  };

  const handleSave = (entity: CompanyIdentity) => {
    setEntities((prev) => {
      const idx = prev.findIndex((e) => e.id === entity.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = entity;
        return next;
      }
      return [...prev, entity];
    });
  };

  const handleDeactivate = (id: string) => {
    setEntities((prev) => prev.map((e) => e.id === id ? { ...e, status: e.status === "Active" ? "Inactive" as const : "Active" as const, lastUpdated: new Date().toISOString().split("T")[0] } : e));
  };

  const existingTaxIds = entities.map((e) => e.taxId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Entities</h2>
        <Button size="sm" onClick={() => openDrawer(null, "create")}>
          <Plus className="h-4 w-4 mr-2" /> Add Company Identity
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by Code, Name, Tax ID..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Code</TableHead>
                <TableHead>Legal Entity Name (TH)</TableHead>
                <TableHead>Tax ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No entities found</TableCell></TableRow>
              )}
              {pageData.map((e) => (
                <TableRow key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDrawer(e, "view")}>
                  <TableCell className="font-medium">{e.companyCode}</TableCell>
                  <TableCell>{e.legalNameTh}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{e.taxId}</code></TableCell>
                  <TableCell>
                    <Badge className={e.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                      {e.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDrawer(e, "view")} title="View">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDrawer(e, "edit")} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeactivate(e.id)} title={e.status === "Active" ? "Deactivate" : "Activate"}>
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">{page} / {totalPages}</span>
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entity={selectedEntity}
        mode={drawerMode}
        onSave={handleSave}
        existingTaxIds={existingTaxIds}
        nextCode={getNextCode()}
      />
    </div>
  );
}
function DepartmentsPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Departments</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Department</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead>Department Head</TableHead>
                <TableHead>Employees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDepartments.map((d) => (
                <TableRow key={d.code} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{d.code}</TableCell>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>{d.head}</TableCell>
                  <TableCell><Badge variant="secondary">{d.employees}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function OrgCostCentersPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cost Centers</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Cost Center</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>GL Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrgCostCenters.map((c) => (
                <TableRow key={c.code} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell><Badge variant="outline">{c.entity}</Badge></TableCell>
                  <TableCell>{c.department}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.glAccount}</code></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function BranchesPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Branches</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Branch</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Branch Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBranches.map((b) => (
                <TableRow key={b.code} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{b.code}</TableCell>
                  <TableCell>{b.name}</TableCell>
                  <TableCell>{b.region}</TableCell>
                  <TableCell className="text-sm">{b.address}</TableCell>
                  <TableCell>
                    <Badge className={b.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                      {b.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Content panels ---
function EmployeesPanel() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<MockEmployee[]>(initialMockEmployees);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = useMemo(() => {
    let list = employees;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
      );
    }
    if (activeFilter === "active") list = list.filter((e) => e.active);
    if (activeFilter === "inactive") list = list.filter((e) => !e.active);
    return list;
  }, [employees, debouncedSearch, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Stat cards
  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.active).length;
  const approverCount = employees.filter((e) => e.roles.includes("Approver")).length;
  const adminCount = employees.filter((e) => e.roles.includes("Admin")).length;
  const cardholderCount = employees.filter((e) => e.roles.includes("Cardholder")).length;

  const handleDelete = (emp: MockEmployee) => {
    if (window.confirm(`Delete employee "${emp.name}"?`)) {
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
    }
  };

  const handleToggleActive = (id: string, checked: boolean) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, active: checked } : e)));
  };

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: totalCount, color: "text-foreground" },
          { label: "Active", value: activeCount, color: "text-green-600" },
          { label: "Approvers", value: approverCount, color: "text-purple-600" },
          { label: "Admins", value: adminCount, color: "text-red-600" },
          { label: "Cardholders", value: cardholderCount, color: "text-blue-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header / Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Employee Profiles</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setInviteOpen(true)}>
            <MailPlus className="h-4 w-4 mr-2" />Invite User
          </Button>
          <Button size="sm" onClick={() => navigate("/admin/employee/create")}>
            <Plus className="h-4 w-4 mr-2" />Add Employee
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, code, email..."
            className="pl-9"
          />
        </div>
        <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {(search || activeFilter !== "all") && (
          <Button size="sm" variant="ghost" onClick={() => { setSearch(""); setActiveFilter("all"); setPage(1); }}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />Reset
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee Code</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No employees found</TableCell>
                </TableRow>
              ) : (
                pageData.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{emp.employeeCode}</TableCell>
                    <TableCell className="text-sm">{emp.email}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.branch}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {emp.roles.map((r) => (
                          <Badge key={r} className={`text-xs ${roleColors[r] ?? ""}`}>{r}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch checked={emp.active} onCheckedChange={(checked) => handleToggleActive(emp.id, checked)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate(`/admin/employee/${emp.id}?mode=view`)} title="View">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate(`/admin/employee/${emp.id}/edit`)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(emp)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">{page} / {totalPages}</span>
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <InviteUserDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}

function RolesPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Roles & Permissions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockRoles.map((r) => (
          <Card key={r.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{r.name}</CardTitle>
                <Badge variant="secondary">{r.userCount} users</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {r.permissions.map((p) => (
                  <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CostCentersPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cost Center Assignments</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Cost Center</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Assigned Employees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCostCenters.map((cc) => (
                <TableRow key={cc.code} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{cc.code}</TableCell>
                  <TableCell>{cc.name}</TableCell>
                  <TableCell>{cc.dept}</TableCell>
                  <TableCell><Badge variant="secondary">{cc.assignedCount}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ApprovalLevelsPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Approval Levels</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Level</Button>
      </div>
      <div className="space-y-3">
        {mockApprovalLevels.map((lvl, i) => (
          <Card key={lvl.level} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                {lvl.level}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{lvl.name}</p>
                <p className="text-sm text-muted-foreground">{lvl.condition}</p>
              </div>
              <Badge variant="outline">{lvl.approver}</Badge>
              {i < mockApprovalLevels.length - 1 && (
                <div className="hidden md:block text-muted-foreground">→</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ApprovalLimitsPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Approval Limits</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Limit</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Approver Role</TableHead>
                <TableHead>Min Amount</TableHead>
                <TableHead>Max Amount</TableHead>
                <TableHead>Currency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockApprovalLimits.map((l) => (
                <TableRow key={l.role}>
                  <TableCell className="font-medium">{l.role}</TableCell>
                  <TableCell>{l.minAmount.toLocaleString()}</TableCell>
                  <TableCell>{l.maxAmount.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{l.currency}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function EmailNotificationsPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Email Notifications</h2>
      <Card>
        <CardContent className="p-4 space-y-4">
          {mockNotifications.map((n) => (
            <div key={n.key} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch defaultChecked={n.email} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SystemAlertsPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">System Alerts</h2>
      <Card>
        <CardContent className="p-4 space-y-4">
          {mockNotifications.map((n) => (
            <div key={n.key} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch defaultChecked={n.system} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ErpSyncPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">ERP Sync Schedule</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Schedule</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>Cron Expression</TableHead>
                <TableHead>Target System</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSyncSchedules.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{s.cron}</code></TableCell>
                  <TableCell>{s.target}</TableCell>
                  <TableCell className="text-sm">{s.lastRun}</TableCell>
                  <TableCell>
                    <Badge className={s.status === "Success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {s.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SyncLogsPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Sync Logs</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSyncLogs.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{l.time}</TableCell>
                  <TableCell className="font-medium">{l.job}</TableCell>
                  <TableCell>{l.records}</TableCell>
                  <TableCell>{l.duration}</TableCell>
                  <TableCell>
                    <Badge className={l.status === "Success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {l.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Expense panels ---
const mockExpenseTypes = [
  { code: "TRV", name: "Travel", description: "Business travel expenses", status: "Active" },
  { code: "MEL", name: "Meals", description: "Business meals & entertainment", status: "Active" },
  { code: "OFS", name: "Office Supplies", description: "Office supplies & stationery", status: "Active" },
  { code: "TRN", name: "Transportation", description: "Local transportation", status: "Active" },
  { code: "TRG", name: "Training", description: "Training & development", status: "Inactive" },
];

const mockExpenseItems = [
  { code: "TRV-001", name: "Airfare", type: "Travel", glAccount: "6100-001", limit: 50000 },
  { code: "TRV-002", name: "Hotel", type: "Travel", glAccount: "6100-002", limit: 5000 },
  { code: "MEL-001", name: "Client Lunch", type: "Meals", glAccount: "6200-001", limit: 3000 },
  { code: "OFS-001", name: "Stationery", type: "Office Supplies", glAccount: "6300-001", limit: 2000 },
];

const mockExpenseRules = [
  { name: "Receipt Required", condition: "Amount > 500 THB", action: "Require receipt attachment", status: "Active" },
  { name: "Daily Meal Limit", condition: "Expense Type = Meals", action: "Max 1,500 THB per day", status: "Active" },
  { name: "Travel Pre-Approval", condition: "Amount > 20,000 THB", action: "Require pre-approval", status: "Active" },
];

const mockExpenseDelegates = [
  { delegator: "Somying Kaewsai", delegate: "Somchai Jaidee", startDate: "2026-02-01", endDate: "2026-02-28", status: "Active" },
  { delegator: "Thana Pitak", delegate: "Pim Dee", startDate: "2026-03-01", endDate: "2026-03-15", status: "Scheduled" },
];

// ExpenseTypePanel is now imported from @/components/admin/ExpenseTypePanel

function ExpenseItemPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Expense Item</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Item</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Expense Type</TableHead>
                <TableHead>GL Account</TableHead>
                <TableHead>Limit (THB)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockExpenseItems.map((e) => (
                <TableRow key={e.code} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{e.code}</TableCell>
                  <TableCell>{e.name}</TableCell>
                  <TableCell><Badge variant="outline">{e.type}</Badge></TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{e.glAccount}</code></TableCell>
                  <TableCell>{e.limit.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpenseRulesPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Expense Rules</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Rule</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockExpenseRules.map((r) => (
                <TableRow key={r.name} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-sm">{r.condition}</TableCell>
                  <TableCell className="text-sm">{r.action}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">{r.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpenseDelegatesPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Expense Delegates</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Delegate</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Delegator</TableHead>
                <TableHead>Delegate</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockExpenseDelegates.map((d, i) => (
                <TableRow key={i} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{d.delegator}</TableCell>
                  <TableCell>{d.delegate}</TableCell>
                  <TableCell className="text-sm">{d.startDate}</TableCell>
                  <TableCell className="text-sm">{d.endDate}</TableCell>
                  <TableCell>
                    <Badge className={d.status === "Active" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                      {d.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const panelMap: Record<string, () => JSX.Element> = {
  entities: EntitiesPanel,
  departments: DepartmentsPanel,
  "org-costcenters": OrgCostCentersPanel,
  branches: BranchesPanel,
  employees: EmployeesPanel,
  roles: RolesPanel,
  costcenters: CostCentersPanel,
  "approval-levels": ApprovalLevelsPanel,
  "approval-limits": ApprovalLimitsPanel,
  "documents": DocumentTypePanel,
  "expense-type": ExpenseTypePanel,
  "expense-item": ExpenseItemPanel,
  "expense-rules": ExpenseRulesPanel,
  "expense-delegates": ExpenseDelegatesPanel,
  "email-notifications": EmailNotificationsPanel,
  "pending-invoice-email": PendingInvoiceNotificationPanel,
  "pending-approval-email": PendingApprovalNotificationPanel,
  "month-end-report-email": MonthEndReportNotificationPanel,
  "system-alerts": SystemAlertsPanel,
  "erp-sync": ErpSyncPanel,
  "sync-logs": SyncLogsPanel,
  "mcc-policy": PolicyManagement,
  "ocr-validation": OcrValidationRulesPanel,
  "category-policy": CategoryPolicyRulesPanel,
};

export default function Admin() {
  const [searchParams] = useSearchParams();
  const [activeKey, setActiveKey] = useState(() => searchParams.get("tab") || "employees");
  const ActivePanel = panelMap[activeKey] || (() => <div className="p-8 text-muted-foreground">Panel not found</div>);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground text-sm">Manage users, workflows, notifications, and integrations</p>
      </div>

      <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
        {/* Sidebar */}
        <nav className="w-64 shrink-0 space-y-5">
          {adminMenu.map((group) => (
            <div key={group.group}>
              <div className="flex items-center gap-2 mb-2 px-2">
                <group.icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.group}
                </span>
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveKey(item.key)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left",
                      activeKey === item.key
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <ActivePanel />
        </div>
      </div>
    </div>
  );
}
