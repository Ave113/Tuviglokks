/**
 * KÍCH HOẠT HẠN ↔ ĐIỂM MÙ / TRỤC VA ĐẬP (Chuỗi Kích Hoạt Hạn)
 *
 * Máy quét giao điểm: Đại hạn / Tiểu hạn / Lưu niên / Lưu–Vận Tứ Hóa
 * ∩ cung nóng (sát/kỵ, trục quan hệ then chốt, Mệnh hình học).
 *
 * Không phải "pulse engine" huyền bí — deterministic, đo được, shared interpret+chat.
 * AI chỉ XOÁY đúng kích hoạt CAO/VỪA; cấm tuyệt đối hóa đời người.
 */
import {
  type ChartIndex,
  BRANCHES_VI,
  toBranchIndex,
  NHI_HOP,
  LUC_HAI,
  allStarsOf,
  starTokensOf,
  mutagenLabelOf,
  isSatKyStarName,
} from "../utils/chartRelations";
import { palaceByName } from "./chartReports";
import { analyzeTrungPhung, trungPhungBonusFor } from "./trungPhung";

export type TriggerLevel = "cao" | "vua" | "nen";

export interface TemporalTrigger {
  level: TriggerLevel;
  score: number;
  palaceName: string;
  branch: string;
  domain: string;
  /** Tín hiệu hạn (Lưu Kỵ, Thái Tuế, Đại hạn…) */
  pulses: string[];
  /** Vì sao cung này “nóng” bẩm sinh */
  latent: string[];
  /** Mầm điểm mù / trục va (nếu có) */
  blindHints: string[];
  /** Directive 1 dòng cho AI */
  directive: string;
}

export interface TemporalTriggerAnalysis {
  transitYear: number;
  triggers: TemporalTrigger[];
  /** Text cheat sheet */
  report: string;
}

const PALACE_DOMAIN: { kw: string; domain: string }[] = [
  { kw: "Mệnh", domain: "bản thân, hướng đi, cái tôi" },
  { kw: "Phu Thê", domain: "đôi lứa, cam kết, giao tiếp thân mật" },
  { kw: "Phối", domain: "đôi lứa, cam kết" },
  { kw: "Tài Bạch", domain: "tiền bạc, dòng tiền, chi tiêu" },
  { kw: "Tài", domain: "tiền bạc, dòng tiền" },
  { kw: "Quan Lộc", domain: "học–việc, công danh, cấp trên" },
  { kw: "Quan", domain: "học–việc, công danh" },
  { kw: "Điền", domain: "nhà cửa, tài sản lớn" },
  { kw: "Phúc", domain: "tinh thần, an/bất an nội tại" },
  { kw: "Tật", domain: "sức khỏe, thần kinh, tai ốm" },
  { kw: "Thiên Di", domain: "đi lại, môi trường ngoài, khẩu thiệt xa" },
  { kw: "Nô", domain: "bạn bè, đồng nghiệp, nhóm" },
  { kw: "Tử", domain: "con cái, dự án tâm huyết" },
  { kw: "Phụ", domain: "cha mẹ, thầy, cấp trên" },
  { kw: "Huynh", domain: "anh em, đối tác ngang hàng" },
];

function domainOf(palaceName: string): string {
  for (const { kw, domain } of PALACE_DOMAIN) {
    if (palaceName.includes(kw)) return domain;
  }
  return "lĩnh vực cung tương ứng";
}

function allNames(p: any): string[] {
  return allStarsOf(p)
    .map((s: any) => String(s?.name || "").trim())
    .filter(Boolean);
}

function stripPrefix(n: string): string {
  return n.replace(/\[SAO\s*(?:LƯU|VẬN)\]\s*/gi, "").trim();
}

function isLuuStar(n: string): boolean {
  return /\[SAO LƯU\]|Lưu\s+/i.test(n) || /^Lưu\s/i.test(stripPrefix(n));
}

function isVanStar(n: string): boolean {
  return /\[SAO VẬN\]|Vận\s+/i.test(n) || /^Vận\s/i.test(stripPrefix(n));
}

