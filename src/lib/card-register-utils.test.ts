import { describe, expect, it } from "vitest";
import { CARD_MASTER_ROWS } from "./card-master-mock-data";
import { CARD_REGISTER_LOCATIONS, compareCardValues, expirySortValue, locationInRange } from "./card-register-utils";

describe("Card Register location rules", () => {
  it("uses the seven supplied branch codes", () => {
    expect(CARD_REGISTER_LOCATIONS.map((location) => location.code)).toEqual(["010001", "010002", "010003", "010004", "010005", "010006", "010007"]);
    expect(CARD_REGISTER_LOCATIONS[0].name).toBe("บมจ.ซีพี แอ็กซ์ตร้า สาขาลาดพร้าว");
  });
  it("retains 16 cards and assigns each a valid location and plate field", () => {
    expect(CARD_MASTER_ROWS).toHaveLength(16);
    expect(CARD_MASTER_ROWS.every((row) => typeof row.plateNo === "string" && CARD_REGISTER_LOCATIONS.some((location) => location.code === row.locationCode && location.name === row.locationName))).toBe(true);
  });
  it("includes both range boundaries and excludes codes outside them", () => {
    expect(["010001", "010002", "010003", "010004", "010005"].filter((code) => locationInRange(code, "010002", "010004"))).toEqual(["010002", "010003", "010004"]);
  });
  it("supports only From code", () => {
    expect(locationInRange("010001", "010002", "")).toBe(false);
    expect(locationInRange("010002", "010002", "")).toBe(true);
    expect(locationInRange("010007", "010002", "")).toBe(true);
  });
  it("supports only To code", () => {
    expect(locationInRange("010001", "", "010004")).toBe(true);
    expect(locationInRange("010004", "", "010004")).toBe(true);
    expect(locationInRange("010005", "", "010004")).toBe(false);
  });
  it("does not apply a reversed range", () => {
    expect(locationInRange("010001", "010007", "010002")).toBe(true);
    expect(locationInRange(undefined, "010007", "010002")).toBe(true);
  });
  it("excludes missing locations only when a valid bound is selected", () => {
    expect(locationInRange(undefined, "", "")).toBe(true);
    expect(locationInRange(undefined, "010001", "")).toBe(false);
  });
});

describe("Card Register sorting", () => {
  it("sorts text alphabetically in both directions", () => {
    expect(["Fleet Card", "Corporate Credit"].sort((a, b) => compareCardValues(a, b, "asc"))).toEqual(["Corporate Credit", "Fleet Card"]);
    expect(["Fleet Card", "Corporate Credit"].sort((a, b) => compareCardValues(a, b, "desc"))).toEqual(["Fleet Card", "Corporate Credit"]);
  });
  it("sorts credit limits numerically", () => {
    expect([200000, 90000, 100000].sort((a, b) => compareCardValues(a, b, "asc"))).toEqual([90000, 100000, 200000]);
  });
  it.each(["asc", "desc"] as const)("keeps all empty markers last when %s", (direction) => {
    expect(["-", "Unassigned", "", "Somchai"].sort((a, b) => compareCardValues(a, b, direction))).toEqual(["Somchai", "-", "Unassigned", ""]);
  });
  it("sorts Buddhist expiry dates by year then month", () => {
    expect(["01/2573", "12/2572", "02/2572"].sort((a, b) => compareCardValues(expirySortValue(a), expirySortValue(b), "asc"))).toEqual(["02/2572", "12/2572", "01/2573"]);
    expect(expirySortValue("12/29")).toBe(expirySortValue("12/2572"));
  });
});