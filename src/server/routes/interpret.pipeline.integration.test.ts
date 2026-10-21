import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GEMINI_MODEL_FLASH, GEMINI_MODEL_FLASH_LITE } from "../../constants/geminiModels";
import { createApp } from "../createApp";
import { makeChartPayload, TEST_BYOK_KEY } from "../test/fixtures";
import { installGeminiMock, makeGeminiResponse, restoreGeminiMock } from "../test/mockGemini";

/**
 * A1 — Pipeline 3 chặng qua route thật (mock Gemini ở ranh giới network):
 *  - Chặng 1 trả JSON hợp lệ → response có metadata `pipeline` + prompt chặng 2 có skeleton.
 *  - Chặng 1 rơi toàn bộ (503 ×3) → pipeline ghi analysisSkipped, bài vẫn ra (đường 1-call).
 *  - Chặng 3: bài không có cấu trúc khung → `structureIssues` minh bạch.
 */

const ANALYSIS_JSON = JSON.stringify({
  de_tai_la_so: "Lá sát tinh quyền lực, Tử Vi đắc địa.",
  cach_cuc: ["Tử Phủ Vũ Tướng"],
  sao_then_chot: [{ domain: "menh", sao: ["Tử Vi"] }],
  duong_bay_phi: [{ tu: "Mệnh", hoa: "Kỵ", den: "Tật Ách", y_nghia: "tự đè sức khỏe" }],
  diem_mu: [],
  the_su_kien: [],
  trigger_han: [],
  tong_nam: [],
  phan_brief: [{ phan: 1, huong_viet: "mở bằng quyền lực", neo_sao: ["Tử Vi"] }],
});

describe("POST /api/interpret — pipeline A1", () => {
  const app = createApp();
  const chartData = makeChartPayload();
  let prevPipelineEnv: string | undefined;

  beforeEach(() => {
    restoreGeminiMock();
    prevPipelineEnv = process.env.INTERPRET_PIPELINE;
    process.env.INTERPRET_PIPELINE = "on";
  });

  afterEach(() => {
    restoreGeminiMock();
    if (prevPipelineEnv === undefined) delete process.env.INTERPRET_PIPELINE;
    else process.env.INTERPRET_PIPELINE = prevPipelineEnv;
  });

  it("chặng 1 JSON hợp lệ → metadata pipeline + skeleton cắm vào chặng 2", async () => {
    const longText = "Luận giải đủ dài. ".repeat(20);
    const { generateContent, modelsUsed } = installGeminiMock({
      queue: [makeGeminiResponse(ANALYSIS_JSON), makeGeminiResponse(longText)],
    });

    const res = await request(app)
      .post("/api/interpret")
      .send({ chartData, customApiKey: TEST_BYOK_KEY });

    expect(res.status).toBe(200);
    expect(res.body.modelUsed).toBe(GEMINI_MODEL_FLASH);
    expect(res.body.pipeline).toMatchObject({
      analysisModel: GEMINI_MODEL_FLASH_LITE,
      analysisAttempts: 1,
    });
    expect(res.body.pipeline.skeletonChars).toBeGreaterThan(0);
    // 2 call: chặng 1 (lite) + chặng 2 (model người dùng chọn)
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(modelsUsed).toEqual([GEMINI_MODEL_FLASH_LITE, GEMINI_MODEL_FLASH]);
    // Chặng 2 phải nhận prompt CÓ skeleton — xác nhận qua prompt của call thứ 2.
    const secondCallArg = generateContent.mock.calls[1][0] as unknown as { contents: string };
    expect(secondCallArg.contents).toContain("KHUNG PHÂN TÍCH CHỐT TỪ CHẶNG 1");
    // Chặng 3: bài không khung → structureIssues minh bạch
    expect(res.body.structureIssues.missingParts).toContain(1);
  });

  it("chặng 1 rơi toàn bộ (503 ×3) → analysisSkipped, bài vẫn ra nguyên trạng", async () => {
    const longText = "B".repeat(250);
    const { generateContent, modelsUsed } = installGeminiMock({
      queue: [
        new Error("503 Service Unavailable — high demand"),
        new Error("503 Service Unavailable — high demand"),
        new Error("503 Service Unavailable — high demand"),
        makeGeminiResponse(longText),
      ],
    });

    const res = await request(app)
      .post("/api/interpret")
      .send({ chartData, customApiKey: TEST_BYOK_KEY });

    expect(res.status).toBe(200);
    expect(res.body.pipeline).toMatchObject({ analysisSkipped: true });
    expect(res.body.interpretation).toBe(longText);
    expect(modelsUsed).toEqual([
      GEMINI_MODEL_FLASH_LITE, GEMINI_MODEL_FLASH_LITE, GEMINI_MODEL_FLASH, GEMINI_MODEL_FLASH,
    ]);
    expect(generateContent).toHaveBeenCalledTimes(4);
  });

  it("chặng 1 trả rác (không JSON) → retry xong vẫn bỏ khung, không cắm skeleton", async () => {
    const longText = "C".repeat(250);
    const { generateContent } = installGeminiMock({
      queue: [
        makeGeminiResponse("Tôi không trả JSON đâu."),
        makeGeminiResponse("vẫn không JSON"),
        makeGeminiResponse("chẳng JSON"),
        makeGeminiResponse(longText),
      ],
    });

    const res = await request(app)
      .post("/api/interpret")
      .send({ chartData, customApiKey: TEST_BYOK_KEY });

    expect(res.status).toBe(200);
    expect(res.body.pipeline).toMatchObject({ analysisSkipped: true });
    expect(generateContent).toHaveBeenCalledTimes(4);
    const lastCallArg = generateContent.mock.calls[3][0] as unknown as { contents: string };
    expect(lastCallArg.contents).not.toContain("KHUNG PHÂN TÍCH CHỐT TỪ CHẶNG 1");
  });

  it("pipeline tắt (env off) → không call chặng 1, response không field pipeline", async () => {
    process.env.INTERPRET_PIPELINE = "off";
    const longText = "Luận giải đủ dài. ".repeat(20);
    const { generateContent } = installGeminiMock({ defaultText: longText });

    const res = await request(app)
      .post("/api/interpret")
      .send({ chartData, customApiKey: TEST_BYOK_KEY });

    expect(res.status).toBe(200);
    expect(res.body.pipeline).toBeUndefined();
    expect(generateContent).toHaveBeenCalledTimes(1);
  });
});
