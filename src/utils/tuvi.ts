import { astro } from 'iztro';
import {
  BIRTHPLACE,
  isGmt8HistoricalRegion,
  isOverseasBirthplace,
  type BirthplaceRegion,
} from '../constants/birthplace';
import { buildChartIndex, findStarBranch, toBranchIndex } from './chartRelations';
import {
  mergeIztroHoroscopeStars,
  type HoroscopeCapable,
  type YearlyDecRingsByBranch,
} from './horoscopeStars';
import {
  stemIndexByYear,
  stemNameByYear,
  HOA_LABELS,
  VAN_HOA_LABELS,
  LUU_HOA_LABELS,
  quartetForStem,
  type LayerTuHoa,
  type LayerTuHoaItem,
} from './tuHoa';

// Giờ tiêu chuẩn Đông phương: 12 địa chi cố định 2 tiếng, mốc Tý = 23:00–01:00 (GMT+7).
// Bảng offset (theo phút, so với mốc Tý 23:00) được giữ lại để tương thích ngược
// và phòng khi cần bật lại lịch giờ biến thiên theo tháng âm lịch. Hiện toàn bộ = 0
// nghĩa là dùng đúng khung giờ chuẩn, không lệch theo tháng.
export const TUVI_GLOBAL_OFFSETS: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
  11: 0,
  12: 0,
};

export const EARTHLY_BRANCHES = [
  "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"
];

/**
 * Alias của `toBranchIndex` (chartRelations.ts) — giữ tên cũ cho UI/vận hạn.
 * iztro: palace.index 0 = Dần → địa chi chuẩn 0 = Tý.
 */
export const palaceIndexToBranchIndex = toBranchIndex;

export interface TimezoneAdjustment {
  originalTime: string;
  originalDate: string;
  birthplace: BirthplaceRegion;
  normalizedDate: Date;
  timezoneLabel: string;
  note: string;
}

/**
 * Normalizes birth datetime into current Vietnamese timezone GMT+7 using historical rules
 */
 export function normalizeToHanoi(dateStr: string, timeStr: string, birthplace: BirthplaceRegion, originalTimezoneOffset?: number): TimezoneAdjustment {
  // Dựng Date từ thành phần số thay vì parse chuỗi ISO: cách parse chuỗi không
  // offset phụ thuộc runtime. Constructor components luôn dùng local TZ, đồng nhất
  // với toàn bộ getHours()/getMonth()... phía sau — giờ/ngày nhập luôn khớp, bất kể
  // TZ máy. Kết quả y hệt hành vi cũ, chỉ bỏ phụ thuộc vào diễn giải chuỗi.
  const [yStr, moStr, dStr] = String(dateStr).split("-");
  const [hStr, miStr] = String(timeStr).split(":");
  const originalDate = new Date(
    Number(yStr),
    Number(moStr) - 1,
    Number(dStr),
    Number(hStr),
    Number(miStr),
    0,
  );
  let adjustedDate = new Date(originalDate.getTime());
  let note = "Giữ nguyên múi giờ GMT+7.";
  let timezoneLabel = "GMT+7";
  if (isOverseasBirthplace(birthplace)) {
    if (typeof originalTimezoneOffset === "number" && originalTimezoneOffset !== 7) {
      const deltaMinutes = Math.round((7 - originalTimezoneOffset) * 60);
      adjustedDate.setMinutes(adjustedDate.getMinutes() + deltaMinutes);
      const sign = originalTimezoneOffset >= 0 ? "+" : "";
      note = `Quy đổi từ múi giờ gốc nơi sinh GMT${sign}${originalTimezoneOffset} về GMT+7 (chênh lệch ${deltaMinutes > 0 ? "+" : ""}${deltaMinutes} phút).`;
      timezoneLabel = `GMT${sign}${originalTimezoneOffset} -> GMT+7`;
    } else {
      note = "Giờ sinh ở nước ngoài được coi là đã quy đổi sẵn về GMT+7.";
    }
    return { originalTime: timeStr, originalDate: dateStr, birthplace, normalizedDate: adjustedDate, timezoneLabel, note };
  }

  // Helper to compare dates
  const matchesRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    return originalDate >= start && originalDate <= end;
  };

  // Rule 1: 01/01/1943 to 31/03/1945 -- GMT+8 (Subtract 1 hour to get to GMT+7)
  if (matchesRange("1943-01-01T00:00:00", "1945-03-31T23:59:59")) {
    adjustedDate.setHours(adjustedDate.getHours() - 1);
    note = "Hiệu chỉnh lùi 1 giờ do thời kỳ này sử dụng múi giờ GMT+8.";
    timezoneLabel = "GMT+8 -> GMT+7";
  }
  // Rule 2: 01/04/1945 to 18/08/1945 -- GMT+9 (Subtract 2 hours to get to GMT+7)
  else if (matchesRange("1945-04-01T00:00:00", "1945-08-18T23:59:59")) {
    adjustedDate.setHours(adjustedDate.getHours() - 2);
    note = "Hiệu chỉnh lùi 2 giờ do thời kỳ chiến tranh thế giới thứ 2 sử dụng múi giờ Nhật Bản GMT+9.";
    timezoneLabel = "GMT+9 -> GMT+7";
  }
  // Rule 3: 01/01/1960 to 30/04/1975 -- Miền Nam Việt Nam & Miền Trung Vĩ tuyến 17 trở vào GMT+8 (Subtract 1 hour)
  else if (
    isGmt8HistoricalRegion(birthplace) &&
    matchesRange("1960-01-01T00:00:00", "1975-04-30T23:59:59")
  ) {
    adjustedDate.setHours(adjustedDate.getHours() - 1);
    note = "Hiệu chỉnh lùi 1 giờ ở Miền Nam / Miền Trung (vĩ tuyến 17 trở vào) từ 1960 đến 1975, do chế độ Sài Gòn quy định múi giờ GMT+8.";
    timezoneLabel = "GMT+8 -> GMT+7";
  }

  return {
    originalTime: timeStr,
    originalDate: dateStr,
    birthplace,
    normalizedDate: adjustedDate,
    timezoneLabel,
    note
  };
}

