/**
 * Nhận diện cách cục chính tinh — một nguồn sự thật dùng chung interpret + chat.
 * Gắn nhãn kết cấu + đánh giá miếu/hãm (cách thành / trung / phá / hãm).
 */

import {
  ChartIndex,
  toBranchIndex,
  BRANCHES_VI,
  normalizeStarName,
} from "./chartRelations";

export type CachCucScope = "tamPhuong" | "dongCung";
export type CachCucQuality = "thanh" | "trung" | "pha" | "ham";
export type BrightnessTier = "cat" | "trung" | "ham" | "unknown";

export interface CachCucAxisDef {
  keyword: string;
  label: string;
  primary?: boolean;
  /** Ưu tiên khi dedup cùng một cách cục trên nhiều trục (số nhỏ = ưu tiên cao). */
  priority: number;
}

export const CACH_CUC_AXES: CachCucAxisDef[] = [
  { keyword: "Mệnh", label: "Trục Mệnh (bản mệnh)", primary: true, priority: 0 },
  { keyword: "Quan Lộc", label: "Trục Quan Lộc (sự nghiệp)", priority: 1 },
  { keyword: "Tài Bạch", label: "Trục Tài Bạch (tài chính)", priority: 2 },
  { keyword: "Phu Thê", label: "Trục Phu Thê (hôn nhân)", priority: 3 },
  { keyword: "Phúc", label: "Trục Phúc Đức (phúc khí)", priority: 4 },
  { keyword: "Thiên Di", label: "Trục Thiên Di (xuất ngoại)", priority: 5 },
];

const AXIS_PRIORITY: Record<string, number> = Object.fromEntries(
  CACH_CUC_AXES.map((a) => [a.keyword, a.priority]),
);

interface PatternDef {
  id: string;
  name: string;
  hint: string;
  stars: string[];
  scope: CachCucScope;
  excludeIfPresent?: string[];
  skipIfMatched?: string[];
  /** Sao then chốt — nếu Hạn → hạ tối thiểu `ham` (vd Liêm trong Liêm Sát). */
  criticalHamStars?: string[];
  /** Sao bù — nếu Miếu/Vượng/Đắc/Lợi có thể nâng từ `pha` lên `trung`. */
  catBoostStars?: string[];
}

