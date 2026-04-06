import { useState, useMemo, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ZoomIn, ZoomOut, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import {
  useClaimDocumentDetail,
  claimDocumentToOcrExtractedData,
  getFailingValidationKeys,
  type OcrValidationResults,
} from "@/hooks/use-claim-documents";
import { apiClient } from "@/lib/api-client";
import { documentBlobPaths } from "@/lib/document-download";

export interface OcrExtractedData {
  taxInvoiceNo: string;
  date: string;
  vendorName: string;
  netAmount: string;
  vatAmount: string;
  totalAmount: string;
  buyerTaxId?: string;
  buyerAddress?: string;
}

export interface ValidationContext {
  companyTaxId: string;
  companyAddress: string;
  bankAmount: number;
  transactionDate: string; // YYYY-MM-DD
}

interface ValidationResult {
  label: string;
  status: "pass" | "fail" | "warning";
  message: string;
  blocking: boolean;
}

export type OcrVerifyConfirmMeta = {
  /** POST /documents/:id/override — one reason per failing validation key */
  overrideReasonsJson?: Record<string, string>;
  /** Preview-only row (no DB id): user confirmed; client checks passed — parent may set local Verified UI */
  localVerifyComplete?: boolean;
};

interface OcrVerifyModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: (data: OcrExtractedData, meta?: OcrVerifyConfirmMeta) => void;
  onRemoveReupload?: () => void;
  fileName: string;
  fileType: string;
  fileUrl?: string;
  initialData: OcrExtractedData;
  /** When set, loads live OCR + validation from GET /documents/:id and enables file preview */
  documentId?: string | null;
  /** Object URL from parent — preview only; not revoked inside this modal */
  localPreviewUrl?: string | null;
  localPreviewMimeType?: string | null;
  /** Server validation from preview-ocr (pending save) */
  pendingServerValidation?: OcrValidationResults | null;
  /** Parent already recorded override reasons for pending doc */
  pendingOverrideComplete?: boolean;
  validationContext?: ValidationContext;
  readOnly?: boolean;
}

const FIELDS: { key: keyof OcrExtractedData; label: string; placeholder: string }[] = [
  { key: "taxInvoiceNo", label: "Tax Invoice No.", placeholder: "Could not extract — enter manually" },
  { key: "date", label: "Date (DD/MM/YYYY)", placeholder: "Could not extract — enter manually" },
  { key: "vendorName", label: "Vendor Name", placeholder: "Could not extract — enter manually" },
  { key: "netAmount", label: "Net Amount (THB)", placeholder: "Could not extract — enter manually" },
  { key: "vatAmount", label: "VAT Amount (THB)", placeholder: "Could not extract — enter manually" },
  { key: "totalAmount", label: "Total Amount (THB)", placeholder: "Could not extract — enter manually" },
];

function normalize(s: string) {
  return s.replace(/[\s-]/g, "").toLowerCase();
}

function parseAmount(s: string): number {
  return parseFloat(s.replace(/,/g, "")) || 0;
}

