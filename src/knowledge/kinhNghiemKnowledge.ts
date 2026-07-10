// ============================================================================
// LỚP B — KINH NGHIỆM ỨNG DỤNG (RAG-lite).
//
// Nguồn: Quản Xuân Thịnh — «Sổ Tử Vi Kinh Nghiệm» Quyển Hạ (bản đã sửa chính tả).
// File gốc (tham chiếu, không inject nguyên văn): src/knowledge/data/so-tu-vi-kinh-nghiem-quyen-ha.txt
//
// VAI TRÒ (tránh trùng Đàm Tinh / lớp A):
//   - Đàm Tinh (damTinh.ts) = BẢN CHẤT sao / tinh tình.
//   - Lớp này = ỨNG DỤNG đoán: cách cục, hạn, cung, tổ hợp hay gặp → đời thực.
//   - Không viết lại định nghĩa tinh tình dài; chỉ mẩu ngắn "gặp X thì hay Y".
//
// ƯU TIÊN KHI XUNG ĐỘT (ghi trong prompt block):
//   1) Sao/cung THỰC CÓ trên lá số thắng mọi mẩu.
//   2) Bản chất sao (Đàm Tinh) thắng lớp B nếu mâu thuẫn định nghĩa.
//   3) Mọi kết luận chỉ "CÓ XU HƯỚNG", không chắc chắn tuyệt đối.
// ============================================================================

import type { KnowledgeEntry } from "./chineseKnowledge";

const SRC = "Sổ Tử Vi Kinh Nghiệm — Quản Xuân Thịnh (Quyển Hạ, trích có chọn)";

/** Đường dẫn tương đối file nguồn (ghi chú / docs). */
export const KINH_NGHIEM_SOURCE_RELATIVE =
  "src/knowledge/data/so-tu-vi-kinh-nghiem-quyen-ha.txt";

// ----------------------------------------------------------------------------
// MẪU KINH NGHIỆM (đã biên soạn: gọn, đời thực, không màu mè)
// ----------------------------------------------------------------------------

