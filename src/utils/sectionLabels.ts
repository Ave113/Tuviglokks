/**
 * UI-only: nhận diện một số nhãn mục luận giải để tô đỏ ở lớp hiển thị.
 * Không đổi nội dung, không can thiệp dữ liệu an sao / prompt.
 *
 * Danh sách này ưu tiên hơn màu xanh tên sao: cụm "Cấu trúc Sát Tinh" hay
 * "Độ sâu Tứ Hóa" được tô trọn đỏ thay vì tách "Sát Tinh"/"Tứ Hóa" thành xanh.
 */

export interface SectionLabelPart {
  text: string;
  label: boolean;
}

/**
 * Các biến thể thường gặp: Title Case, IN HOA, "&" hoặc "và", Hóa/Hoá, Khỏe/Khoẻ.
 * Regex phân biệt hoa/thường để không tô đỏ câu văn thường như "sự nghiệp và tài lộc".
 */
const INLINE_LABEL_PATTERNS = [
  String.raw`Cấu\s+trúc\s+[Ss]át\s+[Tt]inh`,
  String.raw`CẤU\s+TRÚC\s+SÁT\s+TINH`,
  String.raw`Độ\s+sâu\s+[Tt]ứ\s+[Hh][oó][áa]`,
  String.raw`ĐỘ\s+SÂU\s+TỨ\s+H[OÓ][ÁA]`,
  String.raw`Sự\s+nghiệp\s*(?:&|và|Và|VÀ)\s*[Tt]ài\s+lộc`,
  String.raw`SỰ\s+NGHIỆP\s*(?:&|VÀ)\s*TÀI\s+LỘC`,
  String.raw`Tình\s+cảm\s*(?:&|và|Và|VÀ)\s*[Gg]ia\s+đạo`,
  String.raw`TÌNH\s+CẢM\s*(?:&|VÀ)\s*GIA\s+ĐẠO`,
  String.raw`Sức\s+[Kk]h[ỏo][eẻ]\s*(?:&|và|Và|VÀ)\s*[Mm]ôi\s+trường\s+sống`,
  String.raw`SỨC\s+KH[ỎO][EẺ]\s*(?:&|VÀ)\s*MÔI\s+TRƯỜNG\s+SỐNG`,
  // Các nhãn mục con còn lại — đủ dài để không tô nhầm câu văn thường.
  String.raw`Tính\s+va\s+đập\s*(?:&|và|Và|VÀ)\s*[Đđ]iểm\s+mù`,
  String.raw`TÍNH\s+VA\s+ĐẬP\s*(?:&|VÀ)\s*ĐIỂM\s+MÙ`,
  String.raw`Tự\s+[Pp]hi\s+[Tt]ứ\s+[Hh][oó][áa]`,
  String.raw`TỰ\s+PHI\s+TỨ\s+H[OÓ][ÁA]`,
  String.raw`Các\s+cung\s+còn\s+lại`,
  String.raw`CÁC\s+CUNG\s+CÒN\s+LẠI`,
  String.raw`Đại\s+hạn\s*\(\s*10\s*năm\s*\)`,
  String.raw`ĐẠI\s+HẠN\s*\(\s*10\s*NĂM\s*\)`,
  String.raw`Luận\s+giải\s+[Tt]iểu\s+[Hh]ạn`,
  String.raw`LUẬN\s+GIẢI\s+TIỂU\s+HẠN`,
  String.raw`Tháng\s+nóng\s+nhất`,
  String.raw`THÁNG\s+NÓNG\s+NHẤT`,
  String.raw`Tháng\s+trọng\s+tâm`,
  String.raw`THÁNG\s+TRỌNG\s+TÂM`,
  String.raw`Định\s+cách\s*(?:&|và|Và|VÀ)\s*[Tt]ổng\s+lực\s+đa\s+chiều`,
  String.raw`ĐỊNH\s+CÁCH\s*(?:&|VÀ)\s*TỔNG\s+LỰC\s+ĐA\s+CHIỀU`,
  String.raw`Đối\s+chiếu\s+chéo\s+[Bb]át\s+[Tt]ự`,
  String.raw`ĐỐI\s+CHIẾU\s+CHÉO\s+BÁT\s+TỰ`,
] as const;

/**
 * Nhãn một từ dễ trùng với tên cung / câu văn thường — chỉ tô đỏ khi là heading.
 */
const HEADING_ONLY_PATTERNS = [
  String.raw`Sự\s+nghiệp`,
  String.raw`SỰ\s+NGHIỆP`,
  String.raw`Tài\s+lộc`,
  String.raw`TÀI\s+LỘC`,
  String.raw`Phúc\s+Đức`,
  String.raw`PHÚC\s+ĐỨC`,
] as const;

const buildLabelRe = (patterns: readonly string[]) =>
  new RegExp(
    `(?<![\\p{L}])(?:${patterns.join("|")})(?![\\p{L}])`,
    "gu",
  );

const INLINE_LABEL_RE = buildLabelRe(INLINE_LABEL_PATTERNS);
const HEADING_LABEL_RE = buildLabelRe([
  ...INLINE_LABEL_PATTERNS,
  ...HEADING_ONLY_PATTERNS,
]);

/**
 * Tách một chuỗi thành các đoạn thường / nhãn mục đỏ.
 * `mode = "heading"` cho phép nhận thêm các nhãn một từ (Sự nghiệp, Tài lộc, Phúc Đức).
 * Luôn giữ nguyên 100% ký tự gốc khi nối các đoạn lại.
 */
export function splitSectionLabels(
  text: string,
  mode: "inline" | "heading" = "inline",
): SectionLabelPart[] {
  if (!text) return [];
  const parts: SectionLabelPart[] = [];
  let lastIndex = 0;

  const source = mode === "heading" ? HEADING_LABEL_RE : INLINE_LABEL_RE;
  const re = new RegExp(source.source, source.flags);
  for (const match of text.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, index), label: false });
    }
    parts.push({ text: match[0], label: true });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), label: false });
  }
  return parts;
}
