import express, { type Express } from "express";
import { registerRoutes } from "./routes";
import { jsonBodyErrorHandler } from "./jsonBodyError";

/** Express app without listen — dùng cho integration test (supertest). */
export function createApp(): Express {
  const app = express();
  registerRoutes(app);
  app.use(jsonBodyErrorHandler);
  return app;
}