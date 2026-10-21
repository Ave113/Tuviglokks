/**
 * Tuần / Triệt / Không Vong
 *
 * 1) RECOMPUTE khóa 2 cung theo can–chi năm (chuẩn phổ biến Đẩu Số):
 *    - Tuần (旬空): 2 chi trống theo tuần lục thập của năm
 *    - Triệt (截路): 2 chi theo can năm
 * 2) QUÉT nhãn engine iztro (Tuần Không, Triệt Lộ, Không Vong…) để đối chiếu / hiển thị.
 *
 * Report ưu tiên cặp 2 cung đã tính; nhãn engine chỉ bổ sung, không thu hẹp xuống 1 cung.
 */

import {
  allStarsOf,
  BRANCHES_VI,
  giapBranches,
  normalizeStarName,
  toBranchIndex,
} from "./chartRelations";
import { stemIndexByYear } from "./tuHoa";

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
  /** Nguồn: rule recompute và/hoặc nhãn engine. */
  sources: Array<"rule" | "engine">;
}

/** Cung bị "giáp" — kề một chi đã bị Tuần/Triệt khóa (dữ liệu cho luận "Tuần giáp"/"Triệt giáp"). */
export interface TuanTrietGiapHit {
  palaceName: string;
  earthlyBranch: string;
  branchIdx: number;
  isKeyPalace: boolean;
  /** Chi kề bị Tuần khóa (rỗng nếu cung nằm trực tiếp trên Tuần hoặc không giáp Tuần). */
  tuanSides: number[];
  /** Chi kề bị Triệt khóa. */
  trietSides: number[];
}

export interface TuanTrietAnalysis {
  hits: TuanTrietPalaceHit[];
  tuanPalaces: string[];
  trietPalaces: string[];
  khongVongPalaces: string[];
  keyPalaceHits: TuanTrietPalaceHit[];
  /** Cung bị giáp (kề chi đã bị khóa) — luận "giáp" nhẹ hơn đóng trực tiếp. */
  giapHits: TuanTrietGiapHit[];
  /** Chi index 0..11 — khóa 2 cung (rule). */
  tuanBranches: number[];
  trietBranches: number[];
  birthYearUsed?: number;
}

export interface TuanTrietOptions {
  /** Năm âm (hoặc năm dùng can–chi năm sinh) — bắt buộc để recompute 2+2 cung. */
  birthYear?: number;
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
  khongVong: "KHÔNG VONG (hư không — kết quả khó giữ, dễ 'có rồi không'; có thể là nửa khóa Triệt/Tuần)",
};

const KIND_SHORT: Record<TuanTrietKind, string> = {
  tuan: "Tuần",
  triet: "Triệt",
  khongVong: "Không Vong",
};

/**
 * Tuần Không — 2 chi trống theo tuần lục thập của năm.
 * sexagenary index (year-4)%60 ∈ 甲子旬…甲寅旬 → cặp trống.
 */
export function computeTuanBranches(year: number): [number, number] {
  const sexagenary = ((year - 4) % 60 + 60) % 60;
  const xun = Math.floor(sexagenary / 10) % 6;
  const pairs: [number, number][] = [
    [10, 11], // 甲子旬 → Tuất Hợi
    [8, 9], // 甲戌旬 → Thân Dậu
    [6, 7], // 甲申旬 → Ngọ Mùi
    [4, 5], // 甲午旬 → Thìn Tỵ
    [2, 3], // 甲辰旬 → Dần Mão
    [0, 1], // 甲寅旬 → Tý Sửu
  ];
  return pairs[xun];
}

/**
 * Triệt lộ — theo can năm (bảng phổ biến):
 * Giáp/Kỷ→Thân Dậu, Ất/Canh→Ngọ Mùi, Bính/Tân→Thìn Tỵ, Đinh/Nhâm→Dần Mão, Mậu/Quý→Tý Sửu.
 */
export function computeTrietBranches(year: number): [number, number] {
  const stem = stemIndexByYear(year);
  // stemIndexByYear: 0 Canh … 4 Giáp … 9 Kỷ
  const map: Record<number, [number, number]> = {
    4: [8, 9],
    9: [8, 9], // Giáp Kỷ
    5: [6, 7],
    0: [6, 7], // Ất Canh
    6: [4, 5],
    1: [4, 5], // Bính Tân
    7: [2, 3],
    2: [2, 3], // Đinh Nhâm
    8: [0, 1],
    3: [0, 1], // Mậu Quý
  };
  return map[stem] ?? [0, 1];
}

