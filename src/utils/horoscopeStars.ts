/**
 * Bổ sung Lưu niên / Vận (đại hạn) từ iztro.horoscope vào saoLuuMap (index địa chi Tý=0).
 * App vẫn an bộ lõi (Thái Tuế, Tang, Lộc…); lớp này lấp Khôi/Việt, Niên Giải, Vận *,
 * và các sao iztro có mà rule app chưa cover — dedup theo alias tên.
 */

import { normalizeStarName, toBranchIndex } from "./chartRelations";

/** Tên ngắn iztro yearly → tên dài app (để dedup với rule calculateTransitInfo). */
const IZTRO_YEARLY_CANON: Record<string, string> = {
  "lưu lộc": "Lưu Lộc Tồn",
  "lưu dương": "Lưu Kình Dương",
  "lưu đà": "Lưu Đà La",
  "lưu mã": "Lưu Thiên Mã",
  "lưu xương": "Lưu Văn Xương",
  "lưu khúc": "Lưu Văn Khúc",
  "lưu loan": "Lưu Hồng Loan",
  "lưu hỷ": "Lưu Thiên Hỷ",
  "lưu khôi": "Lưu Khôi",
  "lưu việt": "Lưu Việt",
  "niên giải": "Niên Giải",
};

/** Nhóm tương đương — đã có 1 thành viên trên cung thì không push thêm. */
const EQUIV_GROUPS: string[][] = [
  ["lưu lộc tồn", "lưu lộc"],
  ["lưu kình dương", "lưu dương", "lưu kình"],
  ["lưu đà la", "lưu đà"],
  ["lưu thiên mã", "lưu mã"],
  ["lưu văn xương", "lưu xương"],
  ["lưu văn khúc", "lưu khúc"],
  ["lưu hồng loan", "lưu loan"],
  ["lưu thiên hỷ", "lưu hỷ"],
  ["lưu thái tuế", "lưu tuế", "thái tuế"],
];

function normsEquivalent(a: string, b: string): boolean {
  if (a === b) return true;
  for (const g of EQUIV_GROUPS) {
    if (g.includes(a) && g.includes(b)) return true;
  }
  return false;
}

function listHasEquivalent(list: string[], candidate: string): boolean {
  const c = normalizeStarName(candidate);
  return list.some((s) => normsEquivalent(normalizeStarName(s), c));
}

function pushUnique(map: Record<number, string[]>, branchIdx: number, displayName: string): void {
  if (branchIdx < 0 || branchIdx > 11) return;
  const name = String(displayName || "").trim();
  if (!name) return;
  if (!map[branchIdx]) map[branchIdx] = [];
  if (listHasEquivalent(map[branchIdx], name)) return;
  map[branchIdx].push(name);
}

function canonicalizeYearlyName(raw: string): string {
  const n = normalizeStarName(raw);
  return IZTRO_YEARLY_CANON[n] || String(raw || "").trim();
}

export type HoroscopeCapable = {
  horoscope?: (date: string | Date) => {
    yearly?: {
      stars?: Array<Array<{ name?: string } | null> | null>;
      /** Tuế Tiền / Tướng Tiền của NĂM XEM (12 phần tử, index = iztro palace 0=Dần). */
      yearlyDecStar?: {
        suiqian12?: string[] | readonly string[];
        jiangqian12?: string[] | readonly string[];
      };
    };
    decadal?: { stars?: Array<Array<{ name?: string } | null> | null> };
  };
};

/** Vòng Tuế Tiền / Tướng Tiền năm xem — key = index địa chi Tý=0. */
export interface YearlyDecRingsByBranch {
  /** Tuế Tiền năm xem (vd Tang Môn, Quan Phù…) theo chi cung */
  yearSuiqianByBranch: Record<number, string>;
  /** Tướng Tiền năm xem (vd Hoa Cái, Tai Sát…) theo chi cung */
  yearJiangqianByBranch: Record<number, string>;
}

function emptyBranchRecord(): Record<number, string> {
  const o: Record<number, string> = {};
  for (let i = 0; i < 12; i++) o[i] = "";
  return o;
}

function iztroIndexToBranch(
  iztroIndex: number,
  palaceByIztroIndex: Map<number, any>,
): number {
  const p = palaceByIztroIndex.get(iztroIndex);
  return p ? toBranchIndex(p.index) : toBranchIndex(iztroIndex);
}

/**
 * Parse yearlyDecStar từ object horoscope đã gọi.
 * Mảng 12 phần tử align palace.index (Dần=0).
 */
