import { describe, expect, it } from "vitest";
import { BIRTHPLACE } from "../constants/birthplace";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { buildInterpretPayload } from "../hooks/buildInterpretPayload";
import { extractBirthHeavenlyStem, normalizeHeavenlyStem } from "../utils/tuHoa";
import { buildChatRouteChartContext } from "./buildChartPromptContext";
import { buildLaiNhanReport } from "./chartReports";
import { buildChatChartContext } from "./formatChatChartContext";

/** Dựng context y như route chat: can năm sinh được khóa trước khi dựng chartContext. */
const buildContext = () => {
  const chartData: any = buildInterpretPayload(
    generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam"),
    2026,
  );
  const canonicalStem =
    extractBirthHeavenlyStem(chartData, chartData?.birthLunarYear) ||
    normalizeHeavenlyStem(chartData?.birthHeavenlyStem);
  if (canonicalStem) chartData.birthHeavenlyStem = canonicalStem;
  const ctx = buildChatRouteChartContext(chartData);
  return buildChatChartContext(ctx, chartData);
};

describe("buildChatChartContext — 4 fact sheet đúc sẵn cho /api/chat", () => {
  const text = buildContext();

  it("có Phi Tứ Hóa Đại Vận 10 năm (đủ dòng Hóa bay theo can Đại hạn)", () => {
    expect(text).toContain("PHI TỨ HÓA ĐẠI VẬN 10 NĂM");
    expect(text).toMatch(/^\s+- Hóa Lộc → .+ \[đóng tại .+\]$/m);
    expect(text).toMatch(/^\s+- Hóa Kỵ → .+ \[đóng tại .+\]$/m);
  });

  it("có Lai Nhân Cung", () => {
    expect(text).toContain("LAI NHÂN CUNG");
    expect(text).toContain("Lai Nhân Cung:");
  });

  it("Lai Nhân VCD có thêm tam phương + xung chiếu để không mỏng", () => {
    const chart: any = buildInterpretPayload(
      generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam"),
      2026,
    );
    const laiNhan = buildLaiNhanReport(chart.palaces, chart.birthHeavenlyStem);
    expect(laiNhan).toContain("Vô Chính Diệu");
    expect(laiNhan).toContain("tam phương");
    expect(laiNhan).toContain("xung chiếu");
  });

  it("có Hai Trục Tài Lộc đủ 2 trục", () => {
    expect(text).toContain("HAI TRỤC TÀI LỘC");
    expect(text).toContain("Trục SINH TÀI");
    expect(text).toContain("Trục THỦ TÀI");
  });

  it("có Máy ghim Giao thoa 3 tầng (pin hoặc thông báo không có)", () => {
    expect(text).toContain("MÁY GHIM GIAO THOA 3 TẦNG");
    expect(text).toMatch(/không phát hiện giao thoa 3 tầng|\d+\.\s\[/im);
  });

  it("khối ghim bản chat KHÔNG tham chiếu 'PHẦN 4' của interpret", () => {
    expect(text).not.toContain("PHẦN 4 BẮT BUỘC");
  });

  it("có Cách cục chạm cung vận (đại hạn/tiểu hạn) — dùng khi hỏi vận hạn", () => {
    expect(text).toContain("CÁCH CỤC CHẠM CUNG VẬN");
  });
});
