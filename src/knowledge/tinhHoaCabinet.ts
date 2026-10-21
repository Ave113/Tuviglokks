// ============================================================================
// TỦ TINH HOA — gói nguyên liệu luận giải (đủ sao liên quan, không dump full).
//
// Triết lý:
//   - Kho offline (sách + mẩu) = hội tủ đầy.
//   - Mỗi request = mở tủ LẤY ĐÚNG ngăn khớp lá (cô đọng).
//   - AI = thiên tài diễn đạt: nối logic; dùng toàn bộ kiến thức, chỉ câu chữ trùng nguyên văn tối đa 40% độ dài phần trích (2026-10).
// ============================================================================

import {
  retrieveBookSnippets,
  bookSnippetsToPromptText,
  type RetrieveBookContext,
} from "./bookCorpus";
import { retrieveGiaiHoa, giaiHoaToPromptText } from "./giaiHoaKnowledge";

/** Sao ưu tiên khi lấy tinh hoa (trục cốt đời sống). */
const PRIORITY_HINT =
  /Tử Vi|Thiên Cơ|Thái Dương|Vũ Khúc|Thiên Đồng|Liêm Trinh|Thiên Phủ|Thái Âm|Tham Lang|Cự Môn|Thiên Tướng|Thiên Lương|Thất Sát|Phá Quân|Kình|Đà|Không|Kiếp|Hỏa|Linh|Văn|Lộc Tồn|Tuần|Triệt/i;

export type TinhHoaCabinetMode = "interpret" | "chat50" | "chat" | "chat-light";

export interface TinhHoaCabinetInput {
  majorStars: string[];
  auxStars: string[];
  tuHoaStars: string[];
  /** Tên sao thủ Mệnh / trọng (nếu biết) — lấy trước */
  focusStars?: string[];
  /**
   * interpret = full tủ; chat50 = đúng 50% trần interpret (khối tủ cho /api/chat);
   * chat = đủ tinh hoa gọn; chat-light = đã có luận gốc (siết token).
   */
  mode?: TinhHoaCabinetMode;
  /** Câu hỏi chat — gate giải hóa / ưu tiên sao nhắc trong query */
  query?: string;
  /** patternId cách cục máy — boost gh/kn map */
  patternIds?: string[];
}

export interface TinhHoaCabinetResult {
  bookCorpusStr: string;
  giaiHoaKnowledgeStr: string;
  /** Block gộp + lệnh diễn đạt thiên tài */
  cabinetDirectiveStr: string;
  /** Gộp sẵn để chèn prompt (directive + sách + giải hóa) */
  combinedPromptBlock: string;
  stats: { bookSnippets: number; giaiHoa: number; mode: TinhHoaCabinetMode };
}

const MODE_LIMITS: Record<
  TinhHoaCabinetMode,
  { topN: number; maxChars: number; maxTotal: number; giaiN: number }
> = {
  // Interpret compact: 24→20 mục, trần 6.864→5.800 ký tự, giải hóa 8→6.
  // Vẫn đủ trục tính/tài/quan/kỵ; chat50 giữ nguyên 12×542×3.432.
  interpret: { topN: 20, maxChars: 542, maxTotal: 5800, giaiN: 6 },
  // chat50 = đúng 50% trần interpret (12 mục × 542 ≤ 3.432) — khối tủ tinh hoa cho /api/chat.
  chat50: { topN: 12, maxChars: 542, maxTotal: 3432, giaiN: 4 },
  // Chat: topN 10→14 (+35%), maxChars 391→446→424→403 (−5%); maxTotal 3.000 ràng buộc (14×403 ≫ 3.000).
  chat: { topN: 14, maxChars: 403, maxTotal: 3000, giaiN: 5 },
  // chat-light đi theo chat: topN 7→9, maxChars 322→367→349→332 (−5%); maxTotal 1.800 ràng buộc.
  "chat-light": { topN: 9, maxChars: 332, maxTotal: 1800, giaiN: 3 },
};

