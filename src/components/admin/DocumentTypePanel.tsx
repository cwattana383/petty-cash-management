import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Upload,
  Download,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  useDocumentTypes,
  useCreateDocumentType,
  useUpdateDocumentType,
  useDeleteDocumentType,
  useImportDocumentTypes,
  useAllDocumentTypesForImport,
  useBulkDocumentTypeAction,
  DocumentTypeRow,
} from "@/hooks/use-document-types";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import BulkActionBar from "@/components/common/BulkActionBar";
import BulkConfirmDialog from "@/components/common/BulkConfirmDialog";

const PAGE_SIZE = 10;

export default function DocumentTypePanel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<DocumentTypeRow | null>(null);
  // Form state
  const [formName, setFormName] = useState("");
  const [formIsSupportDocument, setFormIsSupportDocument] = useState(false);
  const [formOcrVerification, setFormOcrVerification] = useState(false);
  const [formActive, setFormActive] = useState(true);

  // CSV Import state
  const [importOpen, setImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<
    { documentName: string; isSupportDocument: boolean; ocrVerification: boolean; active: boolean }[]
  >([]);
  const [csvDuplicates, setCsvDuplicates] = useState<Map<number, string>>(new Map());
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: result, isLoading } = useDocumentTypes({
    search: search || undefined,
    active: statusFilter !== "all" ? (statusFilter === "active" ? "true" : "false") : undefined,
    page,
    limit: PAGE_SIZE,
  });

  const items = result?.data ?? [];
  const meta = result?.meta ?? { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 };

  const createMutation = useCreateDocumentType();
  const updateMutation = useUpdateDocumentType();
  const deleteMutation = useDeleteDocumentType();
  const importMutation = useImportDocumentTypes();
  const { data: allDocumentTypes } = useAllDocumentTypesForImport({ enabled: importOpen });
  const bulkMutation = useBulkDocumentTypeAction();
  const bulk = useBulkSelection({ items, totalCount: meta.total });
  const [confirmAction, setConfirmAction] = useState<"delete" | "activate" | "deactivate" | null>(null);

  const executeBulkAction = () => {
    if (!confirmAction) return;
    const payload = bulk.selectAllPages
      ? { action: confirmAction, selectAll: true, filters: { ...(search ? { search } : {}), ...(statusFilter !== "all" ? { active: statusFilter === "active" ? "true" : "false" } : {}) } }
      : { action: confirmAction, ids: [...bulk.selectedIds] };
    bulkMutation.mutate(payload, {
      onSuccess: (res: unknown) => {
        const { affected } = res as { affected: number };
        toast({ title: "Success", description: `${affected} document type(s) ${confirmAction === "delete" ? "deleted" : confirmAction === "activate" ? "activated" : "deactivated"}.` });
        bulk.clearSelection();
        setConfirmAction(null);
      },
      onError: (err: unknown) => {
        toast({ title: "Error", description: err instanceof Error ? err.message : "Bulk action failed.", variant: "destructive" });
        setConfirmAction(null);
      },
    });
  };

  function openEdit(row: DocumentTypeRow) {
    setEditingRow(row);
    setFormName(row.documentName);
    setFormIsSupportDocument(row.isSupportDocument);
    setFormOcrVerification(row.ocrVerification);
    setFormActive(row.active);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: "Deleted", description: "Document type removed." }),
      onError: (err: unknown) =>
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to delete document type.",
          variant: "destructive",
        }),
    });
  }

  function openAdd() {
    setEditingRow(null);
    setFormName("");
    setFormIsSupportDocument(false);
    setFormOcrVerification(false);
    setFormActive(true);
    setModalOpen(true);
  }

  function handleSave() {
    if (!formName.trim()) {
      toast({ title: "Validation Error", description: "Document name is required.", variant: "destructive" });
      return;
    }

    if (editingRow) {
      updateMutation.mutate(
        {
          id: editingRow.id,
          data: {
            documentName: formName.trim(),
            isSupportDocument: formIsSupportDocument,
            ocrVerification: formOcrVerification,
            active: formActive,
          },
        },
        {
          onSuccess: () => {
            toast({ title: "Updated", description: "Document type updated successfully." });
            setModalOpen(false);
          },
          onError: (err: unknown) => {
            const message = err instanceof Error ? err.message : "Failed to update document type.";
            toast({
              title: "Error",
              description: message,
              variant: "destructive",
            });
          },
        },
      );
    } else {
      createMutation.mutate(
        {
          documentName: formName.trim(),
          isSupportDocument: formIsSupportDocument,
          ocrVerification: formOcrVerification,
          active: formActive,
        },
        {
          onSuccess: () => {
            toast({ title: "Created", description: "Document type created successfully." });
            setModalOpen(false);
          },
          onError: (err: unknown) => {
            const message = err instanceof Error ? err.message : "Failed to create document type.";
            toast({
              title: "Error",
              description: message,
              variant: "destructive",
            });
          },
        },
      );
    }
  }

  function handleInlineActiveToggle(row: DocumentTypeRow) {
    updateMutation.mutate(
      { id: row.id, data: { active: !row.active } },
      {
        onSuccess: () => {
          toast({ title: "Updated", description: `${row.documentName} ${!row.active ? "activated" : "deactivated"}.` });
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : "Failed to toggle active status.";
          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          });
        },
      },
    );
  }

  function handleSupportDocumentToggle(checked: boolean) {
    setFormIsSupportDocument(checked);
    if (checked) {
      setFormOcrVerification(false);
    }
  }

  // ── CSV Import helpers ──

  const checkCsvDuplicates = (rows: { documentName: string }[]) => {
    const dupes = new Map<number, string>();
    const seen = new Set<string>();
    const existingSet = new Set(
      (allDocumentTypes ?? []).map((d) => d.documentName.toLowerCase()),
    );
    rows.forEach((r, i) => {
      const key = r.documentName.toLowerCase();
      if (seen.has(key)) {
        dupes.set(i, "Duplicate name in CSV");
      } else if (existingSet.has(key)) {
        dupes.set(i, "Document type already exists");
      }
      seen.add(key);
    });
    return dupes;
  };

  const removeCsvRow = (index: number) => {
    const updated = csvPreview.filter((_, i) => i !== index);
    setCsvPreview(updated);
    setCsvDuplicates(checkCsvDuplicates(updated));
  };

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
    triggerCsvDownload("\uFEFFdocument_name,OCR_Verification,active\n", "document_type_template.csv");
  };

  const downloadSample = () => {
    triggerCsvDownload(
      "\uFEFFdocument_name,OCR_Verification,active\nApproval Letter (General),Disabled,Yes\nReceipt / Tax Invoice,Enabled,Yes\nBoarding Pass,Disabled,Yes\n",
      "document_type_sample.csv",
    );
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please select a .csv file.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer;
      let text = new TextDecoder("utf-8").decode(buffer);
      if (text.includes("\uFFFD")) {
        text = new TextDecoder("windows-874").decode(buffer);
      }
      text = text.replace(/^\uFEFF/, "");

      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast({ title: "Empty CSV", description: "CSV file has no data rows.", variant: "destructive" });
        return;
      }

      // Auto-detect delimiter: tab or comma
      const delimiter = lines[0].includes("\t") ? "\t" : ",";

      const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
      const required = ["document_name", "ocr_verification", "active"];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) {
        toast({
          title: "Invalid CSV columns",
          description: `Missing required columns: ${missing.join(", ")}. CSV must contain: ${required.join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      const nameIdx = headers.indexOf("document_name");
      const ocrIdx = headers.indexOf("ocr_verification");
      const activeIdx = headers.indexOf("active");

      const rows = lines
        .slice(1)
        .map((line) => {
          const cols = line.split(delimiter).map((s) => s.trim().replace(/^"|"$/g, ""));
          const documentName = cols[nameIdx] ?? "";
          const ocrVal = (cols[ocrIdx] ?? "").toLowerCase();
          const activeVal = (cols[activeIdx] ?? "").toLowerCase();

          const isSupportDocument = false;
          const ocrVerification = ocrVal === "enabled";
          const active = activeVal === "true" || activeVal === "yes";

          return { documentName, isSupportDocument, ocrVerification, active };
        })
        .filter((r) => r.documentName.trim() !== "");

      if (rows.length === 0) {
        toast({ title: "No valid rows", description: "CSV has no valid data rows.", variant: "destructive" });
        return;
      }

      setCsvPreview(rows);
      setCsvDuplicates(checkCsvDuplicates(rows));
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmImport = () => {
    const payload = csvPreview.map((r) => ({
      documentName: r.documentName,
      isSupportDocument: r.isSupportDocument,
      ocrVerification: r.ocrVerification,
      active: r.active,
    }));
    importMutation.mutate(payload, {
      onSuccess: (res) => {
        toast({
          title: "Imported",
          description: `${(res as { imported: number }).imported} document types imported.`,
        });
        setCsvPreview([]);
        setCsvDuplicates(new Map());
        setImportOpen(false);
        if (fileRef.current) fileRef.current.value = "";
      },
      onError: (err: Error) =>
        toast({
          title: "Error",
          description: err.message || "Failed to import document types.",
          variant: "destructive",
        }),
    });
  };

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Documents</h2>
          <p className="text-sm text-muted-foreground">Manage document types for expense claims.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { setCsvPreview([]); setCsvDuplicates(new Map()); setImportOpen(true); }}>
            <Upload className="h-4 w-4 mr-2" />Import CSV
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />Add Document Type
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search document name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {(search || statusFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            )}
          </div>
      </div>

      {/* Bulk Action Bar */}
      {bulk.hasSelection && (
        <BulkActionBar
          selectedCount={bulk.selectionCount}
          totalCount={meta.total}
          selectAllPages={bulk.selectAllPages}
          isAllOnPageSelected={bulk.isAllOnPageSelected}
          onSelectAllPages={bulk.selectAllAcrossPages}
          onDelete={() => setConfirmAction("delete")}
          onActivate={() => setConfirmAction("activate")}
          onDeactivate={() => setConfirmAction("deactivate")}
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
                <TableHead>Document Name</TableHead>
                <TableHead className="text-center">OCR Verification</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" /> Loading...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No document types found.
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
                    <TableCell className="font-medium">{row.documentName}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={row.ocrVerification
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-100"}>
                        {row.ocrVerification ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={row.active}
                        onCheckedChange={() => handleInlineActiveToggle(row)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit Document Type" : "Add Document Type"}</DialogTitle>
            <DialogDescription>
              {editingRow ? "Update the document type configuration." : "Create a new document type."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="doc-name">Document Name *</Label>
              <Input
                id="doc-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Tax Invoice"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is-support-doc">Is Support Document</Label>
              <Switch
                id="is-support-doc"
                checked={formIsSupportDocument}
                onCheckedChange={handleSupportDocumentToggle}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ocr-verification" className={formIsSupportDocument ? "text-muted-foreground" : ""}>
                OCR Verification
              </Label>
              <Switch
                id="ocr-verification"
                checked={formOcrVerification}
                onCheckedChange={setFormOcrVerification}
                disabled={formIsSupportDocument}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={formActive}
                onCheckedChange={setFormActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingRow ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={importOpen} onOpenChange={(open) => {
        if (!open) { setCsvPreview([]); setCsvDuplicates(new Map()); if (fileRef.current) fileRef.current.value = ""; }
        setImportOpen(open);
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Document Types from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with document types. Download the template for the correct format.
            </DialogDescription>
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

            {/* Upload area */}
            <label
              htmlFor="doctype-csv-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                Click to select or drag & drop a .csv file
              </span>
              <input
                ref={fileRef}
                id="doctype-csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCsvFileChange}
              />
            </label>

            {/* Preview table */}
            {csvPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {csvPreview.length} row(s) parsed
                    {csvDuplicates.size > 0 && (
                      <span className="text-destructive ml-2">
                        ({csvDuplicates.size} issue{csvDuplicates.size > 1 ? "s" : ""} found)
                      </span>
                    )}
                  </p>
                </div>
                <div className="border rounded-md overflow-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Name</TableHead>
                        <TableHead className="text-center">Type</TableHead>
                        <TableHead className="text-center">OCR Verification</TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((r, i) => (
                        <TableRow key={i} className={csvDuplicates.has(i) ? "bg-destructive/5" : ""}>
                          <TableCell className="text-sm">{r.documentName}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={r.isSupportDocument
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-100"}>
                              {r.isSupportDocument ? "Support" : "Primary"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={r.ocrVerification
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-100"}>
                              {r.ocrVerification ? "Enabled" : "Disabled"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {r.active ? "Yes" : "No"}
                          </TableCell>
                          <TableCell className="text-center">
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
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                OK
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" onClick={() => removeCsvRow(i)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
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
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmImport}
              disabled={csvPreview.length === 0 || csvDuplicates.size > 0 || importMutation.isPending}
            >
              {importMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Confirm Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Confirm Dialog */}
      <BulkConfirmDialog
        open={!!confirmAction}
        action={confirmAction}
        count={bulk.selectionCount}
        resourceName="document type(s)"
        onConfirm={executeBulkAction}
        onCancel={() => setConfirmAction(null)}
        isProcessing={bulkMutation.isPending}
      />

    </div>
  );
}
