import { allStarsOf, normalizeStarName } from "../utils/chartRelations";
import { HOA_LABELS } from "../utils/tuHoa";
import { MAJOR_STAR_NORMS, TUVI_STAR_CATALOG, type CatalogStar } from "../utils/tuviStarCatalog";

export type StarAuditSeverity = "clean" | "soft" | "retry";

export interface StarAuditResult {
  mentioned: string[];
  hallucinated: string[];
  knownStarLabels: string[];
  severity: StarAuditSeverity;
  warning?: string;
}

const NEGATION_BEFORE = /(?:không\s+có|không\s+hề|không\s+gặp|không\s+thấy|thiếu|vắng|chưa\s+có|không\s+đủ)\s*$/iu;

/**
 * Cụm thuật ngữ Bát Tự / Tử Bình — nếu match tên sao Tử Vi CHỒNG lên cụm này
 * thì bỏ qua (không tính là nhắc sao trên thiên bàn).
 *
 * Case gốc: "vận Hỷ Dụng thần" bị catalog khớp "Vận Hỷ" dù ý là 喜用神.
 * Không đưa "hỷ thần" đơn lẻ vào đây — trùng tên sao Bác Sỹ "Hỷ Thần".
 */
export const BAZI_PHRASE_IGNORELIST: readonly string[] = [
  // Hỷ–Kỵ–Dụng (xung đột mạnh với Vận Hỷ / Hóa Kỵ / …)
  "hỷ dụng thần",
  "hỷ dụng",
  "kỵ dụng thần",
  "kỵ dụng",
  "kỵ thần",
  "dụng thần",
  "hỷ thần kỵ thần",
  // Khung phương pháp thường gặp trong luận chéo TV↔BT
  "vượng nhược",
  "thân vượng",
  "thân nhược",
  "nhật chủ",
  "thập thần",
  "tỷ kiếp",
  "thực thương",
  "thương quan",
  "chính ấn",
  "thiên ấn",
  "chính quan",
  "chính tài",
  // Không đưa: Thất Sát / Thiên Tài / Thiên Quan — trùng tên sao Tử Vi trên catalog.
  "nạp âm",
  "phù ức",
  "điều hậu",
  "thông quan",
  "đại vận",
  "tiền vận",
  "trung vận",
  "hậu vận",
];

/**
 * Hậu tố Bát Tự ngay SAU match catalog → bỏ qua.
 * "…Hỷ" + " Dụng (thần)?" trong "vận Hỷ Dụng thần".
 */
const BAZI_AFTER_MATCH = /^\s*dụng(?:\s*thần)?(?=\s|$|[,.;:!?…\)\]"'»])/iu;

function isLetter(ch: string): boolean {
  return /\p{L}/u.test(ch);
}

function isWordBoundary(text: string, start: number, len: number): boolean {
  const before = start > 0 ? text[start - 1] : " ";
  const after = start + len < text.length ? text[start + len] : " ";
  return !isLetter(before) && !isLetter(after);
}

function isNegatedMention(fullText: string, matchIndex: number): boolean {
  const window = fullText.slice(Math.max(0, matchIndex - 48), matchIndex);
  return NEGATION_BEFORE.test(window);
}

interface TextRange {
  start: number;
  end: number;
}

function rangesOverlap(a: TextRange, b: TextRange): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Vùng text thuộc cụm Bát Tự ignorelist (NFC lower). */
export function findBaziPhraseRanges(
  lowerText: string,
  phrases: readonly string[] = BAZI_PHRASE_IGNORELIST,
): TextRange[] {
  const ranges: TextRange[] = [];
  const lower = String(lowerText || "");
  for (const raw of phrases) {
    const needle = raw.normalize("NFC").toLowerCase().trim();
    if (!needle) continue;
    let idx = 0;
    while ((idx = lower.indexOf(needle, idx)) !== -1) {
      if (isWordBoundary(lower, idx, needle.length)) {
        ranges.push({ start: idx, end: idx + needle.length });
      }
      idx += 1;
    }
  }
  return ranges;
}

/**
 * Match catalog có phải ngữ cảnh Bát Tự (ignore) không?
 * — chồng vùng ignorelist, hoặc hậu tố " Dụng (thần)?".
 */
