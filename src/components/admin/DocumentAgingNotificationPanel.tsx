import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Clock,
  Info,
  Eye,
  AlertOctagon,
  RotateCcw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TIMING_ROWS: Array<{ label: string; value: string }> = [
  { label: "Runs at", value: "23:30 Asia/Bangkok (daily)" },
  { label: "Threshold", value: "3 calendar days from creation_date" },
  { label: "Weekends counted", value: "Yes" },
  { label: "Public holidays", value: "Counted (not excluded in MVP)" },
  { label: "Template key", value: "TXN_AGING_AUTO_REJECTED_PENDING_DOCS" },
  { label: "Rejection reason", value: "AGING_TIMEOUT" },
  { label: "Dedup key", value: "(cardholder_id, txn_id, template_key)" },
];

export default function DocumentAgingNotificationPanel() {
  const [enabled, setEnabled] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const handleSimulate = () => {
    toast({
      title: "Sweeper simulated",
      description: "0 new notifications (deduplicated).",
    });
  };

  const handleReset = () => {
    toast({
      title: "Mock data reset",
      description: "Case 1 and Case 2 reseeded; notification read state cleared.",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold">Document Aging — Auto Reject Email</h2>
        <p className="text-sm text-muted-foreground">
          Notify cardholders when their PENDING_DOCUMENTS transaction is automatically rejected after 3 calendar days.
        </p>
      </div>

      {/* Card 1 — Enable Notifications */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Enable Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Send an email and in-app notification to the cardholder the moment their transaction is auto-rejected by the Aging Sweeper.
                </p>
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Card 2 — Notification Timing */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-3">Notification Timing</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {TIMING_ROWS.map((row) => (
                  <div key={row.label} className="flex justify-between gap-3 text-xs border-b border-border/60 py-1.5">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-mono text-foreground text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-900">
          Notifications are best-effort. If the notification service is unavailable, the auto-reject status change still commits and a retry is queued. A cardholder with no registered email still receives the in-app notification.
        </p>
      </div>

      {/* Email preview */}
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
              <div className="bg-muted/50 px-6 py-4 border-b">
                <p className="text-xs text-muted-foreground">To: Somchai Jaidee &lt;somchai@company.com&gt;</p>
                <p className="text-sm font-medium mt-1">
                  [Action Required] Bank transaction auto-rejected — documents not attached within 3 days
                </p>
              </div>

              <div className="px-6 py-5 space-y-4 text-sm">
                <p>Dear Somchai Jaidee,</p>
                <p className="text-muted-foreground leading-relaxed">
                  Your transaction at <strong>GRAB TAXI</strong> for <strong>฿450.00 THB</strong> on <strong>20/04/2026</strong> was created on <strong>20/04/2026</strong> and required supporting documents.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  No documents were attached within 3 calendar days (including weekends and public holidays), so the system has automatically rejected the transaction.
                </p>

                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                  <AlertOctagon className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-red-900 font-mono">Reason: AGING_TIMEOUT</span>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  If this was an error, please contact Finance to request re-opening, or re-submit the transaction with the required documents.
                </p>

                <div className="pt-2">
                  <span className="inline-block bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md">
                    View Transaction
                  </span>
                </div>

                <div className="pt-4 border-t mt-4">
                  <p className="text-xs text-muted-foreground">
                    This is an automated email — please do not reply.
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground pt-2 border-t mt-3">
            Variables: <span className="font-mono">{"{cardholder_name}"} {"{merchant}"} {"{amount}"} {"{currency}"} {"{txn_date}"} {"{creation_date}"} {"{threshold=3}"} {"{link}"}</span>
          </p>
        </CardContent>
      </Card>

      {/* Demo affordances */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" size="sm" onClick={handleSimulate}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Simulate Aging Sweeper Run
        </Button>
        <button
          onClick={handleReset}
          className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
        >
          Reset Mock Data
        </button>
      </div>
    </div>
  );
}
