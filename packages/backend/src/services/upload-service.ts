import { v4 as uuidv4 } from "uuid";
import type { EnergyRecord } from "@solar-energy-app/types";
import type { IRecordRepository } from "../repositories/types.js";
import { parseCsvBuffer, type ParsedCsvRow } from "../utils/csv-parser.js";

export type UploadResult =
  | { success: true; count: number }
  | { success: false; message: string };

/** Upload replaces all existing data. */
export async function uploadCsv(
  buffer: Buffer,
  repository: IRecordRepository
): Promise<UploadResult> {
  const parseResult = await parseCsvBuffer(buffer);
  if (!parseResult.ok) {
    return { success: false, message: parseResult.message };
  }

  const records: EnergyRecord[] = parseResult.rows.map((row: ParsedCsvRow) => ({
    id: uuidv4(),
    timestamp: row.timestamp,
    outputs: row.outputs,
  }));

  await repository.replaceAll(records);
  return { success: true, count: records.length };
}