export function isBaziContextMatch(
  lowerText: string,
  matchStart: number,
  matchLen: number,
  baziRanges?: TextRange[],
): boolean {
  const match: TextRange = { start: matchStart, end: matchStart + matchLen };
  const ranges = baziRanges ?? findBaziPhraseRanges(lowerText);
  if (ranges.some((r) => rangesOverlap(match, r))) return true;
  const after = lowerText.slice(match.end);
  if (BAZI_AFTER_MATCH.test(after)) return true;
  return false;
}

/**
 * Tên đầy đủ trên lá (tuvi sao lưu) ↔ tên viết tắt AI / catalog hay dùng.
 * Key: normalizeStarName sau strip [SAO LƯU] / ngoặc.
 * Tránh false positive kiểu "Lưu Lộc" khi lá chỉ có "Lưu Lộc Tồn".
 */
const LUU_STAR_ALIASES: Record<string, string[]> = {
  // --- Lục sát / lộc mã lưu ---
  "lưu lộc tồn": ["Lưu Lộc"],
  "lưu kình dương": ["Lưu Kình", "Lưu Dương"],
  "lưu đà la": ["Lưu Đà"],
  "lưu thiên mã": ["Lưu Mã"],
  "lưu khôi": ["Lưu Khôi", "Thiên Khôi"],
  "lưu việt": ["Lưu Việt", "Thiên Việt"],
  "niên giải": ["Niên Giải"],
  // --- Tuế / tang / hỉ ---
  "lưu thái tuế": ["Lưu Tuế", "Thái Tuế"],
  "lưu tang môn": ["Lưu Tang"],
  "lưu bạch hổ": ["Lưu Hổ", "Bạch Hổ"],
  "lưu hồng loan": ["Lưu Loan", "Hồng Loan"],
  "lưu thiên hỷ": ["Lưu Hỷ", "Thiên Hỷ"],
  // --- Khốc hư / văn ---
  "lưu thiên khốc": ["Lưu Khốc", "Thiên Khốc"],
  "lưu thiên hư": ["Lưu Hư", "Thiên Hư"],
  "lưu văn xương": ["Lưu Xương", "Văn Xương"],
  "lưu văn khúc": ["Lưu Khúc", "Văn Khúc"],
  // --- Lưu Tứ Đức ---
  "lưu thiên đức": ["Lưu Thiên Đức"],
  "lưu nguyệt đức": ["Lưu Nguyệt Đức"],
  "lưu phúc đức": ["Lưu Phúc Đức"],
  "lưu long đức": ["Lưu Long Đức"],
  // --- Lưu Tứ Hóa (AI gọn "Lưu Lộc" / "Lưu Quyền"…) ---
  "lưu hóa lộc": ["Lưu Lộc", "Lưu Hóa Lộc"],
  "lưu hóa quyền": ["Lưu Quyền", "Lưu Hóa Quyền"],
  "lưu hóa khoa": ["Lưu Khoa", "Lưu Hóa Khoa"],
  "lưu hóa kỵ": ["Lưu Kỵ", "Lưu Hóa Kỵ"],
  // --- Sao Vận (đại hạn) — AI có thể viết gọn ---
  "vận lộc": ["Vận Lộc"],
  "vận khôi": ["Vận Khôi"],
  "vận việt": ["Vận Việt"],
  "vận xương": ["Vận Xương"],
  "vận khúc": ["Vận Khúc"],
  "vận loan": ["Vận Loan"],
  "vận hỷ": ["Vận Hỷ"],
  "vận dương": ["Vận Dương", "Vận Kình"],
  "vận đà": ["Vận Đà"],
  "vận mã": ["Vận Mã"],
};

/** Biến thể tên VN ↔ iztro — whitelist để AI viết Tả Phụ không bị coi là bịa khi lá có Tả Phù. */
const CHART_STAR_ALIASES: Record<string, string[]> = {
  "tả phù": ["Tả Phụ"],
  "tả phụ": ["Tả Phù"],
  "phụng các": ["Phượng Các"],
  "phượng các": ["Phụng Các"],
  // Tuần / Triệt: iztro dùng một nhãn (Tuần Không / Triệt Lộ), sách & AI hay viết synonym.
  "tuần không": ["Tuần Trung"],
  "tuần trung": ["Tuần Không"],
  "triệt lộ": ["Triệt Không"],
  "triệt không": ["Triệt Lộ"],
};

