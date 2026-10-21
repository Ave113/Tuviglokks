import { describe, it, expect } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { analyzeCachCuc } from "../utils/cachCuc";
import { buildChartIndex } from "../utils/chartRelations";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { buildTrongTamReport, scoreLifeFocus } from "./lifeReports";

const makeChart = () => {
  const raw = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
  const chart = buildInterpretPayload(raw, 2026);
  const idx = buildChartIndex(chart.palaces || []);
  return { chart, idx, analysis: analyzeCachCuc(idx) };
};

describe("lifeReports — trọng tâm lá số", () => {
  it("chấm đủ 7 trục và trả top 3 đúng thứ tự giảm dần", () => {
    const { idx, analysis } = makeChart();
    const axes = scoreLifeFocus(idx, analysis);
    expect(axes).toHaveLength(7);
    for (let i = 1; i < axes.length; i++) {
      expect(axes[i - 1].intensity).toBeGreaterThanOrEqual(axes[i].intensity);
    }
    expect(axes.every((a) => Number.isFinite(a.score))).toBe(true);
  });

  it("đọc đúng mutagen dạng 'Hóa Lộc/Hóa Kỵ' của iztro", () => {
    const { idx, analysis } = makeChart();
    const banSac = scoreLifeFocus(idx, analysis).find((a) => a.key === "ban-sac");
    expect(banSac?.signals).toContain("Hóa Khoa tại Mệnh (Tử Vi)");
  });

  it("block TRỌNG TÂM có đúng 3 trục, neo Phần 0 và không rác máy", () => {
    const { idx, analysis } = makeChart();
    const block = buildTrongTamReport(idx, analysis);
    expect(block).toContain("TRỌNG TÂM LÁ SỐ");
    expect(block.match(/^  \d\. \[/gm)).toHaveLength(3);
    expect(block).toContain("Phần 0 — Chân dung");
    expect(block).toContain("CÓ XU HƯỚNG");
    expect(block).not.toMatch(/undefined|NaN/);
  });

});
