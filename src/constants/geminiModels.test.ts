import { describe, it, expect } from "vitest";
import {
  DEFAULT_CHAT_GEMINI_MODEL,
  DEFAULT_GEMINI_MODEL,
  GEMINI_FALLBACK_MODEL,
  GEMINI_MODEL_FLASH,
  GEMINI_MODEL_FLASH_LITE,
  isGeminiModelSelection,
  resolveGeminiModelName,
} from "./geminiModels";

describe("geminiModels", () => {
  it("tên model primary / lite (API id)", () => {
    // genai Model_2 có (string & {}) — id mới vẫn gửi được qua API
    expect(GEMINI_MODEL_FLASH).toBe("gemini-3.8-flash");
    expect(GEMINI_MODEL_FLASH_LITE).toBe("gemini-3.5-flash-lite");
  });

  it("resolveGeminiModelName — mặc định primary, lite khi chọn lite", () => {
    expect(resolveGeminiModelName(undefined)).toBe(GEMINI_MODEL_FLASH);
    expect(resolveGeminiModelName("other")).toBe(GEMINI_MODEL_FLASH);
    expect(resolveGeminiModelName(GEMINI_MODEL_FLASH_LITE)).toBe(GEMINI_MODEL_FLASH_LITE);
  });

  it("DEFAULT và FALLBACK", () => {
    expect(DEFAULT_GEMINI_MODEL).toBe(GEMINI_MODEL_FLASH);
    expect(DEFAULT_CHAT_GEMINI_MODEL).toBe(GEMINI_MODEL_FLASH_LITE);
    expect(GEMINI_FALLBACK_MODEL).toBe(GEMINI_MODEL_FLASH_LITE);
  });

  it("isGeminiModelSelection", () => {
    expect(isGeminiModelSelection(GEMINI_MODEL_FLASH)).toBe(true);
    expect(isGeminiModelSelection("gemini-2.5-flash")).toBe(false);
  });
});