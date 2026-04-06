import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { OCR_END_TO_END_TIMEOUT_MS } from "@/lib/ocr-sla";
import { toThaiDateDisplay } from "@/lib/upload-types";

export type ClaimDocumentStatus = string;

export type OcrValidationCheck = {
  pass?: boolean;
  bankValue?: unknown;
  docValue?: unknown;
  message?: string;
  diffPct?: number;
  diffDays?: number;
};

export type OcrValidationResults = {
  documentType?: OcrValidationCheck;
  taxId?: OcrValidationCheck;
  address?: OcrValidationCheck;
  amount?: OcrValidationCheck;
  invoiceDate?: OcrValidationCheck;
};

export interface ClaimDocument {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  documentTypeId?: string;
  status: ClaimDocumentStatus;
  errorType?: string;
  extractedData?: Record<string, unknown>;
  ocrFields?: Array<Record<string, unknown>>;
  validationResult?: OcrValidationResults;
  overrideFlag?: boolean;
  overrideReasonsJson?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

function toStringSafe(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return fallback;
}

function toNumberSafe(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function parseValidationJson(raw: unknown): OcrValidationResults | undefined {
  if (raw == null || raw === "") return undefined;
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as OcrValidationResults;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as OcrValidationResults;
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function parseOverrideReasonsJson(raw: unknown): Record<string, string> | undefined {
  if (raw == null || raw === "") return undefined;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(o)) {
      if (v != null && v !== "") out[k] = String(v);
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parseOverrideReasonsJson(parsed);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/** Keys backend expects on POST /documents/:id/override (must match ocrValidationResultsJson) */
export function getFailingValidationKeys(vr: OcrValidationResults | undefined): string[] {
  if (!vr) return [];
  const keys: string[] = [];
  for (const [k, v] of Object.entries(vr)) {
    if (v && typeof v === "object" && "pass" in v && v.pass === false) {
      keys.push(k);
    }
  }
  return keys;
}

/** Matches claims.service submitClaim: VERIFIED, or TO_VERIFY with overrideFlag + non-empty reasons */
export function isDocumentSubmitEligible(doc: ClaimDocument): boolean {
  const s = doc.status.toUpperCase();
  if (s === "VERIFIED") return true;
  if (s !== "TO_VERIFY") return false;
  if (!doc.overrideFlag) return false;
  const r = doc.overrideReasonsJson;
  if (!r || typeof r !== "object") return false;
  return Object.keys(r).length > 0;
}

function normKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s_-]+/g, "")
    .replace(/\(thb\)/g, "");
}

/** Merge API ocrFields + top-level OCR keys into a flat object for the verify form */
export function buildExtractedData(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const copyKeys = [
    "taxInvoiceNo",
    "tax_invoice_no",
    "invoiceNo",
    "invoice_no",
    "vendorName",
    "vendor_name",
    "sellerName",
    "netAmount",
    "net_amount",
    "vatAmount",
    "vat_amount",
    "totalAmount",
    "total_amount",
    "buyerTaxId",
    "buyer_tax_id",
    "buyerAddress",
    "buyer_address",
    "invoiceDate",
    "invoice_date",
    "date",
    "currency",
  ];
  for (const k of copyKeys) {
    const v = raw[k];
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }

  const fields = raw.ocrFields;
  if (!Array.isArray(fields)) return out;

  const setIf = (aliases: string[], value: unknown) => {
    if (value === undefined || value === null || value === "") return;
    for (const a of aliases) {
      if (out[a] === undefined || out[a] === null || out[a] === "") {
        out[a] = value;
        break;
      }
    }
  };

  for (const entry of fields) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const labelRaw = toStringSafe(e.label ?? e.name ?? e.key ?? e.field ?? "");
    const nk = normKey(labelRaw);
    const val = e.value;
    const valueStr =
      typeof val === "string" || typeof val === "number"
        ? String(val)
        : val != null
          ? JSON.stringify(val)
          : "";

    if (
      nk.includes("taxinvoiceno") ||
      nk.includes("เลขที่") ||
      nk.includes("invoiceno")
    ) {
      setIf(["taxInvoiceNo"], valueStr);
      continue;
    }
    if (
      nk.includes("invoice") && nk.includes("date") ||
      nk.includes("วันเดือนปี") ||
      nk === "date"
    ) {
      setIf(["invoiceDate"], valueStr);
      continue;
    }
    if (nk.includes("buyer") && nk.includes("tax")) {
      setIf(["buyerTaxId"], valueStr);
      continue;
    }
    if (nk.includes("address") || nk.includes("ที่อยู่")) {
      setIf(["buyerAddress"], valueStr);
      continue;
    }
    if (nk.includes("vendor") || nk.includes("merchant") || nk.includes("ผู้ขาย")) {
      setIf(["vendorName"], valueStr);
      continue;
    }
    if (nk.includes("net") && nk.includes("amount")) {
      setIf(["netAmount"], valueStr);
      continue;
    }
    if (nk.includes("vat") && nk.includes("amount")) {
      setIf(["vatAmount"], valueStr);
      continue;
    }
    if (nk.includes("total") && nk.includes("amount")) {
      setIf(["totalAmount"], valueStr);
      continue;
    }
  }

