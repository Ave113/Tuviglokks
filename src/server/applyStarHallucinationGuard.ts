import type { GoogleGenAI } from "@google/genai";
import { generateWithFallback, interpretResponse } from "./gemini";
import {
  appendStarAuditDisclaimer,
  auditAiStarMentions,
  buildStarGuardRetryAddon,
  type StarAuditResult,
} from "./starHallucinationGuard";

export interface StarGuardedText {
  text: string;
  audit: StarAuditResult;
  retried: boolean;
  /** Bản retry bị chạm trần đầu ra (MAX_TOKENS) — cần báo cho client. */
  truncated: boolean;
}

/** Hậu kiểm đầu ra AI; retry một lần nếu bịa nặng (chính tinh / ≥3 sao). */
export async function applyStarHallucinationGuard(options: {
  ai: GoogleGenAI;
  modelName: string;
  prompt: string;
  systemInstruction: string;
  chartData: { palaces?: any[] };
  text: string;
  /** Truyền xuống generateContent (vd chat dùng trần đầu ra thấp hơn). */
  maxOutputTokens?: number;
  /**
   * (Tuỳ chọn) Mốc epoch ms — quá hạn thì BỎ 1 lần luận lại, giữ bản gốc +
   * phụ chú hậu kiểm. Dùng cho /api/interpret để không vượt maxDuration deploy.
   */
  deadlineMs?: number;
}): Promise<StarGuardedText> {
  let audit = auditAiStarMentions(options.text, options.chartData);
  if (audit.severity !== "retry") {
    return { text: options.text, audit, retried: false, truncated: false };
  }

  if (options.deadlineMs != null && Date.now() > options.deadlineMs) {
    console.warn(
      "[StarGuard] Quá mốc an toàn thời gian — bỏ 1 lần luận lại, giữ bản gốc + phụ chú hậu kiểm.",
    );
    return {
      text: appendStarAuditDisclaimer(options.text, audit.hallucinated),
      audit,
      retried: false,
      truncated: false,
    };
  }

  console.warn(
    `[StarGuard] Phát hiện sao không có trên lá (${audit.hallucinated.join(", ")}). Luận lại 1 lần...`,
  );

  const addon = buildStarGuardRetryAddon(audit);
  const genOpts =
    options.maxOutputTokens != null ? { maxOutputTokens: options.maxOutputTokens } : undefined;
  const { response } = await generateWithFallback(
    options.ai,
    options.modelName,
    options.prompt + addon.userAddon,
    options.systemInstruction + addon.systemSuffix,
    genOpts,
  );
  const { text: retryText, truncated: retryTruncated } = interpretResponse(response);
  audit = auditAiStarMentions(retryText, options.chartData);

  if (audit.severity === "retry") {
    return {
      text: appendStarAuditDisclaimer(retryText, audit.hallucinated),
      audit,
      retried: true,
      truncated: Boolean(retryTruncated),
    };
  }

  return { text: retryText, audit, retried: true, truncated: Boolean(retryTruncated) };
}