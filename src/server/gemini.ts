import type { Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { buildAiConfig, FALLBACK_MODEL_ON_BUSY } from "./aiConfig";

export { resolveGeminiModelName as resolveModelName } from "../constants/geminiModels";

export type AiFailureKind = "prompt_blocked" | "safety" | "recitation" | "empty";

export class AiGenerationError extends Error {
  constructor(
    public kind: AiFailureKind,
    message: string,
    public finishReason?: string,
  ) {
    super(message);
    this.name = "AiGenerationError";
  }
}

export interface AiOutcome {
  text: string;
  finishReason: string;
  truncated: boolean;
}

/** Đọc text KHÔNG qua getter .text (tránh throw khi không có candidate). */
export const safeExtractText = (response: unknown): string => {
  const parts = (response as { candidates?: { content?: { parts?: unknown[] } }[] })?.candidates?.[0]
    ?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((p) => (typeof (p as { text?: unknown })?.text === "string" ? (p as { text: string }).text : ""))
    .join("")
    .trim();
};

const normalizeFinishReason = (raw: unknown): string => String(raw ?? "").toUpperCase();

/** Phân loại trả về của Gemini → lỗi có nghĩa thay vì "rỗng = nghẽn mạng". */
export const interpretResponse = (response: unknown): AiOutcome => {
  const r = response as {
    promptFeedback?: { blockReason?: string };
    candidates?: { finishReason?: string; content?: { parts?: unknown[] } }[];
  };

  const blockReason = r?.promptFeedback?.blockReason;
  if (blockReason) {
    throw new AiGenerationError(
      "prompt_blocked",
      `Yêu cầu bị Gemini chặn ở đầu vào (blockReason: ${blockReason}). KHÔNG phải nghẽn mạng — cần chỉnh nội dung.`,
    );
  }

  const candidate = r?.candidates?.[0];
  const finishReason = normalizeFinishReason(candidate?.finishReason);
  const text = safeExtractText(response);

  if (!candidate) {
    throw new AiGenerationError("empty", "Gemini không trả candidate nào.", finishReason);
  }
  if (finishReason === "SAFETY") {
    throw new AiGenerationError(
      "safety",
      "Gemini chặn phản hồi vì bộ lọc an toàn (SAFETY).",
      finishReason,
    );
  }
  if (finishReason === "RECITATION") {
    throw new AiGenerationError(
      "recitation",
      "Gemini chặn vì trùng nguồn (RECITATION).",
      finishReason,
    );
  }

  return { text, finishReason, truncated: finishReason === "MAX_TOKENS" };
};

const AI_GENERATION_USER_MESSAGES: Record<AiFailureKind, string> = {
  prompt_blocked: "Nội dung bị chặn bởi bộ lọc Gemini. Hãy điều chỉnh câu hỏi/dữ liệu rồi thử lại.",
  safety: "Phản hồi bị bộ lọc an toàn Gemini chặn. Retry sẽ không giúp được — cần đổi cách hỏi.",
  recitation: "Phản hồi bị chặn do trùng nguồn (RECITATION).",
  empty: "Gemini không sinh nội dung. Thử lại hoặc đổi mô hình.",
};

const sendAiGenerationError = (res: Response, error: AiGenerationError): void => {
  res.status(422).json({
    error: AI_GENERATION_USER_MESSAGES[error.kind],
    rateLimited: false,
  });
};

export const isBusyError = (rawMsg: string): boolean =>
  rawMsg.includes("503") ||
  rawMsg.toLowerCase().includes("unavailable") ||
  rawMsg.toLowerCase().includes("high demand") ||
  rawMsg.toLowerCase().includes("busy") ||
  rawMsg.toLowerCase().includes("spikes in demand");

export const createGeminiClient = (apiKey: string) =>
  new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

export const generateWithFallback = async (
  ai: GoogleGenAI,
  modelName: string,
  contents: string,
  systemInstruction: string,
  options?: { maxOutputTokens?: number },
): Promise<{ response: unknown; finalModelName: string; fallbackUsed: boolean }> => {
  let finalModelName = modelName;
  let fallbackUsed = false;
  const config = buildAiConfig(systemInstruction, options);
  try {
    const response = await ai.models.generateContent({
      model: finalModelName,
      contents,
      config,
    });
    return { response, finalModelName, fallbackUsed };
  } catch (firstError: any) {
    const rawMsg = firstError?.message || (typeof firstError === "string" ? firstError : JSON.stringify(firstError)) || "";
    if (isBusyError(rawMsg) && finalModelName !== FALLBACK_MODEL_ON_BUSY) {
      console.warn(`[Fallback Activator] ${finalModelName} reported 503/Busy. Dynamically routing to ${FALLBACK_MODEL_ON_BUSY} fallback...`);
      finalModelName = FALLBACK_MODEL_ON_BUSY;
      fallbackUsed = true;
      const response = await ai.models.generateContent({
        model: finalModelName,
        contents,
        config,
      });
      return { response, finalModelName, fallbackUsed };
    }
    throw firstError;
  }
};

/** Chuẩn hóa message lỗi từ @google/genai / fetch. */
export function extractRawErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Lỗi xử lý trên máy chủ.";
  }
}

