import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, Link2, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const matchColors: Record<string, string> = {
  Matched: "bg-green-100 text-green-800",
  Unmatched: "bg-yellow-100 text-yellow-800",
  "Partially Matched": "bg-blue-100 text-blue-800",
  Exception: "bg-red-100 text-red-800",
};

const mockTxns = [
  { id: "TXN-001", date: "2025-02-01", merchant: "Thai Airways", amount: "฿15,200", cardholder: "สมชาย ใจดี", status: "Matched", claimId: "EC-2025-001" },
  { id: "TXN-002", date: "2025-02-03", merchant: "Starbucks Siam", amount: "฿850", cardholder: "สมหญิง แก้วใส", status: "Unmatched", claimId: "-" },
  { id: "TXN-003", date: "2025-02-05", merchant: "Amazon Web Services", amount: "฿12,000", cardholder: "วิชัย เจริญ", status: "Partially Matched", claimId: "EC-2025-012" },
  { id: "TXN-004", date: "2025-02-06", merchant: "Grab Transport", amount: "฿320", cardholder: "นภา แจ่มใส", status: "Exception", claimId: "-" },
];

export default function Reconcile() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bank Reconciliation</h1>
          <p className="text-muted-foreground">Match corporate card transactions with expense claims</p>
        </div>
        <Button><Upload className="h-4 w-4 mr-2" />Import Statement</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {Object.entries(matchColors).map(([status, color]) => (
          <Card key={status}>
            <CardContent className="p-4 text-center">
              <Badge className={color}>{status}</Badge>
              <p className="text-2xl font-bold mt-2">{mockTxns.filter((t) => t.status === status).length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Txn ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Cardholder</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Linked Claim</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTxns.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.id}</TableCell>
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.merchant}</TableCell>
                  <TableCell>{t.cardholder}</TableCell>
                  <TableCell className="text-right font-medium">{t.amount}</TableCell>
                  <TableCell><Badge className={matchColors[t.status]}>{t.status}</Badge></TableCell>
                  <TableCell>{t.claimId}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon"><Link2 className="h-4 w-4" /></Button>
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
