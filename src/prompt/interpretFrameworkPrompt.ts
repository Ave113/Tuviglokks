import { INTERPRET_INCLUDE_MONTHLY_SECTION } from "../server/aiConfig";
import { buildMultiLensFrameworkHint } from "../knowledge/multiLensSynthesis";
import { buildStarPresentationFrameworkHint } from "../knowledge/starPresentationProtocol";

/**
 * Cheat sheet Lưu Nguyệt legacy — chỉ dùng khi bật phần tháng (flag tắt mặc định).
 * Luồng chính hiện nay: Lưu Nguyệt đi vào prompt qua "VŨ KHÍ 2 — BỘ ĐỊNH VỊ THỜI ĐIỂM"
 * (một nhát Tháng nóng nhất trong Luận giải Tiểu Hạn) — xem formatInterpretPrompt.ts.
 */
export function buildLuuNguyetCheatSheetBlock(luuNguyetReportStr: string): string {
  if (!INTERPRET_INCLUDE_MONTHLY_SECTION) return "";
  return `--- CHEAT SHEET: LƯU NGUYỆT — 12 CUNG THÁNG ÂM LỊCH (HỆ THỐNG AN SẴN) ---
Hệ thống đã an sẵn cung an trú của từng tháng âm lịch trong năm xem hạn (theo Đẩu Quân) cùng can tháng và đường phi Lưu Nguyệt Tứ Hóa (Lộc/Quyền/Khoa/Kỵ của tháng đó đáp vào sao nào, cung nào). Dùng cho phần Tháng trọng tâm. Dữ liệu tính sẵn:
${luuNguyetReportStr}

`;
}

/** Dấu mốc block khung luận giải trong prompt — pipeline dùng để neo cắm skeleton chặng 2. */
export const INTERPRET_FRAMEWORK_MARKER = "--- KHUNG LUẬN GIẢI CHƯƠNG TRÌNH CHI TIẾT ---";

/**
 * Cấu trúc tinh gọn: Phần 0 Chân dung + 4 phần đánh số + Kết luận 5 dòng.
 *
 * Các miền cũ (Tứ Hóa, sát tinh, sự nghiệp, tài lộc, phu thê, tật ách, phúc đức,
 * định cách, Bát Tự…) trở thành MỤC CON của 4 phần đánh số — không mất nội dung,
 * nhưng người đọc không phải đi qua 10–11 chương rời rạc.
 */
export function interpretPartNumbers() {
  return {
    /** Số phần đánh số (1..4). */
    partCount: 4,
    /** Tổng heading lớn gồm cả Phần 0 (0 + 1..4). Kết luận nằm ngoài. */
    totalPartCount: 5,
    banSacPart: 1,
    doiSongPart: 2,
    vanTrinhPart: 3,
    nenTangPart: 4,
    /** Alias tương thích code cũ — tất cả miền đời nằm trong Phần 2. */
    phuThePart: 2,
    sucKhoePart: 2,
    cungKhacPart: 2,
    /** Phúc Đức và Định cách nằm trong Phần 4. */
    phucDucPart: 4,
    dinhCachPart: 4,
    /** Tháng trọng tâm (nếu bật flag) là mục con của Phần 3. */
    thangPart: INTERPRET_INCLUDE_MONTHLY_SECTION ? 3 : 0,
  };
}

/** Danh sách brief từng phần — dùng chung cho chặng 1 và khung viết. */
export function interpretPartTitles(): string[] {
  return [
    "1=Bản sắc & cơ chế vận hành (tam phương, va đập, điểm mù, Tứ Hóa, sát tinh)",
    "2=Đời sống thực tế (sự nghiệp, tài lộc, tình cảm, sức khỏe, các cung còn lại)",
    "3=Vận trình (Đại hạn hiện tại, Tiểu hạn năm, Tháng nóng)",
    "4=Nền tảng phúc báo & tổng lực (Phúc Đức, định cách, đối chiếu Bát Tự)",
  ];
}

/**
 * Khung luận giải chương trình — bản tinh gọn.
 * 5 khối (Phần 0 + 4 phần đánh số), mỗi phần có mục con giữ đủ mọi miền; Kết luận 5 dòng.
 */
