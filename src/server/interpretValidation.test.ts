import { describe, it, expect } from "vitest";
import { validateInterpretation } from "./interpretValidation";

describe("interpretValidation", () => {
  const sampleChartData = {
    birthHeavenlyStem: "Canh",
    transitYear: 2026,
    palaces: [
      { name: "Mệnh", earthlyBranch: "Thân", isBodyPalace: false },
      { name: "Phu Thê", earthlyBranch: "Ngọ", isBodyPalace: true },
    ],
  };

  it("chuẩn hóa năm xem hạn nếu AI viết nhầm sang năm cũ", () => {
    const raw = "### Luận giải Tiểu Hạn năm 2025\nNăm nay có nhiều biến động tài chính.";
    const result = validateInterpretation(raw, sampleChartData);
    expect(result.text).toContain("Tiểu Hạn năm 2026");
    expect(result.issues.some((i) => i.type === "transit_year")).toBe(true);
  });

  it("phát hiện và sửa sai lệch sao Tứ Hóa bẩm sinh", () => {
    // Canh: Thái Dương Lộc, Vũ Khúc Quyền, Thái Âm Khoa, Thiên Đồng Kỵ
    // Nếu AI viết "Liêm Trinh Hóa Lộc bẩm sinh"
    const raw = "Về Tứ Hóa, đương số có Liêm Trinh Hóa Lộc bẩm sinh chiếu về cung Quan.";
    const result = validateInterpretation(raw, sampleChartData);
    expect(result.text).toContain("Thái Dương Hóa Lộc bẩm sinh");
    expect(result.issues.some((i) => i.type === "tu_hoa")).toBe(true);
  });

  it("chuẩn hóa vị trí địa chi của Cung Mệnh nếu AI viết sai", () => {
    const raw = "Cung Mệnh đóng tại Dần có các sao chính tinh hội tụ.";
    const result = validateInterpretation(raw, sampleChartData);
    expect(result.text).toContain("Cung Mệnh đóng tại Thân");
    expect(result.issues.some((i) => i.type === "menh_than")).toBe(true);
  });

  it("chuẩn hóa vị trí cung Thân khi AI viết nhầm cung Thân khác", () => {
    const raw = "Đương số có Thân cư Quan Lộc nên luôn dồn tâm huyết vào sự nghiệp.";
    const result = validateInterpretation(raw, sampleChartData);
    expect(result.text).toContain("Thân cư Phu Thê");
    expect(result.issues.some((i) => i.type === "menh_than")).toBe(true);
  });

  it("chuẩn hóa Thân Mệnh đồng cung khi AI viết nhầm Thân cư cung khác", () => {
    const dongCungChart = {
      birthHeavenlyStem: "canh",
      transitYear: 2026,
      palaces: [
        { name: "Mệnh", earthlyBranch: "Thân", isBodyPalace: true },
        { name: "Phu Thê", earthlyBranch: "Ngọ", isBodyPalace: false },
      ],
    };
    const raw = "Đương số có Thân cư Phu Thê nhưng tâm hướng bản thân.";
    const result = validateInterpretation(raw, dongCungChart);
    expect(result.text).toContain("Thân Mệnh đồng cung");
    expect(result.issues.some((i) => i.type === "menh_than")).toBe(true);
  });

  it("tự động trích xuất Can năm sinh từ chineseDate nếu birthHeavenlyStem thiếu", () => {
    const chartNoStem = {
      chineseDate: "Ất Hợi - Mậu Dần - Kỷ Mão - Canh Ngọ",
      transitYear: 2026,
      palaces: [
        { name: "Mệnh", earthlyBranch: "Hợi", isBodyPalace: false },
      ],
    };
    // Ất: Cơ Lương Vi Âm (Thiên Cơ Lộc, Thiên Lương Quyền, Tử Vi Khoa, Thái Âm Kỵ)
    const raw = "Đương số có Liêm Trinh Hóa Lộc bẩm sinh.";
    const result = validateInterpretation(raw, chartNoStem);
    expect(result.text).toContain("Thiên Cơ Hóa Lộc bẩm sinh");
    expect(result.issues.some((i) => i.type === "tu_hoa")).toBe(true);
  });

  it("giữ nguyên văn bản khi dữ liệu đã chuẩn xác", () => {
    const raw = "### Luận giải Tiểu Hạn năm 2026\nĐương số có Thái Dương Hóa Lộc bẩm sinh, Cung Mệnh đóng tại Thân.";
    const result = validateInterpretation(raw, sampleChartData);
    expect(result.text).toBe(raw);
    expect(result.issues.length).toBe(0);
  });

  // -----------------------------------------------------------------------
  // REGRESSION: không được rewrite vào câu ĐÚNG (phủ định / so sánh chéo can)
  // -----------------------------------------------------------------------

  it("REGRESSION — giữ nguyên câu phủ định 'không giống … của năm Kỷ' (so sánh chéo can)", () => {
    // Canh: Lộc = Thái Dương. Câu gốc so sánh với can Kỷ (Lộc = Vũ Khúc) là ĐÚNG.
    const raw =
      "Hóa Lộc bẩm sinh ở đây không giống Tham Lang Hóa Lộc bẩm sinh của năm Kỷ.";
    const result = validateInterpretation(raw, sampleChartData);
    expect(result.text).toBe(raw);
    expect(result.issues.length).toBe(0);
  });

  it("REGRESSION — giữ nguyên câu phủ định 'không phải là'", () => {
    const raw =
      "Cần lưu ý: Tham Lang không phải là Hóa Lộc bẩm sinh, dù Tham Lang là sao của Kỷ can.";
    const result = validateInterpretation(raw, sampleChartData);
    expect(result.text).toBe(raw);
    expect(result.issues.length).toBe(0);
  });

  it("REGRESSION — giữ nguyên câu 'khác với lá can X' khi nêu tứ hóa của can khác", () => {
    const raw =
      "Khác với lá can Ất (nơi Thiên Cơ Hóa Lộc bẩm sinh), lá này phát Thái Dương Hóa Lộc bẩm sinh.";
    const result = validateInterpretation(raw, sampleChartData);
    // "Khác với lá can Ất (nơi Thiên Cơ Hóa Lộc bẩm sinh)" — phần nói về can Ất phải giữ nguyên
    expect(result.text).toContain("Thiên Cơ Hóa Lộc bẩm sinh");
    // Phần khẳng định về can sinh (Canh) vốn ĐÚNG cũng phải giữ nguyên
    expect(result.text).toContain("Thái Dương Hóa Lộc bẩm sinh");
    expect(result.issues.length).toBe(0);
  });

  it("REGRESSION — 'Đối chiếu can Bính: …' nói về can khác thì không bị sửa", () => {
    const raw =
      "Đối chiếu can Bính: Liêm Trinh Hóa Kỵ bẩm sinh là đặc trưng của can đó.";
    const result = validateInterpretation(raw, sampleChartData);
    expect(result.text).toBe(raw);
    expect(result.issues.length).toBe(0);
  });

  it("vẫn sửa sai thật khi mệnh đề có qualifier trùng chính can năm sinh", () => {
    // "Với can Canh, Vũ Khúc Hóa Lộc bẩm sinh" — Vũ Khúc là Quyền của Canh, Lộc là Thái Dương
    const raw = "Với can Canh, đương số có Vũ Khúc Hóa Lộc bẩm sinh.";
    const result = validateInterpretation(raw, sampleChartData);
    expect(result.text).toContain("Thái Dương Hóa Lộc bẩm sinh");
    expect(result.issues.some((i) => i.type === "tu_hoa")).toBe(true);
  });

  it("giữ nguyên động từ thụ hóa và từ nối khi sửa", () => {
    const raw = "Đương số có Liêm Trinh thụ phong Hóa Lộc bẩm sinh.";
    const result = validateInterpretation(raw, sampleChartData);
    expect(result.text).toContain("Thái Dương thụ phong Hóa Lộc bẩm sinh");
  });

  it("giữ nguyên từ nối 'rơi vào' khi sửa hình thái nhãn-Hóa-đứng-trước", () => {
    const raw = "Hóa Lộc bẩm sinh rơi vào Liêm Trinh theo ghi chép.";
    const result = validateInterpretation(raw, sampleChartData);
    expect(result.text).toContain("Hóa Lộc bẩm sinh rơi vào Thái Dương");
    expect(result.text).not.toContain("Liêm Trinh");
  });

  // -----------------------------------------------------------------------
  // REGRESSION: check độ sâu đường bay Mệnh/Phúc Đức phải nhận diện ngữ khối máy
  // -----------------------------------------------------------------------

  const longFlightEssay = [
    "Xét tổng thể, lá số này mang cấu trúc nội lực mạnh nhưng tự sinh áp lực.",
    "TỪ CUNG MỆNH (Can Bính tại Dần — Ý CHÍ & ĐỘNG CƠ HÀNH ĐỘNG CỦA BẢN THÂN):",
    "- Phi Hóa xuất: Hóa Kỵ (Thái Dương) → Quan Lộc (Ngọ), tự tạo ải công danh.",
    "- Cơ chế: đương số gánh trách nhiệm rồi tự hà khắc, dẫn dắt hành vi vô thức.",
    "Đây là căn nguyên tâm lý cốt lõi cần mổ xẻ xuyên suốt bài luận. ".repeat(6),
  ].join(" ");

  it("REGRESSION — nhận diện khối 'TỪ CUNG MỆNH (Can X)… Phi Hóa xuất' là đã phân tích đường bay", () => {
    const result = validateInterpretation(longFlightEssay, sampleChartData);
    expect(result.issues.some((i) => i.severity === "warning")).toBe(false);
  });

  it("vẫn cảnh báo khi bài dài không nhắc tới bất kỳ đường bay Mệnh/Phúc nào", () => {
    const raw = "Đây là một đoạn luận giải tổng quan dài nhưng không chạm tới đường bay nào. ".repeat(20);
    const result = validateInterpretation(raw, sampleChartData);
    expect(result.issues.some((i) => i.type === "tu_hoa" && i.severity === "warning")).toBe(true);
  });
});
