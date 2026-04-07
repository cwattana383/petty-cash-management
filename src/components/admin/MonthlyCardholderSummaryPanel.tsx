import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Info, Eye, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const mockTransactions = [
  { id: "bt-1", date: "01/03", merchant: "GRAB TAXI", amount: 1500, status: "Auto Approved" },
  { id: "bt-2", date: "01/03", merchant: "MARRIOTT HOTEL", amount: 3500, status: "Pending Documents" },
  { id: "bt-3", date: "02/03", merchant: "STARBUCKS", amount: 850, status: "Validated" },
  { id: "bt-4", date: "03/03", merchant: "Siam Amazing Park", amount: 7900, status: "Auto Rejected" },
  { id: "bt-5", date: "04/03", merchant: "THAI AIRWAYS", amount: 15000, status: "Pending Documents" },
  { id: "bt-7", date: "06/03", merchant: "KFC", amount: 279, status: "Auto Approved" },
  { id: "bt-8", date: "07/03", merchant: "Stone Hill Golf Club", amount: 55000, status: "Auto Rejected" },
  { id: "bt-9", date: "10/03", merchant: "AVIS RENT A CAR", amount: 9200, status: "Pending Documents" },
];

const pendingDocs = mockTransactions.filter((t) => t.status === "Pending Documents");
const totalAmount = mockTransactions.reduce((s, t) => s + t.amount, 0);

const greenStatuses = ["Auto Approved", "Validated", "Manager Approved", "Reimbursed"];
const orangeStatuses = ["Pending Documents", "Pending Approval"];
const redStatuses = ["Auto Rejected", "Rejected", "Final Rejected"];

