import { z } from "zod";

export const listRecordsQuerySchema = z.object({
  start: z
    .string()
    .optional()
    .refine(
      (s) => !s || s === "" || !Number.isNaN(new Date(s).getTime()),
      { message: "Invalid start date" }
    ),
  end: z
    .string()
    .optional()
    .refine(
      (s) => !s || s === "" || !Number.isNaN(new Date(s).getTime()),
      { message: "Invalid end date" }
    ),
  device: z.string().optional(),
  includeDeleted: z
    .enum(["true", "false"])
    .optional()
    .transform((s) => s === "true"),
  page: z
    .string()
    .optional()
    .transform((s) => (s === undefined || s === "" ? undefined : Number(s))),
  pageSize: z
    .string()
    .optional()
    .transform((s) => (s === undefined || s === "" ? undefined : Number(s))),
}).refine(
  (data) =>
    (data.page === undefined || (typeof data.page === "number" && Number.isInteger(data.page) && data.page >= 0)) &&
    (data.pageSize === undefined || (typeof data.pageSize === "number" && Number.isInteger(data.pageSize) && data.pageSize > 0 && data.pageSize <= 1000)),
  { message: "page must be non-negative integer; pageSize must be 1–1000", path: ["page"] }
);

const validNumber = z.number().refine(
  (n) => Number.isFinite(n),
  { message: "Value must be a finite number (no NaN or Infinity)" }
);

export const updateRecordBodySchema = z
  .object({
    outputs: z
      .record(z.string(), z.union([validNumber, z.null()]))
      .optional(),
    correctionReason: z.string().optional(),
  })
  .refine(
    (data) =>
      (data.outputs != null && Object.keys(data.outputs).length > 0) ||
      (data.correctionReason != null && data.correctionReason.trim() !== ""),
    { message: "At least one of outputs or correctionReason must be present and non-empty" }
  );

export type ListRecordsQuery = z.infer<typeof listRecordsQuerySchema>;
export type UpdateRecordBody = z.infer<typeof updateRecordBodySchema>;
