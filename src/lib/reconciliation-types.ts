// ============= Reconciliation Data Models =============

export interface BankStatementLine {
  id: string;
  bankAccountId: string;
  statementId: string;
  transactionDate: string;
  postingDate: string;
  description: string;
  merchantName: string;
  amount: number;
  currency: string;
  reference: string;
  authorizationCode: string;
  mcc: string;
  reconciliationStatus: "Unmatched" | "Matched";
}

export interface SystemTransaction {
  id: string;
  type: "claim" | "expense";
  createdBy: string;
  transactionDate: string;
  merchantName: string;
  purpose: string;
  cardLast4?: string;
  billingCycle?: string;
  amount: number;
  currency: string;
  status: "Pending Submit" | "Pending Approval" | "Need Info" | "Approved" | "Rejected" | "Draft";
  reconciliationStatus: "Unmatched" | "Matched";
  source: "Bank" | "System" | "User";
  claimId?: string;
  expenseCategory?: string;
  invoiceValidationStatus?: string;
}

export interface ReconciliationLink {
  id: string;
  bankStatementLineId: string;
  systemTransactionId: string;
  matchedAt: string;
  matchedBy: string;
  status: "Matched" | "Unmatched";
  varianceAmount: number;
}

export interface ReconciliationFilters {
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  transactionType: string;
  transactionSource: string;
  keyword: string;
}

export const defaultFilters: ReconciliationFilters = {
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
  transactionType: "all",
  transactionSource: "all",
  keyword: "",
};
