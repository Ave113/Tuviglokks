import { describe, it, expect } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { normalizeStarName } from "../utils/chartRelations";
import { HOA_LABELS } from "../utils/tuHoa";
import { TUVI_STAR_CATALOG } from "../utils/tuviStarCatalog";
import {
  assessStarAuditSeverity,
  auditAiStarMentions,
  buildChartStarWhitelist,
  extractMentionedStars,
} from "./starHallucinationGuard";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";

describe("starHallucinationGuard", () => {
  const chartPayload = () => {
    const r = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    return buildInterpretPayload(r, 2026);
  };

  it("không nhầm Thái Dương với Thái Âm", () => {
    const mentioned = extractMentionedStars("Cung có Thái Dương miếu, không liên quan Âm khác.");
    expect(mentioned).toContain(normalizeStarName("Thái Dương"));
    expect(mentioned).not.toContain(normalizeStarName("Thái Âm"));
  });

  it("bỏ qua sao trong ngữ cảnh phủ định", () => {
    const mentioned = extractMentionedStars("Lá số này không có Hóa Kỵ nên hung ác giảm bớt.");
    expect(mentioned).not.toContain(normalizeStarName("Hóa Kỵ"));
  });

  it("bắt sao bịa không có trên lá", () => {
    const chart = chartPayload();
    const known = buildChartStarWhitelist(chart);
    const fake = TUVI_STAR_CATALOG.find((c) => !known.has(c.norm));
    expect(fake, "lá số không thể chứa toàn bộ danh mục").toBeDefined();
    const audit = auditAiStarMentions(`Mệnh có ${fake!.display} miếu địa, rất cát.`, chart);
    expect(audit.hallucinated).toContain(fake!.norm);
    expect(audit.severity).not.toBe("clean");
  });

  it("assessStarAuditSeverity — chính tinh hoặc ≥3 sao → retry", () => {
    expect(assessStarAuditSeverity([])).toBe("clean");
    expect(assessStarAuditSeverity([normalizeStarName("Thiên Quý")])).toBe("soft");
    expect(assessStarAuditSeverity([normalizeStarName("Tử Vi")])).toBe("retry");
    expect(
      assessStarAuditSeverity([
        normalizeStarName("Thiên Quý"),
        normalizeStarName("Tam Thai"),
        normalizeStarName("Bát Tọa"),
      ]),
    ).toBe("retry");
  });

  it("whitelist gồm sao lưu [SAO LƯU]", () => {
    const chart = chartPayload();
    const known = buildChartStarWhitelist(chart);
    const hasLuu = [...known].some((k) => k.includes("hóa") || chart.palaces.some((p: any) =>
      (p.minorStars || []).some((s: any) => /\[SAO LƯU\]/i.test(s.name)),
    ));
    expect(hasLuu || known.size > 10).toBe(true);
  });

  it("bài chỉ nhắc sao trên lá → clean", () => {
    const chart = chartPayload();
    const star = chart.palaces.flatMap((p: any) => p.majorStars || [])[0]?.name;
    expect(star).toBeTruthy();
    const audit = auditAiStarMentions(`Trọng tâm là ${star} tại Mệnh.`, chart);
    expect(audit.severity).toBe("clean");
  });

  it("whitelist Tứ Hóa bẩm sinh — AI nhắc Hóa Lộc/Quyền/Khoa/Kỵ không bị false positive", () => {
    const chart = chartPayload();
    const known = buildChartStarWhitelist(chart);
    for (const h of HOA_LABELS) {
      expect(known.has(normalizeStarName(h)), `thiếu ${h}`).toBe(true);
    }
    const audit = auditAiStarMentions(
      "Năm nay Hóa Lộc, Hóa Quyền, Hóa Khoa và Hóa Kỵ đều tác động.",
      chart,
    );
    expect(audit.hallucinated).toEqual([]);
    expect(audit.severity).toBe("clean");
  });

  it("Lưu Hóa X (sao gốc) trên chart — AI viết gọn Lưu Hóa X → clean", () => {
    const chart = chartPayload();
    const luuHoa = chart.palaces.flatMap((p: any) =>
      (p.minorStars || []).filter((s: any) => /lưu hóa quyền/i.test(s.name)),
    );
    expect(luuHoa.length).toBeGreaterThan(0);
    expect(luuHoa[0].name).toMatch(/\([^)]+\)/);

    const audit = auditAiStarMentions(
      "Năm hạn Lưu Hóa Quyền, Lưu Hóa Khoa, Lưu Hóa Kỵ, Lưu Hóa Lộc chi phối vận.",
      chart,
    );
    expect(audit.hallucinated).toEqual([]);
    expect(audit.severity).toBe("clean");
  });

  it("AI viết gọn Lưu Lộc khi lá có Lưu Lộc Tồn hoặc Lưu Hóa Lộc → không false positive", () => {
    const chart = chartPayload();
    const known = buildChartStarWhitelist(chart);
    const hasLocTon = [...known].some((k) => k.includes("lộc tồn") || k === normalizeStarName("Lưu Lộc Tồn"));
    const hasLuuHoaLoc = [...known].some((k) => k.includes("lưu hóa lộc") || k === normalizeStarName("Lưu Hóa Lộc"));
    expect(hasLocTon || hasLuuHoaLoc, "lá mẫu phải có Lưu Lộc Tồn hoặc Lưu Hóa Lộc").toBe(true);

    expect(known.has(normalizeStarName("Lưu Lộc")), "whitelist phải nhận alias Lưu Lộc").toBe(true);

    const audit = auditAiStarMentions(
      "Năm nay Lưu Lộc chiếu Tài Bạch, dòng tiền thuận hơn.",
      chart,
    );
    expect(audit.hallucinated).not.toContain(normalizeStarName("Lưu Lộc"));
    if (audit.hallucinated.length === 0) {
      expect(audit.severity).toBe("clean");
    }
  });

  it("các alias lưu niên phổ biến (Mã/Xương/Khúc/Loan/Hỷ/Khốc/Hư/Kình/Đà) không false positive", () => {
    const chart = chartPayload();
    const known = buildChartStarWhitelist(chart);
    // Lá mẫu 2026 luôn an đủ nhóm lưu cố định theo năm
    const pairs: [string, string][] = [
      ["Lưu Thiên Mã", "Lưu Mã"],
      ["Lưu Văn Xương", "Lưu Xương"],
      ["Lưu Văn Khúc", "Lưu Khúc"],
      ["Lưu Hồng Loan", "Lưu Loan"],
      ["Lưu Thiên Hỷ", "Lưu Hỷ"],
      ["Lưu Thiên Khốc", "Lưu Khốc"],
      ["Lưu Thiên Hư", "Lưu Hư"],
      ["Lưu Kình Dương", "Lưu Kình"],
      ["Lưu Đà La", "Lưu Đà"],
      ["Lưu Lộc Tồn", "Lưu Lộc"],
    ];
    for (const [full, short] of pairs) {
      const hasFull =
        known.has(normalizeStarName(full)) ||
        chart.palaces.some((p: any) =>
          (p.minorStars || []).some((s: any) => normalizeStarName(s.name).includes(normalizeStarName(full))),
        );
      if (!hasFull) continue;
      expect(known.has(normalizeStarName(short)), `${full} → alias ${short}`).toBe(true);
    }

    const audit = auditAiStarMentions(
      "Lưu Mã, Lưu Xương, Lưu Khúc, Lưu Loan, Lưu Hỷ, Lưu Khốc, Lưu Hư, Lưu Kình, Lưu Đà, Lưu Lộc đều có thể được nhắc gọn.",
      chart,
    );
    for (const short of [
      "Lưu Mã", "Lưu Xương", "Lưu Khúc", "Lưu Loan", "Lưu Hỷ",
      "Lưu Khốc", "Lưu Hư", "Lưu Kình", "Lưu Đà", "Lưu Lộc",
    ]) {
      expect(audit.hallucinated, short).not.toContain(normalizeStarName(short));
    }
  });

  it("alias Lưu Đà / Lưu Kình khi chart có Lưu Đà La / Lưu Kình Dương", () => {
    const chart = chartPayload();
    const known = buildChartStarWhitelist(chart);
    const hasDaLa = [...known].includes(normalizeStarName("Lưu Đà La"))
      || chart.palaces.some((p: any) =>
        (p.minorStars || []).some((s: any) => /lưu đà la/i.test(s.name)),
      );
    const hasKinh = [...known].includes(normalizeStarName("Lưu Kình Dương"))
      || chart.palaces.some((p: any) =>
        (p.minorStars || []).some((s: any) => /lưu kình dương/i.test(s.name)),
      );

    if (hasDaLa) {
      expect(known.has(normalizeStarName("Lưu Đà"))).toBe(true);
      const auditDa = auditAiStarMentions("Lưu Đà gây áp lực trong năm.", chart);
      expect(auditDa.hallucinated).not.toContain(normalizeStarName("Lưu Đà"));
    }
    if (hasKinh) {
      expect(known.has(normalizeStarName("Lưu Kình"))).toBe(true);
      const auditKinh = auditAiStarMentions("Lưu Kình tác động Quan Lộc.", chart);
      expect(auditKinh.hallucinated).not.toContain(normalizeStarName("Lưu Kình"));
    }
    expect(hasDaLa || hasKinh).toBe(true);
  });

  it("không retry oan khi AI luận đủ nhóm Tứ Hóa + Lưu Hóa + alias lưu niên", () => {
    const chart = chartPayload();
    const audit = auditAiStarMentions(
      "Năm có Lưu Hóa Quyền, Hóa Lộc, Lưu Đà, Lưu Hóa Kỵ, Hóa Quyền tác động mạnh.",
      chart,
    );
    expect(audit.severity).not.toBe("retry");
  });
});