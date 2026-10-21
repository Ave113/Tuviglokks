import { describe, it, expect } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { toBranchIndex } from "./chartRelations";
import {
  TUVI_GLOBAL_OFFSETS,
  EARTHLY_BRANCHES,
  palaceIndexToBranchIndex,
  normalizeToHanoi,
  getTuviGlobalTime,
  calculateTransitInfo,
  generateTuviAstrolabe,
} from "./tuvi";

// ---------------------------------------------------------------
// Mock 12 cung theo quy ước iztro: palace.index 0 = Dần
// Tên cung đặt theo địa chi để dễ kiểm tra (vd palace index 0 -> "Cung Dần")
// ---------------------------------------------------------------
function buildMockPalaces(daiHanRange: { palaceIndex: number; range: [number, number] }) {
  return Array.from({ length: 12 }, (_, i) => ({
    index: i,
    name: `Cung ${EARTHLY_BRANCHES[(i + 2) % 12]}`,
    decadal: {
      range: i === daiHanRange.palaceIndex ? daiHanRange.range : [1000, 1009],
    },
  }));
}

describe("palaceIndexToBranchIndex", () => {
  it("chuyển index iztro (Dần=0) về index địa chi (Tý=0)", () => {
    expect(palaceIndexToBranchIndex(0)).toBe(2); // Dần
    expect(palaceIndexToBranchIndex(10)).toBe(0); // Tý
    expect(palaceIndexToBranchIndex(11)).toBe(1); // Sửu
    expect(EARTHLY_BRANCHES[palaceIndexToBranchIndex(0)]).toBe("Dần");
  });

  it("trùng toBranchIndex (một nguồn sự thật)", () => {
    Array.from({ length: 12 }, (_, i) => {
      expect(palaceIndexToBranchIndex(i)).toBe(toBranchIndex(i));
    });
  });
});

describe("TUVI_GLOBAL_OFFSETS", () => {
  it("có đủ 12 tháng và đều bằng 0 (giờ chuẩn)", () => {
    expect(Object.keys(TUVI_GLOBAL_OFFSETS)).toHaveLength(12);
    expect(TUVI_GLOBAL_OFFSETS[1]).toBe(0);
    expect(TUVI_GLOBAL_OFFSETS[5]).toBe(0);
    expect(TUVI_GLOBAL_OFFSETS[11]).toBe(0);
  });
});

describe("normalizeToHanoi - hiệu chỉnh múi giờ lịch sử", () => {
  it("1943-1945: lùi 1 giờ (GMT+8)", () => {
    const r = normalizeToHanoi("1944-06-15", "10:00", BIRTHPLACE.NORTH);
    expect(r.normalizedDate.getHours()).toBe(9);
    expect(r.timezoneLabel).toBe("GMT+8 -> GMT+7");
  });

  it("04/1945-08/1945: lùi 2 giờ (GMT+9 Nhật)", () => {
    const r = normalizeToHanoi("1945-05-01", "10:00", BIRTHPLACE.NORTH);
    expect(r.normalizedDate.getHours()).toBe(8);
    expect(r.timezoneLabel).toBe("GMT+9 -> GMT+7");
  });

  it("Miền Nam 1960-1975: lùi 1 giờ (GMT+8 Sài Gòn)", () => {
    const r = normalizeToHanoi("1970-06-15", "10:00", BIRTHPLACE.SOUTH);
    expect(r.normalizedDate.getHours()).toBe(9);
  });

  it("Miền Trung (Quảng Trị trở vào) 1960-1975: lùi 1 giờ — value dropdown khớp normalizeToHanoi", () => {
    const r = normalizeToHanoi("1970-06-15", "10:00", BIRTHPLACE.CENTRAL_SOUTH_OF_17);
    expect(r.normalizedDate.getHours()).toBe(9);
    expect(r.timezoneLabel).toBe("GMT+8 -> GMT+7");
  });

  it("Miền Trung (Quảng Bình trở ra) 1960-1975: giữ GMT+7", () => {
    const r = normalizeToHanoi("1970-06-15", "10:00", BIRTHPLACE.CENTRAL_NORTH_OF_17);
    expect(r.normalizedDate.getHours()).toBe(10);
    expect(r.timezoneLabel).toBe("GMT+7");
  });

  it("Miền Bắc 1960-1975: giữ nguyên GMT+7", () => {
    const r = normalizeToHanoi("1970-06-15", "10:00", BIRTHPLACE.NORTH);
    expect(r.normalizedDate.getHours()).toBe(10);
    expect(r.timezoneLabel).toBe("GMT+7");
  });

  it("sau 1975: giữ nguyên", () => {
    const r = normalizeToHanoi("1995-10-25", "12:30", BIRTHPLACE.SOUTH);
    expect(r.normalizedDate.getHours()).toBe(12);
    expect(r.normalizedDate.getMinutes()).toBe(30);
  });
});

