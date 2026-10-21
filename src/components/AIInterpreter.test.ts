import { describe, it, expect } from "vitest";
import { splitInterpretationSections } from "./AIInterpreter";

describe("splitInterpretationSections — heading Phần 0 / Kết luận", () => {
  it("tách được heading Phần 0, các phần số và Kết luận cuối", () => {
    const md = [
      "**PHẦN 0 — CHÂN DUNG & 3 TRỤC CHÍNH**",
      "Mở đời.",
      "",
      "1. **TAM PHƯƠNG TỨ CHÍNH & BẢN SẮC**:",
      "Thân bài 1.",
      "",
      "**ĐỐI CHIẾU CHÉO & THẺ TIN CẬY BÁT TỰ**:",
      "Đối chiếu.",
      "",
      "**KẾT LUẬN CUỐI — 5 DÒNG**",
      "Chốt.",
    ].join("\n");

    const result = splitInterpretationSections(md);
    expect(result.sections.map((s) => s.title)).toEqual([
      "PHẦN 0 — CHÂN DUNG & 3 TRỤC CHÍNH",
      "TAM PHƯƠNG TỨ CHÍNH & BẢN SẮC",
      "ĐỐI CHIẾU CHÉO & THẺ TIN CẬY BÁT TỰ",
      "KẾT LUẬN CUỐI — 5 DÒNG",
    ]);
  });

  it("không tách heading số 5 ngoài khung thành phần mới", () => {
    const md = [
      "1. **PHẦN MỘT**:",
      "Nội dung 1.",
      "2. **PHẦN HAI**:",
      "Nội dung 2.",
      "3. **PHẦN BA**:",
      "Nội dung 3.",
      "4. **PHẦN BỐN**:",
      "Nội dung 4.",
      "5. **PHẦN NĂM**:",
      "Nội dung thừa.",
    ].join("\n");

    const result = splitInterpretationSections(md);
    expect(result.sections.map((s) => s.num)).toEqual(["1", "2", "3", "4"]);
    expect(result.sections[3].body).toContain("PHẦN NĂM");
  });

  it("heading '## Phần N' cũng bị cap ở 4 và tách badge số", () => {
    const md = [
      "## Phần 1: BẢN SẮC",
      "Nội dung 1.",
      "## Phần 2: ĐỜI SỐNG",
      "Nội dung 2.",
      "## Phần 3: VẬN TRÌNH",
      "Nội dung 3.",
      "## Phần 4: NỀN TẢNG",
      "Nội dung 4.",
      "## Phần 5: NGOÀI KHUNG",
      "Nội dung thừa.",
    ].join("\n");

    const result = splitInterpretationSections(md);
    expect(result.sections.map((s) => s.num)).toEqual(["1", "2", "3", "4"]);
    expect(result.sections[0].title).toBe("BẢN SẮC");
    expect(result.sections[3].body).toContain("Phần 5: NGOÀI KHUNG");
  });

  it("nhận heading ###, chữ thường, 1) và Phần N không có ##", () => {
    const md = [
      "### 1. Bản sắc & cơ chế vận hành",
      "Nội dung 1.",
      "2) Đời sống thực tế — tiền, việc, tình",
      "Nội dung 2.",
      "Phần 3: Vận trình",
      "Nội dung 3.",
      "**4. Nền tảng phúc báo & tổng lực**",
      "Nội dung 4.",
    ].join("\n");

    const result = splitInterpretationSections(md);
    expect(result.sections.map((s) => s.num)).toEqual(["1", "2", "3", "4"]);
    expect(result.sections.map((s) => s.title)).toEqual([
      "Bản sắc & cơ chế vận hành",
      "Đời sống thực tế — tiền, việc, tình",
      "Vận trình",
      "Nền tảng phúc báo & tổng lực",
    ]);
  });

  it("5 dòng Kết luận dạng '1. **…**' không bị tách thành phần mới", () => {
    const md = [
      "Mở bài.",
      "**KẾT LUẬN CUỐI — 5 DÒNG**",
      "1. **Điểm mạnh nhất:**",
      "2. **Điểm cần tránh:**",
      "3. **Giai đoạn then chốt:**",
      "4. **Hành động ngay:**",
      "5. **Câu chốt:**",
    ].join("\n");

    const result = splitInterpretationSections(md);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].num).toBeNull();
    expect(result.sections[0].body).toContain("1. **Điểm mạnh nhất:**");
    expect(result.sections[0].body).toContain("5. **Câu chốt:**");
  });
});
