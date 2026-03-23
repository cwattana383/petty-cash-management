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
  telephone: "02-123-4567",
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
    id: "c1", claimNo: "TXN20250129001", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Taxicabs and Limousines", merchantName: "GRAB TAXI", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 1500, totalVat: 0, status: "Pending Invoice", createdDate: "2026-02-28", submittedDate: null,
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "c2", claimNo: "TXN20250129002", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Hotels and Motels", merchantName: "MARRIOTT HOTEL BKK", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 3500, totalVat: 0, status: "Pending Invoice", createdDate: "2026-02-28", submittedDate: null,
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "c3", claimNo: "TXN20250129003", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Service Stations", merchantName: "PTT GAS STATION", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 850, totalVat: 0, status: "Pending Invoice", createdDate: "2026-02-28", submittedDate: null,
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "c4", claimNo: "TXN20250129004", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Eating Places and Restaurants", merchantName: "SOMTUM RESTAURANT", currency: "THB", paymentMethod: "Cash",
    totalAmount: 1250, totalVat: 0, status: "Pending Invoice", createdDate: "2026-02-28", submittedDate: null,
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "c5", claimNo: "TXN20250129005", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Airlines", merchantName: "THAI AIRWAYS", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 15000, totalVat: 0, status: "Pending Invoice", createdDate: "2026-02-28", submittedDate: null,
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "r1", claimNo: "TXN20260227021", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Amusement Parks", merchantName: "Siam Amazing Park", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 7900, totalVat: 0, status: "Auto Reject", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "r2", claimNo: "TXN20260227002", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Tourist Attractions", merchantName: "Tiger Kingdom", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 4500, totalVat: 0, status: "Auto Reject", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "r3", claimNo: "TXN20260227053", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Dance Halls", merchantName: "The Street", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 2500, totalVat: 0, status: "Auto Reject", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "r4", claimNo: "TXN20260227114", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Drinking Places (Bars)", merchantName: "The Nine", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 1250, totalVat: 0, status: "Reject", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "r5", claimNo: "TXN20260227025", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Sporting and Recreational Camps", merchantName: "Stone Hill Golf Club", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 55000, totalVat: 0, status: "Final Reject", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "a1", claimNo: "TXN20260227071", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Grocery Stores", merchantName: "Top", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 799, totalVat: 0, status: "Auto Approved", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "a2", claimNo: "TXN20260227078", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Fast Food Restaurants", merchantName: "KFC", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 279, totalVat: 0, status: "Auto Approved", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "a3", claimNo: "TXN20260227013", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Eating Places and Restaurants", merchantName: "Suki Teenoi", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 499, totalVat: 0, status: "Auto Approved", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "a4", claimNo: "TXN20260227124", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Car Rental Agencies", merchantName: "Good Car Service", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 3000, totalVat: 0, status: "Manager Approved", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "a5", claimNo: "TXN20260227065", requesterId: "u1", requesterName: "สมชาย ใจดี",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Hospitals", merchantName: "Rama 9 Hospital", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 2500, totalVat: 0, status: "Manager Approved", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "c6", claimNo: "TXN20250128001", requesterId: "u3", requesterName: "วิชัย เจริญ",
    company: "ABC Co., Ltd.", branch: "Chiang Mai", department: "9993010460 Finance and Accounting", costCenter: "CC-ENG-01",
    purpose: "Taxi to client site", merchantName: "GRAB TAXI", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 1850, totalVat: 0, status: "Pending Invoice", createdDate: "2026-02-25", submittedDate: "2026-02-26",
    lines: [], approvalHistory: [{ stepNo: 1, approverId: "u1", approverName: "สมชาย ใจดี", action: "Pending", comment: "", actionDate: null }], comments: [],
  },
  {
    id: "c7", claimNo: "TXN20250128002", requesterId: "u2", requesterName: "สมหญิง แก้วใส",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Business dinner with client", merchantName: "BANYAN TREE RESTAURANT", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 8500, totalVat: 595, status: "Pending Invoice", createdDate: "2026-02-24", submittedDate: "2026-02-25",
    lines: [], approvalHistory: [{ stepNo: 1, approverId: "u1", approverName: "สมชาย ใจดี", action: "Pending", comment: "", actionDate: null }], comments: [],
  },
  {
    id: "c8", claimNo: "TXN20250127001", requesterId: "u3", requesterName: "วิชัย เจริญ",
    company: "ABC Co., Ltd.", branch: "Chiang Mai", department: "9993010460 Finance and Accounting", costCenter: "CC-ENG-01",
    purpose: "Flight to Bangkok for meeting", merchantName: "THAI AIRWAYS", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 12500, totalVat: 0, status: "Pending Invoice", createdDate: "2026-02-23", submittedDate: "2026-02-24",
    lines: [], approvalHistory: [{ stepNo: 1, approverId: "u1", approverName: "สมชาย ใจดี", action: "Pending", comment: "", actionDate: null }], comments: [],
  },
  {
    id: "c9", claimNo: "TXN20250127002", requesterId: "u2", requesterName: "สมหญิง แก้วใส",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Hotel for regional meeting", merchantName: "NOVOTEL BANGKOK", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 4200, totalVat: 294, status: "Pending Approval", createdDate: "2026-02-22", submittedDate: "2026-02-23",
    lines: [], approvalHistory: [{ stepNo: 1, approverId: "u1", approverName: "สมชาย ใจดี", action: "Pending", comment: "", actionDate: null }], comments: [],
  },
  {
    id: "c10", claimNo: "TXN20250126001", requesterId: "u3", requesterName: "วิชัย เจริญ",
    company: "ABC Co., Ltd.", branch: "Chiang Mai", department: "9993010460 Finance and Accounting", costCenter: "CC-ENG-01",
    purpose: "Office supplies for project", merchantName: "OfficeMate", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 3200, totalVat: 224, status: "Pending Approval", createdDate: "2026-02-21", submittedDate: "2026-02-22",
    lines: [], approvalHistory: [{ stepNo: 1, approverId: "u1", approverName: "สมชาย ใจดี", action: "Pending", comment: "", actionDate: null }], comments: [],
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
