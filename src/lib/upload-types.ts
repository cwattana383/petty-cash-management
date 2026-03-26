export type DocStatus = "UPLOADED" | "OCR_PROCESSING" | "OCR_FAILED" | "TO_VERIFY" | "VERIFIED" | "REJECTED" | "USED_IN_CLAIM" | "FAILED" | "DUPLICATE_BLOCKED" | "BUYER_MISMATCH";

export type AutoDecisionStatus = "AUTO_ACCEPT" | "NEED_VERIFY" | "AUTO_REJECT" | "MANUAL_ACCEPT";

export type DocErrorType = "OCR_UNREADABLE" | "MISSING_REQUIRED_FIELD" | "DUPLICATE_DOCUMENT" | "FILE_CORRUPT";

export interface OcrField {
  label: string;
  value: string;
  confidence: number;
}

export interface UploadedDoc {
  id: string;
  name: string;
  size: number;
  status: DocStatus;
  uploadedAt: Date;
  ocrData?: OcrField[];
  ocrConfidenceScore?: number;
  autoDecisionStatus?: AutoDecisionStatus;
  fieldLevelConfidence?: Record<string, number>;
  errorType?: DocErrorType;
  isManualExpense?: boolean;
  linkedClaimId?: string;
  duplicateOfDocumentId?: string;
  buyerMismatchDetails?: {
    extractedTaxId?: string;
    extractedName?: string;
    extractedAddress?: string;
    expectedTaxId?: string;
    expectedName?: string;
    expectedAddress?: string;
  };
}

export const mockOcrFields: OcrField[] = [
  { label: "Tax ID", value: "0107567000414", confidence: 95 },
  { label: "Date", value: "19/12/2025", confidence: 90 },
  { label: "Invoice No.", value: "054", confidence: 85 },
  { label: "Withholding Tax Payer Name", value: "CP Axtra Public Company Limited", confidence: 95 },
  { label: "Buyer Address", value: "123 Sukhumvit Road, Khlong Toei, Bangkok 10110", confidence: 88 },
  { label: "Branch", value: "Head Office", confidence: 88 },
  { label: "Income Type", value: "Service Fee", confidence: 80 },
  { label: "Tax Rate", value: "3", confidence: 90 },
  { label: "Amount", value: "10,000.00", confidence: 95 },
  { label: "VAT Code", value: "V7", confidence: 92 },
  { label: "VAT Amount", value: "700.00", confidence: 90 },
  { label: "WHT Code", value: "W3", confidence: 88 },
  { label: "WHT Amount", value: "300.00", confidence: 85 },
];

// Generate mock OCR fields with random confidence for variety
export function generateMockOcrWithConfidence(): { fields: OcrField[]; avgConfidence: number } {
  const baseFields = mockOcrFields.map((f) => ({
    ...f,
    confidence: parseFloat(Math.min(100, Math.max(40, f.confidence + (Math.random() * 30 - 15))).toFixed(2)),
  }));
  const avg = Math.round(baseFields.reduce((sum, f) => sum + f.confidence, 0) / baseFields.length);
  return { fields: baseFields, avgConfidence: avg };
}

// Decision engine: determine auto status based on confidence (threshold: ≥96% AUTO_ACCEPT, 70-95% NEED_VERIFY, <70% AUTO_REJECT)
export function runDecisionEngine(avgConfidence: number): { autoDecision: AutoDecisionStatus; docStatus: DocStatus } {
  if (avgConfidence >= 96) {
    return { autoDecision: "AUTO_ACCEPT", docStatus: "VERIFIED" };
  }
  if (avgConfidence >= 70) {
    return { autoDecision: "NEED_VERIFY", docStatus: "TO_VERIFY" };
  }
  return { autoDecision: "AUTO_REJECT", docStatus: "OCR_FAILED" };
}

// Check for duplicate documents based on Tax ID + Invoice Number
export function checkDuplicate(
  newDoc: UploadedDoc,
  allDocs: UploadedDoc[]
): { isDuplicate: boolean; duplicateOfId?: string } {
  if (!newDoc.ocrData) return { isDuplicate: false };

  const newTaxId = newDoc.ocrData.find((f) => f.label === "Tax ID")?.value || "";
  const newInvoiceNo = newDoc.ocrData.find((f) => f.label === "Invoice No.")?.value || "";

  if (!newTaxId || !newInvoiceNo) return { isDuplicate: false };

  const duplicate = allDocs.find((d) => {
    if (d.id === newDoc.id) return false;
    if (!d.ocrData) return false;
    if (d.status === "DUPLICATE_BLOCKED" || d.status === "REJECTED") return false;
    const dTaxId = d.ocrData.find((f) => f.label === "Tax ID")?.value || "";
    const dInvoiceNo = d.ocrData.find((f) => f.label === "Invoice No.")?.value || "";
    return dTaxId === newTaxId && dInvoiceNo === newInvoiceNo;
  });

  return duplicate ? { isDuplicate: true, duplicateOfId: duplicate.id } : { isDuplicate: false };
}

