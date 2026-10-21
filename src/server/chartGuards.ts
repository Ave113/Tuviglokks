import type { Response } from "express";
import { BRANCHES_VI } from "../utils/chartRelations";

const EARTHLY_BRANCH_SET = new Set(BRANCHES_VI);

export const CHART_INVALID_12_MSG =
  "Dữ liệu lá số không hợp lệ: thiếu thông tin 12 cung. Vui lòng an lại lá số đầy đủ trước khi yêu cầu AI luận giải.";

export const CHART_INVALID_SCHEMA_MSG =
  "Dữ liệu lá số không hợp lệ: 12 cung phải có tên, địa chi, index 0–11 duy nhất. Vui lòng an lại lá số.";

export type ChartValidateOk = { ok: true };
export type ChartValidateFail = { ok: false; message: string };
export type ChartValidateResult = ChartValidateOk | ChartValidateFail;

/**
 * Validate payload chart tối thiểu trước khi gọi Gemini.
 * - Đủ đúng 12 cung
 * - Mỗi cung: name non-empty, earthlyBranch ∈ 12 chi, index integer 0–11
 * - 12 index và 12 địa chi đều unique (tránh mảng rác / duplicate)
 */
export function validateChart12Palaces(chartData: unknown): ChartValidateResult {
  if (chartData == null || typeof chartData !== "object") {
    return { ok: false, message: CHART_INVALID_12_MSG };
  }

  const palaces = (chartData as { palaces?: unknown }).palaces;
  if (!Array.isArray(palaces) || palaces.length !== 12) {
    return { ok: false, message: CHART_INVALID_12_MSG };
  }

  const seenIndexes = new Set<number>();
  const seenBranches = new Set<string>();

  for (let i = 0; i < palaces.length; i++) {
    const p = palaces[i];
    if (p == null || typeof p !== "object") {
      return { ok: false, message: CHART_INVALID_SCHEMA_MSG };
    }

    const rec = p as Record<string, unknown>;
    const name = typeof rec.name === "string" ? rec.name.trim() : "";
    if (!name) {
      return { ok: false, message: CHART_INVALID_SCHEMA_MSG };
    }

    const branch = typeof rec.earthlyBranch === "string" ? rec.earthlyBranch.trim() : "";
    if (!EARTHLY_BRANCH_SET.has(branch)) {
      return { ok: false, message: CHART_INVALID_SCHEMA_MSG };
    }

    const index = rec.index;
    if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index > 11) {
      return { ok: false, message: CHART_INVALID_SCHEMA_MSG };
    }

    if (seenIndexes.has(index) || seenBranches.has(branch)) {
      return { ok: false, message: CHART_INVALID_SCHEMA_MSG };
    }
    seenIndexes.add(index);
    seenBranches.add(branch);
  }

  if (seenIndexes.size !== 12 || seenBranches.size !== 12) {
    return { ok: false, message: CHART_INVALID_SCHEMA_MSG };
  }

  return { ok: true };
}

/** Express helper — 400 + JSON khi chart không hợp lệ. */
export const assertChart12Palaces = (
  chartData: unknown,
  res: Response,
  contextMsg?: string,
): boolean => {
  const result = validateChart12Palaces(chartData);
  if (result.ok === false) {
    // Giữ message ngữ cảnh route cho lỗi “thiếu 12 cung”; schema lỗi dùng message cụ thể.
    const msg =
      result.message === CHART_INVALID_12_MSG && contextMsg ? contextMsg : result.message;
    res.status(400).json({ error: msg });
    return false;
  }
  return true;
};

export type KeySource = "byok" | "server";

export interface ResolvedKey {
  apiKey: string;
  source: KeySource;
}

export type KeyEnv = {
  GEMINI_API_KEY?: string;
  ALLOW_SERVER_KEY?: string;
  NODE_ENV?: string;
  VERCEL?: string;
};

export const API_KEY_MISSING_MESSAGE =
  "Chưa có API key: nhập Gemini API Key cá nhân (BYOK), hoặc bật ALLOW_SERVER_KEY=1 kèm GEMINI_API_KEY phía máy chủ.";

/**
 * Production-safe default cho key server:
 * - ALLOW_SERVER_KEY=0|false → cấm (ép BYOK)
 * - ALLOW_SERVER_KEY=1|true  → cho phép
 * - Không set: dev cho phép; production / Vercel **cấm** (opt-in)
 */
export function isServerKeyAllowed(env: KeyEnv = process.env): boolean {
  const flag = env.ALLOW_SERVER_KEY?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "no") return false;
  if (flag === "1" || flag === "true" || flag === "yes") return true;

  const isProdLike = env.NODE_ENV === "production" || !!env.VERCEL;
  return !isProdLike;
}

/** Ưu tiên key người dùng (BYOK); fallback key server nếu được phép. */
export const resolveApiKey = (
  customApiKey: unknown,
  env: KeyEnv = process.env,
): ResolvedKey | null => {
  const byok = typeof customApiKey === "string" ? customApiKey.trim() : "";
  if (byok) return { apiKey: byok, source: "byok" };

  const serverKey = env.GEMINI_API_KEY?.trim();
  if (serverKey && isServerKeyAllowed(env)) {
    return { apiKey: serverKey, source: "server" };
  }
  return null;
};

export const requireApiKey = (
  customApiKey: unknown,
  res: Response,
  env: KeyEnv = process.env,
): ResolvedKey | null => {
  const resolved = resolveApiKey(customApiKey, env);
  if (!resolved) {
    res.status(400).json({ error: API_KEY_MISSING_MESSAGE });
    return null;
  }
  return resolved;
};

/** Log/startup: mô tả policy key (không lộ giá trị key). */
export function describeServerKeyPolicy(env: KeyEnv = process.env): string {
  const hasServerKey = Boolean(env.GEMINI_API_KEY?.trim());
  const allowed = isServerKeyAllowed(env);
  if (!hasServerKey) {
    return "Server Gemini key: not configured (BYOK required).";
  }
  if (allowed) {
    return "Server Gemini key: ENABLED as fallback (set ALLOW_SERVER_KEY=0 to force BYOK).";
  }
  return "Server Gemini key: present but DISABLED (prod-safe default / ALLOW_SERVER_KEY=0). Users must use BYOK.";
}