describe("getTuviGlobalTime - xác định giờ địa chi", () => {
  it("tháng 1, 12:00 -> giờ Ngọ, không warning", () => {
    const r = getTuviGlobalTime(1, new Date(2024, 0, 15, 12, 0));
    expect(r.branchName).toBe("Ngọ");
    expect(r.dateShift).toBe(0);
    expect(r.warning).toBeNull();
  });

  it("tháng 1, 23:10 -> Tý muộn, dịch +1 ngày, có warning sát giới", () => {
    const r = getTuviGlobalTime(1, new Date(2024, 0, 15, 23, 10));
    expect(r.branchName).toBe("Tý");
    expect(r.dateShift).toBe(1);
    expect(r.warning).not.toBeNull();
    expect(r.warning).toContain("Hợi");
  });

  it("tháng 1, 00:30 -> Tý sớm, không dịch ngày", () => {
    const r = getTuviGlobalTime(1, new Date(2024, 0, 15, 0, 30));
    expect(r.branchName).toBe("Tý");
    expect(r.dateShift).toBe(0);
  });

  it("tháng 1, 01:05 -> Sửu, warning sát giới Tý sang Sửu", () => {
    const r = getTuviGlobalTime(1, new Date(2024, 0, 15, 1, 5));
    expect(r.branchName).toBe("Sửu");
    expect(r.warning).not.toBeNull();
  });

  it("tháng 5, 12:00 -> Ngọ, không dịch ngày", () => {
    const r = getTuviGlobalTime(5, new Date(2024, 5, 15, 12, 0));
    expect(r.branchName).toBe("Ngọ");
    expect(r.dateShift).toBe(0);
  });

  it("tháng 11, 22:55 -> Hợi; 23:05 -> Tý dịch +1 ngày", () => {
    const hoi = getTuviGlobalTime(11, new Date(2024, 11, 15, 22, 55));
    expect(hoi.branchName).toBe("Hợi");
    expect(hoi.dateShift).toBe(0);

    const ty = getTuviGlobalTime(11, new Date(2024, 11, 15, 23, 5));
    expect(ty.branchName).toBe("Tý");
    expect(ty.dateShift).toBe(1);
  });
});

