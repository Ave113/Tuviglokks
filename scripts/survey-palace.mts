// Biên per-palace mẩu từ Tân Biên 4.x (Mệnh/Thân) + Sổ Hạ (Tử Tức, Tật Ách, Tiểu hạn)
import { KINH_NGHIEM_KNOWLEDGE } from "../src/knowledge/kinhNghiemKnowledge.ts";

const current = KINH_NGHIEM_KNOWLEDGE.map(e => e.id);
console.log("HIỆN TẠI:", current.length, "mẩu");
console.log("Đã có per-palace mẩu:", current.filter(id =>
  id.includes("palace") || id.includes("cung") || id.includes("menh") || id.includes("than")
).length);

// Mạch A đã biên: 42 mẩu kn-han2-*
// Cần thêm: mẩu per-palace từ Tân Biên 4.x + Sổ Hạ chương hạn/tử tức/tật ách
// Ước tính số mẩu có thể biên thêm:
console.log("\n=== NGUỒN CHƯA BIÊN ===");
console.log("Tân Biên 4.1.x (Nhận định Mệnh-Thân): 19 quy tắc — per-palace Mệnh+Thân");
console.log("Sổ Hạ 'TÍNH ĐẠI TIỂU HẠN': ma trận + cung dưỡng sao (~5 quy tắc)");
console.log("Sổ Hạ 'BÀN VỀ TỬ TỨC': 5 bài học truyền tinh (~5 quy tắc)");
console.log("Sổ Hạ 'BÀN VỀ SAO HUNG SÁT Ở MỆNH': ~2 quy tắc");
console.log("Sổ Hạ 'BÀN VỀ CUNG TẬT ÁCH': Tứ Dũng Tinh (~3 quy tắc)");
console.log("Sổ Hạ 'Tràng Sinh gặp sao xấu': ~2 quy tắc");
console.log("Tổng có thể biên thêm: ~36 mẩu per-palace/hệ thống");
console.log("→ Sau biên: 147 + 36 = ~183 mẩu");
