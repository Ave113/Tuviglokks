import React from "react";
import { DEFAULT_GEMINI_MODEL, type GeminiModelSelection } from "../constants/geminiModels";
import type { ChatTurn, SavedInterpretation } from "../types";
import { buildInterpretPayload } from "./buildInterpretPayload";

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

  const [chatTurns, setChatTurns] = React.useState<ChatTurn[]>([]);
  const [lastChartPayload, setLastChartPayload] = React.useState<any | null>(null);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatError, setChatError] = React.useState<string | null>(null);
  const [chatStarAuditWarning, setChatStarAuditWarning] = React.useState<string | null>(null);

  React.useEffect(() => {
    const savedKey = localStorage.getItem("tuvi_byok_key");
    if (savedKey) setApiKey(savedKey);
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
    setChatStarAuditWarning(null);
  }, []);

  const restoreFromSaved = React.useCallback((saved?: SavedInterpretation) => {
    if (saved?.content) {
      setInterpretation(saved.content);
      setModelUsedResult(saved.modelUsed || "");
      setChatTurns(Array.isArray(saved.chat) ? saved.chat : []);
      setLastChartPayload(saved.chartData ?? null);
    } else {
      setInterpretation(null);
      setChatTurns([]);
      setLastChartPayload(null);
    }
    setChatError(null);
    setStarAuditWarning(null);
    setStarHallucinated([]);
    setStarAuditRetried(false);
    setChatStarAuditWarning(null);
  }, []);

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

        const data = await response.json();
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
            modelSelection,
          }),
        });
        const data = await response.json();
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
    [apiKey, modelSelection, interpretation, chatTurns, lastChartPayload],
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
    chatTurns,
    chatLoading,
    chatError,
    chatStarAuditWarning,
    resetForRecalculation,
    restoreFromSaved,
    handleTriggerInterpret,
    handleAskFollowUp,
  };
}
