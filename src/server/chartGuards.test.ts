import { describe, it, expect } from "vitest";
import { makeChartPayload } from "./test/fixtures";
import {
  resolveApiKey,
  isServerKeyAllowed,
  describeServerKeyPolicy,
  API_KEY_MISSING_MESSAGE,
  validateChart12Palaces,
  CHART_INVALID_12_MSG,
  CHART_INVALID_SCHEMA_MSG,
} from "./chartGuards";

describe("validateChart12Palaces", () => {
  it("lá số thật (makeChartPayload) → ok", () => {
    expect(validateChart12Palaces(makeChartPayload())).toEqual({ ok: true });
  });

  it("thiếu / không đủ 12 cung → fail 12", () => {
    expect(validateChart12Palaces(null).ok).toBe(false);
    expect(validateChart12Palaces({}).ok).toBe(false);
    const base = makeChartPayload();
    const r = validateChart12Palaces({ ...base, palaces: base.palaces.slice(0, 11) });
    expect(r.ok).toBe(false);
    if (r.ok === false) expect(r.message).toBe(CHART_INVALID_12_MSG);
  });

  it("cung thiếu name / earthlyBranch / index → fail schema", () => {
    const base = makeChartPayload();
    const badName = {
      ...base,
      palaces: base.palaces.map((p, i) => (i === 0 ? { ...p, name: "" } : p)),
    };
    const r1 = validateChart12Palaces(badName);
    expect(r1.ok).toBe(false);
    if (r1.ok === false) expect(r1.message).toBe(CHART_INVALID_SCHEMA_MSG);

    const badBranch = {
      ...base,
      palaces: base.palaces.map((p, i) => (i === 0 ? { ...p, earthlyBranch: "Mars" } : p)),
    };
    expect(validateChart12Palaces(badBranch).ok).toBe(false);

    const badIndex = {
      ...base,
      palaces: base.palaces.map((p, i) => (i === 0 ? { ...p, index: 99 } : p)),
    };
    expect(validateChart12Palaces(badIndex).ok).toBe(false);
  });

  it("duplicate index hoặc địa chi → fail schema", () => {
    const base = makeChartPayload();
    const dupIndex = {
      ...base,
      palaces: base.palaces.map((p, i) => (i === 1 ? { ...p, index: base.palaces[0].index } : p)),
    };
    expect(validateChart12Palaces(dupIndex).ok).toBe(false);

    const dupBranch = {
      ...base,
      palaces: base.palaces.map((p, i) =>
        i === 1 ? { ...p, earthlyBranch: base.palaces[0].earthlyBranch } : p,
      ),
    };
    expect(validateChart12Palaces(dupBranch).ok).toBe(false);
  });
});

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
