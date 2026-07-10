import { describe, expect, it } from "vitest";
import {
  KINH_NGHIEM_KNOWLEDGE,
  retrieveKinhNghiem,
  kinhNghiemToPromptText,
  KINH_NGHIEM_SOURCE_RELATIVE,
} from "./kinhNghiemKnowledge";

describe("kinhNghiemKnowledge", () => {
  it("có nguồn file B trong repo path note", () => {
    expect(KINH_NGHIEM_SOURCE_RELATIVE).toContain("so-tu-vi-kinh-nghiem-quyen-ha");
  });

  it("mỗi entry có id/tags/source/content gọn", () => {
    expect(KINH_NGHIEM_KNOWLEDGE.length).toBeGreaterThanOrEqual(15);
    for (const e of KINH_NGHIEM_KNOWLEDGE) {
      expect(e.id).toMatch(/^kn-/);
      expect(e.tags.length).toBeGreaterThan(0);
      expect(e.source).toContain("Kinh Nghiệm");
      expect(e.content.length).toBeGreaterThan(40);
      expect(e.content.length).toBeLessThan(600);
    }
  });

  it("retrieve theo sao Kình Dương + query hạn → Mã đầu / hạn", () => {
    const got = retrieveKinhNghiem(
      { stars: ["Kình Dương", "Thất Sát"], query: "hạn năm nay có sao không" },
      5,
    );
    expect(got.length).toBeGreaterThan(0);
    expect(got.length).toBeLessThanOrEqual(5);
    const ids = got.map((e) => e.id);
    expect(
      ids.some((id) => id.includes("ma-dau") || id.includes("han") || id.includes("sat")),
    ).toBe(true);
  });

  it("retrieve theo chủ đề nghề → có mẩu hướng nghề hoặc quan lộc", () => {
    const got = retrieveKinhNghiem(
      { stars: ["Vũ Khúc", "Thái Dương"], query: "nên học ngành gì làm nghề gì" },
      5,
    );
    const blob = got.map((e) => e.title + e.content).join(" ");
    expect(/nghề|quan|học|tài/i.test(blob)).toBe(true);
  });

  it("query nghề không bị ụp bởi đống sát tinh phụ trên lá", () => {
    const noisyStars = [
      "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh",
      "Kình Dương", "Đà La", "Địa Không", "Địa Kiếp", "Hỏa Tinh", "Linh Tinh",
      "Đại Hao", "Tiểu Hao", "Tang Môn", "Bạch Hổ",
    ];
    const got = retrieveKinhNghiem(
      { stars: noisyStars, query: "nên học ngành gì làm nghề gì" },
      5,
    );
    expect(got.some((e) => e.id === "kn-huong-nghe-mau")).toBe(true);
    // Mẩu nghề phải nằm trong top (không bị đẩy xuống dưới toàn hạn/sát).
    expect(got.slice(0, 3).some((e) => e.id === "kn-huong-nghe-mau")).toBe(true);
  });

  it("không khớp gì vẫn trả fallback trình tự đoán", () => {
    const got = retrieveKinhNghiem({ stars: [], query: "xyzabc không liên quan 123" }, 5);
    expect(got.length).toBe(1);
    expect(got[0].id).toBe("kn-trinh-tu-doan");
  });

  it("prompt text có luật ưu tiên lớp B", () => {
    const text = kinhNghiemToPromptText(KINH_NGHIEM_KNOWLEDGE.slice(0, 2));
    expect(text).toContain("KINH NGHIỆM ỨNG DỤNG");
    expect(text).toContain("Đàm Tinh");
    expect(text).toContain("CÓ XU HƯỚNG");
    expect(text).toContain("CẤM hoa mỹ");
  });

  it("prompt rỗng khi không có entry", () => {
    expect(kinhNghiemToPromptText([])).toBe("");
  });
});
