import { describe, it, expect } from "vitest";
import {
  DAM_TINH_AUX,
  DAM_TINH_TU_HOA_DETAIL,
  getAuxStarPriority,
  getDamTinhForAuxStars,
  getDamTinhTuHoaDetail,
  resolveDamTinhStarName,
  STAR_NAME_ALIASES,
} from "./damTinh";
import { TU_HOA_BY_STEM, HOA_LABELS } from "../utils/tuHoa";

describe("resolveDamTinhStarName / aliases", () => {
  it("map Tả Phụ → Tả Phù (iztro)", () => {
    expect(resolveDamTinhStarName("Tả Phụ")).toBe("Tả Phù");
    expect(STAR_NAME_ALIASES["Tả Phụ"]).toBe("Tả Phù");
  });

  it("strip [SAO LƯU] và giữ tên canonical", () => {
    expect(resolveDamTinhStarName("[SAO LƯU] Kình Dương")).toBe("Kình Dương");
    expect(resolveDamTinhStarName("Phượng Các")).toBe("Phụng Các");
  });
});

describe("getDamTinhForAuxStars — priority + cap", () => {
  it("ưu tiên sát tinh trước tạp khi cắt maxEntries", () => {
    // Nhiều sao: tạp đứng trước trong input, sát đứng sau — vẫn phải giữ sát.
    const names = [
      "Thiên Trù",
      "Đài Phụ",
      "Phong Cáo",
      "Thiên Tài",
      "Long Trì",
      "Phụng Các",
      "Thiên Quan",
      "Thiên Phúc",
      "Ân Quang",
      "Thiên Quý",
      "Tam Thai",
      "Bát Tọa",
      "Kình Dương",
      "Địa Không",
      "Hỏa Tinh",
    ];
    const text = getDamTinhForAuxStars(names, 5);
    expect(text).toContain("Kình Dương");
    expect(text).toContain("Địa Không");
    expect(text).toContain("Hỏa Tinh");
    expect(text).toMatch(/Đã hiển thị 5\//);
    // Tạp ưu tiên thấp không được chiếm 5 slot đầu
    expect(text).not.toContain("Thiên Trù");
  });

  it("alias Tả Phụ tra được entry Tả Phù", () => {
    const text = getDamTinhForAuxStars(["Tả Phụ"], 3);
    expect(text).toContain("Tả Phù");
    expect(text).toContain("左輔");
  });

  it("catalog có Tuần/Triệt và Giải Thần", () => {
    expect(DAM_TINH_AUX["Tuần Không"]).toBeTruthy();
    expect(DAM_TINH_AUX["Triệt Không"]).toBeTruthy();
    expect(DAM_TINH_AUX["Giải Thần"]).toBeTruthy();
    expect(getAuxStarPriority("Kình Dương")).toBeGreaterThan(getAuxStarPriority("Long Trì"));
  });
});

describe("Tứ Hóa chi tiết — 10 can + edge", () => {
  it("đủ 40 cặp theo TU_HOA_BY_STEM", () => {
    for (const [, quartet] of Object.entries(TU_HOA_BY_STEM)) {
      quartet.forEach((star, i) => {
        const key = `${star}|${HOA_LABELS[i]}`;
        // Tả Phù đã canonical trong bảng
        expect(DAM_TINH_TU_HOA_DETAIL[key], `missing ${key}`).toBeTruthy();
      });
    }
  });

  it("getDamTinhTuHoaDetail resolve Tả Phụ alias + fallback edge", () => {
    const withAlias = getDamTinhTuHoaDetail([{ star: "Tả Phụ", hoa: "Hóa Khoa" }]);
    expect(withAlias).toContain("Tả Phù");
    expect(withAlias).toContain("Hóa Khoa");

    const edge = getDamTinhTuHoaDetail([{ star: "Thiên Phủ", hoa: "Hóa Lộc" }]);
    expect(edge).toContain("chưa có mục Đàm Tinh chi tiết");
    expect(edge).toContain("Hóa Lộc");
  });
});
