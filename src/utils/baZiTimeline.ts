// ============================================================================
// TIMELINE BÁT TỰ — ĐÚNG LỐI TỬ BÌNH (MÁY CHỐT)
//
// Tầng:
//   1) Đại Vận đang đi  → resolveCurrentDaYun (bazi.ts)
//   2) Lưu niên năm xem → can–chi năm + Thập Thần vs Nhật Chủ
//                        + xung/hợp/hình/hại với 4 trụ & chi vận
//   3) Giao vận × lưu   → 1 dòng cơ chế năm trong vận
//
// Không copy timeline Tử Vi (sao lưu/cung). AI bám sheet này khi nói hạn BT.
// ============================================================================

import { Solar } from "lunar-typescript";
import {
  type BaZiChart,
  type CurrentDaYunResolved,
  resolveCurrentDaYun,
  formatCurrentDaYunReport,
  GAN_VI,
  ZHI_VI,
  GAN_WUXING,
  ZHI_WUXING,
} from "./bazi";

// ----------------------------------------------------------------------------
// Chi quan hệ (địa chi)
// ----------------------------------------------------------------------------

const LUC_XUNG: Record<string, string> = {
  Tý: "Ngọ", Ngọ: "Tý", Sửu: "Mùi", Mùi: "Sửu", Dần: "Thân", Thân: "Dần",
  Mão: "Dậu", Dậu: "Mão", Thìn: "Tuất", Tuất: "Thìn", Tỵ: "Hợi", Hợi: "Tỵ",
};

const LUC_HOP: Record<string, string> = {
  Tý: "Sửu", Sửu: "Tý", Dần: "Hợi", Hợi: "Dần", Mão: "Tuất", Tuất: "Mão",
  Thìn: "Dậu", Dậu: "Thìn", Tỵ: "Thân", Thân: "Tỵ", Ngọ: "Mùi", Mùi: "Ngọ",
};

const LUC_HAI: Record<string, string> = {
  Tý: "Mùi", Mùi: "Tý", Sửu: "Ngọ", Ngọ: "Sửu", Dần: "Tỵ", Tỵ: "Dần",
  Mão: "Thìn", Thìn: "Mão", Thân: "Hợi", Hợi: "Thân", Dậu: "Tuất", Tuất: "Dậu",
};

/** Tự hình + Tý-Mão hình; tam hình Dần-Tỵ-Thân / Sửu-Tuất-Mùi */
const TU_HINH = new Set(["Thìn", "Ngọ", "Dậu", "Hợi"]);
const TI_MAO_HINH: Record<string, string> = { Tý: "Mão", Mão: "Tý" };

export type ZhiRelation = "xung" | "hop" | "hai" | "hinh" | "tu_hinh";

export interface ZhiHit {
  targetLabel: string; // "Trụ Năm" | "Đại Vận" | ...
  targetZhi: string;
  relation: ZhiRelation;
  note: string;
}

export interface BaZiLuuNienResolved {
  year: number;
  ganChiVi: string;
  ganVi: string;
  zhiVi: string;
  ganElement: string;
  zhiElement: string;
  ganPolarity: "Dương" | "Âm" | "";
  /** Thập Thần can lưu vs Nhật Chủ */
  shiShenGan: string;
  vsDayMasterNote: string;
  zhiHits: ZhiHit[];
  /** Giao với Đại Vận đang đi */
  vsDaYunNote: string;
  /** Nhiệt: + thuận / − áp (thô, để ranking) */
  heat: number;
  polarity: "thuan" | "ap_luc" | "hon_hop";
  headline: string;
  /** Gợi ý domain đời từ Thập Thần + xung hợp (máy, ngắn) */
  lifeHints: string[];
}

export interface BaZiTimelineResult {
  transitYear: number;
  daYun: CurrentDaYunResolved | null;
  luuNien: BaZiLuuNienResolved | null;
  reportText: string;
}

// ----------------------------------------------------------------------------
// Can–chi năm dương (lịch can–chi — mid-year để tránh giao thừa lệch)
// ----------------------------------------------------------------------------

