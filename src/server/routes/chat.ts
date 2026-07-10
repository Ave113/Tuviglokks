import type { Express, Request, Response } from "express";
import { retrieveTuBinh, tuBinhToPromptText } from "../../knowledge/tuBinhKnowledge";
import { retrieveKinhNghiem, kinhNghiemToPromptText } from "../../knowledge/kinhNghiemKnowledge";
import { getDamTinhForStars, getDamTinhForAuxStars } from "../../knowledge/damTinh";
import { buildChatRouteChartContext } from "../../prompt/buildChartPromptContext";
import { buildChatLuuNguyetBlock, shouldInjectChatLuuNguyet } from "../../prompt/chatLuuNguyet";
import { buildChatChartContext } from "../../prompt/formatChatChartContext";
import { CHAT_SYSTEM_INSTRUCTION } from "../../prompt/systemInstructions";
import { collectAllAuxStarNames } from "../../prompt/chartReports";
import {
  CHAT_BASE_FIRST_MAX_CHARS,
  CHAT_BASE_FIRST_MIN_CHARS,
  CHAT_BASE_INTERPRETATION_MAX_CHARS,
  CHAT_MAX_OUTPUT_TOKENS,
} from "../aiConfig";
import { jsonChatPayload } from "../bodyLimits";
import { assertChart12Palaces, requireApiKey } from "../chartGuards";
import { applyStarHallucinationGuard } from "../applyStarHallucinationGuard";
import {
  createGeminiClient,
  generateWithFallback,
  interpretResponse,
  resolveModelName,
  sendAiError,
} from "../gemini";
import { aiRateLimit } from "../rateLimit";

const MAX_CHAT_HISTORY_TURNS = 4;
const MAX_HISTORY_TURN_CHARS = 1200;

