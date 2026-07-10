/**
 * Tên model Gemini dùng chung client + server.
 * @google/genai@2.4 — cả hai có trong union Model_2 (genai.d.ts).
 */
export const GEMINI_MODEL_FLASH = "gemini-3.5-flash" as const;
export const GEMINI_MODEL_FLASH_LITE = "gemini-3.1-flash-lite" as const;

export type GeminiModelSelection = typeof GEMINI_MODEL_FLASH | typeof GEMINI_MODEL_FLASH_LITE;

export const DEFAULT_GEMINI_MODEL: GeminiModelSelection = GEMINI_MODEL_FLASH;

/** Model dự phòng khi primary báo 503 / quá tải. */
export const GEMINI_FALLBACK_MODEL: GeminiModelSelection = GEMINI_MODEL_FLASH_LITE;

export const GEMINI_MODEL_OPTIONS: readonly GeminiModelSelection[] = [
  GEMINI_MODEL_FLASH,
  GEMINI_MODEL_FLASH_LITE,
];

export const GEMINI_MODEL_LABELS: Record<GeminiModelSelection, string> = {
  [GEMINI_MODEL_FLASH]: "Gemini 3.5 Flash",
  [GEMINI_MODEL_FLASH_LITE]: "Gemini 3.1 Lite",
};

export function isGeminiModelSelection(value: unknown): value is GeminiModelSelection {
  return value === GEMINI_MODEL_FLASH || value === GEMINI_MODEL_FLASH_LITE;
}

/** Map lựa chọn UI → tên model gửi API (mặc định primary). */
export function resolveGeminiModelName(modelSelection: unknown): GeminiModelSelection {
  if (modelSelection === GEMINI_MODEL_FLASH_LITE) return GEMINI_MODEL_FLASH_LITE;
  return GEMINI_MODEL_FLASH;
}