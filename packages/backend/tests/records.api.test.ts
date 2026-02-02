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

const SAMPLE_CSV = Buffer.from(validCsv, "utf-8");
const SAMPLE_FILENAME = "data.csv";
const TOTAL_ENERGY = 10 + 20 + 30 + 40;
const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";

describe("Records API", () => {
  let tmpDir: string;
  let app: ReturnType<typeof createApp>;
  let ids: string[];
  let etag: string;

  beforeAll(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "solar-api-"));
    const repo = new FileRecordRepository(tmpDir);
    app = createApp(repo);
  });

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  async function uploadAndGetIds(): Promise<string[]> {
    await request(app)
      .post("/api/records/upload")
      .attach("file", SAMPLE_CSV, SAMPLE_FILENAME);
    const list = await request(app).get("/api/records");
    return list.body.data.records.map((r: { id: string }) => r.id);
  }

  async function getEtagFor(id: string): Promise<string> {
    const res = await request(app).get(`/api/records/${id}`);
    return res.headers.etag;
  }

  describe("POST /api/records/upload", () => {
    it("returns 201 and count when CSV is valid", async () => {
      const res = await request(app)
        .post("/api/records/upload")
        .attach("file", SAMPLE_CSV, SAMPLE_FILENAME);
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
      expect(res.body).toMatchObject({ success: false, code: "MISSING_FILE" });
    });

    it("returns 400 when CSV is invalid (missing timestamp)", async () => {
      const badCsv = "date,INV1\n2024-01-01,1\n";
      const res = await request(app)
        .post("/api/records/upload")
        .attach("file", Buffer.from(badCsv), "bad.csv");
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ success: false, code: "INVALID_CSV" });
    });
  });

  describe("GET /api/records", () => {
    beforeAll(async () => {
      ids = await uploadAndGetIds();
    });

    it("returns 200 with records and summary", async () => {
      const res = await request(app).get("/api/records");
      expect(res.status).toBe(200);
      expect(res.body.data.records).toHaveLength(2);
      expect(res.body.data.totalEnergy).toBe(TOTAL_ENERGY);
      expect(res.body.data.recordCount).toBe(2);
    });

    it("returns 400 for invalid start date", async () => {
      const res = await request(app).get("/api/records?start=not-a-date");
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ code: "INVALID_QUERY" });
    });

    it("returns paginated results when page and pageSize provided", async () => {
      const res = await request(app).get("/api/records?page=0&pageSize=1");
      expect(res.status).toBe(200);
      expect(res.body.data.records).toHaveLength(1);
      expect(res.body.data.recordCount).toBe(2);
      const res2 = await request(app).get("/api/records?page=1&pageSize=1");
      expect(res2.status).toBe(200);
      expect(res2.body.data.records).toHaveLength(1);
    });

    it("filters by start and end date", async () => {
      const res = await request(app).get(
        "/api/records?start=2023-01-01T00:00:00.000Z&end=2024-06-01T00:00:00.000Z"
      );
      expect(res.status).toBe(200);
      expect(res.body.data.records).toHaveLength(2);
      const futureRes = await request(app).get(
        "/api/records?start=2030-01-01T00:00:00.000Z"
      );
      expect(futureRes.status).toBe(200);
      expect(futureRes.body.data.records).toHaveLength(0);
    });

    it("filters by device", async () => {
      const res = await request(app).get("/api/records?device=INV1");
      expect(res.status).toBe(200);
      expect(res.body.data.records).toHaveLength(2);
      expect(res.body.data.totalEnergy).toBe(10 + 30);
    });

    it("returns empty when filtering by non-existent device", async () => {
      const res = await request(app).get("/api/records?device=INV99");
      expect(res.status).toBe(200);
      expect(res.body.data.records).toHaveLength(0);
      expect(res.body.data.totalEnergy).toBe(0);
    });

    it("returns empty page when page index exceeds data", async () => {
      const res = await request(app).get("/api/records?page=10&pageSize=5");
      expect(res.status).toBe(200);
      expect(res.body.data.records).toHaveLength(0);
      expect(res.body.data.recordCount).toBe(2);
    });
  });

  describe("GET /api/records/:id", () => {
    beforeAll(async () => {
      ids = await uploadAndGetIds();
    });

    it("returns 200 with record and ETag when found", async () => {
      const res = await request(app).get(`/api/records/${ids[0]}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ id: ids[0] });
      expect(res.headers.etag).toBeDefined();
      expect(res.body.data.version).toBeDefined();
    });

    it("returns 404 for unknown id", async () => {
      const res = await request(app).get(`/api/records/${UNKNOWN_ID}`);
      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ code: "NOT_FOUND" });
    });

    it("returns 404 for soft-deleted by default, 200 with includeDeleted=true", async () => {
      await request(app).delete(`/api/records/${ids[0]}`);
      const resNormal = await request(app).get(`/api/records/${ids[0]}`);
      expect(resNormal.status).toBe(404);
      const resIncluded = await request(app).get(
        `/api/records/${ids[0]}?includeDeleted=true`
      );
      expect(resIncluded.status).toBe(200);
      expect(resIncluded.body.data.deletedAt).toBeDefined();
    });
  });

  describe("PUT /api/records/:id", () => {
    beforeAll(async () => {
      ids = await uploadAndGetIds();
      etag = await getEtagFor(ids[0]);
    });

    it("returns 428 when If-Match is missing", async () => {
      const res = await request(app)
        .put(`/api/records/${ids[0]}`)
        .send({ outputs: { INV1: 99 } });
      expect(res.status).toBe(428);
      expect(res.body).toMatchObject({ code: "MISSING_IF_MATCH" });
    });

    it("returns 200 and updated record when If-Match matches", async () => {
      const res = await request(app)
        .put(`/api/records/${ids[0]}`)
        .set("If-Match", etag)
        .send({ outputs: { INV1: 99 } });
      expect(res.status).toBe(200);
      expect(res.body.data.outputs.INV1).toBe(99);
    });

    it("returns 409 when If-Match does not match", async () => {
      const res = await request(app)
        .put(`/api/records/${ids[0]}`)
        .set("If-Match", '"wrong-etag"')
        .send({ outputs: { INV1: 99 } });
      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({ code: "CONCURRENT_MODIFICATION" });
    });

    it("returns 400 when outputs contain Infinity", async () => {
      const freshEtag = await getEtagFor(ids[0]);
      const res = await request(app)
        .put(`/api/records/${ids[0]}`)
        .set("If-Match", freshEtag)
        .set("Content-Type", "application/json")
        .send('{"outputs":{"INV1":1e400}}');
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ code: "VALIDATION_ERROR" });
    });

    it("returns 200 when updating with correctionReason only", async () => {
      const freshEtag = await getEtagFor(ids[0]);
      const res = await request(app)
        .put(`/api/records/${ids[0]}`)
        .set("If-Match", freshEtag)
        .send({ correctionReason: "Field calibration" });
      expect(res.status).toBe(200);
      expect(res.body.data.correctionReason).toBe("Field calibration");
    });

    it("returns 200 when setting output to null", async () => {
      const freshEtag = await getEtagFor(ids[0]);
      const res = await request(app)
        .put(`/api/records/${ids[0]}`)
        .set("If-Match", freshEtag)
        .send({ outputs: { INV1: null } });
      expect(res.status).toBe(200);
      expect(res.body.data.outputs.INV1).toBeNull();
    });

    it("returns 400 when body has neither outputs nor correctionReason", async () => {
      const freshEtag = await getEtagFor(ids[0]);
      const res = await request(app)
        .put(`/api/records/${ids[0]}`)
        .set("If-Match", freshEtag)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ code: "VALIDATION_ERROR" });
    });
  });

  describe("DELETE /api/records/:id", () => {
    beforeAll(async () => {
      ids = await uploadAndGetIds();
    });

    it("returns 204 when record exists", async () => {
      const res = await request(app).delete(`/api/records/${ids[0]}`);
      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it("returns 404 for unknown id", async () => {
      const res = await request(app).delete(`/api/records/${UNKNOWN_ID}`);
      expect(res.status).toBe(404);
    });
  });
});
