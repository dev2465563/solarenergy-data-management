import { updateRecordBodySchema } from "../src/validators/record.validator.js";

describe("updateRecordBodySchema", () => {
  it("accepts valid outputs with finite numbers", () => {
    const result = updateRecordBodySchema.safeParse({
      outputs: { INV1: 100, INV2: null },
    });
    expect(result.success).toBe(true);
  });

  it("rejects NaN in outputs", () => {
    const result = updateRecordBodySchema.safeParse({
      outputs: { INV1: NaN },
    });
    expect(result.success).toBe(false);
  });

  it("rejects Infinity in outputs", () => {
    const result = updateRecordBodySchema.safeParse({
      outputs: { INV1: Infinity },
    });
    expect(result.success).toBe(false);
  });

  it("rejects -Infinity in outputs", () => {
    const result = updateRecordBodySchema.safeParse({
      outputs: { INV1: -Infinity },
    });
    expect(result.success).toBe(false);
  });
});
