import { stemNameByYear, TU_HOA_BY_STEM } from "../utils/tuHoa";
import { buildChartIndex } from "../utils/chartRelations";
import { INTERPRET_INCLUDE_MONTHLY_SECTION } from "../server/aiConfig";
import { buildCachCucReport } from "../utils/cachCuc";
import { buildDecorativeRingsBlock } from "../schools/schoolKnowledge";
import { getDamTinhForStars, getDamTinhForAuxStars, getDamTinhTuHoa, getDamTinhTuHoaDetail } from "../knowledge/damTinh";
import { baZiToPromptText } from "../utils/bazi";
import { retrieveKnowledge, knowledgeToPromptText } from "../knowledge/chineseKnowledge";
import { retrieveTuBinh, tuBinhToPromptText } from "../knowledge/tuBinhKnowledge";
import { retrieveKinhNghiem, kinhNghiemToPromptText } from "../knowledge/kinhNghiemKnowledge";
import { resolveTransitYear } from "../utils/transitYear";
import type { ChartPromptContext } from "./types";
import {
  formatNatalTuHoaStr,
  formatFlyingTuHoaStr,
  buildStressReport,
  buildLuuNienReport,
  buildTuHoaReport,
  buildBodyPalaceStr,
  buildLaiNhanReport,
  buildHaiTrucTaiLoc,
  buildLuuNguyetReport,
  buildPhucDucReport,
  buildTruongSinhReport,
  buildPhucLocReport,
  buildTuanTrietReport,
  collectAllMajorStarNames,
  collectAllAuxStarNames,
  collectTuHoaPairs,
  buildSchoolMetaStr,
} from "./chartReports";

const collectBaZiMeta = (chartData: any): { shiShenList: string[]; dominantElements: string[] } => {
  const shiShenList: string[] = [];
  if (chartData.baZi?.pillars) {
    const ps = chartData.baZi.pillars;
    [ps.year, ps.month, ps.day, ps.hour].forEach((p: any) => {
      if (p?.shiShenGanVi) shiShenList.push(p.shiShenGanVi);
      (p?.shiShenZhiVi || []).forEach((x: string) => shiShenList.push(x));
    });
  }
  const dominantElements: string[] = chartData.baZi?.wuXingWithHidden
    ? Object.entries(chartData.baZi.wuXingWithHidden)
        .sort((a: any, b: any) => Number(b[1]) - Number(a[1]))
        .slice(0, 2)
        .map((e: any) => String(e[0]))
    : [];
  return { shiShenList, dominantElements };
};

/**
 * Context tối thiểu cho /api/chat — bỏ damTinh/chinese/cách cục interpret-grade
 * (chat tự inject A/B gọn). Giảm CPU + tránh tính báo cáo không dùng.
 */
export interface ChatRouteChartContext {
  idx: ReturnType<typeof buildChartIndex>;
  transitYearNum: number;
  luuNienStem: string;
  allMajorStarNames: string[];
  shiShenList: string[];
  dominantElements: string[];
}

export const buildChatRouteChartContext = (chartData: any): ChatRouteChartContext => {
  const palacesArr = chartData.palaces || [];
  const idx = buildChartIndex(palacesArr);
  const transitYearNum = resolveTransitYear(chartData.transitYear);
  const luuNienStem = stemNameByYear(transitYearNum);
  const { shiShenList, dominantElements } = collectBaZiMeta(chartData);
  return {
    idx,
    transitYearNum,
    luuNienStem,
    allMajorStarNames: collectAllMajorStarNames(palacesArr),
    shiShenList,
    dominantElements,
  };
};

