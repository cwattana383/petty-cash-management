import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft, Check, X, MessageSquare, Clock, CheckCircle, XCircle,
  AlertCircle, Send, AlertTriangle, Upload, FileText,
  Loader2, CheckCircle2, Info, CreditCard, Trash2
} from "lucide-react";
import { formatBEDate } from "@/lib/utils";
import { useClaims } from "@/lib/claims-context";
import { getLevel1Options, getLevel2Options, getExpenseConfig } from "@/lib/expense-type-config";
import { VAT_TYPE_CONFIG, getDefaultVatType } from "@/lib/vat-type-config";
import ExpenseLineItems from "@/components/claims/ExpenseLineItems";
import OcrVerifyModal, { type OcrExtractedData, type ValidationContext } from "@/components/claims/OcrVerifyModal";
import { mockCompanyIdentities } from "@/components/admin/EntityTypes";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

/* ─── Types ─── */
type DocOcrStatus = "processing" | "to_verify" | "verified" | "wrong_doc_type";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  ocrStatus: DocOcrStatus;
  ocrData?: OcrExtractedData;
  detectedDocType?: string;
}

const REQUIRED_DOC_ID = "receipt_tax_invoice";
const ACCEPTED_DOC_TYPES = ["Receipt", "Tax Invoice", "Receipt / Tax Invoice", "Abbreviated Receipt"];

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

const actionConfig: Record<string, { color: string; icon: React.ElementType }> = {
  Pending: { color: "border-yellow-400 bg-yellow-50", icon: Clock },
  Approved: { color: "border-green-400 bg-green-50", icon: CheckCircle },
  Rejected: { color: "border-red-400 bg-red-50", icon: XCircle },
  "Request Info": { color: "border-blue-400 bg-blue-50", icon: AlertCircle },
  Delegated: { color: "border-purple-400 bg-purple-50", icon: Send },
};


