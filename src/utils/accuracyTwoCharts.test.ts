/**
 * Kiểm chứng độ chính xác an lá — 2 lá số bất kỳ (khác giới, giờ, nơi sinh, thế hệ).
 * Không dùng fixture cứng từ integration server; đánh giá rule-based + khớp iztro.
 */
import { describe, it, expect } from "vitest";
import { astro } from "iztro";
import { BIRTHPLACE, type BirthplaceRegion } from "../constants/birthplace";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { analyzeCachCuc } from "./cachCuc";
import { allStarsOf, buildChartIndex, normalizeStarName } from "./chartRelations";
import { MAJOR_STAR_NORMS } from "./tuviStarCatalog";
import { analyzeTuanTriet } from "./tuanTriet";
import { HOA_LABELS, TU_HOA_BY_STEM, stemNameByYear, type TuHoaQuartet } from "./tuHoa";

/** Mutagen short label trên sao iztro vi-VN: Lộc/Quyền/Khoa/Kỵ */
const MUTAGEN_SHORT: TuHoaQuartet = ["Lộc", "Quyền", "Khoa", "Kỵ"];
import {
  EARTHLY_BRANCHES,
  generateTuviAstrolabe,
  getTuviGlobalTime,
  calculateTransitInfo,
  palaceIndexToBranchIndex,
} from "./tuvi";

const MAJOR_STARS_VI = [
  "Tử Vi",
  "Thiên Cơ",
  "Thái Dương",
  "Vũ Khúc",
  "Thiên Đồng",
  "Liêm Trinh",
  "Thiên Phủ",
  "Thái Âm",
  "Tham Lang",
  "Cự Môn",
  "Thiên Tướng",
  "Thiên Lương",
  "Thất Sát",
  "Phá Quân",
];

const PALACE_KEYWORDS = [
  "Mệnh",
  "Phụ",
  "Phúc",
  "Điền",
  "Quan",
  "Nô",
  "Thiên Di",
  "Tật",
  "Tài",
  "Tử",
  "Phu",
  "Huynh",
];

type CaseInput = {
  id: string;
  label: string;
  solarDate: string;
  solarTime: string;
  birthplace: BirthplaceRegion;
  gender: "Nam" | "Nữ";
  expectedHourBranch: string;
  transitYear: number;
};

/** Hai lá bất kỳ — khác giới, giờ, vùng, thế hệ. */
const CASES: CaseInput[] = [
  {
    id: "A",
    label: "Lá A — Nữ, 12/03/1988 22:45, Miền Bắc (giờ Hợi)",
    solarDate: "1988-03-12",
    solarTime: "22:45",
    birthplace: BIRTHPLACE.NORTH,
    gender: "Nữ",
    expectedHourBranch: "Hợi",
    transitYear: 2026,
  },
  {
    id: "B",
    label: "Lá B — Nam, 08/07/2001 05:15, Miền Nam (giờ Mão)",
    solarDate: "2001-07-08",
    solarTime: "05:15",
    birthplace: BIRTHPLACE.SOUTH,
    gender: "Nam",
    expectedHourBranch: "Mão",
    transitYear: 2026,
  },
];

function collectMutagenFromChart(palaces: any[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of palaces || []) {
    for (const s of allStarsOf(p)) {
      const m = s?.mutagen != null ? String(s.mutagen).trim() : "";
      if (!m) continue;
      map.set(String(s.name || "").trim(), m);
    }
  }
  return map;
}

function majorStarPlacement(palaces: any[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of palaces) {
    for (const s of p.majorStars || []) {
      const n = normalizeStarName(String(s.name || s));
      if (MAJOR_STAR_NORMS.has(n)) {
        map.set(n, p.name || `index-${p.index}`);
      }
    }
  }
  return map;
}

