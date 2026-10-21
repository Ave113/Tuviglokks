import { describe, it, expect } from "vitest";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { BIRTHPLACE } from "../constants/birthplace";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import {
  analyzeLuuNienEventCards,
  buildLuuNienEventCardsReport,
} from "./luuNienEventCards";
import { buildChartPromptContext } from "./buildChartPromptContext";

describe("luuNienEventCards", () => {
  it("đúc thẻ + report có TÓM NĂM / domain", () => {
    const calc = generateTuviAstrolabe(
      "2009-06-09",
      "00:30",
      BIRTHPLACE.CENTRAL_SOUTH_OF_17,
      "Nam",
    );
    const payload = buildInterpretPayload(calc, 2026);
    const r = analyzeLuuNienEventCards(payload.palaces, payload, { maxCards: 5 });
    expect(r.year).toBe(2026);
    expect(r.summaryLine).toMatch(/2026|Năm/);
    expect(r.reportText).toMatch(/THẺ SỰ KIỆN|TÓM NĂM/);
    // Có thể 0 thẻ nếu payload không gắn [SAO LƯU] — vẫn hợp lệ
    for (const c of r.cards) {
      expect(c.headline.length).toBeGreaterThan(3);
      expect(c.signals.length).toBeGreaterThan(0);
      expect(["thuan", "ap_luc", "hon_hop"]).toContain(c.polarity);
    }
  });

  it("ctx interpret có luuNienEventCardsStr", () => {
    const calc = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    const payload = buildInterpretPayload(calc, 2026);
    const ctx = buildChartPromptContext(payload);
    expect(ctx.luuNienEventCardsStr.length).toBeGreaterThan(40);
    expect(ctx.luuNienEventCardsStr).toMatch(/THẺ SỰ KIỆN|TÓM NĂM/);
  });

  it("build report string non-empty", () => {
    const calc = generateTuviAstrolabe("1988-03-12", "22:45", BIRTHPLACE.NORTH, "Nữ");
    const payload = buildInterpretPayload(calc, 2026);
    const text = buildLuuNienEventCardsReport(payload.palaces, payload);
    expect(text.length).toBeGreaterThan(30);
  });

  it("REGRESSION — 'Lưu Tuế' gọn được phân loại ÁP LỰC (\b sau 'Tuế' là dead boundary)", () => {
    // "Tuế\b" không bao giờ khớp (ế không thuộc \w ASCII) → trước đây "Lưu Tuế"
    // rơi vào nhánh neutral +3 thay vì -10 "Lưu Thái Tuế/áp".
    const palaces = [
      {
        index: 8,
        name: "Thiên Di",
        earthlyBranch: "Dậu",
        heavenlyStem: "Ất",
        majorStars: [],
        minorStars: [{ name: "[SAO LƯU] Lưu Tuế" }],
        adjectiveStars: [],
      },
    ];
    const r = analyzeLuuNienEventCards(palaces as any, { transitYear: 2026 });
    const diCard = r.cards.find((c) => c.domain === "di_chuyen");
    expect(diCard).toBeTruthy();
    expect(diCard!.signals.join("; ")).toContain("Lưu Thái Tuế/áp");
    expect(diCard!.polarity).toBe("ap_luc");
  });

  it("REGRESSION — [SAO VẬN] không còn bị bỏ qua (Vận Kỵ thành thẻ ÁP LỰC)", () => {
    const palaces = [
      {
        index: 0,
        name: "Tài Bạch",
        earthlyBranch: "Dần",
        heavenlyStem: "Giáp",
        majorStars: [],
        minorStars: [{ name: "[SAO VẬN] Vận Hóa Kỵ" }],
        adjectiveStars: [],
      },
    ];
    const r = analyzeLuuNienEventCards(palaces as any, { transitYear: 2026 });
    const tienCard = r.cards.find((c) => c.domain === "tien");
    expect(tienCard).toBeTruthy();
    expect(tienCard!.signals.join("; ")).toContain("Vận Kỵ");
    expect(tienCard!.polarity).toBe("ap_luc");
  });
});
