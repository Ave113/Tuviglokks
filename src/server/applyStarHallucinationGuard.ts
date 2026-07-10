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
}

/** Hậu kiểm đầu ra AI; retry một lần nếu bịa nặng (chính tinh / ≥3 sao). */
export async function applyStarHallucinationGuard(options: {
  ai: GoogleGenAI;
  modelName: string;
  prompt: string;
  systemInstruction: string;
  chartData: { palaces?: any[] };
  text: string;
  /** Truyền xuống generateContent (vd chat dùng trần output thấp hơn). */
  maxOutputTokens?: number;
}): Promise<StarGuardedText> {
  let audit = auditAiStarMentions(options.text, options.chartData);
  if (audit.severity !== "retry") {
    return { text: options.text, audit, retried: false };
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
  const { text: retryText } = interpretResponse(response);
  audit = auditAiStarMentions(retryText, options.chartData);

  if (audit.severity === "retry") {
    return {
      text: appendStarAuditDisclaimer(retryText, audit.hallucinated),
      audit,
      retried: true,
    };
  }

  return { text: retryText, audit, retried: true };
}