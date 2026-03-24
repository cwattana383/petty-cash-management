import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Clock,
  Bell,
  FileText,
  Eye,
  Send,
  Plus,
  Trash2,
  Info,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- Types ---
interface CategoryOverride {
  id: string;
  category: string;
  slaDays: number;
  reminderIntervalDays: number;
}

interface NotificationSettings {
  enabled: boolean;
  firstSendDelay: "immediate" | "custom";
  firstSendDelayMinutes: number;
  remindersEnabled: boolean;
  reminderIntervalDays: number;
  maxReminders: number;
  slaDays: number;
  categoryOverridesEnabled: boolean;
  categoryOverrides: CategoryOverride[];
  templateSubject: string;
  templateBody: string;
}

// --- Template Variables ---
const templateVariables = [
  { key: "{{approver_name}}", label: "Approver Name", mock: "Somying Kaewsai" },
  { key: "{{pending_count}}", label: "Pending Approval Count", mock: "4" },
  { key: "{{oldest_submission_date}}", label: "Oldest Submission Date", mock: "2026-02-20" },
  { key: "{{approval_inbox_link}}", label: "Approval Inbox Link", mock: "https://app.example.com/approvals?status=PENDING" },
];

// Mock pending approvals for preview
const mockPendingApprovals = [
  {
    claim_id: "CLM-20260228-0012",
    requester_name: "Somchai Jaidee",
    submission_date: "2026-02-28",
    amount: "12,500.00",
    currency: "THB",
    category: "Travel",
    description: "Business trip to Chiang Mai",
  },
  {
    claim_id: "CLM-20260227-0008",
    requester_name: "Wipa Sukjai",
    submission_date: "2026-02-27",
    amount: "3,200.00",
    currency: "THB",
    category: "Meals & Entertainment",
    description: "Client dinner meeting",
  },
  {
    claim_id: "CLM-20260226-0015",
    requester_name: "พิมพ์ ดี",
    submission_date: "2026-02-26",
    amount: "850.00",
    currency: "THB",
    category: "Transportation",
    description: "Grab rides Feb week 4",
  },
  {
    claim_id: "CLM-20260225-0003",
    requester_name: "สมศักดิ์ วิชาญ",
    submission_date: "2026-02-25",
    amount: "45,000.00",
    currency: "THB",
    category: "Hotel & Accommodation",
    description: "Conference hotel booking",
  },
];

const expenseCategories = [
  "Meals & Entertainment",
  "Travel",
  "Office Supplies",
  "Transportation",
  "Training",
  "Communication",
  "Hotel & Accommodation",
  "Fuel",
  "Other",
];

// --- Default settings ---
const defaultSettings: NotificationSettings = {
  enabled: true,
  firstSendDelay: "custom",
  firstSendDelayMinutes: 30,
  remindersEnabled: true,
  reminderIntervalDays: 2,
  maxReminders: 3,
  slaDays: 5,
  categoryOverridesEnabled: false,
  categoryOverrides: [
    { id: "1", category: "Travel", slaDays: 3, reminderIntervalDays: 1 },
  ],
  templateSubject: "Action Required: {{pending_count}} Expense Claims Awaiting Your Approval",
  templateBody: `Dear {{approver_name}},

You have **{{pending_count}}** expense claim(s) awaiting your approval.

The oldest submission is dated **{{oldest_submission_date}}**. Please review and take action on these claims at your earliest convenience.

The details of the pending claims are listed below.

Thank you,
Finance Team`,
};

function renderPreview(template: string): string {
  let result = template;
  templateVariables.forEach((v) => {
    result = result.split(v.key).join(v.mock);
  });
  return result;
}

