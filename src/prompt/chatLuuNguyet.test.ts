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

  it("flag interpret monthly vẫn tắt — bảng tháng dựng sẵn cho interpret, chat inject độc lập", () => {
    expect(INTERPRET_INCLUDE_MONTHLY_SECTION).toBe(false);
    const { ctx } = buildChatContextForQuestion("Tháng nào tốt để đầu tư?");
    // LƯU NGUYỆT (VŨ KHÍ 2 — BỘ ĐỊNH VỊ THỜI ĐIỂM) dựng sẵn cho interpret;
    // chat vẫn lazy-inject qua khối riêng (chatLuuNguyet).
    expect(ctx.luuNguyetReportStr.length).toBeGreaterThan(50);
  });

  it("shouldInjectChatLuuNguyet — nhận diện câu hỏi tháng", () => {
    expect(shouldInjectChatLuuNguyet("Năm nay vận tài thế nào?")).toBe(false);
    expect(shouldInjectChatLuuNguyet("Tháng nào tốt để đầu tư?")).toBe(true);
    expect(shouldInjectChatLuuNguyet("Lưu nguyệt tháng 3 âm ra sao?")).toBe(true);
    expect(shouldInjectChatLuuNguyet("Theo tháng thì tiền bạc biến động thế nào?")).toBe(true);
  });

  it("shouldInjectChatLuuNguyet — nhận diện mốc thời gian trong năm (quý, đầu/cuối năm, giai đoạn)", () => {
    expect(shouldInjectChatLuuNguyet("Cuối năm tài chính thế nào?")).toBe(true);
    expect(shouldInjectChatLuuNguyet("Đầu năm có nên khai trương không?")).toBe(true);
    expect(shouldInjectChatLuuNguyet("Nửa cuối năm công việc ra sao?")).toBe(true);
    expect(shouldInjectChatLuuNguyet("Nửa đầu tháng này nên làm gì?")).toBe(true);
    expect(shouldInjectChatLuuNguyet("Quý 1 và quý 4 có gì đáng chú ý?")).toBe(true);
    expect(shouldInjectChatLuuNguyet("Quý IV nên chốt kế hoạch chưa?")).toBe(true);
    expect(shouldInjectChatLuuNguyet("Giai đoạn này nên chú ý điều gì?")).toBe(true);
    expect(shouldInjectChatLuuNguyet("Thời điểm nào tốt để chuyển việc?")).toBe(true);
    expect(shouldInjectChatLuuNguyet("Trong 5 năm tới tôi nên chú ý gì?")).toBe(false);
  });

  it("inject Lưu Nguyệt block khi hỏi mốc thời gian mới", () => {
    const { context } = buildChatContextForQuestion("Cuối năm nên chú ý gì?");
    expect(context).toContain("LƯU NGUYỆT 2026 — 12 CUNG THÁNG ÂM LỊCH");
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

  it("chat context luôn có Tự Hóa 12 Cung và Đường bay tâm lý Mệnh/Phúc", () => {
    const { context } = buildChatContextForQuestion("Tự Hóa cung Mệnh thế nào?");
    expect(context).toContain("TỰ HÓA & PHI TỨ HÓA 12 CUNG");
    expect(context).toContain("ĐƯỜNG BAY TÂM LÝ CỐT LÕI (Mệnh & Phúc Đức");
  });

  it("Đẩu Quân 12 tháng khớp bảng tháng ĐỘC LẬP của iztro (horoscope().monthly)", () => {
    const calculated = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    const chart = buildInterpretPayload(calculated, 2026);
    const ctx = buildChartPromptContext(chart);
    const block = buildChatLuuNguyetBlock(ctx, chart);

    const ours = new Map<number, { branch: string; stem: string }>();
    for (const line of block.split("\n")) {
      const mm = line.match(/Tháng (\d+) âm: cung .+? \(([^,]+), can tháng ([^)]+)\)/);
      if (mm) ours.set(Number(mm[1]), { branch: mm[2].trim(), stem: mm[3].trim() });
    }
    expect(ours.size).toBe(12);

    const MONTH_BRANCH_ORDER = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"];
    const CHI_TY = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
    const HAN_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
    const VI_STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
    const normStem = (s: string) => {
      const i = HAN_STEMS.indexOf(s);
      return i >= 0 ? VI_STEMS[i] : s;
    };

    // Lấy 1 ngày đại diện mỗi tháng âm của năm 2026 từ CHÍNH iztro (nguồn độc lập với
    // công thức Đẩu Quân trong chartReports.ts). Chi tháng cố định: tháng 1 = Dần … tháng 12 = Sửu.
    const astrolabe: any = (calculated as any).chart;
    const iztro: Record<number, { branch: string; stem: string }> = {};
    const d = new Date(2026, 1, 18); // sau Tết Bính Ngọ (17/02/2026)
    const end = new Date(2027, 1, 4);
    while (d <= end && Object.keys(iztro).length < 12) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const monthly: any = astrolabe.horoscope(ds)?.monthly;
      const monthNo = MONTH_BRANCH_ORDER.indexOf(String(monthly?.earthlyBranch)) + 1;
      if (monthNo >= 1 && monthNo <= 12 && !(monthNo in iztro)) {
        iztro[monthNo] = {
          branch: CHI_TY[(((Number(monthly.index) + 2) % 12) + 12) % 12],
          stem: normStem(String(monthly.heavenlyStem)),
        };
      }
      d.setDate(d.getDate() + 15);
    }

    for (let m = 1; m <= 12; m++) {
      expect(iztro[m], `iztro thiếu tháng ${m}`).toBeTruthy();
      expect(ours.get(m)?.branch, `chi tháng ${m}`).toBe(iztro[m].branch);
      expect(ours.get(m)?.stem, `can tháng ${m}`).toBe(iztro[m].stem);
    }
  });
});