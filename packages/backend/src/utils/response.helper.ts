import type { Response } from "express";
import { HttpStatus } from "./http-status.js";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  details?: unknown;
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  status: number = HttpStatus.OK,
  message = "Success"
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.status(status).json(response);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message = "Resource created"
): void {
  sendSuccess(res, data, HttpStatus.CREATED, message);
}

export function sendNoContent(res: Response): void {
  res.status(HttpStatus.NO_CONTENT).end();
}

export function sendError(
  res: Response,
  status: number,
  message: string,
  code?: string,
  details?: unknown
): void {
  const response: ApiResponse = {
    success: false,
    message,
    error: message,
    code,
    details,
  };
  res.status(status).json(response);
}

export function sendBadRequest(
  res: Response,
  message = "Bad Request",
  code = "BAD_REQUEST",
  details?: unknown
): void {
  sendError(res, HttpStatus.BAD_REQUEST, message, code, details);
}

export function sendNotFound(
  res: Response,
  message = "Resource not found",
  code = "NOT_FOUND"
): void {
  sendError(res, HttpStatus.NOT_FOUND, message, code);
}

export function sendConflict(
  res: Response,
  message = "Conflict",
  code = "CONFLICT",
  details?: unknown
): void {
  sendError(res, HttpStatus.CONFLICT, message, code, details);
}

export function sendPreconditionRequired(
  res: Response,
  message = "Precondition Required",
  code = "MISSING_IF_MATCH"
): void {
  sendError(res, HttpStatus.PRECONDITION_REQUIRED, message, code);
}

export function sendServerError(
  res: Response,
  message = "Internal server error",
  code = "INTERNAL_ERROR",
  details?: unknown
): void {
  sendError(res, HttpStatus.INTERNAL_SERVER_ERROR, message, code, details);
}
