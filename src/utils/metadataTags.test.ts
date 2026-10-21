import { describe, it, expect } from "vitest";
import { processMetadataInText } from "./metadataTags";

describe("metadataTags", () => {
  const sample = "Kết luận về tài vận [Đồng thuận] cho thấy đương số có xu hướng tích lũy tốt. Năm nay [TÓM NĂM] mở rộng quan hệ.";

  it("ẩn thẻ metadata khi showTags = false", () => {
    const hidden = processMetadataInText(sample, false);
    expect(hidden).not.toContain("[Đồng thuận]");
    expect(hidden).not.toContain("[TÓM NĂM]");
    expect(hidden).toContain("Kết luận về tài vận");
    expect(hidden).toContain("tích lũy tốt");
  });

  it("giữ thẻ metadata khi showTags = true", () => {
    const shown = processMetadataInText(sample, true);
    expect(shown).toContain("[Đồng thuận]");
    expect(shown).toContain("[TÓM NĂM]");
  });
});
