import { INTERPRET_INCLUDE_MONTHLY_SECTION } from "../server/aiConfig";

/** Cheat sheet Lưu Nguyệt — chỉ gửi khi bật Phần 7 (tránh AI "tiếc data" viết tháng). */
export function buildLuuNguyetCheatSheetBlock(luuNguyetReportStr: string): string {
  if (!INTERPRET_INCLUDE_MONTHLY_SECTION) return "";
  return `--- CHEAT SHEET: LƯU NGUYỆT — 12 CUNG THÁNG ÂM LỊCH (HỆ THỐNG AN SẴN) ---
Hệ thống đã an sẵn cung an trú của từng tháng âm lịch trong năm xem hạn (theo Đẩu Quân) cùng can tháng và đường phi Lưu Nguyệt Tứ Hóa (Lộc/Quyền/Khoa/Kỵ của tháng đó đáp vào sao nào, cung nào). Dùng cho Phần 7. Dữ liệu tính sẵn:
${luuNguyetReportStr}

`;
}

function buildMonthlySectionBlock(
  transitYearNum: number,
  transitLunarAge: string | number | undefined,
): string {
  if (!INTERPRET_INCLUDE_MONTHLY_SECTION) return "";
  return `
7. **THÁNG TRỌNG TÂM TRONG NĂM ${transitYearNum}: TIỀN BẠC, SỨC KHỎE, CÔNG VIỆC, TÌNH CẢM**:
   Dựa TRỰC TIẾP vào cheat sheet "LƯU NGUYỆT — 12 CUNG THÁNG ÂM LỊCH" đã được hệ thống an sẵn (mỗi tháng âm đáp vào cung nào, can tháng nào, và Lưu Nguyệt Tứ Hóa Lộc/Quyền/Khoa/Kỵ của tháng đó bay vào sao/cung nào). TUYỆT ĐỐI không tự nhẩm lại cung tháng hay can tháng; nếu hệ thống báo thiếu dữ liệu thì nói rõ thiếu, không bịa.
   CÁCH TRÌNH BÀY (bắt buộc): TUYỆT ĐỐI KHÔNG liệt kê đều cả 12 tháng. Hãy QUÉT qua 12 tháng đã tính sẵn, RÚT RA các tháng trọng tâm rồi GOM theo CHỦ ĐỀ, chỉ nói những tháng thật sự đáng chú ý (có Lưu Lộc/Quyền/Khoa hoặc Lưu Kỵ đáp vào cung quan trọng). Trình bày theo các mục nhỏ, mỗi mục nêu tháng + chuyện cụ thể:
     - **TIỀN BẠC** (khi Tứ Hóa tháng đáp Tài Bạch/Điền Trạch/Quan Lộc): tháng nào dễ vào tiền (Lộc/Quyền), tháng nào hao tài/siết chi (Kỵ).
     - **SỨC KHỎE** (khi đáp Tật Ách/Thiên Di): tháng nào cần giữ gìn sức khỏe, coi chừng ốm đau/tai nạn nhỏ (Kỵ), tháng nào thể trạng sảng khoái.
     - **CÔNG VIỆC / HỌC HÀNH** (khi đáp Quan Lộc/Phụ Mẫu/Nô Bộc): tháng thuận thăng tiến/thi cử, tháng dễ thị phi va chạm.
     - **TÌNH CẢM / GIA ĐẠO** (khi đáp Phu Thê/Tử Tức/Huynh Đệ): tháng có tin vui tình cảm, tháng dễ lục đục.
   Nếu một chủ đề trong năm không có tháng nào nổi bật thì nói ngắn gọn "năm nay ít biến động về [chủ đề]", KHÔNG cố bịa tháng cho đủ mục.
   Nêu sự việc cực kỳ ĐỜI THỰC, RÕ được hay mất CÁI GÌ — TUYỆT ĐỐI KHÔNG dùng ngôn ngữ chung chung kiểu "tháng tiến công / tháng phòng thủ".
   NGUYÊN TẮC SUY SỰ VIỆC (bắt buộc): KHÔNG dùng câu mẫu cố định cho mọi người. Với MỖI tháng, hãy nhìn CHÍNH CUNG và sao mà Lưu Nguyệt Tứ Hóa của tháng đó đáp vào để suy ra ĐÚNG lĩnh vực đời sống bị động:
     - Tài Bạch → tiền bạc (lương thưởng, thu nhập, chi tiêu, hao hụt)
     - Quan Lộc → công việc, học hành, thi cử, công danh
     - Phu Thê → quan hệ đôi lứa/bạn đời (XEM TUỔI bên dưới)
     - Tật Ách → sức khỏe, đau ốm, tai nạn nhỏ
     - Nô Bộc → bạn bè, đồng nghiệp, cộng sự, mạng xã hội
     - Phụ Mẫu → cha mẹ, cấp trên, thầy cô
     - Tử Tức → con cái, đầu tư/dự án tâm huyết (XEM TUỔI)
     - Điền Trạch → nhà cửa, chỗ ở, tài sản lớn
     - Huynh Đệ → anh chị em, cộng tác gần gũi
     - Thiên Di → đi lại, di chuyển, ra ngoài, môi trường mới
   Tính chất Hóa: Lưu Lộc/Quyền/Khoa → được, thuận, có tin vui ở lĩnh vực đó; Lưu Kỵ → mất, trắc trở, hao tổn, lo lắng ở lĩnh vực đó.
   ĐIỀU CHỈNH THEO TUỔI (bắt buộc, căn cứ Tuổi mụ = ${transitLunarAge ?? "chưa rõ"}): ngôn từ phải khớp vòng đời thật của đương số. Nếu còn nhỏ/vị thành niên (dưới ~18): Phu Thê luận thành rung động đầu đời, tình cảm bạn bè khác giới, KHÔNG nói vợ chồng/cưới hỏi/ly hôn; Quan Lộc luận thành học hành thi cử; Tử Tức KHÔNG nói con cái. Nếu đã trưởng thành mà chưa lập gia đình: Phu Thê luận thành chuyện yêu đương, hẹn hò, người đang tìm hiểu. Chỉ nói vợ chồng/con cái/ly hôn khi độ tuổi và bối cảnh hợp lý. Tương tự, người lớn tuổi thì Quan Lộc thiên về công việc/hưu trí thay vì thi cử.
   VĂN PHONG: dùng ngôn ngữ đời sống hiện đại, gần gũi với ai cũng gặp (lương thưởng, ốm đau, cãi vã, mua sắm, đi lại, học hành, yêu đương); chỉ nhắc đến hợp đồng/giấy tờ/pháp lý KHI bối cảnh lá số cho thấy đương số là người kinh doanh/đầu tư/làm ăn lớn. MỤC TIÊU cuối cùng: để đương số NHỚ NHANH được "năm nay tháng nào lo tiền, tháng nào lo sức khỏe, tháng nào thuận việc, tháng nào vui chuyện tình cảm" — gọn, trọng tâm, không dàn trải.
`;
}