const PATTERNS: PatternDef[] = [
  { id: "sat-pha-tham", name: "Sát Phá Tham", hint: "biến động, khai phá, thăng trầm mạnh", stars: ["Thất Sát", "Phá Quân", "Tham Lang"], scope: "tamPhuong", catBoostStars: ["Tham Lang", "Thất Sát"] },
  { id: "co-nguyet-dong-luong", name: "Cơ Nguyệt Đồng Lương", hint: "tham mưu, ổn định, chuyên môn/hành chính", stars: ["Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương"], scope: "tamPhuong", criticalHamStars: ["Thiên Cơ"] },
  { id: "tu-phu", name: "Tử Phủ", hint: "uy quyền, thủ thành, quản trị", stars: ["Tử Vi", "Thiên Phủ"], scope: "tamPhuong", catBoostStars: ["Tử Vi", "Thiên Phủ"] },
  { id: "phu-tuong", name: "Phủ Tướng triều viên", hint: "ổn định, hỗ tá, phúc khí thủ thành", stars: ["Thiên Phủ", "Thiên Tướng"], scope: "tamPhuong", catBoostStars: ["Thiên Tướng", "Thiên Phủ"] },
  { id: "cu-nhat", name: "Cự Nhật", hint: "ngôn luận, danh tiếng, thị phi", stars: ["Cự Môn", "Thái Dương"], scope: "tamPhuong", criticalHamStars: ["Thái Dương"] },
  { id: "tu-tham", name: "Tử Tham", hint: "đào hoa quyền lực, dục vọng và biến hóa", stars: ["Tử Vi", "Tham Lang"], scope: "tamPhuong", catBoostStars: ["Tử Vi"] },
  { id: "liem-tuong", name: "Liêm Tướng", hint: "kỷ luật, pháp độ, chính trực", stars: ["Liêm Trinh", "Thiên Tướng"], scope: "tamPhuong", criticalHamStars: ["Liêm Trinh"], catBoostStars: ["Thiên Tướng"] },
  { id: "liem-sat", name: "Liêm Trinh Thất Sát", hint: "cương nghị, quyết liệt, hung túc càn nguyên", stars: ["Liêm Trinh", "Thất Sát"], scope: "tamPhuong", criticalHamStars: ["Liêm Trinh"], catBoostStars: ["Thất Sát"] },
  { id: "liem-tham", name: "Liêm Tham", hint: "đào hoa, quyền mưu, dục vọng và kỷ luật song song", stars: ["Liêm Trinh", "Tham Lang"], scope: "tamPhuong", criticalHamStars: ["Liêm Trinh"] },
  { id: "vu-tham", name: "Vũ Tham", hint: "tài lộc phát muộn, thực dụng quyết liệt", stars: ["Vũ Khúc", "Tham Lang"], scope: "tamPhuong", catBoostStars: ["Vũ Khúc"] },
  { id: "sat-pha", name: "Sát Phá", hint: "biến phá, khai sáng, thăng trầm (chưa đủ Tham)", stars: ["Thất Sát", "Phá Quân"], scope: "tamPhuong", excludeIfPresent: ["Tham Lang"], catBoostStars: ["Thất Sát"] },
  { id: "pha-tham", name: "Phá Tham", hint: "đổi mới mạnh, dục vọng và phá cách", stars: ["Phá Quân", "Tham Lang"], scope: "tamPhuong", skipIfMatched: ["sat-pha-tham"] },
  { id: "vu-pha", name: "Vũ Phá", hint: "tài lộc qua biến động, quyết đoán tài chính", stars: ["Vũ Khúc", "Phá Quân"], scope: "tamPhuong", catBoostStars: ["Vũ Khúc"] },
  { id: "tu-pha", name: "Tử Phá", hint: "uy quyền gặp phá cách, thăng trầm lớn", stars: ["Tử Vi", "Phá Quân"], scope: "tamPhuong", catBoostStars: ["Tử Vi"] },
  { id: "co-nguyet", name: "Cơ Nguyệt", hint: "mưu lược, kế hoạch, nhạy cảm tình cảm", stars: ["Thiên Cơ", "Thái Âm"], scope: "tamPhuong", skipIfMatched: ["co-nguyet-dong-luong"], criticalHamStars: ["Thiên Cơ"] },
  { id: "nguyet-luong", name: "Nguyệt Lương", hint: "ôn hòa, phúc hậu, hướng dẫn/người lớn", stars: ["Thái Âm", "Thiên Lương"], scope: "tamPhuong", skipIfMatched: ["co-nguyet-dong-luong"], criticalHamStars: ["Thái Âm"] },
  { id: "dong-luong-hoi", name: "Đồng Lương (hội tam phương)", hint: "ôn thuận, phúc hậu, hướng phục vụ/giáo dục", stars: ["Thiên Đồng", "Thiên Lương"], scope: "tamPhuong", skipIfMatched: ["co-nguyet-dong-luong"] },
  { id: "co-dong", name: "Cơ Đồng", hint: "linh hoạt, thiện biến, hợp kế hoạch–dịch vụ", stars: ["Thiên Cơ", "Thiên Đồng"], scope: "tamPhuong", skipIfMatched: ["co-nguyet-dong-luong"] },
  { id: "sat-co", name: "Sát Cơ", hint: "quyết đoán, mưu lược trong áp lực", stars: ["Thất Sát", "Thiên Cơ"], scope: "tamPhuong" },
  { id: "co-luong", name: "Cơ Lương", hint: "mưu sĩ phúc trí, cố vấn dài hơi", stars: ["Thiên Cơ", "Thiên Lương"], scope: "tamPhuong", skipIfMatched: ["co-nguyet-dong-luong"], criticalHamStars: ["Thiên Cơ"], catBoostStars: ["Thiên Lương"] },
  { id: "vu-sat", name: "Vũ Sát", hint: "tài lộc quyết đoán trong áp lực", stars: ["Vũ Khúc", "Thất Sát"], scope: "tamPhuong", catBoostStars: ["Vũ Khúc"], criticalHamStars: ["Thất Sát"] },
  { id: "nhat-luong", name: "Nhật Lương", hint: "danh chính, che chở, hướng dẫn công", stars: ["Thái Dương", "Thiên Lương"], scope: "tamPhuong", criticalHamStars: ["Thái Dương"], catBoostStars: ["Thiên Lương"] },
  { id: "am-duong-hoi", name: "Nhật Nguyệt hội", hint: "cân bằng danh–cảm, nội–ngoại", stars: ["Thái Dương", "Thái Âm"], scope: "tamPhuong", criticalHamStars: ["Thái Dương", "Thái Âm"] },
  { id: "tu-phu-vu-tuong", name: "Tử Phủ Vũ Tướng", hint: "đế tinh hội đủ khố–tài–ấn: uy quyền quản trị, thủ thành có lực", stars: ["Tử Vi", "Thiên Phủ", "Vũ Khúc", "Thiên Tướng"], scope: "tamPhuong", catBoostStars: ["Tử Vi", "Thiên Phủ", "Thiên Tướng"] },
  { id: "vu-tuong", name: "Vũ Tướng", hint: "tài lộc gắn khuôn khổ, quyết đoán có kỷ luật", stars: ["Vũ Khúc", "Thiên Tướng"], scope: "tamPhuong", criticalHamStars: ["Vũ Khúc"], catBoostStars: ["Thiên Tướng"] },
  { id: "co-cu", name: "Cơ Cự", hint: "mưu + miệng: cơ động, nhiều hướng, giữ nhịp kém", stars: ["Thiên Cơ", "Cự Môn"], scope: "tamPhuong", criticalHamStars: ["Thiên Cơ"], catBoostStars: ["Cự Môn"] },

  { id: "dong-cu", name: "Đồng Cự", hint: "ngôn ngữ, thị phi, biện luận", stars: ["Thiên Đồng", "Cự Môn"], scope: "dongCung", criticalHamStars: ["Cự Môn"] },
  { id: "dong-luong-dc", name: "Đồng Lương (đồng cung)", hint: "ôn hòa, phúc hậu, giữ của và nương tựa", stars: ["Thiên Đồng", "Thiên Lương"], scope: "dongCung" },
  { id: "co-nguyet-dc", name: "Cơ Nguyệt (đồng cung)", hint: "mưu lược sâu, kế hoạch tài chính/tình cảm", stars: ["Thiên Cơ", "Thái Âm"], scope: "dongCung", criticalHamStars: ["Thiên Cơ"] },
  { id: "liem-sat-dc", name: "Liêm Sát (đồng cung)", hint: "cương quyết, hung túc, quyết liệt", stars: ["Liêm Trinh", "Thất Sát"], scope: "dongCung", criticalHamStars: ["Liêm Trinh"], catBoostStars: ["Thất Sát"] },
  { id: "liem-tuong-dc", name: "Liêm Tướng (đồng cung)", hint: "kỷ luật, chính trực, có tướng che chế", stars: ["Liêm Trinh", "Thiên Tướng"], scope: "dongCung", criticalHamStars: ["Liêm Trinh"], catBoostStars: ["Thiên Tướng"] },
  { id: "cu-nhat-dc", name: "Cự Nhật (đồng cung)", hint: "ngôn luận, danh tiếng, dễ thị phi", stars: ["Cự Môn", "Thái Dương"], scope: "dongCung", criticalHamStars: ["Thái Dương"] },
  { id: "tu-phu-dc", name: "Tử Phủ (đồng cung)", hint: "đế tọa, quản trị, giữ thành", stars: ["Tử Vi", "Thiên Phủ"], scope: "dongCung", catBoostStars: ["Tử Vi", "Thiên Phủ"] },
  { id: "sat-pha-tham-dc", name: "Sát Phá Tham (đồng cung)", hint: "biến động cực mạnh tại một cung", stars: ["Thất Sát", "Phá Quân", "Tham Lang"], scope: "dongCung" },
  { id: "vu-tuong-dc", name: "Vũ Tướng (đồng cung)", hint: "quyết đoán tài chính có ấn khuôn khổ tập trung", stars: ["Vũ Khúc", "Thiên Tướng"], scope: "dongCung", criticalHamStars: ["Vũ Khúc"], catBoostStars: ["Thiên Tướng"] },
  { id: "co-cu-dc", name: "Cơ Cự (đồng cung)", hint: "cơ động–miệng tập trung một cung: đổi hướng nhanh", stars: ["Thiên Cơ", "Cự Môn"], scope: "dongCung", criticalHamStars: ["Thiên Cơ"], catBoostStars: ["Cự Môn"] },
];

