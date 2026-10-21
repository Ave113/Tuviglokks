// Nguồn nguyên văn 《王亭之談星》 — đọc lazy qua fs, KHÔNG import vào bundle.
// Runtime AI vẫn dùng dữ liệu cô đọng trong damTinh.ts (getDamTinhForStars).
// Module này phục vụ tra cứu/bổ sung tri thức theo từng mục khi cần.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DAM_TINH, DAM_TINH_AUX } from "./damTinh";

function resolveModuleDir(): string {
  try {
    const u = typeof import.meta !== "undefined" ? (import.meta as { url?: string }).url : "";
    if (u && String(u).startsWith("file:")) {
      return path.dirname(fileURLToPath(u));
    }
  } catch {
    /* ignore */
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof __dirname !== "undefined" && __dirname) return __dirname;
  } catch {
    /* ignore */
  }
  return process.cwd();
}

const MODULE_DIR = resolveModuleDir();

function resolveDamTinhSourcePath(): string {
  const name = "vuongdinhchidamtinh.txt";
  const candidates = [
    path.join(process.cwd(), "src", "knowledge", "data", name),
    path.join(process.cwd(), "dist", "knowledge-data", name),
    path.join(MODULE_DIR, "data", name),
    path.join(MODULE_DIR, "knowledge-data", name),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      /* continue */
    }
  }
  return path.join(process.cwd(), "src", "knowledge", "data", name);
}

/** Đường dẫn tuyệt đối tới file nguồn trên đĩa (server-only). */
export const DAM_TINH_SOURCE_PATH = resolveDamTinhSourcePath();

/** Đường dẫn tương đối từ root repo — dùng ghi chú/tài liệu. */
export const DAM_TINH_SOURCE_RELATIVE = "src/knowledge/data/vuongdinhchidamtinh.txt";

/** Chuẩn hóa Hán (phồn thể) sang giản thể khớp tiêu đề trong file nguồn. */
const HAN_TO_SOURCE_HEADER: Record<string, string> = {
  天機: "天机",
  太陽: "太阳",
  廉貞: "廉贞",
  太陰: "太阴",
  貪狼: "贪狼",
  巨門: "巨门",
  七殺: "七杀",
  破軍: "破军",
  // Nhóm vòng trạng thái + tuế tiền/tướng tiền (bổ sung)
  太歲: "太岁",
  歲建: "岁建",
  龍德: "龙德",
  晦氣: "晦气",
  貫索: "贯索",
  青龍: "青龙",
  將軍: "将军",
  奏書: "奏书",
  飛廉: "飞廉",
  歲驛: "岁驿",
  // Batch 2 — vòng Trường Sinh 12 + Tuế Phá/Phúc Đức (nguồn biên: Tân Biên 1956,
  // han trỏ mục tương ứng của Vương Đình Chi để tra chéo nguồn)
  長生: "长生",
  臨官: "临官",
  冠帶: "冠带",
  絕: "绝",
  養: "养",
  歲破: "岁破",
};

/** 14 chính tinh — thứ tự xuất hiện trong phần «谈星». */
export const DAM_TINH_MAIN_STAR_HEADERS = [
  "紫微", "天机", "太阳", "武曲", "天同", "廉贞", "天府", "太阴",
  "贪狼", "巨门", "天相", "天梁", "七杀", "破军",
] as const;

export type DamTinhMainStarHeader = (typeof DAM_TINH_MAIN_STAR_HEADERS)[number];

export interface DamTinhSourceSection {
  header: string;
  line: number;
  content: string;
}

let cachedRaw: string | null = null;
let cachedIndex: Map<string, DamTinhSourceSection> | null = null;

function toSourceHeader(han: string): string {
  const trimmed = han.trim();
  return HAN_TO_SOURCE_HEADER[trimmed] ?? trimmed;
}

/** Xóa cache — chỉ dùng trong test. */
export function clearDamTinhSourceCache(): void {
  cachedRaw = null;
  cachedIndex = null;
}

/** Đọc toàn bộ file (lazy, cache một lần). Chỉ gọi trên server. */
export function readDamTinhSourceRaw(): string {
  if (cachedRaw !== null) return cachedRaw;
  cachedRaw = fs.readFileSync(DAM_TINH_SOURCE_PATH, "utf8");
  return cachedRaw;
}

function buildSectionIndex(raw: string): Map<string, DamTinhSourceSection> {
  const lines = raw.split(/\r?\n/);
  const headerSet = new Set<string>([
    ...DAM_TINH_MAIN_STAR_HEADERS,
    ...Object.values(DAM_TINH_AUX).map((e) => toSourceHeader(e.han)),
  ]);

  const headerLines: { header: string; line: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (headerSet.has(trimmed)) {
      headerLines.push({ header: trimmed, line: i });
    }
  }

  headerLines.sort((a, b) => a.line - b.line);

  const index = new Map<string, DamTinhSourceSection>();
  for (let i = 0; i < headerLines.length; i++) {
    const { header, line } = headerLines[i];
    const end = i + 1 < headerLines.length ? headerLines[i + 1].line : lines.length;
    const body = lines
      .slice(line + 1, end)
      .join("\n")
      .trim();
    index.set(header, { header, line: line + 1, content: body });
  }
  return index;
}

/** Chỉ mục các mục sao đã nhận diện (lazy). */
export function getDamTinhSourceIndex(): Map<string, DamTinhSourceSection> {
  if (cachedIndex !== null) return cachedIndex;
  cachedIndex = buildSectionIndex(readDamTinhSourceRaw());
  return cachedIndex;
}

/** Lấy nguyên văn một mục theo tiêu đề Hán (phồn hoặc giản). */
export function getDamTinhSourceSectionByHan(han: string): DamTinhSourceSection | null {
  const header = toSourceHeader(han);
  return getDamTinhSourceIndex().get(header) ?? null;
}

/** Lấy nguyên văn theo tên sao tiếng Việt (chính tinh hoặc phụ/tá). */
export function getDamTinhSourceSectionByStar(starVi: string): DamTinhSourceSection | null {
  const name = starVi.trim();
  const entry = DAM_TINH[name] ?? DAM_TINH_AUX[name];
  if (!entry) return null;
  return getDamTinhSourceSectionByHan(entry.han);
}

/** Liệt kê các mục chính tinh có trong nguồn. */
export function listDamTinhMainSourceSections(): DamTinhSourceSection[] {
  const index = getDamTinhSourceIndex();
  return DAM_TINH_MAIN_STAR_HEADERS
    .map((h) => index.get(h))
    .filter((s): s is DamTinhSourceSection => s != null);
}