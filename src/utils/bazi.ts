// ============================================================================
// Module BÁT TỰ / TỨ TRỤ (八字 / 四柱) — chạy SONG SONG với lá số Tử Vi.
//
// Mục tiêu: từ CÙNG MỘT thời điểm sinh đã chuẩn hoá về GMT+7 (normalizeToHanoi
// trong tuvi.ts), dựng thêm lá Tứ Trụ để AI luận giải CHÉO với Tử Vi:
//   - Chỗ nào Tử Vi và Bát Tự đồng thuận  -> độ tin cậy cao, nhấn mạnh.
//   - Chỗ nào mâu thuẫn                     -> nêu rõ, không cưỡng ép.
//
// NGUỒN TÍNH TOÁN: thư viện `lunar-typescript` (cùng hệ lịch can-chi với `iztro`
// mà dự án đang dùng cho Tử Vi) -> bảo đảm năm/tháng/ngày/giờ can-chi nhất quán.
//
// Thư viện trả ra ký tự Hán; toàn bộ thuật ngữ được ánh xạ sang Hán-Việt chuẩn
// (giữ đúng quy ước thuật ngữ mệnh lý) để khớp với phần còn lại của dự án.
// ============================================================================

import { Solar } from "lunar-typescript";

// ----------------------------------------------------------------------------
// BẢNG ÁNH XẠ HÁN -> VIỆT (single source of truth cho Bát Tự).
// ----------------------------------------------------------------------------

// Thiên Can (天干)
export const GAN_VI: Record<string, string> = {
  "甲": "Giáp", "乙": "Ất", "丙": "Bính", "丁": "Đinh", "戊": "Mậu",
  "己": "Kỷ", "庚": "Canh", "辛": "Tân", "壬": "Nhâm", "癸": "Quý",
};

// Địa Chi (地支)
export const ZHI_VI: Record<string, string> = {
  "子": "Tý", "丑": "Sửu", "寅": "Dần", "卯": "Mão", "辰": "Thìn", "巳": "Tỵ",
  "午": "Ngọ", "未": "Mùi", "申": "Thân", "酉": "Dậu", "戌": "Tuất", "亥": "Hợi",
};

// Ngũ Hành (五行)
export const WUXING_VI: Record<string, string> = {
  "金": "Kim", "木": "Mộc", "水": "Thủy", "火": "Hỏa", "土": "Thổ",
};

// Ngũ hành của Thiên Can
export const GAN_WUXING: Record<string, string> = {
  "甲": "Mộc", "乙": "Mộc", "丙": "Hỏa", "丁": "Hỏa", "戊": "Thổ",
  "己": "Thổ", "庚": "Kim", "辛": "Kim", "壬": "Thủy", "癸": "Thủy",
};

// Âm/Dương của Thiên Can (Dương: Giáp Bính Mậu Canh Nhâm)
export const GAN_AMDUONG: Record<string, "Dương" | "Âm"> = {
  "甲": "Dương", "乙": "Âm", "丙": "Dương", "丁": "Âm", "戊": "Dương",
  "己": "Âm", "庚": "Dương", "辛": "Âm", "壬": "Dương", "癸": "Âm",
};

// Ngũ hành của Địa Chi (bản khí)
export const ZHI_WUXING: Record<string, string> = {
  "寅": "Mộc", "卯": "Mộc", "巳": "Hỏa", "午": "Hỏa", "申": "Kim", "酉": "Kim",
  "亥": "Thủy", "子": "Thủy", "辰": "Thổ", "戌": "Thổ", "丑": "Thổ", "未": "Thổ",
};

// Thập Thần (十神)
export const SHISHEN_VI: Record<string, string> = {
  "日主": "Nhật Chủ",       // can ngày = bản thân đương số
  "比肩": "Tỷ Kiên",
  "劫财": "Kiếp Tài",
  "食神": "Thực Thần",
  "伤官": "Thương Quan",
  "偏财": "Thiên Tài",
  "正财": "Chính Tài",
  "七杀": "Thất Sát",       // = Thiên Quan
  "正官": "Chính Quan",
  "偏印": "Thiên Ấn",       // = Kiêu Thần
  "正印": "Chính Ấn",
};