/**
 * Whitelist + nhãn hiển thị từ SAO THỰC CÓ trên lá (gốc + Lưu + Vận + vòng + alias).
 * Không inject toàn bộ tuviStarCatalog — chỉ lá này.
 */
export function buildChartStarWhitelist(chartData: { palaces?: any[] }): Set<string> {
  return new Set(buildChartStarEntries(chartData).map((e) => e.norm));
}

/** Entry (display, norm) từ lá — dùng whitelist + catalog quét theo lá. */
export function buildChartStarEntries(chartData: { palaces?: any[] }): CatalogStar[] {
  const byNorm = new Map<string, string>(); // norm → display ưu tiên (dài hơn)

  const add = (name: string) => {
    // Display dùng để quét text AI — bỏ tag payload, không để "[SAO VẬN] …" làm needle.
    const display = String(name || "")
      .replace(/\[SAO\s*(?:LƯU|VẬN)\]\s*/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!display) return;
    const norm = normalizeStarName(display);
    if (!norm) return;
    const prev = byNorm.get(norm);
    if (!prev || display.length > prev.length) byNorm.set(norm, display);
  };

  const addVariant = (rawName: string) => {
    const raw = String(rawName || "").trim();
    if (!raw) return;
    add(raw);

    // "Lưu Hóa Quyền (Thiên Cơ)" → "Lưu Hóa Quyền" — khớp cách AI thường viết gọn.
    const noParen = raw.replace(/\s*\([^)]*\)\s*/g, " ").trim();
    if (noParen && noParen !== raw) add(noParen);

    const stripped = noParen.replace(/\[SAO\s*(?:LƯU|VẬN)\]\s*/gi, "").trim();
    if (stripped !== noParen) {
      add(stripped);
    }

    // Bỏ prefix Lưu chỉ khi phần còn lại đủ dài (tránh "Lưu Hỷ" → "Hỷ" khớp "hỷ sự").
    if (/^lưu\s+/iu.test(stripped)) {
      const bare = stripped.replace(/^lưu\s+/iu, "").trim();
      if (bare.length >= 4) add(bare);
    }
    // Không strip "Vận X" → "X" (Vận Hỷ → Hỷ gây false positive với "hỷ sự" / Bát Tự).

    // "Lưu Hóa Lộc (…)" → Lưu Lộc; "Lưu Lộc Tồn" → Lưu Lộc (bảng LUU_STAR_ALIASES).
    const hoaShort = stripped.match(/^lưu\s+hóa\s+(lộc|quyền|khoa|kỵ)$/iu);
    if (hoaShort) add(`Lưu ${hoaShort[1]}`);

    for (const alias of LUU_STAR_ALIASES[normalizeStarName(stripped)] || []) add(alias);
    for (const alias of CHART_STAR_ALIASES[normalizeStarName(stripped)] || []) add(alias);
  };

  for (const p of chartData.palaces || []) {
    for (const s of allStarsOf(p)) {
      addVariant(s.name);
      // Mutagen gắn trên sao (payload) — whitelist để AI nhắc "Hóa Kỵ" không bị coi bịa
      if (s?.mutagen) addVariant(String(s.mutagen));
    }
    for (const key of [
      "changsheng12",
      "boshi12",
      "jiangqian12",
      "suiqian12",
      "yearJiangqian12",
      "yearSuiqian12",
    ] as const) {
      if (p[key]) addVariant(p[key]);
    }
  }

  // Tứ Hóa bẩm sinh là lớp khái niệm (luôn cho phép nhãn Hóa chuẩn).
  for (const h of HOA_LABELS) add(h);

  return [...byNorm.entries()]
    .map(([norm, display]) => ({ norm, display }))
    .sort((a, b) => b.display.length - a.display.length);
}

/**
 * Catalog quét tên trong text AI:
 * - Ưu tiên tên/alias **trên lá** (đầy đủ, kể cả "Lưu Hóa Lộc (Thiên Đồng)")
 * - Cộng thêm tuviStarCatalog để bắt sao **bịa ngoài lá** (hallucination)
 * Dedup theo norm, giữ display dài hơn.
 */
