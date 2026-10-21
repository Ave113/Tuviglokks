import React from "react";
import { DEFAULT_GEMINI_MODEL, type GeminiModelSelection } from "../constants/geminiModels";
import type {
  ChatTurn,
  InterpretChartData,
  InterpretStructureIssues,
  SavedInterpretation,
} from "../types";
import { loadByokKey } from "../utils/byokStorage";
import { buildInterpretPayload } from "./buildInterpretPayload";

/** Parse JSON body safely — proxy/HTML/empty responses must not throw opaque SyntaxError. */
async function readJsonBody(response: Response): Promise<Record<string, any>> {
  const raw = await response.text();
  if (!raw.trim()) {
    if (response.ok) return {};
    throw new Error(
      `Lỗi máy chủ (${response.status}): phản hồi rỗng. Hãy restart server (npm run dev) rồi thử lại.`,
    );
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, any>;
    }
    return {};
  } catch {
    const looksHtml = /^\s*</.test(raw) || /<!DOCTYPE/i.test(raw);
    const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 120);
    throw new Error(
      response.ok
        ? "Phản hồi máy chủ không phải JSON hợp lệ."
        : looksHtml
          ? `Lỗi máy chủ (${response.status}): server trả HTML thay vì JSON — thường do server crash hoặc chưa restart sau khi sửa code. Hãy dừng terminal, chạy lại npm run dev, rồi thử luận giải.`
          : `Lỗi máy chủ (${response.status}). Phản hồi không đọc được dạng JSON. Gợi ý: ${snippet || "(rỗng)"}`,
    );
  }
}