export function resolveYearGanZhi(year: number): { ganVi: string; zhiVi: string; ganChiVi: string; ganHan: string; zhiHan: string } | null {
  const y = Math.trunc(Number(year));
  if (!Number.isFinite(y) || y < 1800 || y > 2200) return null;
  try {
    // 1/7 dương: đã qua lập xuân phần lớn năm (đủ cho can–chi năm)
    const solar = Solar.fromYmd(y, 7, 1);
    const lunar = solar.getLunar();
    const ganHan = lunar.getYearGan();
    const zhiHan = lunar.getYearZhi();
    const ganVi = GAN_VI[ganHan] ?? ganHan;
    const zhiVi = ZHI_VI[zhiHan] ?? zhiHan;
    return { ganVi, zhiVi, ganChiVi: `${ganVi} ${zhiVi}`, ganHan, zhiHan };
  } catch {
    return null;
  }
}

/**
 * Thập Thần can B so với Nhật Chủ can A (Hán hoặc Việt).
 */
export function shiShenBetweenGans(dayGanVi: string, otherGanVi: string): string {
  const dayEl = GAN_ELEMENT_VI[dayGanVi] || "";
  const othEl = GAN_ELEMENT_VI[otherGanVi] || "";
  const dayPol = GAN_POL_VI[dayGanVi];
  const othPol = GAN_POL_VI[otherGanVi];
  if (!dayEl || !othEl || !dayPol || !othPol) return "—";

  const samePol = dayPol === othPol;

  if (dayEl === othEl) {
    return samePol ? "Tỷ Kiên" : "Kiếp Tài";
  }
  // other sinh day = Ấn
  if (WX_SINH[othEl] === dayEl) {
    return samePol ? "Thiên Ấn" : "Chính Ấn";
  }
  // day sinh other = Thực Thương
  if (WX_SINH[dayEl] === othEl) {
    return samePol ? "Thực Thần" : "Thương Quan";
  }
  // day khắc other = Tài
  if (WX_KHAC[dayEl] === othEl) {
    return samePol ? "Thiên Tài" : "Chính Tài";
  }
  // other khắc day = Quan Sát
  if (WX_KHAC[othEl] === dayEl) {
    return samePol ? "Thất Sát" : "Chính Quan";
  }
  return "—";
}

const GAN_ELEMENT_VI: Record<string, string> = {
  Giáp: "Mộc", Ất: "Mộc", Bính: "Hỏa", Đinh: "Hỏa", Mậu: "Thổ",
  Kỷ: "Thổ", Canh: "Kim", Tân: "Kim", Nhâm: "Thủy", Quý: "Thủy",
};
const GAN_POL_VI: Record<string, "Dương" | "Âm"> = {
  Giáp: "Dương", Ất: "Âm", Bính: "Dương", Đinh: "Âm", Mậu: "Dương",
  Kỷ: "Âm", Canh: "Dương", Tân: "Âm", Nhâm: "Dương", Quý: "Âm",
};
const WX_SINH: Record<string, string> = {
  Mộc: "Hỏa", Hỏa: "Thổ", Thổ: "Kim", Kim: "Thủy", Thủy: "Mộc",
};
const WX_KHAC: Record<string, string> = {
  Mộc: "Thổ", Thổ: "Thủy", Thủy: "Hỏa", Hỏa: "Kim", Kim: "Mộc",
};

function zhiRelation(a: string, b: string): ZhiRelation | null {
  if (!a || !b) return null;
  if (a === b && TU_HINH.has(a)) return "tu_hinh";
  if (LUC_XUNG[a] === b) return "xung";
  if (LUC_HOP[a] === b) return "hop";
  if (LUC_HAI[a] === b) return "hai";
  if (TI_MAO_HINH[a] === b) return "hinh";
  // Tam hình Dần-Tỵ-Thân / Sửu-Tuất-Mùi: nếu a,b khác nhau cùng group
  for (const g of [
    ["Dần", "Tỵ", "Thân"],
    ["Sửu", "Tuất", "Mùi"],
  ]) {
    if (g.includes(a) && g.includes(b) && a !== b) return "hinh";
  }
  return null;
}