function statusBadge(status: string) {
  let bg = "bg-gray-100 text-gray-700";
  if (greenStatuses.includes(status)) bg = "bg-green-100 text-green-800";
  else if (orangeStatuses.includes(status)) bg = "bg-orange-100 text-orange-800";
  else if (redStatuses.includes(status)) bg = "bg-red-100 text-red-800";
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${bg}`}>
      {status}
    </span>
  );
}

const approvedCount = mockTransactions.filter((t) => greenStatuses.includes(t.status)).length;
const pendingCount = pendingDocs.length;
const rejectedCount = mockTransactions.filter((t) => redStatuses.includes(t.status)).length;

export default function MonthlyCardholderSummaryPanel() {
  const [enabled, setEnabled] = useState(false);
  const [sendDay, setSendDay] = useState(9);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold">Monthly Cardholder Summary — Email Setup</h2>
        <p className="text-sm text-muted-foreground">
          Send each cardholder a personal monthly summary of their corporate card transactions.
        </p>
      </div>

      {/* Toggle: Enable */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Send className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Enable Monthly Summary</p>
                <p className="text-xs text-muted-foreground">
                  Send a monthly summary email to each cardholder on the selected date
                </p>
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Send On */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Info className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <Label className="text-sm font-semibold">Send On</Label>
                <p className="text-xs text-muted-foreground">Day of each month to send the summary</p>
              </div>
            </div>
            <Input
              type="number"
              min={1}
              max={28}
              value={sendDay}
              onChange={(e) => setSendDay(Math.max(1, Math.min(28, Number(e.target.value))))}
              className="w-20 text-center"
            />
          </div>
        </CardContent>
      </Card>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/50 p-4">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Emails are sent at 08:00 on the configured day. Each cardholder only receives their own transactions.
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
            {showPreview ? "Hide Email Preview" : "👁 Show Email Preview"}
          </button>

          {showPreview && (
            <div className="space-y-4 mt-3">
              {/* Email preview card */}
              <div className="mx-auto max-w-[600px] border rounded-lg overflow-hidden bg-white shadow-md" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                {/* Header */}
                <div style={{ backgroundColor: "#E63946", padding: "24px 28px", textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#fff", letterSpacing: "2px" }}>makro</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", marginTop: "4px" }}>Corporate Card Expense Management</div>
                </div>

                {/* Title section */}
                <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid #eee" }}>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1a1a1a" }}>สรุปรายการบัตรเครดิตประจำเดือน</div>
                  <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>มีนาคม 2569 | Somchai Jaidee</div>
                </div>

                {/* Summary stats */}
                <div style={{ padding: "16px 28px", display: "flex", gap: "10px" }}>
                  {[
                    { icon: "📄", label: "Total", value: mockTransactions.length, bg: "#f0f4f8", color: "#334155" },
                    { icon: "✅", label: "Approved", value: approvedCount, bg: "#dcfce7", color: "#166534" },
                    { icon: "⏳", label: "Pending Docs", value: pendingCount, bg: "#fff7ed", color: "#9a3412" },
                    { icon: "❌", label: "Rejected", value: rejectedCount, bg: "#fef2f2", color: "#991b1b" },
                  ].map((s) => (
                    <div key={s.label} style={{ flex: 1, backgroundColor: s.bg, borderRadius: "8px", padding: "12px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: "14px" }}>{s.icon}</div>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: "10px", color: "#666" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Pending docs highlight */}
                {pendingDocs.length > 0 && (
                  <div style={{ margin: "0 28px 16px", backgroundColor: "#FFF7ED", border: "1px solid #FDBA74", borderRadius: "8px", padding: "16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: "#9a3412", marginBottom: "10px" }}>
                      ⚠️ รายการที่ต้องแนบเอกสารเพิ่ม ({pendingDocs.length})
                    </div>
                    <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #FDBA74" }}>
                          <th style={{ textAlign: "left", padding: "4px 6px", color: "#78350f" }}>TXN</th>
                          <th style={{ textAlign: "left", padding: "4px 6px", color: "#78350f" }}>Date</th>
                          <th style={{ textAlign: "left", padding: "4px 6px", color: "#78350f" }}>Merchant</th>
                          <th style={{ textAlign: "right", padding: "4px 6px", color: "#78350f" }}>Amount</th>
                          <th style={{ textAlign: "left", padding: "4px 6px", color: "#78350f" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingDocs.map((t) => (
                          <tr key={t.id} style={{ borderBottom: "1px solid #FED7AA" }}>
                            <td style={{ padding: "6px", fontFamily: "monospace", color: "#78350f" }}>{t.id}</td>
                            <td style={{ padding: "6px", color: "#78350f" }}>{t.date}</td>
                            <td style={{ padding: "6px", color: "#78350f" }}>{t.merchant}</td>
                            <td style={{ padding: "6px", textAlign: "right", color: "#78350f" }}>฿{t.amount.toLocaleString()}</td>
                            <td style={{ padding: "6px" }}>
                              <span style={{ backgroundColor: "#FFEDD5", color: "#9a3412", fontSize: "10px", padding: "2px 6px", borderRadius: "9999px", fontWeight: 600 }}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ marginTop: "12px", textAlign: "center" }}>
                      <span style={{ display: "inline-block", backgroundColor: "#E63946", color: "#fff", fontSize: "12px", fontWeight: 600, padding: "8px 20px", borderRadius: "6px" }}>
                        📎 ไปแนบเอกสาร →
                      </span>
                    </div>
                  </div>
                )}

                {/* All transactions */}
                <div style={{ padding: "0 28px 16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1a1a1a", marginBottom: "10px" }}>
                    รายการทั้งหมดในเดือนนี้ ({mockTransactions.length} รายการ)
                  </div>
                  <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                        <th style={{ textAlign: "left", padding: "6px", color: "#374151" }}>TXN</th>
                        <th style={{ textAlign: "left", padding: "6px", color: "#374151" }}>Date</th>
                        <th style={{ textAlign: "left", padding: "6px", color: "#374151" }}>Merchant</th>
                        <th style={{ textAlign: "right", padding: "6px", color: "#374151" }}>Amount</th>
                        <th style={{ textAlign: "left", padding: "6px", color: "#374151" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTransactions.map((t, i) => (
                        <tr key={t.id} style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                          <td style={{ padding: "6px", fontFamily: "monospace", color: "#374151" }}>{t.id}</td>
                          <td style={{ padding: "6px", color: "#374151" }}>{t.date}</td>
                          <td style={{ padding: "6px", color: "#374151" }}>{t.merchant}</td>
                          <td style={{ padding: "6px", textAlign: "right", fontWeight: 600, color: "#374151" }}>฿{t.amount.toLocaleString()}</td>
                          <td style={{ padding: "6px" }}>{statusBadge(t.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: "2px solid #374151" }}>
                        <td colSpan={3} style={{ padding: "8px 6px", fontWeight: "bold", fontSize: "12px", color: "#1a1a1a" }}>Total Amount</td>
                        <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: "bold", fontSize: "12px", color: "#1a1a1a" }}>฿{totalAmount.toLocaleString()}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Footer */}
                <div style={{ backgroundColor: "#f9fafb", padding: "16px 28px", borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>หากมีข้อสงสัย กรุณาติดต่อทีม Finance</div>
                  <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px" }}>© CPAxtra — Corporate Card System</div>
                </div>
              </div>

              {/* Send test button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => toast({ title: "✅ Test email sent", description: "Test email sent to nattapong@company.com" })}
                >
                  <Send className="h-4 w-4 mr-2" />
                  📤 Send Test to: nattapong@company.com
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