const natalTuHoaHint = (natalTuHoaResolved: boolean) =>
  natalTuHoaResolved
    ? `Sử dụng TRỰC TIẾP bảng "TỨ HÓA BẨM SINH (NATAL)" mà hệ thống đã tính sẵn ở trên (đã ghi rõ mỗi Hóa rơi vào sao nào, đóng tại cung nào). TUYỆT ĐỐI không tự tra lại bảng can hay tự đoán vị trí sao.`
    : `Hệ thống chưa tính sẵn được Tứ Hóa bẩm sinh (xem phần LƯU Ý ở trên). Hãy xử lý thận trọng: chỉ suy luận Tứ Hóa nếu xác định chắc chắn được can năm sinh và phải ghi rõ đó là suy luận; nếu không, nói rõ thiếu dữ liệu thay vì bịa vị trí sao.`;

/** Khung 9/10 phần luận giải chương trình — Phần 7 tháng tùy flag. */
export function buildInterpretFrameworkBlock(
  transitYearNum: number,
  chartData: { transitLunarAge?: number | string },
  natalTuHoaResolved: boolean,
): string {
  const includeMonthly = INTERPRET_INCLUDE_MONTHLY_SECTION;
  const partCount = includeMonthly ? 10 : 9;
  const phucDucPart = includeMonthly ? 8 : 7;
  const dinhCachPart = includeMonthly ? 9 : 8;

  const monthlyBan = includeMonthly
    ? ""
    : `
TUYỆT ĐỐI KHÔNG viết mục "Tháng trọng tâm trong năm", không luận theo tháng âm lịch, không liệt kê tháng 1–12, không dùng Lưu Nguyệt trong bài luận chính. Vận hạn chỉ dừng ở mức NĂM (Phần 4).
`;

  const part4YearSummary = includeMonthly
    ? ""
    : `
   Cuối Phần 4, tóm tắt xu hướng cả năm ${transitYearNum} theo 4 chủ đề (tiền bạc, sức khỏe, công việc, tình cảm) ở mức NĂM — KHÔNG chia theo tháng.`;

  return `--- KHUNG LUẬN GIẢI CHƯƠNG TRÌNH CHI TIẾT ---${monthlyBan}

Bạn hãy soạn thảo bình giải chi tiết gồm ${partCount} phần lớn sau đây bằng chữ quốc ngữ cực kỳ sâu sắc, phân tích chính xác từng sao và kết nối liên hoàn:

1. **TAM PHƯƠNG TỨ CHÍNH & THẾ ĐỨNG LÁ SỐ (BẢN SẮC CẤU TRÚC Ý THỨC & 8 PHẦN CHIỀU SÂU - PHẢN XẠ CHỦ QUAN)**:
   Mổ xẻ sâu sắc tính cách bẩm sinh của đương số bằng cách liên kết chặt chẽ cung Mệnh với 3 cung vị vây quanh học thuyết Tam Phương Tứ Chính: Thiên Di (đối cung), Quan Lộc (tam hợp), Tài Bạch (tam hợp). Bạn hãy trích xuất trực tiếp tên các sao đóng ở ba cung vị này của họ để phân tích điểm sáng, điểm hiểm nghệ thuật hành xử bấy lâu và điểm mù cốt lõi bẩm sinh. Chỉ rõ nghiệp lý nhân quả đã tự định hình từ thói phản xa bộc trực không tự biết của họ bấy lâu nay.
   Theo tinh thần Trung Châu Phái (trọng tinh tình & cách cục): hãy dùng phần "CÁCH CỤC CHÍNH TINH" đã nhận diện sẵn ở trên làm xương sống định cốt cách bản mệnh, rồi đọc sâu tinh tình (bản chất) của từng chính tinh trong tổ hợp đó thay vì chỉ liệt kê tên sao. Đồng thời soi phần "TỰ HÓA" để chỉ ra các điểm mà năng lượng tự phát lộ hoặc tự hao tổn ngay trong nội tâm đương số.
   Bắt buộc lồng thêm hai lớp chiều sâu đã được hệ thống tính sẵn: (a) Dựa vào cheat sheet "LAI NHÂN CUNG" để truy về căn nguyên (來因) bẩm sinh — chỉ rõ nguồn cơn sâu xa nhất chi phối mọi lựa chọn và ám ảnh của đương số bắt rễ từ lĩnh vực nào; (b) Đối chiếu trục Mệnh (tư duy bẩm sinh, chủ đạo nửa đầu đời ~trước 30) với Cung Thân (đã neo riêng ở phần "CUNG THÂN" phía trên — hành động/hậu vận, chủ đạo ~sau 30) để vạch trần khúc ngoặt chuyển hóa nội tâm → hành vi mà đương số phải tự biết để tiến lui đúng nhịp; (c) Nếu cheat sheet "TUẦN / TRIỆT / KHÔNG VONG" ghi cung trọng (Mệnh/Thân/Tài/Quan…) bị chiếu — phải hiệu chỉnh mức phát cách (hạ giọng phú quý, không phủ nhận cả cách nếu còn cát; cấm bịa Tuần/Triệt ngoài danh sách máy).

2. **KRONOS TỨ HÓA (KHOA - QUYỀN - LỘC - KỴ) THEO KINH TOÀN NIÊN CHIẾN LƯỢC**:
   ${natalTuHoaHint(natalTuHoaResolved)}
   Hãy luận giải sướng khổ tương ứng tại các cung vị đó. Đặc biệt xới sâu Hóa Lộc (kho tài nguyên vũ trụ ban tặng) và Hóa Kỵ (ải nợ nần, ám ảnh sợ hãi, vết sẹo dằn vặt thẳm sâu).
   Đồng thời phân tích tối thiểu 02 đường phóng Tự Phi Tứ Hóa của các cung then chốt (Cung Mệnh, Cung Tài, Cung Quan) dựa vào dòng "Phi Tứ Hóa" đã tính sẵn trong từng cung, xem chúng tự phi Lộc hay phi Kỵ đi đâu để thấy hành trình luân chuyển dòng khí đời người.
   Khi luận tiền tài, BẮT BUỘC dùng cheat sheet "HAI TRỤC TÀI LỘC" để tách bạch rõ hai năng lực: trục SINH TÀI (Mệnh-Tài-Quan = cách KIẾM tiền, tạo dòng tiền) và trục THỦ TÀI (Phúc-Tài-Điền = cách GIỮ của, tích sản). Phải chỉ thẳng đương số thuộc kiểu nào: kiếm giỏi mà giữ không nổi (tiền vào tiền ra), hay thủ chắc mà khó bứt phá, căn cứ vào sao thực ở từng trục.

3. **ẢNH HƯỞNG CỦA CÁC ĐỒNG CUNG & SÁT TINH TƯƠNG TÁC CHIẾN LƯỢC**:
   Phát giác và cô lột sự tàn phá của các Sát Tinh hiểm yếu (Địa Không, Địa Kiếp, Kình Dương, Đà La, Hỏa Tinh, Linh Tinh) đóng trên mệnh bàn đương số. Xét mối liên kết Nhị Hợp hoặc Lục Hại của cung bị ám để xem các cơn sóng dữ ngầm rạn nứt phát triển thế nào. Chỉ ra bí quyết tự nén mình cải tâm sửa nết để hóa hung thành cát một cách khoa học thực hành.

4. **VẬN TRÌNH ĐẠI VẬN 10 NĂM & LUẬN TIỂU HẠN NĂM NĂM ĐƯƠNG KIM ${transitYearNum}**:
   Luận đoán Đại vận đương đi dựa vào sự thịnh suy can chi của cung vị Đại hạn đó. 
   Sau đó đi phân tích sâu sắc năm xem vận hạn ${transitYearNum}. Bạn PHẢI tìm kiếm chính xác các Sao Lưu niên (đã được đánh dấu có tiền tố \`[SAO LƯU]\` trong mảng dữ liệu star chi tiết của cung vị như: Lưu Thái Tuế, Lưu Lộc Tồn, Lưu Tang Môn, Lưu Bạch Hổ, Lưu Thiên Mã, Lưu Kình, Lưu Đà, Lưu Khốc, Lưu Hư, cùng nhóm Lưu Tứ Hóa gồm Lưu Hóa Lộc, Lưu Hóa Quyền, Lưu Hóa Khoa, Lưu Hóa Kỵ - mỗi sao đã ghi kèm tên chính tinh thụ hóa trong ngoặc) để chỉ rõ: Năm nay súng đạn biến thiên sẽ nổ ra ở cung vị nào? Thị phi, dời nhà cửa thăng trầm hay lộc tiền mặt, hỷ tín tang gia hiển lộ cụ thể ra sao cực kỳ đời thực.${part4YearSummary}

5. **CUNG PHU THÊ & THẾ THIÊN SÁT GIA ĐẠO: ĐỐI THOẠI KHẮC-HỢP**:
   Sử dụng Cung Phu Thê làm trục chính kết hợp Tam Phương Tứ Chính (cung đối Quan Lộc, và các cung tam hợp vây quanh) để vạch trần mong đợi bẩm sinh của đương số về bạn đời hay xu thế áp đặt, khuyết tật ứng xử làm rạn vỡ gia đạo. Chỉ vẽ con đường đôi bên cùng thấu hiểu, nương tựa dịu hiền.

6. **SỨC KHỎE TẬT ÁCH & THIÊN DI PHỊ HẠN CHỦ ĐỘNG PHÒNG NGỪA**:
   Phân tích Cung Tật Ách song chiếu cùng Thiên Di và quan hệ Nhị Hợp, Lục hại rình rập để khuyên bảo đương số phòng ngừa hao tổn sinh căn lực lượng, dịch chuyển xuất ngoại chủ động phòng trừ nguy biến pháp lý tai ương.
${buildMonthlySectionBlock(transitYearNum, chartData.transitLunarAge)}
${phucDucPart}. **CUNG PHÚC ĐỨC: GỐC AN - BẤT AN & PHÚC BÁO HƯỞNG THỤ**:
   Dùng TRỰC TIẾP cheat sheet "CỤM SAO PHÚC ĐỨC" hệ thống đã tính sẵn làm trục chính: chỉ được luận trên đúng các sao (chính tinh, trợ/cát tinh, sát/tạp tinh) và đúng các cung Xung chiếu / Tam hợp / Nhị hợp / Lục hại đã liệt kê sẵn trong cheat sheet. TUYỆT ĐỐI không tự nhẩm lại index cung, không thêm sao không có trong dữ liệu. Từ đó mổ xẻ chất lượng đời sống tinh thần, mức độ an hay bất an tự thân, phúc báo thừa hưởng và năng lực hưởng thụ thành quả của đương số.
   NGÔN TỪ LINH HOẠT THEO ĐÚNG LOGIC SAO (bắt buộc, không dùng câu mẫu chung): nếu Phúc Đức có cát tinh/Hóa Lộc-Quyền-Khoa đời vào (theo đúng dữ liệu) thì luận gốc phúc dày, dù vất vả vẫn thấy đáng và lòng thanh thản; nếu có sát tinh/Hóa Kỵ (đối chiếu cheat sheet vùng sát kỵ) thì luận dễ tự dằn vặt, suy nghĩ tiêu cực, hưởng phúc không trọn dù tiền tài có dư; nếu Vô Chính Diệu thì mượn sao xung chiếu/tam hợp đã liệt kê để luận, KHÔNG gán sắc thái không căn cứ. Chỉ rõ đương số cần tu dưỡng nội tâm điểm nào để gốc phúc dày thêm thay vì tự bào mòn an lạc.

${dinhCachPart}. **ĐỊNH CÁCH PHÚ QUÝ BẦN TIỆN — CÂU KẾT TỔNG LỰC MỆNH**:
   Đây là PHẦN CHỐT HẠ cuối bài. Dùng cheat sheet "ĐẾM CÁT/HUNG ĐỊNH CÁCH PHÚ QUÝ" kết hợp cách cục chính tinh, miếu/hãm và thế đất Tràng Sinh ở trên để ĐÚC KẾT một nhận định tổng về tầng phúc lộc của đương số: cốt cách thuộc tầng nào (phúc hậu / trung bình khá / lao tâm vất vả / thăng trầm lớn), điểm sáng nhất để nương vào và điểm hiểm nhất phải cảnh chừng cả đời. TUYỆT ĐỐI không phán máy móc theo số đếm (vd "5 cát 2 hung nên giàu") — con số chỉ là gợi ý, phải luận bằng cả chất lượng sao, miếu hãm và thế đất. Viết câu kết bằng giọng đanh thép, thật lòng của một danh sư — vừa thẳng thắn chỉ ra vận mệnh, vừa mở cho đương số con đường đức năng thắng số, tự cải vận bằng tu tâm sửa nết.

**ĐỐI CHIẾU CHÉO & CHẤM ĐỘ TIN CẬY BÁT TỰ ↔ TỬ VI (bắt buộc khi có dữ liệu Bát Tự ở trên)**:
   KẾT LUẬN CUỐI LUÔN DO TỬ VI DẪN. Bát Tự là HỆ ĐỐI CHIẾU để chấm độ tin cậy, KHÔNG phải "chân lý" để xác minh đúng/sai Tử Vi. Đây là đối chiếu ĐỘ NHẤT QUÁN giữa hai trường phái, không phải kiểm chứng khách quan — nói đúng bản chất, không thổi phồng độ chính xác.
   Ở các Phần trọng yếu (1 bản sắc, 2 tài/quan, 4 vận hạn, ${dinhCachPart} định cách), với MỖI kết luận Tử Vi quan trọng, hãy SOI lá Bát Tự (theo "KHO TRI THỨC TỬ BÌNH" đã truy hồi: Vượng–Nhược Nhật Chủ → Dụng thần → Hỷ–Kỵ → Thập Thần/Thần Sát) rồi GẮN MỘT NHÃN tin cậy ngắn ngay sau kết luận đó:
   - **[Đồng thuận mạnh]** khi hai hệ cùng chỉ một hướng (vd Tử Vi luận hợp kinh doanh + Bát Tự Thân vượng Tài vượng/Tài là Dụng) → luận quả quyết, nhấn mạnh, độ tin cậy cao.
   - **[Bổ sung]** khi Bát Tự không mâu thuẫn nhưng làm rõ thêm sắc thái/cơ chế/thời điểm mà Tử Vi chưa nói hết (vd Bát Tự cho biết Dụng thần là Hỏa nên các Đại vận/Lưu niên hành Hỏa mới thực phát) → ghi nhận như lớp chiều sâu, vẫn để Tử Vi dẫn.
   - **[Mâu thuẫn – thận trọng]** khi hai hệ lệch nhau (vd Tử Vi cát mà Bát Tự Thân nhược không gánh nổi) → KHÔNG cưỡng ép, nêu rõ cả hai góc nhìn, hạ giọng dè dặt thay vì khẳng định chắc nịch, và ưu tiên xét vận hạn (Đại Hạn Tử Vi + Đại Vận Bát Tự) để phân kỳ thời điểm.
   Quy chiếu cụ thể: Nhật Chủ (can ngày) + ngũ hành vượng/nhược + Thập Thần nổi bật ↔ chính tinh thủ Mệnh/Thân (cốt cách & động lực gốc). Tài tinh/Quan tinh (Bát Tự) ↔ cung Tài Bạch/Quan Lộc (Tử Vi). Đại Vận (Bát Tự) ↔ Đại Hạn/lưu niên (Tử Vi).
   KỶ LUẬT: chỉ gắn nhãn ở các kết luận TRỌNG YẾU (đừng rải nhãn khắp bài làm loãng). Đừng tạo "rigor giả" bằng cách ép đối chiếu những chỗ hai hệ vốn không khớp 1-1. Khi viện dẫn nguyên tắc/thuật ngữ Bát Tự, nói rõ nguồn (Tử Bình) để minh bạch.

Văn phong trình bày bằng Markdown gọn gàng, súc mộc nhưng đanh thép học thuật tột bậc. Mở đầu bằng một câu nói trực diện đầy uy lực xoáy sâu thẳng thắn nhân tính, từ ngữ thấu tỏ hiện đại và tâm can thực thụ của một danh sư hữu tâm!`;
}

/** Số phần Phúc Đức / Định cách / Trường Sinh theo flag tháng. */
export function interpretPartNumbers() {
  const includeMonthly = INTERPRET_INCLUDE_MONTHLY_SECTION;
  return {
    phucDucPart: includeMonthly ? 8 : 7,
    dinhCachPart: includeMonthly ? 9 : 8,
  };
}