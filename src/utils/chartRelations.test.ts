import { describe, it, expect } from "vitest";
import {
  toBranchIndex,
  BRANCHES_VI,
  NHI_HOP,
  LUC_HAI,
  normalizeStarName,
  buildChartIndex,
  findStarBranch,
  buildFlyingTuHoaLines,
  buildNatalTuHoaLines,
  buildRelationsBlock,
  satKyStarsInPalace,
  buildCrossLinks,
} from "./chartRelations";

// Lá số giả tối thiểu theo quy ước iztro (palace.index 0 = Dần).
// Gán một số sao + thiên can để kiểm tra phi tứ hóa và quan hệ.
function buildPalaces() {
  const branchName = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"];
  return Array.from({ length: 12 }, (_, i) => ({
    index: i,
    name:
      i === 10 ? "Cung Mệnh" :
      i === 0 ? "Cung Phu Thê" :
      i === 1 ? "Cung Tài Bạch" :
      `Cung ${branchName[i]}`,
    earthlyBranch: branchName[i],
    heavenlyStem: i === 10 ? "Giáp" : "Ất",
    majorStars:
      i === 0 ? [{ name: "Liêm Trinh" }] :    // đích Hóa Lộc của can Giáp
      i === 4 ? [{ name: "Thái Dương" }] :    // đích Hóa Kỵ của can Giáp
      [],
    minorStars: i === 1 ? [{ name: "Kình Dương" }] : [],
    adjectiveStars: [],
  }));
}

describe("toBranchIndex", () => {
  it("quy index iztro (Dần=0) về index địa chi (Tý=0)", () => {
    expect(toBranchIndex(0)).toBe(2); // Dần
    expect(toBranchIndex(10)).toBe(0); // Tý
    expect(toBranchIndex(11)).toBe(1); // Sửu
  });
});

const branchIdx = (name: string) => BRANCHES_VI.indexOf(name);

describe("bảng quan hệ nhị hợp / lục hại", () => {
  const NHI_HOP_PAIRS: [string, string][] = [
    ["Tý", "Sửu"],
    ["Dần", "Hợi"],
    ["Mão", "Tuất"],
    ["Thìn", "Dậu"],
    ["Tỵ", "Thân"],
    ["Ngọ", "Mùi"],
  ];
  const LUC_HAI_PAIRS: [string, string][] = [
    ["Tý", "Mùi"],
    ["Sửu", "Ngọ"],
    ["Dần", "Tỵ"],
    ["Mão", "Thìn"],
    ["Thân", "Hợi"],
    ["Dậu", "Tuất"],
  ];

  it("nhị hợp — đủ 6 cặp truyền thống", () => {
    NHI_HOP_PAIRS.forEach(([a, b]) => {
      expect(NHI_HOP[branchIdx(a)]).toBe(branchIdx(b));
      expect(NHI_HOP[branchIdx(b)]).toBe(branchIdx(a));
    });
    expect(Object.keys(NHI_HOP)).toHaveLength(12);
  });

  it("lục hại — đủ 6 cặp truyền thống", () => {
    LUC_HAI_PAIRS.forEach(([a, b]) => {
      expect(LUC_HAI[branchIdx(a)]).toBe(branchIdx(b));
      expect(LUC_HAI[branchIdx(b)]).toBe(branchIdx(a));
    });
    expect(Object.keys(LUC_HAI)).toHaveLength(12);
  });

  it("nhị hợp và lục hại không trùng cặp", () => {
    const nhSet = new Set(NHI_HOP_PAIRS.map(([a, b]) => [a, b].sort().join("-")));
    const lhSet = new Set(LUC_HAI_PAIRS.map(([a, b]) => [a, b].sort().join("-")));
    nhSet.forEach((pair) => expect(lhSet.has(pair)).toBe(false));
  });
});

describe("normalizeStarName", () => {
  it("bỏ tiền tố [SAO LƯU], ký tự ẩn và chuẩn hóa", () => {
    expect(normalizeStarName("[SAO LƯU] Hóa Kỵ")).toBe(normalizeStarName("Hóa Kỵ"));
    expect(normalizeStarName("  Thái  Dương ")).toBe("thái dương");
  });
});

