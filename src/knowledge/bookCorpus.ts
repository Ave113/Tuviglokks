// ============================================================================
// CORPUS SÁCH GỐC — CHỈ TRA CỨU CÓ LỌC (KHÔNG DUMP FULL VÀO PROMPT).
//
// File .txt trong data/ là KHO NGOÀI. Runtime:
//   1) Lazy đọc + index theo mục (sao / đoạn)
//   2) Chỉ lấy mục khớp SAO/CUNG/TỪ KHÓA trên lá
//   3) Cắt ngắn + trần số mẩu / tổng ký tự
//   4) CẤM: đọc cả file, inject nguyên chương, gửi Toàn Thư vào Gemini
//
// Dùng cho interpret/chat như lớp tham chiếu phụ — đứng SAU cheat sheet máy +
// Đàm Tinh cô đọng + Kinh Nghiệm mẩu.
// ============================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Thư mục module — esbuild CJS: import.meta.url rỗng → fallback __dirname / cwd.
 * Tránh crash Vercel khi fileURLToPath("") throw.
 */
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
    // CJS bundle (dist/server.cjs)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = typeof __dirname !== "undefined" ? __dirname : "";
    if (d) return d;
  } catch {
    /* ignore */
  }
  return process.cwd();
}

const MODULE_DIR = resolveModuleDir();

/** Tìm thư mục data sách — local src, bundle dist, Vercel /var/task. */
function resolveKnowledgeDataDir(): string {
  const candidates = [
    path.join(process.cwd(), "src", "knowledge", "data"),
    path.join(process.cwd(), "dist", "knowledge-data"),
    path.join(process.cwd(), "knowledge", "data"),
    path.join(MODULE_DIR, "data"),
    path.join(MODULE_DIR, "knowledge-data"),
    path.join(MODULE_DIR, "knowledge", "data"),
  ];
  for (const dir of candidates) {
    try {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) return dir;
    } catch {
      /* continue */
    }
  }
  return path.join(process.cwd(), "src", "knowledge", "data");
}

const DATA_DIR = resolveKnowledgeDataDir();