export function buildInterpretFrameworkBlock(
  transitYearNum: number,
  chartData: { transitLunarAge?: number | string },
  natalTuHoaResolved: boolean,
): string {
  const n = interpretPartNumbers();
  const { totalPartCount, doiSongPart, vanTrinhPart, nenTangPart } = n;

  const monthlyBan = INTERPRET_INCLUDE_MONTHLY_SECTION
    ? ""
    : `
TUYỆT ĐỐI KHÔNG viết mục "Tháng trọng tâm trong năm", không liệt kê tháng 1–12, không luận theo tháng âm lịch dàn trải. NGOẠI LỆ DUY NHẤT: mục **Tháng nóng nhất** trong Luận giải Tiểu Hạn (Phần ${vanTrinhPart}) — dùng bảng LƯU NGUYỆT thuộc VŨ KHÍ 2 (BỘ ĐỊNH VỊ THỜI ĐIỂM). Vận hạn chính vẫn ở mức NĂM.
`;

  const monthlyFocusBlock = INTERPRET_INCLUDE_MONTHLY_SECTION
    ? `
   ### Tháng trọng tâm trong năm ${transitYearNum}
   - Quét bảng LƯU NGUYỆT → rút 1–2 tháng nóng → gom theo **tiền / sức / việc / tình**.
   - Mỗi tháng MỘT mạch: chuyện đời tháng đó → Lưu Nguyệt Tứ Hóa neo máy → 1 NÊN.
   - CẤM liệt kê 12 tháng; CẤM lặp lại nội dung với mục **Tháng nóng nhất** bên dưới.
   - Nếu một chủ đề không có tháng nổi bật: nói ngắn "năm nay ít biến động về [chủ đề]", không bịa tháng.
`
    : "";

  const part3YearSummary = INTERPRET_INCLUDE_MONTHLY_SECTION
    ? ""
    : `
   - Tóm xu hướng cả năm ${transitYearNum} theo 4 chủ đề (tiền bạc, sức khỏe, công việc, tình cảm) ở mức NĂM — KHÔNG chia theo tháng (ngoại lệ duy nhất: mục Tháng nóng nhất bằng Lưu Nguyệt).`;

  return `${INTERPRET_FRAMEWORK_MARKER}${monthlyBan}

Bạn hãy soạn thảo bình giải theo đúng khung dưới, gồm **${totalPartCount} khối**: **Phần 0 + ${totalPartCount - 1} phần đánh số** (không thêm / không bớt), rồi kết bằng **KẾT LUẬN CUỐI — 5 DÒNG**.
**Định dạng:** dùng \`##\`/\`###\` hoặc bold nhất quán; miễn đúng thứ tự và đủ mục. Không bắt buộc đúng chữ “Phần” nếu đã có số/tên mục rõ.

**NGUYÊN TẮC TINH GỌN & CHIỀU SÂU:**
- **Mỗi phần lớn là một chương đời**, không phải mục lục sao. Mở mỗi phần bằng 2–3 câu **đời** (bạn đang sống ra sao ở miền này), rồi dệt sao/cơ chế ngay trong cùng mạch.
- **Chỉ viết sâu mục chứa trục top 3** (xem block TRỌNG TÂM). Mục ngoài top 3 viết gọn 2–4 câu, không dàn đều.
- **Không lặp dữ kiện**: mỗi sao/cung chỉ xuất hiện ở nơi nó **đổi kết luận**. Không kể lại cùng một ý ở hai phần.
- **Độ dài gợi ý** (đủ sâu, không phình): Phần 0 = 5–7 câu; Phần 1 = 950–1.250 từ; Phần 2 = 1.050–1.350 từ; Phần 3 = 850–1.050 từ; Phần 4 = 450–600 từ; Kết luận = đúng 5 dòng.
- **Giữ đủ miền**: mọi mục con bắt buộc **đang áp dụng** bên dưới phải có mặt, dù lá êm hay nóng. Thiếu mục = bài không đạt cấu trúc.
- **Ưu tiên hoàn thành khung:** nếu ngân sách căng, cắt mục ngoài top 3 trước; không bao giờ bỏ Kết luận 5 dòng.

**MỤC BẮT BUỘC TRONG MỌI BÀI:**
- **Phần 0 — Chân dung & 3 trục chính**: mở bài bằng đúng 3 trục máy chấm (block TRỌNG TÂM), không thêm trục thứ 4.
- **Phần 1** phải có đủ 4 mục con: **Tính va đập & Điểm mù**, **Tự Phi Tứ Hóa**, **Độ sâu Tứ Hóa**, **Cấu trúc Sát Tinh**.
- **Phần ${doiSongPart}** phải có: **Sự nghiệp & Tài lộc** (tách rõ hai mục con **Sự nghiệp**, **Tài lộc**), **Tình cảm & gia đạo**, **Sức khỏe & môi trường sống**, **Các cung còn lại**.
- **Phần ${vanTrinhPart}** phải có đủ 2 mục con: **Đại hạn (10 năm)**, **Luận giải Tiểu Hạn** — chi tiết cho năm ${transitYearNum}.
- **Phần ${nenTangPart}** phải có: **Phúc Đức**, **Định cách & Tổng lực đa chiều**, **Đối chiếu chéo Bát Tự** (nếu có dữ liệu Bát Tự).
- **Toàn bài** **đan đa chiều 7 dải → 1 chùm**; cuối Phần ${nenTangPart} có **Tổng lực đa chiều** 4–6 câu.
- **Sau Phần ${nenTangPart}** phải có **KẾT LUẬN CUỐI — 5 DÒNG** đúng 5 dòng, lấy từ Tổng lực đa chiều.
- **Toàn bài** tuân **PROTOCOL TRÌNH BÀY SAO** + **STRUCTURE THỞ BẰNG ĐỜI**: mỗi ý = 1 mạch đời→sao (*thủ/hội/ngộ/phi Hóa*) — CẤM \`Sao@Cung\`; CẤM THÊM PHẦN ngoài khung (chỉ **Phần 0** và **Kết luận cuối** là hai mục đặc biệt được phép).
${buildStarPresentationFrameworkHint()}
${buildMultiLensFrameworkHint()}

## Phần 0: CHÂN DUNG & 3 TRỤC CHÍNH
**Mở đời (5–7 câu, đứng trước Phần 1 — không viết đoạn mở bài riêng nào khác):**
- Dùng TRỰC TIẾP block **"TRỌNG TÂM LÁ SỐ"** (máy đã chấm top 3). Gọi đúng 3 trục bằng **lời đời**, không đọc lại nhãn máy, không liệt kê sao.
- **Câu 1 — chân dung:** một nhát đời thực về kiểu người / cách đứng trong đời (neo 1 cụm sao then chốt, không catalog).
- **3 trục:** mỗi trục 1–2 câu: biểu hiện đời + cơ chế sao/cung/Hóa đỡ lời + hướng đi. Trục sáng nói cơ hội; trục nóng nói cái giá / cách giữ nhịp.
- **Câu chốt:** một câu "cách chơi" cả đời — trục nào làm vốn, trục nào phải quản trị.
- CẤM: thêm trục thứ 4; copy nguyên block máy; hù; khẳng định tuyệt đối. Mọi nhận định dùng **"CÓ XU HƯỚNG"** + điều kiện.

1. **BẢN SẮC & CƠ CHẾ VẬN HÀNH — BẠN LÀ AI KHI KHÔNG DIỄN**:
   **Câu mở phần (đời, 2–3 câu):** kiểu người bẩm sinh, cách phản ứng khi bị ép, cái giá thường trả. Rồi mới vào 4 mục con.
   **Neo bắt buộc:** Mệnh + Thân + tam phương; mở màn bằng **LAI NHÂN CUNG** (VŨ KHÍ 1) 2–4 mạch đầu — căn nguyên lựa chọn/ám ảnh bắt rễ từ đâu. Sau đó dệt Mệnh với 2–4 cụm sao then chốt (*thủ/hội/ngộ*), không dump hết tam phương.
   **Giọng:** dao mổ tâm lý — trúng, lạnh đủ tỉnh; không hù, không sỉ vả.

   ### Tính va đập & Điểm mù
   **BẮT BUỘC — mục riêng (heading hoặc bold nhất quán), viết SẮC, không bỏ dù lá êm.**
   Dùng TRỰC TIẾP **BẢNG B — TÍNH VA ĐẬP & ĐIỂM MÙ**:
   - **Tính va đập:** mở bằng **va với ai + chuyện đời** (bản thân / cha mẹ–cấp trên / bạn–đồng sự / đôi lứa / sếp). Cùng đoạn dệt xung / lục hại / nhị hợp / sát–kỵ đúng sheet. 2–4 câu/trục — không "dễ xung đột" chung chung.
   - **Điểm mù:** chỉ mầm mục C khớp sao lá. **Chọn 2–3 mầm trọng tâm nhất** (nếu chỉ 1 mầm đủ nặng thì 1): ưu tiên mầm chạm Mệnh/Thân/tam phương, tiền–việc–tình–sức hoặc kích hoạt hạn; bỏ mầm phụ/trùng ý. Nếu mục C ghi **"KHÔNG CÓ MẦM TRỌNG TÂM"**, chỉ nói ngắn 1 câu không có mù lớn nổi bật, không bịa. **Trên giấy:** (1) việc/niềm tin họ vẫn giữ → (2) hệ quả đời → (3) cơ chế sao–cung dệt vào.
   - **ĐỊNH DẠNG TỪNG MẦM ĐƯỢC CHỌN:** mỗi mầm có heading riêng (bold hoặc \`###\`) **"Điểm mù — [tên mầm]:"**. Không gộp nhiều mầm vào 1 đoạn; KHÔNG liệt kê mầm phụ chỉ để đủ số.
   - **ĐỊNH DẠNG TÍNH VA ĐẬP:** heading **"Tính va đập:"** luôn có (bold hoặc \`###\`), đứng đầu section.

   ### Tự Phi Tứ Hóa
   - Bám **KHỐI TỨ HÓA TỔNG HỢP**: tầng [1] bẩm sinh + tầng [2] Tự Hóa/Phi Hóa 12 cung + tầng [3] đường bay tâm lý Mệnh–Phúc Đức.
   - **Tối thiểu 02 đường bay** then chốt **khi máy có**; bắt buộc ít nhất 01 đường từ **Mệnh hoặc Phúc Đức** nếu dữ liệu có — mổ căn nguyên tâm lý, động cơ vô thức, cơ chế tự vệ. Dữ liệu ít hơn thì dùng đúng số có, nói rõ phần thiếu, không bịa.
   - Mỗi đường = **1 mạch đời** (lĩnh vực bị chạm) → *phi Hóa … vào …* (can phát → Hóa → sao thụ → cung đích / Tự Hóa). Chỉ dùng sao/cung máy; cấm tự nhẩm can/phi.
   - Cung không có Tự Hóa: nói rõ "không phát Tự Hóa" rồi chuyển đường phi sang cung đích.

   ### Độ sâu Tứ Hóa
   - **Hóa Lộc** (nguồn/lưu thông) và **Hóa Kỵ** (ải, chấp, hao, sẹo) — mở bằng hệ quả đời tại **đúng cung đóng**, rồi dệt sao/Hóa; không sáo.
   - Phân tầng: bẩm sinh ≠ hạn ≠ năm (miếu/hãm, tam phương, Lưu/Vận nếu có).
   - Tiền: tại đây chỉ nói **Hóa Lộc/Kỵ đóng cung nào**; việc kiếm/giữ mổ sâu ở **Phần ${doiSongPart} — Tài lộc**, không lặp.

   ### Cấu trúc Sát Tinh
   - Tối đa **3 cụm** từ lá + **BẢNG A — VÙNG ÁP LỰC SÁT/KỴ** (1 sát **thủ** cung + tuỳ 1 chính; cấm \`sát@cung\`). CẤM catalog lục sát.
   - Phân vai: Kình ≠ Đà ≠ Hỏa ≠ Linh ≠ Không ≠ Kiếp; đắc/hãm + hội Kỵ/cát khác nhau — **vai ẩn trong câu đời**.
   - Mỗi cụm + quan hệ máy (xung/tam hợp/nhị hợp/lục hại) → **1 sóng ngầm đời**; hóa giải thực hành đan cuối mạch.
   - Ít/không lục sát: vẫn viết — cấu trúc nhẹ / sát phụ; không bịa.

2. **ĐỜI SỐNG THỰC TẾ — TIỀN, VIỆC, TÌNH, SỨC, GIA ĐẠO**:
   **Câu mở phần (đời, 2–3 câu):** 5 miền đời đang nâng hay kéo bạn ở đâu; miền nào là trục top 3 thì viết sâu hơn. Rồi vào các mục con.
   **Nguyên tắc:** mỗi mục 2–4 đoạn; mỗi đoạn 1 cơ chế + 1 ví dụ đời + (tuỳ) 1 NÊN. Không dàn đều, không list sao.

   ### Sự nghiệp & Tài lộc
   **Mở đời:** bạn kiếm tiền bằng kiểu người nào, giữ tiền bằng kiểu người nào — hai chuyện khác nhau.
   #### Sự nghiệp
   - Bám **Quan Lộc + tam phương** (Mệnh–Tài–Quan) và cách cục; 2–3 cụm sao then chốt, không list cung.
   - Nói rõ: môi trường hợp (làm thuê / tự doanh / kỹ thuật / quan hệ), kiểu thăng tiến, chỗ dễ va chạm với cấp trên–đồng nghiệp. Dùng "CÓ XU HƯỚNG" + điều kiện.
   #### Tài lộc
   - Bám **Tài Bạch + "HAI TRỤC TÀI LỘC"** (Sinh Tài Mệnh–Tài–Quan vs Thủ Tài Phúc–Tài–Điền): chỉ rõ **kiếm** vs **giữ**, chỗ rò tiền, kiểu đầu tư phù hợp.
   - Khi khuyên rủi ro/đầu cơ, gọi tên rõ **tài sản rủi ro/đầu cơ (chứng khoán, coin, forex...)**, dùng thuật ngữ **"ngắn hạn theo tài sản rủi ro"** và quy tắc kỷ luật cắt lỗ/phân bổ vốn; dùng **"dễ xuất hiện"**, không dùng "khó tránh khỏi".
   - **Điền Trạch** để mục **Các cung còn lại**; tại đây chỉ chạm nếu là nguồn thu từ bất động sản.
   - Kết bằng **1 NÊN** cụ thể cho tiền–việc.

   ### Tình cảm & gia đạo
   - Bám **Phu Thê + tam phương** (đối Quan Lộc, tam hợp) — sao then chốt, không dump. Nói rõ: mong đợi bạn đời / kiểu áp–nương / chỗ dễ rạn.
   - **Tử Tức** chạm 1 câu nếu con cái trực tiếp làm rạn/nối hôn nhân; chi tiết để mục **Các cung còn lại**.
   - Kết bằng một lối thấu hiểu / nương tựa **may đo lá**, không sáo "hãy lắng nghe". Chỉnh theo tuổi mụ: vị thành niên → rung động/tình cảm bạn bè; chưa kết hôn → yêu đương; trưởng thành → vợ chồng/gia đạo.

   ### Sức khỏe & môi trường sống
   - **Mở đời:** chỗ cần giữ thân / đi lại / môi trường ngoài.
   - Bám **Tật Ách + Thiên Di + nhị hợp/lục hại** đúng máy → phòng ngừa cụ thể (không hù, không nghi lễ mê tín).
   - Chỉ nêu 2–3 điểm đáng chú ý; không biến thành bệnh án.

   ### Các cung còn lại
   - **Mở đời:** năm mối quan hệ / tài sản này đang nâng hay kéo bạn.
   - Lần lượt từng cung, mỗi cung **2–3 câu đời** + 1 cụm sao then chốt:
     - **Phụ Mẫu:** cha mẹ / cấp trên / thầy cô — chỗ được nâng hay bị soi.
     - **Huynh Đệ:** anh chị em / cộng tác gần — chỗ dựa hay so kè.
     - **Nô Bộc:** bạn bè / đồng nghiệp / mạng xã hội — vốn xã hội, chỗ dễ bị kéo.
     - **Tử Tức (Tử Nữ trong engine):** con cái / dự án tâm huyết — chỉnh theo tuổi mụ; người chưa có con thì luận dự án/đầu ra sáng tạo.
     - **Điền Trạch:** nhà cửa / tài sản lớn / chỗ ở — mua–bán–giữ; nối với trục Thủ Tài ở mục Tài lộc nhưng không lặp.
   - CẤM tách thành 5 phần; cung nào có tín hiệu mạnh thì viết sâu hơn.

3. **VẬN TRÌNH — ĐẠI HẠN HIỆN TẠI, NĂM NAY, THÁNG NÓNG**:
   **Câu mở phần (đời, 2–3 câu):** thập niên hiện tại đang **mở/siết** domain gì (tiền–việc–tình–sức) so với bản mệnh; chỉ nói bối cảnh trước/sau trong 1–2 câu, **KHÔNG liệt kê toàn bộ các Đại hạn**.

   ### Đại hạn (10 năm)
   - Mở: tầng đại hạn đời (mở/siết tài–quan–tình–sức) → neo **cung Đại hạn** + tuổi + can–chi.
   - Thịnh suy: chính/phụ/sát + miếu/hãm + tam phương **cung hạn** — dệt trong mạch đời, không list sao.
   - **Vận Tứ Hóa / phi đại vận**: gắn đúng dữ liệu khi có.
   - **Cách cục chạm cung Đại hạn**: bám block "CÁCH CỤC CHẠM CUNG VẬN" — 1–2 cách đang "sống" ở cung vận; gọi tên + [chất lượng] ĐÚNG block.
   - Nếu dữ liệu ghi **"Chưa vào Đại Hạn"** hoặc **童限**: chỉ nói tiền vận/chuẩn bị; **KHÔNG** luận như đã vào vận, **KHÔNG** gắn nhãn "ĐANG ĐI".
${monthlyFocusBlock}
   ### Luận giải Tiểu Hạn
   **ĐẦY ĐỦ + CHI TIẾT** năm **${transitYearNum}** (tuổi mụ). Gom thành **3 NHÓM LỚN** (không viết 12 mục rời):
   **NHÓM A — NEO NĂM & TÓM NĂM:**
     0. **THẺ SỰ KIỆN NĂM (ƯU TIÊN ĐẦU MỤC)**: cheat sheet **"THẺ SỰ KIỆN LƯU NIÊN"**. Mở [TÓM NĂM] bằng chuyện đời năm; xoáy **2–4 thẻ** nóng (headline đời + cơ chế sao/Lưu + 1 NÊN). CẤM bỏ thẻ ÁP LỰC.
     1. **Neo tiểu hạn**: cung + ages + quan hệ Mệnh/Thân/Đại hạn — nói **ý đời** rồi cung/sao.
     2. **Lưu Thái Tuế**: lĩnh vực cung đóng bị "đánh dấu năm" + sao đồng cung.
   **NHÓM B — KÍCH HOẠT & GIAO THOA:**
     3. **Sao lưu / Lưu Tứ Hóa**: bám thẻ domain — không list 12 cung.
     4. **KÍCH HOẠT HẠN ↔ ĐIỂM MÙ**: **BẢNG C**. CAO → bước ngoặt đời; VỪA → trong tóm năm. CẤM "năm bình hòa" khi còn CAO/ÁP LỰC. **Mỗi kích hoạt CAO có heading bold riêng "Kích hoạt — [tên domain]:" và chỉ nối với 1 trong 2–3 mầm trọng tâm đã chọn; không tạo mầm mới.**
     5. **Lưu Tứ Hóa đáp đâu**: bám tầng [4] "PHI TỨ HÓA ĐỘNG" — mỗi Lưu Hóa 1 câu kênh đời (Lộc mở ở đâu / Kỵ vướng ở đâu). Hóa nào không có thì nói thiếu, CẤM tự tra can/suy phi.
     6. **Giao đại hạn + Tuế Tiền / Tướng Tiền**: 1–2 cung trọng — ý đời rồi dệt sao.
     7. **Chủ tinh cung hạn**: đúng cung Tiểu hạn — chính tinh thủ (VCD thì mượn sao xung/tam hợp và nói rõ) + miếu/hãm + sát đồng cung + Tuần/Triệt/Không Vong; 1–2 cụm then chốt. **+ Cách cục chạm cung hạn**.
     8. **Giao thoa 3 tầng**: bám cheat sheet **"GIAO THOA 3 TẦNG GỐC×VẬN×LƯU"** — XOÁY mọi pin máy ghim (mỗi pin 1 mạch: việc đời → cơ chế đè nhau → 1 NÊN).
   **NHÓM C — BỐN CHỦ ĐỀ & THÁNG NÓNG:**
     9. **Bốn chủ đề năm** (tiền / sức / việc–học / tình–gia): thẻ + kích hoạt; chỉnh tuổi mụ.${part3YearSummary}
     10. Thẻ BT chéo **VẬN HẠN NĂM**: tối đa 1 nhãn máy khi chốt năm.
     11. **THÁNG NÓNG NHẤT (LƯU NGUYỆT — VŨ KHÍ 2)**: bám bảng LƯU NGUYỆT — chỉ đích danh 1–2 tháng nóng nhất của năm → mỗi tháng MỘT mạch (chuyện đời tháng đó → Hóa tháng neo máy → 1 NÊN). CẤM lập mục tháng riêng; CẤM liệt kê 12 tháng; CẤM tự nhẩm cung/can tháng.
   KỶ LUẬT: cấm bịa sao lưu; cấm "năm biến động" không neo; cấm bỏ heading **Luận giải Tiểu Hạn**; cấm bỏ pin giao thoa nào.

4. **NỀN TẢNG PHÚC BÁO & TỔNG LỰC — GỐC AN, ĐỊNH CÁCH, ĐỐI CHIẾU**:
   **Câu mở phần (đời, 2–3 câu):** trong người **an hay căng**, hưởng được thành quả không, và đâu là nền tảng để đi đường dài.

   ### Phúc Đức
   - Bám **cheat sheet "CỤM SAO PHÚC ĐỨC"** (sao + Xung/Tam hợp/Nhị hợp/Lục hại đã liệt) — cấm nhẩm index, cấm thêm sao.
   - Logic sao → chữ đời linh hoạt: cát/Lộc–Quyền–Khoa → gốc phúc dày, vất vả vẫn đáng; sát/Kỵ → dễ tự bào, hưởng không trọn; VCD → mượn sao chiếu/hợp sheet, không gán bừa.
   - Chỉ **một** hướng tu nội tâm may đo (đan cuối), không mục khuyên rời.

   ### Định cách & Tổng lực đa chiều
   - **Chốt hạ đời trước:** tầng phúc lộc cảm nhận được (phúc hậu / trung bình khá / lao tâm / thăng trầm) + điểm nương + điểm cảnh — rồi mới neo **"ĐẾM CÁT/HUNG"** + cách cục + miếu/hãm + Trường Sinh. CẤM phán máy "5 cát 2 hung nên giàu".
   - **Tổng lực đa chiều (4–6 câu, BẮT BUỘC)**: cốt cách · điểm mù · đẩy/hãm · 1 hành động năm · (tuỳ) 1 hình tượng — toàn đời dẫn, sao đã nằm trong các phần trên (không list lại 12 cung). Giọng đanh danh sư; đức năng thắng số = hành may đo, không sáo.

   ### Đối chiếu chéo Bát Tự
   - Chỉ viết khi có **LÁ SỐ BÁT TỰ + THẺ TIN CẬY**; thiếu thì bỏ mục, chỉ TV.
   - **KẾT LUẬN CUỐI DO TỬ VI DẪN.** Bát Tự = độ nhất quán, không "đúng/sai hóa" TV.
   - Gắn **[Đồng thuận] / [Bổ sung] / [Mâu thuẫn – thận trọng]** ĐÚNG tag máy — tối đa 1 nhãn/trục ở chốt đời trọng.
   - Map: Phần 0/1 → Bản sắc; Phần ${doiSongPart} → Tài/Quan; Tiểu hạn/năm → Hạn năm; định cách ≤1 thẻ mạnh.
   - CẤM bịa tag; CẤM "Đồng thuận mạnh" tự chế.

## KẾT LUẬN CUỐI — 5 DÒNG
Đúng **5 dòng**, mỗi dòng 1 câu, lấy thẳng từ **Tổng lực đa chiều** ở Phần ${nenTangPart}; không thêm mục, không lặp cả bài:
1. **Điểm mạnh nhất:** …
2. **Điểm cần tránh nhất:** …
3. **Giai đoạn then chốt:** …
4. **1 hành động ngay:** …
5. **Câu chốt:** …

Văn phong Markdown gọn, súc, đanh. **Mở bài:** vào thẳng **Phần 0** bằng một nhát đời thực + 3 trục máy chấm — **cùng nhịp** dệt 1 cụm sao then chốt; không viết đoạn mở bài riêng trước Phần 0. CẤM chào, CẤM mục lục phần, CẤM thêm khung ngoài ${totalPartCount} khối + Kết luận.`;
}
