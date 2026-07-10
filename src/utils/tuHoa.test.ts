import { describe, it, expect } from "vitest";
import { heavenlyStems } from "iztro/lib/data/heavenlyStems";
import starVi from "iztro/lib/i18n/locales/vi-VN/star";
import stemVi from "iztro/lib/i18n/locales/vi-VN/heavenlyStem";
import { BIRTHPLACE } from "../constants/birthplace";
import { generateTuviAstrolabe } from "./tuvi";
import {
  HOA_LABELS,
  STEM_NAME_BY_YEAR_MOD,
  stemIndexByYear,
  stemNameByYear,
  TU_HOA_BY_STEM,
  type TuHoaQuartet,
} from "./tuHoa";
import { allStarsOf, normalizeStarName } from "./chartRelations";

/** Mutagen short label trên sao iztro vi-VN: Lộc/Quyền/Khoa/Kỵ */
const MUTAGEN_SHORT: TuHoaQuartet = ["Lộc", "Quyền", "Khoa", "Kỵ"];

/** Dựng bảng Tứ Hóa từ iztro (heavenlyStems.mutagen + locale vi-VN). */
function iztroTuHoaByStemVi(): Record<string, TuHoaQuartet> {
  const out: Record<string, TuHoaQuartet> = {};
  for (const [stemKey, info] of Object.entries(heavenlyStems)) {
    const stemName = (stemVi as Record<string, string>)[stemKey];
    const starKeys = (info as { mutagen: string[] }).mutagen;
    if (!stemName || !Array.isArray(starKeys) || starKeys.length !== 4) {
      throw new Error(`iztro heavenlyStems thiếu mutagen cho ${stemKey}`);
    }
    const stars = starKeys.map((k) => (starVi as Record<string, string>)[k]) as TuHoaQuartet;
    if (stars.some((s) => !s)) {
      throw new Error(`iztro star locale thiếu key: ${starKeys.join(",")}`);
    }
    out[stemName] = stars;
  }
  return out;
}

/** Gom mutagen từ lá: tên sao → nhãn Hóa ngắn (Lộc/…). */
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

describe("stemIndexByYear / stemNameByYear", () => {
  it("index 0–9 theo năm % 10 (Canh … Kỷ)", () => {
    expect(stemIndexByYear(2000)).toBe(0);
    expect(stemNameByYear(2000)).toBe("Canh");
    expect(stemNameByYear(1995)).toBe("Ất");
    expect(stemNameByYear(2026)).toBe("Bính");
  });

  it("chuẩn hóa năm âm", () => {
    expect(stemIndexByYear(-5)).toBe(5);
    expect(stemNameByYear(-5)).toBe("Ất");
  });
});

describe("TU_HOA_BY_STEM ↔ iztro mutagen (vi-VN)", () => {
  const iztroTable = iztroTuHoaByStemVi();

  it("đủ 10 can và khớp 1-1 với heavenlyStems.mutagen + locale vi-VN", () => {
    const stems = Object.keys(iztroTable).sort((a, b) => a.localeCompare(b, "vi"));
    expect(stems).toHaveLength(10);
    expect(Object.keys(TU_HOA_BY_STEM).sort((a, b) => a.localeCompare(b, "vi"))).toEqual(stems);

    for (const stem of stems) {
      expect(TU_HOA_BY_STEM[stem], `thiếu can ${stem} trong TU_HOA_BY_STEM`).toEqual(
        iztroTable[stem],
      );
    }
  });

  it("Nhâm Hóa Khoa dùng tên iztro Tả Phù (không Tả Phụ)", () => {
    expect(TU_HOA_BY_STEM["Nhâm"][2]).toBe("Tả Phù");
    expect(iztroTable["Nhâm"][2]).toBe("Tả Phù");
    expect(TU_HOA_BY_STEM["Nhâm"][2]).not.toBe("Tả Phụ");
  });

  it("STEM_NAME_BY_YEAR_MOD trỏ đúng quartet trong TU_HOA_BY_STEM", () => {
    STEM_NAME_BY_YEAR_MOD.forEach((stem, i) => {
      expect(TU_HOA_BY_STEM[stem], `yearMod ${i} → ${stem}`).toBeTruthy();
      expect(TU_HOA_BY_STEM[stem]).toHaveLength(4);
    });
  });
});

describe("TU_HOA_BY_STEM ↔ mutagen trên lá iztro thật", () => {
  /**
   * Một năm dương cho mỗi can (year % 10 → STEM_NAME_BY_YEAR_MOD).
   * 2000=Canh … 2009=Kỷ.
   */
  const YEAR_BY_STEM: Record<string, number> = Object.fromEntries(
    STEM_NAME_BY_YEAR_MOD.map((stem, i) => [stem, 2000 + i]),
  );

  it.each(Object.keys(TU_HOA_BY_STEM))(
    "can %s: 4 sao thụ hóa trên lá mang mutagen Lộc/Quyền/Khoa/Kỵ đúng bảng",
    (stem) => {
      const year = YEAR_BY_STEM[stem];
      expect(stemNameByYear(year)).toBe(stem);

      const r = generateTuviAstrolabe(
        `${year}-06-15`,
        "12:00",
        BIRTHPLACE.SOUTH,
        "Nam",
      );
      const mutagenMap = collectMutagenFromChart(r.chart.palaces);
      const expected = TU_HOA_BY_STEM[stem];

      expected.forEach((starName, i) => {
        const shortHoa = MUTAGEN_SHORT[i];
        const fullHoa = HOA_LABELS[i];
        const hitName = [...mutagenMap.keys()].find(
          (n) => normalizeStarName(n) === normalizeStarName(starName),
        );
        expect(hitName, `${stem}: thiếu sao ${starName} (có mutagen) trên lá ${year}`).toBeTruthy();
        const m = mutagenMap.get(hitName!);
        expect(
          m,
          `${stem}: ${starName} expect mutagen ${shortHoa} (${fullHoa}), got ${m}`,
        ).toBe(shortHoa);
      });

      const expectedNorms = new Set(expected.map((s) => normalizeStarName(s)));
      for (const [name, m] of mutagenMap) {
        if (!MUTAGEN_SHORT.includes(m as (typeof MUTAGEN_SHORT)[number])) continue;
        if (expectedNorms.has(normalizeStarName(name))) {
          const idx = expected.findIndex(
            (s) => normalizeStarName(s) === normalizeStarName(name),
          );
          expect(m).toBe(MUTAGEN_SHORT[idx]);
        }
      }
    },
  );
});
