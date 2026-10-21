/**
 * Agent chấm điểm chất lượng luận giải AI (E2E).
 *
 * Usage:
 *   node scripts/score-ai-agent.mjs
 * Env:
 *   SCORE_API_KEY_1, SCORE_API_KEY_2  — BYOK Gemini (bắt buộc ít nhất 1)
 *   SCORE_BASE_URL                    — default http://127.0.0.1:3000
 *   SCORE_MODEL                       — default gemini-3.5-flash
 *   SCORE_TIMEOUT_MS                  — default 600000 (10 phút / request)
 *
 * Lưu ý: luận giải dài — phải chờ, không timeout sớm.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const require = createRequire(import.meta.url);

// Load project modules via tsx-compiled dynamic import is hard in pure mjs.
// Prefer: spawn node --import tsx for chart build, or inline HTTP + prebuilt payload via child.
// We use child_process with tsx one-liner for payload generation.

import { spawn } from "node:child_process";

const BASE = process.env.SCORE_BASE_URL || "http://127.0.0.1:3000";
const MODEL = process.env.SCORE_MODEL || "gemini-3.5-flash";
const TIMEOUT_MS = Number(process.env.SCORE_TIMEOUT_MS || 600_000);
const KEYS = [
  process.env.SCORE_API_KEY_1,
  process.env.SCORE_API_KEY_2,
].filter((k) => typeof k === "string" && k.trim().length > 0);

const CASES = [
  {
    id: "A",
    label: "Nữ 12/03/1988 22:45 Miền Bắc (Hợi)",
    solarDate: "1988-03-12",
    solarTime: "22:45",
    birthplaceKey: "NORTH",
    gender: "Nữ",
    transitYear: 2026,
  },
  {
    id: "B",
    label: "Nam 08/07/2001 05:15 Miền Nam (Mão)",
    solarDate: "2001-07-08",
    solarTime: "05:15",
    birthplaceKey: "SOUTH",
    gender: "Nam",
    transitYear: 2026,
  },
];

function log(...args) {
  console.log(`[score-agent ${new Date().toISOString().slice(11, 19)}]`, ...args);
}

function runNodeTsx(code) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["tsx", "-e", code],
      { cwd: root, shell: true, env: process.env },
    );
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => {
      out += d.toString();
    });
    child.stderr.on("data", (d) => {
      err += d.toString();
    });
    child.on("close", (codeExit) => {
      if (codeExit !== 0) {
        reject(new Error(`tsx exit ${codeExit}: ${err || out}`));
        return;
      }
      resolve(out);
    });
  });
}

async function buildChartPayload(c) {
  const code = `
import { BIRTHPLACE } from "./src/constants/birthplace.ts";
import { generateTuviAstrolabe } from "./src/utils/tuvi.ts";
import { buildInterpretPayload } from "./src/hooks/buildInterpretPayload.ts";
const calc = generateTuviAstrolabe(
  ${JSON.stringify(c.solarDate)},
  ${JSON.stringify(c.solarTime)},
  BIRTHPLACE[${JSON.stringify(c.birthplaceKey)}],
  ${JSON.stringify(c.gender)},
);
const payload = buildInterpretPayload(calc, ${c.transitYear});
process.stdout.write(JSON.stringify(payload));
`;
  const raw = await runNodeTsx(code);
  // tsx may print warnings — take last JSON line
  const lines = raw.trim().split(/\r?\n/);
  let jsonStr = lines[lines.length - 1];
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith("{")) {
      jsonStr = lines.slice(i).join("\n");
      break;
    }
  }
  return JSON.parse(jsonStr);
}

async function postJson(url, body, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text.slice(0, 500) };
    }
    return { status: res.status, data, ok: res.ok };
  } finally {
    clearTimeout(t);
  }
}

function collectMajorNames(chartData) {
  const names = new Set();
  for (const p of chartData.palaces || []) {
    for (const s of p.majorStars || []) {
      if (s?.name) names.add(String(s.name));
    }
  }
  return [...names];
}

function menhMajors(chartData) {
  const menh = (chartData.palaces || []).find(
    (p) => /Mệnh/i.test(String(p.name || "")) || p.isOriginalPalace,
  );
  // iztro: palace with name containing Mệnh
  const p =
    (chartData.palaces || []).find((x) => String(x.name || "").includes("Mệnh")) ||
    chartData.palaces?.[0];
  return (p?.majorStars || []).map((s) => s.name).filter(Boolean);
}

/** Rubric rule-based (0–100) — không cần LLM. */
function scoreRuleBased(interpretation, chartData, apiMeta) {
  const text = String(interpretation || "");
  const scores = {};
  const notes = [];

  // 1. Độ dài & khung phần (0–20)
  let struct = 0;
  if (text.length >= 2000) struct += 8;
  else if (text.length >= 800) struct += 5;
  else if (text.length >= 200) struct += 2;
  const partHits = [
    /tam\s*phương|thế\s*đứng|bản\s*sắc/i,
    /tứ\s*hóa|phi\s*tinh|hóa\s*lộc|hóa\s*kỵ/i,
    /đại\s*hạn|tiểu\s*hạn|lưu\s*niên|năm\s*20\d{2}/i,
    /phúc\s*đức|cách\s*cục|định\s*cách/i,
    /mệnh|tài\s*bạch|quan\s*lộc|phu\s*thê/i,
  ].filter((re) => re.test(text)).length;
  struct += Math.min(12, partHits * 2.5);
  scores.structure = Math.min(20, Math.round(struct));
  if (text.length < 500) notes.push("Bài ngắn bất thường");

  // 2. Star fidelity từ API (0–25)
  let star = 25;
  const hall = Array.isArray(apiMeta.starHallucinated) ? apiMeta.starHallucinated : [];
  const warn = apiMeta.starAuditWarning;
  if (apiMeta.starAuditRetried) {
    star -= 5;
    notes.push("StarGuard đã retry 1 lần");
  }
  if (hall.length === 0 && !warn) {
    // clean
  } else if (hall.length > 0) {
    star -= Math.min(20, hall.length * 5);
    notes.push(`Sao nghi bịa: ${hall.join(", ")}`);
  } else if (warn) {
    star -= 8;
    notes.push("Có starAuditWarning");
  }
  scores.starFidelity = Math.max(0, star);

  // 3. Grounding chính tinh Mệnh (0–20)
  const majors = menhMajors(chartData);
  const allMajors = collectMajorNames(chartData);
  let grounded = 0;
  let hit = 0;
  for (const m of majors) {
    if (text.includes(m)) hit++;
  }
  if (majors.length === 0) grounded = 10;
  else grounded = Math.round((hit / majors.length) * 14);
  // bonus: ít nhất 3 chính tinh trên lá được nhắc
  const hitAll = allMajors.filter((m) => text.includes(m)).length;
  grounded += Math.min(6, hitAll);
  scores.grounding = Math.min(20, grounded);
  notes.push(`Chính tinh Mệnh nhắc ${hit}/${majors.length || 0}: [${majors.join(", ")}]`);
  notes.push(`Chính tinh lá được nhắc: ${hitAll}/${allMajors.length}`);

  // 4. Không mào đầu (0–10)
  const head = text.slice(0, 120).toLowerCase();
  let open = 10;
  if (/^(chào|xin chào|cảm ơn|dưới đây|hôm nay|bài luận|kính)/i.test(text.trim())) {
    open = 2;
    notes.push("Mở đầu kiểu chào hỏi");
  } else if (/chào bạn|cảm ơn quý/i.test(head)) {
    open = 4;
  }
  scores.opening = open;

  // 5. Ngôn ngữ đời thực (0–15)
  const lifeHits = [
    /lương|tiền|công\s*việc|sức\s*khỏe|tình\s*cảm|học|đầu\s*tư|gia\s*đình|đi\s*lại|quan\s*hệ/i,
  ].filter((re) => re.test(text)).length;
  const fluff = (text.match(/hao\s*tài|gặp\s*xui|rắc\s*rối\s*sự\s*nghiệp/gi) || []).length;
  let life = Math.min(12, lifeHits * 4);
  life += fluff === 0 ? 3 : Math.max(0, 3 - fluff);
  scores.realLife = Math.min(15, life);

  // 6. Vận hạn / năm (0–10)
  let transit = 0;
  if (String(chartData.transitYear || "").length && text.includes(String(chartData.transitYear))) {
    transit += 4;
  }
  if (/đại\s*hạn|tiểu\s*hạn|lưu\s*(niên|lộc|kỵ|quyền)/i.test(text)) transit += 6;
  scores.transit = Math.min(10, transit);

  const total =
    scores.structure +
    scores.starFidelity +
    scores.grounding +
    scores.opening +
    scores.realLife +
    scores.transit;

  return {
    total: Math.min(100, total),
    max: 100,
    breakdown: scores,
    notes,
    meta: {
      length: text.length,
      modelUsed: apiMeta.modelUsed,
      fallbackUsed: !!apiMeta.fallbackUsed,
      starHallucinated: hall,
      starAuditRetried: !!apiMeta.starAuditRetried,
      truncated: !!apiMeta.truncated,
    },
  };
}

