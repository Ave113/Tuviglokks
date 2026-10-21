/**
 * Interpretation Validation Script.
 * Runs before returning interpretation result to the user.
 *
 * Performs 4 Mandatory Checks:
 * 1. Check Nhất quán Tứ Hóa (Verifies natal Tu Hoa stars match birth heavenly stem)
 * 2. Check Năm Luận Hạn (Verifies transit year references match chartData.transitYear)
 * 3. Check Mệnh / Thân (Verifies correct palace names, branches, and Than residence)
 * 4. Check Độ sâu đường bay Mệnh / Phúc Đức (chỉ cảnh báo cho bài luận dài)
 *
 * Nguyên tắc an toàn của Check 1 (Tứ Hóa): chỉ TỰ ĐỘNG SỬA khi câu khẳng định
 * rõ ràng là SAI cho can năm sinh. Mọi câu PHỦ ĐỊNH / SO SÁNH ("không phải",
 * "không giống", "khác với"…) hoặc câu nói về CAN/NĂM KHÁC ("của năm Kỷ",
 * "đối chiếu can Bính") phải được GIỮ NGUYÊN — tuyệt đối không rewrite, vì
 * rewrite sai vào văn bản đúng còn nguy hại hơn lỗi gốc của AI.
 */

import { TU_HOA_BY_STEM, HOA_LABELS, normalizeHeavenlyStem, extractBirthHeavenlyStem, getNatalTuHoaQuartet, stemNameByYear } from "../utils/tuHoa";
import { normalizeStarName } from "../utils/chartRelations";

export interface ValidationIssue {
  type: "tu_hoa" | "transit_year" | "menh_than";
  severity: "warning" | "corrected";
  message: string;
}

export interface ValidationResult {
  text: string;
  isValid: boolean;
  issues: ValidationIssue[];
}

// ----------------------------------------------------------------------------
// Helper ngữ cảnh câu: phân tích cửa sổ văn bản quanh 1 match để quyết định
// (a) bỏ qua hoàn toàn — câu phủ định/so sánh hoặc nói về can khác;
// (b) cho phép sửa — khẳng định sai rõ ràng về can năm sinh.
// ----------------------------------------------------------------------------

/** Cắt lấy mệnh đề chứa vị trí match (không vượt ranh giới câu / xuống dòng). */
const clauseBefore = (text: string, pos: number, maxLen = 72): string => {
  const start = Math.max(0, pos - maxLen);
  const window = text.slice(start, pos);
  const boundary = Math.max(
    window.lastIndexOf("."),
    window.lastIndexOf("!"),
    window.lastIndexOf("?"),
    window.lastIndexOf("\n"),
    window.lastIndexOf(";"),
  );
  return boundary >= 0 ? window.slice(boundary + 1) : window;
};

const clauseAfter = (text: string, end: number, maxLen = 72): string => {
  const window = text.slice(end, end + maxLen);
  const boundary = Math.min(
    ...[window.indexOf("."), window.indexOf("!"), window.indexOf("?"), window.indexOf("\n"), window.indexOf(";")]
      .filter((i) => i >= 0)
      .concat([window.length]),
  );
  return window.slice(0, boundary);
};

/**
 * Phủ định / so sánh đứng TRƯỚC claim (trong cùng mệnh đề) → câu gốc đúng, cấm sửa.
 * Chỉ nhận cấu trúc phủ định/so sánh thật; "không may, …" hay "như đã nói, …"
 * phải Không bị liệt vào đây để vẫn sửa được sai sót thật.
 */
const NEG_CLAIM_RE = new RegExp(
  "(?:không|chẳng|chưa|khác|giống|so\\s+(?:sánh\\s+)?với|trừ)" +
    "(?:(?:\\s+(?:phải|là|giống|như|với|so|sánh|hẳn|nhau|khi|ngoài|tới|đến|với\\s+nghĩa|hoàn toàn|hoàn_toàn))|\\s)*" +
    "(?:[\\p{P}\\p{S}]|\\s)*$",
  "iu",
);

const isNegatedClaim = (clause: string): boolean => {
  const tail = clause.slice(-40);
  return NEG_CLAIM_RE.test(tail.trimEnd());
};

/**
 * Cụm định vị can/năm trong mệnh đề: "can Bính", "năm Kỷ", "năm 1990", "lá Ất"…
 * Dùng lookahead zero-width để MỌI vị trí được quét — không bị nuốt mất cụm
 * chồng lấn kiểu "lá can Ất" (nếu không, "lá can" chiếm chữ "can" và ta mất
 * "can Ất" — bug thật đã bắt được khi test).
 */
const QUALIFIER_RE = /(?=(can|năm|lá|cục|tháng)\s+([A-Za-zÀ-ỹ0-9]{1,12}))/giu;

