import {
  buildNatalTuHoaLines,
  buildFlyingTuHoaLines,
  buildRelationsBlock,
  satKyStarsInPalace,
  buildCrossLinks,
  buildSeparateTuHoaStructures,
  BRANCHES_VI,
} from "../utils/chartRelations";
import { buildCachCucLogicSheet } from "../utils/cachCucLogic";
import { analyzeCachCuc } from "../utils/cachCuc";
import { buildTuanTrietReport } from "../utils/tuanTriet";
import { baZiToPromptText } from "../utils/bazi";
import { buildBaZiTimelineReport } from "../utils/baZiTimeline";
import type { ChartIndex } from "../utils/chartRelations";
import { analyzeLuuNienEventCards } from "./luuNienEventCards";
import { buildBaZiCrossTagsReport } from "./baZiCrossTags";
import { buildLaiNhanReport, buildHaiTrucTaiLoc, buildVanChamCungBlock } from "./chartReports";
import { buildTrungPhungReportChat } from "./trungPhung";
import { normalizeHeavenlyStem } from "../utils/tuHoa";

/** Tối thiểu: idx + năm hạn + can lưu niên (đủ buildChatChartContext / Lưu Nguyệt). */
export type ChatChartContextInput = {
  idx: ChartIndex;
  transitYearNum: number;
  luuNienStem: string;
};

/**
 * Compact chart context for /api/chat — uses shared ctx.idx and chartRelations helpers.
 * (Trước đây có mode "facts" rút gọn khi đã có luận gốc — nhánh chết đã bị gỡ:
 *  chat.ts luôn dựng full quan hệ 12 cung, preferBase chỉ đổi CÁCH TRẢ LỜI.)
 * 2026: bổ sung 4 fact sheet đúc sẵn (Lai Nhân / Phi Tứ Hóa Đại Vận / Hai Trục Tài Lộc /
 * Máy ghim Giao thoa 3 tầng) — đồng bộ kho dữ liệu với interpret, pin không rớt khỏi prompt.
 */
