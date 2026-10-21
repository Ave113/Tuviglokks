// Đo ảnh hưởng khi nâng Đàm Tinh 20→18 và Hạn 18→14 trên lá mẫu.
import { makeChartPayload } from "../src/server/test/fixtures.ts";
import { buildChartPromptContext } from "../src/prompt/buildChartPromptContext.ts";
import { buildInterpretUserPrompt } from "../src/prompt/formatInterpretPrompt.ts";
import { buildInterpretSystemInstruction } from "../src/knowledge/interpretSystemInstruction.ts";

const c: any = makeChartPayload();
const ctx: any = buildChartPromptContext(c);
const usr = buildInterpretUserPrompt(ctx, c);
const sys = buildInterpretSystemInstruction();

console.log("=== SAU NÂNG: Đàm Tinh 18 entry, Hạn 14 mẩu ===");
const aux = String(ctx.damTinhAuxStr);
const han = String(ctx.saoNhapHanStr || "");
const kn = String(ctx.kinhNghiemKnowledgeStr);

console.log("Đàm Tinh AUX:", aux.length, "ký tự /", (aux.match(/- /g) || []).length, "entry");
console.log("Sao nhập hạn:", han.length, "ký tự /", (han.match(/• \[/g) || []).length, "mẩu");
console.log("KN chính:", kn.length, "ký tự /", (kn.match(/• \[/g) || []).length, "mẩu");
console.log("TỔNG prompt:", (usr.length + sys.length), "ký tự ≈", Math.round((usr.length + sys.length) / 3.2), "token");

// Entry mới trong Đàm Tinh
const newS = [
  "Bác Sỹ","Thiên Nguyệt","Thái Tuế","Trường Sinh","Thanh Long","Vong Thần",
  "Bệnh Phù","Hối Khí","Tướng Tinh","Tướng Quân","Lực Sỹ","Tấu Thư","Hỷ Thần",
  "Điếu Khách","Nguyệt Sát","Tuế Dịch","Phan Án","Tức Thần","Chỉ Bối","Quán Tác",
  "Phúc Đức","Tuế Phá","Đế Vượng","Lâm Quan","Quan Đới","Mộ","Thai","Dưỡng",
  "Suy","Bệnh","Tử","Tuyệt",
];
const inAux = newS.filter((s) => aux.includes(s));
console.log("\nEntry mới trong Đàm Tinh:", inAux.length, "/32 →", inAux.join(", "));

// Mẩu hạn trong block
const hanLines = han.split("\n").filter((l: string) => l.startsWith("• ["));
console.log("Mẩu hạn trong block:", hanLines.length);
hanLines.slice(0, 8).forEach((l: string) => console.log("  " + l.replace(/^• \[/, "").replace(/\].*/, "]")));
if (hanLines.length > 8) console.log("  ...+" + (hanLines.length - 8) + " nữa");
