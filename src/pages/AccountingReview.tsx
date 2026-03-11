import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Paperclip, FileText, Clock, CheckCircle, BarChart3, ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatBEDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import OcrExtractedDataCard from "@/components/accounting/OcrExtractedDataCard";

const mockItems = [
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
];

const statusColors: Record<string, string> = {
  "Pending Invoice": "bg-orange-100 text-orange-800 border-orange-300",
  "Auto Reject": "bg-red-100 text-red-800 border-red-300",
  "Reject": "bg-red-100 text-red-800 border-red-300",
  "Final Reject": "bg-red-100 text-red-800 border-red-300",
  "Auto Approved": "bg-green-100 text-green-800 border-green-300",
};

const tabStatusMap: Record<string, string[] | null> = {
  all: null,
  pending: ["Pending Invoice"],
  exception: ["Auto Reject", "Reject", "Final Reject"],
  ready: ["Auto Approved"],
};

export default function AccountingReview() {
  const [activeTab, setActiveTab] = useState("all");
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);

  const filtered = tabStatusMap[activeTab]
    ? mockItems.filter((item) => tabStatusMap[activeTab]!.includes(item.status))
    : mockItems;

  // Items with attached files for prev/next navigation
  const itemsWithFiles = filtered.filter((i) => i.attachedFile);
  const currentFileIndex = itemsWithFiles.findIndex((i) => i.id === drawerItemId);
  const drawerItem = mockItems.find((i) => i.id === drawerItemId);

  const totalTransactions = mockItems.length;
  const totalAmount = mockItems.reduce((sum, item) => {
    const num = parseFloat(item.amount.replace(/[฿,]/g, ""));
    return sum + num;
  }, 0);
  const pendingCount = mockItems.filter((i) => i.status === "Pending Invoice").length;
  const readyCount = mockItems.filter((i) => i.status === "Auto Approved").length;

  const metrics = [
    { label: "Total Transactions", value: totalTransactions.toString(), icon: FileText },
    { label: "Total Amount (฿)", value: `฿${totalAmount.toLocaleString()}`, icon: BarChart3 },
    { label: "Pending Review", value: pendingCount.toString(), icon: Clock },
    { label: "Ready for ERP", value: readyCount.toString(), icon: CheckCircle },
  ];

  const isDrawerOpen = !!drawerItem;

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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending Invoice</TabsTrigger>
            <TabsTrigger value="exception">Reject</TabsTrigger>
            <TabsTrigger value="ready">Auto Approved</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No items found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item.id} className={cn(drawerItemId === item.id && "bg-accent")}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{formatBEDate(item.date)}</TableCell>
                      <TableCell>{item.merchantName}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right font-medium">{item.amount}</TableCell>
                      <TableCell><Badge className={statusColors[item.status]} variant="outline">{item.status}</Badge></TableCell>
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

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 border-t border-border">
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
      )}
    </div>
  );
}
