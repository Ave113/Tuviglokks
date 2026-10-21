/**
 * A1-BỔ SUNG — ĐỘ PHỦ SAO & NHẠC NỀN THEO CUNG.
 *
 * Audit thực tế trên 3 lá mẫu cho thấy mỗi lá ~144 sao/vòng nhưng có 25-28%
 * KHÔNG được nuôi bởi bất kỳ block tri thức nào (Đàm Tinh trần 30 vẫn cắt,
 * sao vòng/tạp nhỏ không có sheet riêng) — trong khi khung luận giải CẤM dump
 * sao và chỉ cho "2-4 cụm then chốt" → những sao đó sẽ không bao giờ được nhắc.
 *
 * Giải pháp deterministic (không phụ thuộc model): máy tự tính danh sách sao
 * "bị bỏ rơi", gom theo cung, và gửi vào skeleton chặng 2 với mệnh lệnh nhắc
 * 1 mạch bên trong đoạn dệt đúng cung đó — phủ 100% mà không thành mục riêng.
 *
 * Nguyên tắc khớp tên (chống false positive):
 *  - Trước khi so khớp, tên sao được strip tiền tố "[SAO LƯU]"/"[SAO VẬN]".
 *  - Form đã resolve (Vận Xương → Văn Xương) cũng được tính là được nuôi.
 *  - Khớp theo ranh giới chữ (\p{L}) và PHÂN BIỆT HOA/thường — "Bệnh" sao
 *    không khớp "bệnh tật" trong văn.
 *  - Nhãn vòng Trường Sinh một âm tiết (Tử/Suy/Mộ/Thai/Bệnh/Dưỡng/Tuyệt)
 *    bị loại khỏi universe: quá dễ khớp nhầm chữ đời, và thế đất của chúng
 *    vốn đã được block "Vòng Trường Sinh thế đất" bao phủ.
 */

import { resolveDamTinhStarName } from "../../knowledge/damTinh";

/** Nhãn một âm tiết quá dễ khớp nhầm văn đời → loại khỏi universe. */
const AMBIGUOUS_SINGLE_SYLLABLE = new Set(["Tử", "Suy", "Mộ", "Thai", "Bệnh", "Dưỡng", "Tuyệt"]);

