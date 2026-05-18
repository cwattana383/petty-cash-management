import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Check, AlertTriangle, CreditCard, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { formatBEDate, formatBEDateTime } from "@/lib/utils";
import { VAT_TYPE_CONFIG } from "@/lib/vat-type-config";
import OcrVerifyModal from "@/components/claims/OcrVerifyModal";
import { mockCompanyIdentities } from "@/components/admin/EntityTypes";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

/* ─── Local mock lookup (mirrors AccountingReview data) ─── */
interface ApprovalHistoryEvent {
  id: string;
  actor: 'system' | 'cardholder' | 'manager' | 'finance';
  actorName?: string;
  title: string;
  statusBadge?: string;
  timestamp: string;
  message?: string;
  isCurrent?: boolean;
}

interface AccountingItem {
  id: string;
  merchantName: string;
  description: string;
  amount: number;
  status: string;
  date: string;
  fileName: string;
  docType: string;
  // Optional rich-detail overrides (all fall back to existing hardcoded literals)
  approvalStatus?: string;
  approvalStatusTone?: 'success' | 'warning' | 'info' | 'neutral';
  documentStatus?: string;
  documentStatusTone?: 'success' | 'warning';
  cardholderName?: string;
  purpose?: string;
  expenseType?: string;
  subExpenseType?: string;
  vatType?: string;
  glAccount?: string;
  project?: string | null;
  vatAmount?: number;
  transactionDate?: string;
  verificationResults?: {
    taxIdMatched: boolean;
    addressMatched: boolean;
    amountMatched: boolean;
    bankAmount: number;
    documentAmount: number;
    amountToleranceUsed: string;
    invoiceDateInRange: boolean;
    overallStatus: 'Verified' | 'Failed' | 'Pending';
  };
  approvalHistory?: ApprovalHistoryEvent[];
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
  { id: "TXN20260227025", merchantName: "Stone Hill Golf Club", description: "Sporting and Recreational Camps", amount: 55000, status: "Final Rejected", date: "2026-02-27", fileName: "golf_invoice.pdf", docType: "Tax Invoice" },
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
  { id: "TXN2026050100001", merchantName: "Grab Taxi", description: "Client meeting transport", amount: 500.00, status: "Accounting Review", date: "2026-05-01", fileName: "GrabTaxi_Receipt_20260501.pdf", docType: "Receipt" },
  { id: "TXN2026050200002", merchantName: "Sizzler", description: "Team lunch", amount: 1250.00, status: "Accounting Review", date: "2026-05-02", fileName: "Sizzler_TaxInvoice_20260502.pdf", docType: "Tax Invoice" },
  { id: "TXN2026050300003", merchantName: "B2S", description: "Office supplies", amount: 680.00, status: "Accounting Review", date: "2026-05-03", fileName: "B2S_TaxInvoice_20260503.pdf", docType: "Tax Invoice" },
  { id: "TXN2026051300019", merchantName: "Udemy", description: "Training course", amount: 7800.00, status: "Accounting Review", date: "2026-05-13", fileName: "Udemy_Invoice_20260513.pdf", docType: "Tax Invoice" },
  { id: "TXN2026051400020", merchantName: "Adobe", description: "Software subscription", amount: 1990.00, status: "Accounting Review", date: "2026-05-14", fileName: "Adobe_TaxInvoice_20260514.pdf", docType: "Tax Invoice" },
  { id: "TXN2026051400021", merchantName: "EasyPass", description: "Parking fee", amount: 120.00, status: "Accounting Review", date: "2026-05-14", fileName: "EasyPass_Receipt_20260514.pdf", docType: "Receipt" },
  { id: "TXN2026051500022", merchantName: "Central Department Store", description: "Client gift", amount: 2500.00, status: "Accounting Review", date: "2026-05-15", fileName: "Central_TaxInvoice_20260515.pdf", docType: "Tax Invoice" },
  { id: "TXN2026051500025", merchantName: "MK Restaurants", description: "Internal lunch meeting", amount: 890.00, status: "Accounting Review", date: "2026-05-15", fileName: "MK_TaxInvoice_20260515.pdf", docType: "Tax Invoice" },
  {
    id: "TXN2026051600040",
    merchantName: "Marriott Hotel Bangkok",
    description: "Lodging — Hotels and Motels",
    amount: 8500.00,
    status: "Accounting Review",
    date: "2026-05-16",
    fileName: "Marriott_TaxInvoice_20260516.pdf",
    docType: "Tax Invoice",
    approvalStatus: "Manager Approved",
    approvalStatusTone: "success",
    documentStatus: "Verified",
    documentStatusTone: "success",
    cardholderName: "Wilasinee Pratyawongchai",
    purpose: "Client dinner with vendor partners",
    expenseType: "Entertainment",
    subExpenseType: "Client Meals",
    vatType: "Claim 100",
    glAccount: "5400-001 — Entertainment - Client Meals",
    project: null,
    vatAmount: 556.07,
    transactionDate: "2026-05-16",
    verificationResults: {
      taxIdMatched: true,
      addressMatched: true,
      amountMatched: true,
      bankAmount: 8500.00,
      documentAmount: 8500.00,
      amountToleranceUsed: "5%",
      invoiceDateInRange: true,
      overallStatus: "Verified",
    },
    approvalHistory: [
      { id: "evt-040-6", actor: "manager", actorName: "Theem Veokeki", title: "Manager approved", statusBadge: "MANAGER_APPROVED", timestamp: "2026-05-17T10:30:00Z" },
      { id: "evt-040-5", actor: "cardholder", actorName: "Wilasinee Pratyawongchai", title: "Submitted for manager approval", statusBadge: "PENDING_APPROVAL", timestamp: "2026-05-16T19:00:00Z" },
      { id: "evt-040-4", actor: "cardholder", actorName: "Wilasinee Pratyawongchai", title: "Document verified", statusBadge: "VERIFIED", message: "Marriott_TaxInvoice_20260516.pdf", timestamp: "2026-05-16T18:35:00Z" },
      { id: "evt-040-3", actor: "cardholder", actorName: "Wilasinee Pratyawongchai", title: "Document uploaded", statusBadge: "UPLOADED", message: "Marriott_TaxInvoice_20260516.pdf", timestamp: "2026-05-16T18:30:00Z" },
      { id: "evt-040-2", actor: "cardholder", actorName: "Wilasinee Pratyawongchai", title: "Claim created", statusBadge: "NOT_STARTED", timestamp: "2026-05-16T18:00:00Z" },
      { id: "evt-040-1", actor: "system", title: "Transaction imported from bank file", statusBadge: "NOT_STARTED", timestamp: "2026-05-16T00:15:00Z" },
    ],
  },
  {
    id: "TXN2026051700041",
    merchantName: "7-Eleven Bangkok",
    description: "Convenience Store",
    amount: 320.00,
    status: "Accounting Review",
    date: "2026-05-17",
    fileName: "7Eleven_Receipt_20260517.pdf",
    docType: "Receipt",
    approvalStatus: "Auto Approved",
    approvalStatusTone: "success",
    documentStatus: "Verified",
    documentStatusTone: "success",
    cardholderName: "Anong Srisuk",
    purpose: "Office snacks for team meeting",
    expenseType: "Office Supplies",
    subExpenseType: "Office Snacks",
    vatType: "Claim 100",
    glAccount: "5100-002 — Office Supplies",
    project: null,
    vatAmount: 20.93,
    transactionDate: "2026-05-17",
    verificationResults: {
      taxIdMatched: true,
      addressMatched: true,
      amountMatched: true,
      bankAmount: 320.00,
      documentAmount: 320.00,
      amountToleranceUsed: "5%",
      invoiceDateInRange: true,
      overallStatus: "Verified",
    },
    approvalHistory: [
      { id: "evt-041-5", actor: "system", title: "Policy auto-approved (below threshold)", statusBadge: "AUTO_APPROVED", timestamp: "2026-05-17T10:05:00Z" },
      { id: "evt-041-4", actor: "cardholder", actorName: "Anong Srisuk", title: "Document verified", statusBadge: "VERIFIED", message: "7Eleven_Receipt_20260517.pdf", timestamp: "2026-05-17T10:05:00Z" },
      { id: "evt-041-3", actor: "cardholder", actorName: "Anong Srisuk", title: "Document uploaded", statusBadge: "UPLOADED", message: "7Eleven_Receipt_20260517.pdf", timestamp: "2026-05-17T10:00:00Z" },
      { id: "evt-041-2", actor: "cardholder", actorName: "Anong Srisuk", title: "Claim created", statusBadge: "NOT_STARTED", timestamp: "2026-05-17T09:30:00Z" },
      { id: "evt-041-1", actor: "system", title: "Transaction imported from bank file", statusBadge: "NOT_STARTED", timestamp: "2026-05-17T00:15:00Z" },
    ],
  },
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
  const [project, setProject] = useState("");
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

