// ============================================================================
// LƯU NIÊN EVENT CARDS — MÁY ĐÚC THẺ SỰ KIỆN NĂM
//
// Không chỉ list sao: gom Lưu sao + Lưu Tứ Hóa + Thái Tuế/Tiểu hạn
// → thẻ domain đời thực (tiền / việc / tình / sức / bản thân / mạng lưới).
// AI bám thẻ để viết Tiểu hạn sắc, dễ nhớ; CẤM bịa thẻ ngoài list.
// ============================================================================

import {
  allStarsOf,
  BRANCHES_VI,
  toBranchIndex,
} from "../utils/chartRelations";
import { analyzeTrungPhung } from "./trungPhung";

export type EventDomain =
  | "tien"
  | "viec"
  | "tinh_gia"
  | "suc"
  | "ban_than"
  | "mang_luoi"
  | "di_chuyen";

export type EventPolarity = "thuan" | "ap_luc" | "hon_hop";

export interface LuuNienEventCard {
  id: string;
  domain: EventDomain;
  domainLabel: string;
  polarity: EventPolarity;
  heat: number;
  headline: string;
  /** Sự kiện đời thực 1 câu (máy) */
  story: string;
  /** Tín hiệu máy (sao/cung/hóa) — AI neo, không bịa thêm */
  signals: string[];
  /** NÊN ngắn may đo domain */
  nen: string;
  palaceHints: string[];
}

export interface LuuNienEventCardsResult {
  year: number;
  cards: LuuNienEventCard[];
  summaryLine: string;
  reportText: string;
}

const DOMAIN_LABEL: Record<EventDomain, string> = {
  tien: "TIỀN BẠC",
  viec: "CÔNG VIỆC / HỌC",
  tinh_gia: "TÌNH CẢM / GIA ĐẠO",
  suc: "SỨC KHỎE",
  ban_than: "BẢN THÂN / NỘI TÂM",
  mang_luoi: "BẠN BÈ / ĐỒNG SỰ",
  di_chuyen: "ĐI LẠI / MÔI TRƯỜNG",
};

/** Cung → domain đời (iztro vi-VN name contains). */
function domainOfPalace(palaceName: string): EventDomain {
  const n = String(palaceName || "");
  if (/Tài|Điền/i.test(n)) return "tien";
  if (/Quan|Phụ/i.test(n)) return "viec";
  if (/Phu|Thê|Tử|Huynh/i.test(n)) return "tinh_gia";
  if (/Tật/i.test(n)) return "suc";
  if (/Thiên Di|Di(?![\p{L}])/iu.test(n)) return "di_chuyen";
  if (/Nô/i.test(n)) return "mang_luoi";
  if (/Mệnh|Thân|Phúc/i.test(n)) return "ban_than";
  return "ban_than";
}

interface SignalHit {
  domain: EventDomain;
  palaceName: string;
  branch: string;
  label: string;
  /** + thuận, − áp lực */
  weight: number;
  kind: string;
}

function stripLuu(name: string): string {
  return String(name || "")
    .replace(/\[SAO\s*LƯU\]\s*/gi, "")
    .replace(/^Lưu\s+/i, "")
    .trim();
}

function stripVan(name: string): string {
  return String(name || "")
    .replace(/\[SAO\s*VẬN\]\s*/gi, "")
    .replace(/^Vận\s+/i, "")
    .trim();
}

