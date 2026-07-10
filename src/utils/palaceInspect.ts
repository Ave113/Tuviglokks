/**
 * Helpers UI: tô cung theo cách cục + nội dung panel khi click cung.
 */

import {
  buildChartIndex,
  buildRelationsBlock,
  type ChartIndex,
} from "./chartRelations";
import {
  analyzeCachCuc,
  type CachCucAnalysis,
  type CachCucMatch,
  type CachCucQuality,
} from "./cachCuc";

export type PalaceQualityTone = "thanh" | "ham";

export function buildPalaceQualityMap(
  analysis: CachCucAnalysis,
): Partial<Record<number, PalaceQualityTone>> {
  const map: Partial<Record<number, PalaceQualityTone>> = {};
  const matches = [...analysis.uniqueTamPhuong, ...analysis.uniqueDongCung];

  matches.forEach((m) => {
    if (m.quality !== "thanh" && m.quality !== "ham") return;
    m.starBrightness.forEach((s) => {
      const bi = s.branchIdx;
      if (m.quality === "ham") {
        map[bi] = "ham";
      } else if (map[bi] !== "ham") {
        map[bi] = "thanh";
      }
    });
  });

  return map;
}

export function getCachCucTouchesPalace(
  analysis: CachCucAnalysis,
  branchIdx: number,
): CachCucMatch[] {
  const seen = new Set<string>();
  const out: CachCucMatch[] = [];
  [...analysis.uniqueTamPhuong, ...analysis.uniqueDongCung].forEach((m) => {
    const touch = m.starBrightness.some((s) => s.branchIdx === branchIdx);
    if (!touch || seen.has(m.dedupKey)) return;
    seen.add(m.dedupKey);
    out.push(m);
  });
  return out;
}

const QUALITY_BADGE: Record<CachCucQuality, string> = {
  thanh: "cách thành",
  trung: "cách trung bình",
  pha: "cách phá",
  ham: "cách hãm",
};

export interface PalaceInspectPanel {
  palaceName: string;
  earthlyBranch: string;
  heavenlyStem: string;
  relationsBlock: string;
  cachCucLines: string[];
  qualityTone?: PalaceQualityTone;
}

export function buildPalaceInspectPanel(
  chartIdx: ChartIndex,
  analysis: CachCucAnalysis,
  branchIdx: number,
): PalaceInspectPanel | null {
  const palace = chartIdx.palaceByBranch[branchIdx];
  if (!palace) return null;

  const relationsBlock = buildRelationsBlock(chartIdx, palace);
  const touches = getCachCucTouchesPalace(analysis, branchIdx);
  const qualityMap = buildPalaceQualityMap(analysis);

  const cachCucLines = touches.map(
    (m) =>
      `• ${m.name} [${QUALITY_BADGE[m.quality]}] — ${m.axisLabel}` +
      (m.scope === "dongCung" && m.dongCungPalace ? ` (đồng cung ${m.dongCungPalace})` : ""),
  );

  return {
    palaceName: palace.name,
    earthlyBranch: palace.earthlyBranch || "",
    heavenlyStem: palace.heavenlyStem || "",
    relationsBlock,
    cachCucLines,
    qualityTone: qualityMap[branchIdx],
  };
}

export function analyzeChartForUi(palaces: any[]): {
  chartIdx: ChartIndex;
  analysis: CachCucAnalysis;
  qualityMap: Partial<Record<number, PalaceQualityTone>>;
} {
  const chartIdx = buildChartIndex(palaces);
  const analysis = analyzeCachCuc(chartIdx);
  return {
    chartIdx,
    analysis,
    qualityMap: buildPalaceQualityMap(analysis),
  };
}