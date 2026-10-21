import { buildRelationsBlock, toBranchIndex } from "../utils/chartRelations";
import { INTERPRET_INCLUDE_MONTHLY_SECTION } from "../server/aiConfig";
import {
  buildInterpretFrameworkBlock,
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
    decadalBranch,
    decadalRangeStr,
    tieuHanAgesStr,
    natalTuHoaResolved,
    natalTuHoaStr,
    stemKey,
    schoolMetaStr,
    corePsychologicalFlightsStr,
    palaceSelfFlyingBlockStr,
    bodyPalaceStr,
    stressReportStr,
    tinhVaDapReportStr,
    temporalTriggerReportStr,
    trungPhungReportStr,
    tuanTrietReportStr,
    luuNienReportStr,
    luuNienEventCardsStr,
    baZiCrossTagsStr,
    decadalFlyingStr,
    luuNienFlyingStr,
    cachCucReportStr,
    vanChamCungStr,
    trongTamStr,
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
    saoNhapHanStr,
    nmMenhStr,
    giaiHoaKnowledgeStr,
    bookCorpusStr,
    tinhHoaCabinetDirectiveStr,
  } = ctx;

  const { doiSongPart, vanTrinhPart, nenTangPart } = interpretPartNumbers();
  const interpretFramework = buildInterpretFrameworkBlock(transitYearNum, chartData, natalTuHoaResolved);

  // Khung tháng là compile-time flag. Khi bật, Lưu Nguyệt phục vụ cả
  // "Phần Tháng trọng tâm" lẫn mục "Tháng nóng nhất" trong Tiểu hạn;
  // khi tắt, chỉ còn đúng ngoại lệ "Tháng nóng nhất" để tránh mâu thuẫn prompt.
  const monthlyWeaponIntro = INTERPRET_INCLUDE_MONTHLY_SECTION
    ? `* VŨ KHÍ 2 — LƯU NGUYỆT: "BỘ ĐỊNH VỊ THỜI ĐIỂM" — DÙNG CHO **PHẦN THÁNG TRỌNG TÂM** + MỤC **THÁNG NÓNG NHẤT** TRONG TIỂU HẠN; KHÔNG DÀN TRẢI`
    : `* VŨ KHÍ 2 — LƯU NGUYỆT: "BỘ ĐỊNH VỊ THỜI ĐIỂM" — GÀI MỘT NHÁT VÀO LUẬN GIẢI TIỂU HẠN (HẠN NĂM), CHỈ ĐỂ CHỐT MỤC "THÁNG NÓNG NHẤT"; KHÔNG DÀN TRẢI`;
  const monthlyWeaponHow = INTERPRET_INCLUDE_MONTHLY_SECTION
    ? `CÁCH GÀI (đúng MỘT nhát, không dàn trải): nếu khung có **Phần Tháng trọng tâm**, quét bảng → rút 1–2 tháng nóng → gom theo tiền/sức/việc/tình (CẤM liệt kê 12 tháng); trong **Luận giải Tiểu Hạn** chỉ chốt mục **Tháng nóng nhất** cùng 1–2 tháng đó, không lặp nội dung. Nếu khung không có phần tháng, chỉ dùng cho mục **Tháng nóng nhất**. Mỗi tháng MỘT mạch: chuyện đời tháng đó → Lưu Nguyệt Tứ Hóa neo máy → 1 NÊN.`
    : `CÁCH GÀI (đúng MỘT nhát, không dàn trải): trong **Luận giải Tiểu Hạn** (hạn năm), chốt mục **Tháng nóng nhất** — chỉ đích danh 1–2 tháng nóng nhất của năm (tháng có Hóa/Kỵ hoặc cung tháng đáp đúng domain nóng của năm) → mỗi tháng MỘT mạch: chuyện đời tháng đó → Lưu Nguyệt Tứ Hóa neo máy → 1 NÊN. CẤM lập mục "Tháng trọng tâm", CẤM liệt kê 12 tháng, CẤM luận tháng ngoài nhát này.`;

  const decadalPalace = String(chartData?.transitDecadalPalace || "").trim();
  const isTongHan = /chưa\s*vào\s*đại\s*hạn|童限/i.test(decadalPalace);
  const hasCoreFlights = String(corePsychologicalFlightsStr || "").trim().length > 0;
  /** Ẩn tên trường phái khỏi nguyên liệu trước khi đưa vào prompt — đầu ra không được nêu tên phái. */
  const neutralSchoolNames = (s: string) =>
    String(s || "").replace(/Trung\s+Châu(?:\s+Phái)?/gi, "cổ pháp");
  const tongHanNote = isTongHan
    ? " | 童限: chưa vào Đại hạn thật — mục Đại hạn (10 năm) chỉ nói tiền vận/chuẩn bị, KHÔNG luận như đã vào vận."
    : "";

  return `--- DỮ LIỆU THÔNG TIN LÁ SỐ CỦA BẠN ---
- Giới tính: ${genderStr}
- Ngày dương lịch: ${chartData.solarDate} (Giờ sinh: ${chartData.solarTime})
- Ngày âm lịch: ${chartData.lunarDate} (Cơ Bản: ${chartData.chineseDate})
- Bản mệnh / Cục: ${chartData.fiveElementsClass}
- Cầm tinh / Chòm sao: Sinh năm ${chartData.zodiac} - Chòm sao ${chartData.sign}
- Mệnh chủ: ${chartData.soul} | Thân chủ: ${chartData.body}
- Thiên can năm sinh (dùng để áp Tứ Hóa bẩm sinh): ${stemKey || chartData.birthHeavenlyStem || "Chưa rõ"}
- Năm xem vận hạn chủ lực: ${transitYearNum}
- Tuổi mụ khi xem hạn: ${chartData.transitLunarAge || "Chưa rõ"} tuổi
- Cung Đại hạn (10 năm): Cung ${chartData.transitDecadalPalace || "Chưa rõ"}${decadalStem || decadalBranch ? ` | Can–chi đại hạn: ${[decadalStem, decadalBranch].filter(Boolean).join(" ")}` : ""}${decadalRangeStr ? ` | ${decadalRangeStr}` : ""}${tongHanNote}
- Cung Tiểu hạn (1 năm): Cung ${chartData.transitYearlyPalace || "Chưa rõ"}${tieuHanAgesStr ? ` | ages tiểu hạn (iztro): ${tieuHanAgesStr}` : ""}
- Cung Lưu niên Thái tuế: Cung ${chartData.transitLuuThaiTuePalace || "Chưa rõ"}

--- BẢN ĐỒ DỮ LIỆU (ĐỌC NHANH — KHÔNG ĐỌC THÀNH MỤC LỤC) ---
Phần 1 — Bản sắc & cơ chế: 12 cung, Tứ Hóa 4 tầng, va đập/điểm mù, sát, cách cục, Đàm Tinh, Lai Nhân.
Phần 2 — Đời sống: hai trục tài lộc, Trường Sinh, đếm cát/hung, kinh nghiệm, nhập Mệnh.
Phần 3 — Vận trình: Đại hạn hiện tại, giao thoa, Tuần/Triệt, sao lưu/vận, thẻ năm, sao nhập hạn, Lưu Nguyệt.
Phần 4 — Nền tảng & đối chiếu: Phúc Đức, Bát Tự (nếu có), Tử Bình, sách, hóa giải.
Quy tắc: máy > Đàm Tinh > RAG/sách; chỉ dùng dữ liệu dưới; cấm bịa sao/cung/Hóa; “CÓ XU HƯỚNG” + điều kiện + 1 NÊN.

--- TRƯỜNG PHÁI & ENGINE ---
${schoolMetaStr}

${trongTamStr ? `${trongTamStr}\n\n` : ""}--- CUNG THÂN (TRỌNG TÂM — ĐỐI CHIẾU VỚI CUNG MỆNH) ---
${bodyPalaceStr}

--- PHẢN ÁNH 12 CUNG VỊ & TOÀN BỘ SAO TRÊN LÁ SỐ ---
${chartData.palaces.map((p: any) => {
  // Mutagen gắn trên từng sao (nếu payload có) — vd "Thiên Cơ (Miếu, Hóa Kỵ)"
  const fmt = (s: any) => {
    const name = String(s?.name || "").trim();
    if (!name) return "";
    const bits = [s?.brightness, s?.mutagen, s?.type].filter((x) => x != null && String(x).trim());
    return bits.length ? `${name} (${bits.map((x) => String(x).trim()).join(", ")})` : name;
  };
  const major = (p.majorStars || []).map(fmt).filter(Boolean).join(", ");
  const minor = (p.minorStars || []).map(fmt).filter(Boolean).join(", ");
  const adj = (p.adjectiveStars || []).map(fmt).filter(Boolean).join(", ");
  const decadalRange = p.decadal?.range;
  const decadalStr = Array.isArray(decadalRange)
    ? `Từ ${decadalRange[0]} tuổi đến ${decadalRange[1]} tuổi`
    : "Chưa rõ";
  return `Cung thứ ${toBranchIndex(p.index) + 1}: ${p.name} (Địa chi ${p.earthlyBranch}, Thiên can ${p.heavenlyStem})${p.isBodyPalace ? " - [CUNG THÂN ĐỒNG CUNG]" : ""}
  - Chính tinh: ${major || "Không có (Cung Vô Chính Diệu)"}
  - Cát tinh / Lộc mã / Trợ tinh / Sao lưu: ${minor || "Không"}
  - Sát tinh / Hung tinh / Tạp tinh phụ: ${adj || "Không"}
  - Vòng: Trường Sinh=${p.changsheng12 || "Chưa rõ"} | Bác Sỹ=${p.boshi12 || "Chưa rõ"} | Tướng Tiền gốc=${p.jiangqian12 || "Chưa rõ"} | Tuế Tiền gốc=${p.suiqian12 || "Chưa rõ"} | Tướng Tiền năm=${p.yearJiangqian12 || "—"} | Tuế Tiền năm=${p.yearSuiqian12 || "—"}
  - Đại hạn: ${decadalStr}${p.decadal?.heavenlyStem || p.decadal?.earthlyBranch ? ` (can–chi hạn cung: ${[p.decadal?.heavenlyStem, p.decadal?.earthlyBranch].filter(Boolean).join(" ")})` : ""}
  - Ages tiểu hạn (tuổi mụ vào cung này): ${Array.isArray(p.ages) && p.ages.length ? p.ages.join(", ") : "—"}