// Nạp Âm (纳音) — Lục thập hoa giáp.
export const NAYIN_VI: Record<string, string> = {
  "海中金": "Hải Trung Kim", "炉中火": "Lư Trung Hỏa", "大林木": "Đại Lâm Mộc",
  "路旁土": "Lộ Bàng Thổ", "剑锋金": "Kiếm Phong Kim", "山头火": "Sơn Đầu Hỏa",
  "涧下水": "Giản Hạ Thủy", "城头土": "Thành Đầu Thổ", "白蜡金": "Bạch Lạp Kim",
  "杨柳木": "Dương Liễu Mộc", "泉中水": "Tuyền Trung Thủy", "屋上土": "Ốc Thượng Thổ",
  "霹雳火": "Tích Lịch Hỏa", "松柏木": "Tùng Bách Mộc", "长流水": "Trường Lưu Thủy",
  "沙中金": "Sa Trung Kim", "山下火": "Sơn Hạ Hỏa", "平地木": "Bình Địa Mộc",
  "壁上土": "Bích Thượng Thổ", "金箔金": "Kim Bạc Kim", "覆灯火": "Phú Đăng Hỏa",
  "天河水": "Thiên Hà Thủy", "大驿土": "Đại Dịch Thổ", "钗钏金": "Thoa Xuyến Kim",
  "桑柘木": "Tang Đố Mộc", "大溪水": "Đại Khê Thủy", "沙中土": "Sa Trung Thổ",
  "天上火": "Thiên Thượng Hỏa", "石榴木": "Thạch Lựu Mộc", "大海水": "Đại Hải Thủy",
};

const viGan = (h: string) => GAN_VI[h] ?? h;
const viZhi = (h: string) => ZHI_VI[h] ?? h;
const viShiShen = (h: string) => SHISHEN_VI[h] ?? h;
const viNaYin = (h: string) => NAYIN_VI[h] ?? h;
const viGanChi = (gan: string, zhi: string) => `${viGan(gan)} ${viZhi(zhi)}`;

// ----------------------------------------------------------------------------
// KIỂU DỮ LIỆU
// ----------------------------------------------------------------------------

export interface BaZiPillar {
  /** Tên trụ: Năm / Tháng / Ngày / Giờ */
  label: string;
  ganVi: string;            // Thiên Can (Việt)
  zhiVi: string;            // Địa Chi (Việt)
  ganChiVi: string;         // "Canh Ngọ"
  naYinVi: string;          // Nạp Âm (Việt)
  ganElement: string;       // Ngũ hành Thiên Can
  zhiElement: string;       // Ngũ hành Địa Chi (bản khí)
  hiddenStemsVi: string[];  // Tàng Can (Việt)
  shiShenGanVi: string;     // Thập Thần của Thiên Can (so với Nhật Chủ)
  shiShenZhiVi: string[];   // Thập Thần của Tàng Can trong Địa Chi
}

export interface DaYunItem {
  startAge: number;
  startYear: number;
  ganChiVi: string;
}

export interface BaZiChart {
  // Bản thân đương số
  dayMasterVi: string;        // Can ngày, ví dụ "Nhâm"
  dayMasterElement: string;   // Ngũ hành Nhật Chủ, ví dụ "Thủy"
  dayMasterPolarity: "Dương" | "Âm";

  pillars: {
    year: BaZiPillar;
    month: BaZiPillar;
    day: BaZiPillar;
    hour: BaZiPillar;
  };

  /** Đếm ngũ hành của 8 chữ hiện (4 Can + 4 Chi bản khí). */
  wuXingVisible: Record<string, number>;
  /** Đếm ngũ hành tính cả Tàng Can (đầy đủ hơn cho luận thân vượng/nhược). */
  wuXingWithHidden: Record<string, number>;

  daYun: DaYunItem[];         // Đại Vận
  yunForward: boolean;        // Vận thuận (true) hay nghịch (false)
  yunStartSolarYmd: string;   // Ngày dương khởi vận

  lunarText: string;          // Chuỗi âm lịch để hiển thị/đối chiếu
}

// ----------------------------------------------------------------------------
// TÍNH TOÁN
// ----------------------------------------------------------------------------

