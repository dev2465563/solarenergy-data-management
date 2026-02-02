import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { sendError, sendServerError } from "../utils/response.helper.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import type { RequestWithId } from "./request-id.middleware.js";

export function errorMiddleware(
  err: unknown,
  req: RequestWithId,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id ?? "unknown";
  const path = req.path;
  const method = req.method;

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    }));
    logger.warn({ requestId, path, method, details }, "Validation failed");
    sendError(res, 400, "Validation failed", "VALIDATION_ERROR", details);
    return;
  }

  if (err instanceof AppError) {
    logger.warn(
      { requestId, path, method, status: err.status, code: err.code },
      err.message
    );
    sendError(res, err.status, err.message, err.code, err.details);
    return;
  }

  logger.error(
    { requestId, path, method, err: err instanceof Error ? err.stack : err },
    "Unhandled error"
  );
  sendServerError(res);
}
