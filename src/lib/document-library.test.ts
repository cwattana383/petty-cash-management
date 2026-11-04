// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { canAccessDocumentLibrary, EMPTY_LIBRARY_FILTERS, filterLibraryDocuments, readLibraryDocuments, sortLibraryDocuments } from "./document-library";

describe("Document Library rules", () => {
  it("allows Admin for now and rejects other existing roles", () => {
    expect(canAccessDocumentLibrary(["Admin"])).toBe(true);
    expect(canAccessDocumentLibrary(["Cardholder", "Approver"])).toBe(false);
    expect(canAccessDocumentLibrary([])).toBe(false);
  });
  it("provides eight documents mixing both card types and includes RPA uploads", async () => {
    const rows = await readLibraryDocuments();
    expect(rows).toHaveLength(8);
    expect(rows.filter((row) => row.cardType === "Fleet Card")).toHaveLength(4);
    expect(rows.filter((row) => row.cardType === "Credit Card")).toHaveLength(4);
    expect(rows.filter((row) => row.uploadedBy === "RPA")).toHaveLength(2);
    expect(rows.filter((row) => row.transactionNo === "bt-1")).toHaveLength(2);
  });
  it("matches names and transaction numbers with trimmed case-insensitive contains", async () => {
    const rows = await readLibraryDocuments();
    expect(filterLibraryDocuments(rows, { ...EMPTY_LIBRARY_FILTERS, search: " HOTEL " }).map((row) => row.id)).toEqual(["dl-5", "dl-6"]);
    expect(filterLibraryDocuments(rows, { ...EMPTY_LIBRARY_FILTERS, search: " txn2026050600007 " }).map((row) => row.id)).toEqual(["dl-4"]);
  });
  it("AND-combines type, uploader, search and inclusive date ranges", async () => {
    const rows = await readLibraryDocuments();
    const row = rows[1];
    const date = row.transactionDate.slice(0, 10);
    const filters = { ...EMPTY_LIBRARY_FILTERS, search: row.name, cardType: "Fleet Card", uploadedBy: "RPA", transactionFrom: date, transactionTo: date, uploadFrom: date, uploadTo: date };
    expect(filterLibraryDocuments(rows, filters).map((item) => item.id)).toEqual(["dl-2"]);
    expect(filterLibraryDocuments(rows, { ...filters, cardType: "Credit Card" })).toHaveLength(0);
    expect(filterLibraryDocuments(rows, { ...filters, uploadTo: "2000-01-01" })).toHaveLength(0);
  });
  it("sorts names, both dates and uploaders in both directions without changing source", async () => {
    const rows = await readLibraryDocuments();
    for (const key of ["name", "transactionDate", "uploadedAt", "uploadedBy"] as const) {
      const asc = sortLibraryDocuments(rows, key, "asc");
      const desc = sortLibraryDocuments(rows, key, "desc");
      const compare = (a: string, b: string) => key === "name" || key === "uploadedBy" ? a.localeCompare(b, "en", { sensitivity: "base" }) : new Date(a).getTime() - new Date(b).getTime();
      expect(asc.every((row, index) => index === 0 || compare(asc[index - 1][key], row[key]) <= 0)).toBe(true);
      expect(desc.every((row, index) => index === 0 || compare(desc[index - 1][key], row[key]) >= 0)).toBe(true);
    }
    expect(rows[0].id).toBe("dl-1");
  });
});