function classifyLuuStar(starName: string): { weight: number; kind: string } | null {
  const n = stripLuu(starName);
  if (!n) return null;

  // Hung / áp lực
  // (Lưu ý regex JS: \b KHÔNG hoạt động với ký tự tiếng Việt có dấu — "Kỵ\b"
  // không bao giờ khớp; chỉ dùng chuỗi con đầy đủ "Hóa Kỵ"/"Đà La".)
  if (/Hóa Kỵ/i.test(n) && !/Khoa|Quyền|Lộc/i.test(n.replace(/Hóa Kỵ/gi, ""))) {
    return { weight: -30, kind: "Lưu Kỵ" };
  }
  if (/Kình/i.test(n)) return { weight: -18, kind: "Lưu Kình" };
  if (/Đà/i.test(n)) return { weight: -12, kind: "Lưu Đà" };
  if (/Không|Kiếp/i.test(n)) return { weight: -16, kind: "Lưu Không/Kiếp" };
  if (/Hỏa|Linh/i.test(n)) return { weight: -14, kind: "Lưu Hỏa/Linh" };
  if (/Tang|Bạch Hổ/i.test(n)) return { weight: -12, kind: "Lưu Tang/Hổ" };
  if (/Khốc|Hư/i.test(n)) return { weight: -8, kind: "Lưu Khốc/Hư" };
  if (/Thái Tuế|Tuế(?![\p{L}])|Quan Phù/iu.test(n)) return { weight: -10, kind: "Lưu Thái Tuế/áp" };
  if (/Hình/i.test(n)) return { weight: -10, kind: "Lưu Hình" };
  if (/Hao/i.test(n)) return { weight: -10, kind: "Lưu Hao" };

  // Cát / thuận
  if (/Hóa Lộc/i.test(n) && !/Lộc Tồn/i.test(n)) {
    return { weight: 16, kind: "Lưu Lộc" };
  }
  if (/Lộc Tồn/i.test(n)) return { weight: 12, kind: "Lưu Lộc Tồn" };
  if (/Hóa Quyền|Quyền/i.test(n)) return { weight: 14, kind: "Lưu Quyền" };
  if (/Hóa Khoa|Khoa/i.test(n)) return { weight: 12, kind: "Lưu Khoa" };
  if (/Khôi|Việt/i.test(n)) return { weight: 10, kind: "Lưu Khôi/Việt" };
  if (/Xương|Khúc/i.test(n)) return { weight: 8, kind: "Lưu Xương/Khúc" };
  if (/Mã/i.test(n)) return { weight: 6, kind: "Lưu Mã" };
  if (/Hồng|Hỷ|Đào|Hỉ/i.test(n)) return { weight: 8, kind: "Lưu đào hoa/hỷ" };
  if (/Giải/i.test(n)) return { weight: 6, kind: "Niên Giải" };

  return { weight: 3, kind: `Lưu ${n}` };
}

/**
 * Phân loại sao VẬN (đại hạn 10 năm) — nền chậm, weight ~60% sao Lưu
 * để không thổi phồng thẻ năm nhưng vẫn neo được tầng đại hạn.
 */
function classifyVanStar(starName: string): { weight: number; kind: string } | null {
  const n = stripVan(starName);
  if (!n) return null;

  if (/Hóa Kỵ/i.test(n) && !/Khoa|Quyền|Lộc/i.test(n.replace(/Hóa Kỵ/gi, ""))) {
    return { weight: -18, kind: "Vận Kỵ" };
  }
  if (/Kình/i.test(n)) return { weight: -11, kind: "Vận Kình" };
  if (/Đà/i.test(n)) return { weight: -7, kind: "Vận Đà" };
  if (/Không|Kiếp/i.test(n)) return { weight: -10, kind: "Vận Không/Kiếp" };
  if (/Hỏa|Linh/i.test(n)) return { weight: -8, kind: "Vận Hỏa/Linh" };
  if (/Tang|Bạch Hổ/i.test(n)) return { weight: -7, kind: "Vận Tang/Hổ" };
  if (/Khốc|Hư/i.test(n)) return { weight: -5, kind: "Vận Khốc/Hư" };
  if (/Thái Tuế|Tuế(?![\p{L}])|Quan Phù/iu.test(n)) return { weight: -6, kind: "Vận Tuế/áp" };
  if (/Hình/i.test(n)) return { weight: -6, kind: "Vận Hình" };
  if (/Hao/i.test(n)) return { weight: -6, kind: "Vận Hao" };

  if (/Hóa Lộc/i.test(n) && !/Lộc Tồn/i.test(n)) {
    return { weight: 10, kind: "Vận Lộc" };
  }
  if (/Lộc Tồn/i.test(n)) return { weight: 7, kind: "Vận Lộc Tồn" };
  if (/Hóa Quyền|Quyền/i.test(n)) return { weight: 8, kind: "Vận Quyền" };
  if (/Hóa Khoa|Khoa/i.test(n)) return { weight: 7, kind: "Vận Khoa" };
  if (/Khôi|Việt/i.test(n)) return { weight: 6, kind: "Vận Khôi/Việt" };
  if (/Xương|Khúc/i.test(n)) return { weight: 5, kind: "Vận Xương/Khúc" };
  if (/Mã/i.test(n)) return { weight: 4, kind: "Vận Mã" };
  if (/Hồng|Hỷ|Đào|Hỉ/i.test(n)) return { weight: 5, kind: "Vận đào hoa/hỷ" };
  if (/Giải/i.test(n)) return { weight: 4, kind: "Vận Giải" };

  return { weight: 2, kind: `Vận ${n}` };
}

