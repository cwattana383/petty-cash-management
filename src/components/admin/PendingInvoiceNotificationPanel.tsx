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
  { key: "{{cardholder_name}}", label: "Cardholder Name", mock: "สมชาย ใจดี" },
  { key: "{{pending_count}}", label: "Pending Invoice Count", mock: "3" },
  { key: "{{max_due_date}}", label: "Latest Due Date", mock: "2026-03-15" },
  { key: "{{upload_all_link}}", label: "Upload All Link", mock: "https://app.example.com/transactions?status=PENDING_INVOICE" },
];

// Mock pending transactions for preview
const mockPendingTransactions = [
  {
    transaction_id: "TXN-20260228-0001",
    merchant_name: "Grab Taxi",
    transaction_date: "2026-02-28",
    amount: "2,500.00",
    currency: "THB",
    category: "Transportation",
    due_date: "2026-03-15",
    upload_link: "https://app.example.com/upload?txn=TXN-20260228-0001",
  },
  {
    transaction_id: "TXN-20260227-0002",
    merchant_name: "Novotel Bangkok",
    transaction_date: "2026-02-27",
    amount: "4,500.00",
    currency: "THB",
    category: "Hotel",
    due_date: "2026-03-14",
    upload_link: "https://app.example.com/upload?txn=TXN-20260227-0002",
  },
  {
    transaction_id: "TXN-20260226-0003",
    merchant_name: "Sushi Hiro Restaurant",
    transaction_date: "2026-02-26",
    amount: "1,280.00",
    currency: "THB",
    category: "Meals & Entertainment",
    due_date: "2026-03-13",
    upload_link: "https://app.example.com/upload?txn=TXN-20260226-0003",
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
  firstSendDelayMinutes: 10,
  remindersEnabled: true,
  reminderIntervalDays: 3,
  maxReminders: 5,
  slaDays: 15,
  categoryOverridesEnabled: false,
  categoryOverrides: [
    { id: "1", category: "Travel", slaDays: 7, reminderIntervalDays: 2 },
    { id: "2", category: "Meals & Entertainment", slaDays: 5, reminderIntervalDays: 1 },
  ],
  templateSubject: "Action Required: {{pending_count}} Pending Corporate Card Invoices",
  templateBody: `Dear {{cardholder_name}},

You have **{{pending_count}}** corporate card transaction(s) that require invoice uploads.

Please upload all invoices before **{{max_due_date}}** to avoid policy violations.

The details of your pending transactions are listed below.

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

export default function PendingInvoiceNotificationPanel() {
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
      toast({ title: "Settings Saved", description: "Pending invoice notification settings have been saved successfully." });
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
          <h2 className="text-lg font-semibold">Pending Invoice — Email & Reminder Setup</h2>
          <p className="text-sm text-muted-foreground">
            Configure consolidated email notifications grouping all pending invoices per cardholder.
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
                  Send one consolidated email per cardholder listing all pending invoices
                </p>
              </div>
            </div>
            <Switch checked={settings.enabled} onCheckedChange={(v) => update("enabled", v)} />
          </div>
        </CardContent>
      </Card>

      {settings.enabled && (
        <>
          {/* Section 2: Trigger */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Trigger Condition
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Bank Import Success → Group by Cardholder</p>
                    <p className="text-muted-foreground mt-1">
                      After a bank import job completes, the system groups all transactions with status
                      <Badge variant="outline" className="mx-1 text-xs">PENDING_INVOICE</Badge>
                      by cardholder and sends <strong>one consolidated email per cardholder</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                    <span className="text-sm text-muted-foreground">minutes after import</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {settings.firstSendDelay === "immediate"
                  ? "Email will be sent immediately after the import job completes."
                  : `Email will be sent ${settings.firstSendDelayMinutes} minute(s) after the import job completes.`}
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
                    Send periodic consolidated reminders for transactions still in PENDING_INVOICE
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
                      <strong>Auto-stop:</strong> Reminders stop automatically when the transaction status changes to:
                      <span className="inline-flex flex-wrap gap-1 mt-1 ml-1">
                        {["APPROVED", "AUTO_APPROVED", "REJECTED", "AUTO_REJECTED", "FINAL_REJECTED", "REIMBURSED"].map((s) => (
                          <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">{s}</Badge>
                        ))}
                      </span>
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Section 5: SLA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                SLA (Service Level Agreement)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Global SLA</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Invoice must be uploaded within</span>
                  <Input
                    type="number"
                    value={settings.slaDays}
                    onChange={(e) => update("slaDays", Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20"
                    min={1}
                  />
                  <span className="text-sm text-muted-foreground">day(s) from transaction date</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Category Overrides</p>
                  <p className="text-xs text-muted-foreground">
                    Set different SLA and reminder frequency per expense category
                  </p>
                </div>
                <Switch
                  checked={settings.categoryOverridesEnabled}
                  onCheckedChange={(v) => update("categoryOverridesEnabled", v)}
                />
              </div>

              {settings.categoryOverridesEnabled && (
                <div className="space-y-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>SLA (days)</TableHead>
                        <TableHead>Reminder Interval (days)</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settings.categoryOverrides.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-sm">
                            No category overrides. Click "Add Override" to create one.
                          </TableCell>
                        </TableRow>
                      )}
                      {settings.categoryOverrides.map((o) => {
                        const usedCategories = settings.categoryOverrides
                          .filter((x) => x.id !== o.id)
                          .map((x) => x.category);
                        const availableCategories = expenseCategories.filter(
                          (c) => c === o.category || !usedCategories.includes(c)
                        );
                        return (
                          <TableRow key={o.id}>
                            <TableCell>
                              <Select
                                value={o.category}
                                onValueChange={(v) => updateOverride(o.id, "category", v)}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableCategories.map((c) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={o.slaDays}
                                onChange={(e) => updateOverride(o.id, "slaDays", Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-20"
                                min={1}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={o.reminderIntervalDays}
                                onChange={(e) =>
                                  updateOverride(o.id, "reminderIntervalDays", Math.max(1, parseInt(e.target.value) || 1))
                                }
                                className="w-20"
                                min={1}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive"
                                onClick={() => removeCategoryOverride(o.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addCategoryOverride}
                    disabled={settings.categoryOverrides.length >= expenseCategories.length}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Override
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

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
                  <strong>Transaction Table:</strong> A table listing all pending transactions (Merchant, Date, Amount, Category, Due Date) is automatically appended below the body text.
                </p>
                <p>
                  <strong>Primary CTA:</strong> An "Upload All Invoices" button linking to <code className="bg-muted px-1 rounded">{`{{upload_all_link}}`}</code> is added below the table.
                </p>
                <p>
                  <strong>Note:</strong> Even if only 1 transaction is pending, the same table layout is used (no separate single-item design).
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
                      <span>{templateVariables.find((v) => v.key === "{{cardholder_name}}")?.mock} &lt;cardholder@company.com&gt;</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-muted-foreground w-16">Subject:</span>
                      <span className="font-semibold">{previewSubject}</span>
                    </div>
                  </div>

                  {/* Email body - rendered as email-safe HTML */}
                  <div className="p-0">
                    <div
                      dangerouslySetInnerHTML={{ __html: buildEmailPreviewHtml(previewBody) }}
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

/**
 * Build a full email-safe HTML preview with inline styles, transaction table, and CTA.
 * Uses only inline CSS and HTML tables for Gmail/Outlook compatibility.
 */
function buildEmailPreviewHtml(bodyText: string): string {
  // Convert markdown bold to HTML
  const htmlBody = bodyText
    .split("\n")
    .map((line) => {
      const converted = line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      return converted === "" ? "<br/>" : `<p style="margin:0 0 8px 0;line-height:1.6;">${converted}</p>`;
    })
    .join("");

  const txnRows = mockPendingTransactions
    .map(
      (txn) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;">${txn.merchant_name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;">${txn.transaction_date}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;text-align:right;font-variant-numeric:tabular-nums;">${txn.amount} ${txn.currency}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;">${txn.category}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;">${txn.due_date}</td>
      </tr>`
    )
    .join("");

  return `
    <div style="background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;">
        <tr>
          <td style="padding:32px 24px 0 24px;">
            <!-- Body text -->
            <div style="font-size:14px;color:#374151;">
              ${htmlBody}
            </div>

            <!-- Transaction Table -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border:1px solid #e5e7eb;border-radius:8px;border-collapse:separate;overflow:hidden;">
              <thead>
                <tr style="background-color:#f9fafb;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Merchant</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Date</th>
                  <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Amount</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Category</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;border-bottom:2px solid #e5e7eb;">Due Date</th>
                </tr>
              </thead>
              <tbody>
                ${txnRows}
              </tbody>
              <tfoot>
                <tr style="background-color:#f9fafb;">
                  <td colspan="2" style="padding:10px 12px;font-size:13px;font-weight:600;color:#374151;">Total: ${mockPendingTransactions.length} transaction(s)</td>
                  <td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:600;color:#374151;">8,280.00 THB</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>

            <!-- Primary CTA -->
            <div style="text-align:center;margin-top:28px;">
              <a href="https://app.example.com/transactions?status=PENDING_INVOICE"
                 style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.02em;">
                📎 Upload All Invoices
              </a>
            </div>

            <!-- Secondary link -->
            <div style="text-align:center;margin-top:12px;">
              <a href="https://app.example.com/transactions?status=PENDING_INVOICE"
                 style="color:#2563eb;font-size:13px;text-decoration:underline;">
                View all pending transactions →
              </a>
            </div>

            <!-- Footer -->
            <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;">
              <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.5;">
                This is an automated notification from the Corporate Card Expense System.<br/>
                If you have already uploaded these invoices, please disregard this email.
              </p>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}
