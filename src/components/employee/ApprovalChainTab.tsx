import { useState } from "react";
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
import { toast } from "sonner";
import { type ApprovalLevel } from "./employee-types";

const mockApprovers = [
  { id: "2", name: "Somying Rakdee" },
  { id: "3", name: "Prawit Munkong" },
  { id: "5", name: "Anan Sodsai" },
];

interface Props {
  onLevelsChange?: (levels: ApprovalLevel[]) => void;
  initialLevels?: ApprovalLevel[];
  readOnly?: boolean;
}

export default function ApprovalChainTab({ onLevelsChange, initialLevels, readOnly }: Props) {
  const [levels, setLevels] = useState<ApprovalLevel[]>(initialLevels ?? []);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formApproverId, setFormApproverId] = useState("");
  const [formFrom, setFormFrom] = useState("");
  const [formTo, setFormTo] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateParent = (next: ApprovalLevel[]) => {
    setLevels(next);
    onLevelsChange?.(next);
  };

  const resolveApproverName = (id: string) =>
    mockApprovers.find((a) => a.id === id)?.name ?? id;

  const openAdd = () => {
    if (levels.length >= 1) return;
    setEditId(null);
    setFormApproverId("");
    setFormFrom("");
    setFormTo("");
    setFormActive(true);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (l: ApprovalLevel) => {
    setEditId(l.id);
    setFormApproverId(l.approverId);
    setFormFrom(l.effectiveFrom);
    setFormTo(l.effectiveTo);
    setFormActive(l.status);
    setErrors({});
    setOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formApproverId) e.approverId = "Please select an Approver";
    if (!formFrom) e.effectiveFrom = "Please specify";
    if (formTo && formTo <= formFrom) e.effectiveTo = "Must be after Effective From";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editId) {
      const next = levels.map((l) =>
        l.id === editId
          ? { ...l, approverId: formApproverId, effectiveFrom: formFrom, effectiveTo: formTo, status: formActive }
          : l
      );
      updateParent(next);
      toast.success("Approval Level updated successfully");
    } else {
      const next = [...levels, { id: crypto.randomUUID(), approverId: formApproverId, effectiveFrom: formFrom, effectiveTo: formTo, status: formActive }];
      updateParent(next);
      toast.success("Approval Level added successfully");
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    const next = levels.filter((l) => l.id !== id);
    updateParent(next);
    toast.success("Approval Level deleted successfully");
  };

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
          <p className="text-sm text-muted-foreground text-center py-8">No Approval Information yet. Click + Add Approver to add.</p>
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
                  <TableCell>{resolveApproverName(l.approverId)}</TableCell>
                  <TableCell>{l.effectiveFrom}</TableCell>
                  <TableCell>{l.effectiveTo || "-"}</TableCell>
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

      {!readOnly && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit" : "Add"} Approval Level</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Approver <span className="text-destructive">*</span></Label>
                <Select value={formApproverId} onValueChange={setFormApproverId}>
                  <SelectTrigger><SelectValue placeholder="Select Approver" /></SelectTrigger>
                  <SelectContent>
                    {mockApprovers.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.approverId && <p className="text-xs text-destructive">{errors.approverId}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Effective From <span className="text-destructive">*</span></Label>
                  <Input type="date" value={formFrom} onChange={(e) => setFormFrom(e.target.value)} />
                  {errors.effectiveFrom && <p className="text-xs text-destructive">{errors.effectiveFrom}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Effective To</Label>
                  <Input type="date" value={formTo} onChange={(e) => setFormTo(e.target.value)} />
                  {errors.effectiveTo && <p className="text-xs text-destructive">{errors.effectiveTo}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={formActive} onCheckedChange={setFormActive} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
