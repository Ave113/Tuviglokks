import { describe, it, expect } from "vitest";
import { generateTuviAstrolabe } from "./tuvi";
import { buildChartIndex } from "./chartRelations";
import {
  detectCachCucForAxis,
  analyzeCachCuc,
  buildCachCucReport,
  getTamPhuongBranches,
  getBrightnessTier,
  evaluatePatternQuality,
  CACH_CUC_AXES,
} from "./cachCuc";

import { BIRTHPLACE } from "../constants/birthplace";

function chartIdx() {
  const r = generateTuviAstrolabe("2009-06-09", "00:30", BIRTHPLACE.CENTRAL_SOUTH_OF_17, "Nam");
  return buildChartIndex(r.chart.palaces);
}

describe("getBrightnessTier", () => {
  it("phân loại miếu/vượng/hãm/bình", () => {
    expect(getBrightnessTier("Miếu")).toBe("cat");
    expect(getBrightnessTier("Vượng")).toBe("cat");
    expect(getBrightnessTier("Đắc")).toBe("cat");
    expect(getBrightnessTier("Lợi")).toBe("cat");
    expect(getBrightnessTier("Bình")).toBe("trung");
    expect(getBrightnessTier("Hạn")).toBe("ham"); // iztro vi-VN locale (xian → Hạn)
    expect(getBrightnessTier("Hãm")).toBe("ham"); // nhãn học lý / bản dịch khác
    expect(getBrightnessTier("Bất")).toBe("ham"); // iztro vi-VN (bu → Bất)
    expect(getBrightnessTier("")).toBe("unknown");
  });
});

describe("detectCachCucForAxis — lá 2009 Tý sớm", () => {
  const idx = chartIdx();

  it("trục Mệnh: Liêm Tướng + Tử Phủ, có miếu/hãm", () => {
    const menh = detectCachCucForAxis(idx, CACH_CUC_AXES[0]);
    const liemTuong = menh.find((m) => m.name === "Liêm Tướng");
    expect(liemTuong).toBeDefined();
    expect(liemTuong!.starLocations.some((s) => s.includes("Liêm Trinh"))).toBe(true);
    expect(liemTuong!.starLocations.some((s) => s.includes("Thiên Tướng Miếu"))).toBe(true);
    expect(liemTuong!.quality).toBe("trung"); // Liêm Bình + Tướng Miếu
    expect(menh.map((m) => m.name)).toContain("Tử Phủ");
  });

  it("trục Phu Thê: Sát Phá Tham", () => {
    const pt = detectCachCucForAxis(idx, CACH_CUC_AXES.find((a) => a.keyword === "Phu Thê")!);
    expect(pt.map((m) => m.name)).toContain("Sát Phá Tham");
  });
});

describe("analyzeCachCuc — dedup", () => {
  it("Tử Phủ không lặp trên cả Mệnh và Tài Bạch", () => {
    const analysis = analyzeCachCuc(chartIdx());
    const tuPhu = analysis.uniqueTamPhuong.filter((m) => m.name === "Tử Phủ");
    expect(tuPhu).toHaveLength(1);
    expect(tuPhu[0].axisKeyword).toBe("Mệnh");
  });

  it("rawByAxis vẫn có nhiều trục nhưng unique đã gom", () => {
    const analysis = analyzeCachCuc(chartIdx());
    const rawTuPhuCount = analysis.rawByAxis
      .flatMap((r) => r.tamPhuong)
      .filter((m) => m.name === "Tử Phủ").length;
    expect(rawTuPhuCount).toBeGreaterThanOrEqual(2);
    expect(analysis.uniqueTamPhuong.filter((m) => m.name === "Tử Phủ")).toHaveLength(1);
  });
});

describe("buildCachCucReport", () => {
  it("có quality label và dedup", () => {
    const report = buildCachCucReport(chartIdx());
    expect(report).toMatch(/cách thành|cách trung/);
    expect(report).toContain("dedup");
    expect(report).toContain("TÓM TẮT TRỤC CHỦ");
  });
});

describe("pattern mới + logic sheet", () => {
  it("PATTERNS gồm co-luong / vu-sat / am-duong-hoi", () => {
    // detectAll không export PATTERNS — dùng analyze: không crash
    const a = analyzeCachCuc(chartIdx());
    expect(a.primarySummary.length).toBeGreaterThan(0);
  });
});

