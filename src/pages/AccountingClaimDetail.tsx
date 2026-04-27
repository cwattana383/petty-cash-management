import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Check, AlertTriangle, CreditCard, CheckCircle2,
} from "lucide-react";
import { formatBEDate } from "@/lib/utils";
import { VAT_TYPE_CONFIG } from "@/lib/vat-type-config";
import OcrVerifyModal from "@/components/claims/OcrVerifyModal";
import { mockCompanyIdentities } from "@/components/admin/EntityTypes";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

/* ─── Local mock lookup (mirrors AccountingReview data) ─── */
interface AccountingItem {
  id: string;
  merchantName: string;
  description: string;
  amount: number;
  status: string;
  date: string;
  fileName: string;
  docType: string;
}

const ACCOUNTING_ITEMS: AccountingItem[] = [
  { id: "TXN2026042700003", merchantName: "EASY PASS TOPUP", description: "Tolls and Bridge Fees", amount: 500, status: "Auto Approved", date: "2026-04-28", fileName: "", docType: "" },
  { id: "TXN2026042700001", merchantName: "STATE RAILWAY OF THAILAND", description: "Passenger Railways", amount: 680, status: "Auto Approved", date: "2026-04-28", fileName: "", docType: "" },
  { id: "TXN2026042800008", merchantName: "STARBUCKS THAILAND", description: "Fast Food Restaurants", amount: 285, status: "Auto Approved", date: "2026-04-28", fileName: "", docType: "" },
  { id: "TXN2026042700011", merchantName: "THB", description: "3577", amount: 19, status: "Required Approval", date: "2026-04-28", fileName: "", docType: "" },
  { id: "TXN2026042700009", merchantName: "THB", description: "3075", amount: 18, status: "Required Approval", date: "2026-04-28", fileName: "", docType: "" },
  { id: "TXN2026042800013", merchantName: "THB", description: "5812", amount: 2, status: "Required Approval", date: "2026-04-28", fileName: "", docType: "" },
  { id: "TXN2026042800014", merchantName: "7-ELEVEN SINGAPORE", description: "Grocery Stores and Supermarkets", amount: 495.8, status: "Required Approval", date: "2026-04-28", fileName: "", docType: "" },
  { id: "TXN20260227071", merchantName: "Top", description: "Grocery Stores", amount: 799, status: "Auto Approved", date: "2026-02-27", fileName: "grocery_receipt.pdf", docType: "Tax Invoice" },
  { id: "TXN20260227078", merchantName: "KFC", description: "Fast Food Restaurants", amount: 279, status: "Auto Approved", date: "2026-02-27", fileName: "kfc_tax_invoice.pdf", docType: "Tax Invoice" },
  { id: "TXN20260227013", merchantName: "Suki Teenoi", description: "Eating Places and Restaurants", amount: 499, status: "Auto Approved", date: "2026-02-27", fileName: "suki_receipt.pdf", docType: "Tax Invoice" },
  { id: "TXN20260227124", merchantName: "Good Car Service", description: "Car Rental Agencies", amount: 3000, status: "Auto Approved", date: "2026-02-27", fileName: "car_rental_invoice.pdf", docType: "Tax Invoice" },
  { id: "TXN20260227065", merchantName: "Rama 9 Hospital", description: "Hospitals", amount: 2500, status: "Auto Approved", date: "2026-02-27", fileName: "hospital_receipt.pdf", docType: "Tax Invoice" },
  { id: "TXN20260227088", merchantName: "Lazada Express", description: "Courier Services", amount: 12500, status: "Exception", date: "2026-02-27", fileName: "lazada_invoice.pdf", docType: "Tax Invoice" },
  { id: "TXN20260227091", merchantName: "JD Central", description: "Computer Software Stores", amount: 8900, status: "Exception", date: "2026-02-27", fileName: "jd_tax_invoice.pdf", docType: "Tax Invoice" },
  { id: "TXN20260227095", merchantName: "Flash Express", description: "Courier Services", amount: 3200, status: "Exception", date: "2026-02-27", fileName: "flash_receipt.pdf", docType: "Tax Invoice" },
  { id: "TXN20260227114", merchantName: "The Nine", description: "Drinking Places (Bars)", amount: 1250, status: "Reject", date: "2026-02-27", fileName: "bar_receipt.pdf", docType: "Receipt" },
  { id: "TXN20260227025", merchantName: "Stone Hill Golf Club", description: "Sporting and Recreational Camps", amount: 55000, status: "Final Reject", date: "2026-02-27", fileName: "golf_invoice.pdf", docType: "Tax Invoice" },
  { id: "TXN20250129001", merchantName: "GRAB TAXI", description: "Taxicabs and Limousines", amount: 1500, status: "Pending Invoice", date: "2026-02-28", fileName: "", docType: "" },
  { id: "TXN20250129002", merchantName: "MARRIOTT HOTEL BKK", description: "Hotels and Motels", amount: 3500, status: "Pending Invoice", date: "2026-02-28", fileName: "", docType: "" },
  { id: "TXN20250129003", merchantName: "PTT GAS STATION", description: "Service Stations", amount: 850, status: "Pending Invoice", date: "2026-02-28", fileName: "", docType: "" },
  { id: "TXN20250129004", merchantName: "SOMTUM RESTAURANT", description: "Eating Places and Restaurants", amount: 1250, status: "Pending Invoice", date: "2026-02-28", fileName: "", docType: "" },
  { id: "TXN20250129005", merchantName: "THAI AIRWAYS", description: "Airlines", amount: 15000, status: "Pending Invoice", date: "2026-02-28", fileName: "", docType: "" },
  { id: "TXN20260228001", merchantName: "GRAB TAXI", description: "Taxicabs and Limousines", amount: 1200, status: "Reimbursed", date: "2026-02-15", fileName: "grab_receipt2.pdf", docType: "Tax Invoice" },
  { id: "TXN20260228002", merchantName: "Starbucks", description: "Eating Places and Restaurants", amount: 350, status: "Reimbursed", date: "2026-02-15", fileName: "starbucks_receipt.pdf", docType: "Tax Invoice" },
  { id: "TXN20260227021", merchantName: "Siam Amazing Park", description: "Amusement Parks", amount: 7900, status: "Auto Reject", date: "2026-02-27", fileName: "", docType: "" },
  { id: "TXN20260227002", merchantName: "Tiger Kingdom", description: "Tourist Attractions", amount: 4500, status: "Auto Reject", date: "2026-02-27", fileName: "", docType: "" },
  { id: "TXN20260227053", merchantName: "The Street", description: "Dance Halls", amount: 2500, status: "Auto Reject", date: "2026-02-27", fileName: "", docType: "" },
];

