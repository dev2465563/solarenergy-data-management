import { readFile, writeFile, mkdir, rename } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { EnergyRecord, DeviceOutputs } from "@solar-energy-app/types";
import type { IRecordRepository, RecordListFilters, RecordListResult, StoredEnergyRecord } from "./types.js";
import { recordsToStored, storedToRecords } from "../utils/date-serializer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.join(__dirname, "..", "..", "data");

function recordsPath(dataDir: string): string {
  return path.join(dataDir, "records.json");
}
function tempPath(dataDir: string): string {
  return path.join(dataDir, "records.json.tmp");
}

/** Exclude null and negative values from total. */
function sumEnergyOutputs(outputs: DeviceOutputs, device?: string): number {
  let total = 0;
  const keys = device ? [device] : Object.keys(outputs);
  for (const k of keys) {
    const v = outputs[k];
    if (typeof v === "number" && v >= 0) total += v;
  }
  return total;
}

function filterRecord(r: EnergyRecord, filters: RecordListFilters): boolean {
  if (r.deletedAt && !filters.includeDeleted) return false;
  const t = r.timestamp.getTime();
  if (filters.start != null && t < filters.start.getTime()) return false;
  if (filters.end != null && t > filters.end.getTime()) return false;
  if (filters.device != null) {
    const v = r.outputs[filters.device];
    if (v == null) return false;
  }
  return true;
}

export class FileRecordRepository implements IRecordRepository {
  private cache: EnergyRecord[] = [];
  private indexById = new Map<string, number>();
  private loaded = false;
  private readonly dataDir: string;

  constructor(dataDir: string = DEFAULT_DATA_DIR) {
    this.dataDir = dataDir;
  }

  private rebuildIndex(): void {
    this.indexById.clear();
    for (let i = 0; i < this.cache.length; i++) {
      this.indexById.set(this.cache[i].id, i);
    }
  }

  private get recordsFile(): string {
    return recordsPath(this.dataDir);
  }

  private get tempFile(): string {
    return tempPath(this.dataDir);
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    await this.reload();
  }

  private async reload(): Promise<void> {
    try {
      const raw = await readFile(this.recordsFile, "utf-8");
      const stored: StoredEnergyRecord[] = JSON.parse(raw);
      this.cache = storedToRecords(stored);
      this.rebuildIndex();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
        this.cache = [];
        this.indexById.clear();
      } else {
        throw err;
      }
    }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    const content = JSON.stringify(recordsToStored(this.cache), null, 2);
    await writeFile(this.tempFile, content, "utf-8");
    await rename(this.tempFile, this.recordsFile);
  }

  async findAll(filters: RecordListFilters): Promise<RecordListResult> {
    await this.ensureLoaded();
    const filtered = this.cache.filter((r) => filterRecord(r, filters));
    const totalEnergy = filtered.reduce(
      (sum, r) => sum + sumEnergyOutputs(r.outputs, filters.device),
      0
    );
    const totalCount = filtered.length;
    const page = filters.page;
    const pageSize = filters.pageSize;

    if (
      page != null &&
      page >= 0 &&
      pageSize != null &&
      pageSize > 0
    ) {
      const skip = page * pageSize;
      const records = filtered.slice(skip, skip + pageSize);
      const pageCount = Math.ceil(totalCount / pageSize);
      return {
        records,
        totalEnergy,
        recordCount: totalCount,
        totalCount,
        pageCount,
        page,
        pageSize,
      };
    }

    return {
      records: filtered,
      totalEnergy,
      recordCount: totalCount,
    };
  }

  async findById(id: string, options?: { includeDeleted?: boolean }): Promise<EnergyRecord | null> {
    await this.ensureLoaded();
    const idx = this.indexById.get(id);
    if (idx == null) return null;
    const r = this.cache[idx];
    if (r.deletedAt && !options?.includeDeleted) return null;
    return r;
  }

  async create(record: EnergyRecord): Promise<EnergyRecord> {
    await this.ensureLoaded();
    const idx = this.cache.length;
    this.cache.push(record);
    this.indexById.set(record.id, idx);
    await this.persist();
    return record;
  }

  async createMany(records: EnergyRecord[]): Promise<void> {
    await this.ensureLoaded();
    for (const r of records) {
      const idx = this.cache.length;
      this.cache.push(r);
      this.indexById.set(r.id, idx);
    }
    await this.persist();
  }

  async replaceAll(records: EnergyRecord[]): Promise<void> {
    await this.ensureLoaded();
    this.cache = [...records];
    this.rebuildIndex();
    await this.persist();
  }

  async update(
    id: string,
    partial: { outputs?: Partial<DeviceOutputs>; correctionReason?: string },
    _version?: string
  ): Promise<EnergyRecord | null> {
    await this.ensureLoaded();
    const idx = this.indexById.get(id);
    if (idx == null) return null;
    const existing = this.cache[idx];
    if (existing.deletedAt) return null;
    const mergedOutputs: DeviceOutputs = { ...existing.outputs };
    for (const [k, v] of Object.entries(partial.outputs ?? {})) {
      if (v !== undefined) mergedOutputs[k] = v;
    }
    const updated: EnergyRecord = {
      ...existing,
      outputs: mergedOutputs,
      correctedAt: new Date(),
      correctionReason: partial.correctionReason,
      originalOutputs: existing.originalOutputs ?? existing.outputs,
    };
    this.cache[idx] = updated;
    await this.persist();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureLoaded();
    const idx = this.indexById.get(id);
    if (idx == null) return false;
    const r = this.cache[idx];
    if (r.deletedAt) return false;
    this.cache[idx] = { ...r, deletedAt: new Date() };
    await this.persist();
    return true;
  }

}
