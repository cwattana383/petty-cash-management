import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Plus, Search, Pencil, Eye, Trash2, Upload, Download, ChevronLeft, ChevronRight, RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  type ExpenseTypeRow,
  type ExpenseTypeSubtype,
  initialData,
  now,
  getNextId,
  getNextSubId,
} from "./expense-type-data";

export default function ExpenseTypePanel() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<ExpenseTypeRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // CSV Import modal
  const [importOpen, setImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{ expenseType: string; subExpenseType: string; accountNameEn: string; accountCode: string }[]>([]);
  const [csvDuplicates, setCsvDuplicates] = useState<Map<number, string>>(new Map());
  const fileRef = useRef<HTMLInputElement>(null);

  // Filtering
  const filtered = (() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) => r.expenseType.toLowerCase().includes(q) || r.subtypes.some((s) => s.subExpenseType.toLowerCase().includes(q))
      );
    }
    if (statusFilter === "active") list = list.filter((r) => r.active);
    if (statusFilter === "inactive") list = list.filter((r) => !r.active);
    return list;
  })();

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

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
    const csv = "\uFEFFexpense_type,sub_expense_type,account_name_en,account_code\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
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
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Invalid File", description: "Only CSV files are allowed.", variant: "destructive" });
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer;

      let text: string;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      } catch {
        text = new TextDecoder("windows-874").decode(buffer);
      }

      text = text.replace(/^\uFEFF/, "");

      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length === 0) {
        toast({ title: "Invalid File", description: "CSV file is empty.", variant: "destructive" });
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
      if (headers.length !== 4 || headers[0] !== "expense_type" || headers[1] !== "sub_expense_type" || headers[2] !== "account_name_en" || headers[3] !== "account_code") {
        toast({ title: "Invalid Headers", description: "CSV must contain exactly four columns: expense_type, sub_expense_type, account_name_en, account_code", variant: "destructive" });
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      const rows = lines.slice(1).map((line) => {
        const [expenseType = "", subExpenseType = "", accountNameEn = "", accountCode = ""] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        return { expenseType, subExpenseType, accountNameEn, accountCode };
      }).filter((r) => r.expenseType && r.accountNameEn);

      if (rows.length === 0) {
        toast({ title: "No Data", description: "CSV file contains no valid data rows.", variant: "destructive" });
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

      setCsvDuplicates(checkCsvDuplicates(rows));
      setCsvPreview(rows);
    };
    reader.readAsArrayBuffer(file);
  };

  const checkCsvDuplicates = (rows: { expenseType: string; subExpenseType: string; accountNameEn: string; accountCode: string }[]) => {
    const issues = new Map<number, string>();
    const seen = new Set<string>();

    rows.forEach((r, i) => {
      const key = `${r.expenseType.toLowerCase()}||${r.subExpenseType.toLowerCase()}`;
      if (seen.has(key)) {
        issues.set(i, "Duplicate (will be skipped)");
      }
      seen.add(key);
    });
    return issues;
  };

  const removeCsvRow = (index: number) => {
    const updated = csvPreview.filter((_, i) => i !== index);
    setCsvPreview(updated);
    setCsvDuplicates(checkCsvDuplicates(updated));
  };

  const confirmImport = () => {
    const ts = now();
    const grouped = new Map<string, { subtypes: ExpenseTypeSubtype[] }>();
    for (const row of csvPreview) {
      const entry = grouped.get(row.expenseType);
      const subtype: ExpenseTypeSubtype = {
        id: getNextSubId(),
        subExpenseType: row.subExpenseType,
        accountNameEn: row.accountNameEn,
        accountCode: row.accountCode,
        active: true,
        documentTypeIds: [],
      };
      if (entry) {
        entry.subtypes.push(subtype);
      } else {
        grouped.set(row.expenseType, { subtypes: [subtype] });
      }
    }

    const newRows: ExpenseTypeRow[] = Array.from(grouped.entries()).map(([expenseType, { subtypes }]) => ({
      id: getNextId(),
      expenseType,
      active: true,
      updatedAt: ts,
      subtypes,
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
            Manage expense type categories and their sub-types.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate("/admin/expense-type/create")}>
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
            placeholder="Search expense type..."
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
        {(search || statusFilter !== "all") && (
          <Button size="sm" variant="ghost" onClick={() => { setSearch(""); setStatusFilter("all"); setPage(1); }}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />Reset
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense Type</TableHead>
                <TableHead>Subtypes</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No expense types found
                  </TableCell>
                </TableRow>
              ) : (
                pageData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.expenseType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.subtypes.length} subtype{row.subtypes.length !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={row.active}
                        onCheckedChange={(checked) => handleToggle(row.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.updatedAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate(`/admin/expense-type/${row.id}?mode=view`)} title="View">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate(`/admin/expense-type/${row.id}/edit`)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(row.id)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />Previous
            </Button>
            <span className="text-muted-foreground">Page {page} of {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Next<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Expense Types from CSV</DialogTitle>
            <DialogDescription>Upload a CSV file to bulk-import expense types. Rows are grouped by expense_type automatically.</DialogDescription>
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
                <p className="text-sm font-medium">
                  {csvPreview.length} rows parsed
                  {csvDuplicates.size > 0 && (
                    <span className="text-destructive ml-2">({csvDuplicates.size} issue{csvDuplicates.size > 1 ? "s" : ""} found)</span>
                  )}
                </p>
                <div className="max-h-48 overflow-auto border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expense Type</TableHead>
                        <TableHead>Sub Expense Type</TableHead>
                        <TableHead>Account Name (EN)</TableHead>
                        <TableHead>Account Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((r, i) => (
                        <TableRow key={i} className={csvDuplicates.has(i) ? "bg-destructive/5" : ""}>
                          <TableCell className="text-sm">{r.expenseType}</TableCell>
                          <TableCell className="text-sm">{r.subExpenseType || "\u2014"}</TableCell>
                          <TableCell className="text-sm">{r.accountNameEn}</TableCell>
                          <TableCell className="text-sm">{r.accountCode || "\u2014"}</TableCell>
                          <TableCell className="text-sm">
                            {csvDuplicates.has(i) ? (
                              <Badge variant="destructive" className="text-xs">{csvDuplicates.get(i)}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600">OK</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeCsvRow(i)} title="Remove row">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
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
