import { BankStatementLine, SystemTransaction, ReconciliationLink } from "./reconciliation-types";

export const mockBankStatementLines: BankStatementLine[] = [
  {
    id: "BSL-001", bankAccountId: "BA-001", statementId: "STMT-2025-01",
    transactionDate: "2025-01-14", postingDate: "2025-01-15",
    description: "THAI AIRWAYS TG-514 BKK-CNX", merchantName: "Thai Airways",
    amount: 15200, currency: "THB", reference: "REF-TG-001",
    authorizationCode: "AUTH-7891", mcc: "3000", reconciliationStatus: "Matched",
  },
  {
    id: "BSL-002", bankAccountId: "BA-001", statementId: "STMT-2025-01",
    transactionDate: "2025-01-18", postingDate: "2025-01-19",
    description: "STARBUCKS SIAM PARAGON", merchantName: "Starbucks Siam Paragon",
    amount: 520, currency: "THB", reference: "REF-SB-002",
    authorizationCode: "AUTH-3344", mcc: "5812", reconciliationStatus: "Unmatched",
  },
  {
    id: "BSL-003", bankAccountId: "BA-001", statementId: "STMT-2025-02",
    transactionDate: "2025-02-03", postingDate: "2025-02-04",
    description: "GRAB*TRANSPORT BKK", merchantName: "Grab Transport",
    amount: 380, currency: "THB", reference: "REF-GRB-003",
    authorizationCode: "AUTH-5566", mcc: "4121", reconciliationStatus: "Unmatched",
  },
  {
    id: "BSL-004", bankAccountId: "BA-001", statementId: "STMT-2025-02",
    transactionDate: "2025-02-05", postingDate: "2025-02-06",
    description: "AMAZON WEB SERVICES AWS", merchantName: "Amazon Web Services",
    amount: 3500, currency: "THB", reference: "REF-AWS-004",
    authorizationCode: "AUTH-7788", mcc: "7372", reconciliationStatus: "Unmatched",
  },
  {
    id: "BSL-005", bankAccountId: "BA-001", statementId: "STMT-2025-02",
    transactionDate: "2025-02-07", postingDate: "2025-02-08",
    description: "LINE MAN FOOD DELIVERY", merchantName: "LINE MAN Food Delivery",
    amount: 450, currency: "THB", reference: "REF-LM-005",
    authorizationCode: "AUTH-9900", mcc: "5812", reconciliationStatus: "Unmatched",
  },
  {
    id: "BSL-006", bankAccountId: "BA-001", statementId: "STMT-2025-02",
    transactionDate: "2025-02-10", postingDate: "2025-02-11",
    description: "CENTARA HOTEL CHIANG MAI", merchantName: "Centara Hotel Chiang Mai",
    amount: 4800, currency: "THB", reference: "REF-CH-006",
    authorizationCode: "AUTH-1122", mcc: "7011", reconciliationStatus: "Unmatched",
  },
  {
    id: "BSL-007", bankAccountId: "BA-001", statementId: "STMT-2025-02",
    transactionDate: "2025-02-12", postingDate: "2025-02-13",
    description: "JETBRAINS S.R.O. PRAGUE", merchantName: "JetBrains s.r.o.",
    amount: 12000, currency: "THB", reference: "REF-JB-007",
    authorizationCode: "AUTH-3344", mcc: "7372", reconciliationStatus: "Matched",
  },
  {
    id: "BSL-008", bankAccountId: "BA-001", statementId: "STMT-2025-02",
    transactionDate: "2025-02-14", postingDate: "2025-02-15",
    description: "OFFICE MATE ONLINE", merchantName: "OfficeMate",
    amount: 4500, currency: "THB", reference: "REF-OM-008",
    authorizationCode: "AUTH-5566", mcc: "5943", reconciliationStatus: "Unmatched",
  },
  {
    id: "BSL-009", bankAccountId: "BA-001", statementId: "STMT-2025-02",
    transactionDate: "2025-02-15", postingDate: "2025-02-16",
    description: "S&P RESTAURANT SIAM", merchantName: "S&P Restaurant",
    amount: 2850, currency: "THB", reference: "REF-SP-009",
    authorizationCode: "AUTH-7788", mcc: "5812", reconciliationStatus: "Unmatched",
  },
];

