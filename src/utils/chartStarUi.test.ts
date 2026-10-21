import { describe, expect, it } from "vitest";
import {
  collectPalaceStarsForUi,
  isSatStarName,
  palaceVoidKinds,
  resolveHoaBadgeKey,
} from "./chartStarUi";

describe("chartStarUi — UI only", () => {
  it("isSatStarName", () => {
    expect(isSatStarName("Kình Dương")).toBe(true);
    expect(isSatStarName("Thiên Cơ")).toBe(false);
  });

  it("resolveHoaBadgeKey ưu tiên mutagen sao", () => {
    const map = { "thiên cơ": "Hóa Khoa" };
    expect(resolveHoaBadgeKey({ name: "Thiên Cơ", mutagen: "Kỵ" }, map)).toBe("Hóa Kỵ");
    expect(resolveHoaBadgeKey({ name: "Thiên Cơ" }, map)).toBe("Hóa Khoa");
  });

  it("collectPalaceStarsForUi + void kinds", () => {
    const palace = {
      majorStars: [{ name: "Thiên Cơ", brightness: "Miếu", mutagen: "Khoa" }],
      minorStars: [{ name: "Lộc Tồn" }],
      adjectiveStars: [{ name: "Tuần Không" }, { name: "Kình Dương" }],
    };
    const stars = collectPalaceStarsForUi(palace);
    expect(stars.map((s) => s.name)).toEqual([
      "Thiên Cơ",
      "Lộc Tồn",
      "Tuần Không",
      "Kình Dương",
    ]);
    expect(stars[0].layer).toBe("major");
    expect(stars[2].voidKind).toBe("tuan");
    expect(stars[3].isSat).toBe(true);
    expect(palaceVoidKinds(palace)).toContain("tuan");
  });
});