function layerItems(
  layer: { items?: { hoa: string; star: string; palaceName?: string }[] } | null | undefined,
): { hoa: string; star: string; palaceName: string }[] {
  if (!layer?.items?.length) return [];
  return layer.items
    .filter((it) => it.palaceName)
    .map((it) => ({
      hoa: String(it.hoa || ""),
      star: String(it.star || ""),
      palaceName: String(it.palaceName || ""),
    }));
}

function hoaWeight(hoa: string): { weight: number; kind: string } {
  if (/Kỵ/i.test(hoa)) return { weight: -28, kind: `Lưu ${hoa}` };
  if (/Lộc/i.test(hoa)) return { weight: 14, kind: `Lưu ${hoa}` };
  if (/Quyền/i.test(hoa)) return { weight: 12, kind: `Lưu ${hoa}` };
  if (/Khoa/i.test(hoa)) return { weight: 10, kind: `Lưu ${hoa}` };
  return { weight: 4, kind: `Lưu ${hoa}` };
}

function collectHits(palaces: any[], chartData: any): SignalHit[] {
  const hits: SignalHit[] = [];
  const yearly = layerItems(chartData?.transitYearlyTuHoa);

  for (const p of palaces || []) {
    const palaceName = String(p?.name || "");
    if (!palaceName) continue;
    const branch = BRANCHES_VI[toBranchIndex(p.index)] || "";
    const domain = domainOfPalace(palaceName);

    for (const s of allStarsOf(p)) {
      const raw = String(s?.name || "");
      const isLuu = /\[SAO\s*LƯU\]/i.test(raw) || /^Lưu\s/i.test(raw);
      const isVan = /\[SAO\s*VẬN\]/i.test(raw) || /^Vận\s/i.test(raw);
      if (!isLuu && !isVan) continue;
      const cls = isVan ? classifyVanStar(raw) : classifyLuuStar(raw);
      if (!cls) continue;
      hits.push({
        domain,
        palaceName,
        branch,
        label: `${cls.kind}@${palaceName}`,
        weight: cls.weight,
        kind: cls.kind,
      });
    }
  }

  for (const it of yearly) {
    const domain = domainOfPalace(it.palaceName);
    const { weight, kind } = hoaWeight(it.hoa);
    hits.push({
      domain,
      palaceName: it.palaceName,
      branch: "",
      label: `${kind}→${it.star}@${it.palaceName}`,
      weight,
      kind,
    });
  }

  // Neo cung Thái Tuế / Tiểu hạn (dù chưa có sao Lưu trên cung)
  const thai = String(chartData?.transitLuuThaiTuePalace || "");
  const tieu = String(chartData?.transitYearlyPalace || "");
  if (thai) {
    hits.push({
      domain: domainOfPalace(thai),
      palaceName: thai,
      branch: "",
      label: `Lưu Thái Tuế đóng ${thai}`,
      weight: -8,
      kind: "Lưu Thái Tuế",
    });
  }
  if (tieu) {
    hits.push({
      domain: domainOfPalace(tieu),
      palaceName: tieu,
      branch: "",
      label: `Tiểu hạn đóng ${tieu}`,
      weight: 4,
      kind: "Tiểu hạn",
    });
  }

  return hits;
}

function polarityFromWeights(sumPos: number, sumNeg: number): EventPolarity {
  if (sumPos > 0 && sumNeg < 0) return "hon_hop";
  if (sumNeg <= -12 && sumPos <= 6) return "ap_luc";
  if (sumPos >= 10 && sumNeg >= -6) return "thuan";
  if (sumNeg < 0) return "ap_luc";
  if (sumPos > 0) return "thuan";
  return "hon_hop";
}

