/**
 * Tên model Gemini dùng chung client + server.
 * API id: gemini-3.8-flash (primary) / gemini-3.5-flash-lite (fallback & lite).
 * @google/genai Model_2 cho phép string mở rộng nếu SDK chưa liệt kê id mới.
 */
export const GEMINI_MODEL_FLASH = "gemini-3.8-flash" as const;
export const GEMINI_MODEL_FLASH_LITE = "gemini-3.5-flash-lite" as const;

export type GeminiModelSelection = typeof GEMINI_MODEL_FLASH | typeof GEMINI_MODEL_FLASH_LITE;

export const DEFAULT_GEMINI_MODEL: GeminiModelSelection = GEMINI_MODEL_FLASH;

/**
 * KHÓA CỨNG (2026-10) cho phiên HỎI ĐÁP follow-up (/api/chat): luôn Lite — nhanh,
 * rẻ, đủ cho Q&A bám bài luận gốc. Server BỎ QUA modelSelection client gửi lên.
 * Luận giải gốc (lần đầu) vẫn do người dùng chọn model (mặc định Flash).
 */
export const DEFAULT_CHAT_GEMINI_MODEL: GeminiModelSelection = GEMINI_MODEL_FLASH_LITE;

/** Model dự phòng khi primary báo 503 / quá tải. */
export const GEMINI_FALLBACK_MODEL: GeminiModelSelection = GEMINI_MODEL_FLASH_LITE;

export const GEMINI_MODEL_OPTIONS: readonly GeminiModelSelection[] = [
  GEMINI_MODEL_FLASH,
  GEMINI_MODEL_FLASH_LITE,
];

export const GEMINI_MODEL_LABELS: Record<GeminiModelSelection, string> = {
  [GEMINI_MODEL_FLASH]: "Gemini 3.8 Flash",
  [GEMINI_MODEL_FLASH_LITE]: "Gemini 3.5 Flash Lite",
};

export function isGeminiModelSelection(value: unknown): value is GeminiModelSelection {
  return value === GEMINI_MODEL_FLASH || value === GEMINI_MODEL_FLASH_LITE;
}

/** Map lựa chọn UI → tên model gửi API (mặc định primary). */
export function resolveGeminiModelName(modelSelection: unknown): GeminiModelSelection {
  if (modelSelection === GEMINI_MODEL_FLASH_LITE) return GEMINI_MODEL_FLASH_LITE;
  return GEMINI_MODEL_FLASH;
}

/**
 * Kiểm tra model có thuộc phân cấp model thứ 2 (secondary / lite / fallback tier) không.
 * Thiết kế mở để trong tương lai khi model thứ 2 cập nhật tên/phiên bản mới,
 * hệ thống vẫn tự động nhận diện và áp dụng cơ chế nhất quán.
 */
export function isSecondaryModel(modelName: unknown): boolean {
  if (!modelName || typeof modelName !== "string") return false;
  const normalized = modelName.toLowerCase().trim();
  if (normalized === GEMINI_FALLBACK_MODEL.toLowerCase()) return true;
  if (normalized === GEMINI_MODEL_FLASH_LITE.toLowerCase()) return true;
  if (
    normalized !== GEMINI_MODEL_FLASH.toLowerCase() &&
    (normalized.includes("lite") ||
      normalized.includes("fallback") ||
      normalized.includes("secondary") ||
      normalized.includes("flash-lite") ||
      normalized.includes("nano"))
  ) {
    return true;
  }
  return false;
}
