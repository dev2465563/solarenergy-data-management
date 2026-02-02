import { mkdtemp, rm } from "fs/promises";
import path from "path";
import os from "os";
import { FileRecordRepository } from "../src/repositories/file-record-repository.js";
import { uploadCsv } from "../src/services/upload-service.js";

const validCsv =
  "timestamp,INV1,INV2,INV3,INV4,INV5,INV6,INV7,INV8,INV9,INV10,INV11,INV12,INV13,INV14,INV15,INV16,INV17,INV18,INV19,INV20\n" +
  "7/9/2019 0:00,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n" +
  "7/9/2019 0:05,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0\n";

describe("uploadCsv", () => {
  let tmpDir: string;
  let repo: FileRecordRepository;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "solar-upload-"));
    repo = new FileRecordRepository(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("replaces all data with parsed records", async () => {
    const result = await uploadCsv(Buffer.from(validCsv, "utf-8"), repo);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.count).toBe(2);
    }
    const { records } = await repo.findAll({});
    expect(records).toHaveLength(2);
  });

  it("second upload replaces all data (replace-all semantics)", async () => {
    await uploadCsv(Buffer.from(validCsv, "utf-8"), repo);
    const smallCsv = "timestamp,INV1\n7/9/2019 0:00,100\n";
    const result = await uploadCsv(Buffer.from(smallCsv, "utf-8"), repo);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.count).toBe(1);
    }
    const { records } = await repo.findAll({});
    expect(records).toHaveLength(1);
    expect(records[0].outputs.INV1).toBe(100);
  });
});
