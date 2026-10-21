import { TU_HOA_BY_STEM, HOA_LABELS, normalizeHeavenlyStem, getNatalTuHoaQuartet } from "../utils/tuHoa";
import {
  type ChartIndex,
  buildNatalTuHoaLines,
  buildFlyingTuHoaLines,
  isSatKyStarName,
  BRANCHES_VI,
  toBranchIndex,
  NHI_HOP,
  LUC_HAI,
  normalizeStarName,
  allStarsOf,
  starTokensOf,
  mutagenLabelOf,
  findStarBranch,
  palaceLabel,
} from "../utils/chartRelations";
export { buildTuanTrietReport, analyzeTuanTriet, classifyTuanTrietStar } from "../utils/tuanTriet";
import { analyzeCachCuc, type CachCucAnalysis } from "../utils/cachCuc";
import { enrichAnalysis } from "../utils/cachCucLogic";

const STEMS_VI = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const monthStemStartByYearStem: Record<number, number> = {
  0: 2, 5: 2,
  1: 4, 6: 4,
  2: 6, 7: 6,
  3: 8, 8: 8,
  4: 0, 9: 0,
};

const TRUONG_SINH_MANH = ["Trường Sinh", "Đế Vượng", "Lâm Quan", "Quan Đới"].map((s) => s.toLowerCase());
const TRUONG_SINH_YEU = ["Tử", "Tuyệt", "Mộ", "Bệnh", "Suy", "Thai"].map((s) => s.toLowerCase());

const CAT_PHUC_STARS = [
  "Lộc Tồn", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa",
  // iztro: Tả Phù; giữ cả biến thể Tả Phụ để không miss khi nguồn khác.
  "Tả Phù", "Tả Phụ", "Hữu Bật",
  "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt", "Thiên Mã", "Thiên Quan", "Thiên Phúc",
].map(normalizeStarName);

const HUNG_SAT_STARS = [
  "Hóa Kỵ", "Địa Không", "Địa Kiếp", "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh",
  "Kiếp Sát", "Đại Hao", "Tiểu Hao", "Thiên Hình",
].map(normalizeStarName);

export const palaceByName = (palacesArr: any[], kw: string) =>
  palacesArr.find((p: any) => String(p.name || "").includes(kw));

const starsOfPalace = (p: any): string => {
  if (!p) return "(không xác định được cung)";
  const major = (p.majorStars || []).map((s: any) => s.name).join(", ") || "Vô Chính Diệu";
  return `${p.name} (${BRANCHES_VI[toBranchIndex(p.index)]}): ${major}`;
};

/** Phụ/sát trọng trên trục tài — neo Lộc/Kỵ/sát, không dump hết adjective. */
const TAI_TRUC_AUX_RE =
  /Lộc Tồn|Hóa Lộc|Hóa Quyền|Hóa Khoa|Hóa Kỵ|Kình|Đà|Không|Kiếp|Hỏa|Linh|Thiên Mã|Đại Hao|Tiểu Hao|Tuần|Triệt|Vong/i;

const starsOfPalaceForTai = (p: any): string => {
  if (!p) return "(không xác định được cung)";
  const major = (p.majorStars || []).map((s: any) => s.name).join(", ") || "Vô Chính Diệu";
  const aux = allStarsOf(p)
    .map((s: any) => String(s.name || "").replace(/\[SAO LƯU\]\s*/gi, "").trim())
    .filter((n: string) => n && TAI_TRUC_AUX_RE.test(n));
  // Tránh lặp tên đã nằm trong major
  const majorNorm = new Set(
    (p.majorStars || []).map((s: any) => normalizeStarName(s.name)),
  );
  const auxOnly = [...new Set(aux)].filter((n) => !majorNorm.has(normalizeStarName(n)));
  const branch = BRANCHES_VI[toBranchIndex(p.index)];
  if (auxOnly.length === 0) return `${p.name} (${branch}): ${major}`;
  return `${p.name} (${branch}): ${major} | phụ/sát trọng: ${auxOnly.join(", ")}`;
};

const classifyTheDat = (cs: string): string => {
  const v = String(cs || "").trim().toLowerCase();
  if (!v) return "chưa rõ";
  if (TRUONG_SINH_MANH.includes(v)) return "MẠNH (sao phát huy trọn lực)";
  if (TRUONG_SINH_YEU.includes(v)) return "YẾU (dễ hữu danh vô thực, lực suy giảm)";
  return "TRUNG BÌNH";
};

/** Format natal Tứ Hóa lines with interpret-prompt indentation. */
export const formatNatalTuHoaStr = (
  idx: ChartIndex,
  birthHeavenlyStem: string | undefined,
): { natalTuHoaResolved: boolean; natalTuHoaStr: string; stemKey: string | undefined } => {
  const stemKey = normalizeHeavenlyStem(birthHeavenlyStem);
  const lines = buildNatalTuHoaLines(idx, stemKey);
  const natalTuHoaResolved = Boolean(stemKey && getNatalTuHoaQuartet(stemKey));
  if (!lines || !stemKey) {
    return {
      natalTuHoaResolved: false,
      stemKey,
      natalTuHoaStr: "  - Chưa xác định được Thiên can năm sinh chuẩn nên HỆ THỐNG KHÔNG tính sẵn Tứ Hóa bẩm sinh.",
    };
  }
  return {
    natalTuHoaResolved: true,
    stemKey,
    natalTuHoaStr: lines.map((l) => `  - ${l}`).join("\n"),
  };
};

