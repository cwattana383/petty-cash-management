/** Portal document column — derived only from raw `corporate_card_transactions.document_status` (or equivalent string). */
export type PortalDocumentStatus = "NOT_REQUIRED" | "PENDING_DOCUMENTS" | "VALIDATED" | "SUBMITTED";

/**
 * Map API `documentStatus` string → portal badge bucket. No claim/approval context — must match backend enum only.
 * `VERIFIED` / `USED_IN_CLAIM` / `VALIDATED` are equivalent "accepted" document states from the API.
 */
export function toDocumentContractStatus(raw: string | undefined): PortalDocumentStatus {
  const s = (raw ?? "").trim().toUpperCase();
  if (!s) return "PENDING_DOCUMENTS";
  if (s === "NOT_REQUIRED") return "NOT_REQUIRED";
  if (s === "VERIFIED" || s === "USED_IN_CLAIM" || s === "VALIDATED") return "VALIDATED";
  if (s === "SUBMITTED") return "SUBMITTED";
  return "PENDING_DOCUMENTS";
}
