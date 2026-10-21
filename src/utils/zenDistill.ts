// ============================================================================
// ZEN DISTILL — chưng cất bài luận giải thành "bản đọc tĩnh" (client-side).
// ----------------------------------------------------------------------------
// Triết lý Zen Reader: KHÔNG push nguyên 1:1 bài luận (~2000 từ) vào chế độ
// đọc. Reader chỉ nhận ~15-20 câu chốt — mỗi phần của bài gốc để lại 1-3 câu
// linh hồn; muốn sâu hơn thì "đọc sâu" mở nguyên đoạn, hoặc "Xem toàn văn".
//
// Toàn bộ deterministic (0 token AI): bài luận có cấu trúc heading BẮT BUỘC
// do interpretFrameworkPrompt neo (Tính va đập, Tự Phi Tứ Hóa, Độ sâu Tứ Hóa,
// Cấu trúc Sát, Đại hạn, Luận giải Tiểu Hạn [TÓM NĂM], Phu Thê, Tật Ách,
// Phúc Đức, ĐỊNH CÁCH PHÚ QUÝ...) — parser bám khung đó, và nếu AI lệch khung
// thì fallback nhiều tầng, Zen vẫn chạy.
// ============================================================================

import { processMetadataInText } from "./metadataTags";

export interface ZenPassage {
  /** id ổn định theo keyword (vd "tu-hoa") — dùng làm key React + mở rộng. */
  id: string;
  /** Tên phần ngắn gọn cho chế độ đọc. */
  title: string;
  /** Câu chốt của phần (1-3 câu), đã bỏ thẻ máy [TAG] và markdown đậm. */
  breaths: string[];
  /** Nguyên văn phần (markdown, đã bỏ thẻ máy) — cho "đọc sâu". */
  full: string;
  /** true nếu đây là phần gộp từ nhiều mục gốc (vd Tự Phi + Độ sâu Tứ Hóa). */
  merged?: boolean;
}

export interface ZenDistillResult {
  passages: ZenPassage[];
  /** Câu "linh hồn mệnh" từ đoạn đầu bài (trước heading đầu tiên). */
  openingLine: string;
  /** Nhãn thẻ sự kiện năm (TIỀN BẠC, CÔNG VIỆC...) bắt từ khối [TÓM NĂM]. */
  yearCards: string[];
  /** true nếu parser nhận diện được ≥2 phần theo khung heading. */
  ok: boolean;
}

// ----------------------------------------------------------------------------
// BẢNG PHÂN LOẠI HEADING — bám đúng khung heading bắt buộc của bài luận.
// Thứ tự trong mảng = thứ tự ưu tiên khớp (heading chứa 2 kw → kw sớm thắng).
// Sections không khớp kw nào vẫn thành passage (giữ title gốc) — không bỏ sót.
// ----------------------------------------------------------------------------
const SECTION_MAP: { kw: RegExp; id: string; title: string }[] = [
  { kw: /chân\s*dung|3\s*trục\s*chính/i, id: "chan-dung", title: "Chân dung & 3 trục" },
  // 4 phần lớn — bản tinh gọn.
  { kw: /bản\s*sắc|cơ\s*chế\s*vận\s*hành/i, id: "ban-sac", title: "Bản sắc & cơ chế" },
  { kw: /đời\s*sống\s*thực\s*tế/i, id: "doi-song", title: "Đời sống thực tế" },
  { kw: /vận\s*trình/i, id: "van-trinh", title: "Vận trình" },
  { kw: /nền\s*tảng\s*phúc\s*báo|tổng\s*lực/i, id: "nen-tang", title: "Nền tảng & tổng lực" },
  // Mục con — vẫn giữ map cũ để tương thích bài cũ.
  { kw: /tính\s*va\s*đập|điểm\s*mù/i, id: "ban-sac", title: "Bản sắc & Điểm mù" },
  { kw: /tự\s*phi\s*tứ\s*hóa|tự\s*hóa/i, id: "tu-hoa", title: "Tự & Phi Tứ Hóa" },
  { kw: /độ\s*sâu\s*tứ\s*hóa/i, id: "tu-hoa", title: "Tự & Phi Tứ Hóa" },
  { kw: /cấu\s*trúc\s*sát/i, id: "sat-cuc", title: "Cấu trúc Sát" },
  { kw: /đại\s*hạn/i, id: "dai-han", title: "Đại vận 10 năm" },
  { kw: /luận\s*giải\s*tiểu\s*hạn|tóm\s*năm/i, id: "van-nam", title: "Vận năm" },
  { kw: /tháng\s*trọng\s*tâm|tháng\s*nóng\s*nhất|lưu\s*nguyệt/i, id: "luu-nguyet", title: "Tháng trọng tâm" },
  { kw: /sự\s*nghiệp[\s\S]{0,24}tài\s*lộc|tài\s*lộc/i, id: "su-nghiep", title: "Sự nghiệp & Tài lộc" },
  { kw: /tình\s*cảm|phu\s*thê|gia\s*đạo/i, id: "phu-the", title: "Tình cảm & Gia đạo" },
  { kw: /sức\s*khỏe|tật\s*ách|môi\s*trường\s*sống/i, id: "tat-ach", title: "Sức khỏe & Môi trường" },
  { kw: /phúc\s*đức/i, id: "phuc-duc", title: "Phúc Đức" },
  { kw: /các\s*cung\s*còn\s*lại/i, id: "cung-khac", title: "Các cung còn lại" },
  { kw: /định\s*cách/i, id: "dinh-cach", title: "Định cách phú quý" },
  { kw: /kết\s*luận\s*cuối/i, id: "ket-luan", title: "Kết luận 5 dòng" },
  { kw: /đối\s*chiếu\s*(chéo\s*)?bát\s*tự|bát\s*tự/i, id: "bat-tu", title: "Đối chiếu Bát Tự" },
];

