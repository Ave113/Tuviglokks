import { describe, it, expect, vi } from "vitest";

// Flag tháng là compile-time const; mock để kiểm tra nhánh "bật" ít nhất ở tầng khung.
vi.mock("../server/aiConfig", () => ({
  INTERPRET_INCLUDE_MONTHLY_SECTION: true,
}));

describe("interpretFrameworkPrompt — nhánh bật phần tháng", () => {
  it("tháng là mục con của Phần 3, không đổi số phần", async () => {
    const { buildInterpretFrameworkBlock, interpretPartNumbers, interpretPartTitles } =
      await import("./interpretFrameworkPrompt");

    const n = interpretPartNumbers();
    expect(n.thangPart).toBe(3);
    expect(n.phucDucPart).toBe(4);
    expect(n.cungKhacPart).toBe(2);
    expect(n.dinhCachPart).toBe(4);
    expect(n.partCount).toBe(4);
    expect(n.totalPartCount).toBe(5);

    const block = buildInterpretFrameworkBlock(2026, { transitLunarAge: 30 }, true);
    expect(block).toContain("### Tháng trọng tâm trong năm 2026");
    expect(block).toContain("4. **NỀN TẢNG PHÚC BÁO");
    expect(block).toContain("### Định cách & Tổng lực đa chiều");
    expect(block).toContain("### Các cung còn lại");
    expect(block).not.toContain("KHÔNG viết mục \"Tháng trọng tâm trong năm\"");

    const titles = interpretPartTitles();
    expect(titles).toHaveLength(4);
    expect(titles[2]).toContain("Tháng nóng");
  });
});
