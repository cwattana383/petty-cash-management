import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, MessageSquare, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const mockApprovals = [
  { id: "EC-2025-010", requester: "สมชาย ใจดี", dept: "Sales", purpose: "Client visit - Chiang Mai", amount: "฿18,500", submitted: "2025-02-06", priority: "Normal" },
  { id: "EC-2025-011", requester: "สมหญิง แก้วใส", dept: "Marketing", purpose: "Trade show materials", amount: "฿45,000", submitted: "2025-02-07", priority: "High" },
  { id: "EC-2025-012", requester: "วิชัย เจริญ", dept: "Engineering", purpose: "Software License Renewal", amount: "฿12,000", submitted: "2025-02-08", priority: "Normal" },
];

export default function ApprovalInbox() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Approval Inbox</h1>
        <p className="text-muted-foreground">Review and approve expense claims</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">3</p><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">12</p><p className="text-sm text-muted-foreground">Approved This Month</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">฿175,500</p><p className="text-sm text-muted-foreground">Total Pending Amount</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim No.</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockApprovals.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.id}</TableCell>
                  <TableCell>{a.requester}</TableCell>
                  <TableCell>{a.dept}</TableCell>
                  <TableCell>{a.purpose}</TableCell>
                  <TableCell className="text-right font-medium">{a.amount}</TableCell>
                  <TableCell>{a.submitted}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50"><X className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><MessageSquare className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
