import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import type { IRecordRepository } from "./repositories/types.js";
import { requestIdMiddleware } from "./middleware/request-id.middleware.js";
import { apiRateLimiter } from "./middleware/rate-limit.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { createRecordsRouter } from "./routes/records.routes.js";

export function createApp(
  repo: IRecordRepository,
  options?: { staticDir?: string }
): express.Express {
  const app = express();

  const corsOrigin = process.env.CORS_ORIGIN ?? process.env.FRONTEND_ORIGIN ?? "*";
  app.use(helmet());
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());
  app.use(requestIdMiddleware);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/records", apiRateLimiter, createRecordsRouter(repo));

  if (options?.staticDir) {
    app.use(express.static(options.staticDir));
    app.get("*", (_req, res) =>
      res.sendFile("index.html", { root: options!.staticDir })
    );
  } else {
    app.use(notFoundMiddleware);
  }
  app.use(errorMiddleware);

  return app;
}
