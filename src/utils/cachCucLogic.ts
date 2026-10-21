// ============================================================================
// LỚP LOGIC CÁCH CỤC — ÁP LỰC MÔI TRƯỜNG + CHEAT SHEET NHÂN QUẢ
//
// Detect tên cách vẫn ở cachCuc.ts. File này:
//   1) Quét sát / Hóa Kỵ / Tuần–Triệt quanh trục cách
//   2) Hạ/nâng quality có kiểm soát (không đè miếu/hãm gốc mù quáng)
//   3) Xuất sheet máy: chuỗi nhân quả + neo kn/gh — AI cấm tự đặt tên cách
// ============================================================================

import {
  analyzeCachCuc,
  type CachCucAnalysis,
  type CachCucMatch,
  type CachCucQuality,
  buildCachCucReport,
} from "./cachCuc";
import {
  type ChartIndex,
  allStarsOf,
  mutagenLabelOf,
  normalizeStarName,
  toBranchIndex,
} from "./chartRelations";
import {
  resolveCachCucKnowledge,
  voiceForQuality,
  collectKnowledgeIdsFromPatterns,
} from "../knowledge/cachCucKnowledgeMap";

const SAT_PRESSURE =
  /Kình|Đà La|Hỏa Tinh|Linh Tinh|Địa Không|Địa Kiếp|Kiếp Sát|Thiên Hình|Đại Hao|Tiểu Hao/i;
const KY_PRESSURE = /Hóa Kỵ|Lưu Hóa Kỵ/i;
const CAT_SUPPORT = /Hóa Lộc|Hóa Quyền|Hóa Khoa|Lộc Tồn|Tả Phù|Tả Phụ|Hữu Bật|Văn Xương|Văn Khúc|Thiên Khôi|Thiên Việt/i;
const TUAN_TRIET = /Tuần|Triệt|Không Vong/i;

export interface PressureHit {
  kind: "sat" | "ky" | "cat" | "tuanTriet";
  label: string;
  palaceName: string;
}

export interface EnrichedCachCucMatch {
  match: CachCucMatch;
  /** Quality sau khi xét áp lực môi trường (có thể = gốc). */
  effectiveQuality: CachCucQuality;
  effectiveQualityLabel: string;
  pressures: PressureHit[];
  logicLines: string[];
}

const QUALITY_LABEL: Record<CachCucQuality, string> = {
  thanh: "cách thành",
  trung: "cách trung bình",
  pha: "cách phá / lực giảm",
  ham: "cách hãm / khó phát",
};

const RANK: Record<CachCucQuality, number> = {
  thanh: 0,
  trung: 1,
  pha: 2,
  ham: 3,
};

function worse(a: CachCucQuality, b: CachCucQuality): CachCucQuality {
  return RANK[a] >= RANK[b] ? a : b;
}

function better(a: CachCucQuality, b: CachCucQuality): CachCucQuality {
  return RANK[a] <= RANK[b] ? a : b;
}

