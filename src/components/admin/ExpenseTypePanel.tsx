import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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

interface ExpenseTypeRow {
  id: string;
  groupingTh: string;
  accountNameEn: string;
  active: boolean;
  updatedAt: string;
}

const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

const initialData: ExpenseTypeRow[] = [
  { id: "1", groupingTh: "ภาษีที่ดินและสิ่งปลูกสร้าง", accountNameEn: "Establishment Cost - Land and Building Tax", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "2", groupingTh: "ภาษีป้าย", accountNameEn: "Advertisement-Signboard Tax", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "3", groupingTh: "ค่าขนส่งสินค้า", accountNameEn: "Other Income - Delivery Cost", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "4", groupingTh: "ค่าน้ำมันรถโฟลค์ลิฟ", accountNameEn: "Store Suppliers-Fuel Forklift", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "5", groupingTh: "ค่าสาธารณูปโภค", accountNameEn: "Establish.Cost-Sewage Charge", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "6", groupingTh: "ค่าเดินทาง, ค่าที่พัก", accountNameEn: "Local Travelling", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "7", groupingTh: "Store Supplies", accountNameEn: "Store Supplies", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "8", groupingTh: "สวัสดิการพนักงาน", accountNameEn: "Staff Meeting and Refreshment", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "9", groupingTh: "ค่าสายตรวจตู้แดง", accountNameEn: "Establish.Cost-Security", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "10", groupingTh: "ค่าใช้จ่ายเกี่ยวกับส่งเสริมการขาย", accountNameEn: "Other Sales Promotion - Store Decoration", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "11", groupingTh: "ค่าทนาย", accountNameEn: "Legal Fee", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "12", groupingTh: "ค่าน้ำดิบ, น้ำบาดาล", accountNameEn: "Establish.Cost-Water", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "13", groupingTh: "สวัสดิการพนักงาน", accountNameEn: "Other Personnel Cost-Recruitment", active: false, updatedAt: "2026-03-01 10:00:00" },
  { id: "14", groupingTh: "ค่าใช้จ่ายเกี่ยวกับไหว้ศาลพระพรหม", accountNameEn: "Other non-deductible expenses", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "15", groupingTh: "ค่าเดินทาง, ค่าที่พัก", accountNameEn: "Pre-op General Exps", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "16", groupingTh: "สวัสดิการพนักงาน", accountNameEn: "Other Personnel Cost-Other", active: true, updatedAt: "2026-03-01 10:00:00" },
  { id: "17", groupingTh: "ค่าซักเสื้อโค้ทห้องเย็น", accountNameEn: "Other General Exp-Others", active: true, updatedAt: "2026-03-01 10:00:00" },
];

let nextId = 18;

export default function ExpenseTypePanel() {
  const { toast } = useToast();
  const [data, setData] = useState<ExpenseTypeRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ExpenseTypeRow | null>(null);
  const [formGrouping, setFormGrouping] = useState("");
  const [formAccount, setFormAccount] = useState("");
  const [formActive, setFormActive] = useState(true);

  // CSV Import modal
  const [importOpen, setImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{ groupingTh: string; accountNameEn: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.groupingTh.toLowerCase().includes(q) || r.accountNameEn.toLowerCase().includes(q)
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
    setFormGrouping("");
    setFormAccount("");
    setFormActive(true);
    setModalOpen(true);
  };

  const openEdit = (row: ExpenseTypeRow) => {
    setEditingRow(row);
    setFormGrouping(row.groupingTh);
    setFormAccount(row.accountNameEn);
    setFormActive(row.active);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formGrouping.trim() || !formAccount.trim()) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    const ts = now();
    if (editingRow) {
      setData((prev) =>
        prev.map((r) =>
          r.id === editingRow.id
            ? { ...r, groupingTh: formGrouping.trim(), accountNameEn: formAccount.trim(), active: formActive, updatedAt: ts }
            : r
        )
      );
      toast({ title: "Updated", description: "Expense type updated successfully." });
    } else {
      const newRow: ExpenseTypeRow = {
        id: String(nextId++),
        groupingTh: formGrouping.trim(),
        accountNameEn: formAccount.trim(),
        active: formActive,
        updatedAt: ts,
      };
      setData((prev) => [...prev, newRow]);
      toast({ title: "Created", description: "Expense type added successfully." });
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setData((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Deleted", description: "Expense type removed." });
  };

  const handleToggle = (id: string, checked: boolean) => {
    setData((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: checked, updatedAt: now() } : r))
    );
  };

  // CSV
  const downloadTemplate = () => {
    const csv = "grouping_th,account_name_en\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expense_type_template.csv";
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
        const [groupingTh = "", accountNameEn = ""] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        return { groupingTh, accountNameEn };
      }).filter((r) => r.groupingTh && r.accountNameEn);
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    const ts = now();
    const newRows: ExpenseTypeRow[] = csvPreview.map((r) => ({
      id: String(nextId++),
      groupingTh: r.groupingTh,
      accountNameEn: r.accountNameEn,
      active: true,
      updatedAt: ts,
    }));
    setData((prev) => [...prev, ...newRows]);
    toast({ title: "Imported", description: `${newRows.length} expense types imported.` });
    setCsvPreview([]);
    setImportOpen(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Expense Type</h2>
          <p className="text-sm text-muted-foreground">
            Manage expense type groupings and their mapped GL account names.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { setCsvPreview([]); setImportOpen(true); }}>
            <Upload className="h-4 w-4 mr-2" />Import CSV
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />Add Expense Type
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
            placeholder="Search grouping or account name..."
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
                <TableHead>Grouping (TH)</TableHead>
                <TableHead>Account Name (EN)</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No expense types found
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.groupingTh}</TableCell>
                  <TableCell>{row.accountNameEn}</TableCell>
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
            <DialogTitle>{editingRow ? "Edit Expense Type" : "Add Expense Type"}</DialogTitle>
            <DialogDescription>
              {editingRow ? "Update the expense type details below." : "Fill in the details to create a new expense type."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="grouping">Grouping (TH) <span className="text-destructive">*</span></Label>
              <Input id="grouping" value={formGrouping} onChange={(e) => setFormGrouping(e.target.value)} placeholder="e.g. ค่าเดินทาง, ค่าที่พัก" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name (EN) <span className="text-destructive">*</span></Label>
              <Input id="accountName" value={formAccount} onChange={(e) => setFormAccount(e.target.value)} placeholder="e.g. Local Travelling" />
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
            <DialogTitle>Import Expense Types from CSV</DialogTitle>
            <DialogDescription>Upload a CSV file to bulk-import expense types.</DialogDescription>
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
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
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
                        <TableHead>Grouping (TH)</TableHead>
                        <TableHead>Account Name (EN)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{r.groupingTh}</TableCell>
                          <TableCell className="text-sm">{r.accountNameEn}</TableCell>
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
