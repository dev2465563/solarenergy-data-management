import { mkdtemp, rm } from "fs/promises";
import path from "path";
import os from "os";
import request from "supertest";
import { createApp } from "../src/app.js";
import { FileRecordRepository } from "../src/repositories/file-record-repository.js";

const validCsv =
  "timestamp,INV1,INV2\n" +
  "1/1/2024 0:00,10,20\n" +
  "1/1/2024 0:05,30,40\n";

describe("Records API", () => {
  let tmpDir: string;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "solar-api-"));
    const repo = new FileRecordRepository(tmpDir);
    app = createApp(repo);
  });

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe("POST /api/records/upload", () => {
    it("returns 201 and count when CSV is valid", async () => {
      const res = await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        success: true,
        data: { count: 2 },
        message: "Data replaced successfully",
      });
    });

    it("returns 400 when no file", async () => {
      const res = await request(app).post("/api/records/upload");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("MISSING_FILE");
    });

    it("returns 400 when CSV is invalid (missing timestamp)", async () => {
      const badCsv = "date,INV1\n2024-01-01,1\n";
      const res = await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(badCsv), "bad.csv");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe("INVALID_CSV");
    });
  });

  describe("GET /api/records", () => {
    it("returns 200 with records and summary after upload", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const res = await request(app).get("/api/records");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records).toHaveLength(2);
      expect(res.body.data.totalEnergy).toBe(10 + 20 + 30 + 40);
      expect(res.body.data.recordCount).toBe(2);
    });

    it("returns 400 for invalid start date", async () => {
      const res = await request(app).get("/api/records?start=not-a-date");
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("INVALID_QUERY");
    });

    it("returns paginated results when page and pageSize provided", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const res = await request(app).get("/api/records?page=0&pageSize=1");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.records).toHaveLength(1);
      expect(res.body.data.recordCount).toBe(2);
      const res2 = await request(app).get("/api/records?page=1&pageSize=1");
      expect(res2.status).toBe(200);
      expect(res2.body.data.records).toHaveLength(1);
      expect(res2.body.data.recordCount).toBe(2);
    });

    it("filters by start and end date", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const allRes = await request(app).get("/api/records");
      expect(allRes.body.data.records).toHaveLength(2);
      const res = await request(app).get(
        "/api/records?start=2023-01-01T00:00:00.000Z&end=2024-06-01T00:00:00.000Z"
      );
      expect(res.status).toBe(200);
      expect(res.body.data.records.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.records.length).toBeLessThanOrEqual(2);
      const futureRes = await request(app).get(
        "/api/records?start=2030-01-01T00:00:00.000Z"
      );
      expect(futureRes.status).toBe(200);
      expect(futureRes.body.data.records).toHaveLength(0);
    });

    it("filters by device", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const res = await request(app).get("/api/records?device=INV1");
      expect(res.status).toBe(200);
      expect(res.body.data.records).toHaveLength(2);
      expect(res.body.data.totalEnergy).toBe(10 + 30);
    });

    it("returns empty when filtering by non-existent device", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const res = await request(app).get("/api/records?device=INV99");
      expect(res.status).toBe(200);
      expect(res.body.data.records).toHaveLength(0);
      expect(res.body.data.totalEnergy).toBe(0);
    });

    it("returns empty page when page index exceeds data", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const res = await request(app).get("/api/records?page=10&pageSize=5");
      expect(res.status).toBe(200);
      expect(res.body.data.records).toHaveLength(0);
      expect(res.body.data.recordCount).toBe(2);
    });
  });

  describe("GET /api/records/:id", () => {
    it("returns 200 with record and ETag when found", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const listRes = await request(app).get("/api/records");
      const id = listRes.body.data.records[0].id;
      const res = await request(app).get(`/api/records/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(id);
      expect(res.headers.etag).toBeDefined();
      expect(res.body.data.version).toBeDefined();
    });

    it("returns 404 for unknown id", async () => {
      const res = await request(app).get(
        "/api/records/00000000-0000-0000-0000-000000000000"
      );
      expect(res.status).toBe(404);
      expect(res.body.code).toBe("NOT_FOUND");
    });

    it("returns 404 for soft-deleted record by default, 200 with includeDeleted=true", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const listRes = await request(app).get("/api/records");
      const id = listRes.body.data.records[0].id;
      await request(app).delete(`/api/records/${id}`);
      const resNormal = await request(app).get(`/api/records/${id}`);
      expect(resNormal.status).toBe(404);
      const resIncluded = await request(app).get(
        `/api/records/${id}?includeDeleted=true`
      );
      expect(resIncluded.status).toBe(200);
      expect(resIncluded.body.data.deletedAt).toBeDefined();
    });
  });

  describe("PUT /api/records/:id", () => {
    it("returns 428 when If-Match is missing", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const listRes = await request(app).get("/api/records");
      const id = listRes.body.data.records[0].id;
      const res = await request(app)
        .put(`/api/records/${id}`)
        .send({ outputs: { INV1: 99 } });
      expect(res.status).toBe(428);
      expect(res.body.code).toBe("MISSING_IF_MATCH");
    });

    it("returns 200 and updated record when If-Match matches", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const listRes = await request(app).get("/api/records");
      const id = listRes.body.data.records[0].id;
      const getRes = await request(app).get(`/api/records/${id}`);
      const etag = getRes.headers.etag;
      const res = await request(app)
        .put(`/api/records/${id}`)
        .set("If-Match", etag)
        .send({ outputs: { INV1: 99 } });
      expect(res.status).toBe(200);
      expect(res.body.data.outputs.INV1).toBe(99);
      expect(res.headers.etag).toBeDefined();
    });

    it("returns 409 when If-Match does not match (concurrent modification)", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const listRes = await request(app).get("/api/records");
      const id = listRes.body.data.records[0].id;
      const res = await request(app)
        .put(`/api/records/${id}`)
        .set("If-Match", '"wrong-etag"')
        .send({ outputs: { INV1: 99 } });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CONCURRENT_MODIFICATION");
    });

    it("returns 400 when outputs contain Infinity (invalid finite number)", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const listRes = await request(app).get("/api/records");
      const id = listRes.body.data.records[0].id;
      const getRes = await request(app).get(`/api/records/${id}`);
      const etag = getRes.headers.etag;
      // 1e400 parses to Infinity in JSON; schema rejects non-finite numbers
      const res = await request(app)
        .put(`/api/records/${id}`)
        .set("If-Match", etag)
        .set("Content-Type", "application/json")
        .send('{"outputs":{"INV1":1e400}}');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 when updating with correctionReason only (no outputs)", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const listRes = await request(app).get("/api/records");
      const id = listRes.body.data.records[0].id;
      const getRes = await request(app).get(`/api/records/${id}`);
      const etag = getRes.headers.etag;
      const res = await request(app)
        .put(`/api/records/${id}`)
        .set("If-Match", etag)
        .send({ correctionReason: "Field calibration" });
      expect(res.status).toBe(200);
      expect(res.body.data.correctionReason).toBe("Field calibration");
    });

    it("returns 200 when setting output to null (clear value)", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const listRes = await request(app).get("/api/records");
      const id = listRes.body.data.records[0].id;
      const getRes = await request(app).get(`/api/records/${id}`);
      const etag = getRes.headers.etag;
      const res = await request(app)
        .put(`/api/records/${id}`)
        .set("If-Match", etag)
        .send({ outputs: { INV1: null } });
      expect(res.status).toBe(200);
      expect(res.body.data.outputs.INV1).toBeNull();
    });

    it("returns 400 when body has neither outputs nor correctionReason", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const listRes = await request(app).get("/api/records");
      const id = listRes.body.data.records[0].id;
      const getRes = await request(app).get(`/api/records/${id}`);
      const etag = getRes.headers.etag;
      const res = await request(app)
        .put(`/api/records/${id}`)
        .set("If-Match", etag)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("DELETE /api/records/:id", () => {
    it("returns 204 when record exists", async () => {
      await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(validCsv), "data.csv");
      const listRes = await request(app).get("/api/records");
      const id = listRes.body.data.records[0].id;
      const res = await request(app).delete(`/api/records/${id}`);
      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it("returns 404 for unknown id", async () => {
      const res = await request(app).delete(
        "/api/records/00000000-0000-0000-0000-000000000000"
      );
      expect(res.status).toBe(404);
    });
  });
});
