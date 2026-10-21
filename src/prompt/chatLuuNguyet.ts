import { buildLuuNguyetReport } from "./chartReports";
import type { ChartIndex } from "../utils/chartRelations";

/** Patterns that signal the user is asking about lunar months / intra-year time windows / Lưu Nguyệt. */
const CHAT_LUU_NGUYET_PATTERNS: RegExp[] = [
  /lưu\s*nguyệt/i,
  /tháng\s*(âm|nào|mấy|trọng\s*tâm|tốt|xấu|kém|đẹp|nên|không\s*nên|này|sau|tới|kế)/i,
  /tháng\s*\d{1,2}/i,
  /\d{1,2}\s*âm/i,
  /theo\s*tháng/i,
  /trong\s*tháng/i,
  /từng\s*tháng/i,
  /các\s*tháng/i,
  /mỗi\s*tháng/i,
  /tháng\s*giêng|tháng\s*chạp/i,
  // Khung thời gian trong năm — cần bảng 12 tháng để chốt đúng mốc (đầu/giữa/cuối, nửa, quý, giai đoạn, thời điểm).
  /(đầu|giữa|cuối)\s*(tháng|năm)/i,
  /nửa\s*(đầu|cuối)?\s*(tháng|năm)/i,
  /giai\s*đoạn/i,
  /quý\s*([1-4]|iv|i{1,3})\b/i,
  /\bq\s*[1-4]\b/i,
  /thời\s*điểm/i,
];

export type ChatHistoryTurn = { role?: string; content?: string };

/** True when question or recent user turns mention months / intra-year time windows / Lưu Nguyệt. */
export const shouldInjectChatLuuNguyet = (
  question: string,
  history?: ChatHistoryTurn[],
): boolean => {
  const userTexts = [
    String(question || "").trim(),
    ...(Array.isArray(history) ? history : [])
      .filter((t) => t?.role === "user")
      .map((t) => String(t?.content || "").trim())
      .slice(-3),
  ].filter(Boolean);

  const combined = userTexts.join("\n");
  return CHAT_LUU_NGUYET_PATTERNS.some((p) => p.test(combined));
};

/** Build Lưu Nguyệt cheat sheet for /api/chat — independent of interpret monthly flag. */
export const buildChatLuuNguyetBlock = (
  ctx: { idx: ChartIndex; transitYearNum: number },
  chartData: any,
): string => {
  const report = buildLuuNguyetReport(ctx.idx, chartData, ctx.transitYearNum);
  if (!report.trim()) return "";

  return `--- LƯU NGUYỆT ${ctx.transitYearNum} — 12 CUNG THÁNG ÂM LỊCH (HỆ THỐNG AN SẴN — DÙNG KHI HỎI THÁNG) ---
Hệ thống đã an sẵn cung an trú của từng tháng âm lịch trong năm xem hạn (theo Đẩu Quân) cùng can tháng và đường phi Lưu Nguyệt Tứ Hóa (Lộc/Quyền/Khoa/Kỵ của tháng đó đáp vào sao nào, cung nào). DÙNG TRỰC TIẾP khi bạn hỏi về tháng; TUYỆT ĐỐI không tự nhẩm lại cung tháng hay can tháng; nếu báo thiếu dữ liệu thì nói rõ thiếu, không bịa.
${report}`;
};