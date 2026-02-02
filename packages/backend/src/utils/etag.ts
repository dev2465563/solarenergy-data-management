import { createHash } from "crypto";
import type { EnergyRecord } from "@solar-energy-app/types";

/** Deterministic for cache validation (If-Match / If-None-Match). */
export function computeRecordETag(record: EnergyRecord): string {
  const payload = JSON.stringify({
    id: record.id,
    timestamp: record.timestamp.toISOString(),
    outputs: sortKeys(record.outputs),
  });
  return createHash("sha256").update(payload).digest("hex");
}

function sortKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) {
    sorted[k] = obj[k];
  }
  return sorted;
}
