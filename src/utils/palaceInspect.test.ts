import { describe, it, expect } from "vitest";
import { generateTuviAstrolabe } from "./tuvi";
import { analyzeChartForUi, buildPalaceInspectPanel } from "./palaceInspect";
import { palaceIndexToBranchIndex } from "./tuvi";

import { BIRTHPLACE } from "../constants/birthplace";

describe("palaceInspect", () => {
  const { chartIdx, analysis, qualityMap } = analyzeChartForUi(
    generateTuviAstrolabe("2009-06-09", "00:30", BIRTHPLACE.CENTRAL_SOUTH_OF_17, "Nam").chart.palaces,
  );

  it("relations block có nhị hợp và lục hại", () => {
    const menh = chartIdx.palacesArr.find((p) => String(p.name).includes("Mệnh"))!;
    const bi = palaceIndexToBranchIndex(menh.index);
    const panel = buildPalaceInspectPanel(chartIdx, analysis, bi);
    expect(panel?.relationsBlock).toContain("Nhị hợp");
    expect(panel?.relationsBlock).toContain("Lục hại");
    expect(panel?.relationsBlock).toContain("Tam hợp");
  });

  it("Mệnh Ngọ có cách cục liên quan", () => {
    const menh = chartIdx.palacesArr.find((p) => String(p.name).includes("Mệnh"))!;
    const bi = palaceIndexToBranchIndex(menh.index);
    const panel = buildPalaceInspectPanel(chartIdx, analysis, bi);
    expect(panel?.cachCucLines.length).toBeGreaterThan(0);
  });

  it("qualityMap gán thanh cho cung Tài (Tử Phủ miếu/vượng)", () => {
    const tai = chartIdx.palacesArr.find((p) => String(p.name).includes("Tài Bạch"))!;
    const bi = palaceIndexToBranchIndex(tai.index);
    expect(qualityMap[bi]).toBe("thanh");
  });
});