export const KINH_NGHIEM_KNOWLEDGE: KnowledgeEntry[] = [
  // ===== TRÌNH TỰ / PHƯƠNG PHÁP =====
  {
    id: "kn-trinh-tu-doan",
    tags: [
      "đoán số", "mệnh", "cục", "phúc đức", "tật ách", "trình tự", "cách đoán",
      "tam phương", "thân",
    ],
    title: "Thứ tự xem trước khi kết luận",
    source: SRC,
    content:
      "Xem lần lượt: Mệnh–Cục có tương sinh không; chính tinh Mệnh đắc/hãm; " +
      "nếu vô chính diệu thì bàng tinh làm chủ; hung sát đắc địa ở chỗ khác vẫn ảnh hưởng; " +
      "Phúc Đức có nhiều sát không; Thân–Mệnh được cách gì; Tật Ách xấu thì dù Mệnh quý cũng " +
      "giảm lực vì bệnh chiếm thời gian. Luận phải gom tam phương tứ chính, không chỉ một cung.",
  },
  {
    id: "kn-menh-tuan-triet",
    tags: ["mệnh", "tuần", "triệt", "giảm lực", "quý cách"],
    title: "Mệnh quý gặp Tuần / Triệt",
    source: SRC,
    content:
      "Mệnh được bộ quý mà ngộ Tuần hoặc Triệt thì lực quý giảm mạnh (khoảng quá nửa theo kinh nghiệm sách). " +
      "Không phủ nhận cách, nhưng hạ giọng phú quý; ưu tiên luận phần còn phát huy được.",
  },
  {
    id: "kn-vo-chinh-tam-khong",
    tags: ["vô chính diệu", "tam không", "tuần", "triệt", "địa không", "mệnh", "phú quý"],
    title: "Vô chính diệu + Tam Không",
    source: SRC,
    content:
      "Mệnh vô chính diệu gặp Tam Không (Tuần / Triệt / Địa Không — không gộp Thiên Không vào đây) " +
      "có thể phú quý khả kỳ, NHƯNG tam phương phải có nhiều quý tinh chiếu; phú quý kiểu này thường " +
      "có hạn định, không bền tuyệt đối. Cần quý tinh thật mới nâng cách.",
  },

  // ===== CÁCH CỤC THƯỜNG DÙNG =====
  {
    id: "kn-song-loc",
    tags: [
      "hóa lộc", "lộc tồn", "song lộc", "tài bạch", "tiền bạc", "mệnh", "tài",
    ],
    title: "Song Lộc (Hóa Lộc + Lộc Tồn)",
    source: SRC,
    content:
      "Hai sao Lộc đồng cung thường không đẹp (Mộc–Thổ tương khắc trong cách hiểu sách này); " +
      "dễ khổ vì tiền hoặc ai oán bạc. Song Lộc đi tam hợp chiếu Mệnh mới đáng gọi quý. " +
      "Đừng khen giàu chỉ vì thấy cả hai Lộc chung một cung.",
  },
  {
    id: "kn-song-hao",
    tags: [
      "đại hao", "tiểu hao", "song hao", "thiên cơ", "cự môn", "mão", "dậu",
      "tài bạch", "giàu", "hao tán",
    ],
    title: "Song Hao đắc cách vs hao tán",
    source: SRC,
    content:
      "Song Hao (Đại/Tiểu Hao) thuộc Hỏa: trúng cách (vd Mệnh Mão/Dậu + Cơ/Cự hội Hao) có thể " +
      "phong lưu nhưng khó bền — 'tốt ông không tiền'. Mệnh có Song Hao đến hạn Song Hao dễ đạt; " +
      "Mệnh Lộc Tồn đến hạn Hao dễ tán tài; Mệnh Song Hao đến hạn Lộc Tồn thường chỉ bình. " +
      "Lộc Tồn gặp Không/Vong: khó kiếm, dễ xuất của.",
  },
  {
    id: "kn-cu-mon-thach-ngoc",
    tags: ["cự môn", "tý", "ngọ", "song hao", "lộc tồn", "cách cục", "thạch trung ẩn ngọc"],
    title: "Cự Môn Tý/Ngọ — thạch trung ẩn ngọc",
    source: SRC,
    content:
      "Cự Môn Tý/Ngọ cần Song Hao (lửa nung đá) mới lộ 'ngọc'. Gặp Lộc Tồn che giấu (kho tàng) " +
      "thường vô vị — tài/năng vẫn nằm im. Hóa Lộc riêng không thay được vai trò Hao trong cách này.",
  },
  {
    id: "kn-ma-dau-doi-kiem",
    tags: [
      "kình dương", "ngọ", "thất sát", "mã đầu", "tật ách", "hạn", "hình", "hỏa", "linh",
    ],
    title: "Mã đầu đới kiếm (Kình Dương Ngọ)",
    source: SRC,
    content:
      "Kình Dương cư Ngọ = mã đới kiếm; thêm Thất Sát = nặng hơn. Đáng sợ khi Mệnh/cung đó hội " +
      "Linh–Hỏa–Hình–Kỵ hoặc tuổi Mộc. Đóng Tật Ách dễ bệnh nặng / tai nạn nếu thiếu sao Giải. " +
      "Có Thiên/Địa Giải Thần thì giảm mức báo động.",
  },
  {
    id: "kn-khong-kiep-quyen-loc",
    tags: [
      "địa không", "địa kiếp", "không kiếp", "hóa quyền", "hóa lộc", "tỵ", "hợi",
      "phú quý", "lao đao", "hạn",
    ],
    title: "Không–Kiếp Tỵ/Hợi",
    source: SRC,
    content:
      "Không–Kiếp ở Tỵ/Hợi: có Quyền + Lộc mới mong phú quý / hoành đạt; thiếu thì dễ khổ lao đao. " +
      "Hạn gặp Không–Kiếp nặng — sách ví 'anh hùng cũng khó qua'. Chỉ nêu khi lá số thực có tổ hợp này.",
  },
  {
    id: "kn-tham-liem-ty-hoi",
    tags: ["tham lang", "liêm trinh", "tỵ", "hợi", "hóa kỵ", "tú tinh", "cách cục"],
    title: "Tham–Liêm Tỵ/Hợi + Hóa Kỵ",
    source: SRC,
    content:
      "Tham–Liêm Tỵ/Hợi (tú tinh) không mặc định xấu: tuổi Kim + Hóa Kỵ ở Hợi, hoặc tuổi Hỏa + Hóa Kỵ ở Tỵ " +
      "có thể tốt (Kỵ Thủy chế bớt nóng Liêm). Đi ngược (vd tuổi Hỏa Mệnh Hợi, tuổi Kim Mệnh Tỵ) thì tổ hợp " +
      "này dễ độc. Cần khớp tuổi + cung + Kỵ thật mới dùng mẩu này.",
  },
  {
    id: "kn-am-duong-ham",
    tags: [
      "thái dương", "thái âm", "hãm", "miếu", "đắc địa", "tam không", "linh", "hỏa",
      "hình", "riêu", "đà la", "hóa kỵ", "ly hương",
    ],
    title: "Nhật–Nguyệt hãm / đắc và Tam Không",
    source: SRC,
    content:
      "Âm–Dương hãm vẫn có thể thượng cách nếu hợp tuổi–cung và có Tả–Hữu–Quyền–Lộc. " +
      "Hãm tối kỵ Linh–Hỏa–Hình–Riêu–Kiếp; Kỵ/Đà đắc đôi khi đỡ (mây che nhưng biến). " +
      "Hãm gặp Tam Không dễ sáng hơn; miếu gặp Tam Không dễ tối hơn. Nam gặp Âm–Dương phản bối " +
      "hay ly hương, bôn ba — nêu xu hướng, không kết án.",
  },
  {
    id: "kn-am-duong-dong-cung",
    tags: ["thái dương", "thái âm", "sửu", "mùi", "đồng cung", "công danh", "xương", "khúc", "tả", "hữu"],
    title: "Nhật–Nguyệt đồng cung Sửu/Mùi",
    source: SRC,
    content:
      "Nhật–Nguyệt tranh Sửu/Mùi thường cản hiển công danh. Có Tả–Hữu–Xương–Khúc thì vẫn có cửa hiển. " +
      "Luận sự nghiệp/học hành: nêu điều kiện phụ tá, không phủ nhận tuyệt đối.",
  },
  {
    id: "kn-liem-sat-suu-mui",
    tags: ["liêm trinh", "thất sát", "sửu", "mùi", "hãm", "hóa khoa", "mệnh", "oán hận"],
    title: "Liêm–Sát Sửu/Mùi",
    source: SRC,
    content:
      "Liêm–Sát Sửu/Mùi tối hãm, thêm ác sát càng nặng: đời dễ uất ức, hận lòng. Hóa Khoa có thể " +
      "giảm bớt. Dùng khi luận tính khí / sự nghiệp / hôn nhân — giọng thận trọng, khuyên tu dưỡng.",
  },
  {
    id: "kn-vu-pha-ty-hoi",
    tags: ["vũ khúc", "phá quân", "tỵ", "hợi", "hóa kỵ", "mưu kế", "quan lộc", "thám", "mưu"],
    title: "Vũ–Phá Tỵ/Hợi + Hóa Kỵ",
    source: SRC,
    content:
      "Mệnh Vũ–Phá Tỵ/Hợi thêm Hóa Kỵ: người nhiều mưu kế, nghi ngờ; hợp việc cần phân tích / " +
      "trinh sát / tham mưu hơn đường thẳng. Không gán 'xấu tuyệt' — chỉ định hướng nghề/ứng xử.",
  },
  {
    id: "kn-tham-vu-suu-mui",
    tags: ["tham lang", "vũ khúc", "sửu", "mùi", "hóa quyền", "hóa lộc", "tiền bần hậu phú"],
    title: "Tham–Vũ Sửu/Mùi",
    source: SRC,
    content:
      "Tham–Vũ đồng hành Sửu/Mùi: cần Quyền–Lộc mới hay; thường tiền bần hậu phú (phát muộn). " +
      "Thiếu Quyền–Lộc thì hạ giọng phú quý.",
  },
  {
    id: "kn-sat-pha-tham-liem-vs-sat",
    tags: [
      "thất sát", "phá quân", "tham lang", "liêm trinh", "kình dương", "đà la",
      "địa không", "địa kiếp", "hỏa tinh", "linh tinh", "sát tinh", "hung tinh",
    ],
    title: "Bộ hung vs sát tinh — ai chế ai",
    source: SRC,
    content:
      "Sát–Phá–Tham–Liêm hãm cần sát tinh đắc để chế. Tử–Phủ–Cơ–Nguyệt đắc gặp sát hãm: vô ngại; " +
      "đắc gặp sát đắc: dễ ganh cấn; hãm gặp sát đắc: rất xấu, dễ xảo trá (sát lấn tính tốt). " +
      "Sát tinh chủ yếu phù bộ hung hơn bộ thiện — dùng để hiệu chỉnh cát/hung, không thay lá số.",
  },

  // ===== HẠN =====
  {
    id: "kn-dai-tieu-han",
    tags: ["đại hạn", "tiểu hạn", "vận hạn", "hạn năm", "lưu niên"],
    title: "Đại hạn × tiểu hạn",
    source: SRC,
    content:
      "Đại hạn 10 năm × tiểu hạn 1 năm: xấu+tốt → bình; tốt+xấu → đỡ xấu; tốt+tốt → dễ phát; " +
      "xấu+xấu → nặng. Luận hạn năm phải neo cả hai tầng, không chỉ một năm đẹp/xấu lẻ.",
  },
  {
    id: "kn-han-luc-sat-bai",
    tags: [
      "hạn", "lục sát", "kình dương", "đà la", "không", "kiếp", "hỏa", "linh",
      "hao", "tang", "hổ", "khốc", "hư", "tuần", "triệt",
    ],
    title: "Hạn đẹp gặp Lục sát / Lục bại",
    source: SRC,
    content:
      "Hạn trông đẹp mà ngộ Lục sát (Kình–Đà–Không–Kiếp–Linh–Hỏa) hoặc bại tinh (Hao–Tang–Hổ–Khốc–Hư…) " +
      "hãm thì lực tốt giảm nhiều. Tuần/Triệt cản sát hãm có thể đỡ; sát đắc mà bị Tuần/Triệt cản " +
      "lại có thể rất xấu. Kiểm tra đắc/hãm trước khi báo hung.",
  },
  {
    id: "kn-nam-tuoi",
    tags: ["năm tuổi", "cung tuổi", "đại hạn", "tiểu hạn", "sinh", "hạn"],
    title: "Năm tuổi / hạn vào cung tuổi",
    source: SRC,
    content:
      "Năm tuổi không mặc định hung nếu nhiều sao tốt — đôi khi còn hoành đạt. " +
      "Đáng để ý khi đại/tiểu hạn đi vào đúng cung chi tuổi (cung sinh): xấu thì lủng củng hơn " +
      "năm xấu thường; tốt thì nhấn mạnh cơ hội. Chỉ áp khi biết chi năm sinh / cung tuổi.",
  },
  {
    id: "kn-han-xau-mau",
    tags: [
      "hạn xấu", "hóa kỵ", "thái tuế", "quan phù", "tang môn", "hồng loan",
      "địa kiếp", "thiên mã", "cự môn", "hao tán", "khẩu thiệt", "tình duyên",
    ],
    title: "Vài hạn xấu hay gặp (gợi ý)",
    source: SRC,
    content:
      "Xu hướng (chỉ khi đủ sao): Tuế+Phá+Hóa Kỵ → miệng tiếng; Hồng+Kiếp → tình trắc / tang cảm; " +
      "Hao+Phá → tán tài; Cự+Kỵ → bực mình, đề phòng đường thủy; Mã+Triệt → ngã / đổi chỗ; " +
      "Tham+Song Hao → thất vọng tình–tiền; Quan Phù+Hình → quan tụng. Gặp khoa/giải/phúc " +
      "thì hạ mức báo. Một mẩu gợi ý — không liệt kê dài trong câu trả lời.",
  },

  // ===== CUNG ĐỜI SỐNG =====
  {
    id: "kn-tat-ach-tu-dung",
    tags: [
      "tật ách", "sức khỏe", "bệnh", "thất sát", "phá quân", "thiên không",
      "song hao", "tham lang", "tràng sinh",
    ],
    title: "Tật Ách — tứ dũng tinh",
    source: SRC,
    content:
      "Tật Ách cần tứ dũng: Sát (giết bệnh), Phá (phá bệnh), Không (không bệnh), Hao (hao bệnh). " +
      "Tham ở Tật Ách dễ 'tham bệnh vào' — xấu trừ khi gặp bộ dũng chế. Tràng Sinh không mặc định tốt: " +
      "gặp sao xấu có thể nuôi bệnh lâu. Luận sức khỏe ưu tiên cung này + sát/cát thực có.",
  },
  {
    id: "kn-tu-tuc-truyen-tinh",
    tags: [
      "tử tức", "con cái", "truyền tinh", "thất sát", "phá quân", "tham lang",
      "tử vi", "thiên phủ", "thiên cơ", "thái âm",
    ],
    title: "Tử Tức — truyền tinh / hợp con",
    source: SRC,
    content:
      "Kinh nghiệm: Mệnh xấu mà Tử Tức tốt → đời sau có thể nhờ con; ngược lại Mệnh tốt Tử Tức xấu " +
      "dễ giảm phúc về dòng dõi. Cung Tử có Sát–Phá–Tham, con cũng bộ đó thủ Mệnh = truyền tinh, " +
      "sau dễ nhờ. Sát–Phá–Tham cung Tử mà con Cơ–Nguyệt thủ Mệnh: kỵ, khó nuôi (xu hướng). " +
      "Chỉ dùng khi user hỏi con cái / tuổi phù hợp.",
  },
  {
    id: "kn-menh-hung-13",
    tags: ["mệnh", "trẻ em", "sát tinh", "hung tinh", "13 tuổi", "hạn"],
    title: "Mệnh nhiều hung sát — sau 13 tuổi",
    source: SRC,
    content:
      "Trẻ Mệnh đầy hung sát mà qua ~13 tuổi thì thường 'quen' bộ sao đó, bớt lo tuyệt mệnh kiểu " +
      "cực đoan. Hạn về bản Mệnh ít khi là chỗ 'chết' theo kinh nghiệm sách. Vẫn cảnh báo sức khỏe " +
      "sớm, nhưng không gieo sợ hãi cho người đã trưởng thành.",
  },
  {
    id: "kn-phu-the-co-linh-hoa",
    tags: [
      "phu thê", "hôn nhân", "thiên cơ", "linh tinh", "hỏa tinh", "thiên tướng",
      "vợ lẽ", "gia đạo",
    ],
    title: "Cơ / Tướng + Linh Hỏa — gia đạo",
    source: SRC,
    content:
      "Nữ Cơ thủ Mệnh gặp Linh–Hỏa: chồng thêm vợ lẽ / đa tình dễ tan cửa (xu hướng cổ điển — " +
      "nay diễn đạt thận trọng: dễ rạn từ ghen tuông, đa mối). Thiên Tướng thủ Mệnh nữ gặp sát " +
      "tương tự ồn ào gia đạo; gặp Tử Vi đỡ. Luận hiện đại: ranh giới quan hệ, không khích lệ " +
      "đa thê.",
  },
  {
    id: "kn-tuoi-gia",
    tags: [
      "tuổi già", "hậu vận", "tử vi", "thiên phủ", "tràng sinh", "đế vượng",
      "hóa lộc", "đào hồng", "lộc tồn", "không", "tả", "hữu", "kiếp",
    ],
    title: "Hậu vận / tuổi già",
    source: SRC,
    content:
      "Già gặp Tử–Phủ–Tràng Sinh–Đế Vượng–Hóa Lộc: đỡ. Đào–Hồng–Lộc Tồn–Thiên Không về già dễ tạp " +
      "(trừ Mệnh đã có sẵn từ trẻ). Tả–Hữu chủ trung vận, già giảm lực. Địa Kiếp–Không (gậy–bị): " +
      "sa sút — Hóa Khoa khả giải. Dùng khi hỏi hậu vận / hưu trí.",
  },

  // ===== NGHỀ / HƯỚNG (ứng dụng ngắn, không mã ngành) =====
  {
    id: "kn-huong-nghe-mau",
    tags: [
      "quan lộc", "nghề", "sự nghiệp", "học hành", "vũ khúc", "thái dương",
      "văn xương", "văn khúc", "tham lang", "cự môn", "thiên lương",
    ],
    title: "Gợi hướng nghề theo tinh (kinh nghiệm, không mã ngành)",
    source: SRC,
    content:
      "Chỉ gợi HƯỚNG lĩnh vực khi sao/cung Quan–Mệnh đủ: Dương/Lương–Xương–Khúc → học thuật, " +
      "y–luật–giáo–truyền thông phục vụ; Vũ–Phủ → tài chính, quản tài, kỹ thuật cứng; " +
      "Cự–Cơ → biện luận, đàm phán, nội dung; Tham–Hỏa/Linh → thương mại, giải trí, kỹ xảo; " +
      "Sát–Phá → võ–quân–phẫu thuật–xây dựng–khủng hoảng. Không chỉ trường/mã ngành; " +
      "không chắc chắn một nghề duy nhất.",
  },

  // ===== BỘ BÀNG TINH ĐẸP/XẤU (rút gọn) =====
  {
    id: "kn-bo-dep-menh",
    tags: [
      "long trì", "phượng các", "bạch hổ", "hoa cái", "tả phù", "hữu bật",
      "thiên khôi", "thiên việt", "hóa lộc", "hóa quyền", "hóa khoa", "cách đẹp",
    ],
    title: "Bộ bàng tinh đẹp ở Mệnh/Thân (rút)",
    source: SRC,
    content:
      "Xu hướng tốt khi đóng/chiếu Mệnh–Thân–Phúc: Tứ linh Long–Phượng–Hổ–Cái; Tả–Hữu–Long–Phượng; " +
      "Khôi–Khoa; Lộc hội Đào–Hồng–Tả–Hữu; Tử hội Khoa–Quyền–Lộc; Cơ–Cự hội Song Hao đúng cung. " +
      "Ngộ Tuần/Triệt giảm hay. Chỉ nêu bộ khớp lá, tối đa 1–2 bộ trọng yếu.",
  },
  {
    id: "kn-luc-hop-han",
    tags: ["lục hợp", "hạn", "đại hạn", "tiểu hạn", "tháng", "cung"],
    title: "Lục hợp khi xem hạn",
    source: SRC,
    content:
      "Xem đại hạn / tiểu hạn / tháng cũng cần lục hợp cung đó (không chỉ cung hạn đứng). " +
      "Thiếu lục hợp dễ bỏ mất lực cát–hung phụ — đặc biệt khi user hỏi chi tiết tháng/năm.",
  },
];