export function isApiKeyInvalidError(rawMsg: string): boolean {
  const m = rawMsg.toLowerCase();
  return (
    m.includes("api key not valid") ||
    m.includes("api_key_invalid") ||
    m.includes("invalid api key") ||
    m.includes("api key expired") ||
    (m.includes("invalid_argument") && m.includes("api key")) ||
    m.includes("permission_denied") && m.includes("api key")
  );
}

export const sendAiError = (res: Response, error: unknown) => {
  if (error instanceof AiGenerationError) {
    sendAiGenerationError(res, error);
    return;
  }

  console.error("Lỗi AI:", error);
  const rawMsg = extractRawErrorMessage(error);
  let errMsg = "Đã xảy ra lỗi khi xử lý yêu cầu AI. Vui lòng thử lại sau.";
  let isRateLimit = false;
  let retryAfter = 30;
  let status = 500;

  if (isApiKeyInvalidError(rawMsg)) {
    status = 401;
    errMsg =
      "API Key Gemini không hợp lệ hoặc đã hết hạn. Hãy kiểm tra lại key tại Google AI Studio, dán vào ô BYOK rồi bấm LƯU, sau đó thử lại.";
  } else if (isBusyError(rawMsg)) {
    isRateLimit = true;
    retryAfter = 15;
    errMsg = "Hệ thống Google Gemini API đang quá tải tạm thời (503). Vui lòng đợi ~15 giây rồi gửi lại, hoặc chuyển sang Gemini 3.5 Flash Lite, hoặc dùng API Key cá nhân (BYOK).";
  } else if (rawMsg.includes("RESOURCE_EXHAUSTED") || rawMsg.includes("quota") || rawMsg.includes("429") || rawMsg.toLowerCase().includes("limit")) {
    isRateLimit = true;
    const secondsMatch = rawMsg.match(/retry in\s+([0-9.]+)\s*s/i);
    const delayMatch = rawMsg.match(/retryDelay:\s*"(\d+)/i);
    if (secondsMatch) retryAfter = Math.ceil(parseFloat(secondsMatch[1]));
    else if (delayMatch) retryAfter = parseInt(delayMatch[1], 10);
    errMsg = `Đã vượt hạn mức lượt dùng (Quota / Rate Limit) tạm thời. Hãy đợi ~${retryAfter} giây rồi thử lại, hoặc dùng API Key cá nhân (BYOK).`;
  }
  res.status(status).json({ error: errMsg, rateLimited: isRateLimit, retryAfter });
};

/** Verbose interpret error messages (original /api/interpret behavior). */
export const sendInterpretAiError = (res: Response, error: unknown) => {
  if (error instanceof AiGenerationError) {
    sendAiGenerationError(res, error);
    return;
  }

  console.error("Lỗi luận giải Tử Vi:", error);
  const rawMsg = extractRawErrorMessage(error);
  let errMsg = "Đã xảy ra lỗi khi xử lý yêu cầu AI. Vui lòng thử lại sau.";
  let isRateLimit = false;
  let retryAfter = 30;
  let status = 500;

  if (isApiKeyInvalidError(rawMsg)) {
    status = 401;
    errMsg =
      "API Key Gemini không hợp lệ hoặc đã hết hạn.\n\n" +
      "👉 Dán lại key từ Google AI Studio vào ô BYOK (thanh trên) → bấm LƯU → thử luận giải lại.\n" +
      "Key lỗi / copy thiếu / key project khác sẽ bị Google từ chối (không phải lỗi an lá số).";
  } else if (isBusyError(rawMsg)) {
    isRateLimit = true;
    retryAfter = 15;
    errMsg = `Hệ thống Google Gemini API (Phía Máy Chủ Google) hiện đang bị quá tải tạm thời (Trạng thái 503 — High Demand).\n\n` +
      `🔴 **LƯU Ý QUAN TRỌNG:** Đây hoàn toàn KHÔNG PHẢI lỗi do website hay ứng dụng này bị đơ/hỏng, mà do hàng triệu người trên thế giới đang cùng truy cập vào máy chủ miễn phí của Google dẫn tới nghẽn mạng cục bộ.\n\n` +
      `👉 **3 BƯỚC KHẮC PHỤC NGAY LẬP TỨC:**\n` +
      `1. **Lách nghẽn nhanh nhất:** Hãy nhấp chọn mô hình **Gemini 3.5 Flash Lite 🚀** ở khung lựa chọn bên dưới rồi bấm gửi lại (Mô hình này có hàng chờ riêng của Google, tải trọng nhẹ hơn nên phản hồi cực kỳ nhanh!).\n` +
      `2. **Thử lại tạm thời:** Đợi khoảng 15 giây (bộ đếm giây hiển thị ngay trên màn hình) rồi bấm 'Khởi Động Luận Giải' một lần nữa để thử lại.\n` +
      `3. **Giải phóng băng thông riêng:** Hãy đăng ký một **Google Gemini API Key** riêng hoàn toàn MIỄN PHÍ chỉ mất 30 giây tại nền tảng Google AI Studio, sau đó dán vào khung dán API Key cá nhân ở thanh màu tối trên cùng rồi bấm nút "LƯU". Bản mệnh của bạn sẽ được kết nối bằng đường truyền riêng độc bản chính chủ, không bao giờ lo bị nghẽn mạng chung nữa!`;
  } else if (
    rawMsg.includes("RESOURCE_EXHAUSTED") ||
    rawMsg.includes("quota") ||
    rawMsg.includes("429") ||
    rawMsg.toLowerCase().includes("limit")
  ) {
    isRateLimit = true;
    const secondsMatch = rawMsg.match(/retry in\s+([0-9.]+)\s*s/i);
    const delayMatch = rawMsg.match(/retryDelay:\s*"(\d+)/i);
    if (secondsMatch) {
      retryAfter = Math.ceil(parseFloat(secondsMatch[1]));
    } else if (delayMatch) {
      retryAfter = parseInt(delayMatch[1], 10);
    }

    errMsg = `Hệ thống nhận thấy số lượng yêu cầu của quý vị hoặc máy chủ đang vượt quá hạn mức lượt dùng (Quota / Rate Limit) tạm thời.\n\n` +
      `👉 **GIẢI PHÁP LẬP TỨC:**\n` +
      `1. Hãy đợi khoảng ${retryAfter} giây rồi bấm nút 'Khởi Động Luận Giải' để gửi lại một lần nữa (bộ đếm giây tự động hiển thị trên màn hình).\n` +
      `2. **Lách nghẽn mượt mà:** Chuyển sang mô hình khác như **Gemini 3.5 Flash Lite** bên dưới (thường có hạn mức miễn phí riêng biệt ít bị nghẽn hơn).\n` +
      `3. **Tối ưu nhất:** Hãy điền khóa API Gemini chính chủ của riêng bạn vào hộp **Nhập API Key cá nhân (BYOK)** ở thanh màu sẫm trên cùng. Cách tạo khóa hoàn toàn miễn phí, nhanh chóng tại Google AI Studio. Khi điền khóa cá nhân, quý vị sẽ có luồng gọi trực tiếp độc lập tuyệt đối và tránh được cảnh báo nghẽn mạng chung.`;
  }

  res.status(status).json({
    error: errMsg,
    rateLimited: isRateLimit,
    retryAfter,
  });
};