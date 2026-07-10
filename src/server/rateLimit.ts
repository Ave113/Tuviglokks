import rateLimit from "express-rate-limit";
import type { Request, RequestHandler } from "express";

/** BYOK: quota của người dùng — bỏ qua rate-limit. Key server: siết chặt. */
export const SERVER_KEY_RATE_LIMIT_MAX = 5;
export const SERVER_KEY_RATE_LIMIT_WINDOW_MS = 60_000;
export const SERVER_KEY_RATE_LIMIT_RETRY_AFTER_SEC = Math.ceil(
  SERVER_KEY_RATE_LIMIT_WINDOW_MS / 1000,
);

export const RATE_LIMIT_MESSAGE = "Quá nhiều yêu cầu, vui lòng thử lại sau ít phút.";

export type RateLimitEnv = {
  VERCEL?: string;
  RATE_LIMIT_FORCE?: string;
  NODE_ENV?: string;
};

/**
 * Rate-limit AI routes.
 *
 * - Có BYOK trong body → bỏ qua (tiền/quota của họ).
 * - Dùng key server (không BYOK) → tối đa 5 req/phút/IP.
 *
 * Lưu ý Vercel serverless: counter in-memory không chia sẻ giữa instances/cold start
 * → hiệu lực hạn chế. Bật khi tự host (npm start); trên Vercel nên dùng Firewall/Redis.
 * Set RATE_LIMIT_FORCE=1 để ép bật trên Vercel (dev/test) — vẫn không thay Redis/Firewall.
 */
export function isAiRateLimitActive(env: RateLimitEnv = process.env): boolean {
  if (env.RATE_LIMIT_FORCE === "1") return true;
  return !env.VERCEL;
}

export function shouldBypassAiRateLimit(req: Pick<Request, "body">): boolean {
  const byok = typeof req.body?.customApiKey === "string" ? req.body.customApiKey.trim() : "";
  return byok.length > 0;
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
    return `AI rate-limit: ON — ${SERVER_KEY_RATE_LIMIT_MAX} req/${SERVER_KEY_RATE_LIMIT_RETRY_AFTER_SEC}s/IP for server-key traffic (BYOK bypasses).`;
  }
  return (
    "AI rate-limit: OFF on this host (Vercel in-memory counters are unreliable). " +
    "Use Vercel Firewall / Upstash Redis, or set RATE_LIMIT_FORCE=1 for weak per-instance limiting only."
  );
}