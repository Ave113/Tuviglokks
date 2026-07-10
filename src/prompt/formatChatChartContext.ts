import {
  buildNatalTuHoaLines,
  buildFlyingTuHoaLines,
  buildRelationsBlock,
  satKyStarsInPalace,
  buildCrossLinks,
} from "../utils/chartRelations";
import { buildCachCucReport } from "../utils/cachCuc";
import { buildTuanTrietReport } from "../utils/tuanTriet";
import { baZiToPromptText } from "../utils/bazi";
import type { ChartIndex } from "../utils/chartRelations";

/** Tối thiểu: idx + năm hạn + can lưu niên (đủ buildChatChartContext / Lưu Nguyệt). */
export type ChatChartContextInput = {
  idx: ChartIndex;
  transitYearNum: number;
  luuNienStem: string;
};

export type BuildChatChartContextOptions = {
  /**
   * "full" — đủ quan hệ 12 cung (khi chưa có / thiếu luận gốc).
   * "facts" — chỉ bảng sao + tứ hóa + cross-link (khi đã có luận gốc: tra cứu nhanh, đỡ token).
   */
  mode?: "full" | "facts";
};

/** Compact chart context for /api/chat — uses shared ctx.idx and chartRelations helpers. */
export const buildChatChartContext = (
  ctx: ChatChartContextInput,
  chartData: any,
  options?: BuildChatChartContextOptions,
): string => {
  if (!chartData || !Array.isArray(chartData.palaces)) {
    return "(Không có dữ liệu lá số kèm theo — chỉ dựa vào bản văn luận giải.)";
  }

  const mode = options?.mode ?? "full";
  const { idx, transitYearNum, luuNienStem } = ctx;

  const head = [
    `- Giới tính: ${chartData.gender || "?"} | Cầm tinh: ${chartData.zodiac || "?"} | Cục: ${chartData.fiveElementsClass || "?"}`,
    `- Can chi: ${chartData.chineseDate || "?"} | Thiên can năm sinh: ${chartData.birthHeavenlyStem || "?"}`,
    `- Năm xem hạn: ${transitYearNum} (tuổi mụ ${chartData.transitLunarAge || "?"}) | Đại hạn: ${chartData.transitDecadalPalace || "?"} | Tiểu hạn: ${chartData.transitYearlyPalace || "?"} | Lưu Thái Tuế: ${chartData.transitLuuThaiTuePalace || "?"}`,
  ].join("\n");

  const palaceLines = chartData.palaces.map((p: any) => {
    const major = (p.majorStars || []).map((s: any) => s.name).join(", ") || "Vô Chính Diệu";
    const minor = (p.minorStars || []).map((s: any) => s.name).join(", ") || "";
    const adj = (p.adjectiveStars || []).map((s: any) => s.name).join(", ") || "";
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

  const crossLinkStr = buildCrossLinks(idx, chartData.birthHeavenlyStem, luuNienStem, transitYearNum);

  // Mode facts: đủ để đối chiếu sao/tứ hóa/Tuần–Triệt, bỏ quan hệ 12 cung + cách cục + bát tự dài.
  if (mode === "facts") {
    const tuanTrietFacts = buildTuanTrietReport(chartData.palaces || []);
    return [
      head,
      `12 CUNG (sao thực có — chỉ để ĐỐI CHIẾU, không luận lại cả lá):\n${palaceLines}`,
      `TỨ HÓA BẨM SINH (đã tính sẵn):\n${natalStr}`,
      `PHI TỨ HÓA LƯU NIÊN ${transitYearNum} (can ${luuNienStem}):\n${luuStr}`,
      `TUẦN/TRIỆT/KHÔNG VONG (máy quét — chỉ nói đúng cung trong list, cấm bịa):\n${tuanTrietFacts}`,
      `LIÊN KẾT ĐA CHIỀU (gợi ý chéo — dùng khi câu hỏi cần):\n${crossLinkStr}`,
    ].join("\n\n");
  }

  const relationBlocks = chartData.palaces.map((p: any) => {
    const rel = buildRelationsBlock(idx, p);
    const sat = satKyStarsInPalace(p);
    const satLine = sat.length > 0
      ? `  - Sát/kỵ tinh thực có tại cung này: ${sat.join(", ")}`
      : "  - Cung này không gánh sát/kỵ tinh cực đoan.";
    return `${rel}\n${satLine}`;
  }).join("\n\n");

  const cachCucStr = buildCachCucReport(idx);
  const tuanTrietStr = buildTuanTrietReport(chartData.palaces || []);

  const baZiBlock = chartData.baZi
    ? baZiToPromptText(chartData.baZi)
    : "(Không có dữ liệu Bát Tự kèm theo — chỉ luận trên Tử Vi.)";

  return [
    head,
    `12 CUNG (sao thực có):\n${palaceLines}`,
    `TỨ HÓA BẨM SINH (đã tính sẵn — DÙNG TRỰC TIẾP, không tự tra bảng can):\n${natalStr}`,
    `PHI TỨ HÓA LƯU NIÊN ${transitYearNum} (can ${luuNienStem}, đã tính sẵn — dùng khi hỏi vận hạn năm):\n${luuStr}`,
    `TUẦN/TRIỆT/KHÔNG VONG (máy quét — chỉ nói đúng cung trong list, cấm bịa):\n${tuanTrietStr}`,
    `QUAN HỆ HÌNH HỌC TÍNH SẴN — TRỌN 12 CUNG (xung chiếu/tam hợp/nhị hợp/lục hại/phi tứ hóa — DÙNG TRỰC TIẾP đúng cung liên quan câu hỏi, TUYỆT ĐỐI không tự nhẩm lại index):\n${relationBlocks}`,
    `CÁCH CỤC CHÍNH TINH (đa trục — hệ thống nhận diện sẵn, DÙNG TRỰC TIẾP, không tự gán tên cách cục):\n${cachCucStr}`,
    `LIÊN KẾT ĐA CHIỀU (giao điểm động lực tứ hóa × cung đích × lĩnh vực đời sống — đã nối sẵn; dùng để luận chéo, nhưng sắc thái chỉ là gợi hướng — vẫn phải đối chiếu miếu/hãm & tổ hợp sao thực để kết cát/hung):\n${crossLinkStr}`,
    `${baZiBlock}`,
  ].join("\n\n");
};