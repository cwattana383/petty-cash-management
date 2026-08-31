import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Inbox, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { listCardRequests, type CardRequest, type CardRequestStatus } from "@/lib/card-request-types";

const RED = "#DA3832";

interface RequestRow {
  requestNo: string;
  requestDate: string; // dd/mm/yyyy (BE)
  cardType: "Corporate Credit Card" | "Fleet Card";
  cardholder: string;
  position: string;
  limit: number;
  status: CardRequestStatus;
  linkedCard: string | null;
}

const SEED_ROWS: RequestRow[] = [
  { requestNo: "CR2606021", requestDate: "19/06/2569", cardType: "Fleet Card", cardholder: "Store 101 Rayong / 70-8814", position: "SGM", limit: 200000, status: "Completed", linkedCard: "FL-2026-00412" },
  { requestNo: "CR2606023", requestDate: "19/06/2569", cardType: "Corporate Credit Card", cardholder: "K. Kanda Kan", position: "Director", limit: 300000, status: "Completed", linkedCard: "CC-2026-31208" },
  { requestNo: "CR2609001", requestDate: "20/09/2569", cardType: "Corporate Credit Card", cardholder: "K. Mary Lee", position: "Director", limit: 500000, status: "Rejected", linkedCard: null },
  { requestNo: "CR2609003", requestDate: "20/09/2569", cardType: "Corporate Credit Card", cardholder: "K. Peter Tan", position: "Director", limit: 500000, status: "Card Issued", linkedCard: "CC-2026-35775" },
  { requestNo: "CR2609004", requestDate: "31/08/2569", cardType: "Corporate Credit Card", cardholder: "K. Somchai Jaidee", position: "Director", limit: 500000, status: "Pending Approval", linkedCard: null },
];

const STATUS_BADGE: Record<CardRequestStatus, string> = {
  Draft: "bg-gray-100 text-gray-700 border-gray-200",
  "Pending Approval": "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  "Treasury Processing": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Submitted to Bank": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Card Issued": "bg-teal-50 text-teal-700 border-teal-200",
  Completed: "bg-green-50 text-green-700 border-green-200",
};

const STATUS_TABS: CardRequestStatus[] = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Rejected",
  "Treasury Processing",
  "Submitted to Bank",
  "Card Issued",
  "Completed",
];

function toRow(r: CardRequest): RequestRow {
  const isFleet = r.cardType === "Fleet Card";
  const limit = Number(String(r.creditLimit ?? "").replace(/[^\d.]/g, "")) || 0;
  const d = r.requestDate ? new Date(r.requestDate) : null;
  const requestDate =
    d && !isNaN(d.getTime())
      ? `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear() + 543}`
      : r.requestDate || "";
  return {
    requestNo: r.requestNo,
    requestDate,
    cardType: isFleet ? "Fleet Card" : "Corporate Credit Card",
    cardholder: isFleet
      ? [r.storeLocation, r.vehiclePlate].filter(Boolean).join(" / ")
      : r.employeeName ?? "",
    position: isFleet ? r.holderSgm ?? "" : r.position ?? "",
    limit,
    status: r.status,
    linkedCard: null,
  };
}

function parseBE(d: string): number | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d.trim());
  if (!m) return null;
  return new Date(Number(m[3]) - 543, Number(m[2]) - 1, Number(m[1])).getTime();
}

