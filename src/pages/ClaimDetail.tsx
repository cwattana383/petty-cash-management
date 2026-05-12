import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft, Check, X, Clock, CheckCircle, XCircle,
  AlertCircle, Send, AlertTriangle, Upload, FileText,
  Loader2, CheckCircle2, Info, CreditCard, Trash2, Eye, MessageSquare
} from "lucide-react";
import { formatBEDate, cn } from "@/lib/utils";
import { useClaims } from "@/lib/claims-context";
import { getExpenseConfig } from "@/lib/expense-type-config";
import { VAT_TYPE_CONFIG } from "@/lib/vat-type-config";
import OcrVerifyModal, { type OcrExtractedData, type OcrVerifyConfirmMeta } from "@/components/claims/OcrVerifyModal";
import { mockCompanyIdentities } from "@/components/admin/EntityTypes";
import { useToast } from "@/hooks/use-toast";
import AuditTrail, { REQUEST_INFO_TRAIL, FINAL_REJECTED_TRAIL } from "@/components/claims/AuditTrail";
import { ResponsePanel } from "@/components/claims/ResponsePanel";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCardholderClaimDetail, useClaimDetailForApprover, useSaveClaimDraft } from "@/hooks/use-cardholder-claims";
import { useApproveClaimInbox, useRejectClaimInbox } from "@/hooks/use-approval-inbox";
import { useExpenseTypes, type ExpenseTypeRow } from "@/hooks/use-expense-types";
import type { ClaimHeader } from "@/lib/types";
import { useGlAccounts } from "@/hooks/use-gl-accounts";
import { useAuth } from "@/lib/auth-context";
import {
  claimDocumentLikeFromPreview,
  claimDocumentToOcrExtractedData,
  getFailingValidationKeys,
  isDocumentSubmitEligible,
  useClaimDocuments,
  useDeleteClaimDocument,
  useOverrideClaimDocument,
  usePreviewClaimDocumentOcr,
  useProcessClaimDocumentOcr,
  useSubmitClaim,
  useUploadClaimDocuments,
  type ClaimDocument,
  type OcrValidationResults,
} from "@/hooks/use-claim-documents";
import { isFetchAbortOrTimeout, OCR_TIMEOUT_MESSAGE_TH } from "@/lib/ocr-sla";
import { toDocumentContractStatus } from "@/lib/corp-document-status";
import { deriveDocumentStatusLabelFromClaimDocs, toApprovalContractStatus } from "@/lib/claim-approval-contract-status";

/* ─── Types ─── */
type DocOcrStatus = "processing" | "to_verify" | "verified" | "wrong_doc_type" | "ocr_timeout";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  ocrStatus: DocOcrStatus;
  ocrData?: OcrExtractedData;
  detectedDocType?: string;
  backendDocumentId?: string;
  documentTypeId?: string;
  /** true when backend allows claim submit (VERIFIED or TO_VERIFY + override recorded) */
  submitEligible?: boolean;
  /** Local file — uploaded on Verify confirm, Save Draft, or Submit */
  pendingFile?: File;
  localPreviewUrl?: string;
  pendingValidation?: OcrValidationResults;
  pendingOverrideReasonsJson?: Record<string, string>;
  /** Raw extracted fields from preview-ocr — merged with user edits on Save/Submit */
  pendingProcessOcrBase?: Record<string, unknown>;
}

function businessInfoReadOnlyLabels(
  claim: ClaimHeader,
  expenseTypeRows: ExpenseTypeRow[],
  glRows: Array<{ id: string; accountCode: string; accountName: string }>,
) {
  const et = expenseTypeRows.find((e) => e.id === claim.expenseTypeId);
  const st = et?.subtypes?.find((s) => s.id === claim.subExpenseTypeId);
  const vat = VAT_TYPE_CONFIG.find((v) => v.id === claim.vatTypeId);
  const gl = glRows.find((g) => g.id === claim.glAccountId);
  return {
    expenseType: et?.expenseType ?? "—",
    subExpenseType: st?.subExpenseType ?? "—",
    vatType: vat?.label ?? "—",
    glAccount: gl ? `${gl.accountCode} — ${gl.accountName}` : "—",
  };
}

function isLikelyNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && /fetch|network/i.test(err.message)) return true;
  if (err instanceof Error && /network|failed to fetch|load failed|networkerror/i.test(err.message)) {
    return true;
  }
  return false;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Claim states where documents are treated as accepted for display (matches list "Validated"). */
function isClaimPostManagerDocumentAcceptance(status: string | undefined): boolean {
  return (
    status === "Manager Approved" ||
    status === "Reimbursed" ||
    status === "Pending Salary Deduction"
  );
}

