import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Mail, Users } from "lucide-react";

const summaryRows = [
  { status: "Auto-Approved", count: 42, amount: 185000 },
  { status: "Manager-Approved", count: 18, amount: 94500 },
  { status: "Auto-Rejected", count: 5, amount: 23000 },
  { status: "Final Rejected", count: 3, amount: 15000 },
  { status: "Pending (Salary Deduction)", count: 2, amount: 8200 },
];

const rejectedCount = summaryRows.filter(r => r.status === "Auto-Rejected" || r.status === "Final Rejected").reduce((s, r) => s + r.count, 0);
const rejectedAmount = summaryRows.filter(r => r.status === "Auto-Rejected" || r.status === "Final Rejected").reduce((s, r) => s + r.amount, 0);

const totalCount = summaryRows.reduce((s, r) => s + r.count, 0);
const totalAmount = summaryRows.reduce((s, r) => s + r.amount, 0);

const statusColors: Record<string, string> = {
  "Auto-Approved": "#16a34a",
  "Manager-Approved": "#2563eb",
  "Auto-Rejected": "#dc2626",
  "Manager-Rejected": "#ea580c",
  "Pending (Salary Deduction)": "#d97706",
};

export default function MonthEndReportNotificationPanel() {
  const [enabled, setEnabled] = useState(true);
  const [sendDay, setSendDay] = useState("9");
  const [subject, setSubject] = useState("Corporate Card Expense Summary Report — {{month}}/{{year}}");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Month End Report — HR & Finance
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monthly Corporate Card transaction summary, auto-sent to HR and Finance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="month-end-toggle" className="text-sm">Enable</Label>
          <Switch id="month-end-toggle" checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Send on day of month</Label>
              <Select value={sendDay} onValueChange={setSendDay}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>Day {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Recipients</Label>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" /> HR Team</Badge>
                <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" /> Finance Team</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Email Subject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="text-sm" />
            <p className="text-xs text-muted-foreground">
              Available variables: {"{{month}}"}, {"{{year}}"}, {"{{total_count}}"}, {"{{total_amount}}"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Email Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-white">
            {/* Email header */}
            <div className="bg-muted/50 px-6 py-4 border-b">
              <p className="text-xs text-muted-foreground">To: HR Team, Finance Team</p>
              <p className="text-sm font-medium mt-1">Corporate Card Expense Summary Report — 02/2026</p>
            </div>

            {/* Email body */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm">Dear HR and Finance Team,</p>
              <p className="text-sm text-muted-foreground">
                Below is the Corporate Card expense summary for February 2026:
              </p>

              {/* Summary table */}
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Count</th>
                      <th className="text-right px-4 py-2.5 font-semibold">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((row) => (
                      <tr key={row.status} className="border-t">
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: statusColors[row.status] }}
                            />
                            {row.status}
                          </span>
                        </td>
                        <td className="text-right px-4 py-2.5 font-mono">{row.count}</td>
                        <td className="text-right px-4 py-2.5 font-mono">฿{row.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30 font-semibold">
                      <td className="px-4 py-2.5">Grand Total</td>
                      <td className="text-right px-4 py-2.5 font-mono">{totalCount}</td>
                      <td className="text-right px-4 py-2.5 font-mono">฿{totalAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p className="text-sm text-muted-foreground">
                Please review additional details in the Accounting Review system.
              </p>

              <div className="pt-2">
                <span className="inline-block bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md">
                  View Full Report
                </span>
              </div>

              <div className="pt-4 border-t mt-4">
                <p className="text-xs text-muted-foreground">
                  This email is automatically sent on day {sendDay} of each month — please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
