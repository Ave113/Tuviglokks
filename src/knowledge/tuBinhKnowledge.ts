// ============================================================================
// KHO TRI THỨC TỬ BÌNH (BÁT TỰ) SÂU — Cấp 2 (RAG-lite).
//
// Nguồn: bộ tài liệu Tử Bình hợp nhất của dự án (Tử Bình Chân Thuyên, Trích
// Thiên Tủy, Cùng Thông Bảo Giám), viết lại tiếng Việt. Mục tiêu: cho AI "luận
// CÓ SÁCH, không bịa" khi đối chiếu chéo với Tử Vi.
//
// Cách hoạt động giống chineseKnowledge.ts: lưu tri thức thành các MẪU
// (KnowledgeEntry) gắn THẺ (tags). Khi luận một lá số cụ thể, retrieveTuBinh()
// chấm điểm theo mức trùng thẻ với bối cảnh (Thập Thần nổi bật trên Bát Tự,
// ngũ hành thiên lệch, chủ đề người dùng hỏi) và CHỈ chèn vài mẫu liên quan
// nhất + các mẫu NỀN TẢNG (vượng-nhược, dụng thần, hỷ-kỵ, trình tự) luôn có mặt.
//
// LƯU Ý CỐT LÕI (xuyên suốt): mọi Thập Thần / Thần Sát / Cách cục chỉ tốt hay
// xấu TÙY theo Hỷ–Kỵ và Vượng–Suy của toàn cục. Đọc mọi câu luận với nghĩa
// "CÓ XU HƯỚNG", không phải "CHẮC CHẮN". Đây là tri thức mệnh lý truyền thống,
// mang tính tham khảo/tín ngưỡng, không phải kết luận khoa học kiểm chứng được.
// ============================================================================

import type { KnowledgeEntry } from "./chineseKnowledge";

const SRC = "Tử Bình (Bát Tự) — tài liệu hợp nhất dự án";

// ----------------------------------------------------------------------------
// CƠ SỞ TRI THỨC TỬ BÌNH SÂU
// ----------------------------------------------------------------------------