function buildHeadline(domain: EventDomain, pol: EventPolarity): string {
  const map: Record<EventDomain, Record<EventPolarity, string>> = {
    tien: {
      thuan: "Dòng tiền có cửa mở",
      ap_luc: "Siết chi / tránh hố tiền",
      hon_hop: "Có vào nhưng dễ tản — van cứng",
    },
    viec: {
      thuan: "Việc–học có đà / cửa",
      ap_luc: "Va chạm–thị phi–áp lực việc",
      hon_hop: "Cơ hội kèm ma sát",
    },
    tinh_gia: {
      thuan: "Tin vui / gắn kết gia–tình",
      ap_luc: "Lệch sóng / căng quan hệ",
      hon_hop: "Gần gũi nhưng dễ hiểu lầm",
    },
    suc: {
      thuan: "Thể trạng đỡ hơn nếu giữ nhịp",
      ap_luc: "Giữ sức – tránh kiệt",
      hon_hop: "Được–mất sức theo đợt",
    },
    ban_than: {
      thuan: "Nội lực / tự tin nhịp tốt",
      ap_luc: "Tự chuốc áp / dao động nội tâm",
      hon_hop: "Tự soi – vừa đẩy vừa hãm",
    },
    mang_luoi: {
      thuan: "Quan hệ–đồng sự đỡ lực",
      ap_luc: "Bạn–đối tác dễ hao lòng tin",
      hon_hop: "Có người nâng, có kênh rủi ro",
    },
    di_chuyen: {
      thuan: "Đi lại / môi trường mới thuận",
      ap_luc: "Cẩn trọng đi đường–đổi chỗ",
      hon_hop: "Động có lộc, động có rủi ro",
    },
  };
  return map[domain][pol];
}

function buildStory(domain: EventDomain, pol: EventPolarity, palaces: string[]): string {
  const where = palaces.slice(0, 2).join(", ") || "cung liên quan";
  if (pol === "thuan") {
    return `Năm này kênh ${DOMAIN_LABEL[domain].toLowerCase()} có tín hiệu mở (neo ${where}) — nắm nhịp, đừng ảo tưởng đổ hết vốn.`;
  }
  if (pol === "ap_luc") {
    return `Năm này kênh ${DOMAIN_LABEL[domain].toLowerCase()} có áp lực theo dữ liệu máy (neo ${where}) — phòng trước, siết quy trình, không đổ lỗi “xui”.`;
  }
  return `Năm này kênh ${DOMAIN_LABEL[domain].toLowerCase()} hai chiều (neo ${where}) — lấy phần thuận, van phần áp lực.`;
}

function buildNen(domain: EventDomain, pol: EventPolarity): string {
  const byDomain: Record<EventDomain, string> = {
    tien: "Tách ví chi/tích; mọi khoản lớn có quy tắc cắt lỗ / chứng từ.",
    viec: "Hạn chót rõ + văn bản; tránh khẩu chiến cấp trên–đồng sự khi nóng.",
    tinh_gia: "Nói rõ–viết rõ ranh giới; hẹn giờ nói chuyện khi bình tĩnh.",
    suc: "Ngủ đủ; khám/giữ nếu Tật–Di nóng; không thi đua kiệt sức.",
    ban_than: "1 quyết/ngày; 24h nguội với quyết nóng; nhật ký 3 dòng.",
    mang_luoi: "Không chung vốn miệng; phân quyền tiền–việc rõ.",
    di_chuyen: "An toàn giao thông; giấy tờ đi đường/đổi chỗ đủ.",
  };
  if (pol === "thuan") return `NẮM: ${byDomain[domain]}`;
  if (pol === "ap_luc") return `PHÒNG: ${byDomain[domain]}`;
  return `CÂN: ${byDomain[domain]}`;
}

/**
 * Phân tích + đúc thẻ sự kiện năm xem hạn.
 */
