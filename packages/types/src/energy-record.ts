import { z } from "zod";

/** Device names from CSV (flexible). */
export const DeviceOutputsSchema = z.record(z.string(), z.number().nullable());

export const EnergyRecordSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().pipe(z.coerce.date()),
  outputs: DeviceOutputsSchema,
  correctedAt: z.date().optional(),
  correctionReason: z.string().optional(),
  originalOutputs: DeviceOutputsSchema.optional(),
  deletedAt: z.date().optional(),
});

export type DeviceOutputs = z.infer<typeof DeviceOutputsSchema>;
export type EnergyRecord = z.infer<typeof EnergyRecordSchema>;