describe("calculateTransitInfo - vận hạn năm 2026 (Bính Ngọ), sinh 1995 (Ất Hợi)", () => {
  const palaces = buildMockPalaces({ palaceIndex: 3, range: [26, 35] });
  const nam = calculateTransitInfo(1995, "Hợi", "Nam", palaces, 2026);

  it("tuổi mụ = 32", () => {
    expect(nam.lunarAge).toBe(32);
  });

  it("Lưu Niên Thái Tuế tại cung Ngọ (chi của năm 2026)", () => {
    expect(nam.luuNienThaiTueIndex).toBe(6); // Ngọ
    expect(nam.luuNienThaiTueName).toBe("Cung Ngọ");
    expect(nam.saoLuuMap[6]).toContain("Lưu Thái Tuế");
  });

  it("Đại Hạn: tuổi 32 rơi vào cung có range [26,35] (iztro index 3 = Tỵ)", () => {
    expect(nam.daiHanPalaceIndex).toBe(5); // index địa chi của Tỵ
    expect(nam.daiHanPalaceName).toBe("Cung Tỵ");
  });

  it("Tiểu Hạn Nam: tuổi Hợi khởi Sửu, thuận 32 tuổi -> Thân", () => {
    expect(nam.tieuHanPalaceIndex).toBe(8); // Thân
    expect(nam.tieuHanPalaceName).toBe("Cung Thân");
  });

  it("Tiểu Hạn Nữ: khởi Sửu, nghịch 32 tuổi -> Ngọ", () => {
    const nu = calculateTransitInfo(1995, "Hợi", "Nữ", palaces, 2026);
    expect(nu.tieuHanPalaceIndex).toBe(6); // Ngọ
  });

  it("Lưu Lộc Tồn năm Bính tại Tỵ, Kình Dương Ngọ, Đà La Thìn", () => {
    expect(nam.saoLuuMap[5]).toContain("Lưu Lộc Tồn"); // Tỵ
    expect(nam.saoLuuMap[6]).toContain("Lưu Kình Dương"); // Ngọ
    expect(nam.saoLuuMap[4]).toContain("Lưu Đà La"); // Thìn
  });

  it("Lưu Tang Môn tại Thân (+2), Lưu Bạch Hổ tại Dần (+8)", () => {
    expect(nam.saoLuuMap[8]).toContain("Lưu Tang Môn"); // Thân
    expect(nam.saoLuuMap[2]).toContain("Lưu Bạch Hổ"); // Dần
  });

  it("Lưu Thiên Mã năm Ngọ (tam hợp Dần Ngọ Tuất) tại Thân", () => {
    expect(nam.saoLuuMap[8]).toContain("Lưu Thiên Mã");
  });

  it("Lưu Thiên Khốc và Lưu Thiên Hư năm Ngọ đồng cung tại Tý", () => {
    expect(nam.saoLuuMap[0]).toContain("Lưu Thiên Khốc");
    expect(nam.saoLuuMap[0]).toContain("Lưu Thiên Hư");
  });

  it("Lưu Hồng Loan năm Ngọ tại Dậu (khởi Mão đếm nghịch), Lưu Thiên Hỷ đối cung tại Mão", () => {
    expect(nam.saoLuuMap[9]).toContain("Lưu Hồng Loan"); // Dậu
    expect(nam.saoLuuMap[3]).toContain("Lưu Thiên Hỷ"); // Mão
  });

  it("Lưu Hồng Loan năm Tý tại Mão, Thiên Hỷ tại Dậu (kiểm chứng gốc phú)", () => {
    const namTy = calculateTransitInfo(1995, "Hợi", "Nam", palaces, 2020); // 2020 Canh Tý
    expect(namTy.saoLuuMap[3]).toContain("Lưu Hồng Loan"); // Mão
    expect(namTy.saoLuuMap[9]).toContain("Lưu Thiên Hỷ"); // Dậu
  });

  it("Lưu Văn Xương năm Bính tại Thân, Lưu Văn Khúc tại Ngọ", () => {
    expect(nam.saoLuuMap[8]).toContain("Lưu Văn Xương"); // Thân
    expect(nam.saoLuuMap[6]).toContain("Lưu Văn Khúc"); // Ngọ
  });

  it("Lưu Văn Xương/Khúc năm Canh (2020): Xương tại Hợi, Khúc tại Mão", () => {
    const namCanh = calculateTransitInfo(1995, "Hợi", "Nam", palaces, 2020);
    expect(namCanh.saoLuuMap[11]).toContain("Lưu Văn Xương"); // Hợi
    expect(namCanh.saoLuuMap[3]).toContain("Lưu Văn Khúc"); // Mão
  });

  it("Lưu Tứ Đức năm Ngọ (2026): Thiên Đức tại Mão (3), Nguyệt Đức tại Hợi (11), Long Đức tại Sửu (1), Phúc Đức tại Mão (3)", () => {
    expect(nam.saoLuuMap[3]).toContain("Lưu Thiên Đức");
    expect(nam.saoLuuMap[11]).toContain("Lưu Nguyệt Đức");
    expect(nam.saoLuuMap[1]).toContain("Lưu Long Đức");
    expect(nam.saoLuuMap[3]).toContain("Lưu Phúc Đức");
  });

  it("Lưu Tứ Đức năm Tý (2020): Thiên Đức tại Dậu (9), Nguyệt Đức tại Tỵ (5), Long Đức tại Mùi (7), Phúc Đức tại Dậu (9)", () => {
    const namTy = calculateTransitInfo(1995, "Hợi", "Nam", palaces, 2020);
    expect(namTy.saoLuuMap[9]).toContain("Lưu Thiên Đức");
    expect(namTy.saoLuuMap[5]).toContain("Lưu Nguyệt Đức");
    expect(namTy.saoLuuMap[7]).toContain("Lưu Long Đức");
    expect(namTy.saoLuuMap[9]).toContain("Lưu Phúc Đức");
  });

  it("Lưu Tứ Hóa: mock palaces không có danh sách sao -> bỏ qua an toàn, không crash", () => {
    const allStars = Object.values(nam.saoLuuMap).flat();
    expect(allStars.some((s) => s.startsWith("Lưu Hóa"))).toBe(false);
  });

  it("Lưu Tứ Hóa năm Bính bám theo vị trí sao gốc: Đồng Lộc, Cơ Quyền, Xương Khoa, Liêm Kỵ", () => {
    // Mock có sao: Thiên Đồng ở iztro index 0 (Dần), Thiên Cơ ở index 1 (Mão),
    // Văn Xương ở index 2 (Thìn, phụ tinh), Liêm Trinh ở index 3 (Tỵ)
    const palacesWithStars = buildMockPalaces({ palaceIndex: 3, range: [26, 35] }).map((p) => ({
      ...p,
      majorStars:
        p.index === 0 ? [{ name: "Thiên Đồng" }] :
        p.index === 1 ? [{ name: "Thiên Cơ" }] :
        p.index === 3 ? [{ name: "Liêm Trinh" }] : [],
      minorStars: p.index === 2 ? [{ name: "Văn Xương" }] : [],
    }));
    const r = calculateTransitInfo(1995, "Hợi", "Nam", palacesWithStars, 2026); // Bính Ngọ
    expect(r.saoLuuMap[2]).toContain("Lưu Hóa Lộc (Thiên Đồng)"); // Dần
    expect(r.saoLuuMap[3]).toContain("Lưu Hóa Quyền (Thiên Cơ)"); // Mão
    expect(r.saoLuuMap[4]).toContain("Lưu Hóa Khoa (Văn Xương)"); // Thìn
    expect(r.saoLuuMap[5]).toContain("Lưu Hóa Kỵ (Liêm Trinh)"); // Tỵ
  });
});

