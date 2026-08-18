import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Mail, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  AlertDialogDescription,
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
import { cn } from "@/lib/utils";

export interface DelegatedAssistant {
  name: string;
  email: string;
  permissions: string[];
  validFrom: string;
  validUntil: string;
  status: "Active" | "Expired" | "Revoked";
}

const PERMISSION_OPTIONS = [
  "View card",
  "Create transaction",
  "Edit transaction",
  "Submit transaction",
  "View statements",
  "Approve transaction",
];

const SEED: DelegatedAssistant[] = [
  {
    name: "Sarah Lee",
    email: "sarah.lee@cpaxtra.co.th",
    permissions: ["View card", "Create txn", "Submit"],
    validFrom: "01/06/2026",
    validUntil: "31/12/2026",
    status: "Active",
  },
  {
    name: "Nid Suwannapha",
    email: "nid.suwannapha@cpaxtra.co.th",
    permissions: ["View card", "View statements"],
    validFrom: "01/01/2026",
    validUntil: "30/06/2026",
    status: "Expired",
  },
];

const statusClasses: Record<DelegatedAssistant["status"], string> = {
  Active: "border-emerald-500 bg-emerald-50 text-emerald-700",
  Expired: "border-gray-300 bg-gray-100 text-gray-600",
  Revoked: "border-red-400 bg-red-50 text-red-600",
};

function parseDMY(value: string): Date | undefined {
  const [d, m, y] = value.split("/").map(Number);
  if (!d || !m || !y) return undefined;
  return new Date(y, m - 1, d);
}

const toDMY = (date: Date) => format(date, "dd/MM/yyyy");

interface DateFieldProps {
  value: string;
  onChange: (val: string) => void;
}

function DateField({ value, onChange }: DateFieldProps) {
  const selected = value ? parseDMY(value) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value || "DD/MM/YYYY"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => d && onChange(toDMY(d))}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

interface Props {
  cardholderName?: string;
}

export default function DelegatedAccessTab({ cardholderName = "the cardholder" }: Props) {
  const [rows, setRows] = useState<DelegatedAssistant[]>(SEED);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [revokeIndex, setRevokeIndex] = useState<number | null>(null);
  const [viewOnly, setViewOnly] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    permissions: [] as string[],
    validFrom: "",
    validUntil: "",
    notify: true,
  });

  const openAdd = () => {
    setEditIndex(null);
    setViewOnly(false);
    setForm({ name: "", email: "", permissions: [], validFrom: "", validUntil: "", notify: true });
    setDialogOpen(true);
  };

  const openEdit = (index: number, opts?: { renew?: boolean; view?: boolean }) => {
    const row = rows[index];
    setEditIndex(index);
    setViewOnly(!!opts?.view);
    setForm({
      name: row.name,
      email: row.email,
      permissions: row.permissions,
      validFrom: opts?.renew ? toDMY(new Date()) : row.validFrom,
      validUntil: row.validUntil,
      notify: true,
    });
    setDialogOpen(true);
  };

  const togglePermission = (perm: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleSubmit = () => {
    const entry: DelegatedAssistant = {
      name: form.name,
      email: form.email,
      permissions: form.permissions,
      validFrom: form.validFrom,
      validUntil: form.validUntil,
      status: "Active",
    };
    setRows((prev) =>
      editIndex === null ? [...prev, entry] : prev.map((r, i) => (i === editIndex ? entry : r)),
    );
    setDialogOpen(false);
  };

  const confirmRevoke = () => {
    if (revokeIndex === null) return;
    setRows((prev) => prev.map((r, i) => (i === revokeIndex ? { ...r, status: "Revoked" } : r)));
    setRevokeIndex(null);
  };

  return (
    <Card style={{ borderWidth: "2px", borderColor: "rgba(48,111,199,0.4)" }}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Delegated Access — Assistants
              <span className="inline-flex items-center rounded-full bg-[#306FC7] px-2 py-0.5 text-[11px] font-semibold text-white">
                NEW
              </span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Assistants act under their own login. Every transaction they create records {cardholderName} as
              cardholder and the assistant as performer.
            </p>
          </div>
          <Button type="button" onClick={openAdd} className="bg-[#306FC7] hover:bg-[#2a62b0] text-white shrink-0">
            + Add Assistant
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assistant</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Valid from</TableHead>
              <TableHead>Valid until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={`${row.email}-${index}`}>
                <TableCell>
                  <div className="font-medium text-foreground">{row.name}</div>
                  <div className="text-xs text-muted-foreground">{row.email}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {row.permissions.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">{row.validFrom}</TableCell>
                <TableCell className="whitespace-nowrap">{row.validUntil}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      statusClasses[row.status],
                    )}
                  >
                    {row.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 text-sm">
                    {row.status === "Active" && (
                      <>
                        <button type="button" className="text-[#306FC7] hover:underline" onClick={() => openEdit(index)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-destructive hover:underline"
                          onClick={() => setRevokeIndex(index)}
                        >
                          Revoke
                        </button>
                      </>
                    )}
                    {row.status === "Expired" && (
                      <>
                        <button
                          type="button"
                          className="text-[#306FC7] hover:underline"
                          onClick={() => openEdit(index, { renew: true })}
                        >
                          Renew
                        </button>
                        <button
                          type="button"
                          className="text-muted-foreground hover:underline"
                          onClick={() => openEdit(index, { view: true })}
                        >
                          View
                        </button>
                      </>
                    )}
                    {row.status === "Revoked" && (
                      <button
                        type="button"
                        className="text-muted-foreground hover:underline"
                        onClick={() => openEdit(index, { view: true })}
                      >
                        View
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          Email notification is sent to the assistant automatically when access is granted, edited, or revoked, and
          again 7 days before expiry.
        </p>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editIndex === null ? "Add Assistant" : "Edit Assistant"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assistant-name">Assistant</Label>
              <Input
                id="assistant-name"
                value={form.name}
                disabled={viewOnly}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
              <Input
                id="assistant-email"
                type="email"
                value={form.email}
                disabled={viewOnly}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {PERMISSION_OPTIONS.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.permissions.includes(perm)}
                      disabled={viewOnly}
                      onCheckedChange={() => togglePermission(perm)}
                    />
                    {perm}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid from</Label>
                <DateField value={form.validFrom} onChange={(v) => setForm((p) => ({ ...p, validFrom: v }))} />
              </div>
              <div className="space-y-2">
                <Label>Valid until</Label>
                <DateField value={form.validUntil} onChange={(v) => setForm((p) => ({ ...p, validUntil: v }))} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.notify}
                disabled={viewOnly}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, notify: checked }))}
              />
              <Label>Notify assistant by email</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            {!viewOnly && (
              <Button type="button" onClick={handleSubmit}>
                Save
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={revokeIndex !== null} onOpenChange={(open) => !open && setRevokeIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access</AlertDialogTitle>
            <AlertDialogDescription>
              Revoke {revokeIndex !== null ? rows[revokeIndex].name : ""}'s access to this card?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevoke}>Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
