import { ClaimHeader, User, BankTransaction } from "./types";

export const currentUser: User = {
  id: "u1",
  employeeCode: "EMP001",
  name: "Somchai Jaidee",
  email: "somchai@company.com",
  role: "Employee",
  branch: "Bangkok",
  department: "Sales",
  costCenter: "CC-SALES-01",
  position: "Sales Executive",
  managerId: "u2",
  managerName: "Somying Kaewsai",
  telephone: "02-123-4567",
};

export const users: User[] = [
  currentUser,
  { id: "u2", employeeCode: "EMP002", name: "Somying Kaewsai", email: "somying@company.com", role: "Manager", branch: "Bangkok", department: "Sales", costCenter: "CC-SALES-01", position: "Sales Manager", managerId: "u5", managerName: "Thana Pitak" },
  { id: "u3", employeeCode: "EMP003", name: "Wichai Charoen", email: "wichai@company.com", role: "Employee", branch: "Chiang Mai", department: "Engineering", costCenter: "CC-ENG-01", position: "Software Engineer", managerId: "u5", managerName: "Thana Pitak" },
  { id: "u4", employeeCode: "ACC001", name: "Pim Dee", email: "pim@company.com", role: "Accounting", branch: "Bangkok", department: "Finance", costCenter: "CC-FIN-01", position: "Senior Accountant", managerId: null, managerName: null },
  { id: "u5", employeeCode: "MGR001", name: "Thana Pitak", email: "thana@company.com", role: "Admin", branch: "Bangkok", department: "Management", costCenter: "CC-MGT-01", position: "Director", managerId: null, managerName: null },
];

