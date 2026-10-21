/**
 * Dump pipeline luận giải end-to-end (không AI) cho 1 lá benchmark.
 * Output: scripts/out/dump-<id>.md — prompt đầy đủ gửi Gemini + tóm tắt dữ liệu máy.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateTuviAstrolabe } from "../src/utils/tuvi.ts";
import { buildInterpretPayload } from "../src/hooks/buildInterpretPayload.ts";
import { buildChartPromptContext } from "../src/prompt/buildChartPromptContext.ts";
import { buildInterpretUserPrompt } from "../src/prompt/formatInterpretPrompt.ts";
import { BENCHMARK_20_CHARTS } from "../src/qa/benchmark20Charts.ts";

const OUT_DIR = join("scripts", "out");
mkdirSync(OUT_DIR, { recursive: true });

const id = process.argv[2] || "B01";
const c = BENCHMARK_20_CHARTS.find((x) => x.id === id) || BENCHMARK_20_CHARTS[0];

const calc = generateTuviAstrolabe(c.solarDate, c.solarTime, c.birthplace, c.gender);
const payload = buildInterpretPayload(calc, c.transitYear);
const ctx = buildChartPromptContext(payload);
const prompt = buildInterpretUserPrompt(ctx, payload);

const summary = [
  `# Dump pipeline ${c.id}: ${c.label}`,
  `- finalSolarDateUsed: ${calc.finalSolarDateUsed}`,
  `- giờ: ${calc.tuviGlobalHourResult.branchName} (${calc.tuviGlobalHourResult.rangeStr})`,
  `- lunar: ${JSON.stringify(calc.chart.rawDates?.lunarDate)}`,
  `- chineseDate: ${calc.chart.chineseDate}`,
  `- fiveElementsClass: ${calc.chart.fiveElementsClass}`,
  `- can năm sinh (payload): ${payload.birthHeavenlyStem}`,
  `- transitYear: ${payload.transitYear} | tuổi mụ: ${payload.transitLunarAge}`,
  `- Đại hạn: ${payload.transitDecadalPalace} (${payload.transitDecadalRange}) can-chi: ${payload.transitDecadalStem}/${payload.transitDecadalBranch}`,
  `- Tiểu hạn: ${payload.transitYearlyPalace} ages=[${payload.transitTieuHanAges}]`,
  `- Lưu Thái Tuế: ${payload.transitLuuThaiTuePalace} (idx ${payload.transitLuuThaiTueIndex})`,
  `- Tứ Hóa bẩm sinh: ${payload.birthHeavenlyStem ? "resolved" : "MISSING"}`,
  `- Vận Tứ Hóa: ${payload.transitDecadalTuHoa ? "ok" : "null"}`,
  `- Lưu Tứ Hóa: ${payload.transitYearlyTuHoa ? "ok" : "null"}`,
  `- prompt chars: ${prompt.length}`,
  "",
  "--- 12 CUNG PAYLOAD ---",
  ...(payload.palaces as any[]).map((p) => {
    const major = (p.majorStars || []).map((s: any) => `${s.name}${s.brightness ? `(${s.brightness})` : ""}${s.mutagen ? `[${s.mutagen}]` : ""}`).join(" ");
    const minor = (p.minorStars || []).map((s: any) => s.name).join(" ");
    const adj = (p.adjectiveStars || []).map((s: any) => s.name).join(" ");
    return `${p.name} (${p.earthlyBranch}/${p.heavenlyStem})${p.isBodyPalace ? " [THÂN]" : ""}: ${major} | ${minor} | ${adj}`;
  }),
  "",
  "--- BÁT TỰ ---",
  payload.baZi ? JSON.stringify(payload.baZi.pillars?.year) + "\n" + JSON.stringify(payload.baZi.pillars?.month) + "\n" + JSON.stringify(payload.baZi.pillars?.day) + "\n" + JSON.stringify(payload.baZi.pillars?.hour) : "không có",
].join("\n");

writeFileSync(join(OUT_DIR, `summary-${c.id}.md`), summary, "utf8");
writeFileSync(join(OUT_DIR, `prompt-${c.id}.md`), prompt, "utf8");
console.log(`Wrote scripts/out/summary-${c.id}.md + prompt-${c.id}.md (${prompt.length} chars)`);
