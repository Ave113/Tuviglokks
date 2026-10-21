import { describe, it, expect } from "vitest";
import { splitSectionLabels } from "./sectionLabels";

const joined = (text: string) => splitSectionLabels(text).map((p) => p.text).join("");
const labeled = (text: string) =>
  splitSectionLabels(text)
    .filter((p) => p.label)
    .map((p) => p.text);

describe("splitSectionLabels — tô đỏ nhãn mục", () => {
  it("nhận đúng 5 nhãn mục và giữ nguyên toàn bộ chữ", () => {
    const samples = [
      "Cấu trúc Sát Tinh",
      "Độ sâu Tứ Hóa",
      "Sự nghiệp & Tài lộc",
      "Tình cảm & gia đạo",
      "Sức khỏe & môi trường sống",
    ];
    for (const sample of samples) {
      expect(labeled(sample)).toEqual([sample]);
      expect(joined(`Mở đầu — ${sample}: nội dung`)).toBe(`Mở đầu — ${sample}: nội dung`);
    }
  });

  it("nhận biến thể 'và', Hóa/Hoá, Khỏe/Khoẻ, IN HOA", () => {
    expect(labeled("Sự nghiệp và Tài lộc")).toEqual(["Sự nghiệp và Tài lộc"]);
    expect(labeled("Tình cảm và gia đạo")).toEqual(["Tình cảm và gia đạo"]);
    expect(labeled("Độ sâu Tứ Hoá")).toEqual(["Độ sâu Tứ Hoá"]);
    expect(labeled("Sức khoẻ & môi trường sống")).toEqual(["Sức khoẻ & môi trường sống"]);
    expect(labeled("CẤU TRÚC SÁT TINH")).toEqual(["CẤU TRÚC SÁT TINH"]);
  });

  it("không tô đỏ câu văn thường viết thường", () => {
    expect(labeled("Bàn về sự nghiệp và tài lộc trong đời sống.")).toEqual([]);
    expect(labeled("Nói về tình cảm và gia đạo.")).toEqual([]);
  });

  it("tách đúng nhãn nằm giữa câu, không ăn sang chữ bên cạnh", () => {
    expect(labeled("Phần 2: Sự nghiệp & Tài lộc — tiền, việc, tình")).toEqual([
      "Sự nghiệp & Tài lộc",
    ]);
  });

  it("mở rộng các nhãn mục con còn lại", () => {
    const samples = [
      "Tính va đập & Điểm mù",
      "Tự Phi Tứ Hóa",
      "Các cung còn lại",
      "Đại hạn (10 năm)",
      "Luận giải Tiểu Hạn",
      "Tháng nóng nhất",
      "Tháng trọng tâm",
      "Định cách & Tổng lực đa chiều",
      "Đối chiếu chéo Bát Tự",
    ];
    for (const sample of samples) {
      expect(labeled(sample)).toEqual([sample]);
    }
  });

  it("nhãn một từ chỉ tô đỏ ở heading, không tô câu văn thường", () => {
    expect(labeled("Sự nghiệp")).toEqual([]);
    expect(labeled("Tài lộc")).toEqual([]);
    expect(labeled("Phúc Đức")).toEqual([]);

    const heading = (text: string) =>
      splitSectionLabels(text, "heading")
        .filter((p) => p.label)
        .map((p) => p.text);
    expect(heading("Sự nghiệp")).toEqual(["Sự nghiệp"]);
    expect(heading("Tài lộc")).toEqual(["Tài lộc"]);
    expect(heading("Phúc Đức")).toEqual(["Phúc Đức"]);
    expect(heading("Sự nghiệp & Tài lộc")).toEqual(["Sự nghiệp & Tài lộc"]);
  });
});
