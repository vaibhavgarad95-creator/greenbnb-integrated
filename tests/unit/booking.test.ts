import { describe, expect, it } from "vitest";
import { nightsBetween, parseDateOnly } from "@/lib/booking/dates";
import { calculateTotal } from "@/lib/booking/pricing";

describe("dates", () => {
  it("rejects malformed and impossible dates", () => {
    expect(parseDateOnly("2026-02-30")).toBeNull();
    expect(parseDateOnly("26-1-1")).toBeNull();
    expect(parseDateOnly("2026-03-01")).not.toBeNull();
  });
  it("counts nights with check-out exclusive", () => {
    expect(nightsBetween(parseDateOnly("2026-03-01")!, parseDateOnly("2026-03-04")!)).toBe(3);
  });
  it("is stable across DST boundaries (UTC)", () => {
    expect(nightsBetween(parseDateOnly("2026-03-28")!, parseDateOnly("2026-03-30")!)).toBe(2);
  });
});

describe("pricing", () => {
  it("is decimal-safe", () => {
    expect(calculateTotal("0.10", 3).toString()).toBe("0.3");
    expect(calculateTotal("89.99", 3).toString()).toBe("269.97");
  });
  it("rejects invalid nights", () => {
    expect(() => calculateTotal("10", 0)).toThrow();
  });
});