${buildRelationsBlock(idx, p, { includeFlights: false })}
`;
}).join("\n")}

--- QUAN HỆ HÌNH HỌC + CHỐNG BỊA (MÁY ĐÃ TÍNH) ---
Mỗi cung đã kèm Xung chiếu / Tam hợp / Nhị hợp / Lục hại. Tự Hóa & Phi Hóa 12 cung gom ở tầng [2] bên dưới. CHỈ dùng sao/cung có trong dữ liệu; cấm tự nhẩm index hoặc bịa sao. Cheat sheet là lưới an toàn, không phải để liệt kê khô — vẫn phải liên kết toàn cục.

--- KHỐI TỨ HÓA TỔNG HỢP (4 TẦNG — ĐỌC LIỀN, KHÔNG LẪN TẦNG) ---
Một mạch Tứ Hóa duy nhất: [1] Bẩm sinh (can năm) → [2] Tự Hóa/Phi Hóa 12 cung → [3] Đường bay Mệnh/Phúc → [4] Động (Vận + Lưu). Viết Phần 1; không lẫn tầng khi luận hạn.

[1] TỨ HÓA BẨM SINH (NATAL MUTAGENS — BẤT BIẾN THEO CAN NĂM SINH)
${natalTuHoaResolved
  ? `Dựa trên Thiên can năm sinh (${stemKey || chartData.birthHeavenlyStem}), hệ thống đã tra sẵn 4 sao thụ phong Tứ Hóa bẩm sinh cùng cung vị chúng đang đóng. Đây là dữ liệu CHÍNH XÁC đã tính sẵn, DÙNG TRỰC TIẾP, KHÔNG tự tra lại bảng can:`
  : `LƯU Ý: Hệ thống CHƯA tính sẵn được Tứ Hóa bẩm sinh (thiếu Thiên can năm sinh chuẩn). TUYỆT ĐỐI KHÔNG tự tra bảng can / tự nhẩm Tứ Hóa; hãy nói rõ là chưa đủ dữ liệu thay vì bịa:`}
${natalTuHoaStr}

[2] TỰ HÓA & PHI TỨ HÓA 12 CUNG (CƠ CHẾ NỘI SINH & HƯỚNG NGOẠI)
- Tự Hóa: sao thụ Hóa tại chính cung phát can — nội biến, dễ phát dễ tản; Tự Kỵ = tự chuốc hao/chấp.
- Phi Hóa xuất: sao thụ Hóa ở cung khác — động lực hướng ngoại.
Không lẫn Tự/Phi với Tứ Hóa bẩm sinh:
${palaceSelfFlyingBlockStr || "  - (Chưa tính được Tự / Phi Tứ Hóa 12 cung.)"}

[3] ĐƯỜNG BAY TÂM LÝ CỐT LÕI (PHI TỨ HÓA TỪ MỆNH VÀ PHÚC ĐỨC — CHỈ KHI MÁY CÓ DỮ LIỆU)
Đây là hai trục xung lực tâm lý then chốt của toàn bộ lá số.
${hasCoreFlights
  ? `BẮT BUỘC: Khi viết mục "Tự Phi Tứ Hóa", bạn PHẢI phân tích sâu tối thiểu 02 đường bay then chốt, trong đó ít nhất 01 đường từ Cung Mệnh hoặc Cung Phúc Đức, để mổ xẻ căn nguyên tâm lý cốt lõi, động cơ vô thức và cơ chế phản ứng dẫn dắt hành vi của bạn.`
  : `LƯU Ý: Máy chưa tính được đường bay Mệnh/Phúc Đức — KHÔNG tự nhẩm can/cung, KHÔNG bịa. Mục "Tự Phi Tứ Hóa" chỉ luận các đường Tự Hóa/Phi Hóa đã có ở tầng [2] và nói rõ phần dữ liệu còn thiếu.`}
${corePsychologicalFlightsStr || "  - (Chưa tính được đường bay Mệnh/Phúc Đức.)"}

[4] PHI TỨ HÓA ĐỘNG (VẬN + LƯU — CHỈ DÙNG CHO VẬN HẠN)
Phi tĩnh trong từng cung là cấu trúc bẩm sinh. Luận Đại vận/Tiểu hạn phải dùng hai đường bay động dưới đây:

* Vận Tứ Hóa / Phi Đại vận (can–chi đại hạn${decadalStem || decadalBranch ? ` — ${[decadalStem, decadalBranch].filter(Boolean).join(" ")}` : ""}${decadalRangeStr ? `, ${decadalRangeStr}` : ""}):
${decadalFlyingStr}

* Lưu Tứ Hóa / Phi Lưu niên (can năm ${transitYearNum} — ${luuNienStem}):
${luuNienFlyingStr}

--- CHEAT SHEET TỔNG HỢP: VA ĐẬP & ĐIỂM MÙ (SÁT/KỴ → TRỤC VA → KÍCH HOẠT) ---
Ba bảng là một chuỗi “điểm yếu → va đập → kích hoạt”; đọc liền mạch, không bịa ngoài danh sách.

[BẢNG A] VÙNG ÁP LỰC SÁT/KỴ TINH (MÁY QUÉT)
${stressReportStr}
Chỉ dùng sao đã liệt; nếu vùng này thuộc mầm trọng tâm thì mổ kỹ điểm mù/rủi ro sụp đổ, không biến mọi sát tinh thành điểm mù.

[BẢNG B] TÍNH VA ĐẬP & ĐIỂM MÙ (MÁY DỰNG TRỤC)
Dùng cho mục **Tính va đập & Điểm mù** (Phần 1) và xuyên khi luận Phu/Nô/Phụ/Tài:
(1) Chỉ đào mầm CÓ trong sheet — cấm bịa điểm mù; chỉ chọn tối đa 3 mầm trọng tâm, bỏ mầm phụ/trùng ý.
(2) Mỗi mầm được chọn: hành vi bề mặt → cơ chế sao → hệ quả đời.
(3) Va đập chỉ RÕ đối tượng (mình/cha mẹ/bạn/đôi lứa/sếp) — sắc, không hù.
${tinhVaDapReportStr || "  - (Chưa dựng được báo cáo Tính va đập.)"}

[BẢNG C] KÍCH HOẠT HẠN ↔ ĐIỂM MÙ (MÁY GIAO)
(1) Phần ${vanTrinhPart} phải XOÁY mọi kích hoạt CAO; VỪA nhắc trong tóm năm.
(2) CẤM “năm bình hòa” khi còn CAO; CẤM bịa nổ khi không có.
(3) Chỉ CÓ XU HƯỚNG + điều kiện + 1 hành động may đo; không tuyệt đối hóa.
${temporalTriggerReportStr || "  - (Chưa quét được kích hoạt hạn.)"}

--- CHEAT SHEET: GIAO THOA 3 TẦNG GỐC×VẬN×LƯU (MÁY GHIM) ---
(1) **Luận giải Tiểu Hạn** phải XOÁY mọi pin (mỗi pin 1 mạch: việc đời → cơ chế đè nhau → 1 NÊN).
(2) Chỉ CÓ XU HƯỚNG + điều kiện; gọi thẳng hiện tượng nhưng cấm hù dọa.
(3) CẤM bịa pin ngoài list; không pin → luận êm theo thẻ/kích hoạt.
${trungPhungReportStr || "  - (Chưa quét được giao thoa 3 tầng.)"}

--- CHEAT SHEET: TUẦN / TRIỆT / KHÔNG VONG (MÁY QUÉT) ---
(1) Chỉ nói đúng cung trong danh sách; cấm gán sang cung khác.
(2) Phân biệt Tuần (giảm lực) ≠ Triệt (chặn lộ) ≠ Không Vong (hư không) ≠ Địa Không/Địa Kiếp.
(3) Có Tuần/Triệt ở cung trọng → hạ giọng mức phú quý/phát, vẫn khen điểm sáng còn lại.
${tuanTrietReportStr}

--- CHEAT SHEET: SAO LƯU NIÊN + SAO VẬN THEO CUNG (MÁY QUÉT) ---
Tiểu hạn ưu tiên thẻ sự kiện ngay dưới; Đại hạn bám khối SAO VẬN + Vận Tứ Hóa:
${luuNienReportStr}

--- THẺ SỰ KIỆN LƯU NIÊN (MÁY ĐÚC — XƯƠNG SỐNG TIỂU HẠN) ---
(1) **Luận giải Tiểu Hạn** mở bằng [TÓM NĂM], xoáy 2–4 thẻ nhiệt cao.
(2) Mỗi thẻ: headline + chuyện đời + neo máy + 1 NÊN — không list sao khô.
(3) CẤM bịa thẻ/domain; CẤM “năm bình hòa” nếu còn thẻ ÁP LỰC nhiệt cao.
${luuNienEventCardsStr || "  - (Chưa đúc được thẻ sự kiện năm.)"}

--- CHEAT SHEET: CÁCH CỤC + CHUỖI NHÂN QUẢ (MÁY — MASTER) ---
Chỉ dùng ĐÚNG tên cách/quality trong list; CẤM tự đặt tên cách ngoài list; CẤM đổi quality trừ khi giải thích mâu thuẫn sao thật. Diễn cách = mắt xích (sao × cấu trúc → cơ chế → đời), gộp chân dung, không mục lục. “Chưa khớp”/VCD → luận tổ hợp chính tinh thật:
${cachCucReportStr}
${vanChamCungStr ? `\n${vanChamCungStr}\n` : ""}

--- CHEAT SHEET: HAI TRỤC TÀI LỘC (MÁY GOM) ---
SINH TÀI (Mệnh–Tài–Quan) = cách KIẾM; THỦ TÀI (Phúc–Tài–Điền) = cách GIỮ. Luận tiền phải phân biệt: kiếm giỏi giữ kém, hay giữ chắc khó bứt phá — căn sao thực từng trục:
${haiTrucTaiLocStr}

--- CHEAT SHEET: CỤM SAO PHÚC ĐỨC (MÁY TÓM) ---
Phúc Đức = phúc báo, chất lượng tinh thần, an/bất an, khả năng hưởng thụ — dùng cho Phần ${nenTangPart}:
${phucDucReportStr}

--- CHEAT SHEET: VÒNG TRƯỜNG SINH (THẾ ĐẤT SAO) ---
Sao tốt đóng cung YẾU (Tử/Tuyệt/Mộ/Bệnh/Suy/Thai) giảm lực, dễ hữu danh vô thực; đóng cung MẠNH (Trường Sinh/Đế Vượng/Lâm Quan/Quan Đới) phát trọn. Dùng hiệu chỉnh Phần 1, Phần ${doiSongPart}, Phần ${nenTangPart}:
${truongSinhReportStr}

--- CHEAT SHEET: ĐẾM CÁT/HUNG ĐỊNH CÁCH (MÁY ĐẾM) ---
Đếm cát/hung ở tam phương trục cốt (Mệnh–Tài–Quan + xung + Phúc Đức) — chỉ là gợi ý, phải đặt trong miếu/hãm + cách cục + Trường Sinh, không kết luận máy móc:
${phucLocReportStr}

--- TINH TÌNH CHÍNH TINH — ĐÀM TINH (NGUYÊN LIỆU) ---
Tinh tình chính tinh thực có trên lá. Đan với cung/miếu-hãm/Tứ Hóa/tam phương; không chép khô, không nhắc sao ngoài lá:
${neutralSchoolNames(damTinhStr)}

--- TINH TÌNH PHỤ/TẠP TINH — ĐÀM TINH (ĐÃ LỌC + CÓ TRẦN) ---
Nguyên liệu nền cho phụ/tá/sát/tạp thực có; đan với chính tinh đồng cung/miếu-hãm/tam phương, không chép từng sao:
${neutralSchoolNames(damTinhAuxStr)}

--- TINH TÌNH TỨ HÓA TỔNG QUÁT (4 HÓA) ---
Bản chất Lộc/Quyền/Khoa/Kỵ thực có — nền khái niệm cho Phần 1; ghép với cặp chi tiết + cung vị sao thụ Hóa:
${neutralSchoolNames(damTinhTuHoaGeneralStr)}

--- TINH TÌNH TỨ HÓA CHI TIẾT THEO CẶP (SAO × HÓA) ---
Đúng các cặp chính tinh × Hóa thực có (bẩm sinh + phi Đại vận/Lưu niên); ghép cung vị + tam phương để ra kết luận động:
${neutralSchoolNames(damTinhTuHoaDetailStr)}

--- LÁ SỐ BÁT TỰ / TỨ TRỤ + TIMELINE TỬ BÌNH ---
Gồm 4 trụ + timeline BT máy (Đại Vận đang đi, Lưu niên can–chi + Thập Thần + xung/hợp). Luận hạn BT/chéo TV: bám HEADLINE vận + lưu niên; cấm nhẩm can–chi khác, cấm ghép sao lưu TV thành BT:
${baZiStr || "(Không có dữ liệu Bát Tự cho lá số này.)"}

--- THẺ TIN CẬY BÁT TỰ CHÉO THEO TRỤC (MÁY) ---
4 trục: Bản sắc / Tài / Quan / Hạn năm → [Đồng thuận] | [Bổ sung] | [Mâu thuẫn – thận trọng]. Chỉ gắn đúng trục máy ở kết luận trọng yếu (tối đa 1 nhãn/trục); TV dẫn, BT không phải chân lý:
${baZiCrossTagsStr || "  - (Chưa có thẻ chéo.)"}

--- TRI THỨC THAM CHIẾU TRUNG HOA (RAG THEO LÁ) ---
Mẩu Ngũ Hành/Thập Thần/luận chéo TV–BT đã chọn cho lá này; chỉ dùng khi khớp dữ liệu, không chép khô:
${neutralSchoolNames(chineseKnowledgeStr) || "(Không có mẩu tri thức nào khớp.)"}

--- KHO TRI THỨC TỬ BÌNH (BÁT TỰ) — RAG RIÊNG ---
Sách Tử Bình đã chọn cho lá: nền tính toán, Thập Thần theo trụ, Dụng thần, Thần Sát, cách cục, can–chi, Hỷ–Kỵ, vận. Trình tự bắt buộc: Vượng–Nhược → Dụng thần → Hỷ–Kỵ → mới phán Thập Thần/Thần Sát. Không bịa ngoài kho; không ghi tên sách/trang trong thân bài, chỉ dùng nội bộ:
${tuBinhKnowledgeStr || "(Không có dữ liệu Bát Tự nên không truy hồi kho Tử Bình.)"}

--- KINH NGHIỆM ỨNG DỤNG (LỚP B — RAG THEO LÁ) ---
Ứng dụng đoán (cách cục/hạn/cung/tổ hợp → đời), khác Đàm Tinh. Chỉ áp mẩu khi đủ sao/cung/tổ hợp; thiếu then chốt → bỏ. Ưu tiên lá thực > Đàm Tinh > mẩu; “CÓ XU HƯỚNG”, gọn, không nhắc tên sách:
${kinhNghiemKnowledgeStr || "(Không truy hồi được mẩu kinh nghiệm.)"}

--- TỔ HỢP CHÍNH TINH NHẬP MỆNH (MẠCH B — RAG 5 FILE) ---
Tổ hợp theo cung vị + nữ mệnh theo sao (Tử Vi, Thiên Tướng, Phá Quân, Văn Xương, Văn Khúc); bổ sung, không thay máy/Đàm Tinh. Soi đúng vị trí thật rồi mới chọn nhánh; thiếu sao → bỏ. Nữ mệnh là quan niệm cổ — đọc chọn lọc:
${nmMenhStr || "(Không có mẩu nhập Mệnh nào khớp lá.)"}

--- SAO NHẬP HẠN (TÂN BIÊN + CƠ CHẾ VẬN/LƯU + ỨNG NGHIỆM) ---
Bổ sung Phần 3: mẩu “sao X nhập đại/tiểu hạn” + cơ chế Vận/Lưu (Điệp, Xung, Giao trời, Thủy hiểm, bộ 4 Hóa Vận, Tang Môn). Chỉ áp khi nhãn [SAO VẬN]/[SAO LƯU] thật có; ưu tiên thấp hơn lá + Đàm Tinh:
${saoNhapHanStr || "(Không có mẩu sao nhập hạn khớp lá.)"}

${tinhHoaCabinetDirectiveStr || "=== LỆNH DIỄN ĐẠT: máy + Đàm Tinh > mọi mẩu phụ; viết mạch logic; dùng toàn bộ kiến thức, chỉ câu chữ trùng nguyên văn tối đa 40% độ dài phần tinh hoa (trần trùng câu chữ toàn bài, không phải trần kiến thức); phần câu chữ còn lại diễn đạt. ==="}

--- GIẢI HÓA (HÀNH ĐỘNG — GATE THEO SAO) ---
May đo NÊN/KHÔNG khi kết vùng hung/tài/tình; không đè máy/Đàm Tinh; không cúng bái, không “hết hạn 100%”:
${giaiHoaKnowledgeStr || "(Không có mẩu giải hóa khớp lá.)"}

--- TỦ TINH HOA SÁCH (CÔ ĐỌNG THEO SAO — KHÔNG FULL SÁCH) ---
Nguyên liệu đúng ngăn sao trên lá để BẠN tổng hợp thành một mạch; cấm liệt kê “mục 1 mục 2”, cấm nhắc tên file/sách; lệch máy → bỏ:
${neutralSchoolNames(bookCorpusStr) || "(Không có tinh hoa sách khớp - luận bằng máy + Đàm Tinh.)"}

--- HAI VŨ KHÍ TINH NHUỆ (MỖI VŨ KHÍ ĐÚNG MỘT VỊ TRÍ) ---
* VŨ KHÍ 1 — LAI NHÂN CUNG: “CĂN NGUYÊN BẨM SINH” — MỞ MÀN PHẦN 1.
Cung có Thiên can trùng can năm sinh = nguồn tứ hóa bẩm sinh, gốc nghiệp quả/động cơ sâu nhất. Mở Phần 1 bằng 2–4 mạch căn nguyên (đời trước, sao sau), rồi mới dệt Mệnh + tam phương:
${laiNhanReportStr}

${monthlyWeaponIntro}
Bảng Lưu Nguyệt đã an sẵn cung tháng + can tháng + phi Lưu Nguyệt Tứ Hóa; dùng trực tiếp, không tự nhẩm cung/can tháng.
${monthlyWeaponHow}
${luuNguyetReportStr || "  - (Chưa an được bảng tháng cho năm này.)"}

${interpretFramework}`;
};