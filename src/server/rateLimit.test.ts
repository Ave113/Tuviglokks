import { describe, it, expect } from "vitest";
import {
  isAiRateLimitActive,
  shouldBypassAiRateLimit,
  isPlausibleByokKey,
  describeRateLimitPolicy,
  SERVER_KEY_RATE_LIMIT_MAX,
  SERVER_KEY_RATE_LIMIT_RETRY_AFTER_SEC,
  RATE_LIMIT_MESSAGE,
  BYOK_MIN_LENGTH_FOR_BYPASS,
} from "./rateLimit";

describe("isAiRateLimitActive", () => {
  it("mặc định BẬT kể cả Vercel (per-instance)", () => {
    expect(isAiRateLimitActive({ VERCEL: "1" })).toBe(true);
    expect(isAiRateLimitActive({})).toBe(true);
  });

  it("RATE_LIMIT_FORCE=0|false|no → tắt", () => {
    expect(isAiRateLimitActive({ RATE_LIMIT_FORCE: "0" })).toBe(false);
    expect(isAiRateLimitActive({ VERCEL: "1", RATE_LIMIT_FORCE: "false" })).toBe(false);
    expect(isAiRateLimitActive({ RATE_LIMIT_FORCE: "no" })).toBe(false);
  });

  it("RATE_LIMIT_FORCE=1 ép bật", () => {
    expect(isAiRateLimitActive({ RATE_LIMIT_FORCE: "1" })).toBe(true);
  });
});

describe("isPlausibleByokKey / shouldBypassAiRateLimit", () => {
  it("từ chối rỗng / key rác ngắn (chống bypass rate-limit)", () => {
    expect(isPlausibleByokKey("")).toBe(false);
    expect(isPlausibleByokKey("x")).toBe(false);
    expect(isPlausibleByokKey("  short  ")).toBe(false);
    expect(isPlausibleByokKey("x".repeat(BYOK_MIN_LENGTH_FOR_BYPASS - 1))).toBe(false);
    expect(shouldBypassAiRateLimit({ body: { customApiKey: "x" } })).toBe(false);
    expect(shouldBypassAiRateLimit({ body: { customApiKey: "" } })).toBe(false);
    expect(shouldBypassAiRateLimit({ body: {} })).toBe(false);
  });

  it("chấp nhận shape AIza… và AQ.…", () => {
    const aiza = `AIza${"Sy".padEnd(22, "A")}BC`;
    expect(isPlausibleByokKey(aiza)).toBe(true);
    expect(shouldBypassAiRateLimit({ body: { customApiKey: `  ${aiza}  ` } })).toBe(true);

    const aq = `AQ.${"Ab".padEnd(40, "A")}`;
    expect(isPlausibleByokKey(aq)).toBe(true);
    expect(shouldBypassAiRateLimit({ body: { customApiKey: aq } })).toBe(true);
  });

  it("chấp nhận secret generic dài có chữ + số", () => {
    const generic = `Abcd1234${"x".repeat(30)}`;
    expect(isPlausibleByokKey(generic)).toBe(true);
  });

  it("từ chối chuỗi x dài không có số", () => {
    expect(isPlausibleByokKey("x".repeat(40))).toBe(false);
  });

  it("key server siết 5 req/phút", () => {
    expect(SERVER_KEY_RATE_LIMIT_MAX).toBe(5);
    expect(SERVER_KEY_RATE_LIMIT_RETRY_AFTER_SEC).toBe(60);
  });
});

describe("describeRateLimitPolicy", () => {
  it("ON mặc định", () => {
    expect(describeRateLimitPolicy({})).toMatch(/ON/i);
  });

  it("ON trên Vercel + gợi ý Firewall/Redis", () => {
    const text = describeRateLimitPolicy({ VERCEL: "1" });
    expect(text).toMatch(/ON/i);
    expect(text).toMatch(/Firewall|Redis|per-instance/i);
  });

  it("OFF khi FORCE=0", () => {
    expect(describeRateLimitPolicy({ RATE_LIMIT_FORCE: "0" })).toMatch(/OFF/i);
  });

  it("message 429 ổn định", () => {
    expect(RATE_LIMIT_MESSAGE).toMatch(/Quá nhiều yêu cầu/);
  });
});
