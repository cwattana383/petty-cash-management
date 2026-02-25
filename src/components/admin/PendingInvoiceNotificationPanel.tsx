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
  { key: "{{merchant_name}}", label: "Merchant Name", mock: "Starbucks Siam Paragon" },
  { key: "{{transaction_date}}", label: "Transaction Date", mock: "2026-02-20" },
  { key: "{{amount}}", label: "Amount", mock: "1,250.00" },
  { key: "{{currency}}", label: "Currency", mock: "THB" },
  { key: "{{category}}", label: "Category", mock: "Meals & Entertainment" },
  { key: "{{due_date}}", label: "Due Date (SLA)", mock: "2026-03-07" },
  { key: "{{transaction_id}}", label: "Transaction ID", mock: "TXN-20260220-0042" },
  { key: "{{upload_link}}", label: "Upload Invoice Link", mock: "https://app.example.com/upload?txn=TXN-20260220-0042" },
  { key: "{{pending_count}}", label: "Pending Invoice Count", mock: "3" },
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
  templateSubject: "Action Required: Upload Invoice for {{merchant_name}} – {{amount}} {{currency}}",
  templateBody: `Dear {{cardholder_name}},

You have a corporate card transaction that requires an invoice upload.

**Transaction Details:**
- Merchant: {{merchant_name}}
- Date: {{transaction_date}}
- Amount: {{amount}} {{currency}}
- Category: {{category}}
- Transaction ID: {{transaction_id}}

**Due Date:** {{due_date}}

Please upload the invoice before the due date to avoid policy violations.

You currently have **{{pending_count}}** pending invoice(s).

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
            Configure automatic email notifications for cardholders with pending invoices after bank import.
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
                  Send email notifications to cardholders when invoices are pending
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
                    <p className="font-medium">Bank Import Success + Status = PENDING_INVOICE</p>
                    <p className="text-muted-foreground mt-1">
                      When a bank import job successfully creates or updates a transaction and sets its status to
                      <Badge variant="outline" className="mx-1 text-xs">PENDING_INVOICE</Badge>,
                      the system will create an email notification task.
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
                    Send periodic reminders for transactions still in PENDING_INVOICE status
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
                  className="min-h-[240px] font-mono text-xs"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                The email will include a primary CTA button <strong>"Upload Invoice"</strong> linking to {`{{upload_link}}`}.
                If the cardholder has multiple pending invoices, {`{{pending_count}}`} and a link to the pending list will be shown.
              </p>
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
                  {/* Email body */}
                  <div className="p-5 bg-background">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed max-w-lg">
                      {previewBody.split("\n").map((line, i) => {
                        // Simple bold markdown rendering
                        const parts = line.split(/(\*\*[^*]+\*\*)/g);
                        return (
                          <div key={i} className={line === "" ? "h-3" : ""}>
                            {parts.map((part, j) => {
                              if (part.startsWith("**") && part.endsWith("**")) {
                                return <strong key={j}>{part.slice(2, -2)}</strong>;
                              }
                              return <span key={j}>{part}</span>;
                            })}
                          </div>
                        );
                      })}
                    </div>

                    {/* CTA Button Preview */}
                    <div className="mt-6 space-y-3">
                      <a
                        href="#"
                        className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold text-sm no-underline hover:opacity-90 transition-opacity"
                        onClick={(e) => e.preventDefault()}
                      >
                        📎 Upload Invoice
                      </a>
                      <div>
                        <a
                          href="#"
                          className="text-xs text-primary underline"
                          onClick={(e) => e.preventDefault()}
                        >
                          View transaction details →
                        </a>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2.5">
                        You have <strong>3</strong> pending invoice(s).{" "}
                        <a href="#" className="text-primary underline" onClick={(e) => e.preventDefault()}>
                          View all pending invoices
                        </a>
                      </div>
                    </div>
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
