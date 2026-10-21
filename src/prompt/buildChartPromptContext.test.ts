import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveTransitYear } from "../utils/transitYear";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { BIRTHPLACE } from "../constants/birthplace";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { buildChartPromptContext } from "./buildChartPromptContext";
import { buildInterpretUserPrompt } from "./formatInterpretPrompt";
import { retrieveKinhNghiem } from "../knowledge/kinhNghiemKnowledge";

describe("buildChartPromptContext", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("fallback transitYearNum khi client thiếu/sai — dùng resolveTransitYear, không hardcode", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-08-01T00:00:00Z"));
    const calculated = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    const chartData = { ...buildInterpretPayload(calculated, 2026), transitYear: undefined };
    const ctx = buildChartPromptContext(chartData);
    expect(ctx.transitYearNum).toBe(resolveTransitYear(undefined));
    expect(ctx.transitYearNum).toBe(2027);
  });

  it("returns non-empty natalTuHoaStr for sample chart BIRTHPLACE.SOUTH 1995-10-25", () => {
    const calculated = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    const chartData = buildInterpretPayload(calculated, 2026);
    const ctx = buildChartPromptContext(chartData);

    expect(ctx.natalTuHoaStr).toBeTruthy();
    expect(ctx.natalTuHoaStr.length).toBeGreaterThan(20);
    expect(ctx.natalTuHoaStr).toContain("Hóa");
  });

  it("handles decadalStem with lowercase / compound name gracefully via getNatalTuHoaQuartet", () => {
    const calculated = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    const chartData = {
      ...buildInterpretPayload(calculated, 2026),
      transitDecadalStem: "bính", // lowercase stem
    };
    const ctx = buildChartPromptContext(chartData);
    expect(ctx.damTinhTuHoaGeneralStr).toBeTruthy();
    expect(ctx.damTinhTuHoaDetailStr).toBeTruthy();
    // Bính: Đồng Cơ Xương Liêm -> có chứa Thiên Đồng hoặc Thiên Cơ
    expect(ctx.damTinhTuHoaDetailStr).toMatch(/Thiên Đồng|Thiên Cơ|Văn Xương|Liêm Trinh/);
  });

  // Khóa nghẽn dead-code: nmMenhStr (mạch B — 5 file sao nhập Mệnh) từng được build
  // nhưng KHÔNG có chỗ nào tiêu thụ → mạch chết 0% trong bài luận. Test này buộc:
  // (1) field tồn tại, (2) block header vào prompt cuối, (3) mẩu thật vào nguyên văn.
  it("mạch B nhập Mệnh (nmMenhStr) được dựng VÀ render vào prompt cuối — không dead code", () => {
    const calculated = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    const chartData = buildInterpretPayload(calculated, 2026);
    const ctx = buildChartPromptContext(chartData);
    expect(typeof ctx.nmMenhStr).toBe("string");

    const prompt = buildInterpretUserPrompt(ctx, chartData);
    expect(prompt).toContain("TỔ HỢP CHÍNH TINH NHẬP MỆNH (MẠCH B");
    // Nguồn mạch phải ghi đúng 5 file — không còn nhầm "Sổ TVKN + Tân Biên"
    if (ctx.nmMenhStr) {
      expect(ctx.nmMenhStr).toContain("5 file sao nhập Mệnh");
      expect(ctx.nmMenhStr).not.toContain("Sổ TVKN Quản Xuân Thịnh");
    }

    // Gate monotone: pool context (major + aux + tứ hóa + vòng) ⊇ pool major-only dưới đây,
    // và topN 15 (compact interpret) = đủ pool kn-nm- chọn lọc nên mọi mẩu khớp major
    // phải thấy nguyên văn trong prompt.
    const nmEntries = retrieveKinhNghiem(
      { stars: [...ctx.allMajorStarNames], gender: chartData.gender, idPrefix: "kn-nm-" },
      15,
    );
    expect(nmEntries.length).toBeGreaterThan(0);
    for (const e of nmEntries) {
      expect(prompt, `thiếu mẩu ${e.id} trong prompt cuối`).toContain(`[${e.title}]`);
    }
  });
});