function satBase(p: any): string[] {
  // starTokensOf: "nóng tiềm ẩn" phải tính cả Hóa Kỵ bẩm sinh (mutagen) —
  // trước đây chỉ quét tên nên Hóa Kỵ bẩm sinh không bao giờ được cộng nhiệt.
  // isSatKyStarName: bỏ hậu tố "(Sao X)" → thấy cả nhãn "Lưu Hóa Kỵ (…)" của app.
  return starTokensOf(p)
    .map((s: any) => String(s?.name || "").trim())
    .map(stripPrefix)
    .filter((n) => isSatKyStarName(n));
}

function hasNatal(names: string[], re: RegExp): boolean {
  return names.some((n) => !isLuuStar(n) && !isVanStar(n) && re.test(stripPrefix(n)));
}

/** Điểm “nóng tiềm ẩn” của cung (0–50). */
function latentHeat(
  p: any,
  menhBranch: number,
  keyKw: string[],
): { score: number; reasons: string[]; blind: string[] } {
  const name = String(p?.name || "");
  const b = toBranchIndex(p.index);
  // names gồm cả token "Hóa Kỵ/Lộc/Quyền/Khoa" bẩm sinh (mutagen) để hasNatal thấy
  const names = starTokensOf(p).map((s: any) => String(s?.name || "").trim()).filter(Boolean);
  const reasons: string[] = [];
  const blind: string[] = [];
  let score = 0;

  const isKey = keyKw.some((k) => name.includes(k));
  if (isKey) {
    score += 8;
    reasons.push("cung then chốt đời sống");
  }

  const sats = satBase(p);
  if (sats.length >= 2) {
    score += 22;
    reasons.push(`sát/kỵ dày: ${sats.slice(0, 4).join(", ")}`);
  } else if (sats.length === 1) {
    score += 12;
    reasons.push(`sát/kỵ: ${sats[0]}`);
  }

  if (hasNatal(names, /Hóa Kỵ|hóa kỵ/i)) {
    score += 14;
    reasons.push("Hóa Kỵ bẩm sinh/đồng cung");
    if (name.includes("Phu") || name.includes("Phối")) {
      blind.push("LỆCH SÓNG LỜI / thiếu tiêu chuẩn rõ ràng (Phu Thê×Kỵ)");
    }
    if (name.includes("Nô")) blind.push("THỊ PHI NHÓM / tin sai kênh (Nô×Kỵ)");
    if (name.includes("Tài")) blind.push("ẢI TIỀN / chấp về của (Tài×Kỵ)");
  }

  if (hasNatal(names, /Địa Không|Địa Kiếp|Không|Kiếp/i) && name.includes("Nô")) {
    score += 18;
    reasons.push("Không–Kiếp Nô (bẫy quan hệ–tiền)");
    blind.push("TIN SAI KÊNH — hao qua bạn bè/đối tác");
  }

  if (name.includes("Mệnh")) {
    score += 10;
    reasons.push("cung Mệnh");
    if (hasNatal(names, /Thiên Cơ/i) && hasNatal(names, /Tuần|Triệt/i)) {
      score += 10;
      blind.push("OVERTHINK–TÊ LIỆT (Cơ+Tuần/Triệt Mệnh)");
    } else if (hasNatal(names, /Thiên Cơ/i)) {
      blind.push("MƯU SĨ TỰ TRÓI (Cơ Mệnh)");
    }
    if (hasNatal(names, /Tuần|Triệt/i)) {
      blind.push("TỰ GIẢM LỰC (Tuần/Triệt Mệnh)");
    }
  }

  // Hình học với Mệnh
  if (b === (menhBranch + 6) % 12) {
    score += 8;
    reasons.push("xung chiếu Mệnh");
  }
  if (b === NHI_HOP[menhBranch]) {
    score += 6;
    reasons.push("nhị hợp Mệnh (sóng ngầm)");
  }
  if (b === LUC_HAI[menhBranch]) {
    score += 7;
    reasons.push("lục hại Mệnh (ma sát)");
    if (name.includes("Tật")) blind.push("THÂN GÁNH TÍNH (Tật lục hại Mệnh)");
  }

  if (hasNatal(names, /Văn Khúc/i) && hasNatal(names, /Hóa Kỵ|Kỵ/i)) {
    // "Văn Khúc Kỵ" phải là Văn Khúc CHÍNH NÓ thụ Kỵ bẩm sinh (can Kỷ) —
    // không phải chỉ vì cùng cung có sao thụ Kỵ khác (Giáp: Thái Dương Kỵ).
    const vanKhucKy = allStarsOf(p).some((s: any) => {
      const raw = String(s?.name || "");
      if (isLuuStar(raw) || isVanStar(raw)) return false;
      if (!/Văn Khúc/i.test(stripPrefix(raw))) return false;
      return mutagenLabelOf(s?.mutagen) === "Hóa Kỵ";
    });
    if (vanKhucKy) blind.push("LỜI HỨA BỘT PHÁT (Văn Khúc Kỵ)");
  }
  if (hasNatal(names, /Thiên Hình/i) && name.includes("Tật")) {
    blind.push("HÌNH–THÂN (dao kéo / va chạm — phòng, không chẩn bệnh)");
  }

  // Thủ tài yếu
  if (
    (name.includes("Điền") || name.includes("Phúc")) &&
    hasNatal(names, /Triệt|Không Vong|Tuần|Không|Kiếp/i)
  ) {
    score += 8;
    reasons.push("Thủ tài / phúc khí bị khóa–rỗng dấu hiệu");
    blind.push("KIẾM ĐƯỢC–GIỮ MÙ (trục thủ yếu)");
  }

  return { score: Math.min(50, score), reasons, blind: [...new Set(blind)] };
}

