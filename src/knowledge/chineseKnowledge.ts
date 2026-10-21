// ============================================================================
// LỚP TRI THỨC TRUNG HOA cho AI — RAG-lite (truy hồi theo thẻ/từ khoá).
// Cấp 3: thêm khung Tử Vi (cung–hình học–cát tinh), Nhật Chủ 10 can, cầu nối
// hôn nhân / sức khỏe / con cái, điều hậu–mùa sinh; giữ token gọn.
//
// Ý tưởng: thay vì nhồi TOÀN BỘ tri thức vào prompt mỗi request (tốn token,
// loãng trọng tâm), ta lưu tri thức thành các MẨU (KnowledgeEntry) có gắn THẺ
// (tags). Khi luận một lá số cụ thể, hàm retrieveKnowledge() chấm điểm theo
// mức trùng thẻ với bối cảnh lá số (sao Tử Vi đang sáng, Thập Thần nổi bật,
// ngũ hành thiên lệch...) và CHỈ chèn vào prompt vài mẩu liên quan nhất.
//
// Đây là RAG không cần vector DB — chạy ngay trong Express server.ts. Khi cần
// nâng lên embeddings (ngữ nghĩa thay vì từ khoá), giữ nguyên interface dưới,
// chỉ thay phần tính điểm trong retrieveKnowledge() (xem ghi chú cuối file).
//
// NGUỒN CẢM HỨNG:
//   - chinesemetasoft.com: chiều sâu kỹ thuật Tứ Trụ (Thập Thần, Ngũ Hành,
//     vượng suy, Đại Vận) — quyết định KHUNG luận.
//   - 88say.com: tinh thần "đời sống hoá" — diễn giải sát thực tế, dễ hiểu.
// Nội dung là bản tóm lược kiến thức mệnh lý phổ thông, viết lại bằng tiếng Việt.
// Mọi kết luận chỉ "CÓ XU HƯỚNG" — không chắc chắn tuyệt đối / không y khoa.
// ============================================================================

export interface KnowledgeEntry {
  id: string;
  /** Thẻ để truy hồi: tên sao, tên Thập Thần, ngũ hành, chủ đề... (khớp lỏng). */
  tags: string[];
  title: string;
  source: string;   // ghi nguồn/trường phái để AI trích dẫn minh bạch
  content: string;  // bản tóm lược cô đọng
}

// ----------------------------------------------------------------------------
// CƠ SỞ TRI THỨC
// ----------------------------------------------------------------------------

