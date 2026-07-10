import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveTransitYear } from "../utils/transitYear";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { BIRTHPLACE } from "../constants/birthplace";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { buildChartPromptContext } from "./buildChartPromptContext";

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
    expect(ctx.natalTuHoaResolved).toBe(true);
    expect(ctx.natalTuHoaStr).toContain("Hóa");
  });
});