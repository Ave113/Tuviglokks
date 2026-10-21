import { describe, expect, it } from "vitest";
import { REQUIRED_INTERPRET_HEADINGS, scoreAiText } from "./scoreSkeleton";

describe("scoreAiText — heading khung mới", () => {
  it("nhận heading IN HOA (không phân biệt hoa/thường)", () => {
    const text = [
      "## Phần 0: CHÂN DUNG & 3 TRỤC CHÍNH",
      "### Tính va đập & Điểm mù",
      "### Tự Phi Tứ Hóa",
      "### Độ sâu Tứ Hóa",
      "### Cấu trúc Sát Tinh",
      "### Luận giải Tiểu Hạn",
      "### Sự nghiệp & Tài lộc",
      "### Tình cảm & gia đạo",
      "### Sức khỏe & môi trường sống",
      "### Phúc Đức",
      "### Các cung còn lại",
      "### Định cách & Tổng lực đa chiều",
      "## KẾT LUẬN CUỐI — 5 DÒNG",
      "Nội dung đủ dài để chấm. ".repeat(20),
    ].join("\n");

    const result = scoreAiText({ palaces: [] }, text);
    const headings = result.details.find((d) => d.startsWith("headings"));
    expect(headings).toBe(
      `headings ${REQUIRED_INTERPRET_HEADINGS.length}/${REQUIRED_INTERPRET_HEADINGS.length} → 50`,
    );
  });
});
