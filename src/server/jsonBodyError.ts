import type { NextFunction, Request, RequestHandler, Response } from "express";
import express from "express";

export const JSON_BODY_LIMIT = "4mb";

type BodyParserErr = {
  type?: string;
  status?: number;
  statusCode?: number;
  message?: string;
};

export function isJsonBodyParserError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as BodyParserErr;
  if (e.type === "entity.too.large" || e.type === "entity.parse.failed") return true;
  const status = e.status ?? e.statusCode;
  return status === 413 || (status === 400 && err instanceof SyntaxError);
}

export function sendJsonBodyError(res: Response, err: unknown, limit: string = JSON_BODY_LIMIT): void {
  const e = (err ?? {}) as BodyParserErr;
  const status = e.status ?? e.statusCode;

  if (e.type === "entity.too.large" || status === 413) {
    res.status(413).json({
      error: `Payload quá lớn (tối đa ${limit}).`,
    });
    return;
  }

  if (e.type === "entity.parse.failed" || (err instanceof SyntaxError && status === 400)) {
    res.status(400).json({ error: "JSON không hợp lệ." });
    return;
  }

  const fallbackStatus = status && status >= 400 && status < 600 ? status : 400;
  res.status(fallbackStatus).json({
    error: e.message || "Không đọc được body JSON.",
  });
}

/** express.json có try/catch riêng — bọc callback để trả JSON thay vì throw qua stack. */
export function createJsonBodyParser(limit: string = JSON_BODY_LIMIT): RequestHandler {
  const parse = express.json({ limit });
  return (req, res, next) => {
    parse(req, res, (err?: unknown) => {
      if (err) {
        sendJsonBodyError(res, err, limit);
        return;
      }
      next();
    });
  };
}

/** Bắt lỗi body-parser còn sót (next(err)) — không lọt vào try/catch của route. */
export function jsonBodyErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (!isJsonBodyParserError(err)) {
    next(err);
    return;
  }
  sendJsonBodyError(res, err);
}