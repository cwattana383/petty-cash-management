import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, ChevronDown, CreditCard, FileText, AlertTriangle, Link2, CheckCircle2, Clock, Upload } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useClaims } from "@/lib/claims-context";
import { getUnifiedExpenses, UnifiedExpenseItem, mockCorpCardTransactions } from "@/lib/unified-expenses";
import TransactionDrawer from "@/components/claims/TransactionDrawer";
import SelectTransactionModal from "@/components/claims/SelectTransactionModal";

const statusColors: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  "Pending Submit": "bg-orange-100 text-orange-800",
  "Pending Approval": "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  "Need Info": "bg-blue-100 text-blue-800",
  "Payroll Deduction": "bg-indigo-100 text-indigo-800",
  Reconciled: "bg-purple-100 text-purple-800",
  Paid: "bg-emerald-100 text-emerald-800",
};

const reconcileColors: Record<string, string> = {
  "Not Submitted": "bg-muted text-muted-foreground",
  "Pending Reconcile": "bg-yellow-100 text-yellow-800",
  Matched: "bg-green-100 text-green-800",
  "Amount Mismatch": "bg-red-100 text-red-800",
  "Employee Payable": "bg-orange-100 text-orange-800",
  "—": "bg-transparent text-muted-foreground",
};

export default function MyClaims() {
  const navigate = useNavigate();
  const { claims } = useClaims();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [billingCycleFilter, setBillingCycleFilter] = useState("all");
  const [cardFilter, setCardFilter] = useState("all");
  const [drawerItem, setDrawerItem] = useState<UnifiedExpenseItem | null>(null);
  const [selectTxnOpen, setSelectTxnOpen] = useState(false);

  const unified = useMemo(() => getUnifiedExpenses(claims), [claims]);

  // Summary counts
  const counts = useMemo(() => ({
    pendingSubmit: unified.filter((i) => i.status === "Pending Submit").length,
    pendingApproval: unified.filter((i) => i.status === "Pending Approval").length,
    needAction: unified.filter((i) => ["Rejected", "Need Info"].includes(i.status) || i.reconcile_status === "Amount Mismatch").length,
    unreconciled: unified.filter((i) => i.item_type === "CORP_CARD" && !["Matched"].includes(i.reconcile_status) && i.reconcile_status !== "—").length,
    reconciled: unified.filter((i) => i.reconcile_status === "Matched").length,
  }), [unified]);

  // Unique billing cycles & cards
  const billingCycles = useMemo(() => [...new Set(mockCorpCardTransactions.map((t) => t.billing_cycle))].sort(), []);
  const cards = useMemo(() => [...new Set(mockCorpCardTransactions.map((t) => t.card_last4))].sort(), []);

  // Quick filter from summary cards
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return unified.filter((item) => {
      // Quick filter
      if (quickFilter === "pendingSubmit" && item.status !== "Pending Submit") return false;
      if (quickFilter === "pendingApproval" && item.status !== "Pending Approval") return false;
      if (quickFilter === "needAction" && !["Rejected", "Need Info"].includes(item.status) && item.reconcile_status !== "Amount Mismatch") return false;
      if (quickFilter === "unreconciled" && (item.item_type !== "CORP_CARD" || item.reconcile_status === "Matched" || item.reconcile_status === "—")) return false;
      if (quickFilter === "reconciled" && item.reconcile_status !== "Matched") return false;

      // Search
      if (search) {
        const s = search.toLowerCase();
        const match = item.item_no.toLowerCase().includes(s)
          || item.merchant_vendor.toLowerCase().includes(s)
          || (item.purpose || "").toLowerCase().includes(s)
          || (item.transaction_id || "").toLowerCase().includes(s);
        if (!match) return false;
      }

      // Status dropdown
      if (statusFilter !== "all" && item.status !== statusFilter) return false;

      // Type dropdown
      if (typeFilter === "CORP_CARD" && item.item_type !== "CORP_CARD") return false;
      if (typeFilter === "MANUAL" && item.item_type !== "MANUAL") return false;

      // Billing cycle
      if (billingCycleFilter !== "all" && item.billing_cycle !== billingCycleFilter) return false;

      // Card
      if (cardFilter !== "all" && item.card_last4 !== cardFilter) return false;

      return true;
    });
  }, [unified, search, statusFilter, typeFilter, billingCycleFilter, cardFilter, quickFilter]);

  const handleQuickFilter = (key: string) => {
    setQuickFilter((prev) => (prev === key ? null : key));
    setStatusFilter("all");
    setTypeFilter("all");
    setBillingCycleFilter("all");
    setCardFilter("all");
  };

  const handleRowClick = (item: UnifiedExpenseItem) => {
    if (item.item_type === "MANUAL" && item.claim_id) {
      navigate(`/claims/${item.claim_id}`);
    } else {
      setDrawerItem(item);
    }
  };

  const handleSelectTxn = (txnId: string) => {
    setSelectTxnOpen(false);
    navigate(`/claims/create?transaction_id=${txnId}`);
  };

  const summaryCards = [
    { key: "pendingSubmit", label: "Pending Submit", count: counts.pendingSubmit, icon: Clock, color: "text-orange-600 bg-orange-50 border-orange-200" },
    { key: "pendingApproval", label: "Pending Approval", count: counts.pendingApproval, icon: FileText, color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
    { key: "needAction", label: "Need Action", count: counts.needAction, icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-200" },
    { key: "unreconciled", label: "Unreconciled", count: counts.unreconciled, icon: Link2, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { key: "reconciled", label: "Reconciled", count: counts.reconciled, icon: CheckCircle2, color: "text-green-600 bg-green-50 border-green-200" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Expenses & Corporate Card Transactions</h1>
          <p className="text-muted-foreground">Manage your expenses and corporate card transactions in one place</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Claim<ChevronDown className="h-4 w-4 ml-2" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate("/claims/create")}>
              <FileText className="h-4 w-4 mr-2" />New Manual Claim
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectTxnOpen(true)}>
              <CreditCard className="h-4 w-4 mr-2" />Select Corporate Card Transaction
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summaryCards.map((sc) => (
          <Card
            key={sc.key}
            className={`cursor-pointer transition-all border-2 ${quickFilter === sc.key ? sc.color + " ring-2 ring-offset-1" : "hover:shadow-md"}`}
            onClick={() => handleQuickFilter(sc.key)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <sc.icon className={`h-5 w-5 ${quickFilter === sc.key ? "" : "text-muted-foreground"}`} />
              <div>
                <div className="text-2xl font-bold">{sc.count}</div>
                <div className="text-xs text-muted-foreground">{sc.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search merchant, purpose, claim no, txn id..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setQuickFilter(null); }}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.keys(statusColors).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setQuickFilter(null); }}>
              <SelectTrigger className="w-full sm:w-[170px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CORP_CARD">Corporate Card</SelectItem>
                <SelectItem value="MANUAL">Manual Claim</SelectItem>
              </SelectContent>
            </Select>
            <Select value={billingCycleFilter} onValueChange={(v) => { setBillingCycleFilter(v); setQuickFilter(null); }}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Billing Cycle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cycles</SelectItem>
                {billingCycles.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={cardFilter} onValueChange={(v) => { setCardFilter(v); setQuickFilter(null); }}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Card" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cards</SelectItem>
                {cards.map((c) => <SelectItem key={c} value={c}>xxxx-{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Merchant / Vendor</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Card</TableHead>
                <TableHead>Billing Cycle</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reconciliation</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No items found</TableCell></TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={`${item.item_type}-${item.item_no}`} className="cursor-pointer hover:bg-muted/50" onClick={() => handleRowClick(item)}>
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-1.5">
                        {item.item_type === "CORP_CARD" ? <CreditCard className="h-3.5 w-3.5 text-muted-foreground" /> : <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                        {item.item_no}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{item.date}</TableCell>
                    <TableCell className="text-sm max-w-[180px] truncate">{item.merchant_vendor}</TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">{item.purpose || "—"}</TableCell>
                    <TableCell className="text-sm">{item.card_last4 ? `xxxx-${item.card_last4}` : "—"}</TableCell>
                    <TableCell className="text-sm">{item.billing_cycle || "—"}</TableCell>
                    <TableCell className="text-right font-medium text-sm">฿{item.amount.toLocaleString()}</TableCell>
                    <TableCell><Badge className={statusColors[item.status] || "bg-muted text-muted-foreground"}>{item.status}</Badge></TableCell>
                    <TableCell><Badge className={reconcileColors[item.reconcile_status] || "bg-muted text-muted-foreground"}>{item.reconcile_status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {item.item_type === "CORP_CARD" && item.status === "Pending Submit" && (
                          <>
                            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => navigate(`/claims/create?transaction_id=${item.transaction_id}`)}>
                              Create Claim
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/upload")}>
                              <Upload className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {item.status === "Pending Approval" && (
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => item.claim_id && navigate(`/claims/${item.claim_id}`)}>
                            <Eye className="h-3.5 w-3.5 mr-1" />View
                          </Button>
                        )}
                        {(item.status === "Rejected" || item.status === "Need Info") && (
                          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => item.claim_id && navigate(`/claims/${item.claim_id}`)}>
                            View / Resubmit
                          </Button>
                        )}
                        {item.reconcile_status === "Matched" && (
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setDrawerItem(item)}>
                            <Eye className="h-3.5 w-3.5 mr-1" />Detail
                          </Button>
                        )}
                        {!["Pending Submit", "Pending Approval", "Rejected", "Need Info"].includes(item.status) && item.reconcile_status !== "Matched" && item.item_type === "MANUAL" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => item.claim_id && navigate(`/claims/${item.claim_id}`)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Drawers & Modals */}
      <TransactionDrawer item={drawerItem} open={!!drawerItem} onClose={() => setDrawerItem(null)} />
      <SelectTransactionModal open={selectTxnOpen} onClose={() => setSelectTxnOpen(false)} onSelect={handleSelectTxn} />
    </div>
  );
}
