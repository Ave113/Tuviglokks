/**
 * DEMO OUTPUT LUẬN GIẢI end-to-end (không AI / không key):
 *  1) Dựng lá thật bằng pipeline dự án (generateTuviAstrolabe → buildInterpretPayload).
 *  2) Render BẢN LUẬN GIẢI SKELETON từ các báo cáo máy (tứ hóa, cách cục, thẻ năm,
 *     trigger, đếm cát/hung, lai nhân, điểm mù) — 100% dữ liệu thật của lá.
 *  3) Đưa bản luận qua CHUỖI HẬU KIỂM thật của server: auditAiStarMentions (chống
 *     bịa sao) + validateInterpretation (Tứ Hóa/năm/Mệnh-Thân) — như /api/interpret.
 *  4) Ghi scripts/out/luan-giai-<id>.md.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateTuviAstrolabe } from "../src/utils/tuvi.ts";
import { buildInterpretPayload } from "../src/hooks/buildInterpretPayload.ts";
import { buildChartPromptContext } from "../src/prompt/buildChartPromptContext.ts";
import { analyzeLuuNienEventCards } from "../src/prompt/luuNienEventCards.ts";
import { buildTemporalTriggerReport } from "../src/prompt/temporalTriggers.ts";
import { auditAiStarMentions, appendStarAuditDisclaimer } from "../src/server/starHallucinationGuard.ts";
import { validateInterpretation } from "../src/server/interpretValidation.ts";
import { processMetadataInText } from "../src/utils/metadataTags.ts";
import { BENCHMARK_20_CHARTS } from "../src/qa/benchmark20Charts.ts";

const OUT_DIR = join("scripts", "out");
mkdirSync(OUT_DIR, { recursive: true });

const id = process.argv[2] || "B01";
const c = BENCHMARK_20_CHARTS.find((x) => x.id === id) || BENCHMARK_20_CHARTS[0];

// — 1) Lá thật —
const calc = generateTuviAstrolabe(c.solarDate, c.solarTime, c.birthplace, c.gender);
const payload = buildInterpretPayload(calc, c.transitYear);
const ctx = buildChartPromptContext(payload);
const yearEvents = analyzeLuuNienEventCards(payload.palaces as any[], payload as any, { maxCards: 5 });
const triggerReport = buildTemporalTriggerReport(ctx.idx, payload.palaces as any[], payload as any);

// — 2) Render luận giải skeleton từ dữ liệu máy (rule-based, không bịa) —
const polLabel = (p: string) => (p === "thuan" ? "thuận" : p === "ap_luc" ? "áp lực" : "hỗn hợp");
const cungLines = (payload.palaces as any[]).map((p) => {
  const major = (p.majorStars || [])
    .map((s: any) => `${s.name}${s.brightness ? ` (${s.brightness})` : ""}${s.mutagen ? ` [${s.mutagen}]` : ""}`)
    .join(" · ") || "Vô Chính Diệu";
  return `- ${p.name} (${p.earthlyBranch})${p.isBodyPalace ? " — đồng cung Thân" : ""}: ${major}`;
});

const cardsText = yearEvents.cards.length
  ? yearEvents.cards
      .map(
        (card, i) =>
          `${i + 1}. **${card.domainLabel} — ${polLabel(card.polarity)}** (nhiệt ${card.heat}): ${card.headline}. ${card.signals.slice(0, 3).join("; ")}. ${card.nen}`,
      )
      .join("\n")
  : "Năm này máy không đúc được thẻ nào nổi — xu hướng êm, bám sao lưu thực có.";

const essay = [
  `# LUẬN GIẢI SKELETON — ${c.label} (năm xem ${payload.transitYear})`,
  ``,
  `> Bản này do **thuật toán máy** của dự án sinh ra (0 token AI): mọi sao/cung/hóa đều khớp lá,`,
  `> đã đi qua chuỗi hậu kiểm thật của server. Khi chạy với Gemini, AI chỉ diễn đạt sâu hơn từ đúng nguyên liệu này.`,
  ``,
  `## Hồ sơ`,
  `- Âm lịch: ${payload.lunarDate} | ${payload.chineseDate}`,
  `- Bản mệnh: ${payload.fiveElementsClass} | Mệnh chủ ${payload.soul} / Thân chủ ${payload.body}`,
  `- Can năm sinh: ${payload.birthHeavenlyStem} (Tứ Hóa bẩm sinh theo can này)`,
  `- Năm xem: ${payload.transitYear} (tuổi mụ ${payload.transitLunarAge}) | Đại hạn: ${payload.transitDecadalPalace} ${payload.transitDecadalRange || ""} | Tiểu hạn: ${payload.transitYearlyPalace} | Lưu Thái Tuế: ${payload.transitLuuThaiTuePalace}`,
  ``,
  `## 1. Bố cục lá (12 cung)`,
  ...cungLines,
  ``,
  `## 2. Tứ Hóa bẩm sinh (can ${payload.birthHeavenlyStem})`,
  ctx.natalTuHoaStr,
  ``,
  `## 3. Cách cục chính tinh (máy detect — dedup)`,
  ctx.cachCucReportStr.split("\n").filter((l) => l.startsWith("[TÓM TẮT") || l.startsWith("    •")).slice(0, 8).join("\n") || "(không khớp cách điển hình — luận theo tổ hợp chính tinh)",
  ``,
  `## 4. Thẻ sự kiện năm ${payload.transitYear} (máy đúc)`,
  `[TÓM NĂM] ${yearEvents.summaryLine}`,
  cardsText,
  ``,
  `## 5. Chuỗi kích hoạt hạn × điểm mù (máy xếp điểm)`,
  triggerReport,
  ``,
  `## 6. Đếm cát/hung trục cốt (Phần định cách dùng)`,
  ctx.phucLocReportStr,
  ``,
  `## 7. Lai Nhân Cung (gốc nghiệp)`,
  ctx.laiNhanReportStr,
].join("\n");

// — 3) Hậu kiểm giống /api/interpret: star audit → validate → metadata —
const audit = auditAiStarMentions(essay, payload as any);
const validated = validateInterpretation(essay, payload as any);
const finalText = processMetadataInText(
  appendStarAuditDisclaimer(validated.text, audit.hallucinated),
  { hideMetadata: false },
);

const report = [
  finalText,
  ``,
  `---`,
  `Hậu kiểm server (chạy thật):`,
  `- Star audit: ${audit.hallucinated.length === 0 ? "SẠCH — mọi sao nêu đều có trên lá" : `CẢNH BÁO: ${audit.hallucinated.join(", ")}`}`,
  `- validateInterpretation: ${validated.issues.length === 0 ? "không phát hiện lệch Tứ Hóa/năm/Mệnh-Thân" : JSON.stringify(validated.issues)}`,
].join("\n");

writeFileSync(join(OUT_DIR, `luan-giai-${c.id}.md`), report, "utf8");
console.log(`Wrote scripts/out/luan-giai-${c.id}.md (${report.length} chars, star-audit=${audit.hallucinated.length} lệch)`);