function parseDateDMY(s: string): Date | null {
  const m = s.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (!m) return null;
  let year = parseInt(m[3], 10);
  if (year > 2400) year -= 543;
  return new Date(year, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
}

function runValidations(data: OcrExtractedData, ctx: ValidationContext): ValidationResult[] {
  const results: ValidationResult[] = [];
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const extractedTaxId = normalize(data.buyerTaxId || "");
  const companyTaxId = normalize(ctx.companyTaxId);
  if (extractedTaxId && companyTaxId && extractedTaxId === companyTaxId) {
    results.push({ label: "Tax ID", status: "pass", message: "Tax ID matched — CPAxtra confirmed", blocking: false });
  } else if (!extractedTaxId) {
    results.push({ label: "Tax ID", status: "fail", message: "Buyer Tax ID could not be extracted. This document may belong to a different company. Please re-upload the correct document.", blocking: true });
  } else {
    results.push({ label: "Tax ID", status: "fail", message: "Tax ID does not match CPAxtra. This document may belong to a different company. Please re-upload the correct document.", blocking: true });
  }

  const buyerAddr = (data.buyerAddress || "").toLowerCase();
  const addressTokens = ctx.companyAddress
    .split(/[\s,]+/)
    .filter((t) => t.length >= 3)
    .map((t) => t.toLowerCase());
  const brandKeywords = ["cpaxtra", "cp axtra", "makro", "แม็คโคร", "ซีพี แอ็กซ์ตร้า"];
  const allKeywords = [...addressTokens, ...brandKeywords];
  const addressMatch = allKeywords.some((kw) => buyerAddr.includes(kw));
  if (addressMatch) {
    results.push({ label: "Address", status: "pass", message: "CPAxtra address found in document", blocking: false });
  } else {
    results.push({ label: "Address", status: "warning", message: "Could not confirm CPAxtra address in document. Finance will verify.", blocking: false });
  }

  const ocrTotal = parseAmount(data.totalAmount);
  const bankAmt = ctx.bankAmount;
  if (bankAmt > 0 && ocrTotal > 0) {
    const diff = Math.abs(ocrTotal - bankAmt) / bankAmt * 100;
    if (diff <= 5) {
      results.push({ label: "Amount", status: "pass", message: `Amount matched — within 5% tolerance (Bank: ฿${fmt(bankAmt)} / Document: ฿${fmt(ocrTotal)})`, blocking: false });
    } else {
      results.push({ label: "Amount", status: "warning", message: `Amount difference is ${diff.toFixed(1)}% — exceeds 5% tolerance (Bank: ฿${fmt(bankAmt)} / Document: ฿${fmt(ocrTotal)}). Finance will review.`, blocking: false });
    }
  } else {
    results.push({ label: "Amount", status: "warning", message: "Could not compare amounts. Finance will review.", blocking: false });
  }

  const invoiceDate = parseDateDMY(data.date);
  const txnDate = new Date(ctx.transactionDate);
  if (invoiceDate && !isNaN(txnDate.getTime())) {
    const diffDays = Math.abs(Math.round((invoiceDate.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24)));
    if (diffDays <= 30) {
      results.push({ label: "Date", status: "pass", message: "Invoice date within acceptable range", blocking: false });
    } else {
      results.push({ label: "Date", status: "warning", message: `Invoice date is ${diffDays} days from transaction date. Finance will review.`, blocking: false });
    }
  } else {
    results.push({ label: "Date", status: "warning", message: "Could not validate invoice date. Finance will review.", blocking: false });
  }

  return results;
}

const SERVER_CHECK_LABELS: Record<string, string> = {
  documentType: "Document type",
  taxId: "Tax ID",
  address: "Address",
  amount: "Amount",
  invoiceDate: "Invoice date",
};

function validationResultsFromServer(vr: OcrValidationResults): ValidationResult[] {
  const out: ValidationResult[] = [];
  for (const key of Object.keys(vr)) {
    const c = vr[key as keyof OcrValidationResults];
    if (!c || typeof c.pass !== "boolean") continue;
    const blocking =
      (key === "taxId" || key === "documentType") && c.pass === false;
    out.push({
      label: SERVER_CHECK_LABELS[key] || key,
      status: c.pass ? "pass" : "fail",
      message: typeof c.message === "string" && c.message ? c.message : (c.pass ? "Passed" : "Check failed"),
      blocking,
    });
  }
  return out;
}

export default function OcrVerifyModal({
  open,
  onClose,
  onConfirm,
  onRemoveReupload,
  fileName,
  fileType,
  initialData,
  documentId,
  localPreviewUrl,
  localPreviewMimeType,
  pendingServerValidation,
  pendingOverrideComplete,
  validationContext,
  readOnly,
}: OcrVerifyModalProps) {
  const [data, setData] = useState<OcrExtractedData>(initialData);
  const [zoom, setZoom] = useState(100);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [previewMime, setPreviewMime] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const ownedPreviewUrlRef = useRef<string | null>(null);

  const revokeOwnedPreview = () => {
    if (ownedPreviewUrlRef.current) {
      URL.revokeObjectURL(ownedPreviewUrlRef.current);
      ownedPreviewUrlRef.current = null;
    }
  };

  const detailQuery = useClaimDocumentDetail(open && documentId ? documentId : undefined);
  const detailEnabled = open && !!documentId;

  useEffect(() => {
    if (!open) return;
    setData(initialData);
    setZoom(100);
    setOverrideReason("");
  }, [open, initialData]);

  useEffect(() => {
    if (!detailEnabled || !detailQuery.data) return;
    setData(claimDocumentToOcrExtractedData(detailQuery.data));
  }, [detailEnabled, detailQuery.data]);

  useEffect(() => {
    if (!open) {
      revokeOwnedPreview();
      setPreviewUrl(null);
      setPreviewFailed(false);
      setPreviewLoading(false);
      setPreviewMime(null);
      return;
    }

    if (localPreviewUrl) {
      revokeOwnedPreview();
      setPreviewUrl(localPreviewUrl);
      setPreviewMime(localPreviewMimeType || "");
      setPreviewLoading(false);
      setPreviewFailed(false);
      return;
    }

    if (!documentId) {
      revokeOwnedPreview();
      setPreviewUrl(null);
      setPreviewMime(null);
      setPreviewFailed(false);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    revokeOwnedPreview();
    setPreviewLoading(true);
    setPreviewFailed(false);

    (async () => {
      for (const path of documentBlobPaths(documentId)) {
        try {
          const blob = await apiClient.getBlob(path);
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          ownedPreviewUrlRef.current = url;
          setPreviewUrl(url);
          setPreviewMime(blob.type || "");
          setPreviewLoading(false);
          return;
        } catch {
          /* try next path */
        }
      }
      if (!cancelled) {
        setPreviewLoading(false);
        setPreviewFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      revokeOwnedPreview();
      setPreviewUrl(null);
    };
  }, [open, documentId, localPreviewUrl, localPreviewMimeType]);

  const handleChange = (key: keyof OcrExtractedData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const validations = useMemo((): ValidationResult[] => {
    const vr = documentId
      ? detailQuery.data?.validationResult
      : pendingServerValidation && Object.keys(pendingServerValidation).length > 0
        ? pendingServerValidation
        : detailQuery.data?.validationResult;
    if (vr && typeof vr === "object" && Object.keys(vr).length > 0) {
      const fromServer = validationResultsFromServer(vr);
      if (fromServer.length > 0) return fromServer;
    }
    if (!validationContext) return [];
    return runValidations(data, validationContext);
  }, [data, validationContext, documentId, detailQuery.data?.validationResult, pendingServerValidation]);

  const hasBlockingFailure = validations.some((v) => v.blocking && v.status === "fail");

  const needsBackendOverride = useMemo(() => {
    if (readOnly) return false;
    if (documentId && detailQuery.data) {
      const doc = detailQuery.data;
      if (doc.status.toUpperCase() !== "TO_VERIFY") return false;
      if (doc.overrideFlag) return false;
      return getFailingValidationKeys(doc.validationResult).length > 0;
    }
    if (!documentId && pendingServerValidation) {
      if (pendingOverrideComplete) return false;
      return getFailingValidationKeys(pendingServerValidation).length > 0;
    }
    return false;
  }, [readOnly, documentId, detailQuery.data, pendingServerValidation, pendingOverrideComplete]);

  const needsOverrideReasonText = needsBackendOverride && !overrideReason.trim();
  const showRemoveReupload =
    !readOnly && hasBlockingFailure && !!onRemoveReupload && !needsBackendOverride;

  /** Avoid Confirm before GET /documents/:id — otherwise override meta is missing and process-ocr runs wrongly */
  const awaitingServerDocumentDetail =
    Boolean(documentId) &&
    !readOnly &&
    !detailQuery.isError &&
    !detailQuery.data &&
    (detailQuery.isPending || detailQuery.isFetching);

  const isPdf =
    (previewMime || detailQuery.data?.mimeType || "").toLowerCase().includes("pdf") ||
    fileName.toLowerCase().endsWith(".pdf");
  const isImage =
    (previewMime || "").startsWith("image/") ||
    /\.(jpg|jpeg|png|webp)$/i.test(fileName);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 flex flex-col">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Verify Document — {fileName}</h2>
          {documentId && (
            <p className="text-[11px] text-muted-foreground mt-1 font-mono truncate" title={documentId}>
              Document ID: {documentId}
            </p>
          )}
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="w-1/2 border-r border-border p-6 overflow-y-auto">
            <h3 className="text-sm font-semibold text-foreground mb-1">OCR Results</h3>
            <p className="text-xs text-muted-foreground mb-5">
              {documentId && detailQuery.isFetching && !localPreviewUrl
                ? "Loading from server…"
                : "Review and edit if needed before confirming"}
            </p>

            <div className="space-y-4">
              {FIELDS.map((f) => {
                const isEmpty = !data[f.key];
                return (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-foreground">{f.label}</Label>
                    {readOnly ? (
                      <p className="text-[13px] text-foreground border border-border rounded-md px-3 py-2 bg-muted/30">
                        {data[f.key] || "—"}
                      </p>
                    ) : (
                      <Input
                        value={data[f.key]}
                        onChange={(e) => handleChange(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className={`text-[13px] ${isEmpty ? "border-destructive" : ""}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {validations.length > 0 && (
              <div className="mt-6 pt-5 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Validation Results</h3>
                <div className="space-y-2.5">
                  {validations.map((v, i) => (
                    <div key={`${v.label}-${i}`} className="flex items-start gap-2">
                      {v.status === "pass" && <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />}
                      {v.status === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
                      {v.status === "fail" && <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
                      <span className={`text-[13px] leading-snug ${
                        v.status === "fail" ? "text-destructive font-medium" :
                        v.status === "warning" ? "text-amber-700" :
                        "text-foreground"
                      }`}>
                        {v.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {needsBackendOverride && (
              <div className="mt-6 pt-5 border-t border-border space-y-2">
                <Label className="text-[13px] font-semibold text-foreground">
                  Override reason <span className="text-destructive">*</span>
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Required for each failed check above. The same text is sent for all failing items to the server.
                </p>
                <Textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why this document should be accepted despite validation differences…"
                  className="text-[13px] min-h-[72px]"
                />
              </div>
            )}
          </div>

          <div className="w-1/2 flex flex-col bg-muted/30 min-h-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <h3 className="text-sm font-semibold text-foreground">Document Preview</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setZoom((z) => Math.max(50, z - 25))}
                  type="button"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                  type="button"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto min-h-0">
              {previewLoading && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-xs">Loading preview…</p>
                </div>
              )}
              {!previewLoading && previewFailed && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground px-4">
                    <p className="text-sm font-medium">Preview unavailable</p>
                    <p className="text-xs mt-2">
                      The download endpoint may differ on your backend. Ensure{" "}
                      <code className="text-[11px]">GET /documents/{"{"}id{"}"}/download</code>{" "}
                      or <code className="text-[11px]">/file</code> returns the file bytes.
                    </p>
                  </div>
                </div>
              )}
              {!previewLoading && !previewFailed && previewUrl && isPdf && (
                <div
                  style={{
                    width: `${zoom}%`,
                    height: `${zoom}%`,
                    minWidth: "100%",
                    minHeight: "100%",
                  }}
                >
                  <iframe
                    src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full border-0 bg-white"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top left",
                      width: `${10000 / zoom}%`,
                      height: `${10000 / zoom}%`,
                    }}
                    title={`Preview of ${fileName}`}
                  />
                </div>
              )}
              {!previewLoading && !previewFailed && previewUrl && isImage && (
                <div
                  style={{
                    width: `${zoom}%`,
                    height: `${zoom}%`,
                    minWidth: "100%",
                    minHeight: "100%",
                  }}
                >
                  <img
                    src={previewUrl}
                    alt={fileName}
                    className="w-full h-full object-contain shadow-sm border border-border rounded bg-white"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top left",
                      width: `${10000 / zoom}%`,
                      height: `${10000 / zoom}%`,
                    }}
                  />
                </div>
              )}
              {!previewLoading && !previewFailed && !previewUrl && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground p-4">
                    <p className="text-sm font-medium">{fileName}</p>
                    <p className="text-xs mt-1">{fileType}</p>
                    <p className="text-xs mt-3 text-muted-foreground/60">
                      {documentId ? "No preview loaded." : "Open verify from an uploaded document to preview the file."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-border flex flex-col gap-2 shrink-0">
          {awaitingServerDocumentDetail && (
            <p className="text-[11px] text-muted-foreground text-right">
              Loading document validation from server…
            </p>
          )}
          <div className="flex justify-end gap-3">
          {readOnly ? (
            <Button variant="outline" onClick={onClose}>Close</Button>
          ) : showRemoveReupload ? (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button variant="destructive" onClick={() => { onRemoveReupload(); onClose(); }}>
                Remove &amp; Re-upload
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                disabled={needsOverrideReasonText || awaitingServerDocumentDetail}
                onClick={() => {
                  let meta: OcrVerifyConfirmMeta | undefined;
                  if (needsBackendOverride) {
                    const vr =
                      documentId && detailQuery.data
                        ? detailQuery.data.validationResult
                        : pendingServerValidation;
                    const keys = vr ? getFailingValidationKeys(vr) : [];
                    const text = overrideReason.trim();
                    if (keys.length > 0) {
                      meta = {
                        overrideReasonsJson: Object.fromEntries(keys.map((k) => [k, text])),
                      };
                    }
                  }
                  if (
                    !documentId &&
                    !needsBackendOverride &&
                    !hasBlockingFailure
                  ) {
                    meta = { ...meta, localVerifyComplete: true };
                  }
                  onConfirm?.(data, meta);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Confirm
              </Button>
            </>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
