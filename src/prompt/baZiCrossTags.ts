// ============================================================================
// BÁT TỰ CHÉO — THẺ TIN CẬY THEO TRỤC (MÁY)
//
// Không rải nhãn lung tung: máy chấm từng TRỤC (bản sắc / tài / quan / hạn)
// → [Đồng thuận] | [Bổ sung] | [Mâu thuẫn – thận trọng].
// AI CHỈ gắn nhãn đúng thẻ máy khi kết luận trọng yếu; TV vẫn dẫn.
// ============================================================================

import type { BaZiChart } from "../utils/bazi";
import { resolveCurrentDaYun } from "../utils/bazi";
import { resolveBaZiLuuNien } from "../utils/baZiTimeline";
import { allStarsOf } from "../utils/chartRelations";
import type { LuuNienEventCard } from "./luuNienEventCards";

export type CrossTag = "dong_thuan" | "bo_sung" | "mau_thuan";

export type CrossAxisId = "ban_sac" | "tai" | "quan" | "han";

export interface AxisCrossTag {
  axis: CrossAxisId;
  axisLabel: string;
  tag: CrossTag;
  tagLabel: string;
  /** Giọng AI: quả quyết / thêm lớp / hạ giọng */
  voice: string;
  tvNote: string;
  btNote: string;
  /** Điểm cực tính TV / BT (−1…+1) — audit */
  tvScore: number;
  btScore: number;
}

export interface BaZiCrossTagsResult {
  hasBaZi: boolean;
  tags: AxisCrossTag[];
  reportText: string;
}

const TAG_LABEL: Record<CrossTag, string> = {
  dong_thuan: "Đồng thuận",
  bo_sung: "Bổ sung",
  mau_thuan: "Mâu thuẫn – thận trọng",
};