export interface HourResult {
  branchName: string;
  timeIndex: number; // 0 to 11 (or 12 for late Tý in intermediate states)
  rangeStr: string;
  warning: string | null;
  dateShift: number; // -1, 0, or +1 day shift required
}

/**
 * Xác định địa chi của giờ sinh + cảnh báo "sát giới" theo Giờ Tiêu chuẩn
 * Đông phương (khung 12 địa chi cố định 2 tiếng, mốc Tý = 23:00–01:00, GMT+7).
 *
 * Tham số lunarMonth được giữ lại ở chữ ký để tương thích nơi gọi và để có thể
 * tái kích hoạt lịch giờ biến thiên theo tháng (TUVI_GLOBAL_OFFSETS) trong tương lai;
 * với offset = 0 hiện tại, giờ chuẩn không phụ thuộc tháng âm lịch.
 */
export function getTuviGlobalTime(lunarMonth: number, date: Date): HourResult {
  void lunarMonth; // giờ chuẩn không phụ thuộc tháng âm lịch (offset = 0)
  const timeMin = date.getHours() * 60 + date.getMinutes();

  const TY_START = 23 * 60; // 23:00 - mốc bắt đầu giờ Tý
  const TY_END = 1 * 60;    // 01:00 - kết thúc giờ Tý (sang ngày hôm sau)

  let branchIndex = 0;
  let dateShift = 0;
  let rangeStr = "";
  let warning: string | null = null;

  if (timeMin >= TY_START || timeMin < TY_END) {
    // Giờ Tý: 23:00 – 01:00, vắt sang ngày hôm sau
    branchIndex = 0;
    dateShift = timeMin >= TY_START ? 1 : 0;
    const prev = getFormattedTime(TY_START); // 23h00
    const next = getFormattedTime(TY_END);   // 01h00
    rangeStr = `${prev} – ${next} (vắt sang ngày hôm sau)`;

    if (timeMin >= TY_START && Math.abs(timeMin - TY_START) <= 15) {
      const hoiStart = getFormattedTime(21 * 60); // 21h00
      warning = `Sinh sát giới mốc chuyển giờ Hợi sang Tý (${prev}). Hãy kiểm định với giờ Hợi (${hoiStart} - ${prev}).`;
    } else if (timeMin < TY_END && Math.abs(timeMin - TY_END) <= 15) {
      warning = `Sinh sát giới mốc chuyển giờ Tý sang Sửu (${next}). Hãy kiểm định với giờ Sửu (${next} - ${getFormattedTime(TY_END + 120)}).`;
    }
  } else {
    // Sửu → Hợi: slot i (1..11), mỗi khung 2 tiếng, khởi từ 01:00
    for (let i = 1; i <= 11; i++) {
      const start = (2 * i - 1) * 60;
      const end = (2 * i + 1) * 60;
      if (timeMin >= start && timeMin < end) {
        branchIndex = i;
        dateShift = 0;
        const sStr = getFormattedTime(start);
        const eStr = getFormattedTime(end);
        rangeStr = `${sStr} – ${eStr}`;

        if (Math.abs(timeMin - start) <= 15) {
          warning = `Sinh sát giới mốc chuyển giờ ${EARTHLY_BRANCHES[i - 1]} sang ${EARTHLY_BRANCHES[i]} (${sStr}). Hãy kiểm định với giờ ${EARTHLY_BRANCHES[i - 1]}.`;
        } else if (Math.abs(timeMin - end) <= 15) {
          const nextBranch = EARTHLY_BRANCHES[(i + 1) % 12];
          warning = `Sinh sát giới mốc chuyển giờ ${EARTHLY_BRANCHES[i]} sang ${nextBranch} (${eStr}). Hãy kiểm định với giờ ${nextBranch}.`;
        }
        break;
      }
    }
  }

  return {
    branchName: EARTHLY_BRANCHES[branchIndex],
    timeIndex: branchIndex,
    rangeStr,
    warning,
    dateShift
  };
}

