import { describe, it, expect } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { generateTuviAstrolabe } from "./tuvi";
import { getBrightnessTier } from "./cachCuc";

/** Ghi nhận brightness thực tế iztro vi-VN — regression khi đổi locale/iztro. */
describe("iztro vi-VN brightness (probe)", () => {
  it("mọi giá trị brightness trên lá thật đều map được tier", () => {
    const charts = [
      generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam"),
      generateTuviAstrolabe("2009-06-09", "00:30", BIRTHPLACE.CENTRAL_SOUTH_OF_17, "Nam"),
    ];
    const values = new Set<string>();
    for (const r of charts) {
      for (const p of r.chart.palaces) {
        for (const s of [...(p.majorStars || []), ...(p.minorStars || [])]) {
          if (s.brightness) values.add(String(s.brightness));
        }
      }
    }
    expect(values.size).toBeGreaterThan(0);
    // iztro@2.5.8 vi-VN: Miếu|Vượng|Đắc|Lợi|Bình|Bất|Hạn (xian dịch "Hạn", không phải "Hãm")
    const unmapped: string[] = [];
    for (const v of values) {
      if (getBrightnessTier(v) === "unknown") unmapped.push(v);
    }
    expect(unmapped, `brightness chưa map: ${unmapped.join(", ")}`).toEqual([]);
  });
});