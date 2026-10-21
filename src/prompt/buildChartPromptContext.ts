import { stemNameByYear, TU_HOA_BY_STEM, normalizeHeavenlyStem, extractBirthHeavenlyStem, getNatalTuHoaQuartet } from "../utils/tuHoa";
import { buildChartIndex, buildSeparateTuHoaStructures, BRANCHES_VI } from "../utils/chartRelations";
import { analyzeCachCuc } from "../utils/cachCuc";
import { buildCachCucLogicSheet, patternIdsFromAnalysis } from "../utils/cachCucLogic";
import { analyzeLuuNienEventCards } from "./luuNienEventCards";
import { buildBaZiCrossTagsReport } from "./baZiCrossTags";
import { getDamTinhForStars, getDamTinhForAuxStars, getDamTinhTuHoa, getDamTinhTuHoaDetail } from "../knowledge/damTinh";
import { baZiToPromptText } from "../utils/bazi";
import { buildBaZiTimelineReport } from "../utils/baZiTimeline";
import { retrieveKnowledge, knowledgeToPromptText } from "../knowledge/chineseKnowledge";
import { retrieveTuBinh, tuBinhToPromptText } from "../knowledge/tuBinhKnowledge";
import { retrieveKinhNghiem, kinhNghiemToPromptText } from "../knowledge/kinhNghiemKnowledge";
import { buildCabinetFromChart } from "../knowledge/buildCabinetFromChart";
import { buildTemporalTriggerReport } from "./temporalTriggers";
import { buildTrungPhungReport } from "./trungPhung";
import { buildTrongTamReport } from "./lifeReports";
import { resolveTransitYear } from "../utils/transitYear";
import type { ChartPromptContext } from "./types";
import {
  formatNatalTuHoaStr,
  formatFlyingTuHoaStr,
  buildStressReport,
  buildTinhVaDapReport,
  buildLuuNienReport,
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
  collectCycleStarLabels,
  AUX_KN_FILTER,
  collectTuHoaPairs,
  buildSchoolMetaStr,
  buildVanChamCungBlock,
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

  const resolvedBirthStem = extractBirthHeavenlyStem(chartData, chartData.birthLunarYear) || normalizeHeavenlyStem(chartData.birthHeavenlyStem);
  if (resolvedBirthStem && chartData.birthHeavenlyStem !== resolvedBirthStem) {
    chartData.birthHeavenlyStem = resolvedBirthStem;
  }

  const { natalTuHoaResolved, natalTuHoaStr, stemKey } = formatNatalTuHoaStr(idx, resolvedBirthStem);
  const natalTuHoaTable = stemKey ? getNatalTuHoaQuartet(stemKey) : undefined;
  const separateTuHoa = buildSeparateTuHoaStructures(idx, stemKey);

  const transitYearNum = resolveTransitYear(chartData.transitYear);
  const luuNienStem = stemNameByYear(transitYearNum);

  const decadalPalaceName = chartData.transitDecadalPalace;
  const decadalPalace = palacesArr.find((p: any) => p?.name === decadalPalaceName);
  // Ưu tiên can đại hạn từ transit (palace.decadal); fallback can cung
  const decadalStem =
    (typeof chartData.transitDecadalStem === "string" && chartData.transitDecadalStem.trim()) ||
    decadalPalace?.decadal?.heavenlyStem ||
    decadalPalace?.heavenlyStem;

  /** Dòng `  - Hóa …: Sao → cung` từ LayerTuHoa đã resolve (payload). */
  const layerTuHoaLines = (layer: { items?: { hoa: string; star: string; palaceName?: string; branchIdx: number }[] } | null | undefined) => {
    if (!layer?.items?.length) return "";
    return layer.items
      .map((it) => {
        const where = it.palaceName
          ? ` → cung ${it.palaceName}`
          : it.branchIdx >= 0
            ? ` → chi ${BRANCHES_VI[it.branchIdx] || it.branchIdx}`
            : " → (sao không thấy trên lá)";
        return `  - ${it.hoa}: ${it.star}${where}`;
      })
      .join("\n");
  };

  const decadalFromPayload = layerTuHoaLines(chartData.transitDecadalTuHoa);
  const yearlyFromPayload = layerTuHoaLines(chartData.transitYearlyTuHoa);

  const decadalFlyingStr = decadalFromPayload
    || (decadalPalaceName && decadalPalaceName !== "Chưa rõ"
      ? formatFlyingTuHoaStr(idx, decadalStem, `cung Đại hạn (${decadalPalaceName})`)
      : "  - Chưa xác định được cung Đại hạn nên chưa tính phi tứ hóa Đại vận.");

  const luuNienFlyingStr = yearlyFromPayload
    || formatFlyingTuHoaStr(
      idx,
      luuNienStem,
      `Lưu niên (năm ${transitYearNum}, can ${luuNienStem})`,
    );

  const allMajorStarNames = collectAllMajorStarNames(palacesArr);
  const allAuxStarNames = collectAllAuxStarNames(palacesArr);
  const { shiShenList, dominantElements } = collectBaZiMeta(chartData);

  const decadalTuHoaTable = decadalStem ? getNatalTuHoaQuartet(decadalStem) : undefined;
  const luuNienTuHoaTable = luuNienStem ? getNatalTuHoaQuartet(luuNienStem) : undefined;
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
    decadalBranch:
      (typeof chartData.transitDecadalBranch === "string" && chartData.transitDecadalBranch.trim()) ||
      decadalPalace?.decadal?.earthlyBranch ||
      undefined,
    decadalRangeStr: Array.isArray(chartData.transitDecadalRange) && chartData.transitDecadalRange.length >= 2
      ? `${chartData.transitDecadalRange[0]}–${chartData.transitDecadalRange[1]} tuổi`
      : Array.isArray(decadalPalace?.decadal?.range) && decadalPalace.decadal.range.length >= 2
        ? `${decadalPalace.decadal.range[0]}–${decadalPalace.decadal.range[1]} tuổi`
        : "",
    tieuHanAgesStr: Array.isArray(chartData.transitTieuHanAges) && chartData.transitTieuHanAges.length
      ? chartData.transitTieuHanAges.join(", ")
      : "",
    natalTuHoaResolved,
    stemKey,
    natalTuHoaObject: separateTuHoa.natalTuHoa,
    palaceTuHoaFlights: separateTuHoa.palaceTuHoaFlights,
    corePsychologicalFlights: separateTuHoa.corePsychologicalFlights,
    bodyPalaceStr: buildBodyPalaceStr(palacesArr),
    schoolMetaStr: buildSchoolMetaStr(chartData),
    natalTuHoaStr,
    stressReportStr: buildStressReport(palacesArr),
    tinhVaDapReportStr: buildTinhVaDapReport(idx, palacesArr),
    temporalTriggerReportStr: buildTemporalTriggerReport(idx, palacesArr, chartData),
    trungPhungReportStr: buildTrungPhungReport(palacesArr, chartData),
    tuanTrietReportStr: buildTuanTrietReport(palacesArr, {
      birthYear: chartData.birthLunarYear,
    }),
    luuNienReportStr: buildLuuNienReport(palacesArr),
    ...(() => {
      const yearEvents = analyzeLuuNienEventCards(palacesArr, chartData, { maxCards: 5 });
      return {
        luuNienEventCardsStr: yearEvents.reportText,
        baZiCrossTagsStr: buildBaZiCrossTagsReport(palacesArr, chartData.baZi, {
          transitYear: transitYearNum,
          yearCards: yearEvents.cards,
        }),
      };
    })(),
    decadalFlyingStr,
    luuNienFlyingStr,
    corePsychologicalFlightsStr: separateTuHoa.corePsychologicalFlights.formattedBlock,
    palaceSelfFlyingBlockStr: separateTuHoa.formattedSelfFlyingBlock,
    // Cách cục: 1 lần analyze → sheet + patternIds (không detect lặp)
    ...(() => {
      const cachCucAnalysis = analyzeCachCuc(idx);
      const patternIds = patternIdsFromAnalysis(cachCucAnalysis);
      const cabinet = buildCabinetFromChart(chartData, {
        mode: "interpret",
        useTopicFocus: false,
        // Tránh cabinet analyze lại — dùng cùng patternIds
        patternIds,
      });
      return {
        cachCucReportStr: buildCachCucLogicSheet(idx, cachCucAnalysis),
        vanChamCungStr: buildVanChamCungBlock(idx, chartData, { analysis: cachCucAnalysis }),
        trongTamStr: buildTrongTamReport(idx, cachCucAnalysis),
        kinhNghiemKnowledgeStr: kinhNghiemToPromptText(
          retrieveKinhNghiem(
            {
              stars: [
                ...allMajorStarNames,
                ...allAuxStarNames.filter((n) => AUX_KN_FILTER.test(n)),
                ...damTinhTuHoaPairs.flatMap((p) => [p.hoa, p.star]),
                // Vòng 12 trạng thái — ngoài minor/adjectiveStars nên thêm riêng
                // (không qua filter sao phụ: "Trường Sinh" không khớp regex trên)
                ...collectCycleStarLabels(palacesArr),
              ],
              patternIds,
              gender: chartData.gender,
              // Tách cả "sao nhập hạn" (block riêng) lẫn "nhập Mệnh" (block riêng)
              excludePrefixes: ["kn-han2-", "kn-nm-"],
            },
            // Compact interpret: 20→16 mẩu KN chính (cách cục + combo + hệ thống).
            // Giữ nguyên chat50; chỉ giảm tải prompt luận giải.
            16,
          ),
        ),
        // Mạch B — tổ hợp nhập Mệnh (5 file sách) — block RIÊNG bảo đảm hiện diện
        // (trong top-16 cạnh tranh mẩu cũ nhiều tag, mạch này từng chết chìm 0/19)
        nmMenhStr: kinhNghiemToPromptText(
          retrieveKinhNghiem(
            {
              stars: [
                ...allMajorStarNames,
                ...allAuxStarNames.filter((n) => AUX_KN_FILTER.test(n)),
                ...damTinhTuHoaPairs.flatMap((p) => [p.hoa, p.star]),
                ...collectCycleStarLabels(palacesArr),
              ],
              patternIds,
              gender: chartData.gender,
              idPrefix: "kn-nm-",
            },
            // Compact interpret: 21→15 mẩu nhập Mệnh (14 tổ hợp + nữ mệnh chọn lọc).
            15,
          ),
          {
            header: "=== MẪU TỔ HỢP NHẬP MỆNH (đã truy hồi theo SAO/CUNG TRÊN LÁ) ===",
            sourceLine:
              "(Nguồn: bộ 5 file sao nhập Mệnh — Tử Vi/Thiên Tướng/Phá Quân/Văn Xương/Văn Khúc nhập Mệnh — trích có chọn. ",
          },
        ),
        // Block riêng cho 40+ mẩu "sao nhập hạn" — không cạnh tranh cách cục,
        // có trần riêng 60 mẩu; gate sao vẫn chạy trên cùng pool lá.
        saoNhapHanStr: kinhNghiemToPromptText(
          retrieveKinhNghiem(
            {
              stars: [
                ...allMajorStarNames,
                ...allAuxStarNames.filter((n) => AUX_KN_FILTER.test(n)),
                ...damTinhTuHoaPairs.flatMap((p) => [p.hoa, p.star]),
                ...collectCycleStarLabels(palacesArr),
              ],
              patternIds,
              gender: chartData.gender,
              idPrefix: "kn-han2-",
            },
            // Compact interpret: 82→60. Giữ 59 mẩu Tân Biên + cơ chế vận/lưu cốt lõi;
            // bỏ các mẩu đuôi ít liên quan. Đây là trần riêng của interpret — chat50
            // vẫn giữ nguyên cấu hình 12 mục × 542 ký tự.
            60,
          ),
          {
            sourceLine:
              "(Nguồn: Sổ TVKN Quản Xuân Thịnh Quyển Hạ + Tử Vi Đẩu Số Tân Biên 1956 + cơ chế sao vận Vương Đình Chi + bộ 5 file sao nhập Mệnh — trích có chọn. " +
              "LƯU Ý AN TOÀN: mẩu cổ có ngôn ngữ nặng (chết, ung thư, tai nạn…) — chỉ dùng làm tín hiệu NGUY CƠ, TUYỆT ĐỐI không chép nguyên văn; luôn hạ mức + 1 NÊN phòng ngừa. ",
          },
        ),
        giaiHoaKnowledgeStr: cabinet.giaiHoaKnowledgeStr,
        bookCorpusStr: cabinet.bookCorpusStr,
        tinhHoaCabinetDirectiveStr: cabinet.cabinetDirectiveStr,
      };
    })(),
    laiNhanReportStr: buildLaiNhanReport(palacesArr, stemKey),
    haiTrucTaiLocStr: buildHaiTrucTaiLoc(palacesArr),
    phucDucReportStr: buildPhucDucReport(idx, palacesArr),
    // Lưu Nguyệt LUÔN dựng sẵn: phục vụ "BỘ ĐỊNH VỊ THỜI ĐIỂM" (VŨ KHÍ 2) trong interpret
    // — một nhát Tháng nóng nhất ở Luận giải Tiểu Hạn. Chat vẫn lazy-inject riêng.
    luuNguyetReportStr: buildLuuNguyetReport(idx, chartData, transitYearNum),
    truongSinhReportStr: buildTruongSinhReport(palacesArr),
    phucLocReportStr: buildPhucLocReport(idx, palacesArr),
    damTinhStr: getDamTinhForStars(allMajorStarNames),
    // Nhãn vòng (Bác Sỹ/Thanh Long/Tuế tiền...) không nằm trong minor/adjectiveStars —
    // bơm vào để entry Đàm Tinh của chúng được inject thay vì chỉ là data dump.
    // Compact interpret: 30→24 phụ/tạp tinh. Chỉ giảm tải prompt luận giải.
    damTinhAuxStr: getDamTinhForAuxStars(
      [...allAuxStarNames, ...collectCycleStarLabels(palacesArr)],
      24,
    ),
    damTinhTuHoaGeneralStr: getDamTinhTuHoa(damTinhTuHoaPairs.map((p) => p.hoa)),
    damTinhTuHoaDetailStr: getDamTinhTuHoaDetail(damTinhTuHoaPairs),
    baZiStr: chartData.baZi
      ? [
          baZiToPromptText(chartData.baZi, { transitYear: transitYearNum }),
          buildBaZiTimelineReport(chartData.baZi, transitYearNum),
        ].join("\n\n")
      : "",
    // Phần C Cấp 3: catalog dày hơn → topN chinese 8 / tuBinh 11 (nền tảng + mẩu khớp).
    chineseKnowledgeStr: knowledgeToPromptText(
      retrieveKnowledge(
        { stars: allMajorStarNames, shiShen: shiShenList, elements: dominantElements },
        8,
      ),
    ),
    tuBinhKnowledgeStr: chartData.baZi
      ? tuBinhToPromptText(
          retrieveTuBinh({ shiShen: shiShenList, elements: dominantElements }, 11),
        )
      : "",
    shiShenList,
    dominantElements,
    allMajorStarNames,
  };
};
