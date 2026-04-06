import { useState, useRef, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Plus, Search, Pencil, Trash2, Upload, Download, ChevronLeft, ChevronRight, Loader2, RotateCcw, ChevronsUpDown, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  useGlAccounts,
  useAllGlAccounts,
  useCreateGlAccount,
  useUpdateGlAccount,
  useDeleteGlAccount,
  useImportGlAccounts,
  type GlAccountRow,
} from "@/hooks/use-gl-accounts";
import { useAllExpenseTypes } from "@/hooks/use-expense-types";
import { formatBEDateTime } from "@/lib/utils";

export default function GlAccountPanel() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: result, isLoading } = useGlAccounts({
    search: search || undefined,
    active: statusFilter !== "all" ? (statusFilter === "active" ? "true" : "false") : undefined,
    page,
    limit: pageSize,
  });

  const items = result?.data ?? [];
  const meta = result?.meta ?? { total: 0, page: 1, limit: pageSize, totalPages: 1 };

  const { data: allGlAccounts } = useAllGlAccounts();
  const { data: expenseTypes } = useAllExpenseTypes();
  const activeExpenseTypes = (expenseTypes ?? []).filter((et) => et.active);

  const createMutation = useCreateGlAccount();
  const updateMutation = useUpdateGlAccount();
  const deleteMutation = useDeleteGlAccount();
  const importMutation = useImportGlAccounts();

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<GlAccountRow | null>(null);
  const [formExpenseTypeId, setFormExpenseTypeId] = useState("");
  const [formExpenseSubtypeId, setFormExpenseSubtypeId] = useState("");
  const [etComboOpen, setEtComboOpen] = useState(false);
  const [stComboOpen, setStComboOpen] = useState(false);

  const selectedExpenseTypeLabel = useMemo(() => {
    if (!formExpenseTypeId) return "";
    return activeExpenseTypes.find((et) => et.id === formExpenseTypeId)?.expenseType ?? "";
  }, [formExpenseTypeId, activeExpenseTypes]);

  const activeSubtypes = useMemo(() => {
    if (!formExpenseTypeId) return [];
    const parent = activeExpenseTypes.find((et) => et.id === formExpenseTypeId);
    return (parent?.subtypes ?? []).filter((s) => s.active);
  }, [formExpenseTypeId, activeExpenseTypes]);

  const selectedSubtypeLabel = useMemo(() => {
    if (!formExpenseSubtypeId) return "";
    return activeSubtypes.find((s) => s.id === formExpenseSubtypeId)?.subExpenseType ?? "";
  }, [formExpenseSubtypeId, activeSubtypes]);

  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formActive, setFormActive] = useState(true);

  // CSV Import modal
  const [importOpen, setImportOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<{ expenseTypeId: string; expenseSubtypeId: string; expenseTypeName: string; subtypeName: string; accountCode: string; accountName: string }[]>([]);
  const [csvDuplicates, setCsvDuplicates] = useState<Map<number, string>>(new Map());
  const fileRef = useRef<HTMLInputElement>(null);

  const openAdd = () => {
    setEditingRow(null);
    setFormExpenseTypeId("");
    setFormExpenseSubtypeId("");
    setFormCode("");
    setFormName("");
    setFormActive(true);
    setModalOpen(true);
  };

  const openEdit = (row: GlAccountRow) => {
    setEditingRow(row);
    setFormExpenseTypeId(row.expenseTypeId);
    setFormExpenseSubtypeId(row.expenseSubtypeId ?? "");
    setFormCode(row.accountCode);
    setFormName(row.accountName);
    setFormActive(row.active);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formExpenseTypeId || !formExpenseSubtypeId || !formCode.trim() || !formName.trim()) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    if (editingRow) {
      updateMutation.mutate(
        { id: editingRow.id, data: { expenseTypeId: formExpenseTypeId, expenseSubtypeId: formExpenseSubtypeId, accountCode: formCode.trim(), accountName: formName.trim(), active: formActive } },
        {
          onSuccess: () => { toast({ title: "Updated", description: "GL account updated successfully." }); setModalOpen(false); },
          onError: (err: Error) => toast({ title: "Error", description: err.message || "Failed to update GL account.", variant: "destructive" }),
        },
      );
    } else {
      createMutation.mutate(
        { expenseTypeId: formExpenseTypeId, expenseSubtypeId: formExpenseSubtypeId, accountCode: formCode.trim(), accountName: formName.trim(), active: formActive },
        {
          onSuccess: () => { toast({ title: "Created", description: "GL account added successfully." }); setModalOpen(false); },
          onError: (err: Error) => toast({ title: "Error", description: err.message || "Failed to create GL account.", variant: "destructive" }),
        },
      );
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: "Deleted", description: "GL account removed." }),
      onError: () => toast({ title: "Error", description: "Failed to delete GL account.", variant: "destructive" }),
    });
  };

  const handleToggle = (row: GlAccountRow, checked: boolean) => {
    updateMutation.mutate({ id: row.id, data: { active: checked } });
  };

  // CSV helpers
  const checkCsvDuplicates = (rows: { expenseTypeId: string; expenseSubtypeId: string; accountCode: string }[]) => {
    const dupes = new Map<number, string>();
    const seen = new Set<string>();
    const existingSet = new Set(
      (allGlAccounts ?? []).map((g) =>
        `${g.expenseTypeId}|${g.expenseSubtypeId ?? ""}|${g.accountCode.toLowerCase()}`
      ),
    );
    rows.forEach((r, i) => {
      const comboKey = `${r.expenseTypeId}|${r.expenseSubtypeId}|${r.accountCode.toLowerCase()}`;
      if (seen.has(comboKey)) {
        dupes.set(i, "Duplicate combo in CSV");
      } else if (existingSet.has(comboKey)) {
        dupes.set(i, "Combination already exists");
      }
      seen.add(comboKey);
    });
    return dupes;
  };

  const removeCsvRow = (index: number) => {
    const updated = csvPreview.filter((_, i) => i !== index);
    setCsvPreview(updated);
    setCsvDuplicates(checkCsvDuplicates(updated));
  };

  const downloadTemplate = () => {
    const csv = "\uFEFFexpense_type,sub_expense_type,account_code,account_name\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
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
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Invalid File", description: "Only CSV files are allowed.", variant: "destructive" });
      if (fileRef.current) fileRef.current.value = "";
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

      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length === 0) {
        toast({ title: "Invalid File", description: "CSV file is empty.", variant: "destructive" });
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
      if (headers.length !== 4 || headers[0] !== "expense_type" || headers[1] !== "sub_expense_type" || headers[2] !== "account_code" || headers[3] !== "account_name") {
        toast({ title: "Invalid Headers", description: "CSV must contain exactly four columns: expense_type, sub_expense_type, account_code, account_name", variant: "destructive" });
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

      const etLookup = new Map(
        (expenseTypes ?? []).map((et) => [et.expenseType.toLowerCase(), et]),
      );

      const rows = lines.slice(1).map((line) => {
        const [expenseTypeName = "", subtypeName = "", accountCode = "", accountName = ""] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        const matchedParent = etLookup.get(expenseTypeName.toLowerCase());
        const matchedSubtype = matchedParent?.subtypes?.find((s) => s.subExpenseType.toLowerCase() === subtypeName.toLowerCase());
        return {
          expenseTypeId: matchedParent?.id ?? "",
          expenseSubtypeId: matchedSubtype?.id ?? "",
          expenseTypeName,
          subtypeName,
          accountCode,
          accountName,
        };
      }).filter((r) => r.accountCode && r.accountName);

      if (rows.length === 0) {
        toast({ title: "No Data", description: "CSV file contains no valid data rows.", variant: "destructive" });
        if (fileRef.current) fileRef.current.value = "";
        return;
      }

      const dupes = checkCsvDuplicates(rows);
      rows.forEach((r, i) => {
        if (!r.expenseTypeId && !dupes.has(i)) {
          dupes.set(i, "Unknown expense type");
        } else if (!r.expenseSubtypeId && !dupes.has(i)) {
          dupes.set(i, "Unknown sub expense type");
        }
      });

      setCsvDuplicates(dupes);
      setCsvPreview(rows);
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmImport = () => {
    const payload = csvPreview.map((r) => ({
      expenseTypeId: r.expenseTypeId,
      expenseSubtypeId: r.expenseSubtypeId,
      accountCode: r.accountCode,
      accountName: r.accountName,
    }));
    importMutation.mutate(payload, {
      onSuccess: (res) => {
        toast({ title: "Imported", description: `${(res as { imported: number }).imported} GL accounts imported.` });
        setCsvPreview([]);
        setCsvDuplicates(new Map());
        setImportOpen(false);
        if (fileRef.current) fileRef.current.value = "";
      },
      onError: (err: Error) => toast({ title: "Error", description: err.message || "Failed to import GL accounts.", variant: "destructive" }),
    });
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
          <Button size="sm" variant="outline" onClick={() => { setCsvPreview([]); setCsvDuplicates(new Map()); setImportOpen(true); }}>
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
            placeholder="Search account code, name, expense type, or sub type..."
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
                <TableHead>Sub Expense Type</TableHead>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No GL accounts found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.expenseType?.expenseType}</TableCell>
                    <TableCell className="text-sm">{row.expenseSubtype?.subExpenseType ?? "\u2014"}</TableCell>
                    <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.accountCode}</code></TableCell>
                    <TableCell>{row.accountName}</TableCell>
                    <TableCell>
                      <Switch
                        checked={row.active}
                        onCheckedChange={(checked) => handleToggle(row, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatBEDateTime(row.updatedAt)}</TableCell>
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

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit GL Account" : "Add GL Account"}</DialogTitle>
            <DialogDescription>
              {editingRow ? "Update the GL account details below." : "Fill in the details to create a new GL account."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Expense Type combobox */}
            <div className="space-y-2">
              <Label>Expense Type <span className="text-destructive">*</span></Label>
              <Popover open={etComboOpen} onOpenChange={setEtComboOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={etComboOpen} className="w-full justify-between font-normal">
                    {selectedExpenseTypeLabel || "Select expense type..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search expense type..." />
                    <CommandList>
                      <CommandEmpty>No expense type found.</CommandEmpty>
                      <CommandGroup>
                        {activeExpenseTypes.map((et) => (
                          <CommandItem
                            key={et.id}
                            value={et.expenseType}
                            onSelect={() => {
                              setFormExpenseTypeId(et.id);
                              setFormExpenseSubtypeId("");
                              setEtComboOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", formExpenseTypeId === et.id ? "opacity-100" : "opacity-0")} />
                            {et.expenseType}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {/* Sub Expense Type combobox */}
            <div className="space-y-2">
              <Label>Sub Expense Type <span className="text-destructive">*</span></Label>
              <Popover open={stComboOpen} onOpenChange={setStComboOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={stComboOpen} className="w-full justify-between font-normal" disabled={!formExpenseTypeId}>
                    {selectedSubtypeLabel || (formExpenseTypeId ? "Select sub expense type..." : "Select expense type first")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search sub expense type..." />
                    <CommandList>
                      <CommandEmpty>No sub expense type found.</CommandEmpty>
                      <CommandGroup>
                        {activeSubtypes.map((st) => (
                          <CommandItem
                            key={st.id}
                            value={st.subExpenseType}
                            onSelect={() => {
                              setFormExpenseSubtypeId(st.id);
                              setStComboOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", formExpenseSubtypeId === st.id ? "opacity-100" : "opacity-0")} />
                            {st.subExpenseType}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import GL Accounts from CSV</DialogTitle>
            <DialogDescription>Upload a CSV file to bulk-import GL accounts. The expense_type and sub_expense_type columns must match existing records.</DialogDescription>
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
                        <TableHead>Account Code</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((r, i) => (
                        <TableRow key={i} className={csvDuplicates.has(i) ? "bg-destructive/5" : ""}>
                          <TableCell className="text-sm">{r.expenseTypeName}</TableCell>
                          <TableCell className="text-sm">{r.subtypeName || "\u2014"}</TableCell>
                          <TableCell className="text-sm">{r.accountCode}</TableCell>
                          <TableCell className="text-sm">{r.accountName}</TableCell>
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
            <Button onClick={confirmImport} disabled={csvPreview.length === 0 || csvDuplicates.size > 0 || importMutation.isPending}>
              {importMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
