import type { EnergyRecord } from "@solar-energy-app/types";

/** Dates as ISO strings for JSON. */
export type SerializedRecord = Omit<
  EnergyRecord,
  "timestamp" | "correctedAt" | "deletedAt"
> & {
  timestamp: string;
  correctedAt?: string;
  deletedAt?: string;
};

export function serializeRecord(record: EnergyRecord): SerializedRecord {
  return {
    ...record,
    timestamp: record.timestamp.toISOString(),
    correctedAt: record.correctedAt?.toISOString(),
    deletedAt: record.deletedAt?.toISOString(),
  };
}

export function serializeRecords(records: EnergyRecord[]): SerializedRecord[] {
  return records.map(serializeRecord);
}