/** LLM judge — chấm bổ sung /10 (tùy chọn, dùng cùng BYOK). */
async function scoreWithLlmJudge(apiKey, interpretation, chartSummary) {
  const prompt = `Bạn là giám khảo chấm luận giải Tử Vi AI.
Chỉ trả JSON thuần (không markdown):
{"score":0-10,"strengths":["..."],"weaknesses":["..."],"verdict":"1 câu"}

Tiêu chí: bám lá số, không bịa sao, đời thực, cấu trúc rõ, không sáo rỗng.

TÓM TẮT LÁ:
${chartSummary}

BÀI LUẬN (cắt nếu dài):
${String(interpretation).slice(0, 12000)}
`;

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { temperature: 0.2, maxOutputTokens: 800 },
    });
    const parts = response?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts)
      ? parts.map((p) => (typeof p?.text === "string" ? p.text : "")).join("").trim()
      : "";
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { score: null, raw: text.slice(0, 400), error: "no-json" };
    return JSON.parse(m[0]);
  } catch (e) {
    return { score: null, error: String(e?.message || e) };
  }
}

function chartSummary(chartData) {
  const menh = (chartData.palaces || []).find((p) => String(p.name || "").includes("Mệnh"));
  const majors = (menh?.majorStars || []).map((s) => s.name).join(", ") || "VCD";
  return [
    `Giới tính: ${chartData.gender}`,
    `Dương: ${chartData.solarDate} ${chartData.solarTime}`,
    `Âm/cục: ${chartData.lunarDate} / ${chartData.fiveElementsClass}`,
    `Can năm: ${chartData.birthHeavenlyStem}`,
    `Mệnh chính tinh: ${majors}`,
    `Đại hạn: ${chartData.transitDecadalPalace}, Tiểu hạn: ${chartData.transitYearlyPalace}, năm ${chartData.transitYear}`,
  ].join("\n");
}

