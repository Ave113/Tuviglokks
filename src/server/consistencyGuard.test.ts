import { describe, it, expect } from "vitest";
import {
  extractVerdictAnchors,
  buildSecondaryModelHardLockBlock,
  auditChatConsistency,
} from "./consistencyGuard";
import { isSecondaryModel } from "../constants/geminiModels";

describe("consistencyGuard", () => {
  it("nhận diện chuẩn model thứ 2 linh hoạt trong tương lai", () => {
    expect(isSecondaryModel("gemini-3.5-flash-lite")).toBe(true);
    expect(isSecondaryModel("models/gemini-3.5-flash-lite")).toBe(true);
    expect(isSecondaryModel("gemini-future-lite")).toBe(true);
    expect(isSecondaryModel("gemini-4.0-flash-lite")).toBe(true);
    expect(isSecondaryModel("gemini-3.8-flash")).toBe(false);
  });

  it("trích xuất sổ neo phán quyết từ bản luận gốc", () => {
    const baseInterp = `
PHẦN 1: MỆNH CÁCH
Cung Mệnh có Thiên Cơ hãm địa ngộ Hóa Kỵ, bản tính hay suy nghĩ quá độ, điểm mù là do dự thiếu quyết đoán.

PHẦN 2: TÀI CHÍNH DÒNG TIỀN
Cung Tài Bạch ngộ Kình Dương Thiên Không, dễ bị hao tài tán tài khi đầu tư mạo hiểm, cần quản trị rủi ro chặt chẽ.

PHẦN 3: SỰ NGHIỆP
Cung Quan Lộc có Cự Môn, hợp ngành nghề tư vấn, đàm phán, nghiên cứu.
`;
    const anchors = extractVerdictAnchors(baseInterp, "Hỏi về tài chính đầu tư");
    expect(anchors).toContain("SỔ NEO PHÁN QUYẾT TỪ BẢN LUẬN GỐC");
    expect(anchors).toContain("TÀI CHÍNH & DÒNG TIỀN");
    expect(anchors).toContain("hao tài");
  });

  it("sinh block chốt khóa quan điểm nghiêm ngặt cho model thứ 2", () => {
    const block = buildSecondaryModelHardLockBlock();
    expect(block).toContain("CHỐT KHÓA QUAN ĐIỂM");
    expect(block).toContain("BẢO TOÀN LẬP TRƯỜNG TUYỆT ĐỐI");
    expect(block).toContain("KẾT CẤU 3 NHỊP");
  });

  it("phát hiện xung đột phân cực tài chính và điều chỉnh câu trả lời", () => {
    const base = "Cung Tài Bạch gặp Hóa Kỵ ngộ Không Kiếp, hao tài tán tài nặng, tránh đầu tư mạo hiểm.";
    const contradictedAns = "Vận này bạn hoàn toàn yên tâm đầu tư lớn, phát tài rực rỡ và thu lợi nhuận khủng.";

    const res = auditChatConsistency(contradictedAns, base, "Đầu tư tài chính thế nào?");
    expect(res.isConsistent).toBe(false);
    expect(res.adjustedAnswer).toContain("Lưu ý nhất quán với bản luận giải chính");
    expect(res.adjustedAnswer).toContain("đề phòng hao tán dòng tiền");
  });

  it("giữ nguyên câu trả lời nhất quán không bị xung đột", () => {
    const base = "Cung Tài Bạch gặp Hóa Kỵ ngộ Không Kiếp, hao tài tán tài nặng, tránh đầu tư mạo hiểm.";
    const alignedAns = "Tài Bạch ngộ Hóa Kỵ và Không Kiếp, nên tập trung giữ vốn và quản lý chi tiêu an toàn.";

    const res = auditChatConsistency(alignedAns, base, "Đầu tư tài chính thế nào?");
    expect(res.isConsistent).toBe(true);
    expect(res.adjustedAnswer).toBe(alignedAns);
  });
});
