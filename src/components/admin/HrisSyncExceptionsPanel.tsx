import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  Eye,
  AlertTriangle,
  Users,
  UserPlus,
  RefreshCw,
  XCircle,
  Flag,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileUp, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

const DETAIL = {
  code: "00007899",
  subtitle: "Suda Chaiyo · Finance · Bangkok",
  ageing: "Outstanding for 3 consecutive runs",
  firstSeen: "first seen 25/08/2026",
  reasons: [
    {
      chip: "E-EMAIL",
      title: "Missing email",
      text: "Corporate email address is empty in the submitted row.",
    },
    {
      chip: "E-REQ",
      title: "Required field missing",
      text: "Division is blank and is required for an active employee.",
    },
  ],
  submitted: [
    { label: "Emp_ID", value: "00007899" },
    { label: "Prefix", value: "Ms." },
    { label: "Name", value: "Suda" },
    { label: "Surname", value: "Chaiyo" },
    { label: "Email", value: "—", invalid: true },
    { label: "Company", value: "CPAXTRA" },
    { label: "Department", value: "Finance" },
    { label: "Division", value: "—", invalid: true },
    { label: "Position", value: "Finance Officer" },
    { label: "Supervisor Level", value: "3" },
    { label: "Approval_1", value: "00012044" },
    { label: "Approval_2", value: "00013877" },
  ],
  sourceFile: "EMP_FULL_20260827.csv",
  runId: "RUN-20260827-0600",
  runs: [
    { label: "27/08/2026 06:00", note: "This run" },
    { label: "26/08/2026 06:00", note: "Same reasons" },
    { label: "25/08/2026 06:00", note: "First seen" },
  ],
};

interface ExceptionRow {
  id: string;
  code: string;
  name: string;
  type: "Rejected" | "Flagged";
  category: string;
  detail: string;
  file: string;
  ageing: number;
}

const EMPTY_RUN_ID = "RUN-20260828-0600";

const RUNS = [
  { id: EMPTY_RUN_ID, label: "Run: 28/08/2026 06:00 (latest)" },
  { id: "RUN-20260827-0600", label: "Run: 27/08/2026 06:00" },
  { id: "RUN-20260826-0600", label: "Run: 26/08/2026 06:00" },
  { id: "RUN-20260825-0600", label: "Run: 25/08/2026 06:00" },
];

const CATEGORIES = [
  "Invalid Employee ID",
  "Duplicate Employee Code",
  "Missing Employee Name",
  "Missing Email",
  "Invalid Email Format",
  "Missing Bank Account",
  "No Primary Approver",
  "Approver Not Found in File",
];

const CATEGORY_TYPE: Record<string, "Rejected" | "Flagged"> = {
  "Invalid Employee ID": "Rejected",
  "Duplicate Employee Code": "Rejected",
  "Missing Employee Name": "Flagged",
  "Missing Email": "Flagged",
  "Invalid Email Format": "Flagged",
  "Missing Bank Account": "Flagged",
  "No Primary Approver": "Flagged",
  "Approver Not Found in File": "Flagged",
};

const CATEGORY_DETAILS: Record<string, string[]> = {
  "Invalid Employee ID": ["Employee ID must be exactly 8 digits", "Employee ID is not numeric"],
  "Duplicate Employee Code": ["Employee code appears twice in the same file"],
  "Missing Employee Name": ["First name and last name are blank"],
  "Missing Email": ["Corporate email address is empty"],
  "Invalid Email Format": ["Email format is invalid"],
  "Missing Bank Account": ["Bank account is missing — employee is not payable"],
  "No Primary Approver": ["Approval_1 is blank"],
  "Approver Not Found in File": [
    "Approval_1 (00012044) not in file",
    "Approval_1 (00019001) not in file",
  ],
};

const THAI_NAMES = [
  "สมชาย ใจดี",
  "ปรินทร์ สวัสดี",
  "กนกวรรณ ชัยพร",
  "ณัฐพงษ์ ศรีสุข",
  "ศิริพร วงศ์ชัย",
  "ธนกร พิมพ์ชัย",
  "พรทิพย์ รัตนกุล",
  "วิชัย บุญมี",
  "สุดา ชัยโย",
  "อนันต์ แสงทอง",
  "ปิยะดา นวลจันทร์",
  "เกรียงไกร ทองสุข",
  "มานพ เจริญพร",
  "อรพรรณ สุขใจ",
  "ชลธิชา พงษ์ศิริ",
  "ภาณุพงศ์ อินทร์แก้ว",
  "รัตนา มีสุข",
  "สุริยา คำแสน",
  "จิราพร ดวงแก้ว",
  "นพดล ศรีวิไล",
];

