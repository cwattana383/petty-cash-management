import type { ClaimDocument } from "@/hooks/use-claim-documents";

/** Aggregate claim documents → contract label used with `toApprovalContractStatus`. */
export function deriveDocumentStatusLabelFromClaimDocs(docs: ClaimDocument[]): string {
  if (!docs.length) return "PENDING_DOCUMENTS";
  if (docs.some((d) => d.status === "VERIFIED" || d.status === "USED_IN_CLAIM")) return "VALIDATED";
  if (docs.some((d) => d.status === "TO_VERIFY")) return "PENDING_DOCUMENTS";
  if (docs.some((d) => d.status === "PENDING_DOCUMENT" || d.status === "OCR_PROCESSING" || d.status === "UPLOADED")) {
    return "PENDING_DOCUMENTS";
  }
  if (
    docs.some(
      (d) =>
        d.status === "OCR_FAILED" ||
        d.status === "REJECTED" ||
        d.status === "FAILED" ||
        d.status === "DUPLICATE_BLOCKED" ||
        d.status === "BUYER_MISMATCH"
    )
  ) {
    return "PENDING_DOCUMENTS";
  }
  return "PENDING_DOCUMENTS";
}

/** Combine raw approval label with document bucket for detail header badge pipeline. */
export function toApprovalContractStatus(rawStatusLabel: string, documentStatusLabel: string): string {
  if (rawStatusLabel === "PENDING_APPROVAL") return "PENDING_APPROVAL";
  if (rawStatusLabel === "MANAGER_APPROVED") return "MANAGER_APPROVED";
  if (rawStatusLabel === "AUTO_APPROVED") return "AUTO_APPROVED";
  if (rawStatusLabel === "AUTO_REJECTED" || rawStatusLabel === "MANAGER_REJECTED") return "MANAGER_REJECTED";
  if (rawStatusLabel === "READY_FOR_APPROVAL") return "READY_FOR_APPROVAL";
  if (rawStatusLabel === "NOT_STARTED") return "NOT_STARTED";
  if (rawStatusLabel === "MATCHED") return "MATCHED";
  if (rawStatusLabel === "UNMATCHED") return "UNMATCHED";
  if (documentStatusLabel === "VALIDATED") return "READY_FOR_APPROVAL";
  return "REQUIRED_APPROVAL";
}
