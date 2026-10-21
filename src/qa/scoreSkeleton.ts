/**
 * Chấm skeleton luận giải — KHÔNG chấm “% đúng cuộc đời”.
 *
 * Layers:
 *   A) Chart health (an lá)
 *   B) Prompt context readiness (cheat sheet máy)
 *   C) AI text coverage (heading + overclaim + star fidelity) — khi có bài
 */
import { auditAiStarMentions } from "../server/starHallucinationGuard";
import type { ChartPromptContext } from "../prompt/types";

/** Heading bắt buộc trong bài luận (markdown). */
export const REQUIRED_INTERPRET_HEADINGS = [
  "Chân dung",
  "Tính va đập",
  "Tự Phi Tứ Hóa",
  "Độ sâu Tứ Hóa",
  "Cấu trúc Sát",
  "Luận giải Tiểu Hạn",
  "Sự nghiệp & Tài lộc",
  "Tình cảm & gia đạo",
  "Sức khỏe & môi trường",
  "Phúc Đức",
  "Các cung còn lại",
  "Định cách",
  "Kết luận",
] as const;

/** Cụm overclaim — trừ điểm (không fail cứng trừ critical). */
const OVERCLAIM_PATTERNS: { re: RegExp; weight: number; critical?: boolean }[] = [
  { re: /chắc chắn\s+(sẽ|phải|bị|đỗ|cưới|ly)/i, weight: 8, critical: true },
  { re: /100\s*%|trăm\s*phần\s*trăm/i, weight: 6 },
  { re: /trắng\s*tay|phá\s*sản\s*chắc/i, weight: 5 },
  { re: /cả\s*đời\s*sẽ/i, weight: 4 },
  { re: /nhất\s*định\s*phải\s*(chết|ly\s*hôn|phá\s*sản)/i, weight: 10, critical: true },
];

export interface LayerScore {
  name: string;
  score: number;
  max: number;
  details: string[];
}