function emptyWuXing(): Record<string, number> {
  return { Kim: 0, Mộc: 0, Thủy: 0, Hỏa: 0, Thổ: 0 };
}

/**
 * Dựng lá Tứ Trụ từ thời điểm đã chuẩn hoá GMT+7 (normalizedDate của tuvi.ts).
 * @param normalizedDate Date local đã quy về GMT+7 (dùng chung với Tử Vi).
 * @param gender "Nam" | "Nữ" (cho Đại Vận thuận/nghịch).
 */
export function computeBaZi(normalizedDate: Date, gender: "Nam" | "Nữ"): BaZiChart {
  // DẠ TÝ (23:00–23:59): Tử Vi an sang ngày mới (dateShift +1 trong tuvi.ts).
  // Bát Tự theo phái đa số (Tý sơ hoán nhật / 23:00 đổi ngày): tính toàn bộ
  // Tứ Trụ theo 00:30 ngày hôm sau — vừa khớp Nhật trụ với Tử Vi, vừa giữ can
  // giờ đúng Ngũ Thử Độn của can ngày mới, vừa kéo lunarText về cùng ngày âm
  // với lá Tử Vi (tránh AI thấy 2 ngày âm khác nhau cho cùng 1 lá).
  const eff = new Date(normalizedDate.getTime());
  if (eff.getHours() === 23) {
    eff.setDate(eff.getDate() + 1);
    eff.setHours(0, 30, 0, 0);
  }
  const solar = Solar.fromYmdHms(
    eff.getFullYear(),
    eff.getMonth() + 1,
    eff.getDate(),
    eff.getHours(),
    eff.getMinutes(),
    0,
  );
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  const buildPillar = (
    label: string,
    gan: string,
    zhi: string,
    naYin: string,
    hidden: string[],
    shiShenGan: string,
    shiShenZhi: string[],
  ): BaZiPillar => ({
    label,
    ganVi: viGan(gan),
    zhiVi: viZhi(zhi),
    ganChiVi: viGanChi(gan, zhi),
    naYinVi: viNaYin(naYin),
    ganElement: GAN_WUXING[gan] ?? "",
    zhiElement: ZHI_WUXING[zhi] ?? "",
    hiddenStemsVi: hidden.map(viGan),
    shiShenGanVi: viShiShen(shiShenGan),
    shiShenZhiVi: shiShenZhi.map(viShiShen),
  });

  const pillars = {
    year: buildPillar("Năm", ec.getYearGan(), ec.getYearZhi(), ec.getYearNaYin(),
      ec.getYearHideGan(), ec.getYearShiShenGan(), ec.getYearShiShenZhi()),
    month: buildPillar("Tháng", ec.getMonthGan(), ec.getMonthZhi(), ec.getMonthNaYin(),
      ec.getMonthHideGan(), ec.getMonthShiShenGan(), ec.getMonthShiShenZhi()),
    day: buildPillar("Ngày", ec.getDayGan(), ec.getDayZhi(), ec.getDayNaYin(),
      ec.getDayHideGan(), ec.getDayShiShenGan(), ec.getDayShiShenZhi()),
    hour: buildPillar("Giờ", ec.getTimeGan(), ec.getTimeZhi(), ec.getTimeNaYin(),
      ec.getTimeHideGan(), ec.getTimeShiShenGan(), ec.getTimeShiShenZhi()),
  };

  // Đếm ngũ hành.
  const wuXingVisible = emptyWuXing();
  const wuXingWithHidden = emptyWuXing();
  const ganList = [ec.getYearGan(), ec.getMonthGan(), ec.getDayGan(), ec.getTimeGan()];
  const zhiList = [ec.getYearZhi(), ec.getMonthZhi(), ec.getDayZhi(), ec.getTimeZhi()];
  const hiddenList = [
    ec.getYearHideGan(), ec.getMonthHideGan(), ec.getDayHideGan(), ec.getTimeHideGan(),
  ];
  for (const g of ganList) {
    const e = GAN_WUXING[g];
    if (e) { wuXingVisible[e]++; wuXingWithHidden[e]++; }
  }
  for (const z of zhiList) {
    const e = ZHI_WUXING[z];
    if (e) { wuXingVisible[e]++; }
  }
  for (const hg of hiddenList) {
    for (const g of hg) {
      const e = GAN_WUXING[g];
      if (e) { wuXingWithHidden[e]++; }
    }
  }

  // Đại Vận.
  const yun = ec.getYun(gender === "Nam" ? 1 : 0);
  const daYunRaw = yun.getDaYun();
  const daYun: DaYunItem[] = daYunRaw
    .map((d: any) => {
      const gz: string = d.getGanZhi();
      return {
        startAge: d.getStartAge(),
        startYear: d.getStartYear(),
        ganChiVi: gz && gz.length === 2 ? viGanChi(gz[0], gz[1]) : "(chưa nhập vận)",
      };
    })
    .filter((d: DaYunItem) => d.ganChiVi !== "(chưa nhập vận)");

  return {
    dayMasterVi: viGan(ec.getDayGan()),
    dayMasterElement: GAN_WUXING[ec.getDayGan()] ?? "",
    dayMasterPolarity: GAN_AMDUONG[ec.getDayGan()] ?? "Dương",
    pillars,
    wuXingVisible,
    wuXingWithHidden,
    daYun,
    yunForward: yun.isForward(),
    yunStartSolarYmd: yun.getStartSolar().toYmd(),
    lunarText: lunar.toString(),
  };
}

