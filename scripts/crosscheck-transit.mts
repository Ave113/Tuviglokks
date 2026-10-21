/**
 * Đối chiếu chéo calculateTransitInfo (thuật toán tự viết) với iztro.horoscope().
 * Bất kỳ lệch vị trí sao lưu / đại hạn / tiểu hạn nào đều là lỗi thuật toán.
 */
import { generateTuviAstrolabe, EARTHLY_BRANCHES } from "../src/utils/tuvi.ts";
import { buildInterpretPayload } from "../src/hooks/buildInterpretPayload.ts";
import { BENCHMARK_20_CHARTS } from "../src/qa/benchmark20Charts.ts";
import { normalizeStarName, toBranchIndex } from "../src/utils/chartRelations.ts";

const EQUIV: string[][] = [
  ["lưu lộc tồn", "lưu lộc"],
  ["lưu kình dương", "lưu dương", "lưu kình"],
  ["lưu đà la", "lưu đà"],
  ["lưu thiên mã", "lưu mã"],
  ["lưu văn xương", "lưu xương"],
  ["lưu văn khúc", "lưu khúc"],
  ["lưu hồng loan", "lưu loan"],
  ["lưu thiên hỷ", "lưu hỷ"],
  ["lưu thái tuế", "lưu tuế", "thái tuế"],
];

const same = (a: string, b: string) => {
  const x = normalizeStarName(a);
  const y = normalizeStarName(b);
  if (x === y) return true;
  return EQUIV.some((g) => g.includes(x) && g.includes(y));
};

interface Issue {
  chart: string;
  kind: string;
  detail: string;
}

const issues: Issue[] = [];

for (const c of BENCHMARK_20_CHARTS) {
  const calc = generateTuviAstrolabe(c.solarDate, c.solarTime, c.birthplace, c.gender);
  const payload = buildInterpretPayload(calc, c.transitYear);
  const astrolabe = calc.chart as any;

  const h = astrolabe.horoscope(`${c.transitYear}-06-15`);
  const palaces = calc.chart.palaces as any[];

  // Map iztro yearly stars by branch
  const iztroYearly: Record<number, string[]> = {};
  palaces.forEach((p: any) => {
    iztroYearly[toBranchIndex(p.index)] = [];
  });
  (h.yearly?.stars || []).forEach((arr: any, izIdx: number) => {
    const p = palaces.find((pp: any) => pp.index === izIdx);
    if (!p) return;
    const b = toBranchIndex(p.index);
    for (const s of arr || []) {
      const raw = String(s?.name || "").trim();
      if (!raw) continue;
      iztroYearly[b].push(raw);
    }
  });

  // App's saoLuuMap: labels like "Lưu Hóa Kỵ (Thái Âm)" — strip to star base name
  const appLuu: Record<number, string[]> = {};
  for (const p of payload.palaces as any[]) {
    const b = toBranchIndex(p.index);
    appLuu[b] = appLuu[b] || [];
    for (const s of [...(p.minorStars || []), ...(p.adjectiveStars || [])]) {
      const raw = String(s?.name || "");
      if (!/\[SAO LƯU\]/.test(raw)) continue;
      appLuu[b].push(raw.replace(/\[SAO LƯU\]\s*/g, "").trim());
    }
  }

  // Compare star-by-star for core luu stars
  for (const base of [
    "Lưu Lộc Tồn", "Lưu Kình Dương", "Lưu Đà La", "Lưu Văn Xương", "Lưu Văn Khúc",
    "Lưu Thiên Mã", "Lưu Hồng Loan", "Lưu Thiên Hỷ", "Lưu Thái Tuế",
  ]) {
    const appBranches: number[] = [];
    const iztBranches: number[] = [];
    for (let b = 0; b < 12; b++) {
      if (appLuu[b]?.some((n) => same(n, base))) appBranches.push(b);
      if (iztroYearly[b]?.some((n) => same(n, base))) iztBranches.push(b);
    }
    const aStr = appBranches.map((b) => EARTHLY_BRANCHES[b]).join(",");
    const iStr = iztBranches.map((b) => EARTHLY_BRANCHES[b]).join(",");
    if (aStr !== iStr) {
      issues.push({
        chart: c.id,
        kind: `sao lưu ${base}`,
        detail: `app=[${aStr}] iztro=[${iStr}]`,
      });
    }
  }

  // Đại hạn palace: app dùng decadal.range chứa lunarAge
  const lunarAge = c.transitYear - Number(calc.chart.rawDates?.lunarDate?.lunarYear ?? 0) + 1;
  const appDaiHan = payload.transitDecadalPalace;
  const iztDecadal = palaces.find((p: any) => {
    const r = p.decadal?.range;
    return r && lunarAge >= r[0] && lunarAge <= r[1];
  });
  if (iztDecadal && appDaiHan && appDaiHan !== "Chưa vào Đại Hạn" && appDaiHan !== iztDecadal.name) {
    issues.push({
      chart: c.id,
      kind: "đại hạn cung",
      detail: `app=${appDaiHan} iztro=${iztDecadal.name} (lunarAge=${lunarAge})`,
    });
  }

  // Can đại hạn
  if (iztDecadal && payload.transitDecadalStem && iztDecadal.decadal?.heavenlyStem
    && payload.transitDecadalStem !== iztDecadal.decadal.heavenlyStem) {
    issues.push({
      chart: c.id,
      kind: "đại hạn can",
      detail: `app=${payload.transitDecadalStem} iztro=${iztDecadal.decadal.heavenlyStem}`,
    });
  }

  // Tiểu hạn: iztro palace.ages chứa tuổi mụ; cung tiểu hạn của app phải chứa lunarAge
  const appTieuHan = payload.transitYearlyPalace;
  const appPalace = palaces.find((p: any) => p.name === appTieuHan);
  if (appPalace && Array.isArray(appPalace.ages) && !appPalace.ages.includes(lunarAge)) {
    issues.push({
      chart: c.id,
      kind: "tiểu hạn cung (age không thuộc cung)",
      detail: `app=${appTieuHan} lunarAge=${lunarAge} ages=${JSON.stringify(appPalace.ages)}`,
    });
  }
}

if (issues.length === 0) {
  console.log("CROSSCHECK OK — app khớp iztro trên 20 lá benchmark.");
} else {
  console.log(`CROSSCHECK: ${issues.length} lệch:`);
  for (const i of issues) console.log(`  [${i.chart}] ${i.kind}: ${i.detail}`);
}
