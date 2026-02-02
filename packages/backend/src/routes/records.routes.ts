import { Router } from "express";
import multer from "multer";
import type { IRecordRepository } from "../repositories/types.js";
import { createRecordController } from "../controllers/record.controller.js";
import { uploadRateLimiter } from "../middleware/rate-limit.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export function createRecordsRouter(repo: IRecordRepository): Router {
  const router = Router();
  const controller = createRecordController(repo);

  router.post("/upload", uploadRateLimiter, upload.single("file"), (req, res, next) => {
    controller.uploadRecords(req, res).catch(next);
  });
  router.get("/", (req, res, next) => {
    controller.listRecords(req, res).catch(next);
  });
  router.get("/:id", (req, res, next) => {
    controller.getRecordById(req, res).catch(next);
  });
  router.put("/:id", (req, res, next) => {
    controller.updateRecord(req, res).catch(next);
  });
  router.delete("/:id", (req, res, next) => {
    controller.deleteRecord(req, res).catch(next);
  });

  return router;
}
