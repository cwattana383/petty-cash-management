import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import OcrExtractedDataCard from "@/components/accounting/OcrExtractedDataCard";

interface AttachedDoc {
  name: string;
  size: string;
  docType: string;
}

interface MockItem {
  id: string;
  merchantName: string;
  description: string;
  amount: string;
  status: string;
  deductionPeriod: string;
  attachedFiles: AttachedDoc[];
  date: string;
}

const initialMockItems: MockItem[] = [
  { id: "TXN20250129001", merchantName: "GRAB TAXI", description: "Taxicabs and Limousines", amount: "฿1,500", status: "Pending Invoice", deductionPeriod: "—", attachedFiles: [], date: "2026-02-28" },
  { id: "TXN20250129002", merchantName: "MARRIOTT HOTEL BKK", description: "Hotels and Motels", amount: "฿3,500", status: "Pending Invoice", deductionPeriod: "—", attachedFiles: [], date: "2026-02-28" },
  { id: "TXN20250129003", merchantName: "PTT GAS STATION", description: "Service Stations", amount: "฿850", status: "Pending Invoice", deductionPeriod: "—", attachedFiles: [], date: "2026-02-28" },
  { id: "TXN20250129004", merchantName: "SOMTUM RESTAURANT", description: "Eating Places and Restaurants", amount: "฿1,250", status: "Pending Invoice", deductionPeriod: "—", attachedFiles: [], date: "2026-02-28" },
  { id: "TXN20250129005", merchantName: "THAI AIRWAYS", description: "Airlines", amount: "฿15,000", status: "Pending Invoice", deductionPeriod: "—", attachedFiles: [], date: "2026-02-28" },
  { id: "TXN20260227021", merchantName: "Siam Amazing Park", description: "Amusement Parks", amount: "฿7,900", status: "Auto Reject", deductionPeriod: "Period 3 / Mar 2026", attachedFiles: [], date: "2026-02-27" },
  { id: "TXN20260227002", merchantName: "Tiger Kingdom", description: "Tourist Attractions", amount: "฿4,500", status: "Auto Reject", deductionPeriod: "Period 3 / Mar 2026", attachedFiles: [], date: "2026-02-27" },
  { id: "TXN20260227053", merchantName: "The Street", description: "Dance Halls", amount: "฿2,500", status: "Auto Reject", deductionPeriod: "Period 3 / Mar 2026", attachedFiles: [], date: "2026-02-27" },
  { id: "TXN20260227114", merchantName: "The Nine", description: "Drinking Places (Bars)", amount: "฿1,250", status: "Reject", deductionPeriod: "N/A", attachedFiles: [
    { name: "bar_receipt.pdf", size: "1.2 MB", docType: "Receipt" },
  ], date: "2026-02-27" },
  { id: "TXN20260227025", merchantName: "Stone Hill Golf Club", description: "Sporting and Recreational Camps", amount: "฿55,000", status: "Final Reject", deductionPeriod: "Period 3 / Mar 2026", attachedFiles: [
    { name: "golf_invoice.pdf", size: "2.1 MB", docType: "Tax Invoice" },
    { name: "golf_approval.pdf", size: "340 KB", docType: "Travel Approval Form" },
  ], date: "2026-02-27" },
  { id: "TXN20260227071", merchantName: "Top", description: "Grocery Stores", amount: "฿799", status: "Auto Approved", deductionPeriod: "—", attachedFiles: [
    { name: "grocery_receipt.pdf", size: "890 KB", docType: "Tax Invoice" },
  ], date: "2026-02-27" },
  { id: "TXN20260227078", merchantName: "KFC", description: "Fast Food Restaurants", amount: "฿279", status: "Auto Approved", deductionPeriod: "—", attachedFiles: [
    { name: "kfc_tax_invoice.pdf", size: "1.1 MB", docType: "Tax Invoice" },
    { name: "kfc_receipt.jpg", size: "2.3 MB", docType: "Receipt" },
  ], date: "2026-02-27" },
  { id: "TXN20260227013", merchantName: "Suki Teenoi", description: "Eating Places and Restaurants", amount: "฿499", status: "Auto Approved", deductionPeriod: "—", attachedFiles: [
    { name: "suki_receipt.pdf", size: "780 KB", docType: "Tax Invoice" },
    { name: "attendee_list.pdf", size: "120 KB", docType: "Attendee List" },
  ], date: "2026-02-27" },
  { id: "TXN20260227124", merchantName: "Good Car Service", description: "Car Rental Agencies", amount: "฿3,000", status: "Auto Approved", deductionPeriod: "—", attachedFiles: [
    { name: "car_rental_invoice.pdf", size: "1.5 MB", docType: "Tax Invoice" },
    { name: "car_rental_receipt.pdf", size: "980 KB", docType: "Receipt" },
    { name: "trip_report.pdf", size: "2.8 MB", docType: "Travel Report" },
  ], date: "2026-02-27" },
  { id: "TXN20260227065", merchantName: "Rama 9 Hospital", description: "Hospitals", amount: "฿2,500", status: "Auto Approved", deductionPeriod: "—", attachedFiles: [
    { name: "hospital_receipt.pdf", size: "1.3 MB", docType: "Tax Invoice" },
  ], date: "2026-02-27" },
  { id: "TXN20260227088", merchantName: "Lazada Express", description: "Courier Services", amount: "฿12,500", status: "Exception", deductionPeriod: "Period 3 / Mar 2026", attachedFiles: [
    { name: "lazada_invoice.pdf", size: "1.8 MB", docType: "Tax Invoice" },
    { name: "lazada_receipt.pdf", size: "650 KB", docType: "Receipt" },
  ], date: "2026-02-27" },
  { id: "TXN20260227091", merchantName: "JD Central", description: "Computer Software Stores", amount: "฿8,900", status: "Exception", deductionPeriod: "Period 3 / Mar 2026", attachedFiles: [
    { name: "jd_tax_invoice.pdf", size: "2.0 MB", docType: "Tax Invoice" },
    { name: "jd_receipt.pdf", size: "1.1 MB", docType: "Receipt" },
    { name: "jd_other.pdf", size: "450 KB", docType: "Other Documents" },
  ], date: "2026-02-27" },
  { id: "TXN20260227095", merchantName: "Flash Express", description: "Courier Services", amount: "฿3,200", status: "Exception", deductionPeriod: "Period 3 / Mar 2026", attachedFiles: [
    { name: "flash_receipt.pdf", size: "920 KB", docType: "Tax Invoice" },
  ], date: "2026-02-27" },
  { id: "TXN20260228001", merchantName: "GRAB TAXI", description: "Taxicabs and Limousines", amount: "฿1,200", status: "Reimbursed", deductionPeriod: "Period 2 / Feb 2026", attachedFiles: [
    { name: "grab_receipt2.pdf", size: "1.0 MB", docType: "Tax Invoice" },
  ], date: "2026-02-15" },
  { id: "TXN20260228002", merchantName: "Starbucks", description: "Eating Places and Restaurants", amount: "฿350", status: "Reimbursed", deductionPeriod: "Period 2 / Feb 2026", attachedFiles: [
    { name: "starbucks_receipt.pdf", size: "680 KB", docType: "Tax Invoice" },
    { name: "starbucks_other.jpg", size: "3.1 MB", docType: "Other Documents" },
  ], date: "2026-02-15" },
];

