import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Paperclip, FileText, Clock, CheckCircle, BarChart3, ChevronLeft, ChevronRight, X, Send } from "lucide-react";
import { formatBEDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import OcrExtractedDataCard from "@/components/accounting/OcrExtractedDataCard";

interface MockItem {
  id: string;
  merchantName: string;
  description: string;
  amount: string;
  status: string;
  deductionPeriod: string;
  attachedFile: string | null;
  date: string;
}

const initialMockItems: MockItem[] = [
  { id: "TXN20250129001", merchantName: "GRAB TAXI", description: "Taxicabs and Limousines", amount: "฿1,500", status: "Pending Invoice", deductionPeriod: "—", attachedFile: null, date: "2026-02-28" },
  { id: "TXN20250129002", merchantName: "MARRIOTT HOTEL BKK", description: "Hotels and Motels", amount: "฿3,500", status: "Pending Invoice", deductionPeriod: "—", attachedFile: null, date: "2026-02-28" },
  { id: "TXN20250129003", merchantName: "PTT GAS STATION", description: "Service Stations", amount: "฿850", status: "Pending Invoice", deductionPeriod: "—", attachedFile: null, date: "2026-02-28" },
  { id: "TXN20250129004", merchantName: "SOMTUM RESTAURANT", description: "Eating Places and Restaurants", amount: "฿1,250", status: "Pending Invoice", deductionPeriod: "—", attachedFile: null, date: "2026-02-28" },
  { id: "TXN20250129005", merchantName: "THAI AIRWAYS", description: "Airlines", amount: "฿15,000", status: "Pending Invoice", deductionPeriod: "—", attachedFile: null, date: "2026-02-28" },
  { id: "TXN20260227021", merchantName: "Siam Amazing Park", description: "Amusement Parks", amount: "฿7,900", status: "Auto Reject", deductionPeriod: "งวดที่ 3 / มี.ค. 2569", attachedFile: null, date: "2026-02-27" },
  { id: "TXN20260227002", merchantName: "Tiger Kingdom", description: "Tourist Attractions", amount: "฿4,500", status: "Auto Reject", deductionPeriod: "งวดที่ 3 / มี.ค. 2569", attachedFile: null, date: "2026-02-27" },
  { id: "TXN20260227053", merchantName: "The Street", description: "Dance Halls", amount: "฿2,500", status: "Auto Reject", deductionPeriod: "งวดที่ 3 / มี.ค. 2569", attachedFile: null, date: "2026-02-27" },
  { id: "TXN20260227114", merchantName: "The Nine", description: "Drinking Places (Bars)", amount: "฿1,250", status: "Reject", deductionPeriod: "N/A", attachedFile: "bar_receipt.pdf", date: "2026-02-27" },
  { id: "TXN20260227025", merchantName: "Stone Hill Golf Club", description: "Sporting and Recreational Camps", amount: "฿55,000", status: "Final Reject", deductionPeriod: "งวดที่ 3 / มี.ค. 2569", attachedFile: "golf_invoice.pdf", date: "2026-02-27" },
  { id: "TXN20260227071", merchantName: "Top", description: "Grocery Stores", amount: "฿799", status: "Auto Approved", deductionPeriod: "—", attachedFile: "grocery_receipt.pdf", date: "2026-02-27" },
  { id: "TXN20260227078", merchantName: "KFC", description: "Fast Food Restaurants", amount: "฿279", status: "Auto Approved", deductionPeriod: "—", attachedFile: "kfc_receipt.jpg", date: "2026-02-27" },
  { id: "TXN20260227013", merchantName: "Suki Teenoi", description: "Eating Places and Restaurants", amount: "฿499", status: "Auto Approved", deductionPeriod: "—", attachedFile: "suki_receipt.pdf", date: "2026-02-27" },
  { id: "TXN20260227124", merchantName: "Good Car Service", description: "Car Rental Agencies", amount: "฿3,000", status: "Auto Approved", deductionPeriod: "—", attachedFile: "car_rental_invoice.pdf", date: "2026-02-27" },
  { id: "TXN20260227065", merchantName: "Rama 9 Hospital", description: "Hospitals", amount: "฿2,500", status: "Auto Approved", deductionPeriod: "—", attachedFile: "hospital_receipt.pdf", date: "2026-02-27" },
  { id: "TXN20260227088", merchantName: "Lazada Express", description: "Courier Services", amount: "฿12,500", status: "Exception", deductionPeriod: "งวดที่ 3 / มี.ค. 2569", attachedFile: "lazada_invoice.pdf", date: "2026-02-27" },
  { id: "TXN20260227091", merchantName: "JD Central", description: "Computer Software Stores", amount: "฿8,900", status: "Exception", deductionPeriod: "งวดที่ 3 / มี.ค. 2569", attachedFile: "jd_receipt.pdf", date: "2026-02-27" },
  { id: "TXN20260227095", merchantName: "Flash Express", description: "Courier Services", amount: "฿3,200", status: "Exception", deductionPeriod: "งวดที่ 3 / มี.ค. 2569", attachedFile: "flash_receipt.pdf", date: "2026-02-27" },
  { id: "TXN20260228001", merchantName: "GRAB TAXI", description: "Taxicabs and Limousines", amount: "฿1,200", status: "Reimbursed", deductionPeriod: "งวดที่ 2 / ก.พ. 2569", attachedFile: "grab_receipt2.pdf", date: "2026-02-15" },
  { id: "TXN20260228002", merchantName: "Starbucks", description: "Eating Places and Restaurants", amount: "฿350", status: "Reimbursed", deductionPeriod: "งวดที่ 2 / ก.พ. 2569", attachedFile: "starbucks_receipt.pdf", date: "2026-02-15" },
];

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
  const { toast } = useToast();

  const filtered = tabStatusMap[activeTab]
    ? items.filter((item) => tabStatusMap[activeTab]!.includes(item.status))
    : items;

  const itemsWithFiles = filtered.filter((i) => i.attachedFile);
  const currentFileIndex = itemsWithFiles.findIndex((i) => i.id === drawerItemId);
  const drawerItem = items.find((i) => i.id === drawerItemId);

  const totalTransactions = items.length;
  const totalAmount = items.reduce((sum, item) => {
    const num = parseFloat(item.amount.replace(/[฿,]/g, ""));
    return sum + num;
  }, 0);
  const pendingCount = items.filter((i) => i.status === "Pending Invoice").length;
  const readyCount = items.filter((i) => ["Auto Approved", "Ready for ERP"].includes(i.status)).length;

  const metrics = [
    { label: "Total Transactions", value: totalTransactions.toString(), icon: FileText },
    { label: "Total Amount (฿)", value: `฿${totalAmount.toLocaleString()}`, icon: BarChart3 },
    { label: "Pending Review", value: pendingCount.toString(), icon: Clock },
    { label: "Ready for ERP", value: readyCount.toString(), icon: CheckCircle },
  ];

  const isDrawerOpen = !!drawerItem;

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
    toast({ title: "ส่งรายการไปยัง ERP เรียบร้อย", description: `${drawerItemId} — สถานะเปลี่ยนเป็น Ready for ERP` });
    setDrawerItemId(null);
    setConfirmDialogOpen(false);
  };

  const handleBulkConfirm = () => {
    const ids = Array.from(selectedIds);
    updateStatus(ids);
    toast({ title: "ส่งรายการไปยัง ERP เรียบร้อย", description: `${ids.length} รายการถูกส่งไปยัง ERP` });
    setSelectedIds(new Set());
    setBulkConfirmOpen(false);
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
              รายงานประจำเดือน — ส่งให้ HR และ Finance ทุกวันที่ 9 ของเดือน
            </p>
            <div className="grid grid-cols-4 gap-4">
              {metrics.map((m) => (
                <div key={m.label} className="flex items-center gap-3 rounded-lg bg-white/80 border border-blue-100 p-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <m.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-xl font-bold text-foreground">{m.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending Invoice</TabsTrigger>
              <TabsTrigger value="exception">Reject</TabsTrigger>
              <TabsTrigger value="ready">Auto Approved</TabsTrigger>
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
                        ) : item.attachedFile ? (
                          <span
                            className="flex items-center gap-1 text-red-600 cursor-pointer hover:underline"
                            onClick={() => setDrawerItemId(item.id)}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {item.attachedFile}
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
              <h2 className="text-lg font-semibold text-foreground">{drawerItem.attachedFile}</h2>
              <p className="text-sm text-muted-foreground">{drawerItem.id} — {drawerItem.merchantName}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDrawerItemId(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Scrollable content */}
          <ScrollArea className="flex-1">
            {/* Document viewer placeholder */}
            <div className="m-4 rounded-lg bg-muted flex items-center justify-center min-h-[250px]">
              <div className="text-center text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-medium">Document Preview: {drawerItem.attachedFile}</p>
                <p className="text-xs mt-1">เอกสารจะแสดงตรงนี้เมื่อเชื่อมต่อกับ backend</p>
              </div>
            </div>

            {/* OCR Extracted Data */}
            <OcrExtractedDataCard drawerItem={drawerItem} />
          </ScrollArea>

          {/* Footer with ERP button + Navigation */}
          <div className="border-t border-border p-4 space-y-3">
            {drawerItem.status !== "Ready for ERP" && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setConfirmDialogOpen(true)}
              >
                <Send className="h-4 w-4 mr-2" />
                ยืนยัน & ส่ง ERP
              </Button>
            )}
            {drawerItem.status === "Ready for ERP" && (
              <div className="text-center">
                <Badge className="bg-blue-100 text-blue-800 border-blue-300" variant="outline">✅ ส่ง ERP แล้ว</Badge>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={currentFileIndex <= 0}
                onClick={() => {
                  if (currentFileIndex > 0) setDrawerItemId(itemsWithFiles[currentFileIndex - 1].id);
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
                  if (currentFileIndex < itemsWithFiles.length - 1) setDrawerItemId(itemsWithFiles[currentFileIndex + 1].id);
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
            <AlertDialogTitle>ยืนยันการส่ง ERP</AlertDialogTitle>
            <AlertDialogDescription>
              ยืนยันการส่งรายการนี้ไปยัง Oracle ERP ใช่หรือไม่?
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
            <AlertDialogTitle>ยืนยันการส่ง ERP</AlertDialogTitle>
            <AlertDialogDescription>
              ยืนยันการส่ง {selectedIds.size} รายการไปยัง Oracle ERP ใช่หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkConfirm} className="bg-green-600 hover:bg-green-700">Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