export function buildMentionScanCatalog(chartData?: { palaces?: any[] }): CatalogStar[] {
  const byNorm = new Map<string, string>();
  const absorb = (list: CatalogStar[]) => {
    for (const { norm, display } of list) {
      if (!norm) continue;
      const prev = byNorm.get(norm);
      if (!prev || display.length > prev.length) byNorm.set(norm, display);
    }
  };
  if (chartData?.palaces) absorb(buildChartStarEntries(chartData));
  absorb(TUVI_STAR_CATALOG);
  return [...byNorm.entries()]
    .map(([norm, display]) => ({ norm, display }))
    .sort((a, b) => b.display.length - a.display.length);
}

export function extractMentionedStars(
  responseText: string,
  catalog: CatalogStar[] = TUVI_STAR_CATALOG,
): string[] {
  const text = String(responseText || "").normalize("NFC");
  const lower = text.toLowerCase();
  const mentioned = new Set<string>();
  const baziRanges = findBaziPhraseRanges(lower);

  for (const { display, norm } of catalog) {
    const needle = display.normalize("NFC").toLowerCase();
    if (!needle) continue;
    let idx = 0;
    while ((idx = lower.indexOf(needle, idx)) !== -1) {
      if (
        isWordBoundary(lower, idx, needle.length) &&
        !isNegatedMention(text, idx) &&
        !isBaziContextMatch(lower, idx, needle.length, baziRanges)
      ) {
        mentioned.add(norm);
        break;
      }
      idx += 1;
    }
  }
  return [...mentioned];
}

export function assessStarAuditSeverity(hallucinated: string[]): StarAuditSeverity {
  if (hallucinated.length === 0) return "clean";
  const hasMajor = hallucinated.some((h) => MAJOR_STAR_NORMS.has(h));
  if (hasMajor || hallucinated.length >= 3) return "retry";
  return "soft";
}

export function auditAiStarMentions(responseText: string, chartData: { palaces?: any[] }): StarAuditResult {
  const chartEntries = buildChartStarEntries(chartData);
  const known = new Set(chartEntries.map((e) => e.norm));
  const labelByNorm = new Map(chartEntries.map((e) => [e.norm, e.display]));
  // Quét: tên trên lá (đầy đủ) + catalog toàn cục để bắt sao bịa ngoài lá
  const mentioned = extractMentionedStars(responseText, buildMentionScanCatalog(chartData));
  const hallucinated = mentioned.filter((s) => !known.has(s));
  const severity = assessStarAuditSeverity(hallucinated);

  const knownStarLabels = chartEntries
    .map((e) => labelByNorm.get(e.norm) || e.display)
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .sort((a, b) => a.localeCompare(b, "vi"));

  let warning: string | undefined;
  if (severity === "soft") {
    warning =
      `Hệ thống phát hiện tên sao có thể không có trên lá số: ${hallucinated.join(", ")}. ` +
      "Hãy đối chiếu lại thiên bàn trước khi tin hoàn toàn.";
  }

  return { mentioned, hallucinated, knownStarLabels, severity, warning };
}

export function buildStarGuardRetryAddon(audit: StarAuditResult): {
  userAddon: string;
  systemSuffix: string;
} {
  const allowed = audit.knownStarLabels.slice(0, 80).join(", ");
  return {
    userAddon:
      `\n\n--- RÀ SOÁT SAO (BẮT BUỘC) ---\n` +
      `Bản trước đã nhắc sai các sao KHÔNG có trên lá số: ${audit.hallucinated.join(", ")}.\n` +
      `CHỈ được nhắc sao trong danh sách hợp lệ sau (tuyệt đối không thêm sao khác):\n${allowed}\n` +
      `Viết lại toàn bộ luận giải, không lặp lại phần sai.`,
    systemSuffix:
      "\n\nRÀ SOÁT SAO: TUYỆT ĐỐI không nhắc tên sao ngoài danh sách hợp lệ user cung cấp. " +
      "Nếu cần nói về sao không có, hãy nói rõ 'lá số không có [tên sao]' thay vì luận như có.",
  };
}

export function appendStarAuditDisclaimer(text: string, hallucinated: string[]): string {
  if (!hallucinated.length) return text;
  return (
    `${text.trim()}\n\n---\n` +
    `*Lưu ý hệ thống: Một số tên sao trong bài có thể không khớp lá số (${hallucinated.join(", ")}). ` +
    `Hãy đối chiếu thiên bàn trước khi tin hoàn toàn.*`
  );
}