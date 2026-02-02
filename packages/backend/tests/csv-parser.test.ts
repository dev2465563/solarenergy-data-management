import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { parseCsvBuffer } from "../src/utils/csv-parser.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("parseCsvBuffer", () => {
  const validHeader = "timestamp,INV1,INV2,INV3,INV4,INV5,INV6,INV7,INV8,INV9,INV10,INV11,INV12,INV13,INV14,INV15,INV16,INV17,INV18,INV19,INV20\n";

  it("validates headers and parses one row", async () => {
    const csv = validHeader + "7/9/2019 0:00,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n";
    const result = await parseCsvBuffer(Buffer.from(csv, "utf-8"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].timestamp.getFullYear()).toBe(2019);
      expect(result.rows[0].timestamp.getMonth()).toBe(6);
      expect(result.rows[0].outputs.INV1).toBe(0);
    }
  });

  it("accepts timestamp + one device column (flexible device names)", async () => {
    const csv = "timestamp,MyDevice\n7/9/2019 0:00,42\n";
    const result = await parseCsvBuffer(Buffer.from(csv, "utf-8"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].outputs.MyDevice).toBe(42);
    }
  });

  it("rejects when timestamp column is missing", async () => {
    const csv = "date,INV1\n7/9/2019 0:00,0\n";
    const result = await parseCsvBuffer(Buffer.from(csv, "utf-8"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/timestamp/);
    }
  });

  it("rejects when no device columns", async () => {
    const csv = "timestamp\n7/9/2019 0:00\n";
    const result = await parseCsvBuffer(Buffer.from(csv, "utf-8"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/device/);
    }
  });

  it("parses empty cells as null", async () => {
    const csv = validHeader + "7/9/2019 6:00,5,0,5,5,6,6,6,6,5,6,5,4,5,6,6,6,,5,5,7\n";
    const result = await parseCsvBuffer(Buffer.from(csv, "utf-8"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0].outputs.INV17).toBeNull();
      expect(result.rows[0].outputs.INV1).toBe(5);
    }
  });

  it("parses negative values within range", async () => {
    const csv = validHeader + "7/9/2019 0:25,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1\n";
    const result = await parseCsvBuffer(Buffer.from(csv, "utf-8"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0].outputs.INV20).toBe(-1);
    }
  });

  it("rejects values outside range (-10 to 2000)", async () => {
    const above = await parseCsvBuffer(Buffer.from("timestamp,INV1\n7/9/2019 0:00,3000\n", "utf-8"));
    const below = await parseCsvBuffer(Buffer.from("timestamp,INV1\n7/9/2019 0:00,-11\n", "utf-8"));
    expect(above.ok).toBe(false);
    expect(below.ok).toBe(false);
    if (!above.ok) expect(above.message).toMatch(/out of range/);
    if (!below.ok) expect(below.message).toMatch(/out of range/);
  });

  it("accepts duplicate timestamps (creates multiple rows)", async () => {
    const csv = "timestamp,INV1\n7/9/2019 0:00,10\n7/9/2019 0:00,20\n";
    const result = await parseCsvBuffer(Buffer.from(csv, "utf-8"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].outputs.INV1).toBe(10);
      expect(result.rows[1].outputs.INV1).toBe(20);
    }
  });

  it("parses SampleData.csv (288 rows)", async () => {
    const samplePath = path.join(__dirname, "..", "..", "..", "SampleData.csv");
    const buffer = await readFile(samplePath);
    const result = await parseCsvBuffer(buffer);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(288);
      expect(result.rows[0].timestamp.getMonth()).toBe(6); // July
      expect(result.rows[0].timestamp.getDate()).toBe(9);
    }
  });
});
