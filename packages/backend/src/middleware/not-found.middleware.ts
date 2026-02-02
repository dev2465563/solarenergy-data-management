import type { Request, Response } from "express";
import { sendNotFound } from "../utils/response.helper.js";

export function notFoundMiddleware(_req: Request, res: Response): void {
  sendNotFound(res, "Route not found");
}
