/**
 * Tuần / Triệt / Không Vong — quét từ sao THỰC CÓ trên lá (iztro adjectiveStars).
 *
 * iztro vi-VN quan sát: "Tuần Không", "Triệt Lộ", "Không Vong"
 * (+ dự phòng "Tuần Trung", "Triệt Không" nếu locale/engine đổi).
 *
 * KHÔNG tự tính lại công thức can-chi Tuần-Triệt — chỉ đọc sao engine đã an.
 * Tránh nhầm với Địa Không / Thiên Không / Địa Kiếp.
 */

import {
  allStarsOf,
  BRANCHES_VI,
  normalizeStarName,
  toBranchIndex,
} from "./chartRelations";

export type TuanTrietKind = "tuan" | "triet" | "khongVong";

export interface TuanTrietStarHit {
  name: string;
  kind: TuanTrietKind;
}

export interface TuanTrietPalaceHit {
  palaceName: string;
  earthlyBranch: string;
  branchIdx: number;
  isBodyPalace: boolean;
  isKeyPalace: boolean;
  stars: TuanTrietStarHit[];
  kinds: TuanTrietKind[];
}

export interface TuanTrietAnalysis {
  hits: TuanTrietPalaceHit[];
  tuanPalaces: string[];
  trietPalaces: string[];
  khongVongPalaces: string[];
  keyPalaceHits: TuanTrietPalaceHit[];
}

/** Tên exact (sau normalize) thuộc họ Tuần. */
const TUAN_NORMS = new Set(
  ["Tuần Không", "Tuần Trung"].map(normalizeStarName),
);

/** Tên exact thuộc họ Triệt. */
const TRIET_NORMS = new Set(
  ["Triệt Lộ", "Triệt Không"].map(normalizeStarName),
);

const KHONG_VONG_NORMS = new Set(["Không Vong"].map(normalizeStarName));

/** Cung trọng — nhắc AI ưu tiên khi hạ giọng cách/cục. */
const KEY_PALACE_KWS = ["Mệnh", "Tài", "Quan", "Phúc", "Phu", "Tật", "Di", "Điền", "Thân"];

const KIND_LABEL: Record<TuanTrietKind, string> = {
  tuan: "TUẦN (giảm lực / 'trống' khí cung — không xóa sạch cách)",
  triet: "TRIỆT (chặn/cắt lộ trình — đứt đoạn, khó thông)",
  khongVong: "KHÔNG VONG (hư không — kết quả khó giữ, dễ 'có rồi không')",
};

const KIND_SHORT: Record<TuanTrietKind, string> = {
  tuan: "Tuần",
  triet: "Triệt",
  khongVong: "Không Vong",
};

/**
 * Phân loại 1 tên sao. Trả null nếu không phải Tuần/Triệt/Không Vong.
 * An toàn: không match "Thiên Không", "Địa Không", "Địa Kiếp".
 */
export function classifyTuanTrietStar(rawName: string): TuanTrietKind | null {
  const norm = normalizeStarName(rawName);
  if (!norm) return null;
  // Loại trừ không diệu / sát dễ nhầm
  if (
    norm === normalizeStarName("Địa Không") ||
    norm === normalizeStarName("Địa Kiếp") ||
    norm === normalizeStarName("Thiên Không") ||
    norm === normalizeStarName("Kiếp Sát")
  ) {
    return null;
  }
  if (TUAN_NORMS.has(norm)) return "tuan";
  if (TRIET_NORMS.has(norm)) return "triet";
  if (KHONG_VONG_NORMS.has(norm)) return "khongVong";
  // Fallback mềm: "tuần …" / "triệt …" nhưng không phải chuỗi lạ
  if (/^tuần\b/u.test(norm) || norm.includes("tuần không") || norm.includes("tuần trung")) {
    return "tuan";
  }
  if (/^triệt\b/u.test(norm) || norm.includes("triệt lộ") || norm.includes("triệt không")) {
    return "triet";
  }
  if (norm === "không vong" || norm.includes("không vong")) {
    return "khongVong";
  }
  return null;
}

function isKeyPalace(p: any): boolean {
  if (p?.isBodyPalace) return true;
  const name = String(p?.name || "");
  return KEY_PALACE_KWS.some((kw) => name.includes(kw));
}

