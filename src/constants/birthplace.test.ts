import { describe, it, expect } from "vitest";
import {
  BIRTHPLACE,
  BIRTHPLACE_OPTIONS,
  isGmt8HistoricalRegion,
} from "./birthplace";
import { normalizeToHanoi } from "../utils/tuvi";

describe("birthplace constants", () => {
  it("mọi option dropdown dùng value từ BIRTHPLACE — không hardcode lệch", () => {
    const values = new Set(Object.values(BIRTHPLACE));
    for (const opt of BIRTHPLACE_OPTIONS) {
      expect(values.has(opt.value)).toBe(true);
    }
    expect(BIRTHPLACE_OPTIONS).toHaveLength(values.size);
  });

  it("isGmt8HistoricalRegion khớp normalizeToHanoi 1960–1975", () => {
    for (const birthplace of Object.values(BIRTHPLACE)) {
      const r = normalizeToHanoi("1970-01-15", "12:00", birthplace);
      const expectShift = isGmt8HistoricalRegion(birthplace);
      expect(r.normalizedDate.getHours()).toBe(expectShift ? 11 : 12);
    }
  });
});