/** Chuẩn hóa tiếng Việt để so khớp (NFC + lower + gộp khoảng trắng). */
export function normalizeVi(s: string): string {
  return String(s || "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Bỏ dấu để khớp OCR lệch / không dấu. */
export function stripDiacritics(s: string): string {
  return normalizeVi(s)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d");
}

export interface BookManifestEntry {
  id: string;
  /** Tên file trong src/knowledge/data/ */
  file: string;
  label: string;
  /** star-sections = mục theo tên sao; window = cửa sổ trượt chấm điểm */
  mode: "star-sections" | "window";
  /** Chỉ dùng khi interpret cần lớp này */
  enabled: boolean;
  /** Ưu tiên khi hòa điểm (số lớn hơn = ưu) */
  priority: number;
  /**
   * (tuỳ chọn) Bắt đầu index cửa sổ SAU dòng đầu chứa chuỗi này (so khớp bỏ-dấu).
   * Dùng bỏ phần công thức an sao / mục lục — chỉ chứa tên sao, dễ lọt vào tủ như rác.
   */
  skipBefore?: string;
}

/**
 * Whitelist — chỉ các file trong list mới được đọc.
 * Thêm sách = thêm 1 dòng + (tuỳ) file vào data/. Không tự quét cả thư mục PDF.
 */
export const BOOK_CORPUS_MANIFEST: BookManifestEntry[] = [
  {
    id: "luan-chinh-phu",
    file: "luangiaichinhtinhphutinh.txt",
    label: "Luận giải chính/phụ tinh (trích lọc)",
    mode: "star-sections",
    enabled: true,
    priority: 10,
  },
  // ===== Bộ "sao nhập Mệnh chi tiết" — nguồn = tên file (user cung cấp) =====
  {
    id: "nm-tu-vi",
    file: "saotuvi.txt",
    label: "Tử Vi nhập Mệnh — saotuvi.txt (trích lọc window)",
    mode: "window",
    enabled: true,
    priority: 6,
  },
  {
    id: "nm-thien-tuong",
    file: "saothientuong.txt",
    label: "Thiên Tướng nhập Mệnh — saothientuong.txt (trích lọc window)",
    mode: "window",
    enabled: true,
    priority: 6,
  },
  {
    id: "nm-pha-quan",
    file: "saophaquan.txt",
    label: "Phá Quân nhập Mệnh — saophaquan.txt (trích lọc window)",
    mode: "window",
    enabled: true,
    priority: 6,
  },
  {
    id: "nm-van-xuong",
    file: "saovanxuong.txt",
    label: "Văn Xương nhập Mệnh — saovanxuong.txt (trích lọc window)",
    mode: "window",
    enabled: true,
    priority: 6,
  },
  {
    id: "nm-van-khuc",
    file: "saovankhuc.txt",
    label: "Văn Khúc nhập Mệnh — saovankhuc.txt (trích lọc window)",
    mode: "window",
    enabled: true,
    priority: 6,
  },
  {
    id: "tuvi-fixed",
    file: "tuvi_fixed.txt",
    // Window phụ — priority thấp hơn star-sections; filter an-sao lặp vẫn chạy trong indexWindows.
    label: "Tử Vi thực hành/tổng hợp (trích lọc window)",
    mode: "window",
    enabled: true,
    priority: 2,
  },
  {
    id: "tan-bien-1956",
    file: "tan-bien-1956.txt",
    // Vân Đằng Thái Thứ Lang 1956 — đặc tính đủ tạp tinh + vòng Trường Sinh (mục 3.x).
    // Heading "3.75. Mộc Dục (…)" khởi đầu bằng số nên không hợp star-sections — dùng window.
    // skipBefore = bỏ toàn bộ Phần 1 (bảng an sao — chỉ chứa tên sao, truy hồi ra rác).
    label: "Tử Vi Đẩu Số Tân Biên — Vân Đằng Thái Thứ Lang (1956, window)",
    mode: "window",
    enabled: true,
    priority: 1,
    skipBefore: "3. ĐẶC TÍNH CÁC SAO",
  },
  {
    id: "binh-giai-cac-cach",
    file: "binhgiaicaccach.txt",
    // Sách "cách" theo CHỦ ĐỀ (22 mục: cách đẹp, ái tình, ăn nhậu, học vấn, giàu/nghèo, thọ yểu…).
    // Mục lục theo chủ đề nên không hợp star-sections — dùng window (như tuvi-fixed).
    // Giọng sách cũ tuyệt đối/miệt thị → lệnh diễn đạt tự hạ giọng; dùng toàn bộ kiến thức, chỉ câu chữ trùng nguyên văn tối đa 40% (câu mô tả/cách trung tính).
    // priority 2 (ngang tuvi-fixed; dưới star-sections 10 / nm-* 6, trên tan-bien-1956 1).
    label: "Bình giải các cách trong Tử Vi (window — nền chủ đề cách)",
    mode: "window",
    enabled: true,
    priority: 2,
  },
  // Nguồn đã có pipeline riêng (damTinhSource / kinhNghiem) — KHÔNG dual-dump ở đây.
  {
    id: "kinh-nghiem-ha-raw",
    file: "so-tu-vi-kinh-nghiem-quyen-ha.txt",
    label: "Sổ TVKN Quyển Hạ (raw — tắt; dùng kinhNghiemKnowledge)",
    mode: "window",
    enabled: false,
    priority: 0,
  },
  {
    id: "dam-tinh-raw",
    file: "vuongdinhchidamtinh.txt",
    label: "Đàm Tinh raw (tắt; dùng damTinh.ts)",
    mode: "window",
    enabled: false,
    priority: 0,
  },
];

/** 14 chính tinh + vài phụ hay dùng — map needle → tên chuẩn. */
const STAR_NEEDLES: { canon: string; needles: string[] }[] = [
  { canon: "Tử Vi", needles: ["tử vi", "tu vi", "zi wei"] },
  { canon: "Thiên Cơ", needles: ["thiên cơ", "thien co"] },
  { canon: "Thái Dương", needles: ["thái dương", "thai duong"] },
  { canon: "Vũ Khúc", needles: ["vũ khúc", "vu khuc"] },
  { canon: "Thiên Đồng", needles: ["thiên đồng", "thien dong", "thiên đồng"] },
  { canon: "Liêm Trinh", needles: ["liêm trinh", "liem trinh"] },
  { canon: "Thiên Phủ", needles: ["thiên phủ", "thien phu", "thiên phủ"] },
  { canon: "Thái Âm", needles: ["thái âm", "thai am"] },
  { canon: "Tham Lang", needles: ["tham lang"] },
  { canon: "Cự Môn", needles: ["cự môn", "cu mon", "cự môn"] },
  { canon: "Thiên Tướng", needles: ["thiên tướng", "thien tuong", "thiên tướng"] },
  { canon: "Thiên Lương", needles: ["thiên lương", "thien luong"] },
  { canon: "Thất Sát", needles: ["thất sát", "that sat", "thất sát"] },
  { canon: "Phá Quân", needles: ["phá quân", "pha quan", "phá quân"] },
  { canon: "Kình Dương", needles: ["kình dương", "kinh duong"] },
  { canon: "Đà La", needles: ["đà la", "da la"] },
  { canon: "Hỏa Tinh", needles: ["hỏa tinh", "hoa tinh"] },
  { canon: "Linh Tinh", needles: ["linh tinh"] },
  { canon: "Địa Không", needles: ["địa không", "dia khong"] },
  { canon: "Địa Kiếp", needles: ["địa kiếp", "dia kiep"] },
  { canon: "Văn Xương", needles: ["văn xương", "van xuong"] },
  { canon: "Văn Khúc", needles: ["văn khúc", "van khuc"] },
  { canon: "Lộc Tồn", needles: ["lộc tồn", "loc ton"] },
  { canon: "Hóa Lộc", needles: ["hóa lộc", "hoa loc"] },
  { canon: "Hóa Quyền", needles: ["hóa quyền", "hoa quyen"] },
  { canon: "Hóa Khoa", needles: ["hóa khoa", "hoa khoa"] },
  { canon: "Hóa Kỵ", needles: ["hóa kỵ", "hoa ky"] },
  { canon: "Tuần", needles: ["tuần", "tuần không", "tuan"] },
  { canon: "Triệt", needles: ["triệt", "triệt lộ", "triet"] },
];

export interface BookSnippet {
  bookId: string;
  bookLabel: string;
  /** Sao/chủ đề khớp */
  topic: string;
  /** Đoạn đã cắt */
  text: string;
  score: number;
}

export interface RetrieveBookOptions {
  /**
   * - "top": lấy topN đoạn điểm cao (cũ).
   * - "per-star": mỗi sao canon trên lá tối đa 1 tinh hoa (đủ tủ, không dump full).
   */
  mode?: "top" | "per-star";
  /** Tối đa số đoạn inject — mode top (mặc định 4); mode per-star = trần số sao */
  topN?: number;
  /** Ký tự / đoạn sau cô đọng tinh hoa (mặc định 520) */
  maxCharsPerSnippet?: number;
  /** Tổng ký tự toàn block (mặc định 1600; interpret per-star ~4500) */
  maxTotalChars?: number;
  /** Chỉ lấy sách whitelist enabled */
  bookIds?: string[];
  /**
   * Sao ưu tiên lấy trước (Mệnh/Thân/Tài/Quan…): tên Việt.
   * per-star sẽ fill các sao này trước rồi mới đến sao còn lại.
   */
  priorityStars?: string[];
  /** Ưu tiên sách star-sections (luận chính tinh) hơn window ồn */
  preferStarSections?: boolean;
}

interface IndexedSection {
  bookId: string;
  bookLabel: string;
  priority: number;
  title: string;
  titleNorm: string;
  titleFold: string;
  body: string;
  bodyFold: string;
  /** canon star nếu nhận ra */
  starCanon?: string;
}

interface BookIndex {
  sections: IndexedSection[];
  loadedAt: number;
}

const indexCache = new Map<string, BookIndex>();

function resolveBookPath(file: string): string {
  return path.join(DATA_DIR, file);
}

function readBookUtf8(file: string): string {
  const full = resolveBookPath(file);
  if (!fs.existsSync(full)) {
    throw new Error(`[bookCorpus] missing file: ${full}`);
  }
  return fs.readFileSync(full, "utf8").normalize("NFC");
}

function matchStarCanon(line: string): string | undefined {
  const fold = stripDiacritics(line);
  const compact = fold.replace(/\s+/g, " ").trim();
  for (const { canon, needles } of STAR_NEEDLES) {
    for (const n of needles) {
      const nf = stripDiacritics(n);
      if (compact === nf || compact === nf.replace(/\s/g, "")) return canon;
      // header "CỰ MÔN" exact-ish
      if (compact.length <= 24 && (compact.includes(nf) || nf.includes(compact))) {
        if (Math.abs(compact.length - nf.length) <= 4) return canon;
      }
    }
  }
  return undefined;
}

function isStarHeaderLine(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 40) return false;
  if (/^\d/.test(t)) return false;
  if (t.includes("....") || t.startsWith("-")) return false;
  // all caps-ish after strip combining noise
  const letters = t.replace(/[^A-Za-zÀ-ỹĐđ\s]/gu, "");
  if (letters.length < 3) return false;
  const upperRatio =
    [...letters].filter((c) => c === c.toUpperCase() && c !== c.toLowerCase()).length /
    Math.max(1, [...letters].filter((c) => /[A-Za-zÀ-ỹĐđ]/i.test(c)).length);
  if (upperRatio < 0.55) return false;
  return matchStarCanon(t) != null || /^[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ\s]+$/u.test(
    t.normalize("NFC"),
  );
}

function clipText(text: string, maxChars: number): string {
  const t = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (t.length <= maxChars) return t;
  const cut = t.slice(0, maxChars);
  const lastStop = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf("."), cut.lastIndexOf("\n"), cut.lastIndexOf(";"));
  const body = lastStop > maxChars * 0.5 ? cut.slice(0, lastStop + 1) : cut;
  return `${body.trim()}…`;
}

