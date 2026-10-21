import { describe, it, expect } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { buildChartIndex } from "../utils/chartRelations";
import { buildChartPromptContext } from "./buildChartPromptContext";
import { buildInterpretUserPrompt } from "./formatInterpretPrompt";
import {
  analyzeTemporalTriggers,
  buildTemporalTriggerReport,
  buildTemporalTriggerReportChat,
} from "./temporalTriggers";

describe("temporalTriggers — kích hoạt hạn × điểm mù", () => {
  const payload = (year = 2026) => {
    const r = generateTuviAstrolabe("2001-07-08", "05:15", BIRTHPLACE.SOUTH, "Nam");
    return buildInterpretPayload(r, year);
  };

  it("analyze trả report + meta năm", () => {
    const p = payload(2026);
    const idx = buildChartIndex(p.palaces);
    const a = analyzeTemporalTriggers(idx, p.palaces, p);
    expect(a.transitYear).toBe(2026);
    expect(a.report).toMatch(/META NĂM XEM|KÍCH HOẠT|KẾT QUẢ QUÉT/);
    expect(a.triggers.length).toBeLessThanOrEqual(5);
    for (const t of a.triggers) {
      expect(["cao", "vua", "nen"]).toContain(t.level);
      expect(t.directive).toMatch(/KÍCH HOẠT|XU HƯỚNG/);
      expect(t.pulses.length).toBeGreaterThan(0);
    }
  });

  it("ctx + user prompt có cheat sheet temporal", () => {
    const p = payload(2026);
    const ctx = buildChartPromptContext(p);
    expect(ctx.temporalTriggerReportStr.length).toBeGreaterThan(80);
    const prompt = buildInterpretUserPrompt(ctx, p);
    expect(prompt).toMatch(/KÍCH HOẠT HẠN/);
    expect(prompt).toMatch(/Chuỗi kích hoạt|CHUỖI KÍCH HOẠT|KẾT QUẢ QUÉT|LỆNH CHO AI/);
  });

  it("chat slim không rỗng", () => {
    const p = payload(2026);
    const idx = buildChartIndex(p.palaces);
    const s = buildTemporalTriggerReportChat(idx, p.palaces, p, 3);
    expect(s.length).toBeGreaterThan(20);
  });

  it("framework Phần 3 nhắc kích hoạt hạn", () => {
    const p = payload(2026);
    const ctx = buildChartPromptContext(p);
    const prompt = buildInterpretUserPrompt(ctx, p);
    expect(prompt).toMatch(/KÍCH HOẠT HẠN ↔ ĐIỂM MÙ|Bước ngoặt/);
  });
});
