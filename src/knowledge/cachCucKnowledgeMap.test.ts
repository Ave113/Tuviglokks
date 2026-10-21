import { describe, it, expect } from "vitest";
import {
  CACH_CUC_KNOWLEDGE_LINKS,
  collectKnowledgeIdsFromPatterns,
  resolveCachCucKnowledge,
  normalizePatternId,
} from "./cachCucKnowledgeMap";
import { GIAI_HOA_KNOWLEDGE } from "./giaiHoaKnowledge";
import { KINH_NGHIEM_KNOWLEDGE } from "./kinhNghiemKnowledge";

describe("cachCucKnowledgeMap", () => {
  it("patternId unique + causal không rỗng", () => {
    const ids = CACH_CUC_KNOWLEDGE_LINKS.map((l) => l.patternId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of CACH_CUC_KNOWLEDGE_LINKS) {
      expect(l.causal.trim().length).toBeGreaterThan(20);
      expect(l.lifeDomains.length).toBeGreaterThan(0);
    }
  });

  it("normalize -dc", () => {
    expect(normalizePatternId("sat-pha-tham-dc")).toBe("sat-pha-tham");
    expect(resolveCachCucKnowledge("sat-pha-tham-dc")?.name).toMatch(/Sát Phá Tham/);
  });

  it("collect kn/gh ids trỏ tới catalog thật (hoặc chấp nhận orphan ghi chú)", () => {
    const ghIds = new Set(GIAI_HOA_KNOWLEDGE.map((e) => e.id));
    const knIds = new Set(KINH_NGHIEM_KNOWLEDGE.map((e) => e.id));
    const { knIds: kn, ghIds: gh } = collectKnowledgeIdsFromPatterns([
      "sat-pha-tham",
      "phu-tuong",
      "co-nguyet-dong-luong",
      "vu-tham",
    ]);
    expect(kn.length + gh.length).toBeGreaterThan(0);
    // ≥70% id resolve được (map có thể ahead catalog)
    const okGh = gh.filter((id) => ghIds.has(id)).length;
    const okKn = kn.filter((id) => knIds.has(id)).length;
    expect(okGh / Math.max(1, gh.length)).toBeGreaterThanOrEqual(0.7);
    expect(okKn / Math.max(1, kn.length)).toBeGreaterThanOrEqual(0.7);
  });

  it("pattern mới (VĐ1): Tử Phủ Vũ Tướng / Vũ Tướng / Cơ Cự resolve + biến thể -dc", () => {
    expect(resolveCachCucKnowledge("tu-phu-vu-tuong")?.name).toBe("Tử Phủ Vũ Tướng");
    expect(resolveCachCucKnowledge("vu-tuong-dc")?.name).toBe("Vũ Tướng");
    expect(resolveCachCucKnowledge("co-cu-dc")?.name).toBe("Cơ Cự");
    const { knIds } = collectKnowledgeIdsFromPatterns(["tu-phu-vu-tuong", "vu-tuong", "co-cu"]);
    expect(knIds).toContain("kn-tu-phu-vu-tuong-toan");
    expect(knIds).toContain("kn-vu-tuong-vo-nghiep");
    expect(knIds).toContain("kn-co-cu-dong");
  });
});