export const CHINESE_KNOWLEDGE: KnowledgeEntry[] = [
  // --- Nguyên lý Ngũ Hành (nền của cả Tử Vi lẫn Bát Tự) ---
  {
    id: "nguhanh-sinh-khac",
    tags: ["ngũ hành", "sinh khắc", "kim", "mộc", "thủy", "hỏa", "thổ", "nguyên lý"],
    title: "Ngũ Hành sinh – khắc",
    source: "Nguyên lý mệnh lý cổ điển",
    content:
      "Tương sinh: Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim, Kim sinh Thủy, Thủy sinh Mộc. " +
      "Tương khắc: Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim, Kim khắc Mộc. " +
      "Luận lá số: hành nào quá vượng cần được tiết/khắc, hành nào quá suy cần được sinh/phù. " +
      "Cân bằng ngũ hành là cốt lõi đoán cát hung và chọn Dụng Thần.",
  },

  // --- Thân vượng / thân nhược (khung luận Bát Tự) ---
  {
    id: "than-vuong-nhuoc",
    tags: ["thân vượng", "thân nhược", "nhật chủ", "dụng thần", "bát tự", "đại vận"],
    title: "Thân vượng – Thân nhược & Dụng Thần",
    source: "Tử Bình (Bát Tự) — chinesemetasoft",
    content:
      "Nhật Chủ (can ngày) là bản thân bạn. Xét đắc lệnh (sinh đúng mùa), đắc địa " +
      "(gốc rễ ở địa chi), đắc trợ (Tỷ Kiếp/Ấn nhiều) để định thân vượng hay nhược. " +
      "Thân vượng: dùng Quan Sát/Tài/Thực Thương để tiết-chế. Thân nhược: dùng Ấn/Tỷ Kiếp để " +
      "phù trợ. Dụng Thần là hành cứu cân bằng; Đại Vận/lưu niên gặp Dụng Thần thì hanh thông, " +
      "gặp Kỵ Thần thì trắc trở.",
  },

  // --- 10 Thập Thần ---
  {
    id: "thapthan-ty-kiep",
    tags: ["tỷ kiên", "kiếp tài", "tỷ kiếp", "thập thần", "anh em", "cạnh tranh", "hợp tác"],
    title: "Tỷ Kiên & Kiếp Tài (Tỷ Kiếp)",
    source: "Thập Thần — Tử Bình",
    content:
      "Cùng hành với Nhật Chủ. Chủ về anh em, bạn bè, đồng nghiệp, cạnh tranh, hợp tác và cái " +
      "tôi. Vượng thì độc lập, gan dạ, nhưng dễ tranh đoạt tiền tài, hao tài vì bạn bè, hợp tác " +
      "dễ đổ vỡ. Thân nhược cần Tỷ Kiếp trợ thân; thân vượng thì Tỷ Kiếp thành kỵ.",
  },
  {
    id: "thapthan-thuc-thuong",
    tags: ["thực thần", "thương quan", "thực thương", "thập thần", "tài năng", "sáng tạo", "con cái"],
    title: "Thực Thần & Thương Quan",
    source: "Thập Thần — Tử Bình",
    content:
      "Nhật Chủ sinh ra. Chủ về tài năng, biểu đạt, sáng tạo, ăn nói, con cái (với nữ). Thực Thần " +
      "ôn hoà, hưởng thụ, phúc khí. Thương Quan thông minh sắc sảo nhưng ngạo, dễ phạm thượng, " +
      "khắc Chính Quan (kỵ với người làm quan/công chức nếu Thương Quan vô chế). 'Thương Quan " +
      "kiến Quan' thường chủ thị phi, kiện tụng nếu không có Ấn hoặc Tài hoá giải.",
  },
  {
    id: "thapthan-tai",
    tags: ["chính tài", "thiên tài", "tài tinh", "thập thần", "tiền bạc", "vợ", "kinh doanh"],
    title: "Chính Tài & Thiên Tài",
    source: "Thập Thần — Tử Bình",
    content:
      "Nhật Chủ khắc. Chủ về tiền tài, vật chất, vợ (với nam). Chính Tài là thu nhập chính đáng, " +
      "ổn định, tiết kiệm. Thiên Tài là tài bất ngờ, đầu tư, kinh doanh rộng, hào phóng. Tài vượng " +
      "mà thân nhược ('tài đa thân nhược') thì khó giữ của, vất vả vì tiền/vì vợ; cần Tỷ Kiếp hoặc " +
      "Ấn trợ thân mới hưởng được tài.",
  },
  {
    id: "thapthan-quan-sat",
    tags: ["chính quan", "thất sát", "thiên quan", "quan sát", "thập thần", "sự nghiệp", "quyền lực", "chồng"],
    title: "Chính Quan & Thất Sát (Thiên Quan)",
    source: "Thập Thần — Tử Bình",
    content:
      "Khắc Nhật Chủ. Chủ về sự nghiệp, danh vị, quyền lực, kỷ luật, chồng (với nữ). Chính Quan " +
      "đoan chính, hợp công danh/quản lý. Thất Sát mạnh mẽ, quyết liệt, hợp võ nghiệp/khởi nghiệp " +
      "nhưng vô chế thì thành áp lực, tai ách. 'Sát ấn tương sinh' hoặc 'Thực thần chế Sát' là cách " +
      "quý — biến áp lực thành quyền uy.",
  },
  {
    id: "thapthan-an",
    tags: ["chính ấn", "thiên ấn", "kiêu thần", "ấn tinh", "thập thần", "học vấn", "mẹ", "quý nhân"],
    title: "Chính Ấn & Thiên Ấn (Kiêu Thần)",
    source: "Thập Thần — Tử Bình",
    content:
      "Sinh Nhật Chủ. Chủ về học vấn, văn bằng, che chở, mẹ, quý nhân, danh dự. Chính Ấn nhân hậu, " +
      "học hành thuận, được nâng đỡ. Thiên Ấn (Kiêu Thần) thiên về kỹ năng đặc thù, tôn giáo, huyền " +
      "học; 'Kiêu đoạt Thực' thì hao phúc, dễ cô độc, lo nghĩ nhiều. Ấn trợ thân nhược rất tốt; thân " +
      "vượng mà Ấn nhiều thì trì trệ, ỷ lại.",
  },

  // --- Cầu nối Tử Vi <-> Bát Tự (giá trị cốt lõi của tính năng song song) ---
  {
    id: "cau-noi-menh-tai-quan",
    tags: ["đối chiếu", "tử vi", "bát tự", "mệnh", "tài bạch", "quan lộc", "chính tài", "thiên tài", "chính quan", "thất sát"],
    title: "Đối chiếu: cung Tài/Quan (Tử Vi) ↔ Tài tinh/Quan tinh (Bát Tự)",
    source: "Nguyên tắc luận chéo song hệ",
    content:
      "Khi cung Tài Bạch Tử Vi đẹp (Vũ Khúc, Thiên Phủ, Lộc Tồn, Hóa Lộc) ĐỒNG THỜI Bát Tự có Tài " +
      "tinh đắc dụng và thân đủ vượng để gánh tài -> luận giàu có vững, độ tin cậy cao. Nếu cung " +
      "Quan Lộc có Tử/Phủ/Tướng/Hóa Quyền VÀ Bát Tự 'Quan Ấn tương sinh' hoặc 'Sát Ấn tương sinh' " +
      "-> sự nghiệp, quyền vị rõ ràng. Hai hệ đồng thuận thì nhấn mạnh; mâu thuẫn thì nêu cả hai và " +
      "ưu tiên xét vận hạn (Đại Hạn Tử Vi + Đại Vận Bát Tự) để phân kỳ.",
  },
  {
    id: "cau-noi-van-han",
    tags: ["đối chiếu", "vận hạn", "đại vận", "đại hạn", "lưu niên", "tứ hóa", "tử vi", "bát tự"],
    title: "Đối chiếu vận hạn: Đại Hạn/Lưu niên (Tử Vi) ↔ Đại Vận/Lưu niên (Bát Tự)",
    source: "Nguyên tắc luận chéo song hệ",
    content:
      "Phân kỳ tốt/xấu mạnh nhất khi hai hệ trùng tín hiệu: ví dụ năm lưu niên Tử Vi gặp Hóa Kỵ " +
      "xung chiếu cung trọng yếu, ĐỒNG THỜI Đại Vận/lưu niên Bát Tự dẫn động Kỵ Thần (hành kỵ) -> " +
      "cảnh báo rõ ràng cho năm đó. Ngược lại, lưu niên Hóa Lộc/Hóa Quyền trùng vận gặp Dụng Thần " +
      "-> năm bứt phá. Luôn quy về CHỦ ĐỀ (sự nghiệp/tài/tình/sức khoẻ) tương ứng cung và Thập Thần.",
  },
  {
    id: "cau-noi-nhat-chu-menh",
    tags: ["đối chiếu", "nhật chủ", "cung mệnh", "cung thân", "tử vi", "bát tự", "tính cách"],
    title: "Đối chiếu cốt cách: Nhật Chủ (Bát Tự) ↔ Mệnh/Thân (Tử Vi)",
    source: "Nguyên tắc luận chéo song hệ",
    content:
      "Tính chất Nhật Chủ (vd Nhâm Thủy: linh hoạt, trí tuệ, lưu động) đối chiếu chính tinh thủ " +
      "Mệnh/Thân Tử Vi để xác nhận cốt cách. Nếu cả hai cùng chỉ một kiểu người (vd Thất Sát thủ " +
      "Mệnh + Thất Sát đắc dụng trong Bát Tự) -> chân dung tính cách rất rõ, luận quả quyết. Khác " +
      "biệt giữa hai hệ thường phản ánh 'mặt ngoài' (Mệnh) vs 'động lực gốc' (Nhật Chủ).",
  },

  // --- Tinh thần diễn giải (88say) ---
  {
    id: "phong-cach-doi-song-hoa",
    tags: ["phong cách", "diễn giải", "đời sống hoá", "ngôn ngữ", "tư vấn", "chủ đề"],
    title: "Phong cách diễn giải đời sống hoá",
    source: "Tinh thần 88say",
    content:
      "Tránh liệt kê thuật ngữ khô khan. Mỗi luận điểm phải gắn với tình huống đời thực (công việc, " +
      "tiền bạc, quan hệ, sức khoẻ) và đưa lời khuyên hành động cụ thể. Nói thật, có cát luận cát, " +
      "có hung cảnh báo hung, nhưng kết bằng hướng hoá giải/tận dụng. Khi trích nguồn (Trung Châu " +
      "Phái, Tử Bình...) nói rõ để minh bạch.",
  },

  // --- Nâng cấp: khung Tử Vi Đẩu Số (phương pháp) ---
  {
    id: "tv-tam-phuong-tu-chinh",
    tags: [
      "tam phương", "tứ chính", "xung chiếu", "mệnh", "tài bạch", "quan lộc", "thiên di",
      "tử vi", "cách cục",
    ],
    title: "Tam phương tứ chính — xương sống luận cung",
    source: "Tử Vi Đẩu Số — phương pháp cốt lõi",
    content:
      "Mỗi cung không đứng một mình: Chính cung + Xung chiếu (180°) + hai Tam hợp tạo 'ô' quyết định " +
      "~80% khí cung. Luận Mệnh phải gom Tài–Quan–Di (và ngược). Sao tốt ở cung lẻ mà tam phương toàn " +
      "sát thì giảm khen; cung hãm nhưng tam phương sáng vẫn có lối. CẤM khen/chê một cung mà bỏ " +
      "dòng quan hệ máy đã tính sẵn.",
  },
  {
    id: "tv-tu-hoa-phi-tinh",
    tags: [
      "tứ hóa", "hóa lộc", "hóa quyền", "hóa khoa", "hóa kỵ", "phi hóa", "tự hóa",
      "lưu hóa", "tử vi",
    ],
    title: "Tứ Hóa: bẩm sinh · phi cung · lưu niên",
    source: "Tử Vi Đẩu Số — Tứ Hóa",
    content:
      "Hóa Lộc = nguồn/lưu thông; Quyền = chủ động–áp lực; Khoa = danh–hóa giải; Kỵ = ải/chấp/hao. " +
      "Bẩm sinh theo can năm; phi hóa theo can từng cung; lưu hóa theo can năm hạn. Tự hóa (sao thụ " +
      "hóa đóng đúng cung phát lệnh) = năng lượng tự sinh/tự hao tại chỗ. Chỉ dùng bảng máy đã tra — " +
      "không tự nhẩm can.",
  },
  {
    id: "tv-luc-sat",
    tags: [
      "kình dương", "đà la", "hỏa tinh", "linh tinh", "địa không", "địa kiếp",
      "lục sát", "sát tinh", "tử vi",
    ],
    title: "Lục sát — phân vai, không gộp một giỏ",
    source: "Tử Vi Đẩu Số — sát tinh",
    content:
      "Kình = đột/phẫu/va chạm nổi; Đà = trì hoãn/chướng ngầm; Hỏa = biến nổi; Linh = biến ám; " +
      "Không = hư–đứt; Kiếp = cướp–tan. Sát đắc địa có thể thành quyền/uy; sát + Kỵ + hãm mới nặng. " +
      "Tuần/Triệt chiếu sát có thể giảm hung. Luận đúng tên sát trên lá, không 'gặp sát là chết'.",
  },
  {
    id: "tv-vo-chinh-dieu",
    tags: ["vô chính diệu", "mệnh", "bàng tinh", "tam phương", "tử vi"],
    title: "Vô chính diệu — mượn tinh, không kết án cô đơn",
    source: "Tử Vi Đẩu Số",
    content:
      "VCD: lấy chính tinh xung + tam hợp làm chủ mượn, bàng tinh đồng cung làm màu. Có thể linh " +
      "hoạt hoặc thiếu trụ — tùy bộ mượn. Hội Phủ–Tướng–Lộc khác hội toàn Không–Kiếp–Kỵ. Không " +
      "kết 'cả đời cô' chỉ vì VCD.",
  },
  {
    id: "tv-luu-nien-lop",
    tags: [
      "lưu niên", "lưu thái tuế", "lưu lộc", "lưu hóa", "tiểu hạn", "đại hạn",
      "vận", "tử vi", "năm",
    ],
    title: "Các lớp vận hạn năm",
    source: "Tử Vi Đẩu Số — vận hạn",
    content:
      "Tách lớp: (1) Đại hạn ~10 năm (cung + sao Vận); (2) Tiểu hạn 1 năm (cung); (3) Lưu Thái Tuế " +
      "và sao lưu (Lộc/Kình/Mã/Khôi…); (4) Lưu Tứ Hóa theo can năm. Luận năm = giao của các lớp trên " +
      "cung trọng, không chỉ một sao lưu. Dùng đúng sao máy đã an trên payload.",
  },
  {
    id: "tv-tuan-triet-khong",
    tags: ["tuần", "triệt", "không vong", "tuần không", "triệt lộ", "tử vi", "giảm lực"],
    title: "Tuần · Triệt · Không Vong — khác Không diệu",
    source: "Tử Vi Đẩu Số",
    content:
      "Tuần ≈ trống/giảm lực khí cung (khóa 2 chi); Triệt ≈ chặn/cắt lộ (khóa 2 chi); Không Vong " +
      "thường nửa khóa. Khác Địa Không/Địa Kiếp (sát hư–cướp). Gặp cách quý + Tuần/Triệt → hạ giọng " +
      "phú quý, không xóa cách. Chỉ nói đúng cung máy liệt kê.",
  },
  {
    id: "tv-cach-cuc-doc",
    tags: [
      "cách cục", "sát phá tham", "cơ nguyệt đồng lương", "tử phủ", "phủ tướng",
      "miếu", "hãm", "tử vi",
    ],
    title: "Cách cục + miếu hãm",
    source: "Tử Vi Đẩu Số — cách cục",
    content:
      "Cách = tổ hợp chính tinh (đồng cung hoặc tam phương). Tên cách chỉ khung tính cách/nghề; " +
      "chất lượng phụ thuộc miếu/hãm/vượng + sát/cát kèm. Cách thành ≠ giàu chắc; cách hãm ≠ cùng " +
      "khổ. Dùng nhãn cách máy đã gắn (cách thành/trung/phá/hãm), không tự đặt tên cách ngoài dữ liệu.",
  },
  {
    id: "cau-noi-hai-truc-tai",
    tags: [
      "đối chiếu", "tài bạch", "sinh tài", "thủ tài", "chính tài", "thiên tài",
      "tử vi", "bát tự", "tiền bạc",
    ],
    title: "Hai trục tài (Tử Vi) ↔ Tài tinh (Bát Tự)",
    source: "Nguyên tắc luận chéo song hệ",
    content:
      "Tử Vi tách SINH TÀI (Mệnh–Tài–Quan) vs THỦ TÀI (Phúc–Tài–Điền). Bát Tự: thân gánh Tài được " +
      "không (Tài đa thân nhược vs thân vượng Tài đắc dụng). Đồng thuận: kiếm được + giữ được. " +
      "Lệch: TV sinh tài mạnh mà BT thân nhược → tiền vào khó giữ. Nhấn khi hai hệ cùng hướng.",
  },

  // --- Cấp 3: khung Tử Vi mở rộng + Nhật Chủ + cầu nối chủ đề ---
  {
    id: "tv-12-cung-y-nghia",
    tags: [
      "mệnh", "phụ mẫu", "phúc đức", "điền trạch", "quan lộc", "nô bộc", "thiên di",
      "tật ách", "tài bạch", "tử tức", "phu thê", "huynh đệ", "12 cung", "tử vi",
    ],
    title: "12 cung — ý nghĩa đời sống (khung)",
    source: "Tử Vi Đẩu Số — 12 cung",
    content:
      "Mệnh=cốt cách; Phụ=cha mẹ/cấp trên; Phúc=nội tâm–tín ngưỡng–phúc ẩn; Điền=nhà đất–tích sản; " +
      "Quan=sự nghiệp–chức vụ; Nô=bạn bè–cộng sự–thuộc hạ; Di=đi lại–môi trường ngoài; Tật=sức khỏe–" +
      "tổn thương; Tài=tiền–tài sản lưu động; Tử=con cái–học trò–sáng tạo; Phối=hôn phối–đối tác; " +
      "Huynh=anh em–ngang hàng. Luận cung = sao + vị trí miếu/hãm + tam phương + tứ hóa, không chỉ tên cung.",
  },
  {
    id: "tv-nhi-hop-luc-hai",
    tags: ["nhị hợp", "lục hại", "địa chi", "tử vi", "huyền chế", "ma sát"],
    title: "Nhị hợp & Lục hại — sóng ngầm",
    source: "Tử Vi Đẩu Số — hình học chi",
    content:
      "Nhị hợp (Tý-Sửu, Dần-Hợi, Mão-Tuất, Thìn-Dậu, Tỵ-Thân, Ngọ-Mùi): hậu thuẫn/gánh vô hình — " +
      "dùng dòng máy đã gắn, không tự nhẩm. Lục hại (Tý-Mùi, Sửu-Ngọ, Dần-Tỵ, Mão-Thìn, Thân-Hợi, " +
      "Dậu-Tuất): ma sát âm ỉ, hao tin cậy — không bằng lục xung ồn ào. Khi luận Mệnh–Phối–Tài–Quan, " +
      "nhắc nhị hợp/lục hại nếu máy đã liệt kê quan hệ.",
  },
  {
    id: "tv-cung-than-tuoi",
    tags: ["cung thân", "thân", "mệnh", "trung niên", "sau 30", "tử vi", "hành động"],
    title: "Cung Thân — sân khấu sau ~30",
    source: "Tử Vi Đẩu Số — Thân",
    content:
      "Mệnh ≈ bản năng sớm; Thân ≈ thói quen hành động tuổi trung niên (thường nhấn sau ~30). " +
      "Tìm cung [CUNG THÂN] trên lá: nếu Thân trùng Mệnh → nhất quán; lệch cung → phân 'mặt trong' " +
      "vs 'cách sống thực tế'. Đại hạn/lưu vào Thân quan trọng không kém Mệnh. Không lấy Thân xóa Mệnh.",
  },
  {
    id: "tv-cat-tinh-phu",
    tags: [
      "văn xương", "văn khúc", "tả phù", "hữu bật", "thiên khôi", "thiên việt",
      "long trì", "phượng các", "cát tinh", "tử vi", "học vấn", "quý nhân",
    ],
    title: "Cát tinh phụ — Xương Khúc · Tả Hữu · Khôi Việt · Long Phượng",
    source: "Tử Vi Đẩu Số — phụ tinh cát",
    content:
      "Xương/Khúc: học–kỹ năng–nói (Khúc thiên nghệ/tình cảm hơn). Tả/Hữu: trợ lực–đội ngũ. " +
      "Khôi/Việt: quý nhân–cửa ải được nâng. Long/Phượng: danh–văn vẻ. Cát + chính tinh miếu → " +
      "tăng độ tin; cát + sát Kỵ hãm → chỉ 'có cửa' không chắc đại quý. Chỉ dùng sao có trên lá.",
  },
  {
    id: "tv-phi-hoa-thuc-chien",
    tags: [
      "phi hóa", "tự hóa", "hóa lộc", "hóa quyền", "hóa khoa", "hóa kỵ",
      "thiên can", "tử vi", "nhân quả",
    ],
    title: "Phi hóa thực chiến — đọc đường bay",
    source: "Tử Vi Đẩu Số — phi tinh",
    content:
      "Can cung phát lệnh → 4 hóa tìm sao thụ hóa trên lá (bảng máy). Lộc vào Tài/Quan ≠ tự giàu: " +
      "còn miếu/hãm + xung/kỵ. Kỵ bay vào Phối/Tật/Mệnh = ải cảm xúc–sức–tâm. Tự hóa Lộc = tự sinh " +
      "nguồn tại cung; tự Kỵ = tự hao/chấp. Cấm bịa sao thụ hóa ngoài bảng.",
  },
  {
    id: "nhat-chu-10-can",
    tags: [
      "nhật chủ", "thiên can", "giáp", "ất", "bính", "đinh", "mậu", "kỷ",
      "canh", "tân", "nhâm", "quý", "tính cách", "bát tự",
    ],
    title: "10 Nhật Chủ — tính khí khung (rất gọn)",
    source: "Tử Bình — Nhật Chủ",
    content:
      "Giáp: thẳng–khởi xướng; Ất: mềm–leo bám; Bính: sáng–nóng nổi; Đinh: tinh–lửa nhỏ bền; " +
      "Mậu: dày–chịu tải; Kỷ: nuôi–chứa–lo; Canh: đúc–cắt–kỷ luật; Tân: tinh xảo–sĩ diện; " +
      "Nhâm: chảy–trí–đổi hướng; Quý: thấm–ẩn–cảm. Chỉ là gốc hành–khí; còn phụ thuộc vượng nhược " +
      "và Thập Thần vây quanh. Map với chính tinh Mệnh TV để chấm nhất quán.",
  },
  {
    id: "dieu-hau-mua-sinh",
    tags: [
      "điều hậu", "mùa", "đông", "hè", "hỏa", "thủy", "dụng thần", "bát tự",
      "hợi", "tý", "sửu", "tỵ", "ngọ", "mùi",
    ],
    title: "Điều hậu theo mùa sinh (ưu tiên khi cực đoan)",
    source: "Tử Bình — Điều hậu",
    content:
      "Sinh Đông (Hợi/Tý/Sửu) cục lạnh: Hỏa (và đôi khi Mộc sinh Hỏa) thường quan trọng hơn " +
      "phù thân thuần túy. Sinh Hè (Tỵ/Ngọ/Mùi) nóng: Thủy điều hòa. Xuân Mộc vượng / Thu Kim " +
      "vượng: xét tiết–chế hoặc thuận thế. Điều hậu có thể thắng Phù ức khi nhiệt độ lá cực đoan. " +
      "Gắn với tháng lệnh trong Bát Tự máy đã an.",
  },
  {
    id: "cau-noi-hon-nhan",
    tags: [
      "đối chiếu", "hôn nhân", "phu thê", "chồng", "vợ", "chính quan", "thất sát",
      "chính tài", "thiên tài", "đào hoa", "tử vi", "bát tự",
    ],
    title: "Chéo hôn nhân: Phối TV ↔ Tài/Quan BT",
    source: "Nguyên tắc luận chéo song hệ",
    content:
      "Nam: Tài tinh BT (vợ) ↔ cung Phu Thê TV. Nữ: Quan/Sát BT (chồng) ↔ Phu Thê TV. " +
      "Đồng thuận tốt/xấu → chắc giọng hơn. Lệch: phân giai đoạn (đại hạn Phối vs đại vận Tài/Quan). " +
      "Đào Hoa/Hồng Luan TV + Đào Hoa BT chỉ là duyên/sức hút — không kết ngoại tình nếu thiếu " +
      "Kỵ/xung/hại. Tôn trọng tuổi & bối cảnh; xu hướng chứ không án.",
  },
  {
    id: "cau-noi-suc-khoe",
    tags: [
      "đối chiếu", "tật ách", "sức khỏe", "ngũ hành", "thân nhược", "thất sát",
      "kình dương", "hóa kỵ", "tử vi", "bát tự",
    ],
    title: "Chéo sức khỏe: Tật Ách TV ↔ hành–Sát BT",
    source: "Nguyên tắc luận chéo song hệ",
    content:
      "TV: Tật Ách + sát/Kỵ/hãm gợi vùng dễ mỏi (không chẩn bệnh). BT: hành cực vượng/suy, " +
      "Sát công thân vô chế, Dương Nhận–Kiếp–xung khố gợi ải áp lực/tai nạn xu hướng. " +
      "Hai hệ cùng báo → hạ giọng 'cẩn sức–khám đúng chuyên khoa'; một hệ xấu → nói có cửa rủi. " +
      "CẤM chẩn đoán y khoa / hẹn ngày bệnh.",
  },
  {
    id: "cau-noi-con-cai",
    tags: [
      "đối chiếu", "tử tức", "con cái", "thời trụ", "thực thương", "tử vi", "bát tự",
    ],
    title: "Chéo con cái: Tử Tức TV ↔ Thời trụ / Thực Thương BT",
    source: "Nguyên tắc luận chéo song hệ",
    content:
      "TV: cung Tử + sao + hóa. BT: Thời trụ (quả / hậu vận / con), Thực Thương (nữ liên con). " +
      "Đồng thuận sáng → dễ nói duyên con–trò–sáng tạo; đồng xấu → ải nuôi dạy/sinh nở mang tính " +
      "xu hướng. Không kết 'có/không con' tuyệt đối; nhạy cảm văn hóa.",
  },
  {
    id: "cau-noi-hoc-van-an",
    tags: [
      "đối chiếu", "học vấn", "ấn", "văn xương", "văn khúc", "hóa khoa",
      "chính ấn", "thiên ấn", "tử vi", "bát tự",
    ],
    title: "Chéo học vấn: Xương–Khúc–Khoa TV ↔ Ấn BT",
    source: "Nguyên tắc luận chéo song hệ",
    content:
      "Ấn đắc dụng BT + Xương/Khúc/Khoa/Long–Phượng TV → học–chứng chỉ–danh văn thuận hơn. " +
      "Ấn nhiều thân vượng (trì trệ) ⋀ TV Văn tinh hãm/Kỵ → học kéo dài, cần thực chiến. " +
      "Kiêu đoạt Thực ⋀ thiếu Thực Thương TV → khó biến tri thức thành thu nhập — gợi hướng nghề.",
  },
];

