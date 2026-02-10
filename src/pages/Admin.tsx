import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Users, Building2, GitBranch, Mail, Plug } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockUsers = [
  { name: "สมชาย ใจดี", code: "EMP001", dept: "Sales", role: "Employee", branch: "Bangkok" },
  { name: "สมหญิง แก้วใส", code: "EMP002", dept: "Marketing", role: "Manager", branch: "Bangkok" },
  { name: "วิชัย เจริญ", code: "EMP003", dept: "Engineering", role: "Employee", branch: "Chiang Mai" },
  { name: "พิมพ์ ดี", code: "ACC001", dept: "Finance", role: "Accounting", branch: "Bangkok" },
];

const roleColors: Record<string, string> = {
  Employee: "bg-blue-100 text-blue-800",
  Manager: "bg-purple-100 text-purple-800",
  Accounting: "bg-green-100 text-green-800",
  Admin: "bg-red-100 text-red-800",
};

export default function Admin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground">Manage roles, organization, workflows, and integrations</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="flex-wrap">
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Users & Roles</TabsTrigger>
          <TabsTrigger value="org"><Building2 className="h-4 w-4 mr-1" />Organization</TabsTrigger>
          <TabsTrigger value="workflow"><GitBranch className="h-4 w-4 mr-1" />Workflow</TabsTrigger>
          <TabsTrigger value="notifications"><Mail className="h-4 w-4 mr-1" />Notifications</TabsTrigger>
          <TabsTrigger value="integration"><Plug className="h-4 w-4 mr-1" />Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button><Plus className="h-4 w-4 mr-2" />Add User</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Employee Code</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((u) => (
                    <TableRow key={u.code}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.code}</TableCell>
                      <TableCell>{u.dept}</TableCell>
                      <TableCell>{u.branch}</TableCell>
                      <TableCell><Badge className={roleColors[u.role]}>{u.role}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="org" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Companies", count: 1 },
              { title: "Branches", count: 3 },
              { title: "Departments", count: 8 },
              { title: "Cost Centers", count: 12 },
            ].map((item) => (
              <Card key={item.title} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{item.count}</p>
                  <p className="text-sm text-muted-foreground">{item.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Approval Workflow Rules</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Configure approval chains based on amount thresholds, expense types, and departments.</p>
              <Button className="mt-4"><Plus className="h-4 w-4 mr-2" />Add Rule</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Email Notification Templates</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Configure email templates for claim submission, approval, rejection, and reminders.</p>
              <Button className="mt-4"><Plus className="h-4 w-4 mr-2" />Add Template</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">ERP Integration</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Configure ERP endpoint, authentication, and field mapping for approved claims.</p>
              <Button className="mt-4"><Plug className="h-4 w-4 mr-2" />Configure</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
