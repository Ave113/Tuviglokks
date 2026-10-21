import { describe, it, expect } from "vitest";
import {
  collectChartStarUniverse,
  computeStarMusicBed,
  starMentionedIn,
} from "./starCoverage";

describe("starMentionedIn — ranh giới chữ + hoa/thường", () => {
  it("khớp đúng tên nguyên chữ", () => {
    expect(starMentionedIn("Phá Toái", "cung có Phá Toái tọa thủ")).toBe(true);
    expect(starMentionedIn("Vong Thần", "Vong Thần án ngữ")).toBe(true);
  });

  it("PHÂN BIỆT hoa/thường — 'Bệnh' sao không khớp 'bệnh tật' văn đời", () => {
    expect(starMentionedIn("Bệnh", "hay gặp bệnh tật triền miên")).toBe(false);
    expect(starMentionedIn("Bệnh", "sao Bệnh đóng cung")).toBe(true);
  });

  it("không khớp khi tên chỉ là tiền tố của từ dài hơn / viết thường", () => {
    expect(starMentionedIn("Đà La", "nghỉ mát ở Đà Lạt")).toBe(false);
    expect(starMentionedIn("Hỷ Thần", "hỷ thần nhỏ trong nhà")).toBe(false);
  });
});

describe("collectChartStarUniverse", () => {
  const palaces = [
    {
      name: "Mệnh",
      majorStars: [{ name: "Tử Vi" }],
      minorStars: [{ name: "[SAO LƯU] Lưu Tuế" }, { name: "Lộc Tồn" }],
      adjectiveStars: [{ name: "[SAO VẬN] Vận Xương" }, { name: "Tử" }, { name: "Phá Toái" }],
    },
  ];

  it("strip tiền tố engine + loại nhãn một âm tiết nhập nhằng", () => {
    const uni = collectChartStarUniverse(palaces as any);
    expect(uni).toContain("Tử Vi");
    expect(uni).toContain("Lưu Tuế");
    expect(uni).toContain("Vận Xương");
    expect(uni).toContain("Phá Toái");
    // "Tử" một âm tiết bị loại
    expect(uni).not.toContain("Tử");
    expect(uni.every((n) => !["Tử", "Suy", "Mộ", "Thai", "Bệnh", "Dưỡng", "Tuyệt"].includes(n))).toBe(true);
  });
});

describe("computeStarMusicBed", () => {
  const palaces = [
    {
      name: "Mệnh",
      majorStars: [{ name: "Thiên Phủ" }],
      minorStars: [{ name: "Lộc Tồn" }],
      adjectiveStars: [{ name: "Phá Toái" }, { name: "[SAO VẬN] Vận Xương" }],
    },
    {
      name: "Phúc Đức",
      majorStars: [],
      minorStars: [],
      adjectiveStars: [{ name: "Niên Giải" }, { name: "Vong Thần" }],
    },
  ];

  it("sao được block nuôi → không vào nhạc nền; sao mồ côi → gom theo cung", () => {
    const ctx = {
      // Đàm Tinh aux chứa Lộc Tồn + Thiên Phủ; Vận Xương phải được block tầng Lưu/Vận nuôi riêng
      damTinhAuxStr: "  - Văn Xương (文昌): ...\n  - Lộc Tồn (祿存): ...",
      damTinhStr: "Thiên Phủ (天府): ...",
      // Niên Giải được Đàm Tinh nuôi
      damTinhAuxStr_2: undefined,
      // Mạch A nhắc đích danh Vận Xương → Vận Xương được tính fed
      saoNhapHanStr: "  - Vận Xương điệp Vận Việt ...",
    };
    // Lưu ý: damTinhAuxStr ở trên thiếu "Niên Giải" — thêm block riêng
    const fullCtx = { ...ctx, damTinhAuxStr: `${ctx.damTinhAuxStr}\n  - Niên Giải (年解): ...` };
    const r = computeStarMusicBed(palaces as any, fullCtx);

    // Fed: Thiên Phủ, Lộc Tồn, Vận Xương (nhờ block tầng Lưu/Vận), Niên Giải
    // Orphan: Phá Toái, Vong Thần
    expect(r.orphanStars).toBe(2);
    expect(r.musicBedStr).toMatch(/SAO NHẠC NỀN/);
    expect(r.musicBedStr).toMatch(/Cung Mệnh: Phá Toái/);
    expect(r.musicBedStr).toMatch(/Cung Phúc Đức: Vong Thần/);
    expect(r.musicBedStr).toMatch(/PHỦ 100%/);
    expect(r.musicBedStr).toMatch(/KHÔNG thành mục riêng/);
    expect(r.fedStars).toBe(4);
    expect(r.totalStars).toBe(6);
  });

  it("mọi sao được nuôi → nhạc nền rỗng", () => {
    const ctx = {
      damTinhStr: "Thiên Phủ ...",
      damTinhAuxStr: "Lộc Tồn ... Văn Xương ... Niên Giải ... Vong Thần ... Phá Toái ...",
      // Vận Xương cần block tầng nhắc đích danh (fed-ảo đã chặn)
      saoNhapHanStr: "Vận Xương ...",
      luuNienReportStr: "Vận Xương ...",
    };
    const r = computeStarMusicBed(palaces as any, ctx);
    expect(r.orphanStars).toBe(0);
    expect(r.musicBedStr).toBe("");
  });

  it("REGRESSION fed-ảo: Vận Xương chỉ có Đàm Tinh Văn Xương → vẫn mồ côi", () => {
    const ctx = {
      damTinhStr: "Thiên Phủ ...",
      // Chỉ có Văn Xương natal, KHÔNG block tầng nào nhắc Vận Xương
      damTinhAuxStr: "Lộc Tồn ... Văn Xương ... Niên Giải ... Vong Thần ... Phá Toái ... Thiên Phủ ...",
    };
    const r = computeStarMusicBed(palaces as any, ctx);
    // Vận Xương phải rơi vào nhạc nền để AI nhắc cơ chế tầng Vận
    expect(r.musicBedStr).toMatch(/Vận Xương/);
    expect(r.orphanStars).toBeGreaterThan(0);
  });
});