/**
 * Phân loại 1 tên sao. Trả null nếu không phải Tuần/Triệt/Không Vong.
 * An toàn: không match "Thiên Không", "Địa Không", "Địa Kiếp".
 */
export function classifyTuanTrietStar(rawName: string): TuanTrietKind | null {
  const norm = normalizeStarName(rawName);
  if (!norm) return null;
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

function branchLabels(branches: number[]): string {
  return branches.map((b) => BRANCHES_VI[b] || `?${b}`).join("–");
}

function palaceLineForBranch(
  palaceByBranch: Map<number, any>,
  branchIdx: number,
): { palaceName: string; earthlyBranch: string; palace: any | undefined } {
  const p = palaceByBranch.get(branchIdx);
  return {
    palaceName: p ? String(p.name || "?") : `Chi ${BRANCHES_VI[branchIdx]}`,
    earthlyBranch: BRANCHES_VI[branchIdx] || "?",
    palace: p,
  };
}

/** Quét nhãn engine trên 12 cung. */
function scanEngineLabels(palacesArr: any[]): Map<number, TuanTrietStarHit[]> {
  const byBranch = new Map<number, TuanTrietStarHit[]>();
  for (const p of palacesArr || []) {
    const branchIdx = toBranchIndex(p.index);
    const stars: TuanTrietStarHit[] = [];
    for (const s of allStarsOf(p)) {
      const raw = String(s?.name || "").replace(/\[SAO\s*(?:LƯU|VẬN)\]\s*/gi, "").trim();
      const kind = classifyTuanTrietStar(raw);
      if (!kind) continue;
      if (stars.some((x) => normalizeStarName(x.name) === normalizeStarName(raw))) continue;
      stars.push({ name: raw, kind });
    }
    if (stars.length) byBranch.set(branchIdx, stars);
  }
  return byBranch;
}

/**
 * Phân tích Tuần/Triệt: rule 2+2 cung (nếu có birthYear) + nhãn engine.
 */
export function analyzeTuanTriet(
  palacesArr: any[],
  options: TuanTrietOptions = {},
): TuanTrietAnalysis {
  const palaceByBranch = new Map<number, any>();
  for (const p of palacesArr || []) {
    palaceByBranch.set(toBranchIndex(p.index), p);
  }

  const engineByBranch = scanEngineLabels(palacesArr);
  const birthYear =
    typeof options.birthYear === "number" && Number.isFinite(options.birthYear)
      ? Math.trunc(options.birthYear)
      : undefined;

  let tuanBranches: number[] = [];
  let trietBranches: number[] = [];
  if (birthYear != null) {
    tuanBranches = [...computeTuanBranches(birthYear)];
    trietBranches = [...computeTrietBranches(birthYear)];
  }

  // Gộp mọi branch cần hit
  const branchKinds = new Map<number, Set<TuanTrietKind>>();
  const branchSources = new Map<number, Set<"rule" | "engine">>();
  const branchStars = new Map<number, TuanTrietStarHit[]>();

  const ensure = (b: number) => {
    if (!branchKinds.has(b)) branchKinds.set(b, new Set());
    if (!branchSources.has(b)) branchSources.set(b, new Set());
    if (!branchStars.has(b)) branchStars.set(b, []);
  };

  for (const b of tuanBranches) {
    ensure(b);
    branchKinds.get(b)!.add("tuan");
    branchSources.get(b)!.add("rule");
    const stars = branchStars.get(b)!;
    if (!stars.some((s) => s.kind === "tuan")) {
      stars.push({ name: "Tuần (khóa rule)", kind: "tuan" });
    }
  }
  for (const b of trietBranches) {
    ensure(b);
    branchKinds.get(b)!.add("triet");
    branchSources.get(b)!.add("rule");
    const stars = branchStars.get(b)!;
    if (!stars.some((s) => s.kind === "triet")) {
      stars.push({ name: "Triệt (khóa rule)", kind: "triet" });
    }
  }

  for (const [b, engStars] of engineByBranch) {
    ensure(b);
    branchSources.get(b)!.add("engine");
    const kinds = branchKinds.get(b)!;
    const stars = branchStars.get(b)!;
    for (const s of engStars) {
      kinds.add(s.kind);
      // Thay placeholder rule bằng tên engine nếu cùng kind
      const placeholderIdx = stars.findIndex(
        (x) => x.kind === s.kind && /khóa rule/i.test(x.name),
      );
      if (placeholderIdx >= 0) {
        stars[placeholderIdx] = s;
      } else if (!stars.some((x) => normalizeStarName(x.name) === normalizeStarName(s.name))) {
        stars.push(s);
      }
    }
  }

  const hits: TuanTrietPalaceHit[] = [];
  const sortedBranches = [...branchKinds.keys()].sort((a, b) => a - b);
  for (const branchIdx of sortedBranches) {
    const { palaceName, earthlyBranch, palace } = palaceLineForBranch(palaceByBranch, branchIdx);
    const kinds = [...(branchKinds.get(branchIdx) || [])];
    const stars = branchStars.get(branchIdx) || [];
    const sources = [...(branchSources.get(branchIdx) || [])];
    hits.push({
      palaceName,
      earthlyBranch,
      branchIdx,
      isBodyPalace: Boolean(palace?.isBodyPalace),
      isKeyPalace: palace ? isKeyPalace(palace) : false,
      stars,
      kinds,
      sources,
    });
  }

  const pick = (k: TuanTrietKind) =>
    hits.filter((h) => h.kinds.includes(k)).map((h) => h.palaceName);

  // GIÁP: cung kề một chi đã bị khóa (b±1). Cung nằm TRỰC TIẾP trên khóa KHÔNG
  // tính là giáp (nó là cung bị khóa — đã nằm trong hits).
  const giapHits: TuanTrietGiapHit[] = [];
  if (birthYear != null) {
    for (const [b, palace] of palaceByBranch) {
      const giapTuan = tuanBranches.includes(b)
        ? []
        : giapBranches(b).filter((n) => tuanBranches.includes(n));
      const giapTriet = trietBranches.includes(b)
        ? []
        : giapBranches(b).filter((n) => trietBranches.includes(n));
      if (giapTuan.length === 0 && giapTriet.length === 0) continue;
      const { palaceName, earthlyBranch } = palaceLineForBranch(palaceByBranch, b);
      giapHits.push({
        palaceName,
        earthlyBranch,
        branchIdx: b,
        isKeyPalace: isKeyPalace(palace),
        tuanSides: giapTuan,
        trietSides: giapTriet,
      });
    }
    giapHits.sort((a, b2) => a.branchIdx - b2.branchIdx);
  }

  return {
    hits,
    tuanPalaces: pick("tuan"),
    trietPalaces: pick("triet"),
    khongVongPalaces: pick("khongVong"),
    keyPalaceHits: hits.filter((h) => h.isKeyPalace),
    giapHits,
    tuanBranches,
    trietBranches,
    birthYearUsed: birthYear,
  };
}

/**
 * Cheat sheet cho prompt interpret/chat.
 */
export function buildTuanTrietReport(
  palacesArr: any[],
  options: TuanTrietOptions = {},
): string {
  const analysis = analyzeTuanTriet(palacesArr, options);
  const lines: string[] = [];

  if (analysis.birthYearUsed != null && analysis.tuanBranches.length === 2) {
    lines.push(
      `  Dữ liệu: RECOMPUTE khóa 2 cung theo năm ${analysis.birthYearUsed} + đối chiếu nhãn engine (iztro).`,
    );
    lines.push(
      `  * KHÓA TUẦN (2 cung): ${branchLabels(analysis.tuanBranches)} → ${analysis.tuanPalaces.join(", ") || "(chưa map tên cung)"} — ${KIND_LABEL.tuan}`,
    );
    lines.push(
      `  * KHÓA TRIỆT (2 cung): ${branchLabels(analysis.trietBranches)} → ${analysis.trietPalaces.join(", ") || "(chưa map tên cung)"} — ${KIND_LABEL.triet}`,
    );
    lines.push(
      "  Phân biệt: Tuần ≈ giảm lực/'trống' khí; Triệt ≈ chặn/cắt lộ. KHÔNG đồng nhất với Địa Không/Địa Kiếp/Thiên Không.",
    );
    lines.push(
      "  BẮT BUỘC luận đủ CẢ HAI cung trong mỗi khóa (không chỉ cung engine đánh nhãn).",
    );
  } else {
    lines.push(
      "  LƯU Ý: thiếu năm sinh chuẩn — chỉ quét nhãn engine, chưa recompute khóa 2 cung.",
    );
  }

  if (analysis.hits.length === 0) {
    lines.push(
      "  - Hệ thống KHÔNG thấy Tuần/Triệt/Không Vong (rule + engine).",
      "  - TUYỆT ĐỐI không tự gán Tuần/Triệt cho cung nào. (Khác Địa Không–Địa Kiếp.)",
    );
    return lines.join("\n");
  }

  lines.push("");
  lines.push("  Chi tiết theo cung:");
  for (const h of analysis.hits) {
    const tags = h.kinds.map((k) => KIND_SHORT[k]).join("+");
    const starStr = h.stars.map((s) => `${s.name}[${KIND_SHORT[s.kind]}]`).join(", ");
    const flags = [
      h.isBodyPalace ? "CUNG THÂN" : "",
      h.isKeyPalace ? "cung trọng" : "",
      h.sources.includes("rule") && h.sources.includes("engine")
        ? "rule+engine"
        : h.sources.includes("rule")
          ? "rule"
          : "engine",
    ]
      .filter(Boolean)
      .join(", ");
    lines.push(
      `  - ${h.palaceName} (${h.earthlyBranch})${flags ? ` [${flags}]` : ""}: ${starStr} → ${tags}`,
    );
  }

  if (analysis.khongVongPalaces.length) {
    lines.push("");
    lines.push(
      `  * KHÔNG VONG (nhãn engine) tại: ${analysis.khongVongPalaces.join(", ")} — ${KIND_LABEL.khongVong}`,
    );
    // Gợi ý nếu trùng nửa khóa
    const kvBranches = analysis.hits
      .filter((h) => h.kinds.includes("khongVong"))
      .map((h) => h.branchIdx);
    const onTriet = kvBranches.filter((b) => analysis.trietBranches.includes(b));
    const onTuan = kvBranches.filter((b) => analysis.tuanBranches.includes(b));
    if (onTriet.length) {
      lines.push(
        `  * Không Vong trùng khóa Triệt (${branchLabels(onTriet)}): coi là nửa khóa Triệt, không tách thành họa riêng ngoài Triệt.`,
      );
    }
    if (onTuan.length) {
      lines.push(
        `  * Không Vong trùng khóa Tuần (${branchLabels(onTuan)}): coi là nửa khóa Tuần.`,
      );
    }
  }

  if (analysis.giapHits.length > 0) {
    lines.push("");
    lines.push(
      "  * GIÁP CUNG (cung kề bị khóa — dữ liệu máy cho luận 'Tuần giáp'/'Triệt giáp'):",
    );
    for (const g of analysis.giapHits) {
      const tags: string[] = [];
      if (g.tuanSides.length) tags.push(`giáp Tuần (kề ${branchLabels(g.tuanSides)})`);
      if (g.trietSides.length) tags.push(`giáp Triệt (kề ${branchLabels(g.trietSides)})`);
      lines.push(
        `    - ${g.palaceName} (${g.earthlyBranch})${g.isKeyPalace ? " [cung trọng]" : ""}: ${tags.join("; ")}`,
      );
    }
    lines.push(
      "    Chỉ nêu 'Tuần/Triệt giáp' cho cung có trong danh sách này; giáp NHẸ hơn bị khóa trực tiếp (CÓ XU HƯỚNG giảm lực, không đồng nhất với cung bị khóa).",
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
  } else if (analysis.hits.length > 0) {
    lines.push("");
    lines.push(
      "  * Tuần/Triệt/Không Vong KHÔNG đóng cung trọng (Mệnh/Thân/Tài/Quan/Phúc…): nhắc ngắn theo đúng cung bị chiếu; không phóng đại thành 'cả đời bị Tuần'.",
    );
  }

  lines.push(
    "  * Quy tắc an toàn: chỉ nêu cung trong các danh sách trên (khóa trực tiếp HOẶC giáp); sát tinh bị Tuần/Triệt cũng giảm hung — đừng vừa nói 'Tuần Mệnh' vừa thổi phồng sát như không có Tuần.",
  );

  return lines.join("\n");
}