/** POST override / process-ocr — apiClient already unwraps `{ data: T }` */
function unwrapUploadedDocumentFromMutation(res: unknown): { status: string; errorType?: string | null } | null {
  if (res == null || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  const innerRaw = (r.document ?? r.data ?? r) as Record<string, unknown> | string | null | undefined;
  if (!innerRaw || typeof innerRaw !== "object") return null;
  const inner = innerRaw as Record<string, unknown>;
  const status = inner.status ?? inner.docStatus;
  if (typeof status === "string") {
    const et = inner.errorType ?? inner.error_type;
    return {
      status,
      errorType: typeof et === "string" ? et : null,
    };
  }
  return null;
}

function mapBackendDocStatusToUi(
  status: string,
  errorType?: string,
  opts?: { afterManagerAcceptance?: boolean },
): DocOcrStatus {
  const s = status.toUpperCase();
  const e = (errorType ?? "").toUpperCase();
  if (s === "VERIFIED") return "verified";
  // DB may still be TO_VERIFY after manager approval; list shows Validated — align detail view.
  if (s === "TO_VERIFY" && opts?.afterManagerAcceptance) return "verified";
  if (s === "TO_VERIFY") return "to_verify";
  if (s === "OCR_PROCESSING" || s === "PROCESSING" || s === "UPLOADED" || s === "PENDING_DOCUMENT") return "processing";
  if (s === "OCR_FAILED" && e === "OCR_TIMEOUT") return "ocr_timeout";
  if (s === "OCR_FAILED" || s === "REJECTED" || s === "FAILED" || s === "DUPLICATE_BLOCKED" || s === "BUYER_MISMATCH") {
    return "wrong_doc_type";
  }
  return "wrong_doc_type";
}

function parseUploadDocumentItems(uploadRes: unknown): Record<string, unknown>[] {
  const uploadedItems = Array.isArray(uploadRes)
    ? uploadRes
    : Array.isArray((uploadRes as { items?: unknown[] })?.items)
      ? (uploadRes as { items: unknown[] }).items
      : Array.isArray((uploadRes as { documents?: unknown[] })?.documents)
        ? (uploadRes as { documents: unknown[] }).documents
        : Array.isArray((uploadRes as { data?: unknown[] })?.data)
          ? (uploadRes as { data: unknown[] }).data
          : [];
  return (uploadedItems as Record<string, unknown>[]) ?? [];
}

function isPendingDocSubmitEligible(doc: UploadedFile): boolean {
  if (!doc.pendingFile || !doc.pendingValidation) return false;
  const vr = doc.pendingValidation;
  const keys = Object.keys(vr) as (keyof OcrValidationResults)[];
  if (keys.length === 0) return false;
  const allPass = keys.every((k) => {
    const c = vr[k];
    return c != null && typeof c === "object" && "pass" in c && c.pass !== false;
  });
  if (allPass) return true;
  const failing = getFailingValidationKeys(vr);
  if (failing.length === 0) return true;
  const r = doc.pendingOverrideReasonsJson;
  if (!r) return false;
  return failing.every((k) => (r[k] || "").trim().length > 0);
}

function isDocSlotSubmitReady(doc?: UploadedFile): boolean {
  if (!doc) return false;
  if (doc.pendingFile) return isPendingDocSubmitEligible(doc);
  return doc.submitEligible === true;
}

function parseDmyDisplayToIso(display: string): string | undefined {
  const m = display.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (!m) return undefined;
  let y = Number.parseInt(m[3], 10);
  if (y > 2400) y -= 543;
  const dt = new Date(y, Number.parseInt(m[2], 10) - 1, Number.parseInt(m[1], 10));
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt.toISOString().slice(0, 10);
}

function buildProcessOcrBodyFromPending(slotId: string, u: UploadedFile): Record<string, unknown> {
  const base = { ...(u.pendingProcessOcrBase ?? {}) } as Record<string, unknown>;
  const out: Record<string, unknown> = { documentTypeId: slotId, ...base };
  const d = u.ocrData;
  if (!d) return out;
  if (d.buyerTaxId != null && d.buyerTaxId !== "") out.buyerTaxId = d.buyerTaxId;
  if (d.buyerAddress != null && d.buyerAddress !== "") out.buyerAddress = d.buyerAddress;
  if (d.totalAmount) {
    const n = Number.parseFloat(String(d.totalAmount).replace(/,/g, ""));
    if (Number.isFinite(n)) out.totalAmount = n;
  }
  if (d.netAmount) {
    const n = Number.parseFloat(String(d.netAmount).replace(/,/g, ""));
    if (Number.isFinite(n)) out.netAmount = n;
  }
  if (d.vatAmount) {
    const n = Number.parseFloat(String(d.vatAmount).replace(/,/g, ""));
    if (Number.isFinite(n)) out.vatAmount = n;
  }
  if (d.date) {
    const iso = parseDmyDisplayToIso(d.date);
    if (iso) out.invoiceDate = iso;
  }
  if (d.taxInvoiceNo) out.invoiceNo = d.taxInvoiceNo;
  if (d.vendorName) out.vendorName = d.vendorName;
  return out;
}

function readOnlyDocMimeLabel(doc: ClaimDocument): string {
  const mime = (doc.mimeType || "").toLowerCase();
  if (mime.includes("pdf")) return "PDF";
  if (mime.startsWith("image/")) return "Image";
  return mime ? "File" : "Document";
}

function ReadOnlyClaimDocumentRow({
  doc,
  onPreview,
  slotLabel,
  afterManagerAcceptance = false,
}: {
  doc: ClaimDocument;
  onPreview: (d: ClaimDocument) => void;
  /** Same as DocRow `label` — document type name for subtitle (e.g. Meal Receipt) */
  slotLabel?: string;
  /** When claim is manager-approved (or later), show TO_VERIFY rows as Verified to match My Claims list. */
  afterManagerAcceptance?: boolean;
}) {
  const uiStatus = mapBackendDocStatusToUi(doc.status, doc.errorType, { afterManagerAcceptance });
  const listAlignedValidated =
    afterManagerAcceptance && doc.status.toUpperCase() === "TO_VERIFY" && uiStatus === "verified";
  const borderClass =
    uiStatus === "verified"
      ? "border-border bg-emerald-50/35"
      : uiStatus === "wrong_doc_type"
        ? "border-destructive/40 bg-red-50/50"
        : "border-border bg-background";

  const metaSubtitle = `${slotLabel || readOnlyDocMimeLabel(doc)} • ${formatFileSize(doc.fileSize || 0)}`;

  const statusBadge = () => {
    switch (uiStatus) {
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
            <CheckCircle2 className="h-3 w-3" /> {listAlignedValidated ? "Validated" : "Verified"}
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

  const leftIcon = () => {
    switch (uiStatus) {
      case "verified":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-muted-foreground animate-spin shrink-0" />;
      case "to_verify":
        return <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />;
      case "wrong_doc_type":
        return <XCircle className="h-5 w-5 text-red-500 shrink-0" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground shrink-0" />;
    }
  };

  return (
    <li className="list-none">
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${borderClass}`}>
        <div className="shrink-0">{leftIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate" title={doc.fileName}>
            {doc.fileName || "Document"}
          </p>
          {uiStatus !== "wrong_doc_type" ? (
            <p className="text-xs text-muted-foreground mt-0.5">{metaSubtitle}</p>
          ) : (
            <p className="text-xs text-red-500 mt-0.5">{formatFileSize(doc.fileSize || 0)}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {doc.overrideFlag && uiStatus !== "verified" && (
            <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700 text-[11px] gap-1">
              <AlertTriangle className="h-3 w-3" /> Override
            </Badge>
          )}
          {statusBadge()}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            title="Preview"
            aria-label="Preview document"
            onClick={() => onPreview(doc)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
}

function mapDocumentToUploadedFile(doc: ClaimDocument, fallbackLabel: string, docTypeId: string): UploadedFile {
  const mime = (doc.mimeType || "").toLowerCase();
  const typeLabel = mime.includes("pdf") ? "PDF" : mime.startsWith("image/") ? "Image" : mime ? "File" : "PDF";
  return {
    id: doc.id,
    name: doc.fileName || fallbackLabel,
    type: typeLabel,
    size: formatFileSize(doc.fileSize || 0),
    ocrStatus: mapBackendDocStatusToUi(doc.status, doc.errorType),
    backendDocumentId: doc.id,
    documentTypeId: docTypeId,
    ocrData: claimDocumentToOcrExtractedData(doc),
    submitEligible: isDocumentSubmitEligible(doc),
  };
}

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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cardholderQuery = useCardholderClaimDetail(isApproverView ? undefined : id);
  const approverQuery = useClaimDetailForApprover(isApproverView ? id : undefined);
  const claimDetailQuery = isApproverView ? approverQuery : cardholderQuery;
  const uploadDocumentMutation = useUploadClaimDocuments();
  const previewDocumentMutation = usePreviewClaimDocumentOcr();
  const processOcrMutation = useProcessClaimDocumentOcr();
  const overrideDocumentMutation = useOverrideClaimDocument();
  const submitClaimMutation = useSubmitClaim();
  const saveDraftMutation = useSaveClaimDraft();
  const approveClaimMutation = useApproveClaimInbox();
  const rejectClaimMutation = useRejectClaimInbox();
  const deleteDocumentMutation = useDeleteClaimDocument();
  const expenseTypesQuery = useExpenseTypes({ active: "true", page: 1, limit: 100 });
  const glAccountsQuery = useGlAccounts({ active: "true", page: 1, limit: 1000 });
  const claim = claimDetailQuery.data ?? getClaimById(id || "");

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
  const [draftSaving, setDraftSaving] = useState(false);
  const [confirmNoDocument, setConfirmNoDocument] = useState(false);

  const [verifyModal, setVerifyModal] = useState<{ open: boolean; docId: string } | null>(null);

  // Approver view state
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [readOnlyPreviewDoc, setReadOnlyPreviewDoc] = useState<ClaimDocument | null>(null);
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);
  const [requestInfoMessage, setRequestInfoMessage] = useState("");
  const [requestInfoTouched, setRequestInfoTouched] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const expenseTypeOptions = expenseTypesQuery.data?.data ?? [];
  const selectedExpenseTypeRow = expenseTypeOptions.find((et) => et.id === expenseType);
  const subExpenseTypeOptions = selectedExpenseTypeRow?.subtypes ?? [];
  const selectedSubExpenseTypeRow = subExpenseTypeOptions.find((st) => st.id === subExpenseType);
  const glAccountOptions = (glAccountsQuery.data?.data ?? []).filter((gl) =>
    !expenseType || gl.expenseTypeId === expenseType
  );
  const subtypeDocumentTypes = selectedSubExpenseTypeRow?.documentTypes ?? [];
  const requiredDocumentType = subtypeDocumentTypes.find((d) => !d.documentType.isSupportDocument)?.documentType;
  const optionalDocumentTypes = subtypeDocumentTypes
    .filter((d) => d.documentType.isSupportDocument)
    .map((d) => d.documentType);
  /** Primary required slot comes only from expense-type master — no hardcoded fallback. */
  const requiredDocId = requiredDocumentType?.id;
  const documentsQuery = useClaimDocuments(claim?.id);

  /** Corp card policy auto-reject with no document requirement — skip document step and allow submit to AUTO_REJECT. */
  const corpPolicyAutoRejectNoDoc = useMemo(() => {
    const st = (claim?.corpTxnStatus ?? "").toString().toUpperCase().replace(/\s+/g, "_");
    const docSt = (claim?.corpTxnDocumentStatus ?? "").toString().toUpperCase().replace(/\s+/g, "_");
    return st === "AUTO_REJECTED" && docSt === "NOT_REQUIRED";
  }, [claim?.corpTxnStatus, claim?.corpTxnDocumentStatus]);

  const docUploadsFromApi = useMemo(() => {
    const docs = documentsQuery.data ?? [];
    const byTime = (a: ClaimDocument, b: ClaimDocument) =>
      new Date(b.updatedAt || b.createdAt || 0).getTime() -
      new Date(a.updatedAt || a.createdAt || 0).getTime();

    const mapped: Record<string, UploadedFile> = {};
    if (requiredDocumentType) {
      const candidates = docs.filter((d) => d.documentTypeId === requiredDocumentType.id);
      const required = [...candidates].sort(byTime)[0];
      if (required) {
        mapped[requiredDocumentType.id] = mapDocumentToUploadedFile(
          required,
          requiredDocumentType.documentName,
          requiredDocumentType.id
        );
      }
    }
    optionalDocumentTypes.forEach((docType) => {
      const candidates = docs.filter((d) => d.documentTypeId === docType.id);
      const found = [...candidates].sort(byTime)[0];
      if (found) {
        mapped[docType.id] = mapDocumentToUploadedFile(found, docType.documentName, docType.id);
      }
    });
    return mapped;
  }, [documentsQuery.data, optionalDocumentTypes, requiredDocumentType]);

  const verifyModalRow =
    verifyModal?.open
      ? (docUploads[verifyModal.docId] ?? docUploadsFromApi[verifyModal.docId])
      : undefined;
  const verifyDocBackendId = verifyModalRow?.backendDocumentId;

  // Derived config
  const selectedConfig =
    selectedExpenseTypeRow?.expenseType && selectedSubExpenseTypeRow?.subExpenseType
      ? getExpenseConfig(selectedExpenseTypeRow.expenseType, selectedSubExpenseTypeRow.subExpenseType)
      : null;
  const isAutoReject = selectedConfig?.policyRule === "Auto Reject";
  const allOptionalDocs = optionalDocumentTypes.map((doc) => ({ id: doc.id, label: doc.documentName }));
  const requiredDoc =
    requiredDocId != null ? docUploads[requiredDocId] ?? docUploadsFromApi[requiredDocId] : undefined;
  const requiredDocVerified = requiredDocumentType ? isDocSlotSubmitReady(requiredDoc) : true;
  const docRequirementMet = corpPolicyAutoRejectNoDoc || requiredDocVerified || confirmNoDocument;
  const docBlocksSubmit = corpPolicyAutoRejectNoDoc
    ? false
    : !requiredDocumentType
      ? false
      : confirmNoDocument
        ? false
        : requiredDoc?.ocrStatus === "processing" ||
          requiredDoc?.ocrStatus === "ocr_timeout" ||
          requiredDoc?.ocrStatus === "wrong_doc_type" ||
          !requiredDocVerified;

  /** IDs must resolve to current API/config options — stale UUIDs must not count as "filled". */
  const vatTypeValid = Boolean(vatType && VAT_TYPE_CONFIG.some((v) => v.id === vatType));
  const glAccountValid = Boolean(glAccount && glAccountOptions.some((g) => g.id === glAccount));

  // Step completion
  const step2Complete =
    purpose.trim().length > 0 &&
    !!selectedExpenseTypeRow &&
    !!selectedSubExpenseTypeRow &&
    vatTypeValid &&
    glAccountValid;
  const step3Complete =
    lineItemsValid && !!selectedSubExpenseTypeRow && (!isAutoReject || corpPolicyAutoRejectNoDoc);
  const step4Complete = docRequirementMet && step2Complete;

  const canSubmit =
    step2Complete &&
    step3Complete &&
    step4Complete &&
    (!isAutoReject || corpPolicyAutoRejectNoDoc) &&
    !docBlocksSubmit;

  useEffect(() => {
    if (!claim?.id || claimDetailQuery.isLoading) return;
    setPurpose(claim.purpose ?? "");
    setExpenseType(claim.expenseTypeId ?? "");
    setSubExpenseType(claim.subExpenseTypeId ?? "");
    setVatType(claim.vatTypeId ?? "");
    setGlAccount(claim.glAccountId ?? "");
  }, [
    claimDetailQuery.isLoading,
    claim?.id,
    claim?.purpose,
    claim?.expenseTypeId,
    claim?.subExpenseTypeId,
    claim?.vatTypeId,
    claim?.glAccountId,
  ]);

  // Mock OCR data generation
  const activeEntity = mockCompanyIdentities.find((e) => e.status === "Active");
  const activeEntityTaxId = activeEntity?.taxIds[0]?.taxId || "0107567000414";
  const activeEntityAddress = activeEntity?.addressTh?.addressLine1 || "CPAxtra Public Company Limited, Bangkok";

  const handleDeleteDocument = useCallback(
    async (slotId: string) => {
      const row = docUploads[slotId] ?? docUploadsFromApi[slotId];
      const backendId = row?.backendDocumentId;
      try {
        if (row?.localPreviewUrl) URL.revokeObjectURL(row.localPreviewUrl);
        if (backendId) {
          await deleteDocumentMutation.mutateAsync(backendId);
        }
        setDocUploads((prev) => {
          const n = { ...prev };
          delete n[slotId];
          return n;
        });
        setVerifyModal((prev) => (prev?.docId === slotId ? null : prev));
        toast({
          title: "Document removed",
          description: backendId ? "The file was removed from this claim." : undefined,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not delete document";
        toast({ title: "Delete failed", description: message, variant: "destructive" });
      }
    },
    [deleteDocumentMutation, docUploads, docUploadsFromApi, toast]
  );

  const flushPendingDocuments = useCallback(async (): Promise<boolean> => {
    const claimIdForUpload = claim?.id || id;
    if (!claimIdForUpload) {
      toast({ title: "Cannot save", description: "Missing claim id.", variant: "destructive" });
      return false;
    }
    const pendingSlots = Object.entries(docUploads).filter(([, u]) => u.pendingFile);
    if (pendingSlots.length === 0) return true;

    for (const [slotId, u] of pendingSlots) {
      const file = u.pendingFile!;
      try {
        const uploadRes = await uploadDocumentMutation.mutateAsync({
          claimId: claimIdForUpload,
          files: [file],
          documentTypeId: slotId,
        });
        const items = parseUploadDocumentItems(uploadRes);
        const uploadedDoc = items[0];
        const uploadedDocId = typeof uploadedDoc?.id === "string" ? uploadedDoc.id : "";
        if (!uploadedDocId) throw new Error("Upload succeeded but document id is missing");
        await processOcrMutation.mutateAsync({
          documentId: uploadedDocId,
          body: buildProcessOcrBodyFromPending(slotId, u),
        });
        const ovr = u.pendingOverrideReasonsJson;
        if (ovr && typeof ovr === "object" && Object.keys(ovr).length > 0) {
          await overrideDocumentMutation.mutateAsync({
            documentId: uploadedDocId,
            overrideReasonsJson: ovr,
          });
        }
        const url = u.localPreviewUrl;
        if (url) URL.revokeObjectURL(url);
        setDocUploads((prev) => {
          const next = { ...prev };
          delete next[slotId];
          return next;
        });
      } catch (error) {
        const timedOut = isFetchAbortOrTimeout(error);
        const message = timedOut
          ? OCR_TIMEOUT_MESSAGE_TH
          : error instanceof Error
            ? error.message
            : "Failed to save document";
        toast({
          title: timedOut ? "OCR timeout" : "Save failed",
          description: message,
          variant: "destructive",
        });
        return false;
      }
    }
    await documentsQuery.refetch();
    return true;
  }, [
    claim?.id,
    id,
    docUploads,
    documentsQuery,
    overrideDocumentMutation,
    processOcrMutation,
    toast,
    uploadDocumentMutation,
  ]);

  /**
   * For documents already persisted on the server but stuck in `PENDING_DOCUMENT`.
   * User can manually trigger POST /documents/:id/process-ocr.
   */
  const handleProcessBackendDocOcr = useCallback(
    async (backendDocumentId: string, documentTypeId?: string) => {
      if (!backendDocumentId) return;
      try {
        await processOcrMutation.mutateAsync({
          documentId: backendDocumentId,
          body: {
            ...(documentTypeId ? { documentTypeId } : {}),
          },
        });
        toast({ title: "OCR started", description: "Processing document on server…" });
      } catch (error) {
        const timedOut = isFetchAbortOrTimeout(error);
        const message = timedOut
          ? OCR_TIMEOUT_MESSAGE_TH
          : error instanceof Error
            ? error.message
            : "Failed to process OCR";
        toast({ title: timedOut ? "OCR timeout" : "Process OCR failed", description: message, variant: "destructive" });
      } finally {
        void documentsQuery.refetch();
      }
    },
    [documentsQuery, processOcrMutation, toast],
  );

  const handleUploadDocument = useCallback(async (slotDocId: string, file: File) => {
    const fileSizeStr = formatFileSize(file.size);
    const mime = (file.type || "").toLowerCase();
    const typeLabel = mime.includes("pdf") ? "PDF" : mime.startsWith("image/") ? "Image" : "File";
    const localPreviewUrl = URL.createObjectURL(file);
    const newFile: UploadedFile = {
      id: `doc-${slotDocId}-${Date.now()}`,
      name: file.name,
      type: typeLabel,
      size: fileSizeStr,
      ocrStatus: "processing",
      documentTypeId: slotDocId,
      pendingFile: file,
      localPreviewUrl,
    };
    setDocUploads((prev) => {
      const prevRow = prev[slotDocId];
      if (prevRow?.localPreviewUrl) URL.revokeObjectURL(prevRow.localPreviewUrl);
      return { ...prev, [slotDocId]: newFile };
    });
    try {
      const claimIdForPreview = claim?.id || id;
      if (!claimIdForPreview) throw new Error("Missing claim id for preview");
      const preview = await previewDocumentMutation.mutateAsync({
        claimId: claimIdForPreview,
        file,
        documentTypeId: slotDocId,
      });
      const docLike = claimDocumentLikeFromPreview(
        file.name,
        file.size,
        file.type || "application/octet-stream",
        preview,
      );
      const ocrData = claimDocumentToOcrExtractedData(docLike);
      const ocrStatus = mapBackendDocStatusToUi(docLike.status, docLike.errorType);
      setDocUploads((prev) =>
        prev[slotDocId]
          ? {
              ...prev,
              [slotDocId]: {
                ...prev[slotDocId],
                ocrStatus,
                ocrData,
                pendingValidation: docLike.validationResult,
                pendingProcessOcrBase: preview.extracted as Record<string, unknown>,
              },
            }
          : prev
      );
    } catch (error) {
      if (isFetchAbortOrTimeout(error)) {
        setDocUploads((prev) =>
          prev[slotDocId]
            ? {
                ...prev,
                [slotDocId]: {
                  ...prev[slotDocId],
                  ocrStatus: "ocr_timeout",
                },
              }
            : prev
        );
        toast({ title: "OCR timeout", description: OCR_TIMEOUT_MESSAGE_TH, variant: "destructive" });
        return;
      }
      URL.revokeObjectURL(localPreviewUrl);
      setDocUploads((prev) =>
        prev[slotDocId]
          ? {
              ...prev,
              [slotDocId]: {
                ...prev[slotDocId],
                ocrStatus: "wrong_doc_type",
                pendingFile: undefined,
                localPreviewUrl: undefined,
              },
            }
          : prev
      );
      const message = error instanceof Error ? error.message : "Failed to process document preview";
      toast({ title: "Document preview failed", description: message, variant: "destructive" });
    }
  }, [claim?.id, id, previewDocumentMutation, toast]);

  const handleRetryOcrPreview = useCallback(
    async (slotDocId: string) => {
      const row = docUploads[slotDocId];
      const file = row?.pendingFile;
      if (!file) return;
      const previewUrl = row.localPreviewUrl;
      setDocUploads((prev) =>
        prev[slotDocId]
          ? { ...prev, [slotDocId]: { ...prev[slotDocId], ocrStatus: "processing" } }
          : prev
      );
      try {
        const claimIdForPreview = claim?.id || id;
        if (!claimIdForPreview) throw new Error("Missing claim id for preview");
        const preview = await previewDocumentMutation.mutateAsync({
          claimId: claimIdForPreview,
          file,
          documentTypeId: slotDocId,
        });
        const docLike = claimDocumentLikeFromPreview(
          file.name,
          file.size,
          file.type || "application/octet-stream",
          preview,
        );
        const ocrData = claimDocumentToOcrExtractedData(docLike);
        const ocrStatus = mapBackendDocStatusToUi(docLike.status, docLike.errorType);
        setDocUploads((prev) =>
          prev[slotDocId]
            ? {
                ...prev,
                [slotDocId]: {
                  ...prev[slotDocId],
                  ocrStatus,
                  ocrData,
                  pendingValidation: docLike.validationResult,
                  pendingProcessOcrBase: preview.extracted as Record<string, unknown>,
                },
              }
            : prev
        );
      } catch (error) {
        if (isFetchAbortOrTimeout(error)) {
          setDocUploads((prev) =>
            prev[slotDocId]
              ? { ...prev, [slotDocId]: { ...prev[slotDocId], ocrStatus: "ocr_timeout" } }
              : prev
          );
          toast({ title: "OCR timeout", description: OCR_TIMEOUT_MESSAGE_TH, variant: "destructive" });
          return;
        }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setDocUploads((prev) =>
          prev[slotDocId]
            ? {
                ...prev,
                [slotDocId]: {
                  ...prev[slotDocId],
                  ocrStatus: "wrong_doc_type",
                  pendingFile: undefined,
                  localPreviewUrl: undefined,
                },
              }
            : prev
        );
        const message = error instanceof Error ? error.message : "Failed to process document preview";
        toast({ title: "Document preview failed", description: message, variant: "destructive" });
      }
    },
    [claim?.id, docUploads, id, previewDocumentMutation, toast],
  );

  const handleVerifyConfirm = useCallback(async (docId: string, _data: OcrExtractedData, meta?: OcrVerifyConfirmMeta) => {
    const targetDoc = docUploads[docId] ?? docUploadsFromApi[docId];
    if (!targetDoc) {
      toast({
        title: "Cannot verify",
        description: "Document slot not found. Save draft or refresh the page, then try again.",
        variant: "destructive",
      });
      return;
    }
    const reasons = meta?.overrideReasonsJson;
    const hasOverrideReasons =
      !!reasons &&
      typeof reasons === "object" &&
      Object.keys(reasons).some((k) => String((reasons as Record<string, string>)[k] ?? "").trim() !== "");

    let effectiveBid = targetDoc.backendDocumentId;
    let serverDoc: { status: string; errorType?: string | null } | null = null;
    let didUploadVerifyPipeline = false;

    const claimIdForUpload = claim?.id ?? id;
    const pendingFile = targetDoc.pendingFile;
    const typeIdForBody = targetDoc.documentTypeId ?? docId;

    /** Upload pending file + process-ocr (+ override) so Confirm works without Save Draft */
    if (!effectiveBid && pendingFile && claimIdForUpload) {
      if (hasOverrideReasons && reasons) {
        didUploadVerifyPipeline = true;
        try {
          const uploadRes = await uploadDocumentMutation.mutateAsync({
            claimId: claimIdForUpload,
            files: [pendingFile],
            documentTypeId: docId,
          });
          const items = parseUploadDocumentItems(uploadRes);
          const uploadedDoc = items[0];
          const uploadedDocId = typeof uploadedDoc?.id === "string" ? uploadedDoc.id : "";
          if (!uploadedDocId) throw new Error("Upload succeeded but document id is missing");
          const processRes = await processOcrMutation.mutateAsync({
            documentId: uploadedDocId,
            body: buildProcessOcrBodyFromPending(typeIdForBody, {
              ...targetDoc,
              ocrData: _data,
            } as UploadedFile),
          });
          const ovrRes = await overrideDocumentMutation.mutateAsync({
            documentId: uploadedDocId,
            overrideReasonsJson: reasons,
          });
          effectiveBid = uploadedDocId;
          serverDoc =
            unwrapUploadedDocumentFromMutation(ovrRes) ??
            unwrapUploadedDocumentFromMutation(processRes) ??
            { status: "VERIFIED", errorType: null };
        } catch (error) {
          const timedOut = isFetchAbortOrTimeout(error);
          const message = timedOut
            ? OCR_TIMEOUT_MESSAGE_TH
            : error instanceof Error
              ? error.message
              : "Verification failed";
          toast({
            title: timedOut ? "OCR timeout" : "Verification failed",
            description: message,
            variant: "destructive",
          });
          return;
        }
      } else if (meta?.localVerifyComplete) {
        didUploadVerifyPipeline = true;
        try {
          const uploadRes = await uploadDocumentMutation.mutateAsync({
            claimId: claimIdForUpload,
            files: [pendingFile],
            documentTypeId: docId,
          });
          const items = parseUploadDocumentItems(uploadRes);
          const uploadedDoc = items[0];
          const uploadedDocId = typeof uploadedDoc?.id === "string" ? uploadedDoc.id : "";
          if (!uploadedDocId) throw new Error("Upload succeeded but document id is missing");
          const res = await processOcrMutation.mutateAsync({
            documentId: uploadedDocId,
            body: buildProcessOcrBodyFromPending(typeIdForBody, {
              ...targetDoc,
              ocrData: _data,
            } as UploadedFile),
          });
          effectiveBid = uploadedDocId;
          serverDoc = unwrapUploadedDocumentFromMutation(res) ?? { status: "VERIFIED", errorType: null };
        } catch (error) {
          const timedOut = isFetchAbortOrTimeout(error);
          const message = timedOut
            ? OCR_TIMEOUT_MESSAGE_TH
            : error instanceof Error
              ? error.message
              : "Could not verify document";
          toast({
            title: timedOut ? "OCR timeout" : "Verification failed",
            description: message,
            variant: "destructive",
          });
          return;
        }
      }
    }

    if (!effectiveBid && hasOverrideReasons) {
      toast({
        title: "Cannot verify",
        description: pendingFile
          ? !claimIdForUpload
            ? "Missing claim id. Refresh the page and try again."
            : "Could not upload the document. Check your connection and try again."
          : "The file is not available. Re-upload the document and try again.",
        variant: "destructive",
      });
      setVerifyModal(null);
      return;
    }

    if (!effectiveBid && meta?.localVerifyComplete) {
      setDocUploads((prev) => ({
        ...prev,
        [docId]: {
          ...(prev[docId] ?? targetDoc),
          ocrData: _data,
          ocrStatus: "verified",
          submitEligible: true,
        },
      }));
      setVerifyModal(null);
      return;
    }

    if (!didUploadVerifyPipeline) {
      if (effectiveBid && hasOverrideReasons && reasons) {
        try {
          const res = await overrideDocumentMutation.mutateAsync({
            documentId: effectiveBid,
            overrideReasonsJson: reasons,
          });
          serverDoc = unwrapUploadedDocumentFromMutation(res) ?? { status: "VERIFIED", errorType: null };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Override failed";
          toast({ title: "Verification failed", description: message, variant: "destructive" });
          return;
        }
      } else if (effectiveBid) {
        try {
          const res = await processOcrMutation.mutateAsync({
            documentId: effectiveBid,
            body: buildProcessOcrBodyFromPending(typeIdForBody, {
              ...targetDoc,
              ocrData: _data,
            } as UploadedFile),
          });
          serverDoc = unwrapUploadedDocumentFromMutation(res);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Could not verify document";
          toast({ title: "Verification failed", description: message, variant: "destructive" });
          return;
        }
      }
    }

    const claimIdForDocs = claim?.id ?? id;
    if (effectiveBid && claimIdForDocs) {
      await documentsQuery.refetch();
    }

    const listAfter =
      effectiveBid && claimIdForDocs
        ? queryClient.getQueryData<ClaimDocument[]>(["claim-documents", claimIdForDocs])
        : undefined;
    const rd = effectiveBid ? listAfter?.find((d) => d.id === effectiveBid) : undefined;

    const effectiveStatus = rd?.status ?? serverDoc?.status;
    const effectiveError = rd?.errorType ?? serverDoc?.errorType ?? undefined;
    const nextUi =
      effectiveStatus != null && String(effectiveStatus).trim() !== ""
        ? mapBackendDocStatusToUi(String(effectiveStatus), effectiveError ?? undefined)
        : null;

    if (didUploadVerifyPipeline && rd && targetDoc.localPreviewUrl) {
      URL.revokeObjectURL(targetDoc.localPreviewUrl);
    }

    setDocUploads((prev) => {
      if (effectiveBid && rd) {
        const next = { ...prev };
        delete next[docId];
        return next;
      }
      const row = prev[docId] ?? targetDoc;
      return {
        ...prev,
        [docId]: {
          ...row,
          ocrData: _data,
          ...(nextUi
            ? {
                ocrStatus: nextUi,
                submitEligible: nextUi === "verified",
              }
            : {}),
          ...(hasOverrideReasons && reasons ? { pendingOverrideReasonsJson: reasons } : {}),
        },
      };
    });
    setVerifyModal(null);
  }, [
    claim?.id,
    docUploads,
    docUploadsFromApi,
    documentsQuery,
    id,
    overrideDocumentMutation,
    processOcrMutation,
    queryClient,
    toast,
    uploadDocumentMutation,
  ]);

  if (claimDetailQuery.isLoading && !claim) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-2">Loading claim detail...</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">Claim not found</p>
        <Button variant="link" onClick={() => navigate("/claims")}>Back to claims</Button>
      </div>
    );
  }

  const latestApprovedStep = [...claim.approvalHistory].reverse().find((s) => s.action === "Approved");
  const latestRejectedStep = [...claim.approvalHistory].reverse().find((s) => s.action === "Rejected");
  const latestRequestInfoStep = [...claim.approvalHistory].reverse().find((s) => s.action === "Request Info");
  const isReadOnlyAfterSubmit =
    claim.readOnly ?? (claim.status !== "Pending Invoice" && claim.status !== "Returned For Info");

  const fallbackStatusLabel =
    claim.status === "Auto Approved"
      ? "AUTO_APPROVED"
      : claim.status === "Manager Approved" || claim.status === "Reimbursed"
        ? "MANAGER_APPROVED"
        : claim.status === "Auto Reject"
          ? "AUTO_REJECTED"
          : claim.status === "Reject" ||
              claim.status === "Final Rejected"
            ? "MANAGER_REJECTED"
            : latestRequestInfoStep
              ? "PENDING_APPROVAL"
              : claim.status === "Pending Approval" ||
                    claim.status === "Returned For Info" ||
                    claim.status === "Pending Salary Deduction"
                ? "PENDING_APPROVAL"
                : !requiredDocVerified
                  ? requiredDoc
                    ? "PENDING_DOCUMENTS"
                    : "NOT_STARTED"
                  : "READY_FOR_APPROVAL";

  const rawStatusLabel = claim.statusDisplay ?? fallbackStatusLabel;
  const documentStatusLabel = toDocumentContractStatus(
    claim.corpTxnDocumentStatus || deriveDocumentStatusLabelFromClaimDocs(documentsQuery.data ?? []),
  );
  const statusLabel = toApprovalContractStatus(rawStatusLabel, documentStatusLabel);

  const statusMetaFromApi = claim.statusMeta
    ? [
      claim.statusMeta.submittedBy ? `Submitted by ${claim.statusMeta.submittedBy}` : "",
      claim.statusMeta.submittedDate ? `Submitted on ${formatBEDate(claim.statusMeta.submittedDate)}` : "",
      claim.statusMeta.approverName ? `Approved by ${claim.statusMeta.approverName}` : "",
      claim.statusMeta.approvalDate ? formatBEDate(claim.statusMeta.approvalDate) : "",
      claim.statusMeta.rejectedBy ? `Rejected by ${claim.statusMeta.rejectedBy}` : "",
      claim.statusMeta.rejectedReason ? `Reason: ${claim.statusMeta.rejectedReason}` : "",
      claim.statusMeta.actionRequiredComment ? `Action required · ${claim.statusMeta.actionRequiredComment}` : "",
      claim.statusMeta.autoApprovalRule ? `Rule: ${claim.statusMeta.autoApprovalRule}` : "",
      claim.statusMeta.deductionPayPeriod ? `Salary Deduction: ${claim.statusMeta.deductionPayPeriod}${claim.statusMeta.deductionInstallment ? ` — Installment ${claim.statusMeta.deductionInstallment}` : ""}` : "",
      claim.statusMeta.deductionFallbackMessage || "",
    ].filter(Boolean).join(" · ")
    : "";

  const card = claim.linkedBankTransaction;
  const cardTransactionNo = card?.transactionId || claim.bankTransactionId || id || claim.claimNo;
  const cardTxnDateStr =
    card?.transactionDate && String(card.transactionDate).trim() !== ""
      ? card.transactionDate
      : claim.createdDate;
  const cardMerchant = card?.merchantName || claim.merchantName || "—";
  const cardBillingAmount = card ? card.billingAmount : claim.totalAmount;
  const cardCurrency = card?.billingCurrency || claim.currency || "THB";
  const cardMccDescription = card?.mccDescription || claim.merchantName || claim.purpose || "—";
  const pageTitlePrimary = card
    ? cardTransactionNo
    : claim.claimNo;
  const pageTitleSecondary = card
    ? cardMccDescription
    : claim.purpose || claim.merchantName || "Taxicabs and Limousines";

  const statusMeta = statusMetaFromApi || (
    statusLabel === "PENDING_APPROVAL"
      ? `Submitted by ${claim.requesterName} · ${claim.department} · Submitted on ${formatBEDate(claim.submittedDate || claim.createdDate)}`
      : statusLabel === "MANAGER_APPROVED" || statusLabel === "AUTO_APPROVED"
        ? `Approved by ${latestApprovedStep?.approverName || "Manager"}${latestApprovedStep?.actionDate ? ` · ${formatBEDate(latestApprovedStep.actionDate)}` : ""}`
        : statusLabel === "AUTO_REJECTED" || statusLabel === "MANAGER_REJECTED"
          ? `Rejected by ${latestRejectedStep?.approverName || "Manager"}${latestRejectedStep?.comment ? ` · Reason: ${latestRejectedStep.comment}` : ""}`
          : statusLabel === "READY_FOR_APPROVAL"
            ? "Documents validated. Ready to proceed to approval."
            : statusLabel === "PENDING_DOCUMENTS"
              ? "Upload required documents and complete OCR validation."
              : statusLabel === "NOT_STARTED"
                ? "Transaction imported. Document processing not started yet."
                : `Submitted by ${claim.requesterName} · ${claim.department}`
  );

  const handleSaveDraft = async () => {
    const claimUuid = claim?.id;
    if (!claimUuid) {
      toast({ title: "Cannot save", description: "Missing claim id.", variant: "destructive" });
      return;
    }
    try {
      setDraftSaving(true);
      const hadPending = Object.values(docUploads).some((u) => !!u.pendingFile);
      const ok = await flushPendingDocuments();
      if (!ok) return;
      await saveDraftMutation.mutateAsync({
        claimId: claimUuid,
        body: {
          purpose: purpose.trim() || undefined,
          expenseTypeId: expenseType || undefined,
          subExpenseTypeId: subExpenseType || undefined,
          vatTypeId: vatType || undefined,
          glAccountId: glAccount || undefined,
        },
      });
      await claimDetailQuery.refetch();
      toast({
        title: "Draft saved",
        description: hadPending
          ? "Business info and documents are stored on the server. Continue editing or submit when ready."
          : "Business info saved on the server.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setDraftSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const newErrors: Record<string, string> = {};
    if (!purpose.trim()) newErrors.purpose = "Purpose is required";
    if (!expenseType || !selectedExpenseTypeRow) {
      newErrors.expenseType = expenseType
        ? "This expense type is no longer available — please select again."
        : "Expense Type is required";
    }
    if (!subExpenseType || !selectedSubExpenseTypeRow) {
      newErrors.subExpenseType = subExpenseType
        ? "This sub expense type is no longer available — please select again."
        : "Sub Expense Type is required";
    }
    if (!vatTypeValid) {
      newErrors.vatType = vatType ? "Invalid VAT type — please select again." : "Please select VAT Type";
    }
    if (!glAccountValid) {
      newErrors.glAccount = glAccount
        ? "This GL account is not valid for the selected expense type — please select again."
        : "Please select GL Account";
    }
    if (!docRequirementMet) {
      newErrors.documents =
        "Please upload and verify your receipt or tax invoice, or confirm you have no document to attach.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({ title: "Validation Error", description: "Please complete all required fields.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Session error", description: "Unable to read user profile for submit.", variant: "destructive" });
      return;
    }

    if (!(await flushPendingDocuments())) return;

    const submitClaimId = claim.id;
    if (!submitClaimId) {
      toast({ title: "Cannot submit", description: "Missing claim id.", variant: "destructive" });
      return;
    }

    // Save Business Info to DB before submitting (local state is not auto-persisted)
    try {
      await saveDraftMutation.mutateAsync({
        claimId: submitClaimId,
        body: {
          purpose: purpose.trim() || undefined,
          expenseTypeId: expenseType || undefined,
          subExpenseTypeId: subExpenseType || undefined,
          vatTypeId: vatType || undefined,
          glAccountId: glAccount || undefined,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save business info";
      toast({ title: "Save failed", description: message, variant: "destructive" });
      return;
    }

    submitClaimMutation.mutate(
      {
        claimId: submitClaimId,
        noDocumentConfirmed: requiredDocumentType ? confirmNoDocument : false,
      },
      {
        onSuccess: async (updated) => {
          setErrors({});
          await claimDetailQuery.refetch();
          const statusRaw = (updated as { status?: string })?.status ?? "";
          const norm = String(statusRaw).toUpperCase().replace(/\s+/g, "_");
          const finalizedAuto = norm === "AUTO_APPROVED";
          const finalizedAutoReject = norm === "AUTO_REJECT";
          toast(
            finalizedAutoReject
              ? {
                  title: "Recorded",
                  description: `${claim.claimNo} — policy auto-reject (documents not required). Claim status updated to match corporate card.`,
                }
              : finalizedAuto
                ? {
                    title: "Completed",
                    description: `${claim.claimNo} — documents validated. Policy pre-approved expense; approval steps recorded automatically (no action required in inbox).`,
                  }
                : {
                    title: "Submitted",
                    description: `${claim.claimNo} has been submitted for approval.`,
                  },
          );
          navigate("/claims");
        },
        onError: (error) => {
          if (isLikelyNetworkError(error)) {
            toast({
              title: "ส่งคำขอไม่สำเร็จ",
              description: "ไม่สามารถส่งคำขอได้ในขณะนี้ — กรุณาลองใหม่",
              variant: "destructive",
            });
            return;
          }
          const message = error instanceof Error ? error.message : "Failed to submit claim";
          toast({ title: "Submit failed", description: message, variant: "destructive" });
        },
      }
    );
  };

  const handleAction = (type: "approve" | "reject" | "info") => {
    const newStatus = type === "approve" ? "Auto Approved" : type === "reject" ? "Final Rejected" : "Pending Approval";
    const actionLabel = type === "approve" ? "Approved" : type === "reject" ? "Rejected" : "Request Info";
    const nextAction: "Approved" | "Rejected" | "Request Info" = actionLabel;
    updateClaim(claim.id, {
      status: newStatus,
      approvalHistory: claim.approvalHistory.map((s, i) =>
        i === claim.approvalHistory.length - 1
          ? { ...s, action: nextAction, comment, actionDate: new Date().toISOString().slice(0, 10) }
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
    if (!claim || !user) return;
    approveClaimMutation.mutate(
      { claimId: claim.id, approverId: user.id, approverName: user.name },
      {
        onSuccess: () => {
          toast({ title: "Claim Approved", description: `${claim.claimNo} has been approved.` });
          navigate("/approvals");
        },
        onError: (err) =>
          toast({
            title: "ไม่สามารถอนุมัติได้",
            description: err.message,
            variant: "destructive",
          }),
      },
    );
  };

  const handleApproverReject = () => {
    if (!rejectReason.trim() || !claim || !user) return;
    rejectClaimMutation.mutate(
      { claimId: claim.id, approverId: user.id, approverName: user.name, comment: rejectReason },
      {
        onSuccess: () => {
          toast({ title: "Claim Rejected", description: `${claim.claimNo} has been rejected.` });
          navigate("/approvals");
        },
        onError: (err) =>
          toast({
            title: "ไม่สามารถปฏิเสธได้",
            description: err.message,
            variant: "destructive",
          }),
      },
    );
  };

  if (!isApproverView && isReadOnlyAfterSubmit) {
    const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const roBiz = businessInfoReadOnlyLabels(claim, expenseTypeOptions, glAccountsQuery.data?.data ?? []);
    const roExpenseRow = expenseTypeOptions.find((et) => et.id === claim.expenseTypeId);
    const roSubRow = roExpenseRow?.subtypes?.find((st) => st.id === claim.subExpenseTypeId);
    const roSubtypeDocTypes = roSubRow?.documentTypes ?? [];
    const roRequiredDocType = roSubtypeDocTypes.find((d) => !d.documentType.isSupportDocument)?.documentType;
    const roOptionalDocTypes = roSubtypeDocTypes
      .filter((d) => d.documentType.isSupportDocument)
      .map((d) => d.documentType);
    const roDocSort = (a: ClaimDocument, b: ClaimDocument) =>
      new Date(b.updatedAt || b.createdAt || 0).getTime() -
      new Date(a.updatedAt || a.createdAt || 0).getTime();
    const roAllDocs = [...(documentsQuery.data ?? [])].sort(roDocSort);
    const roKnownTypeIds = new Set<string>();
    if (roRequiredDocType) roKnownTypeIds.add(roRequiredDocType.id);
    roOptionalDocTypes.forEach((t) => roKnownTypeIds.add(t.id));
    const roRequiredDocs = roRequiredDocType
      ? roAllDocs.filter((d) => d.documentTypeId === roRequiredDocType.id)
      : [];
    const roOtherDocs = roAllDocs.filter(
      (d) => !d.documentTypeId || !roKnownTypeIds.has(d.documentTypeId),
    );
    const roCanBucketDocs = roRequiredDocType != null || roOptionalDocTypes.length > 0;

    return (
      <div className="pb-20 max-w-5xl mx-auto">
        <div className="sticky top-0 z-40 bg-background border-b border-border -mx-4 px-4 md:-mx-6 md:px-6">
          <div className="flex items-center gap-3 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">
                {pageTitlePrimary} · {pageTitleSecondary}
              </h1>
            </div>
            <div className="shrink-0" />
          </div>
        </div>

        <p className="text-[13px] text-muted-foreground mt-4 mb-6">{statusMeta}</p>

        <ResponsePanel claim={claim} />

        <div className="space-y-8">
          <section>
            <SectionDivider num={1} label="Card Transaction" />
            <Card className="bg-muted/40 border border-border rounded-xl">
              <CardContent className="pt-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
                  <Row label="Transaction No." value={cardTransactionNo} />
                  <Row label="Date" value={formatBEDate(cardTxnDateStr)} />
                  <Row label="Merchant" value={cardMerchant} />
                  <Row label="Amount" value={`${fmt(cardBillingAmount)} ${cardCurrency}`} />
                  <Row label="MCC Description" value={cardMccDescription} className="sm:col-span-2" />
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <SectionDivider num={2} label="Business Info" />
            <Card className="border border-border rounded-xl">
              <CardContent className="pt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-muted-foreground">Purpose</Label>
                  <p className="text-[13px] text-foreground">{claim.purpose || "—"}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReadOnlyField label="Expense Type" value={roBiz.expenseType} />
                  <ReadOnlyField label="Sub Expense Type" value={roBiz.subExpenseType} />
                  <ReadOnlyField label="VAT Type" value={roBiz.vatType} />
                  <ReadOnlyField label="GL Account" value={roBiz.glAccount} />
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <SectionDivider num={3} label="Documents" />
            <Card className="border border-border rounded-xl">
              <CardContent className="pt-5 space-y-4">
                {statusLabel !== "NOT_STARTED" && statusLabel !== "PENDING_DOCUMENTS" && (
                  <p className="text-[13px] text-muted-foreground">
                    Documents are read-only after submission. You can preview files below.
                  </p>
                )}
                {documentsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    Loading documents…
                  </div>
                ) : (documentsQuery.data?.length ?? 0) === 0 ? (
                  <p className="text-[13px] text-muted-foreground">
                    {statusLabel === "NOT_STARTED"
                      ? "No document uploaded yet."
                      : "No documents on file for this claim."}
                  </p>
                ) : roCanBucketDocs ? (
                  <div className="space-y-5">
                    {roRequiredDocType && (
                      <div className="space-y-2">
                        <p className="text-[13px] font-semibold text-red-700 flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />
                          Required — {roRequiredDocType.documentName}
                        </p>
                        {roRequiredDocs.length === 0 ? (
                          <p className="text-[13px] text-muted-foreground">No file attached.</p>
                        ) : (
                          <ul className="space-y-2">
                            {roRequiredDocs.map((doc) => (
                              <ReadOnlyClaimDocumentRow
                                key={doc.id}
                                doc={doc}
                                onPreview={setReadOnlyPreviewDoc}
                                slotLabel={roRequiredDocType.documentName}
                                afterManagerAcceptance={isClaimPostManagerDocumentAcceptance(claim.status)}
                              />
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {roOptionalDocTypes.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[13px] font-semibold text-muted-foreground flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
                          Optional — Attach supporting Documents
                        </p>
                        {roOptionalDocTypes.map((opt) => {
                          const slotDocs = roAllDocs.filter((d) => d.documentTypeId === opt.id);
                          return (
                            <div key={opt.id} className="space-y-2">
                              {slotDocs.length === 0 ? (
                                <>
                                  <p className="text-[12px] font-medium text-foreground">{opt.documentName}</p>
                                  <p className="text-[12px] text-muted-foreground">No file attached.</p>
                                </>
                              ) : (
                                <ul className="space-y-2">
                                  {slotDocs.map((doc) => (
                                    <ReadOnlyClaimDocumentRow
                                      key={doc.id}
                                      doc={doc}
                                      onPreview={setReadOnlyPreviewDoc}
                                      slotLabel={opt.documentName}
                                      afterManagerAcceptance={isClaimPostManagerDocumentAcceptance(claim.status)}
                                    />
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {roOtherDocs.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[13px] font-semibold text-muted-foreground">
                          Other attachments
                          <span className="font-normal text-[11px] text-muted-foreground/90 ml-1.5">
                            (type not matched to this expense setup or legacy upload)
                          </span>
                        </p>
                        <ul className="space-y-2">
                          {roOtherDocs.map((doc) => (
                            <ReadOnlyClaimDocumentRow
                              key={doc.id}
                              doc={doc}
                              onPreview={setReadOnlyPreviewDoc}
                              afterManagerAcceptance={isClaimPostManagerDocumentAcceptance(claim.status)}
                            />
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {roAllDocs.map((doc) => (
                      <ReadOnlyClaimDocumentRow
                        key={doc.id}
                        doc={doc}
                        onPreview={setReadOnlyPreviewDoc}
                        afterManagerAcceptance={isClaimPostManagerDocumentAcceptance(claim.status)}
                      />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {readOnlyPreviewDoc && (
          <OcrVerifyModal
            open={!!readOnlyPreviewDoc}
            onClose={() => setReadOnlyPreviewDoc(null)}
            readOnly
            fileName={readOnlyPreviewDoc.fileName || "Document"}
            fileType={
              (readOnlyPreviewDoc.mimeType || "").toLowerCase().includes("pdf")
                ? "PDF"
                : (readOnlyPreviewDoc.mimeType || "").startsWith("image/")
                  ? "Image"
                  : "File"
            }
            initialData={claimDocumentToOcrExtractedData(readOnlyPreviewDoc)}
            documentId={readOnlyPreviewDoc.id}
          />
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // APPROVER VIEW — read-only with approval decision panel
  // ══════════════════════════════════════════════════════
  if (isApproverView) {
    const approverBiz = businessInfoReadOnlyLabels(claim, expenseTypeOptions, glAccountsQuery.data?.data ?? []);
    const approverAllDocs = [...(documentsQuery.data ?? [])].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
    );

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
                {pageTitlePrimary} · {pageTitleSecondary}
              </h1>
            </div>
            <Badge variant="outline" className={cn(
              "shrink-0",
              claim.status === "Final Rejected"
                ? "border-red-400 bg-red-100 text-red-900"
                : claim.status === "Returned For Info"
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-amber-300 bg-amber-50 text-amber-700"
            )}>
              {claim.status}
            </Badge>
          </div>
        </div>

        {/* Submitted-by header */}
        <p className="text-[13px] text-muted-foreground mt-4 mb-6">{statusMeta}</p>

        <ResponsePanel claim={claim} />

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
                  <Row label="Transaction No." value={cardTransactionNo} />
                  <Row label="Date" value={formatBEDate(cardTxnDateStr)} />
                  <Row label="Merchant" value={cardMerchant} />
                  <Row label="Amount" value={`${fmt(cardBillingAmount)} ${cardCurrency}`} />
                  <Row label="MCC Description" value={cardMccDescription} className="sm:col-span-2" />
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
                  <p className="text-[13px] text-foreground">{claim.purpose || "—"}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReadOnlyField label="Expense Type" value={approverBiz.expenseType} />
                  <ReadOnlyField label="Sub Expense Type" value={approverBiz.subExpenseType} />
                  <ReadOnlyField label="VAT Type" value={approverBiz.vatType} />
                  <ReadOnlyField label="GL Account" value={approverBiz.glAccount} />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ══════ SECTION 3 — DOCUMENTS (Read-Only) ══════ */}
          <section>
            <SectionDivider num={3} label="Documents" />
            <Card className="border border-border rounded-xl">
              <CardContent className="pt-5 space-y-3">
                {approverAllDocs.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">No documents attached.</p>
                ) : (
                  approverAllDocs.map((doc) => (
                    <ReadOnlyClaimDocumentRow
                      key={doc.id}
                      doc={doc}
                      onPreview={setReadOnlyPreviewDoc}
                      afterManagerAcceptance={isClaimPostManagerDocumentAcceptance(claim.status)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </section>

          {/* ══════ SECTION 4 — AUDIT TRAIL ══════ */}
          <AuditTrail events={claim.status === "Final Rejected" ? FINAL_REJECTED_TRAIL : REQUEST_INFO_TRAIL} />
        </div>


        {/* ══════ APPROVAL DECISION PANEL (Fixed Bottom) ══════ */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-4 z-50">
          <div className="max-w-5xl mx-auto">
            {claim.status === "Final Rejected" ? (
              <p className="text-center text-muted-foreground text-[13px]">
                🔒  Permanently closed — no actions available
              </p>
            ) : (
              <>
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
                            disabled={claim.status === "Returned For Info"}
                            onClick={() => setRequestInfoOpen(true)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" /> Request Info
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {claim.status === "Returned For Info" && (
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
              </>
            )}
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
                  updateClaim(claim.id, { status: "Returned For Info" as any });
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
        {readOnlyPreviewDoc && (
          <OcrVerifyModal
            open={!!readOnlyPreviewDoc}
            onClose={() => setReadOnlyPreviewDoc(null)}
            readOnly
            fileName={readOnlyPreviewDoc.fileName || "Document"}
            fileType={
              (readOnlyPreviewDoc.mimeType || "").toLowerCase().includes("pdf")
                ? "PDF"
                : (readOnlyPreviewDoc.mimeType || "").startsWith("image/")
                ? "IMAGE"
                : "PDF"
            }
            initialData={claimDocumentToOcrExtractedData(readOnlyPreviewDoc)}
            documentId={readOnlyPreviewDoc.id}
            validationContext={activeEntity ? {
              companyTaxId: activeEntityTaxId,
              companyAddress: activeEntityAddress,
              bankAmount: cardBillingAmount,
              transactionDate: cardTxnDateStr,
            } : undefined}
          />
        )}
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
              {pageTitlePrimary} · {pageTitleSecondary}
            </h1>
          </div>
          <div className="shrink-0" />
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground mt-4 mb-2">{statusMeta}</p>

      {(() => {
        const cct = (claim as unknown as { corpCardTransaction?: Record<string, unknown> })?.corpCardTransaction;
        const reason = (cct?.policyReason as string) || (claim as unknown as { policyReason?: string })?.policyReason;
        const isAging = reason === "AGING_TIMEOUT" || (claim?.status === "Auto Reject" && cardTransactionNo && (cardTransactionNo === "TXN20260420001" || cardTransactionNo === "TXN20260418002"));
        if (!isAging) return null;
        const isCase2 = cardTransactionNo === "TXN20260418002";
        const created = isCase2 ? "18 Apr 2026" : "20 Apr 2026";
        const rejected = isCase2 ? "21 Apr 2026" : "23 Apr 2026";
        return (
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-5 mt-2 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-base font-bold text-red-900">This transaction was auto-rejected</h3>
                  <p className="text-sm text-red-800 mt-1">
                    Documents were not attached within 3 calendar days from the creation date (weekends and public holidays included). This rejection was made automatically by the system on {rejected} at 23:30.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs bg-white/60 rounded-md p-3 border border-red-200">
                  <div className="flex justify-between"><span className="text-red-900/70">Created on</span><span className="font-mono text-red-900">{created}</span></div>
                  <div className="flex justify-between"><span className="text-red-900/70">Auto-rejected on</span><span className="font-mono text-red-900">{rejected} at 23:30</span></div>
                  <div className="flex justify-between"><span className="text-red-900/70">Calendar days elapsed</span><span className="font-mono text-red-900">3</span></div>
                  <div className="flex justify-between"><span className="text-red-900/70">Threshold</span><span className="font-mono text-red-900">3 calendar days</span></div>
                  <div className="flex justify-between"><span className="text-red-900/70">Document status</span><span className="font-mono text-red-900">PENDING_DOCUMENTS</span></div>
                  <div className="flex justify-between"><span className="text-red-900/70">Rejection reason code</span><span className="font-mono text-red-900">AGING_TIMEOUT</span></div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Button variant="outline" size="sm" className="border-red-400 text-red-700 hover:bg-red-100">
                    Contact Finance to Re-open
                  </Button>
                  <a href="#" className="text-xs text-red-700 underline-offset-4 hover:underline">Learn about the 3-day policy</a>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                <Row label="Transaction No." value={cardTransactionNo} />
                <Row label="Date" value={formatBEDate(cardTxnDateStr)} />
                <Row label="Merchant" value={cardMerchant} />
                <Row label="Amount" value={`${fmt(cardBillingAmount)} ${cardCurrency}`} />
                <Row label="MCC Description" value={cardMccDescription} className="sm:col-span-2" />
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
                  placeholder="Describe the business purpose"
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
                    setConfirmNoDocument(false);
                    setDocUploads({});
                    setErrors((p) => ({ ...p, expenseType: "" }));
                  }}>
                    <SelectTrigger className="text-[13px]"><SelectValue placeholder="Select expense type" /></SelectTrigger>
                    <SelectContent>
                      {expenseTypeOptions.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-[13px]">
                          {t.expenseType}
                        </SelectItem>
                      ))}
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
                      setGlAccount("");
                      setVatType("");
                      setConfirmNoDocument(false);
                      setDocUploads({});
                      setErrors((p) => ({ ...p, subExpenseType: "", vatType: "", glAccount: "" }));
                    }}
                    disabled={!expenseType}
                  >
                    <SelectTrigger className="text-[13px]"><SelectValue placeholder={expenseType ? "Select sub type" : "Select expense type first"} /></SelectTrigger>
                    <SelectContent>
                      {subExpenseTypeOptions.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-[13px]">
                          {t.subExpenseType}
                        </SelectItem>
                      ))}
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
                  <Select
                    value={glAccount}
                    onValueChange={(v) => { setGlAccount(v); setErrors((p) => ({ ...p, glAccount: "" })); }}
                    disabled={!expenseType}
                  >
                    <SelectTrigger className="text-[13px]">
                      <SelectValue placeholder={expenseType ? "Select GL Account" : "Select expense type first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {glAccountOptions.map((gl) => (
                        <SelectItem key={gl.id} value={gl.id} className="text-[13px]">
                          {gl.accountCode} — {gl.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.glAccount && <p className="text-xs text-destructive">{errors.glAccount}</p>}
                </div>
              </div>

              {/* Auto Reject banner (hidden when corp card already policy auto-reject + no doc — user may still submit to record) */}
              {isAutoReject && selectedConfig?.notes && !corpPolicyAutoRejectNoDoc && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-[13px] text-red-800 font-medium">
                    ❌ This expense type cannot be reimbursed per company policy.
                  </p>
                </div>
              )}
              {corpPolicyAutoRejectNoDoc && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-amber-900">
                    This transaction is <span className="font-semibold">auto-rejected</span> under corporate card policy
                    and <span className="font-semibold">does not require documents</span>. Complete business info and
                    submit to record the claim — no upload needed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ══════ STEP 3 — DOCUMENTS (only when master maps document type(s) for this sub expense) ══════ */}
        {selectedSubExpenseTypeRow && !isAutoReject && !corpPolicyAutoRejectNoDoc && subtypeDocumentTypes.length > 0 && (
          <section>
            <SectionDivider num={3} label="Documents" />
            <Card className="border border-border rounded-xl">
              <CardContent className="pt-5 space-y-5">
                <p className="text-xs text-muted-foreground">
                  Files are uploaded when you confirm verification, or when you Save Draft or Submit for Approval.
                </p>
                {/* Required — from master (non–support-document types only) */}
                {requiredDocumentType && requiredDocId && (
                  <div className="space-y-2">
                    {requiredDoc?.ocrStatus === "verified" ? (
                      <p className="text-[13px] font-semibold text-emerald-800 flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                        Required — {requiredDocumentType.documentName}
                      </p>
                    ) : (
                      <p className="text-[13px] font-semibold text-red-700 flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />
                        Required — Attach file before Submit
                      </p>
                    )}
                    <DocRow
                      docId={requiredDocId}
                      label={`${requiredDocumentType.documentName} *`}
                      uploaded={requiredDoc}
                      onUpload={(file) => handleUploadDocument(requiredDocId, file)}
                      onVerify={() => setVerifyModal({ open: true, docId: requiredDocId })}
                      onDelete={() => void handleDeleteDocument(requiredDocId)}
                      onRetryOcr={() => void handleRetryOcrPreview(requiredDocId)}
                      onProcessOcr={
                        requiredDoc?.backendDocumentId
                          ? () => void handleProcessBackendDocOcr(requiredDoc.backendDocumentId!, requiredDoc.documentTypeId)
                          : undefined
                      }
                    />
                  </div>
                )}

                {/* Optional docs */}
                {allOptionalDocs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[13px] font-semibold text-muted-foreground flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
                      Optional — Attach supporting Documents
                    </p>
                    <div className="space-y-2">
                      {allOptionalDocs.map((doc) => {
                        const uploaded = docUploads[doc.id] ?? docUploadsFromApi[doc.id];
                        return (
                          <DocRow
                            key={doc.id}
                            docId={doc.id}
                            label={doc.label}
                            uploaded={uploaded}
                            optional
                            onUpload={(file) => handleUploadDocument(doc.id, file)}
                            onVerify={() => setVerifyModal({ open: true, docId: doc.id })}
                            onDelete={() => void handleDeleteDocument(doc.id)}
                            onRetryOcr={() => void handleRetryOcrPreview(doc.id)}
                            onProcessOcr={
                              uploaded?.backendDocumentId
                                ? () =>
                                    void handleProcessBackendDocOcr(
                                      uploaded.backendDocumentId!,
                                      uploaded.documentTypeId
                                    )
                                : undefined
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Status message (primary doc from master only) */}
                {requiredDocumentType && !requiredDoc && (
                  <p className="text-[13px] text-amber-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Upload and verify your receipt or tax invoice to submit.
                  </p>
                )}
                {requiredDocumentType && requiredDoc?.ocrStatus === "processing" && (
                  <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    Processing document...
                  </p>
                )}
                {requiredDocumentType && requiredDoc?.ocrStatus === "ocr_timeout" && !confirmNoDocument && (
                  <p className="text-[13px] text-destructive flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {OCR_TIMEOUT_MESSAGE_TH}
                  </p>
                )}
                {requiredDocumentType && requiredDoc?.ocrStatus === "to_verify" && !confirmNoDocument && (
                  <p className="text-[13px] text-amber-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Upload and verify your receipt or tax invoice to submit.
                  </p>
                )}
                {requiredDocumentType && requiredDoc?.ocrStatus === "verified" && (
                  <p className="text-[13px] text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Document verified.
                  </p>
                )}
                {requiredDocumentType && requiredDoc?.ocrStatus === "wrong_doc_type" && !confirmNoDocument && (
                  <p className="text-[13px] text-amber-600 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Upload and verify your receipt or tax invoice to submit.
                  </p>
                )}

                {/* Notes from config */}
                {selectedConfig?.notes && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="text-xs text-blue-700 flex items-start gap-1.5">
                      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {selectedConfig?.notes}
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

        {/* ══════ AUDIT TRAIL (visible to all roles) ══════ */}
        <div className="mt-8">
          <AuditTrail events={claim.status === "Final Rejected" ? FINAL_REJECTED_TRAIL : REQUEST_INFO_TRAIL} />
        </div>
      </div>

      {/* ══════ STICKY FOOTER ══════ */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-3 flex justify-end gap-3 z-50">
        <Button
          variant="outline"
          onClick={() => void handleSaveDraft()}
          disabled={draftSaving || saveDraftMutation.isPending || !claim?.id}
        >
          Save Draft
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  onClick={() => void handleSubmit()}
                  disabled={
                    !canSubmit || submitClaimMutation.isPending || draftSaving || saveDraftMutation.isPending
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {submitClaimMutation.isPending
                    ? "Submitting..."
                    : corpPolicyAutoRejectNoDoc
                      ? "Submit"
                      : "Submit for Approval"}
                </Button>
              </span>
            </TooltipTrigger>
                {!canSubmit && (
              <TooltipContent side="top" className="max-w-xs text-xs">
                {!step2Complete
                  ? "Complete Business Info: purpose, expense type, sub type, VAT type, and GL account (each must match the current lists)."
                  : isAutoReject && !corpPolicyAutoRejectNoDoc
                    ? "This expense type cannot be submitted (auto-reject policy)."
                    : requiredDocumentType && (!docRequirementMet || docBlocksSubmit)
                      ? "Please upload and verify the required document, or confirm you have no document to attach."
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
      {verifyModal?.open && verifyModalRow && (
        <OcrVerifyModal
          open={verifyModal.open}
          onClose={() => setVerifyModal(null)}
          onConfirm={(data, meta) => { void handleVerifyConfirm(verifyModal.docId, data, meta); }}
          onRemoveReupload={() => { void handleDeleteDocument(verifyModal.docId); }}
          fileName={verifyModalRow.name}
          fileType={verifyModalRow.type}
          documentId={verifyDocBackendId}
          localPreviewUrl={verifyDocBackendId ? null : verifyModalRow.localPreviewUrl ?? null}
          localPreviewMimeType={verifyDocBackendId ? null : verifyModalRow.pendingFile?.type ?? null}
          pendingServerValidation={verifyDocBackendId ? null : verifyModalRow.pendingValidation ?? null}
          pendingOverrideComplete={!!(
            verifyModalRow.pendingOverrideReasonsJson &&
            Object.keys(verifyModalRow.pendingOverrideReasonsJson).length > 0
          )}
          initialData={
            verifyModalRow.ocrData || {
              taxInvoiceNo: "", date: "", vendorName: "",
              netAmount: "", vatAmount: "", totalAmount: "",
            }
          }
          validationContext={activeEntity ? {
            companyTaxId: activeEntityTaxId,
            companyAddress: activeEntityAddress,
            bankAmount: cardBillingAmount,
            transactionDate: cardTxnDateStr,
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
  docId, label, uploaded, optional, onUpload, onVerify, onDelete, onRetryOcr,
  onProcessOcr,
}: {
  docId: string;
  label: string;
  uploaded?: UploadedFile;
  optional?: boolean;
  onUpload: (file: File) => void;
  onVerify: () => void;
  onDelete: () => void;
  onRetryOcr?: () => void;
  onProcessOcr?: () => void;
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
      case "ocr_timeout":
        return (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-[11px] gap-1">
            <Clock className="h-3 w-3" /> Timeout
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
        : uploaded.ocrStatus === "ocr_timeout"
          ? "border-amber-200 bg-amber-50/40"
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
          {uploaded?.ocrStatus === "ocr_timeout" && <Clock className="h-5 w-5 text-amber-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-medium ${optional && !uploaded ? "text-muted-foreground" : "text-foreground"}`}>{uploaded ? uploaded.name : label}</p>
          {uploaded && uploaded.ocrStatus !== "wrong_doc_type" && uploaded.ocrStatus !== "ocr_timeout" && (
            <p className="text-xs text-muted-foreground mt-0.5">{uploaded.detectedDocType ? `${uploaded.detectedDocType}` : label} • {uploaded.size}</p>
          )}
          {uploaded?.ocrStatus === "wrong_doc_type" && <p className="text-xs text-red-500 mt-0.5">{uploaded.size}</p>}
          {uploaded?.ocrStatus === "ocr_timeout" && <p className="text-xs text-muted-foreground mt-0.5">{uploaded.size}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {statusBadge()}
          {uploaded?.ocrStatus === "to_verify" && (
            <Button variant="outline" size="sm" className="text-xs" onClick={onVerify}>
              Verify
            </Button>
          )}
          {uploaded?.ocrStatus === "ocr_timeout" && onRetryOcr && (
            <Button variant="outline" size="sm" className="text-xs" onClick={onRetryOcr}>
              Retry
            </Button>
          )}
          {uploaded?.ocrStatus === "processing" && onProcessOcr && (
            <Button variant="outline" size="sm" className="text-xs" onClick={onProcessOcr}>
              Process OCR
            </Button>
          )}
          {uploaded?.ocrStatus === "wrong_doc_type" && (
            <Button variant="outline" size="sm" className="text-xs text-red-600 border-red-300 hover:bg-red-50" onClick={onDelete}>
              Remove & Re-upload
            </Button>
          )}
          {uploaded && uploaded.ocrStatus !== "wrong_doc_type" && uploaded.ocrStatus !== "ocr_timeout" && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {uploaded?.ocrStatus === "ocr_timeout" && (
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
      {uploaded?.ocrStatus === "ocr_timeout" && (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs text-amber-900">{OCR_TIMEOUT_MESSAGE_TH}</p>
        </div>
      )}
    </div>
  );
}