  const mockPurpose = item.purpose ?? item.description;
  const toneMap = (t?: 'success' | 'warning' | 'info' | 'neutral'): 'success' | 'warning' | 'neutral' | 'destructive' =>
    t === 'info' ? 'neutral' : (t ?? 'warning');

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
          <SectionDivider num={1} label="Transaction Info" />
          <Card className="bg-muted/40 border border-border rounded-xl">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <p className="text-[13px] font-semibold text-foreground">Transaction Info (auto-filled)</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 text-[13px]">
                <Row label="Transaction No." value={item.id} className="md:col-start-1 md:row-start-1" />
                <Row label="Date" value={formatBEDate(item.date)} className="md:col-start-2 md:row-start-1" />
                <Row label="Merchant" value={item.merchantName} className="md:col-start-1 md:row-start-2" />
                <Row label="Amount" value={`${fmt(item.amount)} THB`} className="md:col-start-2 md:row-start-2" />
                <Row label="MCC Description" value={item.description} className="sm:col-span-2 md:col-start-1 md:col-end-3 md:row-start-3" />
                <StatusBadgeField label="Approval Status" value={item.approvalStatus ?? "Pending Approval"} tone={toneMap(item.approvalStatusTone)} className="md:col-start-3 md:row-start-1" />
                <StatusBadgeField label="Document Status" value={item.documentStatus ?? "Incomplete"} tone={toneMap(item.documentStatusTone)} className="md:col-start-3 md:row-start-2" />
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
                <ReadOnlyField label="Expense Type" value={item.expenseType ?? "Travel"} />
                <ReadOnlyField label="Sub Expense Type" value={item.subExpenseType ?? "Taxi / Ride-Hailing"} />

