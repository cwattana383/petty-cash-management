import { useState, useMemo } from "react";
import { format, subDays, isAfter } from "date-fns";
import { Calendar as CalendarIcon, Search, RefreshCw, RotateCcw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BankTransaction, PolicyResult, ProcessingStatus } from "@/lib/corporate-card-types";
import { mockBankTransactions, mockMccPolicies, mockCardholders } from "@/lib/corporate-card-mock-data";

const POLICY_BADGE: Record<PolicyResult, { label: string; className: string }> = {
  AUTO_APPROVED: { label: "Auto Approved", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  AUTO_REJECTED: { label: "Auto Rejected", className: "bg-red-100 text-red-800 border-red-200" },
  REQUIRES_APPROVAL: { label: "Requires Approval", className: "bg-amber-100 text-amber-800 border-amber-200" },
};

const STATUS_BADGE: Record<ProcessingStatus, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-blue-100 text-blue-800 border-blue-200" },
  PROCESSED: { label: "Processed", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  ERROR: { label: "Error", className: "bg-red-100 text-red-800 border-red-200" },
};

const PAGE_SIZE = 20;

export default function BankTransactions() {
  const defaultDateFrom = subDays(new Date("2026-02-28"), 6);
  const defaultDateTo = new Date("2026-02-28");

  const [dateFrom, setDateFrom] = useState<Date>(defaultDateFrom);
  const [dateTo, setDateTo] = useState<Date>(defaultDateTo);
  const [cardholder, setCardholder] = useState("all");
  const [mccCode, setMccCode] = useState("");
  const [policyResult, setPolicyResult] = useState("all");
  const [processingStatus, setProcessingStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"transaction_date" | "billing_amount">("transaction_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedTxn, setSelectedTxn] = useState<BankTransaction | null>(null);
  const [isLoading] = useState(false);

  const dateError = isAfter(dateFrom, dateTo);

  const categoryMap = useMemo(() => {
    const m: Record<string, string> = {};
    mockMccPolicies.forEach((p) => { m[p.mcc_code] = p.category; });
    return m;
  }, []);

  const filtered = useMemo(() => {
    let data = [...mockBankTransactions];
    data = data.filter((t) => {
      const td = new Date(t.transaction_date);
      if (td < dateFrom || td > dateTo) return false;
      if (cardholder !== "all" && t.cardholder_employee_id !== cardholder) return false;
      if (mccCode && !t.mcc_code.includes(mccCode)) return false;
      if (policyResult !== "all" && t.policy_result !== policyResult) return false;
      if (processingStatus !== "all" && t.processing_status !== processingStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!t.transaction_id.toLowerCase().includes(s) && !t.merchant_name.toLowerCase().includes(s) && !t.reference_number.toLowerCase().includes(s)) return false;
      }
      return true;
    });
    data.sort((a, b) => {
      const valA = sortBy === "billing_amount" ? a.billing_amount : new Date(a.transaction_date).getTime();
      const valB = sortBy === "billing_amount" ? b.billing_amount : new Date(b.transaction_date).getTime();
      return sortDir === "asc" ? valA - valB : valB - valA;
    });
    return data;
  }, [dateFrom, dateTo, cardholder, mccCode, policyResult, processingStatus, search, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setDateFrom(defaultDateFrom);
    setDateTo(defaultDateTo);
    setCardholder("all");
    setMccCode("");
    setPolicyResult("all");
    setProcessingStatus("all");
    setSearch("");
    setPage(1);
  };

  const toggleSort = (col: "transaction_date" | "billing_amount") => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("desc"); }
  };

  const formatCurrency = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Imported Bank Transactions</h1>
        <p className="text-sm text-muted-foreground">View transactions imported from bank files. One row = one transaction.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
        {/* Date From */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Date From</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left font-normal", dateError && "border-destructive")}>
                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                {format(dateFrom, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} /></PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Date To</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left font-normal", dateError && "border-destructive")}>
                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                {format(dateTo, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} /></PopoverContent>
          </Popover>
        </div>
        {dateError && <span className="text-xs text-destructive self-end pb-2">Date From cannot be after Date To</span>}

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Cardholder</label>
          <Select value={cardholder} onValueChange={setCardholder}>
            <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cardholders</SelectItem>
              {mockCardholders.map((c) => <SelectItem key={c.employee_id} value={c.employee_id}>{c.employee_id} - {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">MCC Code</label>
          <Input value={mccCode} onChange={(e) => setMccCode(e.target.value)} placeholder="e.g. 5812" className="w-[100px] h-9 text-sm" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Policy Result</label>
          <Select value={policyResult} onValueChange={setPolicyResult}>
            <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="AUTO_APPROVED">Auto Approved</SelectItem>
              <SelectItem value="AUTO_REJECTED">Auto Rejected</SelectItem>
              <SelectItem value="REQUIRES_APPROVAL">Requires Approval</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Processing Status</label>
          <Select value={processingStatus} onValueChange={setProcessingStatus}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="PROCESSED">Processed</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Transaction ID, Merchant, Ref No." className="pl-7 w-[240px] h-9 text-sm" />
          </div>
        </div>

        <div className="flex gap-2 self-end">
          <Button variant="outline" size="sm" onClick={resetFilters}><RotateCcw className="mr-1 h-3.5 w-3.5" />Reset</Button>
          <Button size="sm" disabled={dateError}><RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh</Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : paged.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">No transactions found for selected filters.</div>
        ) : (
          <>
            <div className="overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50 z-10">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Transaction ID</TableHead>
                    <TableHead className="whitespace-nowrap cursor-pointer select-none" onClick={() => toggleSort("transaction_date")}>
                      Transaction Date {sortBy === "transaction_date" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Cardholder</TableHead>
                    <TableHead className="whitespace-nowrap">Merchant Name</TableHead>
                    <TableHead className="whitespace-nowrap">MCC Code</TableHead>
                    <TableHead className="whitespace-nowrap">Category</TableHead>
                    <TableHead className="whitespace-nowrap text-right cursor-pointer select-none" onClick={() => toggleSort("billing_amount")}>
                      Billing Amount {sortBy === "billing_amount" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Policy Result</TableHead>
                    <TableHead className="whitespace-nowrap">Policy Reason</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.transaction_id}</TableCell>
                      <TableCell>{format(new Date(t.transaction_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="whitespace-nowrap">{t.cardholder_employee_id} - {t.cardholder_name}</TableCell>
                      <TableCell>{t.merchant_name}</TableCell>
                      <TableCell className="font-mono">{t.mcc_code}</TableCell>
                      <TableCell>{categoryMap[t.mcc_code] || "-"}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(t.billing_amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={POLICY_BADGE[t.policy_result].className}>{POLICY_BADGE[t.policy_result].label}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <Tooltip>
                          <TooltipTrigger asChild><span className="block truncate text-xs">{t.policy_reason}</span></TooltipTrigger>
                          <TooltipContent className="max-w-xs"><p className="text-xs">{t.policy_reason}</p></TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_BADGE[t.processing_status].className}>{STATUS_BADGE[t.processing_status].label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTxn(t)}><Eye className="h-3.5 w-3.5 mr-1" />View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Side Panel */}
      <Sheet open={!!selectedTxn} onOpenChange={(o) => !o && setSelectedTxn(null)}>
        <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Transaction Detail</SheetTitle>
          </SheetHeader>
          {selectedTxn && <TransactionDetail txn={selectedTxn} categoryMap={categoryMap} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[55%] break-words">{value}</span>
    </div>
  );
}

function TransactionDetail({ txn, categoryMap }: { txn: BankTransaction; categoryMap: Record<string, string> }) {
  const formatCurrency = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });
  return (
    <div className="mt-4 space-y-5">
      <div>
        <h4 className="text-sm font-semibold mb-2">Transaction Info</h4>
        <div className="rounded-md border p-3 space-y-0.5">
          <DetailField label="Transaction ID" value={<span className="font-mono text-xs">{txn.transaction_id}</span>} />
          <DetailField label="Transaction Date" value={format(new Date(txn.transaction_date), "dd/MM/yyyy")} />
          <DetailField label="Posting Date" value={format(new Date(txn.posting_date), "dd/MM/yyyy")} />
          <DetailField label="Transaction Type" value={txn.transaction_type} />
          <DetailField label="Authorization Code" value={txn.authorization_code} />
          <DetailField label="Reference Number" value={txn.reference_number} />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">Cardholder</h4>
        <div className="rounded-md border p-3 space-y-0.5">
          <DetailField label="Employee ID" value={txn.cardholder_employee_id} />
          <DetailField label="Name" value={txn.cardholder_name} />
          <DetailField label="Card Number" value="**** **** **** 1234" />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">Merchant & MCC</h4>
        <div className="rounded-md border p-3 space-y-0.5">
          <DetailField label="Merchant Name" value={txn.merchant_name} />
          <DetailField label="Merchant City" value={txn.merchant_city} />
          <DetailField label="Merchant Country" value={txn.merchant_country} />
          <DetailField label="MCC Code" value={txn.mcc_code} />
          <DetailField label="MCC Description" value={txn.mcc_description} />
          <DetailField label="Category" value={categoryMap[txn.mcc_code] || "-"} />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">Amount</h4>
        <div className="rounded-md border p-3 space-y-0.5">
          <DetailField label="Billing Amount" value={<span className="font-mono">{formatCurrency(txn.billing_amount)}</span>} />
          <DetailField label="Currency" value={txn.billing_currency} />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">Policy</h4>
        <div className="rounded-md border p-3 space-y-0.5">
          <DetailField label="Policy Result" value={<Badge variant="outline" className={POLICY_BADGE[txn.policy_result].className}>{POLICY_BADGE[txn.policy_result].label}</Badge>} />
          <DetailField label="Policy Reason" value={txn.policy_reason} />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">System</h4>
        <div className="rounded-md border p-3 space-y-0.5">
          <DetailField label="Processing Status" value={<Badge variant="outline" className={STATUS_BADGE[txn.processing_status].className}>{STATUS_BADGE[txn.processing_status].label}</Badge>} />
          <DetailField label="File ID" value={<span className="font-mono text-xs">{txn.file_id}</span>} />
          <DetailField label="Created At" value={format(new Date(txn.created_at), "dd/MM/yyyy HH:mm")} />
        </div>
      </div>
    </div>
  );
}

const POLICY_BADGE_EXPORT = POLICY_BADGE;
const STATUS_BADGE_EXPORT = STATUS_BADGE;
export { POLICY_BADGE_EXPORT as POLICY_BADGE_MAP, STATUS_BADGE_EXPORT as STATUS_BADGE_MAP };
