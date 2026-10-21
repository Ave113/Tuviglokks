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
  computeTuanBranches,
  computeTrietBranches,
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

describe("computeTuanBranches / computeTrietBranches", () => {
  it("1992 Nhâm Thân: Tuần Tuất–Hợi, Triệt Dần–Mão", () => {
    expect(computeTuanBranches(1992)).toEqual([10, 11]); // Tuất Hợi
    expect(computeTrietBranches(1992)).toEqual([2, 3]); // Dần Mão
  });

  it("1995 Ất Hợi: Tuần Thân–Dậu (甲戌旬), Triệt Ngọ–Mùi (Ất)", () => {
    // (1995-4)%60 = 31 → 甲戌旬 index 3x → floor(31/10)=3 → wait
    // 1995-4=1991, 1991%60 = 11 → 甲戌旬 (10-19) → xun=1 → Thân Dậu
    expect(computeTuanBranches(1995)).toEqual([8, 9]);
    expect(computeTrietBranches(1995)).toEqual([6, 7]); // Ất
  });
});

describe("analyzeTuanTriet / buildTuanTrietReport — khóa 2 cung + engine", () => {
  it("1992-06-15 + birthYear: đủ 2 cung Tuần + 2 cung Triệt; Mệnh có Triệt", () => {
    const r = generateTuviAstrolabe("1992-06-15", "08:00", BIRTHPLACE.SOUTH, "Nam");
    const birthYear = r.chart.rawDates?.lunarDate?.lunarYear ?? 1992;
    const analysis = analyzeTuanTriet(r.chart.palaces, { birthYear });

    expect(analysis.tuanBranches).toEqual([10, 11]);
    expect(analysis.trietBranches).toEqual([2, 3]);
    expect(analysis.tuanPalaces.length).toBe(2);
    expect(analysis.trietPalaces.length).toBe(2);
    expect(analysis.trietPalaces.some((n) => n.includes("Mệnh"))).toBe(true);

    const menh = analysis.hits.find((h) => h.palaceName.includes("Mệnh"));
    expect(menh?.kinds).toContain("triet");
    expect(menh?.isKeyPalace).toBe(true);

    const report = buildTuanTrietReport(r.chart.palaces, { birthYear });
    expect(report).toContain("KHÓA TUẦN");
    expect(report).toContain("KHÓA TRIỆT");
    expect(report).toContain("CẢ HAI cung");
    expect(report).toMatch(/không đồng nhất với Địa Không|KHÔNG đồng nhất với Địa Không/i);
  });

  it("mỗi lá mẫu + birthYear: đúng 2 chi Tuần và 2 chi Triệt", () => {
    const dates = ["1995-10-25", "2000-03-03", "1988-01-10"];
    for (const d of dates) {
      const r = generateTuviAstrolabe(d, "12:00", BIRTHPLACE.SOUTH, "Nam");
      const birthYear = r.chart.rawDates?.lunarDate?.lunarYear ?? parseInt(d.slice(0, 4), 10);
      const a = analyzeTuanTriet(r.chart.palaces, { birthYear });
      expect(a.tuanBranches.length, d).toBe(2);
      expect(a.trietBranches.length, d).toBe(2);
      expect(a.tuanPalaces.length, d).toBe(2);
      expect(a.trietPalaces.length, d).toBe(2);
    }
  });

  it("GIÁP CUNG: 1992 (Tuần Tuất–Hợi, Triệt Dần–Mão) — chỉ cung KỀ bị khóa được đánh dấu, cung bị khóa trực tiếp thì không", () => {
    const r = generateTuviAstrolabe("1992-06-15", "08:00", BIRTHPLACE.SOUTH, "Nam");
    const birthYear = r.chart.rawDates?.lunarDate?.lunarYear ?? 1992;
    const analysis = analyzeTuanTriet(r.chart.palaces, { birthYear });

    // Tuần [10,11] → giáp: Dậu (kề Tuất=10) và Tý (kề Hợi=11)
    // Triệt [2,3] → giáp: Sửu (kề Dần=2) và Thìn (kề Mão=3)
    expect(analysis.giapHits.map((g) => g.branchIdx).sort((x, y) => x - y)).toEqual([0, 1, 4, 9]);

    const ty = analysis.giapHits.find((g) => g.branchIdx === 0);
    expect(ty?.tuanSides).toEqual([11]);
    expect(ty?.trietSides).toEqual([]);

    const thin = analysis.giapHits.find((g) => g.branchIdx === 4);
    expect(thin?.trietSides).toEqual([3]);
    expect(thin?.tuanSides).toEqual([]);

    // Cung nằm TRỰC TIẾP trên khóa (Tuất/Hợi/Dần/Mão) không bị đánh dấu "giáp"
    for (const b of [10, 11, 2, 3]) {
      expect(analysis.giapHits.some((g) => g.branchIdx === b), `b=${b}`).toBe(false);
    }

    const report = buildTuanTrietReport(r.chart.palaces, { birthYear });
    expect(report).toContain("GIÁP CUNG");
    expect(report).toMatch(/giáp Tuần \(kề Hợi\)/);
    expect(report).toMatch(/giáp Triệt \(kề Dần\)/);
  });

  it("mock không có sao + không birthYear → báo không thấy + cấm bịa", () => {
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
  it("buildChartPromptContext + user prompt chứa cheat sheet TUẦN/TRIỆT khóa 2 cung", () => {
    const calculated = generateTuviAstrolabe("1992-06-15", "08:00", BIRTHPLACE.SOUTH, "Nam");
    const chart = buildInterpretPayload(calculated, 2026);
    expect(chart.birthLunarYear).toBeDefined();
    const ctx = buildChartPromptContext(chart);
    expect(ctx.tuanTrietReportStr.length).toBeGreaterThan(40);
    expect(ctx.tuanTrietReportStr).toMatch(/KHÓA TUẦN|Tuần/);
    expect(ctx.tuanTrietReportStr).toMatch(/KHÓA TRIỆT|Triệt/);

    const prompt = buildInterpretUserPrompt(ctx, chart);
    expect(prompt).toContain("TUẦN / TRIỆT / KHÔNG VONG");
    expect(prompt).toContain("cấm bịa");
    expect(prompt).toMatch(/Mệnh[\s\S]{0,80}Triệt|Triệt[\s\S]{0,40}Mệnh|KHÓA TRIỆT/);
  });
});
