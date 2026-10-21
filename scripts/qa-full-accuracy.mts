/**
 * QA đầy đủ: an lá (rule) + /api/interpret + /api/chat.
 * Usage:
 *   npx tsx scripts/qa-full-accuracy.mts [BASE_URL]
 * Env:
 *   QA_KEY_A / QA_KEY_B  — Gemini keys (BYOK)
 *   PORT                 — nếu tự start server (mặc định script expect server sẵn)
 *
 * Không ghi API key ra file report.
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { BIRTHPLACE } from "../src/constants/birthplace.ts";
import { generateTuviAstrolabe, calculateTransitInfo, EARTHLY_BRANCHES } from "../src/utils/tuvi.ts";
import { buildInterpretPayload } from "../src/hooks/buildInterpretPayload.ts";
import { analyzeTuanTriet, computeTuanBranches, computeTrietBranches } from "../src/utils/tuanTriet.ts";
import { buildChartStarWhitelist, auditAiStarMentions } from "../src/server/starHallucinationGuard.ts";
import { normalizeStarName, allStarsOf } from "../src/utils/chartRelations.ts";
import { HOA_LABELS, TU_HOA_BY_STEM, stemNameByYear } from "../src/utils/tuHoa.ts";

const OUT = join("qa-reports", "full-accuracy");
const BASE = process.argv[2] || process.env.QA_BASE_URL || "http://127.0.0.1:3010";
const KEY_A = process.env.QA_KEY_A || process.env.GEMINI_API_KEY || "";
const KEY_B = process.env.QA_KEY_B || KEY_A;

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

type CaseDef = {
  id: string;
  label: string;
  solarDate: string;
  solarTime: string;
  birthplace: (typeof BIRTHPLACE)[keyof typeof BIRTHPLACE];
  gender: "Nam" | "Nữ";
  transitYear: number;
  expectedHour: string;
  apiKey: string;
};

const CASES: CaseDef[] = [
  {
    id: "A",
    label: "Nữ 1988-03-12 22:45 Bắc",
    solarDate: "1988-03-12",
    solarTime: "22:45",
    birthplace: BIRTHPLACE.NORTH,
    gender: "Nữ",
    transitYear: 2026,
    expectedHour: "Hợi",
    apiKey: KEY_A,
  },
  {
    id: "B",
    label: "Nam 2001-07-08 05:15 Nam",
    solarDate: "2001-07-08",
    solarTime: "05:15",
    birthplace: BIRTHPLACE.SOUTH,
    gender: "Nam",
    transitYear: 2026,
    expectedHour: "Mão",
    apiKey: KEY_B || KEY_A,
  },
];

const CHAT_QUESTIONS = [
  "Cung Mệnh có những chính tinh nào?",
  "Tứ Hóa bẩm sinh (Lộc, Quyền, Khoa, Kỵ) rơi vào sao và cung nào?",
  "Năm xem hạn này Đại hạn và Tiểu hạn đang ở cung nào?",
];

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

function push(checks: Check[], name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`  [${mark}] ${name}: ${detail}`);
}

function collectChartStars(palaces: any[]): Set<string> {
  const s = new Set<string>();
  for (const p of palaces || []) {
    for (const st of allStarsOf(p)) {
      const n = normalizeStarName(st?.name);
      if (n) s.add(n);
    }
  }
  return s;
}

async function postJson(path: string, body: unknown, timeoutMs = 600_000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* raw */
    }
    return { status: res.status, text, json, ms: Date.now() - t0 };
  } finally {
    clearTimeout(t);
  }
}

