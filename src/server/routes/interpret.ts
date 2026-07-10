import type { Express, Request, Response } from "express";
import { buildInterpretSystemInstruction } from "../../knowledge/interpretSystemInstruction";
import { buildChartPromptContext } from "../../prompt/buildChartPromptContext";
import { buildInterpretUserPrompt } from "../../prompt/formatInterpretPrompt";
import { jsonChartPayload } from "../bodyLimits";
import { assertChart12Palaces, requireApiKey } from "../chartGuards";
import { applyStarHallucinationGuard } from "../applyStarHallucinationGuard";
import {
  createGeminiClient,
  generateWithFallback,
  interpretResponse,
  resolveModelName,
  sendInterpretAiError,
} from "../gemini";
import { aiRateLimit } from "../rateLimit";

const INTERPRET_SYSTEM_INSTRUCTION = buildInterpretSystemInstruction();
const MIN_VALID_LENGTH = 200;

export const registerInterpretRoute = (app: Express) => {
  app.post("/api/interpret", jsonChartPayload, aiRateLimit, async (req: Request, res: Response) => {
    try {
      const { chartData, customApiKey, modelSelection } = req.body;

      if (!chartData) {
        return res.status(400).json({ error: "Thiếu dữ liệu lá số Tử Vi." });
      }

      if (!assertChart12Palaces(
        chartData,
        res,
        "Dữ liệu lá số không hợp lệ: thiếu thông tin 12 cung. Vui lòng an lại lá số đầy đủ trước khi yêu cầu AI luận giải.",
      )) {
        return;
      }

      const resolved = requireApiKey(customApiKey, res);
      if (!resolved) return;

      const { apiKey, source } = resolved;
      const modelName = resolveModelName(modelSelection);
      const ai = createGeminiClient(apiKey);

      const ctx = buildChartPromptContext(chartData);
      const prompt = buildInterpretUserPrompt(ctx, chartData);

      console.log(`[Attempt] Initiating Gemini analysis with ${modelName} (key: ${source})...`);
      const { response, finalModelName, fallbackUsed } = await generateWithFallback(
        ai,
        modelName,
        prompt,
        INTERPRET_SYSTEM_INSTRUCTION,
      );

      const { text: rawText, truncated } = interpretResponse(response);

      if (rawText.length < MIN_VALID_LENGTH && !truncated) {
        return res.status(502).json({
          error: "Phản hồi trống bất thường. Vui lòng thử lại.",
          rateLimited: false,
        });
      }

      const guarded = await applyStarHallucinationGuard({
        ai,
        modelName: finalModelName,
        prompt,
        systemInstruction: INTERPRET_SYSTEM_INSTRUCTION,
        chartData,
        text: rawText,
      });

      res.json({
        interpretation: guarded.text,
        modelUsed: finalModelName,
        fallbackUsed,
        ...(truncated ? { truncated: true } : {}),
        ...(guarded.audit.warning ? { starAuditWarning: guarded.audit.warning } : {}),
        ...(guarded.retried ? { starAuditRetried: true } : {}),
        ...(guarded.audit.hallucinated.length
          ? { starHallucinated: guarded.audit.hallucinated }
          : {}),
      });
    } catch (error: any) {
      sendInterpretAiError(res, error);
    }
  });
};