export const TU_BINH_KNOWLEDGE: KnowledgeEntry[] = [
  // ===== PHẦN I — NỀN TẢNG TÍNH TOÁN =====
  {
    id: "tb-tu-tru-doi-nguoi",
    tags: ["tứ trụ", "niên trụ", "nguyệt trụ", "nhật trụ", "thời trụ", "đời người", "đại vận", "gia đình", "con cái", "hậu vận"],
    title: "4 trụ ánh xạ theo đời người",
    source: SRC,
    content:
      "Niên trụ (gốc rễ / 0–15 tuổi / tổ tiên) → Nguyệt trụ (thân cành / 16–30 tuổi / cha mẹ, sự " +
      "nghiệp) → Nhật trụ (hoa / 31–45 tuổi / bản thân & bạn đời; can ngày = Nhật Chủ, chi ngày = " +
      "cung phối ngẫu) → Thời trụ (quả / 46+ tuổi / con cái, hậu vận). Đọc một Thập Thần ở trụ nào " +
      "thì ứng vào giai đoạn/đối tượng tương ứng của trụ đó.",
  },
  {
    id: "tb-tang-can",
    tags: ["tàng can", "nhân nguyên", "địa chi", "thông căn", "bản khí", "trung khí", "dư khí"],
    title: "Tàng Can — Nhân nguyên trong Địa Chi",
    source: SRC,
    content:
      "Mỗi Địa Chi chứa 1–3 Thiên Can ẩn (bản khí / trung khí / dư khí) — gốc để định Thập Thần và xét " +
      "thông căn. Tý:Quý. Sửu:Kỷ,Quý,Tân. Dần:Giáp,Bính,Mậu. Mão:Ất. Thìn:Mậu,Ất,Quý. Tỵ:Bính,Mậu," +
      "Canh. Ngọ:Đinh,Kỷ. Mùi:Kỷ,Đinh,Ất. Thân:Canh,Nhâm,Mậu. Dậu:Tân. Tuất:Mậu,Tân,Đinh. Hợi:Nhâm," +
      "Giáp. Nhật Chủ có gốc trong tàng can các chi (Lộc/Nhận/Trường sinh/Khố) thì coi là có rễ (thông căn).",
  },
  {
    id: "tb-vuong-nhuoc",
    tags: ["thân vượng", "thân nhược", "vượng nhược", "nhật chủ", "đắc lệnh", "thông căn", "đắc thế", "thấu xuất", "nền tảng"],
    title: "Xét Vượng / Nhược Nhật Chủ (4 tiêu chí)",
    source: SRC,
    content:
      "Đây là bước quyết định ~90% việc chọn Dụng thần. 4 tiêu chí: (1) Đắc lệnh — Nhật can được " +
      "sinh/vượng bởi Nguyệt lệnh (chi tháng), mạnh nhất (~40% lực). (2) Đắc địa/Thông căn — có gốc " +
      "trong tàng can (Lộc, Nhận, Trường sinh, Khố). (3) Đắc thế — số lượng Ấn (sinh thân) + Tỷ Kiếp " +
      "(trợ thân). (4) Thấu xuất — can ẩn lộ lên Thiên can, lực được khuếch đại. Đắc lệnh quan trọng " +
      "nhất; mất lệnh mà nhiều gốc + nhiều Ấn/Tỷ vẫn có thể Thân vượng.",
  },
  {
    id: "tb-truong-sinh",
    tags: ["trường sinh", "lâm quan", "lộc", "lộc thần", "đế vượng", "dương nhận", "mộ", "khố", "12 cung"],
    title: "Vòng Trường Sinh 12 cung (gốc của Lộc, Nhận, Mộ)",
    source: SRC,
    content:
      "Trường sinh → Mộc dục → Quan đới → Lâm quan (Lộc) → Đế vượng (Nhận) → Suy → Bệnh → Tử → Mộ " +
      "(Khố) → Tuyệt → Thai → Dưỡng. Lộc Thần = cung Lâm quan của Nhật can; Dương Nhận = cung Đế vượng " +
      "(chỉ can Dương). Đây là gốc tính Lộc, Nhận, Dịch Mã, Đào Hoa và mức vượng suy theo mùa.",
  },
  {
    id: "tb-thien-can-hop-khac",
    tags: ["thiên can", "ngũ hợp", "hợp hóa", "can", "tương khắc", "hợp"],
    title: "Thiên Can: Ngũ hợp & Sinh khắc",
    source: SRC,
    content:
      "Ngũ hợp (hợp hóa): Giáp+Kỷ→Thổ · Ất+Canh→Kim · Bính+Tân→Thủy · Đinh+Nhâm→Mộc · Mậu+Quý→Hỏa. " +
      "Hợp hóa chỉ thành khi đắc nguyệt lệnh của hành hóa & không bị xung phá; hợp mà không hóa thì can " +
      "bị 'trói', giảm tác dụng. Tương khắc theo Ngũ hành (Giáp khắc Mậu, Bính khắc Canh, Mậu khắc Nhâm…).",
  },
  {
    id: "tb-dia-chi-hop-hoi",
    tags: ["địa chi", "tam hợp", "tam hội", "lục hợp", "bán hợp", "xung", "hợp cục"],
    title: "Địa Chi: Hợp – Hội – Bán hợp",
    source: SRC,
    content:
      "Tam Hợp cục: Thân-Tý-Thìn→Thủy · Hợi-Mão-Mùi→Mộc · Dần-Ngọ-Tuất→Hỏa · Tỵ-Dậu-Sửu→Kim. " +
      "Tam Hội phương (mạnh nhất): Dần-Mão-Thìn→Mộc · Tỵ-Ngọ-Mùi→Hỏa · Thân-Dậu-Tuất→Kim · Hợi-Tý-Sửu→Thủy. " +
      "Lục Hợp: Tý-Sửu, Dần-Hợi, Mão-Tuất, Thìn-Dậu, Tỵ-Thân, Ngọ-Mùi. Bán hợp: 2/3 chi tam hợp có chi " +
      "giữa (Tý/Ngọ/Mão/Dậu). Thứ tự ưu tiên: Hội > Hợp ≈ Xung > Hình > Hại. Hợp có thể giải Xung; Xung " +
      "có thể phá Hợp tùy lực.",
  },

  // ===== PHẦN II — 10 THẬP THẦN THEO TỪNG TRỤ =====
  // (Tất cả chỉ ứng rõ khi Thập Thần đó là HỶ thần; nếu là KỴ thì đảo ngược — xem tb-nap-am-dac-that.)
  {
    id: "tb-tt-tai",
    tags: ["chính tài", "thiên tài", "tài tinh", "tiền bạc", "tài chính", "vợ", "cha", "kinh doanh", "thập thần"],
    title: "Thập Thần: Chính Tài & Thiên Tài (theo trụ)",
    source: SRC,
    content:
      "Nhật Chủ khắc, chủ tiền tài, vật chất, vợ (với nam). Chính Tài = thu nhập ổn định, tiết kiệm, vợ " +
      "chính thức: Niên→nền tảng kinh tế tốt; Nguyệt→quản lý tài chính giỏi, hợp hành chính/kế toán; " +
      "Nhật chi→nam lấy vợ hiền trợ lực; Thời→hậu vận giàu, tích sản. Thiên Tài = tài bất ngờ, kinh " +
      "doanh, cha, người tình: Nguyệt→nhạy bén kinh tế, hào phóng, hợp kinh doanh mạo hiểm; Nhật " +
      "chi→nam dễ đa tình hoặc bạn đời giỏi kiếm nhưng tiêu hoang. CỐT: Tài cách phải THÂN VƯỢNG mới " +
      "gánh được tài; thân nhược gặp Tài = 'Phú ốc bần nhân', bôn ba vì tiền.",
  },
  {
    id: "tb-tt-quan-sat",
    tags: ["chính quan", "thất sát", "thiên quan", "quan sát", "sự nghiệp", "quyền lực", "danh vị", "chồng", "thập thần"],
    title: "Thập Thần: Chính Quan & Thất Sát (theo trụ)",
    source: SRC,
    content:
      "Khắc Nhật Chủ, chủ sự nghiệp, danh vị, kỷ luật, chồng (với nữ). Chính Quan đoan chính, hợp công " +
      "danh/quản lý: Nguyệt→liêm khiết, thăng tiến sớm; Nhật chi→nữ lấy chồng quý hiển. Thất Sát/Thiên " +
      "Quan mạnh mẽ, quyết liệt, hợp võ chức/khởi nghiệp nhưng vô chế thì thành áp lực, tai ách: Nguyệt→" +
      "quyết đoán dễ cực đoan; Nhật chi→vợ chồng dễ bất hòa, nóng nảy. CỐT: 'Thất Sát có Thực Thần chế " +
      "hóa' hoặc 'Sát Ấn tương sinh' → biến áp lực thành quyền uy, hậu vận đại quý. Cảnh báo: 'Thất Sát " +
      "→ tai nạn/đoản thọ' CHỈ đúng khi Sát vượng công thân, thân nhược vô chế.",
  },
  {
    id: "tb-tt-an",
    tags: ["chính ấn", "thiên ấn", "kiêu thần", "ấn tinh", "học vấn", "học hành", "mẹ", "quý nhân", "tâm linh", "thập thần"],
    title: "Thập Thần: Chính Ấn & Thiên Ấn / Kiêu (theo trụ)",
    source: SRC,
    content:
      "Sinh Nhật Chủ, chủ học thức, che chở, danh dự, mẹ. Chính Ấn nhân hậu, học hành thuận, có quý " +
      "nhân: Niên→dòng dõi thư hương; Nguyệt→nhân hậu, tài hoa, mẹ ảnh hưởng lớn; Thời→hậu vận an nhàn, " +
      "con cái đỗ đạt. Thiên Ấn/Kiêu Thần thiên về kỹ năng đặc thù, tâm linh, triết học, nghệ thuật độc " +
      "đáo, dễ cô độc: 'Kiêu đoạt Thực' thì hao phúc, lo nghĩ nhiều, khó phát theo đường công chức. Ấn " +
      "trợ thân nhược rất tốt; thân vượng mà Ấn nhiều thì trì trệ, ỷ lại.",
  },
  {
    id: "tb-tt-thuc-thuong",
    tags: ["thực thần", "thương quan", "thực thương", "sáng tạo", "tài hoa", "con cái", "thị phi", "phúc khí", "thập thần"],
    title: "Thập Thần: Thực Thần & Thương Quan (theo trụ)",
    source: SRC,
    content:
      "Nhật Chủ sinh ra, chủ tài năng, biểu đạt, sáng tạo, ăn nói, con cái (với nữ). Thực Thần ôn hòa, " +
      "phúc khí, tuổi thọ, hưởng thụ: hợp dịch vụ, ẩm thực, nghệ thuật; tiền tự đến. Thương Quan thông " +
      "minh sắc sảo, sáng tạo đột phá, hùng biện nhưng kiêu ngạo, dễ phạm thượng, khắc Chính Quan: " +
      "Nguyệt→tài hoa phát tiết nhưng dễ thị phi công sở; Nhật chi→hôn nhân bất ổn (nam khắc vợ, nữ " +
      "khắc chồng). 'Thương Quan kiến Quan' chủ thị phi/kiện tụng — NHƯNG chỉ là họa khi Quan là Dụng; " +
      "nếu được Tài hóa hoặc Ấn chế thì ngược lại có thể vượng phu ích tử.",
  },
  {
    id: "tb-tt-ty-kiep",
    tags: ["tỷ kiên", "kiếp tài", "tỷ kiếp", "cạnh tranh", "anh em", "bạn bè", "hợp tác", "khởi nghiệp", "hao tài", "thập thần"],
    title: "Thập Thần: Tỷ Kiên & Kiếp Tài (theo trụ)",
    source: SRC,
    content:
      "Cùng hành với Nhật Chủ, chủ anh em, bạn bè, đồng nghiệp, cạnh tranh, cái tôi. Tỷ Kiên tự tin, tự " +
      "lập, độc lập, hợp tự khởi nghiệp hơn làm thuê; nhưng khắc bạn đời, dễ bị người thứ ba chen chân. " +
      "Kiếp Tài liều lĩnh, hao tài, 'tiền vào tay trái ra tay phải', dễ bị bạn bè lừa gạt hoặc tốn vì " +
      "anh em; nam dễ khắc vợ. CỐT: khi THÂN NHƯỢC, Tỷ Kiếp lại là CỨU TINH (trợ thân), không phải xấu; " +
      "khi thân vượng thì Tỷ Kiếp thành kỵ (tranh đoạt tài lộc).",
  },

  // ===== PHẦN III — DỤNG THẦN =====
  {
    id: "tb-dung-than",
    tags: ["dụng thần", "phù ức", "điều hậu", "thông quan", "chuyên vượng", "hỷ thần", "kỵ thần", "nền tảng"],
    title: "Quy tắc luận Dụng Thần (4 phép)",
    source: SRC,
    content:
      "Dụng thần = ngũ hành sửa khuyết điểm, cứu cân bằng toàn cục. (1) Phù ức: thân nhược → dùng Ấn " +
      "(sinh) hoặc Tỷ Kiếp (trợ); thân vượng → dùng Thực Thương (tiết), Tài (hao) hoặc Quan Sát (khắc). " +
      "(2) Điều hậu: cân nhiệt độ, ƯU TIÊN HÀNG ĐẦU khi sinh mùa quá lạnh/nóng — sinh Đông (Hợi/Tý/Sửu) " +
      "lấy Hỏa sưởi; sinh Hè (Tỵ/Ngọ/Mùi) lấy Thủy điều hòa. (3) Thông quan: hai thế lực ngang ngửa thì " +
      "dùng hành trung gian làm cầu (Kim chiến Mộc → dùng Thủy; Mộc chiến Thổ → dùng Hỏa). (4) Chuyên " +
      "vượng: một hành chiếm ~80% toàn cục → TUYỆT ĐỐI không dùng hành khắc (phạm 'vách tường' → sụp đổ); " +
      "phải thuận thế, lấy chính hành vượng đó hoặc hành sinh ra nó làm Dụng.",
  },

  // ===== PHẦN IV — THẦN SÁT =====
  {
    id: "tb-than-sat",
    tags: ["thần sát", "thiên ất quý nhân", "đào hoa", "dịch mã", "dương nhận", "lộc thần", "không vong", "tuần không"],
    title: "6 Thần Sát cốt lõi",
    source: SRC,
    content:
      "Thiên Ất Quý Nhân: đệ nhất cát thần, gặp hoạn nạn có người cứu, hóa nguy thành an. Đào Hoa (Hàm " +
      "Trì): sức hút giới tính, duyên ăn nói — Hỷ thì nổi tiếng, Kỵ thì phong lưu/ngoại tình/phá sản vì " +
      "tình. Dịch Mã: dịch chuyển, xuất ngoại, đổi việc — thân vượng mang Mã đi xa phát nhanh, gặp Xung " +
      "thì bôn ba. Dương Nhận: dao hai lưỡi, can trường dũng cảm nhưng bạo lực — thân nhược thì hộ thân " +
      "rất tốt, thân vượng thì tai nạn máu me/phẫu thuật. Lộc Thần: bổng lộc, tài tự thân, sức khỏe ổn; " +
      "kỵ bị Xung (Phá Lộc) → đột ngột tán tài, thất nghiệp. Tuần Không/Không Vong: làm trống rỗng vị " +
      "trí — cát thần lâm Không giảm cát, hung thần lâm Không giảm hung; Tài lâm Không khó tụ tài, Quan " +
      "lâm Không quan lộ trắc trở. CẢNH BÁO PHƯƠNG PHÁP: luận Thần Sát SAU khi đã định Hỷ–Kỵ; Thần Sát " +
      "chỉ gia/giảm màu sắc, không quyết định cốt lõi (cốt lõi = Vượng-Nhược + Dụng thần).",
  },

  // ===== PHẦN V — CÁCH CỤC =====
  {
    id: "tb-cach-cuc",
    tags: ["cách cục", "chính quan cách", "thất sát cách", "thực thần cách", "tài cách", "ấn cách", "tòng cách", "định cách"],
    title: "Cách cục Tứ Trụ phổ biến",
    source: SRC,
    content:
      "Định cách: dựa Bản khí của Chi tháng (Nguyệt lệnh) thấu lên Thiên can. Chính Quan Cách: chính " +
      "trực, coi trọng quy chế; cần Tài sinh Quan + Ấn hộ Quan; kỵ Thương Quan (khi Quan là Dụng). Thất " +
      "Sát Cách: chí lớn, dũng cảm; BẮT BUỘC có Thực Thần chế Sát hoặc Ấn hóa Sát; Sát vượng thân nhược " +
      "vô chế → nghèo khổ, thương tật. Thực Thần Cách: ôn hòa, phúc lộc; cần Tài tinh thông phát; kỵ " +
      "Thiên Ấn (Kiêu đoạt thực). Tài Cách: nhạy bén kinh tế; THÂN PHẢI VƯỢNG mới gánh Tài (thân vượng " +
      "tài vượng → đại phú); thân nhược = 'Phú ốc bần nhân'. Ấn Cách: hợp học hành, nghiên cứu nhưng dễ " +
      "thụ động; cần Quan Sát sinh trợ; kỵ Tài hoại Ấn. Tòng Cách (biến cách): Nhật chủ hoàn toàn không " +
      "rễ, không Ấn trợ, xung quanh toàn Tài hoặc Sát vượng độc tôn → phải 'tòng' theo thế mạnh nhất; " +
      "gặp vận sinh trợ Nhật chủ lại hóa đại hung.",
  },

  // ===== PHẦN VI — QUAN HỆ CAN-CHI =====
  {
    id: "tb-can-chi-quan-he",
    tags: ["xung", "hình", "hại", "hợp", "lục xung", "địa chi", "tự hình", "tam hình", "biến động", "sự kiện"],
    title: "Quan hệ Can–Chi: biểu hiện hành vi & sự kiện",
    source: SRC,
    content:
      "Xung (Lục Xung): Tý-Ngọ/Mão-Dậu (xung của Khí) → xung đột cảm xúc, thay đổi tình cảm, thị phi tình " +
      "ái. Dần-Thân/Tỵ-Hợi (xung của Chiến) → xung động hành động, tai nạn xe cộ, đổi chỗ ở đột ngột, " +
      "bôn ba. Thìn-Tuất/Sửu-Mùi (xung của Thổ/Khố) → xung đất đai, BĐS, tiêu hóa-dạ dày; nhưng đôi khi " +
      "LẠI TỐT vì 'mở kho' tài/quan. Hình: Dần-Tỵ-Thân (vô ơn) → bị phản bội, tai nạn giao thông/pháp " +
      "lý; Sửu-Tuất-Mùi (cậy thế) → quá tự tin → thất bại, tranh chấp đất đai; Tý-Mão (vô lễ) → scandal " +
      "tình dục, tổn thương gia đình; Tự hình (Thìn-Thìn, Ngọ-Ngọ, Dậu-Dậu, Hợi-Hợi) → tự làm khổ mình, " +
      "trầm cảm, tiêu cực. Hại: không tai nạn trực diện nhưng mệt mỏi âm ỉ — phản bội sau lưng, mưu kế " +
      "tiểu nhân, rạn nứt tình cảm khó hàn gắn.",
  },

  // ===== PHẦN VII — NẠP ÂM & ĐẮC/THẤT THẾ =====
  {
    id: "tb-nap-am-dac-that",
    tags: ["nạp âm", "hỷ", "kỵ", "đắc thế", "thất thế", "hỷ thần", "kỵ thần", "nguyên tắc", "nền tảng"],
    title: "Nạp Âm & Thập Thần Đắc/Thất thế (Hỷ/Kỵ) — nguyên tắc xuyên suốt",
    source: SRC,
    content:
      "Nạp Âm bổ túc bản chất cốt lõi của ngũ hành Can-Chi khi kết cặp: cùng là Kim nhưng Kiếm Phong Kim " +
      "(sát phạt, cần Hỏa luyện) khác Hải Trung Kim (ẩn tàng, cần Thủy thanh lọc, kỵ Hỏa). NGUYÊN TẮC " +
      "XUYÊN SUỐT: một Thập Thần tốt hay xấu phụ thuộc HOÀN TOÀN vào việc nó là Hỷ hay Kỵ. Ví dụ Kiếp " +
      "Tài đắc thế (Hỷ) = dũng cảm, khí phách, dám nghĩ dám làm; Kiếp Tài thất thế (Kỵ) = bạo lực, phá " +
      "sản, bạn bè lừa gạt, nợ nần. Thương Quan đắc thế (Hỷ) = sáng tạo vượt bậc, hùng biện; thất thế " +
      "(Kỵ) = ngạo mạn, lời cay độc gây họa, kiện tụng, gãy đổ sự nghiệp. => Luôn định Hỷ-Kỵ TRƯỚC khi " +
      "phán một Thập Thần là cát hay hung.",
  },

  // ===== PHẦN VIII — ĐẠI VẬN & LƯU NIÊN =====
  {
    id: "tb-dai-van-luu-nien",
    tags: ["đại vận", "lưu niên", "vận hạn", "thời điểm", "thuận nghịch", "tuế vận", "phát", "trắc trở"],
    title: "Đại Vận & Lưu Niên (luận động theo thời gian)",
    source: SRC,
    content:
      "Đại vận: mỗi 10 năm một trụ. Nam dương niên / nữ âm niên → đi THUẬN; nam âm niên / nữ dương niên → " +
      "đi NGHỊCH, tính từ Nguyệt trụ. Khởi vận: đếm ngày từ ngày sinh đến tiết khí kế tiếp (thuận)/trước " +
      "(nghịch), 3 ngày = 1 tuổi. NGUYÊN TẮC VÀNG: Bản mệnh định 'giàu nghèo sang hèn' (tiềm năng); Đại " +
      "vận + Lưu niên định 'lúc nào phát, lúc nào họa'. Vận vào Hỷ-Dụng → phát; vào Kỵ thần → trắc trở. " +
      "Lưu niên (năm cụ thể): xét tương tác Lưu niên ↔ Đại vận ↔ Bản mệnh, đặc biệt Tuế-Vận xung/hợp " +
      "với Nhật chủ và Dụng thần.",
  },

  // ===== PHẦN IX + X — TRÌNH TỰ & KINH NGHIỆM =====
  {
    id: "tb-trinh-tu",
    tags: ["trình tự", "phương pháp", "luận giải", "7 bước", "quy trình", "nền tảng"],
    title: "Trình tự luận giải thực chiến (7 bước)",
    source: SRC,
    content:
      "(1) Lập tứ trụ + Tàng can + Thập thần. (2) Xét Vượng–Nhược Nhật chủ (4 tiêu chí). (3) Định Cách " +
      "cục từ Nguyệt lệnh thấu can. (4) Chọn Dụng thần (Điều hậu ưu tiên nếu sinh mùa quá nóng/lạnh, rồi " +
      "mới Phù ức). (5) Định Hỷ–Kỵ thần → từ đây mới biết mỗi Thập Thần/Thần Sát là cát hay hung. (6) Xét " +
      "quan hệ Can–Chi (điểm trục trặc & điểm hóa giải). (7) Lồng Đại vận + Lưu niên để định thời điểm. " +
      "SAI LẦM PHỔ BIẾN NHẤT: luận Thần Sát TRƯỚC khi định Hỷ-Kỵ. Cốt lõi luôn là Vượng-Nhược + Dụng thần.",
  },
  {
    id: "tb-kinh-nghiem",
    tags: ["kinh nghiệm", "thân vượng", "thân nhược", "phú ốc bần nhân", "mở khố", "kim chỉ nam", "nền tảng"],
    title: "Nguyên tắc kinh nghiệm hay dùng",
    source: SRC,
    content:
      "Kim chỉ nam: 'Thân vượng hỷ Tài–Quan–Thực Thương; Thân nhược hỷ Ấn–Tỷ Kiếp.' 'Thương Quan kiến " +
      "Quan' chỉ là họa khi Quan là Dụng; nếu Quan là Kỵ thì Thương Quan giúp 'khử Quan', thành tốt. " +
      "'Tài đa thân nhược' = 'Phú ốc bần nhân' → cần Tỷ Kiếp/Ấn trợ thân mới gánh nổi tài. Khố/Mộ " +
      "(Thìn-Tuất-Sửu-Mùi) chứa của cải nhưng cần xung/hình mới 'mở khố' → xung Thổ đôi khi tốt. 'Điều " +
      "hậu thắng Phù ức' trong cục cực đoan: thân nhược nhưng sinh tháng Tý (quá lạnh) vẫn ưu tiên Hỏa " +
      "sưởi ấm.",
  },
];

