/**
 * Kiểm chứng độ chính xác an lá — bộ golden charts (nhiều lá, khác giới/giờ/vùng/thế hệ).
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
import { computeBaZi, resolveCurrentDaYun, formatCurrentDaYunReport } from "./bazi";

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

/**
 * Golden charts — A/B baseline + 4 lá user bổ sung.
 * Giờ kỳ vọng = Giờ tiêu chuẩn Đông phương (khung 2h, Tý 23–01).
 */
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
  {
    id: "C",
    label: "Lá C — Nam, 09/06/2009 23:05, M.Trung QT trở vào (giờ Tý, vắt ngày)",
    solarDate: "2009-06-09",
    solarTime: "23:05",
    birthplace: BIRTHPLACE.CENTRAL_SOUTH_OF_17,
    gender: "Nam",
    expectedHourBranch: "Tý",
    transitYear: 2026,
  },
  {
    id: "D",
    label: "Lá D — Nữ, 15/07/2004 19:30, M.Trung QT trở vào (giờ Tuất)",
    solarDate: "2004-07-15",
    solarTime: "19:30",
    birthplace: BIRTHPLACE.CENTRAL_SOUTH_OF_17,
    gender: "Nữ",
    expectedHourBranch: "Tuất",
    transitYear: 2026,
  },
  {
    id: "E",
    label: "Lá E — Nữ, 19/11/1980 02:45, M.Trung QT trở vào (giờ Sửu)",
    solarDate: "1980-11-19",
    solarTime: "02:45",
    birthplace: BIRTHPLACE.CENTRAL_SOUTH_OF_17,
    gender: "Nữ",
    expectedHourBranch: "Sửu",
    transitYear: 2026,
  },
  {
    id: "F",
    label: "Lá F — Nam, 23/04/2011 11:00, Miền Nam (giờ Ngọ)",
    solarDate: "2011-04-23",
    solarTime: "11:00",
    birthplace: BIRTHPLACE.SOUTH,
    gender: "Nam",
    expectedHourBranch: "Ngọ",
    transitYear: 2026,
  },
  {
    id: "G",
    label: "Lá G — Nữ, 02/01/1996 18:15, Miền Nam (giờ Dậu)",
    solarDate: "1996-01-02",
    solarTime: "18:15",
    birthplace: BIRTHPLACE.SOUTH,
    gender: "Nữ",
    expectedHourBranch: "Dậu",
    transitYear: 2026,
  },
  {
    id: "H",
    label: "Lá H — Nam, 05/08/2023 04:45, Miền Bắc (giờ Dần)",
    solarDate: "2023-08-05",
    solarTime: "04:45",
    birthplace: BIRTHPLACE.NORTH,
    gender: "Nam",
    expectedHourBranch: "Dần",
    transitYear: 2026,
  },
  // LÁ VÀNG BIÊN GIỚI — nơi mọi hệ lịch gãy đầu tiên:
  // I: sinh SAU Lập Xuân nhưng TRƯỚC Tết → can năm ÂM LỊCH (Tứ Hóa) khác trụ
  //    năm Bát Tự — chốt chuỗi ưu tiên chineseDate → baZi của extractBirthHeavenlyStem.
  // J: trẻ chưa tới tuổi khởi vận — chốt "KHÔNG gán tên vận" phía Bát Tự +
  //    "Chưa vào Đại Hạn" phía Tử Vi.
  {
    id: "I",
    label: "Lá I — Nữ, 10/02/1991 10:30, Miền Bắc (giờ Tỵ) — biên Lập Xuân vs Tết",
    solarDate: "1991-02-10",
    solarTime: "10:30",
    birthplace: BIRTHPLACE.NORTH,
    gender: "Nữ",
    expectedHourBranch: "Tỵ",
    transitYear: 2026,
  },
  {
    id: "J",
    label: "Lá J — Nam, 15/06/2024 15:40, Miền Nam (giờ Thân) — trẻ chưa tới tuổi khởi vận",
    solarDate: "2024-06-15",
    solarTime: "15:40",
    birthplace: BIRTHPLACE.SOUTH,
    gender: "Nam",
    expectedHourBranch: "Thân",
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
  const birthYear =
    chart?.rawDates?.lunarDate?.lunarYear ??
    new Date(calc.timezoneNormalization.normalizedDate).getFullYear();
  const tuanTriet = analyzeTuanTriet(chart.palaces, { birthYear });
  const index = buildChartIndex(chart.palaces);
  const cachCuc = analyzeCachCuc(index);
  const stem = stemNameByYear(birthYear);
  const lunarAge = c.transitYear - birthYear + 1;

  const transit = calculateTransitInfo(
    birthYear,
    EARTHLY_BRANCHES[((birthYear - 4) % 12 + 12) % 12],
    c.gender,
    chart.palaces,
    c.transitYear,
    chart,
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

describe(`Độ chính xác an lá — golden ${CASES.length} lá`, () => {
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

      it("Tuần / Triệt: khóa 2 cung (rule) + Không Vong nhãn engine", () => {
        // Recompute: mỗi khóa 2 chi/cung; Không Vong vẫn 1 nhãn engine (nửa khóa)
        expect(s.tuanTriet.tuanBranches.length).toBe(2);
        expect(s.tuanTriet.trietBranches.length).toBe(2);
        expect(s.tuanTriet.tuanPalaces.length).toBe(2);
        expect(s.tuanTriet.trietPalaces.length).toBe(2);
        expect(s.tuanTriet.khongVongPalaces.length).toBeGreaterThanOrEqual(1);
        // 2 Tuần + 2 Triệt (Không Vong thường trùng 1 cung khóa) → ≥ 4 cung hit
        expect(s.tuanTriet.hits.length).toBeGreaterThanOrEqual(4);
      });

      it("payload luận giải: 12 cung, có ngũ hành cục, Mệnh/Thân, vận hạn 2026", () => {
        expect(s.payload.palaces).toHaveLength(12);
        expect(String(s.payload.fiveElementsClass || s.chart.fiveElementsClass).length).toBeGreaterThan(0);
        expect(String(s.payload.soul || s.chart.soul).length).toBeGreaterThan(0);
        expect(String(s.payload.body || s.chart.body).length).toBeGreaterThan(0);
        expect(s.payload.transitYear).toBe(c.transitYear);
        expect(s.payload.transitLunarAge).toBe(s.lunarAge);
        expect(s.payload.gender).toBe(c.gender);
        expect(s.payload.birthLunarYear).toBe(s.birthYear);
        expect(s.transit.lunarAge).toBe(s.lunarAge);
        // Lưu Tứ Hóa năm hạn phải an đủ 4
        const luu = Object.values(s.transit.saoLuuMap).flat();
        expect(luu.some((x) => x.startsWith("Lưu Hóa Lộc"))).toBe(true);
        expect(luu.some((x) => x.startsWith("Lưu Hóa Quyền"))).toBe(true);
        expect(luu.some((x) => x.startsWith("Lưu Hóa Khoa"))).toBe(true);
        expect(luu.some((x) => x.startsWith("Lưu Hóa Kỵ"))).toBe(true);
        // Sau fix: Lưu Khôi/Việt + sao Vận (iztro horoscope)
        expect(luu.some((x) => /Lưu Khôi|Lưu Việt/i.test(x))).toBe(true);
        // Vận * chỉ có khi đã nhập đại vận THẬT; 童限 (chưa vào) phải SẠCH lớp Vận
        if (s.transit.daiHanPalaceIndex >= 0) {
          expect(luu.some((x) => /^Vận\s+/i.test(x))).toBe(true);
        } else {
          expect(luu.some((x) => /^Vận\s+/i.test(x))).toBe(false);
        }
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

  it(
    "bộ golden đa dạng: input khác nhau, layout 14 chính tinh không sụp về 1 mẫu",
    () => {
      // Chỉ an lá (nhẹ hơn full summarize) — đủ so fingerprint chính tinh
      const rows = CASES.map((c) => {
        const calc = generateTuviAstrolabe(c.solarDate, c.solarTime, c.birthplace, c.gender);
        const majors = majorStarPlacement(calc.chart.palaces);
        const birthYear =
          calc.chart?.rawDates?.lunarDate?.lunarYear ??
          new Date(calc.timezoneNormalization.normalizedDate).getFullYear();
        return { c, majors, birthYear };
      });

      const birthKeys = rows.map(
        (r) => `${r.c.solarDate}|${r.c.solarTime}|${r.c.gender}|${r.c.birthplace}`,
      );
      expect(new Set(birthKeys).size).toBe(CASES.length);

      const fingerprints = rows.map((r) =>
        [...r.majors.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([star, palace]) => `${star}@${palace}`)
          .join("|"),
      );
      const uniqueLayouts = new Set(fingerprints).size;
      // Cho phép 1–2 cặp trùng layout (vd A vs G); vẫn cần đa số layout khác nhau
      expect(
        uniqueLayouts,
        `quá nhiều lá trùng layout 14 chính (unique=${uniqueLayouts}/${CASES.length})`,
      ).toBeGreaterThanOrEqual(Math.ceil(CASES.length * 0.75));

      const years = new Set(rows.map((r) => r.birthYear));
      expect(years.size).toBeGreaterThanOrEqual(4);
    },
    30_000,
  );

  it(
    "lá C (23:05) là giờ Tý vắt ngày — Tử Vi và Bát Tự đồng nhất sang ngày mới (Dạ Tý khóa chuẩn)",
    () => {
      const c = CASES.find((x) => x.id === "C")!;
      const calc = generateTuviAstrolabe(c.solarDate, c.solarTime, c.birthplace, c.gender);
      expect(calc.tuviGlobalHourResult.branchName).toBe("Tý");
      expect(calc.tuviGlobalHourResult.dateShift).toBe(1);
      expect(calc.finalSolarDateUsed).toBe("2009-06-10");

      // Bát Tự từ normalizedDate (2009-06-09 23:05):
      const bazi = computeBaZi(new Date(calc.timezoneNormalization.normalizedDate), c.gender);
      // Nhật trụ phải sang Bính Tuất (ngày 2009-06-10), KHÔNG bị kẹt ở Ất Dậu
      expect(bazi.pillars.day.ganChiVi).toBe("Bính Tuất");
      expect(bazi.dayMasterVi).toBe("Bính");
      expect(bazi.dayMasterElement).toBe("Hỏa");

      // Giờ Tý khởi theo Ngũ Thử Độn từ can Bính: Bính/Tân khởi Mậu Tý
      expect(bazi.pillars.hour.ganChiVi).toBe("Mậu Tý");
      expect(bazi.pillars.hour.zhiVi).toBe("Tý");

      // Đồng nhất 4 trụ với người sinh lúc 00:30 ngày hôm sau (Chính Tý)
      const baziNextMorning = computeBaZi(new Date(2009, 5, 10, 0, 30, 0), c.gender);
      expect(bazi.pillars.year.ganChiVi).toBe(baziNextMorning.pillars.year.ganChiVi);
      expect(bazi.pillars.month.ganChiVi).toBe(baziNextMorning.pillars.month.ganChiVi);
      expect(bazi.pillars.day.ganChiVi).toBe(baziNextMorning.pillars.day.ganChiVi);
      expect(bazi.pillars.hour.ganChiVi).toBe(baziNextMorning.pillars.hour.ganChiVi);
    },
    15_000,
  );

  // -------------------------------------------------------------------------
  // LÁ VÀNG BIÊN GIỚI — test chuyên sâu cho vùng thời điểm gãy lịch
  // -------------------------------------------------------------------------

  describe("Lá I — biên Lập Xuân vs Tết (10/02/1991: sau Lập Xuân 04/02, trước Tết 15/02)", () => {
    const c = CASES.find((x) => x.id === "I")!;
    const s = summarizeCase(c);

    it("XUNG ĐỘT có thật: năm âm = 1990 Canh Ngọ nhưng trụ năm Bát Tự = Tân Mùi (Lập Xuân)", () => {
      // Mốc lịch đã kiểm chứng: Tết 1991 = 15/02, Lập Xuân 1991 = 04/02.
      // Nếu 2 nguồn không còn xung đột thì lá này mất lý do tồn tại — fail to rõ.
      expect(s.payload.birthLunarYear).toBe(1990);
      expect(s.chart.chineseDate.startsWith("Canh Ngọ")).toBe(true);
      const baZiYearPillar = (s.payload.baZi as any)?.pillars?.year;
      expect(baZiYearPillar?.ganChiVi).toBe("Tân Mùi");
      expect((s.payload.baZi as any)?.pillars?.month?.ganChiVi).toBe("Canh Dần");
    });

    it("REGRESSION — Tứ Hóa bẩm sinh theo can ÂM LỊCH (Canh), KHÔNG phải trụ năm Bát Tự (Tân)", () => {
      // Chuỗi ưu tiên extractBirthHeavenlyStem: chineseDate (âm lịch) phải thắng baZi.
      // Nếu rớt xuống fallback baZi sẽ ra "Tân" → sai nguyên bộ Tứ Hóa.
      expect(s.payload.birthHeavenlyStem).toBe("Canh");

      const mutagenMap = collectMutagenFromChart(s.chart.palaces);
      const canhQuartet = TU_HOA_BY_STEM["Canh"]; // Thái Dương/Vũ Khúc/Thái Âm/Thiên Đồng
      canhQuartet.forEach((starName, i) => {
        const hit = [...mutagenMap.keys()].find(
          (n) => normalizeStarName(n) === normalizeStarName(starName),
        );
        expect(hit, `Canh: thiếu ${starName}`).toBeTruthy();
        expect(mutagenMap.get(hit!), `${starName} expect ${MUTAGEN_SHORT[i]}`).toBe(MUTAGEN_SHORT[i]);
      });
      // Bộ Tứ Hóa của Tân KHÔNG được xuất hiện như bẩm sinh
      expect(mutagenMap.get("Cự Môn")).not.toBe("Lộc"); // Tân Lộc = Cự Môn
      expect(mutagenMap.get("Văn Xương")).not.toBe("Kỵ"); // Tân Kỵ = Văn Xương
    });
  });

  describe("Lá J — trẻ chưa tới tuổi khởi vận (2024, vận đầu 2031/8 tuổi)", () => {
    const c = CASES.find((x) => x.id === "J")!;
    const s = summarizeCase(c);
    const bazi = computeBaZi(new Date(s.calc.timezoneNormalization.normalizedDate), c.gender);

    it("Tử Vi: chưa vào Đại Hạn ở năm xem 2026 (tuổi mụ 3)", () => {
      expect(s.transit.daiHanPalaceName).toBe("Chưa vào Đại Hạn");
      expect(s.payload.transitDecadalPalace).toBe("Chưa vào Đại Hạn");
      expect(s.payload.transitLunarAge).toBe(3);
    });

    it("REGRESSION 2026-10 (童限) — không xuất lớp Vận giả khi chưa nhập đại vận", () => {
      // Trước fix: vẫn có decadalTuHoa + sao "Vận *" từ horoscope (cung 童限 tạm)
      // → prompt mâu thuẫn "Chưa vào Đại Hạn". Sau fix: sạch lớp Vận.
      expect(s.transit.decadalTuHoa).toBeNull();
      expect(s.transit.daiHanStem).toBe("");
      expect(s.transit.daiHanBranch).toBe("");
      expect(s.payload.transitDecadalTuHoa ?? null).toBeNull();
      expect(s.payload.transitDecadalStem).toBeUndefined();
      const luu = Object.values(s.transit.saoLuuMap).flat();
      expect(luu.some((x) => /^Vận\s+/i.test(x))).toBe(false);
      expect(luu.some((x) => /^Vận Hóa /i.test(x))).toBe(false);
    });

    it("Bát Tự: vận đầu 2031 (8 tuổi) — năm xem TRƯỚC khởi vận thì resolveCurrentDaYun = null", () => {
      // Pin cứng mốc khởi vận (lunar-typescript) — nếu thư viện đổi cách tính,
      // test fail to ngay để người xem biết mốc đã dịch.
      expect(bazi.daYun[0]).toMatchObject({ startYear: 2031, startAge: 8, ganChiVi: "Tân Mùi" });
      // REGRESSION cho bug "gán vận đầu cho trẻ chưa nhập vận":
      expect(resolveCurrentDaYun(bazi, 2026)).toBeNull();
      expect(resolveCurrentDaYun(bazi, bazi.daYun[0].startYear - 1)).toBeNull();
      // Biên trên: đúng năm khởi vận là BẬT vận đầu
      expect(resolveCurrentDaYun(bazi, bazi.daYun[0].startYear)?.ganChiVi).toBe("Tân Mùi");
    });

    it("Timeline Bát Tự 2026: KHÔNG gán tên vận cho trẻ chưa nhập vận", () => {
      const curReport = formatCurrentDaYunReport(bazi, 2026);
      expect(curReport).toContain("KHÔNG gán tên vận");
      expect(curReport).not.toContain("Bát Tự trong vận");
    });
  });
});
