import { describe, it, expect } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import {
  enrichPalaceForPayload,
  normalizeMutagenLabel,
  formatStarForPrompt,
} from "./enrichPalace";
import { HOA_LABELS } from "../utils/tuHoa";

describe("normalizeMutagenLabel", () => {
  it("short iztro → Hóa …", () => {
    expect(normalizeMutagenLabel("Lộc")).toBe("Hóa Lộc");
    expect(normalizeMutagenLabel("Quyền")).toBe("Hóa Quyền");
    expect(normalizeMutagenLabel("Khoa")).toBe("Hóa Khoa");
    expect(normalizeMutagenLabel("Kỵ")).toBe("Hóa Kỵ");
  });

  it("đã đủ Hóa … thì giữ", () => {
    expect(normalizeMutagenLabel("Hóa Kỵ")).toBe("Hóa Kỵ");
  });

  it("rỗng / lạ → undefined", () => {
    expect(normalizeMutagenLabel("")).toBeUndefined();
    expect(normalizeMutagenLabel(null)).toBeUndefined();
  });
});

describe("enrichPalaceForPayload — mutagen trên sao", () => {
  it("map mutagen từ iztro lên majorStars payload", () => {
    const r = generateTuviAstrolabe("1988-03-12", "22:45", BIRTHPLACE.NORTH, "Nữ");
    const payload = buildInterpretPayload(r, 2026);
    const withMut = payload.palaces.flatMap((p) =>
      [...(p.majorStars || []), ...(p.minorStars || [])].filter((s) => s.mutagen),
    );
    // Can Mậu: Lộc Tham Lang, Quyền Thái Âm, Khoa Hữu Bật, Kỵ Thiên Cơ
    expect(withMut.length).toBeGreaterThanOrEqual(3);
    const labels = new Set(withMut.map((s) => s.mutagen));
    for (const h of HOA_LABELS) {
      expect(labels.has(h), `thiếu ${h} trên payload`).toBe(true);
    }
  });

  it("formatStarForPrompt gồm brightness + mutagen", () => {
    expect(formatStarForPrompt({ name: "Thiên Cơ", brightness: "Miếu", mutagen: "Hóa Kỵ" })).toBe(
      "Thiên Cơ (Miếu, Hóa Kỵ)",
    );
    expect(formatStarForPrompt({ name: "Tử Vi" })).toBe("Tử Vi");
  });

  it("enrich mock có mutagen short", () => {
    const p = enrichPalaceForPayload({
      index: 0,
      name: "Mệnh",
      earthlyBranch: "Tý",
      heavenlyStem: "Giáp",
      isBodyPalace: false,
      decadal: { range: [1, 10] },
      majorStars: [{ name: "Liêm Trinh", brightness: "Vượng", mutagen: "Lộc" }],
      minorStars: [],
      adjectiveStars: [],
    });
    expect(p.majorStars[0].mutagen).toBe("Hóa Lộc");
    expect(p.majorStars[0].brightness).toBe("Vượng");
  });
});