export interface StarBrightnessInfo {
  name: string;
  brightness: string;
  tier: BrightnessTier;
  branchIdx: number;
  palaceName: string;
}

export interface TamPhuongScope {
  anchorBranch: number;
  anchorPalace: any;
  branches: number[];
  majorSet: Set<string>;
  majorsByBranch: Map<number, string[]>;
  starDetailByBranch: Map<number, StarBrightnessInfo[]>;
}

export interface CachCucMatch {
  patternId: string;
  name: string;
  hint: string;
  scope: CachCucScope;
  quality: CachCucQuality;
  qualityLabel: string;
  brightnessNote: string;
  axisKeyword: string;
  axisLabel: string;
  anchorPalaceName: string;
  anchorBranch: string;
  starLocations: string[];
  starBrightness: StarBrightnessInfo[];
  dongCungPalace?: string;
  dedupKey: string;
}

export interface AxisCachCucReport {
  axis: CachCucAxisDef;
  palaceName: string;
  branch: string;
  voChinhDien: boolean;
  tamPhuong: CachCucMatch[];
  dongCung: CachCucMatch[];
}

export interface CachCucAnalysis {
  rawByAxis: AxisCachCucReport[];
  uniqueTamPhuong: CachCucMatch[];
  uniqueDongCung: CachCucMatch[];
  globalDongCungExtra: CachCucMatch[];
  primarySummary: string[];
}