/** Quét 12 cung — chỉ giữ cung có ≥1 sao Tuần/Triệt/Không Vong. */
export function analyzeTuanTriet(palacesArr: any[]): TuanTrietAnalysis {
  const hits: TuanTrietPalaceHit[] = [];

  for (const p of palacesArr || []) {
    const stars: TuanTrietStarHit[] = [];
    const kindSet = new Set<TuanTrietKind>();
    for (const s of allStarsOf(p)) {
      const raw = String(s?.name || "").replace(/\[SAO LƯU\]\s*/gi, "").trim();
      const kind = classifyTuanTrietStar(raw);
      if (!kind) continue;
      // Tránh trùng tên sau chuẩn hóa
      if (stars.some((x) => normalizeStarName(x.name) === normalizeStarName(raw))) continue;
      stars.push({ name: raw, kind });
      kindSet.add(kind);
    }
    if (stars.length === 0) continue;
    const branchIdx = toBranchIndex(p.index);
    hits.push({
      palaceName: String(p.name || "?"),
      earthlyBranch: BRANCHES_VI[branchIdx] || String(p.earthlyBranch || "?"),
      branchIdx,
      isBodyPalace: Boolean(p.isBodyPalace),
      isKeyPalace: isKeyPalace(p),
      stars,
      kinds: [...kindSet],
    });
  }

  const pick = (k: TuanTrietKind) =>
    hits.filter((h) => h.kinds.includes(k)).map((h) => h.palaceName);

  return {
    hits,
    tuanPalaces: pick("tuan"),
    trietPalaces: pick("triet"),
    khongVongPalaces: pick("khongVong"),
    keyPalaceHits: hits.filter((h) => h.isKeyPalace),
  };
}

/**
 * Cheat sheet cho prompt interpret/chat.
 * Trung tính: chỉ nêu chỗ + loại + quy tắc dùng — không phán cát/hung tuyệt đối.
 */
export function buildTuanTrietReport(palacesArr: any[]): string {
  const analysis = analyzeTuanTriet(palacesArr);
  if (analysis.hits.length === 0) {
    return [
      "  - Hệ thống KHÔNG thấy sao Tuần Không / Tuần Trung / Triệt Lộ / Triệt Không / Không Vong trên 12 cung.",
      "  - TUYỆT ĐỐI không tự gán Tuần/Triệt cho cung nào. (Khác Địa Không–Địa Kiếp — đó là Không diệu, đã liệt ở vùng sát nếu có.)",
    ].join("\n");
  }

  const lines: string[] = [];
  lines.push(
    "  Dữ liệu quét từ sao engine đã an trên lá (iztro). CHỈ được nói Tuần/Triệt/Không Vong tại các cung dưới — cấm bịa thêm cung.",
  );
  lines.push(
    "  Phân biệt: Tuần ≈ giảm lực/'trống' khí; Triệt ≈ chặn/cắt lộ; Không Vong ≈ hư không khó giữ. KHÔNG đồng nhất với Địa Không/Địa Kiếp/Thiên Không.",
  );
  lines.push("");

  for (const h of analysis.hits) {
    const tags = h.kinds.map((k) => KIND_SHORT[k]).join("+");
    const starStr = h.stars.map((s) => `${s.name}[${KIND_SHORT[s.kind]}]`).join(", ");
    const flags = [
      h.isBodyPalace ? "CUNG THÂN" : "",
      h.isKeyPalace ? "cung trọng" : "",
    ]
      .filter(Boolean)
      .join(", ");
    lines.push(
      `  - ${h.palaceName} (${h.earthlyBranch})${flags ? ` [${flags}]` : ""}: ${starStr} → ${tags}`,
    );
  }

  // Tóm theo loại
  lines.push("");
  if (analysis.tuanPalaces.length) {
    lines.push(`  * Họ TUẦN tại: ${analysis.tuanPalaces.join(", ")} — ${KIND_LABEL.tuan}`);
  }
  if (analysis.trietPalaces.length) {
    lines.push(`  * Họ TRIỆT tại: ${analysis.trietPalaces.join(", ")} — ${KIND_LABEL.triet}`);
  }
  if (analysis.khongVongPalaces.length) {
    lines.push(
      `  * KHÔNG VONG tại: ${analysis.khongVongPalaces.join(", ")} — ${KIND_LABEL.khongVong}`,
    );
  }

  if (analysis.keyPalaceHits.length > 0) {
    const keyStr = analysis.keyPalaceHits
      .map((h) => `${h.palaceName}(${h.kinds.map((k) => KIND_SHORT[k]).join("+")})`)
      .join("; ");
    lines.push("");
    lines.push(
      `  * CUNG TRỌNG bị ảnh hưởng: ${keyStr}. Khi luận cách cục / định cách phú quý / Mệnh–Tài–Quan: BẮT BUỘC hạ giọng mức phát (không phủ nhận cách nếu còn cát, nhưng giảm lực ~một nửa theo kinh nghiệm — 'CÓ XU HƯỚNG').`,
    );
  } else {
    lines.push("");
    lines.push(
      "  * Tuần/Triệt/Không Vong KHÔNG đóng cung trọng (Mệnh/Thân/Tài/Quan/Phúc…): nhắc ngắn theo đúng cung bị chiếu; không phóng đại thành 'cả đời bị Tuần'.",
    );
  }

  lines.push(
    "  * Quy tắc an toàn: chỉ nêu khi cung đó có trong danh sách trên; sát tinh bị Tuần/Triệt cũng giảm hung — đừng vừa nói 'Tuần Mệnh' vừa thổi phồng sát như không có Tuần.",
  );

  return lines.join("\n");
}