                {/* VAT Type — read-only when item provides override, otherwise editable */}
                {item.vatType ? (
                  <ReadOnlyField label="VAT Type" value={item.vatType} />
                ) : (
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
                )}

                {/* GL Account — read-only when item provides override, otherwise editable */}
                {item.glAccount ? (
                  <ReadOnlyField label="GL Account" value={item.glAccount} />
                ) : (
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
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-foreground">Project <span className="text-destructive">*</span></Label>
                <Select value={project} onValueChange={setProject}>
                  <SelectTrigger className="text-[13px]"><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HoReCa" className="text-[13px]">HoReCa</SelectItem>
                    <SelectItem value="Shohuay" className="text-[13px]">Shohuay</SelectItem>
                    <SelectItem value="Top300" className="text-[13px]">Top300</SelectItem>
                  </SelectContent>
                </Select>
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

                  {item.verificationResults ? (
                    <>
                      <div className="space-y-1.5">
                        <p className="text-[13px] font-semibold text-foreground">Validation Results</p>
                        <div className="space-y-1">
                          <p className="text-[13px] text-foreground">{item.verificationResults.taxIdMatched ? "✅" : "❌"} Tax ID {item.verificationResults.taxIdMatched ? "matched" : "mismatch"} — {activeEntity?.legalNameEn ?? "Company"} confirmed</p>
                          <p className="text-[13px] text-foreground">{item.verificationResults.addressMatched ? "✅" : "❌"} {item.verificationResults.addressMatched ? "Address found in document" : "Address not found in document"}</p>
                          <p className="text-[13px] text-foreground">{item.verificationResults.amountMatched ? "✅" : "❌"} Amount {item.verificationResults.amountMatched ? "matched" : "mismatch"} — within {item.verificationResults.amountToleranceUsed} tolerance (Bank: ฿{fmt(item.verificationResults.bankAmount)} / Document: ฿{fmt(item.verificationResults.documentAmount)})</p>
                          <p className="text-[13px] text-foreground">{item.verificationResults.invoiceDateInRange ? "✅" : "❌"} Invoice date {item.verificationResults.invoiceDateInRange ? "within acceptable range" : "out of acceptable range"}</p>
                        </div>
                      </div>
                      {item.verificationResults.overallStatus === "Verified" && (
                        <p className="text-[13px] text-emerald-600 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          Document verified.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
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
                  )}
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

function StatusBadgeField({ label, value, tone, className }: {
  label: string;
  value: string;
  tone: "neutral" | "warning" | "success" | "destructive";
  className?: string;
}) {
  const toneClass = {
    neutral: "bg-slate-100 text-slate-700",
    warning: "bg-amber-100 text-amber-800",
    success: "bg-emerald-100 text-emerald-800",
    destructive: "bg-red-100 text-red-800",
  }[tone];
  return (
    <div className={className}>
      <p className="text-muted-foreground text-[12px]">{label}</p>
      <Badge variant="outline" className={`${toneClass} border-transparent font-medium mt-0.5`}>{value}</Badge>
    </div>
  );
}