/** Format flying Tứ Hóa lines with interpret-prompt indentation. */
export const formatFlyingTuHoaStr = (
  idx: ChartIndex,
  stem: string | undefined,
  contextLabel: string,
): string => {
  const lines = buildFlyingTuHoaLines(idx, stem);
  if (lines.length === 0) {
    return `  - Chưa xác định được Thiên can ${contextLabel} nên không tính sẵn được phi tứ hóa.`;
  }
  return lines.map((l) => `  - ${l}`).join("\n");
};

export const buildStressReport = (palacesArr: any[]): string => {
  const zones: string[] = [];
  palacesArr.forEach((p: any) => {
    // starTokensOf: quét cả Hóa Kỵ bẩm sinh (mutagen) — không chỉ sao mang tên kỵ;
    // isSatKyStarName bỏ hậu tố "(Sao X)" nên thấy cả nhãn "Lưu Hóa Kỵ (…)" do app an.
    const all = starTokensOf(p);
    const found = all
      .filter((s: any) => isSatKyStarName(s.name))
      .map((s: any) => s.name);
    if (found.length > 0) {
      zones.push(`  - ${p.name} (${BRANCHES_VI[toBranchIndex(p.index)]}): ${found.join(", ")}`);
    }
  });
  return zones.length > 0
    ? zones.join("\n")
    : "  - Không phát hiện tổ hợp sát tinh/kỵ tinh cực đoan nổi bật.";
};

// ---------------------------------------------------------------------------
// TÍNH VA ĐẬP & ĐIỂM MÙ — cheat sheet MÁY (deterministic)
// Trục va chạm + mầm điểm mù từ sao/cung thật. AI đào sâu / diễn đạt sắc;
// cấm bịa trục không có trong report.
// ---------------------------------------------------------------------------

const majorNames = (p: any): string[] =>
  (p?.majorStars || []).map((s: any) => String(s?.name || "").trim()).filter(Boolean);

// Tên sao + token Tứ Hóa bẩm sinh (mutagen) — để các check Kỵ/Kình/sát dưới
// đây "thấy" được Hóa Kỵ bẩm sinh (nó nằm ở field mutagen, không trong tên).
const allNames = (p: any): string[] =>
  starTokensOf(p)
    .map((s: any) => String(s?.name || "").replace(/\[SAO\s*(?:LƯU|VẬN)\]\s*/gi, "").trim())
    .filter(Boolean);

const hasStar = (names: string[], re: RegExp) => names.some((n) => re.test(n));

const satOn = (p: any): string[] =>
  allNames(p).filter((n) => isSatKyStarName(n));

const palaceBrief = (p: any): string => {
  if (!p) return "(không rõ)";
  const b = BRANCHES_VI[toBranchIndex(p.index)];
  const maj = majorNames(p).join(", ") || "VCD";
  const sat = satOn(p);
  return `${p.name} (${b}): ${maj}${sat.length ? ` | sát/kỵ: ${sat.join(", ")}` : ""}`;
};

/**
 * Báo cáo trục Tính va đập + mầm Điểm mù — chỉ neo sao/cung trên lá.
 * Dùng cho Phần 1 (heading bắt buộc) + xuyên suốt bài.
 */
