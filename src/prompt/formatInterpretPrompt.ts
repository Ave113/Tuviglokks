import { buildRelationsBlock } from "../utils/chartRelations";
import {
  buildInterpretFrameworkBlock,
  buildLuuNguyetCheatSheetBlock,
  interpretPartNumbers,
} from "./interpretFrameworkPrompt";
import type { ChartPromptContext } from "./types";

/** Build the full interpret user prompt from shared context + raw chart data. */
export const buildInterpretUserPrompt = (ctx: ChartPromptContext, chartData: any): string => {
  const {
    idx,
    genderStr,
    transitYearNum,
    luuNienStem,
    decadalStem,
    natalTuHoaResolved,
    bodyPalaceStr,
    schoolMetaStr,
    decorativeRingsStr,
    natalTuHoaStr,
    stressReportStr,
    tuanTrietReportStr,
    luuNienReportStr,
    decadalFlyingStr,
    luuNienFlyingStr,
    tuHoaReportStr,
    cachCucReportStr,
    laiNhanReportStr,
    haiTrucTaiLocStr,
    phucDucReportStr,
    luuNguyetReportStr,
    truongSinhReportStr,
    phucLocReportStr,
    damTinhStr,
    damTinhAuxStr,
    damTinhTuHoaGeneralStr,
    damTinhTuHoaDetailStr,
    baZiStr,
    chineseKnowledgeStr,
    tuBinhKnowledgeStr,
    kinhNghiemKnowledgeStr,
  } = ctx;

  const { phucDucPart, dinhCachPart } = interpretPartNumbers();
  const luuNguyetCheatSheet = buildLuuNguyetCheatSheetBlock(luuNguyetReportStr);
  const interpretFramework = buildInterpretFrameworkBlock(transitYearNum, chartData, natalTuHoaResolved);

  return `--- DỮ LIỆU THÔNG TIN LÁ SỐ ĐƯƠNG SỐ ---
- Giới tính: ${genderStr}
- Ngày dương lịch: ${chartData.solarDate} (Giờ sinh: ${chartData.solarTime})
- Ngày âm lịch: ${chartData.lunarDate} (Cơ Bản: ${chartData.chineseDate})
- Bản mệnh / Cục: ${chartData.fiveElementsClass}
- Cầm tinh / Chòm sao: Sinh năm ${chartData.zodiac} - Chòm sao ${chartData.sign}
- Mệnh chủ: ${chartData.soul} | Thân chủ: ${chartData.body}
- Thiên can năm sinh (dùng để áp Tứ Hóa bẩm sinh): ${chartData.birthHeavenlyStem || "Chưa rõ"}
- Năm xem vận hạn chủ lực: ${transitYearNum}
- Tuổi mụ khi xem hạn: ${chartData.transitLunarAge || "Chưa rõ"} tuổi
- Cung Đại hạn (100 năm): Cung ${chartData.transitDecadalPalace || "Chưa rõ"}
- Cung Tiểu hạn (1 năm): Cung ${chartData.transitYearlyPalace || "Chưa rõ"}
- Cung Lưu niên Thái tuế: Cung ${chartData.transitLuuThaiTuePalace || "Chưa rõ"}

--- TRƯỜNG PHÁI & ENGINE ---
${schoolMetaStr}

${decorativeRingsStr ? `${decorativeRingsStr}\n\n` : ""}--- CUNG THÂN (TRỌNG TÂM — ĐỐI CHIẾU VỚI CUNG MỆNH) ---
${bodyPalaceStr}

--- PHẢN ÁNH 12 CUNG VỊ & TOÀN BỘ SAO TRÊN LÁ SỐ ---
${chartData.palaces.map((p: any) => {
  const major = (p.majorStars || []).map((s: any) => `${s.name} (${s.brightness || ''})`).join(", ");
  const minor = (p.minorStars || []).map((s: any) => s.name).join(", ");
  const adj = (p.adjectiveStars || []).map((s: any) => `${s.name}${s.type ? ` (${s.type})` : ""}`).join(", ");
  const decadalRange = p.decadal?.range;
  const decadalStr = Array.isArray(decadalRange)
    ? `Từ ${decadalRange[0]} tuổi đến ${decadalRange[1]} tuổi`
    : "Chưa rõ";
  return `Cung thứ ${p.index + 1}: ${p.name} (Địa chi ${p.earthlyBranch}, Thiên can ${p.heavenlyStem})${p.isBodyPalace ? " - [CUNG THÂN ĐỒNG CUNG]" : ""}
  - Chính tinh: ${major || "Không có (Cung Vô Chính Diệu)"}
  - Cát tinh / Lộc mã / Trợ tinh / Sao lưu: ${minor || "Không"}
  - Sát tinh / Hung tinh / Tạp tinh phụ: ${adj || "Không"}
  - Vòng Trường Sinh 12: ${p.changsheng12 || "Chưa rõ"}
  - Vòng Bác Sỹ 12: ${p.boshi12 || "Chưa rõ"}
  - Vòng Tướng Tiền 12: ${p.jiangqian12 || "Chưa rõ"}
  - Vòng Tuế Tiền 12: ${p.suiqian12 || "Chưa rõ"}
  - Đại hạn: ${decadalStr}
${buildRelationsBlock(idx, p)}
`;
}).join("\n")}

--- BẢNG QUAN HỆ HÌNH HỌC ĐÃ ĐƯỢC HỆ THỐNG TÍNH SẴN (DÙNG TRỰC TIẾP, KHÔNG TỰ TÍNH LẠI INDEX) ---
Mỗi cung ở trên đã kèm sẵn các dòng: Xung chiếu, Tam hợp, Nhị hợp, Lục hại và Phi Tứ Hóa (đường bay Lộc/Quyền/Khoa/Kỵ cùng cung đích nơi sao thụ hóa đang đóng). Đây là dữ liệu CHÍNH XÁC do máy tính toán theo đúng hệ địa chi. Khi luận giải bất kỳ cung nào, hãy BÁM SÁT các dòng quan hệ này để ghép đúng sao của đúng cung, TUYỆT ĐỐI không tự nhẩm lại chỉ số index.

QUY TẮC CHỐNG BỊA SAO (BẮT BUỘC): Trước khi luận mỗi cung, chỉ được nhắc tới các sao đã thực sự xuất hiện trong dữ liệu cung đó hoặc trong các dòng quan hệ tam phương tứ chính đã liệt kê. Nếu một sao không có trong dữ liệu được cung cấp, NGHIÊM CẤM nhắc tới hay suy diễn nó tồn tại.

CÁCH DÙNG CHEAT SHEET ĐÚNG TINH THẦN (QUAN TRỌNG): Các bảng cheat sheet (vùng sát kỵ, sao lưu niên, phi tứ hóa) chỉ là LƯỚI AN TOÀN giúp bạn KHÔNG BỎ SÓT dữ kiện, KHÔNG phải để đọc mộc rồi liệt kê khô khan. Bạn VẪN PHẢI tự liên kết linh hoạt toàn cục lá số: đan cài chính tinh với trợ tinh, bối cảnh tam phương tứ chính, nhị hợp lục hại và chất nhân duyên sâu xa, giữ trọn sự uyển chuyển nghệ thuật của một Minh Sư thực thụ.

--- TỨ HÓA BẨM SINH (NATAL) ---
${natalTuHoaResolved
  ? `Dựa trên Thiên can năm sinh (${chartData.birthHeavenlyStem}), hệ thống đã tra sẵn 4 sao thụ phong Tứ Hóa bẩm sinh cùng cung vị chúng đang đóng. Đây là dữ liệu CHÍNH XÁC đã tính sẵn, DÙNG TRỰC TIẾP, KHÔNG tự tra lại bảng can:`
  : `LƯU Ý: Hệ thống CHƯA tính sẵn được Tứ Hóa bẩm sinh (thiếu Thiên can năm sinh chuẩn). Trong trường hợp này, nếu xác định được can năm sinh từ dữ liệu khác, bạn được phép suy luận Tứ Hóa một cách THẬN TRỌNG và ghi rõ đây là suy luận (không phải dữ liệu tính sẵn). Nếu không chắc chắn, hãy nói rõ là chưa đủ dữ liệu thay vì bịa:`}
${natalTuHoaStr}

--- CHEAT SHEET: VÙNG ÁP LỰC SÁT/KỴ TINH (HỆ THỐNG QUÉT SẴN) ---
Dưới đây là các cung đang gánh sát tinh/kỵ tinh cực đoan. Khi luận tới các cung này, BẮT BUỘC mổ xẻ kỹ điểm mù và rủi ro sụp đổ tại đây. Chỉ dùng đúng các sao đã liệt kê, không tự thêm:
${stressReportStr}

--- CHEAT SHEET: TUẦN / TRIỆT / KHÔNG VONG (HỆ THỐNG QUÉT SẴN TỪ SAO ENGINE) ---
Hệ thống đã quét 12 cung và chỉ liệt kê nơi THỰC SỰ có sao Tuần/Triệt/Không Vong (iztro an sẵn). Dùng để hiệu chỉnh mức phát cách cục, định cách phú quý, và luận Mệnh–Tài–Quan — KHÔNG phải để kể lể khô. BẮT BUỘC:
  (1) Chỉ nói Tuần/Triệt/Không Vong đúng các cung trong danh sách; cấm gán sang cung khác.
  (2) Phân biệt Tuần (giảm lực) ≠ Triệt (chặn lộ) ≠ Không Vong (hư không) ≠ Địa Không/Địa Kiếp.
  (3) Có Tuần/Triệt ở cung trọng → hạ giọng mức phú quý/phát (vẫn có thể khen điểm sáng còn lại).
${tuanTrietReportStr}

--- CHEAT SHEET: SAO LƯU NIÊN GOM THEO CUNG (HỆ THỐNG QUÉT SẴN) ---
Dùng trực tiếp cho phần luận Tiểu hạn năm. Đây là toàn bộ sao lưu niên đã đánh dấu, gom theo cung:
${luuNienReportStr}

--- PHI TỨ HÓA ĐỘNG (DÙNG CHO LUẬN VẬN HẠN — KHÔNG DÙNG PHI HÓA TĨNH BẨM SINH) ---
Phi Tứ Hóa tĩnh in trong từng cung ở trên chỉ phản ánh cấu trúc BẨM SINH. Khi luận Đại vận và Tiểu hạn năm, PHẢI dùng hai đường bay động dưới đây (hệ thống đã tính sẵn) vì đây mới là dòng khí đang trôi chảy của vận trình:

* Phi Tứ Hóa Đại vận (theo can cung Đại hạn${decadalStem ? ` — can ${decadalStem}` : ""}):
${decadalFlyingStr}

* Phi Tứ Hóa Lưu niên (theo can năm ${transitYearNum} — can ${luuNienStem}):
${luuNienFlyingStr}

--- CHEAT SHEET: TỰ HÓA 自化 (HỆ THỐNG PHÁT HIỆN SẴN — TINH THẦN TRUNG CHÂU PHÁI) ---
Tự Hóa là khi can của CHÍNH cung phi hóa mà sao thụ hóa đóng ngay TRONG cung đó (sao tự hóa về mình), khác với phi hóa sang cung khác. Cổ nhân Trung Châu Phái coi Tự Hóa là điểm năng lượng tự phát lộ / tự tiêu hao ngay tại cung: Tự Hóa Lộc Quyền Khoa dễ phát nhưng dễ tản, Tự Hóa Kỵ là tự chuốc hao tổn/chấp niệm từ bên trong. Khi luận cung có Tự Hóa, hãy nhấn mạnh sắc thái "tự thân sinh ra" này. Dữ liệu đã tính sẵn:
${tuHoaReportStr}

--- CHEAT SHEET: CÁCH CỤC CHÍNH TINH (HỆ THỐNG NHẬN DIỆN SẴN — ĐA TRỤC + MIẾU/HÃM) ---
Hệ thống đã quét 6 trục, gắn nhãn [cách thành / cách trung bình / cách phá / cách hãm] theo miếu/hãm thực tế trên lá số, và dedup (mỗi cách chỉ giữ một trục ưu tiên). DÙNG TRỰC TIẾP tag quality + ghi chú brightness; KHÔNG tự nhận diện lại hay đổi mức cách. Nếu ghi "chưa khớp" hoặc "Vô Chính Diệu", TUYỆT ĐỐI không tự gán tên cách cục:
${cachCucReportStr}

--- CHEAT SHEET: LAI NHÂN CUNG (HỆ THỐNG PHÁT HIỆN SẴN — GỐC NGHIỆP) ---
Lai Nhân Cung là cung mang Thiên can trùng với can năm sinh — cổ nhân coi đây là nguồn cơn phát ra toàn bộ tứ hóa bẩm sinh, phản ánh gốc rễ nghiệp quả và động cơ sâu xa nhất của đương số. Khi luận bản sắc (Phần 1), hãy soi cung này để chỉ ra căn nguyên mọi lựa chọn và ám ảnh của đương số bắt rễ từ đâu. Dữ liệu tính sẵn:
${laiNhanReportStr}

--- CHEAT SHEET: HAI TRỤC TÀI LỘC (HỆ THỐNG GOM SẴN) ---
Tách bạch hai năng lực khác nhau: trục SINH TÀI (Mệnh-Tài-Quan) là cách KIẾM tiền/tạo dòng tiền; trục THỦ TÀI (Phúc-Tài-Điền) là cách GIỮ của/tích sản. Khi luận tiền tài, BẮT BUỘC phân biệt rõ: đương số kiếm giỏi mà không giữ được, hay giữ chắc mà khó bứt phá, căn cứ vào sao thực ở từng trục:
${haiTrucTaiLocStr}

--- CHEAT SHEET: CỤM SAO PHÚC ĐỨC (HỆ THỐNG TÓM SẴN) ---
Phúc Đức là trục phúc báo, chất lượng tinh thần, mức độ an/bất an nội tại và khả năng hưởng thụ của đương số — cực trọng theo Trung Châu Phái. Dùng cho Phần ${phucDucPart}:
${phucDucReportStr}

${luuNguyetCheatSheet}--- CHEAT SHEET: VÒNG TRƯỜNG SINH (THẾ ĐẤT SAO MẠNH/YẾU — HỆ THỐNG GOM SẴN) ---
Mỗi cung trọng yếu đứng ở một thế đất của vòng Tràng Sinh 12. Nguyên tắc: sao dù tốt nhưng đóng cung YẾU (Tử/Tuyệt/Mộ/Bệnh/Suy/Thai) thì giảm lực, dễ HỮU DANH VÔ THỰC; đóng cung MẠNH (Trường Sinh/Đế Vượng/Lâm Quan/Quan Đới) thì phát huy trọn vẹn. Dùng để hiệu chỉnh mức độ mạnh/yếu khi luận sao ở Phần 1, Phần 2 và Phần ${dinhCachPart} (định cách phú quý) — tránh khen quá lời sao tốt đang ở thế đất suy:
${truongSinhReportStr}

--- CHEAT SHEET: ĐẾM CÁT/HUNG ĐỊNH CÁCH PHÚ QUÝ (HỆ THỐNG ĐẾM SẴN) ---
Hệ thống đã đếm số cát tinh phúc lộc và hung sát tinh ở tam phương trục cốt (Mệnh-Tài-Quan + xung chiếu + Phúc Đức). Đây là cơ sở KHÁCH QUAN để chấm tầng phúc lộc tổng thể ở Phần ${dinhCachPart} (định cách phú quý); con số chỉ là gợi ý, phải đặt trong bối cảnh miếu/hãm, cách cục và thế đất Tràng Sinh để luận cho đúng, KHÔNG chỉ đếm số rồi kết luận máy móc:
${phucLocReportStr}

--- TINH TÌNH CHÍNH TINH THEO ĐÀM TINH (TRUNG CHÂU PHÁI — VƯƠNG ĐÌNH CHI) ---
Dưới đây là tính chất (tinh tình) của các CHÍNH TINH thực sự có trên lá số này, trích từ bộ 《王亭之談星》. Đây là tài liệu tham khảo để luận SÂU bản chất sao theo tinh thần trọng tinh tình của Trung Châu Phái, KHÔNG phải để chép lại khô khan. Hãy đan cài tinh tình này với vị trí cung, miếu/hãm, tứ hóa và tam phương tứ chính đã tính sẵn. VẪN PHẢI bám đúng các sao thực có trên lá số; không vì tài liệu này mà nhắc đến sao không tồn tại:
${damTinhStr}

--- TINH TÌNH PHỤ/TẠP TINH THEO ĐÀM TINH (TRUNG CHÂU PHÁI) ---
Dưới đây là tinh tình của các phụ/tá/sát/tạp diệu thực có trên lá số (đã lọc sẵn, ưu tiên theo mức ảnh hưởng và có trần ngân sách để prompt không phình). Đây là NGUYÊN LIỆU NỀN: hãy đan cài với chính tinh đồng cung, miếu/hãm và tam phương tứ chính để ra kết luận động, KHÔNG chép khô khan từng sao:
${damTinhAuxStr}

--- TINH TÌNH TỨ HÓA TỔNG QUÁT (TRUNG CHÂU PHÁI — BẢN CHẤT CHUNG CỦA 4 HÓA) ---
Dưới đây là bản chất chung của các loại Hóa (Lộc/Quyền/Khoa/Kỵ) thực sự xuất hiện trên lá số này, cô đọng từ Đàm Tinh. Đây là NỀN KHÁI NIỆM (mỗi loại Hóa mang năng lượng gì) để luận Phần 2 cho vững gốc; PHẢI kết hợp với tinh tình chi tiết theo cặp (ngay bên dưới) và cung vị sao thụ hóa đang đóng để ra kết luận động, KHÔNG chép khô khan:
${damTinhTuHoaGeneralStr}

--- TINH TÌNH TỨ HÓA CHI TIẾT THEO CẶP (CHÍNH TINH THỤ HÓA × LOẠI HÓA) ---
Dưới đây là tinh tình của ĐÚNG các cặp (chính tinh × Hóa) thực sự xuất hiện trên lá số này, gồm Tứ Hóa bẩm sinh và phi hóa Đại vận/Lưu niên (đã tính sẵn ở các phần trên). Dùng để luận SÂU sắc thái riêng của từng sao khi thụ Hóa theo từng can, KHÔNG chép khô khan: hãy ghép với cung vị nơi sao thụ hóa đang đóng (đã có ở bảng Tứ Hóa) và tam phương tứ chính để ra kết luận động về đương số:
${damTinhTuHoaDetailStr}

--- LÁ SỐ BÁT TỰ / TỨ TRỤ (HỆ THỨ HAI — ĐỐI CHIẾU CHÉO VỚI TỬ VI) ---
${baZiStr || "(Không có dữ liệu Bát Tự cho lá số này.)"}

--- TRI THỨC THAM CHIẾU TRUNG HOA (ĐÃ TRUY HỒI THEO LÁ SỐ — RAG) ---
Đây là vài mẩu tri thức (Ngũ Hành, Thập Thần, nguyên tắc luận chéo Tử Vi↔Bát Tự, phong cách diễn giải) được hệ thống chọn lọc cho ĐÚNG lá số này. Dùng để luận SÂU và trích nguồn minh bạch; KHÔNG chép khô khan, chỉ áp dụng khi thực sự khớp dữ liệu lá số trên:
${chineseKnowledgeStr || "(Không có mẩu tri thức nào khớp.)"}

--- KHO TRI THỨC TỬ BÌNH (BÁT TỰ) SÂU — ĐÃ TRUY HỒI THEO LÁ SỐ (kho riêng) ---
Đây là các trích đoạn tri thức Tử Bình truyền thống (nền tảng tính toán, ý nghĩa 10 Thập Thần theo trụ, quy tắc Dụng thần, Thần Sát, Cách cục, quan hệ Can–Chi, Hỷ–Kỵ, Đại vận/Lưu niên) được hệ thống chọn lọc cho ĐÚNG lá Bát Tự ở trên. ĐÂY LÀ "SÁCH" để bạn luận Bát Tự CÓ CĂN CỨ, KHÔNG được bịa khái niệm/quy tắc ngoài kho này. Bắt buộc tuân thủ trình tự: Vượng–Nhược → Dụng thần → Hỷ–Kỵ → rồi mới phán Thập Thần/Thần Sát là cát hay hung (đừng luận Thần Sát trước khi định Hỷ–Kỵ). Khi viện dẫn, ghi rõ nguồn (Tử Bình) để minh bạch:
${tuBinhKnowledgeStr || "(Không có dữ liệu Bát Tự nên không truy hồi kho Tử Bình.)"}

--- KINH NGHIỆM ỨNG DỤNG (LỚP B — SỔ TỬ VI KINH NGHIỆM, ĐÃ TRUY HỒI) ---
Lớp ỨNG DỤNG đoán (cách cục, hạn, cung, tổ hợp → đời thực), KHÁC Đàm Tinh (bản chất sao ở trên). Ưu tiên: sao/cung THỰC CÓ trên lá > tinh tình Đàm Tinh > mẩu dưới. Chỉ dùng mẩu khớp lá; "CÓ XU HƯỚNG", gọn, đời thực, CẤM hoa mỹ / khẳng định tuyệt đối / nhắc tên sách trừ khi đương số hỏi nguồn:
${kinhNghiemKnowledgeStr || "(Không truy hồi được mẩu kinh nghiệm.)"}

${interpretFramework}`;
};