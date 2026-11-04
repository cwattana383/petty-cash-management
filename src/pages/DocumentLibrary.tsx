import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Lock, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { LibraryDatePicker } from "@/components/documents/LibraryDatePicker";
import { formatBEDate } from "@/lib/utils";
import { EMPTY_LIBRARY_FILTERS, readLibraryDocuments, filterLibraryDocuments, sortLibraryDocuments, downloadLibraryDocuments, type LibrarySortKey } from "@/lib/document-library";

export default function DocumentLibrary() {
  const { data: documents = [], isLoading, isError, refetch } = useQuery({ queryKey: ["document-library"], queryFn: readLibraryDocuments });
  const [draft, setDraft] = useState({ ...EMPTY_LIBRARY_FILTERS });
  const [applied, setApplied] = useState({ ...EMPTY_LIBRARY_FILTERS });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ key: LibrarySortKey; direction: "asc" | "desc" }>({ key: "uploadedAt", direction: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const filtered = useMemo(() => sortLibraryDocuments(filterLibraryDocuments(documents, applied), sort.key, sort.direction), [documents, applied, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedRows = filtered.filter((row) => selected.has(row.id));
  const allPageSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));
  const somePageSelected = rows.some((row) => selected.has(row.id));
  const uploaders = [...new Set(documents.map((row) => row.uploadedBy))].sort();

  const runSearch = () => { setApplied({ ...draft }); setPage(1); setSelected(new Set()); if (isError) void refetch(); };
  const clear = () => { setDraft({ ...EMPTY_LIBRARY_FILTERS }); setApplied({ ...EMPTY_LIBRARY_FILTERS }); setPage(1); setSelected(new Set()); };
  const toggleRow = (id: string, checked: boolean) => setSelected((previous) => { const next = new Set(previous); if (checked) next.add(id); else next.delete(id); return next; });
  const togglePage = (checked: boolean) => setSelected((previous) => { const next = new Set(previous); rows.forEach((row) => { if (checked) next.add(row.id); else next.delete(row.id); }); return next; });
  const sortHeader = (label: string, key: LibrarySortKey) => (
    <TableHead aria-sort={sort.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
      <Button variant="ghost" size="sm" className="-ml-3" onClick={() => { setSort({ key, direction: sort.key === key && sort.direction === "asc" ? "desc" : "asc" }); setPage(1); }}>
        {label}{sort.key === key ? (sort.direction === "asc" ? <ArrowUp /> : <ArrowDown />) : <ArrowUpDown />}
      </Button>
    </TableHead>
  );

  return (
    <div className="document-library space-y-6 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 basis-[420px]">
          <h1 className="text-2xl font-bold text-foreground">Document Library</h1>
          <p className="text-muted-foreground">Search and download documents attached to card transactions, for Revenue Department audit requests</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 whitespace-normal"><Lock className="h-3.5 w-3.5 shrink-0" />Read-only: search and download only</Badge>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); runSearch(); }} className="rounded-lg border border-border bg-background p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input aria-label="Search documents" placeholder="Search by document name or transaction no." className="pl-9" value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Label>Card Type:</Label>
          <Tabs value={draft.cardType} onValueChange={(cardType) => setDraft({ ...draft, cardType })}>
            <TabsList><TabsTrigger value="all">All Cards</TabsTrigger><TabsTrigger value="Credit Card">Credit Card</TabsTrigger><TabsTrigger value="Fleet Card">Fleet Card</TabsTrigger></TabsList>
          </Tabs>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Label>Transaction Date:</Label>
          <LibraryDatePicker label="Transaction Date from" value={draft.transactionFrom} onChange={(transactionFrom) => setDraft({ ...draft, transactionFrom })} />
          <span className="text-sm text-muted-foreground">to</span>
          <LibraryDatePicker label="Transaction Date to" value={draft.transactionTo} onChange={(transactionTo) => setDraft({ ...draft, transactionTo })} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Label>Upload Date:</Label>
          <LibraryDatePicker label="Upload Date from" value={draft.uploadFrom} onChange={(uploadFrom) => setDraft({ ...draft, uploadFrom })} />
          <span className="text-sm text-muted-foreground">to</span>
          <LibraryDatePicker label="Upload Date to" value={draft.uploadTo} onChange={(uploadTo) => setDraft({ ...draft, uploadTo })} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Label htmlFor="library-uploader">Uploaded By:</Label>
          <Select value={draft.uploadedBy} onValueChange={(uploadedBy) => setDraft({ ...draft, uploadedBy })}>
            <SelectTrigger id="library-uploader" className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All users</SelectItem>{uploaders.map((user) => <SelectItem key={user} value={user}>{user}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={clear}>Clear</Button><Button type="submit"><Search />Search</Button></div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground" aria-live="polite">{filtered.length} documents found · {selectedRows.length} selected</span>
        <Button disabled={selectedRows.length === 0} onClick={() => downloadLibraryDocuments(selectedRows)}><Download />Download selected ({selectedRows.length})</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1120px]">
              <TableHeader><TableRow>
                <TableHead className="w-12"><Checkbox aria-label="Select all documents on current page" disabled={rows.length === 0} checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false} onCheckedChange={(checked) => togglePage(checked === true)} /></TableHead>
                {sortHeader("Document Name", "name")}<TableHead>Transaction No.</TableHead><TableHead>Card Type</TableHead>
                {sortHeader("Transaction Date", "transactionDate")}{sortHeader("Upload Date", "uploadedAt")}{sortHeader("Uploaded By", "uploadedBy")}<TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 8 }, (_, index) => <TableRow key={index}>{Array.from({ length: 8 }, (_, cell) => <TableCell key={cell}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) : isError ? <TableRow><TableCell colSpan={8} className="h-28 text-center text-destructive" role="alert">Documents could not be loaded</TableCell></TableRow> : rows.length === 0 ? <TableRow><TableCell colSpan={8} className="h-28 text-center text-muted-foreground">No documents match your search</TableCell></TableRow> : rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell><Checkbox aria-label={`Select ${row.name}`} checked={selected.has(row.id)} onCheckedChange={(checked) => toggleRow(row.id, checked === true)} /></TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{row.name}</TableCell>
                    <TableCell><Link className="text-primary hover:underline whitespace-nowrap" to={`/claims/${encodeURIComponent(row.transactionNo)}`}>{row.transactionNo}</Link></TableCell>
                    <TableCell><Badge variant="outline" className={`whitespace-nowrap ${row.cardType === "Fleet Card" ? "library-fleet-pill" : "library-credit-pill"}`}>{row.cardType}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap">{formatBEDate(row.transactionDate)}</TableCell><TableCell className="whitespace-nowrap">{formatBEDate(row.uploadedAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.uploadedBy}</TableCell>
                    <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => downloadLibraryDocuments([row])}><Download />Download</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <div className="flex items-center gap-2"><Label htmlFor="library-page-size">Rows per page</Label><Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}><SelectTrigger id="library-page-size" className="w-20"><SelectValue /></SelectTrigger><SelectContent>{[25, 50, 100].map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex flex-wrap items-center gap-1">
              <Button variant="outline" size="icon" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft /></Button>
              {Array.from({ length: pages }, (_, index) => <Button key={index} size="icon" variant={currentPage === index + 1 ? "default" : "outline"} aria-label={`Page ${index + 1}`} aria-current={currentPage === index + 1 ? "page" : undefined} onClick={() => setPage(index + 1)}>{index + 1}</Button>)}
              <Button variant="outline" size="icon" aria-label="Next page" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}><ChevronRight /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}