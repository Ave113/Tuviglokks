import { describe, it, expect, vi, afterEach } from "vitest";
import { defaultTransitYear, resolveTransitYear } from "./transitYear";

describe("resolveTransitYear", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("chấp nhận năm hợp lệ từ client", () => {
    expect(resolveTransitYear(2026)).toBe(2026);
    expect(resolveTransitYear("2030")).toBe(2030);
    expect(resolveTransitYear(1900)).toBe(1900);
    expect(resolveTransitYear(2200)).toBe(2200);
  });

  it("không dùng || falsy — 0 và NaN fallback về năm hiện tại", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-06-15T12:00:00Z"));
    expect(resolveTransitYear(0)).toBe(2027);
    expect(resolveTransitYear(NaN)).toBe(2027);
    expect(resolveTransitYear("")).toBe(2027);
    expect(resolveTransitYear(null)).toBe(2027);
    expect(resolveTransitYear(undefined)).toBe(2027);
  });

  it("chặn năm ngoài biên MIN/MAX", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    expect(resolveTransitYear(1899)).toBe(2026);
    expect(resolveTransitYear(2201)).toBe(2026);
    expect(resolveTransitYear(99999)).toBe(2026);
  });

  it("defaultTransitYear trả năm hiện tại", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2028-03-01T00:00:00Z"));
    expect(defaultTransitYear()).toBe(2028);
  });
});