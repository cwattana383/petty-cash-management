import { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { Plus, Upload, Search, Pencil, Trash2, Loader2, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useMccPolicies, useAllMccPolicies, useCreateMccPolicy, useUpdateMccPolicy, useDeleteMccPolicy, useImportMccPolicies, useBulkMccPolicyAction } from "@/hooks/use-mcc-policies";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import BulkActionBar from "@/components/common/BulkActionBar";
import BulkConfirmDialog from "@/components/common/BulkConfirmDialog";
import { MccPolicyMaster, PolicyType } from "@/lib/corporate-card-types";
import { useAllExpenseTypes } from "@/hooks/use-expense-types";

const POLICY_TYPE_BADGE: Record<PolicyType, { label: string; className: string }> = {
  AUTO_APPROVE: { label: "Auto Approve", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  AUTO_REJECT: { label: "Auto Reject", className: "bg-red-100 text-red-800 border-red-200" },
  REQUIRES_APPROVAL: { label: "Requires Approval", className: "bg-amber-100 text-amber-800 border-amber-200" },
};

const ROW_BG: Record<PolicyType, string> = {
  AUTO_REJECT: "bg-[#FCE4D6]",
  REQUIRES_APPROVAL: "bg-[#FFEB9C]",
  AUTO_APPROVE: "",
};

const PAGE_SIZE = 20;

const emptyPolicy: MccPolicyMaster = {
  id: "", mcc_code: null, description: "",
  mcc_code_description: null,
  policy_category: "Allowed",
  policy_type: "AUTO_APPROVE",
  threshold_amount: null, currency: "THB", active_flag: true,
  expense_type_id: null, sub_expense_type_id: null,
  expense_type_name: null, sub_expense_type_name: null,
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
};

export default function PolicyManagement() {
  const { toast } = useToast();
  const { data: allExpenseTypes } = useAllExpenseTypes();

  const activeExpenseTypes = useMemo(
    () => (allExpenseTypes ?? []).filter((et) => et.active),
    [allExpenseTypes],
  );

  const expenseTypeOptions = useMemo(
    () => activeExpenseTypes.map((et) => ({ id: et.id, name: et.expenseType })),
    [activeExpenseTypes],
  );

  const getSubtypeOptions = (parentId: string): { id: string; name: string }[] => {
    const parent = activeExpenseTypes.find((et) => et.id === parentId);
    return parent?.subtypes?.filter((s) => s.active).map((s) => ({ id: s.id, name: s.subExpenseType })) ?? [];
  };

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [expenseTypeFilter, setExpenseTypeFilter] = useState("all");
  const [subExpenseTypeFilter, setSubExpenseTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [activeFilter, expenseTypeFilter, subExpenseTypeFilter]);

  // Data fetching
  const { data, isLoading, isError } = useMccPolicies({
    search: debouncedSearch || undefined,
    active: activeFilter !== "all" ? (activeFilter === "active" ? "true" : "false") : undefined,
    expenseTypeId: expenseTypeFilter !== "all" ? expenseTypeFilter : undefined,
    subExpenseTypeId: subExpenseTypeFilter !== "all" ? subExpenseTypeFilter : undefined,
    page,
    limit: PAGE_SIZE,
  });

  const policies = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 };

  // Mutations
  const createMutation = useCreateMccPolicy();
  const updateMutation = useUpdateMccPolicy();
  const deleteMutation = useDeleteMccPolicy();
  const bulkMutation = useBulkMccPolicyAction();
  const bulk = useBulkSelection({ items: policies, totalCount: meta.total });
  const [bulkConfirmAction, setBulkConfirmAction] = useState<"delete" | "activate" | "deactivate" | null>(null);

  const executeBulkAction = () => {
    if (!bulkConfirmAction) return;
    const payload = bulk.selectAllPages
      ? { action: bulkConfirmAction, selectAll: true, filters: { ...(debouncedSearch ? { search: debouncedSearch } : {}), ...(activeFilter !== "all" ? { active: activeFilter === "active" ? "true" : "false" } : {}), ...(expenseTypeFilter !== "all" ? { expenseTypeId: expenseTypeFilter } : {}), ...(subExpenseTypeFilter !== "all" ? { subExpenseTypeId: subExpenseTypeFilter } : {}) } }
      : { action: bulkConfirmAction, ids: [...bulk.selectedIds] };
    bulkMutation.mutate(payload, {
      onSuccess: (res: unknown) => {
        const { affected } = res as { affected: number };
        toast({ title: "Success", description: `${affected} policy rule(s) ${bulkConfirmAction === "delete" ? "deleted" : bulkConfirmAction === "activate" ? "activated" : "deactivated"}.` });
        bulk.clearSelection();
        setBulkConfirmAction(null);
      },
      onError: (err: unknown) => {
        toast({ title: "Error", description: err instanceof Error ? err.message : "Bulk action failed.", variant: "destructive" });
        setBulkConfirmAction(null);
      },
    });
  };

  // Export CSV
  const [exportRequested, setExportRequested] = useState(false);
  const { data: allPolicies, isLoading: isLoadingExport } = useAllMccPolicies({ enabled: exportRequested });

  const escapeCsvField = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const exportCsv = () => {
    if (!allPolicies) {
      setExportRequested(true);
      toast({ title: "Loading", description: "Fetching all policies... Please click Export CSV again." });
      return;
    }
    if (allPolicies.length === 0) {
      toast({ title: "No Data", description: "No policy rules available to export.", variant: "destructive" });
      return;
    }

    const headers = ["Expense_Type", "Sub_Expense_Type", "MCC_Code", "MCC_Code_Description", "Description", "Policy_Type", "Threshold_Amount", "Currency", "Active"];
    const rows: string[] = [headers.join(",")];

    for (const p of allPolicies) {
      rows.push([
        escapeCsvField(p.expense_type_name ?? ""),
        escapeCsvField(p.sub_expense_type_name ?? ""),
        escapeCsvField(p.mcc_code ?? ""),
        escapeCsvField(p.mcc_code_description ?? ""),
        escapeCsvField(p.description ?? ""),
        escapeCsvField(p.policy_type),
        p.threshold_amount != null ? String(p.threshold_amount) : "",
        escapeCsvField(p.currency ?? "THB"),
        p.active_flag ? "Yes" : "No",
      ].join(","));
    }

    const csv = "\uFEFF" + rows.join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = "policy_management_export.csv";
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }

    toast({ title: "Exported", description: `${allPolicies.length} policy rules exported to CSV.` });
  };

  // ── CSV Import helpers ──

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
    const csv = "\uFEFFExpense_Type,Sub_Expense_Type,MCC_Code,MCC_Code_Description,Description,Policy_Type,Threshold_Amount,Active\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try { const a = document.createElement("a"); a.href = url; a.download = "policy_import_template.csv"; a.click(); }
    finally { URL.revokeObjectURL(url); }
  };

  const downloadImportSample = () => {
    const csv = "\uFEFFExpense_Type,Sub_Expense_Type,MCC_Code,MCC_Code_Description,Description,Policy_Type,Threshold_Amount,Active\n" +
      "Transportation,Taxi / Ride-Hailing \u2014 Domestic,4121,Taxicabs & Limousines,Taxi Domestic,AUTO_APPROVE,500,Yes\n" +
      "Entertainment,Motion Picture / Non-Business Entertainment,7832,Motion Picture Theaters,Non-Business Entertainment,AUTO_REJECT,,Yes\n" +
      "Hotel,Hotel \u2014 Domestic Single Room,7011,Hotels & Motels,Hotel Domestic AD-Chief Single Room,AUTO_APPROVE,2500,Yes\n" +
      "Transportation,Airline Tickets \u2014 Domestic & International,4511,Airlines,Airline Tickets,REQUIRES_APPROVAL,,Yes\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try { const a = document.createElement("a"); a.href = url; a.download = "policy_import_sample.csv"; a.click(); }
    finally { URL.revokeObjectURL(url); }
  };

  const checkCsvIssues = (rows: CsvRow[]) => {
    const issues = new Map<number, string>();
    const seenMcc = new Set<string>();
    const existingMcc = new Set((allPoliciesForImport ?? []).map((p) => p.mcc_code).filter(Boolean) as string[]);

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      // MCC code within CSV
      if (seenMcc.has(r.mccCode)) { issues.set(i, "Duplicate MCC_Code in CSV"); seenMcc.add(r.mccCode); continue; }
      seenMcc.add(r.mccCode);
      // MCC code in DB
      if (existingMcc.has(r.mccCode)) { issues.set(i, "MCC_Code already exists in DB"); continue; }
      // Expense type not found
      if (!r.expenseTypeId) { issues.set(i, `Expense_Type "${r.expenseType}" not found`); continue; }
      // Sub expense type not found or wrong parent
      if (!r.subExpenseTypeId) { issues.set(i, `Sub_Expense_Type "${r.subExpenseType}" not found or doesn't belong to "${r.expenseType}"`); continue; }
      // Policy type
      if (!["AUTO_APPROVE", "AUTO_REJECT", "REQUIRES_APPROVAL"].includes(r.policyType)) { issues.set(i, `Invalid Policy_Type "${r.policyType}"`); continue; }
      // Threshold rule
      if (r.policyType === "AUTO_APPROVE" && (!r.thresholdAmount || parseFloat(r.thresholdAmount) <= 0)) { issues.set(i, "Threshold_Amount required for AUTO_APPROVE"); continue; }
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

      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
      const required = ["expense_type", "sub_expense_type", "mcc_code", "mcc_code_description", "description", "policy_type", "threshold_amount", "active"];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) {
        toast({ title: "Invalid Headers", description: `Missing columns: ${missing.join(", ")}`, variant: "destructive" });
        if (importFileRef.current) importFileRef.current.value = "";
        return;
      }

      const idx = Object.fromEntries(required.map((h) => [h, headers.indexOf(h)]));

      // Build lookups from expense types
      const etNameToId = new Map<string, string>();
      const stLookup = new Map<string, string>(); // "etId||stName" -> stId
      for (const et of allExpenseTypesForImport ?? []) {
        etNameToId.set(et.expenseType.toLowerCase(), et.id);
        for (const st of et.subtypes ?? []) {
          stLookup.set(`${et.id}||${st.subExpenseType.toLowerCase()}`, st.id);
        }
      }

      // Row-level mandatory check
      const rowErrors: string[] = [];
      const rows: CsvRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        const expenseType = cols[idx.expense_type] ?? "";
        const subExpenseType = cols[idx.sub_expense_type] ?? "";
        const mccCode = cols[idx.mcc_code] ?? "";
        const policyType = (cols[idx.policy_type] ?? "").toUpperCase();
        const active = cols[idx.active] ?? "";

        if (!expenseType) rowErrors.push(`Row ${i + 1}: Expense_Type is required`);
        if (!subExpenseType) rowErrors.push(`Row ${i + 1}: Sub_Expense_Type is required`);
        if (!mccCode) rowErrors.push(`Row ${i + 1}: MCC_Code is required`);
        if (!policyType) rowErrors.push(`Row ${i + 1}: Policy_Type is required`);
        if (!active) rowErrors.push(`Row ${i + 1}: Active is required`);

        const etId = etNameToId.get(expenseType.toLowerCase()) ?? "";
        const stId = etId ? (stLookup.get(`${etId}||${subExpenseType.toLowerCase()}`) ?? "") : "";

        rows.push({
          expenseType, subExpenseType, mccCode,
          mccCodeDescription: cols[idx.mcc_code_description] ?? "",
          description: cols[idx.description] ?? "",
          policyType,
          thresholdAmount: cols[idx.threshold_amount] ?? "",
          active,
          expenseTypeId: etId,
          subExpenseTypeId: stId,
        });
      }

      if (rowErrors.length > 0) {
        toast({ title: "Validation Errors", description: rowErrors.slice(0, 5).join("\n") + (rowErrors.length > 5 ? `\n...and ${rowErrors.length - 5} more` : ""), variant: "destructive" });
        if (importFileRef.current) importFileRef.current.value = "";
        return;
      }

      setCsvPreview(rows);
      setCsvIssues(checkCsvIssues(rows));
    };
    reader.readAsArrayBuffer(file);
  };

  const removeCsvRow = (index: number) => {
    const updated = csvPreview.filter((_, i) => i !== index);
    setCsvPreview(updated);
    setCsvIssues(checkCsvIssues(updated));
  };

  const confirmImport = () => {
    const payload = csvPreview.map((r) => ({
      mccCode: r.mccCode,
      description: r.description,
      mccCodeDescription: r.mccCodeDescription || undefined,
      policyType: r.policyType as PolicyType,
      thresholdAmount: r.thresholdAmount ? parseFloat(r.thresholdAmount) : undefined,
      activeFlag: r.active.toLowerCase() === "yes" || r.active.toLowerCase() === "true",
      expenseTypeId: r.expenseTypeId,
      subExpenseTypeId: r.subExpenseTypeId,
    }));

    importMutation.mutate(payload, {
      onSuccess: (res) => {
        toast({ title: "Imported", description: `${(res as { imported: number }).imported} policy rules imported.` });
        setCsvPreview([]);
        setCsvIssues(new Map());
        setBulkOpen(false);
        if (importFileRef.current) importFileRef.current.value = "";
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to import policies.";
        toast({ title: "Import Error", description: msg, variant: "destructive" });
      },
    });
  };

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<MccPolicyMaster | null>(null);
  const [form, setForm] = useState<MccPolicyMaster>({ ...emptyPolicy });
  const [formLevel1, setFormLevel1] = useState("");
  const [formLevel2, setFormLevel2] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // CSV Import
  const [bulkOpen, setBulkOpen] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportMccPolicies();
  const { data: allPoliciesForImport } = useAllMccPolicies({ enabled: bulkOpen });
  const { data: allExpenseTypesForImport } = useAllExpenseTypes({ enabled: bulkOpen });

  interface CsvRow {
    expenseType: string; subExpenseType: string; mccCode: string;
    mccCodeDescription: string; description: string; policyType: string;
    thresholdAmount: string; active: string;
    expenseTypeId: string; subExpenseTypeId: string;
  }
  const [csvPreview, setCsvPreview] = useState<CsvRow[]>([]);
  const [csvIssues, setCsvIssues] = useState<Map<number, string>>(new Map());

  const openAdd = () => {
    setEditingPolicy(null);
    setForm({ ...emptyPolicy, updated_at: new Date().toISOString() });
    setFormLevel1("");
    setFormLevel2("");
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (p: MccPolicyMaster) => {
    setEditingPolicy(p);
    setForm({ ...p });
    setFormLevel1(p.expense_type_id ?? "");
    setFormLevel2(p.sub_expense_type_id ?? "");
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formLevel1.trim()) errors.expense_type_id = "Required";
    if (!formLevel2.trim()) errors.sub_expense_type_id = "Required";
    if (!form.mcc_code?.trim()) errors.mcc_code = "Required";
    if (!form.description.trim()) errors.description = "Required";
    if (form.policy_type === "AUTO_APPROVE" && form.threshold_amount !== null && form.threshold_amount <= 0)
      errors.threshold_amount = "Must be > 0";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const policyType = form.policy_type;
    const thresholdAmount = policyType !== "AUTO_APPROVE" ? null : form.threshold_amount;

    if (editingPolicy) {
      try {
        await updateMutation.mutateAsync({
          id: editingPolicy.id,
          data: {
            mccCode: form.mcc_code,
            description: form.description,
            mccCodeDescription: form.mcc_code_description,
            policyCategory: null,
            policyType,
            thresholdAmount,
            activeFlag: form.active_flag,
            expenseTypeId: formLevel1 || null,
            subExpenseTypeId: formLevel2 || null,
          },
        });
        toast({ title: "Policy Updated", description: `Policy saved.` });
        setModalOpen(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update policy.";
        if (msg.toLowerCase().includes("already exists")) {
          setFormErrors((prev) => ({ ...prev, mcc_code: msg }));
        } else {
          toast({ title: "Error", description: msg, variant: "destructive" });
        }
      }
    } else {
      try {
        await createMutation.mutateAsync({
          mccCode: form.mcc_code?.trim() || undefined,
          description: form.description,
          mccCodeDescription: form.mcc_code_description,
          policyCategory: null,
          policyType,
          thresholdAmount,
          currency: form.currency,
          activeFlag: form.active_flag,
          expenseTypeId: formLevel1 || null,
          subExpenseTypeId: formLevel2 || null,
        });
        toast({ title: "Policy Added", description: `Policy created.` });
        setModalOpen(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create policy.";
        if (msg.toLowerCase().includes("already exists")) {
          setFormErrors((prev) => ({ ...prev, mcc_code: msg }));
        } else {
          toast({ title: "Error", description: msg, variant: "destructive" });
        }
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      toast({ title: "Policy Deleted", description: `Policy removed.` });
    } catch {
      toast({ title: "Error", description: "Failed to delete policy.", variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const handleInlineToggle = async (id: string, active: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { activeFlag: active },
      });
      toast({ title: "Updated", description: `Policy rule ${active ? "activated" : "deactivated"}.` });
    } catch {
      toast({ title: "Error", description: "Failed to update active status.", variant: "destructive" });
    }
  };

  const handleInlinePolicyType = async (id: string, pt: PolicyType) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { policyType: pt },
      });
    } catch {
      toast({ title: "Error", description: "Failed to update policy type.", variant: "destructive" });
    }
  };

  const handleInlineThreshold = async (id: string, val: string) => {
    const num = val === "" ? null : parseFloat(val);
    try {
      await updateMutation.mutateAsync({
        id,
        data: { thresholdAmount: num },
      });
    } catch {
      toast({ title: "Error", description: "Failed to update threshold.", variant: "destructive" });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Policy Management</h1>
          <p className="text-sm text-muted-foreground">Maintain Expense type-based rules for Auto Approve / Auto Reject / Requires Approval.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { setCsvPreview([]); setCsvIssues(new Map()); setBulkOpen(true); }}>
            <Upload className="h-4 w-4 mr-2" />Import CSV
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={isLoadingExport}>
            {isLoadingExport ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export CSV
          </Button>
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Policy Rule</Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expense type, description, MCC..." className="pl-7 h-9 text-sm" />
        </div>
        <Select value={expenseTypeFilter} onValueChange={(v) => { setExpenseTypeFilter(v); setSubExpenseTypeFilter("all"); }}>
          <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue placeholder="Expense Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Expense Types</SelectItem>
            {expenseTypeOptions.map((et) => (
              <SelectItem key={et.id} value={et.id}>{et.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subExpenseTypeFilter} onValueChange={setSubExpenseTypeFilter}>
          <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue placeholder="Sub Expense Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sub Types</SelectItem>
            {(expenseTypeFilter !== "all" ? getSubtypeOptions(expenseTypeFilter) : []).map((st) => (
              <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {(search || activeFilter !== "all" || expenseTypeFilter !== "all" || subExpenseTypeFilter !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setActiveFilter("all"); setExpenseTypeFilter("all"); setSubExpenseTypeFilter("all"); }}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />Reset
          </Button>
        )}
        <div className="flex-1" />
      </div>

      {/* Bulk Action Bar */}
      {bulk.hasSelection && (
        <BulkActionBar
          selectedCount={bulk.selectionCount}
          totalCount={meta.total}
          selectAllPages={bulk.selectAllPages}
          isAllOnPageSelected={bulk.isAllOnPageSelected}
          onSelectAllPages={bulk.selectAllAcrossPages}
          onDelete={() => setBulkConfirmAction("delete")}
          onActivate={() => setBulkConfirmAction("activate")}
          onDeactivate={() => setBulkConfirmAction("deactivate")}
          onClear={bulk.clearSelection}
          isProcessing={bulkMutation.isPending}
        />
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={bulk.isAllOnPageSelected ? true : bulk.isIndeterminate ? "indeterminate" : false}
                    onCheckedChange={bulk.toggleAllOnPage}
                  />
                </TableHead>
                <TableHead className="text-center">Expense Type</TableHead>
                <TableHead className="text-center min-w-[180px]">Sub Expense Type</TableHead>
                <TableHead className="text-center w-[100px]">MCC Code (Ref)</TableHead>
                <TableHead className="text-center w-[160px]">MCC Code Description</TableHead>
                <TableHead className="text-center">Description / Sub-type</TableHead>
                <TableHead className="text-center">Policy Type</TableHead>
                <TableHead className="text-center">Threshold Amount</TableHead>
                <TableHead className="text-center">Currency</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-center">Updated At</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Loading policies...</p>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12 text-destructive">
                    Failed to load policies. Please try again.
                  </TableCell>
                </TableRow>
              ) : policies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                    No policies found.
                  </TableCell>
                </TableRow>
              ) : policies.map((p) => (
                <TableRow key={p.id} className={ROW_BG[p.policy_type]}>
                  <TableCell>
                    <Checkbox
                      checked={bulk.selectAllPages || bulk.selectedIds.has(p.id)}
                      onCheckedChange={() => bulk.toggleOne(p.id)}
                    />
                  </TableCell>
                  <TableCell className="text-center">{p.expense_type_name ?? <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                  <TableCell className="text-center text-sm">{p.sub_expense_type_name || "—"}</TableCell>
                  <TableCell className="text-center text-xs font-mono">{p.mcc_code || "—"}</TableCell>
                  <TableCell className="text-center text-xs">{p.mcc_code_description || "—"}</TableCell>
                  <TableCell className="text-center">{p.description}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                    <Select value={p.policy_type} onValueChange={(v) => handleInlinePolicyType(p.id, v as PolicyType)}>
                      <SelectTrigger className="h-8 w-[185px] text-xs">
                        <Badge variant="outline" className={POLICY_TYPE_BADGE[p.policy_type].className}>{POLICY_TYPE_BADGE[p.policy_type].label}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTO_APPROVE">Auto Approve</SelectItem>
                        <SelectItem value="AUTO_REJECT">Auto Reject</SelectItem>
                        <SelectItem value="REQUIRES_APPROVAL">Requires Approval</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {p.policy_type === "AUTO_APPROVE" ? (
                      <Input
                        key={`${p.id}-${p.threshold_amount}`}
                        type="number"
                        defaultValue={p.threshold_amount ?? ""}
                        onBlur={(e) => handleInlineThreshold(p.id, e.target.value)}
                        className="h-8 w-[120px] text-right text-xs mx-auto"
                        placeholder="No limit"
                        min={0}
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-xs">{p.currency}</TableCell>
                  <TableCell className="text-center">
                    <Switch checked={p.active_flag} onCheckedChange={(v) => handleInlineToggle(p.id, v)} />
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{format(new Date(p.updated_at), "dd/MM/yyyy HH:mm")}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-muted-foreground">
              Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? "Edit Policy Rule" : "Add Policy Rule"}</DialogTitle>
            <DialogDescription>{editingPolicy ? "Update this policy rule." : "Create a new policy rule."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Expense Type <span className="text-destructive">*</span></Label>
                <Select value={formLevel1} onValueChange={(v) => { setFormLevel1(v); setFormLevel2(""); setForm({ ...form, expense_type_id: v, sub_expense_type_id: null }); }}>
                  <SelectTrigger><SelectValue placeholder="Select expense type" /></SelectTrigger>
                  <SelectContent>
                    {expenseTypeOptions.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formErrors.expense_type_id && <p className="text-xs text-destructive">{formErrors.expense_type_id}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Sub Expense Type <span className="text-destructive">*</span></Label>
                <Select value={formLevel2} onValueChange={(v) => { setFormLevel2(v); setForm({ ...form, sub_expense_type_id: v }); }} disabled={!formLevel1}>
                  <SelectTrigger><SelectValue placeholder={formLevel1 ? "Select sub type" : "Select expense type first"} /></SelectTrigger>
                  <SelectContent>
                    {getSubtypeOptions(formLevel1).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formErrors.sub_expense_type_id && <p className="text-xs text-destructive">{formErrors.sub_expense_type_id}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>MCC Code (Ref) <span className="text-destructive">*</span></Label>
                <Input value={form.mcc_code ?? ""} onChange={(e) => setForm({ ...form, mcc_code: e.target.value || null })} placeholder="e.g. 5812" />
                {formErrors.mcc_code && <p className="text-xs text-destructive">{formErrors.mcc_code}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>MCC Code Description</Label>
                <Input value={form.mcc_code_description ?? ""} onChange={(e) => setForm({ ...form, mcc_code_description: e.target.value || null })} placeholder="e.g. Restaurants" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Eating Places/Restaurants" />
              {formErrors.description && <p className="text-xs text-destructive">{formErrors.description}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Policy Type</Label>
              <Select value={form.policy_type} onValueChange={(v) => setForm({ ...form, policy_type: v as PolicyType, threshold_amount: v !== "AUTO_APPROVE" ? null : form.threshold_amount })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO_APPROVE">Auto Approve</SelectItem>
                  <SelectItem value="AUTO_REJECT">Auto Reject</SelectItem>
                  <SelectItem value="REQUIRES_APPROVAL">Requires Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.policy_type === "AUTO_APPROVE" && (
              <div className="space-y-1.5">
                <Label>Threshold Amount</Label>
                <Input
                  type="number"
                  value={form.threshold_amount ?? ""}
                  onChange={(e) => setForm({ ...form, threshold_amount: e.target.value === "" ? null : parseFloat(e.target.value) })}
                  placeholder="Leave empty for no limit"
                  min={0}
                />
                {formErrors.threshold_amount && <p className="text-xs text-destructive">{formErrors.threshold_amount}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="THB">THB</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="SGD">SGD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active_flag} onCheckedChange={(v) => setForm({ ...form, active_flag: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy Rule</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this policy rule?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CSV Import Dialog */}
      <Dialog open={bulkOpen} onOpenChange={(open) => {
        if (!open) { setCsvPreview([]); setCsvIssues(new Map()); if (importFileRef.current) importFileRef.current.value = ""; }
        setBulkOpen(open);
      }}>
        <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Policy Rules from CSV</DialogTitle>
            <DialogDescription>Upload a CSV file to bulk-import MCC policy rules. All rows are validated before import.</DialogDescription>
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

            <label htmlFor="policy-csv-upload" className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click to select or drag & drop a .csv file</span>
              <input ref={importFileRef} id="policy-csv-upload" type="file" accept=".csv" className="hidden" onChange={handleImportFileChange} />
            </label>

            {csvPreview.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {csvPreview.length} row(s) parsed
                  {csvIssues.size > 0 && <span className="text-destructive ml-2">({csvIssues.size} issue{csvIssues.size > 1 ? "s" : ""} found — remove to proceed)</span>}
                </p>
                <div className="border rounded-md overflow-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expense Type</TableHead>
                        <TableHead>Sub Expense Type</TableHead>
                        <TableHead>MCC Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Policy Type</TableHead>
                        <TableHead>Threshold</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((r, i) => (
                        <TableRow key={i} className={csvIssues.has(i) ? "bg-destructive/5" : ""}>
                          <TableCell className="text-sm">{r.expenseType}</TableCell>
                          <TableCell className="text-sm">{r.subExpenseType}</TableCell>
                          <TableCell className="text-sm">{r.mccCode}</TableCell>
                          <TableCell className="text-sm">{r.description || "—"}</TableCell>
                          <TableCell className="text-sm">{r.policyType}</TableCell>
                          <TableCell className="text-sm">{r.thresholdAmount || "—"}</TableCell>
                          <TableCell className="text-sm">{r.active}</TableCell>
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
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={confirmImport} disabled={csvPreview.length === 0 || csvIssues.size > 0 || importMutation.isPending}>
              {importMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Confirm Dialog */}
      <BulkConfirmDialog
        open={!!bulkConfirmAction}
        action={bulkConfirmAction}
        count={bulk.selectionCount}
        resourceName="policy rule(s)"
        onConfirm={executeBulkAction}
        onCancel={() => setBulkConfirmAction(null)}
        isProcessing={bulkMutation.isPending}
      />
    </div>
  );
}
