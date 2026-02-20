import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldCheck, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  type ApprovalLevel,
  approvalTypes, approverTypes, conditionTypes, expenseCategoryOptions,
} from "./employee-types";

const mockApprovers = ["สมชาย ใจดี", "สมหญิง รักดี", "ประวิทย์ มั่นคง", "วิภา สุขใจ", "อนันต์ สดใส"];

const emptyLevel = (seq: number): Omit<ApprovalLevel, "id"> => ({
  level: seq, approvalType: "Both", approverType: "Direct Manager",
  approverName: "", backupApprover: "", conditionType: "Always",
  amountFrom: 0, amountTo: 0, expenseCategories: [],
  effectiveFrom: "", effectiveTo: "", active: true,
  parallelApproval: false, requireAllApprovers: false,
});

export default function ApprovalChainTab() {
  const [levels, setLevels] = useState<ApprovalLevel[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ApprovalLevel, "id">>(emptyLevel(1));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nextLevel = () => (levels.length > 0 ? Math.max(...levels.map((l) => l.level)) + 1 : 1);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyLevel(nextLevel()));
    setErrors({});
    setOpen(true);
  };

  const openEdit = (l: ApprovalLevel) => {
    setEditId(l.id);
    const { id, ...rest } = l;
    setForm(rest);
    setErrors({});
    setOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.approverName && form.approverType === "Specific User") e.approverName = "กรุณาเลือก Approver";
    if (!form.effectiveFrom) e.effectiveFrom = "กรุณาระบุ";
    if (form.effectiveTo && form.effectiveTo <= form.effectiveFrom) e.effectiveTo = "ต้องมากกว่า Effective From";
    if (form.conditionType === "Amount Threshold") {
      if (form.amountFrom > form.amountTo && form.amountTo > 0) e.amountFrom = "Amount From ต้อง <= Amount To";
    }
    const dup = levels.find((l) => l.level === form.level && l.id !== editId);
    if (dup) e.level = "Level ซ้ำ";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editId) {
      setLevels((prev) => prev.map((l) => (l.id === editId ? { ...form, id: editId } : l)));
      toast.success("แก้ไข Approval Level สำเร็จ");
    } else {
      setLevels((prev) => [...prev, { ...form, id: crypto.randomUUID() }].sort((a, b) => a.level - b.level));
      toast.success("เพิ่ม Approval Level สำเร็จ");
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    setLevels((prev) => prev.filter((l) => l.id !== id));
    toast.success("ลบ Approval Level สำเร็จ");
  };

  const set = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const toggleCategory = (cat: string) => {
    setForm((p) => ({
      ...p,
      expenseCategories: p.expenseCategories.includes(cat)
        ? p.expenseCategories.filter((c) => c !== cat)
        : [...p.expenseCategories, cat],
    }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Approval Chain
        </CardTitle>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Approval Level
        </Button>
      </CardHeader>
      <CardContent>
        {levels.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มี Approval Chain กดปุ่ม + Add Approval Level เพื่อเพิ่ม</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Approval Type</TableHead>
                <TableHead>Approver Type</TableHead>
                <TableHead>Approver</TableHead>
                <TableHead>Backup</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Effective To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.level}</TableCell>
                  <TableCell>{l.approvalType}</TableCell>
                  <TableCell>{l.approverType}</TableCell>
                  <TableCell>{l.approverName || "-"}</TableCell>
                  <TableCell>{l.backupApprover || "-"}</TableCell>
                  <TableCell>
                    {l.conditionType === "Amount Threshold"
                      ? `${l.amountFrom.toLocaleString()} - ${l.amountTo.toLocaleString()}`
                      : l.conditionType}
                  </TableCell>
                  <TableCell>{l.effectiveFrom}</TableCell>
                  <TableCell>{l.effectiveTo || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={l.active ? "default" : "secondary"}>{l.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit" : "Add"} Approval Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Approval Type</Label>
                <Select value={form.approvalType} onValueChange={(v) => set("approvalType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{approvalTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Level</Label>
                <Input type="number" min={1} value={form.level} onChange={(e) => set("level", Number(e.target.value))} />
                {errors.level && <p className="text-xs text-destructive">{errors.level}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Approver Type</Label>
                <Select value={form.approverType} onValueChange={(v) => set("approverType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{approverTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Approver {form.approverType === "Specific User" && <span className="text-destructive">*</span>}</Label>
                <Select value={form.approverName} onValueChange={(v) => set("approverName", v)}>
                  <SelectTrigger><SelectValue placeholder="เลือก Approver" /></SelectTrigger>
                  <SelectContent>{mockApprovers.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                </Select>
                {errors.approverName && <p className="text-xs text-destructive">{errors.approverName}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Backup Approver</Label>
              <Select value={form.backupApprover} onValueChange={(v) => set("backupApprover", v)}>
                <SelectTrigger><SelectValue placeholder="เลือก (optional)" /></SelectTrigger>
                <SelectContent>{mockApprovers.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Condition Type</Label>
              <Select value={form.conditionType} onValueChange={(v) => set("conditionType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{conditionTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.conditionType === "Amount Threshold" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Amount From</Label>
                  <Input type="number" value={form.amountFrom || ""} onChange={(e) => set("amountFrom", Number(e.target.value))} />
                  {errors.amountFrom && <p className="text-xs text-destructive">{errors.amountFrom}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Amount To</Label>
                  <Input type="number" value={form.amountTo || ""} onChange={(e) => set("amountTo", Number(e.target.value))} />
                </div>
              </div>
            )}
            {form.conditionType === "Category Based" && (
              <div className="space-y-2">
                <Label>Expense Categories</Label>
                <div className="grid grid-cols-2 gap-2">
                  {expenseCategoryOptions.map((cat) => (
                    <div key={cat} className="flex items-center gap-2">
                      <Checkbox
                        checked={form.expenseCategories.includes(cat)}
                        onCheckedChange={() => toggleCategory(cat)}
                      />
                      <span className="text-sm">{cat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Effective From <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.effectiveFrom} onChange={(e) => set("effectiveFrom", e.target.value)} />
                {errors.effectiveFrom && <p className="text-xs text-destructive">{errors.effectiveFrom}</p>}
              </div>
              <div className="space-y-1">
                <Label>Effective To</Label>
                <Input type="date" value={form.effectiveTo} onChange={(e) => set("effectiveTo", e.target.value)} />
                {errors.effectiveTo && <p className="text-xs text-destructive">{errors.effectiveTo}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Parallel Approval</Label>
              <Switch checked={form.parallelApproval} onCheckedChange={(v) => set("parallelApproval", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require All Approvers</Label>
              <Switch checked={form.requireAllApprovers} onCheckedChange={(v) => set("requireAllApprovers", v)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