export const buildTinhVaDapReport = (idx: ChartIndex, palacesArr: any[]): string => {
  const menh =
    palaceByName(palacesArr, "Mệnh") ||
    palacesArr.find((p: any) => p?.isOriginalPalace);
  if (!menh) {
    return "  - Thiếu cung Mệnh trên dữ liệu — không dựng được trục Tính va đập.";
  }

  const b = toBranchIndex(menh.index);
  const xungP = idx.palaceByBranch[(b + 6) % 12];
  const th1 = idx.palaceByBranch[(b + 4) % 12];
  const th2 = idx.palaceByBranch[(b + 8) % 12];
  const nhi = idx.palaceByBranch[NHI_HOP[b]];
  const hai = idx.palaceByBranch[LUC_HAI[b]];

  const phu = palaceByName(palacesArr, "Phụ") || palaceByName(palacesArr, "Phu Mẫu");
  const phuThe = palaceByName(palacesArr, "Phu Thê") || palaceByName(palacesArr, "Phối");
  const no = palaceByName(palacesArr, "Nô");
  const quan =
    palaceByName(palacesArr, "Quan Lộc") ||
    palaceByName(palacesArr, "Quan") ||
    palaceByName(palacesArr, "Sự");
  const tai = palaceByName(palacesArr, "Tài Bạch") || palaceByName(palacesArr, "Tài");
  const tat = palaceByName(palacesArr, "Tật");
  const body = palacesArr.find((p: any) => p?.isBodyPalace);

  const lines: string[] = [];
  lines.push("### A. TRỤC VA ĐẬP HÌNH HỌC (Mệnh làm tâm)");
  lines.push(`  - Mệnh: ${palaceBrief(menh)}`);
  lines.push(`  - Xung chiếu (ngoại lực / khát–áp): ${palaceBrief(xungP)}`);
  lines.push(`  - Tam hợp 1: ${palaceBrief(th1)}`);
  lines.push(`  - Tam hợp 2: ${palaceBrief(th2)}`);
  lines.push(`  - Nhị hợp (sóng ngầm / gánh thụ động): ${palaceBrief(nhi)}`);
  lines.push(`  - Lục hại (ma sát / rạn nứt): ${palaceBrief(hai)}`);
  if (body) {
    const same = toBranchIndex(body.index) === b;
    lines.push(
      same
        ? `  - Mệnh–Thân: ĐỒNG CUNG → tính–hành nhất quán; điểm mù = khó “lột xác”, dễ cố chấp một hệ giá trị.`
        : `  - Mệnh–Thân: LỆCH cung (Thân tại ${body.name}) → va đập nội tâm (nghĩ một đường, làm một nẻo) sau ~30; đào mù khoảng cách tư duy–hành vi.`,
    );
  }

  lines.push("### B. TRỤC VA ĐẬP QUAN HỆ (cung then chốt + sát/kỵ)");
  const rel: { label: string; p: any; hint: string }[] = [
    { label: "Phụ Mẫu / cấp trên", p: phu, hint: "kỷ luật–áp đặt–danh tiếng gia đình" },
    { label: "Phu Thê / đôi lứa", p: phuThe, hint: "giao tiếp–cam kết–cái tôi hai phía" },
    { label: "Nô Bộc / bạn–đồng sự", p: no, hint: "lòng tin–tiền–thị phi nhóm" },
    { label: "Quan Lộc / trường–việc", p: quan, hint: "áp lực thành tích–đố kỵ–quyền" },
    { label: "Tài Bạch / dòng tiền", p: tai, hint: "kiếm–giữ–hao qua quan hệ" },
    { label: "Tật Ách / thân–thần kinh", p: tat, hint: "cơ thể gánh stress quyết định" },
  ];
  for (const r of rel) {
    if (!r.p) continue;
    const sat = satOn(r.p);
    const heat = sat.length >= 2 ? "CAO" : sat.length === 1 ? "VỪA" : "NỀN";
    lines.push(`  - [${heat}] ${r.label}: ${palaceBrief(r.p)} → gợi va: ${r.hint}`);
  }

  // Mệnh phi Hóa Kỵ?
  const menhStem = normalizeHeavenlyStem(menh.heavenlyStem);
  const menhTu = menhStem ? getNatalTuHoaQuartet(menhStem) : undefined;
  if (menhTu) {
    const kyStar = menhTu[3];
    const dest = findStarBranch(idx, kyStar);
    if (dest >= 0) {
      const destP = idx.palaceByBranch[dest];
      lines.push(
        `  - Mệnh (can ${menhStem}) phi Hóa Kỵ → ${kyStar} tại ${destP?.name || BRANCHES_VI[dest]}: tự tạo ải / tự siết lĩnh vực cung đó (va đập nội sinh).`,
      );
    }
  }

  lines.push("### C. MẦM ĐIỂM MÙ TRỌNG TÂM (máy chọn tối đa 3 — AI đào sâu, không thêm mầm phụ)");
  const menhN = allNames(menh);
  const blind: string[] = [];

  if (hasStar(menhN, /Thiên Cơ/i) && hasStar(menhN, /Tuần|Triệt/i)) {
    blind.push(
      "OVERTHINK–TÊ LIỆT: Thiên Cơ + Tuần/Triệt Mệnh → mù = tưởng mình đang “thận trọng”, thực ra đang tự tước cửa sổ hành động; hay biện minh bằng phân tích.",
    );
  } else if (hasStar(menhN, /Thiên Cơ/i)) {
    blind.push(
      "MƯU SĨ TỰ TRÓI: Thiên Cơ Mệnh → mù = tin rằng nghĩ kỹ = đã làm; khoảng trống giữa kế hoạch và execution là nơi đời “va” họ.",
    );
  }
  if (hasStar(menhN, /Cự Môn/i)) {
    blind.push(
      "MIỆNG–DANH: Cự Mệnh → mù = cho rằng mình “nói lý”, người khác thấy tranh/thị phi; khó nhận phần mình trong khẩu thiệt.",
    );
  }
  if (hasStar(menhN, /Tham Lang|Liêm Trinh/i)) {
    blind.push(
      "DỤC–DANH NỘI: Tham/Liêm Mệnh → mù = khoác áo “chính đáng” cho tham vọng/cạnh tranh; va khi bị soi động cơ.",
    );
  }
  if (hasStar(menhN, /Thất Sát|Phá Quân|Kình/i)) {
    blind.push(
      "CỨNG–THẮNG: Sát/Phá/Kình gần Mệnh → mù = nhầm quyết liệt với đúng; va trực diện cấp trên/người thân rồi gọi là “họ hẹp hòi”.",
    );
  }
  if (hasStar(menhN, /Tuần|Triệt/i) && !blind.some((x) => x.includes("OVERTHINK"))) {
    blind.push(
      "TỰ GIẢM LỰC: Tuần/Triệt Mệnh → mù = cảm giác “mình chưa đủ / chưa tới lúc” kéo dài; bỏ lỡ nhịp khi thực lực đã có.",
    );
  }
  // Giữ tối đa 2 mầm Mệnh để 3 slot còn chỗ cho quan hệ / tiền / sức.
  const menhBlindEnd = blind.length;

  // Nô + Không Kiếp
  if (no && satOn(no).some((s) => /Không|Kiếp/i.test(s))) {
    blind.push(
      "TIN SAI KÊNH: Không/Kiếp Nô → mù = tin “bạn tốt / hội nhóm” hơn tin quy trình; hao thường đến từ chỗ mình chủ động mở cửa.",
    );
  }
  // Phu + Hóa Kỵ / Văn
  if (phuThe && (hasStar(allNames(phuThe), /Hóa Kỵ|Văn Khúc/i) || satOn(phuThe).length)) {
    blind.push(
      "LỆCH SÓNG LỜI: Phu Thê có Kỵ/Văn/sát → mù = đổ “người kia khó” trước khi soi cách mình im lặng/mỉa/hứa miệng; vòng lặp hiểu nhầm.",
    );
  }
  // Thủ tài
  const dien = palaceByName(palacesArr, "Điền");
  const phuc = palaceByName(palacesArr, "Phúc");
  const thuWeak =
    (dien && hasStar(allNames(dien), /Triệt|Không Vong|Tuần|Kiếp|Không/i)) ||
    (phuc && hasStar(allNames(phuc), /Triệt|Tuần/i));
  if (thuWeak && tai) {
    blind.push(
      "KIẾM ĐƯỢC–GIỮ MÙ: trục Thủ (Phúc/Điền) yếu/Triệt/Không → mù = tin “kiếm thêm là xong”; không thấy lỗ rò thói quen/quan hệ.",
    );
  }
  // Tật lục hại Mệnh
  if (tat && LUC_HAI[b] === toBranchIndex(tat.index)) {
    blind.push(
      "THÂN GÁNH TÍNH: Tật lục hại Mệnh → mù = đẩy stress quyết định vào thần kinh/cơ thể, rồi chỉ chữa triệu chứng.",
    );
  }
  // Hóa Kỵ natal somewhere important
  const allChart = palacesArr.flatMap((p: any) => allNames(p));
  if (hasStar(allChart, /^Hóa Kỵ$|Hóa Kỵ/i)) {
    const kyPalaces = palacesArr
      .filter((p: any) => hasStar(allNames(p), /Hóa Kỵ/i))
      .map((p: any) => p.name);
    if (kyPalaces.length) {
      blind.push(
        `CHẤP–ẢI: Hóa Kỵ tại ${kyPalaces.join(", ")} → mù = bám “mình đúng / mình bị oan” đúng lĩnh vực cung đó; càng cãi càng kẹt.`,
      );
    }
  }

  if (blind.length === 0) {
    blind.push(
      "KHÔNG CÓ MẦM TRỌNG TÂM: lá không gắn mầm mù nặng trên máy — KHÔNG bịa điểm mù; phần Điểm mù chỉ nói ngắn 1 câu “không có mù lớn nổi bật”, dồn chiều sâu cho Tính va đập.",
    );
  }
  const selectedBlind = [
    ...blind.slice(0, Math.min(2, menhBlindEnd)),
    ...blind.slice(menhBlindEnd),
    ...blind.slice(2, menhBlindEnd),
  ].slice(0, 3);
  for (const bl of selectedBlind) {
    lines.push(`  - ${bl}`);
  }

  lines.push("### D. LỆNH ĐÀO SẮC (cho AI)");
  lines.push(
    "  - Chỉ đào tối đa 3 mầm trọng tâm ở mục C; bỏ mầm phụ/trùng ý. Mỗi điểm mù: (1) hành vi bề mặt họ tự kể → (2) cơ chế sao/cung → (3) hệ quả đời thực.",
  );
  lines.push(
    "  - Tính va đập: nêu RÕ va với ai (bản thân / cha mẹ / bạn / vợ chồng / sếp) — không nói chung “dễ xung đột”.",
  );
  lines.push(
    "  - Giọng sắc, trúng, không hù; không biến mọi thứ thành thảm họa. Cấm điểm mù không neo được sao/cung máy.",
  );

  return lines.join("\n");
};

