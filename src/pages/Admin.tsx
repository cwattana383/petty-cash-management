import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Users,
  Shield,
  CircleDollarSign,
  GitBranch,
  Gauge,
  Bell,
  Mail,
  AlertCircle,
  Plug,
  Clock,
  CalendarClock,
  Building2,
  Layers,
  DollarSign,
  MapPin,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- Sidebar menu definition ---
const adminMenu = [
  {
    group: "Organization Data",
    icon: Building2,
    items: [
      { key: "entities", label: "Entities", icon: Building2 },
      { key: "departments", label: "Departments", icon: Layers },
      { key: "org-costcenters", label: "Cost Centers", icon: DollarSign },
      { key: "branches", label: "Branches", icon: MapPin },
    ],
  },
  {
    group: "User Setup",
    icon: Users,
    items: [
      { key: "employees", label: "Employee Profiles", icon: Users },
      { key: "roles", label: "Roles & Permissions", icon: Shield },
      { key: "costcenters", label: "Cost Center Assignments", icon: CircleDollarSign },
    ],
  },
  {
    group: "Approval Workflow Setup",
    icon: GitBranch,
    items: [
      { key: "approval-levels", label: "Approval Levels", icon: GitBranch },
      { key: "approval-limits", label: "Approval Limits", icon: Gauge },
    ],
  },
  {
    group: "Notification Setup",
    icon: Bell,
    items: [
      { key: "email-notifications", label: "Email Notifications", icon: Mail },
      { key: "system-alerts", label: "System Alerts", icon: AlertCircle },
    ],
  },
  {
    group: "Interface Schedule",
    icon: Plug,
    items: [
      { key: "erp-sync", label: "ERP Sync Schedule", icon: CalendarClock },
      { key: "sync-logs", label: "Sync Logs", icon: Clock },
    ],
  },
];

// --- Mock data ---
const mockEmployees = [
  { name: "สมชาย ใจดี", code: "EMP001", dept: "Sales", role: "Employee", branch: "Bangkok", costCenter: "CC-100" },
  { name: "สมหญิง แก้วใส", code: "EMP002", dept: "Marketing", role: "Manager", branch: "Bangkok", costCenter: "CC-200" },
  { name: "วิชัย เจริญ", code: "EMP003", dept: "Engineering", role: "Employee", branch: "Chiang Mai", costCenter: "CC-300" },
  { name: "พิมพ์ ดี", code: "ACC001", dept: "Finance", role: "Accounting", branch: "Bangkok", costCenter: "CC-400" },
];

const roleColors: Record<string, string> = {
  Employee: "bg-blue-100 text-blue-800",
  Manager: "bg-purple-100 text-purple-800",
  Accounting: "bg-green-100 text-green-800",
  Admin: "bg-red-100 text-red-800",
};

const mockRoles = [
  { role: "Employee", permissions: ["Submit Claims", "View Own Claims"], users: 120 },
  { role: "Manager", permissions: ["Approve Claims", "View Team Claims", "Submit Claims"], users: 15 },
  { role: "Accounting", permissions: ["Review Claims", "Export Reports", "Reconcile"], users: 5 },
  { role: "Admin", permissions: ["Full Access"], users: 2 },
];

const mockCostCenters = [
  { code: "CC-100", name: "Sales Operations", dept: "Sales", assignedCount: 30 },
  { code: "CC-200", name: "Marketing Campaigns", dept: "Marketing", assignedCount: 12 },
  { code: "CC-300", name: "R&D", dept: "Engineering", assignedCount: 25 },
  { code: "CC-400", name: "Corporate Finance", dept: "Finance", assignedCount: 8 },
];

const mockApprovalLevels = [
  { level: 1, name: "Direct Manager", condition: "All claims", approver: "Line Manager" },
  { level: 2, name: "Department Head", condition: "Amount > 10,000 THB", approver: "Dept Head" },
  { level: 3, name: "VP Approval", condition: "Amount > 50,000 THB", approver: "VP" },
  { level: 4, name: "CFO Approval", condition: "Amount > 200,000 THB", approver: "CFO" },
];

const mockApprovalLimits = [
  { role: "Manager", minAmount: 0, maxAmount: 10000, currency: "THB" },
  { role: "Dept Head", minAmount: 10001, maxAmount: 50000, currency: "THB" },
  { role: "VP", minAmount: 50001, maxAmount: 200000, currency: "THB" },
  { role: "CFO", minAmount: 200001, maxAmount: 999999, currency: "THB" },
];

