import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, CalendarDays, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const deptData = [
  { dept: "Sales", amount: 450000 },
  { dept: "Marketing", amount: 320000 },
  { dept: "Engineering", amount: 280000 },
  { dept: "HR", amount: 120000 },
  { dept: "Finance", amount: 95000 },
];

const agingData = [
  { days: "0-3", count: 8 },
  { days: "4-7", count: 5 },
  { days: "8-14", count: 3 },
  { days: "15-30", count: 2 },
  { days: "30+", count: 1 },
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

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Analytics and reporting</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
      </div>

      {/* Month-End Schedule Banner */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="rounded-full bg-blue-100 p-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-sm text-blue-800 font-medium">
            📅 Monthly Report — System auto-sends reports to HR and Finance on the 9th of each month
          </p>
        </CardContent>
      </Card>

      {/* Month-End Deduction Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Month-End Summary Report — February 2026</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-right px-6 py-3 font-semibold">Count</th>
                <th className="text-right px-6 py-3 font-semibold">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {monthEndRows.map((row) => (
                <tr key={row.status} className="border-b last:border-b-0">
                  <td className="px-6 py-3">
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                      {row.status}
                    </span>
                  </td>
                  <td className="text-right px-6 py-3 font-mono">{row.count} items</td>
                  <td className="text-right px-6 py-3 font-mono">฿{row.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/30 font-semibold">
                <td className="px-6 py-3">Grand Total</td>
                <td className="text-right px-6 py-3 font-mono">{grandTotalCount} items</td>
                <td className="text-right px-6 py-3 font-mono">฿{grandTotalAmount.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Expense by Department</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis type="number" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <YAxis type="category" dataKey="dept" fontSize={12} width={80} />
                <Tooltip formatter={(v: number) => [`฿${v.toLocaleString()}`, "Amount"]} />
                <Bar dataKey="amount" fill="hsl(0,72%,51%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pending Approval Aging</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={agingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="days" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(40,90%,55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Expense by Department", desc: "Breakdown by dept/branch/cost center" },
          { title: "Pending Approval Aging", desc: "Claims waiting by duration" },
          { title: "Rejected Reasons", desc: "Analysis of rejection reasons" },
          { title: "Reconciliation Summary", desc: "Card reconciliation status" },
        ].map((r) => (
          <Card key={r.title} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm">{r.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}