export const buildLuuNienReport = (palacesArr: any[]): string => {
  const luuZones: string[] = [];
  const vanZones: string[] = [];
  palacesArr.forEach((p: any) => {
    const all = allStarsOf(p);
    const luu = all
      .filter((s: any) => /\[SAO LƯU\]/.test(String(s.name || "")))
      .map((s: any) => String(s.name).replace(/\[SAO LƯU\]\s*/g, "").trim());
    if (luu.length > 0) {
      luuZones.push(`  - ${p.name} (${BRANCHES_VI[toBranchIndex(p.index)]}): ${luu.join(", ")}`);
    }
    const van = all
      .filter((s: any) => /\[SAO VẬN\]/.test(String(s.name || "")))
      .map((s: any) => String(s.name).replace(/\[SAO VẬN\]\s*/g, "").trim());
    if (van.length > 0) {
      vanZones.push(`  - ${p.name} (${BRANCHES_VI[toBranchIndex(p.index)]}): ${van.join(", ")}`);
    }
  });
  const parts: string[] = [];
  parts.push(
    luuZones.length > 0
      ? `SAO LƯU NIÊN:\n${luuZones.join("\n")}`
      : "  - Không phát hiện sao lưu niên nào được đánh dấu trên lá số.",
  );
  parts.push(
    vanZones.length > 0
      ? `SAO VẬN (ĐẠI HẠN 10 NĂM):\n${vanZones.join("\n")}`
      : "  - Không phát hiện sao vận nào được đánh dấu trên lá số.",
  );
  return parts.join("\n");
};

