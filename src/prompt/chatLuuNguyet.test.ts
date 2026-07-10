import { describe, it, expect } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { INTERPRET_INCLUDE_MONTHLY_SECTION } from "../server/aiConfig";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { buildChartPromptContext } from "./buildChartPromptContext";
import { buildChatChartContext } from "./formatChatChartContext";
import { buildChatLuuNguyetBlock, shouldInjectChatLuuNguyet } from "./chatLuuNguyet";

describe("chatLuuNguyet — lazy inject for /api/chat", () => {
  const chartPayload = () => {
    const r = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    return buildInterpretPayload(r, 2026);
  };

  const buildChatContextForQuestion = (question: string, history?: { role: string; content: string }[]) => {
    const chart = chartPayload();
    const ctx = buildChartPromptContext(chart);
    let context = buildChatChartContext(ctx, chart);
    if (shouldInjectChatLuuNguyet(question, history)) {
      const block = buildChatLuuNguyetBlock(ctx, chart);
      if (block) context = `${context}\n\n${block}`;
    }
    return { context, ctx, chart };
  };

  it("flag interpret monthly vẫn tắt — không ảnh hưởng chat inject", () => {
    expect(INTERPRET_INCLUDE_MONTHLY_SECTION).toBe(false);
    const { ctx } = buildChatContextForQuestion("Tháng nào tốt để đầu tư?");
    expect(ctx.luuNguyetReportStr).toBe("");
  });

  it("shouldInjectChatLuuNguyet — nhận diện câu hỏi tháng", () => {
    expect(shouldInjectChatLuuNguyet("Năm nay vận tài thế nào?")).toBe(false);
    expect(shouldInjectChatLuuNguyet("Tháng nào tốt để đầu tư?")).toBe(true);
    expect(shouldInjectChatLuuNguyet("Lưu nguyệt tháng 3 âm ra sao?")).toBe(true);
    expect(shouldInjectChatLuuNguyet("Theo tháng thì tiền bạc biến động thế nào?")).toBe(true);
  });

  it("shouldInjectChatLuuNguyet — follow-up qua history user", () => {
    expect(
      shouldInjectChatLuuNguyet("Còn tiền bạc thì sao?", [
        { role: "user", content: "Tháng nào tốt trong năm?" },
        { role: "assistant", content: "Tháng 3 âm..." },
      ]),
    ).toBe(true);
    expect(
      shouldInjectChatLuuNguyet("Còn sức khỏe thì sao?", [
        { role: "user", content: "Năm nay công việc thế nào?" },
      ]),
    ).toBe(false);
  });

  it("inject Lưu Nguyệt block khi hỏi tháng", () => {
    const { context } = buildChatContextForQuestion("Tháng nào nên ký hợp đồng?");
    expect(context).toContain("LƯU NGUYỆT 2026 — 12 CUNG THÁNG ÂM LỊCH");
    expect(context).toContain("Tháng 1 âm:");
    expect(context).toContain("Tháng 12 âm:");
  });

  it("không inject khi câu hỏi không liên quan tháng", () => {
    const { context } = buildChatContextForQuestion("Năm nay có hợp làm ăn chung không?");
    expect(context).not.toContain("LƯU NGUYỆT 2026 — 12 CUNG THÁNG ÂM LỊCH");
    expect(context).not.toContain("Tháng 1 âm:");
  });
});