function auditRuleLayer(c: CaseDef) {
  const checks: Check[] = [];
  const calc = generateTuviAstrolabe(c.solarDate, c.solarTime, c.birthplace, c.gender);
  const chart = calc.chart;
  const payload = buildInterpretPayload(calc, c.transitYear);
  const birthYear =
    chart?.rawDates?.lunarDate?.lunarYear ??
    new Date(calc.timezoneNormalization.normalizedDate).getFullYear();

  // Hour
  push(
    checks,
    "giờ địa chi",
    calc.tuviGlobalHourResult.branchName === c.expectedHour,
    `got ${calc.tuviGlobalHourResult.branchName}, expect ${c.expectedHour}`,
  );

  // 12 palaces
  push(checks, "12 cung", chart.palaces?.length === 12, `n=${chart.palaces?.length}`);

  // 14 majors once each
  const majors = [
    "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh",
    "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương",
    "Thất Sát", "Phá Quân",
  ];
  const majorCounts = new Map<string, number>();
  for (const p of chart.palaces) {
    for (const s of p.majorStars || []) {
      const n = String(s.name || "").trim();
      majorCounts.set(n, (majorCounts.get(n) || 0) + 1);
    }
  }
  const majorOk = majors.every((m) => majorCounts.get(m) === 1);
  push(checks, "14 chính tinh ×1", majorOk, [...majorCounts.entries()].filter(([, n]) => n !== 1).join(";") || "ok");

  // Tứ hóa
  const stem = stemNameByYear(birthYear);
  const quartet = TU_HOA_BY_STEM[stem];
  const mutagenMap = new Map<string, string>();
  for (const p of chart.palaces) {
    for (const s of allStarsOf(p)) {
      if (s?.mutagen) mutagenMap.set(String(s.name).trim(), String(s.mutagen).trim());
    }
  }
  const shortHoa = ["Lộc", "Quyền", "Khoa", "Kỵ"];
  let tuHoaOk = true;
  const tuHoaDet: string[] = [];
  quartet.forEach((star, i) => {
    const got = mutagenMap.get(star);
    const exp = shortHoa[i];
    const ok = got === exp || got === HOA_LABELS[i] || String(got || "").includes(exp);
    if (!ok) tuHoaOk = false;
    tuHoaDet.push(`${HOA_LABELS[i]}→${star} mutagen=${got || "∅"}`);
  });
  push(checks, "Tứ Hóa bẩm sinh ↔ mutagen", tuHoaOk, `${stem}: ${tuHoaDet.join("; ")}`);

  // Transit + Lưu Khôi/Việt + Vận
  const branch = EARTHLY_BRANCHES[((birthYear - 4) % 12 + 12) % 12];
  const transit = calculateTransitInfo(birthYear, branch, c.gender, chart.palaces, c.transitYear, chart);
  const allLuu = Object.values(transit.saoLuuMap).flat();
  push(checks, "có Lưu Thái Tuế", allLuu.includes("Lưu Thái Tuế"), allLuu.filter((x) => x.includes("Thái")).join(","));
  push(
    checks,
    "có Lưu Khôi hoặc Lưu Việt",
    allLuu.some((s) => /Lưu Khôi|Lưu Việt/i.test(s)),
    allLuu.filter((s) => /Khôi|Việt/i.test(s)).join(", ") || "none",
  );
  push(
    checks,
    "có sao Vận (đại hạn)",
    allLuu.some((s) => /^Vận\s+/i.test(s)),
    allLuu.filter((s) => /^Vận\s+/i.test(s)).slice(0, 8).join(", ") || "none",
  );
  push(
    checks,
    "Lưu Tứ Hóa đủ 4",
    ["Lưu Hóa Lộc", "Lưu Hóa Quyền", "Lưu Hóa Khoa", "Lưu Hóa Kỵ"].every((h) =>
      allLuu.some((s) => s.startsWith(h)),
    ),
    allLuu.filter((s) => s.startsWith("Lưu Hóa")).join("; "),
  );

  // Tuần Triệt 2+2
  const tt = analyzeTuanTriet(chart.palaces, { birthYear });
  const tuanExp = computeTuanBranches(birthYear);
  const trietExp = computeTrietBranches(birthYear);
  push(
    checks,
    "Tuần khóa 2 cung",
    tt.tuanBranches.length === 2 &&
      tt.tuanBranches[0] === tuanExp[0] &&
      tt.tuanBranches[1] === tuanExp[1],
    `got [${tt.tuanBranches}] exp [${tuanExp}] palaces=${tt.tuanPalaces.join(",")}`,
  );
  push(
    checks,
    "Triệt khóa 2 cung",
    tt.trietBranches.length === 2 &&
      tt.trietBranches[0] === trietExp[0] &&
      tt.trietBranches[1] === trietExp[1],
    `got [${tt.trietBranches}] exp [${trietExp}] palaces=${tt.trietPalaces.join(",")}`,
  );

  // Payload tags
  const minorNames = payload.palaces.flatMap((p: any) => (p.minorStars || []).map((s: any) => s.name));
  push(
    checks,
    "payload có [SAO LƯU]",
    minorNames.some((n: string) => /\[SAO LƯU\]/i.test(n)),
    `count=${minorNames.filter((n: string) => /\[SAO LƯU\]/i.test(n)).length}`,
  );
  push(
    checks,
    "payload có [SAO VẬN]",
    minorNames.some((n: string) => /\[SAO VẬN\]/i.test(n)),
    `count=${minorNames.filter((n: string) => /\[SAO VẬN\]/i.test(n)).length}`,
  );
  push(checks, "birthLunarYear", typeof payload.birthLunarYear === "number", String(payload.birthLunarYear));

  // Whitelist chart-only
  const wl = buildChartStarWhitelist(payload);
  push(checks, "whitelist quét theo lá > 20", wl.size > 20, `size=${wl.size}`);

  // Snapshot files
  writeFileSync(join(OUT, `case-${c.id}.json`), JSON.stringify(payload, null, 2), "utf8");
  writeFileSync(
    join(OUT, `case-${c.id}-audit.json`),
    JSON.stringify(
      {
        label: c.label,
        birthYear,
        stem,
        hour: calc.tuviGlobalHourResult,
        fiveElements: chart.fiveElementsClass,
        soul: chart.soul,
        body: chart.body,
        transit: {
          lunarAge: transit.lunarAge,
          daiHan: transit.daiHanPalaceName,
          tieuHan: transit.tieuHanPalaceName,
          luuThaiTue: transit.luuNienThaiTueName,
          saoLuuSample: allLuu.slice(0, 40),
          hasKhoiViet: allLuu.some((s) => /Lưu Khôi|Lưu Việt/i.test(s)),
          vanStars: allLuu.filter((s) => /^Vận\s+/i.test(s)),
        },
        tuanTriet: {
          tuanBranches: tt.tuanBranches,
          trietBranches: tt.trietBranches,
          tuanPalaces: tt.tuanPalaces,
          trietPalaces: tt.trietPalaces,
          khongVong: tt.khongVongPalaces,
        },
        menh: chart.palaces.find((p: any) => String(p.name).includes("Mệnh")),
      },
      null,
      2,
    ),
    "utf8",
  );

  return { checks, payload, calc, chart, birthYear, transit, tt, stem };
}

