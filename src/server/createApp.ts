import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { registerRoutes } from "./routes";
import { jsonBodyErrorHandler } from "./jsonBodyError";

/** Express app without listen — dùng cho integration test (supertest). */
export function createApp(): Express {
  const app = express();
  // Vercel (và reverse proxy) set X-Forwarded-For. Cần trust proxy để
  // express-rate-limit lấy đúng IP — tránh ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
  if (process.env.VERCEL || process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
  }
  registerRoutes(app);
  app.use(jsonBodyErrorHandler);
  // Bắt lỗi chưa catch → luôn JSON (tránh HTML 500 khiến UI báo "không đọc được JSON")
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    console.error("[createApp] Unhandled error:", err);
    const msg =
      err instanceof Error && err.message
        ? err.message
        : "Lỗi máy chủ không xác định. Hãy thử lại hoặc restart server.";
    res.status(500).json({ error: msg, rateLimited: false });
  });
  return app;
}