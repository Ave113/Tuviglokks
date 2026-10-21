import { describe, it, expect } from "vitest";
import { generateTuviAstrolabe } from "./tuvi";
import { BIRTHPLACE } from "../constants/birthplace";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import {
  resolveCurrentDaYun,
  formatCurrentDaYunReport,
  type BaZiChart,
} from "./bazi";
import { buildChartPromptContext } from "../prompt/buildChartPromptContext";

describe("Bát Tự trong vận XX (resolveCurrentDaYun)", () => {
  it("chốt đúng 1 vận cho năm xem + headline chuẩn", () => {
    const calc = generateTuviAstrolabe("2009-06-09", "00:30", BIRTHPLACE.CENTRAL_SOUTH_OF_17, "Nam");
    const payload = buildInterpretPayload(calc, 2026);
    const b = payload.baZi as BaZiChart;
    expect(b?.daYun?.length).toBeGreaterThan(0);

    const cur = resolveCurrentDaYun(b, 2026);
    expect(cur).not.toBeNull();
    expect(cur!.ganChiVi.trim().length).toBeGreaterThan(2);
    expect(cur!.startYear).toBeLessThanOrEqual(2026);
    if (cur!.endYear != null) {
      expect(cur!.endYear).toBeGreaterThanOrEqual(2026);
    }
    expect(cur!.headline).toMatch(/Bát Tự trong vận/);
    expect(cur!.headline).toContain(cur!.ganChiVi);
    expect(cur!.headline).toMatch(/2026/);
  });

  it("format report có HEADLINE + cấm tự nhẩm", () => {
    const calc = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    const payload = buildInterpretPayload(calc, 2026);
    const b = payload.baZi as BaZiChart;
    const text = formatCurrentDaYunReport(b, 2026);
    expect(text).toMatch(/BÁT TỰ ĐANG TRONG VẬN/);
    expect(text).toMatch(/HEADLINE: Bát Tự trong vận/);
    expect(text).toMatch(/CẤM tự nhẩm/);
  });

  it("ctx interpret baZiStr có trong vận + timeline", () => {
    const calc = generateTuviAstrolabe("2001-07-08", "05:15", BIRTHPLACE.SOUTH, "Nam");
    const payload = buildInterpretPayload(calc, 2026);
    const ctx = buildChartPromptContext(payload);
    expect(ctx.baZiStr).toMatch(/Bát Tự trong vận|BÁT TỰ ĐANG TRONG VẬN/);
    expect(ctx.baZiStr).toMatch(/LƯU NIÊN BÁT TỰ|Lưu niên/);
  });
});

