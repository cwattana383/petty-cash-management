export type CardMasterStatus = "Active" | "Suspended" | "Cancelled" | "Expired";

export interface CardMasterRow {
  cardId: string;
  kind: "corporate" | "fleet";
  fuelBrand?: string;
  bankTh: string;
  last4: string;
  cardholderName?: string;
  employeeId?: string;
  plateNo?: string;
  creditLimit: number;
  /** MM/YY */
  expiry: string;
  status: CardMasterStatus;
  company: string;
}

function mmYY(d: Date) {
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear() % 100).padStart(2, "0")}`;
}

const soon = new Date();
soon.setDate(soon.getDate() + 45);

export const CARD_MASTER_ROWS: CardMasterRow[] = [
  {
    cardId: "CC-2026-35775",
    kind: "corporate",
    bankTh: "กรุงศรี",
    last4: "3577",
    cardholderName: "Somchai Jaidee",
    employeeId: "EMP-10021",
    creditLimit: 500000,
    expiry: "08/29",
    status: "Active",
    company: "CP AXTRA PCL",
  },
  {
    cardId: "FL-2026-00412",
    kind: "fleet",
    fuelBrand: "PTT",
    bankTh: "กสิกรไทย",
    last4: "8841",
    plateNo: "70-8814",
    creditLimit: 200000,
    expiry: "08/29",
    status: "Active",
    company: "Makro",
  },
  {
    cardId: "CC-2026-31208",
    kind: "corporate",
    bankTh: "ไทยพาณิชย์",
    last4: "3120",
    cardholderName: "Thanit Boonmee",
    employeeId: "EMP-10044",
    creditLimit: 300000,
    expiry: "11/28",
    status: "Active",
    company: "Lotus's",
  },
  {
    cardId: "CC-2026-29944",
    kind: "corporate",
    bankTh: "กรุงเทพ",
    last4: "2994",
    cardholderName: "Naruemon Srisuk",
    employeeId: "EMP-10077",
    creditLimit: 150000,
    expiry: mmYY(soon),
    status: "Active",
    company: "CP AXTRA PCL",
  },
  {
    cardId: "FL-2026-00398",
    kind: "fleet",
    fuelBrand: "Bangchak",
    bankTh: "กรุงไทย",
    last4: "5512",
    plateNo: "82-1145",
    creditLimit: 120000,
    expiry: "03/29",
    status: "Suspended",
    company: "Makro",
  },
  {
    cardId: "CC-2025-88120",
    kind: "corporate",
    bankTh: "ทีทีบี",
    last4: "8812",
    cardholderName: "Pornthip Wattana",
    employeeId: "EMP-10102",
    creditLimit: 250000,
    expiry: "01/25",
    status: "Expired",
    company: "Lotus's",
  },
  {
    cardId: "CC-2025-77341",
    kind: "corporate",
    bankTh: "กสิกรไทย",
    last4: "7734",
    cardholderName: "Anucha Meesuk",
    employeeId: "EMP-10118",
    creditLimit: 400000,
    expiry: "06/28",
    status: "Cancelled",
    company: "CP AXTRA PCL",
  },
  {
    cardId: "FL-2025-00317",
    kind: "fleet",
    fuelBrand: "PTT",
    bankTh: "กรุงศรี",
    last4: "1290",
    plateNo: "กข-1234",
    creditLimit: 180000,
    expiry: "09/28",
    status: "Active",
    company: "Makro",
  },
  {
    cardId: "CC-2025-66220",
    kind: "corporate",
    bankTh: "ไทยพาณิชย์",
    last4: "6622",
    cardholderName: "Kanya Phongsri",
    employeeId: "EMP-10133",
    creditLimit: 600000,
    expiry: "12/29",
    status: "Active",
    company: "Lotus's",
  },
  {
    cardId: "FL-2025-00288",
    kind: "fleet",
    fuelBrand: "Shell",
    bankTh: "กรุงเทพ",
    last4: "4408",
    plateNo: "5กก-9921",
    creditLimit: 90000,
    expiry: "07/28",
    status: "Suspended",
    company: "Makro",
  },
  {
    cardId: "CC-2025-55010",
    kind: "corporate",
    bankTh: "กรุงไทย",
    last4: "5501",
    cardholderName: "Weerachai Tanaka",
    employeeId: "EMP-10150",
    creditLimit: 350000,
    expiry: "05/29",
    status: "Active",
    company: "CP AXTRA PCL",
  },
  {
    cardId: "FL-2025-00201",
    kind: "fleet",
    fuelBrand: "Bangchak",
    bankTh: "ทีทีบี",
    last4: "2011",
    plateNo: "3ขค-4477",
    creditLimit: 100000,
    expiry: "10/28",
    status: "Active",
    company: "Lotus's",
  },
];
