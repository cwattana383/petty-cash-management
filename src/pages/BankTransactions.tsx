import { useState, useMemo, useCallback, useEffect } from "react";
import { format, isAfter } from "date-fns";
import { Calendar as CalendarIcon, Search, Upload, RefreshCw, RotateCcw, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { BankTransaction, PolicyResult, ProcessingStatus, BankTransactionQueryParams } from "@/lib/corporate-card-types";
import { ImportBankFileDialog } from "@/components/bank-transactions/ImportBankFileDialog";
import { useBankTransactions, useBankTransactionFilterOptions } from "@/hooks/use-bank-transactions";

const POLICY_BADGE: Record<PolicyResult, { label: string; className: string }> = {
  AUTO_APPROVED: { label: "Auto Approved", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  AUTO_REJECTED: { label: "Auto Rejected", className: "bg-red-100 text-red-800 border-red-200" },
  REQUIRES_APPROVAL: { label: "Requires Approval", className: "bg-amber-100 text-amber-800 border-amber-200" },
};

const STATUS_BADGE: Record<ProcessingStatus, { label: string; className: string }> = {
  NEW:           { label: "New",           className: "bg-blue-100 text-blue-800 border-blue-200" },
  PENDING_MATCH: { label: "Pending Match", className: "bg-orange-100 text-orange-800 border-orange-200" },
  PROCESSED:     { label: "Processed",     className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  ERROR:         { label: "Error",         className: "bg-red-100 text-red-800 border-red-200" },
};

const PAGE_SIZE = 50;

type SortableField = "transactionDate" | "billingAmount" | "cardholderName" | "merchantName" | "postingDate";

export default function BankTransactions() {
  // Filter state
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [cardholder, setCardholder] = useState("all");
  const [mccCode, setMccCode] = useState("all");
  const [policyResult, setPolicyResult] = useState("all");
  const [processingStatus, setProcessingStatus] = useState("all");
  const [transactionType, setTransactionType] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortableField>("transactionDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedTxn, setSelectedTxn] = useState<BankTransaction | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [cardholderOpen, setCardholderOpen] = useState(false);
  const [mccOpen, setMccOpen] = useState(false);

  const dateError = dateFrom && dateTo ? isAfter(dateFrom, dateTo) : false;

  // Build query params for API
  const queryParams = useMemo<BankTransactionQueryParams>(() => {
    const params: BankTransactionQueryParams = {
      page,
      limit: PAGE_SIZE,
      sortBy,
      sortOrder: sortDir,
    };
    if (search) params.search = search;
    if (dateFrom) params.dateFrom = format(dateFrom, "yyyy-MM-dd");
    if (dateTo) params.dateTo = format(dateTo, "yyyy-MM-dd");
    if (cardholder !== "all") params.cardholder = cardholder;
    if (mccCode !== "all") params.mccCode = mccCode;
    if (policyResult !== "all") params.policyResult = policyResult;
    if (processingStatus !== "all") params.processingStatus = processingStatus;
    if (transactionType !== "all") params.transactionType = transactionType;
    return params;
  }, [page, sortBy, sortDir, search, dateFrom, dateTo, cardholder, mccCode, policyResult, processingStatus, transactionType]);

  // API hooks
  const { data: txnResponse, isLoading, isFetching } = useBankTransactions(queryParams);
  const { data: filterOptions } = useBankTransactionFilterOptions();

  const transactions = txnResponse?.data ?? [];
  const meta = txnResponse?.meta ?? { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 };

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, dateFrom, dateTo, cardholder, mccCode, policyResult, processingStatus, transactionType]);

  const resetFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setCardholder("all");
    setMccCode("all");
    setPolicyResult("all");
    setProcessingStatus("all");
    setTransactionType("all");
    setSearch("");
    setPage(1);
  };

  const handleImport = useCallback(() => {
    setPage(1);
  }, []);

  const toggleSort = (col: SortableField) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("desc"); }
  };

  const formatCurrency = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  const sortIndicator = (col: SortableField) => sortBy === col ? (sortDir === "desc" ? " ↓" : " ↑") : "";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Imported Bank Transactions</h1>
        {isFetching && !isLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>


      {/* Filters */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Date From</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left font-normal", dateError && "border-destructive")}>
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "All"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateFrom} onSelect={(d) => setDateFrom(d ?? undefined)} /></PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Date To</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left font-normal", dateError && "border-destructive")}>
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy") : "All"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateTo} onSelect={(d) => setDateTo(d ?? undefined)} /></PopoverContent>
            </Popover>
          </div>
          {dateError && <span className="text-xs text-destructive self-end pb-2">Date From &gt; Date To</span>}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Cardholder</label>
            <Popover open={cardholderOpen} onOpenChange={setCardholderOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" role="combobox" aria-expanded={cardholderOpen} className="w-[180px] justify-between font-normal">
                  <span className="truncate">
                    {cardholder === "all"
                      ? "All Cardholders"
                      : filterOptions?.cardholders.find((c) => c.cardholderEmployeeId === cardholder)
                        ? `${cardholder} - ${filterOptions.cardholders.find((c) => c.cardholderEmployeeId === cardholder)!.cardholderName}`
                        : cardholder}
                  </span>
                  <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[260px] p-0" side="bottom" align="start">
                <Command>
                  <CommandInput placeholder="Search cardholder..." />
                  <CommandList>
                    <CommandEmpty>No cardholder found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="all" onSelect={() => { setCardholder("all"); setCardholderOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", cardholder === "all" ? "opacity-100" : "opacity-0")} />
                        All Cardholders
                      </CommandItem>
                      {filterOptions?.cardholders.map((c) => (
                        <CommandItem key={c.cardholderEmployeeId} value={`${c.cardholderEmployeeId} ${c.cardholderName}`} onSelect={() => { setCardholder(c.cardholderEmployeeId); setCardholderOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", cardholder === c.cardholderEmployeeId ? "opacity-100" : "opacity-0")} />
                          {c.cardholderEmployeeId} - {c.cardholderName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">MCC Code</label>
            <Popover open={mccOpen} onOpenChange={setMccOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" role="combobox" aria-expanded={mccOpen} className="w-[160px] justify-between font-normal">
                  <span className="truncate">
                    {mccCode === "all"
                      ? "All"
                      : mccCode}
                  </span>
                  <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" side="bottom" align="start">
                <Command>
                  <CommandInput placeholder="Search MCC code..." />
                  <CommandList>
                    <CommandEmpty>No MCC code found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="all" onSelect={() => { setMccCode("all"); setMccOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", mccCode === "all" ? "opacity-100" : "opacity-0")} />
                        All
                      </CommandItem>
                      {[...new Set(filterOptions?.mccCodes.map((m) => m.mccCode))].map((code) => (
                        <CommandItem key={code} value={code} onSelect={() => { setMccCode(code); setMccOpen(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", mccCode === code ? "opacity-100" : "opacity-0")} />
                          {code}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Policy Result</label>
            <Select value={policyResult} onValueChange={setPolicyResult}>
              <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filterOptions?.policyResults.map((p) => (
                  <SelectItem key={p} value={p}>{POLICY_BADGE[p as PolicyResult]?.label ?? p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={processingStatus} onValueChange={setProcessingStatus}>
              <SelectTrigger className="w-[120px] h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filterOptions?.processingStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_BADGE[s as ProcessingStatus]?.label ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ID, Merchant, Ref No." className="pl-7 w-[180px] h-9 text-sm" />
            </div>
          </div>

          {(search || dateFrom || dateTo || cardholder !== "all" || mccCode !== "all" || policyResult !== "all" || processingStatus !== "all" || transactionType !== "all") && (
            <Button variant="ghost" size="sm" className="self-end" onClick={resetFilters}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" />Reset
            </Button>
          )}

          <Button size="sm" className="self-end" onClick={() => setImportOpen(true)}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />+ Import Bank File
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : transactions.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">No transactions found for selected filters.</div>
        ) : (
          <>
            <div className="overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50 z-10">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Transaction ID</TableHead>
                    <TableHead className="whitespace-nowrap cursor-pointer select-none" onClick={() => toggleSort("transactionDate")}>
                      Transaction Date{sortIndicator("transactionDate")}
                    </TableHead>
                    <TableHead className="whitespace-nowrap cursor-pointer select-none" onClick={() => toggleSort("cardholderName")}>
                      Cardholder{sortIndicator("cardholderName")}
                    </TableHead>
                    <TableHead className="whitespace-nowrap cursor-pointer select-none" onClick={() => toggleSort("merchantName")}>
                      Merchant Name{sortIndicator("merchantName")}
                    </TableHead>
                    <TableHead className="whitespace-nowrap">MCC Code</TableHead>
                    <TableHead className="whitespace-nowrap text-center">Category</TableHead>
                    <TableHead className="whitespace-nowrap text-right cursor-pointer select-none" onClick={() => toggleSort("billingAmount")}>
                      Billing Amount{sortIndicator("billingAmount")}
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Policy Result</TableHead>
                    <TableHead className="whitespace-nowrap">Creation Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedTxn(t)}>
                      <TableCell className="font-mono text-xs">{t.transaction_id}</TableCell>
                      <TableCell>{format(new Date(t.transaction_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="whitespace-nowrap">{t.cardholder_employee_id} - {t.cardholder_name}</TableCell>
                      <TableCell>{t.merchant_name}</TableCell>
                      <TableCell className="font-mono">{t.mcc_code}</TableCell>
                      <TableCell className="text-center">{t.category || "—"}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(t.billing_amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={POLICY_BADGE[t.policy_result].className}>{POLICY_BADGE[t.policy_result].label}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{format(new Date(t.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">
                Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <span className="flex items-center px-3 text-sm text-muted-foreground">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
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
          {selectedTxn && <TransactionDetail txn={selectedTxn} />}
        </SheetContent>
      </Sheet>

      <ImportBankFileDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
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

function TransactionDetail({ txn }: { txn: BankTransaction }) {
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
          <DetailField label="Category" value={txn.category || "—"} />
          <DetailField label="Import Status" value={txn.import_status || "—"} />
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
// eslint-disable-next-line react-refresh/only-export-components
export { POLICY_BADGE_EXPORT as POLICY_BADGE_MAP, STATUS_BADGE_EXPORT as STATUS_BADGE_MAP };
