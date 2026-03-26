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
  approverId: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: boolean;
}

export const cardTypes = ["Visa", "Mastercard", "JCB", "American Express"];
export const banks = ["Kasikorn (KBANK)", "Bangkok Bank (BBL)", "Siam Commercial (SCB)", "Krungthai (KTB)", "TMBThanachart (TTB)"];
