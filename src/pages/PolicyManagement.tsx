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

const POLICY_TYPE_BADGE: Record<PolicyType, { label: string; className: string }> = {
  AUTO_APPROVE: { label: "Auto Approve", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  AUTO_REJECT: { label: "Auto Reject", className: "bg-red-100 text-red-800 border-red-200" },
  REQUIRES_APPROVAL: { label: "Requires Approval", className: "bg-amber-100 text-amber-800 border-amber-200" },
};

const PAGE_SIZE = 20;

const emptyPolicy: MccPolicyMaster = {
  mcc_code: "", description: "", category: "", policy_type: "AUTO_APPROVE",
  threshold_amount: null, currency: "THB", active_flag: true, updated_at: new Date().toISOString(),
};

export default function PolicyManagement() {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<MccPolicyMaster[]>([...mockMccPolicies]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<MccPolicyMaster | null>(null);
  const [form, setForm] = useState<MccPolicyMaster>({ ...emptyPolicy });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Bulk import
  const [bulkOpen, setBulkOpen] = useState(false);

  const filtered = useMemo(() => {
    let data = [...policies];
    if (activeFilter === "active") data = data.filter((p) => p.active_flag);
    else if (activeFilter === "inactive") data = data.filter((p) => !p.active_flag);
    if (search) {
      const s = search.toLowerCase();
      data = data.filter((p) => p.mcc_code.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
    }
    data.sort((a, b) => a.mcc_code.localeCompare(b.mcc_code));
    return data;
  }, [policies, activeFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setEditingPolicy(null);
    setForm({ ...emptyPolicy, updated_at: new Date().toISOString() });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (p: MccPolicyMaster) => {
    setEditingPolicy(p);
    setForm({ ...p });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.mcc_code.trim()) errors.mcc_code = "Required";
    if (!editingPolicy && policies.some((p) => p.mcc_code === form.mcc_code.trim())) errors.mcc_code = "MCC Code already exists";
    if (!form.description.trim()) errors.description = "Required";
    if (form.policy_type === "AUTO_APPROVE" && form.threshold_amount !== null && form.threshold_amount <= 0)
      errors.threshold_amount = "Must be > 0";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    const now = new Date().toISOString();
    const updated = { ...form, mcc_code: form.mcc_code.trim(), updated_at: now };
    if (form.policy_type !== "AUTO_APPROVE") updated.threshold_amount = null;

    if (editingPolicy) {
      setPolicies((prev) => prev.map((p) => (p.mcc_code === editingPolicy.mcc_code ? updated : p)));
      toast({ title: "Policy Updated", description: `MCC ${updated.mcc_code} saved.` });
    } else {
      setPolicies((prev) => [...prev, updated]);
      toast({ title: "Policy Added", description: `MCC ${updated.mcc_code} created.` });
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setPolicies((prev) => prev.filter((p) => p.mcc_code !== deleteTarget));
    toast({ title: "Policy Deleted", description: `MCC ${deleteTarget} removed.` });
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
        <p className="text-sm text-muted-foreground">Maintain MCC-based rules for Auto Approve / Auto Reject / Requires Approval.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search MCC code or description" className="pl-7 h-9 text-sm" />
        </div>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-3.5 w-3.5" />Add MCC Policy</Button>
        {/* Bulk Import button removed */}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MCC Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Policy Type</TableHead>
                <TableHead className="text-right">Threshold Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No policies found.</TableCell></TableRow>
              ) : paged.map((p) => (
                <TableRow key={p.mcc_code}>
                  <TableCell className="font-mono font-medium">{p.mcc_code}</TableCell>
                  <TableCell>{p.description}</TableCell>
                  <TableCell>{p.category}</TableCell>
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
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(p.mcc_code)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? "Edit MCC Policy" : "Add MCC Policy"}</DialogTitle>
            <DialogDescription>{editingPolicy ? `Editing policy for MCC ${editingPolicy.mcc_code}` : "Create a new MCC policy rule."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>MCC Code</Label>
              <Input value={form.mcc_code} onChange={(e) => setForm({ ...form, mcc_code: e.target.value })} disabled={!!editingPolicy} placeholder="e.g. 5812" />
              {formErrors.mcc_code && <p className="text-xs text-destructive">{formErrors.mcc_code}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Eating Places/Restaurants" />
              {formErrors.description && <p className="text-xs text-destructive">{formErrors.description}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Meals & Entertainment" />
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
                <Label>Threshold Amount (THB)</Label>
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
            <AlertDialogTitle>Delete MCC Policy</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete MCC policy {deleteTarget}?</AlertDialogDescription>
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
            <DialogDescription>Upload MCC policy master records via CSV file.</DialogDescription>
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