async function runCase(c, apiKey, keyIndex) {
  log(`Case ${c.id}: build chart…`);
  const chartData = await buildChartPayload(c);
  log(`Case ${c.id}: POST /api/interpret (key#${keyIndex + 1}, timeout ${TIMEOUT_MS}ms) — chờ luận giải…`);
  const t0 = Date.now();
  const res = await postJson(
    `${BASE}/api/interpret`,
    {
      chartData,
      customApiKey: apiKey,
      modelSelection: MODEL,
    },
    TIMEOUT_MS,
  );
  const ms = Date.now() - t0;
  log(`Case ${c.id}: HTTP ${res.status} sau ${(ms / 1000).toFixed(1)}s`);

  if (!res.ok) {
    return {
      caseId: c.id,
      label: c.label,
      error: res.data?.error || res.data?.raw || `HTTP ${res.status}`,
      status: res.status,
      durationMs: ms,
      ruleScore: null,
      llmJudge: null,
    };
  }

  const interpretation = res.data.interpretation || "";
  const ruleScore = scoreRuleBased(interpretation, chartData, res.data);
  log(`Case ${c.id}: rule score ${ruleScore.total}/100 — gọi LLM judge…`);
  const llmJudge = await scoreWithLlmJudge(apiKey, interpretation, chartSummary(chartData));
  if (llmJudge?.score != null) {
    log(`Case ${c.id}: LLM judge ${llmJudge.score}/10`);
  } else {
    log(`Case ${c.id}: LLM judge lỗi/skip: ${llmJudge?.error || "n/a"}`);
  }

  // Combined: rule 70% + llm 30% (llm 0-10 → 0-100)
  let combined = ruleScore.total;
  if (typeof llmJudge?.score === "number") {
    combined = Math.round(ruleScore.total * 0.7 + (llmJudge.score / 10) * 100 * 0.3);
  }

  return {
    caseId: c.id,
    label: c.label,
    status: res.status,
    durationMs: ms,
    ruleScore,
    llmJudge,
    combinedScore: combined,
    interpretationPreview: interpretation.slice(0, 400),
    interpretationLength: interpretation.length,
  };
}

function gradeLetter(n) {
  if (n == null) return "F";
  if (n >= 90) return "A";
  if (n >= 80) return "B";
  if (n >= 70) return "C";
  if (n >= 60) return "D";
  return "F";
}