// ----------------------------------------------------------------------------
// ĐẠI VẬN ĐANG ĐI — "Bát Tự trong vận XX" (MÁY CHỐT, AI BÁM)
// ----------------------------------------------------------------------------

const GAN_ELEMENT: Record<string, string> = {
  Giáp: "Mộc", Ất: "Mộc", Bính: "Hỏa", Đinh: "Hỏa", Mậu: "Thổ",
  Kỷ: "Thổ", Canh: "Kim", Tân: "Kim", Nhâm: "Thủy", Quý: "Thủy",
};

const WX_SINH: Record<string, string> = {
  Mộc: "Hỏa", Hỏa: "Thổ", Thổ: "Kim", Kim: "Thủy", Thủy: "Mộc",
};
const WX_KHAC: Record<string, string> = {
  Mộc: "Thổ", Thổ: "Thủy", Thủy: "Hỏa", Hỏa: "Kim", Kim: "Mộc",
};

export interface CurrentDaYunResolved {
  /** Tên vận can-chi, vd "Mậu Thìn" */
  ganChiVi: string;
  startYear: number;
  /** Năm kết (bước sau - 1); null nếu là vận cuối trong list */
  endYear: number | null;
  startAge: number;
  endAge: number | null;
  index: number;
  /** Ngũ hành can vận */
  ganElement: string;
  /** Ngũ hành chi vận (bản khí) */
  zhiElement: string;
  /** Quan hệ thô can vận vs Nhật Chủ */
  vsDayMaster: "sinh_nhat" | "nhat_sinh" | "cung" | "khac_nhat" | "nhat_khac" | "trung";
  vsDayMasterNote: string;
  /** 1 dòng chốt cho AI / UI */
  headline: string;
  /** Còn bước trước/sau (tên) */
  prevGanChiVi?: string;
  nextGanChiVi?: string;
}

function zhiElementOf(ganChiVi: string): string {
  const parts = String(ganChiVi || "").trim().split(/\s+/);
  const zhi = parts[1] || "";
  const map: Record<string, string> = {
    Tý: "Thủy", Sửu: "Thổ", Dần: "Mộc", Mão: "Mộc", Thìn: "Thổ", Tỵ: "Hỏa",
    Ngọ: "Hỏa", Mùi: "Thổ", Thân: "Kim", Dậu: "Kim", Tuất: "Thổ", Hợi: "Thủy",
  };
  return map[zhi] || "";
}

