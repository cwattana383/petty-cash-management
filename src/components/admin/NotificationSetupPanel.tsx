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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Bell, Clock, FileText, Eye, Send, Plus, Trash2, Info, Mail,
  Download, Shield, Users, CheckCircle2, XCircle, MinusCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────
interface CategoryOverride {
  id: string;
  category: string;
  slaDays: number;
  active: boolean;
}

interface NotificationConfig {
  enabled: boolean;
  ruleCode: string;
  recipientType: string;
  sendToRoles: string[];
  triggerMode: "batch" | "scheduled";
  firstSendHours: number;
  reminderIntervalHours: number;
  maxReminders: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  globalSlaDays: number;
  categoryOverrides: CategoryOverride[];
  subjectTemplate: string;
  introText: string;
  ctaLabel: string;
  ctaUrl: string;
  footerText: string;
  fromName: string;
  replyToEmail: string;
}

// ─── Constants ───────────────────────────────────────────────────────
const recipientTypes = ["Cardholder", "Manager Approver", "Finance Approver", "Policy Approver"];
const roleOptions = ["Employee", "Manager", "Accounting", "Finance", "Admin", "Auditor"];
const expenseCategories = [
  "Meals & Entertainment", "Travel", "Office Supplies", "Transportation",
  "Training", "Communication", "Hotel & Accommodation", "Fuel", "Other",
];

const cardholderDefault: NotificationConfig = {
  enabled: true,
  ruleCode: "CARDHOLDER_PENDING_INVOICE",
  recipientType: "Cardholder",
  sendToRoles: ["Employee"],
  triggerMode: "batch",
  firstSendHours: 1,
  reminderIntervalHours: 24,
  maxReminders: 3,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  globalSlaDays: 7,
  categoryOverrides: [
    { id: "1", category: "Travel", slaDays: 5, active: true },
    { id: "2", category: "Meals & Entertainment", slaDays: 3, active: true },
  ],
  subjectTemplate: "Action Required: {{pending_count}} Pending Corporate Card Invoices",
  introText: `Dear {{cardholder_name}},

You have {{pending_count}} corporate card transaction(s) that require invoice uploads.

Please upload all invoices before {{max_due_date}} to avoid policy violations.`,
  ctaLabel: "Upload All Invoices",
  ctaUrl: "/transactions?status=PENDING_INVOICE&batch={{file_id}}",
  footerText: "This is an automated notification from the Corporate Card Expense System.\nIf you have already uploaded these invoices, please disregard this email.",
  fromName: "Corporate Card System",
  replyToEmail: "noreply@company.com",
};

const approverDefault: NotificationConfig = {
  enabled: true,
  ruleCode: "APPROVER_PENDING_APPROVAL",
  recipientType: "Manager Approver",
  sendToRoles: ["Manager", "Finance"],
  triggerMode: "batch",
  firstSendHours: 1,
  reminderIntervalHours: 24,
  maxReminders: 3,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  globalSlaDays: 7,
  categoryOverrides: [],
  subjectTemplate: "Action Required: {{pending_count}} Transactions Awaiting Your Approval",
  introText: `Dear {{approver_name}},

You have {{pending_count}} corporate card transaction(s) awaiting your approval.

Please review and take action before {{max_due_date}}.`,
  ctaLabel: "Review All Pending",
  ctaUrl: "/approvals?status=pending&batch={{file_id}}",
  footerText: "This is an automated notification from the Corporate Card Expense System.\nPlease do not reply to this email.",
  fromName: "Corporate Card System",
  replyToEmail: "noreply@company.com",
};

// ─── Mock data for email preview ─────────────────────────────────────
const cardholderMockTxns = [
  { merchant: "Grab Taxi", date: "2026-02-28", amount: "2,500.00 THB", category: "Transportation", dueDate: "2026-03-07" },
  { merchant: "Novotel Bangkok", date: "2026-02-27", amount: "4,500.00 THB", category: "Hotel", dueDate: "2026-03-06" },
  { merchant: "Sushi Hiro", date: "2026-02-26", amount: "1,280.00 THB", category: "Meals & Entertainment", dueDate: "2026-03-05" },
];

