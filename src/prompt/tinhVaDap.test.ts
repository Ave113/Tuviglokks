import { describe, it, expect } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { buildChartIndex } from "../utils/chartRelations";
import { buildTinhVaDapReport } from "./chartReports";
import { buildChartPromptContext } from "./buildChartPromptContext";

describe("buildTinhVaDapReport", () => {
  it("dựng trục A/B/C + mầm điểm mù từ lá mẫu", () => {
    const r = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    const chart = buildInterpretPayload(r, 2026);
    const palaces = chart.palaces || [];
    expect(palaces.length).toBe(12);
    const idx = buildChartIndex(palaces);
    const report = buildTinhVaDapReport(idx, palaces);
    expect(report).toMatch(/TRỤC VA ĐẬP HÌNH HỌC/);
    expect(report).toMatch(/TRỤC VA ĐẬP QUAN HỆ/);
    expect(report).toMatch(/MẦM ĐIỂM MÙ TRỌNG TÂM/);
    expect(report).toMatch(/Mệnh/);
    expect(report).not.toContain("vẫn phải tìm 1–2 điểm mù nhẹ");
    const sectionC = report.split("### C.")[1]?.split("### D.")[0] ?? "";
    const bullets = sectionC.split("\n").filter((line) => line.trim().startsWith("- "));
    expect(bullets.length).toBeLessThanOrEqual(3);
    expect(report.length).toBeGreaterThan(200);
  });

  it("ctx.tinhVaDapReportStr có trong buildChartPromptContext", () => {
    const r = generateTuviAstrolabe("2009-06-15", "08:00", BIRTHPLACE.SOUTH, "Nam");
    const chart = buildInterpretPayload(r, 2026);
    const ctx = buildChartPromptContext(chart);
    expect(ctx.tinhVaDapReportStr).toBeTruthy();
    expect(ctx.tinhVaDapReportStr).toMatch(/ĐIỂM MÙ|VA ĐẬP/);
  });
});
