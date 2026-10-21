import { describe, it, expect } from "vitest";
import {
  MULTI_LENSES,
  MULTI_LENS_IDS,
  MULTI_LENS_MARKERS,
  buildMultiLensSystemBlock,
  buildMultiLensFrameworkHint,
} from "./multiLensSynthesis";
import {
  buildInterpretSystemInstruction,
  INTERPRET_SYSTEM_MARKERS,
} from "./interpretSystemInstruction";
import { buildInterpretFrameworkBlock } from "../prompt/interpretFrameworkPrompt";

describe("multiLensSynthesis — 7 dải → 1 chùm", () => {
  it("đủ 7 dải + id unique", () => {
    expect(MULTI_LENSES).toHaveLength(7);
    expect(MULTI_LENS_IDS).toHaveLength(7);
    expect(new Set(MULTI_LENSES.map((l) => l.id)).size).toBe(7);
    const titles = MULTI_LENSES.map((l) => l.title).join(" ");
    expect(titles).toMatch(/Đo lường|Phương pháp/);
    expect(titles).toMatch(/Tâm lý|Chuyển hóa/);
    expect(titles).toMatch(/Định hướng|Cân bằng/);
    expect(titles).toMatch(/Kỹ thuật|Hệ thống/);
    expect(titles).toMatch(/Sắc/);
    expect(titles).toMatch(/Hình tượng/);
    expect(titles).toMatch(/Thực chiến|May đo/);
  });

  it("system block có protocol đan + cấm 7 heading", () => {
    const b = buildMultiLensSystemBlock();
    expect(b).toContain(MULTI_LENS_MARKERS.block);
    expect(b).toContain(MULTI_LENS_MARKERS.formula);
    expect(b).toContain(MULTI_LENS_MARKERS.totalForce);
    expect(b).toContain(MULTI_LENS_MARKERS.noSevenHeadings);
    expect(b).toMatch(/tối thiểu 3 dải/i);
  });

  it("nhúng vào interpret system instruction", () => {
    const s = buildInterpretSystemInstruction();
    expect(s).toContain(INTERPRET_SYSTEM_MARKERS.multiLens);
    expect(s).toContain(MULTI_LENS_MARKERS.totalForce);
    expect(s.indexOf(INTERPRET_SYSTEM_MARKERS.dualArchitecture)).toBeLessThan(
      s.indexOf(INTERPRET_SYSTEM_MARKERS.multiLens),
    );
  });

  it("framework hint + định cách tổng lực", () => {
    const h = buildMultiLensFrameworkHint();
    expect(h).toMatch(/7 dải|ĐA CHIỀU/);
    const fw = buildInterpretFrameworkBlock(2026, { transitLunarAge: 30 }, true);
    expect(fw).toMatch(/đan đa chiều|Tổng lực đa chiều|7 dải/i);
    expect(fw).toMatch(/Tổng lực đa chiều/);
  });
});
