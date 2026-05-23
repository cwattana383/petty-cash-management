import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Paperclip, FileText, Clock, CheckCircle, BarChart3, ChevronLeft, ChevronRight, X, Send, AlertTriangle, ChevronDown } from "lucide-react";
import { formatBEDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import OcrExtractedDataCard from "@/components/accounting/OcrExtractedDataCard";

interface AttachedDoc {
  name: string;
  size: string;
  docType: string;
}


type ApprovalStatusCode =
  | "ACCOUNTING_REVIEW"
  | "RETURNED_FOR_INFO"
  | "AUTO_APPROVED"
  | "MANAGER_APPROVED"
  | "AUTO_REJECTED"
  | "MANAGER_REJECTED"
  | "FINAL_REJECTED"
  | "VERIFIED"
  | "SENT_TO_ERP";

const STATUS_LABELS: Record<ApprovalStatusCode, string> = {
  ACCOUNTING_REVIEW: "Accounting Review",
  RETURNED_FOR_INFO: "Returned for Info",
  AUTO_APPROVED: "Auto Approved",
  MANAGER_APPROVED: "Manager Approved",
  AUTO_REJECTED: "Auto Rejected",
  MANAGER_REJECTED: "Manager Rejected",
  FINAL_REJECTED: "Final Rejected",
  VERIFIED: "Verified",
  SENT_TO_ERP: "Sent to ERP",
};

const STATUS_COLORS: Record<ApprovalStatusCode, string> = {
  ACCOUNTING_REVIEW: "bg-sky-100 text-sky-800 border-sky-300",
  RETURNED_FOR_INFO: "bg-orange-100 text-orange-800 border-orange-300",
  AUTO_APPROVED: "bg-green-100 text-green-800 border-green-300",
  MANAGER_APPROVED: "bg-green-100 text-green-800 border-green-300",
  AUTO_REJECTED: "bg-red-100 text-red-800 border-red-300",
  MANAGER_REJECTED: "bg-red-100 text-red-800 border-red-300",
  FINAL_REJECTED: "bg-red-100 text-red-800 border-red-300",
  VERIFIED: "bg-teal-100 text-teal-800 border-teal-300",
  SENT_TO_ERP: "bg-blue-100 text-blue-800 border-blue-300",
};

const TAB_STATUS_MAP: Record<string, ApprovalStatusCode[] | null> = {
  pending: ["AUTO_APPROVED", "MANAGER_APPROVED", "ACCOUNTING_REVIEW"],
  request_info: ["RETURNED_FOR_INFO"],
  reject: ["AUTO_REJECTED", "MANAGER_REJECTED", "FINAL_REJECTED"],
  approved: ["AUTO_APPROVED", "MANAGER_APPROVED"],
  verified: ["VERIFIED"],
  sent_erp: ["SENT_TO_ERP"],
  all: null,
};

interface MockItem {
  id: string;
  merchantName: string;
  description: string;
  amount: string;
  status: ApprovalStatusCode;
  documentStatus: string;
  deductionPeriod: string;
  attachedFiles: AttachedDoc[];
  date: string;
}

const initialMockItems: MockItem[] = [
  { id: "TXN2026050100001", date: "2026-05-01", merchantName: "Somchai Jaidee", description: "Client meeting transport", amount: "฿500.00", status: "MANAGER_APPROVED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026050200002", date: "2026-05-02", merchantName: "Anong Srisuk", description: "Team lunch", amount: "฿1,250.00", status: "MANAGER_APPROVED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026050300003", date: "2026-05-03", merchantName: "Wirat Phongsri", description: "Office supplies", amount: "฿680.00", status: "MANAGER_APPROVED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026050400004", date: "2026-05-04", merchantName: "Kanya Watcharee", description: "Airport taxi", amount: "฿420.00", status: "RETURNED_FOR_INFO", documentStatus: "Pending Documents", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026050500005", date: "2026-05-05", merchantName: "Pichai Thongdee", description: "Conference fee", amount: "฿5,000.00", status: "RETURNED_FOR_INFO", documentStatus: "Pending Documents", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026050600006", date: "2026-05-06", merchantName: "Suda Manee", description: "Coffee with client", amount: "฿285.00", status: "AUTO_APPROVED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026050700007", date: "2026-05-07", merchantName: "Anucha Rakdee", description: "Train ticket BKK-CNX", amount: "฿1,500.00", status: "AUTO_APPROVED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026050800008", date: "2026-05-08", merchantName: "Malee Chaiyo", description: "Hotel one night", amount: "฿2,800.00", status: "VERIFIED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026050800009", date: "2026-05-08", merchantName: "Thanit Boonmee", description: "Team building dinner", amount: "฿4,200.00", status: "ACCOUNTING_REVIEW", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026050900010", date: "2026-05-09", merchantName: "Niran Suwan", description: "Personal item — disallowed", amount: "฿1,100.00", status: "AUTO_REJECTED", documentStatus: "Pending Documents", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026050900011", date: "2026-05-09", merchantName: "Ratchanee Pim", description: "No receipt provided", amount: "฿320.00", status: "MANAGER_REJECTED", documentStatus: "Pending Documents", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051000012", date: "2026-05-10", merchantName: "Phakorn Suk", description: "Out of policy spend", amount: "฿8,500.00", status: "FINAL_REJECTED", documentStatus: "Pending Documents", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051000013", date: "2026-05-10", merchantName: "Wanchai Tonggam", description: "Vendor lunch", amount: "฿1,850.00", status: "VERIFIED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051100014", date: "2026-05-11", merchantName: "Siriporn Klaa", description: "Mobile top-up", amount: "฿300.00", status: "VERIFIED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051100015", date: "2026-05-11", merchantName: "Decha Inthanon", description: "Cab to client site", amount: "฿175.00", status: "VERIFIED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051200016", date: "2026-05-12", merchantName: "Apinya Sukjai", description: "Marketing event", amount: "฿12,000.00", status: "SENT_TO_ERP", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051200017", date: "2026-05-12", merchantName: "Boonsong Lerd", description: "Office snacks", amount: "฿650.00", status: "SENT_TO_ERP", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051300018", date: "2026-05-13", merchantName: "Chalita Mongkol", description: "Stationery", amount: "฿420.00", status: "SENT_TO_ERP", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051300019", date: "2026-05-13", merchantName: "Krit Phusawat", description: "Training course", amount: "฿7,800.00", status: "MANAGER_APPROVED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051400020", date: "2026-05-14", merchantName: "Lalita Boonchu", description: "Software subscription", amount: "฿1,990.00", status: "MANAGER_APPROVED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051400021", date: "2026-05-14", merchantName: "Manop Saksri", description: "Parking fee", amount: "฿120.00", status: "MANAGER_APPROVED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051500022", date: "2026-05-15", merchantName: "Narongsak Yim", description: "Client gift", amount: "฿2,500.00", status: "ACCOUNTING_REVIEW", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051500023", date: "2026-05-15", merchantName: "Orawan Pansri", description: "Toll fee", amount: "฿80.00", status: "AUTO_APPROVED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051500024", date: "2026-05-15", merchantName: "Prasert Khunsri", description: "Workshop materials", amount: "฿3,400.00", status: "MANAGER_APPROVED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051500025", date: "2026-05-15", merchantName: "Rungnapa Sripong", description: "Internal lunch meeting", amount: "฿890.00", status: "ACCOUNTING_REVIEW", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051600040", date: "2026-05-16", merchantName: "Wilasinee Pratyawongchai", description: "Client dinner with vendor partners", amount: "฿8,500.00", status: "MANAGER_APPROVED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
  { id: "TXN2026051700041", date: "2026-05-17", merchantName: "Anong Srisuk", description: "Office snacks for team meeting", amount: "฿320.00", status: "AUTO_APPROVED", documentStatus: "Validated", deductionPeriod: "—", attachedFiles: [] },
];

const DOC_TYPE_COLORS: Record<string, string> = {
  "Tax Invoice": "bg-blue-100 text-blue-800 border-blue-300",
  "Receipt": "bg-green-100 text-green-800 border-green-300",
  "Travel Approval": "bg-purple-100 text-purple-800 border-purple-300",
  "Participant List": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Travel Report": "bg-cyan-100 text-cyan-800 border-cyan-300",
  "Other Documents": "bg-gray-100 text-gray-600 border-gray-300",
};

const documentStatusColors: Record<string, string> = {
  "Pending Documents": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Validated": "bg-green-100 text-green-800 border-green-300",
};

const PAGE_SIZE = 20;

export default function AccountingReview() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [dateTo, setDateTo] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);
  const [items, setItems] = useState<MockItem[]>(initialMockItems);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [exceptionNote, setExceptionNote] = useState("");
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const { toast } = useToast();

  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const allowed = TAB_STATUS_MAP[activeTab];
    const q = searchQuery.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom + "T00:00:00") : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59") : null;

    return items.filter((item) => {
      if (allowed && !allowed.includes(item.status)) return false;

      const d = new Date(item.date + "T12:00:00");
      if (from && d < from) return false;
      if (to && d > to) return false;

      if (q) {
        const haystack = [
          item.id,
          item.merchantName,
          item.description,
          item.merchantName,
          STATUS_LABELS[item.status],
          item.documentStatus,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, activeTab, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const itemsWithFiles = filtered.filter((i) => i.attachedFiles.length > 0);
  const currentFileIndex = itemsWithFiles.findIndex((i) => i.id === drawerItemId);
  const drawerItem = items.find((i) => i.id === drawerItemId);

  const isDrawerOpen = !!drawerItem;

  // Get the tax invoice doc for OCR (first one tagged as Tax Invoice)
  const taxInvoiceDoc = drawerItem?.attachedFiles.find((f) => f.docType === "Tax Invoice");
  const activeDoc = drawerItem?.attachedFiles[activeDocIndex];

  const updateStatus = (ids: string[]) => {
    setItems((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? { ...item, status: "SENT_TO_ERP" as ApprovalStatusCode } : item
      )
    );
  };

  const handleSingleConfirm = () => {
    if (!drawerItemId) return;
    updateStatus([drawerItemId]);
    toast({ title: "Sent to ERP successfully", description: `${drawerItemId} — Status changed to Sent to ERP` });
    setDrawerItemId(null);
    setConfirmDialogOpen(false);
  };

  const handleBulkConfirm = () => {
    const ids = Array.from(selectedIds);
    updateStatus(ids);
    toast({ title: "Sent to ERP successfully", description: `${ids.length} items sent to ERP` });
    setSelectedIds(new Set());
    setBulkConfirmOpen(false);
  };

  const handleFlagException = () => {
    if (!drawerItemId || !exceptionReason) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === drawerItemId ? { ...item, status: "FINAL_REJECTED" as ApprovalStatusCode } : item
      )
    );
    toast({ title: "Item flagged as Exception — employee notified", description: `${drawerItemId} — Reason: ${exceptionReason}` });
    setDrawerItemId(null);
    setExceptionDialogOpen(false);
    setExceptionReason("");
    setExceptionNote("");
  };

  const openDrawer = (id: string) => {
    setDrawerItemId(id);
    setActiveDocIndex(0);
  };

  return (
    <div className="flex h-full">
      <div className={cn("space-y-6 transition-all duration-300 min-w-0", isDrawerOpen ? "w-1/2" : "w-full")}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounting Review</h1>
          <p className="text-muted-foreground">Review and adjust expense claims for ERP</p>
        </div>


        <div className="rounded-lg border border-border bg-background p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-foreground shrink-0">Transaction Date:</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-auto"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="request_info">Request For More Info</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="reject">Rejected</TabsTrigger>
              <TabsTrigger value="sent_erp">Sent to ERP</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction No.</TableHead>
                  <TableHead>Transaction Date</TableHead>
                  <TableHead>Cardholder Name</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Approval Status</TableHead>
                  <TableHead>Document Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No transactions found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((item) => (
                    <TableRow key={item.id} className={cn("cursor-pointer hover:bg-muted/30", drawerItemId === item.id && "bg-accent")} onClick={() => navigate(`/accounting/${item.id}`)}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{formatBEDate(item.date)}</TableCell>
                      <TableCell>{item.merchantName}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right font-medium">{item.amount}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[item.status]} variant="outline">
                          {STATUS_LABELS[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={documentStatusColors[item.documentStatus] || ""} variant="outline">
                          {item.documentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
              <span className="text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <span className="text-muted-foreground">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Document Preview Drawer */}
      {isDrawerOpen && drawerItem && (
        <div className="w-1/2 border-l border-border bg-background flex flex-col h-full animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{drawerItem.id}</h2>
              <p className="text-sm text-muted-foreground">{drawerItem.merchantName} — {drawerItem.attachedFiles.length} document(s)</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDrawerItemId(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable content */}
          <ScrollArea className="flex-1">
            {/* Document list */}
            <div className="mx-4 mt-4 mb-2">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
                <Badge variant="secondary" className="text-xs">📎 {drawerItem.attachedFiles.length}</Badge>
              </h3>
              <div className="space-y-1">
                {drawerItem.attachedFiles.map((doc, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveDocIndex(idx)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors text-sm",
                      activeDocIndex === idx ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                    )}
                  >
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", DOC_TYPE_COLORS[doc.docType] || DOC_TYPE_COLORS["Other Documents"])}>
                      {doc.docType}
                    </Badge>
                    <span className="truncate font-medium">{doc.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">{doc.size}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Document viewer with tab bar */}
            {drawerItem.attachedFiles.length > 0 && (
              <div className="mx-4 mb-4">
                <div className="flex items-center gap-1 border-b mb-0">
                  {drawerItem.attachedFiles.map((doc, idx) => {
                    const tabLabel = doc.docType === "Tax Invoice"
                      ? "Tax Invoice"
                      : `${doc.docType} ${idx + 1}`;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveDocIndex(idx)}
                        className={cn(
                          "px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                          activeDocIndex === idx
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tabLabel}
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-b-lg bg-muted flex items-center justify-center min-h-[200px]">
                  <div className="text-center text-muted-foreground p-6">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">{activeDoc?.name}</p>
                    <p className="text-xs mt-1">{activeDoc?.size}</p>
                    <p className="text-xs mt-1">Document will be displayed here once connected to the backend</p>
                  </div>
                </div>
              </div>
            )}

            {/* OCR Extracted Data — only for Tax Invoice */}
            {taxInvoiceDoc ? (
              <div className="mx-4 mb-2">
                <p className="text-xs text-muted-foreground mb-1">
                  🔍 OCR processed from document: <span className="font-medium text-foreground">{taxInvoiceDoc.name}</span> (Tax Invoice)
                </p>
              </div>
            ) : (
              <div className="mx-4 mb-2">
                <p className="text-xs text-orange-600">
                  ⚠️ No "Tax Invoice" document found — unable to extract OCR data
                </p>
              </div>
            )}
            {taxInvoiceDoc && <OcrExtractedDataCard drawerItem={drawerItem} />}

            {/* Audit Trail */}
            <div className="mx-4 mb-4">
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer select-none py-2">
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                  <h3 className="text-sm font-semibold text-foreground">Audit Trail</h3>
                </summary>
                <div className="ml-2 mt-2 border-l-2 border-muted pl-4 space-y-4 pb-2">
                  {[
                    { icon: "✅", action: "Auto-approved by Policy Engine", time: "27 Feb 2026 07:15" },
                    { icon: "📎", action: "Document uploaded by employee", time: "27 Feb 2026 09:32" },
                    { icon: "🔍", action: "OCR validation passed", time: "27 Feb 2026 09:33" },
                    { icon: "✅", action: "Confirmed by Finance", time: "11 Mar 2026 14:00" },
                  ].map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-2 relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
                      <span className="text-sm">{entry.icon}</span>
                      <div>
                        <p className="text-xs font-medium text-foreground">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">{entry.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </ScrollArea>

          {/* Footer with ERP button + Navigation */}
          <div className="border-t border-border p-4 space-y-3">
            {!(["SENT_TO_ERP", "FINAL_REJECTED"] as ApprovalStatusCode[]).includes(drawerItem.status) && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setConfirmDialogOpen(true)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Confirm & Send to ERP
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => setExceptionDialogOpen(true)}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Flag as Exception
                </Button>
              </div>
            )}
            {drawerItem.status === "SENT_TO_ERP" && (
              <div className="text-center">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300" variant="outline">✅ Sent to ERP</Badge>
              </div>
            )}
            {drawerItem.status === "FINAL_REJECTED" && (
              <div className="text-center">
                <Badge className="bg-red-100 text-red-800 border-red-300" variant="outline">⚠️ Final Rejected</Badge>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={currentFileIndex <= 0}
                onClick={() => {
                  if (currentFileIndex > 0) openDrawer(itemsWithFiles[currentFileIndex - 1].id);
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentFileIndex + 1} / {itemsWithFiles.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentFileIndex >= itemsWithFiles.length - 1}
                onClick={() => {
                  if (currentFileIndex < itemsWithFiles.length - 1) openDrawer(itemsWithFiles[currentFileIndex + 1].id);
                }}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Single confirm dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm ERP Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send this item to Oracle ERP?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSingleConfirm} className="bg-green-600 hover:bg-green-700">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk confirm dialog */}
      <AlertDialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm ERP Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm sending {selectedIds.size} items to Oracle ERP?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkConfirm} className="bg-green-600 hover:bg-green-700">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exception flag dialog */}
      <Dialog open={exceptionDialogOpen} onOpenChange={setExceptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ Flag as Exception</DialogTitle>
            <DialogDescription>Specify reason and message for the employee</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={exceptionReason} onValueChange={setExceptionReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {["Tax ID mismatch", "Address mismatch", "Amount exceeds tolerance", "Document unclear", "Other"].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message to employee</Label>
              <Textarea
                placeholder="Enter additional details..."
                value={exceptionNote}
                onChange={(e) => setExceptionNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExceptionDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!exceptionReason}
              onClick={handleFlagException}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
