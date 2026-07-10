import { describe, it, expect } from "vitest";
import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_FALLBACK_MODEL,
  GEMINI_MODEL_FLASH,
  GEMINI_MODEL_FLASH_LITE,
  isGeminiModelSelection,
  resolveGeminiModelName,
} from "./geminiModels";

describe("geminiModels", () => {
  it("tên model khớp @google/genai@2.4 Model_2 union", () => {
    // genai.d.ts: ... | 'gemini-3.1-flash-lite' | ... | 'gemini-3.5-flash' | (string & {})
    expect(GEMINI_MODEL_FLASH).toBe("gemini-3.5-flash");
    expect(GEMINI_MODEL_FLASH_LITE).toBe("gemini-3.1-flash-lite");
  });

  it("resolveGeminiModelName — mặc định primary, lite khi chọn lite", () => {
    expect(resolveGeminiModelName(undefined)).toBe(GEMINI_MODEL_FLASH);
    expect(resolveGeminiModelName("other")).toBe(GEMINI_MODEL_FLASH);
    expect(resolveGeminiModelName(GEMINI_MODEL_FLASH_LITE)).toBe(GEMINI_MODEL_FLASH_LITE);
  });

  it("DEFAULT và FALLBACK", () => {
    expect(DEFAULT_GEMINI_MODEL).toBe(GEMINI_MODEL_FLASH);
    expect(GEMINI_FALLBACK_MODEL).toBe(GEMINI_MODEL_FLASH_LITE);
  });

  it("isGeminiModelSelection", () => {
    expect(isGeminiModelSelection(GEMINI_MODEL_FLASH)).toBe(true);
    expect(isGeminiModelSelection("gemini-2.5-flash")).toBe(false);
  });
});