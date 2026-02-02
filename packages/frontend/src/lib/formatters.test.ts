import { describe, it, expect } from "vitest";
import { formatDate, formatEnergy } from "./formatters.js";

describe("formatDate", () => {
  it("formats Date object", () => {
    const d = new Date("2024-01-15T14:30:00Z");
    expect(formatDate(d)).toMatch(/Jan/);
    expect(formatDate(d)).toMatch(/15/);
    expect(formatDate(d)).toMatch(/2024/);
  });

  it("formats ISO string", () => {
    const s = "2024-07-09T12:00:00Z";
    expect(formatDate(s)).toMatch(/Jul|July/);
    expect(formatDate(s)).toMatch(/9/);
  });
});

describe("formatEnergy", () => {
  it("returns em dash for null or undefined", () => {
    expect(formatEnergy(null)).toBe("—");
    expect(formatEnergy(undefined)).toBe("—");
  });

  it("formats number with locale", () => {
    expect(formatEnergy(0)).toBe("0");
    expect(formatEnergy(100)).toBe("100");
    expect(formatEnergy(1234.5)).toMatch(/1,?234/);
  });

  it("limits to one decimal place", () => {
    expect(formatEnergy(10.123)).toMatch(/10\.1/);
  });
});