function relNote(rel: ZhiRelation, from: string, to: string, toLabel: string): string {
  // Tỵ–Thân vừa LỤC HỢP vừa thuộc tam hình (合中带 hình) — phải ghi chú cả hai,
  // không được đánh mất hình khi hợp thắng trong thứ tự xét quan hệ.
  const hopWithHinh =
    rel === "hop" && ((from === "Tỵ" && to === "Thân") || (from === "Thân" && to === "Tỵ"));
  switch (rel) {
    case "xung":
      return `Chi lưu ${from} XUNG ${to} (${toLabel}) — biến động/va đập kênh trụ này`;
    case "hop":
      return hopWithHinh
        ? `Chi lưu ${from} HỢP ${to} (${toLabel}) — gắn kết/đóng kênh, NHƯNG hợp trung đới hình (Tỵ–Thân): gắn kết kèm giằng co/bất nhức ngầm`
        : `Chi lưu ${from} HỢP ${to} (${toLabel}) — gắn kết/đóng kênh`;
    case "hai":
      return `Chi lưu ${from} HẠI ${to} (${toLabel}) — ma sát ngầm`;
    case "hinh":
      return `Chi lưu ${from} HÌNH ${to} (${toLabel}) — căng/tổn khí`;
    case "tu_hinh":
      return `Chi lưu ${from} TỰ HÌNH — nội hao/tự tạo sóng`;
    default:
      return `${from}–${to}`;
  }
}

function heatOfRelation(rel: ZhiRelation): number {
  if (rel === "xung" || rel === "hinh" || rel === "tu_hinh") return -12;
  if (rel === "hai") return -8;
  if (rel === "hop") return 6;
  return 0;
}

function heatOfShiShen(ss: string): number {
  // Tỷ Kiên/Kiếp Tài phải xét TRƯỚC /Tài/ — nếu không "Kiếp Tài" bị nhầm
  // là Tài (+8 thuận) trong khi bản chất là hao tài/cạnh tranh.
  if (/Tỷ Kiên|Kiếp Tài/.test(ss)) return 0;
  if (/Tài/.test(ss)) return 8;
  if (/Quan|Sát/.test(ss)) return -4;
  if (/Ấn/.test(ss)) return 6;
  if (/Thực|Thương/.test(ss)) return 2;
  return 0;
}

function lifeHintsFromShiShen(ss: string, hits: ZhiHit[]): string[] {
  const hints: string[] = [];
  if (/Chính Tài|Thiên Tài/.test(ss)) {
    hints.push("Kênh TÀI/lợi tức nổi (Thập Thần Tài) — cơ hội tiền kèm kỷ luật giữ");
  }
  if (/Chính Quan|Thất Sát/.test(ss)) {
    hints.push("Kênh QUAN/áp lực–trách nhiệm (Quan/Sát) — việc–danh–kỷ luật");
  }
  if (/Chính Ấn|Thiên Ấn/.test(ss)) {
    hints.push("Kênh ẤN/học–che chở–tài liệu — học/bằng/cấp trên");
  }
  if (/Thực Thần|Thương Quan/.test(ss)) {
    hints.push("Kênh THỰC THƯƠNG/biểu đạt–sáng tạo–tỏa — nghề miệng/đầu ra");
  }
  if (/Tỷ Kiên|Kiếp Tài/.test(ss)) {
    hints.push("Kênh TỶ KIẾP/bạn–cạnh tranh–tự lực — đồng sự/đối thủ");
  }
  const xung = hits.filter((h) => h.relation === "xung");
  if (xung.some((h) => /Ngày|Nhật/.test(h.targetLabel))) {
    hints.push("Xung Nhật chi — sóng bản thân/sức/tâm nổi trong năm");
  }
  if (xung.some((h) => /Tháng/.test(h.targetLabel))) {
    hints.push("Xung Tháng chi — môi trường/công việc gốc bị kích");
  }
  if (xung.some((h) => /Đại Vận|vận/.test(h.targetLabel))) {
    hints.push("Xung chi Đại Vận — năm giao động trong thập niên vận");
  }
  return [...new Set(hints)].slice(0, 5);
}

function polarityFromHeat(heat: number, hasXung: boolean): "thuan" | "ap_luc" | "hon_hop" {
  if (hasXung && heat > 0) return "hon_hop";
  if (heat <= -10) return "ap_luc";
  if (heat >= 10 && !hasXung) return "thuan";
  if (hasXung) return "hon_hop";
  if (heat < 0) return "ap_luc";
  if (heat > 0) return "thuan";
  return "hon_hop";
}

/**
 * Lưu niên Bát Tự cho năm xem — máy chốt.
 */
