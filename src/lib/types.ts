export type ClaimStatus = "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Need Info" | "Paid" | "Reconciled";
export type PaymentMethod = "Cash" | "Corporate Card" | "Personal Card" | "Bank Transfer";
export type ExpenseType = "Travel" | "Meals" | "Office Supplies" | "Transportation" | "Training" | "Entertainment" | "Communication" | "Other";
export type ReconcileStatus = "Unmatched" | "Matched" | "Partially Matched" | "Exception";
export type AccountingStatus = "Pending Review" | "Exception" | "Ready for ERP" | "Interfaced";
export type UserRole = "Employee" | "Manager" | "Accounting" | "Admin";

export interface User {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  role: UserRole;
  branch: string;
  department: string;
  costCenter: string;
  position: string;
  managerId: string | null;
  managerName: string | null;
  avatar?: string;
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

export interface ClaimHeader {
  id: string;
  claimNo: string;
  requesterId: string;
  requesterName: string;
  company: string;
  branch: string;
  department: string;
  costCenter: string;
  purpose: string;
  currency: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  totalVat: number;
  status: ClaimStatus;
  accountingStatus?: AccountingStatus;
  accountCode?: string;
  createdDate: string;
  submittedDate: string | null;
  lines: ClaimLine[];
  approvalHistory: ApprovalStep[];
  comments: Comment[];
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
