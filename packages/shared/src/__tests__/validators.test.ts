import { describe, it, expect } from "vitest";
import { dateRangeSchema } from "../validators/query.js";

describe("dateRangeSchema", () => {
  it("validates a correct date range", () => {
    const result = dateRangeSchema.safeParse({
      from: "2024-01-01T00:00:00Z",
      to: "2024-01-31T23:59:59Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.granularity).toBe("day");
    }
  });

  it("accepts explicit granularity", () => {
    const result = dateRangeSchema.safeParse({
      from: "2024-01-01T00:00:00Z",
      to: "2024-01-31T23:59:59Z",
      granularity: "week",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.granularity).toBe("week");
    }
  });

  it("rejects invalid from date", () => {
    const result = dateRangeSchema.safeParse({
      from: "not-a-date",
      to: "2024-01-31T23:59:59Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid granularity", () => {
    const result = dateRangeSchema.safeParse({
      from: "2024-01-01T00:00:00Z",
      to: "2024-01-31T23:59:59Z",
      granularity: "yearly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing from", () => {
    const result = dateRangeSchema.safeParse({
      to: "2024-01-31T23:59:59Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing to", () => {
    const result = dateRangeSchema.safeParse({
      from: "2024-01-01T00:00:00Z",
    });
    expect(result.success).toBe(false);
  });
});
