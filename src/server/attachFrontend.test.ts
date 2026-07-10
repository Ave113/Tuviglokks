import { describe, it, expect } from "vitest";
import { resolveFrontendMode } from "./attachFrontend";

describe("resolveFrontendMode", () => {
  it("dev local → vite-dev", () => {
    expect(resolveFrontendMode({ NODE_ENV: "development" })).toBe("vite-dev");
    expect(resolveFrontendMode({})).toBe("vite-dev");
  });

  it("production Node (npm start) → static", () => {
    expect(resolveFrontendMode({ NODE_ENV: "production" })).toBe("static");
  });

  it("Vercel serverless → api-only (không gắn Vite/static vào function)", () => {
    expect(resolveFrontendMode({ NODE_ENV: "production", VERCEL: "1" })).toBe("api-only");
  });

  it("dev trên Vercel preview vẫn vite-dev nếu NODE_ENV không phải production", () => {
    expect(resolveFrontendMode({ NODE_ENV: "development", VERCEL: "1" })).toBe("vite-dev");
  });
});