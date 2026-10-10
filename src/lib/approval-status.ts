// Shared Approval Status rule: Fleet Card transactions never go through
// manager approval, so they always show Auto Approved.

export const FLEET_CARD_TXN_IDS = new Set([
  "TXN2026050100001",
  "TXN2026050400004",
  "TXN2026050600007",
  "TXN2026050800009",
  "TXN2026051000013",
  "TXN2026051200016",
  "TXN2026051400020",
  "TXN2026051500023",
  "TXN2026051600040",
  // My Expense Fleet Card rows (bank transaction ids)
  "bt-8",
  "bt-15",
  "bt-19",
  "bt-23",
  // November 2026 Fleet Card samples
  "202611999910072719",
  "202611999910072720",
  "202611999910072721",
  "202611999910072722",
  "202611999910072723",
]);

export type CardTypeLabel = "Credit Card" | "Fleet Card";

export const getCardType = (id: string): CardTypeLabel =>
  FLEET_CARD_TXN_IDS.has(id) ? "Fleet Card" : "Credit Card";

/** Returns "AUTO_APPROVED" for Fleet Card, otherwise the stored status. */
export function getApprovalStatus<T extends string>(txn: { id: string; status: T }): T | "AUTO_APPROVED" {
  return getCardType(txn.id) === "Fleet Card" ? "AUTO_APPROVED" : txn.status;
}

/** Label variant for screens that store a display label. */
export function getApprovalStatusLabel(id: string, stored: string): string {
  return getCardType(id) === "Fleet Card" ? "Auto Approved" : stored;
}