function vsDayMaster(
  ganEl: string,
  dayEl: string,
): { rel: CurrentDaYunResolved["vsDayMaster"]; note: string } {
  if (!ganEl || !dayEl) return { rel: "trung", note: "chưa rõ ngũ hành can vận / Nhật Chủ" };
  if (ganEl === dayEl) return { rel: "cung", note: `Can vận ${ganEl} đồng hành Nhật Chủ ${dayEl} (tỷ kiếp khí)` };
  if (WX_SINH[ganEl] === dayEl) return { rel: "sinh_nhat", note: `Can vận ${ganEl} sinh Nhật Chủ ${dayEl} (ấn/khí nuôi)` };
  if (WX_SINH[dayEl] === ganEl) return { rel: "nhat_sinh", note: `Nhật Chủ ${dayEl} sinh can vận ${ganEl} (thực thương khí — hao/tỏa)` };
  if (WX_KHAC[ganEl] === dayEl) return { rel: "khac_nhat", note: `Can vận ${ganEl} khắc Nhật Chủ ${dayEl} (quan sát khí — áp/chế)` };
  if (WX_KHAC[dayEl] === ganEl) return { rel: "nhat_khac", note: `Nhật Chủ ${dayEl} khắc can vận ${ganEl} (tài khí — gánh/lấy)` };
  return { rel: "trung", note: `Can vận ${ganEl} vs Nhật ${dayEl}` };
}

/**
 * Chốt Đại Vận đang đi tại năm xem (startYear ≤ year < endYear bước sau).
 * Đây là nguồn sự thật cho câu "Bát Tự trong vận XX".
 */
export function resolveCurrentDaYun(
  b: BaZiChart,
  transitYear: number,
): CurrentDaYunResolved | null {
  const list = b?.daYun || [];
  if (!list.length) return null;
  const y = Number(transitYear);
  if (!Number.isFinite(y) || y < 1800 || y > 2200) return null;

  // Bước cuối có startYear ≤ năm xem
  let idx = -1;
  for (let i = 0; i < list.length; i++) {
    if (list[i].startYear <= y) idx = i;
  }
  if (idx < 0) {
    // Năm xem TRƯỚC cả vận đầu tiên trong list = chưa tới tuổi khởi vận
    // (bước "chưa nhập vận" của lunar-typescript đã bị filter khỏi list).
    // KHÔNG được gán vận đầu tiên cho trẻ chưa nhập vận — trả null.
    return null;
  }

  const cur = list[idx];
  const next = list[idx + 1];
  const prev = idx > 0 ? list[idx - 1] : undefined;
  const endYear = next ? next.startYear - 1 : null;
  const endAge =
    endYear != null && cur.startYear
      ? cur.startAge + (endYear - cur.startYear)
      : next
        ? next.startAge - 1
        : null;

  const gan = String(cur.ganChiVi || "").trim().split(/\s+/)[0] || "";
  const ganElement = GAN_ELEMENT[gan] || "";
  const zhiElement = zhiElementOf(cur.ganChiVi);
  const { rel, note } = vsDayMaster(ganElement, b.dayMasterElement);

  const yearSpan =
    endYear != null
      ? `${cur.startYear}–${endYear}`
      : `từ ${cur.startYear} (chưa chốt năm kết trong list)`;
  const ageSpan =
    endAge != null ? `${cur.startAge}–${endAge} tuổi` : `từ ${cur.startAge} tuổi`;

  const headline =
    `Bát Tự trong vận ${cur.ganChiVi} (${yearSpan}, ~${ageSpan})` +
    ` — năm xem ${y} thuộc vận này.`;

  return {
    ganChiVi: cur.ganChiVi,
    startYear: cur.startYear,
    endYear,
    startAge: cur.startAge,
    endAge,
    index: idx,
    ganElement,
    zhiElement,
    vsDayMaster: rel,
    vsDayMasterNote: note,
    headline,
    prevGanChiVi: prev?.ganChiVi,
    nextGanChiVi: next?.ganChiVi,
  };
}

