import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyStarHallucinationGuard } from "./applyStarHallucinationGuard";
import { hallucinationTriggerStars, makeSparseChartForGuardTest } from "./test/fixtures";

vi.mock("./gemini", () => ({
  generateWithFallback: vi.fn(),
  interpretResponse: vi.fn(),
}));

import { generateWithFallback, interpretResponse } from "./gemini";

/** Dựng text bịa sao (lá thưa + chính tinh ngoài whitelist) đủ kích severity "retry". */
function buildHallucinatedText() {
  const chartData = makeSparseChartForGuardTest();
  const fakes = hallucinationTriggerStars(chartData);
  expect(fakes.length).toBeGreaterThan(0);
  const mention = fakes.map((f) => `Mệnh có ${f.display} miếu địa`).join(". ");
  return { chartData, text: `${mention}. `.repeat(12) };
}

describe("applyStarHallucinationGuard — mốc an toàn thời gian (deadlineMs)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("quá mốc → BỎ luận lại, giữ bản gốc + phụ chú hậu kiểm, không gọi model", async () => {
    const { chartData, text } = buildHallucinatedText();

    const result = await applyStarHallucinationGuard({
      ai: {} as never,
      modelName: "fake-model",
      prompt: "prompt",
      systemInstruction: "system",
      chartData,
      text,
      deadlineMs: Date.now() - 1_000,
    });

    expect(result.retried).toBe(false);
    expect(result.truncated).toBe(false);
    expect(result.audit.severity).toBe("retry");
    expect(result.text).toContain("Lưu ý hệ thống");
    expect(generateWithFallback).not.toHaveBeenCalled();
  });

  it("trong mốc → vẫn luận lại 1 lần như cũ", async () => {
    const { chartData, text } = buildHallucinatedText();
    const clean = "Cung Mệnh sáng sủa, vận trình hanh thông. ".repeat(20);
    vi.mocked(generateWithFallback).mockResolvedValueOnce({
      response: { text: clean },
    } as never);
    vi.mocked(interpretResponse).mockReturnValueOnce({
      text: clean,
      truncated: false,
      finishReason: "STOP",
    });

    const result = await applyStarHallucinationGuard({
      ai: {} as never,
      modelName: "fake-model",
      prompt: "prompt",
      systemInstruction: "system",
      chartData,
      text,
      deadlineMs: Date.now() + 60_000,
    });

    expect(generateWithFallback).toHaveBeenCalledTimes(1);
    expect(result.retried).toBe(true);
    expect(result.truncated).toBe(false);
    expect(result.text).toBe(clean);
  });

  it("bản luận lại chạm MAX_TOKENS → result.truncated=true", async () => {
    const { chartData, text } = buildHallucinatedText();
    const clean = "Cung Mệnh sáng sủa, vận trình hanh thông. ".repeat(20);
    vi.mocked(generateWithFallback).mockResolvedValueOnce({
      response: { text: clean },
    } as never);
    vi.mocked(interpretResponse).mockReturnValueOnce({
      text: clean,
      truncated: true,
      finishReason: "MAX_TOKENS",
    });

    const result = await applyStarHallucinationGuard({
      ai: {} as never,
      modelName: "fake-model",
      prompt: "prompt",
      systemInstruction: "system",
      chartData,
      text,
      deadlineMs: Date.now() + 60_000,
    });

    expect(result.retried).toBe(true);
    expect(result.truncated).toBe(true);
  });
});