function buildRows(): ExceptionRow[] {
  const rows: ExceptionRow[] = [];
  const plan: { category: string; count: number }[] = [
    { category: "Invalid Employee ID", count: 11 },
    { category: "Duplicate Employee Code", count: 9 },
    { category: "Missing Employee Name", count: 8 },
    { category: "Missing Email", count: 9 },
    { category: "Invalid Email Format", count: 7 },
    { category: "Missing Bank Account", count: 8 },
    { category: "No Primary Approver", count: 8 },
    { category: "Approver Not Found in File", count: 7 },
  ];
  let seq = 899;
  let i = 0;
  plan.forEach(({ category, count }) => {
    const details = CATEGORY_DETAILS[category];
    for (let n = 0; n < count; n++) {
      seq += 137;
      const blankName = category === "Missing Employee Name";
      rows.push({
        id: String(i + 1),
        code: String(seq).padStart(8, "0"),
        name: blankName ? "" : THAI_NAMES[i % THAI_NAMES.length],
        type: CATEGORY_TYPE[category],
        category,
        detail: details[n % details.length],
        file: "EMPEXP4550045 (4).TXT",
        ageing: 1,
      });
      i++;
    }
  });
  return rows;
}

const ROWS: ExceptionRow[] = buildRows();


function StatCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  tone: "blue" | "green" | "red" | "amber";
}) {
  const badgeTone = {
    blue: "bg-[#306FC7]/10 text-[#306FC7]",
    green: "bg-[#43938F]/10 text-[#43938F]",
    red: "bg-red-100 text-red-600",
    amber: "bg-[#F6C24A]/20 text-[#B98407]",
  }[tone];
  const borderTone = {
    blue: "border-border",
    green: "border-border",
    red: "border-red-300",
    amber: "border-[#F6C24A]",
  }[tone];

  return (
    <Card className={cn("rounded-xl p-4 flex items-center gap-3", borderTone)}>
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", badgeTone)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-tight">{value}</div>
        <div className="text-xs text-muted-foreground truncate">{label}</div>
      </div>
    </Card>
  );
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const RUN_BY_DATE: Record<string, string> = {
  "20260828": EMPTY_RUN_ID,
  "20260827": "RUN-20260827-0600",
  "20260826": "RUN-20260826-0600",
  "20260825": "RUN-20260825-0600",
};

export default function HrisSyncExceptionsPanel() {
  const [runDate, setRunDate] = useState<Date>(new Date(2026, 8, 15));
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [file, setFile] = useState("all");
  const [type, setType] = useState("all");
  
  const [detailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const dateKey = toDateKey(runDate);
  const run = RUN_BY_DATE[dateKey] ?? "RUN-20260827-0600";
  const isEmptyRun = run === EMPTY_RUN_ID;

  const filtered = useMemo(
    () =>
      ROWS.filter((r) => {
        const q = search.trim().toLowerCase();
        const matchSearch =
          !q || r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
        return (
          matchSearch &&
          (category === "all" || r.category === category) &&
          (file === "all" || r.file === file) &&
          (type === "all" || r.type === type)
        );
      }),
    [search, category, file, type]
  );

  const totalExceptions = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalExceptions / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rangeStart = totalExceptions === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalExceptions);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExport = () => {
    const header = ["Employee Code", "Name", "Type", "Category", "Reason Detail"];
    const lines = [header, ...filtered.map((r) => [r.code, r.name || "—", r.type, r.category, r.detail])]
      .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + lines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hris-sync-exceptions-${dateKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };



  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground">Admin Settings</div>
          <h2 className="text-lg font-semibold">HRIS Sync Exceptions</h2>
          <p className="text-sm text-muted-foreground">
            Review employee records rejected or flagged during the HRIS employee sync
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[260px] justify-start text-left font-normal">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(runDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={runDate}
                onSelect={(d) => d && setRunDate(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" disabled={isEmptyRun} onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>


      {/* Run context bar */}
      <Card className="rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
          <div>
            <div className="text-xs text-muted-foreground">Run ID</div>
            <div className="text-sm font-medium">RUN-20260827-0600</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Completed</div>
            <div className="text-sm font-medium">27/08/2026 06:14</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Trigger</div>
            <Badge className="rounded-full border-[#306FC7]/30 bg-[#306FC7]/10 text-[#306FC7] hover:bg-[#306FC7]/10">
              SCHEDULED
            </Badge>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">File name</div>
            <div className="text-sm font-medium">{`EMPEXP4550045 (4).TXT_${dateKey}`}</div>
          </div>
        </div>
      </Card>

      {/* KPI cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Users} value="8,432" label="Records Received" tone="blue" />
        <StatCard icon={UserPlus} value="7,983" label="Inserted" tone="green" />
        <StatCard icon={RefreshCw} value="429" label="Updated" tone="blue" />
        <StatCard
          icon={isEmptyRun ? CheckCircle2 : XCircle}
          value={isEmptyRun ? "0" : "20"}
          label="Not Inserted (Rejected)"
          tone={isEmptyRun ? "green" : "red"}
        />
        <StatCard
          icon={isEmptyRun ? CheckCircle2 : Flag}
          value={isEmptyRun ? "0" : "47"}
          label="Flagged (Incomplete)"
          tone={isEmptyRun ? "green" : "amber"}
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          placeholder="Search by Employee Code or Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isEmptyRun ? (
        <Card className="rounded-xl p-12 flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-full bg-[#43938F]/10 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-[#43938F]" />
          </div>
          <h3 className="text-base font-semibold">No exceptions in the latest run</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            All records were processed successfully. There is nothing to review or send to the HRIS
            team.
          </p>
          <p className="text-xs text-muted-foreground">
            Run RUN-20260828-0600 · completed 28/08/2026 06:03
          </p>
        </Card>
      ) : (
      <Card className="rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-full">Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-sm">{r.code}</TableCell>
                <TableCell>{r.name || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  {r.type === "Rejected" ? (
                    <Badge className="rounded-full border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
                      Rejected
                    </Badge>
                  ) : (
                    <Badge className="rounded-full border-[#F6C24A] bg-[#F6C24A]/15 text-[#B98407] hover:bg-[#F6C24A]/15">
                      Flagged
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium">{r.category}</span>
                  <span className="text-muted-foreground"> — {r.detail}</span>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No exceptions match your search
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-sm text-muted-foreground">{`Showing ${rangeStart}–${rangeEnd} of ${totalExceptions} exceptions`}</span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setPage(Math.max(1, currentPage - 1))}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={p === currentPage ? "default" : "outline"}
                className={p === currentPage ? "bg-primary text-primary-foreground hover:bg-primary/90" : undefined}
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
      )}


      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] p-0 flex flex-col gap-0">
          <div className="flex items-start justify-between gap-3 border-b border-border p-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-semibold">{DETAIL.code}</span>
                <Badge className="rounded-full border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
                  Rejected
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">{DETAIL.subtitle}</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setDetailOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <div className="text-sm font-medium text-red-700">{DETAIL.ageing}</div>
              <div className="text-xs text-red-700/80">{DETAIL.firstSeen}</div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reasons ({DETAIL.reasons.length})
              </h4>
              {DETAIL.reasons.map((r) => (
                <Card key={r.chip} className="rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs">{r.chip}</span>
                    <span className="text-sm font-medium">{r.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                </Card>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Submitted Row
              </h4>
              <div className="rounded-xl border border-border divide-y divide-border">
                {DETAIL.submitted.map((f) => (
                  <div
                    key={f.label}
                    className={cn(
                      "flex justify-between gap-4 px-3 py-2 text-sm",
                      f.invalid && "bg-red-50"
                    )}
                  >
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-medium text-right">{f.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Bank account is not stored in this system, so it is not shown here.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Source
              </h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Source file</span>
                <span className="font-medium">{DETAIL.sourceFile}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Run ID</span>
                <span className="font-medium">{DETAIL.runId}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Trigger</span>
                <Badge className="rounded-full border-[#306FC7]/30 bg-[#306FC7]/10 text-[#306FC7] hover:bg-[#306FC7]/10">
                  SCHEDULED
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Appeared in Runs
              </h4>
              <div className="space-y-3">
                {DETAIL.runs.map((r) => (
                  <div key={r.label} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-[#DA3832] shrink-0" />
                    <div>
                      <div className="text-sm font-medium">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-border p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Copy reason for HRIS
              </Button>
              <Button variant="outline">Export row</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Records are corrected at source in HRIS. This view is read-only and clears
              automatically on the next successful run.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
