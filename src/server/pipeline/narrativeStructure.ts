/**
 * A1 — CHẶNG 3: KIỂM TRA CẤU TRÚC BÀI LUẬN (KHÔNG GỌI API).
 *
 * Không bắt buộc bài phải có đúng chữ "Phần N" hay một kiểu heading cố định.
 * Bộ kiểm tra nhận diện phần theo nhiều cách:
 *  - heading số "1. **Tiêu đề**", "### 1. Tiêu đề", "1) Tiêu đề", "1 — Tiêu đề";
 *  - heading "Phần N", "PHẦN N — …", có hoặc không có dấu Markdown/bold;
 *  - nếu bài không đánh số nhưng nội dung đã có đúng mạch (bản sắc, đời sống,
 *    vận trình, nền tảng phúc báo) thì vẫn coi là đủ phần.
 *
 * Các mục nội dung bắt buộc cũng được nhận theo từ khóa/chủ đề, không đòi hỏi
 * heading nguyên văn. Chỉ BÁO CÁO (severity warning) — không tự sửa văn, không
 * dừng request: kết quả trả về client qua field `structureIssues`.
 */

import { starMentionedIn } from "./starCoverage";

export interface NarrativeStructureResult {
  expectedParts: number[];
  foundParts: number[];
  missingParts: number[];
  missingHeadings: string[];
}

/** Đo độ phủ sao: bao nhiêu sao trên lá được nhắc trong bài. */
export interface StarCoverageReport {
  total: number;
  mentioned: number;
  ratioPct: number;
  /** Tên sao bị bỏ sót (cap 20 để payload gọn). */
  missing: string[];
}

/**
 * partCount theo khung luận giải tinh gọn: 4 phần đánh số (1..4).
 * Phần 0 (Chân dung) và Kết luận 5 dòng được kiểm qua MANDATORY_HEADINGS.
 * Flag tháng chỉ thêm mục con "Tháng trọng tâm" trong Phần 3 — không đổi số phần.
 */
export const expectedInterpretPartCount = (): number => 4;

export const expectedInterpretParts = (): number[] =>
  Array.from({ length: expectedInterpretPartCount() }, (_, i) => i + 1);

/** Bỏ marker blockquote/heading Markdown để nhận diện nội dung bên trong. */
const normalizeHeadingLine = (line: string): string =>
  line
    .trim()
    .replace(/^>\s?/, "")
    .replace(/^#{1,6}\s+/, "")
    .trim();

const letterCount = (s: string): number => s.replace(/[^\p{L}]/gu, "").length;

/** Một tiêu đề phần đủ dài, không phải câu văn hoàn chỉnh. */
const looksLikeSectionTitle = (title: string): boolean => {
  const letters = letterCount(title);
  if (letters < 6 || letters > 120) return false;
  if (/[.!?]\s*$/.test(title)) return false;
  return title.split(/\s+/).filter(Boolean).length >= 2;
};

/**
 * Nhận diện heading mở phần theo nhiều định dạng thực tế của model:
 *  - `1. **TÊN PHẦN**`, `### 1. Tên phần`, `1) Tên phần`, `1 — Tên phần`
 *  - `Phần 3: Vận trình`, `**PHẦN 3 — …**`, `## PHẦN 3`
 * Không đòi hỏi IN HOA hay đúng chữ "Phần".
 */
const matchNumberedHeading = (line: string): number | null => {
  const t = normalizeHeadingLine(line);
  if (!t) return null;

  // Tách lớp bold ngoài cùng: "**1. Tên phần**" / "**Phần 3 — …**"
  const bold = t.match(/^\*\*(.+?)\*\*\s*[：:]?\s*$/);
  const source = (bold ? bold[1] : t).trim();

  // "Phần 3", "PHẦN 3 — Vận trình", "Phần 3: …"
  let m = source.match(/^phần\s*(\d{1,2})\b/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= expectedInterpretPartCount()) return n;
    return null;
  }

  // "1. …", "1) …", "1 — …" (kể cả khi cả dòng được bọc bold)
  m = source.match(/^(\d{1,2})\s*[.)]\s+(.+)$/);
  if (!m) m = source.match(/^(\d{1,2})\s*[-–—]\s+(.+)$/);
  if (m) {
    const n = parseInt(m[1], 10);
    const title = m[2].replace(/\*\*/g, "").replace(/[：:]\s*$/, "").trim();
    if (n >= 1 && n <= expectedInterpretPartCount() && looksLikeSectionTitle(title)) {
      return n;
    }
  }
  return null;
};

/** Dấu hiệu nội dung của từng phần — dùng khi bài không đánh số/không heading. */
const PART_TOPIC_HINTS: { part: number; re: RegExp }[] = [
  {
    part: 1,
    re: /bản\s*sắc|cơ\s*chế\s*vận\s*hành|bạn\s+là\s+ai|tính\s+va\s+đập|điểm\s*mù/i,
  },
  {
    part: 2,
    re: /đời\s*sống\s+thực\s*tế|sự\s*nghiệp|tài\s*lộc|tình\s*cảm|gia\s*đạo|sức\s*khỏe/i,
  },
  {
    part: 3,
    re: /vận\s*trình|đại\s*hạn|tiểu\s*hạn|lưu\s*niên|năm\s+nay/i,
  },
  {
    part: 4,
    re: /nền\s*tảng\s*phúc\s*báo|tổng\s*lực|đối\s*chiếu\s*chéo|phúc\s*đức|định\s*cách/i,
  },
];

