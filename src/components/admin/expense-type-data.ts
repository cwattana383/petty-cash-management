export interface ExpenseTypeSubtype {
  id: string;
  subExpenseType: string;
  accountNameEn: string;
  accountCode: string;
  active: boolean;
  documentTypeIds: string[];
}

export interface ExpenseTypeRow {
  id: string;
  expenseType: string;
  active: boolean;
  updatedAt: string;
  subtypes: ExpenseTypeSubtype[];
}

export interface FormSubtype {
  id?: string;
  subExpenseType: string;
  accountNameEn: string;
  accountCode: string;
  active: boolean;
  documentTypeIds: string[];
}

export const mockDocumentTypes = [
  { id: "1", documentName: "Tax Invoice", isSupportDocument: false },
  { id: "2", documentName: "Receipt", isSupportDocument: false },
  { id: "3", documentName: "Boarding Pass", isSupportDocument: true },
  { id: "4", documentName: "Hotel Folio", isSupportDocument: true },
];

export const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);

// Seeded from DB — 5 expense types with 25 subtypes
export const initialData: ExpenseTypeRow[] = [
  {
    id: "1", expenseType: "Entertainment", active: true, updatedAt: "2026-03-25 16:36:17",
    subtypes: [
      { id: "s1", subExpenseType: "Client Meal — HoReCa / Business Visit", accountNameEn: "Eating Places/Restaurants", accountCode: "ENT-001", active: true, documentTypeIds: [] },
      { id: "s2", subExpenseType: "Trainer / Guest Entertainment", accountNameEn: "Eating Places/Restaurants", accountCode: "ENT-002", active: true, documentTypeIds: [] },
      { id: "s3", subExpenseType: "Entertainment >3,000 THB (Requires Approval)", accountNameEn: "Eating Places/Restaurants", accountCode: "ENT-003", active: true, documentTypeIds: [] },
      { id: "s4", subExpenseType: "Motion Picture / Non-Business Entertainment", accountNameEn: "Motion Picture Theaters", accountCode: "ENT-004", active: false, documentTypeIds: [] },
    ],
  },
  {
    id: "2", expenseType: "Hotel", active: true, updatedAt: "2026-03-25 16:36:17",
    subtypes: [
      { id: "s5", subExpenseType: "Hotel — Domestic Standard Rate (ASGM–Division Mgr Level)", accountNameEn: "Hotels/Motels/Resorts", accountCode: "HTL-001", active: true, documentTypeIds: [] },
      { id: "s6", subExpenseType: "Hotel — Domestic SGM/Senior Mgr (Twin Sharing)", accountNameEn: "Hotels/Motels/Resorts", accountCode: "HTL-002", active: true, documentTypeIds: [] },
      { id: "s7", subExpenseType: "Hotel — Domestic Associate Director–Chief (Single Room)", accountNameEn: "Hotels/Motels/Resorts", accountCode: "HTL-003", active: true, documentTypeIds: [] },
      { id: "s8", subExpenseType: "Hotel — Domestic GCEO/CEO BU (Single Room)", accountNameEn: "Hotels/Motels/Resorts", accountCode: "HTL-004", active: true, documentTypeIds: [] },
      { id: "s9", subExpenseType: "Hotel — Domestic Special Area (Island/Large Event)", accountNameEn: "Hotels/Motels/Resorts", accountCode: "HTL-005", active: true, documentTypeIds: [] },
      { id: "s10", subExpenseType: "Hotel — International Group A & B (Senior Dir/Chief Level)", accountNameEn: "Holiday Inn", accountCode: "HTL-006", active: true, documentTypeIds: [] },
      { id: "s11", subExpenseType: "Hotel — International Group A & B (Assoc Dir–Director)", accountNameEn: "Holiday Inn", accountCode: "HTL-007", active: true, documentTypeIds: [] },
      { id: "s12", subExpenseType: "Hotel — International Group A & B (Sr.Mgr/SGM/Area Mgr)", accountNameEn: "Holiday Inn", accountCode: "HTL-008", active: true, documentTypeIds: [] },
      { id: "s13", subExpenseType: "Hotel — International Group C (ASEAN & Others)", accountNameEn: "Holiday Inn", accountCode: "HTL-009", active: true, documentTypeIds: [] },
    ],
  },
  {
    id: "3", expenseType: "Meals & Entertainment", active: true, updatedAt: "2026-03-25 16:36:17",
    subtypes: [
      { id: "s14", subExpenseType: "Meals — Per Diem Domestic Travel", accountNameEn: "Eating Places/Restaurants", accountCode: "MEA-001", active: true, documentTypeIds: [] },
      { id: "s15", subExpenseType: "Meals — Staff Meeting / Stock Count", accountNameEn: "Eating Places/Restaurants", accountCode: "MEA-002", active: true, documentTypeIds: [] },
      { id: "s16", subExpenseType: "Meals — Night Shift Special Operation", accountNameEn: "Eating Places/Restaurants", accountCode: "MEA-003", active: true, documentTypeIds: [] },
      { id: "s17", subExpenseType: "Meals — Overseas Per Diem Group A & B CEO/GCEO", accountNameEn: "Eating Places/Restaurants", accountCode: "MEA-004", active: true, documentTypeIds: [] },
      { id: "s18", subExpenseType: "Meals — Overseas Per Diem Group A & B Senior Dir/Chief", accountNameEn: "Eating Places/Restaurants", accountCode: "MEA-005", active: true, documentTypeIds: [] },
      { id: "s19", subExpenseType: "Meals — Overseas Per Diem Group A & B Assoc Dir–Director", accountNameEn: "Eating Places/Restaurants", accountCode: "MEA-006", active: true, documentTypeIds: [] },
      { id: "s20", subExpenseType: "Bars / Cocktail Lounges", accountNameEn: "Bars/Cocktail Lounges", accountCode: "MEA-007", active: true, documentTypeIds: [] },
      { id: "s21", subExpenseType: "Grocery / Supermarket Purchase", accountNameEn: "Grocery Stores/Supermarkets", accountCode: "MEA-008", active: true, documentTypeIds: [] },
    ],
  },
  {
    id: "4", expenseType: "Transportation", active: true, updatedAt: "2026-03-25 16:36:17",
    subtypes: [
      { id: "s22", subExpenseType: "Taxi / Ride-hailing Service", accountNameEn: "Taxicabs/Limousines", accountCode: "TRN-001", active: true, documentTypeIds: [] },
      { id: "s23", subExpenseType: "Airline Tickets — Domestic & International", accountNameEn: "Airlines/Air Carriers", accountCode: "TRN-002", active: true, documentTypeIds: [] },
      { id: "s24", subExpenseType: "Fuel / Petrol Station", accountNameEn: "Service Stations", accountCode: "TRN-003", active: true, documentTypeIds: [] },
    ],
  },
  {
    id: "5", expenseType: "Personal", active: true, updatedAt: "2026-03-25 16:36:17",
    subtypes: [
      { id: "s25", subExpenseType: "Jewelry / Personal Shopping", accountNameEn: "Jewelry/Watch/Clock Stores", accountCode: "PER-001", active: true, documentTypeIds: [] },
    ],
  },
];

let _nextId = 6;
let _nextSubId = 26;

export function getNextId() { return String(_nextId++); }
export function getNextSubId() { return `s${_nextSubId++}`; }
