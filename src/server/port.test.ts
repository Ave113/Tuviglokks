import { describe, it, expect, vi, afterEach } from "vitest";
import { DEFAULT_SERVER_PORT, resolveServerPort } from "./port";

describe("resolveServerPort", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("trả về fallback khi PORT không set", () => {
    expect(resolveServerPort(undefined)).toBe(DEFAULT_SERVER_PORT);
    expect(resolveServerPort("")).toBe(DEFAULT_SERVER_PORT);
    expect(resolveServerPort("   ")).toBe(DEFAULT_SERVER_PORT);
  });

  it("đọc PORT hợp lệ từ môi trường PaaS", () => {
    expect(resolveServerPort("8080")).toBe(8080);
    expect(resolveServerPort("443")).toBe(443);
    expect(resolveServerPort("65535")).toBe(65535);
  });

  it("giữ default 3000 cho dev local khi không có PORT", () => {
    expect(resolveServerPort(undefined, 3000)).toBe(3000);
  });

  it("fallback khi PORT không phải số nguyên hợp lệ", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(resolveServerPort("abc", 3000)).toBe(3000);
    expect(resolveServerPort("3000.5", 3000)).toBe(3000);
    expect(resolveServerPort("0", 3000)).toBe(3000);
    expect(resolveServerPort("-1", 3000)).toBe(3000);
    expect(resolveServerPort("70000", 3000)).toBe(3000);
    expect(warn).toHaveBeenCalled();
  });
});