/**
 * Cô đọng TINH HOA một mục sao: gộp tính / tài / quan / hôn / kỵ,
 * bỏ bảng miếu–hãm & an sao khô. Đủ “hội tủ” mà không đẩy full chương.
 */
export function extractTinhHoaEssence(body: string, maxChars: number): string {
  const src = body.replace(/\r\n/g, "\n");
  const buckets: { key: string; re: RegExp; weight: number }[] = [
    {
      key: "tính",
      weight: 3,
      re: /(?:ý nghĩa\s*)?tính tình[\s\S]{20,1200}?(?=\n\s*\d+\.\s*ý nghĩa|\n\s*\d+\.\s*[A-ZÀ-Ỹ]|$)/i,
    },
    {
      key: "tài",
      weight: 2,
      re: /ý nghĩa\s*tài[\s\S]{15,700}?(?=\n\s*\d+\.\s*ý nghĩa|\n\s*\d+\.\s*[A-ZÀ-Ỹ]|$)/i,
    },
    {
      key: "quan",
      weight: 2,
      re: /ý nghĩa\s*(?:sự nghiệp|quan|công danh|địa vị)[\s\S]{15,700}?(?=\n\s*\d+\.\s*ý nghĩa|\n\s*\d+\.\s*[A-ZÀ-Ỹ]|$)/i,
    },
    {
      key: "hôn",
      weight: 1,
      re: /ý nghĩa\s*(?:hôn|phu thê|tình duyên|lục thân)[\s\S]{15,600}?(?=\n\s*\d+\.\s*ý nghĩa|\n\s*\d+\.\s*[A-ZÀ-Ỹ]|$)/i,
    },
    {
      key: "kỵ",
      weight: 2,
      re: /(?:tối kỵ|kỵ |không nên|tránh |hãm địa)[\s\S]{10,400}?(?=\n\s*\d+\.|$)/i,
    },
  ];

  const parts: string[] = [];
  let used = 0;
  const budget = Math.max(120, maxChars);

  for (const b of buckets.sort((a, c) => c.weight - a.weight)) {
    const m = b.re.exec(src);
    if (!m) continue;
    const sliceBudget = Math.min(
      Math.floor(budget * (b.weight / 8)),
      budget - used,
      b.key === "tính" ? Math.floor(budget * 0.45) : Math.floor(budget * 0.28),
    );
    if (sliceBudget < 40) continue;
    const cleaned = m[0]
      .replace(/\s+/g, " ")
      .replace(/ý nghĩa\s*/gi, "")
      .trim();
    const piece = clipText(cleaned, sliceBudget);
    if (piece.length < 30) continue;
    parts.push(`[${b.key}] ${piece}`);
    used += piece.length;
    if (used >= budget * 0.92) break;
  }

  if (parts.length > 0) return clipText(parts.join("\n"), maxChars);

  // Fallback: nhảy tới tính tình / tài
  return preferUsefulSlice(src, maxChars);
}

