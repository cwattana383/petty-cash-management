import { useState } from "react";
import { Trash2, UserCog, Plus, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EmployeePicker from "@/components/admin/EmployeePicker";
import { employeeFullName } from "@/lib/employee-directory-mock-data";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const ASSISTANT_PERMISSIONS = [
  "View Card",
  "Create Transaction",
  "Edit Transaction",
  "Submit Transaction",
  "View Statements",
  "Approve Transaction",
] as const;

export type AssistantPermission = (typeof ASSISTANT_PERMISSIONS)[number];

export interface Assistant {
  name: string;
  employeeCode: string;
  permissions: AssistantPermission[];
  validFrom: string;
  validUntil: string;
  status: "Active" | "Inactive";
}

interface Props {
  cardholderName?: string;
  assistants?: Assistant[];
  onAdd?: (assistant: Assistant) => void;
  onRemove?: (index: number) => void;
}

const SEED: Assistant[] = [
  {
    name: "test test",
    employeeCode: "3243534",
    permissions: ["View Card", "Create Transaction", "Submit Transaction"],
    validFrom: "2026-08-01",
    validUntil: "2026-12-31",
    status: "Active",
  },
];

const emptyForm: Assistant = {
  name: "",
  employeeCode: "",
  permissions: [],
  validFrom: "",
  validUntil: "",
  status: "Active",
};

function formatDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function PermissionChips({ permissions }: { permissions: AssistantPermission[] }) {
  const visible = permissions.slice(0, 2);
  const hidden = permissions.slice(2);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((p) => (
        <Badge key={p} variant="secondary" className="font-normal">
          {p}
        </Badge>
      ))}
      {hidden.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="text-xs text-muted-foreground underline underline-offset-2">
              +{hidden.length} more
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-64" align="start">
            <div className="flex flex-wrap gap-1">
              {permissions.map((p) => (
                <Badge key={p} variant="secondary" className="font-normal">
                  {p}
                </Badge>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export default function DelegatedAccessTab({ assistants, onAdd, onRemove }: Props) {
  const [internal, setInternal] = useState<Assistant[]>(SEED);
  const rows = assistants ?? internal;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Assistant>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openAdd = () => {
    setForm(emptyForm);
    setErrors({});
    setEditIndex(null);
    setDialogOpen(true);
  };

  const openEdit = (index: number) => {
    setForm(rows[index]);
    setErrors({});
    setEditIndex(index);
    setDialogOpen(true);
  };

  const togglePermission = (permission: AssistantPermission) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSave = () => {
    const next: Record<string, string> = {};
    if (!form.employeeCode) next.assistant = "Assistant is required";
    if (form.permissions.length === 0) next.permissions = "At least one permission is required";
    if (!form.validFrom) next.validFrom = "Valid From is required";
    if (form.validUntil && form.validFrom && form.validUntil < form.validFrom) {
      next.validUntil = "Valid Until cannot be earlier than Valid From";
    }
    if (!form.status) next.status = "Status is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (editIndex !== null) {
      setInternal((prev) => prev.map((row, i) => (i === editIndex ? form : row)));
    } else if (onAdd) {
      onAdd(form);
    } else {
      setInternal((prev) => [...prev, form]);
    }
    setDialogOpen(false);
  };

  const confirmRemove = () => {
    if (removeIndex === null) return;
    if (onRemove) onRemove(removeIndex);
    else setInternal((prev) => prev.filter((_, i) => i !== removeIndex));
    setRemoveIndex(null);
  };

  return (
    <Card className="p-6">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <UserCog className="h-5 w-5" style={{ color: "#DA3832" }} />
            Assistant Information
          </CardTitle>
          <Button
            type="button"
            onClick={openAdd}
            className="shrink-0 text-white hover:opacity-90"
            style={{ backgroundColor: "#DA3832" }}
          >
            <Plus className="h-4 w-4" />
            Add Assistant
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium text-muted-foreground">Assistant</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Employee Code</TableHead>
                
                <TableHead className="w-28 text-xs font-medium text-muted-foreground">Valid From</TableHead>
                <TableHead className="w-28 text-xs font-medium text-muted-foreground">Valid Until</TableHead>
                <TableHead className="w-24 text-center text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No assistants added yet. Click + Add Assistant to add one.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={`${row.employeeCode}-${index}`}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.employeeCode}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(row.validFrom)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.validUntil ? (
                        formatDate(row.validUntil)
                      ) : (
                        <span className="text-muted-foreground">No expiry</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={
                          row.status === "Active"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                            : "bg-muted text-muted-foreground hover:bg-muted"
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Edit assistant"
                        onClick={() => openEdit(index)}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove assistant"
                        onClick={() => setRemoveIndex(index)}
                      >
                        <Trash2 className="h-4 w-4" style={{ color: "#DA3832" }} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editIndex !== null ? "Edit Assistant" : "Add Assistant"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Assistant</Label>
              <EmployeePicker
                value={form.employeeCode ? `${form.name} — ${form.employeeCode}` : ""}
                onSelect={(e) =>
                  setForm((prev) => ({ ...prev, name: employeeFullName(e), employeeCode: e.employeeId }))
                }
              />
              {errors.assistant && <p className="text-xs text-destructive">{errors.assistant}</p>}
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {ASSISTANT_PERMISSIONS.map((p) => (
                  <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.permissions.includes(p)}
                      onCheckedChange={() => togglePermission(p)}
                    />
                    {p}
                  </label>
                ))}
              </div>
              {errors.permissions && <p className="text-xs text-destructive">{errors.permissions}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid-from">Valid From</Label>
                <Input
                  id="valid-from"
                  type="date"
                  value={form.validFrom}
                  onChange={(e) => setForm((prev) => ({ ...prev, validFrom: e.target.value }))}
                />
                {errors.validFrom && <p className="text-xs text-destructive">{errors.validFrom}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid-until">Valid Until</Label>
                <Input
                  id="valid-until"
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setForm((prev) => ({ ...prev, validUntil: e.target.value }))}
                />
                {errors.validUntil && <p className="text-xs text-destructive">{errors.validUntil}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as Assistant["status"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              {editIndex !== null ? "Save" : "Add Assistant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeIndex !== null} onOpenChange={(open) => !open && setRemoveIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this assistant?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