const DOC_TYPE_COLORS: Record<string, string> = {
  "Tax Invoice": "bg-blue-100 text-blue-800 border-blue-300",
  "Receipt": "bg-green-100 text-green-800 border-green-300",
  "Travel Approval Form": "bg-purple-100 text-purple-800 border-purple-300",
  "Attendee List": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Travel Report": "bg-cyan-100 text-cyan-800 border-cyan-300",
  "Other Documents": "bg-gray-100 text-gray-600 border-gray-300",
};

const statusColors: Record<string, string> = {
  "Pending Invoice": "bg-orange-100 text-orange-800 border-orange-300",
  "Auto Reject": "bg-red-100 text-red-800 border-red-300",
  "Reject": "bg-red-100 text-red-800 border-red-300",
  "Final Reject": "bg-red-100 text-red-800 border-red-300",
  "Exception": "bg-red-100 text-red-800 border-red-300",
  "Auto Approved": "bg-green-100 text-green-800 border-green-300",
  "Ready for ERP": "bg-blue-100 text-blue-800 border-blue-300",
  "Reimbursed": "bg-purple-100 text-purple-800 border-purple-300",
};

const tabStatusMap: Record<string, string[] | null> = {
  all: null,
  pending: ["Pending Invoice", "Auto Approved"],
  exception: ["Auto Reject", "Reject", "Final Reject", "Exception"],
  ready: ["Ready for ERP"],
  reimbursed: ["Reimbursed"],
};

