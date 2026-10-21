import { describe, expect, it } from "vitest";
import {
  CHINESE_KNOWLEDGE,
  knowledgeToPromptText,
  retrieveKnowledge,
} from "./chineseKnowledge";
import {
  TU_BINH_KNOWLEDGE,
  retrieveTuBinh,
  tuBinhToPromptText,
} from "./tuBinhKnowledge";

describe("phần C knowledge (chinese + tử bình) — Cấp 3", () => {
  it("catalog đủ dày sau nâng cấp", () => {
    expect(CHINESE_KNOWLEDGE.length).toBeGreaterThanOrEqual(28);
    expect(TU_BINH_KNOWLEDGE.length).toBeGreaterThanOrEqual(32);
  });

  it("id duy nhất trong từng kho", () => {
    const cn = CHINESE_KNOWLEDGE.map((e) => e.id);
    const tb = TU_BINH_KNOWLEDGE.map((e) => e.id);
    expect(new Set(cn).size).toBe(cn.length);
    expect(new Set(tb).size).toBe(tb.length);
  });

  it("mọi entry có tags + content gọn (không rỗng, không quá phình)", () => {
    for (const e of [...CHINESE_KNOWLEDGE, ...TU_BINH_KNOWLEDGE]) {
      expect(e.tags.length).toBeGreaterThan(0);
      expect(e.content.trim().length).toBeGreaterThan(40);
      expect(e.content.length).toBeLessThan(900);
      expect(e.title.trim().length).toBeGreaterThan(3);
    }
  });

  it("retrieveKnowledge luôn kèm nền tảng + tôn trọng topN", () => {
    const got = retrieveKnowledge(
      { stars: ["Thất Sát", "Tử Vi"], shiShen: ["Thất Sát"], elements: ["Hỏa"] },
      10,
    );
    expect(got.length).toBeLessThanOrEqual(10);
    expect(got.length).toBeGreaterThanOrEqual(4);
    const ids = new Set(got.map((e) => e.id));
    expect(ids.has("nguhanh-sinh-khac")).toBe(true);
    expect(ids.has("than-vuong-nhuoc")).toBe(true);
    expect(ids.has("tv-tam-phuong-tu-chinh")).toBe(true);
  });

  it("retrieveTuBinh luôn kèm nền tảng Cấp 3 + khớp Thập Thần", () => {
    const got = retrieveTuBinh(
      { shiShen: ["Chính Tài", "Thất Sát"], elements: ["Thủy"], topics: ["hôn nhân"] },
      13,
    );
    expect(got.length).toBeLessThanOrEqual(13);
    const ids = new Set(got.map((e) => e.id));
    expect(ids.has("tb-vuong-nhuoc")).toBe(true);
    expect(ids.has("tb-dung-than")).toBe(true);
    expect(ids.has("tb-to-hop-thap-than")).toBe(true);
    // Khớp chủ đề/thập thần — ít nhất một mẩu tài/quan/hôn
    expect(
      got.some(
        (e) =>
          /tài|quan|hôn|sát|thập thần|chéo/i.test(e.id + e.title + e.tags.join(" ")),
      ),
    ).toBe(true);
  });

  it("prompt text có header nguồn", () => {
    const cn = knowledgeToPromptText(retrieveKnowledge({ elements: ["Kim"] }, 5));
    const tb = tuBinhToPromptText(retrieveTuBinh({ shiShen: ["Chính Ấn"] }, 6));
    expect(cn).toMatch(/TRI THỨC THAM CHIẾU/);
    expect(tb).toMatch(/TỬ BÌNH/);
    expect(tb).toMatch(/CÓ XU HƯỚNG|Hỷ/);
  });

  it("Cấp 3: có mẩu cầu nối hôn nhân / sức khỏe / tổ hợp", () => {
    const cnIds = new Set(CHINESE_KNOWLEDGE.map((e) => e.id));
    const tbIds = new Set(TU_BINH_KNOWLEDGE.map((e) => e.id));
    expect(cnIds.has("cau-noi-hon-nhan")).toBe(true);
    expect(cnIds.has("cau-noi-suc-khoe")).toBe(true);
    expect(cnIds.has("nhat-chu-10-can")).toBe(true);
    expect(cnIds.has("tv-12-cung-y-nghia")).toBe(true);
    expect(tbIds.has("tb-to-hop-thap-than")).toBe(true);
    expect(tbIds.has("tb-hon-nhan-nam-nu")).toBe(true);
    expect(tbIds.has("tb-suc-khoe-ngu-hanh")).toBe(true);
    expect(tbIds.has("tb-cheo-tat-an-di")).toBe(true);
  });
});
