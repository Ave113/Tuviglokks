import rateLimit from "express-rate-limit";
import type { Request, RequestHandler } from "express";

/** BYOK: quota của người dùng — bỏ qua rate-limit. Key server: siết chặt. */
export const SERVER_KEY_RATE_LIMIT_MAX = 5;
export const SERVER_KEY_RATE_LIMIT_WINDOW_MS = 60_000;
export const SERVER_KEY_RATE_LIMIT_RETRY_AFTER_SEC = Math.ceil(
  SERVER_KEY_RATE_LIMIT_WINDOW_MS / 1000,
);

export const RATE_LIMIT_MESSAGE = "Quá nhiều yêu cầu, vui lòng thử lại sau ít phút.";

/** Độ dài tối thiểu để coi là BYOK thật (chặn bypass bằng "x" / rác ngắn). */
export const BYOK_MIN_LENGTH_FOR_BYPASS = 24;

export type RateLimitEnv = {
  VERCEL?: string;
  RATE_LIMIT_FORCE?: string;
  NODE_ENV?: string;
};

/**
 * Rate-limit AI routes — mặc định **BẬT** (kể cả Vercel per-instance, yếu hơn Redis).
 *
 * - BYOK **hợp lệ** (độ dài + shape) → bypass (quota của user).
 * - Key server / BYOK giả ngắn → 5 req/phút/IP.
 *
 * Vercel: counter in-memory không chia sẻ instance — vẫn bật làm lớp mỏng.
 * RATE_LIMIT_FORCE=0 → tắt hẳn. RATE_LIMIT_FORCE=1 → ép bật (tương thích cũ).
 */
export function isAiRateLimitActive(env: RateLimitEnv = process.env): boolean {
  const force = env.RATE_LIMIT_FORCE?.trim();
  if (force === "0" || force === "false" || force === "no") return false;
  if (force === "1" || force === "true" || force === "yes") return true;
  // Mặc định ON (Node + Vercel). Trước đây OFF trên Vercel — quá dễ spam key server.
  return true;
}

/**
 * BYOK đủ “thật” để bypass rate-limit (không phải chuỗi rác ngắn).
 * Vẫn cho phép shape Gemini cổ điển (AIza…) và AI Studio mới (AQ.…).
 */
export function isPlausibleByokKey(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  const k = raw.trim();
  if (k.length < BYOK_MIN_LENGTH_FOR_BYPASS) return false;

  // Google AI Studio / Gemini API key shapes phổ biến
  if (/^AIza[A-Za-z0-9_-]{20,}$/.test(k)) return true;
  if (/^AQ\.[A-Za-z0-9._-]{20,}$/.test(k)) return true;

  // Secret dài generic: có chữ + số, tránh "xxxxxxxx..." thuần
  if (k.length >= 32 && /[A-Za-z]/.test(k) && /[0-9]/.test(k) && /^[A-Za-z0-9._\-]+$/.test(k)) {
    return true;
  }
  return false;
}

export function shouldBypassAiRateLimit(req: Pick<Request, "body">): boolean {
  return isPlausibleByokKey(req.body?.customApiKey);
}

export function createAiRateLimiter(env: RateLimitEnv = process.env): RequestHandler {
  if (!isAiRateLimitActive(env)) {
    return (_req, _res, next) => next();
  }

  const serverKeyLimiter = rateLimit({
    windowMs: SERVER_KEY_RATE_LIMIT_WINDOW_MS,
    max: SERVER_KEY_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: RATE_LIMIT_MESSAGE,
        rateLimited: true,
        retryAfter: SERVER_KEY_RATE_LIMIT_RETRY_AFTER_SEC,
      });
    },
  });

  return (req, res, next) => {
    if (shouldBypassAiRateLimit(req)) {
      next();
      return;
    }
    serverKeyLimiter(req, res, next);
  };
}

/** Middleware dùng chung cho /api/interpret, /api/chat. */
export const aiRateLimit = createAiRateLimiter();

/** Mô tả trạng thái rate-limit cho log startup (không lộ secret). */
export function describeRateLimitPolicy(env: RateLimitEnv = process.env): string {
  if (isAiRateLimitActive(env)) {
    const vercelNote = env.VERCEL
      ? " (Vercel: per-instance only — prefer Firewall/Redis for strong limits)"
      : "";
    return (
      `AI rate-limit: ON — ${SERVER_KEY_RATE_LIMIT_MAX} req/${SERVER_KEY_RATE_LIMIT_RETRY_AFTER_SEC}s/IP ` +
      `for non-BYOK traffic; plausible BYOK bypasses${vercelNote}.`
    );
  }
  return "AI rate-limit: OFF (RATE_LIMIT_FORCE=0). Unprotected against spam on server-key traffic.";
}