/** Ưu tiên đoạn "tính tình / tài / nên-kỵ" — bỏ bớt phần an sao khô. */
function preferUsefulSlice(body: string, maxChars: number): string {
  const markers = [
    /ý nghĩa tính tình/i,
    /tính tình/i,
    /ý nghĩa tài/i,
    /ý nghĩa sự nghiệp/i,
    /ý nghĩa hôn/i,
    /giải pháp|hóa giải|nên |không nên |kỵ |tránh /i,
  ];
  const normBody = body;
  for (const re of markers) {
    const m = re.exec(normBody);
    if (m && m.index != null && m.index < normBody.length * 0.85) {
      return clipText(normBody.slice(m.index), maxChars);
    }
  }
  const skip = /ý nghĩa cơ thể|ý nghĩa tướng mạo/i.exec(normBody);
  if (skip && skip.index != null && skip.index > 80) {
    return clipText(
      normBody.slice(0, Math.min(maxChars, skip.index)) + "\n" + normBody.slice(skip.index),
      maxChars,
    );
  }
  return clipText(normBody, maxChars);
}

function indexStarSections(book: BookManifestEntry, raw: string): IndexedSection[] {
  const lines = raw.split(/\r?\n/);
  const headerIdx: { line: number; title: string; star?: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    if (isStarHeaderLine(t) || matchStarCanon(t)) {
      const star = matchStarCanon(t);
      if (star || (t.length <= 30 && t === t.toUpperCase())) {
        headerIdx.push({ line: i, title: t.normalize("NFC"), star });
      }
    }
  }
  // dedupe consecutive
  const cleaned: typeof headerIdx = [];
  for (const h of headerIdx) {
    if (cleaned.length && cleaned[cleaned.length - 1].line === h.line) continue;
    // skip pure separators
    if (/^-+$/.test(h.title) || h.title.includes("***")) continue;
    cleaned.push(h);
  }

  const out: IndexedSection[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const start = cleaned[i].line + 1;
    const end = i + 1 < cleaned.length ? cleaned[i + 1].line : lines.length;
    const body = lines.slice(start, end).join("\n").trim();
    if (body.length < 80) continue;
    const title = cleaned[i].title;
    const starCanon = cleaned[i].star ?? matchStarCanon(title);
    out.push({
      bookId: book.id,
      bookLabel: book.label,
      priority: book.priority,
      title,
      titleNorm: normalizeVi(title),
      titleFold: stripDiacritics(title),
      body,
      bodyFold: stripDiacritics(body.slice(0, 4000)),
      starCanon,
    });
  }
  return out;
}

