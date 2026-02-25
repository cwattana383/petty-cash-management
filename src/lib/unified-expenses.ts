import { ClaimHeader } from "./types";
import { mockClaims } from "./mock-data";

// ---- Extended Bank Transaction ----
export interface CorporateCardTransaction {
  id: string;
  employee_id: string;
  card_last4: string;
  billing_cycle: string;
  merchant_name: string;
  txn_date: string;
  posting_date: string;
  amount: number;
  currency: string;
  status: string; // Pending Submit | Pending Approval | Approved | Rejected | Need Info | Payroll Deduction | Reconciled
}

export interface Reconciliation {
  id: string;
  transaction_id: string;
  claim_id: string;
  match_status: "Pending Reconcile" | "Matched" | "Amount Mismatch" | "Employee Payable";
  variance_amount: number;
  reconciled_at: string | null;
}

// ---- Unified Item ----
export interface UnifiedExpenseItem {
  item_type: "CORP_CARD" | "MANUAL";
  item_no: string;
  transaction_id?: string;
  claim_id?: string;
  date: string;
  merchant_vendor: string;
  purpose?: string;
  card_last4?: string;
  billing_cycle?: string;
  amount: number;
  status: string;
  reconcile_status: string;
  reject_reason?: string;
}

// ---- Mock Corporate Card Transactions ----
export const mockCorpCardTransactions: CorporateCardTransaction[] = [
  { id: "TXN-2025-001", employee_id: "u1", card_last4: "4532", billing_cycle: "2025-01", merchant_name: "Thai Airways", txn_date: "2025-01-14", posting_date: "2025-01-15", amount: 15200, currency: "THB", status: "Reconciled" },
  { id: "TXN-2025-002", employee_id: "u1", card_last4: "4532", billing_cycle: "2025-01", merchant_name: "Starbucks Siam Paragon", txn_date: "2025-01-18", posting_date: "2025-01-19", amount: 520, currency: "THB", status: "Pending Submit" },
  { id: "TXN-2025-003", employee_id: "u1", card_last4: "4532", billing_cycle: "2025-02", merchant_name: "Grab Transport", txn_date: "2025-02-03", posting_date: "2025-02-04", amount: 380, currency: "THB", status: "Pending Submit" },
  { id: "TXN-2025-004", employee_id: "u1", card_last4: "7891", billing_cycle: "2025-02", merchant_name: "Amazon Web Services", txn_date: "2025-02-05", posting_date: "2025-02-06", amount: 3500, currency: "THB", status: "Pending Submit" },
  { id: "TXN-2025-005", employee_id: "u1", card_last4: "4532", billing_cycle: "2025-02", merchant_name: "LINE MAN Food Delivery", txn_date: "2025-02-07", posting_date: "2025-02-08", amount: 450, currency: "THB", status: "Pending Submit" },
  { id: "TXN-2025-006", employee_id: "u1", card_last4: "4532", billing_cycle: "2025-02", merchant_name: "Centara Hotel Chiang Mai", txn_date: "2025-02-10", posting_date: "2025-02-11", amount: 4800, currency: "THB", status: "Pending Approval" },
  { id: "TXN-2025-007", employee_id: "u1", card_last4: "7891", billing_cycle: "2025-02", merchant_name: "JetBrains s.r.o.", txn_date: "2025-02-12", posting_date: "2025-02-13", amount: 12000, currency: "THB", status: "Reconciled" },
];

export const mockReconciliations: Reconciliation[] = [
  { id: "REC-001", transaction_id: "TXN-2025-001", claim_id: "c1", match_status: "Matched", variance_amount: 0, reconciled_at: "2025-01-20" },
  { id: "REC-002", transaction_id: "TXN-2025-007", claim_id: "c6", match_status: "Matched", variance_amount: 0, reconciled_at: "2025-02-15" },
];

// ---- Build Unified List ----
export function getUnifiedExpenses(claims: ClaimHeader[]): UnifiedExpenseItem[] {
  const items: UnifiedExpenseItem[] = [];

  // Corporate card transactions
  for (const txn of mockCorpCardTransactions) {
    const rec = mockReconciliations.find((r) => r.transaction_id === txn.id);
    const linkedClaim = rec ? claims.find((c) => c.id === rec.claim_id) : undefined;

    items.push({
      item_type: "CORP_CARD",
      item_no: txn.id,
      transaction_id: txn.id,
      claim_id: linkedClaim?.id,
      date: txn.txn_date,
      merchant_vendor: txn.merchant_name,
      purpose: linkedClaim?.purpose || "—",
      card_last4: txn.card_last4,
      billing_cycle: txn.billing_cycle,
      amount: txn.amount,
      status: txn.status,
      reconcile_status: rec ? rec.match_status : txn.status === "Pending Submit" ? "Not Submitted" : "Pending Reconcile",
      reject_reason: linkedClaim?.approvalHistory.find((a) => a.action === "Rejected")?.comment,
    });
  }

  // Manual claims (those not linked to a corp card txn)
  const linkedClaimIds = new Set(mockReconciliations.map((r) => r.claim_id));
  for (const claim of claims) {
    if (linkedClaimIds.has(claim.id)) continue; // already shown as corp card row
    items.push({
      item_type: "MANUAL",
      item_no: claim.claimNo,
      claim_id: claim.id,
      date: claim.createdDate,
      merchant_vendor: claim.lines[0]?.vendor || claim.purpose,
      purpose: claim.purpose,
      amount: claim.totalAmount,
      status: claim.status === "Pending Invoice" ? "Pending Invoice" : claim.status,
      reconcile_status: "—",
      reject_reason: claim.approvalHistory.find((a) => a.action === "Rejected")?.comment,
    });
  }

  // Sort by date descending
  items.sort((a, b) => b.date.localeCompare(a.date));
  return items;
}