const QUALITY_LABEL: Record<CachCucQuality, string> = {
  thanh: "cách thành",
  trung: "cách trung bình",
  pha: "cách phá / lực giảm",
  ham: "cách hãm / khó phát",
};

/**
 * iztro vi-VN brightness (locale brightness.js, key xian → "Hạn" cho 陷):
 * Miếu, Vượng, Đắc, Lợi = cát; Bình = trung; Bất/Hạn = hãm (học lý: 不/陷).
 * Chấp nhận cả nhãn "Hãm" (một số bản dịch) — khác "Hạn" (hạn chế) về chữ.
 */
export function getBrightnessTier(brightness: string): BrightnessTier {
  const v = String(brightness || "").trim().toLowerCase();
  if (!v) return "unknown";
  if (
    v.includes("hãm") || v.includes("hạn") ||
    v.includes("bất") || v.includes("bat") || v.includes("不") ||
    v === "ham" || v.includes("陷")
  ) return "ham";
  if (
    v.includes("miếu") || v.includes("mieu") || v.includes("庙") ||
    v.includes("vượng") || v.includes("vuong") || v.includes("旺") ||
    v.includes("đắc") || v.includes("dac") || v.includes("得") ||
    v.includes("lợi") || v.includes("loi") || v.includes("利")
  ) return "cat";
  if (v.includes("bình") || v.includes("binh") || v.includes("平")) return "trung";
  return "unknown";
}

export function findPalaceByKeyword(idx: ChartIndex, keyword: string): any | undefined {
  const kw = keyword.trim().toLowerCase();
  return idx.palacesArr.find((p: any) => String(p.name || "").toLowerCase().includes(kw));
}

export function getTamPhuongBranches(anchorBranch: number): number[] {
  const b = ((anchorBranch % 12) + 12) % 12;
  return [b, (b + 4) % 12, (b + 8) % 12, (b + 6) % 12];
}

