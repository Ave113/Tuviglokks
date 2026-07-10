import { BIRTHPLACE } from "../../constants/birthplace";
import { buildInterpretPayload } from "../../hooks/buildInterpretPayload";
import { generateTuviAstrolabe } from "../../utils/tuvi";
import { MAJOR_STAR_NORMS, TUVI_STAR_CATALOG } from "../../utils/tuviStarCatalog";
import { buildChartStarWhitelist } from "../starHallucinationGuard";

/** Lá số đủ 12 cung — dùng chung integration test. */
export function makeChartPayload() {
  const calculated = generateTuviAstrolabe("1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
  return buildInterpretPayload(calculated, 2026);
}

/** Sao không có trên lá số — dùng bịa output AI trong test guard. */
export function starsNotOnChart(
  chartData: ReturnType<typeof makeChartPayload>,
  count = 1,
) {
  const known = buildChartStarWhitelist(chartData);
  return TUVI_STAR_CATALOG.filter((c) => !known.has(c.norm)).slice(0, count);
}

/** Đủ điều kiện severity retry: chính tinh bịa, hoặc ≥3 sao bịa. */
export function hallucinationTriggerStars(chartData: ReturnType<typeof makeChartPayload>) {
  const known = buildChartStarWhitelist(chartData);
  const missing = TUVI_STAR_CATALOG.filter((c) => !known.has(c.norm));
  const major = missing.find((c) => MAJOR_STAR_NORMS.has(c.norm));
  if (major) return [major];
  return missing.slice(0, 3);
}

export const TEST_BYOK_KEY = "integration-test-byok-key";