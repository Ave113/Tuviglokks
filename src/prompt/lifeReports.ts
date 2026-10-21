// ============================================================================
// BÁO CÁO ĐỜI SỐNG — TRỌNG TÂM LÁ SỐ
// ----------------------------------------------------------------------------
// Chạy hoàn toàn deterministic trên dữ liệu iztro + cách cục + Tứ Hóa.
// Mục đích: cho AI một bản đồ trọng tâm trước khi viết (mở bài, phân bổ độ sâu).
// Không thay thế cheat sheet cách cục / Tứ Hóa — chỉ chấm điểm để chọn trục.
// ============================================================================

import {
  type ChartIndex,
  allStarsOf,
} from "../utils/chartRelations";
import {
  enrichAnalysis,
  type EnrichedCachCucMatch,
} from "../utils/cachCucLogic";
import {
  type CachCucAnalysis,
  type CachCucQuality,
  getBrightnessTier,
} from "../utils/cachCuc";

type DomainKey =
  | "ban-sac"
  | "su-nghiep"
  | "tai-loc"
  | "tinh-duyen"
  | "suc-khoe"
  | "noi-tam"
  | "gia-dinh";

interface DomainDef {
  key: DomainKey;
  label: string;
  /** Các cung thuộc trục — dùng để cộng điểm và gom tín hiệu. */
  palaces: string[];
}

const DOMAINS: DomainDef[] = [
  { key: "ban-sac", label: "Bản sắc & Thân", palaces: ["Mệnh"] },
  { key: "su-nghiep", label: "Sự nghiệp & ra ngoài", palaces: ["Quan Lộc", "Thiên Di"] },
  { key: "tai-loc", label: "Tài lộc & tài sản", palaces: ["Tài Bạch", "Điền Trạch"] },
  { key: "tinh-duyen", label: "Tình duyên & con cái", palaces: ["Phu Thê", "Tử Tức", "Tử Nữ"] },
  { key: "suc-khoe", label: "Sức khỏe & thân thể", palaces: ["Tật Ách"] },
  { key: "noi-tam", label: "Nội tâm & phúc báo", palaces: ["Phúc Đức"] },
  { key: "gia-dinh", label: "Gia đình & quan hệ", palaces: ["Phụ Mẫu", "Huynh Đệ", "Nô Bộc"] },
];

const QUALITY_SCORE: Record<CachCucQuality, number> = {
  thanh: 3,
  trung: 1.2,
  pha: -1.8,
  ham: -2.8,
};

const TUAN_TRIET_RE = /Tuần|Triệt|Không Vong/i;
const TRANSIT_STAR_RE = /^\[SAO\s*(?:LƯU|VẬN)\]/i;

const isOriginStar = (s: any): boolean =>
  !TRANSIT_STAR_RE.test(String(s?.name || "")) &&
  (s?.scope === undefined || s?.scope === "origin");

const palaceOfDomain = (idx: ChartIndex, d: DomainDef): any[] =>
  idx.palacesArr.filter((p: any) => d.palaces.includes(String(p.name || "").trim()));

const domainForPalace = (palaceName: string): DomainDef | undefined =>
  DOMAINS.find((d) => d.palaces.includes(palaceName));

const domainForMatch = (m: EnrichedCachCucMatch): DomainDef | undefined => {
  const axis = String(m.match.axisKeyword || "").trim();
  if (axis && axis !== "toan-la-so") {
    const byAxis = domainForPalace(axis);
    if (byAxis) return byAxis;
  }
  const anchor = String(m.match.anchorPalaceName || "").trim();
  return domainForPalace(anchor);
};

interface FocusAxis {
  key: DomainKey;
  label: string;
  score: number;
  intensity: number;
  signals: string[];
  strengths: number;
  heats: number;
}

const axisDirection = (a: FocusAxis): string => {
  if (a.score >= 2.5) return "TRỘI SÁNG";
  if (a.score <= -2.5) return "NÓNG / ÁP LỰC";
  return a.score >= 0 ? "KHÁ SÁNG, CẦN GIỮ NHỊP" : "CÓ ĐIỂM NÓNG, CẦN QUAN SÁT";
};

