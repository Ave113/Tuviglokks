import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GEMINI_MODEL_FLASH } from "../../constants/geminiModels";
import { createApp } from "../createApp";
import { makeChartPayload, TEST_BYOK_KEY } from "../test/fixtures";
import { installGeminiMock, restoreGeminiMock } from "../test/mockGemini";

describe("POST /api/chat (integration)", () => {
  const app = createApp();
  const chartData = makeChartPayload();

  beforeEach(() => {
    restoreGeminiMock();
  });

  afterEach(() => {
    restoreGeminiMock();
  });

  it("happy path — 200, đúng shape {answer, modelUsed, fallbackUsed}", async () => {
    const answer = "Trả lời đủ dài cho câu hỏi follow-up. ".repeat(3);
    installGeminiMock({ defaultText: answer });

    const res = await request(app)
      .post("/api/chat")
      .send({
        chartData,
        question: "Cung Mệnh năm nay thế nào?",
        customApiKey: TEST_BYOK_KEY,
      });

    expect(res.status).toBe(200);
    expect(res.body.modelUsed).toBe(GEMINI_MODEL_FLASH);
    expect(res.body.fallbackUsed).toBe(false);
    expect(res.body.answer.trim()).toBe(answer.trim());
  });

  it("thiếu câu hỏi → 400", async () => {
    installGeminiMock();

    const res = await request(app)
      .post("/api/chat")
      .send({ chartData, customApiKey: TEST_BYOK_KEY });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Thiếu câu hỏi.");
  });

  it("thiếu 12 cung → 400", async () => {
    installGeminiMock();

    const res = await request(app)
      .post("/api/chat")
      .send({
        chartData: { palaces: [] },
        question: "Hỏi gì đó?",
        customApiKey: TEST_BYOK_KEY,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("thiếu thông tin 12 cung");
  });

  it("text < 10 ký tự, không truncated → 502", async () => {
    installGeminiMock({ defaultText: "Ngắn" });

    const res = await request(app)
      .post("/api/chat")
      .send({
        chartData,
        question: "Cung Tài thế nào?",
        customApiKey: TEST_BYOK_KEY,
      });

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("Phản hồi trống bất thường. Vui lòng thử lại.");
  });
});