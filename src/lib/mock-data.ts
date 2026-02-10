import { ClaimHeader, User, BankTransaction } from "./types";

export const currentUser: User = {
  id: "u1",
  employeeCode: "EMP001",
  name: "สมชาย ใจดี",
  email: "somchai@company.com",
  role: "Employee",
  branch: "Bangkok",
  department: "Sales",
  costCenter: "CC-SALES-01",
  position: "Sales Executive",
  managerId: "u2",
  managerName: "สมหญิง แก้วใส",
};

export const users: User[] = [
  currentUser,
  { id: "u2", employeeCode: "EMP002", name: "สมหญิง แก้วใส", email: "somying@company.com", role: "Manager", branch: "Bangkok", department: "Sales", costCenter: "CC-SALES-01", position: "Sales Manager", managerId: "u5", managerName: "ธนา พิทักษ์" },
  { id: "u3", employeeCode: "EMP003", name: "วิชัย เจริญ", email: "wichai@company.com", role: "Employee", branch: "Chiang Mai", department: "Engineering", costCenter: "CC-ENG-01", position: "Software Engineer", managerId: "u5", managerName: "ธนา พิทักษ์" },
  { id: "u4", employeeCode: "ACC001", name: "พิมพ์ ดี", email: "pim@company.com", role: "Accounting", branch: "Bangkok", department: "Finance", costCenter: "CC-FIN-01", position: "Senior Accountant", managerId: null, managerName: null },
  { id: "u5", employeeCode: "MGR001", name: "ธนา พิทักษ์", email: "thana@company.com", role: "Admin", branch: "Bangkok", department: "Management", costCenter: "CC-MGT-01", position: "Director", managerId: null, managerName: null },
];

export const mockClaims: ClaimHeader[] = [
  {
    id: "c1", claimNo: "EC-2025-001", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "Sales", costCenter: "CC-SALES-01",
    purpose: "Business Travel - Bangkok to Chiang Mai", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 15200, totalVat: 1065, status: "Approved", createdDate: "2025-01-15", submittedDate: "2025-01-15",
    lines: [
      { id: "l1", expenseType: "Travel", description: "Flight BKK-CNX round trip", amount: 8500, vat: 595, taxInvoiceNo: "INV-TG-20250115", invoiceDate: "2025-01-15", vendor: "Thai Airways", paymentMethod: "Corporate Card", projectId: "PRJ-001", memo: "" },
      { id: "l2", expenseType: "Travel", description: "Hotel 2 nights", amount: 4800, vat: 336, taxInvoiceNo: "INV-HTL-001", invoiceDate: "2025-01-15", vendor: "Centara Hotel", paymentMethod: "Corporate Card", projectId: "PRJ-001", memo: "" },
      { id: "l3", expenseType: "Transportation", description: "Airport transfer", amount: 1900, vat: 133, taxInvoiceNo: "INV-GRB-001", invoiceDate: "2025-01-15", vendor: "Grab", paymentMethod: "Corporate Card", projectId: "PRJ-001", memo: "" },
    ],
    approvalHistory: [
      { stepNo: 1, approverId: "u2", approverName: "สมหญิง แก้วใส", action: "Approved", comment: "Approved - within budget", actionDate: "2025-01-16" },
    ],
    comments: [{ id: "cm1", userId: "u2", userName: "สมหญิง แก้วใส", text: "OK, approved for business trip", date: "2025-01-16" }],
  },
  {
    id: "c2", claimNo: "EC-2025-002", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "Sales", costCenter: "CC-SALES-01",
    purpose: "Client Meeting Lunch", currency: "THB", paymentMethod: "Cash",
    totalAmount: 2800, totalVat: 196, status: "Pending Approval", createdDate: "2025-01-20", submittedDate: "2025-01-20",
    lines: [
      { id: "l4", expenseType: "Meals", description: "Lunch with client at Siam Paragon", amount: 2800, vat: 196, taxInvoiceNo: "INV-REST-001", invoiceDate: "2025-01-20", vendor: "S&P Restaurant", paymentMethod: "Cash", projectId: "PRJ-002", memo: "Meeting with XYZ Corp" },
    ],
    approvalHistory: [
      { stepNo: 1, approverId: "u2", approverName: "สมหญิง แก้วใส", action: "Pending", comment: "", actionDate: null },
    ],
    comments: [],
  },
  {
    id: "c3", claimNo: "EC-2025-003", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "Sales", costCenter: "CC-SALES-01",
    purpose: "Office Supplies Purchase", currency: "THB", paymentMethod: "Personal Card",
    totalAmount: 4500, totalVat: 315, status: "Draft", createdDate: "2025-02-01", submittedDate: null,
    lines: [
      { id: "l5", expenseType: "Office Supplies", description: "Printer cartridges & paper", amount: 3200, vat: 224, taxInvoiceNo: "INV-OD-001", invoiceDate: "2025-02-01", vendor: "OfficeMate", paymentMethod: "Personal Card", projectId: "", memo: "" },
      { id: "l6", expenseType: "Office Supplies", description: "Desk organizer", amount: 1300, vat: 91, taxInvoiceNo: "INV-OD-002", invoiceDate: "2025-02-01", vendor: "OfficeMate", paymentMethod: "Personal Card", projectId: "", memo: "" },
    ],
    approvalHistory: [],
    comments: [],
  },
  {
    id: "c4", claimNo: "EC-2025-004", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "Sales", costCenter: "CC-SALES-01",
    purpose: "Taxi to Airport", currency: "THB", paymentMethod: "Cash",
    totalAmount: 850, totalVat: 0, status: "Rejected", createdDate: "2025-02-05", submittedDate: "2025-02-05",
    lines: [
      { id: "l7", expenseType: "Transportation", description: "Taxi to Suvarnabhumi", amount: 850, vat: 0, taxInvoiceNo: "", invoiceDate: "2025-02-05", vendor: "Taxi meter", paymentMethod: "Cash", projectId: "", memo: "" },
    ],
    approvalHistory: [
      { stepNo: 1, approverId: "u2", approverName: "สมหญิง แก้วใส", action: "Rejected", comment: "Missing receipt. Please resubmit with receipt.", actionDate: "2025-02-06" },
    ],
    comments: [{ id: "cm2", userId: "u2", userName: "สมหญิง แก้วใส", text: "No receipt attached. Company policy requires receipt for all claims.", date: "2025-02-06" }],
  },
  {
    id: "c5", claimNo: "EC-2025-005", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "Sales", costCenter: "CC-SALES-01",
    purpose: "Conference Registration", currency: "THB", paymentMethod: "Bank Transfer",
    totalAmount: 25000, totalVat: 1750, status: "Need Info", createdDate: "2025-02-08", submittedDate: "2025-02-08",
    lines: [
      { id: "l8", expenseType: "Training", description: "Annual Sales Conference 2025", amount: 25000, vat: 1750, taxInvoiceNo: "INV-CONF-001", invoiceDate: "2025-02-08", vendor: "Event Organizer Co.", paymentMethod: "Bank Transfer", projectId: "PRJ-003", memo: "" },
    ],
    approvalHistory: [
      { stepNo: 1, approverId: "u2", approverName: "สมหญิง แก้วใส", action: "Request Info", comment: "Please provide conference agenda and approval from HR", actionDate: "2025-02-09" },
    ],
    comments: [{ id: "cm3", userId: "u2", userName: "สมหญิง แก้วใส", text: "Need HR approval for training budget. Also attach conference agenda.", date: "2025-02-09" }],
  },
  {
    id: "c6", claimNo: "EC-2025-006", requesterId: "u3", requesterName: "วิชัย เจริญ",
    company: "ABC Co., Ltd.", branch: "Chiang Mai", department: "Engineering", costCenter: "CC-ENG-01",
    purpose: "Software License Renewal", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 12000, totalVat: 840, status: "Pending Approval", accountingStatus: "Pending Review", createdDate: "2025-02-08", submittedDate: "2025-02-08",
    lines: [
      { id: "l9", expenseType: "Other", description: "JetBrains IntelliJ IDEA license", amount: 12000, vat: 840, taxInvoiceNo: "INV-JB-001", invoiceDate: "2025-02-08", vendor: "JetBrains", paymentMethod: "Corporate Card", projectId: "PRJ-DEV", memo: "Annual renewal" },
    ],
    approvalHistory: [
      { stepNo: 1, approverId: "u5", approverName: "ธนา พิทักษ์", action: "Pending", comment: "", actionDate: null },
    ],
    comments: [],
  },
];

