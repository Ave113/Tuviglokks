import { describe, it, expect } from "vitest";
import {
  analyzeTrungPhung,
  buildTrungPhungReport,
  trungPhungBonusFor,
} from "./trungPhung";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { BIRTHPLACE } from "../constants/birthplace";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { buildChartPromptContext } from "./buildChartPromptContext";
import { buildChartIndex } from "../utils/chartRelations";
import { analyzeLuuNienEventCards } from "./luuNienEventCards";
import { buildTemporalTriggerReportChat } from "./temporalTriggers";

const P = (
  index: number,
  name: string,
  major: any[] = [],
  minor: any[] = [],
  adj: any[] = [],
  extra: any = {},
) => ({ index, name, majorStars: major, minorStars: minor, adjectiveStars: adj, ...extra });

describe("trungPhung — giao thoa 3 tầng Gốc×Vận×Lưu", () => {
  it("TRÙNG KÌNH: Kình gốc × Lưu Kình đồng cung → pin + bonus", () => {
    const palaces = [
      P(0, "Mệnh", [], [{ name: "Kình Dương" }, { name: "[SAO LƯU] Lưu Kình Dương" }]),
    ];
    const { pins } = analyzeTrungPhung(palaces, {});
    expect(pins.some((p) => p.kind === "TRUNG_KINH" && p.palaceName === "Mệnh")).toBe(true);
    expect(trungPhungBonusFor("Mệnh", pins)).toBeGreaterThan(0);
    expect(trungPhungBonusFor("Tài Bạch", pins)).toBe(0);
  });

  it("SONG LỘC: Lộc Tồn gốc × Lưu Lộc đồng cung → pin", () => {
    const palaces = [
      P(2, "Tài Bạch", [], [{ name: "Lộc Tồn" }, { name: "[SAO LƯU] Lưu Lộc Tồn" }]),
    ];
    const { pins } = analyzeTrungPhung(palaces, {});
    expect(pins.some((p) => p.kind === "SONG_LOC")).toBe(true);
  });

  it("ĐIỆP KỴ: Kỵ bẩm sinh (mutagen) × Vận Hóa Kỵ → pin", () => {
    const palaces = [
      P(4, "Phu Thê", [{ name: "Văn Khúc", mutagen: "Hóa Kỵ" }], [{ name: "[SAO VẬN] Vận Hóa Kỵ" }]),
    ];
    const { pins } = analyzeTrungPhung(palaces, {});
    const pin = pins.find((p) => p.kind === "DIEP_KY");
    expect(pin).toBeTruthy();
    expect(pin!.layers).toContain("gốc");
  });

  it("ĐIỆP KỴ qua Hóa đáp (transitYearlyTuHoa) → pin", () => {
    const palaces = [P(4, "Phu Thê", [{ name: "Văn Khúc", mutagen: "Hóa Kỵ" }], [])];
    const chartData = {
      transitYearlyTuHoa: { items: [{ hoa: "Hóa Kỵ", star: "Văn Khúc", palaceName: "Phu Thê" }] },
    };
    const { pins } = analyzeTrungPhung(palaces, chartData);
    expect(pins.some((p) => p.kind === "DIEP_KY")).toBe(true);
  });

  it("SONG MÃ đồng cung + xung chiếu → pin (xung là viaXung)", () => {
    const near = [P(0, "Mệnh", [], [{ name: "Thiên Mã" }, { name: "[SAO LƯU] Lưu Thiên Mã" }])];
    expect(
      analyzeTrungPhung(near, {}).pins.some((p) => p.kind === "SONG_MA" && !p.viaXung),
    ).toBe(true);
    // index 0 vs 6 = đối xung (branch +6)
    const far = [
      P(0, "Mệnh", [], [{ name: "Thiên Mã" }]),
      P(6, "Thiên Di", [], [{ name: "[SAO VẬN] Vận Mã" }]),
    ];
    const pins = analyzeTrungPhung(far, {}).pins;
    expect(pins.some((p) => p.kind === "SONG_MA" && p.viaXung)).toBe(true);
  });

  it("KHÔI-VIỆT ĐIỆP + THỦY HIỂM → pin", () => {
    const palaces = [
      P(1, "Phu Thê", [], [{ name: "[SAO VẬN] Vận Khôi" }, { name: "[SAO VẬN] Vận Việt" }]),
      P(3, "Tật Ách", [{ name: "Thiên Cơ", mutagen: "Hóa Kỵ" }], [
        { name: "[SAO VẬN] Vận Xương" },
        { name: "[SAO VẬN] Vận Đà" },
      ]),
    ];
    const { pins } = analyzeTrungPhung(palaces, {});
    expect(pins.some((p) => p.kind === "KHOI_VIET_DIEP")).toBe(true);
    expect(pins.some((p) => p.kind === "THUY_HIEM")).toBe(true);
  });

  it("lá êm → không pin + report rỗng có câu luận êm", () => {
    const palaces = [P(0, "Mệnh", [{ name: "Tử Vi" }], [{ name: "Tả Phù" }])];
    const { pins, reportText } = analyzeTrungPhung(palaces, {});
    expect(pins).toEqual([]);
    expect(reportText).toMatch(/Không phát hiện giao thoa/);
  });

  it("report block có header máy ghim + cơ chế CÓ XU HƯỚNG", () => {
    const palaces = [
      P(0, "Mệnh", [], [{ name: "Kình Dương" }, { name: "[SAO LƯU] Lưu Kình Dương" }]),
    ];
    const text = buildTrungPhungReport(palaces, {});
    expect(text).toMatch(/GIAO THOA 3 TẦNG/);
    expect(text).toMatch(/TRÙNG KÌNH/);
    expect(text).toMatch(/CÓ XU HƯỚNG/);
  });

  it("layers chỉ ghi tầng góp mặt (không nhét tầng ngoài cuộc)", () => {
    const palaces = [
      P(2, "Tài Bạch", [], [
        { name: "Lộc Tồn" },
        { name: "[SAO LƯU] Lưu Hồng Loan" },
        { name: "[SAO VẬN] Vận Lộc" },
      ]),
    ];
    const { pins } = analyzeTrungPhung(palaces, {});
    const pin = pins.find((p) => p.kind === "SONG_LOC");
    expect(pin).toBeTruthy();
    expect([...pin!.layers].sort()).toEqual(["gốc", "vận"]);
  });

  it("TANG-HỔ: Tang gốc (vành Tuế Tiền) × Lưu Tang → pin", () => {
    const palaces = [
      P(4, "Quan Lộc", [], [{ name: "[SAO LƯU] Lưu Tang Môn" }], [], { suiqian12: "Tang Môn" }),
    ];
    const { pins } = analyzeTrungPhung(palaces, {});
    const pin = pins.find((p) => p.kind === "TANG_HO");
    expect(pin).toBeTruthy();
    expect(pin!.domain).toBe("viec");
    expect(pin!.mechanism).toMatch(/CÓ XU HƯỚNG/);
  });

  it("SONG HAO: Hao gốc × Hao vành năm → pin", () => {
    const palaces = [
      P(0, "Tài Bạch", [], [], [], { suiqian12: "Đại Hao", yearSuiqian12: "Tiểu Hao" }),
    ];
    const { pins } = analyzeTrungPhung(palaces, {});
    const pin = pins.find((p) => p.kind === "SONG_HAO");
    expect(pin).toBeTruthy();
    expect(pin!.layers).toContain("lưu");
    expect(pin!.domain).toBe("tien");
  });

  it("ĐIỆP QUYỀN/KHOA: Hóa bẩm sinh × Hóa đáp → pin", () => {
    const palaces = [
      P(0, "Tài Bạch", [{ name: "Vũ Khúc", mutagen: "Hóa Quyền" }], []),
      P(6, "Quan Lộc", [{ name: "Văn Xương", mutagen: "Hóa Khoa" }], [{ name: "[SAO VẬN] Vận Hóa Khoa" }]),
    ];
    const chartData = {
      transitYearlyTuHoa: { items: [{ hoa: "Hóa Quyền", star: "Vũ Khúc", palaceName: "Tài Bạch" }] },
    };
    const { pins } = analyzeTrungPhung(palaces, chartData);
    expect(pins.some((p) => p.kind === "DIEP_QUYEN")).toBe(true);
    expect(pins.some((p) => p.kind === "DIEP_KHOA")).toBe(true);
  });

  it("ĐIỆP KHÔI/VIỆT đơn: Khôi/Việt gốc × lưu/vận → pin", () => {
    const palaces = [
      P(0, "Mệnh", [], [{ name: "Thiên Khôi" }, { name: "[SAO LƯU] Lưu Khôi" }]),
      P(6, "Thiên Di", [], [{ name: "Thiên Việt" }, { name: "[SAO VẬN] Vận Việt" }]),
    ];
    const { pins } = analyzeTrungPhung(palaces, {});
    expect(pins.some((p) => p.kind === "DIEP_KHOI")).toBe(true);
    expect(pins.some((p) => p.kind === "DIEP_VIET")).toBe(true);
  });

  it("KỴ XUNG KỴ: Kỵ gốc × Kỵ vận/lưu đối cung → pin vừa", () => {
    const palaces = [
      P(6, "Mệnh", [{ name: "Thiên Cơ", mutagen: "Hóa Kỵ" }], []),
      P(0, "Thiên Di", [], [{ name: "[SAO LƯU] Lưu Hóa Kỵ" }]),
    ];
    const { pins } = analyzeTrungPhung(palaces, {});
    const pin = pins.find((p) => p.kind === "DIEP_KY" && p.viaXung);
    expect(pin).toBeTruthy();
    expect(pin!.heat).toBe(8);
  });

  it("event cards gắn nhãn pin (+0 điểm — không double-count)", () => {
    const palaces = [
      P(0, "Tài Bạch", [], [{ name: "Thiên Mã" }, { name: "[SAO VẬN] Vận Mã" }]),
    ];
    const r = analyzeLuuNienEventCards(palaces as any, { transitYear: 2026 });
    const card = r.cards.find((c) => c.domain === "tien");
    expect(card).toBeTruthy();
    // Chỉ điểm sao Vận Mã (4đ); pin trùng phùng không cộng thêm
    expect(card!.heat).toBe(4);
    expect(card!.signals.some((s) => s.includes("SONG MÃ"))).toBe(true);
  });

  it("chat slim thấy pin (dòng giao thoa lên đầu pulses)", () => {
    const calc = generateTuviAstrolabe("2001-07-08", "05:15", BIRTHPLACE.SOUTH, "Nam");
    const payload = buildInterpretPayload(calc, 2026);
    const idx = buildChartIndex(payload.palaces);
    const s = buildTemporalTriggerReportChat(idx, payload.palaces, payload, 3);
    expect(s).toMatch(/Giao thoa/);
  });

  it("ctx interpret có trungPhungReportStr", () => {
    const calc = generateTuviAstrolabe("2001-07-08", "05:15", BIRTHPLACE.SOUTH, "Nam");
    const payload = buildInterpretPayload(calc, 2026);
    const ctx = buildChartPromptContext(payload);
    expect(typeof ctx.trungPhungReportStr).toBe("string");
    expect(ctx.trungPhungReportStr).toMatch(/GIAO THOA 3 TẦNG/);
  });
});
