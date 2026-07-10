// ============================================================================
// MODULE QUAN HỆ HÌNH HỌC LÁ SỐ — MỘT NGUỒN SỰ THẬT DÙNG CHUNG
// ----------------------------------------------------------------------------
// Trước đây các hàm tính quan hệ tam phương / xung chiếu / nhị hợp / lục hại /
// phi tứ hóa / tứ hóa bẩm sinh / vùng sát-kỵ CHỈ tồn tại trong scope endpoint
// /api/interpret của server.ts. Endpoint /api/chat (hỏi đáp follow-up) lại chỉ
// gửi cho AI tên sao thô, KHÔNG có lưới quan hệ tính sẵn -> khi user hỏi sâu,
// AI buộc phải TỰ NHẨM lại index/quan hệ (đúng cái /api/interpret đã cấm),
// dễ sinh trả lời lệch cung, lệch tháng, mâu thuẫn bài gốc.
//
// Gom về đây để CHAT và INTERPRET dùng CHUNG một bộ công thức (đồng bộ tuyệt
// đối, sửa một chỗ). Toàn bộ bảng Tứ Hóa lấy từ ./tuHoa (nguồn sự thật duy
// nhất), KHÔNG khai báo lại để tránh lệch số liệu.
//
// Quy ước index: iztro đánh palace.index gốc DẦN = 0. Mọi phép tính ở đây quy
// về index địa chi chuẩn (Tý = 0 ... Hợi = 11) để nhất quán với core tuvi.ts.
// ============================================================================

import { TU_HOA_BY_STEM, HOA_LABELS } from "./tuHoa";

export const BRANCHES_VI = [
  "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi",
];

// iztro: index gốc Dần = 0 -> quy về index địa chi chuẩn Tý = 0.
export const toBranchIndex = (palaceIndex: number): number =>
  ((palaceIndex + 2) % 12 + 12) % 12;

// Nhị hợp: Tý-Sửu, Dần-Hợi, Mão-Tuất, Thìn-Dậu, Tỵ-Thân, Ngọ-Mùi
export const NHI_HOP: Record<number, number> = {
  0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6,
};
// Lục hại: Tý-Mùi, Sửu-Ngọ, Dần-Tỵ, Mão-Thìn, Thân-Hợi, Dậu-Tuất
export const LUC_HAI: Record<number, number> = {
  0: 7, 7: 0, 1: 6, 6: 1, 2: 5, 5: 2, 3: 4, 4: 3, 8: 11, 11: 8, 9: 10, 10: 9,
};

