import { describe, expect, it } from "vitest";
import { resolveTopicPool, starsFromPalaces } from "./topicStarPool";

describe("topicStarPool", () => {
  it("hỏi tiền → topic tai + cung Tài", () => {
    const t = resolveTopicPool("Năm nay tiền bạc và giữ tiền thế nào?");
    expect(t.topics).toContain("tai");
    expect(t.palaceKeywords.some((p) => /Tài|Điền|Phúc/.test(p))).toBe(true);
  });

  it("hỏi điểm mù → diem_mu", () => {
    const t = resolveTopicPool("Điểm mù tính cách của tôi là gì?");
    expect(t.topics).toContain("diem_mu");
  });

  it("starsFromPalaces lấy chính tinh cung khớp", () => {
    const palaces = [
      { name: "Mệnh", majorStars: [{ name: "Thiên Cơ" }], minorStars: [], adjectiveStars: [{ name: "Tuần" }] },
      { name: "Tài Bạch", majorStars: [{ name: "Thiên Đồng" }], minorStars: [], adjectiveStars: [] },
      { name: "Nô Bộc", majorStars: [], minorStars: [], adjectiveStars: [{ name: "Địa Kiếp" }] },
    ];
    const stars = starsFromPalaces(palaces, ["Tài", "Nô"]);
    expect(stars).toContain("Thiên Đồng");
    expect(stars).toContain("Địa Kiếp");
    expect(stars).not.toContain("Thiên Cơ");
  });
});
