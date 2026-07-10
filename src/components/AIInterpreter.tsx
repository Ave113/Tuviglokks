import React from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Brain, Key, AlertTriangle, Eye, EyeOff, FileText, CheckCircle, RefreshCw, BookOpen, Volume2, VolumeX, ArrowLeft, X, Copy, Download, Send, MessageCircle } from "lucide-react";
import {
  GEMINI_MODEL_FLASH,
  GEMINI_MODEL_FLASH_LITE,
  GEMINI_MODEL_LABELS,
  type GeminiModelSelection,
} from "../constants/geminiModels";
import type { ChatTurn } from "../types";
import { ChatAnswer } from "./ChatAnswer";

function InterpretationToolbar({
  onZen,
  onPrint,
  onCopy,
  onDownload,
  copied,
  compactZen = false,
}: {
  onZen: () => void;
  onPrint: () => void;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
  compactZen?: boolean;
}) {
  const actionBtn =
    "text-xs text-stone-650 dark:text-stone-300 font-bold border border-stone-250 dark:border-neutral-800 hover:bg-stone-100 dark:hover:bg-neutral-800 min-h-11 px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer";

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-stone-50/95 dark:bg-neutral-950/95 backdrop-blur-sm p-3 rounded-xl border border-stone-200 dark:border-neutral-800">
      <button
        type="button"
        onClick={onZen}
        className={`inline-flex items-center gap-2 min-h-11 px-4 rounded-xl text-xs font-black text-white shadow-md transition-all cursor-pointer ${
          compactZen
            ? "bg-amber-600 hover:bg-amber-500"
            : "bg-gradient-to-r from-amber-500 to-indigo-600 hover:brightness-110"
        }`}
      >
        <BookOpen className="w-4 h-4" />
        {compactZen ? "Đọc Tối Giản" : "Zen Reader"}
      </button>
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={onPrint} className={actionBtn} title="In lá số kèm sớ mệnh">
          🖨️ In PDF
        </button>
        <button type="button" onClick={onCopy} className={actionBtn} title="Sao chép sớ mệnh">
          <Copy className="w-3.5 h-3.5 text-amber-600" />
          {copied ? "Đã sao chép!" : "Sao chép"}
        </button>
        <button type="button" onClick={onDownload} className={actionBtn} title="Tải tệp .txt">
          <Download className="w-3.5 h-3.5 text-indigo-650" />
          Tải (.txt)
        </button>
      </div>
    </div>
  );
}

interface AIInterpreterProps {
  interpretation: string | null;
  isLoading: boolean;
  error: string | null;
  onTriggerInterpret: () => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  modelSelection: GeminiModelSelection;
  setModelSelection: (model: GeminiModelSelection) => void;
  retryCountdown?: number;
  modelUsedResult?: string;
  fallbackUsedResult?: boolean;
  /** Cảnh báo star guard sau luận giải (API starAuditWarning). */
  starAuditWarning?: string | null;
  starHallucinated?: string[];
  starAuditRetried?: boolean;
  // Hỏi đáp follow-up
  chatTurns?: ChatTurn[];
  chatLoading?: boolean;
  chatError?: string | null;
  chatStarAuditWarning?: string | null;
  onAskFollowUp?: (question: string) => void;
}