const mockNotifications = [
  { key: "claim_submitted", label: "Claim Submitted", desc: "Notify when a new claim is submitted", email: true, system: true },
  { key: "claim_approved", label: "Claim Approved", desc: "Notify when a claim is approved", email: true, system: true },
  { key: "claim_rejected", label: "Claim Rejected", desc: "Notify when a claim is rejected", email: true, system: false },
  { key: "need_info", label: "More Info Requested", desc: "Notify when more information is needed", email: true, system: true },
  { key: "reminder", label: "Pending Reminder", desc: "Remind approvers about pending claims", email: false, system: true },
];

const mockSyncSchedules = [
  { name: "Daily Sync", cron: "0 2 * * *", target: "SAP ERP", lastRun: "2026-02-10 02:00", status: "Success" },
  { name: "Hourly Claims Push", cron: "0 * * * *", target: "Oracle ERP", lastRun: "2026-02-10 14:00", status: "Success" },
  { name: "Weekly Reconciliation", cron: "0 3 * * 0", target: "SAP ERP", lastRun: "2026-02-09 03:00", status: "Failed" },
];

const mockSyncLogs = [
  { time: "2026-02-10 14:00:03", job: "Hourly Claims Push", records: 12, status: "Success", duration: "3.2s" },
  { time: "2026-02-10 02:00:15", job: "Daily Sync", records: 45, status: "Success", duration: "12.1s" },
  { time: "2026-02-09 03:00:08", job: "Weekly Reconciliation", records: 0, status: "Failed", duration: "0.8s" },
  { time: "2026-02-09 14:00:02", job: "Hourly Claims Push", records: 8, status: "Success", duration: "2.5s" },
];

// --- Mock data for Organization Data ---
const mockEntities = [
  { code: "CORP-01", name: "บริษัท ABC จำกัด (มหาชน)", type: "Parent Company", status: "Active" },
  { code: "CORP-02", name: "บริษัท ABC Trading จำกัด", type: "Subsidiary", status: "Active" },
  { code: "CORP-03", name: "บริษัท ABC Logistics จำกัด", type: "Subsidiary", status: "Active" },
];

const mockDepartments = [
  { code: "DEPT-IT", name: "Information Technology", head: "สมศักดิ์ วิชาญ", employees: 25 },
  { code: "DEPT-MK", name: "Marketing", head: "สมหญิง แก้วใส", employees: 12 },
  { code: "DEPT-HR", name: "Human Resources", head: "วิภา สุขใจ", employees: 8 },
  { code: "DEPT-FN", name: "Finance", head: "พิมพ์ ดี", employees: 10 },
  { code: "DEPT-SL", name: "Sales", head: "สมชาย ใจดี", employees: 30 },
];

const mockOrgCostCenters = [
  { code: "CC-100", name: "Sales Operations", entity: "CORP-01", department: "Sales", glAccount: "5100-001" },
  { code: "CC-200", name: "Marketing Campaigns", entity: "CORP-01", department: "Marketing", glAccount: "5200-001" },
  { code: "CC-300", name: "R&D", entity: "CORP-01", department: "Engineering", glAccount: "5300-001" },
  { code: "CC-400", name: "Corporate Finance", entity: "CORP-01", department: "Finance", glAccount: "5400-001" },
  { code: "CC-500", name: "Trading Ops", entity: "CORP-02", department: "Operations", glAccount: "5500-001" },
];

const mockBranches = [
  { code: "BRN-BKK", name: "Bangkok (Head Office)", region: "Central", address: "123 Sukhumvit Rd.", status: "Active" },
  { code: "BRN-CNX", name: "Chiang Mai", region: "North", address: "456 Nimman Rd.", status: "Active" },
  { code: "BRN-PKT", name: "Phuket", region: "South", address: "789 Patong Rd.", status: "Active" },
  { code: "BRN-KKN", name: "Khon Kaen", region: "Northeast", address: "321 Mittraphap Rd.", status: "Inactive" },
];

