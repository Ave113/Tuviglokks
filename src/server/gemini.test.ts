import { describe, it, expect, vi } from "vitest";
import {
  AiGenerationError,
  interpretResponse,
  safeExtractText,
  sendAiError,
  sendInterpretAiError,
} from "./gemini";

describe("safeExtractText", () => {
  it("đọc parts, không dùng getter .text", () => {
    const response = {
      candidates: [{ content: { parts: [{ text: "Đoạn một. " }, { text: "Đoạn hai." }] } }],
    };
    expect(safeExtractText(response)).toBe("Đoạn một. Đoạn hai.");
  });

  it("trả rỗng khi không có candidate/parts", () => {
    expect(safeExtractText({})).toBe("");
    expect(safeExtractText({ candidates: [] })).toBe("");
    expect(safeExtractText({ candidates: [{ content: {} }] })).toBe("");
  });
});

describe("interpretResponse", () => {
  it("ném prompt_blocked khi có blockReason", () => {
    expect(() =>
      interpretResponse({ promptFeedback: { blockReason: "SAFETY" }, candidates: [] }),
    ).toThrow(AiGenerationError);

    try {
      interpretResponse({ promptFeedback: { blockReason: "SAFETY" } });
    } catch (e) {
      expect(e).toBeInstanceOf(AiGenerationError);
      expect((e as AiGenerationError).kind).toBe("prompt_blocked");
    }
  });

  it("ném safety khi finishReason SAFETY", () => {
    try {
      interpretResponse({
        candidates: [{ finishReason: "SAFETY", content: { parts: [{ text: "" }] } }],
      });
    } catch (e) {
      expect((e as AiGenerationError).kind).toBe("safety");
    }
  });

  it("ném recitation khi finishReason RECITATION", () => {
    try {
      interpretResponse({
        candidates: [{ finishReason: "RECITATION", content: { parts: [{ text: "x" }] } }],
      });
    } catch (e) {
      expect((e as AiGenerationError).kind).toBe("recitation");
    }
  });

  it("ném empty khi không có candidate", () => {
    try {
      interpretResponse({ candidates: [] });
    } catch (e) {
      expect((e as AiGenerationError).kind).toBe("empty");
    }
  });

  it("MAX_TOKENS → truncated:true, vẫn trả text dài", () => {
    const longText = "A".repeat(500);
    const outcome = interpretResponse({
      candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: longText }] } }],
    });
    expect(outcome.text).toBe(longText);
    expect(outcome.truncated).toBe(true);
    expect(outcome.finishReason).toBe("MAX_TOKENS");
  });

  it("STOP bình thường → truncated:false", () => {
    const outcome = interpretResponse({
      candidates: [{ finishReason: "STOP", content: { parts: [{ text: "Kết luận đủ dài." }] } }],
    });
    expect(outcome.truncated).toBe(false);
    expect(outcome.text).toBe("Kết luận đủ dài.");
  });
});

describe("sendAiError / sendInterpretAiError", () => {
  const mockRes = () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    return { status, json };
  };

  it("AiGenerationError → 422, rateLimited:false (không kích retry)", () => {
    for (const handler of [sendAiError, sendInterpretAiError]) {
      const res = mockRes();
      handler(res as unknown as import("express").Response, new AiGenerationError("safety", "blocked"));
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining("bộ lọc an toàn"),
        rateLimited: false,
      });
    }
  });
});