const stripEnginePrefix = (raw: string): string =>
  String(raw || "")
    .normalize("NFC")
    .replace(/\[SAO\s*(?:LƯU|VẬN)\]\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Regex khớp tên sao nguyên chữ, phân biệt hoa/thường. */
export const starMentionRegex = (name: string): RegExp =>
  new RegExp(`(?<![\\p{L}])${escapeRegExp(name)}(?![\\p{L}])`, "u");

export const starMentionedIn = (name: string, text: string): boolean => {
  if (!name || !text) return false;
  return starMentionRegex(name).test(text);
};

/** Toàn bộ sao/vòng thực có trên lá (đã strip tiền tố engine, lọc nhãn nhập nhằng). */
export function collectChartStarUniverse(palaces: any[]): string[] {
  const universe = new Set<string>();
  for (const p of Array.isArray(palaces) ? palaces : []) {
    for (const s of [...(p?.majorStars || []), ...(p?.minorStars || []), ...(p?.adjectiveStars || [])]) {
      const name = stripEnginePrefix(String(s?.name || ""));
      if (!name || AMBIGUOUS_SINGLE_SYLLABLE.has(name)) continue;
      universe.add(name);
    }
  }
  return [...universe];
}

/** Các block tri thức nuôi sao — thứ tự khớp với audit độ phủ. */
const FED_BLOCKS: (ctx: any) => string[] = (ctx: any) => [
  ctx?.damTinhStr,
  ctx?.damTinhAuxStr,
  ctx?.natalTuHoaStr,
  ctx?.palaceSelfFlyingBlockStr,
  ctx?.corePsychologicalFlightsStr,
  ctx?.decadalFlyingStr,
  ctx?.luuNienFlyingStr,
  ctx?.luuNienReportStr,
  ctx?.damTinhTuHoaDetailStr,
  ctx?.kinhNghiemKnowledgeStr,
  ctx?.saoNhapHanStr,
  ctx?.cachCucReportStr,
  ctx?.vanChamCungStr,
  ctx?.trongTamStr,
  ctx?.stressReportStr,
  ctx?.tinhVaDapReportStr,
  ctx?.temporalTriggerReportStr,
  ctx?.trungPhungReportStr,
  ctx?.luuNienEventCardsStr,
  ctx?.bookCorpusStr,
  ctx?.giaiHoaKnowledgeStr,
  ctx?.tuBinhKnowledgeStr,
  ctx?.phucLocReportStr,
  ctx?.truongSinhReportStr,
  ctx?.tuanTrietReportStr,
  ctx?.bodyPalaceStr,
  ctx?.laiNhanReportStr,
  ctx?.luuNguyetReportStr,
];

/** Block tầng Lưu/Vận — sao có prefix engine chỉ tính fed khi được các block này nuôi. */
const LAYER_BLOCKS: (ctx: any) => string[] = (ctx: any) => [
  ctx?.decadalFlyingStr,
  ctx?.luuNienFlyingStr,
  ctx?.luuNienReportStr,
  ctx?.saoNhapHanStr,
  ctx?.temporalTriggerReportStr,
  ctx?.trungPhungReportStr,
  ctx?.luuNienEventCardsStr,
];

export interface StarMusicBedResult {
  totalStars: number;
  fedStars: number;
  orphanStars: number;
  /** "cung: sao1, sao2" — sao bỏ rơi gom theo cung. */
  musicBedStr: string;
}

/**
 * Tính sao bị bỏ rơi theo lá và dựng block nhạc nền cho skeleton chặng 2.
 * Sao được coi là "được nuôi" nếu tên (hoặc form resolve Vận/Lưu) xuất hiện
 * trong ít nhất một block tri thức.
 */
export function computeStarMusicBed(palaces: any[], ctx: any): StarMusicBedResult {
  // Join MỘT LẦN trước vòng lặp — join trong loop với ~25 block x 150 sao
  // là chục lần copy chuỗi hàng trăm KB mỗi request.
  const allBlocks = FED_BLOCKS(ctx)
    .map((b) => String(b || ""))
    .join("\n");
  const layerBlocks = LAYER_BLOCKS(ctx)
    .map((b) => String(b || ""))
    .join("\n");

  let totalAll = 0;
  const orphanByPalace: { palace: string; stars: string[] }[] = [];

  for (const p of Array.isArray(palaces) ? palaces : []) {
    const orphans: string[] = [];
    for (const s of [...(p?.majorStars || []), ...(p?.minorStars || []), ...(p?.adjectiveStars || [])]) {
      const raw = String(s?.name || "");
      const name = stripEnginePrefix(raw);
      if (!name) continue;
      totalAll++;

      const resolved = resolveDamTinhStarName(raw);
      // Sao tầng Lưu/Vận (có prefix engine): khớp form natal (Vận Xương→Văn Xương)
      // KHÔNG đủ tính fed — phải được block tầng Lưu/Vận nhắc đích danh.
      // Tránh fed-ảo: sao gốc có Đàm Tinh nhưng cơ chế ĐIỆP/XUNG/GIAO TRỜI chưa vào bài.
      const isLayerStar =
        /\[SAO\s*(?:LƯU|VẬN)\]/i.test(raw) || /^(Lưu|Vận)\s/i.test(name);
      let isFed = starMentionedIn(name, allBlocks);
      if (!isFed && !!resolved && resolved !== name) {
        isFed = isLayerStar
          ? starMentionedIn(resolved, layerBlocks)
          : starMentionedIn(resolved, allBlocks);
      }
      if (isFed) continue;

      if (AMBIGUOUS_SINGLE_SYLLABLE.has(name)) continue; // đã được block Trường Sinh thế đất bao
      orphans.push(name);
    }
    if (orphans.length) orphanByPalace.push({ palace: String(p?.name || "Cung"), stars: orphans });
  }

  const orphanCount = orphanByPalace.reduce((n, g) => n + g.stars.length, 0);

  let musicBedStr = "";
  if (orphanCount > 0) {
    const lines = orphanByPalace.map((g) => `  - Cung ${g.palace}: ${g.stars.join(", ")}`);
    musicBedStr = `• SAO NHẠC NỀN THEO CUNG (${orphanCount} sao chưa được nuôi riêng — BẮT BUỘC PHỦ 100%):
Mỗi sao dưới đây PHẢI xuất hiện ít nhất 1 lần trong bài, đan 1 mạch bên trong đoạn dệt đúng cung tương ứng (như người kể chuyện nhắc phụ vai đúng cảnh) — KHÔNG thành mục riêng, KHÔNG liệt kê khô:
${lines.join("\n")}`;
  }

  return {
    totalStars: totalAll,
    // Mọi sao không vào danh sách orphan coi như được nuôi (nhãn nhập nhằng
    // được block "Vòng Trường Sinh thế đất" bao phủ theo thiết kế).
    fedStars: totalAll - orphanCount,
    orphanStars: orphanCount,
    musicBedStr,
  };
}
