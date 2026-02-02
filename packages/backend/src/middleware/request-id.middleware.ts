import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export interface RequestWithId extends Request {
  id?: string;
}

export function requestIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction
): void {
  req.id = randomUUID();
  res.setHeader("X-Request-ID", req.id);
  next();
}
