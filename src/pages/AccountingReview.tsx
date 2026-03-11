import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Paperclip, FileText, Clock, CheckCircle, BarChart3 } from "lucide-react";
import { formatBEDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const filtered = tabStatusMap[activeTab]
    ? mockItems.filter((item) => tabStatusMap[activeTab]!.includes(item.status))
    : mockItems;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Accounting Review</h1>
        <p className="text-muted-foreground">Review and adjust expense claims for ERP</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending Invoice</TabsTrigger>
          <TabsTrigger value="exception">Reject</TabsTrigger>
          <TabsTrigger value="ready">Auto Approved</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
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
                  <TableRow key={item.id}>
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
                        <span className="flex items-center gap-1 text-red-600 cursor-pointer hover:underline">
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
  );
}
