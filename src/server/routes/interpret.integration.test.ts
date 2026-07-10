import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GEMINI_MODEL_FLASH, GEMINI_MODEL_FLASH_LITE } from "../../constants/geminiModels";
import { API_KEY_MISSING_MESSAGE } from "../chartGuards";
import { createApp } from "../createApp";
import { hallucinationTriggerStars, makeChartPayload, TEST_BYOK_KEY } from "../test/fixtures";
import { installGeminiMock, makeGeminiResponse, restoreGeminiMock } from "../test/mockGemini";

describe("POST /api/interpret (integration)", () => {
  const app = createApp();
  const chartData = makeChartPayload();

  beforeEach(() => {
    restoreGeminiMock();
  });

  afterEach(() => {
    restoreGeminiMock();
  });

  it("happy path — 200, đúng shape {interpretation, modelUsed, fallbackUsed}", async () => {
    const longText = "Luận giải đủ dài. ".repeat(20);
    installGeminiMock({ defaultText: longText });

    const res = await request(app)
      .post("/api/interpret")
      .send({ chartData, customApiKey: TEST_BYOK_KEY });

    expect(res.status).toBe(200);
    expect(res.body.modelUsed).toBe(GEMINI_MODEL_FLASH);
    expect(res.body.fallbackUsed).toBe(false);
    expect(res.body.interpretation.trim()).toBe(longText.trim());
    expect(res.body.interpretation.length).toBeGreaterThanOrEqual(200);
  });

  it("thiếu chartData → 400", async () => {
    installGeminiMock();

    const res = await request(app)
      .post("/api/interpret")
      .send({ customApiKey: TEST_BYOK_KEY });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Thiếu dữ liệu lá số Tử Vi.");
  });

  it("thiếu 12 cung → 400", async () => {
    installGeminiMock();

    const res = await request(app)
      .post("/api/interpret")
      .send({
        chartData: { ...chartData, palaces: chartData.palaces.slice(0, 11) },
        customApiKey: TEST_BYOK_KEY,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("thiếu thông tin 12 cung");
  });

  it("không có API key → 400 qua requireApiKey", async () => {
    installGeminiMock();
    const prev = process.env.GEMINI_API_KEY;
    const prevAllow = process.env.ALLOW_SERVER_KEY;
    delete process.env.GEMINI_API_KEY;
    process.env.ALLOW_SERVER_KEY = "0";

    try {
      const res = await request(app).post("/api/interpret").send({ chartData });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(API_KEY_MISSING_MESSAGE);
    } finally {
      if (prev === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prev;
      if (prevAllow === undefined) delete process.env.ALLOW_SERVER_KEY;
      else process.env.ALLOW_SERVER_KEY = prevAllow;
    }
  });

  it("Gemini 503 → generateWithFallback đổi sang lite, fallbackUsed: true", async () => {
    const longText = "B".repeat(250);
    const { modelsUsed } = installGeminiMock({
      queue: [
        new Error("503 Service Unavailable — high demand"),
        makeGeminiResponse(longText),
      ],
    });

    const res = await request(app)
      .post("/api/interpret")
      .send({ chartData, customApiKey: TEST_BYOK_KEY });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      interpretation: longText,
      modelUsed: GEMINI_MODEL_FLASH_LITE,
      fallbackUsed: true,
    });
    expect(modelsUsed).toEqual([GEMINI_MODEL_FLASH, GEMINI_MODEL_FLASH_LITE]);
  });

  it("response bịa sao → guard retry 1 lần, vẫn bịa → disclaimer", async () => {
    const fakes = hallucinationTriggerStars(chartData);
    expect(fakes.length, "cần sao không có trên lá để test guard").toBeGreaterThan(0);

    const mention = fakes.map((f) => `Mệnh có ${f.display} miếu địa`).join(". ");
    const hallucinated = `${mention}. `.repeat(8);
    const { generateContent } = installGeminiMock({
      queue: [makeGeminiResponse(hallucinated), makeGeminiResponse(hallucinated)],
    });

    const res = await request(app)
      .post("/api/interpret")
      .send({ chartData, customApiKey: TEST_BYOK_KEY });

    expect(res.status).toBe(200);
    expect(res.body.starAuditRetried).toBe(true);
    expect(res.body.interpretation).toContain("Lưu ý hệ thống");
    for (const fake of fakes) {
      expect(res.body.interpretation).toContain(fake.display);
    }
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("text < 200 ký tự, không truncated → 502", async () => {
    installGeminiMock({ defaultText: "Ngắn quá." });

    const res = await request(app)
      .post("/api/interpret")
      .send({ chartData, customApiKey: TEST_BYOK_KEY });

    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({
      error: "Phản hồi trống bất thường. Vui lòng thử lại.",
      rateLimited: false,
    });
  });
});