import { calculateTransitInfo, EARTHLY_BRANCHES, palaceIndexToBranchIndex } from "../utils/tuvi";
import { isVanStarName } from "../utils/horoscopeStars";
import { enrichPalaceForPayload, CHART_SCHOOL_META } from "../schools/enrichPalace";
import { computeBaZi } from "../utils/bazi";
import { stemNameByYear, extractBirthHeavenlyStem } from "../utils/tuHoa";
import type { InterpretChartData } from "../types";

export function buildInterpretPayload(calculated: any, transitYear: number): InterpretChartData {
  const chart = calculated.chart;
  const birthYear =
    chart?.rawDates?.lunarDate?.lunarYear ??
    new Date(calculated.timezoneNormalization.normalizedDate).getFullYear();
  const birthBranchIndex = ((birthYear - 4) % 12 + 12) % 12;
  const birthZodiacName = EARTHLY_BRANCHES[birthBranchIndex];
  const birthHeavenlyStem = extractBirthHeavenlyStem(chart, birthYear);
  const gender: "Nam" | "Nữ" = chart.gender === "Nữ" ? "Nữ" : "Nam";

  const transitInfo = calculateTransitInfo(
    birthYear,
    birthZodiacName,
    gender,
    chart.palaces,
    transitYear,
    chart,
  );

  let baZi: InterpretChartData["baZi"] = undefined;
  try {
    baZi = computeBaZi(
      new Date(calculated.timezoneNormalization.normalizedDate),
      gender,
    );
  } catch (e) {
    console.warn("Không dựng được lá Bát Tự:", e);
  }

  return {
    solarDate: calculated.timezoneNormalization.originalDate,
    baZi,
    solarTime: calculated.timezoneNormalization.originalTime,
    lunarDate: chart.lunarDate,
    chineseDate: chart.chineseDate,
    gender,
    fiveElementsClass: chart.fiveElementsClass,
    zodiac: chart.zodiac,
    sign: chart.sign,
    soul: chart.soul,
    body: chart.body,
    birthHeavenlyStem,
    birthLunarYear: birthYear,
    transitYear,
    transitLunarAge: transitInfo.lunarAge,
    transitDecadalPalace: transitInfo.daiHanPalaceName,
    transitYearlyPalace: transitInfo.tieuHanPalaceName,
    transitLuuThaiTuePalace: transitInfo.luuNienThaiTueName,
    transitLuuThaiTueIndex: transitInfo.luuNienThaiTueIndex,
    transitDecadalStem: transitInfo.daiHanStem || undefined,
    transitDecadalBranch: transitInfo.daiHanBranch || undefined,
    transitDecadalRange: transitInfo.daiHanRange,
    transitTieuHanAges: transitInfo.tieuHanAges,
    transitDecadalTuHoa: transitInfo.decadalTuHoa,
    transitYearlyTuHoa: transitInfo.yearlyTuHoa,
    birthLunarMonth: calculated.effectiveLunarMonth,
    birthHourIndex: calculated.tuviGlobalHourResult.timeIndex,
    schoolMeta: { ...CHART_SCHOOL_META },
    palaces: chart.palaces.map((p: any) => {
      const branch = palaceIndexToBranchIndex(p.index);
      const localSaoLuu = transitInfo.saoLuuMap[branch] || [];
      const rings = transitInfo.yearlyDecRings;
      return enrichPalaceForPayload(
        p,
        localSaoLuu.map((s: string) => ({
          name: isVanStarName(s) ? `[SAO VẬN] ${s}` : `[SAO LƯU] ${s}`,
        })),
        rings
          ? {
              yearSuiqian12: rings.yearSuiqianByBranch[branch] || undefined,
              yearJiangqian12: rings.yearJiangqianByBranch[branch] || undefined,
            }
          : undefined,
      );
    }),
  };
}