/**
 * UI-only: nhận diện tên sao / cung trong bài luận để tô cùng màu xanh
 * với phần chú thích "Phụ / cát" trên lá số.
 *
 * Không đọc / không đổi dữ liệu an sao. Chỉ tách chuỗi ở lớp hiển thị.
 * Danh sách cố ý dùng tên đầy đủ, viết hoa đúng tên sao (phân biệt "Linh Tinh"
 * với cụm thường "linh tinh") để tránh tô nhầm chữ đời thường.
 */

export interface AstroTextPart {
  text: string;
  astro: boolean;
}

const STAR_TERMS = [
  // 14 chính tinh
  "Tử Vi",
  "Thiên Cơ",
  "Thái Dương",
  "Vũ Khúc",
  "Thiên Đồng",
  "Liêm Trinh",
  "Thiên Phủ",
  "Thái Âm",
  "Tham Lang",
  "Cự Môn",
  "Thiên Tướng",
  "Thiên Lương",
  "Thất Sát",
  "Phá Quân",

  // Phụ tinh / cát tinh
  "Tả Phù",
  "Tả Phụ",
  "Hữu Bật",
  "Văn Xương",
  "Văn Khúc",
  "Thiên Khôi",
  "Thiên Việt",
  "Lộc Tồn",
  "Thiên Mã",
  "Thiên Quan",
  "Thiên Phúc",
  "Thiên Đức",
  "Nguyệt Đức",
  "Hồng Loan",
  "Thiên Hỷ",
  "Thiên Hỉ",
  "Đào Hoa",
  "Hàm Trì",
  "Hoa Cái",
  "Thiên Giải",
  "Địa Giải",
  "Giải Thần",
  "Ân Quang",
  "Thiên Quý",
  "Thiên Tài",
  "Thiên Thọ",
  "Long Trì",
  "Phượng Các",
  "Thiên Trù",
  "Thiên Nguyệt",

  // Sát tinh / bại tinh
  "Thiên Hình",
  "Thiên Riêu",
  "Thiên Y",
  "Thiên Khốc",
  "Thiên Hư",
  "Tang Môn",
  "Bạch Hổ",
  "Đại Hao",
  "Tiểu Hao",
  "Kiếp Sát",
  "Kình Dương",
  "Đà La",
  "Hỏa Tinh",
  "Linh Tinh",
  "Địa Không",
  "Địa Kiếp",
  "Thiên Không",
  "Thiên La",
  "Địa Võng",
  "Cô Thần",
  "Quả Tú",
  "Thiên Thương",
  "Thiên Sứ",

  // Tứ Hóa
  "Hóa Lộc",
  "Hóa Quyền",
  "Hóa Khoa",
  "Hóa Kỵ",
  "Hoá Lộc",
  "Hoá Quyền",
  "Hoá Khoa",
  "Hoá Kỵ",
  "Tứ Hóa",
  "Tứ Hoá",
  "Tự Hóa",
  "Tự Hoá",
  "Phi Hóa",
  "Phi Hoá",
  "Lưu Hóa",
  "Lưu Hoá",
  "Vận Hóa",
  "Vận Hoá",
  "Lưu Hóa Lộc",
  "Lưu Hóa Quyền",
  "Lưu Hóa Khoa",
  "Lưu Hóa Kỵ",
  "Lưu Hoá Lộc",
  "Lưu Hoá Quyền",
  "Lưu Hoá Khoa",
  "Lưu Hoá Kỵ",
  "Vận Hóa Lộc",
  "Vận Hóa Quyền",
  "Vận Hóa Khoa",
  "Vận Hóa Kỵ",
  "Vận Hoá Lộc",
  "Vận Hoá Quyền",
  "Vận Hoá Khoa",
  "Vận Hoá Kỵ",
  "Tự Hóa Lộc",
  "Tự Hóa Quyền",
  "Tự Hóa Khoa",
  "Tự Hóa Kỵ",
  "Tự Hoá Lộc",
  "Tự Hoá Quyền",
  "Tự Hoá Khoa",
  "Tự Hoá Kỵ",

  // Sao lưu / vận — giữ nguyên cụm để tô trọn tên
  "Lưu Thiên Mã",
  "Lưu Đà La",
  "Lưu Kình Dương",
  "Lưu Văn Xương",
  "Lưu Văn Khúc",
  "Lưu Thái Tuế",
  "Lưu Tang Môn",
  "Lưu Bạch Hổ",
  "Lưu Thiên Khốc",
  "Lưu Thiên Hư",
  "Lưu Hồng Loan",
  "Lưu Thiên Hỷ",
  "Lưu Thiên Hỉ",
  "Lưu Đại Hao",
  "Lưu Tiểu Hao",
  "Lưu Thiên Khôi",
  "Lưu Thiên Việt",
  "Lưu Lộc Tồn",

  // Tổ hợp / cách cục thường gọi tắt
  "Tử Phủ Vũ Tướng",
  "Cơ Nguyệt Đồng Lương",
  "Sát Phá Liêm Tham",
  "Tử Phủ",
  "Vũ Tướng",
  "Cơ Cự",
  "Cự Nhật",
  "Dương Lương",
  "Âm Dương",
  "Đồng Lương",
  "Tử Sát",
  "Tử Phá",
  "Liêm Phá",
  "Xương Khúc",
  "Khôi Việt",
  "Tả Hữu",
  "Kình Đà",
  "Hỏa Linh",
  "Không Kiếp",
  "Tang Hổ",
  "Khốc Hư",
  "Long Phượng",
  "Tam Thai",
  "Bát Tọa",

  // Cung — tên đầy đủ; Mệnh/Thân chỉ khớp khi có chữ "cung" đi kèm
  "Phụ Mẫu",
  "Huynh Đệ",
  "Phu Thê",
  "Tử Tức",
  "Tài Bạch",
  "Tật Ách",
  "Thiên Di",
  "Nô Bộc",
  "Quan Lộc",
  "Điền Trạch",
  "Phúc Đức",
  "cung Mệnh",
  "Cung Mệnh",
  "cung mệnh",
  "Mệnh cung",
  "Mệnh Cung",
  "mệnh cung",
  "cung Thân",
  "Cung Thân",
  "cung thân",
  "Thân cung",
  "Thân Cung",
  "thân cung",
  "Mệnh/Thân",
  "Mệnh – Thân",
  "Mệnh - Thân",

  // Thuật ngữ đi kèm
  "chính tinh",
  "phụ tinh",
  "sát tinh",
  "Tuần Triệt",
  "Không Vong",
] as const;

const TERMS = [...new Set(STAR_TERMS)].sort((a, b) => b.length - a.length);

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Biên Unicode: không khớp nếu tên sao nằm trong một từ dài hơn.
 * Ví dụ "Tử Vi" không khớp trong "Tử Viên"; "Linh Tinh" không khớp "linh tinh"
 * nhờ regex phân biệt hoa/thường.
 */
const ASTRO_RE = new RegExp(
  `(?<![\\p{L}])(?:${TERMS.map(escapeRegExp).join("|")})(?![\\p{L}])`,
  "gu",
);

/**
 * Tách một chuỗi thành các đoạn thường / tên sao-cung.
 * Luôn giữ nguyên 100% ký tự gốc khi nối các đoạn lại.
 */
export function splitAstroTerms(text: string): AstroTextPart[] {
  if (!text) return [];
  const parts: AstroTextPart[] = [];
  let lastIndex = 0;

  // Tạo regex mới mỗi lần để không dính lastIndex của regex dùng chung.
  const re = new RegExp(ASTRO_RE.source, ASTRO_RE.flags);
  for (const match of text.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, index), astro: false });
    }
    parts.push({ text: match[0], astro: true });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), astro: false });
  }
  return parts;
}