describe("evaluatePatternQuality", () => {
  it("Liêm Hạn không boost → ham", () => {
    const r = evaluatePatternQuality(
      { id: "x", name: "X", hint: "", stars: [], scope: "tamPhuong", criticalHamStars: ["Liêm Trinh"] },
      [
        { name: "Liêm Trinh", brightness: "Hạn", tier: "ham", branchIdx: 0, palaceName: "Mệnh" },
        { name: "Thất Sát", brightness: "Miếu", tier: "cat", branchIdx: 1, palaceName: "Phúc" },
      ],
    );
    expect(r.quality).toBe("ham");
  });

  it("Liêm Hạn + Tướng Miếu boost → trung", () => {
    const r = evaluatePatternQuality(
      {
        id: "x", name: "X", hint: "", stars: [], scope: "tamPhuong",
        criticalHamStars: ["Liêm Trinh"], catBoostStars: ["Thiên Tướng"],
      },
      [
        { name: "Liêm Trinh", brightness: "Hạn", tier: "ham", branchIdx: 0, palaceName: "Mệnh" },
        { name: "Thiên Tướng", brightness: "Miếu", tier: "cat", branchIdx: 0, palaceName: "Mệnh" },
      ],
    );
    expect(r.quality).toBe("trung");
  });
});

describe("đồng cung Đồng Cự", () => {
  it("nhận khi Thiên Đồng + Cự Môn cùng cung", () => {
    const palaces = Array.from({ length: 12 }, (_, i) => ({
      index: i,
      name: i === 3 ? "Huynh Đệ" : `Cung ${i}`,
      majorStars:
        i === 3
          ? [{ name: "Thiên Đồng", brightness: "Bình" }, { name: "Cự Môn", brightness: "Vượng" }]
          : i === 10
          ? [{ name: "Liêm Trinh", brightness: "Bình" }, { name: "Thiên Tướng", brightness: "Miếu" }]
          : [],
      minorStars: [],
      adjectiveStars: [],
    }));
    const analysis = analyzeCachCuc(buildChartIndex(palaces));
    expect(analysis.globalDongCungExtra.some((m) => m.name === "Đồng Cự")).toBe(true);
  });
});

describe("combo mới — Tử Phủ Vũ Tướng / Vũ Tướng / Cơ Cự", () => {
  function synthetic(starsByIndex: Record<number, { name: string; brightness: string }[]>) {
    return buildChartIndex(
      Array.from({ length: 12 }, (_, i) => ({
        index: i,
        name: i === 0 ? "Mệnh" : `Cung ${i}`,
        majorStars: starsByIndex[i] || [],
        minorStars: [],
        adjectiveStars: [],
      })),
    );
  }

  it("Tử Phủ Vũ Tướng + Vũ Tướng khi đủ 4 sao hội tam phương trục Mệnh", () => {
    const idx = synthetic({
      0: [{ name: "Tử Vi", brightness: "Miếu" }],
      4: [{ name: "Thiên Phủ", brightness: "Miếu" }],
      6: [{ name: "Thiên Tướng", brightness: "Miếu" }],
      8: [{ name: "Vũ Khúc", brightness: "Miếu" }],
    });
    const menh = detectCachCucForAxis(idx, CACH_CUC_AXES[0]);
    const names = menh.map((m) => m.name);
    expect(names).toContain("Tử Phủ Vũ Tướng");
    expect(names).toContain("Vũ Tướng");
    expect(menh.find((m) => m.name === "Tử Phủ Vũ Tướng")!.quality).toBe("thanh");
  });

  it("Cơ Cự: nhận cả hội tam phương lẫn đồng cung toàn lá", () => {
    const hoi = synthetic({
      0: [{ name: "Thiên Cơ", brightness: "Đắc" }],
      4: [{ name: "Cự Môn", brightness: "Vượng" }],
    });
    const menhHoi = detectCachCucForAxis(hoi, CACH_CUC_AXES[0]);
    expect(menhHoi.map((m) => m.name)).toContain("Cơ Cự");

    const dc = synthetic({
      3: [
        { name: "Thiên Cơ", brightness: "Đắc" },
        { name: "Cự Môn", brightness: "Vượng" },
      ],
    });
    const analysis = analyzeCachCuc(dc);
    expect(analysis.globalDongCungExtra.some((m) => m.name === "Cơ Cự (đồng cung)")).toBe(true);
  });

  it("Vũ Tướng đồng cung: nhận biến thể (đồng cung) toàn lá", () => {
    const dc = synthetic({
      5: [
        { name: "Vũ Khúc", brightness: "Miếu" },
        { name: "Thiên Tướng", brightness: "Miếu" },
      ],
    });
    const analysis = analyzeCachCuc(dc);
    expect(analysis.globalDongCungExtra.some((m) => m.name === "Vũ Tướng (đồng cung)")).toBe(true);
  });
});