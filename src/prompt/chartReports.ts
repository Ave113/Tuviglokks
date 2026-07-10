import { TU_HOA_BY_STEM, HOA_LABELS } from "../utils/tuHoa";
import {
  type ChartIndex,
  buildNatalTuHoaLines,
  buildFlyingTuHoaLines,
  SAT_KY_STARS,
  BRANCHES_VI,
  toBranchIndex,
  NHI_HOP,
  LUC_HAI,
  normalizeStarName,
  allStarsOf,
  findStarBranch,
  palaceLabel,
} from "../utils/chartRelations";
export { buildTuanTrietReport, analyzeTuanTriet, classifyTuanTrietStar } from "../utils/tuanTriet";

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
  const stemRaw = birthHeavenlyStem;
  const stemKey = typeof stemRaw === "string" ? stemRaw.trim() : stemRaw;
  const lines = buildNatalTuHoaLines(idx, stemKey);
  const natalTuHoaResolved = Boolean(stemKey && TU_HOA_BY_STEM[stemKey]);
  if (!lines) {
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
    const all = allStarsOf(p);
    const found = all
      .filter((s: any) => SAT_KY_STARS.includes(normalizeStarName(s.name)))
      .map((s: any) => s.name);
    if (found.length > 0) {
      zones.push(`  - ${p.name} (${BRANCHES_VI[toBranchIndex(p.index)]}): ${found.join(", ")}`);
    }
  });
  return zones.length > 0
    ? zones.join("\n")
    : "  - Không phát hiện tổ hợp sát tinh/kỵ tinh cực đoan nổi bật.";
};

export const buildLuuNienReport = (palacesArr: any[]): string => {
  const zones: string[] = [];
  palacesArr.forEach((p: any) => {
    const all = allStarsOf(p);
    const luu = all
      .filter((s: any) => /\[SAO LƯU\]/.test(String(s.name || "")))
      .map((s: any) => String(s.name).replace(/\[SAO LƯU\]\s*/g, "").trim());
    if (luu.length > 0) {
      zones.push(`  - ${p.name} (${BRANCHES_VI[toBranchIndex(p.index)]}): ${luu.join(", ")}`);
    }
  });
  return zones.length > 0
    ? zones.join("\n")
    : "  - Không phát hiện sao lưu niên nào được đánh dấu trên lá số.";
};

export const buildTuHoaReport = (idx: ChartIndex, palacesArr: any[]): string => {
  const lines: string[] = [];
  palacesArr.forEach((p: any) => {
    const b = toBranchIndex(p.index);
    const stem = p.heavenlyStem;
    const tuhoa = stem ? TU_HOA_BY_STEM[String(stem).trim()] : undefined;
    if (!tuhoa) return;
    const inThisPalace = new Set(
      allStarsOf(p).map((s: any) => normalizeStarName(s.name)),
    );
    const selfHits = tuhoa
      .map((star, i) => ({ star, label: HOA_LABELS[i] }))
      .filter(({ star }) => inThisPalace.has(normalizeStarName(star)));
    if (selfHits.length > 0) {
      const detail = selfHits.map(({ label, star }) => `${label}→${star}`).join("; ");
      lines.push(`  - ${p.name} (${BRANCHES_VI[b]}, can ${stem}): TỰ HÓA ${detail}`);
    }
  });
  return lines.length > 0
    ? lines.join("\n")
    : "  - Lá số không có cung nào phát Tự Hóa (自化) theo can bản cung.";
};

export const buildBodyPalaceStr = (palacesArr: any[]): string => {
  const bodyPalace = palacesArr.find((p: any) => p?.isBodyPalace);
  if (!bodyPalace) {
    return "Lá số không đánh dấu Cung Thân đồng cung riêng (Thân đồng cung Mệnh hoặc dữ liệu chưa gắn cờ); luận Thân theo cung Mệnh.";
  }
  const major = (bodyPalace.majorStars || []).map((s: any) => s.name).join(", ") || "Vô Chính Diệu";
  const branch = BRANCHES_VI[toBranchIndex(bodyPalace.index)];
  return `Cung Thân an tại cung ${bodyPalace.name} (Địa chi ${branch}, Thiên can ${bodyPalace.heavenlyStem}). Chính tinh thủ Thân: ${major}. Khi luận, hãy đối chiếu trục Mệnh (xu hướng tư duy bẩm sinh, chủ đạo nửa đầu đời ~trước 30) với Thân (xu hướng hành động/hậu vận, chủ đạo nửa sau ~sau 30) để thấy sự dịch chuyển nội tâm → hành vi của đương số.`;
};

export const buildLaiNhanReport = (palacesArr: any[], stemKey: string | undefined): string => {
  if (!stemKey) return "  - Chưa xác định được Thiên can năm sinh nên chưa xác định được Lai Nhân Cung.";
  const target = String(stemKey).trim();
  const hits = palacesArr.filter((p: any) => String(p.heavenlyStem || "").trim() === target);
  if (hits.length === 0) {
    return "  - Không cung nào trùng can năm sinh trên dữ liệu (hiếm); không định Lai Nhân Cung.";
  }
  return hits.map((p: any) => {
    const major = (p.majorStars || []).map((s: any) => s.name).join(", ") || "Vô Chính Diệu";
    return `  - Lai Nhân Cung: ${p.name} (${BRANCHES_VI[toBranchIndex(p.index)]}, can ${p.heavenlyStem}) — chính tinh: ${major}`;
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
    lines.push(`  - ${p.name} (${BRANCHES_VI[toBranchIndex(p.index)]}): vòng Tràng Sinh = ${cs || "chưa rõ"} → ${classifyTheDat(cs)}`);
  });
  return lines.length > 0
    ? lines.join("\n")
    : "  - Dữ liệu vòng Tràng Sinh chưa đầy đủ trên lá số.";
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
    allStarsOf(pa).forEach((s: any) => {
      const n = normalizeStarName(s.name);
      if (CAT_PHUC_STARS.includes(n)) catFound.push(s.name);
      else if (HUNG_SAT_STARS.includes(n)) hungFound.push(s.name);
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

export const collectTuHoaPairs = (table?: string[]) =>
  (table || []).map((star, i) => ({ star, hoa: HOA_LABELS[i] }));

export const buildSchoolMetaStr = (chartData: any): string => {
  const schoolMeta = chartData.schoolMeta;
  return schoolMeta
    ? `- Phái luận chính (đầu ra): ${schoolMeta.primaryLabel || schoolMeta.primarySchool}\n- Phái đối chiếu nội bộ: ${schoolMeta.internalLabel || schoolMeta.internalSchool}\n- Engine an sao: ${schoolMeta.engine || "iztro"}`
    : "- Phái: Nam phái Trần Đoàn (mặc định)";
};