async function main() {
  if (KEYS.length === 0) {
    console.error("Thiếu SCORE_API_KEY_1 / SCORE_API_KEY_2");
    process.exit(1);
  }

  log(`Base URL: ${BASE}`);
  log(`Model: ${MODEL}`);
  log(`Keys: ${KEYS.length}`);

  // health: try interpret will fail clearly if server down
  try {
    const ping = await fetch(BASE, { signal: AbortSignal.timeout(5000) });
    log(`Server reachable: HTTP ${ping.status}`);
  } catch (e) {
    console.error(`Không kết nối được server ${BASE}: ${e.message}`);
    console.error("Hãy chạy: npm run dev  (hoặc npm start sau build)");
    process.exit(2);
  }

  const jobs = CASES.map((c, i) => {
    const key = KEYS[i % KEYS.length];
    return runCase(c, key, i % KEYS.length);
  });

  // Song song 2 case nếu 2 key — user đã bảo chờ luận giải
  const results = await Promise.all(jobs);

  const scored = results.filter((r) => r.combinedScore != null);
  const avg =
    scored.length > 0
      ? Math.round(scored.reduce((s, r) => s + r.combinedScore, 0) / scored.length)
      : null;

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    model: MODEL,
    averageCombinedScore: avg,
    averageLetter: gradeLetter(avg),
    results,
  };

  const outDir = path.join(root, "qa-reports");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `score-ai-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  // Markdown summary
  const md = [];
  md.push(`# Báo cáo agent chấm điểm luận giải AI`);
  md.push("");
  md.push(`- Thời điểm: ${report.generatedAt}`);
  md.push(`- Model: \`${MODEL}\``);
  md.push(`- Điểm TB (combined): **${avg ?? "N/A"}/100** (${gradeLetter(avg)})`);
  md.push("");
  for (const r of results) {
    md.push(`## Case ${r.caseId} — ${r.label}`);
    if (r.error) {
      md.push(`- **LỖI:** ${r.error}`);
      md.push(`- HTTP: ${r.status}, ${(r.durationMs / 1000).toFixed(1)}s`);
      md.push("");
      continue;
    }
    md.push(`- Combined: **${r.combinedScore}/100** (${gradeLetter(r.combinedScore)})`);
    md.push(`- Rule-based: ${r.ruleScore.total}/100`);
    md.push(`  - structure ${r.ruleScore.breakdown.structure}/20`);
    md.push(`  - starFidelity ${r.ruleScore.breakdown.starFidelity}/25`);
    md.push(`  - grounding ${r.ruleScore.breakdown.grounding}/20`);
    md.push(`  - opening ${r.ruleScore.breakdown.opening}/10`);
    md.push(`  - realLife ${r.ruleScore.breakdown.realLife}/15`);
    md.push(`  - transit ${r.ruleScore.breakdown.transit}/10`);
    md.push(
      `- LLM judge: ${r.llmJudge?.score != null ? `${r.llmJudge.score}/10` : r.llmJudge?.error || "n/a"}`,
    );
    if (r.llmJudge?.verdict) md.push(`- Verdict: ${r.llmJudge.verdict}`);
    md.push(`- Thời gian luận: ${(r.durationMs / 1000).toFixed(1)}s, độ dài ${r.interpretationLength} ký tự`);
    md.push(`- Model: ${r.ruleScore.meta.modelUsed}${r.ruleScore.meta.fallbackUsed ? " (fallback)" : ""}`);
    if (r.ruleScore.notes?.length) {
      md.push(`- Ghi chú:`);
      for (const n of r.ruleScore.notes) md.push(`  - ${n}`);
    }
    md.push("");
  }
  const mdPath = path.join(outDir, `score-ai-${Date.now()}.md`);
  // reuse same timestamp-ish
  const mdPath2 = outPath.replace(/\.json$/, ".md");
  fs.writeFileSync(mdPath2, md.join("\n"), "utf8");

  console.log("\n========== KẾT QUẢ CHẤM ĐIỂM ==========");
  console.log(`Điểm trung bình: ${avg ?? "N/A"}/100 (${gradeLetter(avg)})`);
  for (const r of results) {
    if (r.error) console.log(`  Case ${r.caseId}: FAIL — ${r.error}`);
    else
      console.log(
        `  Case ${r.caseId}: ${r.combinedScore}/100 (rule ${r.ruleScore.total}, llm ${r.llmJudge?.score ?? "-"}/10) — ${(r.durationMs / 1000).toFixed(0)}s`,
      );
  }
  console.log(`JSON: ${outPath}`);
  console.log(`MD:   ${mdPath2}`);
  console.log("=======================================\n");

  // exit 1 if any fail or avg < 60
  if (results.some((r) => r.error) || (avg != null && avg < 60)) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
