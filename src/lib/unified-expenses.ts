import { ClaimHeader } from "./types";
import { PolicyResult } from "./corporate-card-types";

// ---- Extended Bank Transaction ----
export interface CorporateCardTransaction {
  id: string;
  employee_id: string;
  card_last4: string;
  billing_cycle: string;
  merchant_name: string;
  merchant_city: string;
  merchant_country: string;
  transaction_date: string;
  posting_date: string;
  amount: number;
  currency: string;
  mcc_code: string;
  mcc_description: string;
  transaction_type: string;
  authorization_code: string;
  reference_number: string;
  cardholder_name: string;
  transaction_amount: number | null;
  transaction_currency: string | null;
  file_id: string | null;
  import_source: "MANUAL" | "SCHEDULED";
  status: string;
  policy_result: PolicyResult;
  policy_reason: string;
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

// ---- Build Unified List ----
export function getUnifiedExpenses(claims: ClaimHeader[]): UnifiedExpenseItem[] {
  const items: UnifiedExpenseItem[] = [];

  for (const claim of claims) {
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

  items.sort((a, b) => b.date.localeCompare(a.date));
  return items;
}
