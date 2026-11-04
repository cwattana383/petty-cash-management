import { apiClient, getCorpTxnByBankTxnId } from "./api-client";
import type { ExpenseTypeRow } from "@/hooks/use-expense-types";
import type { DocumentTypeRow } from "@/hooks/use-document-types";
import { getCardType, type CardTypeLabel } from "./approval-status";

export interface LibraryDocument {
  id: string;
  name: string;
  transactionNo: string;
  transactionDate: string;
  cardType: CardTypeLabel;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
  documentTypeId: string;
  documentType: string;
  expenseTypeId: string;
  expenseType: string;
  subExpenseTypeId: string;
  subExpenseType: string;
}

export interface LibraryFilters {
  search: string;
  cardType: string;
  transactionFrom: string;
  transactionTo: string;
  uploadFrom: string;
  uploadTo: string;
  uploadedBy: string;
  expenseTypeId: string;
  subExpenseTypeId: string;
  documentTypeId: string;
}

export const EMPTY_LIBRARY_FILTERS: LibraryFilters = {
  search: "", cardType: "all", transactionFrom: "", transactionTo: "",
  uploadFrom: "", uploadTo: "", uploadedBy: "all",
  expenseTypeId: "all", subExpenseTypeId: "all", documentTypeId: "all",
};
export type LibrarySortKey = "name" | "documentType" | "expenseType" | "subExpenseType" | "transactionDate" | "uploadedAt" | "uploadedBy";
export const DOCUMENT_LIBRARY_ROLES = ["Admin"];
export function canAccessDocumentLibrary(roles: readonly string[]) {
  return roles.some((role) => DOCUMENT_LIBRARY_ROLES.includes(role));
}

// Mock attachment boundary: replace with the stored attachment reader and original
// file URLs when connected. Transaction metadata is joined from the shared source.
const SAMPLE_ATTACHMENTS = [
  { id: "dl-1", transactionNo: "bt-8", name: "fuel-tax-invoice.pdf", uploadedBy: "Somchai Jaidee" },
  { id: "dl-2", transactionNo: "TXN2026050100001", name: "fuel-e-tax-invoice.pdf", uploadedBy: "RPA" },
  { id: "dl-3", transactionNo: "TXN2026050400004", name: "fleet-tax-invoice.pdf", uploadedBy: "Somchai Jaidee" },
  { id: "dl-4", transactionNo: "TXN2026050600007", name: "fleet-e-tax-invoice.pdf", uploadedBy: "RPA" },
  { id: "dl-5", transactionNo: "bt-1", name: "hotel-booking.pdf", uploadedBy: "Somchai Jaidee" },
  { id: "dl-6", transactionNo: "bt-1", name: "hotel-tax-invoice.pdf", uploadedBy: "Somchai Jaidee" },
  { id: "dl-7", transactionNo: "bt-2", name: "airplane-booking.pdf", uploadedBy: "Somying Kaewsai" },
  { id: "dl-8", transactionNo: "bt-3", name: "meal-receipt.pdf", uploadedBy: "Wichai Charoen" },
];

// Classification IDs belong to the eight mock document records, not dropdown options.
const SAMPLE_CLASSIFICATIONS = [
  { documentTypeId: "dt-12", expenseTypeId: "et-forklift-refueling", subExpenseTypeId: "set-forklift-refueling" },
  { documentTypeId: "dt-12", expenseTypeId: "et-forklift-refueling", subExpenseTypeId: "set-forklift-refueling" },
  { documentTypeId: "dt-12", expenseTypeId: "et-forklift-refueling", subExpenseTypeId: "set-forklift-refueling" },
  { documentTypeId: "dt-12", expenseTypeId: "et-forklift-refueling", subExpenseTypeId: "set-forklift-refueling" },
  { documentTypeId: "dt-3", expenseTypeId: "et-1", subExpenseTypeId: "set-6" },
  { documentTypeId: "dt-12", expenseTypeId: "et-1", subExpenseTypeId: "set-6" },
  { documentTypeId: "dt-4", expenseTypeId: "et-1", subExpenseTypeId: "set-5" },
  { documentTypeId: "dt-12", expenseTypeId: "et-1", subExpenseTypeId: "set-7" },
];

