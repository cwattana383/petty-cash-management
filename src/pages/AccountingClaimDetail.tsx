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
import { useClaims } from "@/lib/claims-context";
import { VAT_TYPE_CONFIG } from "@/lib/vat-type-config";
import OcrVerifyModal, { type OcrExtractedData } from "@/components/claims/OcrVerifyModal";
import { mockCompanyIdentities } from "@/components/admin/EntityTypes";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
  const { getClaimById, updateClaim } = useClaims();
  const { toast } = useToast();
  const claim = getClaimById(id || "");

  const [vatType, setVatType] = useState("claim_100");
  const [glAccount, setGlAccount] = useState("5300-002");
  const [showExceptionInput, setShowExceptionInput] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [docModal, setDocModal] = useState(false);

  const activeEntity = mockCompanyIdentities.find((e) => e.status === "Active");

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">Transaction not found</p>
        <Button variant="link" onClick={() => navigate("/accounting")}>Back to Accounting Review</Button>
      </div>
    );
  }

  const mockExpenseType = "Travel";
  const mockSubExpenseType = "Taxi / Ride-Hailing";
  const mockPurpose = claim.purpose || "Taxicabs and Limousines";

  const handleApproveERP = () => {
    updateClaim(claim.id, { status: "Ready for ERP" as any });
    toast({ title: "Sent to ERP", description: `${claim.claimNo} has been approved and marked Ready for ERP.` });
    navigate("/accounting");
  };

  const handleException = () => {
    if (!exceptionReason.trim()) return;
    updateClaim(claim.id, { status: "Exception" as any });
    toast({ title: "Flagged as Exception", description: `${claim.claimNo} has been flagged as exception.` });
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
              {claim.claimNo} · {claim.purpose || "Taxicabs and Limousines"}
            </h1>
          </div>
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 shrink-0">
            {claim.status}
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
                <Row label="Transaction No." value={claim.claimNo} />
                <Row label="Date" value={formatBEDate(claim.createdDate)} />
                <Row label="Merchant" value={claim.merchantName || "GRAB TAXI"} />
                <Row label="Amount" value={`${fmt(claim.totalAmount)} THB`} />
                <Row label="MCC Description" value={claim.purpose || "Taxicabs and Limousines"} className="sm:col-span-2" />
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
                <ReadOnlyField label="Expense Type" value={mockExpenseType} />
                <ReadOnlyField label="Sub Expense Type" value={mockSubExpenseType} />

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
              <div
                className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 cursor-pointer hover:bg-emerald-100/60 transition-colors"
                onClick={() => setDocModal(true)}
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground">receipt_taxi.pdf</p>
                  <p className="text-xs text-muted-foreground">Tax Invoice • 1.2 MB</p>
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
                  <p className="text-[13px] text-foreground">✅ Amount matched — within 5% tolerance (Bank: ฿{fmt(claim.totalAmount)} / Document: ฿{fmt(claim.totalAmount)})</p>
                  <p className="text-[13px] text-foreground">✅ Invoice date within acceptable range</p>
                </div>
              </div>

              <p className="text-[13px] text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Document verified.
              </p>
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
      <OcrVerifyModal
        open={docModal}
        onClose={() => setDocModal(false)}
        readOnly
        fileName="receipt_taxi.pdf"
        fileType="PDF"
        initialData={{
          taxInvoiceNo: "IV-2026-00421",
          date: "01/03/2569",
          vendorName: "Grab Taxi",
          netAmount: fmt(claim.totalAmount / 1.07),
          vatAmount: fmt(claim.totalAmount - claim.totalAmount / 1.07),
          totalAmount: fmt(claim.totalAmount),
          buyerTaxId: "0107536000315",
          buyerAddress: "CPAxtra Public Company Limited, Bangkok",
        }}
        validationContext={activeEntity ? {
          companyTaxId: activeEntity.taxId,
          companyAddress: activeEntity.address,
          bankAmount: claim.totalAmount,
          transactionDate: claim.createdDate,
        } : undefined}
      />
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