export const buildBodyPalaceStr = (palacesArr: any[]): string => {
  const bodyPalace = palacesArr.find((p: any) => p?.isBodyPalace);
  if (!bodyPalace) {
    return "Lá số không đánh dấu Cung Thân đồng cung riêng (Thân đồng cung Mệnh hoặc dữ liệu chưa gắn cờ); luận Thân theo cung Mệnh.";
  }
  const major = (bodyPalace.majorStars || []).map((s: any) => s.name).join(", ") || "Vô Chính Diệu";
  const branch = BRANCHES_VI[toBranchIndex(bodyPalace.index)];
  return `Cung Thân an tại cung ${bodyPalace.name} (Địa chi ${branch}, Thiên can ${bodyPalace.heavenlyStem}). Chính tinh thủ Thân: ${major}. Khi luận, hãy đối chiếu trục Mệnh (xu hướng tư duy bẩm sinh, chủ đạo nửa đầu đời ~trước 30) với Thân (xu hướng hành động/hậu vận, chủ đạo nửa sau ~sau 30) để thấy sự dịch chuyển nội tâm → hành vi của bạn.`;
};

export const buildLaiNhanReport = (palacesArr: any[], stemKey: string | undefined): string => {
  if (!stemKey) return "  - Chưa xác định được Thiên can năm sinh nên chưa xác định được Lai Nhân Cung.";
  const target = String(stemKey).trim();
  const hits = palacesArr.filter((p: any) => String(p.heavenlyStem || "").trim() === target);
  if (hits.length === 0) {
    return "  - Không cung nào trùng can năm sinh trên dữ liệu (hiếm); không định Lai Nhân Cung.";
  }
  return hits.map((p: any) => {
    const branchIdx = toBranchIndex(p.index);
    const major = (p.majorStars || []).map((s: any) => s.name).join(", ") || "Vô Chính Diệu";
    // VCD tại Lai Nhân rất mỏng nếu chỉ ghi \"Vô Chính Diệu\"; bổ sung tam phương +
    // xung chiếu (nơi mượn sao) để model có chất liệu mở 2–4 mạch căn nguyên.
    const relatedBranches = [
      { label: "tam phương", idx: (branchIdx + 4) % 12 },
      { label: "tam phương", idx: (branchIdx + 8) % 12 },
      { label: "xung chiếu", idx: (branchIdx + 6) % 12 },
    ]
      .map(({ label, idx }) => {
        const q = palacesArr.find((x: any) => toBranchIndex(x.index) === idx);
        if (!q) return null;
        const stars = (q.majorStars || []).map((s: any) => s.name).join(", ");
        return stars ? `${label} ${BRANCHES_VI[idx]} (${stars})` : null;
      })
      .filter(Boolean)
      .join("; ");
    return `  - Lai Nhân Cung: ${p.name} (${BRANCHES_VI[branchIdx]}, can ${p.heavenlyStem}) — chính tinh: ${major}${relatedBranches ? `; ${relatedBranches}` : ""}`;
  }).join("\n");
};

export const buildHaiTrucTaiLoc = (palacesArr: any[]): string => {
  const menh = palaceByName(palacesArr, "Mệnh");
  const tai = palaceByName(palacesArr, "Tài Bạch") || palaceByName(palacesArr, "Tài");
  const quan = palaceByName(palacesArr, "Quan Lộc") || palaceByName(palacesArr, "Quan") || palaceByName(palacesArr, "Sự Nghiệp");
  const phuc = palaceByName(palacesArr, "Phúc");
  const dien = palaceByName(palacesArr, "Điền");
  return [
    `  * Trục SINH TÀI (cách kiếm tiền / tạo dòng tiền) — Mệnh × Tài Bạch × Quan Lộc (chính tinh + phụ/sát trọng máy lọc):`,
    `     - ${starsOfPalaceForTai(menh)}`,
    `     - ${starsOfPalaceForTai(tai)}`,
    `     - ${starsOfPalaceForTai(quan)}`,
    `  * Trục THỦ TÀI (cách giữ của / tích sản / phúc khí) — Phúc Đức × Tài Bạch × Điền Trạch:`,
    `     - ${starsOfPalaceForTai(phuc)}`,
    `     - ${starsOfPalaceForTai(tai)}`,
    `     - ${starsOfPalaceForTai(dien)}`,
  ].join("\n");
};

