import type { Request, Response } from "express";
import type { IRecordRepository, RecordListFilters } from "../repositories/types.js";
import { uploadCsv } from "../services/upload-service.js";
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendBadRequest,
  sendNotFound,
  sendConflict,
  sendPreconditionRequired,
} from "../utils/response.helper.js";
import { computeRecordETag } from "../utils/etag.js";
import { serializeRecord, serializeRecords } from "../utils/record-serializer.js";
import { AppError } from "../utils/errors.js";
import {
  listRecordsQuerySchema,
  updateRecordBodySchema,
  type ListRecordsQuery,
  type UpdateRecordBody,
} from "../validators/record.validator.js";

const CSV_MIMETYPES = ["text/csv", "application/csv", "text/plain"];
const CSV_EXTENSION = ".csv";

function isCsvFile(mimetype: string, originalname: string): boolean {
  const mt = mimetype?.toLowerCase();
  const ext = originalname?.toLowerCase().slice(-4);
  return CSV_MIMETYPES.includes(mt) || ext === CSV_EXTENSION;
}

export function createRecordController(repo: IRecordRepository) {
  async function uploadRecords(req: Request, res: Response): Promise<void> {
    const file = req.file;
    if (!file || !file.buffer) {
      sendBadRequest(res, "No file uploaded", "MISSING_FILE", {
        hint: "Use multipart field 'file' with a CSV file",
      });
      return;
    }
    if (!isCsvFile(file.mimetype, file.originalname)) {
      sendBadRequest(res, "Invalid file type; expected CSV", "INVALID_FILE_TYPE", {
        mimetype: file.mimetype,
        originalname: file.originalname,
      });
      return;
    }
    const result = await uploadCsv(file.buffer, repo);
    if (!result.success) {
      sendBadRequest(res, result.message, "INVALID_CSV", { message: result.message });
      return;
    }
    sendCreated(res, { count: result.count }, "Data replaced successfully");
  }

  async function listRecords(req: Request, res: Response): Promise<void> {
    const parsed = listRecordsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendBadRequest(res, "Invalid query parameters", "INVALID_QUERY", parsed.error.errors);
      return;
    }
    const q: ListRecordsQuery = parsed.data;
    const filters: RecordListFilters = {
      start: q.start ? new Date(q.start) : undefined,
      end: q.end ? new Date(q.end) : undefined,
      device: q.device,
      includeDeleted: q.includeDeleted ?? false,
      page: q.page,
      pageSize: q.pageSize,
    };
    const result = await repo.findAll(filters);
    const data = {
      records: serializeRecords(result.records),
      totalEnergy: result.totalEnergy,
      recordCount: result.recordCount,
    };
    sendSuccess(res, data);
  }

  async function getRecordById(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const includeDeleted = req.query.includeDeleted === "true";
    const record = await repo.findById(id, { includeDeleted });
    if (!record) {
      sendNotFound(res, "Record not found");
      return;
    }
    const etag = computeRecordETag(record);
    res.setHeader("ETag", `"${etag}"`);
    sendSuccess(res, { ...serializeRecord(record), version: etag });
  }

  async function updateRecord(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const ifMatch = req.headers["if-match"];
    if (!ifMatch || (Array.isArray(ifMatch) ? ifMatch[0] : ifMatch).trim() === "") {
      sendPreconditionRequired(
        res,
        "If-Match header required for update (use ETag from GET)"
      );
      return;
    }
    const rawMatch = Array.isArray(ifMatch) ? ifMatch[0] : ifMatch;
    const expectedEtag = rawMatch.replace(/^"|"$/g, "");

    const parsed = updateRecordBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendBadRequest(res, "Invalid body", "VALIDATION_ERROR", parsed.error.errors);
      return;
    }
    const body: UpdateRecordBody = parsed.data;

    const existing = await repo.findById(id);
    if (!existing) {
      sendNotFound(res, "Record not found");
      return;
    }
    if (existing.deletedAt) {
      sendNotFound(res, "Record not found");
      return;
    }
    const currentEtag = computeRecordETag(existing);
    if (currentEtag !== expectedEtag) {
      sendConflict(
        res,
        "Record was modified; refresh and try again",
        "CONCURRENT_MODIFICATION",
        { expectedVersion: expectedEtag }
      );
      return;
    }

    const updated = await repo.update(id, {
      outputs: body.outputs,
      correctionReason: body.correctionReason,
    });
    if (!updated) {
      sendNotFound(res, "Record not found");
      return;
    }
    const etag = computeRecordETag(updated);
    res.setHeader("ETag", `"${etag}"`);
    sendSuccess(res, { ...serializeRecord(updated), version: etag });
  }

  async function deleteRecord(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const found = await repo.findById(id);
    if (!found) {
      sendNotFound(res, "Record not found");
      return;
    }
    if (found.deletedAt) {
      sendNotFound(res, "Record not found");
      return;
    }
    const ok = await repo.delete(id);
    if (!ok) {
      sendNotFound(res, "Record not found");
      return;
    }
    sendNoContent(res);
  }

  return {
    uploadRecords,
    listRecords,
    getRecordById,
    updateRecord,
    deleteRecord,
  };
}
