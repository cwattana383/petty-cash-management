import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import PolicyManagement from "./PolicyManagement";
import PendingInvoiceNotificationPanel from "@/components/admin/PendingInvoiceNotificationPanel";
import PendingApprovalNotificationPanel from "@/components/admin/PendingApprovalNotificationPanel";
import RequestForInfoNotificationPanel from "@/components/admin/RequestForInfoNotificationPanel";
import DocumentAgingNotificationPanel from "@/components/admin/DocumentAgingNotificationPanel";
import MonthEndReportNotificationPanel from "@/components/admin/MonthEndReportNotificationPanel";
import MonthlyCardholderSummaryPanel from "@/components/admin/MonthlyCardholderSummaryPanel";
import MonthlyApproverSummaryPanel from "@/components/admin/MonthlyApproverSummaryPanel";
import ExpenseTypePanelImported from "@/components/admin/ExpenseTypePanel";
import OcrValidationRulesPanel from "@/components/admin/OcrValidationRulesPanel";
import DocumentTypePanel from "@/components/admin/DocumentTypePanel";
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
  UserCheck,
  Mail,
  AlertCircle,
  AlertTriangle,
  Plug,
  Clock,
  CalendarClock,
  Building2,
  Layers,
  FileText,
  MapPin,
  Search,
  Eye,
  Pencil,
  Trash2,
  Ban,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  MailPlus,
  Upload,
  Download,
  Loader2 as Loader2Icon,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import EntityDrawer from "@/components/admin/EntityDrawer";
import InviteUserDialog from "@/components/admin/InviteUserDialog";
import { CompanyIdentity } from "@/components/admin/EntityTypes";
import { useEntities, useCreateEntity, useUpdateEntity, useToggleEntityStatus, useBulkEntityAction } from "@/hooks/use-entities";
import { useEmployees, useDeleteEmployee, useToggleEmployeeActive, useAllEmployeesForImport, useImportEmployees, checkEntraBatch, useBulkEmployeeAction, type ImportEmployeeRow } from "@/hooks/use-employees";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import BulkActionBar from "@/components/common/BulkActionBar";
import BulkConfirmDialog from "@/components/common/BulkConfirmDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useRolesOverview } from "@/hooks/use-roles";
import { toast } from "@/hooks/use-toast";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
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
      { key: "monthly-cardholder-summary", label: "Monthly Cardholder Summary", icon: Mail },
      { key: "monthly-approver-summary", label: "Monthly Approver Summary", icon: MailPlus },
      { key: "pending-approval-email", label: "Pending Approval Email", icon: UserCheck },
      { key: "request-for-info-email", label: "Request for Info Email", icon: AlertCircle },
      { key: "document-aging-email", label: "Document Aging — Auto Reject", icon: AlertTriangle },
    ],
  },
];