const GL_ACCOUNT_OPTIONS = [
  { code: "5300-001", name: "Travel - Air Ticket" },
  { code: "5300-002", name: "Travel - Ground Transport" },
  { code: "5300-004", name: "Travel - Fuel & EV Charging" },
  { code: "5300-003", name: "Travel - Car Rental" },
  { code: "5300-005", name: "Travel - Courier & Delivery" },
  { code: "5400-001", name: "Meals & Per Diem" },
  { code: "5400-002", name: "Meals - Beverages" },
  { code: "5400-003", name: "Entertainment Expense" },
  { code: "5200-001", name: "Hotel & Accommodation" },
  { code: "5500-001", name: "Personal Expense" },
];

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AccountingClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const item = ACCOUNTING_ITEMS.find((i) => i.id === id);

  const [vatType, setVatType] = useState("claim_100");
  const [glAccount, setGlAccount] = useState("5300-002");
  const [showExceptionInput, setShowExceptionInput] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [docModal, setDocModal] = useState(false);

  const activeEntity = mockCompanyIdentities.find((e) => e.status === "Active");

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">Transaction not found</p>
        <Button variant="link" onClick={() => navigate("/accounting")}>Back to Accounting Review</Button>
      </div>
    );
  }

  const mockPurpose = item.description;

  const handleApproveERP = () => {
    toast({ title: "Sent to ERP", description: `${item.id} has been approved and marked Ready for ERP.` });
    navigate("/accounting");
  };

  const handleException = () => {
    if (!exceptionReason.trim()) return;
    toast({ title: "Flagged as Exception", description: `${item.id} has been flagged as exception.` });
    navigate("/accounting");
  };

  return (
    <div className="pb-32 max-w-5xl mx-auto">
      {/* ══════ STICKY HEADER ══════ */}
      <div className="sticky top-0 z-40 bg-background border-b border-border -mx-4 px-4 md:-mx-6 md:px-6">
        <div className="flex items-center gap-3 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/accounting")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">
              {item.id} · {item.merchantName}
            </h1>
          </div>
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 shrink-0">
            {item.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-8 mt-6">
        {/* ══════ SECTION 1 — CARD TRANSACTION (Read-Only) ══════ */}
        <section>
          <SectionDivider num={1} label="Card Transaction" />
          <Card className="bg-muted/40 border border-border rounded-xl">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <p className="text-[13px] font-semibold text-foreground">Card Transaction (auto-filled)</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
                <Row label="Transaction No." value={item.id} />
                <Row label="Date" value={formatBEDate(item.date)} />
                <Row label="Merchant" value={item.merchantName} />
                <Row label="Amount" value={`${fmt(item.amount)} THB`} />
                <Row label="MCC Description" value={item.description} className="sm:col-span-2" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ══════ SECTION 2 — BUSINESS INFO (Mixed: some read-only, some editable) ══════ */}
        <section>
          <SectionDivider num={2} label="Business Info" />
          <Card className="border border-border rounded-xl">
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-muted-foreground">Purpose</Label>
                <p className="text-[13px] text-foreground">{mockPurpose}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReadOnlyField label="Expense Type" value="Travel" />
                <ReadOnlyField label="Sub Expense Type" value="Taxi / Ride-Hailing" />

                {/* VAT Type — editable */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-muted-foreground">VAT Type</Label>
                  <Select value={vatType} onValueChange={setVatType}>
                    <SelectTrigger className="text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VAT_TYPE_CONFIG.map((v) => (
                        <SelectItem key={v.id} value={v.id} className="text-[13px]">
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* GL Account — editable */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-muted-foreground">GL Account</Label>
                  <Select value={glAccount} onValueChange={setGlAccount}>
                    <SelectTrigger className="text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GL_ACCOUNT_OPTIONS.map((gl) => (
                        <SelectItem key={gl.code} value={gl.code} className="text-[13px]">
                          {gl.code} — {gl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ══════ SECTION 3 — DOCUMENTS (Read-Only) ══════ */}
        <section>
          <SectionDivider num={3} label="Documents" />
          <Card className="border border-border rounded-xl">
            <CardContent className="pt-5 space-y-4">
              {item.fileName ? (
                <>
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 cursor-pointer hover:bg-emerald-100/60 transition-colors"
                    onClick={() => setDocModal(true)}
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground">{item.fileName}</p>
                      <p className="text-xs text-muted-foreground">{item.docType} • 1.2 MB</p>
                    </div>
                    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-600 text-[11px] gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[13px] font-semibold text-foreground">Validation Results</p>
                    <div className="space-y-1">
                      <p className="text-[13px] text-foreground">✅ Tax ID matched — CPAxtra confirmed</p>
                      <p className="text-[13px] text-foreground">✅ CPAxtra address found in document</p>
                      <p className="text-[13px] text-foreground">✅ Amount matched — within 5% tolerance (Bank: ฿{fmt(item.amount)} / Document: ฿{fmt(item.amount)})</p>
                      <p className="text-[13px] text-foreground">✅ Invoice date within acceptable range</p>
                    </div>
                  </div>

                  <p className="text-[13px] text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Document verified.
                  </p>
                </>
              ) : (
                <p className="text-[13px] text-muted-foreground">No documents attached.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* ══════ ACCOUNTING DECISION PANEL (Fixed Bottom) ══════ */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-4 z-50">
        <div className="max-w-5xl mx-auto">
          {showExceptionInput && (
            <div className="mb-3 space-y-2">
              <Label className="text-[13px] font-semibold text-foreground">Exception reason (required)</Label>
              <Textarea
                placeholder="Please describe the reason for flagging this as exception..."
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                className="text-[13px] min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  onClick={handleException}
                  disabled={!exceptionReason.trim()}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setShowExceptionInput((prev) => !prev)}
            >
              <AlertTriangle className="h-4 w-4 mr-1" /> Flag as Exception
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleApproveERP}
            >
              <Check className="h-4 w-4 mr-1" /> Approve & Send to ERP
            </Button>
          </div>
        </div>
      </div>

      {/* Read-only OCR Verify Modal */}
      {item.fileName && (
        <OcrVerifyModal
          open={docModal}
          onClose={() => setDocModal(false)}
          readOnly
          fileName={item.fileName}
          fileType="PDF"
          initialData={{
            taxInvoiceNo: `INV-${item.id.slice(-6)}`,
            date: formatBEDate(item.date),
            vendorName: item.merchantName,
            netAmount: fmt(item.amount / 1.07),
            vatAmount: fmt(item.amount - item.amount / 1.07),
            totalAmount: fmt(item.amount),
            buyerTaxId: "0107536000315",
            buyerAddress: "CPAxtra Public Company Limited, Bangkok",
          }}
          validationContext={activeEntity ? {
            companyTaxId: activeEntity.taxIds?.[0]?.taxId || "",
            companyAddress: activeEntity.addressTh?.addressLine1 || "",
            bankAmount: item.amount,
            transactionDate: item.date,
          } : undefined}
        />
      )}
    </div>
  );
}

/* ─── Helpers ─── */
function SectionDivider({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
        {num}
      </span>
      <h2 className="text-[15px] font-bold text-foreground">{label}</h2>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-muted-foreground text-[12px]">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-semibold text-muted-foreground">{label}</Label>
      <p className="text-[13px] text-foreground border border-border rounded-md px-3 py-2 bg-muted/30">{value}</p>
    </div>
  );
}
