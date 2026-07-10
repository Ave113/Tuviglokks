import type { Express } from "express";
import express from "express";
import path from "path";

export type FrontendMode = "vite-dev" | "static" | "api-only";

/** Chế độ phục vụ frontend — thuần hàm để test, không phụ thuộc side effect. */
export function resolveFrontendMode(
  env: { NODE_ENV?: string; VERCEL?: string } = process.env,
): FrontendMode {
  if (env.NODE_ENV !== "production") return "vite-dev";
  if (env.VERCEL) return "api-only";
  return "static";
}

export interface AttachFrontendOptions {
  port: number;
  /** Gọi app.listen — false trên Vercel serverless (platform tự bind). */
  listen: boolean;
}

/**
 * Gắn lớp phục vụ UI vào Express:
 * - vite-dev: dynamic import vite (chỉ dev local)
 * - static: dist/ + SPA fallback (npm start trên Node)
 * - api-only: bỏ qua (Vercel: static do vercel.json)
 */
export async function attachFrontend(
  app: Express,
  options: AttachFrontendOptions,
): Promise<void> {
  const mode = resolveFrontendMode();

  if (mode === "api-only") {
    return;
  }

  if (mode === "vite-dev") {
    await attachViteDevMiddleware(app, options);
    return;
  }

  attachProductionStatic(app, options);
}

async function attachViteDevMiddleware(
  app: Express,
  { port, listen }: AttachFrontendOptions,
): Promise<void> {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  if (listen) {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Express server running on port ${port}`);
    });
  }
}

function attachProductionStatic(
  app: Express,
  { port, listen }: AttachFrontendOptions,
): void {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  if (listen) {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Express server running on port ${port}`);
    });
  }
}