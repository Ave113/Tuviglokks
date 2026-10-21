import { describe, it, expect } from "vitest";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { BIRTHPLACE } from "../constants/birthplace";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import type { BaZiChart } from "../utils/bazi";
import { analyzeBaZiCrossTags, buildBaZiCrossTagsReport } from "./baZiCrossTags";
import { analyzeLuuNienEventCards } from "./luuNienEventCards";
import { buildChartPromptContext } from "./buildChartPromptContext";

describe("baZiCrossTags", () => {
  it("không baZi → report thiếu BT", () => {
    const r = analyzeBaZiCrossTags([], null);
    expect(r.hasBaZi).toBe(false);
    expect(r.tags).toHaveLength(0);
    expect(r.reportText).toMatch(/Không có lá Bát Tự/);
  });

  it("có baZi → 4 trục + tag hợp lệ", () => {
    const calc = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    const payload = buildInterpretPayload(calc, 2026);
    expect(payload.baZi).toBeTruthy();
    const baZi = payload.baZi as BaZiChart;
    const yearCards = analyzeLuuNienEventCards(payload.palaces, payload).cards;
    const r = analyzeBaZiCrossTags(payload.palaces, baZi, {
      transitYear: 2026,
      yearCards,
    });
    expect(r.hasBaZi).toBe(true);
    expect(r.tags).toHaveLength(4);
    const axes = r.tags.map((t) => t.axis).sort();
    expect(axes).toEqual(["ban_sac", "han", "quan", "tai"].sort());
    for (const t of r.tags) {
      expect(["dong_thuan", "bo_sung", "mau_thuan"]).toContain(t.tag);
      expect(t.tagLabel.length).toBeGreaterThan(3);
      expect(t.voice.length).toBeGreaterThan(10);
    }
    expect(r.reportText).toMatch(/THẺ TIN CẬY|Đồng thuận|Bổ sung|Mâu thuẫn/);
    expect(r.reportText).toMatch(/BẢN SẮC|TÀI|CÔNG DANH|VẬN HẠN/);
  });

  it("ctx interpret có baZiCrossTagsStr", () => {
    const calc = generateTuviAstrolabe("2001-07-08", "05:15", BIRTHPLACE.SOUTH, "Nam");
    const payload = buildInterpretPayload(calc, 2026);
    const ctx = buildChartPromptContext(payload);
    expect(ctx.baZiCrossTagsStr.length).toBeGreaterThan(40);
    // Có BT thì có 4 trục
    if (payload.baZi) {
      expect(ctx.baZiCrossTagsStr).toMatch(/BẢN SẮC|TÀI LỘC/);
    }
  });

  it("build report với null an toàn", () => {
    const text = buildBaZiCrossTagsReport([], undefined);
    expect(text).toMatch(/Không có lá Bát Tự/);
  });
});
