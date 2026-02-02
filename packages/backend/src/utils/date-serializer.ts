import type { EnergyRecord } from "@solar-energy-app/types";
import type { StoredEnergyRecord } from "../repositories/types.js";

function toISO(d: Date | undefined): string | undefined {
  return d == null ? undefined : d.toISOString();
}

export function recordToStored(r: EnergyRecord): StoredEnergyRecord {
  return {
    ...r,
    timestamp: r.timestamp.toISOString(),
    correctedAt: toISO(r.correctedAt),
    deletedAt: toISO(r.deletedAt),
  };
}

export function storedToRecord(s: StoredEnergyRecord): EnergyRecord {
  return {
    ...s,
    timestamp: new Date(s.timestamp),
    correctedAt: s.correctedAt ? new Date(s.correctedAt) : undefined,
    deletedAt: s.deletedAt ? new Date(s.deletedAt) : undefined,
  } as EnergyRecord;
}

export function recordsToStored(records: EnergyRecord[]): StoredEnergyRecord[] {
  return records.map(recordToStored);
}

export function storedToRecords(stored: StoredEnergyRecord[]): EnergyRecord[] {
  return stored.map(storedToRecord);
}