export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isApproverView = searchParams.get("mode") === "approve";
  const { getClaimById, updateClaim } = useClaims();
  const { toast } = useToast();
  const claim = getClaimById(id || "");

  // Action dialog
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: "approve" | "reject" | "info" }>({ open: false, type: "approve" });
  const [comment, setComment] = useState("");

  // Step 2 fields
  const [purpose, setPurpose] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [subExpenseType, setSubExpenseType] = useState("");
  const [glAccount, setGlAccount] = useState("");
  const [vatType, setVatType] = useState("");

  // Step 3
  const [lineItemsValid, setLineItemsValid] = useState(true);
  const [lineItemsTotal, setLineItemsTotal] = useState(0);

  // Step 4 documents
  const [docUploads, setDocUploads] = useState<Record<string, UploadedFile>>({});
  
  const [verifyModal, setVerifyModal] = useState<{ open: boolean; docId: string } | null>(null);

  // Approver view state
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approverDocModal, setApproverDocModal] = useState(false);
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);
  const [requestInfoMessage, setRequestInfoMessage] = useState("");
  const [requestInfoTouched, setRequestInfoTouched] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derived config
  const selectedConfig = expenseType && subExpenseType ? getExpenseConfig(expenseType, subExpenseType) : null;
  const isAutoReject = selectedConfig?.policyRule === "Auto Reject";
  const allOptionalDocs = selectedConfig?.optionalDocs || [];
  const requiredDoc = docUploads[REQUIRED_DOC_ID];
  const requiredDocVerified = requiredDoc?.ocrStatus === "verified";
  const anyDocProcessingOrToVerify = requiredDoc?.ocrStatus === "processing" || requiredDoc?.ocrStatus === "to_verify" || requiredDoc?.ocrStatus === "wrong_doc_type";

  // Step completion
  const step1Complete = true;
  const step2Complete = !!purpose.trim() && !!expenseType && !!subExpenseType && !!glAccount && !!vatType;
  const step3Complete = lineItemsValid && selectedConfig != null && !isAutoReject;
  const step4Complete = requiredDocVerified && step2Complete;

  const canSubmit = step2Complete && step3Complete && step4Complete && !isAutoReject && !anyDocProcessingOrToVerify;

  // Mock OCR data generation
  const activeEntity = mockCompanyIdentities.find((e) => e.status === "Active");

  const generateMockOcrData = (): OcrExtractedData => ({
    taxInvoiceNo: Math.random() > 0.2 ? `INV-${Date.now().toString().slice(-6)}` : "",
    date: Math.random() > 0.1 ? "28/02/2569" : "",
    vendorName: Math.random() > 0.15 ? "GRAB TAXI" : "",
    netAmount: Math.random() > 0.1 ? "1,401.87" : "",
    vatAmount: Math.random() > 0.1 ? "98.13" : "",
    totalAmount: Math.random() > 0.05 ? "1,500.00" : "",
    buyerTaxId: Math.random() > 0.2 ? (activeEntity?.taxId || "0107567000414") : "9999999999999",
    buyerAddress: Math.random() > 0.2 ? "บริษัท ซีพี แอ็กซ์ตร้า จำกัด (มหาชน) 123 Sukhumvit Road Bangkok" : "Unknown Company",
  });

  const simulateDocSlotUpload = useCallback((docId: string, file: File) => {
    const fileSizeStr = file.size < 1024 ? `${file.size} B` : file.size < 1048576 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1048576).toFixed(1)} MB`;
    const newFile: UploadedFile = {
      id: `doc-${docId}-${Date.now()}`,
      name: file.name,
      type: "PDF",
      size: fileSizeStr,
      ocrStatus: "processing",
    };
    setDocUploads((prev) => ({ ...prev, [docId]: newFile }));

    setTimeout(() => {
      const isAccepted = Math.random() > 0.15;
      if (isAccepted) {
        const detectedType = ACCEPTED_DOC_TYPES[Math.floor(Math.random() * ACCEPTED_DOC_TYPES.length)];
        const ocrData = generateMockOcrData();
        setDocUploads((prev) =>
          prev[docId]
            ? { ...prev, [docId]: { ...prev[docId], ocrStatus: "to_verify", ocrData, detectedDocType: detectedType } }
            : prev
        );
      } else {
        setDocUploads((prev) =>
          prev[docId]
            ? { ...prev, [docId]: { ...prev[docId], ocrStatus: "wrong_doc_type", detectedDocType: "Unknown" } }
            : prev
        );
      }
    }, 2500);
  }, []);

  const handleVerifyConfirm = useCallback((docId: string, data: OcrExtractedData) => {
    setDocUploads((prev) =>
      prev[docId]
        ? { ...prev, [docId]: { ...prev[docId], ocrStatus: "verified", ocrData: data } }
        : prev
    );
    setVerifyModal(null);
  }, []);

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">Claim not found</p>
        <Button variant="link" onClick={() => navigate("/claims")}>Back to claims</Button>
      </div>
    );
  }

  const isPendingApproval = claim.status === "Pending Approval";
  const txnAmount = claim.totalAmount;
  const amountMismatch = lineItemsTotal > 0 && Math.abs(lineItemsTotal - txnAmount) > 0.01;

  const handleSaveDraft = () => {
    toast({ title: "Draft Saved", description: "Your changes have been saved as a draft." });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const newErrors: Record<string, string> = {};
    if (!purpose.trim()) newErrors.purpose = "Purpose is required";
    if (!expenseType) newErrors.expenseType = "Expense Type is required";
    if (!subExpenseType) newErrors.subExpenseType = "Sub Expense Type is required";
    if (!vatType) newErrors.vatType = "Please select VAT Type";
    if (!glAccount) newErrors.glAccount = "Please select GL Account";
    if (!requiredDocVerified) newErrors.documents = "Please upload and verify your receipt or tax invoice.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({ title: "Validation Error", description: "Please complete all required fields.", variant: "destructive" });
      return;
    }
    setErrors({});
    updateClaim(claim.id, { status: "Pending Approval" });
    toast({ title: "Submitted", description: `${claim.claimNo} has been submitted for approval.` });
  };

  const handleAction = (type: "approve" | "reject" | "info") => {
    const newStatus = type === "approve" ? "Auto Approved" : type === "reject" ? "Final Rejected" : "Pending Approval";
    const actionLabel = type === "approve" ? "Approved" : type === "reject" ? "Rejected" : "Request Info";
    updateClaim(claim.id, {
      status: newStatus,
      approvalHistory: claim.approvalHistory.map((s, i) =>
        i === claim.approvalHistory.length - 1
          ? { ...s, action: actionLabel as any, comment, actionDate: new Date().toISOString().slice(0, 10) }
          : s
      ),
      comments: comment
        ? [...claim.comments, { id: `cm-${Date.now()}`, userId: "u2", userName: "Somying Kaewsai", text: comment, date: new Date().toISOString().slice(0, 10) }]
        : claim.comments,
    });
    toast({ title: `Claim ${actionLabel}`, description: `${claim.claimNo} has been ${actionLabel.toLowerCase()}` });
    setActionDialog({ open: false, type: "approve" });
    setComment("");
  };

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleApproverApprove = () => {
    updateClaim(claim.id, {
      status: "Auto Approved",
      approvalHistory: claim.approvalHistory.map((s, i) =>
        i === claim.approvalHistory.length - 1
          ? { ...s, action: "Approved" as any, comment: "", actionDate: new Date().toISOString().slice(0, 10) }
          : s
      ),
    });
    toast({ title: "Claim Approved", description: `${claim.claimNo} has been approved.` });
    navigate("/approvals");
  };

  const handleApproverReject = () => {
    if (!rejectReason.trim()) return;
    updateClaim(claim.id, {
      status: "Final Rejected",
      approvalHistory: claim.approvalHistory.map((s, i) =>
        i === claim.approvalHistory.length - 1
          ? { ...s, action: "Rejected" as any, comment: rejectReason, actionDate: new Date().toISOString().slice(0, 10) }
          : s
      ),
      comments: [...claim.comments, { id: `cm-${Date.now()}`, userId: "u2", userName: "Somying Kaewsai", text: rejectReason, date: new Date().toISOString().slice(0, 10) }],
    });
    toast({ title: "Claim Rejected", description: `${claim.claimNo} has been rejected.` });
    navigate("/approvals");
  };

  // ══════════════════════════════════════════════════════
  // APPROVER VIEW — read-only with approval decision panel
  // ══════════════════════════════════════════════════════
  if (isApproverView) {
    const mockExpenseType = "Travel";
    const mockSubExpenseType = "Taxi / Ride-Hailing";
    const mockVatType = "Claim 100";
    const mockGlAccount = "5300-002 — Travel - Ground Transport";
    const mockPurpose = claim.purpose || "Traveling to meet a HoReCa customer at the Lat Phrao branch.";

    return (
      <div className="pb-32 max-w-5xl mx-auto">
        {/* ══════ STICKY HEADER ══════ */}
        <div className="sticky top-0 z-40 bg-background border-b border-border -mx-4 px-4 md:-mx-6 md:px-6">
          <div className="flex items-center gap-3 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/approvals")} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">
                {claim.claimNo} · {claim.purpose || "Taxicabs and Limousines"}
              </h1>
            </div>
            <Badge variant="outline" className={
              claim.status === "Request for Info"
                ? "border-indigo-300 bg-indigo-50 text-indigo-700 shrink-0"
                : "border-amber-300 bg-amber-50 text-amber-700 shrink-0"
            }>
              {claim.status === "Request for Info" ? "Request for Info" : "Pending Approval"}
            </Badge>
          </div>
        </div>

        {/* Submitted-by header */}
        <p className="text-[13px] text-muted-foreground mt-4 mb-6">
          Submitted by <span className="font-medium text-foreground">{claim.requesterName}</span> · {claim.department} · Submitted on {formatBEDate(claim.submittedDate || claim.createdDate)}
        </p>

        <div className="space-y-8">
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

          {/* ══════ SECTION 2 — BUSINESS INFO (Read-Only) ══════ */}
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
                  <ReadOnlyField label="VAT Type" value={mockVatType} />
                  <ReadOnlyField label="GL Account" value={mockGlAccount} />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ══════ SECTION 3 — DOCUMENTS (Read-Only) ══════ */}
          <section>
            <SectionDivider num={3} label="Documents" />
            <Card className="border border-border rounded-xl">
              <CardContent className="pt-5 space-y-4">
                {/* Clickable verified document row */}
                <div
                  className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 cursor-pointer hover:bg-emerald-100/60 transition-colors"
                  onClick={() => setApproverDocModal(true)}
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

                {/* Mock OCR validation results */}
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

          {/* ══════ SECTION 4 — AUDIT TRAIL ══════ */}
          <AuditTrail />
        </div>

        {/* ══════ APPROVAL DECISION PANEL (Fixed Bottom) ══════ */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-4 z-50">
          <div className="max-w-5xl mx-auto">
            {showRejectInput && (
              <div className="mb-3 space-y-2">
                <Label className="text-[13px] font-semibold text-foreground">Reason for rejection (required)</Label>
                <Textarea
                  placeholder="Please provide the reason for rejecting this claim..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="text-[13px] min-h-[80px]"
                />
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={handleApproverReject}
                    disabled={!rejectReason.trim()}
                  >
                    Confirm Reject
                  </Button>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setShowRejectInput((prev) => !prev)}
              >
                <X className="h-4 w-4 mr-1" /> Reject
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        className="border-amber-400 text-amber-700 hover:bg-amber-50"
                        disabled={claim.status === "Request for Info"}
                        onClick={() => setRequestInfoOpen(true)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" /> Request Info
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {claim.status === "Request for Info" && (
                    <TooltipContent>
                      <p>Waiting for cardholder response</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleApproverApprove}
              >
                <Check className="h-4 w-4 mr-1" /> Approve
              </Button>
            </div>
          </div>
        </div>

        {/* ══════ REQUEST INFO MODAL ══════ */}
        <Dialog open={requestInfoOpen} onOpenChange={setRequestInfoOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request More Information</DialogTitle>
              <p className="text-sm text-muted-foreground">
                This message will be sent to {claim.requesterName} via email
              </p>
            </DialogHeader>
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold">Message to Employee *</Label>
              <Textarea
                rows={4}
                placeholder="e.g. Please attach the original receipt and specify the names of all attendees..."
                value={requestInfoMessage}
                onChange={(e) => {
                  setRequestInfoMessage(e.target.value);
                  setRequestInfoTouched(true);
                }}
                className="text-[13px]"
              />
              <div className="flex items-center justify-between">
                <p className={`text-xs ${requestInfoMessage.length >= 10 ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {requestInfoMessage.length} / min 10 characters
                </p>
              </div>
              {requestInfoTouched && requestInfoMessage.length > 0 && requestInfoMessage.length < 10 && (
                <p className="text-xs text-destructive">Please enter a message (minimum 10 characters)</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setRequestInfoOpen(false); setRequestInfoMessage(""); setRequestInfoTouched(false); }}>
                Cancel
              </Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-white"
                disabled={requestInfoMessage.length < 10}
                onClick={() => {
                  updateClaim(claim.id, { status: "Request for Info" as any });
                  toast({ title: "Request sent", description: `${claim.requesterName} will receive an email notification` });
                  setRequestInfoOpen(false);
                  setRequestInfoMessage("");
                  setRequestInfoTouched(false);
                }}
              >
                <Send className="h-4 w-4 mr-1" /> Send Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Read-only OCR Verify Modal for approver */}
        <OcrVerifyModal
          open={approverDocModal}
          onClose={() => setApproverDocModal(false)}
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

  // ══════════════════════════════════════════════════════
  // EMPLOYEE VIEW (existing form)
  // ══════════════════════════════════════════════════════
  return (
    <div className="pb-24 max-w-5xl mx-auto">
      {/* ══════ STICKY HEADER ══════ */}
      <div className="sticky top-0 z-40 bg-background border-b border-border -mx-4 px-4 md:-mx-6 md:px-6">
        {/* Row 1: Back + title + actions */}
        <div className="flex items-center gap-3 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">
              {claim.claimNo} · {claim.purpose || "Taxicabs and Limousines"}
            </h1>
          </div>
          {isPendingApproval && (
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => setActionDialog({ open: true, type: "approve" })}>
                <Check className="h-3.5 w-3.5 mr-1" />Approve
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setActionDialog({ open: true, type: "reject" })}>
                <X className="h-3.5 w-3.5 mr-1" />Reject
              </Button>
              <Button variant="outline" size="sm" onClick={() => setActionDialog({ open: true, type: "info" })}>
                <MessageSquare className="h-3.5 w-3.5 mr-1" />Request Info
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8 mt-6">
        {/* ══════ STEP 1 — CARD TRANSACTION (Read-Only) ══════ */}
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
                <Row label="Amount" value={`${fmt(txnAmount)} THB`} />
                <Row label="MCC Description" value={claim.purpose || "Taxicabs and Limousines"} className="sm:col-span-2" />
              </div>
              <p className="text-[11px] text-muted-foreground mt-4 italic">
                Data from the credit card's transaction — cannot be edited.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* ══════ STEP 2 — BUSINESS INFO ══════ */}
        <section>
          <SectionDivider num={2} label="Business Info" />
          <Card className="border border-border rounded-xl">
            <CardContent className="pt-5 space-y-4">
              {/* Purpose */}
              <div className="space-y-1.5">
                <Label className="text-[13px] font-semibold text-foreground">
                  Purpose <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Describe the business purpose, e.g., traveling to meet a HoReCa customer at the Lat Phrao branch."
                  value={purpose}
                  onChange={(e) => { setPurpose(e.target.value); setErrors((p) => ({ ...p, purpose: "" })); }}
                  className="text-[13px] min-h-[80px]"
                />
                {errors.purpose && <p className="text-xs text-destructive">{errors.purpose}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Expense Type */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-foreground">
                    Expense Type <span className="text-destructive">*</span>
                  </Label>
                  <Select value={expenseType} onValueChange={(v) => {
                    setExpenseType(v);
                    setSubExpenseType("");
                    setGlAccount("");
                    setVatType("");
                    setErrors((p) => ({ ...p, expenseType: "" }));
                  }}>
                    <SelectTrigger className="text-[13px]"><SelectValue placeholder="Select expense type" /></SelectTrigger>
                    <SelectContent>
                      {getLevel1Options().map((t) => <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.expenseType && <p className="text-xs text-destructive">{errors.expenseType}</p>}
                </div>

                {/* Sub Expense Type */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-foreground">
                    Sub Expense Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={subExpenseType}
                    onValueChange={(v) => {
                      setSubExpenseType(v);
                      const config = getExpenseConfig(expenseType, v);
                      setGlAccount("");
                      setVatType("");
                      setErrors((p) => ({ ...p, subExpenseType: "", vatType: "", glAccount: "" }));
                    }}
                    disabled={!expenseType}
                  >
                    <SelectTrigger className="text-[13px]"><SelectValue placeholder={expenseType ? "Select sub type" : "Select expense type first"} /></SelectTrigger>
                    <SelectContent>
                      {getLevel2Options(expenseType).map((t) => <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.subExpenseType && <p className="text-xs text-destructive">{errors.subExpenseType}</p>}
                </div>

                {/* VAT Type */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-foreground">VAT Type <span className="text-destructive">*</span></Label>
                  <Select value={vatType} onValueChange={(v) => { setVatType(v); setErrors((p) => ({ ...p, vatType: "" })); }}>
                    <SelectTrigger className="text-[13px]">
                      <SelectValue placeholder="Select VAT Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {VAT_TYPE_CONFIG.map((vt) => (
                        <SelectItem key={vt.id} value={vt.id} className="text-[13px]">
                          {vt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.vatType && <p className="text-xs text-destructive">{errors.vatType}</p>}
                </div>

                {/* GL Account */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-foreground">GL Account <span className="text-destructive">*</span></Label>
                  <Select value={glAccount} onValueChange={(v) => { setGlAccount(v); setErrors((p) => ({ ...p, glAccount: "" })); }}>
                    <SelectTrigger className="text-[13px]">
                      <SelectValue placeholder="Select GL Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {GL_ACCOUNT_OPTIONS.map((gl) => (
                        <SelectItem key={gl.code} value={gl.code} className="text-[13px]">
                          {gl.code} — {gl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.glAccount && <p className="text-xs text-destructive">{errors.glAccount}</p>}
                </div>
              </div>

              {/* Auto Reject banner */}
              {isAutoReject && selectedConfig?.notes && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-[13px] text-red-800 font-medium">
                    ❌ This expense type cannot be reimbursed per company policy.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ══════ STEP 3 — DOCUMENTS ══════ */}
        {selectedConfig && !isAutoReject && (
          <section>
            <SectionDivider num={3} label="Documents" />
            <Card className="border border-border rounded-xl">
              <CardContent className="pt-5 space-y-5">
                {/* Required — single fixed slot */}
                <div className="space-y-2">
                  <p className="text-[13px] font-semibold text-red-700 flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />
                    Required — Attach file before Submit
                  </p>
                  <DocRow
                    docId={REQUIRED_DOC_ID}
                    label="Receipt / Tax Invoice *"
                    uploaded={requiredDoc}
                    onUpload={(file) => simulateDocSlotUpload(REQUIRED_DOC_ID, file)}
                    onVerify={() => setVerifyModal({ open: true, docId: REQUIRED_DOC_ID })}
                    onDelete={() => setDocUploads((prev) => { const n = { ...prev }; delete n[REQUIRED_DOC_ID]; return n; })}
                  />
                </div>

                {/* Optional docs */}
                {allOptionalDocs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[13px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
                      Optional — Attach supporting Documents
                    </p>
                    <div className="space-y-2">
                      {allOptionalDocs.map((doc) => {
                        const uploaded = docUploads[doc.id];
                        return (
                          <DocRow
                            key={doc.id}
                            docId={doc.id}
                            label={doc.label}
                            uploaded={uploaded}
                            optional
                            onUpload={(file) => simulateDocSlotUpload(doc.id, file)}
                            onVerify={() => setVerifyModal({ open: true, docId: doc.id })}
                            onDelete={() => setDocUploads((prev) => { const n = { ...prev }; delete n[doc.id]; return n; })}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Status message */}
                {!requiredDoc && (
                  <p className="text-[13px] text-amber-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Upload and verify your receipt or tax invoice to submit.
                  </p>
                )}
                {requiredDoc?.ocrStatus === "processing" && (
                  <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    Processing document...
                  </p>
                )}
                {requiredDoc?.ocrStatus === "to_verify" && (
                  <p className="text-[13px] text-amber-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Upload and verify your receipt or tax invoice to submit.
                  </p>
                )}
                {requiredDoc?.ocrStatus === "verified" && (
                  <p className="text-[13px] text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Document verified.
                  </p>
                )}
                {requiredDoc?.ocrStatus === "wrong_doc_type" && (
                  <p className="text-[13px] text-amber-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Upload and verify your receipt or tax invoice to submit.
                  </p>
                )}

                {/* Notes from config */}
                {selectedConfig.notes && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="text-xs text-blue-700 flex items-start gap-1.5">
                      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {selectedConfig.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Approval Timeline */}
        {claim.approvalHistory.length > 0 && (
          <Card className="border border-border rounded-xl">
            <CardContent className="pt-5">
              <p className="text-base font-bold mb-4">Approval Timeline</p>
              <div className="space-y-3">
                {claim.approvalHistory.map((step, i) => {
                  const ac = actionConfig[step.action] || actionConfig.Pending;
                  const Icon = ac.icon;
                  return (
                    <div key={i} className={`border-l-4 ${ac.color} p-3 rounded-r-lg`}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium text-sm">Step {step.stepNo}: {step.approverName}</span>
                        <Badge variant="outline">{step.action}</Badge>
                        {step.actionDate && <span className="text-xs text-muted-foreground ml-auto">{formatBEDate(step.actionDate)}</span>}
                      </div>
                      {step.comment && <p className="text-sm text-muted-foreground mt-1">{step.comment}</p>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        {claim.comments.length > 0 && (
          <Card className="border border-border rounded-xl">
            <CardContent className="pt-5">
              <p className="text-base font-bold mb-3">Comments ({claim.comments.length})</p>
              <div className="space-y-3">
                {claim.comments.map((c) => (
                  <div key={c.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{c.userName}</span>
                      <span className="text-xs text-muted-foreground">{formatBEDate(c.date)}</span>
                    </div>
                    <p className="text-sm mt-1">{c.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ══════ STICKY FOOTER ══════ */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-3 flex justify-end gap-3 z-50">
        <Button variant="outline" onClick={handleSaveDraft}>Save Draft</Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  Submit for Approval
                </Button>
              </span>
            </TooltipTrigger>
            {!canSubmit && (
              <TooltipContent side="top" className="max-w-xs text-xs">
                {!requiredDocVerified
                  ? "Please upload and verify your receipt or tax invoice."
                  : "Please complete all required fields in each step."}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "approve" ? "Approve Claim" : actionDialog.type === "reject" ? "Reject Claim" : "Request More Information"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={actionDialog.type === "reject" ? "Reason for rejection (required)..." : "Add a comment (optional)..."}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog({ open: false, type: "approve" }); setComment(""); }}>Cancel</Button>
            <Button
              onClick={() => handleAction(actionDialog.type)}
              disabled={actionDialog.type === "reject" && !comment.trim()}
              className={actionDialog.type === "approve" ? "bg-green-600 hover:bg-green-700" : actionDialog.type === "reject" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {actionDialog.type === "approve" ? "Approve" : actionDialog.type === "reject" ? "Reject" : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OCR Verify Modal */}
      {verifyModal && verifyModal.open && docUploads[verifyModal.docId] && (
        <OcrVerifyModal
          open={verifyModal.open}
          onClose={() => setVerifyModal(null)}
          onConfirm={(data) => handleVerifyConfirm(verifyModal.docId, data)}
          onRemoveReupload={() => {
            const docId = verifyModal.docId;
            setDocUploads((prev) => { const n = { ...prev }; delete n[docId]; return n; });
            setVerifyModal(null);
          }}
          fileName={docUploads[verifyModal.docId].name}
          fileType={docUploads[verifyModal.docId].type}
          initialData={docUploads[verifyModal.docId].ocrData || {
            taxInvoiceNo: "", date: "", vendorName: "",
            netAmount: "", vatAmount: "", totalAmount: "",
          }}
          validationContext={activeEntity ? {
            companyTaxId: activeEntity.taxId,
            companyAddress: activeEntity.address,
            bankAmount: claim.totalAmount,
            transactionDate: claim.createdDate,
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

/* ─── DocRow ─── */
function DocRow({
  docId, label, uploaded, optional, onUpload, onVerify, onDelete,
}: {
  docId: string;
  label: string;
  uploaded?: UploadedFile;
  optional?: boolean;
  onUpload: (file: File) => void;
  onVerify: () => void;
  onDelete: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const statusBadge = () => {
    if (!uploaded) return null;
    switch (uploaded.ocrStatus) {
      case "processing":
        return (
          <Badge variant="outline" className="border-gray-300 bg-gray-50 text-gray-600 text-[11px] gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Processing
          </Badge>
        );
      case "to_verify":
        return (
          <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-600 text-[11px]">
            To Verify
          </Badge>
        );
      case "verified":
        return (
          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-600 text-[11px] gap-1">
            <CheckCircle2 className="h-3 w-3" /> Verified
          </Badge>
        );
      case "wrong_doc_type":
        return (
          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-600 text-[11px] gap-1">
            <XCircle className="h-3 w-3" /> Wrong Document Type
          </Badge>
        );
    }
  };

  const borderClass = !uploaded
    ? optional ? "border-dashed border-border bg-background" : "border-border bg-background"
    : uploaded.ocrStatus === "verified"
      ? "border-emerald-200 bg-emerald-50/50"
      : uploaded.ocrStatus === "wrong_doc_type"
        ? "border-red-200 bg-red-50/50"
        : "border-border bg-background";

  return (
    <div className="space-y-0">
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${borderClass}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="shrink-0">
          {!uploaded && (optional ? <FileText className="h-5 w-5 text-muted-foreground" /> : <AlertTriangle className="h-5 w-5 text-amber-500" />)}
          {uploaded?.ocrStatus === "verified" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          {uploaded?.ocrStatus === "processing" && <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />}
          {uploaded?.ocrStatus === "to_verify" && <AlertCircle className="h-5 w-5 text-orange-500" />}
          {uploaded?.ocrStatus === "wrong_doc_type" && <XCircle className="h-5 w-5 text-red-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-medium ${optional && !uploaded ? "text-muted-foreground" : "text-foreground"}`}>{uploaded ? uploaded.name : label}</p>
          {uploaded && uploaded.ocrStatus !== "wrong_doc_type" && <p className="text-xs text-muted-foreground mt-0.5">{uploaded.detectedDocType ? `${uploaded.detectedDocType}` : label} • {uploaded.size}</p>}
          {uploaded?.ocrStatus === "wrong_doc_type" && <p className="text-xs text-red-500 mt-0.5">{uploaded.size}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {statusBadge()}
          {uploaded?.ocrStatus === "to_verify" && (
            <Button variant="outline" size="sm" className="text-xs" onClick={onVerify}>
              Verify
            </Button>
          )}
          {uploaded?.ocrStatus === "wrong_doc_type" && (
            <Button variant="outline" size="sm" className="text-xs text-red-600 border-red-300 hover:bg-red-50" onClick={onDelete}>
              Remove & Re-upload
            </Button>
          )}
          {uploaded && uploaded.ocrStatus !== "wrong_doc_type" && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {!uploaded && (
            <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3 w-3" /> Upload
            </Button>
          )}
        </div>
      </div>
      {uploaded?.ocrStatus === "wrong_doc_type" && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs text-red-700">
            This document type is not accepted. Please upload one of the following: Receipt, Tax Invoice, Receipt/Tax Invoice, or Abbreviated Receipt.
          </p>
        </div>
      )}
    </div>
  );
}
