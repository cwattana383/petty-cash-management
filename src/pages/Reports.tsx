import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, CalendarDays } from "lucide-react";

const monthEndRows = [
  { status: "Auto-Approved", count: 42, amount: 185000, color: "#16a34a" },
  { status: "Manager-Approved", count: 18, amount: 94500, color: "#2563eb" },
  { status: "Auto-Rejected", count: 5, amount: 23000, color: "#dc2626" },
  { status: "Manager-Rejected", count: 3, amount: 15000, color: "#ea580c" },
  { status: "Pending (Salary Deduction)", count: 2, amount: 8200, color: "#d97706" },
];

const grandTotalCount = monthEndRows.reduce((s, r) => s + r.count, 0);
const grandTotalAmount = monthEndRows.reduce((s, r) => s + r.amount, 0);

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Analytics and reporting</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Monthly Reports Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Monthly Reports</h2>

        {/* Schedule Banner */}
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

        {/* Month-End Deduction Summary */}
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
    </div>
  );
}