const hasPartTopic = (part: number, text: string): boolean =>
  PART_TOPIC_HINTS.some((h) => h.part === part && h.re.test(text));

/**
 * Mục nội dung bắt buộc: nhận theo chủ đề/từ khóa, không đòi heading nguyên văn.
 * Mỗi mục có nhiều cách diễn đạt để tránh cảnh báo oan khi model đổi tiêu đề.
 */
const MANDATORY_HEADINGS: { label: string; re: RegExp }[] = [
  { label: "Chân dung & 3 trục chính", re: /chân\s*dung|3\s*trục|ba\s*trục|tam\s*trục/i },
  { label: "Tính va đập & Điểm mù", re: /tính\s+va\s+đập|va\s+đập|điểm\s*mù/i },
  { label: "Tự Phi Tứ Hóa", re: /tự\s*phi\s*tứ\s*hóa|tự\s*hóa|phi\s*hóa/i },
  { label: "Độ sâu Tứ Hóa", re: /độ\s*sâu\s*tứ\s*hóa|tứ\s*hóa|hóa\s*(?:lộc|quyền|khoa|kỵ)/i },
  { label: "Cấu trúc Sát Tinh", re: /cấu\s*trúc\s*sát\s*tinh|sát\s*tinh|sát\s*kỵ|hung\s*tinh/i },
  { label: "Sự nghiệp & Tài lộc", re: /sự\s*nghiệp|tài\s*lộc/i },
  { label: "Luận giải Tiểu Hạn", re: /luận\s*giải\s*tiểu\s*hạn|tiểu\s*hạn|lưu\s*niên/i },
  { label: "Các cung còn lại", re: /các\s*cung\s*còn\s*lại|cung\s*còn\s*lại|12\s*cung/i },
  { label: "Đối chiếu chéo Bát Tự", re: /đối\s*chiếu\s*chéo|bát\s*tự|tứ\s*trụ/i },
  { label: "Kết luận cuối 5 dòng", re: /kết\s*luận\s*cuối|kết\s*luận|5\s*dòng|năm\s*dòng/i },
];

export interface NarrativeStructureOptions {
  /**
   * Khi lá không có dữ liệu Bát Tự, khung cho phép bỏ mục "Đối chiếu chéo Bát Tự".
   * Mặc định true để giữ nguyên hành vi cũ với lá đầy đủ.
   */
  requireBaZi?: boolean;
}

export function validateNarrativeStructure(
  rawText: string,
  options?: NarrativeStructureOptions,
): NarrativeStructureResult {
  const text = String(rawText ?? "").replace(/\r\n?/g, "\n");
  const expectedParts = expectedInterpretParts();

  const foundParts: number[] = [];
  let expectedNum = 1;
  let inFence = false;
  const lines = text.split("\n");

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const num = matchNumberedHeading(line);
    if (num !== null) {
      // Chỉ nhận dãy liên tục 1,2,3… — tránh bắt sub-item trong thân phần (giống client).
      if (num === expectedNum || num === expectedNum + 1) {
        foundParts.push(num);
        expectedNum = num + 1;
      }
    }
  }

  const missingParts = expectedParts.filter(
    (n) => !foundParts.includes(n) && !hasPartTopic(n, text),
  );
  const requiredHeadings =
    options?.requireBaZi === false
      ? MANDATORY_HEADINGS.filter((h) => h.label !== "Đối chiếu chéo Bát Tự")
      : MANDATORY_HEADINGS;
  const missingHeadings = requiredHeadings.filter((h) => !h.re.test(text)).map((h) => h.label);

  return {
    expectedParts,
    foundParts,
    missingParts,
    missingHeadings,
  };
}

/**
 * Đo % sao trên lá thực sự được nhắc trong bài luận — "mỏng" thành con số.
 * Nhận universe đã lọc từ collectChartStarUniverse (không nhãn nhập nhằng).
 * Khớp theo ranh giới chữ + phân biệt hoa/thường (starMentionedIn).
 */
export function validateStarCoverage(
  text: string,
  universe: string[],
  options?: { missingCap?: number },
): StarCoverageReport {
  const t = String(text ?? "");
  const cap = options?.missingCap ?? 20;
  const missing: string[] = [];
  let mentioned = 0;

  for (const name of universe) {
    if (starMentionedIn(name, t)) {
      mentioned++;
    } else if (missing.length < cap) {
      missing.push(name);
    }
  }

  const total = universe.length;
  return {
    total,
    mentioned,
    ratioPct: total ? Math.round((mentioned / total) * 100) : 0,
    missing,
  };
}
