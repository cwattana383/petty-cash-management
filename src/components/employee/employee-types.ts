export interface CreditCard {
  id: string;
  cardType: string;
  bank: string;
  last4Digit: string;
  cardHolderName: string;
  creditLimit: number;
  currency: string;
  statementCycleDay: number;
  effectiveFrom: string;
  effectiveTo: string;
  status: "Active" | "Inactive";
  autoReconcile: boolean;
  requireReceiptUpload: boolean;
}

export interface ApprovalLevel {
  id: string;
  level: number;
  approvalType: "Expense Claim" | "Corporate Card" | "Both";
  approverType: "Direct Manager" | "Specific User" | "Role Based" | "Cost Center Manager";
  approverName: string;
  backupApprover: string;
  conditionType: "Always" | "Amount Threshold" | "Category Based";
  amountFrom: number;
  amountTo: number;
  expenseCategories: string[];
  effectiveFrom: string;
  effectiveTo: string;
  active: boolean;
  parallelApproval: boolean;
  requireAllApprovers: boolean;
}

export const cardTypes = ["Visa", "Mastercard", "JCB", "American Express"];
export const banks = ["กสิกรไทย (KBANK)", "กรุงเทพ (BBL)", "ไทยพาณิชย์ (SCB)", "กรุงไทย (KTB)", "ทหารไทยธนชาต (TTB)"];
export const approvalTypes: ApprovalLevel["approvalType"][] = ["Expense Claim", "Corporate Card", "Both"];
export const approverTypes: ApprovalLevel["approverType"][] = ["Direct Manager", "Specific User", "Role Based", "Cost Center Manager"];
export const conditionTypes: ApprovalLevel["conditionType"][] = ["Always", "Amount Threshold", "Category Based"];
export const expenseCategoryOptions = ["Travel", "Meals", "Office Supplies", "Transportation", "Training", "Entertainment", "Communication", "Other"];
