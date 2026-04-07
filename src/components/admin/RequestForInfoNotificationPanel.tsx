import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Info, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const defaultSubject = "[Request for more info] Credit Card Transaction {Transaction_No}";

const defaultBodySections = {
  greeting: "Dear {Cardholder_Name},",
  intro: "Your manager {Manager_Name} has requested additional information regarding the following transaction.",
  managerMessage: "{Manager_Message}",
  transactionSummary: "{Transaction_No} | {Merchant_Name} | {Amount} | {Date}",
  requestDate: "Request Date: {Request_Date}",
  closing: "Please log in to the portal to review and respond to this request.",
  ctaLabel: "View My Claim",
  ctaLink: "{Portal_Link}",
};

export default function RequestForInfoNotificationPanel() {
  const [enabled, setEnabled] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [managerMessageTemplate, setManagerMessageTemplate] = useState(defaultBodySections.managerMessage);
  const [closingTemplate, setClosingTemplate] = useState(defaultBodySections.closing);

  const handleSave = () => {
    toast({ title: "Saved", description: "Request for Info email settings saved." });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold">Request for Info Email</h2>
        <p className="text-sm text-muted-foreground">
          Notify cardholders when a manager requests additional information on their claim
        </p>
      </div>

      {/* Toggle */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Info className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Enable this notification</p>
                <p className="text-xs text-muted-foreground">
                  Send an email to the cardholder when a manager requests more information
                </p>
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/50 p-4">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          This email is triggered immediately when an approver clicks "Request Info" on a claim. The cardholder receives the manager's message along with the transaction details.
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
            <div className="space-y-5 mt-3">
              {/* Subject */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Subject</p>
                <div className="border rounded-md bg-muted/30 px-3 py-2 text-sm font-mono">
                  {defaultSubject}
                </div>
              </div>

              {/* Rendered preview */}
              <div className="border rounded-lg overflow-hidden bg-white">
                {/* Header */}
                <div className="bg-[#E63946] px-6 py-4">
                  <p className="text-white font-bold text-base">Corporate Card Expense Management</p>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                  <p className="text-sm">Dear Somchai Jaidee,</p>
                  <p className="text-sm text-muted-foreground">
                    Your manager <strong>Somying Kaewsai</strong> has requested additional information regarding the following transaction.
                  </p>

                  {/* Manager message box */}
                  <div className="border-l-4 border-[#E63946] bg-red-50 p-4 rounded-r-md">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Manager's Message</p>
                    <p className="text-sm italic">
                      "Please attach the original receipt and clarify the business purpose of this expense."
                    </p>
                  </div>

                  {/* Request date */}
                  <p className="text-xs text-muted-foreground">
                    Request Date: <strong>07 March 2026</strong>
                  </p>

                  {/* Transaction summary */}
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-xs font-semibold text-left px-3 py-2">Transaction No.</th>
                          <th className="text-xs font-semibold text-left px-3 py-2">Merchant</th>
                          <th className="text-xs font-semibold text-right px-3 py-2">Amount</th>
                          <th className="text-xs font-semibold text-left px-3 py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="text-xs font-mono px-3 py-2">TXN20260301002</td>
                          <td className="text-xs px-3 py-2">MARRIOTT HOTEL BKK</td>
                          <td className="text-xs text-right px-3 py-2">฿3,500</td>
                          <td className="text-xs px-3 py-2">01/03/2026</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* CTA */}
                  <div className="pt-2">
                    <span className="inline-block bg-[#E63946] text-white text-sm font-medium px-5 py-2.5 rounded-md">
                      View My Claim
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Please log in to the portal to review and respond to this request.
                  </p>

                  <div className="pt-4 border-t mt-4 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      This is an automated email — please do not reply.
                    </p>
                    <p className="text-xs text-muted-foreground">© CPAxtra — Corporate Card System</p>
                  </div>
                </div>
              </div>

              {/* Editable template fields */}
              <div className="space-y-3 pt-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Manager's Message Template</p>
                  <Textarea
                    value={managerMessageTemplate}
                    onChange={(e) => setManagerMessageTemplate(e.target.value)}
                    className="font-mono text-xs"
                    rows={2}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Closing Text</p>
                  <Textarea
                    value={closingTemplate}
                    onChange={(e) => setClosingTemplate(e.target.value)}
                    className="font-mono text-xs"
                    rows={2}
                  />
                </div>
              </div>

              {/* Available variables */}
              <div className="border rounded-md p-3 bg-muted/30">
                <p className="text-xs font-semibold mb-2">Available Variables</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "{Cardholder_Name}", "{Manager_Name}", "{Manager_Message}",
                    "{Transaction_No}", "{Merchant_Name}", "{Amount}", "{Date}",
                    "{Request_Date}", "{Portal_Link}",
                  ].map((v) => (
                    <span key={v} className="text-xs font-mono bg-background border rounded px-1.5 py-0.5">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-[#E63946] hover:bg-[#d32f3f] text-white">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