const clipText = (text: string, max: number, note: string): string => {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\n\n${note}`;
};

export const registerChatRoute = (app: Express) => {
  app.post("/api/chat", jsonChatPayload, aiRateLimit, async (req: Request, res: Response) => {
    try {
      const { baseInterpretation, chartData, history, question, customApiKey, modelSelection } = req.body;
      if (!question || !String(question).trim()) return res.status(400).json({ error: "Thiếu câu hỏi." });

      if (!assertChart12Palaces(
        chartData,
        res,
        "Dữ liệu lá số không hợp lệ: thiếu thông tin 12 cung. Vui lòng an lại lá số đầy đủ trước khi hỏi đáp.",
      )) {
        return;
      }

      const resolved = requireApiKey(customApiKey, res);
      if (!resolved) return;

      const { apiKey } = resolved;
      const modelName = resolveModelName(modelSelection);
      const ai = createGeminiClient(apiKey);
      const ctx = buildChatRouteChartContext(chartData);
      const historyArr = (Array.isArray(history) ? history : []).slice(-MAX_CHAT_HISTORY_TURNS);
      const q = String(question).trim();

      const rawBase = String(baseInterpretation || "").trim();
      // Đã có luận gốc đủ dài → ưu tiên bám bài đó, lá chỉ để đối chiếu (đỡ luận lại / tốn token).
      const preferBase = rawBase.length >= CHAT_BASE_FIRST_MIN_CHARS;

      // Luôn full quan hệ 12 cung (như ban đầu) — preferBase chỉ đổi cách trả lời (bám sớ), không cắt chart.
      let chartContext = buildChatChartContext(ctx, chartData, { mode: "full" });
      if (shouldInjectChatLuuNguyet(q, historyArr)) {
        const luuNguyetBlock = buildChatLuuNguyetBlock(ctx, chartData);
        if (luuNguyetBlock) chartContext = `${chartContext}\n\n${luuNguyetBlock}`;
      }

      const majorStars = ctx.allMajorStarNames;
      const auxStars = collectAllAuxStarNames(chartData?.palaces || []);
      // Khớp filter interpret (buildChartPromptContext): kèm Tuần/Triệt/Vong để RAG kinh nghiệm neo đúng.
      const knStars = [
        ...majorStars,
        ...auxStars.filter((n) =>
          /Kình|Đà|Không|Kiếp|Hỏa|Linh|Hóa |Lộc Tồn|Văn Xương|Văn Khúc|Thiên Mã|Hồng|Đào|Tuần|Triệt|Vong/i.test(
            n,
          ),
        ),
      ];

      // Có luận gốc: bớt “sách” phụ (đã nằm trong bài luận) — chỉ giữ KN ngắn theo câu hỏi.
      let damTinhChatStr = "";
      let tuBinhKnowledgeStr = "";
      let kinhNghiemStr = "";

      if (preferBase) {
        kinhNghiemStr = kinhNghiemToPromptText(
          retrieveKinhNghiem({ stars: knStars, query: q }, 2),
        );
      } else {
        damTinhChatStr = [
          getDamTinhForStars(majorStars),
          getDamTinhForAuxStars(auxStars, 3),
        ]
          .filter(Boolean)
          .join("\n");
        if (chartData?.baZi) {
          tuBinhKnowledgeStr = tuBinhToPromptText(
            retrieveTuBinh(
              { shiShen: ctx.shiShenList, elements: ctx.dominantElements, query: q },
              4,
            ),
          );
        }
        kinhNghiemStr = kinhNghiemToPromptText(
          retrieveKinhNghiem({ stars: knStars, query: q }, 3),
        );
      }

      const baseMax = preferBase ? CHAT_BASE_FIRST_MAX_CHARS : CHAT_BASE_INTERPRETATION_MAX_CHARS;
      const baseInterpClipped = clipText(
        rawBase || "(chưa có bản luận giải gốc — hãy luận dựa trên dữ liệu lá số ở trên)",
        baseMax,
        preferBase
          ? "(…đã cắt phần cuối bản luận gốc; phần còn lại vẫn là nguồn trả lời chính.)"
          : "(…đã cắt bớt bản luận gốc; ưu tiên dữ liệu 12 cung / sao ở trên.)",
      );

      const historyStr = historyArr
        .map((t: any) => {
          const role = t.role === "user" ? "Đương số" : "Minh Sư";
          const content = clipText(String(t.content || ""), MAX_HISTORY_TURN_CHARS, "(…đã cắt)");
          return `${role}: ${content}`;
        })
        .join("\n\n");

      const closing = preferBase
        ? `CÁCH TRẢ LỜI (ƯU TIÊN BÀI GỐC — TIẾT TOKEN, ĐỪNG LUẬN LẠI CẢ LÁ):
1) Đọc BẢN LUẬN GIẢI GỐC trước — trả lời câu hỏi BẰNG nội dung / kết luận đã có trong bài đó (diễn gọn, đúng ý, nhất quán với đã nói).
2) CHỈ mở DỮ LIỆU LÁ SỐ khi: bài gốc không đụng chủ đề; cần kiểm tra sao/cung có thật; hoặc câu hỏi chi tiết hơn bài gốc.
3) CẤM viết lại cả sớ mệnh / liệt kê lại 12 cung. CẤM mâu thuẫn bài gốc trừ khi lá số chứng minh gốc sai (lúc đó nói rõ).
4) Gọn, đời thực, không hoa mỹ.`
        : `Hãy tra đúng cung/sao liên quan rồi trả lời trực diện, bám đúng lá số. Ưu tiên: dữ liệu lá > Đàm Tinh > kinh nghiệm; gọn, đời thực, không hoa mỹ.`;

      // preferBase: bài gốc lên trước; lá xuống dưới như “bảng tra”.
      const prompt = preferBase
        ? `--- BẢN LUẬN GIẢI LÁ SỐ GỐC (NGUỒN TRẢ LỜI CHÍNH — đã có, ĐỪNG luận lại từ đầu) ---\n${baseInterpClipped}\n\n${historyStr ? `--- CÁC LƯỢT HỎI ĐÁP TRƯỚC ĐÓ ---\n${historyStr}\n\n` : ""}--- CÂU HỎI MỚI CỦA ĐƯƠNG SỐ ---\n${q}\n\n--- DỮ LIỆU LÁ SỐ (bảng đối chiếu — chỉ khi bài gốc thiếu / cần kiểm sao thật) ---\n${chartContext}\n\n${kinhNghiemStr ? `${kinhNghiemStr}\n\n` : ""}${closing}`
        : `--- DỮ LIỆU LÁ SỐ (sao THỰC CÓ — tra cứu trực tiếp ở đây) ---\n${chartContext}\n\n${damTinhChatStr ? `--- TINH TÌNH SAO (LỚP A — ĐÀM TINH) ---\n${damTinhChatStr}\n\n` : ""}${kinhNghiemStr ? `${kinhNghiemStr}\n\n` : ""}${tuBinhKnowledgeStr ? `--- KHO TRI THỨC TỬ BÌNH ---\n${tuBinhKnowledgeStr}\n\n` : ""}--- BẢN LUẬN GIẢI LÁ SỐ GỐC ---\n${baseInterpClipped}\n\n${historyStr ? `--- CÁC LƯỢT HỎI ĐÁP TRƯỚC ĐÓ ---\n${historyStr}\n\n` : ""}--- CÂU HỎI MỚI CỦA ĐƯƠNG SỐ ---\n${q}\n\n${closing}`;

      const chatGenOpts = { maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS };
      const { response, finalModelName, fallbackUsed } = await generateWithFallback(
        ai,
        modelName,
        prompt,
        CHAT_SYSTEM_INSTRUCTION,
        chatGenOpts,
      );
      const { text: rawAnswer, truncated } = interpretResponse(response);
      if (rawAnswer.length < 10 && !truncated) {
        return res.status(502).json({
          error: "Phản hồi trống bất thường. Vui lòng thử lại.",
          rateLimited: false,
        });
      }

      const guarded = await applyStarHallucinationGuard({
        ai,
        modelName: finalModelName,
        prompt,
        systemInstruction: CHAT_SYSTEM_INSTRUCTION,
        chartData,
        text: rawAnswer,
        maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
      });

      res.json({
        answer: guarded.text,
        modelUsed: finalModelName,
        fallbackUsed,
        ...(truncated ? { truncated: true } : {}),
        ...(guarded.audit.warning ? { starAuditWarning: guarded.audit.warning } : {}),
        ...(guarded.retried ? { starAuditRetried: true } : {}),
        ...(guarded.audit.hallucinated.length
          ? { starHallucinated: guarded.audit.hallucinated }
          : {}),
      });
    } catch (error: any) {
      console.error("Lỗi hỏi đáp follow-up:", error);
      sendAiError(res, error);
    }
  });
};
