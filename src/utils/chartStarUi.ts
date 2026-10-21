/**
 * UI-only helpers: phân loại / badge sao trên lá.
 * Không an sao, không đổi công thức — chỉ đọc tên/brightness/mutagen từ iztro.
 */
import { classifyTuanTrietStar, type TuanTrietKind } from "./tuanTriet";

export type StarUiLayer = "major" | "minor" | "adjective" | "luu";

export interface StarUiItem {
  name: string;
  layer: StarUiLayer;
  brightness?: string;
  mutagen?: string;
  /** Tuần / Triệt / Không Vong nếu khớp tên */
  voidKind?: TuanTrietKind;
  /** Sát tinh trọng (UI tô đậm) */
  isSat: boolean;
}

const SAT_NAME_RE =
  /Kình Dương|Đà La|Hỏa Tinh|Linh Tinh|Địa Không|Địa Kiếp|Hóa Kỵ|Đại Hao|Tiểu Hao|Kiếp Sát|Thiên Hình/;

export function isSatStarName(name: string): boolean {
  return SAT_NAME_RE.test(String(name || ""));
}

export function resolveHoaBadgeKey(
  star: { name?: string; mutagen?: string | null },
  natalHoaByStar: Record<string, string>,
): string {
  const rawMut = star.mutagen != null ? String(star.mutagen).trim() : "";
  const fromStar = rawMut
    ? rawMut.startsWith("Hóa")
      ? rawMut
      : `Hóa ${rawMut}`
    : "";
  if (fromStar && /Hóa (Lộc|Quyền|Khoa|Kỵ)/.test(fromStar)) return fromStar;
  const byNatal = natalHoaByStar[String(star.name || "").trim().toLowerCase()];
  return byNatal || "";
}

/** Gộp full sao một cung — thứ tự: chính → phụ → sát/tạp (UI panel). */
export function collectPalaceStarsForUi(palace: any): StarUiItem[] {
  if (!palace) return [];
  const out: StarUiItem[] = [];

  const push = (s: any, layer: StarUiLayer) => {
    const name = String(s?.name || s || "").trim();
    if (!name) return;
    const voidKind = classifyTuanTrietStar(name) ?? undefined;
    out.push({
      name,
      layer,
      brightness: s?.brightness != null ? String(s.brightness).trim() : undefined,
      mutagen: s?.mutagen != null ? String(s.mutagen).trim() : undefined,
      voidKind,
      isSat: isSatStarName(name),
    });
  };

  for (const s of palace.majorStars || []) push(s, "major");
  for (const s of palace.minorStars || []) push(s, "minor");
  for (const s of palace.adjectiveStars || []) push(s, "adjective");
  return out;
}

/** Cung có nhãn Tuần/Triệt/Không Vong (từ sao engine trên cung). */
export function palaceVoidKinds(palace: any): TuanTrietKind[] {
  const kinds = new Set<TuanTrietKind>();
  for (const s of collectPalaceStarsForUi(palace)) {
    if (s.voidKind) kinds.add(s.voidKind);
  }
  return [...kinds];
}

export const VOID_BADGE: Record<
  TuanTrietKind,
  { short: string; className: string; title: string }
> = {
  tuan: {
    short: "Tuần",
    className: "bg-slate-600 text-white",
    title: "Tuần — giảm lực / 'trống' khí cung (không xóa sạch cách)",
  },
  triet: {
    short: "Triệt",
    className: "bg-zinc-800 text-amber-100 dark:bg-zinc-200 dark:text-zinc-900",
    title: "Triệt — chặn/cắt lộ (đứt đoạn)",
  },
  khongVong: {
    short: "KV",
    className: "bg-stone-500 text-white",
    title: "Không Vong — hư không, khó giữ",
  },
};

export const LAYER_LABEL: Record<StarUiLayer, string> = {
  major: "Chính tinh",
  minor: "Phụ / cát tinh",
  adjective: "Sát · tạp · khác",
  luu: "Sao lưu / vận (năm xem)",
};
