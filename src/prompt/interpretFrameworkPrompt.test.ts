import { describe, it, expect } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { INTERPRET_INCLUDE_MONTHLY_SECTION } from "../server/aiConfig";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { buildInterpretUserPrompt } from "./formatInterpretPrompt";
import { buildChartPromptContext } from "./buildChartPromptContext";
import {
  buildInterpretFrameworkBlock,
  buildLuuNguyetCheatSheetBlock,
} from "./interpretFrameworkPrompt";

describe("interpretFrameworkPrompt — monthly section off", () => {
  const chartPayload = () => {
    const r = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    return buildInterpretPayload(r, 2026);
  };

  it("flag mặc định là false", () => {
    expect(INTERPRET_INCLUDE_MONTHLY_SECTION).toBe(false);
  });

  it("cheat sheet Lưu Nguyệt rỗng khi flag tắt", () => {
    expect(buildLuuNguyetCheatSheetBlock("  - Tháng 1 âm: cung Mệnh")).toBe("");
  });

  it("khung luận giải 9 phần, không Phần 7 tháng", () => {
    const chart = chartPayload();
    const block = buildInterpretFrameworkBlock(2026, chart, true);
    expect(block).toContain("gồm 9 phần lớn");
    expect(block).not.toContain("THÁNG TRỌNG TÂM");
    expect(block).toContain("TUYỆT ĐỐI KHÔNG viết mục");
    expect(block).toContain("7. **CUNG PHÚC ĐỨC");
    expect(block).toContain("8. **ĐỊNH CÁCH PHÚ QUÝ");
    expect(block).toContain("tóm tắt xu hướng cả năm");
  });

  it("buildInterpretUserPrompt không chứa LƯU NGUYỆT cheat sheet", () => {
    const chart = chartPayload();
    const ctx = buildChartPromptContext(chart);
    const prompt = buildInterpretUserPrompt(ctx, chart);
    expect(prompt).not.toContain("LƯU NGUYỆT — 12 CUNG THÁNG");
    expect(prompt).not.toContain("THÁNG TRỌNG TÂM");
    expect(prompt).not.toContain("gồm 10 phần");
    expect(prompt).toContain("gồm 9 phần");
    expect(ctx.luuNguyetReportStr).toBe("");
  });
});