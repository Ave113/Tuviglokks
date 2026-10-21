// Nguồn Tứ Hóa DUY NHẤT cho toàn dự án (bản đồ [Lộc, Quyền, Khoa, Kỵ] theo Thiên can).
// Trước đây bảng này bị trùng ở cả server.ts (TU_HOA_BY_STEM) và tuvi.ts
// (LUU_TU_HOA_BY_STEM). Gom về đây để chỉ có một nguồn sự thật, sửa một chỗ.
//
// Thứ tự 4 sao trong mỗi mảng luôn là: [Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ].
// Phải khớp iztro heavenlyStems.mutagen + locale vi-VN (và mutagen trên lá thật).
// Regression: src/utils/tuHoa.test.ts — "TU_HOA_BY_STEM ↔ iztro mutagen".

export type TuHoaQuartet = [string, string, string, string];

// Tra theo tên Thiên can (dùng ở server.ts: can của từng cung / can năm sinh).
export const TU_HOA_BY_STEM: Record<string, TuHoaQuartet> = {
  "Giáp": ["Liêm Trinh", "Phá Quân", "Vũ Khúc", "Thái Dương"],
  "Ất": ["Thiên Cơ", "Thiên Lương", "Tử Vi", "Thái Âm"],
  "Bính": ["Thiên Đồng", "Thiên Cơ", "Văn Xương", "Liêm Trinh"],
  "Đinh": ["Thái Âm", "Thiên Đồng", "Thiên Cơ", "Cự Môn"],
  "Mậu": ["Tham Lang", "Thái Âm", "Hữu Bật", "Thiên Cơ"],
  "Kỷ": ["Vũ Khúc", "Tham Lang", "Thiên Lương", "Văn Khúc"],
  "Canh": ["Thái Dương", "Vũ Khúc", "Thái Âm", "Thiên Đồng"],
  "Tân": ["Cự Môn", "Thái Dương", "Văn Khúc", "Văn Xương"],
  // iztro vi-VN: "Tả Phù" (không phải "Tả Phụ") — phải khớp tên sao trên lá số.
  "Nhâm": ["Thiên Lương", "Tử Vi", "Tả Phù", "Vũ Khúc"],
  "Quý": ["Phá Quân", "Cự Môn", "Thái Âm", "Tham Lang"],
};

// Nhãn Hóa chuẩn cho tứ hóa nguyên cục / phi hóa.
export const HOA_LABELS: TuHoaQuartet = ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"];

// Quy ước index Thiên can theo (năm % 10) mà core tuvi.ts dùng cho transitStemIndex:
// 0:Canh, 1:Tân, 2:Nhâm, 3:Quý, 4:Giáp, 5:Ất, 6:Bính, 7:Đinh, 8:Mậu, 9:Kỷ
export const STEM_NAME_BY_YEAR_MOD: string[] = [
  "Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ",
];

/** Index Thiên can theo (năm % 10): 0 Canh … 9 Kỷ. Chuẩn hóa âm năm. */
export const stemIndexByYear = (year: number): number => ((year % 10) + 10) % 10;

/** Tên Thiên can từ năm dương (cùng quy ước transitStemIndex trong tuvi.ts). */
export const stemNameByYear = (year: number): string =>
  STEM_NAME_BY_YEAR_MOD[stemIndexByYear(year)];

// Tra theo index (năm % 10) — tiện cho tuvi.ts (Lưu Tứ Hóa theo can năm hạn).
export const TU_HOA_BY_YEAR_MOD: Record<number, TuHoaQuartet> = STEM_NAME_BY_YEAR_MOD.reduce(
  (acc, stemName, idx) => {
    acc[idx] = TU_HOA_BY_STEM[stemName];
    return acc;
  },
  {} as Record<number, TuHoaQuartet>,
);

/** Một sao thụ hóa trong lớp Tứ Hóa (bẩm sinh / vận / lưu). */
export interface LayerTuHoaItem {
  /** Hóa Lộc | Hóa Quyền | Hóa Khoa | Hóa Kỵ */
  hoa: string;
  /** Tên sao thụ hóa */
  star: string;
  /** Index địa chi Tý=0; -1 nếu không tìm thấy trên lá */
  branchIdx: number;
  palaceName: string;
}

/** 4 sao + can (và chi nếu có) của một lớp Tứ Hóa. */
export interface LayerTuHoa {
  stem: string;
  branch?: string;
  /** vận = đại hạn; lưu = năm xem; natal = bẩm sinh */
  layer: "vận" | "lưu" | "natal";
  items: LayerTuHoaItem[];
}

/**
 * Bảng chuẩn hóa Thiên Can: hỗ trợ cả chữ thường, chữ hoa, không dấu, có dấu.
 * Khóa cứng để không bao giờ xảy ra lỗi tra cứu sai lệch hoặc gán nhầm biến.
 */
const STEM_CANONICAL_MAP: Record<string, string> = {
  "giap": "Giáp", "giáp": "Giáp",
  "at": "Ất", "ất": "Ất",
  "binh": "Bính", "bính": "Bính",
  "dinh": "Đinh", "đinh": "Đinh",
  "mau": "Mậu", "mậu": "Mậu",
  "ky": "Kỷ", "kỷ": "Kỷ",
  "canh": "Canh",
  "tan": "Tân", "tân": "Tân",
  "nham": "Nhâm", "nhâm": "Nhâm",
  "quy": "Quý", "quý": "Quý",
};