function auditInterpretationText(
  text: string,
  payload: any,
  checks: Check[],
  prefix: string,
) {
  const audit = auditAiStarMentions(text, payload);
  push(
    checks,
    `${prefix} starAudit severity`,
    audit.severity !== "retry",
    `severity=${audit.severity} hallucinated=${audit.hallucinated.slice(0, 12).join(", ") || "none"} mentioned=${audit.mentioned.length}`,
  );
  push(
    checks,
    `${prefix} độ dài sớ`,
    text.length >= 800,
    `len=${text.length}`,
  );
  // Structural hints
  const lower = text.toLowerCase();
  push(checks, `${prefix} có đề cập Mệnh`, /mệnh/i.test(text), "keyword Mệnh");
  push(
    checks,
    `${prefix} không chào hỏi lê thê`,
    !/^(chào bạn|cảm ơn|dưới đây là luận)/im.test(text.trim()),
    text.trim().slice(0, 60).replace(/\n/g, " "),
  );

  // If AI mentions a major star, it should be on chart (already in star audit)
  void lower;
  return audit;
}

async function runCase(c: CaseDef) {
  console.log(`\n======== CASE ${c.id}: ${c.label} ========`);
  if (!c.apiKey) {
    console.error("Missing API key for case", c.id);
    return { id: c.id, checks: [{ name: "api key", ok: false, detail: "missing" }] as Check[], ok: false };
  }

  const rule = auditRuleLayer(c);
  const { checks, payload } = rule;

  // --- INTERPRET ---
  console.log(`\n  → POST /api/interpret (timeout 10m)...`);
  const interp = await postJson("/api/interpret", {
    chartData: payload,
    customApiKey: c.apiKey,
    modelSelection: "gemini-3.1-flash-lite", // lite trước cho nhanh; fallback server tự xử lý
  });
  writeFileSync(join(OUT, `resp-${c.id}-interpret-meta.json`), JSON.stringify({
    status: interp.status,
    ms: interp.ms,
    bodyLen: interp.text.length,
    modelUsed: interp.json?.modelUsed,
    starAuditWarning: interp.json?.starAuditWarning,
    error: interp.json?.error,
  }, null, 2));
  writeFileSync(join(OUT, `resp-${c.id}-interpret-raw.txt`), interp.text.slice(0, 500_000), "utf8");

  push(checks, "interpret HTTP 200", interp.status === 200, `status=${interp.status} ms=${interp.ms} err=${interp.json?.error || ""}`);

  let interpretation = "";
  if (interp.status === 200 && interp.json?.interpretation) {
    interpretation = String(interp.json.interpretation);
    writeFileSync(join(OUT, `interp-${c.id}.md`), interpretation, "utf8");
    auditInterpretationText(interpretation, payload, checks, "interpret");
  } else {
    // retry with flash if lite failed
    console.log("  → retry interpret with gemini-3.5-flash...");
    const interp2 = await postJson("/api/interpret", {
      chartData: payload,
      customApiKey: c.apiKey,
      modelSelection: "gemini-3.5-flash",
    });
    writeFileSync(join(OUT, `resp-${c.id}-interpret2-meta.json`), JSON.stringify({
      status: interp2.status, ms: interp2.ms, modelUsed: interp2.json?.modelUsed, error: interp2.json?.error,
    }, null, 2));
    push(checks, "interpret retry HTTP 200", interp2.status === 200, `status=${interp2.status} err=${interp2.json?.error || ""}`);
    if (interp2.json?.interpretation) {
      interpretation = String(interp2.json.interpretation);
      writeFileSync(join(OUT, `interp-${c.id}.md`), interpretation, "utf8");
      auditInterpretationText(interpretation, payload, checks, "interpret");
    }
  }

  // --- CHAT simple questions ---
  const history: { role: string; content: string }[] = [];
  for (let i = 0; i < CHAT_QUESTIONS.length; i++) {
    const q = CHAT_QUESTIONS[i];
    console.log(`\n  → POST /api/chat Q${i + 1}: ${q}`);
    const chat = await postJson("/api/chat", {
      chartData: payload,
      baseInterpretation: interpretation.slice(0, 12000),
      question: q,
      history,
      customApiKey: c.apiKey,
      modelSelection: "gemini-3.1-flash-lite",
    });
    writeFileSync(join(OUT, `chat-${c.id}-q${i + 1}-meta.json`), JSON.stringify({
      status: chat.status, ms: chat.ms, q, error: chat.json?.error, modelUsed: chat.json?.modelUsed,
    }, null, 2));
    const answer = String(chat.json?.answer || chat.json?.reply || chat.json?.interpretation || chat.json?.text || "");
    // try common keys
    let ans = answer;
    if (!ans && chat.json) {
      for (const k of Object.keys(chat.json)) {
        if (typeof chat.json[k] === "string" && chat.json[k].length > 80 && k !== "error") {
          ans = chat.json[k];
          break;
        }
      }
    }
    writeFileSync(join(OUT, `chat-${c.id}-q${i + 1}.md`), `# Q: ${q}\n\n${ans || chat.text.slice(0, 8000)}`, "utf8");
    push(checks, `chat Q${i + 1} HTTP 200`, chat.status === 200, `status=${chat.status} ms=${chat.ms} err=${chat.json?.error || ""}`);
    if (ans.length > 40) {
      const ca = auditAiStarMentions(ans, payload);
      push(
        checks,
        `chat Q${i + 1} starAudit`,
        ca.severity !== "retry",
        `severity=${ca.severity} hallu=${ca.hallucinated.slice(0, 8).join(",") || "none"} len=${ans.length}`,
      );
      // Content relevance rough checks
      if (i === 0) {
        push(checks, `chat Q${i + 1} nhắc chính tinh/Mệnh`, /mệnh|tử vi|thiên|vũ|liêm|tham|cự|phá|sát/i.test(ans), ans.slice(0, 80));
      }
      if (i === 1) {
        push(checks, `chat Q${i + 1} nhắc Hóa/Lộc/Quyền/Khoa/Kỵ`, /hóa\s*(lộc|quyền|khoa|kỵ)|lộc|quyền|khoa|kỵ/i.test(ans), ans.slice(0, 80));
      }
      if (i === 2) {
        push(checks, `chat Q${i + 1} nhắc Đại/Tiểu hạn`, /đại hạn|tiểu hạn|đại vận/i.test(ans), ans.slice(0, 80));
      }
      history.push({ role: "user", content: q });
      history.push({ role: "assistant", content: ans.slice(0, 1000) });
    } else if (chat.status === 200) {
      push(checks, `chat Q${i + 1} có nội dung`, false, `keys=${Object.keys(chat.json || {}).join(",")} len=${ans.length}`);
    }
  }

  const failed = checks.filter((x) => !x.ok);
  const ok = failed.length === 0;
  writeFileSync(
    join(OUT, `summary-${c.id}.json`),
    JSON.stringify(
      {
        id: c.id,
        label: c.label,
        pass: checks.filter((x) => x.ok).length,
        fail: failed.length,
        total: checks.length,
        ok,
        failed,
        checks,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`\n  CASE ${c.id}: ${checks.filter((x) => x.ok).length}/${checks.length} PASS, ${failed.length} FAIL`);
  return { id: c.id, checks, ok, failed };
}

async function main() {
  console.log("QA FULL ACCURACY");
  console.log("BASE=", BASE);
  console.log("KEY_A set=", Boolean(KEY_A), "KEY_B set=", Boolean(KEY_B));
  console.log("OUT=", OUT);

  // health
  try {
    const h = await fetch(BASE, { signal: AbortSignal.timeout(5000) });
    console.log("Server reachability:", h.status);
  } catch (e: any) {
    console.error("Server NOT reachable at", BASE, e?.message);
    console.error("Start server first: PORT=3010 npx tsx server.ts");
    process.exit(10);
  }

  const results = [];
  for (const c of CASES) {
    results.push(await runCase(c));
  }

  const allChecks = results.flatMap((r) => r.checks);
  const report = {
    base: BASE,
    at: new Date().toISOString(),
    cases: results.map((r) => ({
      id: r.id,
      ok: r.ok,
      pass: r.checks.filter((c) => c.ok).length,
      fail: r.checks.filter((c) => !c.ok).length,
      failed: r.failed || r.checks.filter((c) => !c.ok),
    })),
    totals: {
      pass: allChecks.filter((c) => c.ok).length,
      fail: allChecks.filter((c) => !c.ok).length,
      total: allChecks.length,
    },
  };
  writeFileSync(join(OUT, "REPORT.json"), JSON.stringify(report, null, 2), "utf8");

  const md = [
    `# QA Full Accuracy Report`,
    ``,
    `- Time: ${report.at}`,
    `- Base: ${report.base}`,
    `- Totals: **${report.totals.pass}/${report.totals.total} PASS**, ${report.totals.fail} FAIL`,
    ``,
    ...results.map((r) => {
      const fails = r.checks.filter((c) => !c.ok);
      return [
        `## Case ${r.id}`,
        ``,
        `| Check | Result | Detail |`,
        `|---|---|---|`,
        ...r.checks.map((c) => `| ${c.name} | ${c.ok ? "✅" : "❌"} | ${c.detail.replace(/\|/g, "/").slice(0, 120)} |`),
        fails.length ? `\n**Failed:** ${fails.map((f) => f.name).join(", ")}` : `\nAll checks passed.`,
        ``,
      ].join("\n");
    }),
  ].join("\n");
  writeFileSync(join(OUT, "REPORT.md"), md, "utf8");

  console.log("\n========== FINAL ==========");
  console.log(JSON.stringify(report.totals, null, 2));
  console.log("Wrote", join(OUT, "REPORT.md"));
  process.exit(report.totals.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(99);
});
