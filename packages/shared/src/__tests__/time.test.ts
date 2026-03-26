import { describe, it, expect } from "vitest";
import { formatTimeAgo } from "../transformers/time.js";

const now = new Date("2024-01-15T12:00:00Z");

describe("formatTimeAgo", () => {
  it("returns 'just now' for < 5 seconds", () => {
    expect(formatTimeAgo("2024-01-15T11:59:57Z", now)).toBe("just now");
  });

  it("returns seconds for < 60 seconds", () => {
    expect(formatTimeAgo("2024-01-15T11:59:30Z", now)).toBe("30s ago");
  });

  it("returns minutes for < 60 minutes", () => {
    expect(formatTimeAgo("2024-01-15T11:45:00Z", now)).toBe("15m ago");
  });

  it("returns hours for < 24 hours", () => {
    expect(formatTimeAgo("2024-01-15T09:00:00Z", now)).toBe("3h ago");
  });

  it("returns days for >= 24 hours", () => {
    expect(formatTimeAgo("2024-01-13T12:00:00Z", now)).toBe("2d ago");
  });

  it("handles future timestamps", () => {
    expect(formatTimeAgo("2024-01-15T13:00:00Z", now)).toBe("just now");
  });

  it("handles exactly 60 seconds", () => {
    expect(formatTimeAgo("2024-01-15T11:59:00Z", now)).toBe("1m ago");
  });
});