function buildDirective(mode: TinhHoaCabinetMode): string {
  if (mode === "interpret") {
    return [
      "=== LỆNH DIỄN ĐẠT — BẬC THẦY (BẮT BUỘC) ===",
      "Bạn không phải máy trích dẫn. Bạn là người đã NỘI HÓA tủ tinh hoa + lá máy + Đàm Tinh.",
      "Cách viết:",
      "1) CHỌN trục: Mệnh–Thân → Tài–Quan → sát/kỵ then chốt → hạn năm (nếu có).",
      "2) MỖI kết luận = 1 mắt xích nhân quả: sao (đắc/hãm) × cung × tam phương/tứ hóa × hệ quả đời thực.",
      "3) GỘP nhiều sao thành MỘT chân dung / MỘT cơ chế (vd “kiếm được–giữ kém”), không liệt kê từng sao như mục lục sách.",
      "4) Giọng: sắc, mạch, đời thực, có trọng số (mạnh/vừa/nhẹ). CẤM sáo “hao tài do hợp đồng” chung chung.",
      "5) Tủ tinh hoa & giải hóa = nguyên liệu; ĐƯỢC dùng toàn bộ kiến thức, chỉ câu chữ trùng nguyên văn tối đa 40% độ dài phần trích (câu mô tả/cách trung tính; phần câu chữ còn lại diễn đạt lại) — 40% là trần trùng câu chữ toàn bài, không phải mỗi khối và KHÔNG phải trần kiến thức/số ý; CẤM “theo sách X trang…”, CẤM chép trọn block dưới.",
      "6) Thứ tự thắng: máy (lá) > Đàm Tinh > tinh hoa sách > giải hóa. Lệch → giữ máy.",
      "7) Đầu bài: một câu chốt linh hồn mệnh. Cuối mỗi vùng hung: NÊN/KHÔNG cụ thể may đo lá này.",
    ].join("\n");
  }

  // chat / chat-light / chat50 — cùng logic thiên tài, đầu ra NGẮN theo câu hỏi
  return [
    "=== LỆNH DIỄN ĐẠT — BẬC THẦY (CHAT FOLLOW-UP) ===",
    "Bạn đã NỘI HÓA: lá máy + (nếu có) bài luận gốc + tủ tinh hoa/sách cô đọng + giải hóa.",
    "Trả lời CÂU HỎI — gọn, sắc — nhưng BỐ TRÍ LOGIC như thiên tài:",
    "1) Một câu KẾT LUẬN cụ thể trước (đời thực), không mào đầu.",
    "2) Mắt xích: sao/cung (máy) × quan hệ (xung/tam hợp/tứ hóa nếu cần) × hệ quả — 1–3 ý, không liệt kê mục lục sao.",
    "3) Tinh hoa sách: ĐƯỢC dùng toàn bộ kiến thức, chỉ câu chữ trùng nguyên văn tối đa 40% độ dài phần trích (trần trùng câu chữ toàn bài, không phải mỗi khối và KHÔNG phải trần kiến thức/số ý; phần câu chữ còn lại diễn đạt lại); CẤM “theo sách…”, CẤM chép trọn block, CẤM dump 12 cung.",
    "4) Thứ tự thắng: lá máy > bài luận gốc (nếu có) > Đàm Tinh > tinh hoa sách > giải hóa.",
    "5) Nếu hỏi hướng xử lý: 1 câu NÊN/KHÔNG may đo lá (từ giải hóa khi khớp).",
    "6) Giọng: sắc, mạch, có trọng số; không hù, không sáo.",
  ].join("\n");
}

/**
 * Dựng tủ tinh hoa theo lá (+ mode chat gọn hơn interpret).
 * Không full text sách.
 */
export function buildTinhHoaCabinet(input: TinhHoaCabinetInput): TinhHoaCabinetResult {
  const mode: TinhHoaCabinetMode = input.mode ?? "interpret";
  const lim = MODE_LIMITS[mode];

  const pool = unique([
    ...input.majorStars,
    ...input.auxStars.filter((n) => PRIORITY_HINT.test(n)),
    ...input.tuHoaStars,
  ]);

  const focus = unique([...(input.focusStars ?? []), ...input.majorStars.slice(0, 6)]);

  const ctx: RetrieveBookContext = {
    stars: pool,
    query: input.query,
  };

  const snippets = retrieveBookSnippets(ctx, {
    mode: "per-star",
    topN: lim.topN,
    maxCharsPerSnippet: lim.maxChars,
    maxTotalChars: lim.maxTotal,
    preferStarSections: true,
    priorityStars: focus,
  });

  const giai = retrieveGiaiHoa(
    { stars: pool, query: input.query, patternIds: input.patternIds },
    lim.giaiN,
  );

  const bookCorpusStr = bookSnippetsToPromptText(snippets);
  const giaiHoaKnowledgeStr = giaiHoaToPromptText(giai);
  const cabinetDirectiveStr = buildDirective(mode);

  const parts = [cabinetDirectiveStr];
  if (bookCorpusStr) parts.push(bookCorpusStr);
  if (giaiHoaKnowledgeStr) parts.push(giaiHoaKnowledgeStr);
  const combinedPromptBlock = parts.join("\n\n");

  return {
    bookCorpusStr,
    giaiHoaKnowledgeStr,
    cabinetDirectiveStr,
    combinedPromptBlock,
    stats: { bookSnippets: snippets.length, giaiHoa: giai.length, mode },
  };
}

function unique(xs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    const t = String(x || "").trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}