/**
 * Chuẩn hóa Thiên Can về đúng 1 trong 10 can chuẩn viết hoa:
 * Giáp, Ất, Bính, Đinh, Mậu, Kỷ, Canh, Tân, Nhâm, Quý.
 * 
 * Sử dụng token tách từ chính xác, TUYỆT ĐỐI không dùng regex \b vì ký tự tiếng Việt
 * có dấu (như "Tuất") sẽ bị \b cắt nhầm thành "ất" (ví dụ Canh Tuất -> Ất).
 */
export function normalizeHeavenlyStem(stem: unknown): string {
  if (!stem || typeof stem !== "string") return "";
  const raw = stem.trim();
  if (TU_HOA_BY_STEM[raw]) return raw;

  // Tách chuỗi thành các từ riêng biệt theo khoảng trắng và dấu phân cách
  const tokens = raw
    .toLowerCase()
    .split(/[\s,\-_/\\():;.[\]{}]+/)
    .filter(Boolean);

  // Quét từng từ theo thứ tự xuất hiện, từ đầu tiên khớp 1 trong 10 can là Can cần tìm
  for (const token of tokens) {
    if (STEM_CANONICAL_MAP[token]) {
      return STEM_CANONICAL_MAP[token];
    }
  }

  return "";
}

export function quartetForStem(stem: string | undefined | null): TuHoaQuartet | null {
  const canonical = normalizeHeavenlyStem(stem);
  if (!canonical) return null;
  return TU_HOA_BY_STEM[canonical] ?? null;
}

/**
 * Trích xuất Thiên Can năm sinh chuẩn xác từ lá số iztro hoặc payload.
 * Ưu tiên:
 * 1. birthHeavenlyStem trực tiếp (nếu có và chuẩn hóa được)
 * 2. chineseDate (e.g. "Canh Tuất - Bính Tý..." -> "Canh")
 * 3. Bát Tự trụ năm (baZi.pillars.year.heavenlyStem)
 * 4. lunarYear từ iztro
 * 5. fallbackYear
 */
export function extractBirthHeavenlyStem(chart: any, fallbackYear?: number): string {
  if (chart?.birthHeavenlyStem) {
    const s = normalizeHeavenlyStem(chart.birthHeavenlyStem);
    if (s) return s;
  }

  if (typeof chart?.chineseDate === "string") {
    const yearPart = chart.chineseDate.split("-")[0]?.trim() || "";
    const s = normalizeHeavenlyStem(yearPart);
    if (s) return s;
  }

  if (chart?.baZi?.pillars?.year?.heavenlyStem) {
    const s = normalizeHeavenlyStem(chart.baZi.pillars.year.heavenlyStem);
    if (s) return s;
  }

  const lunarYear = chart?.rawDates?.lunarDate?.lunarYear ?? chart?.birthLunarYear;
  if (typeof lunarYear === "number" && !isNaN(lunarYear)) {
    return stemNameByYear(lunarYear);
  }

  if (typeof fallbackYear === "number" && !isNaN(fallbackYear)) {
    return stemNameByYear(fallbackYear);
  }

  return "";
}

/**
 * Khóa cứng logic tra cứu Tứ Hóa Bẩm Sinh theo Can Năm.
 * Trả về 4 cặp chuẩn xác: [Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ].
 */
export function getNatalTuHoaQuartet(stem: string | undefined | null): TuHoaQuartet | null {
  return quartetForStem(stem);
}

/**
 * Kiểm tra tính hợp lệ của sao thụ Hóa theo Can.
 */
export function isValidNatalTuHoaStar(stem: string, hoaLabel: string, starName: string): boolean {
  const quartet = quartetForStem(stem);
  if (!quartet) return false;
  const hoaIdx = HOA_LABELS.indexOf(hoaLabel as any);
  if (hoaIdx < 0) return false;
  return quartet[hoaIdx].toLowerCase() === String(starName || "").trim().toLowerCase();
}


/** Nhãn prefix khi gắn lên saoLuuMap / UI. */
export const VAN_HOA_LABELS: TuHoaQuartet = [
  "Vận Hóa Lộc",
  "Vận Hóa Quyền",
  "Vận Hóa Khoa",
  "Vận Hóa Kỵ",
];
export const LUU_HOA_LABELS: TuHoaQuartet = [
  "Lưu Hóa Lộc",
  "Lưu Hóa Quyền",
  "Lưu Hóa Khoa",
  "Lưu Hóa Kỵ",
];

/** Text gọn cho prompt / UI (1 dòng / hóa). */
export function formatLayerTuHoaBlock(
  layer: LayerTuHoa | null | undefined,
  title?: string,
): string {
  if (!layer?.items?.length) return "";
  const head =
    title ||
    (layer.layer === "vận"
      ? "Vận Tứ Hóa (đại hạn)"
      : layer.layer === "lưu"
        ? "Lưu Tứ Hóa (năm xem)"
        : "Tứ Hóa bẩm sinh");
  const stemChi = [layer.stem, layer.branch].filter(Boolean).join(" ");
  const lines = layer.items.map((it) => {
    const where =
      it.palaceName
        ? ` → cung ${it.palaceName}`
        : it.branchIdx >= 0
          ? ` → chi #${it.branchIdx}`
          : " → (sao không thấy trên lá)";
    return `  - ${it.hoa}: ${it.star}${where}`;
  });
  return `* ${head}${stemChi ? ` — can–chi ${stemChi}` : ""}:\n${lines.join("\n")}`;
}
