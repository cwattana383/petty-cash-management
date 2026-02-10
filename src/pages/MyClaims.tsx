import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusColors: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  "Pending Approval": "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  "Need Info": "bg-blue-100 text-blue-800",
  Paid: "bg-emerald-100 text-emerald-800",
};

const mockClaims = [
  { id: "EC-2025-001", date: "2025-01-15", purpose: "Business Travel - Bangkok", amount: "฿15,200", status: "Approved", type: "Travel" },
  { id: "EC-2025-002", date: "2025-01-20", purpose: "Client Meeting Lunch", amount: "฿2,800", status: "Pending Approval", type: "Meals" },
  { id: "EC-2025-003", date: "2025-02-01", purpose: "Office Supplies Purchase", amount: "฿4,500", status: "Draft", type: "Office Supplies" },
  { id: "EC-2025-004", date: "2025-02-05", purpose: "Taxi to Airport", amount: "฿850", status: "Rejected", type: "Transportation" },
  { id: "EC-2025-005", date: "2025-02-08", purpose: "Conference Registration", amount: "฿25,000", status: "Need Info", type: "Training" },
];

export default function MyClaims() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Claims</h1>
          <p className="text-muted-foreground">Manage your expense claims</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />New Claim</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search claims..." className="pl-9" />
            </div>
            <Select>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {Object.keys(statusColors).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Expense Type" /></SelectTrigger>
              <SelectContent>
                {["Travel", "Meals", "Office Supplies", "Transportation", "Training"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockClaims.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.id}</TableCell>
                  <TableCell>{c.date}</TableCell>
                  <TableCell>{c.purpose}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell className="text-right font-medium">{c.amount}</TableCell>
                  <TableCell><Badge className={statusColors[c.status]}>{c.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