function extractStarDetails(pa: any, branchIdx: number): StarBrightnessInfo[] {
  return (pa?.majorStars || []).map((s: any) => ({
    name: String(s.name || "").trim(),
    brightness: String(s.brightness || "").trim(),
    tier: getBrightnessTier(s.brightness),
    branchIdx,
    palaceName: pa?.name || BRANCHES_VI[branchIdx],
  })).filter((s) => s.name);
}

export function getTamPhuongScope(idx: ChartIndex, anchorBranch: number): TamPhuongScope | null {
  const anchorPalace = idx.palaceByBranch[anchorBranch];
  if (!anchorPalace) return null;
  const branches = getTamPhuongBranches(anchorBranch);
  const majorSet = new Set<string>();
  const majorsByBranch = new Map<number, string[]>();
  const starDetailByBranch = new Map<number, StarBrightnessInfo[]>();

  branches.forEach((bi) => {
    const pa = idx.palaceByBranch[bi];
    const details = extractStarDetails(pa, bi);
    starDetailByBranch.set(bi, details);
    const names = details.map((d) => d.name);
    majorsByBranch.set(bi, names);
    names.forEach((n) => majorSet.add(normalizeStarName(n)));
  });

  return { anchorBranch, anchorPalace, branches, majorSet, majorsByBranch, starDetailByBranch };
}

function findStarDetail(
  star: string,
  scope: TamPhuongScope,
): StarBrightnessInfo | null {
  const target = normalizeStarName(star);
  for (const bi of scope.branches) {
    const hit = (scope.starDetailByBranch.get(bi) || []).find(
      (d) => normalizeStarName(d.name) === target,
    );
    if (hit) return hit;
  }
  return null;
}

function formatStarLocation(detail: StarBrightnessInfo): string {
  const br = detail.brightness ? ` ${detail.brightness}` : "";
  return `${detail.name}${br} @ ${detail.palaceName} (${BRANCHES_VI[detail.branchIdx]})`;
}

export function evaluatePatternQuality(
  def: PatternDef,
  starBrightness: StarBrightnessInfo[],
): { quality: CachCucQuality; note: string } {
  const tiers = starBrightness.map((s) => s.tier);
  const hamCount = tiers.filter((t) => t === "ham").length;
  const catCount = tiers.filter((t) => t === "cat").length;

  const criticalHam = (def.criticalHamStars || []).some((star) => {
    const d = starBrightness.find((s) => normalizeStarName(s.name) === normalizeStarName(star));
    return d?.tier === "ham";
  });

  const hasBoost = (def.catBoostStars || []).some((star) => {
    const d = starBrightness.find((s) => normalizeStarName(s.name) === normalizeStarName(star));
    return d?.tier === "cat";
  });

  if (criticalHam && !hasBoost) {
    return { quality: "ham", note: "sao then chốt đang Hạn, cách khó phát huy" };
  }
  if (criticalHam && hasBoost) {
    return { quality: "trung", note: "sao then chốt Hạn nhưng có sao Miếu/Vượng bù (chế hóa một phần)" };
  }
  if (hamCount >= 2) {
    return { quality: "pha", note: `${hamCount} sao Hạn — lực cách giảm rõ` };
  }
  if (hamCount === 1 && catCount === 0) {
    return { quality: "pha", note: "có sao Hạn, thiếu Miếu/Vượng bù" };
  }
  if (hamCount === 1) {
    return { quality: "trung", note: "có sao Hạn nhưng còn sao cát miếu/vượng" };
  }
  if (catCount === starBrightness.length && starBrightness.length > 0) {
    return { quality: "thanh", note: "các sao cấu thành đều đắc địa" };
  }
  if (catCount >= Math.ceil(starBrightness.length * 0.6)) {
    return { quality: "thanh", note: "đa số sao Miếu/Vượng/Đắc/Lợi" };
  }
  if (catCount >= 1) {
    return { quality: "trung", note: "có cát có bình, lực trung bình khá" };
  }
  return { quality: "trung", note: "độ lực trung bình (thiếu Miếu/Vượng nổi bật)" };
}