/**
 * Xung lực hạn đáp cung (0–48).
 * Không cộng chồng Lưu sao Hóa Kỵ + Lưu Tứ Hóa Kỵ cùng cung (lấy max nhóm).
 */
function pulseHeat(
  p: any,
  chartData: any,
  yearlyItems: { hoa: string; star: string; palaceName?: string }[],
  decadalItems: { hoa: string; star: string; palaceName?: string }[],
): { score: number; pulses: string[] } {
  const name = String(p?.name || "");
  const pulses: string[] = [];
  let score = 0;

  const thaiTue = String(chartData?.transitLuuThaiTuePalace || "");
  const tieuHan = String(chartData?.transitYearlyPalace || "");
  const daiHan = String(chartData?.transitDecadalPalace || "");
  const year = chartData?.transitYear ?? "";

  if (thaiTue && namesMatchPalace(name, thaiTue)) {
    score += 28;
    pulses.push(`Lưu Thái Tuế đóng ${name} (năm ${year})`);
  }
  if (tieuHan && namesMatchPalace(name, tieuHan)) {
    score += 14;
    pulses.push(`Tiểu hạn năm đóng ${name}`);
  }
  if (daiHan && namesMatchPalace(name, daiHan)) {
    score += 10;
    pulses.push(`Đại hạn (10 năm) đóng ${name}`);
  }

  // Nhóm Lưu Kỵ / Vận Kỵ: chỉ lấy 1 điểm cao nhất (tránh double-count)
  let kyPulse = 0;
  let kyLabel = "";
  for (const raw of allNames(p)) {
    const n = stripPrefix(raw);
    const luu = isLuuStar(raw) || /^Lưu\s/i.test(n);
    const van = isVanStar(raw) || /^Vận\s/i.test(n);
    if (!luu && !van) continue;

    if (/Hóa Kỵ|(?:^|[\s])Kỵ/i.test(n) && !/Khoa|Quyền|Lộc/i.test(n.replace(/Hóa Kỵ/g, ""))) {
      const pts = luu ? 30 : 16;
      if (pts > kyPulse) {
        kyPulse = pts;
        kyLabel = `${luu ? "Lưu" : "Vận"} Hóa Kỵ tại ${name}`;
      }
    } else if (/Thái Tuế/i.test(n)) {
      // đã cộng cung Thái Tuế; sao đồng cung chỉ ghi nhận nhẹ
      score += 4;
      pulses.push(`Lưu Thái Tuế (sao) tại ${name}`);
    } else if (/Kình/i.test(n)) {
      score += luu ? 18 : 12;
      pulses.push(`${luu ? "Lưu" : "Vận"} Kình tại ${name}`);
    } else if (/Đà La/i.test(n)) {
      score += luu ? 12 : 8;
      pulses.push(`${luu ? "Lưu" : "Vận"} Đà tại ${name}`);
    } else if (/Tang|Bạch Hổ|Khốc|Hư/i.test(n)) {
      score += 8;
      pulses.push(`${n} tại ${name}`);
    } else if (/Không|Kiếp/i.test(n)) {
      score += 14;
      pulses.push(`${n} lưu/vận tại ${name}`);
    } else if (luu) {
      score += 4;
      pulses.push(`Sao lưu: ${n}`);
    }
  }

  for (const it of yearlyItems) {
    if (!it.palaceName || !namesMatchPalace(name, it.palaceName)) continue;
    if (/Kỵ/i.test(it.hoa)) {
      const pts = 30;
      if (pts > kyPulse) {
        kyPulse = pts;
        kyLabel = `Lưu ${it.hoa} → ${it.star} đáp ${name}`;
      } else {
        pulses.push(`Lưu ${it.hoa} → ${it.star} đáp ${name}`);
      }
    } else if (/Quyền/i.test(it.hoa)) {
      score += 12;
      pulses.push(`Lưu ${it.hoa} → ${it.star} đáp ${name}`);
    } else if (/Lộc/i.test(it.hoa)) {
      score += 9;
      pulses.push(`Lưu ${it.hoa} → ${it.star} đáp ${name}`);
    } else if (/Khoa/i.test(it.hoa)) {
      score += 8;
      pulses.push(`Lưu ${it.hoa} → ${it.star} đáp ${name}`);
    }
  }

  for (const it of decadalItems) {
    if (!it.palaceName || !namesMatchPalace(name, it.palaceName)) continue;
    if (/Kỵ/i.test(it.hoa)) {
      const pts = 14;
      if (pts > kyPulse) {
        kyPulse = pts;
        kyLabel = `Vận ${it.hoa} → ${it.star} đáp ${name}`;
      } else {
        pulses.push(`Vận ${it.hoa} → ${it.star} đáp ${name}`);
      }
    } else if (/Quyền|Lộc|Khoa/i.test(it.hoa)) {
      score += 7;
      pulses.push(`Vận ${it.hoa} → ${it.star} đáp ${name}`);
    }
  }

  if (kyPulse > 0) {
    score += kyPulse;
    if (kyLabel) pulses.push(kyLabel);
  }

  const uniq = [...new Set(pulses)];
  return { score: Math.min(48, score), pulses: uniq };
}