  return out;
}

function mapDocument(raw: Record<string, unknown>): ClaimDocument {
  const extracted = buildExtractedData(raw);
  const hasExtracted = Object.keys(extracted).length > 0;
  const ocrFields = Array.isArray(raw.ocrFields)
    ? (raw.ocrFields as Array<Record<string, unknown>>)
    : undefined;

  return {
    id: toStringSafe(raw.id),
    fileName: toStringSafe(
      raw.fileName || raw.file_name || raw.originalFileName || raw.original_file_name || raw.name,
    ),
    fileSize: toNumberSafe(raw.fileSize || raw.size || raw.file_size),
    mimeType: toStringSafe(raw.mimeType || raw.mime_type) || undefined,
    documentTypeId:
      toStringSafe(raw.documentTypeId || raw.document_type_id) || undefined,
    status: toStringSafe(raw.status || raw.ocrStatus || "UPLOADED"),
    errorType: toStringSafe(raw.errorType || raw.error_type),
    extractedData: hasExtracted ? extracted : undefined,
    ocrFields,
    validationResult:
      parseValidationJson(raw.ocrValidationResultsJson) ??
      parseValidationJson(raw.validationResult),
    overrideFlag: typeof raw.overrideFlag === "boolean" ? raw.overrideFlag : undefined,
    overrideReasonsJson: parseOverrideReasonsJson(raw.overrideReasonsJson),
    createdAt: toStringSafe(raw.createdAt) || undefined,
    updatedAt: toStringSafe(raw.updatedAt) || undefined,
  };
}

export type PreviewOcrResponse = {
  preview?: boolean;
  status: string;
  validationResults: OcrValidationResults;
  extracted: Record<string, unknown>;
  ocrFields: Array<{ label: string; value: string; confidence: number }>;
};

/** Rows for `OcrResultCard` — from preview-ocr `validationResults` / `ocrFields` only. */
export type OcrResultDisplayField = {
  label: string;
  value: string;
  status: string;
  color: "green" | "amber" | "grey";
};

function formatDocValue(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "string" || typeof v === "number") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return "—";
  }
}