export const buildLuuNguyetReport = (
  idx: ChartIndex,
  chartData: any,
  transitYearNum: number,
): string => {
  const luuThaiTueIdxRaw = chartData.transitLuuThaiTueIndex;
  const birthLunarMonth = Number(chartData.birthLunarMonth) || 0;
  const birthHourIdx = Number(chartData.birthHourIndex);
  const birthHourIdxValid = Number.isInteger(birthHourIdx) && birthHourIdx >= 0 && birthHourIdx <= 11;
  const hasLuuNguyetData =
    Number.isInteger(luuThaiTueIdxRaw) && luuThaiTueIdxRaw >= 0 && luuThaiTueIdxRaw <= 11 &&
    birthLunarMonth >= 1 && birthLunarMonth <= 12 &&
    birthHourIdxValid;

  if (!hasLuuNguyetData) {
    return "  - Thiếu dữ liệu (tháng sinh âm / giờ sinh / cung Lưu Thái Tuế) nên HỆ THỐNG KHÔNG an được 12 cung Lưu Nguyệt. Khi thiếu, KHÔNG tự đoán tháng — hãy nói rõ thiếu dữ liệu.";
  }

  const { palaceByBranch } = idx;
  const dauQuan = (((luuThaiTueIdxRaw - (birthLunarMonth - 1) + birthHourIdx) % 12) + 12) % 12;
  const yearStemIdx = (((transitYearNum % 10) - 4) % 10 + 10) % 10;
  const monthStemStart = monthStemStartByYearStem[yearStemIdx] ?? 0;
  const lines: string[] = [];
  for (let m = 1; m <= 12; m++) {
    const branchIdx = (dauQuan + (m - 1)) % 12;
    const pa = palaceByBranch[branchIdx];
    const palaceName = pa ? pa.name : `cung ${BRANCHES_VI[branchIdx]}`;
    const monthStemIdx = (monthStemStart + (m - 1)) % 10;
    const monthStem = STEMS_VI[monthStemIdx];
    const tuhoa = TU_HOA_BY_STEM[monthStem];
    let flightStr = "";
    if (tuhoa) {
      flightStr = tuhoa.map((star, i) => {
        const dest = findStarBranch(idx, star);
        const destLabel = dest >= 0
          ? `${palaceByBranch[dest]?.name || BRANCHES_VI[dest]}`
          : "không có";
        return `${HOA_LABELS[i]}→${star}[${destLabel}]`;
      }).join("; ");
    }
    lines.push(
      `  - Tháng ${m} âm: cung ${palaceName} (${BRANCHES_VI[branchIdx]}, can tháng ${monthStem})` +
      (flightStr ? ` | Lưu Nguyệt Tứ Hóa: ${flightStr}` : ""),
    );
  }
  return lines.join("\n");
};

export const buildPhucDucReport = (idx: ChartIndex, palacesArr: any[]): string => {
  const phuc = palaceByName(palacesArr, "Phúc");
  if (!phuc) return "  - Không xác định được cung Phúc Đức trên dữ liệu.";
  const b = toBranchIndex(phuc.index);
  const major = (phuc.majorStars || []).map((s: any) => s.name).join(", ") || "Vô Chính Diệu";
  const minor = (phuc.minorStars || []).map((s: any) => String(s.name).replace(/\[SAO LƯU\]\s*/g, "").trim()).join(", ") || "Không";
  const adj = (phuc.adjectiveStars || []).map((s: any) => s.name).join(", ") || "Không";
  return [
    `  - Cụm sao Phúc Đức (${phuc.name}, ${BRANCHES_VI[b]}, can ${phuc.heavenlyStem}):`,
    `     Chính tinh: ${major} | Trợ/cát tinh: ${minor} | Sát/tạp tinh: ${adj}`,
    `     Xung chiếu: ${palaceLabel(idx, (b + 6) % 12)}`,
    `     Tam hợp: ${palaceLabel(idx, (b + 4) % 12)} | ${palaceLabel(idx, (b + 8) % 12)}`,
    `     Nhị hợp: ${palaceLabel(idx, NHI_HOP[b])} | Lục hại: ${palaceLabel(idx, LUC_HAI[b])}`,
  ].join("\n");
};

export const buildTruongSinhReport = (palacesArr: any[]): string => {
  const targets = ["Mệnh", "Tài Bạch", "Quan Lộc", "Phúc", "Thân", "Phu Thê", "Tật Ách"];
  const lines: string[] = [];
  const seen = new Set<string>();
  targets.forEach((kw) => {
    const p = palaceByName(palacesArr, kw);
    if (!p || seen.has(p.name)) return;
    seen.add(p.name);
    const cs = p.changsheng12 || "";
    lines.push(`  - ${p.name} (${BRANCHES_VI[toBranchIndex(p.index)]}): vòng Trường Sinh = ${cs || "chưa rõ"} → ${classifyTheDat(cs)}`);
  });
  return lines.length > 0
    ? lines.join("\n")
    : "  - Dữ liệu vòng Trường Sinh chưa đầy đủ trên lá số.";
};