// --- Organization Data panels ---
function EntitiesPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Entities</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Entity</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEntities.map((e) => (
                <TableRow key={e.code} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{e.code}</TableCell>
                  <TableCell>{e.name}</TableCell>
                  <TableCell><Badge variant="outline">{e.type}</Badge></TableCell>
                  <TableCell>
                    <Badge className={e.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                      {e.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function DepartmentsPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Departments</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Department</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead>Department Head</TableHead>
                <TableHead>Employees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDepartments.map((d) => (
                <TableRow key={d.code} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{d.code}</TableCell>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>{d.head}</TableCell>
                  <TableCell><Badge variant="secondary">{d.employees}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function OrgCostCentersPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cost Centers</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Cost Center</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>GL Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrgCostCenters.map((c) => (
                <TableRow key={c.code} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{c.code}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell><Badge variant="outline">{c.entity}</Badge></TableCell>
                  <TableCell>{c.department}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.glAccount}</code></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function BranchesPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Branches</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Branch</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Branch Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBranches.map((b) => (
                <TableRow key={b.code} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{b.code}</TableCell>
                  <TableCell>{b.name}</TableCell>
                  <TableCell>{b.region}</TableCell>
                  <TableCell className="text-sm">{b.address}</TableCell>
                  <TableCell>
                    <Badge className={b.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                      {b.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Content panels ---
function EmployeesPanel() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Employee Profiles</h2>
        <Button size="sm" onClick={() => navigate("/admin/employee/create")}><Plus className="h-4 w-4 mr-2" />Add Employee</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Cost Center</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEmployees.map((u) => (
                <TableRow key={u.code} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.code}</TableCell>
                  <TableCell>{u.dept}</TableCell>
                  <TableCell>{u.branch}</TableCell>
                  <TableCell><Badge variant="outline">{u.costCenter}</Badge></TableCell>
                  <TableCell><Badge className={roleColors[u.role]}>{u.role}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function RolesPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Roles & Permissions</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Role</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockRoles.map((r) => (
          <Card key={r.role} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{r.role}</CardTitle>
                <Badge variant="secondary">{r.users} users</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {r.permissions.map((p) => (
                  <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CostCentersPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cost Center Assignments</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Cost Center</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Assigned Employees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCostCenters.map((cc) => (
                <TableRow key={cc.code} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{cc.code}</TableCell>
                  <TableCell>{cc.name}</TableCell>
                  <TableCell>{cc.dept}</TableCell>
                  <TableCell><Badge variant="secondary">{cc.assignedCount}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ApprovalLevelsPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Approval Levels</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Level</Button>
      </div>
      <div className="space-y-3">
        {mockApprovalLevels.map((lvl, i) => (
          <Card key={lvl.level} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                {lvl.level}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{lvl.name}</p>
                <p className="text-sm text-muted-foreground">{lvl.condition}</p>
              </div>
              <Badge variant="outline">{lvl.approver}</Badge>
              {i < mockApprovalLevels.length - 1 && (
                <div className="hidden md:block text-muted-foreground">→</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ApprovalLimitsPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Approval Limits</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Limit</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Approver Role</TableHead>
                <TableHead>Min Amount</TableHead>
                <TableHead>Max Amount</TableHead>
                <TableHead>Currency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockApprovalLimits.map((l) => (
                <TableRow key={l.role}>
                  <TableCell className="font-medium">{l.role}</TableCell>
                  <TableCell>{l.minAmount.toLocaleString()}</TableCell>
                  <TableCell>{l.maxAmount.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{l.currency}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function EmailNotificationsPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Email Notifications</h2>
      <Card>
        <CardContent className="p-4 space-y-4">
          {mockNotifications.map((n) => (
            <div key={n.key} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch defaultChecked={n.email} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SystemAlertsPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">System Alerts</h2>
      <Card>
        <CardContent className="p-4 space-y-4">
          {mockNotifications.map((n) => (
            <div key={n.key} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch defaultChecked={n.system} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ErpSyncPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">ERP Sync Schedule</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Schedule</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>Cron Expression</TableHead>
                <TableHead>Target System</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSyncSchedules.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{s.cron}</code></TableCell>
                  <TableCell>{s.target}</TableCell>
                  <TableCell className="text-sm">{s.lastRun}</TableCell>
                  <TableCell>
                    <Badge className={s.status === "Success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {s.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SyncLogsPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Sync Logs</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSyncLogs.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{l.time}</TableCell>
                  <TableCell className="font-medium">{l.job}</TableCell>
                  <TableCell>{l.records}</TableCell>
                  <TableCell>{l.duration}</TableCell>
                  <TableCell>
                    <Badge className={l.status === "Success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {l.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const panelMap: Record<string, () => JSX.Element> = {
  entities: EntitiesPanel,
  departments: DepartmentsPanel,
  "org-costcenters": OrgCostCentersPanel,
  branches: BranchesPanel,
  employees: EmployeesPanel,
  roles: RolesPanel,
  costcenters: CostCentersPanel,
  "approval-levels": ApprovalLevelsPanel,
  "approval-limits": ApprovalLimitsPanel,
  "email-notifications": EmailNotificationsPanel,
  "system-alerts": SystemAlertsPanel,
  "erp-sync": ErpSyncPanel,
  "sync-logs": SyncLogsPanel,
};

export default function Admin() {
  const [activeKey, setActiveKey] = useState("employees");
  const ActivePanel = panelMap[activeKey];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground text-sm">Manage users, workflows, notifications, and integrations</p>
      </div>

      <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
        {/* Sidebar */}
        <nav className="w-64 shrink-0 space-y-5">
          {adminMenu.map((group) => (
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
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <ActivePanel />
        </div>
      </div>
    </div>
  );
}
