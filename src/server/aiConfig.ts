import { GEMINI_FALLBACK_MODEL } from "../constants/geminiModels";

/** Cố định độ ngẫu nhiên khi sinh token — giảm lệch giữa các lần luận cùng lá số. */
export const AI_TEMPERATURE = 0.5;

/** Model dự phòng khi primary báo 503 / quá tải. */
export const FALLBACK_MODEL_ON_BUSY = GEMINI_FALLBACK_MODEL;

export const AI_MAX_OUTPUT_TOKENS = 13690;

/**
 * Chat follow-up trả lời ngắn (3–5 câu / vài gạch) — trần output thấp hơn
 * để model dừng sớm, giảm latency so với trần luận giải dài.
 */
export const CHAT_MAX_OUTPUT_TOKENS = 2048;

/**
 * Cắt bản luận gốc khi nhét vào /api/chat.
 * Khi đã có luận gốc đủ dài, chat ưu tiên dựa bài này → cho phép dài hơn (đỡ “luận lại”).
 */
export const CHAT_BASE_INTERPRETATION_MAX_CHARS = 4500;
/** Ngưỡng coi là “đã có luận gốc đáng dùng”. */
export const CHAT_BASE_FIRST_MIN_CHARS = 600;
/** Trần luận gốc ở chế độ ưu tiên bài gốc. */
export const CHAT_BASE_FIRST_MAX_CHARS = 9000;

/** Bật Phần 7 (Tháng trọng tâm) + cheat sheet Lưu Nguyệt trong luận giải chính. */
export const INTERPRET_INCLUDE_MONTHLY_SECTION = false;

export const buildAiConfig = (
  systemInstruction: string,
  options?: { maxOutputTokens?: number },
) => ({
  systemInstruction,
  temperature: AI_TEMPERATURE,
  maxOutputTokens: options?.maxOutputTokens ?? AI_MAX_OUTPUT_TOKENS,
});