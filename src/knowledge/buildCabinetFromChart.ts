/**
 * Một cửa dựng tủ tinh hoa từ chartData — INTERPRET + CHAT cùng dùng.
 * Đảm bảo luận giải chính và /api/chat hưởng chung tinh chế.
 */
import {
  buildTinhHoaCabinet,
  type TinhHoaCabinetMode,
  type TinhHoaCabinetResult,
} from "./tinhHoaCabinet";
import {
  BLIND_SPOT_TO_GH,
  GIAI_HOA_KNOWLEDGE,
  giaiHoaToPromptText,
  type GiaiHoaEntry,
} from "./giaiHoaKnowledge";
import { resolveTopicPool, starsFromPalaces } from "./topicStarPool";
import { HOA_LABELS, TU_HOA_BY_STEM, normalizeHeavenlyStem, extractBirthHeavenlyStem, getNatalTuHoaQuartet } from "../utils/tuHoa";
import { collectAllAuxStarNames, collectAllMajorStarNames } from "../prompt/chartReports";
import { buildChartIndex } from "../utils/chartRelations";
import { collectPatternIdsOnChart } from "../utils/cachCucLogic";

const AUX_HEAVY =
  /Kình|Đà|Không|Kiếp|Hỏa|Linh|Hóa |Lộc Tồn|Văn|Tuần|Triệt|Vong|Hình|Mã|Khôi|Việt|Tang|Hổ|Khốc|Hư|Hồng|Đào/i;

export interface BuildCabinetFromChartOpts {
  mode?: TinhHoaCabinetMode;
  query?: string;
  /** Chat: true khi có query. Interpret: false (full lá). */
  useTopicFocus?: boolean;
  /**
   * patternId đã detect sẵn (từ analyzeCachCuc) — tránh detect lặp trong interpret.
   * Chat thường để trống → tự detect.
   */
  patternIds?: string[];
}

export interface CabinetFromChartResult extends TinhHoaCabinetResult {
  topicPalaceKeywords: string[];
  focusStars: string[];
  blindGiaiHoa: GiaiHoaEntry[];
  /** patternId cách cục máy trên lá — dùng chung interpret/chat */
  patternIds: string[];
}

function detectBlindKeys(query: string): string[] {
  const q = query.toLowerCase();
  const keys: string[] = [];
  if (/overthink|suy nghĩ|do dự|chần chừ|mưu sĩ|kế hoạch/.test(q)) {
    keys.push("OVERTHINK", "MUUSI");
  }
  if (/miệng|thị phi|cãi|nói/.test(q)) keys.push("MIENG");
  if (/bạn|đối tác|bảo lãnh|chung vốn/.test(q)) keys.push("TINSAI");
  if (/vợ|chồng|tình|hiểu lầm/.test(q)) keys.push("LECHSONG");
  if (/tiền|giữ|hao|tiêu/.test(q)) keys.push("KIEMGIU");
  if (/điểm mù|bản thân|tính cách|yếu điểm/.test(q)) {
    keys.push("OVERTHINK", "TUGIAM", "TINSAI", "LECHSONG", "KIEMGIU");
  }
  if (/năm nay|hạn|thái tuế/.test(q)) keys.push("BANLE");
  return [...new Set(keys)];
}

function entriesByIds(ids: string[]): GiaiHoaEntry[] {
  const map = new Map(GIAI_HOA_KNOWLEDGE.map((e) => [e.id, e]));
  return ids.map((id) => map.get(id)).filter((e): e is GiaiHoaEntry => Boolean(e));
}

/**
 * Dựng cabinet từ payload lá số (12 cung).
 * — Interpret: mode interpret, full major.
 * — Chat: mode chat/chat-light + useTopicFocus theo câu hỏi.
 */
export function buildCabinetFromChart(
  chartData: any,
  opts: BuildCabinetFromChartOpts = {},
): CabinetFromChartResult {
  const mode: TinhHoaCabinetMode = opts.mode ?? "interpret";
  const query = opts.query;
  const palaces = chartData?.palaces || [];
  const majorStars = collectAllMajorStarNames(palaces);
  const auxStars = collectAllAuxStarNames(palaces).filter((n) => AUX_HEAVY.test(n));

  const natalStem =
    extractBirthHeavenlyStem(chartData, chartData?.birthLunarYear) ||
    normalizeHeavenlyStem(chartData?.birthHeavenlyStem);
  const natalTable = natalStem ? getNatalTuHoaQuartet(natalStem) : undefined;
  const tuHoaStars = natalTable ? [...HOA_LABELS, ...natalTable] : [];

  const menh = palaces.find(
    (p: any) => p?.isOriginalPalace || /mệnh/i.test(String(p?.name || "")),
  );
  let focusStars = [
    ...((menh?.majorStars || []) as any[]).map((s: any) => String(s?.name || s || "")),
    ...majorStars.slice(0, 6),
  ].filter(Boolean);

  let topicPalaceKeywords: string[] = [];
  const useTopic = opts.useTopicFocus ?? Boolean(query && mode !== "interpret");
  if (useTopic && query) {
    const topic = resolveTopicPool(query);
    topicPalaceKeywords = topic.palaceKeywords;
    const topicStars = starsFromPalaces(palaces, topic.palaceKeywords);
    if (topicStars.length) {
      focusStars = [...new Set([...topicStars, ...focusStars.slice(0, 4)])];
    }
  }

  let patternIds: string[] = opts.patternIds ? [...opts.patternIds] : [];
  if (!patternIds.length) {
    try {
      const idx = buildChartIndex(palaces);
      patternIds = collectPatternIdsOnChart(idx);
    } catch {
      patternIds = [];
    }
  }

  const base = buildTinhHoaCabinet({
    majorStars,
    auxStars,
    tuHoaStars,
    focusStars,
    mode,
    query,
    patternIds,
  });

  let blindGiaiHoa: GiaiHoaEntry[] = [];
  if (query) {
    const keys = detectBlindKeys(query);
    const ids = keys.flatMap((k) => BLIND_SPOT_TO_GH[k] || []);
    blindGiaiHoa = entriesByIds([...new Set(ids)]).slice(0, 4);
  }

  let giaiHoaKnowledgeStr = base.giaiHoaKnowledgeStr;
  let combinedPromptBlock = base.combinedPromptBlock;

  if (blindGiaiHoa.length) {
    const extra = blindGiaiHoa.filter((e) => !giaiHoaKnowledgeStr.includes(e.title));
    if (extra.length) {
      const extraBlock = giaiHoaToPromptText(extra).replace(
        "=== GIẢI HÓA THỰC HÀNH (PHỤ — BỔ SUNG HÀNH ĐỘNG) ===",
        "=== GIẢI HÓA ĐIỂM MÙ (map từ câu hỏi) ===",
      );
      giaiHoaKnowledgeStr = [giaiHoaKnowledgeStr, extraBlock].filter(Boolean).join("\n\n");
      combinedPromptBlock = [base.cabinetDirectiveStr, base.bookCorpusStr, giaiHoaKnowledgeStr]
        .filter(Boolean)
        .join("\n\n");
    }
  }

  return {
    ...base,
    giaiHoaKnowledgeStr,
    combinedPromptBlock,
    topicPalaceKeywords,
    focusStars,
    blindGiaiHoa,
    patternIds,
  };
}