/** Build table rows from `POST .../preview-ocr` response (no mock data). */
export function previewResponseToOcrDisplayFields(res: PreviewOcrResponse): OcrResultDisplayField[] {
  const vr = res.validationResults ?? {};
  const rows: OcrResultDisplayField[] = [];
  const order: Array<{ key: keyof OcrValidationResults; label: string }> = [
    { key: "taxId", label: "เลขประจำตัวผู้เสียภาษี" },
    { key: "documentType", label: "ประเภทเอกสาร" },
    { key: "address", label: "ที่อยู่ผู้ซื้อ" },
    { key: "amount", label: "ยอดเงินในเอกสาร" },
    { key: "invoiceDate", label: "วันที่ในเอกสาร" },
  ];
  for (const { key, label } of order) {
    const c = vr?.[key];
    if (!c || typeof c !== "object") continue;
    const pass = c.pass !== false;
    const value = formatDocValue(c.docValue ?? c.bankValue);
    const status =
      (c.message && String(c.message).trim()) || (pass ? "✅ ผ่านการตรวจสอบ" : "⚠️ ต้องตรวจสอบ");
    const color: OcrResultDisplayField["color"] = pass ? "green" : "amber";
    rows.push({ label, value, status, color });
  }
  if (rows.length === 0 && Array.isArray(res.ocrFields)) {
    for (let i = 0; i < res.ocrFields.length; i++) {
      const f = res.ocrFields[i];
      rows.push({
        label: f.label || `ฟิลด์ ${i + 1}`,
        value: f.value ?? "—",
        status: "ℹ️ จาก OCR",
        color: "grey",
      });
    }
  }
  return rows;
}

/** Map validation snapshot → summary state for banners (matches ClaimDetail / verify flow). */
export function previewValidationToResultState(
  vr: OcrValidationResults | undefined
): "pass" | "partial" | "fail" {
  if (!vr || typeof vr !== "object") return "partial";
  const checks = Object.values(vr).filter(
    (v): v is OcrValidationCheck => v != null && typeof v === "object" && "pass" in v
  );
  if (checks.length === 0) return "partial";
  if (vr.taxId?.pass === false) return "fail";
  if (checks.some((c) => c.pass === false)) return "partial";
  return "pass";
}

/** Map POST /documents/claims/:id/preview-ocr response to ClaimDocument shape for OCR form helpers */
export function claimDocumentLikeFromPreview(
  fileName: string,
  fileSize: number,
  mimeType: string,
  raw: PreviewOcrResponse,
): ClaimDocument {
  const merged = buildExtractedData({
    ...raw.extracted,
    ocrFields: raw.ocrFields,
  } as Record<string, unknown>);
  return {
    id: "__preview__",
    fileName,
    fileSize,
    mimeType,
    status: raw.status,
    extractedData: merged,
    ocrFields: raw.ocrFields as Array<Record<string, unknown>>,
    validationResult: raw.validationResults,
  };
}

export function claimDocumentToOcrExtractedData(doc: ClaimDocument) {
  const ex = doc.extractedData ?? {};
  const str = (v: unknown) => (v == null || v === "" ? "" : String(v));

  let dateStr = str(ex.invoiceDate ?? ex.date ?? ex.invoice_date);
  const isoLike = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoLike) {
    dateStr = toThaiDateDisplay(isoLike[1]);
  }

  return {
    taxInvoiceNo: str(ex.taxInvoiceNo ?? ex.tax_invoice_no ?? ex.invoiceNo ?? ex.invoice_no),
    date: dateStr,
    vendorName: str(ex.vendorName ?? ex.vendor_name ?? ex.sellerName),
    netAmount: str(ex.netAmount ?? ex.net_amount),
    vatAmount: str(ex.vatAmount ?? ex.vat_amount),
    totalAmount: str(ex.totalAmount ?? ex.total_amount),
    buyerTaxId: str(ex.buyerTaxId ?? ex.buyer_tax_id),
    buyerAddress: str(ex.buyerAddress ?? ex.buyer_address),
  };
}

export function useClaimDocuments(linkedClaimId?: string) {
  return useQuery<ClaimDocument[]>({
    queryKey: ["claim-documents", linkedClaimId],
    enabled: !!linkedClaimId,
    queryFn: async () => {
      const raw = (await apiClient.get(
        `/documents?linkedClaimId=${encodeURIComponent(linkedClaimId || "")}`
      )) as unknown;
      let items: unknown[] = [];
      if (Array.isArray(raw)) {
        items = raw;
      } else if (Array.isArray((raw as { items?: unknown[] })?.items)) {
        items = (raw as { items: unknown[] }).items;
      } else if (Array.isArray((raw as { data?: unknown[] })?.data)) {
        items = (raw as { data: unknown[] }).data;
      }
      return items.map((item) => mapDocument((item as Record<string, unknown>) ?? {}));
    },
  });
}

