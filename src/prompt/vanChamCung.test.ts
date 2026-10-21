import { describe, it, expect } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { buildChartIndex } from "../utils/chartRelations";
import { buildVanChamCungBlock } from "./chartReports";

function fixture() {
  const r = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
  const chartData: any = buildInterpretPayload(r, 2026);
  return { chartData, idx: buildChartIndex(chartData.palaces) };
}

describe("buildVanChamCungBlock — cách cục chạm cung vận (VĐ2)", () => {
  it("bình thường: có dòng Đại hạn + Tiểu hạn, tên cách đúng format [chất lượng]", () => {
    const { chartData, idx } = fixture();
    const block = buildVanChamCungBlock(idx, chartData);
    expect(block).toContain("CÁCH CỤC CHẠM CUNG VẬN");
    expect(block).toContain("• Đại hạn — cung");
    expect(block).toContain("• Tiểu hạn — cung");
    // Mỗi dòng cách đúng format, hoặc dòng "chưa khớp" hợp lệ
    expect(block).toMatch(/\[cách (thành|trung bình|phá \/ lực giảm|hãm \/ khó phát)\]|\(Chưa khớp cách điển hình/);
  });

  it("童限 (chưa vào Đại Hạn): ẩn dòng Đại hạn, giữ dòng Tiểu hạn", () => {
    const { chartData, idx } = fixture();
    const block = buildVanChamCungBlock(idx, {
      ...chartData,
      transitDecadalPalace: "Chưa vào Đại Hạn",
    });
    expect(block).not.toContain("• Đại hạn");
    expect(block).toContain("• Tiểu hạn — cung");
  });

  it("thiếu cả tên cung vận → chuỗi rỗng (không nhét khối trống)", () => {
    const { chartData, idx } = fixture();
    const block = buildVanChamCungBlock(idx, {
      ...chartData,
      transitDecadalPalace: "",
      transitYearlyPalace: "",
    });
    expect(block).toBe("");
  });

  it("style chat: header 1 dòng, không có marker section '--- CHEAT SHEET'", () => {
    const { chartData, idx } = fixture();
    const block = buildVanChamCungBlock(idx, chartData, { style: "chat" });
    expect(block.startsWith("CÁCH CỤC CHẠM CUNG VẬN (")).toBe(true);
    expect(block).not.toContain("--- CHEAT SHEET");
    expect(block).toContain("CẤM bịa tên cách ngoài");
  });
});