/** Cung quanh trục: anchor + sao cấu thành (palace của từng star). */
function collectRelatedPalaces(idx: ChartIndex, m: CachCucMatch): any[] {
  const names = new Set<string>();
  const out: any[] = [];
  const push = (pa: any) => {
    if (!pa?.name) return;
    const k = String(pa.name);
    if (names.has(k)) return;
    names.add(k);
    out.push(pa);
  };

  const anchor = idx.palacesArr.find(
    (p: any) => String(p.name || "") === m.anchorPalaceName,
  );
  if (anchor) push(anchor);

  for (const loc of m.starLocations) {
    // "Sao … @ CungName (Chi)"
    const at = loc.match(/@\s*([^(]+)/);
    if (at) {
      const pn = at[1].trim();
      const pa = idx.palacesArr.find((p: any) => String(p.name || "").includes(pn) || pn.includes(String(p.name || "")));
      if (pa) push(pa);
    }
  }

  // Tam phương quanh anchor
  if (anchor) {
    const b = toBranchIndex(anchor.index);
    for (const off of [0, 4, 8, 6]) {
      const bi = (b + off) % 12;
      const pa = idx.palaceByBranch[bi];
      if (pa) push(pa);
    }
  }
  return out;
}

export function scanPressures(idx: ChartIndex, m: CachCucMatch): PressureHit[] {
  const hits: PressureHit[] = [];
  const seen = new Set<string>();

  for (const pa of collectRelatedPalaces(idx, m)) {
    const palaceName = String(pa.name || "");
    // Áp lực môi trường phải thấy cả Tứ Hóa bẩm sinh (mutagen) — Hóa Kỵ/Lộc
    // bẩm sinh quanh trục cách không được phép biến mất khỏi phép tính.
    // Mỗi sao tối đa 1 hit mỗi loại: "Tả Phù" (tên cát) mang Hóa Khoa (Nhâm)
    // vẫn là MỘT cát hỗ, không nhân đôi catN làm way nâng bậc.
    for (const s of allStarsOf(pa)) {
      const name = String(s?.name || "").trim();
      if (!name) continue;
      const kindOf = (label: string): PressureHit["kind"] | null => {
        if (SAT_PRESSURE.test(label)) return "sat";
        if (KY_PRESSURE.test(label)) return "ky";
        if (TUAN_TRIET.test(label)) return "tuanTriet";
        if (CAT_SUPPORT.test(label)) return "cat";
        return null;
      };
      const key = `${normalizeStarName(name)}@${palaceName}`;
      const nameKind = kindOf(name);
      if (nameKind && !seen.has(key)) {
        seen.add(key);
        hits.push({ kind: nameKind, label: name, palaceName });
      }

      const mut = mutagenLabelOf(s?.mutagen);
      if (!mut) continue;
      const mutKey = `${normalizeStarName(mut)}@${palaceName}`;
      const mutKind = kindOf(mut);
      // token cùng loại với chính sao đó → trùng, bỏ
      if (!mutKind || mutKind === nameKind || seen.has(mutKey)) continue;
      seen.add(mutKey);
      hits.push({ kind: mutKind, label: mut, palaceName });
    }
  }
  // Ưu tiên: sat/ky/tuan trước, cat sau — trần 8 hit
  const order = { sat: 0, ky: 1, tuanTriet: 2, cat: 3 } as const;
  return hits
    .sort((a, b) => order[a.kind] - order[b.kind])
    .slice(0, 8);
}

/**
 * Miếu/hãm gốc (match.quality) + áp lực môi trường.
 * Quy tắc tối giản, audit được:
 *   - ≥2 sát hoặc (sát + kỵ) → hạ 1 bậc (tối thiểu pha nếu đang thanh)
 *   - có kỵ không cát bù → hạ 1 bậc
 *   - Tuần/Triệt trên trục → hạ 1 bậc (không xuống dưới ham)
 *   - ≥2 cát hỗ + không sat/ky → nâng 1 bậc nếu đang pha
 */
export function applyEnvironmentToQuality(
  base: CachCucQuality,
  pressures: PressureHit[],
): { quality: CachCucQuality; notes: string[] } {
  let q = base;
  const notes: string[] = [];
  const satN = pressures.filter((p) => p.kind === "sat").length;
  const kyN = pressures.filter((p) => p.kind === "ky").length;
  const ttN = pressures.filter((p) => p.kind === "tuanTriet").length;
  const catN = pressures.filter((p) => p.kind === "cat").length;

  if (satN >= 2 || (satN >= 1 && kyN >= 1)) {
    const next = worse(q, q === "thanh" ? "trung" : q === "trung" ? "pha" : "ham");
    if (next !== q) {
      notes.push(`Áp sát/kỵ dày (${satN} sát, ${kyN} kỵ) → hạ chất cách xuống [${QUALITY_LABEL[next]}]`);
      q = next;
    } else {
      notes.push(`Áp sát/kỵ dày — giữ [${QUALITY_LABEL[q]}], không thổi phồng`);
    }
  } else if (kyN >= 1 && catN === 0) {
    const next = worse(q, q === "thanh" ? "trung" : q === "trung" ? "pha" : q);
    if (next !== q) {
      notes.push(`Hóa Kỵ không cát bù → [${QUALITY_LABEL[next]}]`);
      q = next;
    }
  }

  if (ttN >= 1) {
    const next = worse(q, q === "thanh" ? "trung" : q === "trung" ? "pha" : "ham");
    if (next !== q) {
      notes.push(`Tuần/Triệt/Không Vong trên trục → lọc lực → [${QUALITY_LABEL[next]}]`);
      q = next;
    } else {
      notes.push("Tuần/Triệt có mặt — hạ giọng phát cách dù miếu");
    }
  }

  if (catN >= 2 && satN === 0 && kyN === 0 && (q === "pha" || q === "ham")) {
    const next = better(q, q === "ham" ? "pha" : "trung");
    if (next !== q) {
      notes.push(`Cát hỗ dày không sát/kỵ → nâng nhẹ lên [${QUALITY_LABEL[next]}]`);
      q = next;
    }
  }

  return { quality: q, notes };
}

export function enrichMatch(idx: ChartIndex, m: CachCucMatch): EnrichedCachCucMatch {
  const pressures = scanPressures(idx, m);
  const { quality, notes } = applyEnvironmentToQuality(m.quality, pressures);
  const link = resolveCachCucKnowledge(m.patternId);
  const logicLines: string[] = [];

  if (link?.causal) logicLines.push(`NHÂN QUẢ: ${link.causal}`);
  logicLines.push(`GIỌNG MÁY: ${voiceForQuality(quality, link)}`);
  if (link?.lifeDomains?.length) {
    logicLines.push(`DOMAIN: ${link.lifeDomains.join(" · ")}`);
  }
  notes.forEach((n) => logicLines.push(`MÔI TRƯỜNG: ${n}`));

  if (pressures.length) {
    const sat = pressures.filter((p) => p.kind === "sat" || p.kind === "ky");
    const cat = pressures.filter((p) => p.kind === "cat");
    const tt = pressures.filter((p) => p.kind === "tuanTriet");
    if (sat.length) {
      logicLines.push(
        `ÁP LỰC: ${sat.map((p) => `${p.label}@${p.palaceName}`).join("; ")}`,
      );
    }
    if (tt.length) {
      logicLines.push(
        `LỌC LỰC: ${tt.map((p) => `${p.label}@${p.palaceName}`).join("; ")}`,
      );
    }
    if (cat.length) {
      logicLines.push(
        `CÁT HỖ: ${cat
          .slice(0, 4)
          .map((p) => `${p.label}@${p.palaceName}`)
          .join("; ")}`,
      );
    }
  }

  const { knIds, ghIds } = collectKnowledgeIdsFromPatterns([m.patternId]);
  if (knIds.length || ghIds.length) {
    logicLines.push(
      `NEO TRI THỨC: ${[...ghIds.slice(0, 3), ...knIds.slice(0, 3)].join(", ")}`,
    );
  }

  return {
    match: m,
    effectiveQuality: quality,
    effectiveQualityLabel: QUALITY_LABEL[quality],
    pressures,
    logicLines,
  };
}

export function enrichAnalysis(idx: ChartIndex, analysis?: CachCucAnalysis): EnrichedCachCucMatch[] {
  const a = analysis ?? analyzeCachCuc(idx);
  const all = [
    ...a.uniqueTamPhuong,
    ...a.uniqueDongCung,
    ...a.globalDongCungExtra,
  ];
  // Ưu tiên trục Mệnh / quality tốt / primary
  const enriched = all.map((m) => enrichMatch(idx, m));
  enriched.sort((x, y) => {
    const axisRank = (kw: string) =>
      kw === "Mệnh" ? 0 : kw === "Quan Lộc" ? 1 : kw === "Tài Bạch" ? 2 : 5;
    const ar = axisRank(x.match.axisKeyword) - axisRank(y.match.axisKeyword);
    if (ar !== 0) return ar;
    return RANK[x.effectiveQuality] - RANK[y.effectiveQuality];
  });
  return enriched;
}

/**
 * Cheat sheet đầy đủ: báo cáo detect (cũ) + chuỗi nhân quả (mới).
 * AI: chỉ được dùng tên cách trong list; diễn theo NHÂN QUẢ/GIỌNG MÁY.
 * Truyền `analysis` sẵn nếu đã analyze (1 lần detect / request).
 */
export function buildCachCucLogicSheet(idx: ChartIndex, analysis?: CachCucAnalysis): string {
  const a = analysis ?? analyzeCachCuc(idx);
  const base = buildCachCucReport(idx, a);
  const enriched = enrichAnalysis(idx, a).slice(0, 8);

  const lines: string[] = [
    base,
    "",
    "--- CHUỖI NHÂN QUẢ CÁCH CỤC (MÁY ĐÚC — BẮT BUỘC BÁM) ---",
    "CẤM tự đặt tên cách ngoài các mục dưới. CẤM đổi [quality hiệu dụng] trừ khi giải thích mâu thuẫn sao thật.",
    "Mỗi cách = 1 mắt xích: cấu trúc sao → cơ chế → đời thực domain; gộp chân dung, không liệt kê mục lục.",
    "",
  ];

  if (enriched.length === 0) {
    lines.push(
      "(Chưa khớp cách điển hình — luận theo tổ hợp chính tinh + Đàm Tinh, KHÔNG bịa tên cách danh.)",
    );
    return lines.join("\n").trim();
  }

  enriched.forEach((e, i) => {
    const m = e.match;
    const where =
      m.scope === "dongCung" && m.dongCungPalace
        ? m.dongCungPalace
        : `${m.axisLabel || m.axisKeyword} · ${m.anchorPalaceName} (${m.anchorBranch})`;
    lines.push(
      `${i + 1}. **${m.name}** [${e.effectiveQualityLabel}] @ ${where}`,
    );
    lines.push(`   SAO: ${m.starLocations.join("; ") || "—"}`);
    if (m.brightnessNote) lines.push(`   Miếu/hãm gốc: ${m.brightnessNote}`);
    e.logicLines.forEach((L) => lines.push(`   ${L}`));
    lines.push("");
  });

  const menh = enriched.filter((e) => e.match.axisKeyword === "Mệnh").slice(0, 3);
  if (menh.length) {
    lines.push(
      `[CHỐT MỆNH]: ${menh
        .map((e) => `${e.match.name}·${e.effectiveQualityLabel}`)
        .join(" | ")} — đây là xương sống bản sắc/sự nghiệp; các trục khác chỉ tô màu.`,
    );
  }

  return lines.join("\n").trim();
}

/** Pattern ids từ analysis sẵn — không analyze lại. */
export function patternIdsFromAnalysis(a: CachCucAnalysis): string[] {
  const ids = [
    ...a.uniqueTamPhuong,
    ...a.uniqueDongCung,
    ...a.globalDongCungExtra,
  ].map((m) => m.patternId);
  return [...new Set(ids)];
}

/** Pattern ids unique trên lá — cho retrieve tri thức. */
export function collectPatternIdsOnChart(idx: ChartIndex, analysis?: CachCucAnalysis): string[] {
  return patternIdsFromAnalysis(analysis ?? analyzeCachCuc(idx));
}

/** Tên cách (để gold / audit AI có nhắc đúng). */
export function collectPatternNamesOnChart(idx: ChartIndex, analysis?: CachCucAnalysis): string[] {
  const a = analysis ?? analyzeCachCuc(idx);
  const names = [
    ...a.uniqueTamPhuong,
    ...a.uniqueDongCung,
    ...a.globalDongCungExtra,
  ].map((m) => m.name.replace(/\s*\(đồng cung\)\s*/i, "").replace(/\s*\(hội.*\)/i, "").trim());
  return [...new Set(names)];
}