export function useClaimDocumentDetail(documentId?: string) {
  return useQuery<ClaimDocument>({
    queryKey: ["claim-document-detail", documentId],
    enabled: !!documentId,
    queryFn: async () => {
      const raw = (await apiClient.get(`/documents/${documentId}`)) as Record<string, unknown>;
      return mapDocument(raw);
    },
  });
}

/** In-memory OCR + validation only (no DB/COS). Pair with upload on Save Draft / Submit. */
export function usePreviewClaimDocumentOcr() {
  return useMutation({
    mutationFn: async ({
      claimId,
      file,
      documentTypeId,
    }: {
      claimId: string;
      file: File;
      documentTypeId: string;
    }) => {
      const formData = new FormData();
      formData.append("documents", file);
      const q = documentTypeId
        ? `?documentTypeId=${encodeURIComponent(documentTypeId)}`
        : "";
      return apiClient.postForm(`/documents/claims/${claimId}/preview-ocr${q}`, formData, {
        timeoutMs: OCR_END_TO_END_TIMEOUT_MS,
      }) as Promise<PreviewOcrResponse>;
    },
  });
}

export function useUploadClaimDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      claimId,
      files,
      forceDuplicate = false,
      documentTypeId,
    }: {
      claimId: string;
      files: File[];
      forceDuplicate?: boolean;
      /** Slot / document_types.id — required for correct Required vs Optional mapping after refetch */
      documentTypeId?: string;
    }) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("documents", file));
      const qs = new URLSearchParams();
      qs.set("forceDuplicate", forceDuplicate ? "true" : "false");
      if (documentTypeId) qs.set("documentTypeId", documentTypeId);
      return apiClient.postForm(`/documents/claims/${claimId}/upload?${qs.toString()}`, formData, {
        timeoutMs: OCR_END_TO_END_TIMEOUT_MS,
      });
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["claim-documents", vars.claimId] });
    },
  });
}

export function useProcessClaimDocumentOcr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      body,
    }: {
      documentId: string;
      body: Record<string, unknown>;
    }) =>
      apiClient.post(`/documents/${documentId}/process-ocr`, body, {
        timeoutMs: OCR_END_TO_END_TIMEOUT_MS,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claim-documents"] });
      queryClient.invalidateQueries({ queryKey: ["claim-document-detail"] });
    },
  });
}

export function useOverrideClaimDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      overrideReasonsJson,
      overrideFlag = true,
    }: {
      documentId: string;
      overrideReasonsJson: Record<string, string>;
      overrideFlag?: boolean;
    }) =>
      apiClient.post(`/documents/${documentId}/override`, {
        overrideReasonsJson,
        overrideFlag,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claim-documents"] });
      queryClient.invalidateQueries({ queryKey: ["claim-document-detail"] });
    },
  });
}

export function useDeleteClaimDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => apiClient.delete(`/documents/${documentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claim-documents"] });
      queryClient.invalidateQueries({ queryKey: ["claim-document-detail"] });
    },
  });
}

export function useSubmitClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      claimId,
      noDocumentConfirmed = false,
    }: {
      claimId: string;
      noDocumentConfirmed?: boolean;
    }) =>
      apiClient.post(
        `/claims/${claimId}/submit${noDocumentConfirmed ? "?noDocumentConfirmed=true" : ""}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardholder-claims"] });
      queryClient.invalidateQueries({ queryKey: ["cardholder-claim-detail"] });
      queryClient.invalidateQueries({ queryKey: ["claim-documents"] });
      queryClient.invalidateQueries({ queryKey: ["corp-card-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["corp-card-transactions-stats"] });
    },
  });
}