export function resolveBaZiLuuNien(
  b: BaZiChart,
  transitYear: number,
  daYun?: CurrentDaYunResolved | null,
): BaZiLuuNienResolved | null {
  const ygz = resolveYearGanZhi(transitYear);
  if (!ygz) return null;

  const dayGan = b.dayMasterVi;
  const shiShenGan = shiShenBetweenGans(dayGan, ygz.ganVi);
  const ganEl = GAN_ELEMENT_VI[ygz.ganVi] || GAN_WUXING[ygz.ganHan] || "";
  const zhiEl = ZHI_WUXING[ygz.zhiHan] || zhiElementFallback(ygz.zhiVi);
  const pol = GAN_POL_VI[ygz.ganVi] || "";

  const vsDm =
    ganEl && b.dayMasterElement
      ? ganEl === b.dayMasterElement
        ? `Can lưu ${ygz.ganVi} đồng hành Nhật ${dayGan}`
        : WX_SINH[ganEl] === b.dayMasterElement
          ? `Can lưu sinh Nhật Chủ (ấn khí)`
          : WX_SINH[b.dayMasterElement] === ganEl
            ? `Nhật Chủ sinh can lưu (thực thương khí)`
            : WX_KHAC[ganEl] === b.dayMasterElement
              ? `Can lưu khắc Nhật (quan sát khí)`
              : WX_KHAC[b.dayMasterElement] === ganEl
                ? `Nhật khắc can lưu (tài khí)`
                : `Can lưu ${ganEl} vs Nhật ${b.dayMasterElement}`
      : "—";

  const zhiHits: ZhiHit[] = [];
  const pillars: { label: string; zhi: string }[] = [
    { label: "Trụ Năm", zhi: b.pillars.year.zhiVi },
    { label: "Trụ Tháng", zhi: b.pillars.month.zhiVi },
    { label: "Trụ Ngày (Nhật)", zhi: b.pillars.day.zhiVi },
    { label: "Trụ Giờ", zhi: b.pillars.hour.zhiVi },
  ];

  for (const p of pillars) {
    const rel = zhiRelation(ygz.zhiVi, p.zhi);
    if (!rel) continue;
    zhiHits.push({
      targetLabel: p.label,
      targetZhi: p.zhi,
      relation: rel,
      note: relNote(rel, ygz.zhiVi, p.zhi, p.label),
    });
  }

  const yun = daYun ?? resolveCurrentDaYun(b, transitYear);
  let vsDaYunNote = "Chưa rõ Đại Vận đang đi";
  if (yun) {
    const parts: string[] = [`Nằm trong vận ${yun.ganChiVi}`];
    const yunZhi = String(yun.ganChiVi).trim().split(/\s+/)[1] || "";
    const yunGan = String(yun.ganChiVi).trim().split(/\s+/)[0] || "";
    if (yunZhi) {
      const relZ = zhiRelation(ygz.zhiVi, yunZhi);
      if (relZ) {
        zhiHits.push({
          targetLabel: "Đại Vận (chi)",
          targetZhi: yunZhi,
          relation: relZ,
          note: relNote(relZ, ygz.zhiVi, yunZhi, `vận ${yun.ganChiVi}`),
        });
        parts.push(relNote(relZ, ygz.zhiVi, yunZhi, "chi vận"));
      }
    }
    if (yunGan && ygz.ganVi) {
      const ssYun = shiShenBetweenGans(dayGan, yunGan);
      const ssYear = shiShenGan;
      parts.push(`Can vận ~${ssYun} / Can năm ~${ssYear} (so Nhật)`);
    }
    vsDaYunNote = parts.join("; ");
  }

  let heat = heatOfShiShen(shiShenGan);
  for (const h of zhiHits) heat += heatOfRelation(h.relation);

  const hasXung = zhiHits.some((h) => h.relation === "xung" || h.relation === "hinh");
  const polarity = polarityFromHeat(heat, hasXung);
  const lifeHints = lifeHintsFromShiShen(shiShenGan, zhiHits);

  const polLabel =
    polarity === "thuan" ? "THUẬN" : polarity === "ap_luc" ? "ÁP LỰC" : "HỖN HỢP";
  const headline =
    `Lưu niên ${transitYear} ${ygz.ganChiVi} (${shiShenGan} so Nhật Chủ) · ${polLabel}` +
    (yun ? ` · trong vận ${yun.ganChiVi}` : "");

  return {
    year: transitYear,
    ganChiVi: ygz.ganChiVi,
    ganVi: ygz.ganVi,
    zhiVi: ygz.zhiVi,
    ganElement: ganEl,
    zhiElement: zhiEl,
    ganPolarity: pol,
    shiShenGan,
    vsDayMasterNote: `${vsDm}; Thập Thần can lưu: ${shiShenGan}`,
    zhiHits,
    vsDaYunNote,
    heat,
    polarity,
    headline,
    lifeHints,
  };
}

