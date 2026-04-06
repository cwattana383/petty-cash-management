import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";

const roleColors: Record<string, string> = {
  Cardholder: "bg-blue-100 text-blue-800",
  Approver: "bg-purple-100 text-purple-800",
  Admin: "bg-red-100 text-red-800",
};

type NotifKey = "notifyOnSubmission" | "notifyOnDecision" | "notifyOnReminder";

const NOTIF_SETTINGS: { key: NotifKey; label: string; desc: string }[] = [
  { key: "notifyOnSubmission", label: "Email on claim submission", desc: "Receive email when your claim is submitted" },
  { key: "notifyOnDecision", label: "Email on approval/rejection", desc: "Receive email when your claim is approved or rejected" },
  { key: "notifyOnReminder", label: "Email on pending reminders", desc: "Receive reminder for pending approvals" },
];

export default function Profile() {
  const { user, loading } = useAuth();

  const [prefs, setPrefs] = useState<Record<NotifKey, boolean> | null>(null);

  // Initialise prefs from user once loaded
  if (user && prefs === null) {
    setPrefs({
      notifyOnSubmission: user.notifyOnSubmission,
      notifyOnDecision: user.notifyOnDecision,
      notifyOnReminder: user.notifyOnReminder,
    });
  }

  async function handleToggle(key: NotifKey, value: boolean) {
    setPrefs((prev) => prev ? { ...prev, [key]: value } : prev);
    try {
      await apiClient.patch("/auth/me/notifications", { [key]: value });
    } catch {
      // Revert on failure
      setPrefs((prev) => prev ? { ...prev, [key]: !value } : prev);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

      <Card>
        <CardContent className="p-6 flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-muted-foreground">{user.position}</p>
            <div className="flex gap-1 mt-1">
              {user.roles.map((r) => (
                <Badge key={r} className={roleColors[r] ?? "bg-gray-100 text-gray-800"}>
                  {r}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employee Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Employee Code</Label><Input value={user.employeeCode} disabled /></div>
          <div><Label>Email</Label><Input value={user.email} disabled /></div>
          <div><Label>Branch</Label><Input value={user.branch} disabled /></div>
          <div><Label>Department</Label><Input value={user.department} disabled /></div>
          {user.telephone && (
            <div><Label>Telephone</Label><Input value={user.telephone} disabled /></div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {NOTIF_SETTINGS.map((n) => (
            <div key={n.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch
                checked={prefs?.[n.key] ?? true}
                onCheckedChange={(value) => handleToggle(n.key, value)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
