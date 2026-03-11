import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";
import { formatBEDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockItems = [
  { id: "TXN20250129001", requester: "สมชาย ใจดี", merchantName: "GRAB TAXI", description: "Taxicabs and Limousines", amount: "฿1,500", status: "Pending Review", accountCode: "-", date: "2026-02-28" },
  { id: "TXN20250129002", requester: "สมชาย ใจดี", merchantName: "MARRIOTT HOTEL BKK", description: "Hotels and Motels", amount: "฿3,500", status: "Pending Review", accountCode: "-", date: "2026-02-28" },
  { id: "TXN20250129003", requester: "สมชาย ใจดี", merchantName: "PTT GAS STATION", description: "Service Stations", amount: "฿850", status: "Pending Review", accountCode: "-", date: "2026-02-28" },
  { id: "TXN20250129004", requester: "สมชาย ใจดี", merchantName: "SOMTUM RESTAURANT", description: "Eating Places and Restaurants", amount: "฿1,250", status: "Pending Review", accountCode: "-", date: "2026-02-28" },
  { id: "TXN20250129005", requester: "สมชาย ใจดี", merchantName: "THAI AIRWAYS", description: "Airlines", amount: "฿15,000", status: "Pending Review", accountCode: "-", date: "2026-02-28" },
  { id: "TXN20260227021", requester: "สมชาย ใจดี", merchantName: "Siam Amazing Park", description: "Amusement Parks", amount: "฿7,900", status: "Exception", accountCode: "5120", date: "2026-02-27" },
  { id: "TXN20260227002", requester: "สมชาย ใจดี", merchantName: "Tiger Kingdom", description: "Tourist Attractions", amount: "฿4,500", status: "Exception", accountCode: "5120", date: "2026-02-27" },
  { id: "TXN20260227053", requester: "สมชาย ใจดี", merchantName: "The Street", description: "Dance Halls", amount: "฿2,500", status: "Exception", accountCode: "5130", date: "2026-02-27" },
  { id: "TXN20260227114", requester: "สมชาย ใจดี", merchantName: "The Nine", description: "Drinking Places (Bars)", amount: "฿1,250", status: "Exception", accountCode: "5130", date: "2026-02-27" },
  { id: "TXN20260227025", requester: "สมชาย ใจดี", merchantName: "Stone Hill Golf Club", description: "Sporting and Recreational Camps", amount: "฿55,000", status: "Exception", accountCode: "5140", date: "2026-02-27" },
  { id: "TXN20260227071", requester: "สมชาย ใจดี", merchantName: "Top", description: "Grocery Stores", amount: "฿799", status: "Ready for ERP", accountCode: "5110", date: "2026-02-27" },
  { id: "TXN20260227078", requester: "สมชาย ใจดี", merchantName: "KFC", description: "Fast Food Restaurants", amount: "฿279", status: "Ready for ERP", accountCode: "5110", date: "2026-02-27" },
  { id: "TXN20260227013", requester: "สมชาย ใจดี", merchantName: "Suki Teenoi", description: "Eating Places and Restaurants", amount: "฿499", status: "Ready for ERP", accountCode: "5110", date: "2026-02-27" },
  { id: "TXN20260227124", requester: "สมชาย ใจดี", merchantName: "Good Car Service", description: "Car Rental Agencies", amount: "฿3,000", status: "Ready for ERP", accountCode: "5150", date: "2026-02-27" },
  { id: "TXN20260227065", requester: "สมชาย ใจดี", merchantName: "Rama 9 Hospital", description: "Hospitals", amount: "฿2,500", status: "Ready for ERP", accountCode: "5160", date: "2026-02-27" },
  { id: "TXN20250128001", requester: "วิชัย เจริญ", merchantName: "GRAB TAXI", description: "Taxi to client site", amount: "฿1,850", status: "Pending Review", accountCode: "-", date: "2026-02-25" },
  { id: "TXN20250128002", requester: "สมหญิง แก้วใส", merchantName: "BANYAN TREE RESTAURANT", description: "Business dinner with client", amount: "฿8,500", status: "Pending Review", accountCode: "-", date: "2026-02-24" },
  { id: "TXN20250127001", requester: "วิชัย เจริญ", merchantName: "THAI AIRWAYS", description: "Flight to Bangkok for meeting", amount: "฿12,500", status: "Pending Review", accountCode: "-", date: "2026-02-23" },
  { id: "TXN20250127002", requester: "สมหญิง แก้วใส", merchantName: "NOVOTEL BANGKOK", description: "Hotel for regional meeting", amount: "฿4,200", status: "Pending Review", accountCode: "-", date: "2026-02-22" },
  { id: "TXN20250126001", requester: "วิชัย เจริญ", merchantName: "OfficeMate", description: "Office supplies for project", amount: "฿3,200", status: "Pending Review", accountCode: "-", date: "2026-02-21" },
];

const queueColors: Record<string, string> = {
  "Pending Review": "bg-yellow-100 text-yellow-800",
  Exception: "bg-red-100 text-red-800",
  "Ready for ERP": "bg-green-100 text-green-800",
};

const tabStatusMap: Record<string, string | null> = {
  all: null,
  pending: "Pending Review",
  exception: "Exception",
  ready: "Ready for ERP",
};

export default function AccountingReview() {
  const [activeTab, setActiveTab] = useState("all");
  const filtered = tabStatusMap[activeTab]
    ? mockItems.filter((item) => item.status === tabStatusMap[activeTab])
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
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="exception">Exception</TabsTrigger>
          <TabsTrigger value="ready">Ready for ERP</TabsTrigger>
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
                <TableHead>Requester</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Account Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No items found</TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{formatBEDate(item.date)}</TableCell>
                    <TableCell>{item.merchantName}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.requester}</TableCell>
                    <TableCell className="text-right font-medium">{item.amount}</TableCell>
                    <TableCell>{item.accountCode}</TableCell>
                    <TableCell><Badge className={queueColors[item.status]}>{item.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                      </div>
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
