/**
 * Gold-label master vs AI — KHÔNG claim “% đúng đời người”.
 *
 * Gold máy = outline sinh từ chart (cách cục detect, heading bắt buộc).
 * Dùng để: regression prompt, so A/B, bắt AI sót tên cách máy đã nhận.
 *
 * Layers:
 *   A) Pattern coverage — AI có nhắc tên cách máy detect?
 *   B) Heading skeleton — REQUIRED_INTERPRET_HEADINGS
 *   C) Overclaim — tái dùng scoreSkeleton patterns (nhẹ)
 *   D) Human boost (tuỳ chart) — cụm bắt buộc / cấm
 */

import { REQUIRED_INTERPRET_HEADINGS } from "./scoreSkeleton";
import { buildChartIndex } from "../utils/chartRelations";
import {
  collectPatternNamesOnChart,
  collectPatternIdsOnChart,
  enrichAnalysis,
} from "../utils/cachCucLogic";
import type { ChartIndex } from "../utils/chartRelations";

export interface HumanGoldBoost {
  chartId: string;
  /** Cụm chữ (không dấu/hoa thường) AI nên chạm — domain đời thực */
  mustMention?: string[];
  /** Cụm cấm (ảo tưởng / sáo nguy hiểm) */
  forbidMention?: string[];
  /** Ghi chú master (không chấm tự động) */
  notes?: string;
}

/** Human annotations — mở rộng dần theo gap audit. */
export const HUMAN_GOLD_BOOSTS: HumanGoldBoost[] = [
  {
    chartId: "B03",
    mustMention: ["liêm", "tướng", "mệnh"],
    forbidMention: ["chắc chắn sẽ ly hôn", "100%"],
    notes: "Lá 2009 — Liêm Tướng/Tử Phủ trên Mệnh (fixture cachCuc test)",
  },
];

export interface MachineGold {
  chartId?: string;
  patternNames: string[];
  patternIds: string[];
  /** Tên cách ưu tiên (Mệnh trước) — chấm coverage */
  priorityPatternNames: string[];
  menhLogicHints: string[];
}

export interface GoldScoreLayer {
  name: string;
  score: number;
  max: number;
  details: string[];
}

export interface GoldScorecard {
  chartId: string;
  layers: GoldScoreLayer[];
  total: number;
  /** true nếu pattern+heading đạt ngưỡng */
  goldOk: boolean;
}

function fold(s: string): string {
  return String(s || "")
    .normalize("NFC")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d");
}

/** Rút tên ngắn để match AI text (bỏ phụ chú). */
export function patternNameNeedles(name: string): string[] {
  const base = name
    .replace(/\(.*?\)/g, "")
    .replace(/triều viên/gi, "")
    .trim();
  const needles = [base];
  // Biến thể hay gặp trong bài luận
  if (/sát phá tham/i.test(base)) needles.push("Sát Phá Tham", "Sat Pha Tham");
  if (/cơ nguyệt đồng lương/i.test(base)) needles.push("Cơ Nguyệt", "Dong Luong");
  if (/phủ tướng/i.test(base)) needles.push("Phủ Tướng", "Phu Tuong");
  if (/tử phủ/i.test(base)) needles.push("Tử Phủ", "Tu Phu");
  if (/liêm tướng/i.test(base)) needles.push("Liêm Tướng", "Liem Tuong");
  return [...new Set(needles.map((n) => n.trim()).filter(Boolean))];
}

export function textMentionsPattern(aiText: string, patternName: string): boolean {
  const t = fold(aiText);
  return patternNameNeedles(patternName).some((n) => t.includes(fold(n)));
}

/**
 * Sinh gold máy từ chartIndex (hoặc palaces qua idx).
 */
export function buildMachineGold(
  idx: ChartIndex,
  opts?: { chartId?: string },
): MachineGold {
  const patternNames = collectPatternNamesOnChart(idx);
  const patternIds = collectPatternIdsOnChart(idx);
  const enriched = enrichAnalysis(idx);
  const menh = enriched.filter((e) => e.match.axisKeyword === "Mệnh");
  const priorityPatternNames = [
    ...new Set([
      ...menh.map((e) => e.match.name),
      ...enriched.slice(0, 4).map((e) => e.match.name),
    ]),
  ];
  const menhLogicHints = menh.flatMap((e) =>
    e.logicLines.filter((L) => L.startsWith("NHÂN QUẢ:") || L.startsWith("DOMAIN:")).slice(0, 2),
  );

  return {
    chartId: opts?.chartId,
    patternNames,
    patternIds,
    priorityPatternNames,
    menhLogicHints,
  };
}

export function buildMachineGoldFromPalaces(
  palaces: any[],
  opts?: { chartId?: string },
): MachineGold {
  return buildMachineGold(buildChartIndex(palaces || []), opts);
}