export const buildPhucLocReport = (idx: ChartIndex, palacesArr: any[]): string => {
  const { palaceByBranch } = idx;
  const menh = palaceByName(palacesArr, "Mệnh");
  if (!menh) return "  - Không xác định được cung Mệnh nên chưa đếm được cát/hung.";
  const bMenh = toBranchIndex(menh.index);
  const idxs = new Set<number>([bMenh, (bMenh + 4) % 12, (bMenh + 8) % 12, (bMenh + 6) % 12]);
  const phuc = palaceByName(palacesArr, "Phúc");
  if (phuc) idxs.add(toBranchIndex(phuc.index));
  const catFound: string[] = [];
  const hungFound: string[] = [];
  idxs.forEach((bi) => {
    const pa = palaceByBranch[bi];
    if (!pa) return;
    // Đếm cả Tứ Hóa bẩm sinh (Hóa Lộc/Khoa = cát, Hóa Kỵ = hung) — NHƯNG mỗi
    // sao chỉ được đếm MỘT lần mỗi list: "Tả Phù" (tên cát) mang Hóa Khoa
    // (Nhâm) vẫn là MỘT tín hiệu, không nhân đôi cát count.
    allStarsOf(pa).forEach((s: any) => {
      const raw = String(s?.name || "").trim();
      const n = normalizeStarName(raw);
      const inCat = CAT_PHUC_STARS.includes(n);
      const inHung = HUNG_SAT_STARS.includes(n);
      if (inCat) catFound.push(raw);
      else if (inHung) hungFound.push(raw);

      const mut = mutagenLabelOf(s?.mutagen);
      if (!mut) return;
      const mn = normalizeStarName(mut);
      if (inCat && CAT_PHUC_STARS.includes(mn)) return; // đếm đúp cùng list
      if (inHung && HUNG_SAT_STARS.includes(mn)) return;
      if (CAT_PHUC_STARS.includes(mn)) catFound.push(mut);
      else if (HUNG_SAT_STARS.includes(mn)) hungFound.push(mut);
    });
  });
  return [
    `  - Phạm vi đếm: tam phương Mệnh-Tài-Quan + xung chiếu + Phúc Đức.`,
    `  - Cát tinh phúc lộc (${catFound.length}): ${catFound.length ? catFound.join(", ") : "không đáng kể"}`,
    `  - Hung sát tinh (${hungFound.length}): ${hungFound.length ? hungFound.join(", ") : "không đáng kể"}`,
  ].join("\n");
};

export const collectAllMajorStarNames = (palacesArr: any[]): string[] => {
  const allMajorStarNames: string[] = [];
  palacesArr.forEach((p: any) => {
    (p.majorStars || []).forEach((s: any) => {
      allMajorStarNames.push(String(s.name || "").trim());
    });
  });
  return allMajorStarNames;
};

export const collectAllAuxStarNames = (palacesArr: any[]): string[] => {
  const allAuxStarNames: string[] = [];
  palacesArr.forEach((p: any) => {
    [...(p.minorStars || []), ...(p.adjectiveStars || [])].forEach((s: any) => {
      allAuxStarNames.push(String(s.name || "").trim());
    });
  });
  return allAuxStarNames;
};

/**
 * Nhãn vòng 12 trạng thái trên lá (Trường Sinh / Bác Sỹ / Tướng Tinh / Quan Phù…).
 * IZTRO an 4 vòng này ở các trường RIÊNG của cung (changsheng12/boshi12/jiangqian12/
 * suiqian12) — KHÔNG nằm trong minor/adjectiveStars, nên collectAllAuxStarNames không thấy.
 * Cho vào pool gate sao của truy hồi Kinh Nghiệm: mẫu "Trường Sinh gặp sao xấu"
 * (requireAny: ["trường sinh"]) sẽ mù vĩnh viễn nếu thiếu — mỗi lá luôn có đúng 1
 * cung Trường Sinh nên mẫu này phải sống trên mọi lá.
 */
export const collectCycleStarLabels = (palacesArr: any[]): string[] => {
  const labels: string[] = [];
  (palacesArr || []).forEach((p: any) => {
    [p.changsheng12, p.boshi12, p.jiangqian12, p.suiqian12].forEach((v: unknown) => {
      const s = String(v || "").trim();
      if (s) labels.push(s);
    });
  });
  return labels;
};

/**
 * Bộ lọc sao phụ trọng yếu cho gate Kinh Nghiệm — MỘT NGUỒN dùng chung
 * interpret (buildChartPromptContext) và chat (routes/chat.ts).
 * Nhớ sửa CẢ comment "không qua filter sao phụ" ở nơi dùng nếu thêm nhóm mới.
 */