const approverMockTxns = [
  { refNo: "TXN-0001", employee: "สมชาย ใจดี", merchant: "Grab Taxi", date: "2026-02-28", amount: "2,500.00 THB", category: "Transportation", policyFlags: "Auto Approved", submittedDate: "2026-02-28", dueDate: "2026-03-07" },
  { refNo: "TXN-0002", employee: "สมหญิง แก้วใส", merchant: "Novotel Bangkok", date: "2026-02-27", amount: "14,500.00 THB", category: "Hotel", policyFlags: "Over Limit", submittedDate: "2026-02-27", dueDate: "2026-03-06" },
  { refNo: "TXN-0003", employee: "วิภา สุขใจ", merchant: "Office Depot", date: "2026-02-26", amount: "3,200.00 THB", category: "Office Supplies", policyFlags: "—", submittedDate: "2026-02-26", dueDate: "2026-03-05" },
];

// Mock log data
const mockLogs = [
  { sentAt: "2026-02-28 09:15", recipient: "somchai@company.com", pendingCount: 3, totalAmount: "8,280.00 THB", batchId: "BATCH-20260228-001", status: "Sent", error: "" },
  { sentAt: "2026-02-28 09:15", recipient: "somying@company.com", pendingCount: 1, totalAmount: "14,500.00 THB", batchId: "BATCH-20260228-001", status: "Sent", error: "" },
  { sentAt: "2026-02-27 14:00", recipient: "wipa@company.com", pendingCount: 2, totalAmount: "5,700.00 THB", batchId: "BATCH-20260227-002", status: "Failed", error: "SMTP timeout" },
  { sentAt: "2026-02-27 14:00", recipient: "admin@company.com", pendingCount: 0, totalAmount: "0.00 THB", batchId: "BATCH-20260227-002", status: "Skipped", error: "No pending items" },
  { sentAt: "2026-02-26 10:30", recipient: "somchai@company.com", pendingCount: 5, totalAmount: "12,400.00 THB", batchId: "BATCH-20260226-001", status: "Sent", error: "" },
];