function namesMatchPalace(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  // "Tài Bạch" chứa "Tài Bạch"; "Tài Bạch" vs keyword "Tài" — chỉ khi b là prefix từ đầy đủ
  if (a.includes(b) && b.length >= 2) return true;
  if (b.includes(a) && a.length >= 3) return true;
  // Tránh core 2-ký-tự (dễ đụng Mệnh/Mùi lệch Unicode) — chỉ khớp từ đầu tên cung
  const head = (s: string) => s.replace(/\s+/g, "").slice(0, 3);
  return head(a) === head(b) && head(a).length >= 3;
}

function levelOf(total: number): TriggerLevel | null {
  // Siết ngưỡng: tránh cả lá toàn CAO (cộng điểm trùng / quá nhạy)
  if (total >= 72) return "cao";
  if (total >= 52) return "vua";
  if (total >= 38) return "nen";
  return null;
}

function buildDirective(t: TemporalTrigger, year: number): string {
  const lvl =
    t.level === "cao" ? "CAO" : t.level === "vua" ? "VỪA" : "NỀN";
  const blind = t.blindHints[0] ? ` | nền nóng: ${t.blindHints[0]}` : "";
  return (
    `[KÍCH HOẠT ${year} — mức ${lvl}] ${t.pulses.slice(0, 2).join("; ")} ` +
    `→ cung ${t.palaceName} (${t.domain})${blind}. ` +
    `AI: luận 4–8 câu ĐỜI THỰC đúng kênh này; ` +
    (t.level === "cao"
      ? `CẤM viết "năm êm/bình hòa" cho kênh này; `
      : `có thể êm kênh khác nhưng không bỏ qua kênh này; `) +
    `CẤM tuyệt đối hóa (chắc chắn ly hôn/phá sản); chỉ CÓ XU HƯỚNG + điều kiện.`
  );
}

