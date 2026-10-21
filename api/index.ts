/**
 * Entrypoint serverless Vercel — vercel.json rewrite /api/* → /api/index.
 *
 * Không import thẳng `../server` (TypeScript ESM extensionless): Node trên
 * Vercel (`"type":"module"`) sẽ fail:
 *   ERR_MODULE_NOT_FOUND: Cannot find module '/var/task/server'
 *
 * Dùng bundle CJS do `npm run build` tạo ra (`dist/server.cjs`) — gói toàn bộ
 * local source, packages external (express, @google/genai, … từ node_modules).
 *
 * Dev/prod Node local: `npm run dev` | `npm start` (server.ts / dist/server.cjs).
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// esbuild CJS: default export Express app (export default app)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mod = require("../dist/server.cjs") as { default?: unknown } | unknown;
const app = (mod && typeof mod === "object" && "default" in mod && (mod as { default: unknown }).default) || mod;

export default app;
