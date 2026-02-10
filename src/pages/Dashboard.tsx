import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, XCircle, DollarSign, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const stats = [
  { label: "Total Claims", value: "128", icon: FileText, change: "+12%" },
  { label: "Pending Approval", value: "23", icon: Clock, change: "-5%" },
  { label: "Approved", value: "89", icon: CheckCircle, change: "+8%" },
  { label: "Rejected", value: "7", icon: XCircle, change: "-2%" },
  { label: "Total Amount", value: "฿1,245,000", icon: DollarSign, change: "+15%" },
  { label: "This Month", value: "฿320,000", icon: TrendingUp, change: "+22%" },
];

const monthlyData = [
  { month: "Jan", amount: 180000 },
  { month: "Feb", amount: 220000 },
  { month: "Mar", amount: 195000 },
  { month: "Apr", amount: 280000 },
  { month: "May", amount: 250000 },
  { month: "Jun", amount: 320000 },
];

const categoryData = [
  { name: "Travel", value: 35 },
  { name: "Meals", value: 25 },
  { name: "Office Supplies", value: 20 },
  { name: "Transportation", value: 15 },
  { name: "Other", value: 5 },
];

const COLORS = ["hsl(0,72%,51%)", "hsl(220,70%,55%)", "hsl(140,60%,45%)", "hsl(40,90%,55%)", "hsl(280,60%,55%)"];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of expense claims</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
              </div>
              <span className="text-xs text-emerald-600 font-medium">{stat.change}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => [`฿${v.toLocaleString()}`, "Amount"]} />
                <Bar dataKey="amount" fill="hsl(0,72%,51%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