const KEY_KW = ["Mệnh", "Phu", "Phối", "Tài", "Quan", "Nô", "Tật", "Phụ", "Di", "Điền", "Phúc", "Huynh"];

/**
 * Phân tích kích hoạt hạn × cung nóng.
 */
export function analyzeTemporalTriggers(
  idx: ChartIndex,
  palacesArr: any[],
  chartData: any,
): TemporalTriggerAnalysis {
  const transitYear = Number(chartData?.transitYear) || new Date().getFullYear();
  const menh =
    palaceByName(palacesArr, "Mệnh") ||
    palacesArr.find((p: any) => p?.isOriginalPalace);
  const menhBranch = menh ? toBranchIndex(menh.index) : 0;

  const yearlyItems = (chartData?.transitYearlyTuHoa?.items || []) as {
    hoa: string;
    star: string;
    palaceName?: string;
  }[];
  const decadalItems = (chartData?.transitDecadalTuHoa?.items || []) as {
    hoa: string;
    star: string;
    palaceName?: string;
  }[];

  const triggers: TemporalTrigger[] = [];
  // Giao thoa 3 tầng: tính 1 lần, bonus lót tay theo cung (đã trừ double-count)
  const { pins: trungPhungPins } = analyzeTrungPhung(palacesArr, chartData);

  for (const p of palacesArr || []) {
    if (!p) continue;
    const name = String(p.name || "");
    const b = toBranchIndex(p.index);
    const latent = latentHeat(p, menhBranch, KEY_KW);
    const pulse = pulseHeat(p, chartData, yearlyItems, decadalItems);
    // Bonus trùng phùng: cung có pin giao thoa được cộng trước cổng lọc
    const tpBonus = trungPhungBonusFor(name, trungPhungPins);
    const tpLabels = trungPhungPins
      .filter(
        (pin) =>
          pin.palaceName === name ||
          (pin.palaceName && name && (pin.palaceName.includes(name) || name.includes(pin.palaceName))),
      )
      .map((pin) => `Giao thoa 3 tầng: ${pin.label} tại ${pin.palaceName}`);
    if (tpBonus > 0) pulse.pulses.unshift(...[...new Set(tpLabels)]);
    const pulseScore = pulse.score + tpBonus;

    // Cần có xung lực hạn mới thành "điểm kích hoạt hạn"
    if (pulseScore < 10) continue;
    // Cần latent tối thiểu HOẶC pulse rất mạnh (Thái Tuế/Lưu Kỵ đáp Mệnh)
    if (latent.score < 8 && pulseScore < 30) continue;

    const total = latent.score + pulseScore;
    // Bonus giao nhẹ — không đẩy ồ ạt lên CAO
    const combo =
      latent.score >= 20 && pulseScore >= 26
        ? 8
        : latent.score >= 14 && pulseScore >= 20
          ? 4
          : 0;
    const finalScore = total + combo;
    const level = levelOf(finalScore);
    if (!level) continue;

    const t: TemporalTrigger = {
      level,
      score: finalScore,
      palaceName: name,
      branch: BRANCHES_VI[b] || "?",
      domain: domainOf(name),
      pulses: pulse.pulses,
      latent: latent.reasons,
      blindHints: latent.blind,
      directive: "",
    };
    t.directive = buildDirective(t, transitYear);
    triggers.push(t);
  }

  triggers.sort((a, b) => b.score - a.score);
  // Trần 5 — ưu tiên CAO
  const top = triggers.slice(0, 5);
  const report = formatTemporalTriggerReport(transitYear, top, chartData);

  return { transitYear, triggers: top, report };
}

