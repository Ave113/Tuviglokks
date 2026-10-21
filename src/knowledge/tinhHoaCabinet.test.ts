import { describe, expect, it } from "vitest";
import { buildTinhHoaCabinet } from "./tinhHoaCabinet";

describe("tinhHoaCabinet", () => {
  it("build cabinet: có directive + tinh hoa theo sao, không phình full sách", () => {
    const cab = buildTinhHoaCabinet({
      majorStars: ["Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương", "Cự Môn"],
      auxStars: ["Địa Không", "Địa Kiếp", "Lộc Tồn", "Tuần"],
      tuHoaStars: ["Hóa Khoa", "Thiên Lương", "Hóa Kỵ", "Văn Khúc"],
      focusStars: ["Thiên Cơ"],
      mode: "interpret",
    });
    expect(cab.cabinetDirectiveStr).toMatch(/DIỄN ĐẠT|BẬC THẦY/i);
    expect(cab.cabinetDirectiveStr).toMatch(/tối đa 40%/);
    expect(cab.cabinetDirectiveStr).toContain("toàn bộ kiến thức");
    expect(cab.cabinetDirectiveStr).toContain("KHÔNG phải trần kiến thức");
    expect(cab.combinedPromptBlock).toContain(cab.cabinetDirectiveStr);
    expect(cab.stats.bookSnippets).toBeGreaterThanOrEqual(3);
    expect(cab.stats.mode).toBe("interpret");
    expect(cab.bookCorpusStr.length).toBeGreaterThan(200);
    expect(cab.bookCorpusStr.length).toBeLessThan(25_000);
    if (cab.giaiHoaKnowledgeStr) {
      expect(cab.giaiHoaKnowledgeStr).toMatch(/GIẢI HÓA|NÊN/i);
    }
  });

  it("mode chat / chat-light gọn hơn interpret", () => {
    const base = {
      majorStars: ["Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương", "Cự Môn", "Tham Lang"],
      auxStars: ["Địa Không", "Địa Kiếp", "Lộc Tồn"],
      tuHoaStars: ["Hóa Khoa", "Hóa Kỵ"],
      focusStars: ["Thiên Cơ"],
    };
    const full = buildTinhHoaCabinet({ ...base, mode: "interpret" });
    const mid = buildTinhHoaCabinet({ ...base, mode: "chat50", query: "tiền bạc bạn bè" });
    const chat = buildTinhHoaCabinet({ ...base, mode: "chat", query: "tiền bạc bạn bè" });
    const light = buildTinhHoaCabinet({ ...base, mode: "chat-light", query: "điểm mù" });
    expect(mid.stats.mode).toBe("chat50");
    expect(mid.stats.bookSnippets).toBeLessThanOrEqual(12);
    expect(mid.cabinetDirectiveStr).toMatch(/CHAT FOLLOW-UP/i);
    expect(mid.combinedPromptBlock.length).toBeLessThanOrEqual(full.combinedPromptBlock.length + 200);
    expect(chat.cabinetDirectiveStr).toMatch(/CHAT FOLLOW-UP/i);
    expect(chat.combinedPromptBlock.length).toBeLessThanOrEqual(full.combinedPromptBlock.length + 200);
    expect(light.stats.bookSnippets).toBeLessThanOrEqual(chat.stats.bookSnippets + 1);
    expect(light.combinedPromptBlock.length).toBeLessThanOrEqual(chat.combinedPromptBlock.length + 100);
  });
});
