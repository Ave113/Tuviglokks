import { describe, it, expect } from "vitest";
import { generateTuviAstrolabe } from "./tuvi";
import { BIRTHPLACE } from "../constants/birthplace";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import type { BaZiChart } from "./bazi";
import {
  resolveYearGanZhi,
  analyzeBaZiTimeline,
  shiShenBetweenGans,
} from "./baZiTimeline";
import { buildChartPromptContext } from "../prompt/buildChartPromptContext";

describe("baZiTimeline — timeline đúng lối Tử Bình", () => {
  it("2026 can–chi = Bính Ngọ", () => {
    const y = resolveYearGanZhi(2026);
    expect(y).not.toBeNull();
    expect(y!.ganVi).toBe("Bính");
    expect(y!.zhiVi).toBe("Ngọ");
    expect(y!.ganChiVi).toBe("Bính Ngọ");
  });

  it("shiShenBetweenGans: đồng hành / khác hành", () => {
    expect(shiShenBetweenGans("Giáp", "Ất")).toBe("Kiếp Tài");
    expect(shiShenBetweenGans("Giáp", "Giáp")).toBe("Tỷ Kiên");
  });

  it("Lưu niên + trong vận + report", () => {
    const calc = generateTuviAstrolabe(
      "2009-06-09",
      "00:30",
      BIRTHPLACE.CENTRAL_SOUTH_OF_17,
      "Nam",
    );
    const payload = buildInterpretPayload(calc, 2026);
    const b = payload.baZi as BaZiChart;
    const tl = analyzeBaZiTimeline(b, 2026);
    expect(tl.daYun).not.toBeNull();
    expect(tl.luuNien).not.toBeNull();
    expect(tl.luuNien!.ganChiVi).toBe("Bính Ngọ");
    expect(tl.luuNien!.shiShenGan.length).toBeGreaterThan(1);
    expect(tl.luuNien!.headline).toMatch(/Lưu niên 2026|Bính Ngọ/);
    expect(tl.reportText).toMatch(/TIMELINE BÁT TỰ|LƯU NIÊN BÁT TỰ/);
    expect(tl.reportText).toMatch(/Bát Tự trong vận/);
    expect(tl.reportText).toMatch(/Thập Thần/);
  });

  it("ctx interpret baZiStr có timeline lưu niên", () => {
    const calc = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    const payload = buildInterpretPayload(calc, 2026);
    const ctx = buildChartPromptContext(payload);
    expect(ctx.baZiStr).toMatch(/Lưu niên 2026|LƯU NIÊN BÁT TỰ|Bính Ngọ|TIMELINE/);
    expect(ctx.baZiStr).toMatch(/Bát Tự trong vận/);
  });
});
