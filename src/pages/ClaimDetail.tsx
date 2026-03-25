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
  const step1Complete = true; // always complete (read-only)
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

    // Simulate OCR processing — classify document type then extract fields (2.5s)
    setTimeout(() => {
      // 85% chance accepted doc type, 15% wrong type
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
    // Mock submitted data for display
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
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 shrink-0">
              Pending Approval
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
                {/* Mock verified document */}
                <div className="flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
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
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleApproverApprove}
              >
                <Check className="h-4 w-4 mr-1" /> Approve
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // EMPLOYEE VIEW (existing form)
  // ══════════════════════════════════════════════════════
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