function getFormattedTime(totalMinutes: number): string {
  // Safe bounds
  const relativeMin = (totalMinutes + 1440) % 1440;
  const h = Math.floor(relativeMin / 60);
  const m = relativeMin % 60;
  return `${h.toString().padStart(2, '0')}h${m.toString().padStart(2, '0')}`;
}

/**
 * Executes a dual-pass birth astrolabe generation resolving both solar/lunar month alignment
 * and exact astronomical hours correct under local chi-hour standards.
 */
export function generateTuviAstrolabe(
  solarDateStr: string, // "YYYY-MM-DD"
  solarTimeStr: string, // "HH:MM"
  birthplace: BirthplaceRegion,
  gender: 'Nam' | 'Nữ',
  originalTimezoneOffset?: number
) {
  const norm = normalizeToHanoi(solarDateStr, solarTimeStr, birthplace, originalTimezoneOffset);
  const normDate = norm.normalizedDate;

  const yVal = normDate.getFullYear();
  const mVal = normDate.getMonth() + 1;
  const dVal = normDate.getDate();

  // Step 2: Pass 1 on dummy Ngọ hour (6) to extract approximation of lunar month
  const firstPassDateStr = `${yVal}-${mVal.toString().padStart(2, '0')}-${dVal.toString().padStart(2, '0')}`;
  const firstPass = astro.bySolar(firstPassDateStr, 6, gender, true, 'vi-VN');
  
  const approxLunarMonth = firstPass.rawDates.lunarDate.lunarMonth;

  let matchedHour = getTuviGlobalTime(approxLunarMonth, normDate);
  let effectiveLunarMonth = approxLunarMonth;

  const applyDateShift = (shift: number): Date => {
    const d = new Date(normDate.getTime());
    if (shift === 1) d.setDate(d.getDate() + 1);
    else if (shift === -1) d.setDate(d.getDate() - 1);
    return d;
  };

  const toSolarStr = (d: Date): string =>
    `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

  let finalAstroDate = applyDateShift(matchedHour.dateShift);

  if (matchedHour.dateShift !== 0) {
    const recheckPass = astro.bySolar(toSolarStr(finalAstroDate), 6, gender, true, 'vi-VN');
    const shiftedLunarMonth = recheckPass.rawDates.lunarDate.lunarMonth;
    if (shiftedLunarMonth !== approxLunarMonth) {
      effectiveLunarMonth = shiftedLunarMonth;
      matchedHour = getTuviGlobalTime(shiftedLunarMonth, normDate);
      finalAstroDate = applyDateShift(matchedHour.dateShift);
    }
  }

  const finalSolarPassStr = toSolarStr(finalAstroDate);


  // Step 4: Final Pass computing full star chart using exact aligned hour index
  const finalChart = astro.bySolar(
    finalSolarPassStr,
    matchedHour.timeIndex,
    gender,
    true,
    'vi-VN'
  );

  return {
    timezoneNormalization: norm,
    tuviGlobalHourResult: matchedHour,
    finalSolarDateUsed: finalSolarPassStr,
    approxLunarMonth,
    effectiveLunarMonth,
    chart: finalChart
  };
}

export interface TransitResult {
  transitYear: number;
  lunarAge: number;
  daiHanPalaceIndex: number; // 0..11
  daiHanPalaceName: string;
  /** Can đại hạn (từ palace.decadal.heavenlyStem) */
  daiHanStem: string;
  /** Chi đại hạn (từ palace.decadal.earthlyBranch) */
  daiHanBranch: string;
  /** Khoảng tuổi đại hạn đang đứng, vd [32, 41] */
  daiHanRange: [number, number] | null;
  tieuHanPalaceIndex: number; // 0..11
  tieuHanPalaceName: string;
  /** ages iztro của cung tiểu hạn hiện tại (năm mụ tiểu hạn vào cung đó) */
  tieuHanAges: number[];
  luuNienThaiTueIndex: number; // 0..11
  luuNienThaiTueName: string;
  saoLuuMap: Record<number, string[]>; // branch index Tý=0 -> list of Sao Luu names e.g. ["Lưu Thái Tuế", "Lưu Lộc Tồn"]
  /** Tuế Tiền / Tướng Tiền năm xem (iztro yearlyDecStar); null nếu không lấy được. */
  yearlyDecRings: YearlyDecRingsByBranch | null;
  /** Tứ Hóa đại hạn: 4 sao + nhãn + cung đích */
  decadalTuHoa: LayerTuHoa | null;
  /** Tứ Hóa lưu niên (năm xem): 4 sao + nhãn + cung đích */
  yearlyTuHoa: LayerTuHoa | null;
  /** ages tiểu hạn theo chi cung (Tý=0) — từ iztro palace.ages */
  tieuHanAgesByBranch: Record<number, number[]>;
}

/** Gắn 4 sao Tứ Hóa theo can → vị trí trên lá + (tuỳ chọn) push tên vào saoLuuMap. */
function resolveLayerTuHoaOnChart(
  stem: string | undefined,
  branch: string | undefined,
  layer: LayerTuHoa["layer"],
  chartIdx: ReturnType<typeof buildChartIndex>,
  palaces: any[],
  mapLabels: readonly [string, string, string, string] | null,
  saoLuuMap: Record<number, string[]> | null,
): LayerTuHoa | null {
  const quartet = quartetForStem(stem);
  if (!quartet || !stem) return null;

  const nameByBranch = (b: number): string => {
    for (const p of palaces || []) {
      if (palaceIndexToBranchIndex(p.index) === b) return String(p.name || "");
    }
    return "";
  };

  const items: LayerTuHoaItem[] = quartet.map((starName, i) => {
    const branchIdx = findStarBranch(chartIdx, starName);
    const palaceName = branchIdx >= 0 ? nameByBranch(branchIdx) : "";
    if (mapLabels && saoLuuMap && branchIdx >= 0) {
      const tag = `${mapLabels[i]} (${starName})`;
      if (!saoLuuMap[branchIdx]) saoLuuMap[branchIdx] = [];
      if (!saoLuuMap[branchIdx].some((s) => s === tag || s.startsWith(mapLabels[i]))) {
        saoLuuMap[branchIdx].push(tag);
      }
    }
    return {
      hoa: HOA_LABELS[i],
      star: starName,
      branchIdx,
      palaceName,
    };
  });

  return {
    stem: String(stem).trim(),
    ...(branch ? { branch: String(branch).trim() } : {}),
    layer,
    items,
  };
}

export function calculateTransitInfo(
  birthYear: number,
  birthZodiac: string, // e.g. "Tý", "Sửu", ..., matching EARTHLY_BRANCHES
  gender: "Nam" | "Nữ",
  palaces: any[], // 12 palaces
  transitYear: number,
  /** Lá iztro đầy đủ — nếu có .horoscope thì merge Lưu Khôi/Việt, Niên Giải, sao Vận… */
  astrolabe?: HoroscopeCapable | null,
): TransitResult {
  const lunarAge = transitYear - birthYear + 1;

  // 1. Find Dai Han (Major 10-year limit) + can–chi / range từ palace.decadal
  let daiHanPalaceIndex = -1;
  let daiHanPalaceName = "";
  let daiHanStem = "";
  let daiHanBranch = "";
  let daiHanRange: [number, number] | null = null;
  const tieuHanAgesByBranch: Record<number, number[]> = {};
  for (let i = 0; i < 12; i++) tieuHanAgesByBranch[i] = [];

  palaces.forEach((p) => {
    const bIdx = palaceIndexToBranchIndex(p.index);
    if (Array.isArray(p.ages)) {
      tieuHanAgesByBranch[bIdx] = p.ages
        .map((n: unknown) => Number(n))
        .filter((n: number) => Number.isFinite(n));
    }
    const range = p.decadal?.range;
    if (range && lunarAge >= range[0] && lunarAge <= range[1]) {
      // Chuyển index cung iztro (Dần=0) về index địa chi (Tý=0)
      daiHanPalaceIndex = bIdx;
      daiHanPalaceName = p.name;
      daiHanStem = String(p.decadal?.heavenlyStem || p.heavenlyStem || "").trim();
      daiHanBranch = String(p.decadal?.earthlyBranch || p.earthlyBranch || "").trim();
      if (Array.isArray(range) && range.length >= 2) {
        daiHanRange = [Number(range[0]), Number(range[1])];
      }
    }
  });
  // 童限: trẻ chưa tới tuổi khởi vận — KHÔNG có đại vận THẬT (đừng nhận lớp "Vận"):
  // iztro trả decadal giả của cung 童限; nhận vào sẽ mâu thuẫn nhãn "Chưa vào Đại Hạn".
  const chuaVaoDaiHan = daiHanPalaceIndex === -1;
  if (chuaVaoDaiHan) {
    daiHanPalaceName = "Chưa vào Đại Hạn";
  }

  // 2. Find Luu Nien Thai Tue
  // Luu Nien Thai Tue matches the earthly branch of the transitYear.
  // branchIndex = (transitYear - 4) % 12 (since index 4 is Thìn, which corresponds to (2024 - 4) % 12)
  const luuNienBranchIndex = ((transitYear - 4) % 12 + 12) % 12;
  const luuNienThaiTueIndex = luuNienBranchIndex;
  let luuNienThaiTueName = "";
  palaces.forEach((p) => {
    // So sánh theo index địa chi (iztro p.index có gốc Dần=0)
    if (palaceIndexToBranchIndex(p.index) === luuNienBranchIndex) {
      luuNienThaiTueName = p.name;
    }
  });

  // 3. Find Tieu Han
  // A. Determine Starting Palace index of Tieu Han based on birthZodiac (which is the animal like Tý/Sửu/Dần...)
  // Map standard zoom grouping:
  // Dan - Ngo - Tuat (Dần, Ngọ, Tuất): start is Thin (index 4)
  // Than - Ty - Thin (Thân, Tý, Thìn): start is Tuat (index 10)
  // Ty - Dau - Suu (Tỵ, Dậu, Sửu): start is Mui (index 7)
  // Hoi - Mao - Mui (Hợi, Mão, Mùi): start is Suu (index 1)
  
  const branchNormalized = birthZodiac.trim();
  let startTieuHanIndex = 4; // default
  if (["Dần", "Ngọ", "Tuất"].includes(branchNormalized)) {
    startTieuHanIndex = 4; // Thìn
  } else if (["Thân", "Tý", "Thìn"].includes(branchNormalized)) {
    startTieuHanIndex = 10; // Tuất
  } else if (["Tỵ", "Dậu", "Sửu"].includes(branchNormalized)) {
    startTieuHanIndex = 7; // Mùi
  } else if (["Hợi", "Mão", "Mùi"].includes(branchNormalized)) {
    startTieuHanIndex = 1; // Sửu
  }

  // B. Move based on gender (Nam: clockwise, Nữ: counter-clockwise)
  let tieuHanPalaceIndex = 0;
  if (gender === "Nam") {
    // Clockwise (chuẩn hóa modulo âm — đối xứng nhánh Nữ, tránh index âm khi xem năm trước sinh)
    tieuHanPalaceIndex = (((startTieuHanIndex + (lunarAge - 1)) % 12) + 12) % 12;
  } else {
    // Counter-clockwise
    tieuHanPalaceIndex = (((startTieuHanIndex - (lunarAge - 1)) % 12) + 12) % 12;
  }

  let tieuHanPalaceName = "";
  let tieuHanAges: number[] = [];
  palaces.forEach((p) => {
    // So sánh theo index địa chi (iztro p.index có gốc Dần=0)
    if (palaceIndexToBranchIndex(p.index) === tieuHanPalaceIndex) {
      tieuHanPalaceName = p.name;
      tieuHanAges = tieuHanAgesByBranch[tieuHanPalaceIndex] || [];
    }
  });

  // 4. Calculate Sao Luu mapping
  const saoLuuMap: Record<number, string[]> = {};
  for (let i = 0; i < 12; i++) {
    saoLuuMap[i] = [];
  }

  // A. Lưu Thái Tuế: Always in the Luu Nien Thai Tue palace
  saoLuuMap[luuNienBranchIndex].push("Lưu Thái Tuế");

  // B. Lưu Tang Môn & Lưu Bạch Hổ:
  // Lưu Tang Môn = (Lưu Thái Tuế + 2) % 12
  const luuTangMonIndex = (luuNienBranchIndex + 2) % 12;
  saoLuuMap[luuTangMonIndex].push("Lưu Tang Môn");

  // Lưu Bạch Hổ = (Lưu Thái Tuế + 8) % 12 (đối cung với Lưu Tang Môn)
  const luuBachHoIndex = (luuNienBranchIndex + 8) % 12;
  saoLuuMap[luuBachHoIndex].push("Lưu Bạch Hổ");

  // C. Lưu Lộc Tồn, Lưu Kình Dương, Lưu Đà La:
  // Determine Heavenly Stem of transitYear (Y % 10)
  // 0: Canh, 1: Tân, 2: Nhâm, 3: Quý, 4: Giáp, 5: Ất, 6: Bính, 7: Đinh, 8: Mậu, 9: Kỷ
  const transitStemIndex = stemIndexByYear(transitYear);
  // Lưu Lộc Tồn theo can năm hạn (key = year%10): 0:Canh->Thân, 1:Tân->Dậu,
  // 2:Nhâm->Hợi, 3:Quý->Tý, 4:Giáp->Dần, 5:Ất->Mão, 6:Bính->Tỵ, 7:Đinh->Ngọ,
  // 8:Mậu->Tỵ, 9:Kỷ->Ngọ. Cùng pattern với LUU_VAN_XUONG_BY_STEM bên dưới.
  const LUU_LOC_TON_BY_STEM: Record<number, number> = {
    0: 8, 1: 9, 2: 11, 3: 0, 4: 2, 5: 3, 6: 5, 7: 6, 8: 5, 9: 6,
  };
  const luuLocTonIndex = LUU_LOC_TON_BY_STEM[transitStemIndex] ?? 2;

  saoLuuMap[luuLocTonIndex].push("Lưu Lộc Tồn");

  const luuKinhDuongIndex = (luuLocTonIndex + 1) % 12;
  saoLuuMap[luuKinhDuongIndex].push("Lưu Kình Dương");

  const luuDaLaIndex = (luuLocTonIndex - 1 + 12) % 12;
  saoLuuMap[luuDaLaIndex].push("Lưu Đà La");

  // D. Lưu Thiên Mã:
  // Dần - Ngọ - Tuất (indices 2, 6, 10) -> Thân (8)
  // Thân - Tý - Thìn (indices 8, 0, 4) -> Dần (2)
  // Tỵ - Dậu - Sửu (indices 5, 9, 1) -> Hợi (11)
  // Hợi - Mão - Mùi (indices 11, 3, 7) -> Tỵ (5)
  let luuThienMaIndex = 8;
  if ([2, 6, 10].includes(luuNienBranchIndex)) {
    luuThienMaIndex = 8;
  } else if ([8, 0, 4].includes(luuNienBranchIndex)) {
    luuThienMaIndex = 2;
  } else if ([5, 9, 1].includes(luuNienBranchIndex)) {
    luuThienMaIndex = 11;
  } else if ([11, 3, 7].includes(luuNienBranchIndex)) {
    luuThienMaIndex = 5;
  }
  saoLuuMap[luuThienMaIndex].push("Lưu Thiên Mã");

  // E. Lưu Thiên Khốc & Lưu Thiên Hư:
  // Derived from the Index of Year Branch T where (T = luuNienBranchIndex)
  // Khốc index = (6 - T + 12) % 12
  // Hư index = (6 + T) % 12
  const luuKhocIndex = (6 - luuNienBranchIndex + 12) % 12;
  const luuHuIndex = (6 + luuNienBranchIndex) % 12;
  saoLuuMap[luuKhocIndex].push("Lưu Thiên Khốc");
  saoLuuMap[luuHuIndex].push("Lưu Thiên Hư");

  // F. Lưu Hồng Loan & Lưu Thiên Hỷ (theo CHI năm hạn):
  // Hồng Loan: khởi cung Mão (3), đếm NGHỊCH theo chi năm -> index = (3 - T) % 12
  // Thiên Hỷ: luôn đối cung với Hồng Loan -> index = (Hồng Loan + 6) % 12
  // Kiểm chứng: năm Tý (T=0) -> Hồng Loan ở Mão, Thiên Hỷ ở Dậu (đúng quy tắc cổ truyền)
  const luuHongLoanIndex = ((3 - luuNienBranchIndex) % 12 + 12) % 12;
  const luuThienHyIndex = (luuHongLoanIndex + 6) % 12;
  saoLuuMap[luuHongLoanIndex].push("Lưu Hồng Loan");
  saoLuuMap[luuThienHyIndex].push("Lưu Thiên Hỷ");

  // G. Lưu Văn Xương & Lưu Văn Khúc (theo CAN năm hạn):
  // Phú an Lưu Xương: Giáp->Tỵ, Ất->Ngọ, Bính/Mậu->Thân, Đinh/Kỷ->Dậu, Canh->Hợi, Tân->Tý, Nhâm->Dần, Quý->Mão
  // Lưu Khúc (đối xứng):  Giáp->Dậu, Ất->Thân, Bính/Mậu->Ngọ, Đinh/Kỷ->Tỵ, Canh->Mão, Tân->Dần, Nhâm->Tý, Quý->Hợi
  // Key = transitStemIndex (year % 10): 0:Canh, 1:Tân, 2:Nhâm, 3:Quý, 4:Giáp, 5:Ất, 6:Bính, 7:Đinh, 8:Mậu, 9:Kỷ
  const LUU_VAN_XUONG_BY_STEM: Record<number, number> = {
    0: 11, 1: 0, 2: 2, 3: 3, 4: 5, 5: 6, 6: 8, 7: 9, 8: 8, 9: 9,
  };
  const LUU_VAN_KHUC_BY_STEM: Record<number, number> = {
    0: 3, 1: 2, 2: 0, 3: 11, 4: 9, 5: 8, 6: 6, 7: 5, 8: 6, 9: 5,
  };
  saoLuuMap[LUU_VAN_XUONG_BY_STEM[transitStemIndex]].push("Lưu Văn Xương");
  saoLuuMap[LUU_VAN_KHUC_BY_STEM[transitStemIndex]].push("Lưu Văn Khúc");

  // H. Lưu Tứ Đức (theo CHI năm hạn):
  // - Lưu Thiên Đức: Khởi Dậu (9) đếm thuận đến chi năm hạn T -> (9 + T) % 12
  // - Lưu Nguyệt Đức: Khởi Tỵ (5) đếm thuận đến chi năm hạn T -> (5 + T) % 12
  // - Lưu Long Đức: Vị trí thứ 8 trong vòng Lưu Thái Tuế -> (T + 7) % 12
  // - Lưu Phúc Đức: Vị trí thứ 10 trong vòng Lưu Thái Tuế (Đức Tú) -> (T + 9) % 12
  const luuThienDucIndex = (9 + luuNienBranchIndex) % 12;
  const luuNguyetDucIndex = (5 + luuNienBranchIndex) % 12;
  const luuLongDucIndex = (luuNienBranchIndex + 7) % 12;
  const luuPhucDucIndex = (luuNienBranchIndex + 9) % 12;

  saoLuuMap[luuThienDucIndex].push("Lưu Thiên Đức");
  saoLuuMap[luuNguyetDucIndex].push("Lưu Nguyệt Đức");
  saoLuuMap[luuLongDucIndex].push("Lưu Long Đức");
  saoLuuMap[luuPhucDucIndex].push("Lưu Phúc Đức");

  // I. Lưu Tứ Hóa (theo CAN năm hạn) + Vận Tứ Hóa (theo CAN đại hạn).
  // Bảng [Lộc, Quyền, Khoa, Kỵ] = TU_HOA_BY_STEM; vị trí = sao GỐC trên lá.
  const chartIdx = buildChartIndex(palaces);
  const luuStem = stemNameByYear(transitYear);

  const yearlyTuHoa = resolveLayerTuHoaOnChart(
    luuStem,
    EARTHLY_BRANCHES[luuNienBranchIndex],
    "lưu",
    chartIdx,
    palaces,
    LUU_HOA_LABELS,
    saoLuuMap,
  );

  // I. Bổ sung từ iztro.horoscope: Lưu Khôi/Việt, Niên Giải, Vận * …
  // + yearlyDecStar. Gọi trước resolve Vận Hóa để fallback can–chi đại hạn nếu thiếu.
  // skipDecadal khi 童限: iztro vẫn trả decadal (can–chi cung tạm) — nhận vào sẽ
  // mâu thuẫn nhãn "Chưa vào Đại Hạn" ở trên.
  const yearlyDecRings = mergeIztroHoroscopeStars(astrolabe, transitYear, saoLuuMap, palaces, {
    skipDecadal: chuaVaoDaiHan,
  });

  if (
    !chuaVaoDaiHan &&
    (!daiHanStem || !daiHanBranch) &&
    astrolabe &&
    typeof astrolabe.horoscope === "function"
  ) {
    try {
      const h = astrolabe.horoscope(`${transitYear}-06-15`) as {
        decadal?: { heavenlyStem?: string; earthlyBranch?: string };
      };
      if (!daiHanStem && h?.decadal?.heavenlyStem) {
        daiHanStem = String(h.decadal.heavenlyStem).trim();
      }
      if (!daiHanBranch && h?.decadal?.earthlyBranch) {
        daiHanBranch = String(h.decadal.earthlyBranch).trim();
      }
    } catch {
      /* ignore */
    }
  }

  const decadalTuHoa = chuaVaoDaiHan
    ? null
    : resolveLayerTuHoaOnChart(
        daiHanStem || undefined,
        daiHanBranch || undefined,
        "vận",
        chartIdx,
        palaces,
        VAN_HOA_LABELS,
        saoLuuMap,
      );

  return {
    transitYear,
    lunarAge,
    daiHanPalaceIndex,
    daiHanPalaceName,
    daiHanStem,
    daiHanBranch,
    daiHanRange,
    tieuHanPalaceIndex,
    tieuHanPalaceName,
    tieuHanAges,
    luuNienThaiTueIndex,
    luuNienThaiTueName,
    saoLuuMap,
    yearlyDecRings,
    decadalTuHoa,
    yearlyTuHoa,
    tieuHanAgesByBranch,
  };
}

