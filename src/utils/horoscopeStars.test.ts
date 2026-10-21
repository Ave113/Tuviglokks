import { describe, it, expect } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { generateTuviAstrolabe, calculateTransitInfo, EARTHLY_BRANCHES, palaceIndexToBranchIndex } from "./tuvi";
import { isVanStarName } from "./horoscopeStars";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { buildChartStarWhitelist } from "../server/starHallucinationGuard";
import { normalizeStarName } from "./chartRelations";

describe("mergeIztroHoroscopeStars via calculateTransitInfo", () => {
  it("lá thật: có Lưu Khôi hoặc Lưu Việt + ít nhất một sao Vận", () => {
    const r = generateTuviAstrolabe("1988-03-12", "22:45", BIRTHPLACE.NORTH, "Nữ");
    const birthYear = r.chart.rawDates?.lunarDate?.lunarYear ?? 1988;
    const branch = EARTHLY_BRANCHES[((birthYear - 4) % 12 + 12) % 12];
    const transit = calculateTransitInfo(
      birthYear,
      branch,
      "Nữ",
      r.chart.palaces,
      2026,
      r.chart,
    );
    const all = Object.values(transit.saoLuuMap).flat();
    expect(all.some((s) => /Lưu Khôi|Lưu Việt/i.test(s))).toBe(true);
    expect(all.some((s) => /^Vận\s+/i.test(s))).toBe(true);
    // Vẫn giữ lõi app
    expect(all).toContain("Lưu Thái Tuế");
  });

  it("mock không horoscope: không crash, không có Vận", () => {
    const palaces = Array.from({ length: 12 }, (_, i) => ({
      index: i,
      name: `Cung ${EARTHLY_BRANCHES[(i + 2) % 12]}`,
      earthlyBranch: EARTHLY_BRANCHES[(i + 2) % 12],
      decadal: { range: [1, 10] },
      majorStars: [],
      minorStars: [],
      adjectiveStars: [],
    }));
    const t = calculateTransitInfo(1995, "Hợi", "Nam", palaces, 2026);
    const all = Object.values(t.saoLuuMap).flat();
    expect(all).toContain("Lưu Thái Tuế");
    expect(all.every((s) => !/^Vận\s+/i.test(s))).toBe(true);
  });

  it("payload: [SAO LƯU] Lưu Khôi/Việt và [SAO VẬN] vào whitelist quét theo lá", () => {
    const r = generateTuviAstrolabe("1988-03-12", "22:45", BIRTHPLACE.NORTH, "Nữ");
    const chart = buildInterpretPayload(r, 2026);
    const hasLuuKhoiViet = chart.palaces.some((p) =>
      (p.minorStars || []).some((s) => /\[SAO LƯU\].*Lưu (Khôi|Việt)/i.test(s.name)),
    );
    const hasVan = chart.palaces.some((p) =>
      (p.minorStars || []).some((s) => /\[SAO VẬN\]/i.test(s.name)),
    );
    expect(hasLuuKhoiViet || hasVan).toBe(true);

    const known = buildChartStarWhitelist(chart);
    // Ít nhất một trong các norm lưu/vận phải có
    const anyLuuOrVan = [...known].some(
      (n) => n.includes("lưu khôi") || n.includes("lưu việt") || n.startsWith("vận "),
    );
    expect(anyLuuOrVan).toBe(true);
  });
});

describe("isVanStarName", () => {
  it("nhận Vận * và strip tag", () => {
    expect(isVanStarName("Vận Lộc")).toBe(true);
    expect(isVanStarName("[SAO VẬN] Vận Khôi")).toBe(true);
    expect(isVanStarName("Lưu Khôi")).toBe(false);
    expect(normalizeStarName("[SAO VẬN] Vận Mã")).toBe(normalizeStarName("Vận Mã"));
  });
});