// ----------------------------------------------------------------------------
// TRUY HỒI (RAG-lite): chấm điểm theo mức trùng thẻ.
// ----------------------------------------------------------------------------

export interface RetrieveContext {
  /** Tên chính tinh đang sáng trên lá Tử Vi (vd ["Tử Vi","Thất Sát"]). */
  stars?: string[];
  /** Thập Thần nổi bật trên lá Bát Tự (vd ["Chính Tài","Thất Sát"]). */
  shiShen?: string[];
  /** Ngũ hành thiên lệch cần lưu ý (vd ["Thủy","Hỏa"]). */
  elements?: string[];
  /** Chủ đề người dùng hỏi (vd "sự nghiệp", "hôn nhân"). */
  topics?: string[];
  /** Câu hỏi tự do để bắt từ khoá thêm. */
  query?: string;
}

const norm = (s: string) => s.toLowerCase().trim();

/** Mẩu nền tảng / khung phương pháp — ưu tiên nhẹ khi hòa điểm (Cấp 3). */
const ALWAYS_CHINESE = new Set([
  "nguhanh-sinh-khac",
  "than-vuong-nhuoc",
  "phong-cach-doi-song-hoa",
  "tv-tam-phuong-tu-chinh",
]);

/**
 * Trả về top-N mẩu tri thức liên quan nhất tới bối cảnh lá số.
 * Điểm = số thẻ trùng (khớp lỏng, không phân biệt hoa thường) + bắt từ khoá trong query.
 * Luôn kèm vài mẩu "nền tảng" (ngũ hành, thân vượng nhược, phong cách, tam phương) nếu còn chỗ.
 */
