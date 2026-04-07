import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Info, Eye, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const mockPending = [
  { txn: "TXN20260301001", requester: "Somying P.", desc: "Airline — Domestic BKK→CNX", amount: 8500, submitted: "01/03/2569" },
  { txn: "TXN20260301002", requester: "Nattapon W.", desc: "Car Rental 3 days Rayong", amount: 12000, submitted: "02/03/2569" },
  { txn: "TXN20260305001", requester: "Kannika T.", desc: "Airline — Overseas BKK→SIN", amount: 42500, submitted: "05/03/2569" },
  { txn: "TXN20260310001", requester: "Somying P.", desc: "Car Rental 2 days Pattaya", amount: 9200, submitted: "10/03/2569" },
];

const mockApproved = [
  { txn: "TXN20260301003", requester: "Wichai C.", desc: "Business Travel Hotel", amount: 4200, approvedOn: "03/03/2569" },
  { txn: "TXN20260302001", requester: "Pim D.", desc: "Team Lunch Finance Dept", amount: 3800, approvedOn: "08/03/2569" },
];

const totalAssigned = mockPending.length + mockApproved.length;
const totalPendingAmount = mockPending.reduce((s, t) => s + t.amount, 0);

export default function MonthlyApproverSummaryPanel() {
  const [enabled, setEnabled] = useState(false);
  const [sendDay, setSendDay] = useState(8);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold">Monthly Approver Summary — Email Setup</h2>
        <p className="text-sm text-muted-foreground">
          Send each approver a monthly digest of claims they are responsible for reviewing.
        </p>
      </div>

      {/* Toggle */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Send className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Enable Monthly Approver Digest</p>
                <p className="text-xs text-muted-foreground">
                  Send a monthly summary email to each approver showing pending and reviewed claims
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
                <p className="text-xs text-muted-foreground">Day of each month to send the digest</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">Recommended: 1 day before cardholder summary (day 9)</p>
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
          Only claims assigned to each approver are included. Policy auto-outcomes (Auto Approved / Auto Rejected) are excluded.
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
              <div className="mx-auto max-w-[600px] border rounded-lg overflow-hidden bg-white shadow-md" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                {/* Header */}
                <div style={{ backgroundColor: "#E63946", padding: "24px 28px", textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "bold", color: "#fff", letterSpacing: "2px" }}>makro</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)", marginTop: "4px" }}>Corporate Card Expense Management</div>
                </div>

                {/* Title */}
                <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid #eee" }}>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1a1a1a" }}>สรุปรายการรออนุมัติประจำเดือน</div>
                  <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>มีนาคม 2569 | Somying Kaewsai (Approver)</div>
                </div>

                {/* Summary stats */}
                <div style={{ padding: "16px 28px", display: "flex", gap: "10px" }}>
                  {[
                    { icon: "📋", label: "Total Assigned", value: totalAssigned, bg: "#f0f4f8", color: "#334155" },
                    { icon: "⏳", label: "Pending Approval", value: mockPending.length, bg: "#eff6ff", color: "#1e40af" },
                    { icon: "✅", label: "Approved", value: mockApproved.length, bg: "#dcfce7", color: "#166534" },
                    { icon: "❌", label: "Rejected", value: 0, bg: "#fef2f2", color: "#991b1b" },
                  ].map((s) => (
                    <div key={s.label} style={{ flex: 1, backgroundColor: s.bg, borderRadius: "8px", padding: "12px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: "14px" }}>{s.icon}</div>
                      <div style={{ fontSize: "18px", fontWeight: "bold", color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: "10px", color: "#666" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Pending section */}
                <div style={{ margin: "0 28px 16px", backgroundColor: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1e40af", marginBottom: "10px" }}>
                    ⏳ รายการที่รออนุมัติจากคุณ ({mockPending.length})
                  </div>
                  <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #93C5FD" }}>
                        {["TXN", "Requester", "Description", "Amount", "Submitted"].map((h) => (
                          <th key={h} style={{ textAlign: h === "Amount" ? "right" : "left", padding: "4px 6px", color: "#1e3a5f" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mockPending.map((t) => (
                        <tr key={t.txn} style={{ borderBottom: "1px solid #BFDBFE" }}>
                          <td style={{ padding: "6px", fontFamily: "monospace", color: "#1e3a5f", fontSize: "10px" }}>{t.txn}</td>
                          <td style={{ padding: "6px", color: "#1e3a5f" }}>{t.requester}</td>
                          <td style={{ padding: "6px", color: "#1e3a5f" }}>{t.desc}</td>
                          <td style={{ padding: "6px", textAlign: "right", color: "#1e3a5f" }}>฿{t.amount.toLocaleString()}</td>
                          <td style={{ padding: "6px", color: "#1e3a5f" }}>{t.submitted}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: "8px", fontSize: "12px", fontWeight: "bold", color: "#1e40af", textAlign: "right" }}>
                    Total Pending Amount: ฿{totalPendingAmount.toLocaleString()}
                  </div>
                  <div style={{ marginTop: "12px", textAlign: "center" }}>
                    <span style={{ display: "inline-block", backgroundColor: "#E63946", color: "#fff", fontSize: "12px", fontWeight: 600, padding: "8px 20px", borderRadius: "6px" }}>
                      ✅ ไปอนุมัติรายการ →
                    </span>
                  </div>
                </div>

                {/* Approved section */}
                <div style={{ margin: "0 28px 16px", backgroundColor: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "#166534", marginBottom: "10px" }}>
                    ✅ รายการที่อนุมัติแล้วเดือนนี้ ({mockApproved.length})
                  </div>
                  <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #86EFAC" }}>
                        {["TXN", "Requester", "Description", "Amount", "Approved On"].map((h) => (
                          <th key={h} style={{ textAlign: h === "Amount" ? "right" : "left", padding: "4px 6px", color: "#14532d" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mockApproved.map((t) => (
                        <tr key={t.txn} style={{ borderBottom: "1px solid #BBF7D0" }}>
                          <td style={{ padding: "6px", fontFamily: "monospace", color: "#14532d", fontSize: "10px" }}>{t.txn}</td>
                          <td style={{ padding: "6px", color: "#14532d" }}>{t.requester}</td>
                          <td style={{ padding: "6px", color: "#14532d" }}>{t.desc}</td>
                          <td style={{ padding: "6px", textAlign: "right", color: "#14532d" }}>฿{t.amount.toLocaleString()}</td>
                          <td style={{ padding: "6px", color: "#14532d" }}>{t.approvedOn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Notes */}
                <div style={{ margin: "0 28px 16px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "#1a1a1a", marginBottom: "8px" }}>📌 หมายเหตุ</div>
                  <ul style={{ fontSize: "11px", color: "#4b5563", margin: 0, paddingLeft: "18px", lineHeight: "1.7" }}>
                    <li>รายการที่ถูก Auto Approve/Reject โดยระบบจะไม่ปรากฏในรายงานนี้</li>
                    <li>หากมีรายการค้างนานเกิน 7 วัน ระบบจะส่ง Reminder อีกครั้ง</li>
                  </ul>
                </div>

                {/* Footer */}
                <div style={{ backgroundColor: "#f9fafb", padding: "16px 28px", borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>หากมีข้อสงสัย กรุณาติดต่อทีม Finance</div>
                  <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px" }}>© CPAxtra — Corporate Card System</div>
                </div>
              </div>

              {/* Send test */}
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
