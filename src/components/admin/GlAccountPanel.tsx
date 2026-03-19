import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, Pencil, Trash2, Upload, Download, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GlAccountRow {
  id: string;
  expenseType: string;
  accountCode: string;
  accountName: string;
  active: boolean;
  updatedAt: string;
}

const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

const expenseTypeOptions = [
  "ค่าเดินทาง, ค่าที่พัก",
  "สวัสดิการพนักงาน",
  "ภาษีที่ดินและสิ่งปลูกสร้าง",
  "ภาษีป้าย",
  "ค่าสาธารณูปโภค",
  "ค่าน้ำดิบ, น้ำบาดาล",
  "ค่าสายตรวจตู้แดง",
  "ค่าขนส่งสินค้า",
  "ค่าน้ำมันรถโฟลค์ลิฟ",
  "Store Supplies",
  "ค่าใช้จ่ายเกี่ยวกับส่งเสริมการขาย",
  "ค่าทนาย",
  "ค่าใช้จ่ายเกี่ยวกับไหว้ศาลพระพรหม",
  "ค่าซักเสื้อโค้ทห้องเย็น",
];

const initialData: GlAccountRow[] = [
  { id: "1", expenseType: "ค่าเดินทาง, ค่าที่พัก", accountCode: "5101001", accountName: "Local Travelling", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "2", expenseType: "ค่าเดินทาง, ค่าที่พัก", accountCode: "5101002", accountName: "Pre-op General Exps", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "3", expenseType: "สวัสดิการพนักงาน", accountCode: "5201001", accountName: "Staff Meeting and Refreshment", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "4", expenseType: "สวัสดิการพนักงาน", accountCode: "5201002", accountName: "Other Personnel Cost-Recruitment", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "5", expenseType: "สวัสดิการพนักงาน", accountCode: "5201003", accountName: "Other Personnel Cost-Other", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "6", expenseType: "ภาษีที่ดินและสิ่งปลูกสร้าง", accountCode: "5301001", accountName: "Establishment Cost - Land and Building Tax", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "7", expenseType: "ภาษีป้าย", accountCode: "5301002", accountName: "Advertisement-Signboard Tax", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "8", expenseType: "ค่าสาธารณูปโภค", accountCode: "5401001", accountName: "Establish.Cost-Sewage Charge", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "9", expenseType: "ค่าน้ำดิบ, น้ำบาดาล", accountCode: "5401002", accountName: "Establish.Cost-Water", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "10", expenseType: "ค่าสายตรวจตู้แดง", accountCode: "5401003", accountName: "Establish.Cost-Security", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "11", expenseType: "ค่าขนส่งสินค้า", accountCode: "5501001", accountName: "Other Income - Delivery Cost", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "12", expenseType: "ค่าน้ำมันรถโฟลค์ลิฟ", accountCode: "5501002", accountName: "Store Suppliers-Fuel Forklift", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "13", expenseType: "Store Supplies", accountCode: "5601001", accountName: "Store Supplies", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "14", expenseType: "ค่าใช้จ่ายเกี่ยวกับส่งเสริมการขาย", accountCode: "5701001", accountName: "Other Sales Promotion - Store Decoration", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "15", expenseType: "ค่าทนาย", accountCode: "5801001", accountName: "Legal Fee", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "16", expenseType: "ค่าใช้จ่ายเกี่ยวกับไหว้ศาลพระพรหม", accountCode: "5901001", accountName: "Other non-deductible expenses", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "17", expenseType: "ค่าซักเสื้อโค้ทห้องเย็น", accountCode: "5901002", accountName: "Other General Exp-Others", active: true, updatedAt: "2026-03-01 10:00:00" },
];

let nextId = 18;