export default function AccountingReview() {
  const [activeTab, setActiveTab] = useState("pending");
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);
  const [items, setItems] = useState<MockItem[]>(initialMockItems);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [exceptionNote, setExceptionNote] = useState("");
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const filtered = tabStatusMap[activeTab]
    ? items.filter((item) => {
        const matchesStatus = tabStatusMap[activeTab]!.includes(item.status);
        if (activeTab === "pending") {
          return matchesStatus && item.attachedFiles.length > 0;
        }
        return matchesStatus;
      })
    : items;

  const itemsWithFiles = filtered.filter((i) => i.attachedFiles.length > 0);
  const currentFileIndex = itemsWithFiles.findIndex((i) => i.id === drawerItemId);
  const drawerItem = items.find((i) => i.id === drawerItemId);

  const totalTransactions = items.length;
  const totalAmount = items.reduce((sum, item) => {
    const num = parseFloat(item.amount.replace(/[฿,]/g, ""));
    return sum + num;
  }, 0);
  const pendingCount = items.filter((i) => ["Pending Invoice", "Auto Approved"].includes(i.status) && i.attachedFiles.length > 0).length;
  const readyCount = items.filter((i) => i.status === "Ready for ERP").length;
  const exceptionCount = items.filter((i) => ["Auto Reject", "Reject", "Final Reject", "Exception"].includes(i.status)).length;

  const metrics = [
    { label: "Total Transactions", value: totalTransactions.toString(), icon: FileText, tab: "all" },
    { label: "Total Amount (฿)", value: `฿${totalAmount.toLocaleString()}`, icon: BarChart3, tab: "all" },
    { label: "Pending Review", value: pendingCount.toString(), icon: Clock, tab: "pending" },
    { label: "Exception", value: exceptionCount.toString(), icon: AlertTriangle, tab: "exception", isException: true },
    { label: "Ready for ERP", value: readyCount.toString(), icon: CheckCircle, tab: "ready" },
  ];

  const isDrawerOpen = !!drawerItem;

  // Get the tax invoice doc for OCR (first one tagged as Tax Invoice)
  const taxInvoiceDoc = drawerItem?.attachedFiles.find((f) => f.docType === "Tax Invoice");
  const activeDoc = drawerItem?.attachedFiles[activeDocIndex];

  const updateStatus = (ids: string[]) => {
    setItems((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? { ...item, status: "Ready for ERP" } : item
      )
    );
  };

  const handleSingleConfirm = () => {
    if (!drawerItemId) return;
    updateStatus([drawerItemId]);
    toast({ title: "Items sent to ERP successfully", description: `${drawerItemId} — Status changed to Ready for ERP` });
    setDrawerItemId(null);
    setConfirmDialogOpen(false);
  };

  const handleBulkConfirm = () => {
    const ids = Array.from(selectedIds);
    updateStatus(ids);
    toast({ title: "Items sent to ERP successfully", description: `${ids.length} items sent to ERP` });
    setSelectedIds(new Set());
    setBulkConfirmOpen(false);
  };

  const handleFlagException = () => {
    if (!drawerItemId || !exceptionReason) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === drawerItemId ? { ...item, status: "Exception" } : item
      )
    );
    toast({ title: "Items flagged as Exception — employee notified", description: `${drawerItemId} — Reason: ${exceptionReason}` });
    setDrawerItemId(null);
    setExceptionDialogOpen(false);
    setExceptionReason("");
    setExceptionNote("");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const eligibleIds = filtered.filter((i) => i.status !== "Ready for ERP").map((i) => i.id);
    const allSelected = eligibleIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligibleIds));
    }
  };

  const openDrawer = (id: string) => {
    setDrawerItemId(id);
    setActiveDocIndex(0);
  };

  const eligibleFiltered = filtered.filter((i) => i.status !== "Ready for ERP");
  const allSelected = eligibleFiltered.length > 0 && eligibleFiltered.every((i) => selectedIds.has(i.id));

  return (
    <div className="flex h-full">
      <div className={cn("space-y-6 transition-all duration-300 min-w-0", isDrawerOpen ? "w-1/2" : "w-full")}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounting Review</h1>
          <p className="text-muted-foreground">Review and adjust expense claims for ERP</p>
        </div>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-700 mb-4 font-medium">
              Monthly Report — sent to HR and Finance on the 9th of each month
            </p>
            <div className="grid grid-cols-5 gap-4">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  onClick={() => setActiveTab(m.tab)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors",
                    m.isException
                      ? "bg-red-50/80 border-red-200 hover:bg-red-100/80"
                      : "bg-white/80 border-blue-100 hover:bg-blue-50",
                    activeTab === m.tab && !m.isException && "ring-2 ring-blue-400",
                    activeTab === m.tab && m.isException && "ring-2 ring-red-400"
                  )}
                >
                  <div className={cn("rounded-full p-2", m.isException ? "bg-red-100" : "bg-blue-100")}>
                    <m.icon className={cn("h-5 w-5", m.isException ? "text-red-600" : "text-blue-600")} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className={cn("text-xl font-bold", m.isException ? "text-red-700" : "text-foreground")}>{m.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Last updated: 11 Mar 2026 07:00 — Last ERP export: 9 Mar 2026 09:15
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="exception">Exception</TabsTrigger>
              <TabsTrigger value="ready">Ready for ERP</TabsTrigger>
              <TabsTrigger value="reimbursed">Sent to ERP</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setBulkConfirmOpen(true)}
            >
              <Send className="h-4 w-4 mr-1" />
              Confirm Selected ({selectedIds.size})
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Transaction No.</TableHead>
                  <TableHead>Transaction Date</TableHead>
                  <TableHead>Merchant Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deduction Period</TableHead>
                  <TableHead>Attached File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No items found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item.id} className={cn(drawerItemId === item.id && "bg-accent")}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                          disabled={item.status === "Ready for ERP"}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{formatBEDate(item.date)}</TableCell>
                      <TableCell>{item.merchantName}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right font-medium">{item.amount}</TableCell>
                      <TableCell><Badge className={statusColors[item.status] || ""} variant="outline">{item.status}</Badge></TableCell>
                      <TableCell>{item.deductionPeriod}</TableCell>
                      <TableCell>
                        {item.status === "Pending Invoice" ? (
                          <span className="text-muted-foreground">Pending</span>
                        ) : item.status === "Auto Reject" ? (
                          <span className="text-muted-foreground">None</span>
                        ) : item.attachedFiles.length > 0 ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-primary cursor-pointer hover:underline"
                            onClick={() => openDrawer(item.id)}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              📎 {item.attachedFiles.length} {item.attachedFiles.length === 1 ? "file" : "files"}
                            </Badge>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
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
                    <p className="text-xs mt-1">Document will be displayed here when connected to the backend</p>
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
                  <h3 className="text-sm font-semibold text-foreground">Action History (Audit Trail)</h3>
                </summary>
                <div className="ml-2 mt-2 border-l-2 border-muted pl-4 space-y-4 pb-2">
                  {[
                    { icon: "✅", action: "Auto-approved by Policy Engine", time: "27 Feb 2026 07:15" },
                    { icon: "📎", action: "Document uploaded by Somchai Chaidee", time: "27 Feb 2026 09:32" },
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
            {!["Ready for ERP", "Reimbursed", "Exception"].includes(drawerItem.status) && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setConfirmDialogOpen(true)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Confirm & Export to ERP
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
            {drawerItem.status === "Ready for ERP" && (
              <div className="text-center">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300" variant="outline">✅ Sent to ERP</Badge>
              </div>
            )}
            {drawerItem.status === "Exception" && (
              <div className="text-center">
                <Badge className="bg-red-100 text-red-800 border-red-300" variant="outline">⚠️ Exception</Badge>
              </div>
            )}
            {drawerItem.status === "Reimbursed" && (
              <div className="text-center">
                <Badge className="bg-purple-100 text-purple-800 border-purple-300" variant="outline">✅ Reimbursed</Badge>
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
            <AlertDialogTitle>Confirm Export to ERP</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm sending this item to Oracle ERP?
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
            <AlertDialogTitle>Confirm Export to ERP</AlertDialogTitle>
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
            <DialogDescription>Specify reason and message to employee</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={exceptionReason} onValueChange={setExceptionReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {["Tax ID Mismatch", "Address Mismatch", "Amount exceeds tolerance", "Unclear document", "Other"].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message to Employee</Label>
              <Textarea
                placeholder="Provide additional details..."
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
