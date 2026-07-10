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

/**
 * Tên đầy đủ trên lá (tuvi sao lưu) ↔ tên viết tắt AI / catalog hay dùng.
 * Key: normalizeStarName sau strip [SAO LƯU] / ngoặc.
 * Tránh false positive kiểu "Lưu Lộc" khi lá chỉ có "Lưu Lộc Tồn".
 */
const LUU_STAR_ALIASES: Record<string, string[]> = {
  // --- Lục sát / lộc mã lưu ---
  "lưu lộc tồn": ["Lưu Lộc"],
  "lưu kình dương": ["Lưu Kình"],
  "lưu đà la": ["Lưu Đà"],
  "lưu thiên mã": ["Lưu Mã"],
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
  // --- Lưu Tứ Hóa (AI gọn "Lưu Lộc" / "Lưu Quyền"…) ---
  "lưu hóa lộc": ["Lưu Lộc", "Lưu Hóa Lộc"],
  "lưu hóa quyền": ["Lưu Quyền", "Lưu Hóa Quyền"],
  "lưu hóa khoa": ["Lưu Khoa", "Lưu Hóa Khoa"],
  "lưu hóa kỵ": ["Lưu Kỵ", "Lưu Hóa Kỵ"],
};

/** Biến thể tên VN ↔ iztro — whitelist để AI viết Tả Phụ không bị coi là bịa khi lá có Tả Phù. */
const CHART_STAR_ALIASES: Record<string, string[]> = {
  "tả phù": ["Tả Phụ"],
  "tả phụ": ["Tả Phù"],
  "phụng các": ["Phượng Các"],
  "phượng các": ["Phụng Các"],
};

/** Whitelist sao thực có trên lá số (gốc + [SAO LƯU] + Tứ Hóa bẩm sinh + alias lưu niên). */
export function buildChartStarWhitelist(chartData: { palaces?: any[] }): Set<string> {
  const known = new Set<string>();
  const add = (name: string) => {
    const norm = normalizeStarName(name);
    if (norm) known.add(norm);
  };

  const addVariant = (rawName: string) => {
    const raw = String(rawName || "").trim();
    if (!raw) return;
    add(raw);

    // "Lưu Hóa Quyền (Thiên Cơ)" → "Lưu Hóa Quyền" — khớp cách AI thường viết gọn.
    const noParen = raw.replace(/\s*\([^)]*\)\s*/g, " ").trim();
    if (noParen && noParen !== raw) add(noParen);

    const stripped = noParen.replace(/\[SAO LƯU\]\s*/gi, "").trim();
    if (stripped !== noParen) {
      add(stripped);
      add(`Lưu ${stripped}`);
    }
    if (/^lưu\s+/iu.test(stripped)) add(stripped.replace(/^lưu\s+/iu, ""));

    // "Lưu Hóa Lộc (…)" → Lưu Lộc; "Lưu Lộc Tồn" → Lưu Lộc (bảng LUU_STAR_ALIASES).
    const hoaShort = stripped.match(/^lưu\s+hóa\s+(lộc|quyền|khoa|kỵ)$/iu);
    if (hoaShort) add(`Lưu ${hoaShort[1]}`);

    for (const alias of LUU_STAR_ALIASES[normalizeStarName(stripped)] || []) add(alias);
    for (const alias of CHART_STAR_ALIASES[normalizeStarName(stripped)] || []) add(alias);
  };

  for (const p of chartData.palaces || []) {
    for (const s of allStarsOf(p)) addVariant(s.name);
    for (const key of ["changsheng12", "boshi12", "jiangqian12", "suiqian12"] as const) {
      if (p[key]) addVariant(p[key]);
    }
  }

  // Tứ Hóa bẩm sinh là lớp khái niệm gắn sao thật (mutagen iztro), không phải star rời trong allStarsOf.
  for (const h of HOA_LABELS) add(h);

  return known;
}

export function extractMentionedStars(
  responseText: string,
  catalog: CatalogStar[] = TUVI_STAR_CATALOG,
): string[] {
  const text = String(responseText || "").normalize("NFC");
  const lower = text.toLowerCase();
  const mentioned = new Set<string>();

  for (const { display, norm } of catalog) {
    const needle = display.normalize("NFC").toLowerCase();
    if (!needle) continue;
    let idx = 0;
    while ((idx = lower.indexOf(needle, idx)) !== -1) {
      if (isWordBoundary(lower, idx, needle.length) && !isNegatedMention(text, idx)) {
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
  const known = buildChartStarWhitelist(chartData);
  const mentioned = extractMentionedStars(responseText);
  const hallucinated = mentioned.filter((s) => !known.has(s));
  const severity = assessStarAuditSeverity(hallucinated);

  const knownStarLabels = [...known]
    .map((n) => TUVI_STAR_CATALOG.find((c) => c.norm === n)?.display || n)
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