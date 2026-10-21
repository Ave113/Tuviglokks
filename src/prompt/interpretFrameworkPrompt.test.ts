import { describe, it, expect } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { INTERPRET_INCLUDE_MONTHLY_SECTION } from "../server/aiConfig";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { buildInterpretUserPrompt } from "./formatInterpretPrompt";
import { buildChartPromptContext } from "./buildChartPromptContext";
import {
  buildInterpretFrameworkBlock,
  buildLuuNguyetCheatSheetBlock,
} from "./interpretFrameworkPrompt";

describe("interpretFrameworkPrompt — monthly section off", () => {
  const chartPayload = () => {
    const r = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
    return buildInterpretPayload(r, 2026);
  };

  it("flag mặc định là false", () => {
    expect(INTERPRET_INCLUDE_MONTHLY_SECTION).toBe(false);
  });

  it("cheat sheet Lưu Nguyệt rỗng khi flag tắt", () => {
    expect(buildLuuNguyetCheatSheetBlock("  - Tháng 1 âm: cung Mệnh")).toBe("");
  });

  it("khung luận giải 5 khối (Phần 0 + 4 đánh số), không phần tháng", () => {
    const chart = chartPayload();
    const block = buildInterpretFrameworkBlock(2026, chart, true);
    expect(block).toMatch(/gồm \*\*5 khối\*\*|gồm 5 khối/);
    expect(block).not.toContain("THÁNG TRỌNG TÂM");
    expect(block).toContain("TUYỆT ĐỐI KHÔNG viết mục");
    expect(block).toContain("4. **NỀN TẢNG PHÚC BÁO");
    expect(block).toContain("### Định cách & Tổng lực đa chiều");
    expect(block).toContain("Tóm xu hướng cả năm");
    expect(block).toContain("## Phần 0: CHÂN DUNG & 3 TRỤC CHÍNH");
    expect(block).toContain("### Đại hạn (10 năm)");
    expect(block).not.toContain("Lộ trình các Đại hạn");
    expect(block).toContain("Sự nghiệp & Tài lộc");
    expect(block).toContain("Các cung còn lại");
    expect(block).toContain("KẾT LUẬN CUỐI — 5 DÒNG");
  });

  it("童限: nhắc không luận như đã vào Đại hạn", () => {
    const r = generateTuviAstrolabe("2025-05-05", "10:00", BIRTHPLACE.SOUTH, "Nam");
    const chart = buildInterpretPayload(r, 2026);
    const prompt = buildInterpretUserPrompt(buildChartPromptContext(chart), chart);
    expect(prompt).toContain("童限");
    expect(prompt).toContain("Chưa vào Đại Hạn");
    expect(prompt).toContain("KHÔNG luận như đã vào vận");
  });

  it("bắt buộc Tính va đập & Điểm mù + Tứ Hóa + Sát + Tiểu Hạn", () => {
    const chart = chartPayload();
    const block = buildInterpretFrameworkBlock(2026, chart, true);
    expect(block).toContain("MỤC BẮT BUỘC TRONG MỌI BÀI");
    expect(block).toContain("Tính va đập & Điểm mù");
    expect(block).toContain("Tự Phi Tứ Hóa");
    expect(block).toContain("Độ sâu Tứ Hóa");
    expect(block).toContain("Cấu trúc Sát Tinh");
    expect(block).toMatch(/### Tính va đập & Điểm mù/);
    expect(block).toContain("Chọn 2–3 mầm trọng tâm nhất");
    expect(block).not.toContain("không bỏ mầm nào từ sheet");
    expect(block).toContain("**Định dạng:**");
    expect(block).toMatch(/### Tự Phi Tứ Hóa/);
    expect(block).toMatch(/### Độ sâu Tứ Hóa/);
    expect(block).toMatch(/### Luận giải Tiểu Hạn/);
    expect(block).toMatch(/3 NHÓM LỚN/);
    expect(block).toContain("Lưu Thái Tuế");
    const ctx = buildChartPromptContext(chart);
    const prompt = buildInterpretUserPrompt(ctx, chart);
    expect(prompt).toContain("Tính va đập & Điểm mù");
    expect(prompt).toContain("TÍNH VA ĐẬP");
    expect(ctx.tinhVaDapReportStr.length).toBeGreaterThan(80);
    expect(prompt).toContain("Tự Phi Tứ Hóa");
    expect(prompt).toContain("Độ sâu Tứ Hóa");
    expect(prompt).toContain("Cấu trúc Sát Tinh");
    expect(prompt).toContain("Luận giải Tiểu Hạn");
    expect(prompt).toMatch(/KÍCH HOẠT HẠN/);
    expect(ctx.temporalTriggerReportStr.length).toBeGreaterThan(40);
  });

  it("thở bằng đời trong khung 5 khối — Phần 0 duy nhất + kết luận 5 dòng", () => {
    const chart = chartPayload();
    const block = buildInterpretFrameworkBlock(2026, chart, true);
    expect(block).toContain("STRUCTURE THỞ BẰNG ĐỜI");
    expect(block).toContain("CẤM THÊM PHẦN");
    expect(block).toMatch(/Câu mở phần \(đời\)|Mở đời|Câu mở \(đời\)/);
    expect(block).toContain("gồm **5 khối**");
    expect(block).toContain("## Phần 0: CHÂN DUNG & 3 TRỤC CHÍNH");
    expect(block).toContain("## KẾT LUẬN CUỐI — 5 DÒNG");
    expect(block).not.toMatch(/### Tóm tắt|### Bản đồ 60/);
    // Vẫn đủ heading cốt lõi
    expect(block).toContain("Tính va đập & Điểm mù");
    expect(block).toContain("Tự Phi Tứ Hóa");
    expect(block).toContain("Cấu trúc Sát Tinh");
    expect(block).toContain("Luận giải Tiểu Hạn");
    expect(block).toContain("Định cách & Tổng lực đa chiều");
  });

  it("buildInterpretUserPrompt — Lưu Nguyệt là BỘ ĐỊNH VỊ THỜI ĐIỂM (không lập mục tháng riêng)", () => {
    const chart = chartPayload();
    const ctx = buildChartPromptContext(chart);
    const prompt = buildInterpretUserPrompt(ctx, chart);
    expect(prompt).toContain("VŨ KHÍ 2 — LƯU NGUYỆT");
    expect(prompt).toContain("BỘ ĐỊNH VỊ THỜI ĐIỂM");
    expect(prompt).toContain("Tháng nóng nhất");
    expect(prompt).not.toContain("THÁNG TRỌNG TÂM");
    expect(prompt).not.toContain("gồm 13 phần");
    expect(prompt).toMatch(/gồm \*\*5 khối|gồm 5 khối/);
    expect(ctx.luuNguyetReportStr.length).toBeGreaterThan(50);
  });

  it("gộp khối: Tứ Hóa 4 tầng + VA ĐẬP & ĐIỂM MÙ 3 bảng + bỏ Knowledge Graph + VŨ KHÍ 1", () => {
    const chart = chartPayload();
    const ctx = buildChartPromptContext(chart);
    const prompt = buildInterpretUserPrompt(ctx, chart);
    expect(prompt).toContain("KHỐI TỨ HÓA TỔNG HỢP");
    expect(prompt).toContain("[1] TỨ HÓA BẨM SINH");
    expect(prompt).toContain("[2] TỰ HÓA & PHI TỨ HÓA 12 CUNG");
    expect(prompt).toContain("[3] ĐƯỜNG BAY TÂM LÝ CỐT LÕI");
    expect(prompt).toContain("[4] PHI TỨ HÓA ĐỘNG");
    expect(prompt).toContain("CHEAT SHEET TỔNG HỢP: VA ĐẬP & ĐIỂM MÙ");
    expect(prompt).toContain("[BẢNG A] VÙNG ÁP LỰC SÁT/KỴ");
    expect(prompt).toContain("[BẢNG B] TÍNH VA ĐẬP & ĐIỂM MÙ");
    expect(prompt).toContain("[BẢNG C] KÍCH HOẠT HẠN");
    expect(prompt).not.toMatch(/KNOWLEDGE GRAPH/);
    expect(prompt).toContain("VŨ KHÍ 1 — LAI NHÂN CUNG");
  });

  it("VĐ2/VĐ3: CÁCH CỤC CHẠM CUNG VẬN có trong ctx + prompt + khung Phần 3", () => {
    const chart = chartPayload();
    const ctx = buildChartPromptContext(chart);
    expect(ctx.vanChamCungStr).toContain("CÁCH CỤC CHẠM CUNG VẬN");
    expect(ctx.vanChamCungStr).toContain("• Tiểu hạn — cung");
    const prompt = buildInterpretUserPrompt(ctx, chart);
    expect(prompt).toContain("CÁCH CỤC CHẠM CUNG VẬN");
    const framework = buildInterpretFrameworkBlock(2026, chart, true);
    expect(framework).toContain("CÁCH CỤC CHẠM CUNG VẬN");
    expect(framework).toContain("Cách cục chạm cung hạn");
  });
});
