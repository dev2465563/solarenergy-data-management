import csv from "csv-parser";
import { Readable } from "stream";
import type { DeviceOutputs } from "@solar-energy-app/types";
import { validateCsvHeaders } from "@solar-energy-app/types";
import { parseCsvTimestamp } from "./timestamp-parser.js";

/** Inverter range (kW): -10 to 2000. */
const OUTPUT_MIN = -10;
const OUTPUT_MAX = 2000;

/** Row cap to prevent OOM. */
const MAX_ROWS = 1_000_000;

function parseNumber(value: string): number | null {
  const t = value.trim();
  if (t === "") return null;
  const n = Number(t);
  if (Number.isNaN(n) || !Number.isFinite(n)) return null;
  return n;
}

function validateOutput(value: number | null, deviceName: string): string | null {
  if (value === null) return null;
  if (value < OUTPUT_MIN || value > OUTPUT_MAX) {
    return `Output value ${value} for ${deviceName} out of range (${OUTPUT_MIN} to ${OUTPUT_MAX})`;
  }
  return null;
}

export interface ParsedCsvRow {
  timestamp: Date;
  outputs: DeviceOutputs;
}

export type ParseCsvResult =
  | { ok: true; rows: ParsedCsvRow[] }
  | { ok: false; message: string; rowIndex?: number };

/** Header: timestamp required; other cols = device columns. Timestamp: M/D/YYYY H:MM. Empty → null. */
export function parseCsvBuffer(buffer: Buffer): Promise<ParseCsvResult> {
  return new Promise((resolve, reject) => {
    const rows: ParsedCsvRow[] = [];
    let deviceNames: string[] = [];
    let headerChecked = false;
    let rowIndex = 0;

    const stream = Readable.from(buffer);

    stream
      .pipe(csv())
      .on("headers", (headers: string[]) => {
        const result = validateCsvHeaders(headers);
        if (!result.ok) {
          stream.destroy();
          resolve({ ok: false, message: result.message });
          return;
        }
        deviceNames = result.deviceNames;
        headerChecked = true;
      })
      .on("data", (row: Record<string, string>) => {
        if (!headerChecked) return;
        rowIndex++;
        if (rows.length >= MAX_ROWS) {
          stream.destroy();
          resolve({
            ok: false,
            message: `CSV exceeds maximum of ${MAX_ROWS.toLocaleString()} rows`,
            rowIndex,
          });
          return;
        }
        try {
          const tsRaw = row["timestamp"];
          if (tsRaw == null || tsRaw.trim() === "") {
            stream.destroy();
            resolve({ ok: false, message: "Missing timestamp", rowIndex });
            return;
          }
          const timestamp = parseCsvTimestamp(tsRaw);
          const outputs: DeviceOutputs = {};
          for (const h of deviceNames) {
            const val = parseNumber(row[h] ?? "");
            const err = validateOutput(val, h);
            if (err) {
              stream.destroy();
              resolve({ ok: false, message: err, rowIndex });
              return;
            }
            outputs[h] = val;
          }
          rows.push({ timestamp, outputs });
        } catch (err) {
          stream.destroy();
          resolve({
            ok: false,
            message: err instanceof Error ? err.message : "Parse error",
            rowIndex,
          });
        }
      })
      .on("end", () => {
        resolve({ ok: true, rows });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}
