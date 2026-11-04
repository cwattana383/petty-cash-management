import { beforeEach, describe, expect, it } from "vitest";
import { initialOcrCardRules, ocrToleranceSchema, resolveOcrCardRule, saveOcrCardRule, resetOcrCardRule, readOcrCardRules } from "./ocr-card-type-rules";
import { readCardTypeMaster } from "./card-type-master";

beforeEach(() => localStorage.clear());

describe("per-card-type OCR rules", () => {
  it("seeds Default as 1 THB, 1 percent and 0 days", () => {
    expect(initialOcrCardRules().default).toMatchObject({ amountToleranceThb: 1, amountTolerancePct: 1, dateToleranceDays: 0 });
  });
  it("seeds Corporate Credit Card as 1 THB, 1 percent and 0 days", () => {
    expect(initialOcrCardRules()["corporate-credit-card"]).toMatchObject({ amountToleranceThb: 1, amountTolerancePct: 1, dateToleranceDays: 0 });
  });
  it("preserves Fleet zero tolerance", () => {
    const rules = initialOcrCardRules();
    expect(resolveOcrCardRule(rules, "fleet-card")).toMatchObject({ amountToleranceThb: 0, amountTolerancePct: 0, dateToleranceDays: 0 });
  });
  it("EV Fleet and new types inherit Default without creating rules", () => {
    const rules = initialOcrCardRules();
    expect(rules["ev-fleet-card"]).toBeUndefined();
    expect(resolveOcrCardRule(rules, "ev-fleet-card")).toEqual(rules.default);
    expect(resolveOcrCardRule(rules, "future-type")).toEqual(rules.default);
  });
  it("rejects negative values for each field", () => {
    for (const field of ["amountToleranceThb", "amountTolerancePct", "dateToleranceDays"]) {
      expect(ocrToleranceSchema.safeParse({ ...initialOcrCardRules().default, [field]: -1 }).success).toBe(false);
    }
  });
  it("caps percent at 100", () => {
    expect(ocrToleranceSchema.safeParse({ ...initialOcrCardRules().default, amountTolerancePct: 101 }).success).toBe(false);
    expect(ocrToleranceSchema.safeParse({ ...initialOcrCardRules().default, amountTolerancePct: 100 }).success).toBe(true);
  });
  it("rejects fractional days", () => {
    expect(ocrToleranceSchema.safeParse({ ...initialOcrCardRules().default, dateToleranceDays: 1.5 }).success).toBe(false);
  });
  it("rejects blank, nonnumeric and nonfinite values", () => {
    for (const value of ["", "bad", NaN, Infinity]) {
      expect(ocrToleranceSchema.safeParse({ ...initialOcrCardRules().default, amountToleranceThb: value }).success).toBe(false);
    }
  });
  it("saves only the selected rule with actual performer and update time", () => {
    const original = initialOcrCardRules();
    const next = saveOcrCardRule(original, "ev-fleet-card", { amountToleranceThb: 2, amountTolerancePct: 3, dateToleranceDays: 4 }, "Test Admin");
    expect(readOcrCardRules()).toEqual(next);
    expect(next["fleet-card"]).toEqual(original["fleet-card"]);
    expect(next["ev-fleet-card"]).toMatchObject({ amountToleranceThb: 2, amountTolerancePct: 3, dateToleranceDays: 4, updatedBy: "Test Admin" });
    expect(Date.parse(next["ev-fleet-card"].updatedAt)).toBeGreaterThan(Date.parse(original.default.updatedAt));
  });
  it("validates at persistence boundary before writing", () => {
    expect(() => saveOcrCardRule(initialOcrCardRules(), "fleet-card", { amountToleranceThb: -1, amountTolerancePct: 0, dateToleranceDays: 0 }, "Test Admin")).toThrow();
    expect(localStorage.getItem("ocr-card-type-rules")).toBeNull();
  });
  it("reset removes only the selected specific rule and uses current Default", () => {
    const rules = initialOcrCardRules();
    const next = resetOcrCardRule(rules, "fleet-card");
    expect(next["fleet-card"]).toBeUndefined();
    expect(resolveOcrCardRule(next, "fleet-card")).toEqual(rules.default);
    expect(next["corporate-credit-card"]).toEqual(rules["corporate-credit-card"]);
    expect(resetOcrCardRule(next, "default")).toEqual(next);
  });
  it("master supports new types and inactive records without losing their saved rules", () => {
    localStorage.setItem("card-type-master", JSON.stringify([{ id: "fleet-card", name: "Fleet Card", active: false }, { id: "new", name: "Store Credit Card", active: true }]));
    expect(readCardTypeMaster().filter((type) => type.active).map((type) => type.name)).toEqual(["Store Credit Card"]);
    expect(readOcrCardRules()["fleet-card"].amountToleranceThb).toBe(0);
  });
  it("permits an empty master while retaining Default", () => {
    localStorage.setItem("card-type-master", "[]");
    expect(readCardTypeMaster()).toEqual([]);
    expect(readOcrCardRules().default.amountTolerancePct).toBe(1);
  });
});