import { describe, it, expect } from "vitest";
import { generateTuviAstrolabe } from "./tuvi";
import { BIRTHPLACE } from "../constants/birthplace";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { computeBaZi } from "./bazi";

const bzOf = (date: string, time: string) => {
  const calc = generateTuviAstrolabe(date, time, BIRTHPLACE.CENTRAL_SOUTH_OF_17, "Nam");
  return {
    calc,
    bazi: computeBaZi(new Date(calc.timezoneNormalization.normalizedDate.getTime()), "Nam"),
  };
};

describe("Bát Tự Dạ Tý 23:00–23:59 (đổi ngày như Tử Vi)", () => {
  it("23:05 và 00:30 hôm sau đồng nhất Tứ Trụ", () => {
    const a = bzOf("2009-06-09", "23:05");
    const b = bzOf("2009-06-10", "00:30");
    expect(a.bazi.pillars.day.ganChiVi).toBe("Bính Tuất");
    expect(a.bazi.pillars.hour.zhiVi).toBe("Tý");
    expect(a.bazi.pillars).toEqual(b.bazi.pillars);
  });

  it("lunarText Bát Tự trùng ngày âm Tử Vi (không 2 ngày âm/lá)", () => {
    const { calc, bazi } = bzOf("2009-06-09", "23:05");
    expect(bazi.lunarText).toBe(calc.chart.lunarDate);
  });

  it("22:00 khác ngày với 23:05 (ranh giới đúng 23:00)", () => {
    const late = bzOf("2009-06-09", "23:05");
    const hoi = bzOf("2009-06-09", "22:00");
    expect(hoi.bazi.pillars.day.ganChiVi).not.toBe(late.bazi.pillars.day.ganChiVi);
    expect(hoi.bazi.pillars.hour.zhiVi).toBe("Hợi");
  });

  it("payload B03 giữ chi giờ Tý + Nhật trụ ngày mới", () => {
    const calc = generateTuviAstrolabe("2009-06-09", "23:05", BIRTHPLACE.CENTRAL_SOUTH_OF_17, "Nam");
    const payload = buildInterpretPayload(calc, 2026);
    const b = payload.baZi as import("./bazi").BaZiChart;
    expect(b?.pillars.hour.zhiVi).toBe("Tý");
    expect(b?.pillars.day.ganChiVi).toBe("Bính Tuất");
  });
});