export const AUX_KN_FILTER =
  /Kình|Đà|Không|Kiếp|Hỏa|Linh|Hóa |Lộc Tồn|Văn Xương|Văn Khúc|Thiên Mã|Hồng|Đào|Tuần|Triệt|Vong|Hao|Tang|Hổ|Khốc|Hư|Giải|Khôi|Việt|Long|Phượng|Hổ|Cái|Hình|Riêu|Cô|Quả|Vận |Lưu |Niên Giải|Phủ|Tướng|Sát|Phá|Tham|Cự|Cơ|Đồng|Lương/i;

export const collectTuHoaPairs = (table?: string[]) =>
  (table || []).map((star, i) => ({ star, hoa: HOA_LABELS[i] }));

export const buildSchoolMetaStr = (chartData: any): string => {
  const schoolMeta = chartData.schoolMeta;
  return schoolMeta
    ? `- Phái luận chính (đầu ra): ${schoolMeta.primaryLabel || schoolMeta.primarySchool}\n- Phái đối chiếu nội bộ: ${schoolMeta.internalLabel || schoolMeta.internalSchool}\n- Engine an sao: ${schoolMeta.engine || "iztro"}`
    : "- Phái: Nam phái Trần Đoàn (mặc định)";
};

// ============================================================================
// CÁCH CỤC CHẠM CUNG VẬN — cách nào đang "sống" ở cung Đại hạn / Tiểu hạn.
// Tái dùng analyzeCachCuc + enrichAnalysis (cùng nhánh MASTER → cùng quality
// hiệu dụng đã tính áp lực sát/kỵ/Tuần–Triệt). Dùng chung interpret (Phần 3)
// + chat. Chỉ liệt tên cách + [chất lượng] — AI cấm bịa cách ngoài block.
// 童限: cung Đại hạn "Chưa vào Đại Hạn" → tự ẩn dòng Đại hạn (đồng bộ policy ẩn lớp Vận).
// ============================================================================
export const buildVanChamCungBlock = (
  idx: ChartIndex,
  chartData: any,
  opts?: { analysis?: CachCucAnalysis; style?: "interpret" | "chat" },
): string => {
  const style = opts?.style === "chat" ? "chat" : "interpret";

  const resolveTarget = (rawName: unknown): { name: string; branch: number } | null => {
    const name = String(rawName || "").trim();
    if (!name || /chưa/i.test(name)) return null;
    const palace =
      idx.palacesArr.find((p: any) => String(p.name || "").trim() === name) ||
      idx.palacesArr.find((p: any) => String(p.name || "").includes(name));
    if (!palace) return null;
    return { name: String(palace.name || name).trim(), branch: toBranchIndex(palace.index) };
  };

  const decadal = resolveTarget(chartData?.transitDecadalPalace);
  const tieuHan = resolveTarget(chartData?.transitYearlyPalace);
  if (!decadal && !tieuHan) return "";

  const analysis = opts?.analysis ?? analyzeCachCuc(idx);
  const enriched = enrichAnalysis(idx, analysis);

  const linesFor = (t: { name: string; branch: number }, label: string): string => {
    const hits = enriched
      .filter((e) => e.match.starBrightness.some((s) => s.branchIdx === t.branch))
      .slice(0, 6);
    const head = `  • ${label} — cung ${t.name} (${BRANCHES_VI[t.branch]}):`;
    if (!hits.length) {
      return `${head}\n    - (Chưa khớp cách điển hình phủ cung này — luận theo tổ hợp chính tinh thật, KHÔNG bịa tên cách.)`;
    }
    const body = hits
      .map((e) => {
        const m = e.match;
        const axis =
          m.axisKeyword && m.axisKeyword !== "toan-la-so" ? ` · trục ${m.axisKeyword}` : "";
        return `    - ${m.name} [${e.effectiveQualityLabel}]${axis}`;
      })
      .join("\n");
    return `${head}\n${body}`;
  };

  const parts: string[] = [];
  if (decadal) parts.push(linesFor(decadal, "Đại hạn"));
  if (tieuHan) parts.push(linesFor(tieuHan, "Tiểu hạn"));

  if (style === "chat") {
    return (
      "CÁCH CỤC CHẠM CUNG VẬN (ĐẠI HẠN/TIỂU HẠN — máy quét sẵn: cách cục có sao nằm trong cung vận; " +
      "chỉ nêu ĐÚNG tên cách + [chất lượng] dưới đây, CẤM bịa tên cách ngoài):\n" +
      parts.join("\n")
    );
  }

  return `--- CHEAT SHEET: CÁCH CỤC CHẠM CUNG VẬN (ĐẠI HẠN & TIỂU HẠN — MÁY QUÉT SẴN) ---
Cách cục ở sheet MASTER có sao thành phần nằm trong cung Đại hạn / Tiểu hạn — đây là "cách đang sống" tại cung vận, dùng để neo khí chất vận hạn (Phần 3). BẮT BUỘC: chỉ nêu ĐÚNG tên cách + [chất lượng] có trong MASTER + block này; CẤM bịa tên cách ngoài; dòng "(Chưa khớp...)" thì luận tổ hợp sao thật:
${parts.join("\n")}`;
};