export function yearlyDecRingsFromHoroscope(
  h: { yearly?: { yearlyDecStar?: { suiqian12?: readonly string[]; jiangqian12?: readonly string[] } } } | null | undefined,
  palaces: any[],
): YearlyDecRingsByBranch | null {
  const yd = h?.yearly?.yearlyDecStar;
  if (!yd) return null;

  const palaceByIztroIndex = new Map<number, any>();
  for (const p of palaces || []) {
    if (p && typeof p.index === "number") palaceByIztroIndex.set(p.index, p);
  }

  const yearSuiqianByBranch = emptyBranchRecord();
  const yearJiangqianByBranch = emptyBranchRecord();
  const sui = yd.suiqian12;
  const jiang = yd.jiangqian12;

  if (Array.isArray(sui) && sui.length === 12) {
    sui.forEach((name: string, iztroIndex: number) => {
      const b = iztroIndexToBranch(iztroIndex, palaceByIztroIndex);
      yearSuiqianByBranch[b] = String(name || "").trim();
    });
  }
  if (Array.isArray(jiang) && jiang.length === 12) {
    jiang.forEach((name: string, iztroIndex: number) => {
      const b = iztroIndexToBranch(iztroIndex, palaceByIztroIndex);
      yearJiangqianByBranch[b] = String(name || "").trim();
    });
  }

  const hasAny =
    Object.values(yearSuiqianByBranch).some(Boolean) ||
    Object.values(yearJiangqianByBranch).some(Boolean);
  return hasAny ? { yearSuiqianByBranch, yearJiangqianByBranch } : null;
}

/**
 * Lấy Tuế Tiền / Tướng Tiền năm xem (gọi horoscope một lần).
 */
export function extractYearlyDecRings(
  astrolabe: HoroscopeCapable | null | undefined,
  transitYear: number,
  palaces: any[],
): YearlyDecRingsByBranch | null {
  if (!astrolabe || typeof astrolabe.horoscope !== "function") return null;
  try {
    const h = astrolabe.horoscope(`${transitYear}-06-15`);
    return yearlyDecRingsFromHoroscope(h, palaces);
  } catch {
    return null;
  }
}

/**
 * Merge yearly (Lưu *) + decadal (Vận *) từ iztro vào saoLuuMap (branch index).
 * An toàn: không có horoscope / lỗi → no-op.
 * opts.skipDecadal: 童限 (chưa nhập đại vận thật) → bỏ TOÀN BỘ lớp "Vận *"
 * (iztro trả decadal giả của cung 童限, gây mâu thuẫn với nhãn "Chưa vào Đại Hạn").
 * @returns yearlyDec rings nếu lấy được (Tuế/Tướng tiền năm xem).
 */
export function mergeIztroHoroscopeStars(
  astrolabe: HoroscopeCapable | null | undefined,
  transitYear: number,
  saoLuuMap: Record<number, string[]>,
  palaces: any[],
  opts?: { skipDecadal?: boolean },
): YearlyDecRingsByBranch | null {
  if (!astrolabe || typeof astrolabe.horoscope !== "function") return null;

  let h: ReturnType<NonNullable<HoroscopeCapable["horoscope"]>>;
  try {
    // Giữa năm dương — đủ để iztro neo Lưu niên + đại hạn theo tuổi.
    h = astrolabe.horoscope(`${transitYear}-06-15`);
  } catch {
    return null;
  }
  if (!h) return null;

  const palaceByIztroIndex = new Map<number, any>();
  for (const p of palaces || []) {
    if (p && typeof p.index === "number") palaceByIztroIndex.set(p.index, p);
  }

  const placeAtIztroIndex = (iztroIndex: number, displayName: string) => {
    const branchIdx = iztroIndexToBranch(iztroIndex, palaceByIztroIndex);
    pushUnique(saoLuuMap, branchIdx, displayName);
  };

  const yearlyStars = h.yearly?.stars;
  if (Array.isArray(yearlyStars)) {
    yearlyStars.forEach((arr, iztroIndex) => {
      if (!Array.isArray(arr)) return;
      for (const s of arr) {
        const raw = String(s?.name || "").trim();
        if (!raw) continue;
        // Bỏ mutagen tứ hóa rời nếu iztro đặt trong yearly.stars (app đã an Lưu Hóa * riêng)
        if (/^lưu\s+hóa\s+/iu.test(raw) || /hóa\s+(lộc|quyền|khoa|kỵ)$/iu.test(raw)) continue;
        placeAtIztroIndex(iztroIndex, canonicalizeYearlyName(raw));
      }
    });
  }

  const decadalStars = opts?.skipDecadal ? undefined : h.decadal?.stars;
  if (Array.isArray(decadalStars)) {
    decadalStars.forEach((arr, iztroIndex) => {
      if (!Array.isArray(arr)) return;
      for (const s of arr) {
        const raw = String(s?.name || "").trim();
        if (!raw) continue;
        // Chuẩn hoá: luôn prefix Vận nếu engine trả tên không có
        const display = /^vận\s+/iu.test(raw) ? raw : `Vận ${raw}`;
        placeAtIztroIndex(iztroIndex, display);
      }
    });
  }

  // Tuế Tiền / Tướng Tiền năm xem (không nhét vào saoLuuMap — gắn field riêng trên cung)
  return yearlyDecRingsFromHoroscope(h, palaces);
}

/** True nếu chuỗi là sao Vận (đại hạn), dùng gắn [SAO VẬN] trên payload. */
export function isVanStarName(name: string): boolean {
  return /^vận\s+/iu.test(String(name || "").replace(/\[SAO\s*(?:LƯU|VẬN)\]\s*/gi, "").trim());
}
