import { describe, it, expect } from "vitest";
import { splitChatAnswer } from "./splitChatAnswer";

describe("splitChatAnswer", () => {
  it("tách trước Căn cứ Tử Vi (chính tả chuẩn)", () => {
    const text =
      "Ngành Điện PHÙ HỢP, nhưng nên theo Điện tử.\n\nCăn cứ Tử Vi: Thiên Cơ Miếu.\nCăn cứ Bát Tự: Ất Mộc nhược.";
    const r = splitChatAnswer(text);
    expect(r.lead).toContain("PHÙ HỢP");
    expect(r.detail).toMatch(/^Căn cứ Tử Vi/i);
  });

  it("vẫn tách typo cũ Cân cứ (â thay ă) để không gãy lịch sử chat", () => {
    const text = "Kết luận ngắn.\n\nCân cứ Tử Vi: Thiên Cơ Miếu.";
    const r = splitChatAnswer(text);
    expect(r.lead).toBe("Kết luận ngắn.");
    expect(r.detail).toMatch(/^Cân cứ Tử Vi/i);
  });

  it("một đoạn ngắn — không tách", () => {
    const r = splitChatAnswer("Có, nên đổi việc vào tháng 8.");
    expect(r.detail).toBeNull();
    expect(r.lead).toContain("tháng 8");
  });

  it("tách đoạn đầu khi quá dài không có Căn cứ", () => {
    const lead = "Kết luận ngắn gọn về nghề nghiệp phù hợp với lá số hiện tại của đương số.";
    const rest = "B".repeat(280);
    const r = splitChatAnswer(`${lead} ${rest}`);
    expect(r.lead).toContain("Kết luận");
    expect(r.detail).toContain("B");
  });

  it("REGRESSION — tách cả khi 'Căn cứ' xuống dòng đơn (\\b sau 'cứ' là dead boundary)", () => {
    // JS \b chạy theo \w ASCII nên "cứ\b" chỉ khớp khi sau là ký tự ASCII —
    // trước đây "Căn cứ Tử Vi" cách lead bằng MỘT dòng \n không bao giờ khớp
    // pattern chính, bị rơi xuống fallback chia đoạn \n\n.
    const text = "Ngành phù hợp là kỹ thuật.\nCăn cứ Tử Vi: Thiên Cơ Miếu tại Quan Lộc.\nCăn cứ Bát Tự: Ất Mộc nhược.";
    const r = splitChatAnswer(text);
    expect(r.lead).toContain("kỹ thuật");
    expect(r.detail).toMatch(/^Căn cứ Tử Vi/i);
    expect(r.detail).toContain("Căn cứ Bát Tự");
  });
});