/** Quy token định vị về Thiên can (nếu được). Token lạ → null (không phải can). */
const resolveQualifierStem = (token: string): string | null => {
  if (/^\d{4}$/.test(token)) return stemNameByYear(Number(token));
  return normalizeHeavenlyStem(token) || null;
};

/**
 * Tìm can KHÁC can năm sinh được nhắc trong mệnh đề trước/sau claim.
 * Trả về can đó nếu có (→ claim đang nói về lá/can khác, cấm sửa),
 * null nếu mệnh đề thuần túy nói về can năm sinh.
 */
const crossCanQualifier = (
  before: string,
  after: string,
  birthStem: string,
): string | null => {
  const scan = (clause: string, fromEnd: boolean): string | null => {
    const hits = [...clause.matchAll(QUALIFIER_RE)];
    if (hits.length === 0) return null;
    const ordered = fromEnd ? [...hits].reverse() : hits;
    for (const m of ordered) {
      const stem = resolveQualifierStem(m[2]);
      if (stem && stem !== birthStem) return stem;
    }
    return null;
  };
  // Ưu tiên cụm gần claim nhất: mệnh đề trước quét từ cuối lên, sau quét từ đầu.
  return scan(before, true) || scan(after, false);
};

// ----------------------------------------------------------------------------