function makeDedupKey(def: PatternDef, starBrightness: StarBrightnessInfo[], scope: CachCucScope, dongCungPalace?: string): string {
  const locs = starBrightness
    .map((s) => `${normalizeStarName(s.name)}@${s.branchIdx}`)
    .sort()
    .join("|");
  return `${def.id}|${scope}|${dongCungPalace || locs}`;
}

function patternMatches(
  def: PatternDef,
  scope: TamPhuongScope,
  idx: ChartIndex,
  matchedIds: Set<string>,
): CachCucMatch | null {
  if (def.skipIfMatched?.some((id) => matchedIds.has(id))) return null;

  if (def.scope === "tamPhuong") {
    const has = (star: string) => scope.majorSet.has(normalizeStarName(star));
    if (!def.stars.every(has)) return null;
    if (def.excludeIfPresent?.some(has)) return null;

    const starBrightness = def.stars
      .map((star) => findStarDetail(star, scope))
      .filter((d): d is StarBrightnessInfo => d !== null);
    const { quality, note } = evaluatePatternQuality(def, starBrightness);

    return {
      patternId: def.id,
      name: def.name,
      hint: def.hint,
      scope: "tamPhuong",
      quality,
      qualityLabel: QUALITY_LABEL[quality],
      brightnessNote: note,
      axisKeyword: "",
      axisLabel: "",
      anchorPalaceName: scope.anchorPalace.name,
      anchorBranch: BRANCHES_VI[scope.anchorBranch],
      starLocations: starBrightness.map(formatStarLocation),
      starBrightness,
      dedupKey: makeDedupKey(def, starBrightness, "tamPhuong"),
    };
  }

  for (const bi of scope.branches) {
    const details = scope.starDetailByBranch.get(bi) || [];
    const norm = details.map((d) => normalizeStarName(d.name));
    if (!def.stars.every((s) => norm.includes(normalizeStarName(s)))) continue;

    const starBrightness = def.stars
      .map((star) => details.find((d) => normalizeStarName(d.name) === normalizeStarName(star)))
      .filter((d): d is StarBrightnessInfo => d !== undefined);
    const { quality, note } = evaluatePatternQuality(def, starBrightness);
    const pa = idx.palaceByBranch[bi];

    return {
      patternId: def.id,
      name: def.name,
      hint: def.hint,
      scope: "dongCung",
      quality,
      qualityLabel: QUALITY_LABEL[quality],
      brightnessNote: note,
      axisKeyword: "",
      axisLabel: "",
      anchorPalaceName: scope.anchorPalace.name,
      anchorBranch: BRANCHES_VI[scope.anchorBranch],
      starLocations: starBrightness.map(formatStarLocation),
      starBrightness,
      dongCungPalace: `${pa?.name || ""} (${BRANCHES_VI[bi]})`,
      dedupKey: makeDedupKey(def, starBrightness, "dongCung", `${pa?.name}|${bi}`),
    };
  }
  return null;
}

export function detectCachCucForAxis(idx: ChartIndex, axis: CachCucAxisDef): CachCucMatch[] {
  const palace = findPalaceByKeyword(idx, axis.keyword);
  if (!palace) return [];
  const scope = getTamPhuongScope(idx, toBranchIndex(palace.index));
  if (!scope) return [];

  const matchedIds = new Set<string>();
  const results: CachCucMatch[] = [];

  for (const def of PATTERNS) {
    const hit = patternMatches(def, scope, idx, matchedIds);
    if (!hit) continue;
    matchedIds.add(def.id);
    results.push({ ...hit, axisKeyword: axis.keyword, axisLabel: axis.label });
  }
  return results;
}