export const mockBankTransactions: BankTransaction[] = [
  { id: "TXN-001", txnDate: "2025-02-01", amount: 15200, merchant: "Thai Airways", cardholderName: "สมชาย ใจดี", reference: "REF-001", status: "Matched", linkedClaimId: "c1" },
  { id: "TXN-002", txnDate: "2025-02-03", amount: 850, merchant: "Starbucks Siam", cardholderName: "สมหญิง แก้วใส", reference: "REF-002", status: "Unmatched", linkedClaimId: null },
  { id: "TXN-003", txnDate: "2025-02-05", amount: 12000, merchant: "Amazon Web Services", cardholderName: "วิชัย เจริญ", reference: "REF-003", status: "Partially Matched", linkedClaimId: "c6" },
  { id: "TXN-004", txnDate: "2025-02-06", amount: 320, merchant: "Grab Transport", cardholderName: "นภา แจ่มใส", reference: "REF-004", status: "Exception", linkedClaimId: null },
];

export const branches = ["Bangkok", "Chiang Mai", "Phuket", "Khon Kaen"];
export const departments = ["Sales", "Marketing", "Engineering", "HR", "Finance", "Management", "Operations", "IT"];
export const costCenters = ["CC-SALES-01", "CC-MKT-01", "CC-ENG-01", "CC-HR-01", "CC-FIN-01", "CC-MGT-01", "CC-OPS-01", "CC-IT-01"];
export const projects = ["PRJ-001", "PRJ-002", "PRJ-003", "PRJ-DEV", "PRJ-MKT"];
export const expenseTypes = ["Travel", "Meals", "Office Supplies", "Transportation", "Training", "Entertainment", "Communication", "Other"] as const;
export const paymentMethods = ["Cash", "Corporate Card", "Personal Card", "Bank Transfer"] as const;
