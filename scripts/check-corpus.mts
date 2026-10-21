import { retrieveBookSnippets } from "../src/knowledge/bookCorpus.ts";
import { makeChartPayload } from "../src/server/test/fixtures.ts";
import { collectAllMajorStarNames, collectAllAuxStarNames } from "../src/prompt/chartReports.ts";

const c: any = makeChartPayload();
const pal = c.palaces || [];
const stars = [...collectAllMajorStarNames(pal), ...collectAllAuxStarNames(pal)];
const got = retrieveBookSnippets(
  { stars },
  { mode: "per-star", topN: 24, maxCharsPerSnippet: 542, maxTotalChars: 6864, preferStarSections: true }
);
console.log("Tủ tinh hoa:", got.length, "đoạn,", got.reduce((a, s) => a + s.text.length, 0), "ký tự");
console.log("");
for (const s of got) {
  console.log("[" + s.topic + "] từ " + s.bookId);
  console.log("  " + s.text.slice(0, 180).replace(/\n/g, " "));
  console.log("");
}
// Đếm theo book
const byBook = new Map<string, number>();
for (const s of got) byBook.set(s.bookId, (byBook.get(s.bookId) || 0) + 1);
console.log("--- THEO SÁCH ---");
for (const [b, n] of byBook) console.log("  " + b + ": " + n + " đoạn");
