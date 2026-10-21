/**
 * Bổ sung sao/vòng tinh Nam phái từ iztro vào payload lá số.
 * iztro đã an sẵn Trường Sinh / Bác Sỹ / Tướng Tiền / Tuế Tiền — trước đây UI chỉ hiện Trường Sinh.
 * Mutagen (Tứ Hóa) gắn trên từng sao — khớp nhãn iztro vi-VN (Lộc/Quyền/Khoa/Kỵ).
 */

import { HOA_LABELS } from "../utils/tuHoa";

export interface PalaceDecorativeStars {
  changsheng12?: string;
  boshi12?: string;
  /** Tướng Tiền bẩm sinh (năm sinh) */
  jiangqian12?: string;
  /** Tuế Tiền bẩm sinh (năm sinh) */
  suiqian12?: string;
  /** Tướng Tiền NĂM XEM (iztro yearlyDecStar) — khác vòng gốc */
  yearJiangqian12?: string;
  /** Tuế Tiền NĂM XEM (iztro yearlyDecStar) */
  yearSuiqian12?: string;
}

/** Sao trên payload: tên + miếu/hãm + Tứ Hóa (nếu có). */
export interface EnrichedStar {
  name: string;
  brightness?: string;
  /** Nhãn đầy đủ: Hóa Lộc | Hóa Quyền | Hóa Khoa | Hóa Kỵ */
  mutagen?: string;
  type?: string;
}

export interface EnrichedPalacePayload extends PalaceDecorativeStars {
  index: number;
  name: string;
  earthlyBranch: string;
  heavenlyStem: string;
  isBodyPalace: boolean;
  decadal: {
    range: number[];
    /** Can đại hạn khi đời vào cung này (iztro) */
    heavenlyStem?: string;
    /** Chi đại hạn khi đời vào cung này */
    earthlyBranch?: string;
  };
  /** Tuổi mụ tiểu hạn vào cung này (iztro palace.ages) */
  ages?: number[];
  majorStars: EnrichedStar[];
  minorStars: EnrichedStar[];
  adjectiveStars: EnrichedStar[];
}

/** Chuẩn hóa mutagen iztro ("Lộc"|"Kỵ"|…) → "Hóa Lộc"|… ; đã đủ "Hóa …" thì giữ. */
export function normalizeMutagenLabel(raw: unknown): string | undefined {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;
  if (/^hóa\s+/iu.test(s)) {
    const hit = HOA_LABELS.find((h) => h.localeCompare(s, "vi", { sensitivity: "accent" }) === 0
      || h.toLowerCase() === s.toLowerCase());
    return hit || s;
  }
  // Short: Lộc / Quyền / Khoa / Kỵ (± dấu)
  const short = s.normalize("NFC").replace(/^hóa\s+/iu, "");
  const map: Record<string, string> = {
    lộc: "Hóa Lộc",
    loc: "Hóa Lộc",
    quyền: "Hóa Quyền",
    quyen: "Hóa Quyền",
    khoa: "Hóa Khoa",
    kỵ: "Hóa Kỵ",
    ky: "Hóa Kỵ",
  };
  const key = short.toLowerCase();
  return map[key] || HOA_LABELS.find((h) => h.endsWith(short) || h.includes(short)) || undefined;
}

function mapStar(s: any): EnrichedStar {
  const name = String(s?.name ?? "").trim();
  const brightness = s?.brightness != null && String(s.brightness).trim()
    ? String(s.brightness).trim()
    : undefined;
  const mutagen = normalizeMutagenLabel(s?.mutagen);
  const type = s?.type != null && String(s.type).trim() ? String(s.type).trim() : undefined;
  const out: EnrichedStar = { name };
  if (brightness) out.brightness = brightness;
  if (mutagen) out.mutagen = mutagen;
  if (type) out.type = type;
  return out;
}

export function extractDecorativeStars(p: any): PalaceDecorativeStars {
  return {
    changsheng12: p.changsheng12,
    boshi12: p.boshi12,
    jiangqian12: p.jiangqian12,
    suiqian12: p.suiqian12,
  };
}

export function enrichPalaceForPayload(
  p: any,
  extraMinorStars: Array<{ name: string; mutagen?: string }> = [],
  yearRings?: { yearSuiqian12?: string; yearJiangqian12?: string },
): EnrichedPalacePayload {
  const ages = Array.isArray(p.ages)
    ? p.ages.map((n: unknown) => Number(n)).filter((n: number) => Number.isFinite(n))
    : undefined;
  const dRange = Array.isArray(p.decadal?.range) ? p.decadal.range : [];
  const dStem = p.decadal?.heavenlyStem != null ? String(p.decadal.heavenlyStem).trim() : "";
  const dBranch = p.decadal?.earthlyBranch != null ? String(p.decadal.earthlyBranch).trim() : "";

  return {
    index: p.index,
    name: p.name,
    earthlyBranch: p.earthlyBranch,
    heavenlyStem: p.heavenlyStem,
    isBodyPalace: p.isBodyPalace,
    ...extractDecorativeStars(p),
    ...(yearRings?.yearSuiqian12 ? { yearSuiqian12: yearRings.yearSuiqian12 } : {}),
    ...(yearRings?.yearJiangqian12 ? { yearJiangqian12: yearRings.yearJiangqian12 } : {}),
    decadal: {
      range: dRange,
      ...(dStem ? { heavenlyStem: dStem } : {}),
      ...(dBranch ? { earthlyBranch: dBranch } : {}),
    },
    ...(ages && ages.length ? { ages } : {}),
    majorStars: (p.majorStars || []).map(mapStar),
    minorStars: [
      ...(p.minorStars || []).map(mapStar),
      ...extraMinorStars.map((s) => mapStar(s)),
    ],
    adjectiveStars: (p.adjectiveStars || []).map(mapStar),
  };
}

/**
 * Format sao cho prompt AI: "Thiên Cơ (Miếu) [Hóa Kỵ]".
 * Mutagen gắn tại chỗ — vẫn giữ block Tứ Hóa tổng ở prompt.
 */
export function formatStarForPrompt(s: { name?: string; brightness?: string; mutagen?: string; type?: string }): string {
  const name = String(s?.name || "").trim() || "?";
  const parts: string[] = [];
  if (s?.brightness) parts.push(String(s.brightness).trim());
  if (s?.mutagen) parts.push(String(s.mutagen).trim());
  if (s?.type && !s.mutagen) parts.push(String(s.type).trim());
  return parts.length ? `${name} (${parts.join(", ")})` : name;
}

/** Metadata trường phái gửi kèm payload AI */
export const CHART_SCHOOL_META = {
  primarySchool: "nam-tran-doan-vn",
  primaryLabel: "Nam phái – Hi Di Trần Đoàn (Toàn Thư + Thực Hành)",
  internalSchool: "bac-ha-lac-vn",
  internalLabel: "Bắc phái – Hà Lạc phái Huyền Bí Tập (Phương Ngoại Nhân)",
  engine: "iztro",
} as const;
