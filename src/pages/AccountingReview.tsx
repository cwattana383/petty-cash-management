import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";
import { formatBEDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockItems = [
  { id: "EC-2025-006", requester: "พิมพ์ ดี", amount: "฿8,200", status: "Pending Review", accountCode: "-", date: "2025-02-03" },
  { id: "EC-2025-007", requester: "ชัยวัฒน์ ศรี", amount: "฿32,000", status: "Exception", accountCode: "5120", date: "2025-02-04" },
  { id: "EC-2025-008", requester: "นภา แจ่มใส", amount: "฿5,600", status: "Ready for ERP", accountCode: "5110", date: "2025-02-05" },
];

const queueColors: Record<string, string> = {
  "Pending Review": "bg-yellow-100 text-yellow-800",
  Exception: "bg-red-100 text-red-800",
  "Ready for ERP": "bg-green-100 text-green-800",
};

export default function AccountingReview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Accounting Review</h1>
        <p className="text-muted-foreground">Review and adjust expense claims for ERP</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="exception">Exception</TabsTrigger>
          <TabsTrigger value="ready">Ready for ERP</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim No.</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.requester}</TableCell>
                      <TableCell className="text-right font-medium">{item.amount}</TableCell>
                      <TableCell>{item.accountCode}</TableCell>
                      <TableCell>{formatBEDate(item.date)}</TableCell>
                      <TableCell><Badge className={queueColors[item.status]}>{item.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
