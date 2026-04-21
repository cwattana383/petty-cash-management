import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Clock,
  Info,
  Eye,
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
  { label: "Dedup key", value: "(cardholder_id, sweeper_batch_id, template_key)" },
  { label: "Delivery", value: "One consolidated email per cardholder per sweeper run (batched)" },
  { label: "Grouping", value: "transactions grouped by cardholder_id within sweeper_batch_id" },
];

const SAMPLE_TRANSACTIONS = [
  { txn_date: "15 Apr 2026", merchant: "GRAB TAXI", amount: 450.0, currency: "THB", link: "/claims/abc-123" },
  { txn_date: "16 Apr 2026", merchant: "STARBUCKS ASOKE", amount: 185.0, currency: "THB", link: "/claims/abc-124" },
  { txn_date: "17 Apr 2026", merchant: "7-ELEVEN SUKHUMVIT", amount: 92.5, currency: "THB", link: "/claims/abc-125" },
];

const SAMPLE_TOTAL = SAMPLE_TRANSACTIONS.reduce((sum, t) => sum + t.amount, 0);

const VARIABLE_CHIPS: Array<{ name: string; caption?: string }> = [
  { name: "{cardholder_name}" },
  { name: "{run_date}" },
  { name: "{threshold_days}" },
  {
    name: "{transactions}",
    caption: "List of {txn_date, merchant, amount, currency, link} — rendered as a table in the email.",
  },
  { name: "{link}", caption: "Per-row inside the table." },
];

export default function DocumentAgingNotificationPanel() {
  const [enabled, setEnabled] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const handleSimulate = () => {
    // Mock: 5 transactions across 2 cardholders
    const txnCount = 5;
    const cardholderCount = 2;
    toast({
      title: "Sweeper simulated",
      description: `Simulated ${txnCount} transactions auto-rejected across ${cardholderCount} cardholders → ${cardholderCount} digest emails queued.`,
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
                    <span className="text-muted-foreground shrink-0">{row.label}</span>
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
          Notifications are best-effort. If the notification service is unavailable, the auto-reject status change still commits and a retry is queued. A cardholder with no registered email still receives the in-app notification. If a cardholder has multiple aged transactions in the same run, they receive a single digest email listing all of them — not one email per transaction.
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
                  [Action Required] Corporate card transactions auto-rejected — 21 Apr 2026
                </p>
              </div>

              <div className="px-6 py-5 space-y-4 text-sm">
                <p>Hi Somchai Jaidee,</p>
                <p className="text-muted-foreground leading-relaxed">
                  The following corporate card transactions were auto-rejected tonight because supporting documents were not uploaded within <strong>3</strong> calendar days. Per company policy, these amounts will be deducted from your next payroll.
                </p>

                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Merchant</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Amount</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">Claim</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAMPLE_TRANSACTIONS.map((t, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2 font-mono">{t.txn_date}</td>
                          <td className="px-3 py-2">{t.merchant}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            {t.currency} {t.amount.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="text-primary underline">View</span>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-muted/30">
                        <td colSpan={2} className="px-3 py-2 font-semibold text-right">Total:</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          THB {SAMPLE_TOTAL.toFixed(2)}
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  These transactions cannot be reopened. If you believe this is an error, contact Finance within 5 business days.
                </p>

                <div className="pt-4 border-t mt-4">
                  <p className="text-xs text-muted-foreground">
                    This is an automated email — please do not reply.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t mt-3 space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground">Variables:</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLE_CHIPS.map((v) => (
                <Badge key={v.name} variant="outline" className="font-mono text-[10px]">
                  {v.name}
                </Badge>
              ))}
            </div>
            {VARIABLE_CHIPS.filter((v) => v.caption).map((v) => (
              <p key={v.name} className="text-[10px] text-muted-foreground">
                <span className="font-mono">{v.name}</span> — {v.caption}
              </p>
            ))}
          </div>
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