export function detectGlobalDongCung(idx: ChartIndex): CachCucMatch[] {
  const dongCungDefs = PATTERNS.filter((p) => p.scope === "dongCung");
  const seen = new Set<string>();
  const out: CachCucMatch[] = [];

  idx.palacesArr.forEach((pa: any) => {
    const bi = toBranchIndex(pa.index);
    const details = extractStarDetails(pa, bi);
    const norm = details.map((d) => normalizeStarName(d.name));

    dongCungDefs.forEach((def) => {
      if (!def.stars.every((s) => norm.includes(normalizeStarName(s)))) return;
      const starBrightness = def.stars
        .map((star) => details.find((d) => normalizeStarName(d.name) === normalizeStarName(star)))
        .filter((d): d is StarBrightnessInfo => d !== undefined);
      const key = makeDedupKey(def, starBrightness, "dongCung", `${pa.name}|${bi}`);
      if (seen.has(key)) return;
      seen.add(key);

      const { quality, note } = evaluatePatternQuality(def, starBrightness);
      out.push({
        patternId: def.id,
        name: def.name,
        hint: def.hint,
        scope: "dongCung",
        quality,
        qualityLabel: QUALITY_LABEL[quality],
        brightnessNote: note,
        axisKeyword: "toan-la-so",
        axisLabel: "Toàn lá số",
        anchorPalaceName: pa.name,
        anchorBranch: BRANCHES_VI[bi],
        starLocations: starBrightness.map(formatStarLocation),
        starBrightness,
        dongCungPalace: `${pa.name} (${BRANCHES_VI[bi]})`,
        dedupKey: key,
      });
    });
  });

  return out;
}

function pickBestMatch(matches: CachCucMatch[]): CachCucMatch {
  return matches.reduce((best, cur) => {
    const bp = AXIS_PRIORITY[best.axisKeyword] ?? 99;
    const cp = AXIS_PRIORITY[cur.axisKeyword] ?? 99;
    if (cp < bp) return cur;
    if (cp > bp) return best;
    const qualityRank: Record<CachCucQuality, number> = { thanh: 0, trung: 1, pha: 2, ham: 3 };
    return qualityRank[cur.quality] < qualityRank[best.quality] ? cur : best;
  });
}

function dedupeMatches(matches: CachCucMatch[]): CachCucMatch[] {
  const groups = new Map<string, CachCucMatch[]>();
  matches.forEach((m) => {
    const arr = groups.get(m.dedupKey) || [];
    arr.push(m);
    groups.set(m.dedupKey, arr);
  });
  return [...groups.values()].map(pickBestMatch);
}

function isVoChinhDien(scope: TamPhuongScope): boolean {
  return (scope.majorsByBranch.get(scope.anchorBranch) || []).length === 0;
}

/**
 * Phân tích một lần — dùng cho report và API sau này.
 */
export function analyzeCachCuc(idx: ChartIndex): CachCucAnalysis {
  const rawByAxis: AxisCachCucReport[] = [];

  CACH_CUC_AXES.forEach((axis) => {
    const palace = findPalaceByKeyword(idx, axis.keyword);
    if (!palace) return;
    const branch = toBranchIndex(palace.index);
    const tpScope = getTamPhuongScope(idx, branch);
    if (!tpScope) return;

    const matches = detectCachCucForAxis(idx, axis);
    rawByAxis.push({
      axis,
      palaceName: palace.name,
      branch: BRANCHES_VI[branch],
      voChinhDien: isVoChinhDien(tpScope),
      tamPhuong: matches.filter((m) => m.scope === "tamPhuong"),
      dongCung: matches.filter((m) => m.scope === "dongCung"),
    });
  });

  const allTam = rawByAxis.flatMap((r) => r.tamPhuong);
  const allDong = rawByAxis.flatMap((r) => r.dongCung);
  const uniqueTamPhuong = dedupeMatches(allTam);
  const uniqueDongCung = dedupeMatches(allDong);

  const reportedDongKeys = new Set(uniqueDongCung.map((m) => m.dedupKey));
  const globalDongCungExtra = detectGlobalDongCung(idx).filter(
    (g) => !reportedDongKeys.has(g.dedupKey),
  );

  let primarySummary = uniqueTamPhuong
    .filter((m) => m.axisKeyword === "Mệnh")
    .map((m) => `${m.name} [${m.qualityLabel}]`);
  if (primarySummary.length === 0) {
    primarySummary = uniqueTamPhuong.slice(0, 5).map((m) => `${m.name} [${m.qualityLabel}]`);
  }
  primarySummary = [...new Set(primarySummary)];

  return {
    rawByAxis,
    uniqueTamPhuong,
    uniqueDongCung,
    globalDongCungExtra,
    primarySummary: [...new Set(primarySummary)],
  };
}