describe("findStarBranch + phi tứ hóa (can Giáp)", () => {
  const idx = buildChartIndex(buildPalaces());
  it("tìm đúng cung chứa sao gốc (quét đủ 3 nhóm)", () => {
    expect(findStarBranch(idx, "Liêm Trinh")).toBe(toBranchIndex(0)); // Dần=2
    expect(findStarBranch(idx, "Kình Dương")).toBe(toBranchIndex(1)); // phụ tinh vẫn tìm được
    expect(findStarBranch(idx, "Sao Không Tồn Tại")).toBe(-1);
  });
  it("can Giáp: Hóa Lộc→Liêm Trinh, Hóa Kỵ→Thái Dương đúng cung đích", () => {
    const lines = buildFlyingTuHoaLines(idx, "Giáp");
    expect(lines[0]).toContain("Liêm Trinh");
    expect(lines[3]).toContain("Thái Dương");
  });
  it("can không hợp lệ -> mảng rỗng, không crash", () => {
    expect(buildFlyingTuHoaLines(idx, undefined)).toEqual([]);
  });
});

describe("buildNatalTuHoaLines", () => {
  const idx = buildChartIndex(buildPalaces());
  it("trả null khi thiếu can năm sinh", () => {
    expect(buildNatalTuHoaLines(idx, undefined)).toBeNull();
  });
  it("trả đủ 4 dòng khi có can", () => {
    expect(buildNatalTuHoaLines(idx, "Giáp")).toHaveLength(4);
  });
});

describe("buildRelationsBlock", () => {
  it("có đủ các dòng quan hệ + nhãn neo cung", () => {
    const idx = buildChartIndex(buildPalaces());
    const menh = idx.palacesArr.find((p: any) => p.name === "Cung Mệnh");
    const block = buildRelationsBlock(idx, menh);
    expect(block).toContain("Quan hệ của Cung Mệnh");
    expect(block).toContain("Xung chiếu");
    expect(block).toContain("Tam hợp");
    expect(block).toContain("Nhị hợp");
    expect(block).toContain("Lục hại");
    expect(block).toContain("Phi Tứ Hóa (can Giáp)");
  });
});

describe("satKyStarsInPalace", () => {
  it("phát hiện Kình Dương là sát tinh", () => {
    const idx = buildChartIndex(buildPalaces());
    const tai = idx.palacesArr.find((p: any) => p.name === "Cung Tài Bạch");
    expect(satKyStarsInPalace(tai)).toContain("Kình Dương");
  });
});

describe("buildCrossLinks - liên kết đa chiều", () => {
  const idx = buildChartIndex(buildPalaces());
  it("nối Hóa Lộc bẩm sinh (Liêm Trinh ở Phu Thê) với lĩnh vực hôn nhân", () => {
    // Can Giáp: Hóa Lộc -> Liêm Trinh (đang ở Cung Phu Thê trong mock)
    const out = buildCrossLinks(idx, "Giáp", undefined, 2026);
    expect(out).toContain("BẨM SINH");
    expect(out).toContain("Hóa Lộc");
    expect(out).toContain("Cung Phu Thê");
    expect(out).toContain("hôn nhân");
  });
  it("nối Hóa Kỵ bẩm sinh (Thái Dương) với sắc thái hao tổn/vướng mắc", () => {
    const out = buildCrossLinks(idx, "Giáp", undefined, 2026);
    expect(out).toContain("Hóa Kỵ");
    expect(out).toContain("hao tổn");
  });
  it("bỏ qua Hóa mà sao đích không có trên lá số (Phá Quân/Vũ Khúc không có trong mock)", () => {
    const out = buildCrossLinks(idx, "Giáp", undefined, 2026);
    expect(out).not.toContain("Phá Quân");
    expect(out).not.toContain("Vũ Khúc");
  });
  it("thiếu cả hai can -> báo chưa đủ dữ liệu, không crash", () => {
    const out = buildCrossLinks(idx, undefined, undefined, undefined);
    expect(out).toContain("Chưa đủ dữ liệu");
  });
});