export default function PendingApprovalNotificationPanel() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const update = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const addCategoryOverride = () => {
    const usedCategories = settings.categoryOverrides.map((o) => o.category);
    const available = expenseCategories.filter((c) => !usedCategories.includes(c));
    if (available.length === 0) return;
    update("categoryOverrides", [
      ...settings.categoryOverrides,
      {
        id: Date.now().toString(),
        category: available[0],
        slaDays: settings.slaDays,
        reminderIntervalDays: settings.reminderIntervalDays,
      },
    ]);
  };

  const removeCategoryOverride = (id: string) => {
    update(
      "categoryOverrides",
      settings.categoryOverrides.filter((o) => o.id !== id)
    );
  };

  const updateOverride = (id: string, field: keyof CategoryOverride, value: string | number) => {
    update(
      "categoryOverrides",
      settings.categoryOverrides.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "Settings Saved", description: "Pending approval notification settings have been saved successfully." });
    }, 800);
  };

  const handleSendTest = () => {
    if (!testEmail) {
      toast({ title: "Error", description: "Please enter an email address.", variant: "destructive" });
      return;
    }
    toast({ title: "Test Email Sent", description: `Preview email sent to ${testEmail} (mock).` });
  };

  const insertVariable = (varKey: string) => {
    update("templateBody", settings.templateBody + varKey);
  };

  const previewSubject = renderPreview(settings.templateSubject);
  const previewBody = renderPreview(settings.templateBody);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pending Approval — Email & Reminder Setup</h2>
          <p className="text-sm text-muted-foreground">
            Configure consolidated email notifications for approvers with pending expense claims.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSettings(defaultSettings)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Section 1: Enable */}
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
                  Send one consolidated email per approver listing all pending expense claims
                </p>
              </div>
            </div>
            <Switch checked={settings.enabled} onCheckedChange={(v) => update("enabled", v)} />
          </div>
        </CardContent>
      </Card>

      {settings.enabled && (
        <>
          {/* Section 2: Trigger - hidden */}


          {/* Section 3: First Email Timing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                First Email Timing
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center gap-4">
                <Select
                  value={settings.firstSendDelay}
                  onValueChange={(v) => update("firstSendDelay", v as "immediate" | "custom")}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Send Immediately</SelectItem>
                    <SelectItem value="custom">Send After Delay</SelectItem>
                  </SelectContent>
                </Select>
                {settings.firstSendDelay === "custom" && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={settings.firstSendDelayMinutes}
                      onChange={(e) => update("firstSendDelayMinutes", Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20"
                      min={1}
                    />
                    <span className="text-sm text-muted-foreground">minutes after submission</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {settings.firstSendDelay === "immediate"
                  ? "Email will be sent immediately after claims are submitted."
                  : `Email will be sent ${settings.firstSendDelayMinutes} minute(s) after claims are submitted.`}
              </p>
            </CardContent>
          </Card>

          {/* Section 4: Reminder Policy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Reminder Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enable Reminders</p>
                  <p className="text-xs text-muted-foreground">
                    Send periodic consolidated reminders for claims still in PENDING_APPROVAL
                  </p>
                </div>
                <Switch
                  checked={settings.remindersEnabled}
                  onCheckedChange={(v) => update("remindersEnabled", v)}
                />
              </div>
              {settings.remindersEnabled && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Reminder Frequency</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Every</span>
                        <Input
                          type="number"
                          value={settings.reminderIntervalDays}
                          onChange={(e) => update("reminderIntervalDays", Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20"
                          min={1}
                        />
                        <span className="text-sm text-muted-foreground">day(s)</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Maximum Reminders</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={settings.maxReminders}
                          onChange={(e) => update("maxReminders", Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-20"
                          min={0}
                        />
                        <span className="text-sm text-muted-foreground">times (0 = unlimited)</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                    <p>
                      <strong>Auto-stop:</strong> Reminders stop automatically when the claim status changes to:
                      <span className="inline-flex flex-wrap gap-1 mt-1 ml-1">
                        {["APPROVED", "REJECTED", "RETURNED", "CANCELLED", "REIMBURSED"].map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">{s}</Badge>
                        ))}
                      </span>
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Section 5: SLA - hidden */}


          {/* Section 6: Template Editor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Template
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* Variables picker */}
              <div>
                <Label className="text-xs mb-2 block">Insert Variable</Label>
                <div className="flex flex-wrap gap-1.5">
                  {templateVariables.map((v) => (
                    <Button
                      key={v.key}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2 font-mono"
                      onClick={() => insertVariable(v.key)}
                      title={`Insert ${v.label} — mock: ${v.mock}`}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {v.key}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Subject */}
              <div className="space-y-2">
                <Label className="text-xs">Subject</Label>
                <Input
                  value={settings.templateSubject}
                  onChange={(e) => update("templateSubject", e.target.value)}
                  placeholder="Email subject line..."
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label className="text-xs">Body (Markdown supported)</Label>
                <Textarea
                  value={settings.templateBody}
                  onChange={(e) => update("templateBody", e.target.value)}
                  placeholder="Email body..."
                  className="min-h-[200px] font-mono text-xs"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1.5">
                <p>
                  <strong>Claims Table:</strong> A table listing all pending claims (Claim ID, Requester, Submitted, Amount, Category, Description) is automatically appended below the body text.
                </p>
                <p>
                  <strong>Primary CTA:</strong> A "Review All Claims" button linking to <code className="bg-muted px-1 rounded">{`{{approval_inbox_link}}`}</code> is added below the table.
                </p>
                <p>
                  <strong>Note:</strong> Even if only 1 claim is pending, the same table layout is used (no separate single-item design).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 7: Preview & Send Test */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                Preview & Send Test
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  {showPreview ? "Hide Preview" : "Show Preview"}
                </Button>
                <div className="flex items-center gap-2 ml-auto">
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@company.com"
                    className="w-56"
                  />
                  <Button size="sm" variant="secondary" onClick={handleSendTest}>
                    <Send className="h-3.5 w-3.5 mr-1" />
                    Send Test Email
                  </Button>
                </div>
              </div>

              {showPreview && (
                <div className="border rounded-lg overflow-hidden">
                  {/* Email header */}
                  <div className="bg-muted px-4 py-3 border-b space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-muted-foreground w-16">From:</span>
                      <span>noreply@company.com</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-muted-foreground w-16">To:</span>
                      <span>{templateVariables.find((v) => v.key === "{{approver_name}}")?.mock} &lt;approver@company.com&gt;</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-muted-foreground w-16">Subject:</span>
                      <span className="font-semibold">{previewSubject}</span>
                    </div>
                  </div>

                  {/* Email body - rendered as email-safe HTML */}
                  <div className="p-0">
                    <div
                      dangerouslySetInnerHTML={{ __html: buildApprovalEmailPreviewHtml(previewBody) }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Bottom action bar */}
      {settings.enabled && (
        <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 border shadow-sm">
          <Button variant="outline" onClick={() => setSettings(defaultSettings)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      )}
    </div>
  );
}

function buildApprovalEmailPreviewHtml(bodyText: string): string {
  const htmlBody = bodyText
    .split("\n")
    .map((line) => {
      const converted = line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      return converted === "" ? "<br/>" : `<p style="margin:0 0 8px 0;line-height:1.6;">${converted}</p>`;
    })
    .join("");

  const txnRows = mockPendingApprovals
    .map(
      (claim) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;font-weight:500;">${claim.claim_id}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;">${claim.requester_name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;">${claim.submission_date}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;text-align:right;font-variant-numeric:tabular-nums;">${claim.amount} ${claim.currency}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;">${claim.category}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;">${claim.description}</td>
      </tr>`
    )
    .join("");

  const totalAmount = "61,550.00";

  return `
    <div style="background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:700px;margin:0 auto;">
        <tr>
          <td style="padding:32px 24px 0 24px;">
            <!-- Body text -->
            <div style="font-size:14px;color:#374151;">
              ${htmlBody}
            </div>

            <!-- Claims Table -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border:1px solid #e5e7eb;border-radius:8px;border-collapse:separate;overflow:hidden;">
              <thead>
                <tr style="background-color:#f9fafb;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Claim ID</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Requester</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Submitted</th>
                  <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Amount</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Category</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Description</th>
                </tr>
              </thead>
              <tbody>
                ${txnRows}
              </tbody>
              <tfoot>
                <tr style="background-color:#f9fafb;">
                  <td colspan="3" style="padding:10px 12px;font-size:13px;font-weight:600;color:#374151;">Total: ${mockPendingApprovals.length} claim(s)</td>
                  <td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:600;color:#374151;">${totalAmount} THB</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>

            <!-- Primary CTA -->
            <div style="text-align:center;margin-top:28px;">
              <a href="https://app.example.com/approvals?status=PENDING"
                 style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.02em;">
                ✅ Review All Claims
              </a>
            </div>

            <!-- Secondary link -->
            <div style="text-align:center;margin-top:12px;">
              <a href="https://app.example.com/approvals?status=PENDING"
                 style="color:#2563eb;font-size:13px;text-decoration:underline;">
                View all pending approvals →
              </a>
            </div>

            <!-- Footer -->
            <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;">
              <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.5;">
                This is an automated notification from the Expense Management System.<br/>
                If you have already reviewed these claims, please disregard this email.
              </p>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}
