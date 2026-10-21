import { GEMINI_FALLBACK_MODEL } from "../constants/geminiModels";

/** Model dự phòng khi primary báo 503 / quá tải. */
export const FALLBACK_MODEL_ON_BUSY = GEMINI_FALLBACK_MODEL;

export const AI_MAX_OUTPUT_TOKENS = 13690;

/**
 * Chat follow-up trả lời ngắn (3–5 câu / vài gạch) — trần đầu ra thấp hơn
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

/**
 * Tăng tỷ trọng hiển thị của Bản luận giải gốc thêm 35% cho model thứ 2 (secondary/lite tier)
 * để đảm bảo model thứ 2 luôn có đủ ngữ cảnh và tuyệt đối không mâu thuẫn bài gốc.
 */
export const CHAT_BASE_INTERPRETATION_MAX_CHARS_SECONDARY = Math.round(
  CHAT_BASE_INTERPRETATION_MAX_CHARS * 1.35,
); // 6,075 ký tự (+35%)
export const CHAT_BASE_FIRST_MAX_CHARS_SECONDARY = Math.round(
  CHAT_BASE_FIRST_MAX_CHARS * 1.35,
); // 12,150 ký tự (+35%)


/** Bật phần tháng trọng tâm + cheat sheet Lưu Nguyệt (mặc định tắt; phần tháng nằm sau Sức khỏe). */
export const INTERPRET_INCLUDE_MONTHLY_SECTION = false;

/**
 * A1 — PIPELINE LUẬN GIẢI 3 CHẶNG (Phân tích → Biên soạn → Kiểm tra).
 * Mặc định BẬT; tắt nhanh bằng env: INTERPRET_PIPELINE=off|0|false.
 * Đọc env LÚC GỌI (không khóa lúc import) — tắt runtime không cần rebuild,
 * và integration test bật/tắt được theo từng case.
 */
export const isInterpretPipelineEnabled = (): boolean =>
  !/^(0|false|off)$/i.test(String(process.env.INTERPRET_PIPELINE ?? "").trim());

/** Trần đầu ra JSON chặng 1 (Phân tích) — đủ cho brief 4 phần lớn, không phình. */
export const ANALYSIS_MAX_OUTPUT_TOKENS = 3072;

/**
 * Ngân sách thời gian TỔNG cho cả chặng 1 (mọi attempt lẫn retry).
 * Hết budget → bỏ khung, quay về đường 1-call — request không bao giờ bị
 * chặng 1 treo thêm vô hạn (Gemini busy đôi khi trả rất chậm).
 */
export const ANALYSIS_STAGE_BUDGET_MS = 25_000;

/** Trần thời gian TỪNG attempt — attempt 1 treo không được nuốt cả budget,
 *  phải chừa thời gian cho attempt retry phía sau. */
export const ANALYSIS_ATTEMPT_CAP_MS = 12_000;

/**
 * Mốc chặn retry star-guard của /api/interpret: request đã chạy quá X ms thì
 * BỎ lần luận lại (giữ bài + phụ chú hậu kiểm) thay vì nguy cơ vượt trần
 * maxDuration deploy (chặng 1 ≤25s + chặng 2 + regen retry full).
 */
export const INTERPRET_STAR_GUARD_DEADLINE_MS = 150_000;

export const buildAiConfig = (
  systemInstruction: string,
  options?: { maxOutputTokens?: number; responseMimeType?: string },
) => ({
  systemInstruction,
  maxOutputTokens: options?.maxOutputTokens ?? AI_MAX_OUTPUT_TOKENS,
  ...(options?.responseMimeType
    ? { responseMimeType: options.responseMimeType }
    : {}),
});