function formatMatchLine(m: CachCucMatch): string {
  const q = `[${m.qualityLabel}]`;
  const br = m.brightnessNote ? ` — ${m.brightnessNote}` : "";
  if (m.scope === "dongCung" && m.dongCungPalace) {
    return `    • ${m.name} ${q} tại ${m.dongCungPalace} (${m.hint})${br}`;
  }
  return `    • ${m.name} ${q} (${m.hint}) — ${m.starLocations.join("; ")}${br}`;
}

/**
 * Báo cáo gọn: dedup giữa các trục.
 * Truyền `analysis` sẵn nếu đã analyze (tránh chạy detect 2 lần).
 */
export function buildCachCucReport(idx: ChartIndex, analysis?: CachCucAnalysis): string {
  const a = analysis ?? analyzeCachCuc(idx);
  const lines: string[] = [];

  // Dedup: gom cách tam phương theo trục được chọn (mỗi dedupKey một trục)
  const tamByAxis = new Map<string, CachCucMatch[]>();
  a.uniqueTamPhuong.forEach((m) => {
    const arr = tamByAxis.get(m.axisKeyword) || [];
    arr.push(m);
    tamByAxis.set(m.axisKeyword, arr);
  });

  const dongByAxis = new Map<string, CachCucMatch[]>();
  a.uniqueDongCung.forEach((m) => {
    const arr = dongByAxis.get(m.axisKeyword) || [];
    arr.push(m);
    dongByAxis.set(m.axisKeyword, arr);
  });

  CACH_CUC_AXES.forEach((axis) => {
    const report = a.rawByAxis.find((r) => r.axis.keyword === axis.keyword);
    if (!report) {
      lines.push(`[${axis.label}] — Không tìm thấy cung.`);
      lines.push("");
      return;
    }

    const tam = tamByAxis.get(axis.keyword) || [];
    const dong = dongByAxis.get(axis.keyword) || [];

    lines.push(`[${axis.label}] — ${report.palaceName} (${report.branch}):`);

    if (report.voChinhDien) {
      lines.push("  - Vô Chính Diệu tại bản cung: mượn sao xung chiếu + tam hợp; chỉ gán cách cục khi hệ thống đã liệt kê đủ sao.");
    }

    if (tam.length === 0 && dong.length === 0 && !report.voChinhDien) {
      lines.push("  - Chưa khớp cách cục điển hình (tam phương); luận theo tổ hợp chính tinh thực tế.");
    } else {
      if (tam.length > 0) {
        lines.push("  - Tam phương tứ chính (đã dedup — không lặp trục khác):");
        tam.forEach((m) => lines.push(formatMatchLine(m)));
      }
      if (dong.length > 0) {
        lines.push("  - Đồng cung (trong tam phương trục này):");
        dong.forEach((m) => lines.push(formatMatchLine(m)));
      }
    }
    lines.push("");
  });

  if (a.globalDongCungExtra.length > 0) {
    lines.push("[Đồng cung nổi bật — ngoài các trục trên]:");
    a.globalDongCungExtra.forEach((m) => lines.push(formatMatchLine(m).replace("    •", "  -")));
    lines.push("");
  }

  if (a.primarySummary.length > 0) {
    lines.push(`[TÓM TẮT TRỤC CHỦ — MỆNH (dedup)]: ${a.primarySummary.join(" | ")}`);
  }

  return lines.join("\n").trim() || "  - Không xác định được cách cục.";
}

/** Giữ tương thích export cũ. */
export function detectAllCachCuc(idx: ChartIndex): CachCucMatch[] {
  const a = analyzeCachCuc(idx);
  return [...a.uniqueTamPhuong, ...a.uniqueDongCung, ...a.globalDongCungExtra];
}