/** Cheat sheet máy — AI BẮT BUỘC dùng đúng tên vận này khi nói "trong vận …". */
export function formatCurrentDaYunReport(
  b: BaZiChart,
  transitYear: number,
): string {
  const cur = resolveCurrentDaYun(b, transitYear);
  const lines: string[] = [
    `=== BÁT TỰ ĐANG TRONG VẬN NÀO (MÁY CHỐT — NĂM XEM ${transitYear}) ===`,
    "CẤM tự nhẩm / đổi tên vận. Khi luận hạn năm hoặc đối chiếu TV, phải nói đúng dòng HEADLINE dưới.",
  ];

  if (!cur) {
    lines.push("(Chưa tính được Đại Vận — thiếu list daYun, hoặc năm xem chưa tới tuổi khởi vận. KHÔNG gán tên vận.)");
    return lines.join("\n");
  }

  lines.push(`HEADLINE: ${cur.headline}`);
  lines.push(
    `- Tên vận: ${cur.ganChiVi} | Can hành: ${cur.ganElement || "?"} | Chi hành: ${cur.zhiElement || "?"}`,
  );
  lines.push(
    `- Khoảng: năm ${cur.startYear}${cur.endYear != null ? `–${cur.endYear}` : "+"} | tuổi ~${cur.startAge}${cur.endAge != null ? `–${cur.endAge}` : "+"}`,
  );
  lines.push(`- Vs Nhật Chủ (${b.dayMasterVi} ${b.dayMasterElement}): ${cur.vsDayMasterNote}`);
  if (cur.prevGanChiVi) lines.push(`- Vận trước: ${cur.prevGanChiVi}`);
  if (cur.nextGanChiVi) lines.push(`- Vận sau: ${cur.nextGanChiVi}`);
  lines.push(
    `- Cách nói chuẩn: "Bát Tự trong vận ${cur.ganChiVi}" (không viết sai can–chi; không gán vận khác năm ${transitYear}).`,
  );
  lines.push(
    "- Dùng để: phân kỳ hạn năm, chéo với Đại Hạn/Lưu TV, gắn thẻ tin cậy trục VẬN HẠN — không thay lá Tử Vi.",
  );

  return lines.join("\n");
}

// ----------------------------------------------------------------------------
// XUẤT VĂN BẢN CHO AI (đưa vào prompt /api/interpret).
// ----------------------------------------------------------------------------

export interface BaZiPromptOpts {
  /** Năm xem hạn — để chốt "đang trong vận XX" + Lưu niên */
  transitYear?: number;
}

/** Tóm tắt lá Bát Tự thành đoạn text gọn để nhồi vào prompt luận giải. */
export function baZiToPromptText(b: BaZiChart, opts?: BaZiPromptOpts): string {
  const row = (p: BaZiPillar) =>
    `- Trụ ${p.label}: ${p.ganChiVi} ` +
    `(Can ${p.ganElement}/Thập Thần ${p.shiShenGanVi}; Chi ${p.zhiElement}; ` +
    `Tàng Can: ${p.hiddenStemsVi.join(", ") || "—"}; ` +
    `Thập Thần tàng: ${p.shiShenZhiVi.join(", ") || "—"}; ` +
    `Nạp Âm: ${p.naYinVi})`;

  const wx = (o: Record<string, number>) =>
    Object.entries(o).map(([k, v]) => `${k}:${v}`).join("  ");

  const dy = b.daYun.slice(0, 8)
    .map((d) => `${d.startAge}t/${d.startYear} ${d.ganChiVi}`)
    .join("  |  ");

  const transitYear =
    opts?.transitYear && Number.isFinite(opts.transitYear)
      ? Math.trunc(opts.transitYear)
      : new Date().getFullYear();

  // Trụ + list Đại Vận. Timeline đầy đủ (vận đang đi + Lưu niên) gắn ở
  // buildChartPromptContext / chat qua buildBaZiTimelineReport — tránh circular ESM.
  void transitYear;
  return [
    `=== LÁ SỐ BÁT TỰ / TỨ TRỤ (đối chiếu với Tử Vi) ===`,
    `Âm lịch: ${b.lunarText}`,
    `NHẬT CHỦ (bản thân): ${b.dayMasterVi} — ${b.dayMasterPolarity} ${b.dayMasterElement}.`,
    row(b.pillars.year),
    row(b.pillars.month),
    row(b.pillars.day),
    row(b.pillars.hour),
    `Ngũ hành (8 chữ hiện): ${wx(b.wuXingVisible)}`,
    `Ngũ hành (tính cả Tàng Can): ${wx(b.wuXingWithHidden)}`,
    `Đại Vận list (${b.yunForward ? "thuận" : "nghịch"}, khởi ${b.yunStartSolarYmd}): ${dy}`,
  ].join("\n");
}
