import { mkdtemp, rm } from "fs/promises";
import path from "path";
import os from "os";
import request from "supertest";
import { createApp } from "../src/app.js";
import { FileRecordRepository } from "../src/repositories/file-record-repository.js";

describe("Backend", () => {
  let tmpDir: string;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "solar-app-"));
    const repo = new FileRecordRepository(tmpDir);
    app = createApp(repo);
  });

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("health check returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("returns 404 and X-Request-ID for unknown route", async () => {
    const res = await request(app).get("/api/unknown");
    expect(res.status).toBe(404);
    expect(res.headers["x-request-id"]).toBeDefined();
    expect(res.body).toMatchObject({
      success: false,
      message: "Route not found",
      code: "NOT_FOUND",
    });
  });
});