export function validateInterpretation(
  rawText: string,
  chartData: any,
  options?: { requirePsychFlight?: boolean },
): ValidationResult {
  let text = String(rawText || "");
  const issues: ValidationIssue[] = [];
  const seenIssues = new Set<string>();
  const pushIssue = (issue: ValidationIssue) => {
    const key = `${issue.type}|${issue.message}`;
    if (seenIssues.has(key)) return;
    seenIssues.add(key);
    issues.push(issue);
  };

  if (!text.trim() || !chartData) {
    return { text, isValid: true, issues };
  }

  // =========================================================================
  // 1. CHECK NĂM LUẬN HẠN (Transit Year Check)
  // =========================================================================
  const expectedTransitYear = Number(chartData.transitYear) || new Date().getFullYear();

  // Quét các tiêu đề hoặc dòng nhắc năm xem hạn
  // e.g. "Tiểu hạn năm 2024", "Vận trình năm 2025", "Lưu niên năm 2024"
  const wrongYearRegex = new RegExp(
    `(tiểu\\s*hạn\\s*năm|vận\\s*trình\\s*năm|luận\\s*giải\\s*năm|lưu\\s*niên\\s*năm|năm\\s*xem\\s*hạn|năm\\s*hạn)\\s*(\\d{4})`,
    "gi",
  );

  text = text.replace(wrongYearRegex, (match, prefix, yearStr) => {
    const yearNum = Number(yearStr);
    if (yearNum !== expectedTransitYear && Math.abs(yearNum - expectedTransitYear) <= 5) {
      pushIssue({
        type: "transit_year",
        severity: "corrected",
        message: `Đã chuẩn hóa năm xem hạn từ ${yearNum} về đúng năm ${expectedTransitYear}.`,
      });
      return `${prefix} ${expectedTransitYear}`;
    }
    return match;
  });

  // =========================================================================
  // 2. CHECK NHẤT QUÁN TỨ HÓA (Natal Tu Hoa Consistency Check)
  // Chỉ sửa khi: khẳng định dương về "<sao sai> <Hóa X> bẩm sinh" trong mệnh đề
  // thuần túy nói về can năm sinh. Phủ định / so sánh / can khác → GIỮ NGUYÊN.
  // =========================================================================
  const birthStem =
    extractBirthHeavenlyStem(chartData, chartData.birthLunarYear) ||
    normalizeHeavenlyStem(chartData.birthHeavenlyStem);
  const expectedQuartet = birthStem ? getNatalTuHoaQuartet(birthStem) : null;

  if (expectedQuartet && birthStem) {
    // expected: [Lộc, Quyền, Khoa, Kỵ]
    // Hai hình thái claim, có capture để dựng lại văn bản GIỮ nguyên tượng hình:
    // A) "<sao sai> [thụ phong|thủ phong|được|có|đắc|thủ] <Hóa X> bẩm sinh"
    // B) "<Hóa X> bẩm sinh [là|rơi vào|thuộc|ở|chính là] <sao sai>"
    type ClaimPattern = {
      re: RegExp;
      wrongStar: string;
      rightStar: string;
      hoaLabel: string;
      rebuild: (m: RegExpMatchArray) => string;
    };
    const claimPatterns: ClaimPattern[] = [];

    for (const [stem, quartet] of Object.entries(TU_HOA_BY_STEM)) {
      if (stem === birthStem) continue;

      // Quét từng Hóa (0: Lộc, 1: Quyền, 2: Khoa, 3: Kỵ)
      for (let hIdx = 0; hIdx < 4; hIdx++) {
        const wrongStar = quartet[hIdx];
        const rightStar = expectedQuartet[hIdx];
        const hoaLabel = HOA_LABELS[hIdx];

        if (wrongStar === rightStar) continue;

        const wrong = wrongStar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const right = rightStar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const hoa = hoaLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        claimPatterns.push({
          wrongStar,
          rightStar,
          hoaLabel,
          // A) sao đứng trước — capture động từ thụ hóa để dựng lại đúng văn phong
          re: new RegExp(
            `(${wrong})\\s*(?:(thụ\\s*phong|thủ\\s*phong|được|có|đắc|thủ)\\s*)?(${hoa})\\s*bẩm\\s*sinh`,
            "gi",
          ),
          rebuild: (m) =>
            `${right}${m[2] ? ` ${m[2].replace(/\s+/g, " ")}` : ""} ${hoaLabel} bẩm sinh`,
        });
        claimPatterns.push({
          wrongStar,
          rightStar,
          hoaLabel,
          // B) nhãn Hóa đứng trước — capture từ nối để dựng lại đúng văn phong
          re: new RegExp(
            `(${hoa})\\s*bẩm\\s*sinh\\s*((?:chính\\s*là|là|rơi\\s*vào|thuộc|ở)\\s*)?(${wrong})`,
            "gi",
          ),
          rebuild: (m) =>
            `${hoaLabel} bẩm sinh${m[2] ? ` ${m[2].replace(/\s+/g, " ")}` : " "}${right}`,
        });
      }
    }

    for (const pattern of claimPatterns) {
      const matches = [...text.matchAll(pattern.re)];
      if (matches.length === 0) continue;
      let out = "";
      let last = 0;
      let touched = false;
      for (const m of matches) {
        const start = m.index ?? 0;
        const end = start + m[0].length;
        const before = clauseBefore(text, start);
        const after = clauseAfter(text, end);

        // (a) Phủ định / so sánh trước claim → câu gốc đúng, giữ nguyên.
        if (isNegatedClaim(before)) continue;
        // (b) Mệnh đề nhắc tới can/năm KHÁC can sinh ("của năm Kỷ", "can Bính…")
        //     → đang nói về lá khác, giữ nguyên.
        if (crossCanQualifier(before, after, birthStem)) continue;

        out += text.slice(last, start) + pattern.rebuild(m);
        last = end;
        touched = true;
        pushIssue({
          type: "tu_hoa",
          severity: "corrected",
          message: `Phát hiện nhầm lẫn Tứ Hóa bẩm sinh can ${birthStem}: ${pattern.wrongStar} không phải là ${pattern.hoaLabel} bẩm sinh (đúng là ${pattern.rightStar}).`,
        });
      }
      if (touched) {
        text = out + text.slice(last);
      }
    }
  }

  // =========================================================================
  // 3. CHECK MỆNH / THÂN (Menh & Than Palace Check)
  // =========================================================================
  const palaces = Array.isArray(chartData.palaces) ? chartData.palaces : [];
  const menhPalace = palaces.find((p: any) => {
    const n = normalizeStarName(p?.name);
    return n === "mệnh" || n === "menh" || n.includes("mệnh") || n.includes("menh");
  });
  const thanPalace = palaces.find((p: any) => p?.isBodyPalace === true);

  if (menhPalace) {
    const menhBranch = menhPalace.earthlyBranch;
    // Kiểm tra nếu văn bản viết nhầm "Mệnh đóng tại [sai chi]" hoặc "Mệnh cư [sai chi]"
    if (menhBranch) {
      const wrongMenhBranchRegex = new RegExp(
        `(cung\\s*mệnh\\s*(?:đóng\\s*tại|tọa\\s*thủ\\s*tại|an\\s*tại|cư\\s*tại|tại)\\s*)(?:cung\\s*)?(Tý|Sửu|Dần|Mão|Thìn|Tỵ|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)`,
        "gi",
      );
      text = text.replace(wrongMenhBranchRegex, (match, prefix, branchFound) => {
        if (branchFound.toLowerCase() !== menhBranch.toLowerCase()) {
          pushIssue({
            type: "menh_than",
            severity: "corrected",
            message: `Chuẩn hóa vị trí cung Mệnh từ ${branchFound} về đúng chi ${menhBranch}.`,
          });
          return `${prefix}${menhBranch}`;
        }
        return match;
      });
    }
  }

  const ALL_12_PALACES = [
    "Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc",
    "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ",
  ];

  if (thanPalace) {
    const isDongCung = normalizeStarName(thanPalace.name) === "mệnh" || normalizeStarName(thanPalace.name) === "menh";
    if (isDongCung) {
      // Thân Mệnh đồng cung: sửa nếu AI nhầm sang cung khác
      const otherNames = ALL_12_PALACES.filter((n) => n !== "Mệnh").join("|");
      const wrongThanRegex = new RegExp(`thân\\s*cư\\s*(${otherNames})`, "gi");
      if (wrongThanRegex.test(text)) {
        pushIssue({
          type: "menh_than",
          severity: "corrected",
          message: "Lá số có Thân Mệnh đồng cung, đã chuẩn hóa chỉ định cung Thân.",
        });
        text = text.replace(wrongThanRegex, "Thân Mệnh đồng cung");
      }
    } else {
      // Thân cư cung khác: kiểm tra nếu AI viết nhầm Thân cư sang cung sai
      const validTarget = thanPalace.name;
      const otherPalaces = ALL_12_PALACES.filter(
        (n) => n.toLowerCase() !== validTarget.toLowerCase(),
      );
      const wrongOtherThanRegex = new RegExp(
        `thân\\s*cư\\s*(${otherPalaces.join("|")})`,
        "gi",
      );
      if (wrongOtherThanRegex.test(text)) {
        pushIssue({
          type: "menh_than",
          severity: "corrected",
          message: `Chuẩn hóa chỉ định cung Thân về đúng Thân cư ${validTarget}.`,
        });
        text = text.replace(wrongOtherThanRegex, `Thân cư ${validTarget}`);
      }
    }
  }

  // =========================================================================
  // 4. CHECK ĐỘ SÂU ĐƯỜNG BAY TÂM LÝ TỪ MỆNH / PHÚC ĐỨC (chỉ áp dụng cho bài luận dài)
  // Phải nhận diện được CẢ ngữ khối máy phát ra ("TỪ CUNG MỆNH (Can X…)…",
  // "Tự Hóa tại bản cung", "Phi Hóa xuất", "Cung Mệnh phi Hóa…") lẫn văn AI
  // tự viết ("Mệnh phi Hóa Kỵ", "đường bay từ Phúc Đức"…).
  // =========================================================================
  // Check độ sâu đường bay Mệnh/Phúc Đức chỉ thuộc contract của bài luận dài
  // (interpret) — câu trả lời chat ngắn/đa chủ đề không bắt buộc.
  if (options?.requirePsychFlight !== false && text.length > 400) {
    // "Mệnh/Phúc [Đức] [(can X)] [can X] phi Hóa…" — bắt cả "Cung Mệnh phi Hóa phản ánh…"
    const phiFromCore =
      /(?:cung\s+)?(?:mệnh|phúc(?:\s*đức)?)\s*(?:\(\s*can\s*[^)\n]{1,16}\s*\)\s*)?(?:can\s*[^\s,.)\n]{1,12}\s*)?phi\s*hóa/i.test(text) ||
      /(?:cung\s+)?(?:mệnh|phúc(?:\s*đức)?)\s*(?:\(\s*can\s*[^)\n]{1,16}\s*\)\s*)?(?:can\s*[^\s,.)\n]{1,12}\s*)?phi\s*(?:hóa\s*)?(?:lộc|quyền|khoa|kỵ)/i.test(text);
    // Ngữ khối máy: "Tự Hóa tại bản cung" / "Phi Hóa xuất" gần khối Mệnh/Phúc
    const blockVocabulary =
      /tự\s*hóa\s*tại\s*bản\s*cung/i.test(text) ||
      /từ\s+cung\s+(?:mệnh|phúc(?:\s*đức)?)[^\n]{0,120}(?:\n[^\n]{0,120}){0,2}(?:tự\s*hóa|phi\s*hóa)/i.test(text) ||
      /(?:cung\s+(?:mệnh|phúc(?:\s*đức)?)\s*\(\s*can)[^\n]{0,160}(?:tự\s*hóa|phi\s*hóa)/i.test(text);
    // Văn AI tự viết: "đường bay từ Mệnh/Phúc…"
    const flightPhrase = /đường\s*bay[^\n.!?]{0,50}(?:mệnh|phúc)/i.test(text);

    const hasPsychFlight = phiFromCore || blockVocabulary || flightPhrase;

    if (!hasPsychFlight) {
      pushIssue({
        type: "tu_hoa",
        severity: "warning",
        message: "Bài luận giải chưa phân tích rõ ràng đường bay Phi Tứ Hóa từ Cung Mệnh hoặc Cung Phúc Đức.",
      });
    }
  }

  return {
    text,
    isValid: true,
    issues,
  };
}