const AXIS_LABEL: Record<CrossAxisId, string> = {
  ban_sac: "BẢN SẮC (Mệnh/Thân · Nhật Chủ)",
  tai: "TÀI LỘC (Tài Bạch · Tài tinh)",
  quan: "CÔNG DANH (Quan Lộc · Quan/Sát)",
  han: "VẬN HẠN NĂM (Lưu niên · Đại Vận/Lưu BT)",
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function palaceByKw(palaces: any[], ...kws: string[]): any | undefined {
  return palaces.find((p) =>
    kws.some((k) => String(p?.name || "").toLowerCase().includes(k.toLowerCase())),
  );
}

function starBlob(p: any): string {
  if (!p) return "";
  return allStarsOf(p)
    .map((s: any) => String(s?.name || ""))
    .join(" ");
}

function brightnessBoost(p: any): number {
  if (!p) return 0;
  let s = 0;
  for (const st of p.majorStars || []) {
    const b = String(st?.brightness || "").toLowerCase();
    if (/miếu|vượng|đắc|lợi|mieu|vuong/.test(b)) s += 0.15;
    if (/hãm|hạn|bất|ham|bat/.test(b)) s -= 0.2;
  }
  return s;
}

/** Cực tính TV trên cung: + cát, − hung (xấp xỉ máy). */
function tvPalaceScore(p: any): { score: number; note: string } {
  if (!p) return { score: 0, note: "thiếu cung" };
  const blob = starBlob(p);
  let s = 0;
  const bits: string[] = [];

  const cat =
    blob.match(/Lộc|Khoa|Quyền|Khôi|Việt|Xương|Khúc|Tả|Hữu|Phủ|Tướng|Tử Vi|Long|Phượng/gi) || [];
  const hung =
    blob.match(/Kỵ|Kình|Đà|Không|Kiếp|Hỏa|Linh|Hao|Tang|Hổ|Hình|Khốc|Hư/gi) || [];

  s += Math.min(0.55, cat.length * 0.12);
  s -= Math.min(0.65, hung.length * 0.14);
  s += brightnessBoost(p);

  if (cat.length) bits.push(`cát×${cat.length}`);
  if (hung.length) bits.push(`hung×${hung.length}`);
  const major = (p.majorStars || []).map((x: any) => x.name).filter(Boolean);
  if (major.length) bits.push(`chính:${major.slice(0, 2).join("+")}`);
  else bits.push("VCD");

  return { score: clamp(s, -1, 1), note: `${p.name}: ${bits.join(", ") || "trung tính"}` };
}

function collectShiShen(b: BaZiChart): string[] {
  const out: string[] = [];
  const ps = b.pillars;
  for (const p of [ps.year, ps.month, ps.day, ps.hour]) {
    if (p.shiShenGanVi) out.push(p.shiShenGanVi);
    (p.shiShenZhiVi || []).forEach((x) => out.push(x));
  }
  return out;
}

function countMatch(list: string[], re: RegExp): number {
  return list.filter((x) => re.test(x)).length;
}

/** Thân vượng/nhược thô: tỷ lệ ngũ hành Nhật Chủ trong wuXingWithHidden. */
function dayMasterStrength(b: BaZiChart): { score: number; note: string } {
  const el = b.dayMasterElement;
  const wx = b.wuXingWithHidden || {};
  const total = Object.values(wx).reduce((a, n) => a + Number(n || 0), 0) || 1;
  const self = Number(wx[el] || 0);
  const ratio = self / total;
  // ~0.2 trung; cao = vượng; thấp = nhược
  let score = (ratio - 0.2) * 3; // map rough
  score = clamp(score, -1, 1);
  return {
    score,
    note: `Nhật Chủ ${b.dayMasterVi}(${el}) tỉ lệ ~${(ratio * 100).toFixed(0)}% tàng+hiện`,
  };
}

function btAxisScore(
  b: BaZiChart,
  axis: CrossAxisId,
  year?: number,
): { score: number; note: string } {
  const sh = collectShiShen(b);
  const dm = dayMasterStrength(b);

  if (axis === "ban_sac") {
    // Thân vượng vừa + có Ấn/Tỷ hỗ = +; cực nhược/cực vượng lệch = − nhẹ
    let s = dm.score * 0.7;
    const an = countMatch(sh, /Ấn|Kiêu/);
    const ty = countMatch(sh, /Tỷ|Kiếp Tài/);
    s += Math.min(0.25, (an + ty) * 0.05);
    return {
      score: clamp(s, -1, 1),
      note: `${dm.note}; Ấn/Tỷ~${an + ty}`,
    };
  }

  if (axis === "tai") {
    const tai = countMatch(sh, /Tài/);
    const thuc = countMatch(sh, /Thực|Thương/);
    // Tài nhiều + thân đủ gánh = +; tài nhiều thân nhược = −
    let s = Math.min(0.6, tai * 0.18) + Math.min(0.25, thuc * 0.08);
    if (dm.score < -0.25 && tai >= 2) s -= 0.45;
    if (dm.score > 0.15 && tai >= 1) s += 0.15;
    return {
      score: clamp(s, -1, 1),
      note: `Tài tinh×${tai}, Thực/Thương×${thuc}; ${dm.score < -0.2 ? "thân hơi nhược gánh tài" : "thân gánh tài ổn hơn"}`,
    };
  }

  if (axis === "quan") {
    const quan = countMatch(sh, /Quan|Sát/);
    let s = Math.min(0.55, quan * 0.16);
    if (dm.score < -0.3 && quan >= 2) s -= 0.4; // quan sát đè thân
    if (dm.score > 0.1 && quan >= 1) s += 0.2;
    const an = countMatch(sh, /Ấn/);
    if (an && quan) s += 0.1; // ấn hóa sát
    return {
      score: clamp(s, -1, 1),
      note: `Quan/Sát×${quan}; Ấn×${an}; thân ${dm.score >= 0 ? "đỡ" : "yếu"}`,
    };
  }

  // han — Bát Tự trong vận XX (cùng resolveCurrentDaYun)
  const y = year || new Date().getFullYear();
  const cur = resolveCurrentDaYun(b, y);
  if (!cur) {
    return { score: 0, note: "chưa rõ Đại Vận BT" };
  }
  const me = b.dayMasterElement;
  let s = 0;
  // Sinh/cùng = hơi +, khắc Nhật = hơi −, Nhật khắc (tài) = + nhẹ
  if (cur.vsDayMaster === "sinh_nhat" || cur.vsDayMaster === "cung") s = 0.35;
  else if (cur.vsDayMaster === "khac_nhat") s = -0.35;
  else if (cur.vsDayMaster === "nhat_khac") s = 0.25;
  else if (cur.vsDayMaster === "nhat_sinh") s = -0.15;
  else s = 0.05;
  const span =
    cur.endYear != null ? `${cur.startYear}–${cur.endYear}` : `${cur.startYear}+`;
  const ln = resolveBaZiLuuNien(b, y, cur);
  const lnBit = ln
    ? `Lưu niên ${ln.year} ${ln.ganChiVi} (${ln.shiShenGan})`
    : "Lưu niên chưa resolve";
  // Điều chỉnh nhẹ theo polarity lưu niên
  if (ln?.polarity === "ap_luc") s -= 0.1;
  if (ln?.polarity === "thuan") s += 0.08;
  return {
    score: clamp(s + dm.score * 0.2, -1, 1),
    note: `Bát Tự trong vận ${cur.ganChiVi} (${span}); ${lnBit}; ${cur.vsDayMasterNote}`,
  };
}

function decideTag(tv: number, bt: number): CrossTag {
  const tSign = tv > 0.12 ? 1 : tv < -0.12 ? -1 : 0;
  const bSign = bt > 0.12 ? 1 : bt < -0.12 ? -1 : 0;
  if (tSign !== 0 && bSign !== 0 && tSign === bSign) return "dong_thuan";
  if (tSign !== 0 && bSign !== 0 && tSign !== bSign) return "mau_thuan";
  return "bo_sung";
}

function voiceFor(tag: CrossTag): string {
  if (tag === "dong_thuan") {
    return "Luận quả quyết hơn trên trục này (hai hệ cùng hướng) — vẫn không tuyệt đối hóa đời người.";
  }
  if (tag === "mau_thuan") {
    return "HẠ GIỌNG: nêu cả hai góc; ưu tiên phân kỳ vận hạn; không cưỡng ép một chiều.";
  }
  return "TV dẫn; BT chỉ tô thêm sắc thái/cơ chế — không rải nhãn khắp bài.";
}

/**
 * Máy xuất thẻ chéo theo 4 trục. Không có baZi → report rỗng hướng dẫn.
 */
export function analyzeBaZiCrossTags(
  palaces: any[],
  baZi: BaZiChart | null | undefined,
  opts?: {
    transitYear?: number;
    /** Event cards năm — bổ sung trục hạn TV */
    yearCards?: LuuNienEventCard[];
  },
): BaZiCrossTagsResult {
  if (!baZi) {
    return {
      hasBaZi: false,
      tags: [],
      reportText:
        "=== THẺ TIN CẬY BÁT TỰ CHÉO (MÁY) ===\n(Không có lá Bát Tự — bỏ nhãn Đồng thuận/Bổ sung/Mâu thuẫn; chỉ luận Tử Vi.)",
    };
  }

  const menh = palaceByKw(palaces, "Mệnh");
  const than = palaces.find((p) => p?.isBodyPalace) || menh;
  const tai = palaceByKw(palaces, "Tài");
  const quan = palaceByKw(palaces, "Quan", "Sự Nghiệp");

  const tvBan = averageScores([tvPalaceScore(menh), tvPalaceScore(than)]);
  const tvTai = averageScores([tvPalaceScore(tai), tvPalaceScore(quan)]);
  const tvQuan = tvPalaceScore(quan);

  // Trục hạn: từ event cards nếu có
  let tvHan = 0;
  let tvHanNote = "chưa có thẻ năm";
  const cards = opts?.yearCards || [];
  if (cards.length) {
    let w = 0;
    let n = 0;
    for (const c of cards) {
      const sign = c.polarity === "thuan" ? 1 : c.polarity === "ap_luc" ? -1 : 0.15;
      w += sign * Math.min(1, c.heat / 40);
      n++;
    }
    tvHan = clamp(n ? w / n : 0, -1, 1);
    tvHanNote = `thẻ năm: ${cards
      .slice(0, 3)
      .map((c) => c.domainLabel)
      .join(", ")}`;
  } else {
    tvHanNote = "bám Lưu/Tiểu hạn trên lá (không ép thẻ)";
  }

  const year = opts?.transitYear;
  const axes: { id: CrossAxisId; tv: { score: number; note: string } }[] = [
    { id: "ban_sac", tv: tvBan },
    { id: "tai", tv: tvTai },
    { id: "quan", tv: { score: tvQuan.score, note: tvQuan.note } },
    { id: "han", tv: { score: tvHan, note: tvHanNote } },
  ];

  const tags: AxisCrossTag[] = axes.map(({ id, tv }) => {
    const bt = btAxisScore(baZi, id, year);
    const tag = decideTag(tv.score, bt.score);
    return {
      axis: id,
      axisLabel: AXIS_LABEL[id],
      tag,
      tagLabel: TAG_LABEL[tag],
      voice: voiceFor(tag),
      tvNote: tv.note,
      btNote: bt.note,
      tvScore: Math.round(tv.score * 100) / 100,
      btScore: Math.round(bt.score * 100) / 100,
    };
  });

  return {
    hasBaZi: true,
    tags,
    reportText: formatBaZiCrossTagsReport(tags),
  };
}

function averageScores(
  parts: { score: number; note: string }[],
): { score: number; note: string } {
  const valid = parts.filter((p) => p.note !== "thiếu cung");
  if (!valid.length) return { score: 0, note: "thiếu cung" };
  const score = valid.reduce((a, p) => a + p.score, 0) / valid.length;
  return { score: clamp(score, -1, 1), note: valid.map((p) => p.note).join(" | ") };
}

export function formatBaZiCrossTagsReport(tags: AxisCrossTag[]): string {
  const lines: string[] = [
    "=== THẺ TIN CẬY BÁT TỰ ↔ TỬ VI (MÁY ĐÚC THEO TRỤC — KHÔNG RẢI LUNG TUNG) ===",
    "KẾT LUẬN CUỐI DO TỬ VI DẪN. Bát Tự chỉ chấm độ nhất quán, không phải chân lý kiểm chứng.",
    "BẮT BUỘC: chỉ gắn nhãn [Đồng thuận] / [Bổ sung] / [Mâu thuẫn – thận trọng] ĐÚNG trục dưới — tối đa 1 nhãn/trục khi kết luận trọng yếu.",
    "CẤM rải nhãn mọi đoạn; CẤM bịa trục không có trong list; CẤM đổi tag máy trừ khi thiếu dữ liệu (nói rõ).",
    "",
  ];

  for (const t of tags) {
    lines.push(`• [${t.tagLabel}] ${t.axisLabel}`);
    lines.push(`  TV: ${t.tvNote} (score ${t.tvScore})`);
    lines.push(`  BT: ${t.btNote} (score ${t.btScore})`);
    lines.push(`  GIỌNG: ${t.voice}`);
    lines.push("");
  }

  lines.push(
    "[MAP PHẦN BÀI] Bản sắc→trục BẢN SẮC; tiền/tài→TÀI LỘC; việc/học→CÔNG DANH; Tiểu hạn/năm→VẬN HẠN NĂM.",
  );

  return lines.join("\n").trim();
}

export function buildBaZiCrossTagsReport(
  palaces: any[],
  baZi: BaZiChart | null | undefined,
  opts?: { transitYear?: number; yearCards?: LuuNienEventCard[] },
): string {
  return analyzeBaZiCrossTags(palaces, baZi, opts).reportText;
}