/** Chấm 7 trục đời sống từ cách cục + Tứ Hóa bẩm sinh + Tuần/Triệt + độ sáng. */
export function scoreLifeFocus(
  idx: ChartIndex,
  analysis?: CachCucAnalysis,
): FocusAxis[] {
  const enriched = enrichAnalysis(idx, analysis);
  const axes: FocusAxis[] = DOMAINS.map((d) => ({
    key: d.key,
    label: d.label,
    score: 0,
    intensity: 0,
    signals: [],
    strengths: 0,
    heats: 0,
  }));
  const byKey = new Map(axes.map((a) => [a.key, a]));

  // (1) Cách cục — tín hiệu nặng ký nhất.
  for (const e of enriched) {
    const d = domainForMatch(e);
    if (!d) continue;
    const a = byKey.get(d.key);
    if (!a) continue;
    const q = QUALITY_SCORE[e.effectiveQuality] ?? 0;
    a.score += q;
    if (q > 0) a.strengths++;
    if (q < 0) a.heats++;

    const pressureLabels = e.pressures
      .map((p) => p.label)
      .filter((label) => label && !/^\[SAO\s*(?:LƯU|VẬN)\]/i.test(label))
      .slice(0, 2);
    const signal = `${e.match.name} [${e.effectiveQualityLabel}]${
      pressureLabels.length ? ` · ${pressureLabels.join(", ")}` : ""
    }`;
    if (a.signals.length < 3 && !a.signals.some((s) => s.startsWith(e.match.name))) {
      a.signals.push(signal);
    }
  }

  // (2) Tứ Hóa bẩm sinh — Lộc/Quyền/Khoa mở, Kỵ siết.
  for (const d of DOMAINS) {
    const a = byKey.get(d.key);
    if (!a) continue;
    for (const p of palaceOfDomain(idx, d)) {
      for (const s of allStarsOf(p).filter(isOriginStar)) {
        // iztro trả mutagen dạng "Hóa Lộc"/"Hóa Kỵ"; chuẩn hóa về Lộc/Kỵ
        // để không bỏ sót toàn bộ tín hiệu Tứ Hóa bẩm sinh.
        const mut = String(s?.mutagen || "")
          .trim()
          .toLowerCase()
          .replace(/^hóa\s+/, "");
        if (!mut) continue;
        if (mut === "lộc" || mut === "quyền" || mut === "khoa") {
          a.score += 1.6;
          a.strengths++;
        } else if (mut === "kỵ") {
          a.score -= 1.8;
          a.heats++;
        } else {
          continue;
        }
        const label = mut === "kỵ" ? "Hóa Kỵ" : mut === "lộc" ? "Hóa Lộc" : mut === "quyền" ? "Hóa Quyền" : "Hóa Khoa";
        if (a.signals.length < 4) {
          a.signals.push(`${label} tại ${p.name} (${s.name})`);
        }
      }
    }
  }

  // (3) Tuần / Triệt / Không Vong — giảm lực trục.
  for (const d of DOMAINS) {
    const a = byKey.get(d.key);
    if (!a) continue;
    for (const p of palaceOfDomain(idx, d)) {
      const names = allStarsOf(p)
        .filter(isOriginStar)
        .map((s: any) => String(s.name || ""))
        .filter((n: string) => TUAN_TRIET_RE.test(n));
      if (names.length) {
        a.score -= 1.2 * Math.min(names.length, 2);
        a.heats++;
        if (a.signals.length < 4) a.signals.push(`${names.join("/")} tại ${p.name}`);
      }
    }
  }

  // (4) Độ sáng chính tinh — chỉnh nhẹ, không lấn cách cục.
  for (const d of DOMAINS) {
    const a = byKey.get(d.key);
    if (!a) continue;
    for (const p of palaceOfDomain(idx, d)) {
      for (const s of p.majorStars || []) {
        const tier = getBrightnessTier(s?.brightness);
        if (tier === "cat") a.score += 0.5;
        else if (tier === "ham") a.score -= 0.5;
        else if (tier === "trung") a.score += 0.1;
      }
    }
  }

  // (5) Thân cung là tín hiệu bản sắc (không phải cung riêng).
  const than = idx.palacesArr.find((p: any) => p?.isBodyPalace);
  if (than) {
    const a = byKey.get("ban-sac");
    if (a && a.signals.length < 4) a.signals.push(`Thân cư ${than.name}`);
  }

  for (const a of axes) {
    a.score = Math.round(a.score * 10) / 10;
    a.intensity = Math.abs(a.score) + Math.min(a.signals.length, 4) * 0.25;
  }

  return axes.sort((a, b) => b.intensity - a.intensity);
}

const cap = (s: string, n: number): string =>
  s.length <= n ? s : `${s.slice(0, n - 1).trim()}…`;

/** Block TRỌNG TÂM — máy chấm top 3 để AI mở bài + phân bổ độ sâu. */
export function buildTrongTamReport(
  idx: ChartIndex,
  analysis?: CachCucAnalysis,
): string {
  const axes = scoreLifeFocus(idx, analysis);
  const top = axes.slice(0, 3);
  if (!top.length) return "";

  const lines = top.map((a, i) => {
    const signals = a.signals.length
      ? a.signals.map((s) => cap(s, 90)).join("; ")
      : "chưa đủ tín hiệu mạnh — luận theo tổ hợp sao thật";
    return `  ${i + 1}. [${a.label}] ${a.score >= 0 ? "+" : ""}${a.score.toFixed(1)} — ${axisDirection(a)} — ${signals}`;
  });

  return `--- TRỌNG TÂM LÁ SỐ (MÁY CHẤM SẴN — DÙNG ĐỂ MỞ BÀI & PHÂN BỔ ĐỘ SÂU) ---
Máy đã chấm 7 trục đời sống từ cách cục, Tứ Hóa bẩm sinh, sát/kỵ, Tuần–Triệt và độ sáng chính tinh. Ba trục nổi bật nhất:
${lines.join("\n")}
BẮT BUỘC:
  (1) **Phần 0 — Chân dung** phải gọi đúng 3 trục này bằng lời đời, không liệt kê máy, không thêm trục thứ 4.
  (2) Phần nào chứa trục trong top 3 → viết SÂU hơn (thêm 1 tầng cơ chế + 1 ví dụ đời); các phần ngoài top 3 viết gọn, không dàn đều.
  (3) Đây là bản đồ trọng tâm, KHÔNG phải bản án: không đổi kết luận cát/hung của cách cục; mọi nhận định vẫn dùng "CÓ XU HƯỚNG" + điều kiện + 1 NÊN.`;
}