// Chuẩn hóa tên sao để so khớp đáng tin: chuẩn hóa Unicode (NFC), xóa ký tự ẩn
// (zero-width), bỏ tiền tố [SAO LƯU], gộp khoảng trắng thừa, hạ chữ thường.
// Giữ ĐỒNG NHẤT với normalizeStarName trong server.ts để khớp sao như nhau.
export const normalizeStarName = (raw: any): string =>
  String(raw || "")
    .normalize("NFC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\[SAO LƯU\]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** Biến thể tên (iztro vs sách VN) — dùng khi tìm cung của sao thụ hóa. */
const STAR_NORM_ALIASES: Record<string, string[]> = {
  "tả phụ": ["tả phù"],
  "tả phù": ["tả phụ"],
  "phượng các": ["phụng các"],
  "phụng các": ["phượng các"],
};

const starNameMatches = (candidateRaw: any, targetNorm: string): boolean => {
  const c = normalizeStarName(candidateRaw);
  if (!c) return false;
  if (c === targetNorm) return true;
  const aliases = STAR_NORM_ALIASES[targetNorm];
  return Boolean(aliases?.includes(c));
};

// Gộp cả 3 nhóm sao (chính tinh + phụ tinh + trợ/sát tinh) của một cung.
export const allStarsOf = (p: any): any[] => [
  ...(p?.majorStars || []),
  ...(p?.minorStars || []),
  ...(p?.adjectiveStars || []),
];

export interface ChartIndex {
  palacesArr: any[];
  palaceByBranch: Record<number, any>;
}

// Dựng chỉ mục cung theo index địa chi chuẩn — gọi 1 lần rồi truyền lại để
// các hàm dưới không phải quét lại mảng cung mỗi lần.
export const buildChartIndex = (palacesArr: any[]): ChartIndex => {
  const palaceByBranch: Record<number, any> = {};
  (palacesArr || []).forEach((p: any) => {
    palaceByBranch[toBranchIndex(p.index)] = p;
  });
  return { palacesArr: palacesArr || [], palaceByBranch };
};

// Nhãn cung gọn: "<Tên cung> (<Địa chi>): <các chính tinh>".
export const palaceLabel = (idx: ChartIndex, branchIdx: number): string => {
  const pa = idx.palaceByBranch[branchIdx];
  if (!pa) return `cung ${BRANCHES_VI[branchIdx]}`;
  const stars = (pa.majorStars || []).map((s: any) => s.name).join(", ") || "Vô Chính Diệu";
  return `${pa.name} (${BRANCHES_VI[branchIdx]}): ${stars}`;
};

// Tìm cung (index địa chi) chứa một sao gốc bất kỳ; quét đủ 3 nhóm sao vì
// Văn Xương/Văn Khúc/Tả Phụ/Hữu Bật có thể nằm ở nhóm phụ tinh.
export const findStarBranch = (idx: ChartIndex, starName: string): number => {
  const target = normalizeStarName(starName);
  // Pass 1: ưu tiên sao GỐC (không mang tiền tố [SAO LƯU]). Tránh đường phi tứ
  // hóa trỏ vào cung chứa sao lưu cùng tên thay vì cung chứa sao gốc.
  for (const pa of idx.palacesArr) {
    const found = allStarsOf(pa).find(
      (s: any) =>
        !/\[SAO LƯU\]/i.test(String(s?.name || "")) &&
        starNameMatches(s?.name, target),
    );
    if (found) return toBranchIndex(pa.index);
  }
  // Pass 2: fallback — chấp nhận cả sao lưu (giữ nguyên hành vi cũ, không bỏ sót sao).
  for (const pa of idx.palacesArr) {
    if (allStarsOf(pa).some((s: any) => starNameMatches(s?.name, target))) {
      return toBranchIndex(pa.index);
    }
  }
  return -1;
};

// Dòng phi tứ hóa theo MỘT thiên can: mỗi Hóa bay tới sao nào, đóng cung nào.
export const buildFlyingTuHoaLines = (
  idx: ChartIndex,
  stem: string | undefined,
): string[] => {
  const key = typeof stem === "string" ? stem.trim() : stem;
  const tuhoa = key ? TU_HOA_BY_STEM[key] : undefined;
  if (!tuhoa) return [];
  return tuhoa.map((star, i) => {
    const dest = findStarBranch(idx, star);
    const destLabel =
      dest >= 0
        ? `${idx.palaceByBranch[dest]?.name || BRANCHES_VI[dest]} (${BRANCHES_VI[dest]})`
        : "không có trên lá số";
    return `${HOA_LABELS[i]} → ${star} [đóng tại ${destLabel}]`;
  });
};

// Khối quan hệ hình học đầy đủ của MỘT cung: xung chiếu / tam hợp / nhị hợp /
// lục hại + phi tứ hóa theo can chính cung. Có nhãn neo tên cung để AI không
// ghép nhầm sang cung lân cận. Dùng chung cho interpret và chat.
export const buildRelationsBlock = (idx: ChartIndex, p: any): string => {
  const b = toBranchIndex(p.index);
  const xung = (b + 6) % 12;
  const th1 = (b + 4) % 12;
  const th2 = (b + 8) % 12;
  const lines: string[] = [];
  lines.push(`  - Xung chiếu (đối cung): ${palaceLabel(idx, xung)}`);
  lines.push(`  - Tam hợp: ${palaceLabel(idx, th1)} | ${palaceLabel(idx, th2)}`);
  lines.push(`  - Nhị hợp: ${palaceLabel(idx, NHI_HOP[b])}`);
  lines.push(`  - Lục hại: ${palaceLabel(idx, LUC_HAI[b])}`);
  const flights = buildFlyingTuHoaLines(idx, p.heavenlyStem);
  if (flights.length > 0) {
    lines.push(`  - Phi Tứ Hóa (can ${p.heavenlyStem}): ${flights.join("; ")}`);
  }
  const anchor = `  [Quan hệ của ${p.name} (${BRANCHES_VI[b]})]`;
  return [anchor, ...lines].join("\n");
};

// Tứ Hóa bẩm sinh (natal) theo Thiên can năm sinh: mỗi Hóa rơi vào sao nào,
// đóng cung nào. Trả về null khi chưa xác định được can năm sinh.
export const buildNatalTuHoaLines = (
  idx: ChartIndex,
  birthHeavenlyStem: string | undefined,
): string[] | null => {
  const key = typeof birthHeavenlyStem === "string" ? birthHeavenlyStem.trim() : birthHeavenlyStem;
  const table = key ? TU_HOA_BY_STEM[key] : undefined;
  if (!table) return null;
  return table.map((star, i) => {
    const dest = findStarBranch(idx, star);
    const destLabel =
      dest >= 0
        ? `${idx.palaceByBranch[dest]?.name || BRANCHES_VI[dest]} (${BRANCHES_VI[dest]})`
        : "không có trên lá số";
    return `${HOA_LABELS[i]} → ${star} [đóng tại ${destLabel}]`;
  });
};

// Tập sát/kỵ tinh dùng để cảnh báo vùng áp lực (đồng nhất với server.ts).
export const SAT_KY_STARS = [
  "Hóa Kỵ", "Lưu Hóa Kỵ", "Địa Không", "Địa Kiếp", "Kình Dương", "Đà La",
  "Hỏa Tinh", "Linh Tinh", "Kiếp Sát", "Đại Hao", "Tiểu Hao", "Thiên Hình",
  "Cô Thần", "Quả Tú", "Tang Môn", "Bạch Hổ",
].map(normalizeStarName);

// Liệt kê sát/kỵ tinh thực có trong MỘT cung (so khớp chính xác sau chuẩn hóa).
export const satKyStarsInPalace = (p: any): string[] =>
  allStarsOf(p)
    .filter((s: any) => SAT_KY_STARS.includes(normalizeStarName(s.name)))
    .map((s: any) => s.name);

// ----------------------------------------------------------------------------
// LIÊN KẾT ĐA CHIỀU (cho /api/chat) — NỐI ĐỘNG LỰC TỨ HÓA VỐI CUNG ĐÍCH
// ----------------------------------------------------------------------------
// Trước đây code chỉ cung cấp các chiều RỜI RẠC (12 cung, tứ hóa, vận hạn) rồi
// để AI tự xâu chuỗi. Hàm này tính SẴN GIAO ĐIỂM giữa các chiều: một đường
// tứ hóa (bẩm sinh hoặc lưu niên) bay vào cung nào -> lĩnh vực đời sống của cung
// đó + sắc thái được/mất theo loại Hóa. CODE CHỈ ghi giao điểm TRUNG TÍNH; việc
// luận cát/hung cụ thể (phụ thuộc miếu hãm, tổ hợp sao) vẫn để AI.

// Lĩnh vực đời sống theo tên cung (khớp từ khóa có trong tên cung iztro vi-VN).
const PALACE_DOMAIN: { kw: string; domain: string }[] = [
  { kw: "Mệnh", domain: "bản thân, tính cách, hướng đi chủ đạo" },
  { kw: "Phu Thê", domain: "hôn nhân, bạn đời, tình cảm đôi lứa" },
  { kw: "Tài Bạch", domain: "tiền bạc, thu nhập, dòng tiền" },
  { kw: "Quan Lộc", domain: "công việc, sự nghiệp, công danh, học hành" },
  { kw: "Điền", domain: "nhà cửa, đất đai, tài sản lớn" },
  { kw: "Phúc", domain: "tinh thần, phúc báo, an/bất an nội tại" },
  { kw: "Tật Ách", domain: "sức khỏe, bệnh tật, tai ốm" },
  { kw: "Thiên Di", domain: "di chuyển, xuất ngoại, môi trường ngoài" },
  { kw: "Nô Bộc", domain: "bạn bè, đồng nghiệp, cộng sự" },
  { kw: "Tử Tức", domain: "con cái, dự án tâm huyết" },
  { kw: "Phụ Mẫu", domain: "cha mẹ, cấp trên, thầy" },
  { kw: "Huynh Đệ", domain: "anh chị em, cộng tác gần" },
];

const domainOfPalace = (palaceName: string): string => {
  const name = String(palaceName || "");
  const hit = PALACE_DOMAIN.find((d) => name.includes(d.kw));
  return hit ? hit.domain : "lĩnh vực của cung này";
};

// Sắc thái trung tính theo loại Hóa (không phán cát/hung tuyệt đối, chỉ gợi hướng).
const HOA_TONE: Record<string, string> = {
  "Hóa Lộc": "thêm thuận lợi / sinh lợi / cơ hội",
  "Hóa Quyền": "thêm quyền lực / chủ động / áp lực trách nhiệm",
  "Hóa Khoa": "thêm danh tiếng / quý nhân / hóa giải",
  "Hóa Kỵ": "thêm vướng mắc / hao tổn / ám ảnh / rạn nứt",
};
const toneOfHoa = (hoaLabel: string): string => HOA_TONE[hoaLabel] || "biến động";

// Dựng các dòng liên kết cho MỘT can: mỗi Hóa -> sao thụ hóa -> cung đích ->
// lĩnh vực + sắc thái. Bỏ qua Hóa mà sao đích không có trên lá số.
const crossLinkLinesForStem = (
  idx: ChartIndex,
  stem: string | undefined,
  context: string,
): string[] => {
  const key = typeof stem === "string" ? stem.trim() : stem;
  const tuhoa = key ? TU_HOA_BY_STEM[key] : undefined;
  if (!tuhoa) return [];
  const lines: string[] = [];
  tuhoa.forEach((star, i) => {
    const dest = findStarBranch(idx, star);
    if (dest < 0) return; // sao không có trên lá số -> không có giao điểm để nối
    const destPalace = idx.palaceByBranch[dest];
    const destName = destPalace?.name || BRANCHES_VI[dest];
    const hoaLabel = HOA_LABELS[i];
    lines.push(
      `  - [${context}] ${hoaLabel} (qua ${star}) → ${destName} (${BRANCHES_VI[dest]}): ` +
      `tác động tới ${domainOfPalace(destName)} — ${toneOfHoa(hoaLabel)}.`
    );
  });
  return lines;
};

// Liên kết đa chiều tổng hợp: nối tứ hóa BẨM SINH và phi tứ hóa LƯU NIÊN với
// cung đích + lĩnh vực đời sống, giúp AI thấy NGAY "đường dây" giữa các chiều
// thay vì tự xâu chuỗi. birthStem = can năm sinh; luuStem = can năm xem hạn.
export const buildCrossLinks = (
  idx: ChartIndex,
  birthStem: string | undefined,
  luuStem: string | undefined,
  transitYear: number | string | undefined,
): string => {
  const natal = crossLinkLinesForStem(idx, birthStem, "BẨM SINH");
  const luu = crossLinkLinesForStem(idx, luuStem, `LƯU NIÊN ${transitYear ?? ""}`.trim());
  const all = [...natal, ...luu];
  if (all.length === 0) {
    return "  - Chưa đủ dữ liệu can (năm sinh / lưu niên) để nối liên kết đa chiều.";
  }
  return all.join("\n");
};
