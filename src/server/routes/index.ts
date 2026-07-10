import type { Express } from "express";
import { registerInterpretRoute } from "./interpret";
import { registerChatRoute } from "./chat";

export const registerRoutes = (app: Express) => {
  registerInterpretRoute(app);
  registerChatRoute(app);
};