describe("Vận/Lưu Tứ Hóa + can–chi đại hạn + ages tiểu hạn", () => {
  it("transit: đủ Vận Tứ Hóa 4 sao, Lưu Tứ Hóa 4 sao, can–chi ĐH, ages TH", () => {
    const r = generateTuviAstrolabe("1988-03-12", "22:45", BIRTHPLACE.NORTH, "Nữ");
    const birthYear = r.chart.rawDates?.lunarDate?.lunarYear ?? 1988;
    const branch = EARTHLY_BRANCHES[((birthYear - 4) % 12 + 12) % 12];
    const transit = calculateTransitInfo(
      birthYear,
      branch,
      "Nữ",
      r.chart.palaces,
      2026,
      r.chart,
    );

    expect(transit.daiHanStem).toBeTruthy();
    expect(transit.daiHanBranch).toBeTruthy();
    expect(transit.daiHanRange).toBeTruthy();
    expect(transit.daiHanRange![0]).toBeLessThanOrEqual(transit.lunarAge);
    expect(transit.daiHanRange![1]).toBeGreaterThanOrEqual(transit.lunarAge);

    expect(transit.decadalTuHoa?.items?.length).toBe(4);
    expect(transit.yearlyTuHoa?.items?.length).toBe(4);
    expect(transit.decadalTuHoa!.items.map((i) => i.hoa)).toEqual([
      "Hóa Lộc",
      "Hóa Quyền",
      "Hóa Khoa",
      "Hóa Kỵ",
    ]);
    // Mỗi hóa tìm được cung trên lá
    expect(transit.decadalTuHoa!.items.every((i) => i.branchIdx >= 0 && i.star)).toBe(true);
    expect(transit.yearlyTuHoa!.items.every((i) => i.branchIdx >= 0 && i.star)).toBe(true);

    // ages tiểu hạn hiện tại + map 12 chi
    expect(transit.tieuHanAges.length).toBeGreaterThan(0);
    let branchWithAges = 0;
    for (let b = 0; b < 12; b++) {
      if ((transit.tieuHanAgesByBranch[b] || []).length > 0) branchWithAges += 1;
    }
    expect(branchWithAges).toBe(12);

    // saoLuuMap có Vận Hóa + Lưu Hóa
    const all = Object.values(transit.saoLuuMap).flat();
    expect(all.some((s) => /^Vận Hóa Lộc/i.test(s))).toBe(true);
    expect(all.some((s) => /^Lưu Hóa Lộc/i.test(s))).toBe(true);
  });

  it("payload: transit* fields + palace ages/decadal stem", () => {
    const r = generateTuviAstrolabe("1988-03-12", "22:45", BIRTHPLACE.NORTH, "Nữ");
    const chart = buildInterpretPayload(r, 2026);
    expect(chart.transitDecadalStem).toBeTruthy();
    expect(chart.transitDecadalBranch).toBeTruthy();
    expect(chart.transitDecadalTuHoa?.items?.length).toBe(4);
    expect(chart.transitYearlyTuHoa?.items?.length).toBe(4);
    expect(chart.transitTieuHanAges?.length).toBeGreaterThan(0);
    const withAges = chart.palaces.filter((p) => Array.isArray(p.ages) && p.ages!.length > 0);
    expect(withAges.length).toBe(12);
    expect(chart.palaces.some((p) => p.decadal?.heavenlyStem)).toBe(true);
  });
});

describe("yearlyDecStar — Tuế Tiền / Tướng Tiền năm xem", () => {
  it("extract đủ 12 chi Tuế Tiền + Tướng Tiền, khác vòng gốc ở ít nhất 1 cung", () => {
    const r = generateTuviAstrolabe("1988-03-12", "22:45", BIRTHPLACE.NORTH, "Nữ");
    const birthYear = r.chart.rawDates?.lunarDate?.lunarYear ?? 1988;
    const branch = EARTHLY_BRANCHES[((birthYear - 4) % 12 + 12) % 12];
    const transit = calculateTransitInfo(
      birthYear,
      branch,
      "Nữ",
      r.chart.palaces,
      2026,
      r.chart,
    );
    expect(transit.yearlyDecRings).toBeTruthy();
    const rings = transit.yearlyDecRings!;
    let filledSui = 0;
    let filledJiang = 0;
    let differsNatal = 0;
    for (const p of r.chart.palaces) {
      const b = palaceIndexToBranchIndex(p.index);
      if (rings.yearSuiqianByBranch[b]) filledSui += 1;
      if (rings.yearJiangqianByBranch[b]) filledJiang += 1;
      if (
        rings.yearSuiqianByBranch[b] &&
        p.suiqian12 &&
        rings.yearSuiqianByBranch[b] !== p.suiqian12
      ) {
        differsNatal += 1;
      }
    }
    expect(filledSui).toBe(12);
    expect(filledJiang).toBe(12);
    // Năm xem 2026 ≠ năm sinh 1988 → vòng năm khác gốc ở hầu hết cung
    expect(differsNatal).toBeGreaterThan(0);
  });

  it("payload gắn yearSuiqian12 / yearJiangqian12 trên từng cung", () => {
    const r = generateTuviAstrolabe("1988-03-12", "22:45", BIRTHPLACE.NORTH, "Nữ");
    const chart = buildInterpretPayload(r, 2026);
    const withYear = chart.palaces.filter((p) => p.yearSuiqian12 || p.yearJiangqian12);
    expect(withYear.length).toBe(12);
    // Có ít nhất vài tên Tuế/Tướng tiền quen thuộc
    const allYearNames = chart.palaces.flatMap((p) =>
      [p.yearSuiqian12, p.yearJiangqian12].filter(Boolean),
    );
    expect(
      allYearNames.some((n) =>
        /Tang Môn|Bạch Hổ|Quan Phù|Hoa Cái|Tai Sát|Long Đức|Hao/i.test(String(n)),
      ),
    ).toBe(true);
  });
});