export const mockSystemTransactions: SystemTransaction[] = [
  {
    id: "SYS-001", type: "claim", createdBy: "u1",
    transactionDate: "2025-01-15", merchantName: "Thai Airways", purpose: "Business Travel - Bangkok to Chiang Mai",
    cardLast4: "4532", billingCycle: "2025-01", amount: 15200, currency: "THB",
    status: "Approved", reconciliationStatus: "Matched", source: "User",
    claimId: "c1", expenseCategory: "Travel", invoiceValidationStatus: "Valid",
  },
  {
    id: "SYS-002", type: "claim", createdBy: "u1",
    transactionDate: "2025-01-20", merchantName: "S&P Restaurant", purpose: "Client Meeting Lunch",
    amount: 2800, currency: "THB",
    status: "Pending Approval", reconciliationStatus: "Unmatched", source: "User",
    claimId: "c2", expenseCategory: "Meals", invoiceValidationStatus: "Valid",
  },
  {
    id: "SYS-003", type: "claim", createdBy: "u1",
    transactionDate: "2025-02-01", merchantName: "OfficeMate", purpose: "Office Supplies Purchase",
    amount: 4500, currency: "THB",
    status: "Draft", reconciliationStatus: "Unmatched", source: "User",
    claimId: "c3", expenseCategory: "Office Supplies", invoiceValidationStatus: "Pending",
  },
  {
    id: "SYS-004", type: "claim", createdBy: "u1",
    transactionDate: "2025-02-05", merchantName: "Taxi meter", purpose: "Taxi to Airport",
    amount: 850, currency: "THB",
    status: "Rejected", reconciliationStatus: "Unmatched", source: "User",
    claimId: "c4", expenseCategory: "Transportation",
  },
  {
    id: "SYS-005", type: "claim", createdBy: "u1",
    transactionDate: "2025-02-08", merchantName: "Event Organizer Co.", purpose: "Conference Registration",
    amount: 25000, currency: "THB",
    status: "Need Info", reconciliationStatus: "Unmatched", source: "User",
    claimId: "c5", expenseCategory: "Training",
  },
  {
    id: "SYS-006", type: "claim", createdBy: "u3",
    transactionDate: "2025-02-08", merchantName: "JetBrains", purpose: "Software License Renewal",
    cardLast4: "7891", billingCycle: "2025-02", amount: 12000, currency: "THB",
    status: "Pending Approval", reconciliationStatus: "Matched", source: "User",
    claimId: "c6", expenseCategory: "Other", invoiceValidationStatus: "Valid",
  },
  {
    id: "SYS-007", type: "expense", createdBy: "u1",
    transactionDate: "2025-02-03", merchantName: "Grab Transport", purpose: "Office commute",
    cardLast4: "4532", billingCycle: "2025-02", amount: 380, currency: "THB",
    status: "Pending Submit", reconciliationStatus: "Unmatched", source: "System",
    expenseCategory: "Transportation",
  },
  {
    id: "SYS-008", type: "expense", createdBy: "u1",
    transactionDate: "2025-02-07", merchantName: "LINE MAN Food", purpose: "Team lunch delivery",
    cardLast4: "4532", billingCycle: "2025-02", amount: 450, currency: "THB",
    status: "Pending Submit", reconciliationStatus: "Unmatched", source: "System",
    expenseCategory: "Meals",
  },
];

export const mockReconciliationLinks: ReconciliationLink[] = [
  {
    id: "LINK-001", bankStatementLineId: "BSL-001", systemTransactionId: "SYS-001",
    matchedAt: "2025-01-20T10:30:00Z", matchedBy: "สมชาย ใจดี",
    status: "Matched", varianceAmount: 0,
  },
  {
    id: "LINK-002", bankStatementLineId: "BSL-007", systemTransactionId: "SYS-006",
    matchedAt: "2025-02-15T14:00:00Z", matchedBy: "พิมพ์ ดี",
    status: "Matched", varianceAmount: 0,
  },
];
