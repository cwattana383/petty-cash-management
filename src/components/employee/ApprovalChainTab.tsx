import { useState, useEffect } from "react";
import { formatBEDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "@/hooks/use-toast";
import type { ApprovalLevel } from "./employee-types";
import { useApprovers } from "@/hooks/use-employees";

const emptyLevel = (): Omit<ApprovalLevel, "id"> => ({
  approverId: "", effectiveFrom: "", effectiveTo: "", status: true,
});

interface ApprovalChainTabProps {
  onLevelsChange?: (levels: Omit<ApprovalLevel, "id">[]) => void;
  initialLevels?: ApprovalLevel[];
  readOnly?: boolean;
}

export default function ApprovalChainTab({ onLevelsChange, initialLevels, readOnly }: ApprovalChainTabProps) {
  const { data: approvers } = useApprovers();
  const [levels, setLevels] = useState<ApprovalLevel[]>([]);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (initialLevels && initialLevels.length > 0 && !initialised) {
      setLevels(initialLevels);
      setInitialised(true);
    }
  }, [initialLevels, initialised]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ApprovalLevel, "id">>(emptyLevel());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openAdd = () => {
    setEditId(null);
    setForm(emptyLevel());
    setErrors({});
    setOpen(true);
  };

  const toDateInput = (v: string | undefined | null): string => {
    if (!v) return "";
    // Handle ISO datetime strings like "2026-03-01T00:00:00.000Z" → "2026-03-01"
    return v.length > 10 ? v.slice(0, 10) : v;
  };

  const openEdit = (l: ApprovalLevel) => {
    setEditId(l.id);
    const { id, ...rest } = l;
    setForm({
      ...rest,
      effectiveFrom: toDateInput(rest.effectiveFrom),
      effectiveTo: toDateInput(rest.effectiveTo),
    });
    setErrors({});
    setOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.approverId) e.approverId = "Please select an Approver";
    if (!form.effectiveFrom) e.effectiveFrom = "Required";
    if (form.effectiveTo && form.effectiveTo <= form.effectiveFrom) e.effectiveTo = "Must be after Effective From";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    let updated: ApprovalLevel[];
    if (editId) {
      updated = levels.map((l) => (l.id === editId ? { ...form, id: editId } : l));
      toast({ title: "Success", description: "Approval level updated successfully" });
    } else {
      updated = [...levels, { ...form, id: crypto.randomUUID() }];
      toast({ title: "Success", description: "Approval level added successfully" });
    }
    setLevels(updated);
    onLevelsChange?.(updated.map(({ id, ...rest }) => rest));
    setOpen(false);
  };

  const remove = (id: string) => {
    const updated = levels.filter((l) => l.id !== id);
    setLevels(updated);
    onLevelsChange?.(updated.map(({ id: _id, ...rest }) => rest));
    toast({ title: "Success", description: "Approval level deleted successfully" });
  };

  const set = (field: string, value: unknown) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Approval Information
        </CardTitle>
        {!readOnly && levels.length < 1 && (
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add Approver
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {levels.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {readOnly ? "No Approval Information" : "No Approval Information yet. Click + Add Approver to add one"}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Approver</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Effective To</TableHead>
                <TableHead>Status</TableHead>
                {!readOnly && <TableHead>Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{approvers?.find((a) => a.id === l.approverId)?.name || l.approverId || "-"}</TableCell>
                  <TableCell>{l.effectiveFrom ? formatBEDate(l.effectiveFrom) : "-"}</TableCell>
                  <TableCell>{l.effectiveTo ? formatBEDate(l.effectiveTo) : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={l.status ? "default" : "secondary"}>{l.status ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  {!readOnly && (
                    <TableCell className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined} className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit" : "Add"} Approval Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Approver <span className="text-destructive">*</span></Label>
              <Select value={form.approverId} onValueChange={(v) => set("approverId", v)}>
                <SelectTrigger><SelectValue placeholder="Select Approver" /></SelectTrigger>
                <SelectContent>
                  {(approvers ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.approverId && <p className="text-xs text-destructive">{errors.approverId}</p>}
            </div>
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
              <Switch checked={form.status} onCheckedChange={(v) => set("status", v)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
