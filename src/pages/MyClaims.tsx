import { useState, useMemo, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BankStatementLine, SystemTransaction, ReconciliationLink, ReconciliationFilters, defaultFilters } from "@/lib/reconciliation-types";
import { mockBankStatementLines, mockSystemTransactions, mockReconciliationLinks } from "@/lib/reconciliation-mock-data";
import ReconciliationFilterPanel from "@/components/reconciliation/ReconciliationFilterPanel";
import BankStatementTable from "@/components/reconciliation/BankStatementTable";
import SystemTransactionTable from "@/components/reconciliation/SystemTransactionTable";
import MatchBar from "@/components/reconciliation/MatchBar";
import MatchedPairsTable from "@/components/reconciliation/MatchedPairsTable";
import ReconciliationDetailDrawer from "@/components/reconciliation/ReconciliationDetailDrawer";

export default function MyClaims() {
  const [tab, setTab] = useState<"unreconciled" | "reconciled">("unreconciled");
  const [filters, setFilters] = useState<ReconciliationFilters>(defaultFilters);

  // State data (mutable for match/unmatch)
  const [bankLines, setBankLines] = useState<BankStatementLine[]>(mockBankStatementLines);
  const [systemTxns, setSystemTxns] = useState<SystemTransaction[]>(mockSystemTransactions);
  const [links, setLinks] = useState<ReconciliationLink[]>(mockReconciliationLinks);

  // Selection
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [selectedSysTxnId, setSelectedSysTxnId] = useState<string | null>(null);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerBank, setDrawerBank] = useState<BankStatementLine | null>(null);
  const [drawerSys, setDrawerSys] = useState<SystemTransaction | null>(null);
  const [drawerLink, setDrawerLink] = useState<ReconciliationLink | null>(null);

  // Matched IDs
  const matchedBankIds = useMemo(() => new Set(links.map((l) => l.bankStatementLineId)), [links]);
  const matchedSysIds = useMemo(() => new Set(links.map((l) => l.systemTransactionId)), [links]);

  // Filter logic
  const applyFilters = useCallback(<T extends { transactionDate: string; amount: number; merchantName: string }>(items: T[]): T[] => {
    return items.filter((item) => {
      if (filters.dateFrom && item.transactionDate < filters.dateFrom) return false;
      if (filters.dateTo && item.transactionDate > filters.dateTo) return false;
      if (filters.amountMin && item.amount < Number(filters.amountMin)) return false;
      if (filters.amountMax && item.amount > Number(filters.amountMax)) return false;
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const searchable = [
          item.merchantName,
          (item as any).reference || "",
          (item as any).description || "",
          (item as any).purpose || "",
          (item as any).claimId || "",
          (item as any).id || "",
          (item as any).authorizationCode || "",
        ].join(" ").toLowerCase();
        if (!searchable.includes(kw)) return false;
      }
      return true;
    });
  }, [filters]);

  // Unreconciled data
  const unreconciledBank = useMemo(() =>
    applyFilters(bankLines.filter((b) => b.reconciliationStatus === "Unmatched")),
  [bankLines, matchedBankIds, applyFilters]);

  const unreconciledSys = useMemo(() => {
    let items = systemTxns.filter((s) => s.reconciliationStatus === "Unmatched");
    if (filters.transactionType !== "all") items = items.filter((s) => s.type === filters.transactionType);
    if (filters.transactionSource !== "all") items = items.filter((s) => s.source === filters.transactionSource);
    return applyFilters(items);
  }, [systemTxns, matchedSysIds, filters, applyFilters]);

  // Reconciled data
  const reconciledBank = useMemo(() =>
    applyFilters(bankLines.filter((b) => b.reconciliationStatus === "Matched")),
  [bankLines, matchedBankIds, applyFilters]);

  const reconciledSys = useMemo(() => {
    let items = systemTxns.filter((s) => s.reconciliationStatus === "Matched");
    if (filters.transactionType !== "all") items = items.filter((s) => s.type === filters.transactionType);
    if (filters.transactionSource !== "all") items = items.filter((s) => s.source === filters.transactionSource);
    return applyFilters(items);
  }, [systemTxns, matchedSysIds, filters, applyFilters]);

  // Auto-suggest: when bank line is selected, sort system txns by relevance
  const suggestedSysTxns = useMemo(() => {
    if (!selectedBankId || tab !== "unreconciled") return unreconciledSys;
    const bank = bankLines.find((b) => b.id === selectedBankId);
    if (!bank) return unreconciledSys;
    return [...unreconciledSys].sort((a, b) => {
      const aDiff = Math.abs(a.amount - bank.amount);
      const bDiff = Math.abs(b.amount - bank.amount);
      if (aDiff !== bDiff) return aDiff - bDiff;
      const aDateDiff = Math.abs(new Date(a.transactionDate).getTime() - new Date(bank.transactionDate).getTime());
      const bDateDiff = Math.abs(new Date(b.transactionDate).getTime() - new Date(bank.transactionDate).getTime());
      return aDateDiff - bDateDiff;
    });
  }, [selectedBankId, unreconciledSys, bankLines, tab]);

  // Match validation
  const matchWarning = useMemo(() => {
    if (!selectedBankId || !selectedSysTxnId) return null;
    const bank = bankLines.find((b) => b.id === selectedBankId);
    const sys = systemTxns.find((s) => s.id === selectedSysTxnId);
    if (!bank || !sys) return null;
    const warnings: string[] = [];
    const pctDiff = Math.abs(bank.amount - sys.amount) / Math.max(bank.amount, sys.amount) * 100;
    if (pctDiff > 5) warnings.push(`Amount variance: ฿${Math.abs(bank.amount - sys.amount).toLocaleString()} (${pctDiff.toFixed(1)}%)`);
    const daysDiff = Math.abs(new Date(bank.transactionDate).getTime() - new Date(sys.transactionDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) warnings.push(`Date gap: ${daysDiff.toFixed(0)} days apart`);
    return warnings.length ? warnings.join(" | ") : null;
  }, [selectedBankId, selectedSysTxnId, bankLines, systemTxns]);

  const handleMatch = () => {
    if (!selectedBankId || !selectedSysTxnId) return;
    const bank = bankLines.find((b) => b.id === selectedBankId)!;
    const sys = systemTxns.find((s) => s.id === selectedSysTxnId)!;

    if (matchWarning) {
      const proceed = window.confirm(`Warning:\n${matchWarning}\n\nProceed with match?`);
      if (!proceed) return;
    }

    const newLink: ReconciliationLink = {
      id: `LINK-${Date.now()}`,
      bankStatementLineId: selectedBankId,
      systemTransactionId: selectedSysTxnId,
      matchedAt: new Date().toISOString(),
      matchedBy: "สมชาย ใจดี",
      status: "Matched",
      varianceAmount: bank.amount - sys.amount,
    };

    setLinks((prev) => [...prev, newLink]);
    setBankLines((prev) => prev.map((b) => b.id === selectedBankId ? { ...b, reconciliationStatus: "Matched" as const } : b));
    setSystemTxns((prev) => prev.map((s) => s.id === selectedSysTxnId ? { ...s, reconciliationStatus: "Matched" as const } : s));
    setSelectedBankId(null);
    setSelectedSysTxnId(null);
    toast.success("Matched successfully!");
  };

  const handleUnmatch = (link: ReconciliationLink) => {
    if (!window.confirm("Are you sure you want to unmatch this pair? This will be recorded in the audit trail.")) return;
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
    setBankLines((prev) => prev.map((b) => b.id === link.bankStatementLineId ? { ...b, reconciliationStatus: "Unmatched" as const } : b));
    setSystemTxns((prev) => prev.map((s) => s.id === link.systemTransactionId ? { ...s, reconciliationStatus: "Unmatched" as const } : s));
    toast.info("Pair unmatched. Audit trail recorded.");
  };

  const handleViewPair = (link: ReconciliationLink) => {
    setDrawerBank(bankLines.find((b) => b.id === link.bankStatementLineId) || null);
    setDrawerSys(systemTxns.find((s) => s.id === link.systemTransactionId) || null);
    setDrawerLink(link);
    setDrawerOpen(true);
  };

  const handleBankRowClick = (line: BankStatementLine) => {
    setDrawerBank(line);
    const link = links.find((l) => l.bankStatementLineId === line.id);
    setDrawerSys(link ? systemTxns.find((s) => s.id === link.systemTransactionId) || null : null);
    setDrawerLink(link || null);
    setDrawerOpen(true);
  };

  const handleSysRowClick = (txn: SystemTransaction) => {
    setDrawerSys(txn);
    const link = links.find((l) => l.systemTransactionId === txn.id);
    setDrawerBank(link ? bankLines.find((b) => b.id === link.bankStatementLineId) || null : null);
    setDrawerLink(link || null);
    setDrawerOpen(true);
  };

  const selectedBank = selectedBankId ? bankLines.find((b) => b.id === selectedBankId) || null : null;
  const selectedSys = selectedSysTxnId ? systemTxns.find((s) => s.id === selectedSysTxnId) || null : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Expenses & Corporate Card Transactions</h1>
        <p className="text-muted-foreground">จับคู่รายการ Bank Statement กับรายการในระบบ</p>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setSelectedBankId(null); setSelectedSysTxnId(null); }}>
        <TabsList>
          <TabsTrigger value="unreconciled">
            Unreconciled
            <span className="ml-1.5 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
              {bankLines.filter((b) => b.reconciliationStatus === "Unmatched").length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="reconciled">
            Reconciled
            <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
              {links.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="mt-4">
          <ReconciliationFilterPanel filters={filters} onChange={setFilters} />
        </div>

        {/* Unreconciled Tab */}
        <TabsContent value="unreconciled">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
            <BankStatementTable
              lines={unreconciledBank}
              selectedId={selectedBankId}
              onSelect={setSelectedBankId}
              onRowClick={handleBankRowClick}
            />
            <SystemTransactionTable
              transactions={suggestedSysTxns}
              selectedId={selectedSysTxnId}
              onSelect={setSelectedSysTxnId}
              onRowClick={handleSysRowClick}
            />
          </div>

          <MatchBar
            bankLine={selectedBank}
            systemTxn={selectedSys}
            onMatch={handleMatch}
            onClear={() => { setSelectedBankId(null); setSelectedSysTxnId(null); }}
            warning={matchWarning}
          />
        </TabsContent>

        {/* Reconciled Tab */}
        <TabsContent value="reconciled">
          <div className="mt-2">
            <MatchedPairsTable
              links={links}
              bankLines={bankLines}
              systemTxns={systemTxns}
              onViewPair={handleViewPair}
              onUnmatch={handleUnmatch}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Drawer */}
      <ReconciliationDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        bankLine={drawerBank}
        systemTxn={drawerSys}
        link={drawerLink}
      />
    </div>
  );
}
