import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  CalendarDays,
  CalendarClock,
  FileSpreadsheet,
  CheckCircle2,
  UserCheck,
  XCircle,
  Clock,
  BarChart3,
  Building2,
  Layers,
  CreditCard,
  ShieldAlert,
  ScanLine,
  FileText,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MonthEndReportNotificationPanel from "@/components/admin/MonthEndReportNotificationPanel";

// --- Sidebar menu definition ---
const reportsMenu = [
  {
    group: "Monthly Reports",
    icon: CalendarClock,
    items: [
      { key: "month-end-summary", label: "Month-End Summary", icon: FileSpreadsheet },
      { key: "hr-finance-report", label: "HR & Finance Report", icon: Receipt },
    ],
  },
];

const monthEndRows = [
  { status: "Auto-Approved", count: 42, amount: 185000, color: "#16a34a" },
  { status: "Manager-Approved", count: 18, amount: 94500, color: "#2563eb" },
  { status: "Auto-Rejected", count: 5, amount: 23000, color: "#dc2626" },
  { status: "Manager-Rejected", count: 3, amount: 15000, color: "#ea580c" },
  { status: "Pending (Salary Deduction)", count: 2, amount: 8200, color: "#d97706" },
];

const grandTotalCount = monthEndRows.reduce((s, r) => s + r.count, 0);
const grandTotalAmount = monthEndRows.reduce((s, r) => s + r.amount, 0);

function MonthEndSummaryPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Month-End Summary</h2>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="rounded-full bg-blue-100 p-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-sm text-blue-800 font-medium">
            Monthly report — automatically sent to HR and Finance on the 9th of every month.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Month-End Summary — February 2026</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-right px-6 py-3 font-semibold">Transactions</th>
                <th className="text-right px-6 py-3 font-semibold">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {monthEndRows.map((row) => (
                <tr key={row.status} className="border-b last:border-b-0">
                  <td className="px-6 py-3">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      {row.status}
                    </span>
                  </td>
                  <td className="text-right px-6 py-3 font-mono">{row.count}</td>
                  <td className="text-right px-6 py-3 font-mono">
                    ฿{row.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-semibold">
                <td className="px-6 py-3">Grand Total</td>
                <td className="text-right px-6 py-3 font-mono">{grandTotalCount}</td>
                <td className="text-right px-6 py-3 font-mono">
                  ฿{grandTotalAmount.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function PlaceholderPanel({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-foreground mb-1">{title}</p>
          <p className="text-sm text-muted-foreground">
            This report will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

const panelMap: Record<string, () => JSX.Element> = {
  "month-end-summary": MonthEndSummaryPanel,
  "hr-finance-report": MonthEndReportNotificationPanel,
  "auto-approved": () => <PlaceholderPanel title="Auto-Approved Transactions" />,
  "manager-approved": () => <PlaceholderPanel title="Manager-Approved Transactions" />,
  "rejected": () => <PlaceholderPanel title="Rejected Transactions" />,
  "pending-deduction": () => <PlaceholderPanel title="Pending (Salary Deduction)" />,
  "spending-by-department": () => <PlaceholderPanel title="Spending by Department" />,
  "spending-by-expense-type": () => <PlaceholderPanel title="Spending by Expense Type" />,
  "cardholder-activity": () => <PlaceholderPanel title="Cardholder Activity" />,
  "policy-violations": () => <PlaceholderPanel title="Policy Violations" />,
  "ocr-validation-log": () => <PlaceholderPanel title="OCR Validation Log" />,
};

export default function Reports() {
  const [activeKey, setActiveKey] = useState("month-end-summary");
  const ActivePanel = panelMap[activeKey] || (() => <div className="p-8 text-muted-foreground">Report not found</div>);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground text-sm">Analytics and reporting</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
        {/* Secondary Sidebar */}
        <nav className="shrink-0 w-64">
          <div className="space-y-5">
            {reportsMenu.map((group) => (
              <div key={group.group}>
                <div className="flex items-center gap-2 mb-2 px-2">
                  <group.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.group}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setActiveKey(item.key)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left",
                        activeKey === item.key
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <ActivePanel />
        </div>
      </div>
    </div>
  );
}
