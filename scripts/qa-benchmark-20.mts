/**
 * Benchmark 20 lá — an lá + skeleton prompt (mặc định KHÔNG gọi Gemini).
 *
 * Usage:
 *   npx tsx scripts/qa-benchmark-20.mts
 *   npx tsx scripts/qa-benchmark-20.mts --with-ai   # cần GEMINI_API_KEY + server? (offline build only unless BASE set)
 *
 * Env:
 *   GEMINI_API_KEY — chỉ khi --with-ai và QA_BASE_URL trỏ server
 *   QA_BASE_URL    — mặc định http://127.0.0.1:3000
 *
 * Report: qa-reports/benchmark-20/REPORT.md + REPORT.json
 *
 * Lưu ý: điểm pipeline ≠ % đúng cuộc đời.
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { generateTuviAstrolabe } from "../src/utils/tuvi.ts";
import { buildInterpretPayload } from "../src/hooks/buildInterpretPayload.ts";
import { buildChartPromptContext } from "../src/prompt/buildChartPromptContext.ts";
import { BENCHMARK_20_CHARTS, assertBenchmark20Complete } from "../src/qa/benchmark20Charts.ts";
import { buildScorecard, type BenchmarkScorecard } from "../src/qa/scoreSkeleton.ts";

const OUT = join("qa-reports", "benchmark-20");
const withAi = process.argv.includes("--with-ai");
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const KEY = process.env.GEMINI_API_KEY || process.env.QA_KEY_A || "";

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

assertBenchmark20Complete();

interface Row {
  id: string;
  label: string;
  hourExpected: string;
  hourActual: string;
  hourOk: boolean;
  card: BenchmarkScorecard;
  aiChars?: number;
  error?: string;
}

async function maybeInterpret(payload: any): Promise<string | null> {
  if (!withAi) return null;
  if (!KEY) {
    console.warn("[with-ai] thiếu GEMINI_API_KEY — skip AI");
    return null;
  }
  try {
    const res = await fetch(`${BASE}/api/interpret`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chartData: payload,
        customApiKey: KEY,
        modelSelection: "gemini-3.6-flash",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || res.statusText);
    return String(data?.text || data?.interpretation || data?.content || "");
  } catch (e: any) {
    throw new Error(String(e?.message || e));
  }
}

const rows: Row[] = [];

for (const c of BENCHMARK_20_CHARTS) {
  process.stdout.write(`[${c.id}] ${c.label} ... `);
  try {
    const calc = generateTuviAstrolabe(c.solarDate, c.solarTime, c.birthplace, c.gender);
    const hourActual = calc.tuviGlobalHourResult?.branchName || "?";
    const payload = buildInterpretPayload(calc, c.transitYear);
    const ctx = buildChartPromptContext(payload);
    let aiText: string | null = null;
    if (withAi) {
      aiText = await maybeInterpret(payload);
    }
    const card = buildScorecard(c.id, payload, ctx, aiText);
    const row: Row = {
      id: c.id,
      label: c.label,
      hourExpected: c.expectedHourBranch,
      hourActual,
      hourOk: hourActual === c.expectedHourBranch,
      card,
      aiChars: aiText?.length,
    };
    rows.push(row);
    console.log(
      `pipeline=${card.pipelineOk ? "OK" : "FAIL"} total=${card.total}` +
        (withAi ? ` ai=${card.aiOk}` : ""),
    );
  } catch (e: any) {
    console.log("ERROR", e?.message || e);
    rows.push({
      id: c.id,
      label: c.label,
      hourExpected: c.expectedHourBranch,
      hourActual: "?",
      hourOk: false,
      card: {
        chartId: c.id,
        layers: [],
        total: 0,
        pipelineOk: false,
        aiOk: null,
      },
      error: String(e?.message || e),
    });
  }
}

const okN = rows.filter((r) => r.card.pipelineOk).length;
const avg =
  rows.reduce((s, r) => s + (r.card.total || 0), 0) / Math.max(1, rows.length);
const hourOk = rows.filter((r) => r.hourOk).length;

const json = {
  generatedAt: new Date().toISOString(),
  withAi,
  disclaimer:
    "Điểm pipeline/skeleton ≠ phần trăm đúng cuộc đời. Chỉ đo an lá + sẵn sàng luận + (tuỳ) coverage bài AI.",
  totals: {
    charts: rows.length,
    pipelineOk: okN,
    avgScore: Math.round(avg * 10) / 10,
    hourMatch: hourOk,
  },
  rows,
};

writeFileSync(join(OUT, "REPORT.json"), JSON.stringify(json, null, 2), "utf8");

const tableRows = rows.map((r) => {
  const hour = r.hourOk ? "OK" : `FAIL ${r.hourActual}!=${r.hourExpected}`;
  const pipe = r.card.pipelineOk ? "OK" : "FAIL";
  const ai = r.card.aiOk === null ? "-" : r.card.aiOk ? "OK" : "FAIL";
  return `| ${r.id} | ${r.label.replace(/\|/g, "/")} | ${hour} | ${pipe} | ${r.card.total} | ${ai} |`;
});

const reportMd = [
  "# QA Benchmark 20 la",
  "",
  `- Time: ${json.generatedAt}`,
  `- Mode: ${withAi ? "pipeline + AI interpret" : "pipeline only (no Gemini)"}`,
  `- Pipeline OK: ${okN}/20`,
  `- Avg score: ${json.totals.avgScore}/100`,
  `- Hour branch match: ${hourOk}/20`,
  "",
  `> ${json.disclaimer}`,
  "",
  "| ID | Label | Hour | Pipeline | Total | AI |",
  "|----|-------|------|----------|-------|----|",
  ...tableRows,
  "",
  "## Chay",
  "",
  "```bash",
  "npx tsx scripts/qa-benchmark-20.mts",
  "npx tsx scripts/qa-benchmark-20.mts --with-ai",
  "```",
  "",
  "## Y nghia diem",
  "",
  "- chart_health: an 12 cung, Menh, can nam",
  "- prompt_readiness: Tinh va dap, Tu Hoa, tu tinh hoa, ...",
  "- ai_text: heading + star audit + overclaim (khi --with-ai)",
  "- KHONG phai % dung so phan doi nguoi",
  "",
].join("\n");

writeFileSync(join(OUT, "REPORT.md"), reportMd, "utf8");

console.log(`\nWrote ${join(OUT, "REPORT.md")} | pipeline ${okN}/20 | avg ${json.totals.avgScore}`);
process.exit(okN === 20 ? 0 : 1);
