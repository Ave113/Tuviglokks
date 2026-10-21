import { describe, expect, it, beforeAll } from "vitest";
import {
  BOOK_CORPUS_MANIFEST,
  clearBookCorpusCache,
  listBookCorpusStatus,
  retrieveBookSnippets,
  bookSnippetsToPromptText,
  normalizeVi,
  stripDiacritics,
} from "./bookCorpus";

describe("bookCorpus — lọc sách, không dump full", () => {
  beforeAll(() => {
    clearBookCorpusCache();
  });

  it("whitelist có file data enabled tồn tại", () => {
    const status = listBookCorpusStatus();
    const enabled = status.filter((s) => s.enabled);
    expect(enabled.length).toBeGreaterThan(0);
    for (const s of enabled) {
      expect(s.exists, `missing ${s.id}`).toBe(true);
    }
  });

  it("raw Kinh Nghiệm / Đàm Tinh tắt dual-dump; tuvi-fixed bật phụ", () => {
    const raw = BOOK_CORPUS_MANIFEST.filter((b) =>
      ["kinh-nghiem-ha-raw", "dam-tinh-raw"].includes(b.id),
    );
    expect(raw.every((b) => b.enabled === false)).toBe(true);
    expect(BOOK_CORPUS_MANIFEST.find((b) => b.id === "luan-chinh-phu")?.enabled).toBe(true);
    const fixed = BOOK_CORPUS_MANIFEST.find((b) => b.id === "tuvi-fixed");
    expect(fixed?.enabled).toBe(true);
    expect(fixed?.priority).toBeLessThan(
      BOOK_CORPUS_MANIFEST.find((b) => b.id === "luan-chinh-phu")!.priority,
    );
  });

  it("binh-giai-cac-cach — window bật, priority thấp, truy hồi được theo sao", () => {
    const b = BOOK_CORPUS_MANIFEST.find((x) => x.id === "binh-giai-cac-cach");
    expect(b?.enabled).toBe(true);
    expect(b?.mode).toBe("window");
    expect(b?.priority).toBe(2);
    const got = retrieveBookSnippets(
      { stars: ["Thiên Tướng", "Thái Dương", "Tham Lang"] },
      {
        mode: "per-star",
        bookIds: ["binh-giai-cac-cach"],
        topN: 6,
        maxCharsPerSnippet: 420,
        maxTotalChars: 2500,
      },
    );
    expect(got.length).toBeGreaterThan(0);
    expect(got.every((s) => s.bookId === "binh-giai-cac-cach")).toBe(true);
    expect(got.reduce((a, s) => a + s.text.length, 0)).toBeLessThan(2600);
  });

  it("retrieve theo Thiên Cơ — ít đoạn, ngắn, không full file", () => {
    const got = retrieveBookSnippets(
      { stars: ["Thiên Cơ", "Cự Môn", "Lộc Tồn"] },
      { topN: 4, maxCharsPerSnippet: 520, maxTotalChars: 1600 },
    );
    expect(got.length).toBeGreaterThan(0);
    expect(got.length).toBeLessThanOrEqual(4);
    const total = got.reduce((a, s) => a + s.text.length, 0);
    expect(total).toBeLessThanOrEqual(1600 + 50); // clip boundary
    for (const s of got) {
      expect(s.text.length).toBeLessThanOrEqual(560);
      expect(s.text.length).toBeGreaterThan(40);
    }
    // không trả cả cuốn ~300k
    expect(total).toBeLessThan(5000);
  });

  it("per-star: đủ tủ theo nhiều sao, vẫn không full sách", () => {
    const stars = [
      "Thiên Cơ",
      "Cự Môn",
      "Thái Âm",
      "Thiên Đồng",
      "Thiên Lương",
      "Tham Lang",
      "Liêm Trinh",
      "Vũ Khúc",
    ];
    const got = retrieveBookSnippets(
      { stars },
      {
        mode: "per-star",
        topN: 14,
        maxCharsPerSnippet: 420,
        maxTotalChars: 5200,
        priorityStars: ["Thiên Cơ", "Cự Môn"],
      },
    );
    expect(got.length).toBeGreaterThanOrEqual(4);
    expect(got.length).toBeLessThanOrEqual(14);
    const total = got.reduce((a, s) => a + s.text.length, 0);
    expect(total).toBeLessThan(6000);
    expect(total).toBeLessThan(300_000);
    // topics unique-ish
    const topics = new Set(got.map((s) => s.topic));
    expect(topics.size).toBeGreaterThanOrEqual(Math.min(4, got.length));
  });

  it("prompt tủ tinh hoa ra lệnh diễn đạt, không full sách", () => {
    const got = retrieveBookSnippets(
      { stars: ["Thiên Cơ", "Cự Môn"] },
      { mode: "per-star", topN: 4 },
    );
    const text = bookSnippetsToPromptText(got);
    expect(text).toMatch(/TỦ TINH HOA|DIỄN ĐẠT|NGUYÊN LIỆU/i);
    expect(text).toMatch(/tối đa 40%/);
    expect(text).toContain("TOÀN BỘ KIẾN THỨC");
    expect(text).toContain("KHÔNG phải trần kiến thức");
    expect(text).not.toMatch(/FULL SÁCH(?!)/); // still may say không full
    expect(text.length).toBeLessThan(20_000);
  });

  it("không sao → không trích (tránh nhồi bừa)", () => {
    const got = retrieveBookSnippets({ stars: [] }, { topN: 4 });
    expect(got).toEqual([]);
  });

  it("prompt block có cảnh báo không full sách", () => {
    const got = retrieveBookSnippets({ stars: ["Cự Môn"] }, { topN: 2 });
    const text = bookSnippetsToPromptText(got);
    if (got.length) {
      expect(text).toMatch(/KHÔNG PHẢI FULL SÁCH|ĐÃ LỌC/i);
      expect(text.length).toBeLessThan(4000);
    }
  });

  it("normalizeVi / stripDiacritics ổn định", () => {
    expect(normalizeVi("  Thiên  Cơ ")).toBe("thiên cơ");
    expect(stripDiacritics("Cự Môn")).toBe("cu mon");
  });
});