export function librarySubtypeOptions(expenses: ExpenseTypeRow[], expenseTypeId: string) {
  return expenses.filter((expense) => expenseTypeId === "all" || expense.id === expenseTypeId)
    .flatMap((expense) => expense.subtypes);
}

export async function readLibraryDocuments(): Promise<LibraryDocument[]> {
  const [expensesResponse, documentResponse] = await Promise.all([
    apiClient.get("/expense-types?limit=10000"),
    apiClient.get("/document-types?limit=10000"),
  ]);
  const expenses: ExpenseTypeRow[] = expensesResponse.items ?? [];
  const documentTypes: DocumentTypeRow[] = documentResponse.items ?? [];
  return SAMPLE_ATTACHMENTS.flatMap((attachment, index) => {
    const transaction = getCorpTxnByBankTxnId(attachment.transactionNo);
    if (!transaction) return [];
    const classification = SAMPLE_CLASSIFICATIONS[index];
    const expenseTypeId = transaction.expenseTypeId ?? classification.expenseTypeId;
    const subExpenseTypeId = transaction.subExpenseTypeId ?? classification.subExpenseTypeId;
    const expense = expenses.find((item) => item.id === expenseTypeId);
    return [{
      ...attachment,
      expenseTypeId,
      subExpenseTypeId,
      expenseType: expense?.expenseType ?? "",
      subExpenseType: expense?.subtypes.find((item) => item.id === subExpenseTypeId)?.subExpenseType ?? "",
      documentTypeId: classification.documentTypeId,
      documentType: documentTypes.find((item) => item.id === classification.documentTypeId)?.documentName ?? "",
      transactionDate: transaction.transactionDate,
      cardType: getCardType(attachment.transactionNo),
      // Fixture upload timestamp, distinct from transaction time.
      uploadedAt: `${transaction.transactionDate.slice(0, 10)}T${String(9 + index).padStart(2, "0")}:30:00+07:00`,
      url: `/downloads/document-library/${attachment.name}`,
    }];
  });
}

export function filterLibraryDocuments(rows: LibraryDocument[], filters: LibraryFilters) {
  const query = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    const date = row.transactionDate.slice(0, 10);
    const upload = row.uploadedAt.slice(0, 10);
    return (!query || row.name.toLowerCase().includes(query) || row.transactionNo.toLowerCase().includes(query))
      && (filters.cardType === "all" || row.cardType === filters.cardType)
      && (!filters.transactionFrom || date >= filters.transactionFrom)
      && (!filters.transactionTo || date <= filters.transactionTo)
      && (!filters.uploadFrom || upload >= filters.uploadFrom)
      && (!filters.uploadTo || upload <= filters.uploadTo)
      && (filters.uploadedBy === "all" || row.uploadedBy === filters.uploadedBy)
      && (filters.expenseTypeId === "all" || row.expenseTypeId === filters.expenseTypeId)
      && (filters.subExpenseTypeId === "all" || row.subExpenseTypeId === filters.subExpenseTypeId)
      && (filters.documentTypeId === "all" || row.documentTypeId === filters.documentTypeId);
  });
}

export function sortLibraryDocuments(rows: LibraryDocument[], key: LibrarySortKey, direction: "asc" | "desc") {
  return [...rows].sort((a, b) => {
    const value = key === "transactionDate" || key === "uploadedAt"
      ? new Date(a[key]).getTime() - new Date(b[key]).getTime()
      : a[key].localeCompare(b[key], "en", { sensitivity: "base" });
    return (direction === "asc" ? value : -value) || a.id.localeCompare(b.id);
  });
}

export function downloadLibraryDocuments(documents: LibraryDocument[]) {
  // Static same-origin originals: keep each download in the user's click event.
  // Bulk delivery is individual files, not the unconfirmed ZIP feature.
  for (const document of documents) {
    const anchor = window.document.createElement("a");
    anchor.href = document.url;
    anchor.download = document.name;
    window.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
}