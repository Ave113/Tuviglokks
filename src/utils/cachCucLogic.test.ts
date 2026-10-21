import { describe, it, expect } from "vitest";
import { generateTuviAstrolabe } from "./tuvi";
import { buildChartIndex } from "./chartRelations";
import { BIRTHPLACE } from "../constants/birthplace";
import {
  applyEnvironmentToQuality,
  buildCachCucLogicSheet,
  collectPatternIdsOnChart,
  enrichAnalysis,
  scanPressures,
} from "./cachCucLogic";
import { detectCachCucForAxis, CACH_CUC_AXES } from "./cachCuc";

function chartIdx() {
  const r = generateTuviAstrolabe(
    "2009-06-09",
    "00:30",
    BIRTHPLACE.CENTRAL_SOUTH_OF_17,
    "Nam",
  );
  return buildChartIndex(r.chart.palaces);
}

describe("cachCucLogic", () => {
  it("applyEnvironment: sát dày hạ quality", () => {
    const r = applyEnvironmentToQuality("thanh", [
      { kind: "sat", label: "Kình Dương", palaceName: "Mệnh" },
      { kind: "sat", label: "Đà La", palaceName: "Mệnh" },
    ]);
    expect(r.quality).not.toBe("thanh");
    expect(r.notes.length).toBeGreaterThan(0);
  });

  it("applyEnvironment: cát hỗ nâng pha", () => {
    const r = applyEnvironmentToQuality("pha", [
      { kind: "cat", label: "Hóa Lộc", palaceName: "Tài" },
      { kind: "cat", label: "Văn Xương", palaceName: "Tài" },
    ]);
    expect(["trung", "pha", "thanh"]).toContain(r.quality);
  });

  it("logic sheet + pattern ids trên lá fixture", () => {
    const idx = chartIdx();
    const sheet = buildCachCucLogicSheet(idx);
    expect(sheet).toMatch(/NHÂN QUẢ:|CHUỖI NHÂN QUẢ/);
    expect(sheet).toMatch(/GIỌNG MÁY:/);
    const ids = collectPatternIdsOnChart(idx);
    expect(ids.length).toBeGreaterThan(0);
    const enriched = enrichAnalysis(idx);
    expect(enriched[0].logicLines.some((L) => L.includes("NHÂN QUẢ") || L.includes("GIỌNG"))).toBe(
      true,
    );
  });

  it("scanPressures không crash trên match Mệnh", () => {
    const idx = chartIdx();
    const menh = detectCachCucForAxis(idx, CACH_CUC_AXES[0]);
    expect(menh.length).toBeGreaterThan(0);
    const p = scanPressures(idx, menh[0]);
    expect(Array.isArray(p)).toBe(true);
  });
});
