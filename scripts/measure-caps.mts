import { makeChartPayload } from "../src/server/test/fixtures.ts";
import { buildChartPromptContext } from "../src/prompt/buildChartPromptContext.ts";
const c: any = makeChartPayload();
const ctx: any = buildChartPromptContext(c);
const aux = String(ctx.damTinhAuxStr);
const han = String(ctx.saoNhapHanStr || "");
const newS = [
  "Bác Sỹ","Thiên Nguyệt","Thái Tuế","Trường Sinh","Thanh Long","Vong Thần",
  "Bệnh Phù","Hối Khí","Tướng Tinh","Tướng Quân","Lực Sỹ","Tấu Thư","Hỷ Thần",
  "Điếu Khách","Nguyệt Sát","Tuế Dịch","Phan Án","Tức Thần","Chỉ Bối","Quán Tác",
  "Phúc Đức","Tuế Phá","Đế Vượng","Lâm Quan","Quan Đới","Mộ","Thai","Dưỡng",
  "Suy","Bệnh","Tử","Tuyệt",
];
const inAux = newS.filter((s) => aux.includes(s));
console.log("=== SAU NÂNG maxEntries 20 + hạn topN 18 ===");
console.log("Đàm Tinh AUX:", aux.length, "ký tự /", inAux.length, "/", newS.length, "entry mới →", inAux.join(", "));
console.log("Sao nhập hạn:", han.length, "ký tự /", (han.match(/• \[/g) || []).length, "mẩu (top 18)");
console.log("KN chính:", String(ctx.kinhNghiemKnowledgeStr).length, "ký tự");
