import { describe, expect, it } from "vitest";
import { splitAstroTerms } from "./astroTerms";

const astroTexts = (text: string): string[] =>
  splitAstroTerms(text)
    .filter((part) => part.astro)
    .map((part) => part.text);

describe("splitAstroTerms — tô xanh tên sao/cung ở lớp hiển thị", () => {
  it("tách đúng tên sao và cung, giữ nguyên toàn bộ chữ gốc", () => {
    const input = "Cung Tài Bạch có Tử Vi và Hóa Lộc.";
    const parts = splitAstroTerms(input);

    expect(astroTexts(input)).toEqual(["Tài Bạch", "Tử Vi", "Hóa Lộc"]);
    expect(parts.map((part) => part.text).join("")).toBe(input);
  });

  it("không khớp tên sao nằm trong một từ dài hơn", () => {
    expect(astroTexts("Tử Viên và bản thân không phải tên sao.")).toEqual([]);
  });

  it("phân biệt Linh Tinh (sao) với linh tinh (tính từ đời thường)", () => {
    expect(astroTexts("Chuyện linh tinh.")).toEqual([]);
    expect(astroTexts("Sao Linh Tinh ở cung Tật Ách.")).toEqual(["Linh Tinh", "Tật Ách"]);
  });

  it("chỉ nhận Mệnh/Thân khi có chữ cung đi kèm", () => {
    expect(astroTexts("Cung Mệnh và cung Thân đều vững.")).toEqual(["Cung Mệnh", "cung Thân"]);
    expect(astroTexts("Mệnh đề này và bản thân tôi.")).toEqual([]);
  });

  it("ưu tiên tổ hợp dài trước tên sao đơn", () => {
    expect(astroTexts("Cách Tử Phủ Vũ Tướng rất rõ.")).toEqual(["Tử Phủ Vũ Tướng"]);
  });

  it("tô trọn cụm sao lưu / vận hóa", () => {
    expect(astroTexts("Lưu Hóa Khoa và Lưu Thiên Mã cùng cung.")).toEqual([
      "Lưu Hóa Khoa",
      "Lưu Thiên Mã",
    ]);
  });

  it("an toàn với chuỗi rỗng", () => {
    expect(splitAstroTerms("")).toEqual([]);
  });
});