export function formatTemporalTriggerReport(
  year: number,
  triggers: TemporalTrigger[],
  chartData?: any,
): string {
  const lines: string[] = [];
  const thai = chartData?.transitLuuThaiTuePalace || "—";
  const tieu = chartData?.transitYearlyPalace || "—";
  const dai = chartData?.transitDecadalPalace || "—";

  lines.push(`### META NĂM XEM ${year}`);
  lines.push(`  - Lưu Thái Tuế: ${thai} | Tiểu hạn: ${tieu} | Đại hạn: ${dai}`);
  lines.push(
    `  - Quy tắc: CAO = xoáy bước ngoặt kênh đó; VỪA = nhắc rõ; NỀN = phụ. Không kích hoạt CAO → được luận êm hơn, CẤM bịa sóng.`,
  );

  if (triggers.length === 0) {
    lines.push("### KẾT QUẢ QUÉT");
    lines.push(
      `  - Năm ${year}: KHÔNG phát hiện kích hoạt mạnh (Lưu/Vận × cung nóng/va đập).`,
    );
    lines.push(
      `  - AI: được nói các kênh tương đối êm; vẫn bám sao lưu thực có; CẤM tự bịa "năm nổ lớn" không có trong sheet này.`,
    );
    return lines.join("\n");
  }

  const cao = triggers.filter((t) => t.level === "cao");
  const vua = triggers.filter((t) => t.level === "vua");
  const nen = triggers.filter((t) => t.level === "nen");

  lines.push("### CHUỖI KÍCH HOẠT (máy xếp điểm)");
  let i = 1;
  for (const t of triggers) {
    const tag = t.level === "cao" ? "CAO" : t.level === "vua" ? "VỪA" : "NỀN";
    lines.push(
      `  ${i}. [${tag} · ${t.score}đ] ${t.palaceName} (${t.branch}) — ${t.domain}`,
    );
    lines.push(`     Xung lực: ${t.pulses.join(" | ") || "—"}`);
    lines.push(`     Nóng sẵn: ${t.latent.join("; ") || "—"}`);
    if (t.blindHints.length) {
      lines.push(`     Nền nóng/va đập (tham chiếu): ${t.blindHints.join("; ")}`);
    }
    lines.push(`     → ${t.directive}`);
    i++;
  }

  lines.push("### LỆNH CHO AI (BẮT BUỘC)");
  if (cao.length) {
    lines.push(
      `  - Có ${cao.length} kích hoạt CAO: trong Phần 3 (Tiểu hạn ${year}) phải có đoạn riêng "Bước ngoặt / kênh nổi" cho: ${cao.map((t) => t.palaceName).join(", ")}.`,
    );
    lines.push(
      `  - CẤM câu "năm nay nhìn chung bình hòa" nếu chưa xử lý hết kích hoạt CAO.`,
    );
  } else if (vua.length) {
    lines.push(
      `  - Kích hoạt VỪA: nhắc rõ kênh ${vua.map((t) => t.palaceName).join(", ")} trong tóm năm; không phóng đại thành khủng hoảng.`,
    );
  }
  lines.push(
    `  - Mỗi kích hoạt: (1) việc đời thực có thể gặp → (2) sao/hạn máy nào bật → (3) 1 hành động may đo. Giọng khoa học mệnh lý: sắc, có trọng số, không hù.`,
  );
  lines.push(
    `  - Tuổi mụ: chỉnh ngôn (học sinh ≠ ly hôn). Chỉ "CÓ XU HƯỚNG".`,
  );

  return lines.join("\n");
}

/** Build string cho prompt — entry chính. */
export function buildTemporalTriggerReport(
  idx: ChartIndex,
  palacesArr: any[],
  chartData: any,
): string {
  return analyzeTemporalTriggers(idx, palacesArr, chartData).report;
}

/** Bản gọn cho chat (top 3). */
export function buildTemporalTriggerReportChat(
  idx: ChartIndex,
  palacesArr: any[],
  chartData: any,
  maxTriggers = 3,
): string {
  const { transitYear, triggers } = analyzeTemporalTriggers(idx, palacesArr, chartData);
  const top = triggers.slice(0, maxTriggers);
  if (!top.length) {
    return (
      `Năm ${transitYear}: máy không gắn kích hoạt mạnh hạn×nền nóng. ` +
      `Trả lời bám sao lưu/cung hỏi; cấm bịa "năm nổ".`
    );
  }
  return top
    .map((t, i) => {
      const tag = t.level === "cao" ? "CAO" : t.level === "vua" ? "VỪA" : "NỀN";
      return (
        `(${i + 1}) [${tag}] ${t.palaceName}: ${t.pulses.slice(0, 2).join("; ")}` +
        (t.blindHints[0] ? ` | nền: ${t.blindHints[0]}` : "") +
        `\n    ${t.directive}`
      );
    })
    .join("\n");
}
