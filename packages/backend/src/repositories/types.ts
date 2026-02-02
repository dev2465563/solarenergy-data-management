import type { EnergyRecord, DeviceOutputs } from "@solar-energy-app/types";

/** Dates as ISO strings for JSON. */
export type StoredEnergyRecord = Omit<
  EnergyRecord,
  "timestamp" | "correctedAt" | "deletedAt"
> & {
  timestamp: string;
  correctedAt?: string;
  deletedAt?: string;
};

export interface RecordListFilters {
  start?: Date;
  end?: Date;
  /** Filter by device; totalEnergy sums only this device. */
  device?: string;
  includeDeleted?: boolean;
  page?: number;
  pageSize?: number;
}

export interface RecordListResult {
  records: EnergyRecord[];
  totalEnergy: number;
  recordCount: number;
  totalCount?: number;
  pageCount?: number;
  page?: number;
  pageSize?: number;
}

export interface IRecordRepository {
  findAll(filters: RecordListFilters): Promise<RecordListResult>;
  findById(id: string, options?: { includeDeleted?: boolean }): Promise<EnergyRecord | null>;
  create(record: EnergyRecord): Promise<EnergyRecord>;
  createMany(records: EnergyRecord[]): Promise<void>;
  replaceAll(records: EnergyRecord[]): Promise<void>;
  update(
    id: string,
    partial: { outputs?: Partial<DeviceOutputs>; correctionReason?: string },
    version?: string
  ): Promise<EnergyRecord | null>;
  delete(id: string): Promise<boolean>;
}
