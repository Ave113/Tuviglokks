import fs from "fs";
const t = fs.readFileSync("src/knowledge/kinhNghiemKnowledge.ts", "utf8");
console.log("KN tổng:", (t.match(/id:\s*"kn-/g) || []).length, "mẩu");
console.log("kn-pp-:", (t.match(/id:\s*"kn-pp-/g) || []).length, "mẩu per-palace");
console.log("kn-han2-:", (t.match(/id:\s*"kn-han2-/g) || []).length, "mẩu hạn-per-star");
