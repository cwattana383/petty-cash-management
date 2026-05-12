export type ClaimStatus =
  | "Pending Invoice"
  | "Pending Documents"
  | "Pending Approval"
  | "Final Rejected"
  | "Auto Reject"
  | "Reject"
  | "Auto Approved"
  | "Manager Approved"
  | "Reimbursed"
  | "Returned For Info"
  | "Returned By Finance"
  | "Accounting Review"
  | "Pending Salary Deduction";

export type ClaimDisplayStatus =
  | "NOT_STARTED"
  | "AUTO_REJECTED"
  | "AUTO_APPROVED"
  | "PENDING_DOCUMENTS"
  | "READY_FOR_APPROVAL"
  | "PENDING_APPROVAL"
  | "MANAGER_APPROVED"
  | "MANAGER_REJECTED";
export type PaymentMethod = "Cash" | "Corporate Card" | "Personal Card" | "Bank Transfer";
export type ExpenseType = "Travel" | "Meals" | "Office Supplies" | "Transportation" | "Training" | "Entertainment" | "Communication" | "Other";
export type ReconcileStatus = "Unmatched" | "Matched" | "Partially Matched" | "Exception";
export type AccountingStatus = "Pending Review" | "Exception" | "Ready for ERP" | "Interfaced";
export interface User {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  roles: string[];
  branch: string;
  department: string;
  costCenter: string;
  position: string;
  telephone?: string;
}

export interface ClaimLine {
  id: string;
  expenseType: ExpenseType;
  description: string;
  amount: number;
  vat: number;
  taxInvoiceNo: string;
  invoiceDate: string;
  vendor: string;
  paymentMethod: PaymentMethod;
  projectId: string;
  memo: string;
  attachmentUrl?: string;
}

export interface ApprovalStep {
  stepNo: number;
  approverId: string;
  approverName: string;
  action: "Pending" | "Approved" | "Rejected" | "Request Info" | "Delegated";
  comment: string;
  actionDate: string | null;
}

/** Snapshot from `bank_transactions` when API includes `bankTransaction` on claim detail/list. */
export interface ClaimLinkedBankTransaction {
  transactionId: string;
  transactionDate: string;
  merchantName: string;
  billingAmount: number;
  billingCurrency: string;
  mccDescription: string;
}

export interface ClaimHeader {
  id: string;
  bankTransactionId?: string;
  /** Linked bank row for read-only Card Transaction section (same source as Bank Transactions page). */
  linkedBankTransaction?: ClaimLinkedBankTransaction;
  corpTxnStatus?: string;
  corpTxnDocumentStatus?: string;
  claimNo: string;
  requesterId: string;
  requesterName: string;
  company: string;
  branch: string;
  department: string;
  costCenter: string;
  purpose: string;
  /** Saved draft / business info (Section 2) -- admin master-data IDs */
  expenseTypeId?: string;
  subExpenseTypeId?: string;
  vatTypeId?: string;
  glAccountId?: string;
  merchantName?: string;
  currency: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  totalVat: number;
  status: ClaimStatus;
  statusCode?: string;
  statusDisplay?: ClaimDisplayStatus;
  statusColor?: "green" | "red" | "amber" | "grey";
  statusMeta?: {
    submittedBy?: string;
    submittedDate?: string;
    approverName?: string;
    approvalDate?: string;
    rejectedBy?: string;
    rejectedReason?: string;
    actionRequiredComment?: string;
    autoApprovalRule?: string;
    deductionPayPeriod?: string;
    deductionInstallment?: number;
    deductionFallbackMessage?: string;
  };
  readOnly?: boolean;
  accountingStatus?: AccountingStatus;
  accountCode?: string;
  createdDate: string;
  submittedDate: string | null;
  lines: ClaimLine[];
  approvalHistory: ApprovalStep[];
  comments: Comment[];
  /** Cardholder-supplied note (max 500 chars enforced at form layer). */
  cardholderNote?: string;
  /** Number of times the cardholder has resubmitted after a manager reject (only used when status === 'Reject'). */
  resubmitCountMgr?: number;
  /** Source of the most recent return-to-cardholder action. */
  returnSource?: "MANAGER_REJECT" | "MANAGER_RFI" | "FINANCE_RETURN";
  /** User id of the actor (manager or finance) who returned the claim. */
  returnedByUserId?: string;
  /** ISO 8601 timestamp of the return action. */
  returnedAt?: string;
  /** Free-text message from the manager or finance officer accompanying the return. */
  returnMessage?: string;
  /** Cardholder-facing audit trail events (mock-state). */
  auditEvents?: import("@/components/claims/AuditTrail").AuditEvent[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  date: string;
}

export interface BankTransaction {
  id: string;
  txnDate: string;
  amount: number;
  merchant: string;
  cardholderName: string;
  reference: string;
  status: ReconcileStatus;
  linkedClaimId: string | null;
}

export interface ExtractedField {
  field: string;
  value: string;
  confidence: number; // 0-100
}
