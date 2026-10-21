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

/** Sao không có trên lá số — dùng bịa đầu ra AI trong test guard. */
export function starsNotOnChart(
  chartData: ReturnType<typeof makeChartPayload>,
  count = 1,
) {
  const known = buildChartStarWhitelist(chartData);
  return TUVI_STAR_CATALOG.filter((c) => !known.has(c.norm)).slice(0, count);
}

/**
 * Lá thưa: giữ 12 cung + metadata, bỏ sao/vòng.
 * Cần cho test star-guard: lá thật gần như phủ hết catalog → severity chỉ còn soft.
 */
export function makeSparseChartForGuardTest(): ReturnType<typeof makeChartPayload> {
  const full = makeChartPayload();
  return {
    ...full,
    palaces: (full.palaces || []).map((p: any) => ({
      ...p,
      majorStars: [],
      minorStars: [],
      adjectiveStars: [],
      stars: [],
      changsheng12: undefined,
      boshi12: undefined,
      jiangqian12: undefined,
      suiqian12: undefined,
      yearJiangqian12: undefined,
      yearSuiqian12: undefined,
    })),
  };
}

/**
 * Đủ điều kiện severity retry: chính tinh bịa, hoặc ≥3 sao bịa.
 * Ưu tiên chính tinh ngoài whitelist; không đủ thì lấy ≥3 sao catalog ngoài lá.
 */
export function hallucinationTriggerStars(chartData: ReturnType<typeof makeChartPayload>) {
  const known = buildChartStarWhitelist(chartData);
  const missing = TUVI_STAR_CATALOG.filter((c) => !known.has(c.norm));
  const major = missing.find((c) => MAJOR_STAR_NORMS.has(c.norm));
  if (major) return [major];
  if (missing.length >= 3) return missing.slice(0, 3);
  // Lá đầy catalog: caller nên dùng makeSparseChartForGuardTest.
  return missing.length > 0 ? missing : TUVI_STAR_CATALOG.filter((c) => MAJOR_STAR_NORMS.has(c.norm)).slice(0, 3);
}

/** BYOK giả cho test — đủ dài + shape AQ.… để bypass rate-limit (isPlausibleByokKey). */
export const TEST_BYOK_KEY = "AQ.integration-test-byok-key-not-real-xxxxxxxx";
