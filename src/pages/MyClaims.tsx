import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClaims } from "@/lib/claims-context";

const statusColors: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  "Pending Approval": "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  "Need Info": "bg-blue-100 text-blue-800",
  Paid: "bg-emerald-100 text-emerald-800",
  Reconciled: "bg-purple-100 text-purple-800",
};

export default function MyClaims() {
  const navigate = useNavigate();
  const { claims } = useClaims();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = claims.filter((c) => {
    if (search && !c.claimNo.toLowerCase().includes(search.toLowerCase()) && !c.purpose.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (typeFilter !== "all" && !c.lines.some((l) => l.expenseType === typeFilter)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Claims</h1>
          <p className="text-muted-foreground">Manage your expense claims</p>
        </div>
        <Button onClick={() => navigate("/claims/create")}><Plus className="h-4 w-4 mr-2" />New Claim</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search claims..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.keys(statusColors).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Expense Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {["Travel", "Meals", "Office Supplies", "Transportation", "Training", "Other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No claims found</TableCell></TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/claims/${c.id}`)}>
                    <TableCell className="font-medium">{c.claimNo}</TableCell>
                    <TableCell>{c.createdDate}</TableCell>
                    <TableCell>{c.purpose}</TableCell>
                    <TableCell className="text-right font-medium">฿{c.totalAmount.toLocaleString()}</TableCell>
                    <TableCell><Badge className={statusColors[c.status]}>{c.status}</Badge></TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/claims/${c.id}`); }}><Eye className="h-4 w-4" /></Button></TableCell>
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
