import { useMemo, useRef, useState } from "react";
import { Upload, FileText, Download, Trash2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFleetEtaxFiles, formatFileSize, type FleetEtaxFile } from "@/hooks/use-fleet-etax-files";

const PAGE_SIZE = 8;
const RED = "#DA3832";
const GREEN = "#43938F";
const BLUE = "#306FC7";
const YELLOW = "#F6C24A";

function UploadedPill({ label = "Uploaded" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ color: GREEN, backgroundColor: `${GREEN}1A` }}>
      {label}
    </span>
  );
}

function PdfIcon() {
  return <FileText className="h-4 w-4 shrink-0" style={{ color: RED }} aria-hidden />;
}

export default function FleetEtaxUploadPanel() {
  const { listFiles, uploadFiles, downloadFile, deleteFiles } = useFleetEtaxFiles();

  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [applied, setApplied] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [dateError, setDateError] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [uploadOpen, setUploadOpen] = useState(false);
  const [pending, setPending] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<FleetEtaxFile | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<FleetEtaxFile[] | null>(null);

  const rows = useMemo(() => listFiles(applied.from, applied.to), [listFiles, applied]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startIdx = rows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(currentPage * PAGE_SIZE, rows.length);

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const handleSearch = () => {
    if (fromInput && toInput && fromInput > toInput) {
      setDateError("From Date must be on or before To Date.");
      return;
    }
    setDateError("");
    setApplied({ from: fromInput, to: toInput });
    setPage(1);
    setSelected(new Set());
  };

  const handleReset = () => {
    setFromInput("");
    setToInput("");
    setDateError("");
    setApplied({ from: "", to: "" });
    setPage(1);
    setSelected(new Set());
  };

  const toggleAllOnPage = (checked: boolean) => {
    const next = new Set(selected);
    pageRows.forEach((r) => (checked ? next.add(r.id) : next.delete(r.id)));
    setSelected(next);
  };

  const toggleRow = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id); else next.delete(id);
    setSelected(next);
  };

  const handleDownload = (f: FleetEtaxFile) => {
    const name = downloadFile(f);
    toast({ title: `Download started: ${name}` });
  };

  const confirmDelete = () => {
    if (!deleteTargets) return;
    const n = deleteFiles(deleteTargets.map((f) => f.id));
    const next = new Set(selected);
    deleteTargets.forEach((f) => next.delete(f.id));
    setSelected(next);
    setDeleteTargets(null);
    toast({ title: `${n} file(s) deleted` });
  };

  // Upload dialog
  const isPdf = (f: File) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
  const readyFiles = pending.filter(isPdf);
  const skipped = pending.length - readyFiles.length;

  const addPending = (list: FileList | null) => {
    if (!list) return;
    setPending((p) => [...p, ...Array.from(list)]);
  };

  const closeUpload = (open: boolean) => {
    setUploadOpen(open);
    if (!open) { setPending([]); setDragOver(false); }
  };

  const handleUpload = () => {
    if (readyFiles.length === 0) return;
    const n = uploadFiles(readyFiles);
    closeUpload(false);
    setFromInput(""); setToInput(""); setDateError("");
    setApplied({ from: "", to: "" });
    setPage(1);
    setSelected(new Set());
    toast({ title: `${n} files uploaded` });
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-foreground">Upload Fleet Card E Tax Invoice</h2>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />Upload Files
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="etax-from">From Date</Label>
            <Input id="etax-from" type="date" value={fromInput} onChange={(e) => setFromInput(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="etax-to">To Date</Label>
            <Input id="etax-to" type="date" value={toInput} onChange={(e) => setToInput(e.target.value)} className="w-44" />
          </div>
          <Button onClick={handleSearch}>Search</Button>
          <Button variant="outline" onClick={handleReset}>Reset</Button>
          <div className="ml-auto text-sm text-muted-foreground">
            Files available: <span className="font-semibold text-foreground">{rows.length}</span>
          </div>
        </div>
        {dateError && <p className="mt-2 text-sm" style={{ color: RED }}>{dateError}</p>}
      </div>

      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border px-4 py-2" style={{ borderColor: `${RED}33`, backgroundColor: `${RED}0D` }}>
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="destructive" onClick={() => setDeleteTargets(rows.filter((r) => selected.has(r.id)))}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />Delete selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-3" aria-hidden />
              <p className="font-semibold text-foreground">No files found</p>
              <p className="text-sm text-muted-foreground">Try a different date range, or upload files with Upload Files.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allOnPageSelected} onCheckedChange={(c) => toggleAllOnPage(!!c)} aria-label="Select all rows on this page" />
                  </TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Checkbox checked={selected.has(f.id)} onCheckedChange={(c) => toggleRow(f.id, !!c)} aria-label={`Select ${f.fileName}`} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PdfIcon />
                        <button type="button" className="text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm" style={{ color: BLUE }} onClick={() => setPreview(f)}>
                          {f.fileName}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{f.uploadDate}</TableCell>
                    <TableCell className="text-sm">{f.uploadedBy}</TableCell>
                    <TableCell><UploadedPill /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Download ${f.fileName}`} onClick={() => handleDownload(f)}>
                              <Download className="h-4 w-4" style={{ color: BLUE }} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Delete ${f.fileName}`} onClick={() => setDeleteTargets([f])}>
                              <Trash2 className="h-4 w-4" style={{ color: RED }} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        {rows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
            <span>Showing {startIdx}–{endIdx} of {rows.length}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button>
              <span>Page {currentPage} of {totalPages}</span>
              <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={closeUpload}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Upload Fleet Card E Tax Invoice</DialogTitle>
          </DialogHeader>
          <div
            className={cn("flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 text-center transition-colors")}
            style={dragOver ? { borderColor: BLUE, backgroundColor: `${BLUE}0D` } : undefined}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addPending(e.dataTransfer.files); }}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" aria-hidden />
            <p className="font-medium text-foreground">Drag and drop PDF files here</p>
            <p className="text-sm text-muted-foreground mb-3">You can select multiple files at once.</p>
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" multiple className="hidden" onChange={(e) => { addPending(e.target.files); e.target.value = ""; }} />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>Browse files</Button>
          </div>

          {pending.length > 0 && (
            <div className="space-y-2">
              <div className="max-h-56 overflow-y-auto space-y-1.5">
                {pending.map((f, i) => {
                  const ok = isPdf(f);
                  return (
                    <div key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg border px-3 py-2" style={!ok ? { backgroundColor: `${RED}0D`, borderColor: `${RED}33` } : undefined}>
                      <PdfIcon />
                      <span className="flex-1 truncate text-sm">{f.name}</span>
                      <span className="text-xs text-muted-foreground">{formatFileSize(f.size)}</span>
                      {ok ? (
                        <UploadedPill label="Ready" />
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ color: RED, backgroundColor: `${RED}1A` }}>Not a PDF</span>
                      )}
                      <Button size="icon" variant="ghost" className="h-6 w-6" aria-label={`Remove ${f.name}`} onClick={() => setPending((p) => p.filter((_, idx) => idx !== i))}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">{readyFiles.length} files ready to upload · {skipped} skipped</p>
              {skipped > 0 && (
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: `${YELLOW}80`, backgroundColor: `${YELLOW}26` }}>
                  <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#9A6B00" }} aria-hidden />
                  <span>Files that are not PDF will be skipped.</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => closeUpload(false)}>Cancel</Button>
            <Button disabled={readyFiles.length === 0} onClick={handleUpload}>Upload {readyFiles.length} files</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 pr-6">
                  <PdfIcon />
                  <span className="truncate">{preview.fileName}</span>
                  <UploadedPill />
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                {/* TODO: Replace this placeholder with the real PDF viewer (embed the file URL here). */}
                <div className="relative min-h-[360px] rounded-xl border bg-card p-6 text-xs text-muted-foreground overflow-hidden">
                  <p className="text-sm font-bold text-foreground">e-Tax Invoice</p>
                  <p className="mb-4">Sample document</p>
                  <div className="space-y-2">
                    <div className="h-2 w-3/4 rounded bg-muted" />
                    <div className="h-2 w-1/2 rounded bg-muted" />
                    <div className="h-2 w-2/3 rounded bg-muted" />
                    <div className="mt-6 h-2 w-full rounded bg-muted" />
                    <div className="h-2 w-full rounded bg-muted" />
                    <div className="h-2 w-5/6 rounded bg-muted" />
                  </div>
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded border-4 px-4 py-1 text-3xl font-black tracking-widest opacity-60" style={{ color: RED, borderColor: RED }}>
                    SAMPLE
                  </span>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="font-semibold mb-3">File details</p>
                  <dl className="space-y-2 text-sm">
                    {[
                      ["File name", preview.fileName],
                      ["File type", "PDF"],
                      ["File size", formatFileSize(preview.size)],
                      ["Upload date", preview.uploadDate],
                      ["Uploaded by", preview.uploadedBy],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="text-right break-all">{v}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Status</dt>
                      <dd><UploadedPill /></dd>
                    </div>
                  </dl>
                </div>
              </div>
              <DialogFooter className="sm:justify-between">
                <Button variant="outline" style={{ color: RED, borderColor: RED }} onClick={() => { const f = preview; setPreview(null); setDeleteTargets([f]); }}>
                  <Trash2 className="h-4 w-4 mr-1" />Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPreview(null)}>Close</Button>
                  <Button onClick={() => handleDownload(preview)}><Download className="h-4 w-4 mr-1" />Download</Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTargets} onOpenChange={(o) => !o && setDeleteTargets(null)}>
        <DialogContent className="max-w-md">
          {deleteTargets && (
            <>
              <DialogHeader>
                <DialogTitle>{deleteTargets.length > 1 ? `Delete ${deleteTargets.length} files?` : "Delete file?"}</DialogTitle>
                <DialogDescription>
                  {deleteTargets.length > 1
                    ? `The ${deleteTargets.length} selected files will be removed from the uploaded files. This action cannot be undone.`
                    : `${deleteTargets[0].fileName} will be removed from the uploaded files. This action cannot be undone.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteTargets(null)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDelete}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
