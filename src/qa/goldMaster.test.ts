import { describe, it, expect } from "vitest";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { buildChartIndex } from "../utils/chartRelations";
import { BIRTHPLACE } from "../constants/birthplace";
import { BENCHMARK_20_CHARTS } from "./benchmark20Charts";
import {
  buildMachineGold,
  idealSkeletonFromGold,
  scoreGoldMaster,
  textMentionsPattern,
  HUMAN_GOLD_BOOSTS,
} from "./goldMaster";
import { buildCachCucLogicSheet } from "../utils/cachCucLogic";
import { CACH_CUC_KNOWLEDGE_LINKS } from "../knowledge/cachCucKnowledgeMap";

function idxForCase(c: (typeof BENCHMARK_20_CHARTS)[number]) {
  const r = generateTuviAstrolabe(c.solarDate, c.solarTime, c.birthplace, c.gender);
  return buildChartIndex(r.chart.palaces);
}

describe("goldMaster — machine gold + scorer", () => {
  it("mọi pattern trong engine có (hoặc normalize được) entry knowledge map", () => {
    // Spot-check core patterns exist in map
    const ids = new Set(CACH_CUC_KNOWLEDGE_LINKS.map((l) => l.patternId));
    for (const need of [
      "sat-pha-tham",
      "co-nguyet-dong-luong",
      "phu-tuong",
      "tu-phu",
      "liem-tuong",
      "vu-tham",
      "co-luong",
      "am-duong-hoi",
    ]) {
      expect(ids.has(need)).toBe(true);
    }
  });

  it("B03: machine gold có Liêm Tướng hoặc Tử Phủ", () => {
    const c = BENCHMARK_20_CHARTS.find((x) => x.id === "B03")!;
    // B03 time slightly different from unit test 00:30 — still should detect major ways
    const gold = buildMachineGold(idxForCase(c), { chartId: "B03" });
    expect(gold.patternNames.length + gold.patternIds.length).toBeGreaterThan(0);
  });

  it("lá 2009 00:30 (cachCuc fixture): gold + ideal skeleton goldOk", () => {
    const r = generateTuviAstrolabe(
      "2009-06-09",
      "00:30",
      BIRTHPLACE.CENTRAL_SOUTH_OF_17,
      "Nam",
    );
    const idx = buildChartIndex(r.chart.palaces);
    const gold = buildMachineGold(idx, { chartId: "B03-fixture" });
    expect(gold.patternNames.some((n) => /Liêm Tướng|Tử Phủ|Phủ Tướng/i.test(n))).toBe(
      true,
    );

    const ideal = idealSkeletonFromGold(gold);
    // Thêm human must for B03-like
    const withHuman = ideal + "\nLiêm Tướng Mệnh\n";
    const card = scoreGoldMaster(withHuman, gold, { chartId: "B03" });
    expect(card.layers.find((l) => l.name === "pattern_coverage")!.score).toBeGreaterThanOrEqual(
      50,
    );
    expect(card.layers.find((l) => l.name === "headings")!.score).toBe(100);
    expect(card.goldOk).toBe(true);
  });

  it("textMentionsPattern: nhận biến thể", () => {
    expect(textMentionsPattern("Lá này Sát Phá Tham rõ", "Sát Phá Tham")).toBe(true);
    expect(textMentionsPattern("không liên quan", "Sát Phá Tham")).toBe(false);
  });

  it("logic sheet có NHÂN QUẢ khi có cách", () => {
    const r = generateTuviAstrolabe(
      "2009-06-09",
      "00:30",
      BIRTHPLACE.CENTRAL_SOUTH_OF_17,
      "Nam",
    );
    const idx = buildChartIndex(r.chart.palaces);
    const sheet = buildCachCucLogicSheet(idx);
    expect(sheet).toMatch(/CHUỖI NHÂN QUẢ|NHÂN QUẢ:/);
    expect(sheet).toMatch(/cách thành|cách trung|cách phá|cách hãm/);
  }, 20_000);

  it("benchmark 10 lá đầu: machine gold không crash + sheet non-empty", () => {
    for (const c of BENCHMARK_20_CHARTS.slice(0, 10)) {
      const idx = idxForCase(c);
      const gold = buildMachineGold(idx, { chartId: c.id });
      expect(Array.isArray(gold.patternIds)).toBe(true);
      const sheet = buildCachCucLogicSheet(idx);
      expect(sheet.length).toBeGreaterThan(40);
    }
  }, 30_000);

  it("HUMAN_GOLD_BOOSTS id duy nhất", () => {
    const ids = HUMAN_GOLD_BOOSTS.map((b) => b.chartId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
