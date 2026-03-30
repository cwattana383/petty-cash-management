import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bell, Info, Mail, Eye } from "lucide-react";

const mockPendingTransactions = [
  { transaction_id: "TXN20250129001", merchant_name: "GRAB TAXI", transaction_date: "2026-02-28", amount: "1,500", currency: "THB" },
  { transaction_id: "TXN20250129002", merchant_name: "MARRIOTT HOTEL BKK", transaction_date: "2026-02-28", amount: "3,500", currency: "THB" },
  { transaction_id: "TXN20250129003", merchant_name: "PTT GAS STATION", transaction_date: "2026-02-28", amount: "850", currency: "THB" },
  { transaction_id: "TXN20250129004", merchant_name: "SOMTUM RESTAURANT", transaction_date: "2026-02-28", amount: "1,250", currency: "THB" },
  { transaction_id: "TXN20250129005", merchant_name: "THAI AIRWAYS", transaction_date: "2026-02-28", amount: "15,000", currency: "THB" },
];

export default function PendingInvoiceNotificationPanel() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold">Pending Invoice — Email & Reminder Setup</h2>
        <p className="text-sm text-muted-foreground">
          Configure consolidated email notifications for pending invoices.
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
                  Send a consolidated email to each cardholder listing all their outstanding pending invoices
                </p>
              </div>
            </div>
            <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
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
                  Send a periodic reminder if transactions remain in PENDING_INVOICE status
                </p>
              </div>
            </div>
            <Switch checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/50 p-4">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Emails are sent 10 minutes after daily import. Reminders repeat every 3 days until all invoices are uploaded.
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
                <p className="text-xs text-muted-foreground">To: Somchai Jaidee</p>
                <p className="text-sm font-medium mt-1">
                  Action Required: 5 Pending Corporate Card Invoice(s)
                </p>
              </div>

              {/* Email body */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm">Dear Somchai Jaidee,</p>
                <p className="text-sm text-muted-foreground">
                  You have <strong>5</strong> corporate card transaction(s) that still require invoice uploads.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please upload all invoices before <strong>2026-03-15</strong> to avoid salary deduction.
                </p>

                {/* Transaction table */}
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-semibold">Transaction No.</TableHead>
                        <TableHead className="text-xs font-semibold">Date</TableHead>
                        <TableHead className="text-xs font-semibold">Merchant</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockPendingTransactions.map((txn) => (
                        <TableRow key={txn.transaction_id}>
                          <TableCell className="text-xs font-mono">{txn.transaction_id}</TableCell>
                          <TableCell className="text-xs">{txn.transaction_date}</TableCell>
                          <TableCell className="text-xs">{txn.merchant_name}</TableCell>
                          <TableCell className="text-xs text-right">฿{txn.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* CTA Button */}
                <div className="pt-2">
                  <span className="inline-block bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-md">
                    Upload Invoices Now
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