function zhiElementFallback(zhiVi: string): string {
  const m: Record<string, string> = {
    Tý: "Thủy", Sửu: "Thổ", Dần: "Mộc", Mão: "Mộc", Thìn: "Thổ", Tỵ: "Hỏa",
    Ngọ: "Hỏa", Mùi: "Thổ", Thân: "Kim", Dậu: "Kim", Tuất: "Thổ", Hợi: "Thủy",
  };
  return m[zhiVi] || "";
}

/**
 * Timeline BT đầy đủ cho năm xem.
 */
export function analyzeBaZiTimeline(b: BaZiChart, transitYear: number): BaZiTimelineResult {
  const y = Math.trunc(Number(transitYear)) || new Date().getFullYear();
  const daYun = resolveCurrentDaYun(b, y);
  const luuNien = resolveBaZiLuuNien(b, y, daYun);
  return {
    transitYear: y,
    daYun,
    luuNien,
    reportText: formatBaZiTimelineReport(b, y, daYun, luuNien),
  };
}

export function formatBaZiTimelineReport(
  b: BaZiChart,
  transitYear: number,
  daYun?: CurrentDaYunResolved | null,
  luuNien?: BaZiLuuNienResolved | null,
): string {
  const yun = daYun === undefined ? resolveCurrentDaYun(b, transitYear) : daYun;
  const ln = luuNien === undefined ? resolveBaZiLuuNien(b, transitYear, yun) : luuNien;

  const lines: string[] = [
    `=== TIMELINE BÁT TỰ (TỬ BÌNH — MÁY CHỐT — NĂM XEM ${transitYear}) ===`,
    "Đúng lối BT: Đại Vận (thập niên) → Lưu niên (can–chi năm) × Nhật Chủ × 4 trụ × chi vận.",
    "CẤM nhẩm can–chi năm/vận khác sheet. CẤM copy timeline Tử Vi (sao lưu/cung) vào BT.",
    "Khi nói hạn BT: dùng đúng HEADLINE vận + HEADLINE lưu niên dưới.",
    "",
  ];

  // Tầng 1 — Đại Vận
  lines.push(formatCurrentDaYunReport(b, transitYear));
  lines.push("");

  // Tầng 2 — Lưu niên
  lines.push(`=== LƯU NIÊN BÁT TỰ ${transitYear} (MÁY) ===`);
  if (!ln) {
    lines.push("(Chưa tính được can–chi năm xem.)");
  } else {
    lines.push(`HEADLINE: ${ln.headline}`);
    lines.push(
      `- Can chi năm: ${ln.ganChiVi} | Can ${ln.ganElement}${ln.ganPolarity ? `/${ln.ganPolarity}` : ""} | Chi ${ln.zhiElement}`,
    );
    lines.push(`- Thập Thần can lưu vs Nhật Chủ (${b.dayMasterVi}): **${ln.shiShenGan}**`);
    lines.push(`- ${ln.vsDayMasterNote}`);
    lines.push(`- Giao vận: ${ln.vsDaYunNote}`);
    if (ln.zhiHits.length) {
      lines.push("- Xung/Hợp/Hình/Hại chi lưu với trụ & vận:");
      ln.zhiHits.forEach((h) => {
        lines.push(`  · [${h.relation}] ${h.note}`);
      });
    } else {
      lines.push("- Chi lưu không xung/hợp/hình/hại trực tiếp 4 trụ/vận (theo bảng máy).");
    }
    if (ln.lifeHints.length) {
      lines.push("- Gợi ý kênh đời (từ Thập Thần + xung hợp — xu hướng, không tuyệt đối):");
      ln.lifeHints.forEach((h) => lines.push(`  · ${h}`));
    }
    lines.push(
      `- Cách nói chuẩn: "Lưu niên ${transitYear} ${ln.ganChiVi}" trong "vận ${yun?.ganChiVi ?? "…"}".`,
    );
  }

  lines.push("");
  lines.push(
    "[CÁCH DÙNG] Luận hạn BT: (1) chốt vận → (2) chốt lưu niên + Thập Thần → (3) xung/hợp trụ nào → (4) chéo TV cùng năm. TV vẫn dẫn khi đối chiếu chéo.",
  );

  return lines.join("\n").trim();
}

/** API gọn — nhúng baZiToPromptText / context. */
export function buildBaZiTimelineReport(b: BaZiChart, transitYear: number): string {
  return analyzeBaZiTimeline(b, transitYear).reportText;
}
