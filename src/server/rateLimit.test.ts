import { describe, it, expect } from "vitest";
import {
  isAiRateLimitActive,
  shouldBypassAiRateLimit,
  describeRateLimitPolicy,
  SERVER_KEY_RATE_LIMIT_MAX,
  SERVER_KEY_RATE_LIMIT_RETRY_AFTER_SEC,
  RATE_LIMIT_MESSAGE,
} from "./rateLimit";

describe("isAiRateLimitActive", () => {
  it("tắt trên Vercel serverless (in-memory không đủ)", () => {
    expect(isAiRateLimitActive({ VERCEL: "1" })).toBe(false);
  });

  it("bật khi tự host Node (npm start)", () => {
    expect(isAiRateLimitActive({})).toBe(true);
    expect(isAiRateLimitActive({ VERCEL: undefined })).toBe(true);
  });

  it("RATE_LIMIT_FORCE=1 ép bật cả trên Vercel", () => {
    expect(isAiRateLimitActive({ VERCEL: "1", RATE_LIMIT_FORCE: "1" })).toBe(true);
  });
});

describe("shouldBypassAiRateLimit", () => {
  it("bỏ qua khi có BYOK trong body", () => {
    expect(shouldBypassAiRateLimit({ body: { customApiKey: "  my-key " } })).toBe(true);
  });

  it("không bỏ qua khi dùng key server (không BYOK)", () => {
    expect(shouldBypassAiRateLimit({ body: { customApiKey: "" } })).toBe(false);
    expect(shouldBypassAiRateLimit({ body: {} })).toBe(false);
  });

  it("key server siết 5 req/phút", () => {
    expect(SERVER_KEY_RATE_LIMIT_MAX).toBe(5);
    expect(SERVER_KEY_RATE_LIMIT_RETRY_AFTER_SEC).toBe(60);
  });
});

describe("describeRateLimitPolicy", () => {
  it("ON khi không Vercel", () => {
    expect(describeRateLimitPolicy({})).toMatch(/ON/i);
  });

  it("OFF + gợi ý Firewall/Redis trên Vercel", () => {
    const text = describeRateLimitPolicy({ VERCEL: "1" });
    expect(text).toMatch(/OFF/i);
    expect(text).toMatch(/Firewall|Redis/i);
  });

  it("message 429 ổn định", () => {
    expect(RATE_LIMIT_MESSAGE).toMatch(/Quá nhiều yêu cầu/);
  });
});