const MAX_BREATHS_PER_SECTION = 3;
const MAX_BREATH_CHARS = 240;
const MAX_OPENING_CHARS = 300;

const cleanLineNoise = (s: string): string =>
  s
    .replace(/\r\n?/g, "\n")
    .replace(/\*\*/g, "")
    .replace(/^[ \t]*[-*•]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .trim();

/** Cắt câu theo dấu câu cuối (lookbehind — Node/V8 hỗ trợ). */
const splitSentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);

/** Cắt câu quá dài tại biên từ, thêm "…". */
const clampSentence = (s: string, max = MAX_BREATH_CHARS): string => {
  const t = s.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
};

/** Rút "câu chốt" từ một khối văn bản markdown (đã strip thẻ máy). */
function extractBreaths(body: string): string[] {
  const clean = cleanLineNoise(body);
  if (!clean) return [];
  const breaths: string[] = [];

  // Bỏ dòng thẻ sự kiện máy ("[TIỀN BẠC] · ÁP LỰC · nhiệt 42") — nhãn đã được
  //yearCards bắt riêng; để lẫn vào sẽ làm câu chốt thành mớ mã.
  const proseLines = clean
    .split("\n")
    .filter((l) => !/^\[[^\]\n]{1,40}\]\s*·/.test(l.trim()))
    .join("\n");

  // (1) Câu mở đầu phần — prompt bắt buộc mỗi phần mở bằng kết luận.
  const paragraphs = proseLines.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 0);
  for (const p of paragraphs) {
    const sentences = splitSentences(p);
    for (const s of sentences) {
      if (s.length < 12) continue; // quá ngắn (tiêu đề rời) — bỏ
      breaths.push(clampSentence(s));
      if (breaths.length >= 2) break;
    }
    if (breaths.length >= 2) break;
  }

  // (2) Câu lời khuyên "NÊN/KHÔNG" — prompt bắt buộc cuối mỗi vùng hung có
  //     1 câu NÊN/KHÔNG may đo; đó là câu đắt nhất của phần.
  //     "NÊN" viết hoa là marker máy (case-sensitive) — cấm /i nếu không mọi
  //     "nên" thường sẽ được nhặt làm câu khuyên; "không nên" lowercase riêng.
  const adviceHit = splitSentences(proseLines).find((s) =>
    /(^|[\s—–-])NÊN(?![\p{L}])|không\s+nên/u.test(s),
  );
  if (adviceHit && !breaths.some((b) => adviceHit.startsWith(b.slice(0, 40)))) {
    breaths.push(clampSentence(adviceHit));
  }

  return breaths.slice(0, MAX_BREATHS_PER_SECTION);
}

