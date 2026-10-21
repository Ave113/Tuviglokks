import { normalizeStarName } from "./chartRelations";
import { HOA_LABELS } from "./tuHoa";

/**
 * Danh mục tên sao vi-VN (iztro + lưu niên + tứ hóa) — quét đầu ra AI.
 * Sắp theo độ dài giảm dần khi match để tránh "Thái" nuốt "Thái Dương"/"Thái Âm".
 */
const IZTRO_VI_STARS = [
  "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ",
  "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân",
  "Tả Phù", "Tả Phụ", "Hữu Bật", "Văn Xương", "Văn Khúc", "Lộc Tồn", "Thiên Mã", "Kình Dương", "Đà La",
  "Hỏa Tinh", "Linh Tinh", "Thiên Khôi", "Thiên Việt", "Địa Không", "Địa Kiếp", "Kiếp Sát",
  "Thiên Không", "Thiên Hình", "Thiên Diêu", "Giải Thần", "Âm Sát", "Thiên Hỷ", "Thiên Quan",
  "Thiên Phúc", "Thiên Khốc", "Thiên Hư", "Long Trì", "Phụng Các", "Hồng Loan", "Cô Thần",
  "Quả Tú", "Phi Liêm", "Phá Toái", "Đài Phụ", "Phong Cáo", "Thiên Vu", "Thiên Nguyệt",
  "Tam Thai", "Bát Tọa", "Ân Quang", "Thiên Quý", "Thiên Tài", "Thiên Thọ", "Triệt Không",
  "Tuần Trung", "Tuần Không", "Không Vong", "Triệt Lộ", "Nguyệt Đức", "Thiên Thương",
  "Thiên Sứ", "Thiên Trù", "Trường Sinh", "Mục Dục", "Quan Đới", "Lâm Quan", "Đế Vượng",
  "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng", "Bác Sỹ", "Lực Sỹ", "Thanh Long",
  "Tiểu Hao", "Tướng Quân", "Tấu Thư", "Hỷ Thần", "Bệnh Phù", "Đại Hao", "Tuế Phá",
  "Phục Binh", "Quan Phủ", "Tuế Kiện", "Hối Khí", "Tang Môn", "Quán Tác", "Quan Phù",
  "Long Đức", "Bạch Hổ", "Thiên Đức", "Điếu Khách", "Tướng Tinh", "Phan Án", "Tuế Dịch",
  "Tức Thần", "Hoa Cái", "Tai Sát", "Thiên Sát", "Chỉ Bối", "Hàm Trì", "Nguyệt Sát",
  "Vong Thần", "Vận Khôi", "Vận Việt", "Vận Xương", "Vận Khúc", "Vận Loan", "Vận Hỷ",
  "Vận Lộc", "Vận Dương", "Vận Đà", "Vận Mã", "Lưu Khôi", "Lưu Việt", "Lưu Xương", "Lưu Khúc",
  "Lưu Loan", "Lưu Hỷ", "Lưu Lộc", "Lưu Dương", "Lưu Đà", "Lưu Mã", "Niên Giải",
  "Lưu Thái Tuế", "Lưu Tang Môn", "Lưu Bạch Hổ", "Lưu Lộc Tồn", "Lưu Kình Dương", "Lưu Đà La",
  "Lưu Thiên Mã", "Lưu Thiên Khốc", "Lưu Thiên Hư", "Lưu Hồng Loan", "Lưu Văn Xương", "Lưu Văn Khúc",
  "Lưu Thiên Đức", "Lưu Nguyệt Đức", "Lưu Phúc Đức", "Lưu Long Đức",
  ...HOA_LABELS,
  ...HOA_LABELS.map((h) => `Lưu ${h}`),
];

export interface CatalogStar {
  display: string;
  norm: string;
}

const deduped = new Map<string, string>();
for (const raw of IZTRO_VI_STARS) {
  const display = String(raw).trim();
  if (!display) continue;
  const norm = normalizeStarName(display);
  if (!norm || deduped.has(norm)) continue;
  deduped.set(norm, display);
}

/** Toàn hệ — dùng trích sao AI nhắc tới (không phải whitelist lá số). */
export const TUVI_STAR_CATALOG: CatalogStar[] = [...deduped.entries()]
  .map(([norm, display]) => ({ display, norm }))
  .sort((a, b) => b.display.length - a.display.length);

/** 14 chính tinh — bịa một trong số này → mức retry. */
export const MAJOR_STAR_NORMS = new Set(
  [
    "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ",
    "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân",
  ].map(normalizeStarName),
);