import { updateRecordBodySchema } from "../src/validators/record.validator.js";

describe("updateRecordBodySchema", () => {
  it("accepts valid outputs with finite numbers", () => {
    const result = updateRecordBodySchema.safeParse({
      outputs: { INV1: 100, INV2: null },
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-finite numbers (NaN, Infinity, -Infinity)", () => {
    expect(updateRecordBodySchema.safeParse({ outputs: { INV1: NaN } }).success).toBe(false);
    expect(updateRecordBodySchema.safeParse({ outputs: { INV1: Infinity } }).success).toBe(false);
    expect(updateRecordBodySchema.safeParse({ outputs: { INV1: -Infinity } }).success).toBe(false);
  });
});
