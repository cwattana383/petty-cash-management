import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bell, Info, Mail, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  useNotificationSettingByType,
  useUpdateNotificationSetting,
} from "@/hooks/use-email-settings";

const mockPendingApprovals: Array<{ claim_id: string; requester_name: string; submission_date: string; amount: string; description: string }> = [];

export default function PendingApprovalNotificationPanel() {
  const [showPreview, setShowPreview] = useState(false);
  const { data: setting, isLoading } = useNotificationSettingByType("PENDING_APPROVAL");
  const updateSetting = useUpdateNotificationSetting();

  const handleToggle = (field: "notificationsEnabled" | "remindersEnabled", value: boolean) => {
    updateSetting.mutate(
      { type: "PENDING_APPROVAL", [field]: value },
      {
        onSuccess: () => toast({ title: "Success", description: "Setting updated" }),
        onError: () => toast({ title: "Error", description: "Failed to update setting", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold">Pending Approval — Email & Reminder Setup</h2>
        <p className="text-sm text-muted-foreground">
          Configure consolidated email notifications for approvers with pending expense claims.
        </p>
      </div>

      {/* Toggle 1: Enable Notifications */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Enable Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Send a consolidated email to each approver listing all expense claims awaiting their approval
                </p>
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-5 w-10 rounded-full" />
            ) : (
              <Switch
                checked={setting?.notificationsEnabled ?? false}
                onCheckedChange={(v) => handleToggle("notificationsEnabled", v)}
                disabled={updateSetting.isPending}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Toggle 2: Enable Reminders */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Enable Reminders</p>
                <p className="text-xs text-muted-foreground">
                  Send a periodic reminder if claims remain in PENDING_APPROVAL status
                </p>
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-5 w-10 rounded-full" />
            ) : (
              <Switch
                checked={setting?.remindersEnabled ?? false}
                onCheckedChange={(v) => handleToggle("remindersEnabled", v)}
                disabled={updateSetting.isPending}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/50 p-4">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Emails are sent {setting?.initialDelayMinutes ?? 30} minutes after a claim is submitted. Reminders repeat every {setting?.reminderIntervalDays ?? 2} days until all claims are actioned.
        </p>
      </div>

      {/* Email Preview */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors"
          >
            <Eye className="h-4 w-4 text-muted-foreground" />
            {showPreview ? "Hide Email Preview" : "Show Email Preview"}
          </button>

          {showPreview && (
            <div className="border rounded-lg overflow-hidden bg-white mt-3">
              {/* Email header */}
              <div className="bg-muted/50 px-6 py-4 border-b">
                <p className="text-xs text-muted-foreground">To: Somying Kaewsai</p>
                <p className="text-sm font-medium mt-1">
                  Action Required: 4 Expense Claim(s) Awaiting Your Approval
                </p>
              </div>

              {/* Email body */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm">Dear Somying Kaewsai,</p>
                <p className="text-sm text-muted-foreground">
                  You have <strong>4</strong> expense claim(s) waiting for your review. The oldest submission is dated <strong>2026-02-25</strong>.
                </p>

                {/* Claims table */}
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold">Claim No.</TableHead>
                        <TableHead className="text-xs font-semibold">Requester</TableHead>
                        <TableHead className="text-xs font-semibold">Submitted Date</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                        <TableHead className="text-xs font-semibold">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockPendingApprovals.map((claim) => (
                        <TableRow key={claim.claim_id}>
                          <TableCell className="text-xs font-mono">{claim.claim_id}</TableCell>
                          <TableCell className="text-xs">{claim.requester_name}</TableCell>
                          <TableCell className="text-xs">{claim.submission_date}</TableCell>
                          <TableCell className="text-xs text-right">฿{claim.amount}</TableCell>
                          <TableCell className="text-xs">{claim.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* CTA Button */}
                <div className="pt-2">
                  <span className="inline-block bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md">
                    Review Claims Now
                  </span>
                </div>

                <p className="text-sm text-muted-foreground">Thank you,</p>
                <p className="text-sm font-medium">Finance Team</p>

                <div className="pt-4 border-t mt-4">
                  <p className="text-xs text-muted-foreground">
                    This is an automated email — please do not reply.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