export function analyzeLuuNienEventCards(
  palaces: any[],
  chartData: any,
  opts?: { maxCards?: number },
): LuuNienEventCardsResult {
  const year = Number(chartData?.transitYear) || new Date().getFullYear();
  const maxCards = opts?.maxCards ?? 5;
  const hits = collectHits(palaces || [], chartData || {});

  // Pin trùng phùng: chỉ gắn NHÃN neo vào thẻ (+0 điểm) — điểm va chạm đã tính
  // ở trigger (trungPhungBonusFor); cộng điểm ở đây sẽ double-count vỡ hiệu
  // chuẩn thẻ. Scanner phụ không được phép làm rơi cả thẻ năm khi lỗi.
  try {
    const { pins } = analyzeTrungPhung(palaces || [], chartData || {});
    for (const pin of pins) {
      hits.push({
        domain: domainOfPalace(pin.palaceName),
        palaceName: pin.palaceName,
        branch: pin.branch,
        label: `${pin.label}@${pin.palaceName} (trùng phùng ${pin.layers.join("×")})`,
        weight: 0,
        kind: pin.label,
      });
    }
  } catch {
    /* bỏ qua — thẻ năm vẫn đúc từ hits sao lưu như cũ */
  }

  const byDomain = new Map<
    EventDomain,
    { pos: number; neg: number; signals: string[]; palaces: Set<string> }
  >();

  for (const h of hits) {
    let g = byDomain.get(h.domain);
    if (!g) {
      g = { pos: 0, neg: 0, signals: [], palaces: new Set() };
      byDomain.set(h.domain, g);
    }
    if (h.weight >= 0) g.pos += h.weight;
    else g.neg += h.weight;
    g.palaces.add(h.palaceName);
    if (g.signals.length < 6) g.signals.push(h.label);
  }

  const cards: LuuNienEventCard[] = [];
  for (const [domain, g] of byDomain) {
    const heat = Math.abs(g.pos) + Math.abs(g.neg);
    if (heat < 6 && g.signals.length === 0) continue;
    const pol = polarityFromWeights(g.pos, g.neg);
    const palaceList = [...g.palaces];
    cards.push({
      id: `ev-${domain}`,
      domain,
      domainLabel: DOMAIN_LABEL[domain],
      polarity: pol,
      heat,
      headline: buildHeadline(domain, pol),
      story: buildStory(domain, pol, palaceList),
      signals: [...new Set(g.signals)].slice(0, 6),
      nen: buildNen(domain, pol),
      palaceHints: palaceList.slice(0, 4),
    });
  }

  cards.sort((a, b) => b.heat - a.heat);
  const top = cards.slice(0, maxCards);

  const summaryLine =
    top.length === 0
      ? `Năm ${year}: chưa đủ tín hiệu Lưu/Vận nổi — luận êm, bám Tiểu hạn/cung hạn, không bịa nổ.`
      : `Năm ${year} — kênh nóng: ${top
          .slice(0, 3)
          .map((c) => `${c.domainLabel}(${c.polarity === "thuan" ? "thuận" : c.polarity === "ap_luc" ? "áp" : "lẫn"})`)
          .join(" · ")}`;

  return {
    year,
    cards: top,
    summaryLine,
    reportText: formatLuuNienEventCardsReport({ year, cards: top, summaryLine, reportText: "" }),
  };
}

export function formatLuuNienEventCardsReport(r: LuuNienEventCardsResult): string {
  const lines: string[] = [
    `=== THẺ SỰ KIỆN LƯU NIÊN ${r.year} (MÁY ĐÚC — BẮT BUỘC BÁM PHẦN TIỂU HẠN) ===`,
    "CẤM bịa thẻ/domain ngoài list. CẤM chỉ liệt kê sao khô — phải diễn thành chuyện đời theo thẻ.",
    "Mỗi thẻ = 1 kênh năm: headline → story → neo tín hiệu máy → 1 NÊN. Gộp chân dung năm, không dàn 12 cung.",
    "",
    `[TÓM NĂM] ${r.summaryLine}`,
    "",
  ];

  if (!r.cards.length) {
    lines.push("  (Chưa có thẻ nổi — năm êm hoặc thiếu sao Lưu/Vận trên payload.)");
    return lines.join("\n").trim();
  }

  const polLabel = (p: EventPolarity) =>
    p === "thuan" ? "THUẬN" : p === "ap_luc" ? "ÁP LỰC" : "HỖN HỢP";

  r.cards.forEach((c, i) => {
    lines.push(
      `${i + 1}. [${c.domainLabel}] · ${polLabel(c.polarity)} · nhiệt ${c.heat}`,
    );
    lines.push(`   HEADLINE: ${c.headline}`);
    lines.push(`   CHUYỆN: ${c.story}`);
    lines.push(`   TÍN HIỆU MÁY: ${c.signals.join("; ") || "—"}`);
    if (c.palaceHints.length) {
      lines.push(`   CUNG NEO: ${c.palaceHints.join(", ")}`);
    }
    lines.push(`   ${c.nen}`);
    lines.push("");
  });

  lines.push(
    "[CÁCH DÙNG] Phần Luận giải Tiểu Hạn: mở bằng [TÓM NĂM], rồi xoáy 2–4 thẻ nhiệt cao; thẻ THUẬN = nắm, ÁP LỰC = phòng, HỖN HỢP = van. Cấm 'năm bình hòa' nếu còn thẻ ÁP LỰC nhiệt cao.",
  );

  return lines.join("\n").trim();
}

/** API gọn cho prompt. */
export function buildLuuNienEventCardsReport(
  palaces: any[],
  chartData: any,
  opts?: { maxCards?: number },
): string {
  return analyzeLuuNienEventCards(palaces, chartData, opts).reportText;
}