// ─── Tab Content Component ───────────────────────────────────────────
function NotificationTabContent({
  config,
  setConfig,
  type,
}: {
  config: NotificationConfig;
  setConfig: (c: NotificationConfig) => void;
  type: "cardholder" | "approver";
}) {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [logStatusFilter, setLogStatusFilter] = useState("all");
  const [logSearch, setLogSearch] = useState("");

  const update = <K extends keyof NotificationConfig>(key: K, value: NotificationConfig[K]) => {
    setConfig({ ...config, [key]: value });
  };

  const toggleRole = (role: string) => {
    const roles = config.sendToRoles.includes(role)
      ? config.sendToRoles.filter((r) => r !== role)
      : [...config.sendToRoles, role];
    update("sendToRoles", roles);
  };

  const addOverride = () => {
    const used = config.categoryOverrides.map((o) => o.category);
    const available = expenseCategories.filter((c) => !used.includes(c));
    if (!available.length) return;
    update("categoryOverrides", [
      ...config.categoryOverrides,
      { id: Date.now().toString(), category: available[0], slaDays: config.globalSlaDays, active: true },
    ]);
  };

  const removeOverride = (id: string) => {
    update("categoryOverrides", config.categoryOverrides.filter((o) => o.id !== id));
  };

  const updateOverride = (id: string, field: keyof CategoryOverride, value: string | number | boolean) => {
    update("categoryOverrides", config.categoryOverrides.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  };

  const filteredLogs = mockLogs.filter((l) => {
    if (logStatusFilter !== "all" && l.status !== logStatusFilter) return false;
    if (logSearch && !l.recipient.toLowerCase().includes(logSearch.toLowerCase()) && !l.batchId.toLowerCase().includes(logSearch.toLowerCase())) return false;
    return true;
  });

  const sentCount = mockLogs.filter((l) => l.status === "Sent").length;
  const failedCount = mockLogs.filter((l) => l.status === "Failed").length;
  const skippedCount = mockLogs.filter((l) => l.status === "Skipped").length;

  return (
    <div className="space-y-6">
      {/* ── Section 1: Enable & Audience ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Enable & Audience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Notification</p>
              <p className="text-xs text-muted-foreground">
                Activate this notification rule to start sending emails automatically
              </p>
            </div>
            <Switch checked={config.enabled} onCheckedChange={(v) => update("enabled", v)} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Rule Code</Label>
              <Input value={config.ruleCode} readOnly className="bg-muted font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Recipient Type</Label>
              <Select value={config.recipientType} onValueChange={(v) => update("recipientType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {recipientTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Send to Roles</Label>
            <p className="text-xs text-muted-foreground">Select which roles should receive this notification</p>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((role) => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    config.sendToRoles.includes(role)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {role}
                  {config.sendToRoles.includes(role) && <span className="text-[10px]">✕</span>}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {config.enabled && (
        <>
          {/* ── Section 2: Trigger & Scheduling ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Trigger & Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-xs">Trigger Mode</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="radio" name={`trigger-${type}`} value="batch"
                      checked={config.triggerMode === "batch"}
                      onChange={() => update("triggerMode", "batch")}
                      className="text-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">After Bank Import Success (Batch-based)</p>
                      <p className="text-xs text-muted-foreground">Triggered when a bank file import job completes successfully</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-not-allowed opacity-60">
                    <input type="radio" name={`trigger-${type}`} value="scheduled" disabled className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Scheduled Digest</p>
                      <p className="text-xs text-muted-foreground">Coming soon — Send at a specific time each day</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto text-[10px]">Coming Soon</Badge>
                  </label>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">First Send Timing</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" value={config.firstSendHours}
                      onChange={(e) => update("firstSendHours", Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20" min={0}
                    />
                    <span className="text-xs text-muted-foreground">hour(s) after import</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Reminder Interval</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" value={config.reminderIntervalHours}
                      onChange={(e) => update("reminderIntervalHours", Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20" min={1}
                    />
                    <span className="text-xs text-muted-foreground">hour(s)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Max Reminders</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" value={config.maxReminders}
                      onChange={(e) => update("maxReminders", Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20" min={0}
                    />
                    <span className="text-xs text-muted-foreground">times</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Checkbox
                  id={`quiet-${type}`}
                  checked={config.quietHoursEnabled}
                  onCheckedChange={(v) => update("quietHoursEnabled", v === true)}
                />
                <div className="space-y-2">
                  <label htmlFor={`quiet-${type}`} className="text-sm font-medium cursor-pointer">
                    Do not send during Quiet Hours
                  </label>
                  {config.quietHoursEnabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time" value={config.quietHoursStart}
                        onChange={(e) => update("quietHoursStart", e.target.value)}
                        className="w-32"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="time" value={config.quietHoursEnd}
                        onChange={(e) => update("quietHoursEnd", e.target.value)}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Section 3: SLA / Due Date Rules ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                SLA / Due Date Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Global SLA</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Invoice / action must be completed within</span>
                  <Input
                    type="number" value={config.globalSlaDays}
                    onChange={(e) => update("globalSlaDays", Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20" min={1}
                  />
                  <span className="text-sm text-muted-foreground">day(s) from transaction date</span>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">Category Overrides</p>
                    <p className="text-xs text-muted-foreground">Override SLA per expense category</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={addOverride}
                    disabled={config.categoryOverrides.length >= expenseCategories.length}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Override
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>SLA Days</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {config.categoryOverrides.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-sm">
                          No category overrides configured
                        </TableCell>
                      </TableRow>
                    )}
                    {config.categoryOverrides.map((o) => {
                      const used = config.categoryOverrides.filter((x) => x.id !== o.id).map((x) => x.category);
                      const available = expenseCategories.filter((c) => c === o.category || !used.includes(c));
                      return (
                        <TableRow key={o.id}>
                          <TableCell>
                            <Select value={o.category} onValueChange={(v) => updateOverride(o.id, "category", v)}>
                              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {available.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={o.slaDays} className="w-20" min={1}
                              onChange={(e) => updateOverride(o.id, "slaDays", Math.max(1, parseInt(e.target.value) || 1))} />
                          </TableCell>
                          <TableCell>
                            <Switch checked={o.active} onCheckedChange={(v) => updateOverride(o.id, "active", v)} />
                          </TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                              onClick={() => removeOverride(o.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ── Section 4: Email Content ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Subject Template</Label>
                <Input value={config.subjectTemplate} onChange={(e) => update("subjectTemplate", e.target.value)} />
                <p className="text-[11px] text-muted-foreground">
                  Variables: <code className="bg-muted px-1 rounded">{`{{pending_count}}`}</code>,{" "}
                  <code className="bg-muted px-1 rounded">{`{{cardholder_name}}`}</code>,{" "}
                  <code className="bg-muted px-1 rounded">{`{{max_due_date}}`}</code>,{" "}
                  <code className="bg-muted px-1 rounded">{`{{file_id}}`}</code>
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Intro Text</Label>
                <Textarea value={config.introText} onChange={(e) => update("introText", e.target.value)}
                  className="min-h-[120px] text-sm" />
              </div>

              <Separator />

              {/* Table Preview */}
              <div>
                <Label className="text-xs mb-2 block">Email Table Preview</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        {type === "cardholder" ? (
                          <>
                            <TableHead className="text-xs">Merchant</TableHead>
                            <TableHead className="text-xs">Transaction Date</TableHead>
                            <TableHead className="text-xs text-right">Amount</TableHead>
                            <TableHead className="text-xs">Category</TableHead>
                            <TableHead className="text-xs">Due Date</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead className="text-xs">Ref No</TableHead>
                            <TableHead className="text-xs">Employee</TableHead>
                            <TableHead className="text-xs">Merchant</TableHead>
                            <TableHead className="text-xs">Transaction Date</TableHead>
                            <TableHead className="text-xs text-right">Amount</TableHead>
                            <TableHead className="text-xs">Category</TableHead>
                            <TableHead className="text-xs">Policy Flags</TableHead>
                            <TableHead className="text-xs">Submitted Date</TableHead>
                            <TableHead className="text-xs">Due Date</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {type === "cardholder"
                        ? cardholderMockTxns.map((t, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs">{t.merchant}</TableCell>
                              <TableCell className="text-xs">{t.date}</TableCell>
                              <TableCell className="text-xs text-right font-mono">{t.amount}</TableCell>
                              <TableCell className="text-xs">{t.category}</TableCell>
                              <TableCell className="text-xs">{t.dueDate}</TableCell>
                            </TableRow>
                          ))
                        : approverMockTxns.map((t, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs font-mono">{t.refNo}</TableCell>
                              <TableCell className="text-xs">{t.employee}</TableCell>
                              <TableCell className="text-xs">{t.merchant}</TableCell>
                              <TableCell className="text-xs">{t.date}</TableCell>
                              <TableCell className="text-xs text-right font-mono">{t.amount}</TableCell>
                              <TableCell className="text-xs">{t.category}</TableCell>
                              <TableCell className="text-xs">
                                {t.policyFlags !== "—" ? (
                                  <Badge variant={t.policyFlags === "Over Limit" ? "destructive" : "secondary"} className="text-[10px]">
                                    {t.policyFlags}
                                  </Badge>
                                ) : "—"}
                              </TableCell>
                              <TableCell className="text-xs">{t.submittedDate}</TableCell>
                              <TableCell className="text-xs">{t.dueDate}</TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  This table is automatically embedded in the email body below the intro text.
                </p>
              </div>

              <Separator />

              {/* CTA Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">CTA Button Label</Label>
                  <Input value={config.ctaLabel} onChange={(e) => update("ctaLabel", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">CTA URL Template</Label>
                  <Input value={config.ctaUrl} onChange={(e) => update("ctaUrl", e.target.value)}
                    className="font-mono text-xs" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Footer Text</Label>
                <Textarea value={config.footerText} onChange={(e) => update("footerText", e.target.value)}
                  className="min-h-[60px] text-sm" rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* ── Section 5: Delivery & Technical ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Send className="h-4 w-4 text-muted-foreground" />
                Delivery & Technical
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">From Name</Label>
                  <Input value={config.fromName} onChange={(e) => update("fromName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Reply-to Email</Label>
                  <Input type="email" value={config.replyToEmail} onChange={(e) => update("replyToEmail", e.target.value)} />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  HTML email with inline CSS only. Max width 600px. Compatible with Gmail, Outlook, Apple Mail, and major email clients.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  {showPreview ? "Hide Preview" : "Preview Email"}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => {
                  toast({ title: "Test Email Sent", description: "Preview email sent to your account (mock)." });
                }}>
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Send Test Email to Me
                </Button>
              </div>

              {showPreview && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-3 border-b space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-muted-foreground w-16">From:</span>
                      <span>{config.fromName} &lt;{config.replyToEmail}&gt;</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-muted-foreground w-16">To:</span>
                      <span>{type === "cardholder" ? "สมชาย ใจดี" : "Manager"} &lt;recipient@company.com&gt;</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-muted-foreground w-16">Subject:</span>
                      <span className="font-semibold">
                        {config.subjectTemplate.replace("{{pending_count}}", "3")}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 text-sm">
                    <div className="whitespace-pre-line text-sm text-foreground mb-4">
                      {config.introText
                        .replace(/\{\{cardholder_name\}\}/g, "สมชาย ใจดี")
                        .replace(/\{\{approver_name\}\}/g, "Manager Name")
                        .replace(/\{\{pending_count\}\}/g, "3")
                        .replace(/\{\{max_due_date\}\}/g, "2026-03-07")}
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-4">[Transaction table appears here — see preview above]</p>
                    <div className="text-center my-4">
                      <span className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-semibold">
                        {config.ctaLabel}
                      </span>
                    </div>
                    <Separator className="my-4" />
                    <p className="text-xs text-muted-foreground whitespace-pre-line">{config.footerText}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Section 6: Logging & Audit ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Logging & Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold text-foreground">{sentCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Sent (7d)</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-2xl font-bold text-foreground">{failedCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Failed (7d)</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <MinusCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold text-foreground">{skippedCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Skipped (7d)</p>
                </div>
              </div>

              {/* Log filters */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Input value={logSearch} onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search recipient or batch ID..." className="text-sm" />
                </div>
                <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                    <SelectItem value="Skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => {
                  toast({ title: "Export Started", description: "CSV file download will begin shortly (mock)." });
                }}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Export Logs (CSV)
                </Button>
              </div>

              {/* Log table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Sent At</TableHead>
                      <TableHead className="text-xs">Recipient</TableHead>
                      <TableHead className="text-xs text-right">Pending Count</TableHead>
                      <TableHead className="text-xs text-right">Total Amount</TableHead>
                      <TableHead className="text-xs">Batch ID</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-6 text-sm">
                          No logs found
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredLogs.map((log, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-mono">{log.sentAt}</TableCell>
                        <TableCell className="text-xs">{log.recipient}</TableCell>
                        <TableCell className="text-xs text-right">{log.pendingCount}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{log.totalAmount}</TableCell>
                        <TableCell className="text-xs">
                          <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{log.batchId}</code>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant={log.status === "Sent" ? "secondary" : log.status === "Failed" ? "destructive" : "outline"}
                            className="text-[10px]">
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.error || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function NotificationSetupPanel() {
  const [cardholderConfig, setCardholderConfig] = useState<NotificationConfig>(cardholderDefault);
  const [approverConfig, setApproverConfig] = useState<NotificationConfig>(approverDefault);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "Settings Saved", description: "Notification settings have been saved successfully." });
    }, 800);
  };

  const handleDiscard = () => {
    setCardholderConfig(cardholderDefault);
    setApproverConfig(approverDefault);
    toast({ title: "Changes Discarded", description: "All changes have been reverted to last saved state." });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-lg font-semibold">Notification Setup</h2>
        <p className="text-sm text-muted-foreground">
          Configure automated consolidated email notifications for corporate card transactions
        </p>
      </div>

      <Tabs defaultValue="cardholder" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="cardholder" className="text-xs">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Cardholder Notifications
          </TabsTrigger>
          <TabsTrigger value="approver" className="text-xs">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Approver Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cardholder" className="mt-4">
          <NotificationTabContent config={cardholderConfig} setConfig={setCardholderConfig} type="cardholder" />
        </TabsContent>

        <TabsContent value="approver" className="mt-4">
          <NotificationTabContent config={approverConfig} setConfig={setApproverConfig} type="approver" />
        </TabsContent>
      </Tabs>

      {/* Sticky Save Bar */}
      <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 border shadow-sm">
        <Button variant="outline" onClick={handleDiscard}>Discard</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