function summarizeCase(c: CaseInput) {
  const calc = generateTuviAstrolabe(c.solarDate, c.solarTime, c.birthplace, c.gender);
  const chart = calc.chart;
  const payload = buildInterpretPayload(calc, c.transitYear);
  const majors = majorStarPlacement(chart.palaces);
  const tuanTriet = analyzeTuanTriet(chart.palaces);
  const index = buildChartIndex(chart.palaces);
  const cachCuc = analyzeCachCuc(index);
  const birthYear =
    chart?.rawDates?.lunarDate?.lunarYear ??
    new Date(calc.timezoneNormalization.normalizedDate).getFullYear();
  const stem = stemNameByYear(birthYear);
  const lunarAge = c.transitYear - birthYear + 1;

  const transit = calculateTransitInfo(
    birthYear,
    EARTHLY_BRANCHES[((birthYear - 4) % 12 + 12) % 12],
    c.gender,
    chart.palaces,
    c.transitYear,
  );

  // Cross-check: cùng solar + hour index → iztro trực tiếp phải khớp 14 chính tinh
  const direct = astro.bySolar(
    calc.finalSolarDateUsed,
    calc.tuviGlobalHourResult.timeIndex,
    c.gender,
    true,
    "vi-VN",
  );
  const directMajors = majorStarPlacement(direct.palaces);

  return {
    calc,
    chart,
    payload,
    majors,
    tuanTriet,
    cachCuc,
    birthYear,
    stem,
    lunarAge,
    transit,
    directMajors,
  };
}