// --- Mock data ---

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
  { code: "DEPT-IT", name: "Information Technology", head: "สมศักดิ์ วิชาญ", employees: 25 },
  { code: "DEPT-MK", name: "Marketing", head: "สมหญิง แก้วใส", employees: 12 },
  { code: "DEPT-HR", name: "Human Resources", head: "วิภา สุขใจ", employees: 8 },
  { code: "DEPT-FN", name: "Finance", head: "พิมพ์ ดี", employees: 10 },
  { code: "DEPT-SL", name: "Sales", head: "สมชาย ใจดี", employees: 30 },
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<CompanyIdentity | null>(null);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit" | "create">("view");
  const pageSize = 10;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = {
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? (statusFilter === "Active" ? "ACTIVE" : "INACTIVE") : undefined,
    page,
    limit: pageSize,
  };

  const { data, isLoading } = useEntities(queryParams);
  const createEntity = useCreateEntity();
  const updateEntity = useUpdateEntity();
  const toggleStatus = useToggleEntityStatus();
  const entityBulkMutation = useBulkEntityAction();

  const pageData = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: pageSize, totalPages: 1 };
  const entityBulk = useBulkSelection({ items: pageData, totalCount: meta.total });
  const [entityBulkConfirm, setEntityBulkConfirm] = useState<"delete" | "activate" | "deactivate" | null>(null);

  const executeEntityBulkAction = () => {
    if (!entityBulkConfirm) return;
    const payload = entityBulk.selectAllPages
      ? { action: entityBulkConfirm, selectAll: true, filters: { ...(debouncedSearch ? { search: debouncedSearch } : {}), ...(statusFilter !== "all" ? { status: statusFilter === "Active" ? "ACTIVE" : "INACTIVE" } : {}) } }
      : { action: entityBulkConfirm, ids: [...entityBulk.selectedIds] };
    entityBulkMutation.mutate(payload, {
      onSuccess: (res: unknown) => {
        const { affected } = res as { affected: number };
        toast({ title: "Success", description: `${affected} entit${affected === 1 ? "y" : "ies"} ${entityBulkConfirm === "delete" ? "deleted" : entityBulkConfirm === "activate" ? "activated" : "deactivated"}.` });
        entityBulk.clearSelection();
        setEntityBulkConfirm(null);
      },
      onError: (err: unknown) => {
        toast({ title: "Error", description: err instanceof Error ? err.message : "Bulk action failed.", variant: "destructive" });
        setEntityBulkConfirm(null);
      },
    });
  };
  const totalPages = Math.max(1, meta.totalPages);

  const openDrawer = (entity: CompanyIdentity | null, mode: "view" | "edit" | "create") => {
    setSelectedEntity(entity);
    setDrawerMode(mode);
    setDrawerOpen(true);
  };

  const handleSave = useCallback(async (entity: CompanyIdentity) => {
    if (drawerMode === "create") {
      await createEntity.mutateAsync(entity);
      toast({ title: "Created", description: `Entity ${entity.companyCode} created successfully.` });
    } else {
      await updateEntity.mutateAsync({ id: entity.id, entity });
      toast({ title: "Updated", description: `Entity ${entity.companyCode} updated successfully.` });
    }
  }, [drawerMode, createEntity, updateEntity]);

  const handleDeactivate = (id: string, currentStatus: "Active" | "Inactive") => {
    toggleStatus.mutate(
      { id, currentStatus },
      {
        onSuccess: () => {
          toast({ title: "Status Updated", description: `Entity ${currentStatus === "Active" ? "deactivated" : "activated"} successfully.` });
        },
      },
    );
  };

  const getPrimaryTaxId = (e: CompanyIdentity) => e.taxIds.find((t) => t.isPrimary)?.taxId || e.taxIds[0]?.taxId || "-";
  const getPrimaryBranchType = (e: CompanyIdentity) => {
    const primary = e.taxIds.find((t) => t.isPrimary) || e.taxIds[0];
    return primary?.branchType || "-";
  };

  const isSaving = createEntity.isPending || updateEntity.isPending;
  const hasActiveFilters = search !== "" || statusFilter !== "all";
  const resetFilters = () => { setSearch(""); setDebouncedSearch(""); setStatusFilter("all"); setPage(1); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Entities</h2>
        <Button size="sm" onClick={() => openDrawer(null, "create")}>
          <Plus className="h-4 w-4 mr-2" /> Add Company Identity
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        {hasActiveFilters && (
          <Button size="sm" variant="ghost" onClick={resetFilters} className="text-muted-foreground">
            <RotateCcw className="mr-1 h-3.5 w-3.5" />Reset
          </Button>
        )}
      </div>

      {entityBulk.hasSelection && (
        <BulkActionBar selectedCount={entityBulk.selectionCount} totalCount={meta.total} selectAllPages={entityBulk.selectAllPages} isAllOnPageSelected={entityBulk.isAllOnPageSelected} onSelectAllPages={entityBulk.selectAllAcrossPages} onDelete={() => setEntityBulkConfirm("delete")} onActivate={() => setEntityBulkConfirm("activate")} onDeactivate={() => setEntityBulkConfirm("deactivate")} onClear={entityBulk.clearSelection} isProcessing={entityBulkMutation.isPending} />
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={entityBulk.isAllOnPageSelected ? true : entityBulk.isIndeterminate ? "indeterminate" : false} onCheckedChange={entityBulk.toggleAllOnPage} />
                </TableHead>
                <TableHead>Company Code</TableHead>
                <TableHead>Legal Entity Name (TH)</TableHead>
                <TableHead>Primary Tax ID</TableHead>
                <TableHead>Branch Type</TableHead>
                <TableHead>Effective Start</TableHead>
                <TableHead>Effective End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              )}
              {!isLoading && pageData.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No entities found</TableCell></TableRow>
              )}
              {pageData.map((e) => (
                <TableRow key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDrawer(e, "view")}>
                  <TableCell onClick={(ev) => ev.stopPropagation()}>
                    <Checkbox checked={entityBulk.selectAllPages || entityBulk.selectedIds.has(e.id)} onCheckedChange={() => entityBulk.toggleOne(e.id)} />
                  </TableCell>
                  <TableCell className="font-medium">{e.companyCode}</TableCell>
                  <TableCell>{e.legalNameTh}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{getPrimaryTaxId(e)}</code></TableCell>
                  <TableCell><Badge variant="outline">{getPrimaryBranchType(e)}</Badge></TableCell>
                  <TableCell className="text-sm">{e.effectiveStartDate}</TableCell>
                  <TableCell className="text-sm">{e.effectiveEndDate || "-"}</TableCell>
                  <TableCell>
                    <Badge className={e.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                      {e.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{e.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDrawer(e, "view")} title="View">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDrawer(e, "edit")} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeactivate(e.id, e.status)} title={e.status === "Active" ? "Deactivate" : "Activate"}>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}

      <EntityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entity={selectedEntity}
        mode={drawerMode}
        onSave={handleSave}
        existingCodes={pageData.map((e) => e.companyCode.toUpperCase())}
        existingTaxIds={pageData.flatMap((e) => e.taxIds.map((t) => t.taxId))}
        isSaving={isSaving}
      />
      <BulkConfirmDialog open={!!entityBulkConfirm} action={entityBulkConfirm} count={entityBulk.selectionCount} resourceName="entit(ies)" onConfirm={executeEntityBulkAction} onCancel={() => setEntityBulkConfirm(null)} isProcessing={entityBulkMutation.isPending} />
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
  const { data: roles } = useRolesOverview();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [inviteOpen, setInviteOpen] = useState(false);

  // CSV Import
  const [importOpen, setImportOpen] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportEmployees();
  const { data: allEmployeesForImport } = useAllEmployeesForImport({ enabled: importOpen });
  const [csvPreview, setCsvPreview] = useState<(ImportEmployeeRow & { _displayName: string })[]>([]);
  const [csvIssues, setCsvIssues] = useState<Map<number, string>>(new Map());

  const VALID_ROLES = new Set(["admin", "approver", "cardholder"]);

  const parseCsvLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { current += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ",") { fields.push(current.trim()); current = ""; }
        else { current += ch; }
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const downloadImportTemplate = () => {
    const csv = "\uFEFFEmployee_Code,First_Name,Last_Name,Email,Telephone,Branch_Head_Office,Division,Department,Branch,Role,Active,Credit_Card_Last4,Cardholder_Name\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try { const a = document.createElement("a"); a.href = url; a.download = "employee_import_template.csv"; a.click(); }
    finally { URL.revokeObjectURL(url); }
  };

  const downloadImportSample = () => {
    const csv = "\uFEFFEmployee_Code,First_Name,Last_Name,Email,Telephone,Branch_Head_Office,Division,Department,Branch,Role,Active,Credit_Card_Last4,Cardholder_Name\n" +
      "EMP001,John,Doe,john.doe@cpaxtra.co.th,0812345678,Head Office,IT,Technology,Head Office,Admin,Yes,,\n" +
      "EMP002,Jane,Smith,jane.smith@cpaxtra.co.th,0898765432,Store,Operations,Finance,Branch A,Approver,Yes,,\n" +
      "EMP003,Bob,Wilson,bob.wilson@cpaxtra.co.th,,Head Office,,Marketing,Head Office,Cardholder,Yes,1234,Bob Wilson\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try { const a = document.createElement("a"); a.href = url; a.download = "employee_import_sample.csv"; a.click(); }
    finally { URL.revokeObjectURL(url); }
  };

  const [entraNotFound, setEntraNotFound] = useState<Set<string>>(new Set());
  const [entraChecking, setEntraChecking] = useState(false);

  const checkCsvIssues = (rows: (ImportEmployeeRow & { _displayName: string })[], entraNotFoundSet?: Set<string>) => {
    const issues = new Map<number, string>();
    const seenEmails = new Set<string>();
    const seenCodes = new Set<string>();
    const existingEmails = new Set((allEmployeesForImport ?? []).map((e) => e.email?.toLowerCase()));
    const existingCodes = new Set((allEmployeesForImport ?? []).map((e) => e.employeeCode));
    const notInEntra = entraNotFoundSet ?? entraNotFound;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const emailLower = r.email?.toLowerCase();
      // Within-CSV duplicates
      if (seenCodes.has(r.employeeCode)) { issues.set(i, `Duplicate Employee_Code "${r.employeeCode}" in CSV`); seenCodes.add(r.employeeCode); seenEmails.add(emailLower); continue; }
      if (seenEmails.has(emailLower)) { issues.set(i, `Duplicate Email "${r.email}" in CSV`); seenCodes.add(r.employeeCode); seenEmails.add(emailLower); continue; }
      seenCodes.add(r.employeeCode);
      seenEmails.add(emailLower);
      // Against DB
      if (existingCodes.has(r.employeeCode)) { issues.set(i, `Employee_Code "${r.employeeCode}" already exists in DB`); continue; }
      if (existingEmails.has(emailLower)) { issues.set(i, `Email "${r.email}" already exists in DB`); continue; }
      // Email domain
      if (r.email && !r.email.toLowerCase().endsWith("@cpaxtra.co.th")) { issues.set(i, `Email "${r.email}" must use @cpaxtra.co.th domain`); continue; }
      // Entra check
      if (notInEntra.has(emailLower)) { issues.set(i, `User "${r.email}" not found in Azure (Entra ID). Must exist before import.`); continue; }
      // Role (supports comma-separated: "Admin,Approver")
      const roleNames = r.role.split(",").map((rn) => rn.trim().toLowerCase()).filter(Boolean);
      const invalidRoles = roleNames.filter((rn) => !VALID_ROLES.has(rn));
      if (invalidRoles.length > 0) { issues.set(i, `Invalid Role "${invalidRoles.join(", ")}"`); continue; }
      // Cardholder conditional
      if (roleNames.includes("cardholder") && (!r.creditCardLast4 || !r.cardHolderName)) { issues.set(i, "Credit_Card_Last4 and Cardholder_Name required for Cardholder"); continue; }
    }
    return issues;
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Invalid File", description: "Only CSV files are allowed.", variant: "destructive" });
      if (importFileRef.current) importFileRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer;
      let text: string;
      try { text = new TextDecoder("utf-8", { fatal: true }).decode(buffer); }
      catch { text = new TextDecoder("windows-874").decode(buffer); }
      text = text.replace(/^\uFEFF/, "");

      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast({ title: "Empty CSV", description: "CSV has no data rows.", variant: "destructive" });
        if (importFileRef.current) importFileRef.current.value = "";
        return;
      }

      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/ /g, "_"));
      const required = ["employee_code", "first_name", "last_name", "email", "telephone", "branch_head_office", "division", "department", "branch", "role", "active", "credit_card_last4", "cardholder_name"];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) {
        toast({ title: "Invalid Headers", description: `Missing columns: ${missing.join(", ")}`, variant: "destructive" });
        if (importFileRef.current) importFileRef.current.value = "";
        return;
      }

      const idx = Object.fromEntries(required.map((h) => [h, headers.indexOf(h)]));

      const rowErrors: string[] = [];
      const rows: (ImportEmployeeRow & { _displayName: string })[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        const employeeCode = cols[idx.employee_code] ?? "";
        const firstName = cols[idx.first_name] ?? "";
        const lastName = cols[idx.last_name] ?? "";
        const email = cols[idx.email] ?? "";
        const department = cols[idx.department] ?? "";
        const branch = cols[idx.branch] ?? "";
        const role = cols[idx.role] ?? "";
        const activeStr = cols[idx.active] ?? "";

        if (!employeeCode) rowErrors.push(`Row ${i + 1}: Employee_Code is required`);
        if (!firstName) rowErrors.push(`Row ${i + 1}: First_Name is required`);
        if (!lastName) rowErrors.push(`Row ${i + 1}: Last_Name is required`);
        if (!email) rowErrors.push(`Row ${i + 1}: Email is required`);
        if (!department) rowErrors.push(`Row ${i + 1}: Department is required`);
        if (!branch) rowErrors.push(`Row ${i + 1}: Branch is required`);
        if (!role) rowErrors.push(`Row ${i + 1}: Role is required`);
        if (!activeStr) rowErrors.push(`Row ${i + 1}: Active is required`);

        const active = activeStr.toLowerCase() === "yes" || activeStr.toLowerCase() === "true";

        rows.push({
          employeeCode,
          firstName,
          lastName,
          email,
          telephone: cols[idx.telephone] || undefined,
          branchHeadOffice: cols[idx.branch_head_office] || undefined,
          division: cols[idx.division] || undefined,
          department,
          branch,
          role,
          active,
          creditCardLast4: cols[idx.credit_card_last4] || undefined,
          cardHolderName: cols[idx.cardholder_name] || undefined,
          _displayName: `${firstName} ${lastName}`.trim(),
        });
      }

      if (rowErrors.length > 0) {
        toast({ title: "Validation Errors", description: rowErrors.slice(0, 5).join("\n") + (rowErrors.length > 5 ? `\n...and ${rowErrors.length - 5} more` : ""), variant: "destructive" });
        if (importFileRef.current) importFileRef.current.value = "";
        return;
      }

      setCsvPreview(rows);
      setCsvIssues(checkCsvIssues(rows));

      // Check Entra in background — update issues once result arrives
      const emails = rows.map((r) => r.email).filter(Boolean);
      if (emails.length > 0) {
        setEntraChecking(true);
        checkEntraBatch(emails)
          .then((result) => {
            const notFoundSet = new Set(result.notFound.map((e) => e.toLowerCase()));
            setEntraNotFound(notFoundSet);
            setCsvIssues(checkCsvIssues(rows, notFoundSet));
          })
          .catch(() => {
            // If Entra check fails, don't block — just skip Entra validation
          })
          .finally(() => setEntraChecking(false));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const removeCsvRow = (index: number) => {
    const updated = csvPreview.filter((_, i) => i !== index);
    setCsvPreview(updated);
    setCsvIssues(checkCsvIssues(updated));
  };

  const confirmImport = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const payload = csvPreview.map(({ _displayName, ...rest }) => rest);
    importMutation.mutate(payload, {
      onSuccess: (res: unknown) => {
        const result = res as { imported: number; entraWarnings: string[] };
        toast({ title: "Imported", description: `${result.imported} employees imported successfully.` });

        if (result.entraWarnings?.length > 0) {
          toast({
            title: `Entra Warning (${result.entraWarnings.length})`,
            description: result.entraWarnings.slice(0, 5).join("\n") + (result.entraWarnings.length > 5 ? `\n...and ${result.entraWarnings.length - 5} more` : ""),
            variant: "destructive",
          });
        }

        setCsvPreview([]);
        setCsvIssues(new Map());
        setImportOpen(false);
        if (importFileRef.current) importFileRef.current.value = "";
      },
      onError: (err: unknown) => {
        const details = (err as Error & { details?: string[] })?.details;
        const msg = details?.length ? details.slice(0, 10).join("\n") + (details.length > 10 ? `\n...and ${details.length - 10} more` : "") : (err instanceof Error ? err.message : "Failed to import employees.");
        toast({ title: "Import Error", description: msg, variant: "destructive" });
      },
    });
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = {
    search: debouncedSearch || undefined,
    active: activeFilter !== "all" ? activeFilter : undefined,
    page,
    limit: pageSize,
  };

  const { data, isLoading } = useEmployees(queryParams);
  const deleteEmployee = useDeleteEmployee();
  const toggleActive = useToggleEmployeeActive();
  const empBulkMutation = useBulkEmployeeAction();

  const pageData = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: pageSize, totalPages: 1 };
  const totalPages = Math.max(1, meta.totalPages);
  const empBulk = useBulkSelection({ items: pageData, totalCount: meta.total });
  const [empBulkConfirm, setEmpBulkConfirm] = useState<"delete" | "activate" | "deactivate" | null>(null);

  const executeEmpBulkAction = () => {
    if (!empBulkConfirm) return;
    const payload = empBulk.selectAllPages
      ? { action: empBulkConfirm, selectAll: true, filters: { ...(debouncedSearch ? { search: debouncedSearch } : {}), ...(activeFilter !== "all" ? { active: activeFilter === "active" ? "true" : "false" } : {}) } }
      : { action: empBulkConfirm, ids: [...empBulk.selectedIds] };
    empBulkMutation.mutate(payload, {
      onSuccess: (res: unknown) => {
        const { affected } = res as { affected: number };
        toast({ title: "Success", description: `${affected} employee(s) ${empBulkConfirm === "delete" ? "deleted" : empBulkConfirm === "activate" ? "activated" : "deactivated"}.` });
        empBulk.clearSelection();
        setEmpBulkConfirm(null);
      },
      onError: (err: unknown) => {
        toast({ title: "Error", description: err instanceof Error ? err.message : "Bulk action failed.", variant: "destructive" });
        setEmpBulkConfirm(null);
      },
    });
  };

  const hasActiveFilters = search !== "" || activeFilter !== "all";
  const resetFilters = () => { setSearch(""); setDebouncedSearch(""); setActiveFilter("all"); setPage(1); };

  const handleDelete = (userId: string, name: string) => {
    if (!window.confirm(`คุณต้องการลบพนักงาน "${name}" ใช่หรือไม่?`)) return;
    deleteEmployee.mutate(userId, {
      onSuccess: () => toast({ title: `ลบพนักงาน ${name} สำเร็จ` }),
      onError: (err: Error) => toast({ title: "เกิดข้อผิดพลาด", description: err?.message || "Failed to delete employee", variant: "destructive" }),
    });
  };

  // Compute stat card values from actual data
  const totalUsers = meta.total;
  const activeUsers = pageData.filter((u) => u.active !== false).length;
  const getRoleCount = (roleName: string) =>
    (roles ?? []).find((r) => r.name?.toLowerCase() === roleName.toLowerCase())?.userCount ?? 0;

  const statCards = [
    { label: "Total Employees", value: totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Employees", value: activeUsers, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Approvers", value: getRoleCount("Approver"), icon: UserCheck, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Admins", value: getRoleCount("Admin"), icon: Shield, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Cardholders", value: getRoleCount("Cardholder"), icon: CircleDollarSign, color: "text-pink-600", bg: "bg-pink-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Employee Profiles</h2>
          <p className="text-sm text-muted-foreground">Manage employee accounts, roles, and access permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => { setCsvPreview([]); setCsvIssues(new Map()); setImportOpen(true); }}>
            <Upload className="h-4 w-4 mr-2" />Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
            <MailPlus className="h-4 w-4 mr-2" />Invite User
          </Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => navigate("/admin/employee/create")}>
            <Plus className="h-4 w-4 mr-2" />Add Employee
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn("p-2.5 rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Employee Code, Email, Department..."
            className="pl-9"
          />
        </div>
        <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button size="sm" variant="ghost" onClick={resetFilters} className="text-muted-foreground">
            <RotateCcw className="mr-1 h-3.5 w-3.5" />Reset
          </Button>
        )}
      </div>

      {empBulk.hasSelection && (
        <BulkActionBar selectedCount={empBulk.selectionCount} totalCount={meta.total} selectAllPages={empBulk.selectAllPages} isAllOnPageSelected={empBulk.isAllOnPageSelected} onSelectAllPages={empBulk.selectAllAcrossPages} onDelete={() => setEmpBulkConfirm("delete")} onActivate={() => setEmpBulkConfirm("activate")} onDeactivate={() => setEmpBulkConfirm("deactivate")} onClear={empBulk.clearSelection} isProcessing={empBulkMutation.isPending} />
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={empBulk.isAllOnPageSelected ? true : empBulk.isIndeterminate ? "indeterminate" : false} onCheckedChange={empBulk.toggleAllOnPage} />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Employee Code</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              )}
              {!isLoading && pageData.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No employees found</TableCell></TableRow>
              )}
              {pageData.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox checked={empBulk.selectAllPages || empBulk.selectedIds.has(u.id)} onCheckedChange={() => empBulk.toggleOne(u.id)} />
                  </TableCell>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.employeeCode}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>{u.department}</TableCell>
                  <TableCell>{u.branch}</TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{(u.roles ?? []).map((r) => {
                        const roleColors: Record<string, string> = {
                          Cardholder: "bg-blue-100 text-blue-800",
                          Approver: "bg-purple-100 text-purple-800",
                          Admin: "bg-red-100 text-red-800",
                        };
                        return <Badge key={r} className={roleColors[r] ?? "bg-gray-100 text-gray-800"}>{r}</Badge>;
                      })}</div></TableCell>
                  <TableCell>
                    <Switch
                      checked={u.active !== false}
                      disabled={toggleActive.isPending}
                      onCheckedChange={(checked) =>
                        toggleActive.mutate(
                          { id: u.id, active: checked },
                          {
                            onSuccess: () => toast({ title: `${u.name} ${checked ? "activated" : "deactivated"}` }),
                            onError: (err: Error) => toast({ title: "Error", description: err?.message, variant: "destructive" }),
                          }
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" title="View" onClick={() => navigate(`/admin/employee/${u.id}`)}><Eye className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" title="Edit" onClick={() => navigate(`/admin/employee/${u.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" title="Delete" onClick={() => handleDelete(u.id, u.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}

      <InviteUserDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />

      {/* CSV Import Dialog */}
      <Dialog open={importOpen} onOpenChange={(open) => {
        if (!open) { setCsvPreview([]); setCsvIssues(new Map()); setEntraNotFound(new Set()); if (importFileRef.current) importFileRef.current.value = ""; }
        setImportOpen(open);
      }}>
        <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Employee Profiles from CSV</DialogTitle>
            <DialogDescription>Upload a CSV file to bulk-create employee profiles. All rows are validated before import.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadImportTemplate}>
                <Download className="h-4 w-4 mr-2" />Download Template
              </Button>
              <Button variant="outline" size="sm" onClick={downloadImportSample}>
                <Download className="h-4 w-4 mr-2" />Download Sample CSV
              </Button>
            </div>

            <label htmlFor="employee-csv-upload" className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click to select or drag & drop a .csv file</span>
              <input ref={importFileRef} id="employee-csv-upload" type="file" accept=".csv" className="hidden" onChange={handleImportFileChange} />
            </label>

            {csvPreview.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {csvPreview.length} row(s) parsed
                  {entraChecking && <span className="text-amber-600 ml-2">(Checking Azure Entra...)</span>}
                  {!entraChecking && csvIssues.size > 0 && <span className="text-destructive ml-2">({csvIssues.size} issue{csvIssues.size > 1 ? "s" : ""} found — remove to proceed)</span>}
                </p>
                <div className="border rounded-md overflow-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Card Last4</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((r, i) => (
                        <TableRow key={i} className={csvIssues.has(i) ? "bg-destructive/5" : ""}>
                          <TableCell className="text-sm">{r.employeeCode}</TableCell>
                          <TableCell className="text-sm">{r._displayName}</TableCell>
                          <TableCell className="text-sm">{r.email}</TableCell>
                          <TableCell className="text-sm">{r.department}</TableCell>
                          <TableCell className="text-sm">{r.branch}</TableCell>
                          <TableCell className="text-sm">{r.role}</TableCell>
                          <TableCell className="text-sm">{r.active ? "Yes" : "No"}</TableCell>
                          <TableCell className="text-sm">{r.creditCardLast4 || "—"}</TableCell>
                          <TableCell className="text-center">
                            {csvIssues.has(i) ? (
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger>
                                  <span><Badge variant="destructive" className="text-xs cursor-help">Error</Badge></span>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs text-sm font-normal">
                                  {csvIssues.get(i)}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600">OK</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" onClick={() => removeCsvRow(i)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={confirmImport} disabled={csvPreview.length === 0 || csvIssues.size > 0 || entraChecking || importMutation.isPending}>
              {(importMutation.isPending || entraChecking) && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
              {entraChecking ? "Checking Azure..." : "Confirm Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkConfirmDialog open={!!empBulkConfirm} action={empBulkConfirm} count={empBulk.selectionCount} resourceName="employee(s)" onConfirm={executeEmpBulkAction} onCancel={() => setEmpBulkConfirm(null)} isProcessing={empBulkMutation.isPending} />
    </div>
  );
}

function RolesPanel() {
  const { data: roles, isLoading } = useRolesOverview();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Roles & Permissions</h2>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Loading roles...</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(roles ?? []).map((r) => (
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
  { delegator: "สมหญิง แก้วใส", delegate: "สมชาย ใจดี", startDate: "2026-02-01", endDate: "2026-02-28", status: "Active" },
  { delegator: "ธนา พิทักษ์", delegate: "พิมพ์ ดี", startDate: "2026-03-01", endDate: "2026-03-15", status: "Scheduled" },
];

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
  documents: DocumentTypePanel,
  "expense-type": ExpenseTypePanelImported,
  "expense-item": ExpenseItemPanel,
  "expense-rules": ExpenseRulesPanel,
  "expense-delegates": ExpenseDelegatesPanel,
  "email-notifications": EmailNotificationsPanel,
  "pending-invoice-email": PendingInvoiceNotificationPanel,
  "monthly-cardholder-summary": MonthlyCardholderSummaryPanel,
  "monthly-approver-summary": MonthlyApproverSummaryPanel,
  "pending-approval-email": PendingApprovalNotificationPanel,
  "request-for-info-email": RequestForInfoNotificationPanel,
  "document-aging-email": DocumentAgingNotificationPanel,
  "month-end-report-email": MonthEndReportNotificationPanel,
  "system-alerts": SystemAlertsPanel,
  "erp-sync": ErpSyncPanel,
  "sync-logs": SyncLogsPanel,
  "mcc-policy": PolicyManagement,
  "ocr-validation": OcrValidationRulesPanel,
};

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeKey, setActiveKey] = useState(() => searchParams.get("tab") || "employees");
  const ActivePanel = panelMap[activeKey] || (() => <div className="p-8 text-muted-foreground">Panel not found</div>);
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(true);

  // Auto-collapse main sidebar on Admin page to maximize table space
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();
  const prevSidebarOpen = useRef(sidebarOpen);
  useEffect(() => {
    prevSidebarOpen.current = sidebarOpen;
    setSidebarOpen(false);
    return () => {
      setSidebarOpen(prevSidebarOpen.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
          <p className="text-muted-foreground text-sm">Manage users, workflows, notifications, and integrations</p>
        </div>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => setAdminSidebarOpen(!adminSidebarOpen)}>
              {adminSidebarOpen ? <PanelLeftClose className="h-4 w-4 mr-2" /> : <PanelLeftOpen className="h-4 w-4 mr-2" />}
              {adminSidebarOpen ? "Hide Menu" : "Show Menu"}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {adminSidebarOpen ? "Collapse the admin menu to get more table space" : "Expand the admin navigation menu"}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
        {/* Sidebar */}
        <nav className={cn("shrink-0 transition-all duration-200 overflow-hidden", adminSidebarOpen ? "w-64" : "w-0")}>
          <div className="w-64 space-y-5">
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
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <ActivePanel />
        </div>
      </div>
    </div>
  );
}
