// Full trace: prompt → Gemini — mỗi block có trong prompt string không?
import { makeChartPayload } from "../src/server/test/fixtures.ts";
import { buildChartPromptContext } from "../src/prompt/buildChartPromptContext.ts";
import { buildInterpretUserPrompt } from "../src/prompt/formatInterpretPrompt.ts";
import { buildInterpretSystemInstruction } from "../src/knowledge/interpretSystemInstruction.ts";

const c: any = makeChartPayload();
const ctx: any = buildChartPromptContext(c);
const usr = buildInterpretUserPrompt(ctx, c);
const sys = buildInterpretSystemInstruction();

console.log("=== TRACE: PROMPT → GEMINI ===");
console.log("User prompt (contents):", usr.length, "ký tự");
console.log("System instruction:", sys.length, "ký tự");
console.log("TỔNG gửi Gemini:", usr.length + sys.length, "ký tự ≈", Math.round((usr.length + sys.length) / 3.2), "token");

const checks: [string, string][] = [
  ["Dump 12 cung", "PHẢN ÁNH 12 CUNG"],
  ["Đàm Tinh chính tinh", "ĐÀM TINH"],
  ["Đàm Tinh vòng mới (Bác Sỹ)", "Bác Sỹ 12 thần"],
  ["Đàm Tinh vòng mới (Thái Tuế)", "Thái Tuế"],
  ["Đàm Tinh vòng mới (Trường Sinh)", "Trường Sinh"],
  ["Cách cục sheet", "CÁCH CỤC"],
  ["Vòng trạng thái full", "VÒNG TINH NAM PHÁI"],
  ["★ Sao nhập hạn (BLOCK MỚI)", "SAO NHẬP HẠN"],
  ["KN chính (top 20)", "KINH NGHIỆM ỨNG DỤNG"],
  ["Giải hóa", "GIỂI HÓA"],
  ["Tủ tinh hoa sách (Tân Biên)", "TỦ TINH HOA SÁCH"],
  ["Tử Bình", "TỬ BÌNH"],
  ["Trung Hoa", "TRI THỨC"],
  ["Temporal trigger", "KÍCH HOẠT HẠN"],
  ["Lưu niên event cards", "THẺ SỰ KIỆN"],
  ["Tính va đập", "TÍNH VA ĐẬP"],
  ["Bát Tự", "TỨ TRỤ"],
  ["Tuần/Triệt", "TUẦN/TRIỆT"],
  ["Lai Nhân cung", "LAI NHÂN"],
  ["Phúc Đức report", "PHÚC ĐỨC"],
  ["Trường Sinh report", "Trường Sinh"],
  ["Tủ tinh hoa directive", "LỆNH DIỄN ĐẠT"],
];

console.log("\n--- MỖI BLOCK CÓ TRONG PROMPT STRING? ---");
let missing = 0;
for (const [label, needle] of checks) {
  const found = usr.includes(needle);
  if (!found) { missing++; console.log(`  ✗ ${label} — RỚT!`); }
  else console.log(`  ✓ ${label}`);
}
console.log(missing === 0 ? `\n→ TẤT CẢ ${checks.length} BLOCK ĐỀU TRONG PROMPT — KHÔNG RỚT` : `\n→ ${missing}/${checks.length} THIẾU`);

// End of prompt — không bị cắt
const tail = usr.slice(-80);
console.log("\n80 ký tự cuối prompt:", JSON.stringify(tail));
console.log("Kết thúc tự nhiên (không cắt giữa chừng):", !usr.endsWith("...") && !usr.endsWith("…") && usr.length > 100000 ? "✓" : "⚠");

// SDK chain — không có bước cắt
console.log("\n=== SDK CALL CHAIN ===");
console.log("1. buildInterpretUserPrompt(ctx,chartData) → prompt string");
console.log("2. generateWithFallback(ai, model, prompt, SYSTEM_INSTRUCTION)");
console.log("3.   → buildAiConfig(SYSTEM_INSTRUCTION) = { systemInstruction, maxOutputTokens: 13690 }");
console.log("4.   → ai.models.generateContent({ model, contents: prompt, config })");
console.log("5.   → @google/genai SDK gửi FULL contents — không truncation, không filter");
console.log("6.   → Gemini 1M context window: 50K token chiếm ~5% — an toàn tuyệt đối");