function indexWindows(book: BookManifestEntry, raw: string, windowLines = 28, step = 20): IndexedSection[] {
  const lines = raw.split(/\r?\n/);
  const out: IndexedSection[] = [];
  // Bỏ lời nói đầu dài: bắt đầu sau ~CHƯƠNG hoặc sau 80 dòng
  let from = 0;
  for (let i = 0; i < Math.min(lines.length, 200); i++) {
    if (/^chương\s/i.test(lines[i].trim()) || /^phần\s/i.test(lines[i].trim())) {
      from = i;
      break;
    }
  }
  if (from === 0) from = Math.min(60, lines.length);
  // skipBefore (manifest): bỏ toàn bộ phần trước mốc — công thức an sao / bảng cột
  if (book.skipBefore) {
    const needle = stripDiacritics(normalizeVi(book.skipBefore));
    for (let i = 0; i < lines.length; i++) {
      if (stripDiacritics(lines[i]).includes(needle)) {
        from = i;
        break;
      }
    }
  }

  for (let i = from; i < lines.length; i += step) {
    const chunk = lines.slice(i, i + windowLines).join("\n").trim();
    if (chunk.length < 120) continue;
    // bỏ cửa sổ toàn bảng an sao lặp
    const fold = stripDiacritics(chunk);
    if ((fold.match(/an tu vi|ngay sinh o cung/g) || []).length >= 3) continue;
    // bỏ cửa sổ bảng cột an sao (dạng "Hàng Can/Chi | Cung | coi bảng dưới đây")
    // và chương âm phần/thế đất — chứa đầy tên sao nhưng không phải diễn giải
    if ((fold.match(/hang can|hang chi|coi bang duoi day|am phan|the dat|mo phan/g) || []).length >= 3) continue;
    const title = `đoạn~L${i + 1}`;
    const starHit = STAR_NEEDLES.find(({ needles }) =>
      needles.some((n) => fold.includes(stripDiacritics(n))),
    );
    out.push({
      bookId: book.id,
      bookLabel: book.label,
      priority: book.priority,
      title,
      titleNorm: normalizeVi(title),
      titleFold: stripDiacritics(title),
      body: chunk,
      bodyFold: fold.slice(0, 4000),
      starCanon: starHit?.canon,
    });
  }
  return out;
}

