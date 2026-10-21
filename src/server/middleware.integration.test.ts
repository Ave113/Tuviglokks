import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { makeChartPayload } from "./test/fixtures";

describe("middleware chain (integration smoke)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  // createApp is pure (no env snapshot) — beforeAll avoids flaky 10s beforeEach under full-suite load
  describe("jsonChartPayload", () => {
    let app: import("express").Express;

    beforeAll(async () => {
      const { createApp } = await import("./createApp");
      app = createApp();
    }, 30_000);

    it("body JSON rác → 400", async () => {
      const res = await request(app)
        .post("/api/interpret")
        .set("Content-Type", "application/json")
        .send("{not valid json");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "JSON không hợp lệ." });
    });
  });

  describe("aiRateLimit", () => {
    it(
      "không BYOK, lần thứ 6 trong cửa sổ → 429",
      async () => {
        vi.stubEnv("RATE_LIMIT_FORCE", "1");
        vi.stubEnv("GEMINI_API_KEY", "server-test-key");
        vi.stubEnv("ALLOW_SERVER_KEY", "1");
        vi.resetModules();

        const { createApp } = await import("./createApp");
        const { installGeminiMock } = await import("./test/mockGemini");
        installGeminiMock({ defaultText: "D".repeat(250) });
        const app = createApp();

        const chartData = makeChartPayload();
        const payload = { chartData };

        for (let i = 0; i < 5; i += 1) {
          const res = await request(app).post("/api/interpret").send(payload);
          expect(res.status).toBe(200);
        }

        const sixth = await request(app).post("/api/interpret").send(payload);
        expect(sixth.status).toBe(429);
        expect(sixth.body.error).toBe("Quá nhiều yêu cầu, vui lòng thử lại sau ít phút.");
        expect(sixth.body.rateLimited).toBe(true);
        expect(sixth.body.retryAfter).toBe(60);
      },
      30_000,
    );
  });
});
