import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Plus, Upload, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MccPolicyMaster, PolicyType } from "@/lib/corporate-card-types";
import { mockMccPolicies } from "@/lib/corporate-card-mock-data";
import { getLevel1Options, getLevel2Options } from "@/lib/expense-type-config";

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
  mcc_code: "", description: "", category: "",
  mcc_code_ref: "", mcc_code_description: "", description_subtype: "",
  policy_type: "AUTO_APPROVE",
  threshold_amount: null, currency: "THB", active_flag: true, updated_at: new Date().toISOString(),
};

export default function PolicyManagement() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<MccPolicyMaster[]>([...mockMccPolicies]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [expenseTypeFilter, setExpenseTypeFilter] = useState("all");
  const [subExpenseTypeFilter, setSubExpenseTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<MccPolicyMaster | null>(null);
  const [form, setForm] = useState<MccPolicyMaster>({ ...emptyPolicy });
  const [formLevel1, setFormLevel1] = useState("");
  const [formLevel2, setFormLevel2] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Bulk import
  const [bulkOpen, setBulkOpen] = useState(false);

  const expenseTypeOptions = useMemo(() => {
    return Array.from(new Set(policies.map((p) => p.category))).sort();
  }, [policies]);

  const subExpenseTypeOptions = useMemo(() => {
    let data = policies;
    if (expenseTypeFilter !== "all") data = data.filter((p) => p.category === expenseTypeFilter);
    return Array.from(new Set(data.map((p) => p.description_subtype).filter(Boolean))).sort();
  }, [policies, expenseTypeFilter]);

  const filtered = useMemo(() => {
    let data = [...policies];
    if (activeFilter === "active") data = data.filter((p) => p.active_flag);
    else if (activeFilter === "inactive") data = data.filter((p) => !p.active_flag);
    if (expenseTypeFilter !== "all") data = data.filter((p) => p.category === expenseTypeFilter);
    if (subExpenseTypeFilter !== "all") data = data.filter((p) => p.description_subtype === subExpenseTypeFilter);
    if (search) {
      const s = search.toLowerCase();
      data = data.filter((p) =>
        p.category.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        p.description_subtype.toLowerCase().includes(s) ||
        p.mcc_code_ref.toLowerCase().includes(s) ||
        p.mcc_code_description.toLowerCase().includes(s)
      );
    }
    data.sort((a, b) => a.category.localeCompare(b.category));
    return data;
  }, [policies, activeFilter, expenseTypeFilter, subExpenseTypeFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    setFormLevel1(p.category);
    setFormLevel2(p.description_subtype);
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formLevel1.trim()) errors.category = "Required";
    if (!formLevel2.trim()) errors.description_subtype = "Required";
    if (form.policy_type === "AUTO_APPROVE" && form.threshold_amount !== null && form.threshold_amount <= 0)
      errors.threshold_amount = "Must be > 0";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    const now = new Date().toISOString();
    const updated = { ...form, category: formLevel1, description_subtype: formLevel2, updated_at: now };
    if (form.policy_type !== "AUTO_APPROVE") updated.threshold_amount = null;

    if (editingPolicy) {
      setPolicies((prev) => prev.map((p) => (p.mcc_code === editingPolicy.mcc_code ? updated : p)));
      toast({ title: "Policy Updated", description: `Policy rule saved.` });
    } else {
      const newId = `P${String(policies.length + 100).padStart(3, "0")}`;
      setPolicies((prev) => [...prev, { ...updated, mcc_code: newId }]);
      toast({ title: "Policy Added", description: `Policy rule created.` });
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setPolicies((prev) => prev.filter((p) => p.mcc_code !== deleteTarget));
    toast({ title: "Policy Deleted", description: `Policy removed.` });
    setDeleteTarget(null);
  };

  const handleInlineToggle = (mccCode: string, active: boolean) => {
    setPolicies((prev) => prev.map((p) => (p.mcc_code === mccCode ? { ...p, active_flag: active, updated_at: new Date().toISOString() } : p)));
  };

  const handleInlinePolicyType = (mccCode: string, pt: PolicyType) => {
    setPolicies((prev) => prev.map((p) => {
      if (p.mcc_code !== mccCode) return p;
      return { ...p, policy_type: pt, threshold_amount: pt === "AUTO_APPROVE" ? p.threshold_amount : null, updated_at: new Date().toISOString() };
    }));
  };

  const handleInlineThreshold = (mccCode: string, val: string) => {
    const num = val === "" ? null : parseFloat(val);
    setPolicies((prev) => prev.map((p) => (p.mcc_code === mccCode ? { ...p, threshold_amount: num, updated_at: new Date().toISOString() } : p)));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Policy Management</h1>
        <p className="text-sm text-muted-foreground">Maintain Expense type-based rules for Auto Approve / Auto Reject / Requires Approval.</p>
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
            {expenseTypeOptions.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subExpenseTypeFilter} onValueChange={setSubExpenseTypeFilter}>
          <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue placeholder="Sub Expense Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sub Types</SelectItem>
            {subExpenseTypeOptions.map((st) => (
              <SelectItem key={st} value={st}>{st}</SelectItem>
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
        <div className="flex-1" />
        <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-3.5 w-3.5" />Add Policy Rule</Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense Type</TableHead>
                <TableHead className="min-w-[180px]">Sub Expense Type</TableHead>
                <TableHead className="w-[100px]">MCC Code (Ref)</TableHead>
                <TableHead className="w-[160px]">MCC Code Description</TableHead>
                <TableHead className="min-w-[260px]">Description / Sub-type</TableHead>
                <TableHead>Policy Type</TableHead>
                <TableHead className="text-right">Threshold Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Updated At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">No policies found.</TableCell></TableRow>
              ) : paged.map((p) => (
                <TableRow key={p.mcc_code} className={ROW_BG[p.policy_type]}>
                  <TableCell>{p.category}</TableCell>
                  <TableCell className="text-sm">{p.description_subtype || "—"}</TableCell>
                  <TableCell className="text-xs font-mono">{p.mcc_code_ref || "—"}</TableCell>
                  <TableCell className="text-xs">{p.mcc_code_description || "—"}</TableCell>
                  <TableCell className="text-sm">{p.description_subtype || "—"}</TableCell>
                  <TableCell>
                    <Select value={p.policy_type} onValueChange={(v) => handleInlinePolicyType(p.mcc_code, v as PolicyType)}>
                      <SelectTrigger className="h-8 w-[160px] text-xs">
                        <Badge variant="outline" className={POLICY_TYPE_BADGE[p.policy_type].className}>{POLICY_TYPE_BADGE[p.policy_type].label}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTO_APPROVE">Auto Approve</SelectItem>
                        <SelectItem value="AUTO_REJECT">Auto Reject</SelectItem>
                        <SelectItem value="REQUIRES_APPROVAL">Requires Approval</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.policy_type === "AUTO_APPROVE" ? (
                      <Input
                        type="number"
                        value={p.threshold_amount ?? ""}
                        onChange={(e) => handleInlineThreshold(p.mcc_code, e.target.value)}
                        className="h-8 w-[120px] text-right text-xs ml-auto"
                        placeholder="No limit"
                        min={0}
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{p.currency}</TableCell>
                  <TableCell>
                    <Switch checked={p.active_flag} onCheckedChange={(v) => handleInlineToggle(p.mcc_code, v)} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(p.updated_at), "dd/MM/yyyy HH:mm")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-muted-foreground">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
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
                <Select value={formLevel1} onValueChange={(v) => { setFormLevel1(v); setFormLevel2(""); setForm({ ...form, category: v }); }}>
                  <SelectTrigger><SelectValue placeholder="Select expense type" /></SelectTrigger>
                  <SelectContent>
                    {getLevel1Options().map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formErrors.category && <p className="text-xs text-destructive">{formErrors.category}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Sub Expense Type <span className="text-destructive">*</span></Label>
                <Select value={formLevel2} onValueChange={(v) => { setFormLevel2(v); setForm({ ...form, description_subtype: v }); }} disabled={!formLevel1}>
                  <SelectTrigger><SelectValue placeholder={formLevel1 ? "Select sub type" : "Select expense type first"} /></SelectTrigger>
                  <SelectContent>
                    {getLevel2Options(formLevel1).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formErrors.description_subtype && <p className="text-xs text-destructive">{formErrors.description_subtype}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>MCC Code (Reference)</Label>
                <Input value={form.mcc_code_ref} onChange={(e) => setForm({ ...form, mcc_code_ref: e.target.value })} placeholder="e.g. 5812" />
              </div>
              <div className="space-y-1.5">
                <Label>MCC Code Description</Label>
                <Input value={form.mcc_code_description} onChange={(e) => setForm({ ...form, mcc_code_description: e.target.value })} placeholder="e.g. Restaurants" />
              </div>
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
            <Button onClick={handleSave}>Save</Button>
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

      {/* Bulk Import Placeholder */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Bulk Import (CSV)</DialogTitle>
            <DialogDescription>Upload policy rules via CSV file.</DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="border-2 border-dashed rounded-lg p-8 text-muted-foreground">
              <Upload className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Drop CSV file here or click to browse</p>
              <p className="text-xs mt-1">Feature coming soon</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