describe("Độ chính xác an lá — 2 lá số bất kỳ", () => {
  for (const c of CASES) {
    describe(c.label, () => {
      const s = summarizeCase(c);

      it("lập được 12 cung, index 0 = Dần, đủ keyword cung", () => {
        expect(s.chart.palaces).toHaveLength(12);
        const p0 = s.chart.palaces.find((p: any) => p.index === 0);
        expect(p0?.earthlyBranch).toBe("Dần");
        expect(palaceIndexToBranchIndex(0)).toBe(2);

        const names = s.chart.palaces.map((p: any) => String(p.name));
        for (const kw of PALACE_KEYWORDS) {
          expect(
            names.some((n) => n.includes(kw)),
            `thiếu cung chứa "${kw}" — có: ${names.join(", ")}`,
          ).toBe(true);
        }
      });

      it("giờ địa chi khớp kỳ vọng (giờ tiêu chuẩn Đông phương)", () => {
        expect(s.calc.tuviGlobalHourResult.branchName).toBe(c.expectedHourBranch);
        // getTuviGlobalTime trên ngày đã normalize phải cùng nhánh
        const hour = getTuviGlobalTime(
          s.calc.effectiveLunarMonth,
          s.calc.timezoneNormalization.normalizedDate,
        );
        expect(hour.branchName).toBe(c.expectedHourBranch);
      });

      it("đúng 14 chính tinh, mỗi sao xuất hiện đúng 1 lần", () => {
        expect(s.majors.size).toBe(14);
        for (const star of MAJOR_STARS_VI) {
          expect(s.majors.has(normalizeStarName(star)), `thiếu chính tinh ${star}`).toBe(true);
        }
      });

      it("khớp 100% vị trí 14 chính tinh với iztro.bySolar (cùng ngày/giờ cuối)", () => {
        expect(s.directMajors.size).toBe(14);
        for (const [star, palace] of s.majors) {
          expect(
            s.directMajors.get(star),
            `lệch vị trí ${star}: app=${palace} iztro=${s.directMajors.get(star)}`,
          ).toBe(palace);
        }
      });

      it("Tứ Hóa bẩm sinh: 4 sao thụ hóa mang mutagen Lộc/Quyền/Khoa/Kỵ đúng can năm", () => {
        const expected = TU_HOA_BY_STEM[s.stem];
        expect(expected, `không có bảng tứ hóa cho can ${s.stem}`).toBeTruthy();

        const mutagenMap = collectMutagenFromChart(s.chart.palaces);
        expected.forEach((starName, i) => {
          const shortHoa = MUTAGEN_SHORT[i];
          const fullHoa = HOA_LABELS[i];
          const hitName = [...mutagenMap.keys()].find(
            (n) => normalizeStarName(n) === normalizeStarName(starName),
          );
          expect(
            hitName,
            `${s.stem}: thiếu sao ${starName} (có mutagen) — kỳ vọng ${fullHoa}`,
          ).toBeTruthy();
          expect(
            mutagenMap.get(hitName!),
            `${s.stem}: ${starName} expect mutagen ${shortHoa}, got ${mutagenMap.get(hitName!)}`,
          ).toBe(shortHoa);
        });
      });

      it("Tuần / Triệt / Không Vong: đúng 1 cung mỗi loại (nhãn iztro)", () => {
        expect(s.tuanTriet.tuanPalaces.length).toBe(1);
        expect(s.tuanTriet.trietPalaces.length).toBe(1);
        expect(s.tuanTriet.khongVongPalaces.length).toBe(1);
        expect(s.tuanTriet.hits.length).toBe(3);
      });

      it("payload luận giải: 12 cung, có ngũ hành cục, Mệnh/Thân, vận hạn 2026", () => {
        expect(s.payload.palaces).toHaveLength(12);
        expect(String(s.payload.fiveElementsClass || s.chart.fiveElementsClass).length).toBeGreaterThan(0);
        expect(String(s.payload.soul || s.chart.soul).length).toBeGreaterThan(0);
        expect(String(s.payload.body || s.chart.body).length).toBeGreaterThan(0);
        expect(s.payload.transitYear).toBe(c.transitYear);
        expect(s.payload.transitLunarAge).toBe(s.lunarAge);
        expect(s.payload.gender).toBe(c.gender);
        expect(s.transit.lunarAge).toBe(s.lunarAge);
        // Lưu Tứ Hóa năm hạn phải an đủ 4
        const luu = Object.values(s.transit.saoLuuMap).flat();
        expect(luu.some((x) => x.startsWith("Lưu Hóa Lộc"))).toBe(true);
        expect(luu.some((x) => x.startsWith("Lưu Hóa Quyền"))).toBe(true);
        expect(luu.some((x) => x.startsWith("Lưu Hóa Khoa"))).toBe(true);
        expect(luu.some((x) => x.startsWith("Lưu Hóa Kỵ"))).toBe(true);
      });

      it("cách cục: analyze không crash; trục Mệnh có dữ liệu khi có chính tinh", () => {
        expect(s.cachCuc).toBeTruthy();
        expect(Array.isArray(s.cachCuc.uniqueTamPhuong)).toBe(true);
        const menh = s.chart.palaces.find((p: any) => String(p.name).includes("Mệnh"));
        expect(menh).toBeTruthy();
        expect((menh.majorStars || []).length + (menh.minorStars || []).length).toBeGreaterThan(0);
      });

      it("snapshot tóm tắt (audit) — in thông tin lá để người đọc đối chiếu", () => {
        const menh = s.chart.palaces.find((p: any) => String(p.name).includes("Mệnh"));
        const menhMajors = (menh?.majorStars || []).map((x: any) => x.name).join(", ") || "(vô chính diệu)";
        const summary = {
          id: c.id,
          solar: `${c.solarDate} ${c.solarTime}`,
          gender: c.gender,
          hour: s.calc.tuviGlobalHourResult.branchName,
          lunar: s.chart.lunarDate,
          fiveElements: s.chart.fiveElementsClass,
          soul: s.chart.soul,
          body: s.chart.body,
          stem: s.stem,
          birthYear: s.birthYear,
          menhMajors,
          tuHoa: TU_HOA_BY_STEM[s.stem],
          tuan: s.tuanTriet.tuanPalaces,
          triet: s.tuanTriet.trietPalaces,
          khongVong: s.tuanTriet.khongVongPalaces,
          cachCucUnique: s.cachCuc.uniqueTamPhuong.slice(0, 5).map((x: any) => x.name),
          transitAge: s.lunarAge,
          daiHan: s.transit.daiHanPalaceName,
          tieuHan: s.transit.tieuHanPalaceName,
        };
        // eslint-disable-next-line no-console
        console.log("\n[ACCURACY SNAPSHOT]", JSON.stringify(summary, null, 2));
        expect(summary.hour).toBe(c.expectedHourBranch);
      });
    });
  }

  it("hai lá khác nhau hoàn toàn về placement 14 chính tinh (sanity random cases)", () => {
    const a = summarizeCase(CASES[0]);
    const b = summarizeCase(CASES[1]);
    let same = 0;
    for (const [star, palace] of a.majors) {
      if (b.majors.get(star) === palace) same += 1;
    }
    // Hai người khác nhau không thể trùng cả 14 vị trí
    expect(same).toBeLessThan(14);
    // Mệnh chính tinh khác nhau (soul/body có thể trùng ngẫu nhiên)
    const menhA = [...a.majors.entries()].find(([, p]) => String(p).includes("Mệnh"));
    const menhB = [...b.majors.entries()].find(([, p]) => String(p).includes("Mệnh"));
    expect(menhA?.[0]).not.toBe(menhB?.[0]);
    expect(a.birthYear).not.toBe(b.birthYear);
  });
});
