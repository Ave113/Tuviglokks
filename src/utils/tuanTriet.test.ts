import { describe, it, expect } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { generateTuviAstrolabe } from "./tuvi";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { buildChartPromptContext } from "../prompt/buildChartPromptContext";
import { buildInterpretUserPrompt } from "../prompt/formatInterpretPrompt";
import {
  analyzeTuanTriet,
  buildTuanTrietReport,
  classifyTuanTrietStar,
} from "./tuanTriet";

describe("classifyTuanTrietStar", () => {
  it("nhận đúng họ Tuần / Triệt / Không Vong (iztro vi-VN)", () => {
    expect(classifyTuanTrietStar("Tuần Không")).toBe("tuan");
    expect(classifyTuanTrietStar("Tuần Trung")).toBe("tuan");
    expect(classifyTuanTrietStar("Triệt Lộ")).toBe("triet");
    expect(classifyTuanTrietStar("Triệt Không")).toBe("triet");
    expect(classifyTuanTrietStar("Không Vong")).toBe("khongVong");
  });

  it("KHÔNG nhầm Địa Không / Thiên Không / Địa Kiếp / Kiếp Sát", () => {
    expect(classifyTuanTrietStar("Địa Không")).toBeNull();
    expect(classifyTuanTrietStar("Địa Kiếp")).toBeNull();
    expect(classifyTuanTrietStar("Thiên Không")).toBeNull();
    expect(classifyTuanTrietStar("Kiếp Sát")).toBeNull();
    expect(classifyTuanTrietStar("Kình Dương")).toBeNull();
  });

  it("strip [SAO LƯU] không áp cho classify tên đã strip; tên lạ → null", () => {
    expect(classifyTuanTrietStar("Văn Xương")).toBeNull();
    expect(classifyTuanTrietStar("")).toBeNull();
  });
});

describe("analyzeTuanTriet / buildTuanTrietReport — lá iztro thật", () => {
  it("1992-06-15: Mệnh Triệt Lộ, Tài Tuần Không, Phụ Không Vong", () => {
    const r = generateTuviAstrolabe("1992-06-15", "08:00", BIRTHPLACE.SOUTH, "Nam");
    const analysis = analyzeTuanTriet(r.chart.palaces);

    expect(analysis.hits.length).toBeGreaterThanOrEqual(3);
    expect(analysis.trietPalaces.some((n) => n.includes("Mệnh"))).toBe(true);
    expect(analysis.tuanPalaces.some((n) => /Tài/i.test(n))).toBe(true);
    expect(analysis.khongVongPalaces.length).toBeGreaterThanOrEqual(1);

    const menh = analysis.hits.find((h) => h.palaceName.includes("Mệnh"));
    expect(menh?.kinds).toContain("triet");
    expect(menh?.isKeyPalace).toBe(true);

    const report = buildTuanTrietReport(r.chart.palaces);
    expect(report).toContain("Triệt");
    expect(report).toContain("Tuần");
    expect(report).toContain("CUNG TRỌNG");
    // Phân biệt có nhắc Địa Không trong quy tắc — nhưng không gán Địa Không như hit cung
    expect(report).toMatch(/không đồng nhất với Địa Không|KHÔNG đồng nhất với Địa Không/i);
    expect(analysis.hits.every((h) =>
      h.stars.every((s) => !/Địa Không|Thiên Không|Địa Kiếp/.test(s.name)),
    )).toBe(true);
  });

  it("mỗi lá mẫu có đúng 3 nhãn iztro (Tuần Không + Triệt Lộ + Không Vong) phân tán 3 cung", () => {
    const dates = ["1995-10-25", "2000-03-03", "1988-01-10"];
    for (const d of dates) {
      const r = generateTuviAstrolabe(d, "12:00", BIRTHPLACE.SOUTH, "Nam");
      const a = analyzeTuanTriet(r.chart.palaces);
      expect(a.tuanPalaces.length, d).toBe(1);
      expect(a.trietPalaces.length, d).toBe(1);
      expect(a.khongVongPalaces.length, d).toBe(1);
      // Không gán 2 loại khác nhau vào cùng 1 cung trên các mẫu này (iztro an rời)
      expect(a.hits.length, d).toBe(3);
    }
  });

  it("mock không có sao → báo không thấy + cấm bịa", () => {
    const empty = Array.from({ length: 12 }, (_, i) => ({
      index: i,
      name: `Cung${i}`,
      majorStars: [],
      minorStars: [],
      adjectiveStars: [],
    }));
    const report = buildTuanTrietReport(empty);
    expect(report).toMatch(/KHÔNG thấy|không thấy/i);
    expect(report).toMatch(/không tự gán/i);
  });
});

describe("inject vào interpret prompt", () => {
  it("buildChartPromptContext + user prompt chứa cheat sheet TUẦN/TRIỆT", () => {
    const calculated = generateTuviAstrolabe("1992-06-15", "08:00", BIRTHPLACE.SOUTH, "Nam");
    const chart = buildInterpretPayload(calculated, 2026);
    const ctx = buildChartPromptContext(chart);
    expect(ctx.tuanTrietReportStr.length).toBeGreaterThan(40);
    expect(ctx.tuanTrietReportStr).toMatch(/Tuần|Triệt/);

    const prompt = buildInterpretUserPrompt(ctx, chart);
    expect(prompt).toContain("TUẦN / TRIỆT / KHÔNG VONG");
    expect(prompt).toContain("cấm bịa");
    // Phải neo đúng cung Mệnh có Triệt trên lá 1992
    expect(prompt).toMatch(/Mệnh[\s\S]{0,80}Triệt|Triệt[\s\S]{0,40}Mệnh/);
  });
});
