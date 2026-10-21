import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GEMINI_MODEL_FLASH, GEMINI_MODEL_FLASH_LITE } from "../../constants/geminiModels";
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

  it("happy path — 200, đúng shape {answer, modelUsed, fallbackUsed} (mặc định Lite)", async () => {
    const answer = "Trả lời đủ dài cho câu hỏi follow-up. ".repeat(3);
    const mock = installGeminiMock({ defaultText: answer });

    const res = await request(app)
      .post("/api/chat")
      .send({
        chartData,
        question: "Cung Mệnh năm nay thế nào?",
        customApiKey: TEST_BYOK_KEY,
      });

    expect(res.status).toBe(200);
    expect(res.body.modelUsed).toBe(GEMINI_MODEL_FLASH_LITE);
    expect(res.body.fallbackUsed).toBe(false);
    expect(res.body.answer.trim()).toBe(answer.trim());

    // Prompt chat phải có tủ tinh hoa + lệnh diễn đạt (không chỉ lá thô)
    const firstCall = mock.generateContent.mock.calls[0]?.[0] as {
      contents?: unknown;
      config?: { systemInstruction?: string };
    };
    const promptBlob = JSON.stringify(firstCall ?? {});
    expect(promptBlob).toMatch(/TỦ TINH HOA|LỆNH DIỄN ĐẠT|BẬC THẦY/i);
    expect(String(firstCall?.config?.systemInstruction || "")).toMatch(
      /TINH HOA SÁCH|LOGIC BẬC THẦY/i,
    );
    expect(String(firstCall?.config?.systemInstruction || "")).toContain("FACT SHEET ĐÚC SẴN");

    // Fact sheet đúc sẵn mới — đồng bộ kho dữ liệu interpret → chat (pin không rớt khỏi prompt)
    expect(promptBlob).toContain("LAI NHÂN CUNG");
    expect(promptBlob).toContain("PHI TỨ HÓA ĐẠI VẬN 10 NĂM");
    expect(promptBlob).toContain("HAI TRỤC TÀI LỘC");
    expect(promptBlob).toContain("MÁY GHIM GIAO THOA 3 TẦNG");
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

  it("câu hỏi ngoại đề (toán học: nêu công thức logarit) → tự động từ chối lịch sự, không gọi AI", async () => {
    const mock = installGeminiMock();

    const res = await request(app)
      .post("/api/chat")
      .send({
        chartData,
        question: "nêu công thức logarit",
        customApiKey: TEST_BYOK_KEY,
      });

    expect(res.status).toBe(200);
    expect(res.body.answer).toContain("Toán học");
    expect(res.body.answer).toContain("nằm ngoài phạm vi tư vấn");
    // Tuyệt đối không gọi tới Gemini API
    expect(mock.generateContent).not.toHaveBeenCalled();
  });

  it("chat với model thứ 2 (gemini-3.5-flash-lite) → áp dụng Hard-Lock và Consistency Guard", async () => {
    const mock = installGeminiMock({
      defaultText: "Vận này bạn hoàn toàn yên tâm đầu tư lớn, phát tài rực rỡ và thu lợi nhuận khủng.",
    });

    const res = await request(app)
      .post("/api/chat")
      .send({
        chartData,
        baseInterpretation: "Cung Tài Bạch gặp Hóa Kỵ ngộ Không Kiếp, hao tài tán tài nặng nề, tuyệt đối tránh đầu tư mạo hiểm.",
        question: "Tôi có nên đầu tư tiền bạc lớn vào năm nay không?",
        customApiKey: TEST_BYOK_KEY,
        modelSelection: "gemini-3.5-flash-lite",
      });

    expect(res.status).toBe(200);
    expect(res.body.modelUsed).toBe("gemini-3.5-flash-lite");
    // Kiểm tra đã được Consistency Guard can thiệp để bảo toàn nhất quán với bài gốc
    expect(res.body.answer).toContain("Lưu ý nhất quán với bản luận giải chính");
    expect(res.body.answer).toContain("đề phòng hao tán dòng tiền");

    // Chốt 2026-10: KN không còn bị cắt theo isSecondary — model thứ 2 vẫn nhận khối Kinh Nghiệm.
    const firstCall = mock.generateContent.mock.calls[0]?.[0] as { contents?: unknown };
    expect(JSON.stringify(firstCall ?? {})).toContain("KINH NGHIỆM ỨNG DỤNG");
  });

  it("REGRESSION — payload thiếu birthHeavenlyStem (chỉ có chineseDate) vẫn tính được Tứ Hóa bẩm sinh", async () => {
    const mock = installGeminiMock({ defaultText: "Trả lời đủ dài cho câu hỏi follow-up. ".repeat(3) });

    // Mô phỏng client gửi lá thô: không có birthHeavenlyStem, chỉ có chineseDate.
    // Lá fixture sinh 1995-10-25 → năm âm Ất Hợi → Lộc = Thiên Cơ.
    const rawChart: any = { ...chartData };
    delete rawChart.birthHeavenlyStem;
    delete rawChart.birthLunarYear;

    const res = await request(app)
      .post("/api/chat")
      .send({
        chartData: rawChart,
        question: "Tứ Hóa bẩm sinh của tôi là gì?",
        customApiKey: TEST_BYOK_KEY,
      });

    expect(res.status).toBe(200);
    const firstCall = mock.generateContent.mock.calls[0]?.[0] as {
      contents?: unknown;
    };
    const promptBlob = JSON.stringify(firstCall ?? {});
    // Trước vá: khối Tứ Hóa được dựng TRƯỚC khi chốt can → prompt báo
    // "Chưa xác định được Thiên can năm sinh" dù chineseDate có đủ.
    expect(promptBlob).not.toContain("Chưa xác định được Thiên can năm sinh");
    expect(promptBlob).toContain("Hóa Lộc → Thiên Cơ");
    expect(promptBlob).toContain("Hóa Kỵ → Thái Âm");
  });

  it("LƯU NGUYỆT lazy-inject — 'Cuối năm...' thực sự an 12 cung tháng vào prompt (mặc định Lite)", async () => {
    const mock = installGeminiMock({
      defaultText: "Trả lời đủ dài cho câu hỏi về mốc thời gian. ".repeat(3),
    });

    const res = await request(app)
      .post("/api/chat")
      .send({
        chartData,
        question: "Cuối năm nay tài chính thế nào?",
        customApiKey: TEST_BYOK_KEY,
      });

    expect(res.status).toBe(200);
    expect(res.body.modelUsed).toBe(GEMINI_MODEL_FLASH_LITE);

    const firstCall = mock.generateContent.mock.calls[0]?.[0] as { contents?: unknown };
    const promptBlob = JSON.stringify(firstCall ?? {});
    expect(promptBlob).toContain("LƯU NGUYỆT 2026 — 12 CUNG THÁNG ÂM LỊCH");
    expect(promptBlob).toMatch(/Tháng 1 âm: cung .+ can tháng/);
    expect(promptBlob).toContain("Tháng 12 âm:");
    expect(promptBlob).toContain("Lưu Nguyệt Tứ Hóa:");
  });

  it("LƯU NGUYỆT lazy-inject — modelSelection gửi Flash bị KHÓA CỨNG về Flash-Lite (preferBase vẫn có bảng tháng)", async () => {
    const mock = installGeminiMock({
      defaultText: "Trả lời đủ dài cho câu hỏi về quý. ".repeat(3),
    });

    const res = await request(app)
      .post("/api/chat")
      .send({
        chartData,
        baseInterpretation: "Bản luận giải gốc tham chiếu. ".repeat(40),
        question: "Quý 4 này tôi có biến động gì không?",
        customApiKey: TEST_BYOK_KEY,
        modelSelection: GEMINI_MODEL_FLASH,
      });

    expect(res.status).toBe(200);
    // Khóa cứng 2026-10: gửi lên Flash cũng bị bỏ qua — /api/chat luôn chạy Flash-Lite.
    expect(res.body.modelUsed).toBe(GEMINI_MODEL_FLASH_LITE);

    const firstCall = mock.generateContent.mock.calls[0]?.[0] as { contents?: unknown };
    expect(JSON.stringify(firstCall ?? {})).toContain("LƯU NGUYỆT 2026 — 12 CUNG THÁNG ÂM LỊCH");
  });

  it("LƯU NGUYỆT lazy-inject — không nhắc mốc thời gian thì KHÔNG có bảng tháng trong prompt", async () => {
    const mock = installGeminiMock({
      defaultText: "Trả lời đủ dài cho câu hỏi tính cách. ".repeat(3),
    });

    const res = await request(app)
      .post("/api/chat")
      .send({
        chartData,
        question: "Tính cách của tôi thế nào?",
        customApiKey: TEST_BYOK_KEY,
      });

    expect(res.status).toBe(200);
    const firstCall = mock.generateContent.mock.calls[0]?.[0] as { contents?: unknown };
    // Chỉ soi PROMPT (contents) — system instruction có nhắc TÊN khối để hướng dẫn
    // model cách dùng, không tính là dữ liệu bị inject.
    const promptBlob = JSON.stringify(firstCall?.contents ?? {});
    expect(promptBlob).not.toContain("LƯU NGUYỆT 2026 — 12 CUNG THÁNG ÂM LỊCH");
    expect(promptBlob).not.toContain("Tháng 1 âm:");
  });

  it("LƯU NGUYỆT lazy-inject — follow-up: history nhắc 'Quý 4' là đủ để an bảng tháng", async () => {
    const mock = installGeminiMock({
      defaultText: "Trả lời đủ dài cho câu hỏi follow-up. ".repeat(3),
    });

    const res = await request(app)
      .post("/api/chat")
      .send({
        chartData,
        question: "Vậy còn sức khỏe thì sao?",
        history: [
          { role: "user", content: "Quý 4 tôi có biến động gì không?" },
          { role: "assistant", content: "Quý 4 hạn đóng cung..." },
        ],
        customApiKey: TEST_BYOK_KEY,
      });

    expect(res.status).toBe(200);
    const firstCall = mock.generateContent.mock.calls[0]?.[0] as { contents?: unknown };
    expect(JSON.stringify(firstCall ?? {})).toContain("LƯU NGUYỆT 2026 — 12 CUNG THÁNG ÂM LỊCH");
  });

  it("BÌNH GIẢI CÁC CÁCH — chat Lite nhận block riêng từ binhgiaicaccach.txt (50% trần interpret)", async () => {
    const mock = installGeminiMock({
      defaultText: "Trả lời đủ dài về cách cục theo block bình giải. ".repeat(3),
    });

    const res = await request(app)
      .post("/api/chat")
      .send({
        chartData,
        question: "Cách cục cung Mệnh của tôi có gì đáng lưu ý?",
        customApiKey: TEST_BYOK_KEY,
      });

    expect(res.status).toBe(200);
    expect(res.body.modelUsed).toBe(GEMINI_MODEL_FLASH_LITE);
    const firstCall = mock.generateContent.mock.calls[0]?.[0] as { contents?: unknown };
    // Chỉ soi PROMPT (contents) — block nằm trong prompt, không tính system instruction.
    const promptBlob = JSON.stringify(firstCall?.contents ?? {});
    expect(promptBlob).toContain("--- BÌNH GIẢI CÁC CÁCH");
    // Tủ tinh hoa (mode chat50 — đúng 50% trần interpret) cũng vào prompt chat Lite
    expect(promptBlob).toContain("--- TỦ TINH HOA + LOGIC BẬC THẦY");
    expect(promptBlob).toContain("LỆNH DIỄN ĐẠT — BẬC THẦY (CHAT FOLLOW-UP)");
    // Mini-lệnh của block vẫn theo trần nguyên văn toàn cục "tối đa 40%"
    expect(promptBlob).toContain("tối đa 40%");
    expect(promptBlob).toContain("toàn bộ kiến thức");
    expect(promptBlob).toContain("không phải trần kiến thức");
  });
});