export const buildChatChartContext = (
  ctx: ChatChartContextInput,
  chartData: any,
): string => {
  if (!chartData || !Array.isArray(chartData.palaces)) {
    return "(Không có dữ liệu lá số kèm theo — chỉ dựa trên bản văn luận giải.)";
  }

  const { idx, transitYearNum, luuNienStem } = ctx;

  const head = [
    `- Giới tính: ${chartData.gender || "?"} | Cầm tinh: ${chartData.zodiac || "?"} | Cục: ${chartData.fiveElementsClass || "?"}`,
    `- Can chi: ${chartData.chineseDate || "?"} | Thiên can năm sinh: ${chartData.birthHeavenlyStem || "?"}`,
    `- Năm xem hạn: ${transitYearNum} (tuổi mụ ${chartData.transitLunarAge || "?"}) | Đại hạn: ${chartData.transitDecadalPalace || "?"} | Tiểu hạn: ${chartData.transitYearlyPalace || "?"} | Lưu Thái Tuế: ${chartData.transitLuuThaiTuePalace || "?"}`,
  ].join("\n");

  const fmtStar = (s: any) => {
    const name = String(s?.name || "").trim();
    if (!name) return "";
    return s?.mutagen ? `${name}[${s.mutagen}]` : name;
  };
  const palaceLines = chartData.palaces.map((p: any) => {
    const major = (p.majorStars || []).map(fmtStar).filter(Boolean).join(", ") || "Vô Chính Diệu";
    const minor = (p.minorStars || []).map(fmtStar).filter(Boolean).join(", ") || "";
    const adj = (p.adjectiveStars || []).map(fmtStar).filter(Boolean).join(", ") || "";
    const extras = [minor && `Trợ/Lưu: ${minor}`, adj && `Sát/Tạp: ${adj}`].filter(Boolean).join(" | ");
    return `  - ${p.name} (${p.earthlyBranch || "?"}, can ${p.heavenlyStem || "?"})${p.isBodyPalace ? " [THÂN]" : ""}: ${major}${extras ? " | " + extras : ""}`;
  }).join("\n");

  const natalLines = buildNatalTuHoaLines(idx, chartData.birthHeavenlyStem);
  const natalStr = natalLines
    ? natalLines.map((l) => `  - ${l}`).join("\n")
    : "  - Chưa xác định được Thiên can năm sinh nên KHÔNG tính sẵn Tứ Hóa bẩm sinh (đừng tự suy đoán vị trí sao).";

  const luuFlying = buildFlyingTuHoaLines(idx, luuNienStem);
  const luuStr = luuFlying.length > 0
    ? luuFlying.map((l) => `  - ${l}`).join("\n")
    : "  - Chưa xác định được can Lưu niên.";

  // Fact sheet đúc sẵn — đồng bộ interpret (chat trước đây thiếu 4 khối này).
  const decadalPalaceName =
    typeof chartData.transitDecadalPalace === "string" && chartData.transitDecadalPalace.trim()
      ? chartData.transitDecadalPalace.trim()
      : "";
  const decadalPalace = (chartData.palaces || []).find((p: any) => p?.name === decadalPalaceName);
  const decadalStemRaw =
    (typeof chartData.transitDecadalStem === "string" && chartData.transitDecadalStem.trim()) ||
    decadalPalace?.decadal?.heavenlyStem ||
    decadalPalace?.heavenlyStem ||
    "";
  const decadalStemLabel = decadalStemRaw
    ? normalizeHeavenlyStem(decadalStemRaw) || decadalStemRaw
    : "";
  const layerTuHoaLines = (layer: any) => {
    if (!layer?.items?.length) return "";
    return layer.items
      .map((it: any) => {
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
  const decadalFlyingLines = buildFlyingTuHoaLines(idx, decadalStemRaw);
  const decadalStr = decadalFromPayload
    || (decadalFlyingLines.length > 0
      ? decadalFlyingLines.map((l) => `  - ${l}`).join("\n")
      : "  - Chưa xác định được can Đại hạn nên KHÔNG tính sẵn Phi Tứ Hóa Đại vận (đừng tự suy đoán vị trí sao).");
  const decadalMeta = [
    `cung Đại hạn ${decadalPalaceName && decadalPalaceName !== "Chưa rõ" ? decadalPalaceName : "chưa rõ"}`,
    `can ${decadalStemLabel || "chưa rõ"}`,
    Array.isArray(chartData.transitDecadalRange) && chartData.transitDecadalRange.length >= 2
      ? `${chartData.transitDecadalRange[0]}–${chartData.transitDecadalRange[1]} tuổi`
      : "",
  ].filter(Boolean).join(", ");

  const laiNhanStr = buildLaiNhanReport(chartData.palaces || [], chartData.birthHeavenlyStem);
  const haiTrucStr = buildHaiTrucTaiLoc(chartData.palaces || []);
  const trungPhungStr = buildTrungPhungReportChat(chartData.palaces || [], chartData);

  const crossLinkStr = buildCrossLinks(idx, chartData.birthHeavenlyStem, luuNienStem, transitYearNum);

  const separateTuHoa = buildSeparateTuHoaStructures(idx, chartData.birthHeavenlyStem);

  const relationBlocks = chartData.palaces.map((p: any) => {
    // includeFlights: false — Phi Tứ Hóa 12 cung đã có khối riêng ở trên
    // ("TỰ HÓA & PHI TỨ HÓA 12 CUNG"); lặp ở đây làm AI đếm đúp đường bay
    // (interpret đã tách sạch như vậy từ trước — đồng bộ 2 đầu).
    const rel = buildRelationsBlock(idx, p, { includeFlights: false });
    const sat = satKyStarsInPalace(p);
    const satLine = sat.length > 0
      ? `  - Sát/kỵ tinh thực có tại cung này: ${sat.join(", ")}`
      : "  - Cung này không gánh sát/kỵ tinh cực đoan.";
    return `${rel}\n${satLine}`;
  }).join("\n\n");

  const cachCucAnalysis = analyzeCachCuc(idx);
  const cachCucStr = buildCachCucLogicSheet(idx, cachCucAnalysis);
  const vanChamStr = buildVanChamCungBlock(idx, chartData, {
    analysis: cachCucAnalysis,
    style: "chat",
  });
  const tuanTrietStr = buildTuanTrietReport(chartData.palaces || [], {
    birthYear: chartData.birthLunarYear,
  });

  const baZiBlock = chartData.baZi
    ? [
        baZiToPromptText(chartData.baZi, { transitYear: transitYearNum }),
        buildBaZiTimelineReport(chartData.baZi, transitYearNum),
      ].join("\n\n")
    : "(Không có dữ liệu Bát Tự kèm theo — chỉ luận trên Tử Vi.)";

  // Thẻ năm + thẻ BT chéo — gọn cho chat (top 4 thẻ)
  const yearEvents = analyzeLuuNienEventCards(chartData.palaces || [], chartData, {
    maxCards: 4,
  });
  const eventCardsBlock = yearEvents.reportText;
  const baZiTagsBlock = buildBaZiCrossTagsReport(chartData.palaces || [], chartData.baZi, {
    transitYear: transitYearNum,
    yearCards: yearEvents.cards,
  });

  return [
    head,
    `12 CUNG (sao thực có):\n${palaceLines}`,
    `TỨ HÓA BẨM SINH (đã tính sẵn — DÙNG TRỰC TIẾP, không tự tra bảng can):\n${natalStr}`,
    `LAI NHÂN CUNG (đã tính sẵn — cung trùng Thiên can năm sinh, gốc nghiệp bẩm sinh; dùng khi hỏi căn cơ/nhân quả nền):\n${laiNhanStr}`,
    `PHI TỨ HÓA ĐẠI VẬN 10 NĂM (đã tính sẵn — ${decadalMeta}; dùng khi hỏi vận 10 năm):\n${decadalStr}`,
    `TỰ HÓA & PHI TỨ HÓA 12 CUNG (CƠ CHẾ NỘI SINH & HƯỚNG NGOẠI — nhận diện Tự Hóa tại bản cung vs Phi Hóa xuất; dùng trực tiếp khi hỏi Tự Hóa):\n${separateTuHoa.formattedSelfFlyingBlock || "  - Không có."}`,
    `ĐƯỜNG BAY TÂM LÝ CỐT LÕI (Mệnh & Phúc Đức — căn nguyên tâm lý & phản ứng vô thức):\n${separateTuHoa.corePsychologicalFlights.formattedBlock || "  - Không có."}`,
    `PHI TỨ HÓA LƯU NIÊN ${transitYearNum} (can ${luuNienStem}, đã tính sẵn — dùng khi hỏi vận hạn năm):\n${luuStr}`,
    `THẺ SỰ KIỆN LƯU NIÊN (máy — ưu tiên khi hỏi năm/hạn; bám thẻ, cấm bịa domain):\n${eventCardsBlock}`,
    `MÁY GHIM GIAO THOA 3 TẦNG GỐC×VẬN×LƯU (pin trùng phùng của năm xem — ưu tiên khi hỏi năm/hạn/bước ngoặt; list trống thì luận êm theo thẻ/kích hoạt):\n${trungPhungStr}`,
    `TUẦN/TRIỆT/KHÔNG VONG (máy quét — chỉ nói đúng cung trong list, cấm bịa):\n${tuanTrietStr}`,
    `QUAN HỆ HÌNH HỌC TÍNH SẴN — TRỌN 12 CUNG (xung chiếu/tam hợp/nhị hợp/lục hại — riêng Phi Tứ Hóa xem khối "TỰ HÓA & PHI TỨ HÓA 12 CUNG" ở trên — DÙNG TRỰC TIẾP đúng cung liên quan câu hỏi, TUYỆT ĐỐI không tự nhẩm lại index):\n${relationBlocks}`,
    `CÁCH CỤC CHÍNH TINH (đa trục — hệ thống nhận diện sẵn, DÙNG TRỰC TIẾP, không tự gán tên cách cục):\n${cachCucStr}`,
    ...(vanChamStr ? [vanChamStr] : []),
    `HAI TRỤC TÀI LỘC (máy lọc — tách kênh KIẾM tiền (Mệnh×Tài×Quan) vs GIỮ tiền (Phúc×Tài×Điền); dùng khi hỏi tiền bạc/tích sản):\n${haiTrucStr}`,
    `LIÊN KẾT ĐA CHIỀU (giao điểm động lực tứ hóa × cung đích × lĩnh vực đời sống — đã nối sẵn; dùng để luận chéo, nhưng sắc thái chỉ là gợi hướng — vẫn phải đối chiếu miếu/hãm & tổ hợp sao thực để kết cát/hung):\n${crossLinkStr}`,
    `${baZiBlock}`,
    `THẺ TIN CẬY BT↔TV THEO TRỤC (máy — chỉ gắn nhãn đúng trục, không rải lung tung):\n${baZiTagsBlock}`,
  ].join("\n\n");
};