// ----------------------------------------------------------------------------
// TRUY HỒI (RAG-lite): chấm điểm theo mức trùng thẻ, luôn kèm các mẫu nền tảng.
// ----------------------------------------------------------------------------

export interface RetrieveTuBinhContext {
  /** Thập Thần nổi bật trên lá Bát Tự (vd ["Chính Tài","Thất Sát"]). */
  shiShen?: string[];
  /** Ngũ hành thiên lệch cần lưu ý (vd ["Thủy","Hỏa"]). */
  elements?: string[];
  /** Chủ đề người dùng quan tâm (vd "sự nghiệp", "hôn nhân", "tài chính"). */
  topics?: string[];
  /** Câu hỏi tự do để bắt từ khóa thêm. */
  query?: string;
}

const norm = (s: string) => s.toLowerCase().trim();

/** Các mẫu NỀN TẢNG luôn nên có mặt để AI luận đúng phương pháp (không bịa khung). */
const ALWAYS_TB = new Set([
  "tb-vuong-nhuoc",
  "tb-dung-than",
  "tb-nap-am-dac-that",
  "tb-trinh-tu",
  "tb-kinh-nghiem",
]);

/**
 * Trả về top-N mẫu tri thức Tử Bình liên quan nhất tới bối cảnh lá số.
 * Điểm = số thẻ trùng (khớp lỏng) + bắt từ khóa trong query.
 * Luôn ưu tiên đính kèm các mẫu nền tảng (vượng-nhược, dụng thần, hỷ-kỵ,
 * trình tự, kinh nghiệm) để AI có khung luận chuẩn.
 */