export function useAI() {
  const [apiKey, setApiKey] = React.useState("");
  const [modelSelection, setModelSelection] = React.useState<GeminiModelSelection>(DEFAULT_GEMINI_MODEL);
  const [retryCountdown, setRetryCountdown] = React.useState(0);

  const [interpretation, setInterpretation] = React.useState<string | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [modelUsedResult, setModelUsedResult] = React.useState("");
  const [fallbackUsedResult, setFallbackUsedResult] = React.useState(false);
  /** Cảnh báo star guard từ /api/interpret (soft / sau retry). */
  const [starAuditWarning, setStarAuditWarning] = React.useState<string | null>(null);
  const [starHallucinated, setStarHallucinated] = React.useState<string[]>([]);
  const [starAuditRetried, setStarAuditRetried] = React.useState(false);
  /** Bài bị chạm trần đầu ra (MAX_TOKENS) — UI cảnh báo thay vì im lặng. */
  const [truncated, setTruncated] = React.useState(false);
  /** Thiếu phần/heading bắt buộc từ hậu kiểm chặng 3. */
  const [structureIssues, setStructureIssues] = React.useState<InterpretStructureIssues | null>(null);

  const [chatTurns, setChatTurns] = React.useState<ChatTurn[]>([]);
  const [lastChartPayload, setLastChartPayload] = React.useState<InterpretChartData | null>(null);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatError, setChatError] = React.useState<string | null>(null);
  const [chatStarAuditWarning, setChatStarAuditWarning] = React.useState<string | null>(null);

  React.useEffect(() => {
    const key = loadByokKey();
    if (key) setApiKey(key);
  }, []);

  React.useEffect(() => {
    if (retryCountdown <= 0) return;
    const interval = setInterval(() => setRetryCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [retryCountdown]);

  const resetForRecalculation = React.useCallback(() => {
    setInterpretation(null);
    setAiError(null);
    setStarAuditWarning(null);
    setStarHallucinated([]);
    setStarAuditRetried(false);
    setTruncated(false);
    setStructureIssues(null);
    setChatStarAuditWarning(null);
  }, []);

  /**
   * Restore sớ + chat từ hồ sơ.
   * `fallbackChartData`: khi hồ sơ cũ thiếu chartData (bug save cũ) — rebuild từ lá vừa an.
   */
  const restoreFromSaved = React.useCallback(
    (saved?: SavedInterpretation, fallbackChartData?: InterpretChartData | null) => {
      if (saved?.content) {
        setInterpretation(saved.content);
        setModelUsedResult(saved.modelUsed || "");
        setChatTurns(Array.isArray(saved.chat) ? saved.chat : []);
        setLastChartPayload(saved.chartData ?? fallbackChartData ?? null);
      } else {
        setInterpretation(null);
        setChatTurns([]);
        setLastChartPayload(null);
      }
      setChatError(null);
      setStarAuditWarning(null);
      setStarHallucinated([]);
      setStarAuditRetried(false);
      setTruncated(false);
      setStructureIssues(null);
      setChatStarAuditWarning(null);
    },
    [],
  );

  const handleTriggerInterpret = React.useCallback(
    async (
      calculated: any,
      transitYear: number,
      persistInterpretation: (patch: Partial<SavedInterpretation>) => void,
    ) => {
      if (!calculated) return;

      setAiLoading(true);
      setAiError(null);
      setInterpretation(null);
      setModelUsedResult("");
      setFallbackUsedResult(false);
      setStarAuditWarning(null);
      setStarHallucinated([]);
      setStarAuditRetried(false);
      setTruncated(false);
      setStructureIssues(null);
      setChatStarAuditWarning(null);

      const formattedPayload = buildInterpretPayload(calculated, transitYear);

      try {
        const response = await fetch("/api/interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chartData: formattedPayload,
            customApiKey: apiKey.trim(),
            modelSelection,
          }),
        });

        const data = await readJsonBody(response);
        if (!response.ok) {
          if (data.rateLimited && data.retryAfter) setRetryCountdown(data.retryAfter);
          throw new Error(data.error || "Lỗi bất định từ dịch vụ AI.");
        }

        setInterpretation(data.interpretation);
        setModelUsedResult(data.modelUsed || DEFAULT_GEMINI_MODEL);
        setFallbackUsedResult(!!data.fallbackUsed);
        setStarAuditWarning(
          typeof data.starAuditWarning === "string" && data.starAuditWarning.trim()
            ? data.starAuditWarning.trim()
            : null,
        );
        setStarHallucinated(
          Array.isArray(data.starHallucinated)
            ? data.starHallucinated.map((s: unknown) => String(s)).filter(Boolean)
            : [],
        );
        setStarAuditRetried(!!data.starAuditRetried);
        setTruncated(!!data.truncated);
        const rawStructure = data.structureIssues;
        const normalizedStructure =
          rawStructure && typeof rawStructure === "object"
            ? {
                missingParts: Array.isArray(rawStructure.missingParts)
                  ? rawStructure.missingParts
                    .map((n: unknown) => Number(n))
                    .filter((n: number) => Number.isFinite(n))
                  : [],
                missingHeadings: Array.isArray(rawStructure.missingHeadings)
                  ? rawStructure.missingHeadings
                    .map((h: unknown) => String(h))
                    .filter(Boolean)
                  : [],
              }
            : null;
        setStructureIssues(
          normalizedStructure &&
            (normalizedStructure.missingParts.length || normalizedStructure.missingHeadings.length)
            ? normalizedStructure
            : null,
        );
        setLastChartPayload(formattedPayload);
        setChatTurns([]);

        persistInterpretation({
          content: data.interpretation,
          modelUsed: data.modelUsed || DEFAULT_GEMINI_MODEL,
          transitYear,
          createdAt: new Date().toISOString(),
          chat: [],
          chartData: formattedPayload,
        });
      } catch (err: any) {
        console.error(err);
        setAiError(err.message || "Không thể kết nối với máy chủ AI luận giải.");
      } finally {
        setAiLoading(false);
      }
    },
    [apiKey, modelSelection],
  );

  const handleAskFollowUp = React.useCallback(
    async (question: string, persistInterpretation: (patch: Partial<SavedInterpretation>) => void) => {
      const q = question.trim();
      if (!q || !interpretation) return;

      setChatLoading(true);
      setChatError(null);
      setChatStarAuditWarning(null);
      const history = [...chatTurns];
      const nextTurns: ChatTurn[] = [...chatTurns, { role: "user", content: q }];
      setChatTurns(nextTurns);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseInterpretation: interpretation,
            chartData: lastChartPayload,
            history,
            question: q,
            customApiKey: apiKey.trim(),
            // Không gửi modelSelection: /api/chat luôn dùng Gemini 3.5 Flash-Lite (mặc định server).
          }),
        });
        const data = await readJsonBody(response);
        if (!response.ok) {
          if (data.rateLimited && data.retryAfter) setRetryCountdown(data.retryAfter);
          throw new Error(data.error || "Lỗi bất định từ dịch vụ AI.");
        }
        const finalTurns: ChatTurn[] = [...nextTurns, { role: "assistant", content: data.answer }];
        setChatTurns(finalTurns);
        if (typeof data.starAuditWarning === "string" && data.starAuditWarning.trim()) {
          setChatStarAuditWarning(data.starAuditWarning.trim());
        }
        persistInterpretation({ chat: finalTurns });
      } catch (err: any) {
        console.error(err);
        setChatError(err.message || "Không thể kết nối máy chủ hỏi đáp.");
        setChatTurns(history);
      } finally {
        setChatLoading(false);
      }
    },
    [apiKey, interpretation, chatTurns, lastChartPayload],
  );

  return {
    apiKey,
    setApiKey,
    modelSelection,
    setModelSelection,
    retryCountdown,
    interpretation,
    aiLoading,
    aiError,
    modelUsedResult,
    fallbackUsedResult,
    starAuditWarning,
    starHallucinated,
    starAuditRetried,
    truncated,
    structureIssues,
    chatTurns,
    lastChartPayload,
    chatLoading,
    chatError,
    chatStarAuditWarning,
    resetForRecalculation,
    restoreFromSaved,
    handleTriggerInterpret,
    handleAskFollowUp,
  };
}
