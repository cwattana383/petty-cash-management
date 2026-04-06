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
  "Final Rejected": "#7f1d1d",
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
            Monthly Corporate Card expense summary sent to HR and Finance automatically
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
              Available variables: {"{{month}}"}, {"{{year}}"}, {"{{total_count}}"}, {"{{total_amount}}"}, {"{{rejected_count}}"}, {"{{rejected_amount}}"}
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
              <p className="text-sm font-medium mt-1">Corporate Card Expense Summary Report — February 2026</p>
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
                    <tr className="border-t" style={{ backgroundColor: "#FEE2E2" }}>
                      <td className="px-4 py-2.5 font-bold" style={{ color: "#991B1B" }}>Total Requiring Salary Deduction</td>
                      <td className="text-right px-4 py-2.5 font-mono font-bold" style={{ color: "#991B1B" }}>{rejectedCount}</td>
                      <td className="text-right px-4 py-2.5 font-mono font-bold" style={{ color: "#991B1B" }}>฿{rejectedAmount.toLocaleString()}</td>
                    </tr>
                    <tr className="border-t bg-muted/30 font-semibold">
                      <td className="px-4 py-2.5">Grand Total</td>
                      <td className="text-right px-4 py-2.5 font-mono">{totalCount}</td>
                      <td className="text-right px-4 py-2.5 font-mono">฿{totalAmount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
               </div>

              {/* Salary Deduction Detail Section */}
              <div className="border-l-4 border-red-500 rounded-md overflow-hidden bg-red-50/50">
                <div className="px-5 py-4">
                  <p className="text-sm font-semibold text-red-900">⚠️ Transactions Requiring Salary Deduction</p>
                  <p className="text-xs text-red-700 mt-1">The following transactions have been rejected and require payroll deduction processing</p>
                </div>

                {/* Employee 1 */}
                <div className="px-5 pb-4 space-y-4">
                  <div className="bg-white rounded-md border border-red-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-red-100 bg-red-50/30">
                      <p className="text-sm font-bold text-foreground">Somchai Jaidee <span className="font-normal text-muted-foreground">[EMP-1042]</span></p>
                      <p className="text-xs text-muted-foreground">IT Department</p>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="text-left px-3 py-2 font-semibold">Date</th>
                          <th className="text-left px-3 py-2 font-semibold">Merchant</th>
                          <th className="text-right px-3 py-2 font-semibold">Amount</th>
                          <th className="text-left px-3 py-2 font-semibold">Rejection Type</th>
                          <th className="text-left px-3 py-2 font-semibold">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="px-3 py-2">15 Jan 2026</td>
                          <td className="px-3 py-2">Lucky Bar & Pub</td>
                          <td className="text-right px-3 py-2 font-mono">฿4,500</td>
                          <td className="px-3 py-2"><span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Auto-Rejected</span></td>
                          <td className="px-3 py-2 text-muted-foreground">Prohibited merchant category (MCC: Entertainment/Bar)</td>
                        </tr>
                        <tr className="border-t">
                          <td className="px-3 py-2">22 Jan 2026</td>
                          <td className="px-3 py-2">Siam Nightclub</td>
                          <td className="text-right px-3 py-2 font-mono">฿8,200</td>
                          <td className="px-3 py-2"><span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Auto-Rejected</span></td>
                          <td className="px-3 py-2 text-muted-foreground">Prohibited merchant category (MCC: Nightclub)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Employee 2 */}
                  <div className="bg-white rounded-md border border-red-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-red-100 bg-red-50/30">
                      <p className="text-sm font-bold text-foreground">Naphat Wongchai <span className="font-normal text-muted-foreground">[EMP-0871]</span></p>
                      <p className="text-xs text-muted-foreground">Operations</p>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="text-left px-3 py-2 font-semibold">Date</th>
                          <th className="text-left px-3 py-2 font-semibold">Merchant</th>
                          <th className="text-right px-3 py-2 font-semibold">Amount</th>
                          <th className="text-left px-3 py-2 font-semibold">Rejection Type</th>
                          <th className="text-left px-3 py-2 font-semibold">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="px-3 py-2">10 Jan 2026</td>
                          <td className="px-3 py-2">Central Department Store</td>
                          <td className="text-right px-3 py-2 font-mono">฿15,000</td>
                          <td className="px-3 py-2"><span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-900 text-white">Final Rejected</span></td>
                          <td className="px-3 py-2 text-muted-foreground">Personal purchase — not business-related (Manager: Krit S.)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Employee 3 */}
                  <div className="bg-white rounded-md border border-red-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-red-100 bg-red-50/30">
                      <p className="text-sm font-bold text-foreground">Lalita Thongdee <span className="font-normal text-muted-foreground">[EMP-1195]</span></p>
                      <p className="text-xs text-muted-foreground">Purchasing</p>
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="text-left px-3 py-2 font-semibold">Date</th>
                          <th className="text-left px-3 py-2 font-semibold">Merchant</th>
                          <th className="text-right px-3 py-2 font-semibold">Amount</th>
                          <th className="text-left px-3 py-2 font-semibold">Rejection Type</th>
                          <th className="text-left px-3 py-2 font-semibold">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="px-3 py-2">28 Jan 2026</td>
                          <td className="px-3 py-2">Lotus's Supermarket</td>
                          <td className="text-right px-3 py-2 font-mono">฿7,800</td>
                          <td className="px-3 py-2"><span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-900 text-white">Final Rejected</span></td>
                          <td className="px-3 py-2 text-muted-foreground">Exceeded policy limit without pre-approval (Manager: Praew N.)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Footer */}
                  <div className="bg-red-100/80 rounded-md px-4 py-3 space-y-1">
                    <p className="text-xs font-bold text-red-900">Total Deduction Required: 4 transactions | ฿35,500</p>
                    <p className="text-xs text-red-800">Please coordinate with Payroll to process deductions by the 15th of this month.</p>
                  </div>
                </div>
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
                  This email is sent automatically on day {sendDay} of each month — please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
