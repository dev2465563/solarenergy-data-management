import { mkdtemp, rm } from "fs/promises";
import path from "path";
import os from "os";
import { FileRecordRepository } from "../src/repositories/file-record-repository.js";
import type { EnergyRecord, DeviceOutputs } from "@solar-energy-app/types";

function makeOutputs(
  overrides: Partial<DeviceOutputs> = {},
  deviceNames?: string[]
): DeviceOutputs {
  const names =
    deviceNames ?? Array.from({ length: 20 }, (_, i) => `INV${i + 1}`);
  const out: DeviceOutputs = {};
  for (const name of names) {
    out[name] = 0;
  }
  return { ...out, ...overrides };
}

function makeRecord(
  id: string,
  timestamp: Date,
  outputs: DeviceOutputs,
  deletedAt?: Date
): EnergyRecord {
  return {
    id,
    timestamp,
    outputs,
    deletedAt,
  };
}

describe("FileRecordRepository", () => {
  let tmpDir: string;
  let repo: FileRecordRepository;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "solar-repo-"));
    repo = new FileRecordRepository(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("persists and loads records", async () => {
    const t = new Date("2019-07-09T00:00:00Z");
    const r = makeRecord("id-1", t, makeOutputs({ INV1: 100 }));
    await repo.create(r);
    const { records } = await repo.findAll({});
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe("id-1");
    expect(records[0].timestamp.toISOString()).toBe(t.toISOString());
    expect(records[0].outputs.INV1).toBe(100);
  });

  it("persists data visible to another repo instance", async () => {
    const t = new Date("2019-07-09T00:00:00Z");
    await repo.create(makeRecord("id-1", t, makeOutputs()));
    const { records } = await repo.findAll({});
    expect(records).toHaveLength(1);
    // Second repo instance reading from same dir should see the data
    const repo2 = new FileRecordRepository(tmpDir);
    const { records: records2 } = await repo2.findAll({});
    expect(records2).toHaveLength(1);
  });

  it("filters by time range", async () => {
    const base = new Date("2019-07-09T00:00:00Z");
    await repo.create(makeRecord("a", base, makeOutputs()));
    await repo.create(makeRecord("b", new Date(base.getTime() + 5 * 60 * 1000), makeOutputs()));
    await repo.create(makeRecord("c", new Date(base.getTime() + 10 * 60 * 1000), makeOutputs()));
    const start = new Date(base.getTime() + 3 * 60 * 1000);
    const end = new Date(base.getTime() + 8 * 60 * 1000);
    const { records } = await repo.findAll({ start, end });
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe("b");
  });

  it("computes total energy: non-null and non-negative only", async () => {
    const t = new Date("2019-07-09T12:00:00Z");
    await repo.create(
      makeRecord("r1", t, makeOutputs({ INV1: 100, INV2: 50, INV3: null, INV4: -1 }))
    );
    const { totalEnergy, recordCount } = await repo.findAll({});
    expect(recordCount).toBe(1);
    // 100 + 50 (null and -1 excluded)
    expect(totalEnergy).toBe(150);
  });

  it("excludes soft-deleted records by default", async () => {
    const t = new Date("2019-07-09T12:00:00Z");
    await repo.create(makeRecord("r1", t, makeOutputs()));
    await repo.create(makeRecord("r2", new Date(t.getTime() + 60000), makeOutputs()));
    await repo.delete("r1");
    const { records } = await repo.findAll({});
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe("r2");
  });

  it("replaceAll overwrites all data", async () => {
    const base = new Date("2019-07-09T00:00:00Z");
    await repo.create(makeRecord("old", base, makeOutputs()));
    const replacement: EnergyRecord[] = [
      makeRecord("a", base, makeOutputs()),
      makeRecord("b", new Date(base.getTime() + 60000), makeOutputs()),
    ];
    await repo.replaceAll(replacement);
    const { records } = await repo.findAll({});
    expect(records).toHaveLength(2);
    expect(records.map((r) => r.id)).toEqual(["a", "b"]);
  });
});
