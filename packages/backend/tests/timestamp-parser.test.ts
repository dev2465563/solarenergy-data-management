import { parseCsvTimestamp } from "../src/utils/timestamp-parser.js";

describe("parseCsvTimestamp", () => {
  it("parses M/D/YYYY H:MM", () => {
    const d = parseCsvTimestamp("7/9/2019 0:00");
    expect(d.getFullYear()).toBe(2019);
    expect(d.getMonth()).toBe(6); // July
    expect(d.getDate()).toBe(9);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it("parses single-digit hour and minute", () => {
    const d = parseCsvTimestamp("7/9/2019 9:05");
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(5);
  });

  it("throws on invalid date", () => {
    expect(() => parseCsvTimestamp("not-a-date")).toThrow("Invalid timestamp");
  });
});