describe("Lưu Tứ Hóa - integration với lá số iztro thật (kiểm chứng khớp tên sao vi-VN)", () => {
  it("lá số thật 1995 xem hạn 2026 (Bính): an được đủ Lộc, Quyền, Khoa, Kỵ", () => {
    const chart = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam").chart;
    const r = calculateTransitInfo(1995, "Hợi", "Nam", chart.palaces, 2026);
    const allStars = Object.values(r.saoLuuMap).flat();
    // Nếu tên sao vi-VN của iztro lệch với bảng LUU_TU_HOA_BY_STEM, test này sẽ fail
    expect(allStars.some((s) => s.startsWith("Lưu Hóa Lộc"))).toBe(true);
    expect(allStars.some((s) => s.startsWith("Lưu Hóa Quyền"))).toBe(true);
    expect(allStars.some((s) => s.startsWith("Lưu Hóa Khoa"))).toBe(true);
    expect(allStars.some((s) => s.startsWith("Lưu Hóa Kỵ"))).toBe(true);
  });
});

describe("generateTuviAstrolabe - integration với iztro", () => {
  it("lập được lá số 25/10/1995 12:30 Miền Nam, giờ Ngọ", () => {
    const r = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    expect(r.chart).toBeTruthy();
    expect(r.chart.palaces).toHaveLength(12);
    expect(r.tuviGlobalHourResult.branchName).toBe("Ngọ");
    expect(r.finalSolarDateUsed).toBe("1995-10-25");
  });

  it("iztro trả về palace.index 0 ứng với cung Dần (xác minh quy ước index)", () => {
    const r = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    const palace0 = r.chart.palaces.find((p: any) => p.index === 0);
    expect(palace0.earthlyBranch).toBe("Dần");
  });
});
