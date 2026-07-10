/**
 * Bổ sung sao/vòng tinh Nam phái từ iztro vào payload lá số.
 * iztro đã an sẵn Trường Sinh / Bác Sỹ / Tướng Tiền / Tuế Tiền — trước đây UI chỉ hiện Trường Sinh.
 */

export interface PalaceDecorativeStars {
  changsheng12?: string;
  boshi12?: string;
  jiangqian12?: string;
  suiqian12?: string;
}

export interface EnrichedPalacePayload extends PalaceDecorativeStars {
  index: number;
  name: string;
  earthlyBranch: string;
  heavenlyStem: string;
  isBodyPalace: boolean;
  decadal: { range: number[] };
  majorStars: Array<{ name: string; brightness?: string }>;
  minorStars: Array<{ name: string }>;
  adjectiveStars: Array<{ name: string; type?: string }>;
}

export function extractDecorativeStars(p: any): PalaceDecorativeStars {
  return {
    changsheng12: p.changsheng12,
    boshi12: p.boshi12,
    jiangqian12: p.jiangqian12,
    suiqian12: p.suiqian12,
  };
}

export function enrichPalaceForPayload(p: any, extraMinorStars: Array<{ name: string }> = []): EnrichedPalacePayload {
  return {
    index: p.index,
    name: p.name,
    earthlyBranch: p.earthlyBranch,
    heavenlyStem: p.heavenlyStem,
    isBodyPalace: p.isBodyPalace,
    ...extractDecorativeStars(p),
    decadal: { range: p.decadal?.range ?? [] },
    majorStars: (p.majorStars || []).map((s: any) => ({ name: s.name, brightness: s.brightness })),
    minorStars: [
      ...(p.minorStars || []).map((s: any) => ({ name: s.name })),
      ...extraMinorStars,
    ],
    adjectiveStars: (p.adjectiveStars || []).map((s: any) => ({ name: s.name, type: s.type })),
  };
}

/** Metadata trường phái gửi kèm payload AI */
export const CHART_SCHOOL_META = {
  primarySchool: "nam-tran-doan-vn",
  primaryLabel: "Nam phái – Hi Di Trần Đoàn (Toàn Thư + Thực Hành)",
  internalSchool: "bac-ha-lac-vn",
  internalLabel: "Bắc phái – Hà Lạc phái Huyền Bí Tập (Phương Ngoại Nhân)",
  engine: "iztro",
} as const;