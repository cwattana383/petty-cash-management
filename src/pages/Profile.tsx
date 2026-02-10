import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { currentUser } from "@/lib/mock-data";

const roleColors: Record<string, string> = {
  Employee: "bg-blue-100 text-blue-800",
  Manager: "bg-purple-100 text-purple-800",
  Accounting: "bg-green-100 text-green-800",
  Admin: "bg-red-100 text-red-800",
};

export default function Profile() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

      <Card>
        <CardContent className="p-6 flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{currentUser.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{currentUser.name}</h2>
            <p className="text-muted-foreground">{currentUser.position}</p>
            <Badge className={`mt-1 ${roleColors[currentUser.role]}`}>{currentUser.role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Employee Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Employee Code</Label><Input value={currentUser.employeeCode} disabled /></div>
          <div><Label>Email</Label><Input value={currentUser.email} disabled /></div>
          <div><Label>Branch</Label><Input value={currentUser.branch} disabled /></div>
          <div><Label>Department</Label><Input value={currentUser.department} disabled /></div>
          <div><Label>Cost Center</Label><Input value={currentUser.costCenter} disabled /></div>
          <div><Label>Line Manager</Label><Input value={currentUser.managerName || "-"} disabled /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Notification Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Email on claim submission", desc: "Receive email when your claim is submitted" },
            { label: "Email on approval/rejection", desc: "Receive email when your claim is approved or rejected" },
            { label: "Email on pending reminders", desc: "Receive reminder for pending approvals" },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between">
              <div><p className="text-sm font-medium">{n.label}</p><p className="text-xs text-muted-foreground">{n.desc}</p></div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4 max-w-sm">
          <div><Label>Current Password</Label><Input type="password" /></div>
          <div><Label>New Password</Label><Input type="password" /></div>
          <div><Label>Confirm New Password</Label><Input type="password" /></div>
          <Button>Update Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}
