import { describe, it, expect } from "vitest";
import { checkOutOfScopeQuestion } from "./scopeGuard";

describe("scopeGuard", () => {
  it("chặn câu hỏi công thức logarit của user", () => {
    const res = checkOutOfScopeQuestion("nêu công thức logarit");
    expect(res.isOutOfScope).toBe(true);
    expect(res.category).toBe("math");
    expect(res.refusalMessage).toContain("Toán học");
  });

  it("chặn các câu hỏi toán học khác", () => {
    expect(checkOutOfScopeQuestion("giải phương trình bậc 2: x^2 - 4x + 3 = 0").isOutOfScope).toBe(true);
    expect(checkOutOfScopeQuestion("tính đạo hàm của hàm số y = 3x^2 + 5").isOutOfScope).toBe(true);
    expect(checkOutOfScopeQuestion("định lý pitago phát biểu thế nào?").isOutOfScope).toBe(true);
  });

  it("chặn các câu hỏi văn học", () => {
    const res = checkOutOfScopeQuestion("phân tích bài thơ Tây Tiến của Quang Dũng");
    expect(res.isOutOfScope).toBe(true);
    expect(res.category).toBe("literature");
    expect(res.refusalMessage).toContain("Ngữ văn");
  });

  it("chặn các câu hỏi lập trình", () => {
    const res = checkOutOfScopeQuestion("viết code python tính dãy fibonacci");
    expect(res.isOutOfScope).toBe(true);
    expect(res.category).toBe("programming");
  });

  it("cho qua các câu hỏi liên quan đến lá số, tử vi, cung vị", () => {
    expect(checkOutOfScopeQuestion("Cung Mệnh của tôi có sao Tử Vi thì tính cách ra sao?").isOutOfScope).toBe(false);
    expect(checkOutOfScopeQuestion("Năm nay đại hạn 10 năm tại cung Tài Bạch có hao tiền không?").isOutOfScope).toBe(false);
    expect(checkOutOfScopeQuestion("Tôi làm nghề công nghệ thông tin lập trình thì cung Quan Lộc có hợp không?").isOutOfScope).toBe(false);
    expect(checkOutOfScopeQuestion("Lá số này có hạn xuất ngoại không?").isOutOfScope).toBe(false);
  });

  it("REGRESSION — thuật ngữ đẩu số đầy đủ vẫn được cho qua", () => {
    expect(checkOutOfScopeQuestion("Cung Mệnh có Tuần Không và Triệt Lộ thì luận sao?").isOutOfScope).toBe(false);
    expect(checkOutOfScopeQuestion("Tuần Không ở Mệnh có nặng không?").isOutOfScope).toBe(false);
  });

  it("REGRESSION — token bare 'tuần/triệt' không được coi là mệnh lý để lọt câu học thuật", () => {
    // Trước đây bare "tuần" trong ASTROLOGY_CONTEXT_REGEX khiến "bảng tuần hoàn
    // hóa học" bypass được chặn khoa học → lọt thẳng cho model.
    const hoaHoc = checkOutOfScopeQuestion("cho tôi bảng tuần hoàn hóa học đầy đủ");
    expect(hoaHoc.isOutOfScope).toBe(true);
    expect(hoaHoc.category).toBe("science");

    const vatLy = checkOutOfScopeQuestion("giải thích phản ứng triệt tiêu trong vật lý hạt");
    expect(vatLy.isOutOfScope).toBe(true);
    expect(vatLy.category).toBe("science");
  });

  it("REGRESSION — tên tác phẩm đứng ĐẦU câu vẫn bị chặn (\b sau 'đ' là dead boundary)", () => {
    // JS \b tính theo \w ASCII: "đ" không thuộc \w nên "\b(đất..." không bao giờ
    // khớp khi "đất" mở đầu câu — trước đây câu này lọt qua toàn bộ guard.
    const datNuoc = checkOutOfScopeQuestion("Đất nước Nguyễn Khoa Điềm phân tích giúp tôi");
    expect(datNuoc.isOutOfScope).toBe(true);
    expect(datNuoc.category).toBe("literature");
  });
});
