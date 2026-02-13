export type DocStatus = "UPLOADED" | "OCR_PROCESSING" | "TO_VERIFY" | "VERIFIED" | "FAILED";

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
}

export const mockOcrFields: OcrField[] = [
  { label: "เลขประจำตัวผู้เสียภาษี", value: "0503568005200", confidence: 95 },
  { label: "วันเดือนปี", value: "19/12/2025", confidence: 90 },
  { label: "เลขที่", value: "054", confidence: 85 },
  { label: "ชื่อ ผู้มีหน้าที่หักภาษี ณ ที่จ่าย", value: "ห้างหุ้นส่วนจำกัด นาราพาเจริญ", confidence: 95 },
  { label: "สาขา", value: "สำนักงานใหญ่", confidence: 88 },
  { label: "ประเภทรายได้", value: "ค่าบริการ", confidence: 80 },
  { label: "อัตราภาษี", value: "3", confidence: 90 },
  { label: "จำนวนเงิน", value: "10,000.00", confidence: 95 },
  { label: "VAT Code", value: "V7", confidence: 92 },
  { label: "VAT Amount", value: "700.00", confidence: 90 },
  { label: "WHT Code", value: "W3", confidence: 88 },
  { label: "WHT Amount", value: "300.00", confidence: 85 },
];

export const STATUS_CONFIG: Record<DocStatus, { label: string; dotClass: string; badgeClass: string; animate?: boolean }> = {
  UPLOADED: { label: "Uploaded", dotClass: "bg-gray-500", badgeClass: "border-gray-300 bg-gray-50 text-gray-600" },
  OCR_PROCESSING: { label: "Processing", dotClass: "bg-blue-500", badgeClass: "border-blue-300 bg-blue-50 text-blue-600", animate: true },
  TO_VERIFY: { label: "To Verify", dotClass: "bg-orange-500", badgeClass: "border-orange-300 bg-orange-50 text-orange-600" },
  VERIFIED: { label: "Verified", dotClass: "bg-green-500", badgeClass: "border-green-300 bg-green-50 text-green-600" },
  FAILED: { label: "Failed", dotClass: "bg-red-500", badgeClass: "border-red-300 bg-red-50 text-red-600" },
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function formatDate(d: Date): string {
  return `${d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })} at ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
}
