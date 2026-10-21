import { describe, expect, it } from "vitest";
import {
  GIAI_HOA_KNOWLEDGE,
  retrieveGiaiHoa,
  giaiHoaToPromptText,
} from "./giaiHoaKnowledge";

describe("giaiHoaKnowledge", () => {
  it("catalog có id gh- và content có NÊN/KHÔNG", () => {
    expect(GIAI_HOA_KNOWLEDGE.length).toBeGreaterThanOrEqual(25);
    const ids = new Set<string>();
    for (const e of GIAI_HOA_KNOWLEDGE) {
      expect(e.id).toMatch(/^gh-/);
      expect(ids.has(e.id)).toBe(false);
      ids.add(e.id);
      expect(e.content.length).toBeLessThan(500);
      expect(e.content).toMatch(/NÊN:|KHÔNG:|XU HƯỚNG:/);
    }
  });

  it("Không–Kiếp gate: có Địa Kiếp mới ra mẩu Nô", () => {
    const withKk = retrieveGiaiHoa({ stars: ["Địa Không", "Địa Kiếp", "Thiên Cơ"] }, 5);
    expect(withKk.some((e) => e.id === "gh-khong-kiep-no")).toBe(true);

    const noKk = retrieveGiaiHoa({ stars: ["Thiên Cơ", "Thiên Lương"] }, 8);
    expect(noKk.some((e) => e.id === "gh-khong-kiep-no")).toBe(false);
  });

  it("Thiên Cơ + Tuần → mẩu overthink", () => {
    const got = retrieveGiaiHoa({ stars: ["Thiên Cơ", "Tuần"] }, 5);
    expect(got.some((e) => e.id === "gh-thien-co-tuan")).toBe(true);
  });

  it("prompt giải hóa có disclaimer mass", () => {
    const got = retrieveGiaiHoa({ stars: ["Cự Môn", "Hóa Kỵ"] }, 3);
    const text = giaiHoaToPromptText(got);
    expect(text).toMatch(/GIẢI HÓA/);
    expect(text).toMatch(/CẤM cúng|không thay tư vấn/i);
  });
});
