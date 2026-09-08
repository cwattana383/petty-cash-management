import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

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

const RUNS = [
  { id: "RUN-20260827-0600", label: "Run: 27/08/2026 06:00 (latest)" },
  { id: "RUN-20260826-0600", label: "Run: 26/08/2026 06:00" },
  { id: "RUN-20260825-0600", label: "Run: 25/08/2026 06:00" },
];

const ROWS: ExceptionRow[] = [
  { id: "1", code: "00000899", name: "สมชาย ใจดี", type: "Rejected", category: "No primary approver", detail: "Approval_1 (00012044) not in file", file: "EMP_FULL_20260827.csv", ageing: 3 },
  { id: "2", code: "00012044", name: "", type: "Rejected", category: "Missing employee name", detail: "First name and last name are blank", file: "EMP_FULL_20260827.csv", ageing: 2 },
  { id: "3", code: "00013877", name: "ปรินทร์ สวัสดี", type: "Flagged", category: "Incomplete cost centre", detail: "Cost centre CC-000 not found in master", file: "EMP_FULL_20260827.csv", ageing: 1 },
  { id: "4", code: "00014520", name: "กนกวรรณ ชัยพร", type: "Flagged", category: "Missing email", detail: "Corporate email address is empty", file: "EMP_DELTA_20260827.csv", ageing: 1 },
  { id: "5", code: "00015002", name: "ณัฐพงษ์ ศรีสุข", type: "Rejected", category: "Duplicate employee code", detail: "Code appears twice in the same file", file: "EMP_DELTA_20260827.csv", ageing: 4 },
  { id: "6", code: "00015338", name: "ศิริพร วงศ์ชัย", type: "Flagged", category: "Invalid position code", detail: "Position POS-9981 not in position master", file: "EMP_FULL_20260827.csv", ageing: 2 },
  { id: "7", code: "00016104", name: "", type: "Flagged", category: "Missing employee name", detail: "Last name is blank", file: "EMP_DELTA_20260827.csv", ageing: 1 },
  { id: "8", code: "00016730", name: "ธนกร พิมพ์ชัย", type: "Rejected", category: "Invalid store code", detail: "Store 9052 does not exist", file: "EMP_FULL_20260827.csv", ageing: 1 },
  { id: "9", code: "00017245", name: "พรทิพย์ รัตนกุล", type: "Flagged", category: "Incomplete cost centre", detail: "Cost centre blank for active employee", file: "EMP_DELTA_20260827.csv", ageing: 1 },
  { id: "10", code: "00017988", name: "วิชัย บุญมี", type: "Rejected", category: "No primary approver", detail: "Approval_1 (00019001) is inactive", file: "EMP_FULL_20260827.csv", ageing: 5 },
];

const CATEGORIES = [
  "No primary approver",
  "Missing employee name",
  "Incomplete cost centre",
  "Missing email",
  "Duplicate employee code",
  "Invalid position code",
  "Invalid store code",
];

const FILES = ["EMP_FULL_20260827.csv", "EMP_DELTA_20260827.csv"];

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

export default function HrisSyncExceptionsPanel() {
  const [run, setRun] = useState(RUNS[0].id);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [file, setFile] = useState("all");
  const [type, setType] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);

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

  const allChecked = filtered.length > 0 && filtered.every((r) => selected.includes(r.id));

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
          <Select value={run} onValueChange={setRun}>
            <SelectTrigger className="w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RUNS.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export &amp; Send to HRIS
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
            <div className="text-xs text-muted-foreground">Files processed</div>
            <div className="text-sm font-medium">3 (EMP_FULL, EMP_DELTA, EMP_STORE)</div>
          </div>
        </div>
      </Card>

      {/* KPI cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Users} value="8,432" label="Records Received" tone="blue" />
        <StatCard icon={UserPlus} value="7,983" label="Inserted" tone="green" />
        <StatCard icon={RefreshCw} value="429" label="Updated" tone="blue" />
        <StatCard icon={XCircle} value="20" label="Not Inserted (Rejected)" tone="red" />
        <StatCard icon={Flag} value="47" label="Flagged (Incomplete)" tone="amber" />
      </div>

      {/* Warning banner */}
      <div className="rounded-xl border border-[#F6C24A] bg-[#F6C24A]/10 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-[#B98407] shrink-0 mt-0.5" />
        <p className="text-sm text-foreground">
          File-level exception: EMP_STORE_20260827.csv contained headers only (0 data rows). No
          employees were deactivated by the leaver rule. A system alert was raised.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by Employee Code or Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[220px]">
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
        <Select value={file} onValueChange={setFile}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Source File" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Source Files</SelectItem>
            {FILES.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[160px]">
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
      <Card className="rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={(v) =>
                    setSelected(v ? filtered.map((r) => r.id) : [])
                  }
                />
              </TableHead>
              <TableHead>Employee Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Source File</TableHead>
              <TableHead>Ageing</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(r.id)}
                    onCheckedChange={(v) =>
                      setSelected((prev) =>
                        v ? [...prev, r.id] : prev.filter((x) => x !== r.id)
                      )
                    }
                  />
                </TableCell>
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
                <TableCell className="text-sm">{r.file}</TableCell>
                <TableCell>
                  {r.ageing >= 2 ? (
                    <Badge className="rounded-full border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
                      {r.ageing} runs
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">1 run</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" title="View">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No exceptions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-sm text-muted-foreground">Showing 1–10 of 67 exceptions</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" disabled>
              Previous
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              1
            </Button>
            <Button size="sm" variant="outline">
              2
            </Button>
            <Button size="sm" variant="outline">
              3
            </Button>
            <Button size="sm" variant="outline">
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="rounded-xl p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge className="rounded-full border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
              Rejected
            </Badge>
            <span className="text-muted-foreground">Record was not inserted into the portal</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="rounded-full border-[#F6C24A] bg-[#F6C24A]/15 text-[#B98407] hover:bg-[#F6C24A]/15">
              Flagged
            </Badge>
            <span className="text-muted-foreground">Record was created but data is incomplete</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="rounded-full border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
              2+ runs
            </Badge>
            <span className="text-muted-foreground">Exception repeated across consecutive runs</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Corrected records clear automatically on the next successful run · Bank account is never
          stored or shown
        </p>
      </Card>
    </div>
  );
}
