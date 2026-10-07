/** FAT-909 — Fleet Card default Business Info + VAT Type edit rules (mock, in-memory). */
export const FLEET_DEFAULT_EXPENSE_TYPE_ID = "et-forklift-refueling";
export const FLEET_DEFAULT_SUB_EXPENSE_TYPE_ID = "set-forklift-refueling";
export const FLEET_DEFAULT_EXPENSE_TYPE = "Forklift Refueling";
export const FLEET_DEFAULT_SUB_EXPENSE_TYPE = "Forklift Refueling";
export const FLEET_DEFAULT_VAT_TYPE_ID = "avg";

const savedVatByTxn: Record<string, string> = {};

/** Fleet Card transactions in the Accounting Review "Verified" tab (status VERIFIED), plus any verified this session. */
const verifiedTxnIds = new Set<string>(["TXN2026051000013"]);

export function getFleetVatTypeId(txnId: string): string {
  return savedVatByTxn[txnId] ?? FLEET_DEFAULT_VAT_TYPE_ID;
}

export function saveFleetVatTypeId(txnId: string, vatTypeId: string): void {
  savedVatByTxn[txnId] = vatTypeId;
}

export function isFleetTxnVerified(txnId: string): boolean {
  return verifiedTxnIds.has(txnId);
}

export function markFleetTxnVerified(txnId: string): void {
  verifiedTxnIds.add(txnId);
}
