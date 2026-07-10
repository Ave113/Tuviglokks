import { calculateTransitInfo, EARTHLY_BRANCHES, palaceIndexToBranchIndex } from "../utils/tuvi";
import { enrichPalaceForPayload, CHART_SCHOOL_META } from "../schools/enrichPalace";
import { computeBaZi } from "../utils/bazi";
import { stemNameByYear } from "../utils/tuHoa";

export function buildInterpretPayload(calculated: any, transitYear: number) {
  const chart = calculated.chart;
  const birthYear =
    chart?.rawDates?.lunarDate?.lunarYear ??
    new Date(calculated.timezoneNormalization.normalizedDate).getFullYear();
  const birthBranchIndex = ((birthYear - 4) % 12 + 12) % 12;
  const birthZodiacName = EARTHLY_BRANCHES[birthBranchIndex];
  const birthHeavenlyStem = stemNameByYear(birthYear);

  const transitInfo = calculateTransitInfo(
    birthYear,
    birthZodiacName,
    chart.gender,
    chart.palaces,
    transitYear,
  );

  let baZi = null;
  try {
    baZi = computeBaZi(
      new Date(calculated.timezoneNormalization.normalizedDate),
      chart.gender as "Nam" | "Nữ",
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
    gender: chart.gender,
    fiveElementsClass: chart.fiveElementsClass,
    zodiac: chart.zodiac,
    sign: chart.sign,
    soul: chart.soul,
    body: chart.body,
    birthHeavenlyStem,
    transitYear,
    transitLunarAge: transitInfo.lunarAge,
    transitDecadalPalace: transitInfo.daiHanPalaceName,
    transitYearlyPalace: transitInfo.tieuHanPalaceName,
    transitLuuThaiTuePalace: transitInfo.luuNienThaiTueName,
    transitLuuThaiTueIndex: transitInfo.luuNienThaiTueIndex,
    birthLunarMonth: calculated.effectiveLunarMonth,
    birthHourIndex: calculated.tuviGlobalHourResult.timeIndex,
    schoolMeta: CHART_SCHOOL_META,
    palaces: chart.palaces.map((p: any) => {
      const localSaoLuu = transitInfo.saoLuuMap[palaceIndexToBranchIndex(p.index)] || [];
      return enrichPalaceForPayload(
        p,
        localSaoLuu.map((s: string) => ({ name: `[SAO LƯU] ${s}` })),
      );
    }),
  };
}