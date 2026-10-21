import { describe, it, expect } from "vitest";
import {
  STAR_PRESENTATION_MARKERS,
  buildStarPresentationProtocolBlock,
  buildStarPresentationFrameworkHint,
} from "./starPresentationProtocol";
import {
  buildInterpretSystemInstruction,
  INTERPRET_SYSTEM_MARKERS,
} from "./interpretSystemInstruction";
import { buildInterpretFrameworkBlock } from "../prompt/interpretFrameworkPrompt";
import { CHAT_SYSTEM_INSTRUCTION } from "../prompt/systemInstructions";

describe("starPresentationProtocol", () => {
  it("block có marker + cụm sao + mạch một nhịp + thở bằng đời + cấm @", () => {
    const b = buildStarPresentationProtocolBlock();
    expect(b).toContain(STAR_PRESENTATION_MARKERS.block);
    expect(b).toContain(STAR_PRESENTATION_MARKERS.starCell);
    expect(b).toContain(STAR_PRESENTATION_MARKERS.roles);
    expect(b).toContain(STAR_PRESENTATION_MARKERS.formula);
    expect(b).toContain(STAR_PRESENTATION_MARKERS.banList);
    expect(b).toContain(STAR_PRESENTATION_MARKERS.banAtNotation);
    expect(b).toContain(STAR_PRESENTATION_MARKERS.proseLink);
    expect(b).toContain(STAR_PRESENTATION_MARKERS.lifeBreath);
    expect(b).toContain(STAR_PRESENTATION_MARKERS.noExtraPart);
    expect(b).toMatch(/Chủ lực|CỤM SAO|Trục/);
    expect(b).toMatch(/≥4 tên sao|CẤM/);
    expect(b).toMatch(/thủ|hội|ngộ|phi Hóa/);
    expect(b).toMatch(/đời trước|đời dẫn|hệ quả đời/i);
    expect(b).not.toMatch(/BẮT BUỘC viết Phần 0/i);
    expect(b).toContain("Phần 0");
    // Mẫu đúng dùng văn mệnh lý; mẫu sai cấm @
    expect(b).toContain("Vũ Khúc thủ Tài");
    expect(b).toMatch(/CẤM.*@|Sao@Cung/);
  });

  it("nhúng system instruction sau diễn đạt bậc thầy", () => {
    const s = buildInterpretSystemInstruction();
    expect(s).toContain(INTERPRET_SYSTEM_MARKERS.starPresentation);
    expect(s).toContain(INTERPRET_SYSTEM_MARKERS.starCell);
    expect(s).toMatch(/sao thủ cung|CẤM ký hiệu/);
    const idxStar = s.indexOf(STAR_PRESENTATION_MARKERS.block);
    const idxMulti = s.indexOf(INTERPRET_SYSTEM_MARKERS.multiLens);
    const idxExpress = s.indexOf("DIỄN ĐẠT NHƯ BẬC THẦY");
    expect(idxExpress).toBeGreaterThan(-1);
    expect(idxStar).toBeGreaterThan(idxExpress);
    expect(idxMulti).toBeGreaterThan(idxStar);
  });

  it("framework hint + khung luận: thở bằng đời, không thêm phần, protocol tinh tế", () => {
    const h = buildStarPresentationFrameworkHint();
    expect(h).toMatch(/CỤM SAO|cụm sao|mạch/i);
    expect(h).toMatch(/CẤM.*@|Sao@Cung/);
    expect(h).toContain(STAR_PRESENTATION_MARKERS.lifeBreath);
    expect(h).toMatch(/không thêm|CẤM THÊM|Phần 0/i);
    const fw = buildInterpretFrameworkBlock(2026, { transitLunarAge: 30 }, true);
    expect(fw).toContain("PROTOCOL TRÌNH BÀY SAO");
    expect(fw).toContain(STAR_PRESENTATION_MARKERS.lifeBreath);
    expect(fw).toContain(STAR_PRESENTATION_MARKERS.noExtraPart);
    expect(fw).toMatch(/2–4 cụm|2–4 mạch|tối đa \*\*3 cụm/);
    expect(fw).toMatch(/Câu mở phần \(đời\)|câu mở phần \(đời\)|Mở đời|Câu mở \(đời\)/i);
    expect(fw).not.toMatch(/### Tóm tắt nhanh|### Bản đồ 60/);
    expect(fw).toContain("## Phần 0: CHÂN DUNG & 3 TRỤC CHÍNH");
    // Khung phải chỉ dẫn viết "thủ cung", không còn ép format sát@cung làm mẫu đúng
    expect(fw).toMatch(/sát \*\*thủ\*\*|thủ\*\* cung|Kình Dương thủ/);
    expect(fw).not.toMatch(/mỗi cụm: 1 sát@cung/);
  });

  it("chat system không ép Chủ lực@cung", () => {
    expect(CHAT_SYSTEM_INSTRUCTION).not.toMatch(/Chủ lực@|Chủ@Cung/);
    expect(CHAT_SYSTEM_INSTRUCTION).toMatch(/thủ|mạch một nhịp|CẤM Sao@Cung/);
  });
});
