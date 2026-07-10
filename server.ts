import dotenv from "dotenv";
import { resolveServerPort } from "./src/server/port";
import { attachFrontend, resolveFrontendMode } from "./src/server/attachFrontend";
import { createApp } from "./src/server/createApp";
import { describeServerKeyPolicy, isServerKeyAllowed } from "./src/server/chartGuards";
import { describeRateLimitPolicy } from "./src/server/rateLimit";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const app = createApp();
const PORT = resolveServerPort();

const frontendMode = resolveFrontendMode();
if (frontendMode === "vite-dev") {
  console.log("Starting in development mode with Vite middleware...");
} else if (frontendMode === "static") {
  console.log("Starting in production mode (serving dist/)...");
} else {
  console.log("Vercel serverless API mode — frontend served via vercel.json static.");
}

// Production hardening hints (no secrets printed).
console.log(`[security] ${describeServerKeyPolicy()}`);
console.log(`[security] ${describeRateLimitPolicy()}`);
if (
  (process.env.NODE_ENV === "production" || process.env.VERCEL) &&
  isServerKeyAllowed() &&
  process.env.GEMINI_API_KEY?.trim()
) {
  console.warn(
    "[security] Server key fallback is ON in production. " +
      "Anyone who can reach /api/* can spend your Gemini quota. " +
      "Set ALLOW_SERVER_KEY=0 (or remove ALLOW_SERVER_KEY=1) unless you intentionally host a free shared key.",
  );
}

void attachFrontend(app, { port: PORT, listen: !process.env.VERCEL }).catch((err) => {
  console.error("Failed to attach frontend layer:", err);
  process.exitCode = 1;
});

export default app;