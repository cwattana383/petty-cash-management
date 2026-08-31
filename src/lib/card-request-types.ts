export type CardRequestStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Treasury Processing"
  | "Submitted to Bank"
  | "Card Issued"
  | "Completed";

export type CardRequestCardType = "Corporate Credit Card" | "Fleet Card";

export interface CardRequestAudit {
  createdBy?: string;
  createdAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  treasuryAt?: string;
  submittedToBankAt?: string;
  cardIssuedAt?: string;
  completedAt?: string;
}

export interface CardRequest {
  requestNo: string;
  status: CardRequestStatus;
  cardType?: CardRequestCardType;
  requester: string;
  requesterId?: string;
  requestDate: string;
  approverName?: string;
  /** Corporate fields */
  employeeId?: string;
  employeeName?: string;
  position?: string;
  email?: string;
  phone?: string;
  loaRef?: string;
  /** Fleet fields */
  storeLocation?: string;
  storeCode?: string;
  vehiclePlate?: string;
  holderSgm?: string;
  /** Financial control */
  issuingBank?: string;
  cardNetwork?: string;
  currency: string;
  creditLimit?: string;
  perTransactionLimit?: string;
  monthlyLimit?: string;
  costCenter?: string;
  /** Purpose & supporting */
  purpose?: string;
  attachment?: { name: string; size: number } | null;
  audit: CardRequestAudit;
}

export interface StoreLocation {
  storeCode: string;
  name: string;
  sgm: string;
}

export const STORE_LOCATIONS: StoreLocation[] = [
  { storeCode: "ST-1001", name: "Makro Ladprao", sgm: "Wichai Boonmee" },
  { storeCode: "ST-1002", name: "Makro Rangsit", sgm: "Anucha Thongdee" },
  { storeCode: "ST-1003", name: "Makro Bangbon", sgm: "Kittipong Charoensri" },
  { storeCode: "ST-1004", name: "Makro Chiang Mai", sgm: "Teerapat Suwannarat" },
  { storeCode: "ST-1005", name: "Makro Phuket", sgm: "Malee Intharat" },
  { storeCode: "ST-1006", name: "Makro Khon Kaen", sgm: "Thanakorn Pimchai" },
  { storeCode: "ST-1007", name: "Makro Hat Yai", sgm: "Ratchanok Phromma" },
  { storeCode: "ST-1008", name: "Makro Nakhon Pathom", sgm: "Prin Sawatdee" },
];

const STORAGE_KEY = "ccc-card-requests";
const INBOX_KEY = "ccc-approval-inbox-card-requests";

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, list: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function listCardRequests(): CardRequest[] {
  return read<CardRequest>(STORAGE_KEY);
}

export function saveCardRequest(req: CardRequest) {
  const list = listCardRequests();
  const idx = list.findIndex((r) => r.requestNo === req.requestNo);
  if (idx >= 0) list[idx] = req;
  else list.push(req);
  write(STORAGE_KEY, list);
}

/** "CR" + YY + MM + 3-digit running seq, e.g. CR2609004 */
export function generateRequestNo(now = new Date()): string {
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `CR${yy}${mm}`;
  const seq =
    listCardRequests()
      .filter((r) => r.requestNo.startsWith(prefix))
      .reduce((max, r) => Math.max(max, Number(r.requestNo.slice(prefix.length)) || 0), 3) + 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

export interface CardRequestApprovalItem {
  objectType: "Card Request";
  requestNo: string;
  cardType?: CardRequestCardType;
  requesterName: string;
  approverName: string;
  amount?: string;
  status: CardRequestStatus;
  submittedAt: string;
}

export function createApprovalInboxItem(item: CardRequestApprovalItem) {
  const list = read<CardRequestApprovalItem>(INBOX_KEY);
  write(INBOX_KEY, [...list.filter((i) => i.requestNo !== item.requestNo), item]);
}

export function listCardRequestApprovalItems(): CardRequestApprovalItem[] {
  return read<CardRequestApprovalItem>(INBOX_KEY);
}
