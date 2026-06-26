import { describe, expect, it } from "vitest";
import { formatQuantity, parseNumber } from "@/lib/format";

describe("format helpers", () => {
  it("formats whole and fractional quantities", () => {
    expect(formatQuantity(4)).toBe("4");
    expect(formatQuantity("1.500")).toBe("1.5");
    expect(formatQuantity("2.125")).toBe("2.125");
  });

  it("parses numeric form values", () => {
    expect(parseNumber("5")).toBe(5);
    expect(parseNumber("")).toBe(0);
  });
});