export const mockClaims: ClaimHeader[] = [
  {
    id: "c1", claimNo: "TXN20250129001", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Taxicabs and Limousines", merchantName: "GRAB TAXI", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 1500, totalVat: 0, status: "Pending Invoice", documentStatus: "Pending Documents", createdDate: "2026-02-28", submittedDate: null,
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "c2", claimNo: "TXN20250129002", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Hotels and Motels", merchantName: "MARRIOTT HOTEL BKK", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 3500, totalVat: 0, status: "Pending Invoice", documentStatus: "Pending Documents", createdDate: "2026-02-28", submittedDate: null,
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "c3", claimNo: "TXN20250129003", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Service Stations", merchantName: "PTT GAS STATION", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 850, totalVat: 0, status: "Pending Invoice", documentStatus: "Pending Documents", createdDate: "2026-02-28", submittedDate: null,
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "c4", claimNo: "TXN20250129004", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Eating Places and Restaurants", merchantName: "SOMTUM RESTAURANT", currency: "THB", paymentMethod: "Cash",
    totalAmount: 1250, totalVat: 0, status: "Pending Invoice", documentStatus: "Pending Documents", createdDate: "2026-02-28", submittedDate: null,
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "c5", claimNo: "TXN20250129005", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Airlines", merchantName: "THAI AIRWAYS", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 15000, totalVat: 0, status: "Pending Invoice", documentStatus: "Pending Documents", createdDate: "2026-02-28", submittedDate: null,
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "r1", claimNo: "TXN20260227021", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Amusement Parks", merchantName: "Siam Amazing Park", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 7900, totalVat: 0, status: "Auto Reject", documentStatus: "Not Required", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "r2", claimNo: "TXN20260227002", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Tourist Attractions", merchantName: "Tiger Kingdom", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 4500, totalVat: 0, status: "Auto Reject", documentStatus: "Not Required", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "r3", claimNo: "TXN20260227053", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Dance Halls", merchantName: "The Street", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 2500, totalVat: 0, status: "Auto Reject", documentStatus: "Not Required", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "r4", claimNo: "TXN20260227114", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Drinking Places (Bars)", merchantName: "The Nine", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 1250, totalVat: 0, status: "Reject", documentStatus: "Pending Documents", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "r5", claimNo: "TXN20260227025", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Sporting and Recreational Camps", merchantName: "Stone Hill Golf Club", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 55000, totalVat: 0, status: "Final Reject", documentStatus: "Not Required", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "a1", claimNo: "TXN20260227071", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Grocery Stores", merchantName: "Top", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 799, totalVat: 0, status: "Auto Approved", documentStatus: "Validated", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "a2", claimNo: "TXN20260227078", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Fast Food Restaurants", merchantName: "KFC", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 279, totalVat: 0, status: "Auto Approved", documentStatus: "Validated", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "a3", claimNo: "TXN20260227013", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Eating Places and Restaurants", merchantName: "Suki Teenoi", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 499, totalVat: 0, status: "Auto Approved", documentStatus: "Validated", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "a4", claimNo: "TXN20260227124", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Car Rental Agencies", merchantName: "Good Car Service", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 3000, totalVat: 0, status: "Manager Approved", documentStatus: "Validated", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "a5", claimNo: "TXN20260227065", requesterId: "u1", requesterName: "Somchai Jaidee",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Hospitals", merchantName: "Rama 9 Hospital", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 2500, totalVat: 0, status: "Manager Approved", documentStatus: "Validated", createdDate: "2026-02-27", submittedDate: "2026-02-27",
    lines: [], approvalHistory: [], comments: [],
  },
  {
    id: "c6", claimNo: "TXN20250128001", requesterId: "u3", requesterName: "Wichai Charoen",
    company: "ABC Co., Ltd.", branch: "Chiang Mai", department: "9993010460 Finance and Accounting", costCenter: "CC-ENG-01",
    purpose: "Taxi to client site", merchantName: "GRAB TAXI", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 1850, totalVat: 0, status: "Pending Invoice", documentStatus: "Pending Documents", createdDate: "2026-02-25", submittedDate: "2026-02-26",
    lines: [], approvalHistory: [{ stepNo: 1, approverId: "u1", approverName: "Somchai Jaidee", action: "Pending", comment: "", actionDate: null }], comments: [],
  },
  {
    id: "c7", claimNo: "TXN20250128002", requesterId: "u2", requesterName: "Somying Kaewsai",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Business dinner with client", merchantName: "BANYAN TREE RESTAURANT", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 8500, totalVat: 595, status: "Pending Invoice", documentStatus: "Pending Documents", createdDate: "2026-02-24", submittedDate: "2026-02-25",
    lines: [], approvalHistory: [{ stepNo: 1, approverId: "u1", approverName: "Somchai Jaidee", action: "Pending", comment: "", actionDate: null }], comments: [],
  },
  {
    id: "c8", claimNo: "TXN20250127001", requesterId: "u3", requesterName: "Wichai Charoen",
    company: "ABC Co., Ltd.", branch: "Chiang Mai", department: "9993010460 Finance and Accounting", costCenter: "CC-ENG-01",
    purpose: "Flight to Bangkok for meeting", merchantName: "THAI AIRWAYS", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 12500, totalVat: 0, status: "Pending Invoice", documentStatus: "Pending Documents", createdDate: "2026-02-23", submittedDate: "2026-02-24",
    lines: [], approvalHistory: [{ stepNo: 1, approverId: "u1", approverName: "Somchai Jaidee", action: "Pending", comment: "", actionDate: null }], comments: [],
  },
  {
    id: "c9", claimNo: "TXN20250127002", requesterId: "u2", requesterName: "Somying Kaewsai",
    company: "ABC Co., Ltd.", branch: "Bangkok", department: "9993010460 Finance and Accounting", costCenter: "CC-SALES-01",
    purpose: "Hotel for regional meeting", merchantName: "NOVOTEL BANGKOK", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 4200, totalVat: 294, status: "Pending Invoice", documentStatus: "Pending Documents", createdDate: "2026-02-22", submittedDate: "2026-02-23",
    lines: [], approvalHistory: [{ stepNo: 1, approverId: "u1", approverName: "Somchai Jaidee", action: "Pending", comment: "", actionDate: null }], comments: [],
  },
  {
    id: "c10", claimNo: "TXN20250126001", requesterId: "u3", requesterName: "Wichai Charoen",
    company: "ABC Co., Ltd.", branch: "Chiang Mai", department: "9993010460 Finance and Accounting", costCenter: "CC-ENG-01",
    purpose: "Office supplies for project", merchantName: "OfficeMate", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 3200, totalVat: 224, status: "Pending Invoice", documentStatus: "Pending Documents", createdDate: "2026-02-21", submittedDate: "2026-02-22",
    lines: [], approvalHistory: [{ stepNo: 1, approverId: "u1", approverName: "Somchai Jaidee", action: "Pending", comment: "", actionDate: null }], comments: [],
  },
  // ─── Pending Approval claims (for Approval Inbox) ───
  {
    id: "pa1", claimNo: "TXN20260301001", requesterId: "u6", requesterName: "Somying Prasertsuk",
    company: "CP Axtra Co., Ltd.", branch: "Bangkok", department: "Commercial — HoReCa", costCenter: "CC-COM-01",
    purpose: "Airline — Domestic (Bangkok → Chiang Mai, Sales Visit)", merchantName: "THAI AIRWAYS", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 8500, totalVat: 0, status: "Pending Approval", documentStatus: "Validated", createdDate: "2026-03-01", submittedDate: "2026-03-01",
    lines: [], approvalHistory: [{ stepNo: 1, approverId: "u1", approverName: "Somchai Jaidee", action: "Pending", comment: "", actionDate: null }], comments: [],
  },
  {
    id: "pa2", claimNo: "TXN20260301002", requesterId: "u7", requesterName: "Nattapon Wichai",
    company: "CP Axtra Co., Ltd.", branch: "Bangkok", department: "Operations — Supply Chain", costCenter: "CC-OPS-01",
    purpose: "Car Rental (3 days, site inspection Rayong)", merchantName: "BUDGET CAR RENTAL", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 12000, totalVat: 0, status: "Final Rejected", documentStatus: "Validated", createdDate: "2026-03-05", submittedDate: "2026-03-05",
    lines: [], approvalHistory: [{ stepNo: 1, approverId: "u1", approverName: "Somchai Jaidee", action: "Rejected", comment: "The resubmitted receipt still does not match.", actionDate: "2026-03-06" }], comments: [],
  },
  {
    id: "pa3", claimNo: "TXN20260305001", requesterId: "u8", requesterName: "Kannika Thongsuk",
    company: "CP Axtra Co., Ltd.", branch: "Bangkok", department: "Finance — Accounting", costCenter: "CC-FIN-01",
    purpose: "Airline — Overseas (Bangkok → Singapore, Regional Meeting)", merchantName: "SINGAPORE AIRLINES", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 42500, totalVat: 0, status: "Pending Approval", documentStatus: "Validated", createdDate: "2026-03-05", submittedDate: "2026-03-05",
    lines: [], approvalHistory: [{ stepNo: 1, approverId: "u1", approverName: "Somchai Jaidee", action: "Pending", comment: "", actionDate: null }], comments: [],
  },
  {
    id: "pa4", claimNo: "TXN20260310001", requesterId: "u6", requesterName: "Somying Prasertsuk",
    company: "CP Axtra Co., Ltd.", branch: "Bangkok", department: "Commercial — HoReCa", costCenter: "CC-COM-01",
    purpose: "Car Rental (2 days, customer event Pattaya)", merchantName: "AVIS RENT A CAR", currency: "THB", paymentMethod: "Corporate Card",
    totalAmount: 9200, totalVat: 0, status: "Pending Approval", documentStatus: "Validated", createdDate: "2026-03-10", submittedDate: "2026-03-10",
    lines: [], approvalHistory: [{ stepNo: 1, approverId: "u1", approverName: "Somchai Jaidee", action: "Pending", comment: "", actionDate: null }], comments: [],
  },
];
export const mockBankTransactions: BankTransaction[] = [
  { id: "TXN-001", txnDate: "2025-02-01", amount: 15200, merchant: "Thai Airways", cardholderName: "Somchai Jaidee", reference: "REF-001", status: "Matched", linkedClaimId: "c1" },
  { id: "TXN-002", txnDate: "2025-02-03", amount: 850, merchant: "Starbucks Siam", cardholderName: "Somying Kaewsai", reference: "REF-002", status: "Unmatched", linkedClaimId: null },
  { id: "TXN-003", txnDate: "2025-02-05", amount: 12000, merchant: "Amazon Web Services", cardholderName: "Wichai Charoen", reference: "REF-003", status: "Partially Matched", linkedClaimId: "c6" },
  { id: "TXN-004", txnDate: "2025-02-06", amount: 320, merchant: "Grab Transport", cardholderName: "Napa Jamsai", reference: "REF-004", status: "Exception", linkedClaimId: null },
];

export const branches = ["Bangkok", "Chiang Mai", "Phuket", "Khon Kaen"];
export const departments = ["Sales", "Marketing", "Engineering", "HR", "Finance", "Management", "Operations", "IT"];
export const costCenters = ["CC-SALES-01", "CC-MKT-01", "CC-ENG-01", "CC-HR-01", "CC-FIN-01", "CC-MGT-01", "CC-OPS-01", "CC-IT-01"];
export const projects = ["PRJ-001", "PRJ-002", "PRJ-003", "PRJ-DEV", "PRJ-MKT"];
export const expenseTypes = ["Travel", "Meals", "Office Supplies", "Transportation", "Training", "Entertainment", "Communication", "Other"] as const;
export const paymentMethods = ["Cash", "Corporate Card", "Personal Card", "Bank Transfer"] as const;