// ----------------------------------------------------------------------------
// TRUY HỒI
// ----------------------------------------------------------------------------

export interface RetrieveKinhNghiemContext {
  /** Tên sao chính/phụ thực có trên lá (chuẩn vi-VN). */
  stars?: string[];
  /** Tên cung liên quan câu hỏi hoặc đang luận. */
  palaces?: string[];
  /** Chủ đề: sự nghiệp, hôn nhân, sức khỏe, hạn, con cái... */
  topics?: string[];
  /** Câu hỏi tự do. */
  query?: string;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();

/** Từ quá phổ biến — không dùng để chấm điểm query (tránh false positive). */
const QUERY_STOPWORDS = new Set([
  "không", "có", "là", "của", "và", "với", "cho", "các", "những", "một", "này",
  "kia", "thế", "nào", "gì", "sao", "rất", "quá", "hay", "hoặc", "thì", "mà",
  "được", "bị", "về", "trong", "ngoài", "khi", "nếu", "cần", "nên", "phải",
  "tôi", "mình", "bạn", "người", "năm", "nay", "rồi", "đang", "sẽ", "đã",
  "liên", "quan", "hỏi", "xin", "giúp", "xem", "cho", "biết", "the", "and",
  "xyzabc",
]);

/** Đồng nghĩa / alias nhẹ để tags khớp query người dùng. */
const TOPIC_ALIASES: Record<string, string[]> = {
  "sự nghiệp": ["quan lộc", "nghề", "công việc", "công danh"],
  "công việc": ["quan lộc", "nghề", "sự nghiệp"],
  nghề: ["quan lộc", "sự nghiệp", "học hành"],
  "học hành": ["quan lộc", "học", "thi"],
  "hôn nhân": ["phu thê", "tình duyên", "vợ", "chồng"],
  "tình duyên": ["phu thê", "hôn nhân"],
  "tiền bạc": ["tài bạch", "tài", "lộc", "giàu"],
  tài: ["tài bạch", "tiền bạc", "lộc"],
  "sức khỏe": ["tật ách", "bệnh"],
  bệnh: ["tật ách", "sức khỏe"],
  hạn: ["đại hạn", "tiểu hạn", "lưu niên", "vận hạn"],
  "con cái": ["tử tức"],
  "tuổi già": ["hậu vận"],
};

function expandNeedles(raw: string[]): string[] {
  const out = new Set<string>();
  for (const r of raw) {
    const n = norm(r);
    if (!n) continue;
    out.add(n);
    const aliases = TOPIC_ALIASES[n];
    if (aliases) aliases.forEach((a) => out.add(norm(a)));
  }
  return [...out];
}

/**
 * Top-N mẩu kinh nghiệm khớp lá + câu hỏi.
 * Không có mẫu "always" nặng — chỉ lấy score > 0 để tránh nhồi lý thuyết khi hỏi yes/no.
 * Khi không khớp gì: trả 1 mẩu trình tự đoán (neo phương pháp nhẹ).
 */
export function retrieveKinhNghiem(
  ctx: RetrieveKinhNghiemContext,
  topN = 5,
): KnowledgeEntry[] {
  const queryNorm = ctx.query ? norm(ctx.query) : "";
  const queryWords = queryNorm
    ? queryNorm
        .split(/\s+/)
        .filter((w) => w.length >= 2 && !QUERY_STOPWORDS.has(w))
    : [];

  // Tách: sao/cung vs topic/query — tránh 50+ phụ tinh "ngập" điểm
  // khiến mẩu generic (sát/hạn) luôn thắng mẩu khớp câu hỏi.
  const starLikeNeedles = expandNeedles([...(ctx.stars ?? []), ...(ctx.palaces ?? [])]);
  const topicNeedles = new Set(expandNeedles([...(ctx.topics ?? [])]));
  if (queryNorm) {
    for (const key of Object.keys(TOPIC_ALIASES)) {
      if (queryNorm.includes(norm(key))) {
        expandNeedles([key]).forEach((x) => topicNeedles.add(x));
      }
    }
  }

  const scored = KINH_NGHIEM_KNOWLEDGE.map((entry) => {
    const tagSet = entry.tags.map(norm);
    let starScore = 0;
    let queryScore = 0;
    for (const n of starLikeNeedles) {
      if (tagSet.some((t) => t.includes(n) || n.includes(t))) starScore += 2;
      if (norm(entry.title).includes(n)) starScore += 1;
    }
    // Trần điểm từ sao: lá nào cũng đầy sát/cát → không cho sao lấn át câu hỏi.
    starScore = Math.min(starScore, 8);
    for (const n of topicNeedles) {
      if (tagSet.some((t) => t.includes(n) || n.includes(t))) queryScore += 4;
    }
    for (const w of queryWords) {
      if (tagSet.some((t) => t.includes(w))) queryScore += 5;
      if (norm(entry.title).includes(w)) queryScore += 3;
      if (norm(entry.content).includes(w)) queryScore += 1;
    }
    const score = starScore + queryScore;
    return { entry, score, queryScore };
  });

  const sorted = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.queryScore - a.queryScore);
  const picked = sorted.slice(0, topN).map((s) => s.entry);

