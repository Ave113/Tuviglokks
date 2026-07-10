import type { GoogleGenAI } from "@google/genai";
import { vi } from "vitest";
import * as gemini from "../gemini";

export function makeGeminiResponse(text: string, finishReason = "STOP") {
  return {
    candidates: [{ finishReason, content: { parts: [{ text }] } }],
  };
}

export type GeminiCallContext = { model: string; callIndex: number };

export type GeminiMockItem =
  | unknown
  | Error
  | ((ctx: GeminiCallContext) => unknown | Error);

export interface GeminiMockPlan {
  queue?: GeminiMockItem[];
  defaultText?: string;
}

/**
 * Mock Gemini ở ranh giới network — chỉ thay createGeminiClient.
 * generateWithFallback + guard retry vẫn chạy thật trên fake client.
 */
export function installGeminiMock(plan: GeminiMockPlan = {}) {
  const modelsUsed: string[] = [];
  let callIndex = 0;

  const generateContent = vi.fn(async ({ model }: { model: string }) => {
    modelsUsed.push(model);
    const item = plan.queue?.[callIndex];
    callIndex += 1;

    if (typeof item === "function") {
      const result = item({ model, callIndex: callIndex - 1 });
      if (result instanceof Error) throw result;
      return result;
    }
    if (item instanceof Error) throw item;
    if (item !== undefined) return item;

    const text = plan.defaultText ?? "A".repeat(250);
    return makeGeminiResponse(text);
  });

  const client = { models: { generateContent } } as unknown as GoogleGenAI;
  vi.spyOn(gemini, "createGeminiClient").mockReturnValue(client);

  return { generateContent, modelsUsed };
}

export function restoreGeminiMock() {
  vi.restoreAllMocks();
}