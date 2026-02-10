import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

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