export function retrieveTuBinh(ctx: RetrieveTuBinhContext, topN = 9): KnowledgeEntry[] {
  const needles = new Set<string>();
  [...(ctx.shiShen ?? []), ...(ctx.elements ?? []), ...(ctx.topics ?? [])]
    .forEach((x) => needles.add(norm(x)));
  const queryWords = ctx.query ? norm(ctx.query).split(/\s+/).filter((w) => w.length >= 2) : [];

  const scored = TU_BINH_KNOWLEDGE.map((entry) => {
    const tagSet = entry.tags.map(norm);
    let score = 0;
    for (const n of needles) {
      if (tagSet.some((t) => t.includes(n) || n.includes(t))) score += 3;
    }
    for (const w of queryWords) {
      if (tagSet.some((t) => t.includes(w))) score += 1;
      if (norm(entry.title).includes(w) || norm(entry.content).includes(w)) score += 1;
    }
    if (ALWAYS_TB.has(entry.id)) score += 0.5; // ưu tiên nhẹ mẫu nền tảng khi hòa điểm
    return { entry, score };
  });

  const sorted = scored.sort((a, b) => b.score - a.score);

  const picked: KnowledgeEntry[] = [];
  // Bước 1: bảo đảm các mẫu nền tảng vào trước.
  for (const id of ALWAYS_TB) {
    const found = TU_BINH_KNOWLEDGE.find((e) => e.id === id);
    if (found) picked.push(found);
  }
  // Bước 2: thêm các mẫu khớp điểm cao nhất cho tới khi đủ topN.
  for (const { entry, score } of sorted) {
    if (picked.some((p) => p.id === entry.id)) continue;
    if (score > 0) picked.push(entry);
    if (picked.length >= topN) break;
  }
  return picked.slice(0, topN);
}

/** Gói các mẫu đã truy hồi thành đoạn text để chèn vào prompt luận giải. */
export function tuBinhToPromptText(entries: KnowledgeEntry[]): string {
  if (!entries.length) return "";
  const body = entries
    .map((e) => `• [${e.title}]: ${e.content}`)
    .join("\n");
  return (
    `=== KHO TRI THỨC TỬ BÌNH (BÁT TỰ) SÂU — đã truy hồi theo lá số ===\n` +
    `(Nguồn: ${SRC}. Dùng làm "sách" để luận Bát Tự CÓ CĂN CỨ, KHÔNG bịa; ` +
    `mọi kết luận chỉ "CÓ XU HƯỚNG", tốt/xấu TÙY Hỷ–Kỵ & Vượng–Suy toàn cục.)\n` +
    body
  );
}