  if (picked.length === 0) {
    const fallback = KINH_NGHIEM_KNOWLEDGE.find((e) => e.id === "kn-trinh-tu-doan");
    return fallback ? [fallback] : [];
  }
  return picked;
}

/** Gói text chèn prompt — nhấn vai trò lớp B + chống màu mè / chắc chắn. */
export function kinhNghiemToPromptText(entries: KnowledgeEntry[]): string {
  if (!entries.length) return "";
  const body = entries.map((e) => `• [${e.title}]: ${e.content}`).join("\n");
  return (
    `=== KINH NGHIỆM ỨNG DỤNG (lớp B — đã truy hồi theo lá/câu hỏi) ===\n` +
    `(Nguồn: ${SRC}. Vai trò: gợi ỨNG DỤNG đoán khi khớp sao/cung; ` +
    `KHÔNG thay bản chất sao (Đàm Tinh) và KHÔNG thắng dữ liệu lá số. ` +
    `Ưu tiên: lá số thực > Đàm Tinh (tinh tình) > mẩu này. ` +
    `Chỉ "CÓ XU HƯỚNG"; văn gọn, đời thực, CẤM hoa mỹ và CẤM khẳng định tuyệt đối. ` +
    `Không nhắc tên sách trừ khi đương số hỏi nguồn.)\n` +
    body
  );
}