export interface BenchmarkScorecard {
  chartId: string;
  layers: LayerScore[];
  /** 0–100 tổng có trọng số */
  total: number;
  /** true nếu đủ điều kiện “skeleton pipeline OK” (không cần AI) */
  pipelineOk: boolean;
  /** true nếu có text AI và pass ngưỡng coverage */
  aiOk: boolean | null;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** A — an lá / payload */
export function scoreChartHealth(payload: {
  palaces?: any[];
  birthHeavenlyStem?: string;
  transitYear?: number;
}): LayerScore {
  const details: string[] = [];
  let score = 0;
  const max = 100;
  const palaces = payload.palaces || [];
  if (palaces.length === 12) {
    score += 40;
    details.push("12 cung");
  } else {
    details.push(`palaces=${palaces.length} (cần 12)`);
  }
  const menh = palaces.find((p: any) => String(p?.name || "").includes("Mệnh"));
  if (menh) {
    score += 25;
    details.push("có Mệnh");
  } else details.push("thiếu Mệnh");
  const majors = palaces.reduce(
    (n: number, p: any) => n + (p?.majorStars?.length || 0),
    0,
  );
  if (majors >= 10) {
    score += 20;
    details.push(`chính tinh count≈${majors}`);
  } else {
    score += 5;
    details.push(`ít chính tinh? ${majors}`);
  }
  if (payload.birthHeavenlyStem) {
    score += 10;
    details.push(`can năm ${payload.birthHeavenlyStem}`);
  } else details.push("thiếu can năm");
  if (payload.transitYear && payload.transitYear >= 1900) {
    score += 5;
    details.push(`năm xem ${payload.transitYear}`);
  }
  return { name: "chart_health", score: clamp(score, 0, max), max, details };
}

/** B — context trước khi gọi Gemini */
export function scorePromptReadiness(ctx: ChartPromptContext): LayerScore {
  const details: string[] = [];
  let score = 0;
  const max = 100;
  const checks: [string, string | undefined | null, number][] = [
    ["natalTuHoa / damTinh", ctx.damTinhStr, 12],
    ["stress sát/kỵ", ctx.stressReportStr, 8],
    ["tinhVaDap", ctx.tinhVaDapReportStr, 16],
    ["cachCuc", ctx.cachCucReportStr, 8],
    ["haiTrucTai", ctx.haiTrucTaiLocStr, 8],
    ["luuNien event cards", ctx.luuNienEventCardsStr, 10],
    ["baZi cross tags", ctx.baZiCrossTagsStr, 8],
    ["kinhNghiem", ctx.kinhNghiemKnowledgeStr, 6],
    ["giaiHoa", ctx.giaiHoaKnowledgeStr, 6],
    ["book/tinhHoa", ctx.bookCorpusStr, 5],
    ["cabinet directive", ctx.tinhHoaCabinetDirectiveStr, 5],
    ["tuanTriet", ctx.tuanTrietReportStr, 4],
    // (trước đây: tuHoaReportStr — đã gỡ vì là bản Tự Hóa trùng lặp không dùng;
    //  chấm readiness trên cấu trúc sống tương đương: Tự/Phi Tứ Hóa 12 cung)
    ["tuHoa tu/phi 12 cung", ctx.palaceSelfFlyingBlockStr, 4],
  ];
  for (const [label, val, pts] of checks) {
    const ok = typeof val === "string" && val.trim().length > 40;
    if (ok) {
      score += pts;
      details.push(`✓ ${label} (${val!.trim().length} ch)`);
    } else {
      details.push(`✗ ${label} mỏng/rỗng`);
    }
  }
  return { name: "prompt_readiness", score: clamp(score, 0, max), max, details };
}

/** C — bài AI (nếu có) */
export function scoreAiText(
  chartData: any,
  text: string | null | undefined,
): LayerScore {
  const max = 100;
  if (!text || text.trim().length < 200) {
    return {
      name: "ai_text",
      score: 0,
      max,
      details: ["(skip — chưa có bài luận AI)"],
    };
  }
  const details: string[] = [];
  let score = 0;

  // Headings ~50 — so khớp không phân biệt hoa/thường vì heading bài viết IN HOA.
  const normalizedText = text.toLocaleLowerCase("vi");
  let hit = 0;
  for (const h of REQUIRED_INTERPRET_HEADINGS) {
    if (normalizedText.includes(h.toLocaleLowerCase("vi"))) hit++;
  }
  const headScore = Math.round((hit / REQUIRED_INTERPRET_HEADINGS.length) * 50);
  score += headScore;
  details.push(`headings ${hit}/${REQUIRED_INTERPRET_HEADINGS.length} → ${headScore}`);

  // Star audit ~35
  try {
    const audit = auditAiStarMentions(text, chartData);
    if (audit.severity === "clean") {
      score += 35;
      details.push("star audit: clean");
    } else if (audit.severity === "soft") {
      score += 20;
      details.push(`star audit: soft (${audit.hallucinated?.length ?? 0} nghi)`);
    } else {
      score += 5;
      details.push(`star audit: retry (${audit.hallucinated?.slice(0, 5).join(", ")})`);
    }
  } catch (e) {
    score += 10;
    details.push(`star audit error: ${e}`);
  }

  // Overclaim ~15 penalty from 15
  let over = 15;
  let critical = false;
  for (const p of OVERCLAIM_PATTERNS) {
    if (p.re.test(text)) {
      over -= p.weight;
      details.push(`overclaim: ${p.re.source}`);
      if (p.critical) critical = true;
    }
  }
  over = clamp(over, 0, 15);
  score += over;
  if (critical) details.push("CRITICAL overclaim");

  // Độ dài hợp lý
  if (text.length < 1500) {
    score = Math.max(0, score - 10);
    details.push("bài ngắn bất thường");
  } else if (text.length > 80_000) {
    score = Math.max(0, score - 5);
    details.push("bài quá dài");
  }

  return { name: "ai_text", score: clamp(score, 0, max), max, details };
}

/**
 * Tổng: chart 30% + prompt 40% + ai 30% (nếu không có AI, normalize chart+prompt → 100).
 */
export function buildScorecard(
  chartId: string,
  payload: any,
  ctx: ChartPromptContext,
  aiText?: string | null,
): BenchmarkScorecard {
  const chart = scoreChartHealth(payload);
  const prompt = scorePromptReadiness(ctx);
  const ai = scoreAiText(payload, aiText);

  const hasAi = Boolean(aiText && aiText.trim().length >= 200);
  let total: number;
  if (hasAi) {
    total = chart.score * 0.3 + prompt.score * 0.4 + ai.score * 0.3;
  } else {
    total = (chart.score * 0.45 + prompt.score * 0.55);
  }
  total = Math.round(total * 10) / 10;

  const pipelineOk = chart.score >= 80 && prompt.score >= 70;
  const aiOk = hasAi ? ai.score >= 70 && !ai.details.some((d) => d.includes("CRITICAL")) : null;

  return {
    chartId,
    layers: [chart, prompt, ai],
    total,
    pipelineOk,
    aiOk,
  };
}