/** Bắt nhãn thẻ sự kiện năm từ khối [TÓM NĂM] (trước khi strip thẻ máy). */
function extractYearCards(md: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>(["tóm năm", "đồng thuận", "bổ sung", "mâu thuẫn"]);
  const idx = md.search(/\[\s*TÓM\s*NĂM\s*\]/i);
  if (idx < 0) return out;
  // Quét tối đa 40 dòng sau [TÓM NĂM] hoặc đến heading kế tiếp.
  const tail = md.slice(idx).split("\n");
  let scanned = 0;
  for (const line of tail.slice(1)) {
    if (scanned > 40) break;
    if (/^#{1,4}\s/.test(line)) break;
    scanned++;
    const matches = line.matchAll(/\[([A-ZÀ-ỸĐ][^\]\n]{1,30})\]/gu);
    for (const m of matches) {
      const label = m[1].replace(/\s+/g, " ").trim();
      const key = label.toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(label);
      if (out.length >= 4) return out;
    }
  }
  return out;
}

interface RawSection {
  headingText: string;
  body: string;
}

/** Chia văn bản theo mọi heading markdown (##/###); đoạn trước heading đầu = mở đầu. */
function splitByHeadings(md: string): { opening: string; sections: RawSection[] } {
  const lines = md.split("\n");
  const sections: RawSection[] = [];
  let openingLines: string[] = [];
  let current: RawSection | null = null;
  for (const line of lines) {
    if (/^#{1,4}\s+\S/.test(line)) {
      if (current) sections.push(current);
      current = { headingText: line.replace(/^#{1,4}\s+/, "").trim(), body: "" };
    } else if (current) {
      current.body += `${line}\n`;
    } else {
      openingLines.push(line);
    }
  }
  if (current) sections.push(current);
  return { opening: openingLines.join("\n"), sections };
}

/** Gộp các section liên tiếp trùng id (Tự Phi + Độ sâu Tứ Hóa → 1 passage). */
function mergeById(passages: ZenPassage[]): ZenPassage[] {
  const out: ZenPassage[] = [];
  for (const p of passages) {
    const prev = out[out.length - 1];
    if (prev && prev.id === p.id) {
      prev.breaths = [...prev.breaths, ...p.breaths].slice(0, MAX_BREATHS_PER_SECTION);
      prev.full = `${prev.full}\n\n${p.full}`.trim();
      prev.merged = true;
    } else {
      out.push({ ...p });
    }
  }
  return out;
}

/**
 * Chưng cất bài luận giải thành bản đọc Zen.
 * Không ném lỗi với input bất kỳ (rỗng, garbage) — luôn trả kết quả hợp lệ.
 */
export function distillInterpretation(md: string | null | undefined): ZenDistillResult {
  const raw = String(md || "").trim();
  if (!raw) {
    return { passages: [], openingLine: "", yearCards: [], ok: false };
  }

  const yearCards = extractYearCards(raw);
  const { opening, sections } = splitByHeadings(raw);

  // Mở đầu — câu "linh hồn mệnh" (prompt bắt buộc đầu bài có 1 câu chốt).
  let openingLine = "";
  const openingClean = processMetadataInText(cleanLineNoise(opening), false);
  if (openingClean) {
    const s = splitSentences(openingClean).filter((x) => x.length >= 12);
    openingLine = clampSentence(s.slice(0, 2).join(" "), MAX_OPENING_CHARS);
  }

  if (sections.length === 0) {
    // Fallback cùng cực: bài không có heading nào — cả bài thành 1 passage.
    const body = processMetadataInText(raw, false);
    return {
      passages: [{ id: "toan-bo", title: "Bản chưng cất", breaths: extractBreaths(body), full: body }],
      openingLine,
      yearCards,
      ok: false,
    };
  }

  const passages: ZenPassage[] = sections.map((sec, i) => {
    const hit = SECTION_MAP.find((m) => m.kw.test(sec.headingText));
    // Strip thẻ máy TRƯỚC khi rút câu chốt — breaths không bao giờ dính [TAG].
    const full = processMetadataInText(sec.body.trim(), false);
    return {
      id: hit ? hit.id : `muc-${i}`,
      title: hit ? hit.title : sec.headingText.slice(0, 60) || `Mục ${i + 1}`,
      breaths: extractBreaths(full),
      full,
    };
  });

  const merged = mergeById(passages);
  // Passage rỗng hoàn toàn (0 breath + thân quá ngắn) → bỏ khỏi bản đọc.
  const meaningful = merged.filter((p) => p.breaths.length > 0 || p.full.replace(/\s+/g, "").length > 80);

  return {
    passages: meaningful,
    openingLine,
    yearCards,
    ok: merged.length >= 2,
  };
}
