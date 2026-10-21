import { describe, it, expect } from "vitest";
import { buildDualSchoolPromptBlock } from "../schools/schoolKnowledge";
import {
  buildInterpretSystemInstruction,
  INTERPRET_SYSTEM_MARKERS,
} from "./interpretSystemInstruction";
import { CHAT_SYSTEM_INSTRUCTION } from "../prompt/systemInstructions";

/** Chuỗi cấm (typo/sai nghĩa cũ) — không được xuất hiện trong instruction. */
const NEGATIVE_MARKER_KEYS = new Set([
  "noRapKhuonTypo",
  "noHauThuẫnTypo",
  "noThienHiTypo",
  "noBocTrucOdd",
]);

describe("buildInterpretSystemInstruction", () => {
  const instruction = buildInterpretSystemInstruction();

  it("trả về chuỗi không rỗng, đủ dài cho system prompt", () => {
    expect(instruction.length).toBeGreaterThan(8_000);
    expect(instruction.trim().length).toBe(instruction.length);
  });

  it("idempotent — hai lần gọi cho cùng kết quả", () => {
    expect(buildInterpretSystemInstruction()).toBe(instruction);
  });

  it("chứa đủ các marker cấu trúc cốt lõi (bỏ qua no* = chuỗi cấm)", () => {
    for (const [key, marker] of Object.entries(INTERPRET_SYSTEM_MARKERS)) {
      if (NEGATIVE_MARKER_KEYS.has(key)) continue;
      expect(instruction, `thiếu marker ${key}`).toContain(marker);
    }
  });

  it("nhúng khối dual-school từ schoolKnowledge (cùng nguồn với server cũ)", () => {
    const dualBlock = buildDualSchoolPromptBlock();
    expect(instruction).toContain(dualBlock);
    expect(instruction).toContain("PHƯƠNG PHÁP NAM PHÁI (HI DI TRẦN ĐOÀN)");
    expect(instruction).toContain("LỚP ĐỐI CHIẾU BẮC PHÁI (HÀ LẠC PHÁI HUYỀN BÍ TẬP)");
  });

  it("đã sửa typo RẬkP → RÁP KHUÔN", () => {
    expect(instruction).not.toContain("RẬkP");
    expect(instruction).toContain("NGHIÊM CẤM KHUYÊN RÁP KHUÔN");
  });

  it("không còn typo / sai nghĩa đã review (hẫu, Thiên Hỉ, bộc trực lạ)", () => {
    expect(instruction).not.toContain("hẫu thuẫn");
    expect(instruction).toContain("hậu thuẫn");
    expect(instruction).not.toContain("Thiên Hỉ");
    expect(instruction).toContain("Thiên Hỷ");
    expect(instruction).not.toContain("bộc trực bẩm sinh");
    expect(instruction).not.toContain("摩擦");
    expect(instruction).toContain("BẰNG CHỨNG TRƯỚC KẾT LUẬN");
  });

  it("structure thở bằng đời — đan xen, không thêm phần, vẫn bằng chứng máy", () => {
    expect(instruction).toContain(INTERPRET_SYSTEM_MARKERS.lifeBreath);
    expect(instruction).toContain(INTERPRET_SYSTEM_MARKERS.noExtraPart);
    expect(instruction).toMatch(/Trên giấy|đời trước|hệ quả đời trước/i);
    expect(instruction).toMatch(/Trong đầu|kiểm chứng/i);
    expect(instruction).not.toMatch(/BẮT BUỘC viết Phần 0|phải có mục Tóm tắt nhanh/i);
    // Heading linh hoạt nhưng vẫn đủ mục; quota nguyên văn 40% toàn cục.
    expect(instruction).toContain("heading có thể dùng");
    expect(instruction).toContain("tối đa 40%");
    expect(instruction).toContain("toàn bộ kiến thức");
    expect(instruction).toContain("không phải trần kiến thức");
    expect(instruction).not.toContain("dưới 35%");
    expect(instruction).toContain("không gọi tên phái");
  });

  it("giữ nguyên các quy tắc hình học và nguyên tắc luận quan trọng", () => {
    expect(instruction).toContain("NÓI THẬT & TRỰC DIỆN ⚡");
    expect(instruction).toContain("TUYỆT ĐỐI CẤM MÀO ĐẦU");
    expect(instruction).toContain("TỶ LỆ 80/20");
    expect(instruction).not.toContain("8 PHẦN CHIỀU SÂU");
    expect(instruction).toContain("[CUNG THÂN ĐỒNG CUNG]");
    expect(instruction).toContain("QUY TẮC AN TOÀN");
    expect(instruction).toContain("khuyên cho “kêu”");
    expect(instruction).toContain(INTERPRET_SYSTEM_MARKERS.noMonthlySection);
    expect(instruction).toContain('không viết mục "Tháng trọng tâm"');
  });

  it("thứ tự các khối đúng: kiến trúc kép → dual-school → core logic → nguyên tắc", () => {
    const idxArch = instruction.indexOf(INTERPRET_SYSTEM_MARKERS.dualArchitecture);
    const idxNam = instruction.indexOf("PHƯƠNG PHÁP NAM PHÁI");
    const idxCore = instruction.indexOf(INTERPRET_SYSTEM_MARKERS.coreMethod);
    const idxPrinciples = instruction.indexOf(INTERPRET_SYSTEM_MARKERS.principles);
    expect(idxArch).toBeLessThan(idxNam);
    expect(idxNam).toBeLessThan(idxCore);
    expect(idxCore).toBeLessThan(idxPrinciples);
  });
});

describe("CHAT_SYSTEM_INSTRUCTION — chữ & logic", () => {
  it("âm thầm (không âm thầy); đồng thuận chuẩn máy", () => {
    expect(CHAT_SYSTEM_INSTRUCTION).not.toContain("âm thầy");
    expect(CHAT_SYSTEM_INSTRUCTION).toContain("âm thầm đối chiếu");
    expect(CHAT_SYSTEM_INSTRUCTION).not.toContain("[Đồng thuận mạnh]");
    expect(CHAT_SYSTEM_INSTRUCTION).toContain("[Đồng thuận]");
  });

  it("40% là trần trùng câu chữ, không phải trần kiến thức", () => {
    expect(CHAT_SYSTEM_INSTRUCTION).toContain("dùng toàn bộ kiến thức");
    expect(CHAT_SYSTEM_INSTRUCTION).toContain("không phải trần kiến thức");
  });
});
