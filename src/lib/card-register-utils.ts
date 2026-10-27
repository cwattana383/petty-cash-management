export const CARD_REGISTER_LOCATIONS = [
  { code: "010001", name: "บมจ.ซีพี แอ็กซ์ตร้า สาขาลาดพร้าว" },
  { code: "010002", name: "บมจ.ซีพี แอ็กซ์ตร้า สาขาแจ้งวัฒนะ" },
  { code: "010003", name: "บมจ.ซีพี แอ็กซ์ตร้า สาขาศรีนครินทร์" },
  { code: "010004", name: "บมจ.ซีพี แอ็กซ์ตร้า สาขาบางบอน" },
  { code: "010005", name: "บมจ.ซีพี แอ็กซ์ตร้า สาขาชลบุรี" },
  { code: "010006", name: "บมจ.ซีพี แอ็กซ์ตร้า สาขาเชียงใหม่" },
  { code: "010007", name: "บมจ.ซีพี แอ็กซ์ตร้า สาขานครราชสีมา" },
];

export type CardRegisterSortKey = "cardId" | "kind" | "bankTh" | "last4" | "plateNo" | "locationCode" | "cardholderName" | "creditLimit" | "expiry" | "status";

export function locationInRange(code: string | undefined, from: string, to: string) {
  if (from && to && from > to) return true;
  if (!from && !to) return true;
  return !!code && (!from || code >= from) && (!to || code <= to);
}

export function compareCardValues(a: string | number | undefined, b: string | number | undefined, direction: "asc" | "desc") {
  const empty = (v: typeof a) => v === undefined || v === "" || v === "-" || v === "Unassigned";
  if (empty(a) || empty(b)) return Number(empty(a)) - Number(empty(b));
  const comparison = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
  return direction === "asc" ? comparison : -comparison;
}

export function expirySortValue(value: string) {
  const match = /^(\d{2})\/(\d{2}|\d{4})$/.exec(value);
  if (!match) return undefined;
  const year = Number(match[2]);
  return (match[2].length === 2 ? 2000 + year : year > 2400 ? year - 543 : year) * 12 + Number(match[1]);
}