/** Single source of truth for chart prompt data — shared by interpret and chat. */
export const buildChartPromptContext = (chartData: any): ChartPromptContext => {
  const palacesArr = chartData.palaces || [];
  const idx = buildChartIndex(palacesArr);

  const genderStr = chartData.gender === "Nam" ? "Nam (Dương Nam/Âm Nam)" : "Nữ (Dương Nữ/Âm Nữ)";

  const { natalTuHoaResolved, natalTuHoaStr, stemKey } = formatNatalTuHoaStr(idx, chartData.birthHeavenlyStem);
  const natalTuHoaTable = stemKey ? TU_HOA_BY_STEM[stemKey] : undefined;

  const transitYearNum = resolveTransitYear(chartData.transitYear);
  const luuNienStem = stemNameByYear(transitYearNum);

  const decadalPalaceName = chartData.transitDecadalPalace;
  const decadalPalace = palacesArr.find((p: any) => p?.name === decadalPalaceName);
  const decadalStem = decadalPalace?.heavenlyStem;

  const decadalFlyingStr = decadalPalaceName && decadalPalaceName !== "Chưa rõ"
    ? formatFlyingTuHoaStr(idx, decadalStem, `cung Đại hạn (${decadalPalaceName})`)
    : "  - Chưa xác định được cung Đại hạn nên chưa tính phi tứ hóa Đại vận.";

  const luuNienFlyingStr = formatFlyingTuHoaStr(
    idx,
    luuNienStem,
    `Lưu niên (năm ${transitYearNum}, can ${luuNienStem})`,
  );

  const allMajorStarNames = collectAllMajorStarNames(palacesArr);
  const allAuxStarNames = collectAllAuxStarNames(palacesArr);
  const { shiShenList, dominantElements } = collectBaZiMeta(chartData);

  const decadalTuHoaTable = decadalStem ? TU_HOA_BY_STEM[String(decadalStem).trim()] : undefined;
  const luuNienTuHoaTable = luuNienStem ? TU_HOA_BY_STEM[String(luuNienStem).trim()] : undefined;
  const damTinhTuHoaPairs = [
    ...collectTuHoaPairs(natalTuHoaTable),
    ...collectTuHoaPairs(decadalTuHoaTable),
    ...collectTuHoaPairs(luuNienTuHoaTable),
  ];

  return {
    idx,
    palacesArr,
    genderStr,
    transitYearNum,
    luuNienStem,
    decadalStem,
    natalTuHoaResolved,
    stemKey,
    bodyPalaceStr: buildBodyPalaceStr(palacesArr),
    schoolMetaStr: buildSchoolMetaStr(chartData),
    decorativeRingsStr: buildDecorativeRingsBlock(chartData.palaces || []),
    natalTuHoaStr,
    stressReportStr: buildStressReport(palacesArr),
    tuanTrietReportStr: buildTuanTrietReport(palacesArr),
    luuNienReportStr: buildLuuNienReport(palacesArr),
    decadalFlyingStr,
    luuNienFlyingStr,
    tuHoaReportStr: buildTuHoaReport(idx, palacesArr),
    cachCucReportStr: buildCachCucReport(idx),
    laiNhanReportStr: buildLaiNhanReport(palacesArr, stemKey),
    haiTrucTaiLocStr: buildHaiTrucTaiLoc(palacesArr),
    phucDucReportStr: buildPhucDucReport(idx, palacesArr),
    luuNguyetReportStr: INTERPRET_INCLUDE_MONTHLY_SECTION
      ? buildLuuNguyetReport(idx, chartData, transitYearNum)
      : "",
    truongSinhReportStr: buildTruongSinhReport(palacesArr),
    phucLocReportStr: buildPhucLocReport(idx, palacesArr),
    damTinhStr: getDamTinhForStars(allMajorStarNames),
    damTinhAuxStr: getDamTinhForAuxStars(allAuxStarNames),
    damTinhTuHoaGeneralStr: getDamTinhTuHoa(damTinhTuHoaPairs.map((p) => p.hoa)),
    damTinhTuHoaDetailStr: getDamTinhTuHoaDetail(damTinhTuHoaPairs),
    baZiStr: chartData.baZi ? baZiToPromptText(chartData.baZi) : "",
    chineseKnowledgeStr: knowledgeToPromptText(
      retrieveKnowledge(
        { stars: allMajorStarNames, shiShen: shiShenList, elements: dominantElements },
        6,
      ),
    ),
    tuBinhKnowledgeStr: chartData.baZi
      ? tuBinhToPromptText(
          retrieveTuBinh({ shiShen: shiShenList, elements: dominantElements }, 9),
        )
      : "",
    // Lớp B: interpret không có câu hỏi → neo CHÍNH TINH (+ vài phụ trọng yếu).
    // Không dump toàn bộ adjective (50–70 tên) kẻo retrieve bị ngập tag sát/hạn generic.
    kinhNghiemKnowledgeStr: kinhNghiemToPromptText(
      retrieveKinhNghiem(
        {
          stars: [
            ...allMajorStarNames,
            ...allAuxStarNames.filter((n) =>
              /Kình|Đà|Không|Kiếp|Hỏa|Linh|Hóa |Lộc Tồn|Văn Xương|Văn Khúc|Thiên Mã|Hồng|Đào|Tuần|Triệt|Vong/i.test(
                n,
              ),
            ),
          ],
        },
        5,
      ),
    ),
    shiShenList,
    dominantElements,
    allMajorStarNames,
  };
};