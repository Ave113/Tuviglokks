import { describe, it, expect } from "vitest";
import {
  resolveApiKey,
  isServerKeyAllowed,
  describeServerKeyPolicy,
  API_KEY_MISSING_MESSAGE,
} from "./chartGuards";

describe("isServerKeyAllowed", () => {
  it("ALLOW_SERVER_KEY=0|false|no → cấm", () => {
    expect(isServerKeyAllowed({ ALLOW_SERVER_KEY: "0" })).toBe(false);
    expect(isServerKeyAllowed({ ALLOW_SERVER_KEY: "false" })).toBe(false);
    expect(isServerKeyAllowed({ ALLOW_SERVER_KEY: "no" })).toBe(false);
  });

  it("ALLOW_SERVER_KEY=1|true|yes → cho phép kể cả production", () => {
    expect(isServerKeyAllowed({ ALLOW_SERVER_KEY: "1", NODE_ENV: "production" })).toBe(true);
    expect(isServerKeyAllowed({ ALLOW_SERVER_KEY: "true", VERCEL: "1" })).toBe(true);
    expect(isServerKeyAllowed({ ALLOW_SERVER_KEY: "yes" })).toBe(true);
  });

  it("dev không set flag → cho phép (tiện local)", () => {
    expect(isServerKeyAllowed({ NODE_ENV: "development" })).toBe(true);
    expect(isServerKeyAllowed({})).toBe(true);
  });

  it("production / Vercel không set flag → cấm (prod-safe default)", () => {
    expect(isServerKeyAllowed({ NODE_ENV: "production" })).toBe(false);
    expect(isServerKeyAllowed({ VERCEL: "1" })).toBe(false);
    expect(isServerKeyAllowed({ NODE_ENV: "production", VERCEL: "1" })).toBe(false);
  });
});

describe("resolveApiKey", () => {
  it("ưu tiên BYOK trước key server", () => {
    const r = resolveApiKey("  user-key  ", { GEMINI_API_KEY: "server-key" });
    expect(r).toEqual({ apiKey: "user-key", source: "byok" });
  });

  it("fallback GEMINI_API_KEY khi không có BYOK (dev)", () => {
    const r = resolveApiKey("", { GEMINI_API_KEY: "  server-key  ", NODE_ENV: "development" });
    expect(r).toEqual({ apiKey: "server-key", source: "server" });
  });

  it("null khi không có key nào", () => {
    expect(resolveApiKey(undefined, {})).toBeNull();
    expect(resolveApiKey("  ", { GEMINI_API_KEY: "" })).toBeNull();
  });

  it("ALLOW_SERVER_KEY=0 tắt fallback server (ép BYOK)", () => {
    expect(resolveApiKey("", { GEMINI_API_KEY: "server-key", ALLOW_SERVER_KEY: "0" })).toBeNull();
    expect(resolveApiKey("byok", { GEMINI_API_KEY: "server-key", ALLOW_SERVER_KEY: "0" })).toEqual({
      apiKey: "byok",
      source: "byok",
    });
  });

  it("production không set ALLOW_SERVER_KEY → không fallback server key", () => {
    expect(
      resolveApiKey("", {
        GEMINI_API_KEY: "server-key",
        NODE_ENV: "production",
      }),
    ).toBeNull();
    expect(
      resolveApiKey("", {
        GEMINI_API_KEY: "server-key",
        VERCEL: "1",
      }),
    ).toBeNull();
  });

  it("production + ALLOW_SERVER_KEY=1 → fallback server key", () => {
    expect(
      resolveApiKey("", {
        GEMINI_API_KEY: "server-key",
        NODE_ENV: "production",
        ALLOW_SERVER_KEY: "1",
      }),
    ).toEqual({ apiKey: "server-key", source: "server" });
  });
});

describe("describeServerKeyPolicy", () => {
  it("mô tả không lộ giá trị key", () => {
    const text = describeServerKeyPolicy({
      GEMINI_API_KEY: "super-secret",
      NODE_ENV: "production",
    });
    expect(text).not.toContain("super-secret");
    expect(text.toLowerCase()).toMatch(/disabled|byok/);
  });

  it("message thiếu key nhắc ALLOW_SERVER_KEY", () => {
    expect(API_KEY_MISSING_MESSAGE).toMatch(/ALLOW_SERVER_KEY/);
  });
});