export default function CardRequests() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [cardType, setCardType] = useState<"all" | "corporate" | "fleet">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tab, setTab] = useState<string>("Pending Approval");

  const rows = useMemo(() => {
    const stored = listCardRequests().map(toRow);
    const seen = new Set(stored.map((r) => r.requestNo));
    return [...stored, ...SEED_ROWS.filter((r) => !seen.has(r.requestNo))];
  }, []);

  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = parseBE(dateFrom);
    const to = parseBE(dateTo);
    return rows.filter((r) => {
      if (cardType === "corporate" && r.cardType !== "Corporate Credit Card") return false;
      if (cardType === "fleet" && r.cardType !== "Fleet Card") return false;
      if (q && ![r.requestNo, r.cardholder, r.position].some((f) => f.toLowerCase().includes(q))) return false;
      const t = parseBE(r.requestDate);
      if (from && t !== null && t < from) return false;
      if (to && t !== null && t > to) return false;
      return true;
    });
  }, [rows, search, cardType, dateFrom, dateTo]);

  const visible = useMemo(
    () => (tab === "All" ? baseFiltered : baseFiltered.filter((r) => r.status === tab)),
    [baseFiltered, tab],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: baseFiltered.length };
    STATUS_TABS.forEach((s) => (c[s] = baseFiltered.filter((r) => r.status === s).length));
    return c;
  }, [baseFiltered]);

  const kpi = useMemo(() => {
    const now = new Date();
    return {
      pending: baseFiltered.filter((r) => r.status === "Pending Approval").length,
      treasury: baseFiltered.filter((r) =>
        ["Treasury Processing", "Submitted to Bank", "Card Issued"].includes(r.status),
      ).length,
      completed: baseFiltered.filter((r) => {
        if (r.status !== "Completed") return false;
        const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(r.requestDate);
        return m ? Number(m[2]) === now.getMonth() + 1 && Number(m[3]) - 543 === now.getFullYear() : false;
      }).length,
      rejected: baseFiltered.filter((r) => r.status === "Rejected").length,
    };
  }, [baseFiltered]);

  return (
    <div className="space-y-4 rounded-xl p-4" style={{ backgroundColor: "#F5F6F7" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Card Requests</h2>
          <p className="text-sm text-muted-foreground">Track card requests through their lifecycle / คำขอบัตร</p>
        </div>
        <Button onClick={() => navigate("/card-requests/new")} style={{ backgroundColor: RED, color: "#fff" }}>
          + New Card Request
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Pending Approval", value: kpi.pending },
          { label: "In Treasury/Bank", value: kpi.treasury },
          { label: "Completed this month", value: kpi.completed },
          { label: "Rejected", value: kpi.rejected },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-bold text-foreground">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search request no., cardholder, store..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Card Type:</span>
              <Tabs value={cardType} onValueChange={(v) => setCardType(v as typeof cardType)}>
                <TabsList>
                  <TabsTrigger value="all">All Cards</TabsTrigger>
                  <TabsTrigger value="corporate">Credit Card</TabsTrigger>
                  <TabsTrigger value="fleet">Fleet Card</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-2">
              <Input
                className="w-[130px]"
                placeholder="01/01/2569"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="text-muted-foreground">–</span>
              <Input
                className="w-[130px]"
                placeholder="31/08/2569"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b">
            {[...STATUS_TABS, "All"].map((s) => {
              const active = tab === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTab(s)}
                  className={cn(
                    "px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
                    active ? "font-semibold" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                  style={active ? { borderColor: RED, color: RED } : undefined}
                >
                  {s}
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {counts[s] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request No.</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Card Type</TableHead>
                <TableHead>Cardholder / Store</TableHead>
                <TableHead>Position / Holder</TableHead>
                <TableHead className="text-right">Requested Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Linked Card</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Inbox className="h-6 w-6 opacity-50" />
                      <span className="text-sm">No requests in this status.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow
                    key={r.requestNo}
                    className="cursor-pointer"
                    onClick={() => navigate(`/card-requests/${r.requestNo}`)}
                  >
                    <TableCell className="font-medium">{r.requestNo}</TableCell>
                    <TableCell>{r.requestDate}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          r.cardType === "Fleet Card"
                            ? "bg-green-50 text-[#43938F] border-green-200"
                            : "bg-blue-50 text-[#306FC7] border-blue-200"
                        }
                      >
                        {r.cardType === "Fleet Card" ? "Fleet Card" : "Credit Card"}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.cardholder}</TableCell>
                    <TableCell>{r.position}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.limit.toLocaleString("en-US")}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_BADGE[r.status]}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.linkedCard ?? "—"}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/card-requests/${r.requestNo}`)}>
                            View
                          </DropdownMenuItem>
                          {r.status === "Draft" && (
                            <DropdownMenuItem onClick={() => navigate(`/card-requests/${r.requestNo}/edit`)}>
                              Edit
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
