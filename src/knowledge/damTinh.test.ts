import { describe, it, expect } from "vitest";
import {
  DAM_TINH_AUX,
  DAM_TINH_TU_HOA_DETAIL,
  getAuxStarPriority,
  getDamTinhForAuxStars,
  getDamTinhTuHoa,
  getDamTinhTuHoaDetail,
  resolveDamTinhStarName,
  STAR_NAME_ALIASES,
} from "./damTinh";
import { TU_HOA_BY_STEM, HOA_LABELS } from "../utils/tuHoa";
import { getDamTinhSourceSectionByStar } from "./damTinhSource";

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
    expect(edge).toMatch(/mở rộng|chưa có mục/);
    expect(edge).toContain("Hóa Lộc");
    expect(edge).toMatch(/Phủ|tài khố|giữ/);
  });

  it("Lưu Khôi / Vận Lộc resolve về tinh tình gốc", () => {
    expect(resolveDamTinhStarName("Lưu Khôi")).toBe("Thiên Khôi");
    expect(resolveDamTinhStarName("Vận Việt")).toBe("Thiên Việt");
    expect(resolveDamTinhStarName("Lưu Kình Dương")).toBe("Kình Dương");
    expect(resolveDamTinhStarName("[SAO LƯU] Lưu Mã")).toBe("Thiên Mã");
    // Không nuốt Lưu Hóa Lộc thành Lộc Tồn
    expect(resolveDamTinhStarName("Lưu Hóa Lộc")).toBe("Lưu Hóa Lộc");
  });

  it("nhóm vòng trạng thái/tuế tiền mới: Lưu variant resolve đúng entry", () => {
    // Batch biên từ nguyên thư (24 entry): Lưu/Vận + nhãn vòng phải tra được entry
    const pairs: [string, string][] = [
      ["Lưu Thái Tuế", "Thái Tuế"],
      ["Vận Thái Tuế", "Thái Tuế"],
      ["Lưu Thiên Đức", "Thiên Đức"],
      ["Lưu Nguyệt Đức", "Nguyệt Đức"],
      ["Lưu Long Đức", "Long Đức"],
      ["Lưu Bác Sỹ", "Bác Sỹ"],
      ["Vận Thanh Long", "Thanh Long"],
      ["Lưu Vong Thần", "Vong Thần"],
    ];
    for (const [variant, root] of pairs) {
      expect(resolveDamTinhStarName(variant), variant).toBe(root);
      expect(DAM_TINH_AUX[root], root).toBeTruthy();
      expect(getDamTinhForAuxStars([variant], 30), variant).toContain(root);
    }
  });

  it("batch 2 (Tân Biên 1956): vòng Trường Sinh + Phúc Đức/Tuế Phá tra được theo nhãn iztro", () => {
    // Nhãn vòng trên lá (changsheng12 + suiqian) resolve exact-match → entry
    const labels = ["Trường Sinh", "Lâm Quan", "Quan Đới", "Đế Vượng", "Suy", "Bệnh",
      "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng", "Phúc Đức", "Tuế Phá"];
    for (const s of labels) {
      expect(DAM_TINH_AUX[s], `${s} phải có entry`).toBeTruthy();
      expect(getDamTinhForAuxStars([s], 40), s).toContain(s);
    }
    // Lưu Phúc Đức (được an theo năm) resolve về Phúc Đức
    expect(resolveDamTinhStarName("Lưu Phúc Đức")).toBe("Phúc Đức");
    expect(getDamTinhForAuxStars(["Lưu Phúc Đức"], 40)).toContain("Phúc Đức");
  });

  it("entry nhóm vòng mới đều tra được nguồn sách nguyên văn (trừ Tuế Kiện — alias 太岁)", () => {
    const newStars = [
      "Thiên Nguyệt", "Thái Tuế", "Thiên Đức", "Nguyệt Đức", "Long Đức", "Điếu Khách",
      "Hối Khí", "Quán Tác", "Bác Sỹ", "Lực Sỹ", "Thanh Long", "Tướng Quân", "Tướng Tinh", "Tấu Thư",
      "Hỷ Thần", "Bệnh Phù", "Phục Binh", "Quan Phủ", "Phan Án", "Tuế Dịch", "Tức Thần",
      "Chỉ Bối", "Nguyệt Sát", "Vong Thần",
    ];
    for (const s of newStars) {
      const src = getDamTinhSourceSectionByStar(s);
      expect(src, `${s} phải nối được mục nguồn`).toBeTruthy();
      expect(src!.content.length, `${s} nguồn phải là tiểu luận`).toBeGreaterThan(80);
    }
    // Tuế Kiện không có mục riêng — trỏ han về 太岁 để vẫn tra được nguồn Thái Tuế
    expect(getDamTinhSourceSectionByStar("Tuế Kiện")?.header).toBe("太岁");
  });

  it("Niên Giải có entry + nối nguồn mục 解神 (Vương Đình Chi nói riêng về 年解)", () => {
    expect(DAM_TINH_AUX["Niên Giải"]).toBeTruthy();
    expect(getDamTinhForAuxStars(["Niên Giải"])).toContain("Niên Giải");
    const src = getDamTinhSourceSectionByStar("Niên Giải");
    expect(src?.header).toBe("解神");
    expect(src!.content).toMatch(/年解/);
  });

  it("trần mặc định 30: trên lá khớp >30 entry → giữ đúng 30 + ghi chú nhạc nền", () => {
    // Sinh >30 phụ tinh giả để tất cả khớp entry
    const stars = Object.keys(DAM_TINH_AUX).slice(0, 40);
    const out = getDamTinhForAuxStars(stars);
    const lines = out.split("\n").filter((l) => l.startsWith("  - "));
    expect(lines.length).toBe(31); // 30 entry + 1 dòng ghi chú cắt
    expect(out).toMatch(/nhạc nền theo cung/);
    expect(out).toMatch(/10 sao thứ yếu/);
  });

  it("Sao vận/lưu render kèm ghi chú 'trên lá có dạng'", () => {
    const out = getDamTinhForAuxStars(["Vận Xương"]);
    expect(out).toContain("Văn Xương");
    expect(out).toMatch(/trên lá có dạng: Vận Xương/);
    const outLuu = getDamTinhForAuxStars(["Lưu Hồng Loan"]);
    expect(outLuu).toContain("Hồng Loan");
    expect(outLuu).toMatch(/trên lá có dạng: Lưu Hồng Loan/);
    // Form bẩm sinh (trùng tên entry) không ghi chú thừa
    const outNatal = getDamTinhForAuxStars(["Hồng Loan"]);
    expect(outNatal).not.toMatch(/trên lá có dạng/);
  });

  it("getDamTinhTuHoa nuốt được nhãn iztro 'Vận Hóa Lộc (Tham Lang)' / 'Lưu Hóa Kỵ (Liêm Trinh)'", () => {
    const out = getDamTinhTuHoa(["Vận Hóa Lộc (Tham Lang)", "Lưu Hóa Kỵ (Liêm Trinh)"]);
    expect(out).toContain("Hóa Lộc");
    expect(out).toContain("Hóa Kỵ");
    expect(out).not.toContain("Không xác định được Tứ Hóa nào");
  });
});