export const AIInterpreter: React.FC<AIInterpreterProps> = ({
  interpretation,
  isLoading,
  error,
  onTriggerInterpret,
  apiKey,
  setApiKey,
  modelSelection,
  setModelSelection,
  retryCountdown = 0,
  modelUsedResult = "",
  fallbackUsedResult = false,
  starAuditWarning = null,
  starHallucinated = [],
  starAuditRetried = false,
  chatTurns = [],
  chatLoading = false,
  chatError = null,
  chatStarAuditWarning = null,
  onAskFollowUp,
}) => {
  const [followUpInput, setFollowUpInput] = React.useState<string>("");

  const submitFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    const q = followUpInput.trim();
    if (!q || chatLoading || !onAskFollowUp) return;
    onAskFollowUp(q);
    setFollowUpInput("");
  };
  const [showKey, setShowKey] = React.useState<boolean>(false);
  const [saveStatus, setSaveStatus] = React.useState<boolean>(false);

  // States for Chế độ đọc tối giản (Minimalist Reading Mode)
  const [isMinimalMode, setIsMinimalMode] = React.useState<boolean>(() => {
    return localStorage.getItem("tuvi_minimal_mode") === "true";
  });
  const [fontSize, setFontSize] = React.useState<number>(() => {
    const saved = localStorage.getItem("tuvi_font_size");
    return saved ? parseInt(saved, 10) : 16;
  });
  const [readerTheme, setReaderTheme] = React.useState<"cream" | "white" | "dark">(() => {
    return (localStorage.getItem("tuvi_reader_theme") as "cream" | "white" | "dark") || "cream";
  });
  const [readerFontFamily, setReaderFontFamilyState] = React.useState<"serif" | "sans">(() => {
    return (localStorage.getItem("tuvi_reader_font_family") as "serif" | "sans") || "serif";
  });
  // Bọc setter để luôn lưu lựa chọn font, đồng bộ với fontSize/theme/minimalMode.
  const setReaderFontFamily = (family: "serif" | "sans") => {
    setReaderFontFamilyState(family);
    localStorage.setItem("tuvi_reader_font_family", family);
  };
  const [showBreathingGuide, setShowBreathingGuide] = React.useState<boolean>(true);
  const [breathSec, setBreathSec] = React.useState<number>(0);

  const breathPhase = React.useMemo(() => {
    if (breathSec >= 0 && breathSec < 4) return "inhale";
    if (breathSec >= 4 && breathSec < 6) return "hold";
    return "exhale";
  }, [breathSec]);
  const [isAmbientOn, setIsAmbientOn] = React.useState<boolean>(false);
  const [scrollPercent, setScrollPercent] = React.useState<number>(0);

  const readerContainerRef = React.useRef<HTMLDivElement>(null);
  const ambientAudioRef = React.useRef<{ audioCtx: AudioContext | null; gainNode: any } | null>(null);
  // Cờ throttle cho onScroll: chỉ cho phép 1 lần cập nhật scrollPercent mỗi frame.
  const scrollTickingRef = React.useRef<boolean>(false);

  // Synchronize browser body scrolling status of minimalist mode
  React.useEffect(() => {
    // We avoid hardlocking document.body.style.overflow = "hidden" inside sandboxed iframe wrappers,
    // which can freeze user input. We ensure smooth native scroll interactions instead.
    if (!isMinimalMode) {
      stopZenAmbient();
      setIsAmbientOn(false);
    }
  }, [isMinimalMode]);

  // Handle breathing phase transitions automatically
  React.useEffect(() => {
    if (!isMinimalMode) return;
    const interval = setInterval(() => {
      setBreathSec((prev) => (prev + 1) % 10);
    }, 1000);
    return () => clearInterval(interval);
  }, [isMinimalMode]);

  const startZenAmbient = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      
      const waveNode = ctx.createBiquadFilter();
      waveNode.type = "lowpass";
      waveNode.frequency.value = 350;
      
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.05; // soft white noise breeze
      
      const lfoNode = ctx.createOscillator();
      lfoNode.frequency.value = 0.1; // 10 second cycles matching breathing
      
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 180;
      
      lfoNode.connect(lfoGain);
      lfoGain.connect(waveNode.frequency);
      
      whiteNoise.connect(waveNode);
      waveNode.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      whiteNoise.start();
      lfoNode.start();
      
      ambientAudioRef.current = { audioCtx: ctx, gainNode };
    } catch (err) {
      console.error("Audio failed configuration:", err);
    }
  };

  const stopZenAmbient = () => {
    if (ambientAudioRef.current?.audioCtx) {
      try {
        ambientAudioRef.current.audioCtx.close();
      } catch (e) {}
      ambientAudioRef.current = null;
    }
  };

  const toggleAmbientSound = () => {
    if (isAmbientOn) {
      stopZenAmbient();
      setIsAmbientOn(false);
    } else {
      startZenAmbient();
      setIsAmbientOn(true);
    }
  };

  const handleScrollDepth = () => {
    // Throttle bằng requestAnimationFrame: onScroll bắn rất dày, gom về tối đa
    // 1 lần setState mỗi frame để tránh re-render thừa khi cuộn văn bản dài.
    if (scrollTickingRef.current) return;
    scrollTickingRef.current = true;
    requestAnimationFrame(() => {
      scrollTickingRef.current = false;
      if (readerContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = readerContainerRef.current;
        const pct = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setScrollPercent(Math.min(isNaN(pct) ? 0 : pct, 100));
      }
    });
  };

  const exitMinimalMode = () => {
    stopZenAmbient();
    setIsAmbientOn(false);
    setIsMinimalMode(false);
    localStorage.setItem("tuvi_minimal_mode", "false");
  };

  const toggleMinimalMode = () => {
    // Không cho vào Zen Reader khi chưa có bản luận giải (tránh overlay rỗng).
    if (!interpretation) return;
    const next = !isMinimalMode;
    setIsMinimalMode(next);
    localStorage.setItem("tuvi_minimal_mode", String(next));
  };

  const handleFontSizeChange = (delta: number) => {
    setFontSize(prev => {
      const next = Math.min(24, Math.max(12, prev + delta));
      localStorage.setItem("tuvi_font_size", String(next));
      return next;
    });
  };

  const changeReaderTheme = (theme: "cream" | "white" | "dark") => {
    setReaderTheme(theme);
    localStorage.setItem("tuvi_reader_theme", theme);
  };

  const [copied, setCopied] = React.useState<boolean>(false);

  const handleCopyDestiny = () => {
    if (!interpretation) return;
    navigator.clipboard.writeText(interpretation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!interpretation) return;
    const blob = new Blob([interpretation], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `So_Menh_Tu_Vi_Ban_Menh_AI.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Save key to browser local storage for convenience
  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("tuvi_byok_key", apiKey.trim());
    } catch (err) {
      console.error("Không lưu được API key vào localStorage:", err);
    }
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const handleSaveKeyInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    try {
      localStorage.setItem("tuvi_byok_key", apiKey.trim());
    } catch (err) {
      console.error("Không lưu được API key vào localStorage:", err);
    }
    setSaveStatus(true);
    setTimeout(() => {
      setSaveStatus(false);
      onTriggerInterpret();
    }, 500);
  };

  const handleClearKey = () => {
    localStorage.removeItem("tuvi_byok_key");
    setApiKey("");
  };

  const isQuotaError = !!(
    error && (
      error.includes("Hệ thống nhận thấy số lượng yêu cầu") ||
      error.includes("Quota") ||
      error.includes("Rate Limit") ||
      error.includes("RESOURCE_EXHAUSTED") ||
      error.toLowerCase().includes("limit")
    )
  );

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-stone-250 dark:border-neutral-800 shadow-xl overflow-hidden">
      {/* Configuration Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-indigo-950/80">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              BÌNH GIẢI LÁ SỐ BẰNG TRÍ TUỆ NHÂN TẠO AI
            </h3>
            <span className="text-[10px] bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full font-black tracking-wider uppercase shadow-md">
              Chế độ Nói Thật & Trực Diện ⚡
            </span>
          </div>
          <p className="text-xs text-indigo-200 mt-1">
            Thuật toán phân tích sát sườn cả mặt hỷ cát lẫn mặt tai họa, hãm địa, sát tinh hiểm ác để đương số can đảm nhìn nhận thực tế và chủ động khắc chế vận số.
          </p>
        </div>

        {/* BYOK — desktop */}
        <form onSubmit={handleSaveKey} className="hidden md:flex gap-2 items-center bg-indigo-950/40 p-1.5 rounded-lg border border-indigo-700/50 w-full md:w-auto">
          <Key className="w-4 h-4 text-indigo-300 ml-1.5 shrink-0" />
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              placeholder="Nhập API Key cá nhân (BYOK)..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="text-xs bg-indigo-950 border border-indigo-800 focus:border-indigo-600 focus:outline-none rounded p-1 px-2 text-white w-48 placeholder-indigo-400/60"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              aria-label={showKey ? "Ẩn API Key" : "Hiện API Key"}
              title={showKey ? "Ẩn API Key" : "Hiện API Key"}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-white"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-colors uppercase shrink-0"
          >
            {saveStatus ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : "Lưu"}
          </button>
          {apiKey && (
            <button
              type="button"
              onClick={handleClearKey}
              className="text-[10px] text-rose-400 hover:text-rose-300 px-1 font-semibold"
            >
              Xóa
            </button>
          )}
        </form>
      </div>

      {/* BYOK + Model — mobile (gọn) */}
      <details className="md:hidden border-b border-indigo-900/40 bg-indigo-950/20" open={!apiKey}>
        <summary className="px-5 py-3 text-xs font-bold text-indigo-100 cursor-pointer list-none flex items-center gap-2">
          <Key className="w-3.5 h-3.5" />
          Cấu hình API & Model
        </summary>
        <div className="px-5 pb-4 space-y-4">
          <form onSubmit={handleSaveKey} className="flex gap-2 items-center bg-indigo-950/40 p-1.5 rounded-lg border border-indigo-700/50 w-full">
            <Key className="w-4 h-4 text-indigo-300 ml-1 shrink-0" />
            <div className="relative flex-1">
              <input
                type={showKey ? "text" : "password"}
                placeholder="API Key Gemini (BYOK)..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="text-xs bg-indigo-950 border border-indigo-800 focus:border-indigo-600 focus:outline-none rounded p-2 px-2 text-white w-full placeholder-indigo-400/60"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? "Ẩn API Key" : "Hiện API Key"}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-white min-h-11 min-w-11 flex items-center justify-center"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3 py-2 min-h-11 rounded uppercase shrink-0">
              {saveStatus ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : "Lưu"}
            </button>
          </form>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-indigo-100">
              <input type="radio" name="model_select_m" checked={modelSelection === GEMINI_MODEL_FLASH} onChange={() => setModelSelection(GEMINI_MODEL_FLASH)} className="accent-indigo-400" />
              {GEMINI_MODEL_LABELS[GEMINI_MODEL_FLASH]}
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-indigo-100">
              <input type="radio" name="model_select_m" checked={modelSelection === GEMINI_MODEL_FLASH_LITE} onChange={() => setModelSelection(GEMINI_MODEL_FLASH_LITE)} className="accent-indigo-400" />
              {GEMINI_MODEL_LABELS[GEMINI_MODEL_FLASH_LITE]}
            </label>
          </div>
        </div>
      </details>

      <div className="p-6 space-y-6">
        {/* Model and execution configuration line — desktop */}
        <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50 dark:bg-neutral-950 p-4 rounded-xl border border-stone-200 dark:border-neutral-800">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase block">Cấu hình Bộ Não Luận Giải</span>
            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-neutral-300">
                <input
                  type="radio"
                  name="model_select"
                  checked={modelSelection === GEMINI_MODEL_FLASH}
                  onChange={() => setModelSelection(GEMINI_MODEL_FLASH)}
                  className="accent-indigo-600"
                />
                <span className="flex items-center gap-1">
                  {GEMINI_MODEL_LABELS[GEMINI_MODEL_FLASH]}
                  <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-1 rounded font-medium">Nhanh/Tối ưu</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-neutral-300" title="Bản Lite tối ưu tốc độ và hạn mức luồng riêng biệt">
                <input
                  type="radio"
                  name="model_select"
                  checked={modelSelection === GEMINI_MODEL_FLASH_LITE}
                  onChange={() => setModelSelection(GEMINI_MODEL_FLASH_LITE)}
                  className="accent-indigo-600"
                />
                <span className="flex items-center gap-1">
                  {GEMINI_MODEL_LABELS[GEMINI_MODEL_FLASH_LITE]} 🚀
                  <span className="text-[9px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 px-1 rounded font-bold">Lưu lượng cao / Tránh nghẽn</span>
                </span>
              </label>


            </div>
          </div>

          <button
            onClick={onTriggerInterpret}
            disabled={isLoading || retryCountdown > 0}
            className={`w-full sm:w-auto font-bold p-3 px-6 rounded-xl flex items-center justify-center gap-2.5 active:scale-98 transition-all shrink-0 text-sm select-none shadow-lg ${
              retryCountdown > 0
                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20"
                : "bg-indigo-600 hover:bg-indigo-500 disabled:bg-stone-300 disabled:cursor-not-allowed text-white shadow-indigo-600/20"
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang luận giải lá số cổ học...
              </>
            ) : retryCountdown > 0 ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Vui lòng đợi {retryCountdown}s...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Khởi động AI Luận Giải Tử Vi
              </>
            )}
          </button>
        </div>

        {/* Nút luận giải — mobile full width */}
        <button
          onClick={onTriggerInterpret}
          disabled={isLoading || retryCountdown > 0}
          className={`md:hidden w-full font-bold p-3.5 min-h-11 rounded-xl flex items-center justify-center gap-2.5 active:scale-98 transition-all text-sm shadow-lg ${
            retryCountdown > 0
              ? "bg-amber-600 text-white"
              : "bg-indigo-600 hover:bg-indigo-500 disabled:bg-stone-300 disabled:cursor-not-allowed text-white"
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Đang luận giải...
            </>
          ) : retryCountdown > 0 ? (
            <>Vui lòng đợi {retryCountdown}s...</>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Khởi động AI Luận Giải Tử Vi
            </>
          )}
        </button>

        {/* Informative warning if using fallback/placeholder key */}
        {!apiKey && (
          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/15 rounded-lg border border-amber-150 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-tight">
              - <strong>Bắt buộc dùng API Key cá nhân (BYOK):</strong> Để bảo mật dữ liệu và phân luồng xử lý mượt mà riêng biệt, quý vị vui lòng điền khoá API Gemini cá nhân chính chủ của mình ở thanh cấu hình phía trên trước khi bắt đầu. <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="underline font-bold hover:text-amber-600 dark:hover:text-amber-400">Lấy khoá API miễn phí trong 1 phút tại Google AI Studio ↗</a>.
            </p>
          </div>
        )}

        {/* Loading placeholder or Empty presentation or Result display */}
        {isLoading ? (
          <div className="p-12 text-center text-stone-500 space-y-4">
            <div className="relative mx-auto w-16 h-16" role="status" aria-label="Đang luận giải">
              {/* Chỉ vòng này xoay — class ai-loading-ring (không dùng animate-spin chung) */}
              <span className="ai-loading-ring absolute inset-0 rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-amber-500 opacity-90" />
            </div>
            <div className="space-y-1">
              <p className="font-extrabold text-stone-900 dark:text-white text-base">Đang Kết Nối Bát Tự Tam Hợp...</p>
              <p className="text-xs text-stone-400">
                AI đang tính toán mệnh thế, phối hợp sao chiếu, xung âm dương ngũ hành cát hung để biên soạn...
              </p>
            </div>
          </div>
        ) : error ? (
          isQuotaError ? (
            <div className="p-6 rounded-xl bg-amber-50/70 border border-amber-200 dark:bg-amber-950/15 dark:border-amber-900/40 text-stone-900 dark:text-neutral-100 space-y-5 animate-fadeIn">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-stone-900 dark:text-amber-400 text-sm tracking-tight">
                    YÊU CẦU ĐANG QUÁ TẢI (RATE LIMIT / QUOTA EXHAUSTED)
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-neutral-350 mt-1 leading-relaxed">
                    Hệ thống nhận thấy số lượng yêu cầu của quý vị hoặc máy chủ đang vượt quá hạn mức sử dụng tạm thời của Google Gemini API. Quý vị có thể xử lý lập tức bằng 2 phương án bên dưới:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: Wait & Retry */}
                <div className="p-4 rounded-lg bg-white/90 dark:bg-neutral-900 border border-amber-100 dark:border-neutral-800 space-y-2 flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Phương án 1 (Phụ thuộc chung)
                    </span>
                    <h5 className="font-bold text-xs text-stone-800 dark:text-neutral-200 mt-2">
                      Đợi 30 giây rồi gửi lại mong đợi hàng chờ trống
                    </h5>
                    <p className="text-[11px] text-stone-500 dark:text-neutral-400 leading-relaxed mt-1">
                      Hạn mức dùng thử miễn phí chung của máy chủ được tự động làm mới liên tục theo từng phút. Quý vị hãy kiên nhẫn một chút rồi nhấn nút gửi lại.
                    </p>
                  </div>
                  <button
                    onClick={onTriggerInterpret}
                    className="w-full mt-3 bg-amber-600 hover:bg-amber-500 dark:bg-amber-700 dark:hover:bg-amber-600 text-white font-bold text-xs py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Thử gửi lại ngay lập tức
                  </button>
                </div>

                {/* Option 2: Personal Key (BYOK) */}
                <div className="p-4 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-950/40 space-y-2 flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Phương án 2 (Độc lập/Tối ưu)
                    </span>
                    <h5 className="font-bold text-xs text-indigo-900 dark:text-indigo-300 mt-2">
                      Sử dụng API Key Gemini cá nhân miễn phí
                    </h5>
                    <p className="text-[11px] text-stone-600 dark:text-neutral-400 leading-relaxed mt-1">
                      Khi tự điền khoá riêng, bạn được Google cấp luồng xử lý độc lập hoàn toàn miễn phí, nhanh hơn và không bao giờ lo bị quá tải chung.
                    </p>
                    <div className="mt-1">
                      <a
                        href="https://aistudio.google.com"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-650 dark:text-indigo-400 hover:underline hover:text-indigo-850"
                      >
                        Lấy khóa Gemini miễn phí tại Google AI Studio ↗
                      </a>
                    </div>
                  </div>

                  {/* Built-in inline API Key input for maximum ease */}
                  <div className="mt-3 pt-2 border-t border-indigo-100/50 dark:border-indigo-950/30">
                    <form onSubmit={handleSaveKeyInline} className="flex gap-1.5 items-center">
                      <div className="relative flex-1">
                        <input
                          type={showKey ? "text" : "password"}
                          placeholder="Dán API Key của bạn vào đây..."
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="text-xs bg-white dark:bg-neutral-900 border border-indigo-250 dark:border-indigo-900 text-stone-900 dark:text-white rounded px-2.5 py-1.5 w-full pr-7 placeholder-stone-400 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey(!showKey)}
                          aria-label={showKey ? "Ẩn API Key" : "Hiện API Key"}
                          title={showKey ? "Ẩn API Key" : "Hiện API Key"}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                        >
                          {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={!apiKey.trim()}
                        className="bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs px-3 py-1.5 rounded transition-all shrink-0 shadow-sm"
                      >
                        {saveStatus ? "Đã lưu!" : "Lưu & Xem"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold text-sm">Quá trình luận giải gặp lỗi:</p>
                <p className="text-xs">{error}</p>
              </div>
            </div>
          )
        ) : interpretation ? (
          <div className="space-y-4">
            {fallbackUsedResult && (
              <div className="p-4 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 rounded-xl text-xs text-sky-850 dark:text-sky-300 flex items-start gap-2.5 shadow-sm">
                <Sparkles className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-left">
                  <p className="font-extrabold text-[#0369a1] dark:text-[#38bdf8] uppercase tracking-tight">Hệ Thống Tự Động Kích Hoạt Chuyển Hướng Dự Phòng 🚀</p>
                  <p className="leading-relaxed font-semibold">
                    Máy chủ Gemini 3.5 Flash của Google hiện tại đang nhận lưu lượng quá tải cục bộ (Báo lỗi bận 503). 
                    Để bản luận giải không bị ngắt quãng hoặc chết đứng, hệ thống đã <span className="text-amber-600 dark:text-amber-400 font-extrabold">tự động định tuyến cuộc gọi thành công qua Gemini 3.1 Flash-Lite dự phòng</span> hoàn toàn êm ái cho quý vị!
                  </p>
                </div>
              </div>
            )}
            {(starAuditWarning || starHallucinated.length > 0) && (
              <div
                className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5 shadow-sm"
                role="status"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-left min-w-0">
                  <p className="font-extrabold text-amber-900 dark:text-amber-300 tracking-tight">
                    Rà soát sao trên lá{starAuditRetried ? " (đã yêu cầu AI viết lại 1 lần)" : ""}
                  </p>
                  <p className="leading-relaxed">
                    {starAuditWarning ||
                      `Một số tên sao trong bài có thể không khớp thiên bàn${
                        starHallucinated.length
                          ? `: ${starHallucinated.join(", ")}`
                          : ""
                      }. Hãy đối chiếu 12 cung trước khi tin hoàn toàn.`}
                  </p>
                </div>
              </div>
            )}
            <InterpretationToolbar
              onZen={toggleMinimalMode}
              onPrint={() => window.print()}
              onCopy={handleCopyDestiny}
              onDownload={handleDownloadTxt}
              copied={copied}
            />

            {/* Immersive Zen Minimal Reader Overlay */}
            {isMinimalMode && (
              <div
                className={`fixed inset-0 z-[100] flex flex-col overflow-hidden transition-all duration-300 ${
                  readerTheme === "cream"
                    ? "bg-[#fafaf6] dark:bg-[#181512] text-[#2c241e] dark:text-[#ebdcc8]"
                    : readerTheme === "white"
                    ? "bg-white text-stone-900 dark:bg-neutral-950 dark:text-neutral-50"
                    : "bg-[#09090b] text-neutral-200"
                }`}
              >
                {/* Scroll Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-stone-150 dark:bg-neutral-900 z-[110]">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 transition-all duration-100"
                    style={{ width: `${scrollPercent}%` }}
                  />
                </div>

                {/* Reader Header */}
                <header className="flex flex-wrap justify-between items-center px-4 py-3 sm:px-8 border-b border-stone-200/50 dark:border-neutral-800/50 bg-opacity-70 backdrop-blur-md sticky top-0 z-[110]">
                  <button
                    onClick={exitMinimalMode}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-wider hover:opacity-80 p-2 px-4 rounded-xl border border-stone-350 hover:bg-stone-100 dark:hover:bg-neutral-900 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-indigo-650" />
                    Thoát chế độ đọc
                  </button>

                  {/* Settings Panel */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    {/* Font selection */}
                    <div className="flex bg-stone-100 dark:bg-neutral-900/60 p-0.5 rounded-xl border border-stone-200 dark:border-neutral-800">
                      <button
                        onClick={() => setReaderFontFamily("serif")}
                        className={`px-3 py-1 rounded-lg font-serif font-black text-xs transition-all ${readerFontFamily === "serif" ? "bg-white dark:bg-neutral-850 shadow text-stone-950 dark:text-white" : "opacity-60"}`}
                      >
                        Serif
                      </button>
                      <button
                        onClick={() => setReaderFontFamily("sans")}
                        className={`px-3 py-1 rounded-lg font-sans font-black text-xs transition-all ${readerFontFamily === "sans" ? "bg-white dark:bg-neutral-850 shadow text-stone-950 dark:text-white" : "opacity-60"}`}
                      >
                        Sans
                      </button>
                    </div>

                    {/* Font sizing */}
                    <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-neutral-900/60 px-2 py-0.5 rounded-xl border border-stone-200 dark:border-neutral-800">
                      <button
                        onClick={() => handleFontSizeChange(-1)}
                        className="p-1 px-2.5 hover:bg-stone-200/40 dark:hover:bg-neutral-800 rounded font-bold text-stone-700 dark:text-neutral-300 transition-colors"
                        title="Thu nhỏ chữ"
                      >
                        A⁻
                      </button>
                      <span className="font-mono text-[10px] font-black">{fontSize}px</span>
                      <button
                        onClick={() => handleFontSizeChange(1)}
                        className="p-1 px-2.5 hover:bg-stone-200/40 dark:hover:bg-neutral-800 rounded font-bold text-stone-700 dark:text-neutral-300 transition-colors"
                        title="Phóng to chữ"
                      >
                        A⁺
                      </button>
                    </div>

                    {/* Reader themes */}
                    <div className="flex items-center gap-1 bg-stone-100 dark:bg-neutral-900/60 p-1 rounded-xl border border-stone-200 dark:border-neutral-800">
                      <button
                        onClick={() => changeReaderTheme("cream")}
                        className={`w-5.5 h-5.5 rounded-full border border-stone-300 bg-[#fafaf7] relative flex items-center justify-center ${
                          readerTheme === "cream" ? "ring-2 ring-indigo-500 ring-offset-1" : ""
                        }`}
                        title="Nhã nhạc (Cổ thư)"
                      >
                        <span className="text-[9px] font-black">📖</span>
                      </button>
                      <button
                        onClick={() => changeReaderTheme("white")}
                        className={`w-5.5 h-5.5 rounded-full border border-stone-300 bg-white relative flex items-center justify-center ${
                          readerTheme === "white" ? "ring-2 ring-indigo-500 ring-offset-1" : ""
                        }`}
                        title="Bản sớ (Sáng thanh tao)"
                      >
                        <span className="text-[9px] font-black">📄</span>
                      </button>
                      <button
                        onClick={() => changeReaderTheme("dark")}
                        className={`w-5.5 h-5.5 rounded-full border border-stone-800 bg-neutral-950 relative flex items-center justify-center ${
                          readerTheme === "dark" ? "ring-2 ring-indigo-500 ring-offset-1" : ""
                        }`}
                        title="Huyền dạ (Đêm tĩnh tâm)"
                      >
                        <span className="text-[9px] font-black">🌙</span>
                      </button>
                    </div>

                    {/* Ambient sound loops */}
                    <button
                      onClick={toggleAmbientSound}
                      className={`p-1.5 px-3 rounded-xl border flex gap-1.5 items-center transition-all cursor-pointer ${
                        isAmbientOn
                          ? "bg-gradient-to-r from-amber-500 to-indigo-600 border-transparent text-white"
                          : "border-stone-250 dark:border-neutral-850 hover:bg-stone-100"
                      }`}
                      title="Sóng âm thanh lọc khí kết nối bát tự giúp thông mượt vận số"
                    >
                      {isAmbientOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-70" />}
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {isAmbientOn ? "Ambient: Mở" : "Âm thiền"}
                      </span>
                    </button>
                  </div>
                </header>

                {/* Document reading engine */}
                <div
                  ref={readerContainerRef}
                  onScroll={handleScrollDepth}
                  className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 sm:py-16 md:py-20 flex flex-col items-center select-text"
                >
                  <article
                    className={`w-full max-w-2xl mx-auto space-y-8 tracking-wide leading-relaxed ${
                      readerFontFamily === "serif" ? "font-serif" : "font-sans"
                    }`}
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {/* Visual Card Accent */}
                    <div className="text-center pb-8 border-b border-dashed border-stone-200 dark:border-neutral-800 space-y-4">
                      <span className="text-[10px] tracking-widest font-bold font-mono opacity-50 uppercase block">An nhiên thấu tỏ mạng vận</span>
                      <h1 className="text-2.5xl sm:text-4xl font-black font-display tracking-tight leading-tight">
                        HỘ KIỆT BÌNH TOÀN TẬP
                      </h1>
                      <p className="text-xs italic opacity-75 max-w-lg mx-auto leading-relaxed">
                        "Lá số của bạn đang bị nghẽn ở đâu, đó chính là nơi bạn sinh ra để rèn luyện, hành động nhằm giúp lá số của mình được thông suốt và mượt mà hơn."
                      </p>
                    </div>

                    {/* Styled Markdown inside */}
                    <div
                      className={`prose max-w-none transition-all duration-300 ${
                        readerTheme === "cream"
                          ? "text-[#2e261d] prose-stone prose-headings:text-[#1c140e] prose-headings:font-display prose-a:text-amber-800"
                          : readerTheme === "white"
                          ? "text-stone-850 dark:text-neutral-200 prose-stone dark:prose-invert"
                          : "text-neutral-300 prose-invert prose-headings:text-neutral-100 prose-a:text-indigo-400"
                      }`}
                      style={{ fontSize: `${fontSize}px`, lineHeight: "2.1" }}
                    >
                      <ReactMarkdown>{interpretation}</ReactMarkdown>
                    </div>

                    {/* Book signature */}
                    <div className="pt-12 border-t border-dashed border-stone-200 dark:border-neutral-800 text-center opacity-65 text-xs italic space-y-2 pb-16">
                      <p>Khắc cốt ghi tâm, đức năng thắng số mệnh. Rèn tâm chính là hành động hoá giải.</p>
                      <p className="font-mono text-[9px] font-extrabold tracking-widest uppercase mt-4 text-amber-600">
                        HỘ KIỆT BÌNH TOÀN • TUỆ TỰ GIẢI THOÁT
                      </p>
                    </div>
                  </article>
                </div>

                {/* Bottom Mindful Breathing guide to "rèn-hành" */}
                {showBreathingGuide && (
                  <div className="border-t border-stone-200/50 dark:border-neutral-800/80 bg-opacity-90 backdrop-blur-md p-3 px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs z-[110]">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-400/40 flex items-center justify-center relative shrink-0">
                        <span className="absolute w-2.5 h-2.5 rounded-full bg-indigo-500 animate-breath" />
                      </div>
                      <div>
                        <span className="font-extrabold text-[11px] tracking-tight block uppercase text-amber-600 dark:text-amber-500">
                          Pháp rèn dưỡng khí hành tâm 🧘
                        </span>
                        <span className="text-[10px] opacity-70 leading-tight">
                          Kết hợp đọc sớ mệnh với điều tiết hơi thở để khơi thông chướng khí tắc nghẽn của vận hạn.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 p-1 px-3.5 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-2">
                        <span className="opacity-60">Trạng thái rèn:</span>
                        <span
                          className={`uppercase font-mono text-[10px] p-0.5 px-2.5 rounded-full ${
                            breathPhase === "inhale"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 animate-pulse"
                              : breathPhase === "hold"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
                              : "bg-indigo-150 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400 animate-pulse"
                          }`}
                        >
                          {breathPhase === "inhale" ? "HÍT VÀO CHẬM (4s) ↗" : breathPhase === "hold" ? "NÍN THỞ NẰM GIỮ (2s) ○" : "THỞ RA ÊM (4s) ↘"}
                        </span>
                      </div>

                      <button
                        onClick={() => setShowBreathingGuide(false)}
                        className="hover:opacity-100 opacity-60 p-1 hover:bg-stone-200/50 dark:hover:bg-neutral-800 rounded transition-colors"
                        title="Đóng bảng thở hướng dẫn"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Standard rendering when not in distraction-free mode */}
            <div className="border border-stone-200 dark:border-neutral-800 rounded-xl p-6 bg-stone-50/50 dark:bg-stone-950/20 font-sans leading-relaxed text-stone-850 dark:text-neutral-200">
              <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5 text-sm pb-3 mb-6 border-b border-stone-200 dark:border-neutral-800">
                <FileText className="w-4 h-4 text-indigo-650" />
                HỘ KIỆT BÌNH TOÀN CHI TIẾT LÁ SỐ
              </h4>

              <div className="markdown-body reading-rhythm prose prose-stone dark:prose-invert max-w-none space-y-6">
                <ReactMarkdown>{interpretation}</ReactMarkdown>
              </div>
            </div>

            {/* ===== HỎI ĐÁP FOLLOW-UP ===== */}
            <div className="border border-indigo-200 dark:border-indigo-950/50 rounded-xl p-5 bg-indigo-50/30 dark:bg-indigo-950/10 space-y-4">
              <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5 text-sm">
                <MessageCircle className="w-4 h-4 text-indigo-600" />
                Hỏi Đáp Thêm Về Lá Số Này
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-neutral-400 -mt-2">
                Đặt câu hỏi cụ thể (vd: “năm sau tôi có nên đổi việc?”, “tháng nào hợp cưới?”). AI trả lời bám đúng bản luận giải ở trên.
              </p>

              {chatTurns.length > 0 && (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {chatTurns.map((turn, idx) => (
                    <div key={idx} className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                        turn.role === "user"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-stone-800 dark:text-neutral-200 rounded-bl-sm"
                      }`}>
                        {turn.role === "assistant" ? (
                          <ChatAnswer content={turn.content} size="sm" />
                        ) : (
                          <span>{turn.content}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-xs text-stone-500 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 ai-loading-spin shrink-0" aria-hidden />
                        Minh Sư đang ngẫm nghĩ...
                      </div>
                    </div>
                  )}
                </div>
              )}

              {chatError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{chatError}</span>
                </div>
              )}

              {chatStarAuditWarning && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>{chatStarAuditWarning}</span>
                </div>
              )}

              <form onSubmit={submitFollowUp} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                  placeholder="Nhập câu hỏi về lá số..."
                  disabled={chatLoading || retryCountdown > 0}
                  className="flex-1 text-sm bg-white dark:bg-neutral-950 border border-stone-250 dark:border-neutral-800 focus:border-indigo-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-stone-900 dark:text-white disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!followUpInput.trim() || chatLoading || retryCountdown > 0}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-98 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  Gửi
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="p-12 rounded-xl text-center border-2 border-dashed border-stone-200 dark:border-neutral-800 text-stone-400 space-y-3">
            <div className="inline-flex p-3 bg-indigo-50/50 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 rounded-full">
              <Brain className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <p className="font-bold text-stone-800 dark:text-neutral-200 text-sm">Chưa có bản luận giải nào được tạo</p>
              <p className="text-xs">
                Ấn nút <strong>"Khởi động AI Luận Giải Tử Vi"</strong> để AI phân tích tam hợp lục hại, an sao, và đúc kết chi tiết mệnh vận cuộc đời quý vị.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