function buildBookIndex(book: BookManifestEntry): BookIndex {
  const raw = readBookUtf8(book.file);
  const sections =
    book.mode === "star-sections" ? indexStarSections(book, raw) : indexWindows(book, raw);
  return { sections, loadedAt: Date.now() };
}

/** Xóa cache — test / hot-reload. */
export function clearBookCorpusCache(): void {
  indexCache.clear();
}

function getIndex(book: BookManifestEntry): BookIndex {
  const hit = indexCache.get(book.id);
  if (hit) return hit;
  const built = buildBookIndex(book);
  indexCache.set(book.id, built);
  return built;
}

export interface RetrieveBookContext {
  stars?: string[];
  palaces?: string[];
  topics?: string[];
  query?: string;
}

function expandNeedles(ctx: RetrieveBookContext): { raw: string[]; fold: string[]; canons: Set<string> } {
  const raw: string[] = [];
  const canons = new Set<string>();
  for (const s of [...(ctx.stars ?? []), ...(ctx.palaces ?? []), ...(ctx.topics ?? [])]) {
    if (!s?.trim()) continue;
    raw.push(s);
    const c = matchStarCanon(s) ?? STAR_NEEDLES.find((x) => stripDiacritics(x.canon) === stripDiacritics(s))?.canon;
    if (c) canons.add(c);
    // fuzzy: "Thiên Cơ (Miếu)" → Thiên Cơ
    const base = s.replace(/\(.*\)/g, "").trim();
    const c2 = matchStarCanon(base);
    if (c2) canons.add(c2);
  }
  if (ctx.query) {
    const qf = stripDiacritics(ctx.query);
    for (const { canon, needles } of STAR_NEEDLES) {
      if (needles.some((n) => qf.includes(stripDiacritics(n)))) canons.add(canon);
    }
  }
  const fold = raw.map(stripDiacritics);
  return { raw, fold, canons };
}