// Check buyer entity against Entities Profile master data
export interface BuyerValidationResult {
  isMatch: boolean;
  mismatchDetails?: {
    extractedTaxId?: string;
    extractedName?: string;
    extractedAddress?: string;
    expectedTaxId?: string;
    expectedName?: string;
    expectedAddress?: string;
  };
}

export function validateBuyerEntity(
  ocrData: OcrField[],
  entities: Array<{
    taxId: string;
    legalNameTh: string;
    address: string;
  }>
): BuyerValidationResult {
  const extractedTaxId = ocrData.find((f) => f.label === "Tax ID")?.value || "";
  const extractedName = ocrData.find((f) => f.label === "Withholding Tax Payer Name")?.value || "";
  const extractedAddress = ocrData.find((f) => f.label === "Buyer Address")?.value || "";

  if (!extractedTaxId) return { isMatch: true }; // Can't validate without tax ID

  // Find matching entity by Tax ID
  const matchedEntity = entities.find((e) => e.taxId === extractedTaxId);

  if (!matchedEntity) {
    return {
      isMatch: false,
      mismatchDetails: {
        extractedTaxId,
        extractedName,
        extractedAddress,
        expectedTaxId: "Tax ID not found in the system",
        expectedName: "",
        expectedAddress: "",
      },
    };
  }

  // Check name match (fuzzy)
  const nameMatch =
    matchedEntity.legalNameTh.toLowerCase().includes(extractedName.toLowerCase()) ||
    extractedName.toLowerCase().includes(matchedEntity.legalNameTh.toLowerCase());

  if (!nameMatch && extractedName) {
    return {
      isMatch: false,
      mismatchDetails: {
        extractedTaxId,
        extractedName,
        extractedAddress,
        expectedTaxId: matchedEntity.taxId,
        expectedName: matchedEntity.legalNameTh,
        expectedAddress: matchedEntity.address,
      },
    };
  }

  return { isMatch: true };
}

export const STATUS_CONFIG: Record<DocStatus, { label: string; dotClass: string; badgeClass: string; animate?: boolean }> = {
  UPLOADED: { label: "Uploaded", dotClass: "bg-gray-500", badgeClass: "border-gray-300 bg-gray-50 text-gray-600" },
  OCR_PROCESSING: { label: "Processing", dotClass: "bg-blue-500", badgeClass: "border-blue-300 bg-blue-50 text-blue-600", animate: true },
  OCR_FAILED: { label: "OCR Failed", dotClass: "bg-red-500", badgeClass: "border-red-300 bg-red-50 text-red-600" },
  TO_VERIFY: { label: "To Verify", dotClass: "bg-orange-500", badgeClass: "border-orange-300 bg-orange-50 text-orange-600" },
  VERIFIED: { label: "Verified", dotClass: "bg-green-500", badgeClass: "border-green-300 bg-green-50 text-green-600" },
  REJECTED: { label: "Rejected", dotClass: "bg-red-600", badgeClass: "border-red-400 bg-red-50 text-red-700" },
  USED_IN_CLAIM: { label: "Used in Claim", dotClass: "bg-purple-500", badgeClass: "border-purple-300 bg-purple-50 text-purple-600" },
  FAILED: { label: "Failed", dotClass: "bg-red-500", badgeClass: "border-red-300 bg-red-50 text-red-600" },
  DUPLICATE_BLOCKED: { label: "Duplicate Blocked", dotClass: "bg-amber-600", badgeClass: "border-amber-400 bg-amber-50 text-amber-700" },
  BUYER_MISMATCH: { label: "Buyer Mismatch", dotClass: "bg-pink-500", badgeClass: "border-pink-400 bg-pink-50 text-pink-700" },
};

// Only VERIFIED documents can be selected for Create Claim
export const SELECTABLE_STATUSES: DocStatus[] = ["VERIFIED"];

// Legacy helper — non-selectable means anything NOT in SELECTABLE_STATUSES
export const NON_SELECTABLE_STATUSES: DocStatus[] = (
  ["UPLOADED", "OCR_PROCESSING", "OCR_FAILED", "TO_VERIFY", "REJECTED", "USED_IN_CLAIM", "FAILED", "DUPLICATE_BLOCKED", "BUYER_MISMATCH"] as DocStatus[]
);

export const MAX_UPLOAD_FILES = 10;
export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = [".pdf", ".jpg", ".jpeg", ".png"];
export const ACCEPTED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const beYear = d.getFullYear() + 543;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${beYear} ${hh}:${mm}`;
}

// Convert Gregorian year to Buddhist Era for display
export function toThaiDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  // dateStr can be YYYY-MM-DD or DD/MM/YYYY
  let day: string, month: string, year: number;

  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    year = parseInt(parts[0]);
    month = parts[1];
    day = parts[2];
  } else if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    day = parts[0];
    month = parts[1];
    year = parseInt(parts[2]);
  } else {
    return dateStr;
  }

  // If year < 2500, assume Gregorian, add 543 for Buddhist Era
  if (year < 2500) {
    year += 543;
  }

  return `${day}/${month}/${year}`;
}