export function retrieveKnowledge(ctx: RetrieveContext, topN = 8): KnowledgeEntry[] {
  const needles = new Set<string>();
  [...(ctx.stars ?? []), ...(ctx.shiShen ?? []), ...(ctx.elements ?? []), ...(ctx.topics ?? [])]
    .forEach((x) => needles.add(norm(x)));
  const queryWords = ctx.query ? norm(ctx.query).split(/\s+/).filter((w) => w.length >= 2) : [];

  const scored = CHINESE_KNOWLEDGE.map((entry) => {
    const tagSet = entry.tags.map(norm);
    let score = 0;
    for (const n of needles) {
      if (tagSet.some((t) => t.includes(n) || n.includes(t))) score += 3;
    }
    for (const w of queryWords) {
      if (tagSet.some((t) => t.includes(w))) score += 1;
      if (norm(entry.title).includes(w) || norm(entry.content).includes(w)) score += 1;
    }
    if (ALWAYS_CHINESE.has(entry.id)) score += 0.5;
    return { entry, score };
  });

  const sorted = scored.sort((a, b) => b.score - a.score);

  const picked: KnowledgeEntry[] = [];
  // Bảo đảm nền tảng vào trước (nếu catalog còn slot).
  for (const id of ALWAYS_CHINESE) {
    const found = CHINESE_KNOWLEDGE.find((e) => e.id === id);
    if (found) picked.push(found);
  }
  for (const { entry, score } of sorted) {
    if (picked.some((p) => p.id === entry.id)) continue;
    if (score > 0) picked.push(entry);
    if (picked.length >= topN) break;
  }
  return picked.slice(0, topN);
}

/** Gói các mẩu đã truy hồi thành đoạn text để chèn vào prompt. */
export function knowledgeToPromptText(entries: KnowledgeEntry[]): string {
  if (!entries.length) return "";
  const body = entries
    .map((e) => `• [${e.title}] (${e.source}): ${e.content}`)
    .join("\n");
  return `=== TRI THỨC THAM CHIẾU (chỉ dùng khi khớp lá số, trích nguồn khi luận) ===\n${body}`;
}

// ----------------------------------------------------------------------------
// NÂNG CẤP LÊN EMBEDDINGS (tương lai):
//   - Giữ nguyên KnowledgeEntry + interface retrieveKnowledge().
//   - Tiền xử lý: tạo embedding cho `${title}. ${content}` mỗi entry (1 lần, cache).
//   - Khi truy hồi: embed (query + tóm tắt lá số), chấm điểm bằng cosine similarity
//     thay cho điểm trùng thẻ, rồi lấy top-N. Phần còn lại của pipeline không đổi.
// ----------------------------------------------------------------------------
