import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  Plus, Search, Eye, Pencil, Trash2, Upload, Download, ChevronLeft, ChevronRight, Loader2, RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useExpenseTypes,
  useUpdateExpenseType,
  useDeleteExpenseType,
  useImportExpenseTypes,
  useAllExpenseTypes,
  type ExpenseTypeRow,
  useBulkExpenseTypeAction,
} from "@/hooks/use-expense-types";
import { useAllDocumentTypes } from "@/hooks/use-document-types";
import { Checkbox } from "@/components/ui/checkbox";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import BulkActionBar from "@/components/common/BulkActionBar";
import BulkConfirmDialog from "@/components/common/BulkConfirmDialog";
import { formatBEDateTime } from "@/lib/utils";

export default function ExpenseTypePanel() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: result, isLoading } = useExpenseTypes({
    search: search || undefined,
    active: statusFilter !== "all" ? (statusFilter === "active" ? "true" : "false") : undefined,
    page,
    limit: pageSize,
  });

  const items = result?.data ?? [];
  const meta = result?.meta ?? { total: 0, page: 1, limit: pageSize, totalPages: 1 };

  const updateMutation = useUpdateExpenseType();
  const deleteMutation = useDeleteExpenseType();
  const importMutation = useImportExpenseTypes();
  const bulkMutation = useBulkExpenseTypeAction();
  const bulk = useBulkSelection({ items, totalCount: meta.total });
  const [bulkConfirmAction, setBulkConfirmAction] = useState<"delete" | "activate" | "deactivate" | null>(null);

  const executeBulkAction = () => {
    if (!bulkConfirmAction) return;
    const payload = bulk.selectAllPages
      ? { action: bulkConfirmAction, selectAll: true, filters: { ...(search ? { search } : {}), ...(statusFilter !== "all" ? { active: statusFilter === "active" ? "true" : "false" } : {}) } }
      : { action: bulkConfirmAction, ids: [...bulk.selectedIds] };
    bulkMutation.mutate(payload, {
      onSuccess: (res: unknown) => {
        const { affected } = res as { affected: number };
        toast({ title: "Success", description: `${affected} expense type(s) ${bulkConfirmAction === "delete" ? "deleted" : bulkConfirmAction === "activate" ? "activated" : "deactivated"}.` });
        bulk.clearSelection();
        setBulkConfirmAction(null);
      },
      onError: (err: unknown) => {
        toast({ title: "Error", description: err instanceof Error ? err.message : "Bulk action failed.", variant: "destructive" });
        setBulkConfirmAction(null);
      },
    });
  };

  // CSV Import modal
  const [importOpen, setImportOpen] = useState(false);
  const [exportRequested, setExportRequested] = useState(false);
  const needsAllData = importOpen || exportRequested;
  const { data: allExpenseTypes, isLoading: isLoadingAll } = useAllExpenseTypes({ enabled: needsAllData });
  const { data: allDocumentTypes } = useAllDocumentTypes({ enabled: needsAllData });
  const [csvPreview, setCsvPreview] = useState<{
    expenseType: string;
    subExpenseType: string;
    requiredDocument: string;
    optionalDocument: string;
    accountNameEn: string;
    accountCode: string;
    requiredDocIds: string[];
    optionalDocIds: string[];
  }[]>([]);
  const [csvDuplicates, setCsvDuplicates] = useState<Map<number, string>>(new Map());
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Export CSV ──

  const escapeCsvField = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const exportCsv = () => {
    if (!allExpenseTypes) {
      // Trigger data loading, user clicks again once loaded
      setExportRequested(true);
      toast({ title: "Loading", description: "Fetching data... Please click Export CSV again." });
      return;
    }
    if (allExpenseTypes.length === 0) {
      toast({ title: "No Data", description: "No expense types available to export.", variant: "destructive" });
      return;
    }

    // Validate all referenced document types exist in the document_types table
    const validDocIds = new Set((allDocumentTypes ?? []).map((d) => d.id));
    const missingDocs: string[] = [];
    for (const et of allExpenseTypes) {
      for (const sub of et.subtypes ?? []) {
        for (const dt of sub.documentTypes ?? []) {
          const docName = dt.documentType?.documentName ?? "Unknown";
          if (!dt.documentType?.id || !validDocIds.has(dt.documentType.id)) {
            missingDocs.push(docName);
          }
        }
      }
    }
    if (missingDocs.length > 0) {
      const uniqueMissing = [...new Set(missingDocs)];
      toast({
        title: "Document Type Error",
        description: `The following document types are not available in the Documents table: ${uniqueMissing.join(", ")}. Please add them first and try again.`,
        variant: "destructive",
      });
      return;
    }

    // Build CSV rows
    const headers = ["Expense_Type", "Sub_Expense_Type", "Required_Document", "Optional_Document", "Account_Name", "Account_Code"];
    const rows: string[] = [headers.join(",")];

    for (const et of allExpenseTypes) {
      for (const sub of et.subtypes ?? []) {
        const requiredDocs = (sub.documentTypes ?? [])
          .filter((dt) => !dt.documentType.isSupportDocument)
          .map((dt) => dt.documentType.documentName)
          .join(", ");

        const optionalDocs = (sub.documentTypes ?? [])
          .filter((dt) => dt.documentType.isSupportDocument)
          .map((dt) => dt.documentType.documentName)
          .join(", ");

        rows.push([
          escapeCsvField(et.expenseType),
          escapeCsvField(sub.subExpenseType),
          escapeCsvField(requiredDocs),
          escapeCsvField(optionalDocs),
          escapeCsvField(sub.accountNameEn),
          escapeCsvField(sub.accountCode),
        ].join(","));
      }
    }

    triggerCsvDownload("\uFEFF" + rows.join("\n") + "\n", "expense_types_export.csv");

    toast({ title: "Exported", description: `${rows.length - 1} rows exported to CSV.` });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: "Deleted", description: "Expense type removed." }),
      onError: () => toast({ title: "Error", description: "Failed to delete expense type.", variant: "destructive" }),
    });
  };

  const handleToggle = (row: ExpenseTypeRow, checked: boolean) => {
    updateMutation.mutate({ id: row.id, data: { active: checked } }, {
      onSuccess: () => {
        toast({ title: "Updated", description: `${row.expenseType} ${checked ? "activated" : "deactivated"}.` });
      },
      onError: (err: unknown) => {
        toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to toggle active status.", variant: "destructive" });
      },
    });
  };

  // CSV
  const triggerCsvDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const downloadTemplate = () => {
    triggerCsvDownload(
      "\uFEFFExpense_Type,Sub_Expense_Type,Required_Document,Optional_Document,Account_Name,Account_Code\n",
      "expense_type_template.csv",
    );
  };

  const downloadSample = () => {
    triggerCsvDownload(
      "\uFEFFExpense_Type,Sub_Expense_Type,Required_Document,Optional_Document,Account_Name,Account_Code\n" +
      "Transportation,Taxi / Ride-Hailing \u2014 Domestic,Tax Invoice,\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e23\u0e31\u0e1a\u0e40\u0e07\u0e34\u0e19 (Receipt),Local Travelling,5101001\n" +
      "Transportation,BTS / MRT / Airport Rail Link,Tax Invoice,,Local Travelling,5101001\n" +
      "Hotel,Hotel \u2014 Domestic Single Room,Tax Invoice,\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e23\u0e31\u0e1a\u0e40\u0e07\u0e34\u0e19 (Receipt),Hotel Expenses,5102001\n" +
      "Hotel,Hotel \u2014 Domestic Twin Room,\"Tax Invoice, Receipt\",\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e23\u0e31\u0e1a\u0e40\u0e07\u0e34\u0e19 (Receipt),Hotel Expenses,5102002\n",
      "expense_type_sample.csv",
    );
  };

  // Parse a CSV line respecting quoted fields (e.g. "Tax Invoice, Receipt")
  const parseCsvLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          fields.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    fields.push(current.trim());
    return fields;
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

      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length === 0) {
        toast({ title: "Invalid File", description: "CSV file is empty.", variant: "destructive" });
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/^"|"$/g, ""));
      const required = ["expense_type", "sub_expense_type", "required_document", "optional_document", "account_name", "account_code"];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) {
        toast({
          title: "Invalid Headers",
          description: `Missing required columns: ${missing.join(", ")}. CSV must contain: ${required.join(", ")}`,
          variant: "destructive",
        });
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

      const etIdx = headers.indexOf("expense_type");
      const subIdx = headers.indexOf("sub_expense_type");
      const reqDocIdx = headers.indexOf("required_document");
      const optDocIdx = headers.indexOf("optional_document");
      const accNameIdx = headers.indexOf("account_name");
      const accCodeIdx = headers.indexOf("account_code");

      // Build document name → id lookup from the document_types table
      const docNameToId = new Map<string, string>();
      for (const dt of allDocumentTypes ?? []) {
        docNameToId.set(dt.documentName.toLowerCase(), dt.id);
      }

      const missingDocNames: string[] = [];

      const rows = lines.slice(1).map((line) => {
        const cols = parseCsvLine(line);
        const expenseType = cols[etIdx] ?? "";
        const subExpenseType = cols[subIdx] ?? "";
        const requiredDocument = cols[reqDocIdx] ?? "";
        const optionalDocument = cols[optDocIdx] ?? "";
        const accountNameEn = cols[accNameIdx] ?? "";
        const accountCode = cols[accCodeIdx] ?? "";

        // Resolve document names to IDs
        const reqDocNames = requiredDocument ? requiredDocument.split(",").map((d) => d.trim()).filter(Boolean) : [];
        const optDocNames = optionalDocument ? optionalDocument.split(",").map((d) => d.trim()).filter(Boolean) : [];

        const requiredDocIds: string[] = [];
        for (const name of reqDocNames) {
          const id = docNameToId.get(name.toLowerCase());
          if (id) requiredDocIds.push(id);
          else missingDocNames.push(name);
        }

        const optionalDocIds: string[] = [];
        for (const name of optDocNames) {
          const id = docNameToId.get(name.toLowerCase());
          if (id) optionalDocIds.push(id);
          else missingDocNames.push(name);
        }

        return { expenseType, subExpenseType, requiredDocument, optionalDocument, accountNameEn, accountCode, requiredDocIds, optionalDocIds };
      }).filter((r) => r.expenseType && r.accountNameEn);

      if (missingDocNames.length > 0) {
        const unique = [...new Set(missingDocNames)];
        toast({
          title: "Document Type Error",
          description: `The following document types are not available in the Documents table: ${unique.join(", ")}. Please add them first and try again.`,
          variant: "destructive",
        });
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

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

  const checkCsvDuplicates = (rows: { expenseType: string; subExpenseType: string; requiredDocIds: string[]; optionalDocIds: string[] }[]) => {
    const issues = new Map<number, string>();
    const seen = new Set<string>();

    // Build set of existing expense type + subtype combos from DB
    const existingCombos = new Set<string>();
    for (const et of allExpenseTypes ?? []) {
      for (const sub of et.subtypes ?? []) {
        existingCombos.add(`${et.expenseType.toLowerCase()}||${sub.subExpenseType.toLowerCase()}`);
      }
    }

    rows.forEach((r, i) => {
      const key = `${r.expenseType.toLowerCase()}||${r.subExpenseType.toLowerCase()}`;
      if (seen.has(key)) {
        issues.set(i, "Duplicate row in CSV");
      } else if (existingCombos.has(key)) {
        issues.set(i, "Subtype already exists in DB");
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
    const grouped = new Map<string, {
      expenseType: string;
      subtypes: { subExpenseType: string; accountNameEn: string; accountCode: string; documentTypeIds?: string[] }[];
      seen: Set<string>;
    }>();
    for (const row of csvPreview) {
      const subtypeKey = row.subExpenseType.toLowerCase();
      const allDocIds = [...row.requiredDocIds, ...row.optionalDocIds];
      const entry = grouped.get(row.expenseType);
      if (entry) {
        if (!entry.seen.has(subtypeKey)) {
          entry.subtypes.push({
            subExpenseType: row.subExpenseType,
            accountNameEn: row.accountNameEn,
            accountCode: row.accountCode,
            ...(allDocIds.length > 0 && { documentTypeIds: allDocIds }),
          });
          entry.seen.add(subtypeKey);
        }
      } else {
        grouped.set(row.expenseType, {
          expenseType: row.expenseType,
          subtypes: [{
            subExpenseType: row.subExpenseType,
            accountNameEn: row.accountNameEn,
            accountCode: row.accountCode,
            ...(allDocIds.length > 0 && { documentTypeIds: allDocIds }),
          }],
          seen: new Set([subtypeKey]),
        });
      }
    }
    const payload = Array.from(grouped.values()).map(({ expenseType, subtypes }) => ({ expenseType, subtypes }));

    importMutation.mutate(payload, {
      onSuccess: (res) => {
        toast({ title: "Imported", description: `${(res as { imported: number }).imported} expense types imported.` });
        setCsvPreview([]);
        setImportOpen(false);
        if (fileRef.current) fileRef.current.value = "";
      },
      onError: (err: unknown) => toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to import expense types.", variant: "destructive" }),
    });
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
          <Button size="sm" variant="outline" onClick={() => { setCsvPreview([]); setCsvDuplicates(new Map()); setImportOpen(true); }}>
            <Upload className="h-4 w-4 mr-2" />Import CSV
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={isLoadingAll}>
            {isLoadingAll ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export CSV
          </Button>
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

      {bulk.hasSelection && (
        <BulkActionBar
          selectedCount={bulk.selectionCount}
          totalCount={meta.total}
          selectAllPages={bulk.selectAllPages}
          isAllOnPageSelected={bulk.isAllOnPageSelected}
          onSelectAllPages={bulk.selectAllAcrossPages}
          onDelete={() => setBulkConfirmAction("delete")}
          onActivate={() => setBulkConfirmAction("activate")}
          onDeactivate={() => setBulkConfirmAction("deactivate")}
          onClear={bulk.clearSelection}
          isProcessing={bulkMutation.isPending}
        />
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={bulk.isAllOnPageSelected ? true : bulk.isIndeterminate ? "indeterminate" : false}
                    onCheckedChange={bulk.toggleAllOnPage}
                  />
                </TableHead>
                <TableHead>Expense Type</TableHead>
                <TableHead>Subtypes</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No expense types found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Checkbox
                        checked={bulk.selectAllPages || bulk.selectedIds.has(row.id)}
                        onCheckedChange={() => bulk.toggleOne(row.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{row.expenseType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.subtypes?.length ?? 0} subtype{(row.subtypes?.length ?? 0) !== 1 ? "s" : ""}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={row.active}
                        onCheckedChange={(checked) => handleToggle(row, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatBEDateTime(row.updatedAt)}</TableCell>
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
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />Previous
            </Button>
            <span className="text-muted-foreground">Page {page} of {meta.totalPages}</span>
            <Button size="sm" variant="outline" disabled={page === meta.totalPages} onClick={() => setPage(page + 1)}>
              Next<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <Dialog open={importOpen} onOpenChange={(open) => {
        if (!open) { setCsvPreview([]); setCsvDuplicates(new Map()); if (fileRef.current) fileRef.current.value = ""; }
        setImportOpen(open);
      }}>
        <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Expense Types from CSV</DialogTitle>
            <DialogDescription>Upload a CSV file to bulk-import expense types with document type mappings. Download the sample CSV for reference.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />Download Template
              </Button>
              <Button variant="outline" size="sm" onClick={downloadSample}>
                <Download className="h-4 w-4 mr-2" />Download Sample CSV
              </Button>
            </div>
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
                <div className="max-h-64 overflow-auto border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expense Type</TableHead>
                        <TableHead>Sub Expense Type</TableHead>
                        <TableHead>Required Document</TableHead>
                        <TableHead>Optional Document</TableHead>
                        <TableHead>Account Name</TableHead>
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
                          <TableCell className="text-sm">{r.requiredDocument || "\u2014"}</TableCell>
                          <TableCell className="text-sm">{r.optionalDocument || "\u2014"}</TableCell>
                          <TableCell className="text-sm">{r.accountNameEn}</TableCell>
                          <TableCell className="text-sm">{r.accountCode || "\u2014"}</TableCell>
                          <TableCell className="text-sm">
                            {csvDuplicates.has(i) ? (
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger>
                                  <span><Badge variant="destructive" className="text-xs cursor-help">Error</Badge></span>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs text-sm font-normal">
                                  {csvDuplicates.get(i)}
                                </TooltipContent>
                              </Tooltip>
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
            <Button onClick={confirmImport} disabled={csvPreview.length === 0 || csvDuplicates.size > 0 || importMutation.isPending}>
              {importMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkConfirmDialog
        open={!!bulkConfirmAction}
        action={bulkConfirmAction}
        count={bulk.selectionCount}
        resourceName="expense type(s)"
        onConfirm={executeBulkAction}
        onCancel={() => setBulkConfirmAction(null)}
        isProcessing={bulkMutation.isPending}
      />
    </div>
  );
}