export default function GlAccountPanel() {
  const { toast } = useToast();
  const [data, setData] = useState<GlAccountRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<GlAccountRow | null>(null);
  const [formExpenseType, setFormExpenseType] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formActive, setFormActive] = useState(true);

  const [importOpen, setImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{ expenseType: string; accountCode: string; accountName: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.accountCode.toLowerCase().includes(q) || r.accountName.toLowerCase().includes(q)
      );
    }
    if (statusFilter === "active") list = list.filter((r) => r.active);
    if (statusFilter === "inactive") list = list.filter((r) => !r.active);
    return list;
  }, [data, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditingRow(null);
    setFormExpenseType("");
    setFormCode("");
    setFormName("");
    setFormActive(true);
    setModalOpen(true);
  };

  const openEdit = (row: GlAccountRow) => {
    setEditingRow(row);
    setFormExpenseType(row.expenseType);
    setFormCode(row.accountCode);
    setFormName(row.accountName);
    setFormActive(row.active);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formExpenseType || !formCode.trim() || !formName.trim()) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    const ts = now();
    if (editingRow) {
      setData((prev) =>
        prev.map((r) =>
          r.id === editingRow.id
            ? { ...r, expenseType: formExpenseType, accountCode: formCode.trim(), accountName: formName.trim(), active: formActive, updatedAt: ts }
            : r
        )
      );
      toast({ title: "Updated", description: "GL account updated successfully." });
    } else {
      const newRow: GlAccountRow = {
        id: String(nextId++),
        expenseType: formExpenseType,
        accountCode: formCode.trim(),
        accountName: formName.trim(),
        active: formActive,
        updatedAt: ts,
      };
      setData((prev) => [...prev, newRow]);
      toast({ title: "Created", description: "GL account added successfully." });
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Deleted", description: "GL account removed." });
  };

  const handleToggle = (id: string, checked: boolean) => {
    setData((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: checked, updatedAt: now() } : r))
    );
  };

  const downloadTemplate = () => {
    const csv = "expense_type,account_code,account_name\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gl_account_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const rows = lines.slice(1).map((line) => {
        const [expenseType = "", accountCode = "", accountName = ""] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        return { expenseType, accountCode, accountName };
      }).filter((r) => r.expenseType && r.accountCode && r.accountName);
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    const ts = now();
    const newRows: GlAccountRow[] = csvPreview.map((r) => ({
      id: String(nextId++),
      expenseType: r.expenseType,
      accountCode: r.accountCode,
      accountName: r.accountName,
      active: true,
      updatedAt: ts,
    }));
    setData((prev) => [...prev, ...newRows]);
    toast({ title: "Imported", description: `${newRows.length} GL accounts imported.` });
    setCsvPreview([]);
    setImportOpen(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">GL Account</h2>
          <p className="text-sm text-muted-foreground">
            Manage GL account codes and their mapped expense types.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { setCsvPreview([]); setImportOpen(true); }}>
            <Upload className="h-4 w-4 mr-2" />Import CSV
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />Add GL Account
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search account code or account name..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense Type</TableHead>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No GL accounts found
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.expenseType}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.accountCode}</code></TableCell>
                  <TableCell>{row.accountName}</TableCell>
                  <TableCell>
                    <Switch
                      checked={row.active}
                      onCheckedChange={(checked) => handleToggle(row.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(row)} title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(row.id)} title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
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
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">{page} / {totalPages}</span>
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit GL Account" : "Add GL Account"}</DialogTitle>
            <DialogDescription>
              {editingRow ? "Update the GL account details below." : "Fill in the details to create a new GL account."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Expense Type <span className="text-destructive">*</span></Label>
              <Select value={formExpenseType} onValueChange={setFormExpenseType}>
                <SelectTrigger><SelectValue placeholder="Select expense type" /></SelectTrigger>
                <SelectContent>
                  {expenseTypeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountCode">Account Code <span className="text-destructive">*</span></Label>
              <Input id="accountCode" value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="e.g. 5101001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name <span className="text-destructive">*</span></Label>
              <Input id="accountName" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Local Travelling" />
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="activeToggle">Active</Label>
              <Switch id="activeToggle" checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import GL Accounts from CSV</DialogTitle>
            <DialogDescription>Upload a CSV file to bulk-import GL accounts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />Download Template
            </Button>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="gl-csv-upload"
              />
              <label htmlFor="gl-csv-upload" className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <span>Click to upload or drag & drop a CSV file</span>
              </label>
            </div>

            {csvPreview.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{csvPreview.length} rows parsed</p>
                <div className="max-h-48 overflow-auto border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expense Type</TableHead>
                        <TableHead>Account Code</TableHead>
                        <TableHead>Account Name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{r.expenseType}</TableCell>
                          <TableCell className="text-sm">{r.accountCode}</TableCell>
                          <TableCell className="text-sm">{r.accountName}</TableCell>
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
            <Button onClick={confirmImport} disabled={csvPreview.length === 0}>
              Confirm Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
