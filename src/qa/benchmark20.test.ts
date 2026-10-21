import { describe, it, expect } from "vitest";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { buildChartPromptContext } from "../prompt/buildChartPromptContext";
import { buildInterpretUserPrompt } from "../prompt/formatInterpretPrompt";
import {
  assertBenchmark20Complete,
  BENCHMARK_20_CHARTS,
} from "./benchmark20Charts";
import { buildScorecard, REQUIRED_INTERPRET_HEADINGS } from "./scoreSkeleton";

describe("BENCHMARK 20 lá — pipeline (không gọi Gemini)", () => {
  it("đủ đúng 20 lá, id unique", () => {
    assertBenchmark20Complete();
    expect(BENCHMARK_20_CHARTS).toHaveLength(20);
  });

  it(
    "mỗi lá: an được + context skeleton + scorecard pipelineOk",
    () => {
    const cards: { id: string; total: number; pipelineOk: boolean; hourOk: boolean }[] = [];

    for (const c of BENCHMARK_20_CHARTS) {
      const calc = generateTuviAstrolabe(
        c.solarDate,
        c.solarTime,
        c.birthplace,
        c.gender,
      );
      const hourActual = calc.tuviGlobalHourResult?.branchName || "?";
      const hourOk = hourActual === c.expectedHourBranch;

      const payload = buildInterpretPayload(calc, c.transitYear);
      expect(payload.palaces?.length).toBe(12);

      const ctx = buildChartPromptContext(payload);
      expect(ctx.tinhVaDapReportStr.length).toBeGreaterThan(50);
      expect(ctx.damTinhStr.length).toBeGreaterThan(20);

      const prompt = buildInterpretUserPrompt(ctx, payload);
      expect(prompt).toMatch(/TÍNH VA ĐẬP|Tính va đập/);
      for (const h of ["Tự Phi Tứ Hóa", "Độ sâu Tứ Hóa", "Luận giải Tiểu Hạn"]) {
        expect(prompt).toContain(h);
      }

      const card = buildScorecard(c.id, payload, ctx, null);
      expect(card.pipelineOk, `${c.id} pipeline score=${card.total}`).toBe(true);
      cards.push({ id: c.id, total: card.total, pipelineOk: card.pipelineOk, hourOk });
    }

    const hourFails = cards.filter((x) => !x.hourOk);
    if (hourFails.length > 3) {
      expect.fail(
        `Quá nhiều giờ lệch expected: ${hourFails.map((x) => x.id).join(", ")}`,
      );
    }

    const avg = cards.reduce((s, x) => s + x.total, 0) / cards.length;
    expect(avg).toBeGreaterThanOrEqual(70);
    console.log(
      `[benchmark20] ${cards.length} lá | avg pipeline score ${avg.toFixed(1)} | hour mismatches ${hourFails.length}`,
    );
    },
    60_000,
  );

  it("REQUIRED_INTERPRET_HEADINGS đủ mục cốt", () => {
    expect(REQUIRED_INTERPRET_HEADINGS.length).toBeGreaterThanOrEqual(8);
    expect(REQUIRED_INTERPRET_HEADINGS.join(" ")).toMatch(/Tính va đập/);
    expect(REQUIRED_INTERPRET_HEADINGS.join(" ")).toMatch(/Tứ Hóa/);
  });
});
