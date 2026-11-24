import { describe, it, expect } from "vitest";
import { findApplicableRate, validateAvgVatRate, getAvgVatStatus, type AvgVatRate } from "./avg-vat-rate";

const rates: AvgVatRate[] = [
  { id: "a", rate: 69.44, from: "2026-01-01", to: "2026-12-31", updatedAt: "" },
  { id: "b", rate: 71.44, from: "2027-01-01", to: "2027-12-31", updatedAt: "" },
];

describe("AVG VAT Rate", () => {
  it("10/07/2026 + 1 month uses 69.44%", () => {
    const r = findApplicableRate(rates, "2026-07-10");
    expect(r.target).toBe("2026-08-10");
    expect(r.rate?.rate).toBe(69.44);
  });
  it("20/12/2026 + 1 month uses 71.44%", () => {
    const r = findApplicableRate(rates, "2026-12-20");
    expect(r.target).toBe("2027-01-20");
    expect(r.rate?.rate).toBe(71.44);
  });
  it("no rate when target outside all periods", () => {
    expect(findApplicableRate(rates, "2027-12-15").rate).toBeUndefined();
  });
  it("rejects To earlier than From", () => {
    expect(validateAvgVatRate({ rate: "70", from: "2028-05-01", to: "2028-04-01" }, rates).error).toBe("range");
  });
  it("rejects overlapping period", () => {
    expect(validateAvgVatRate({ rate: "70", from: "2027-06-01", to: "2028-06-01" }, rates).overlap?.id).toBe("b");
  });
  it("warns on gap but allows save", () => {
    const v = validateAvgVatRate({ rate: "70", from: "2028-02-01", to: "2028-12-31" }, rates);
    expect(v.error).toBeUndefined();
    expect(v.gap).toBe(true);
  });
  it("no gap when starting the day after previous end", () => {
    expect(validateAvgVatRate({ rate: "70", from: "2028-01-01", to: "2028-12-31" }, rates).gap).toBe(false);
  });
  it("status from today", () => {
    expect(getAvgVatStatus(rates[0], "2026-11-24")).toBe("Active");
    expect(getAvgVatStatus(rates[1], "2026-11-24")).toBe("Upcoming");
    expect(getAvgVatStatus(rates[0], "2027-01-02")).toBe("Expired");
  });
});