/**
 * Truy hồi tinh hoa sách khớp lá.
 * - per-star: đủ tủ theo từng sao trên lá (1 essence/sao), không full sách.
 * - top: lấy N đoạn điểm cao (chat / hẹp).
 * Không bao giờ trả full file.
 */
export function retrieveBookSnippets(
  ctx: RetrieveBookContext,
  opts: RetrieveBookOptions = {},
): BookSnippet[] {
  const mode = opts.mode ?? "top";
  const topN = opts.topN ?? (mode === "per-star" ? 14 : 4);
  const maxChars = opts.maxCharsPerSnippet ?? (mode === "per-star" ? 400 : 520);
  const maxTotal = opts.maxTotalChars ?? (mode === "per-star" ? 4800 : 1600);
  const preferStarSec = opts.preferStarSections !== false;
  const { canons, fold: starFolds } = expandNeedles(ctx);

  if (canons.size === 0 && starFolds.length === 0) return [];

  const books = BOOK_CORPUS_MANIFEST.filter((b) => {
    if (!b.enabled) return false;
    if (opts.bookIds?.length) return opts.bookIds.includes(b.id);
    return true;
  }).sort((a, b) => {
    if (preferStarSec) {
      const aw = a.mode === "star-sections" ? 1 : 0;
      const bw = b.mode === "star-sections" ? 1 : 0;
      if (aw !== bw) return bw - aw;
    }
    return b.priority - a.priority;
  });

  type Scored = BookSnippet & { starKey: string };
  const scored: Scored[] = [];

  for (const book of books) {
    let index: BookIndex;
    try {
      index = getIndex(book);
    } catch {
      continue;
    }
    for (const sec of index.sections) {
      let score = 0;
      if (sec.starCanon && canons.has(sec.starCanon)) score += 12;
      for (const c of canons) {
        const cf = stripDiacritics(c);
        if (sec.titleFold === cf || sec.titleFold.includes(cf)) score += 10;
        if (sec.bodyFold.includes(cf)) score += 2;
      }
      for (const f of starFolds) {
        if (f.length < 3) continue;
        if (sec.titleFold.includes(f)) score += 6;
        if (sec.bodyFold.includes(f)) score += 1;
      }
      if (score <= 0) continue;
      // Ưu sách star-sections
      if (book.mode === "star-sections") score += 5;
      score += book.priority * 0.1;
      const topic = sec.starCanon || sec.title;
      scored.push({
        bookId: book.id,
        bookLabel: book.label,
        topic,
        text: extractTinhHoaEssence(sec.body, maxChars),
        score,
        starKey: stripDiacritics(sec.starCanon || topic),
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  // Hàng đợi sao: priorityStars trước, rồi các canon còn lại theo điểm
  const priorityKeys = (opts.priorityStars ?? [])
    .map((s) => {
      const base = s.replace(/\(.*\)/g, "").trim();
      const canon = matchStarCanon(base) || matchStarCanon(s);
      return stripDiacritics(canon || base);
    })
    .filter(Boolean);

  const orderedStarKeys: string[] = [];
  const pushKey = (k: string) => {
    if (!k || orderedStarKeys.includes(k)) return;
    // chỉ giữ key có trong canons/scored
    if ([...canons].some((c) => stripDiacritics(c) === k) || scored.some((s) => s.starKey === k)) {
      orderedStarKeys.push(k);
    }
  };
  for (const k of priorityKeys) pushKey(k);
  for (const c of canons) pushKey(stripDiacritics(c));
  for (const s of scored) pushKey(s.starKey);

  const picked: BookSnippet[] = [];
  const seenStar = new Set<string>();
  let total = 0;

  const takeBestForStar = (starKey: string) => {
    if (seenStar.has(starKey)) return;
    const best = scored.find((s) => s.starKey === starKey || s.starKey.includes(starKey) || starKey.includes(s.starKey));
    if (!best) return;
    if (total + best.text.length > maxTotal && picked.length > 0) return;
    seenStar.add(starKey);
    seenStar.add(best.starKey);
    picked.push({
      bookId: best.bookId,
      bookLabel: best.bookLabel,
      topic: best.topic,
      text: best.text,
      score: best.score,
    });
    total += best.text.length;
  };

  if (mode === "per-star") {
    for (const k of orderedStarKeys) {
      if (picked.length >= topN) break;
      takeBestForStar(k);
    }
  } else {
    const seenTopic = new Set<string>();
    for (const s of scored) {
      const key = `${s.bookId}::${s.starKey}`;
      if (seenTopic.has(key)) continue;
      if (total + s.text.length > maxTotal && picked.length > 0) break;
      seenTopic.add(key);
      picked.push(s);
      total += s.text.length;
      if (picked.length >= topN) break;
    }
  }

  return picked;
}

/**
 * Block nguyên liệu cho AI — TINH HOA đủ sao liên quan, không full sách.
 * Nhiệm vụ model: DIỄN ĐẠT logic hệ thống; dùng toàn bộ kiến thức, chỉ câu chữ trùng nguyên văn tối đa 40% độ dài phần trích (2026-10).
 */
export function bookSnippetsToPromptText(snippets: BookSnippet[]): string {
  if (!snippets.length) return "";
  const body = snippets
    .map((s, i) => `• (${i + 1}) 【${s.topic}】\n${s.text}`)
    .join("\n\n");
  return (
    `=== TỦ TINH HOA SÁCH (ĐÃ CÔ ĐỌNG THEO SAO TRÊN LÁ — ${snippets.length} mục) ===\n` +
    `Đây là NGUYÊN LIỆU trong “hội tủ” cho ĐÚNG các sao có trên lá — đã lọc tính/tài/quan/kỵ, KHÔNG phải full sách. ` +
    `Nhiệm vụ của bạn: ĐỌC–TIÊU HÓA–DIỄN ĐẠT thành mạch logic như bậc thầy (nhân quả sao↔cung↔tam phương↔tứ hóa↔sát). ` +
    `ĐƯỢC dùng TOÀN BỘ KIẾN THỨC trong nguyên liệu; chỉ câu chữ trùng nguyên văn được giữ tối đa 40% độ dài phần trích (câu mô tả/cách trung tính — chuẩn rồi thì giữ; phần câu chữ còn lại diễn đạt lại). ` +
    `40% là trần trùng câu chữ cho toàn bộ nguyên liệu sách trong bài, không phải mỗi khối và KHÔNG phải trần kiến thức/số ý. ` +
    `KHÔNG liệt kê “theo sách…”, KHÔNG kể từng mục rời, KHÔNG chép trọn block. ` +
    `Xương sống vẫn là máy (lá) + Đàm Tinh; tinh hoa sách chỉ làm giàu sắc thái. Lệch máy → bỏ sách. ` +
    `Chỉ "CÓ XU HƯỚNG".\n\n` +
    body
  );
}

/** Kiểm tra file whitelist có trên đĩa (smoke). */
export function listBookCorpusStatus(): {
  id: string;
  enabled: boolean;
  exists: boolean;
  path: string;
}[] {
  return BOOK_CORPUS_MANIFEST.map((b) => {
    const p = resolveBookPath(b.file);
    return { id: b.id, enabled: b.enabled, exists: fs.existsSync(p), path: p };
  });
}
