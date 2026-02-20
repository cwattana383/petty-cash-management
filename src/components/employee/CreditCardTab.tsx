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
import { CreditCard, Plus, Pencil, Ban } from "lucide-react";
import { toast } from "sonner";
import { type CreditCard as CreditCardType, cardTypes, banks } from "./employee-types";

interface Props {
  employeeName: string;
}

const emptyCard = (name: string): Omit<CreditCardType, "id"> => ({
  cardType: "", bank: "", last4Digit: "", cardHolderName: name,
  creditLimit: 0, currency: "THB", statementCycleDay: 1,
  effectiveFrom: "", effectiveTo: "", status: "Active",
  autoReconcile: false, requireReceiptUpload: true,
});

export default function CreditCardTab({ employeeName }: Props) {
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<CreditCardType, "id">>(emptyCard(employeeName));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openAdd = () => {
    setEditId(null);
    setForm(emptyCard(employeeName));
    setErrors({});
    setOpen(true);
  };

  const openEdit = (c: CreditCardType) => {
    setEditId(c.id);
    const { id, ...rest } = c;
    setForm(rest);
    setErrors({});
    setOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!/^\d{4}$/.test(form.last4Digit)) e.last4Digit = "ต้องเป็นตัวเลข 4 หลัก";
    if (!form.cardType) e.cardType = "กรุณาเลือก";
    if (!form.bank) e.bank = "กรุณาเลือก";
    if (form.creditLimit <= 0) e.creditLimit = "ต้องมากกว่า 0";
    if (!form.effectiveFrom) e.effectiveFrom = "กรุณาระบุ";
    if (form.effectiveTo && form.effectiveTo <= form.effectiveFrom) e.effectiveTo = "ต้องมากกว่า Effective From";
    // duplicate check
    const dup = cards.find(
      (c) => c.last4Digit === form.last4Digit && c.bank === form.bank && c.id !== editId
    );
    if (dup) e.last4Digit = "บัตรนี้มีอยู่แล้ว (duplicate)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editId) {
      setCards((prev) => prev.map((c) => (c.id === editId ? { ...form, id: editId } : c)));
      toast.success("แก้ไขข้อมูลบัตรสำเร็จ");
    } else {
      if (cards.length >= 1) { toast.error("พนักงาน 1 คนมีได้ 1 บัตรเท่านั้น"); return; }
      setCards((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
      toast.success("เพิ่มบัตรสำเร็จ");
    }
    setOpen(false);
  };

  const deactivate = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: "Inactive" } : c)));
    toast.success("Deactivate บัตรสำเร็จ");
  };

  const set = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-5 w-5 text-primary" />
          Credit Card Information
        </CardTitle>
        <Button size="sm" onClick={openAdd} disabled={cards.length >= 1}>
          <Plus className="h-4 w-4 mr-1" /> Add Credit Card
        </Button>
      </CardHeader>
      <CardContent>
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีข้อมูลบัตร กดปุ่ม + Add Credit Card เพื่อเพิ่ม</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card Type</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Last 4 Digit</TableHead>
                <TableHead className="text-right">Credit Limit</TableHead>
                <TableHead>Cycle Day</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Effective To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.cardType}</TableCell>
                  <TableCell>{c.bank}</TableCell>
                  <TableCell>•••• {c.last4Digit}</TableCell>
                  <TableCell className="text-right">{c.creditLimit.toLocaleString()} {c.currency}</TableCell>
                  <TableCell>{c.statementCycleDay}</TableCell>
                  <TableCell>{c.effectiveFrom}</TableCell>
                  <TableCell>{c.effectiveTo || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "Active" ? "default" : "secondary"}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deactivate(c.id)} disabled={c.status === "Inactive"}><Ban className="h-4 w-4" /></Button>
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
            <DialogTitle>{editId ? "Edit" : "Add"} Credit Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Card Type <span className="text-destructive">*</span></Label>
                <Select value={form.cardType} onValueChange={(v) => set("cardType", v)}>
                  <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                  <SelectContent>{cardTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                {errors.cardType && <p className="text-xs text-destructive">{errors.cardType}</p>}
              </div>
              <div className="space-y-1">
                <Label>Bank <span className="text-destructive">*</span></Label>
                <Select value={form.bank} onValueChange={(v) => set("bank", v)}>
                  <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                  <SelectContent>{banks.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
                {errors.bank && <p className="text-xs text-destructive">{errors.bank}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Last 4 Digit <span className="text-destructive">*</span></Label>
                <Input maxLength={4} value={form.last4Digit} onChange={(e) => { if (/^\d{0,4}$/.test(e.target.value)) set("last4Digit", e.target.value); }} placeholder="0000" />
                {errors.last4Digit && <p className="text-xs text-destructive">{errors.last4Digit}</p>}
              </div>
              <div className="space-y-1">
                <Label>Card Holder Name</Label>
                <Input value={form.cardHolderName} onChange={(e) => set("cardHolderName", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Credit Limit <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.creditLimit || ""} onChange={(e) => set("creditLimit", Number(e.target.value))} />
                {errors.creditLimit && <p className="text-xs text-destructive">{errors.creditLimit}</p>}
              </div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <Input value={form.currency} onChange={(e) => set("currency", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Statement Cycle Day</Label>
                <Input type="number" min={1} max={31} value={form.statementCycleDay} onChange={(e) => set("statementCycleDay", Number(e.target.value))} />
              </div>
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
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Auto Reconcile</Label>
              <Switch checked={form.autoReconcile} onCheckedChange={(v) => set("autoReconcile", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Receipt Upload</Label>
              <Switch checked={form.requireReceiptUpload} onCheckedChange={(v) => set("requireReceiptUpload", v)} />
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
