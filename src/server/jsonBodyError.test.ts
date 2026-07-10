import express from "express";
import type { Server } from "http";
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  JSON_BODY_LIMIT,
  createJsonBodyParser,
  isJsonBodyParserError,
  sendJsonBodyError,
} from "./jsonBodyError";

describe("jsonBodyError", () => {
  it("JSON_BODY_LIMIT là 4mb", () => {
    expect(JSON_BODY_LIMIT).toBe("4mb");
  });

  it("nhận diện entity.too.large và entity.parse.failed", () => {
    expect(isJsonBodyParserError({ type: "entity.too.large", status: 413 })).toBe(true);
    expect(isJsonBodyParserError({ type: "entity.parse.failed", status: 400 })).toBe(true);

    const parseErr = Object.assign(new SyntaxError("Unexpected token"), {
      type: "entity.parse.failed",
      status: 400,
    });
    expect(isJsonBodyParserError(parseErr)).toBe(true);
    expect(isJsonBodyParserError(new SyntaxError("x"))).toBe(false);
    expect(isJsonBodyParserError(new Error("other"))).toBe(false);
  });

  it("sendJsonBodyError — payload quá lớn → 413", () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = { status, headersSent: false } as unknown as import("express").Response;

    sendJsonBodyError(res, { type: "entity.too.large", status: 413 });

    expect(status).toHaveBeenCalledWith(413);
    expect(json).toHaveBeenCalledWith({
      error: "Payload quá lớn (tối đa 4mb).",
    });
  });

  it("sendJsonBodyError — JSON lỗi → 400", () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = { status, headersSent: false } as unknown as import("express").Response;

    const err = Object.assign(new SyntaxError("Unexpected token"), {
      type: "entity.parse.failed",
      status: 400,
    });
    sendJsonBodyError(res, err);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: "JSON không hợp lệ." });
  });

  describe("createJsonBodyParser (integration)", () => {
    let server: Server | undefined;
    let baseUrl = "";

    afterEach(() => {
      server?.close();
      server = undefined;
      baseUrl = "";
    });

    async function listen(app: express.Express): Promise<void> {
      await new Promise<void>((resolve) => {
        server = app.listen(0, "127.0.0.1", () => {
          const addr = server!.address();
          if (addr && typeof addr === "object") {
            baseUrl = `http://127.0.0.1:${addr.port}`;
          }
          resolve();
        });
      });
    }

    it("trả 400 + JSON khi body không hợp lệ", async () => {
      const app = express();
      app.post("/test", createJsonBodyParser(), (_req, res) => res.json({ ok: true }));
      await listen(app);

      const res = await fetch(`${baseUrl}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{bad json",
      });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "JSON không hợp lệ." });
    });

    it("trả 413 khi payload vượt limit", async () => {
      const app = express();
      app.post("/tiny", createJsonBodyParser("32b"), (_req, res) => res.json({ ok: true }));
      await listen(app);

      const res = await fetch(`${baseUrl}/tiny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x: "payload lớn hơn 32 byte" }),
      });

      expect(res.status).toBe(413);
      expect(await res.json()).toEqual({ error: "Payload quá lớn (tối đa 32b)." });
    });
  });
});