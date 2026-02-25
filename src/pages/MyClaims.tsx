import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Plus, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { mockClaims } from "@/lib/mock-data";
import { ClaimStatus } from "@/lib/types";
import { formatBEDate, cn } from "@/lib/utils";
import { format, subDays } from "date-fns";

const statusVariant: Record<ClaimStatus, string> = {
  "Pending Invoice": "bg-orange-100 text-orange-800",
  "Pending Approval": "bg-yellow-100 text-yellow-800",
  "Final Rejected": "bg-red-100 text-red-800",
  "Auto Approved": "bg-green-100 text-green-800",
  "Reimbursed": "bg-emerald-100 text-emerald-800",
};

export default function MyClaims() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending Invoice");
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 6));
  const [dateTo, setDateTo] = useState<Date>(new Date());

  const filtered = useMemo(() => {
    return mockClaims.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;

      // Date range filter
      const txnDate = new Date(c.createdDate);
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (txnDate < from || txnDate > to) return false;

      if (search) {
        const kw = search.toLowerCase();
        const searchable = [c.claimNo, c.purpose, c.requesterName].join(" ").toLowerCase();
        if (!searchable.includes(kw)) return false;
      }
      return true;
    });
  }, [search, statusFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Expenses</h1>
          <p className="text-muted-foreground">Manage your expenses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 p-4 border rounded-lg bg-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending Invoice">Pending Invoice</SelectItem>
              <SelectItem value="Pending Approval">Pending Approval</SelectItem>
              <SelectItem value="Final Rejected">Final Rejected</SelectItem>
              <SelectItem value="Auto Approved">Auto Approved</SelectItem>
              <SelectItem value="Reimbursed">Reimbursed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Transaction Date:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatBEDate(format(dateFrom, "yyyy-MM-dd"))}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} initialFocus />
            </PopoverContent>
          </Popover>
          <span className="text-sm text-muted-foreground">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatBEDate(format(dateTo, "yyyy-MM-dd"))}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction No.</TableHead>
              <TableHead>Transaction Date</TableHead>
              <TableHead>Merchant Name</TableHead>
              <TableHead>Receipt/Tax Invoice No.</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No expenses found</TableCell></TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/claims/${c.id}`)}>
                  <TableCell className="font-medium">{c.claimNo}</TableCell>
                  <TableCell>{formatBEDate(c.createdDate)}</TableCell>
                  <TableCell>{c.merchantName || "—"}</TableCell>
                  <TableCell>{c.lines?.[0]?.taxInvoiceNo || "—"}</TableCell>
                  <TableCell>{c.purpose}</TableCell>
                  <TableCell className="text-right">฿{c.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusVariant[c.status]}>{c.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