function scorePatternCoverage(aiText: string, gold: MachineGold): GoldScoreLayer {
  const details: string[] = [];
  const max = 100;
  const pool =
    gold.priorityPatternNames.length > 0
      ? gold.priorityPatternNames
      : gold.patternNames.slice(0, 5);

  if (pool.length === 0) {
    return {
      name: "pattern_coverage",
      score: 80,
      max,
      details: ["Không có cách điển hình — không trừ (luận tổ hợp tự do)"],
    };
  }

  let hit = 0;
  for (const name of pool) {
    if (textMentionsPattern(aiText, name)) {
      hit++;
      details.push(`✓ ${name}`);
    } else {
      details.push(`✗ thiếu: ${name}`);
    }
  }
  const ratio = hit / pool.length;
  // Cần ≥50% priority patterns; full = 100
  const score = Math.round(ratio * 100);
  return { name: "pattern_coverage", score, max, details };
}

function scoreHeadings(aiText: string): GoldScoreLayer {
  const details: string[] = [];
  const max = 100;
  let hit = 0;
  for (const h of REQUIRED_INTERPRET_HEADINGS) {
    if (fold(aiText).includes(fold(h))) {
      hit++;
      details.push(`✓ ${h}`);
    } else {
      details.push(`✗ ${h}`);
    }
  }
  const score = Math.round((hit / REQUIRED_INTERPRET_HEADINGS.length) * 100);
  return { name: "headings", score, max, details };
}

function scoreHumanBoost(aiText: string, chartId?: string): GoldScoreLayer {
  const boost = HUMAN_GOLD_BOOSTS.find((b) => b.chartId === chartId);
  const max = 100;
  if (!boost) {
    return { name: "human_boost", score: 100, max, details: ["(không có human gold)"] };
  }
  const t = fold(aiText);
  const details: string[] = [];
  let score = 100;
  for (const m of boost.mustMention || []) {
    if (t.includes(fold(m))) details.push(`✓ must:${m}`);
    else {
      details.push(`✗ must:${m}`);
      score -= 15;
    }
  }
  for (const f of boost.forbidMention || []) {
    if (t.includes(fold(f))) {
      details.push(`✗ forbid:${f}`);
      score -= 25;
    } else details.push(`✓ avoid:${f}`);
  }
  return { name: "human_boost", score: Math.max(0, score), max, details };
}

const OVERCLAIM_RE =
  /chắc chắn\s+(sẽ|phải|bị)|100\s*%|nhất định phải (chết|ly hôn|phá sản)/i;

function scoreOverclaim(aiText: string): GoldScoreLayer {
  const max = 100;
  const hits = aiText.match(new RegExp(OVERCLAIM_RE.source, "gi")) || [];
  const penalty = Math.min(60, hits.length * 20);
  return {
    name: "overclaim",
    score: Math.max(0, max - penalty),
    max,
    details: hits.length ? hits.map((h) => `overclaim: ${h}`) : ["sạch overclaim thô"],
  };
}

/**
 * Chấm AI text vs gold máy (+ human boost nếu có chartId).
 * Trọng số: pattern 40% · heading 35% · overclaim 15% · human 10%
 */
export function scoreGoldMaster(
  aiText: string,
  gold: MachineGold,
  opts?: { chartId?: string },
): GoldScorecard {
  const chartId = opts?.chartId || gold.chartId || "unknown";
  const layers = [
    scorePatternCoverage(aiText, gold),
    scoreHeadings(aiText),
    scoreOverclaim(aiText),
    scoreHumanBoost(aiText, chartId),
  ];

  const weights: Record<string, number> = {
    pattern_coverage: 0.4,
    headings: 0.35,
    overclaim: 0.15,
    human_boost: 0.1,
  };
  let total = 0;
  for (const L of layers) {
    total += (L.score / L.max) * 100 * (weights[L.name] ?? 0);
  }
  total = Math.round(total);

  const pat = layers.find((l) => l.name === "pattern_coverage")!;
  const head = layers.find((l) => l.name === "headings")!;
  const goldOk = pat.score >= 50 && head.score >= 55 && total >= 60;

  return { chartId, layers, total, goldOk };
}

/** Tạo pseudo AI text từ chính sheet máy — baseline “AI hoàn hảo skeleton”. */
export function idealSkeletonFromGold(gold: MachineGold): string {
  const parts = [
    "## Phần 0: Chân dung & 3 trục chính",
    "## Phần 1: Bản sắc & cơ chế vận hành",
    "### Tính va đập & Điểm mù",
    "### Tự Phi Tứ Hóa",
    "### Độ sâu Tứ Hóa",
    "### Cấu trúc Sát Tinh",
    "## Phần 2: Đời sống thực tế",
    "### Sự nghiệp & Tài lộc",
    "### Tình cảm & gia đạo",
    "### Sức khỏe & môi trường",
    "### Các cung còn lại",
    "## Phần 3: Vận trình",
    "### Đại hạn (10 năm)",
    "### Luận giải Tiểu Hạn",
    "## Phần 4: Nền tảng phúc báo & tổng lực",
    "### Phúc Đức",
    "### Định cách & Tổng lực đa chiều",
    "### Đối chiếu chéo Bát Tự",
    "## Kết luận cuối — 5 dòng",
    ...gold.priorityPatternNames.map((n) => `Cách ${n} trên lá.`),
    ...gold.patternNames.slice(0, 3).map((n) => n),
  ];
  return parts.join("\n");
}
