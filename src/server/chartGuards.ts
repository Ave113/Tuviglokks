import type { Response } from "express";

export const assertChart12Palaces = (chartData: any, res: Response, contextMsg: string): boolean => {
  if (!Array.isArray(chartData?.palaces) || chartData.palaces.length < 12) {
    res.status(400).json({ error: contextMsg });
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