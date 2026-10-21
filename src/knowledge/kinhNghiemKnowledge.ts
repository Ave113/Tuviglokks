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
// NEO LÁ SỐ / IZTRO (bắt buộc):
//   - Mẩu có requireAll / requireAny chỉ được retrieve khi sao/cung trên lá khớp.
//   - Prompt nhấn: chỉ áp mẩu khi dữ liệu lá (iztro + báo cáo đã tính) xác nhận tổ hợp.
//   - CẤM tự phát triển cách cục / hạn ngoài mẩu + ngoài sao thực có.
//
// ƯU TIÊN KHI XUNG ĐỘT (ghi trong prompt block):
//   1) Sao/cung THỰC CÓ trên lá số thắng mọi mẩu.
//   2) Bản chất sao (Đàm Tinh) thắng lớp B nếu mâu thuẫn định nghĩa.
//   3) Mọi kết luận chỉ "CÓ XU HƯỚNG", không chắc chắn tuyệt đối.
// ============================================================================

import type { KnowledgeEntry } from "./chineseKnowledge";

const SRC = "Sổ Tử Vi Kinh Nghiệm — Quản Xuân Thịnh (Quyển Hạ, trích có chọn)";

/** Nguồn thứ hai cho mẩu "sao nhập hạn" (Mạch A — Tân Biên Phần 3.2). */
const SRC_TANBIEN =
  "Tử Vi Đẩu Số Tân Biên — Vân Đằng Thái Thứ Lang (1956, mục 3.2 sao nhập hạn)";

/** Nguồn thứ ba — cơ chế sao vận/lưu (mạch A2): các đoạn 流昌/流魁/流钺/流马/流化忌. */
const SRC_VDC =
  "Vương Đình Chi — Đàm Tinh Đẩu Số (đoạn sao vận-lưu, trích có chọn)";

/** Liên hệ tinh tình bản sao sang chặng vận (không phải trích nguyên văn). */
const SRC_VDC_REL =
  "Vương Đình Chi — Đàm Tinh Đẩu Số (liên hệ tinh tình bản sao)";

// Nguồn "sao nhập Mệnh chi tiết" — tên nguồn = tên file sách (người dùng cung cấp).
const SRC_NM_TUVI = "Tử Vi nhập Mệnh — saotuvi.txt (trích có chọn)";
const SRC_NM_XUONG = "Văn Xương nhập Mệnh — saovanxuong.txt (trích có chọn)";
const SRC_NM_KHUC = "Văn Khúc nhập Mệnh — saovankhuc.txt (trích có chọn)";
const SRC_NM_PHA = "Phá Quân nhập Mệnh — saophaquan.txt (trích có chọn)";
const SRC_NM_TUONG = "Thiên Tướng nhập Mệnh — saothientuong.txt (trích có chọn)";

/** Đường dẫn tương đối file nguồn (ghi chú / docs). */
export const KINH_NGHIEM_SOURCE_RELATIVE =
  "src/knowledge/data/so-tu-vi-kinh-nghiem-quyen-ha.txt";

/**
 * Mẩu kinh nghiệm + điều kiện neo lá.
 * requireAll: lá phải có ĐỦ mọi kim (sao/cụm) mới được lấy.
 * requireAny: lá phải có ít nhất 1 kim (nếu set).
 * Method entries (trình tự, lục hợp…) thường không set gate — luôn có thể neo nhẹ.
 */
export interface KinhNghiemEntry extends KnowledgeEntry {
  requireAll?: string[];
  requireAny?: string[];
  /** patternId cách cục máy — boost retrieve khi lá khớp */
  patternIds?: string[];
  /** Mẩu nữ mệnh/nam mệnh — chỉ retrieve khi giới tính khớp (chartData.gender). */
  onlyGender?: "nữ" | "nam";
}

// ----------------------------------------------------------------------------
// MẪU KINH NGHIỆM (biên soạn từ Quyển Hạ — gọn, đời thực, không màu mè)
// ----------------------------------------------------------------------------

export const KINH_NGHIEM_KNOWLEDGE: KinhNghiemEntry[] = [
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
      "giảm lực vì bệnh chiếm thời gian. Luận phải gom tam phương tứ chính, không chỉ một cung. " +
      "Chỉ kết luận trên sao/cung iztro đã an — không bịa tổ hợp.",
  },
  {
    id: "kn-tam-phuong-luc-hop",
    tags: ["tam phương", "tứ chính", "lục hợp", "mệnh", "cách đoán", "đoán số"],
    title: "Tam phương tứ chính + lục hợp khi đoán",
    source: SRC,
    content:
      "Đoán một cung phải gom tam phương tứ chính (vd Mệnh Ngọ: Ngọ–Dần–Tuất–Tý) và lục hợp " +
      "(vd Ngọ hợp Mùi). Thiếu lớp này dễ khen/chê một cung lẻ. Chỉ nêu quan hệ cung đã có " +
      "trên lưới lá số / báo cáo quan hệ — không nhẩm thêm cung ngoài dữ liệu.",
  },
  {
    id: "kn-cung-anh-huong",
    tags: [
      "mệnh", "phụ mẫu", "huynh đệ", "điền trạch", "tử tức", "tật ách", "nô bộc",
      "chi", "ảnh hưởng",
    ],
    title: "Mệnh theo chi — cung đời sống dễ đụng",
    source: SRC,
    content:
      "Kinh nghiệm sách: Mệnh Tý/Ngọ hay đụng Phụ mẫu; Sửu/Mùi–Huynh; Tỵ/Hợi–Điền; " +
      "Dần/Thân–Tử tức; Mão/Dậu–Tật; Thìn/Tuất–Nô. Chỉ dùng để ƯU TIÊN soi đúng cung trên lá " +
      "(đọc sao thật của cung đó), không kết án quan hệ chỉ vì chi Mệnh.",
  },
  {
    id: "kn-menh-tuan-triet",
    tags: ["mệnh", "tuần", "triệt", "giảm lực", "quý cách", "tuần không", "triệt lộ"],
    title: "Mệnh quý gặp Tuần / Triệt",
    source: SRC,
    requireAny: ["tuần", "triệt"],
    content:
      "Mệnh được bộ quý mà ngộ Tuần hoặc Triệt thì lực quý giảm mạnh (khoảng quá nửa theo kinh nghiệm sách). " +
      "Không phủ nhận cách, nhưng hạ giọng phú quý; ưu tiên luận phần còn phát huy được. " +
      "Chỉ khi lá có nhãn Tuần/Triệt (iztro) đúng cung liên quan.",
  },
  {
    id: "kn-vo-chinh-tam-khong",
    tags: ["vô chính diệu", "tam không", "tuần", "triệt", "địa không", "mệnh", "phú quý"],
    title: "Vô chính diệu + Tam Không",
    source: SRC,
    requireAny: ["tuần", "triệt", "địa không"],
    content:
      "Mệnh vô chính diệu gặp Tam Không (Tuần / Triệt / Địa Không — không gộp Thiên Không vào đây) " +
      "có thể phú quý khả kỳ, NHƯNG tam phương phải có nhiều quý tinh chiếu; phú quý kiểu này thường " +
      "có hạn định, không bền tuyệt đối. Chỉ nêu khi Mệnh thật vô chính diệu + có ít nhất một Không/Tuần/Triệt trên lá.",
  },
  {
    id: "kn-triet-tuan-cung-hop",
    tags: ["triệt", "tuần", "không vong", "thân", "dậu", "ngọ", "mùi", "mệnh"],
    title: "Triệt/Tuần — cung đỡ vs nặng",
    source: SRC,
    requireAny: ["triệt", "tuần", "không vong"],
    content:
      "Sách ghi: Triệt đáo Kim cung (Thân/Dậu) — Kim mệnh đỡ; Tuần lâm Hỏa (Ngọ/Mùi) — Hỏa mệnh đỡ. " +
      "Cùng cung: đôi khi chỉ dính một nửa nhãn (vd Triệt Lộ vs Không Vong) — mức nặng khác nhau. " +
      "Chỉ hiệu chỉnh khi nhãn Tuần/Triệt/Không Vong đã có trên lá; không tự an lại Tuần–Triệt.",
  },
  {
    id: "kn-menh-sao-duong-tiet",
    tags: ["mệnh", "cục", "ngũ hành", "đắc địa", "hãm", "sinh khắc", "chính tinh"],
    title: "Cung dưỡng sao / sao dưỡng mệnh",
    source: SRC,
    content:
      "Hay: cung dưỡng sao và sao dưỡng mệnh (vd mệnh Hỏa + Lương Mộc ở cung Thủy). " +
      "Xấu: cung dưỡng sao nhưng sao khắc/đốt mệnh (vd mệnh Kim + Lương ở cung Hỏa). " +
      "Sao bị tiết (vd Sát Kim ở Hợi) khác sao được sinh (Sát ở Thổ). Chỉ luận trên ngũ hành cục + " +
      "vị trí/brightness iztro đã có — không bịa bảng miếu hãm ngoài dữ liệu.",
  },
  {
    id: "kn-am-duong-tue-hop-sao",
    tags: [
      "âm", "dương", "tuổi", "thiên cơ", "thái âm", "thiên đồng", "thiên lương",
      "thất sát", "phá quân", "tham lang", "liêm trinh", "thái dương", "vũ khúc", "tử vi",
    ],
    title: "Âm/Dương tuế hợp bộ sao",
    source: SRC,
    content:
      "Âm tuế hay hợp Cơ–Nguyệt–Đồng–Lương–Phủ–Cự; Dương tuế hay hợp Sát–Phá–Tham–Liêm–Dương–Vũ–Tướng. " +
      "Tử Vi phù cả hai. Chỉ dùng để hạ/nâng giọng khi tuổi + chính tinh Mệnh/Thân trên lá khớp — " +
      "không kết luận chỉ vì tuổi mà thiếu sao.",
  },

  // ===== CÁCH CỤC THƯỜNG DÙNG =====
  {
    id: "kn-song-loc",
    tags: [
      "hóa lộc", "lộc tồn", "song lộc", "tài bạch", "tiền bạc", "mệnh", "tài",
    ],
    title: "Song Lộc (Hóa Lộc + Lộc Tồn)",
    source: SRC,
    // Lộc Tồn = tên sao; Hóa Lộc = nhãn mutagen (payload inject "Hóa Lộc").
    requireAll: ["lộc tồn", "hóa lộc"],
    content:
      "Hai sao Lộc đồng cung thường không đẹp (Mộc–Thổ tương khắc trong cách hiểu sách này); " +
      "dễ khổ vì tiền hoặc ai oán bạc. Song Lộc đi tam hợp chiếu Mệnh mới đáng gọi quý. " +
      "Chỉ khen/chê khi lá thật có Lộc Tồn VÀ nhãn Hóa Lộc (mutagen đã tính) — thiếu một bên thì bỏ mẩu.",
  },
  {
    id: "kn-song-hao",
    tags: [
      "đại hao", "tiểu hao", "song hao", "thiên cơ", "cự môn", "mão", "dậu",
      "tài bạch", "giàu", "hao tán", "lộc tồn",
    ],
    title: "Song Hao đắc cách vs hao tán",
    source: SRC,
    requireAny: ["đại hao", "tiểu hao"],
    content:
      "Song Hao (Đại/Tiểu Hao) thuộc Hỏa: trúng cách (vd Mệnh Mão/Dậu + Cơ/Cự hội Hao) có thể " +
      "phong lưu nhưng khó bền — 'tốt ông không tiền'. Mệnh có Song Hao đến hạn Song Hao dễ đạt; " +
      "Mệnh Lộc Tồn đến hạn Hao dễ tán tài; Mệnh Song Hao đến hạn Lộc Tồn thường chỉ bình. " +
      "Lộc Tồn gặp Không/Vong: khó kiếm, dễ xuất của. Chỉ khi lá/hạn có Hao (và Lộc nếu nói Lộc).",
  },
  {
    id: "kn-cu-mon-thach-ngoc",
    tags: ["cự môn", "tý", "ngọ", "song hao", "lộc tồn", "cách cục", "thạch trung ẩn ngọc"],
    title: "Cự Môn Tý/Ngọ — thạch trung ẩn ngọc",
    source: SRC,
    requireAll: ["cự môn"],
    requireAny: ["đại hao", "tiểu hao", "lộc tồn", "hóa lộc"],
    content:
      "Cự Môn Tý/Ngọ cần Song Hao (lửa nung đá) mới lộ 'ngọc'. Gặp Lộc Tồn che giấu (kho tàng) " +
      "thường vô vị — tài/năng vẫn nằm im. Hóa Lộc riêng không thay được vai trò Hao trong cách này. " +
      "Chỉ khi Cự đúng chi Tý/Ngọ trên lá + có Hao hoặc Lộc liên quan.",
  },
  {
    id: "kn-ma-dau-doi-kiem",
    tags: [
      "kình dương", "ngọ", "thất sát", "mã đầu", "tật ách", "hạn", "hình", "hỏa", "linh",
    ],
    title: "Mã đầu đới kiếm (Kình Dương Ngọ)",
    source: SRC,
    requireAll: ["kình dương"],
    content:
      "Kình Dương cư Ngọ = mã đới kiếm; thêm Thất Sát = nặng hơn. Đáng sợ khi Mệnh/cung đó hội " +
      "Linh–Hỏa–Hình–Kỵ hoặc tuổi Mộc. Đóng Tật Ách dễ bệnh nặng / tai nạn nếu thiếu sao Giải. " +
      "Có Thiên/Địa Giải Thần thì giảm mức báo động. Chỉ khi Kình thật ở Ngọ (hoặc hạn Kình+Tuế trùng theo báo cáo lưu).",
  },
  {
    id: "kn-khong-kiep-quyen-loc",
    tags: [
      "địa không", "địa kiếp", "không kiếp", "hóa quyền", "hóa lộc", "tỵ", "hợi",
      "phú quý", "lao đao", "hạn",
    ],
    title: "Không–Kiếp Tỵ/Hợi",
    source: SRC,
    requireAny: ["địa không", "địa kiếp"],
    content:
      "Không–Kiếp ở Tỵ/Hợi: có Quyền + Lộc mới mong phú quý / hoành đạt; thiếu thì dễ khổ lao đao. " +
      "Hạn gặp Không–Kiếp nặng — sách ví 'anh hùng cũng khó qua'. Chỉ nêu khi lá/hạn thực có Không–Kiếp " +
      "và đã kiểm Quyền/Lộc (mutagen hoặc sao) trên dữ liệu.",
  },
  {
    id: "kn-tham-liem-ty-hoi",
    tags: ["tham lang", "liêm trinh", "tỵ", "hợi", "hóa kỵ", "tú tinh", "cách cục"],
    title: "Tham–Liêm Tỵ/Hợi + Hóa Kỵ",
    source: SRC,
    requireAll: ["tham lang", "liêm trinh"],
    content:
      "Tham–Liêm Tỵ/Hợi (tú tinh) không mặc định xấu: tuổi Kim + Hóa Kỵ ở Hợi, hoặc tuổi Hỏa + Hóa Kỵ ở Tỵ " +
      "có thể tốt (Kỵ Thủy chế bớt nóng Liêm). Đi ngược (vd tuổi Hỏa Mệnh Hợi, tuổi Kim Mệnh Tỵ) thì tổ hợp " +
      "này dễ độc. Chỉ khi Tham+Liêm đúng cung Tỵ/Hợi trên lá + có/không Hóa Kỵ theo mutagen thật.",
  },
  {
    id: "kn-am-duong-ham",
    tags: [
      "thái dương", "thái âm", "hãm", "miếu", "đắc địa", "tam không", "linh", "hỏa",
      "hình", "riêu", "đà la", "hóa kỵ", "ly hương",
    ],
    title: "Nhật–Nguyệt hãm / đắc và Tam Không",
    source: SRC,
    requireAny: ["thái dương", "thái âm"],
    content:
      "Âm–Dương hãm vẫn có thể thượng cách nếu hợp tuổi–cung và có Tả–Hữu–Quyền–Lộc. " +
      "Hãm tối kỵ Linh–Hỏa–Hình–Riêu–Kiếp; Kỵ/Đà đắc đôi khi đỡ (mây che nhưng biến). " +
      "Hãm gặp Tam Không dễ sáng hơn; miếu gặp Tam Không dễ tối hơn. Nam gặp Âm–Dương phản bối " +
      "hay ly hương — xu hướng. Chỉ dựa brightness/đắc hãm iztro + sao phụ thật có.",
  },
  {
    id: "kn-am-duong-dong-cung",
    tags: ["thái dương", "thái âm", "sửu", "mùi", "đồng cung", "công danh", "xương", "khúc", "tả", "hữu"],
    title: "Nhật–Nguyệt đồng cung Sửu/Mùi",
    source: SRC,
    requireAll: ["thái dương", "thái âm"],
    content:
      "Nhật–Nguyệt tranh Sửu/Mùi thường cản hiển công danh. Có Tả–Hữu–Xương–Khúc thì vẫn có cửa hiển. " +
      "Chỉ khi hai sao đồng cung đúng Sửu/Mùi trên lá; liệt kê phụ tá chỉ nếu iztro có.",
  },
  {
    id: "kn-am-duong-hoa-ky",
    tags: ["thái dương", "thái âm", "hóa kỵ", "đắc địa", "khánh vân", "cách đẹp"],
    title: "Nhật/Nguyệt đắc gặp Hóa Kỵ (khánh vân)",
    source: SRC,
    requireAny: ["thái dương", "thái âm"],
    content:
      "Sách Tàu trích trong Quyển Hạ: Dương/Âm đắc vị gặp Hóa Kỵ có thể là 'khánh vân phùng nhật/nguyệt' " +
      "(mây năm sắc) — không mặc định xấu như Kỵ hãm. Chỉ dùng khi mutagen Hóa Kỵ đúng sao Nhật/Nguyệt " +
      "hoặc Kỵ hội đúng cung đắc trên dữ liệu lá — không gán Kỵ lung tung.",
  },
  {
    id: "kn-liem-sat-suu-mui",
    tags: ["liêm trinh", "thất sát", "sửu", "mùi", "hãm", "hóa khoa", "mệnh", "oán hận"],
    title: "Liêm–Sát Sửu/Mùi",
    source: SRC,
    requireAll: ["liêm trinh", "thất sát"],
    content:
      "Liêm–Sát Sửu/Mùi tối hãm, thêm ác sát càng nặng: đời dễ uất ức, hận lòng. Hóa Khoa có thể " +
      "giảm bớt. Chỉ khi Liêm+Sát đúng Sửu/Mùi (đồng cung hoặc hội đúng theo lá); giọng thận trọng.",
  },
  {
    id: "kn-vu-pha-ty-hoi",
    tags: ["vũ khúc", "phá quân", "tỵ", "hợi", "hóa kỵ", "mưu kế", "quan lộc", "thám", "mưu"],
    title: "Vũ–Phá Tỵ/Hợi + Hóa Kỵ",
    source: SRC,
    requireAll: ["vũ khúc", "phá quân"],
    content:
      "Mệnh Vũ–Phá Tỵ/Hợi thêm Hóa Kỵ: người nhiều mưu kế, nghi ngờ; hợp việc cần phân tích / " +
      "trinh sát / tham mưu hơn đường thẳng. Chỉ khi Vũ+Phá đúng Tỵ/Hợi trên lá; Kỵ chỉ nêu nếu có mutagen/sao.",
  },
  {
    id: "kn-tham-vu-suu-mui",
    tags: ["tham lang", "vũ khúc", "sửu", "mùi", "hóa quyền", "hóa lộc", "tiền bần hậu phú"],
    title: "Tham–Vũ Sửu/Mùi",
    source: SRC,
    requireAll: ["tham lang", "vũ khúc"],
    content:
      "Tham–Vũ đồng hành Sửu/Mùi: cần Quyền–Lộc mới hay; thường tiền bần hậu phú (phát muộn). " +
      "Thiếu Quyền–Lộc thì hạ giọng phú quý. Chỉ khi Tham+Vũ đúng cung Sửu/Mùi trên lá.",
  },
  {
    id: "kn-cu-dong-tran",
    tags: ["cự môn", "thiên đồng", "thìn", "tuất", "sửu", "mùi", "phụ mẫu", "hãm"],
    title: "Cự–Đồng Thìn/Tuất/Sửu/Mùi",
    source: SRC,
    requireAll: ["cự môn", "thiên đồng"],
    content:
      "Cự–Đồng ở Thìn/Tuất/Sửu/Mùi: tuổi Tân/Đinh thường đỡ; tuổi khác dễ hãm. " +
      "Nếu đúng cung Phụ + nhiều sao xấu: xu hướng cha mẹ chia ly / con nuôi — chỉ gợi ý khi " +
      "cung Phụ trên lá thật xấu. Không áp khi Cự–Đồng không đóng các chi này.",
  },
  {
    id: "kn-dong-luong-ty-hoi",
    tags: ["thiên đồng", "thiên lương", "tỵ", "hợi", "thiên khôi", "thiên việt", "hãm"],
    title: "Đồng–Lương Tỵ/Hợi + Khôi/Việt",
    source: SRC,
    requireAny: ["thiên đồng", "thiên lương"],
    content:
      "Đồng/Lương Tỵ/Hợi gọi hãm nhưng: Lương Hợi gặp Khôi tối quý; Đồng Tỵ gặp Việt tối ái " +
      "(theo sách). Chỉ nâng giọng khi đúng cặp sao+chi+Khôi/Việt thật có trên lá.",
  },
  {
    id: "kn-co-luong-quyen",
    patternIds: ["co-luong", "co-nguyet-dong-luong", "co-nguyet"],
    tags: ["thiên cơ", "thiên lương", "hóa quyền", "cách đẹp", "mệnh"],
    title: "Cơ–Lương + Hóa Quyền",
    source: SRC,
    requireAll: ["thiên cơ", "thiên lương"],
    content:
      "Cơ–Lương đồng cung gặp Hóa Quyền tối quý (kinh nghiệm sách). Chỉ nêu khi hai sao đồng/hội " +
      "đúng trên lá và mutagen Quyền đúng sao hoặc hội đủ — không tự gán Quyền.",
  },
  {
    id: "kn-co-luong-mao-dau-tai",
    tags: ["thiên cơ", "thiên lương", "mão", "dậu", "tài bạch", "buôn bán", "thương mại"],
    title: "Cơ–Lương Mão/Dậu — hướng Tài",
    source: SRC,
    requireAny: ["thiên cơ", "thiên lương"],
    content:
      "Cơ–Lương đóng Mão/Dậu mà cung Tài cũng ở đó: xu hướng buôn bán/thương mại khá. " +
      "Chỉ khi chi cung + sao khớp lá; không chỉ nghề duy nhất.",
  },
  {
    id: "kn-thien-dong-tuat-dinh",
    tags: ["thiên đồng", "tuất", "hãm", "tuổi đinh", "thiên tướng"],
    title: "Thiên Đồng Tuất — tuổi Đinh",
    source: SRC,
    requireAll: ["thiên đồng"],
    content:
      "Đồng cư Tuất thường hãm; tuổi Đinh có thể quý. Nếu Tướng + ác sát cùng cung: sách khuyên " +
      "hướng tĩnh / tu dưỡng hơn đường ồn. Chỉ khi Đồng thật ở Tuất trên lá.",
  },
  {
    id: "kn-sat-pha-tham-liem-vs-sat",
    patternIds: ["sat-pha-tham", "liem-sat", "liem-tham", "vu-sat"],
    tags: [
      "thất sát", "phá quân", "tham lang", "liêm trinh", "kình dương", "đà la",
      "địa không", "địa kiếp", "hỏa tinh", "linh tinh", "sát tinh", "hung tinh",
    ],
    title: "Bộ hung vs sát tinh — ai chế ai",
    source: SRC,
    requireAny: ["thất sát", "phá quân", "tham lang", "liêm trinh", "kình dương", "đà la"],
    content:
      "Sát–Phá–Tham–Liêm hãm cần sát tinh đắc để chế. Tử–Phủ–Cơ–Nguyệt đắc gặp sát hãm: vô ngại; " +
      "đắc gặp sát đắc: dễ ganh cấn; hãm gặp sát đắc: rất xấu, dễ xảo trá (sát lấn tính tốt). " +
      "Chỉ hiệu chỉnh cát/hung theo đắc–hãm iztro + sao thật — không thay lá số.",
  },
  {
    id: "kn-hung-tinh-dac-cach",
    tags: ["hung tinh", "đắc cách", "vô chính diệu", "âm", "mệnh", "thất sát", "phá quân"],
    title: "Hung tinh đắc cách",
    source: SRC,
    requireAny: ["thất sát", "phá quân", "tham lang", "liêm trinh", "kình dương"],
    content:
      "Hung tinh đắc cách: Mệnh vô chính diệu hoặc âm nam gặp thì thường hay hơn (theo sách). " +
      "Chỉ khi hung tinh trên lá thật đắc (brightness/cách đã tính) — không gọi đắc bừa.",
  },
  {
    id: "kn-kinh-da-phu",
    tags: ["kình dương", "đà la", "dương", "âm", "mệnh", "sát tinh"],
    title: "Kình / Đà phù âm dương cung",
    source: SRC,
    requireAny: ["kình dương", "đà la"],
    content:
      "Kình (Kim dương) ở dương cung phù dương nam/nữ; Đà (Thủy âm) ở âm cung phù âm nam/nữ. " +
      "Chỉ tinh chỉnh khi biết chi cung + giới + sao Kình/Đà thật — không đảo chiều nếu thiếu dữ liệu.",
  },
  {
    id: "kn-thien-khong-han",
    tags: ["thiên không", "thái tuế", "lộc tồn", "hạn", "mệnh", "thân"],
    title: "Thiên Không — kỵ Mệnh/Thân/Lộc",
    source: SRC,
    requireAny: ["thiên không"],
    content:
      "Thiên Không thường đứng trước Thái Tuế (lưu). Bản Mệnh/Thân/Lộc Tồn kỵ chung với Không; " +
      "hạn gặp nặng. Phân biệt Thiên Không ≠ Địa Không ≠ Tuần/Triệt. Chỉ khi lá/hạn có đúng nhãn Thiên Không.",
  },

  // ===== HẠN =====
  {
    id: "kn-dai-tieu-han",
    tags: ["đại hạn", "tiểu hạn", "vận hạn", "hạn năm", "lưu niên"],
    title: "Đại hạn × tiểu hạn",
    source: SRC,
    content:
      "Đại hạn 10 năm × tiểu hạn 1 năm: xấu+tốt → bình; tốt+xấu → đỡ xấu; tốt+tốt → dễ phát; " +
      "xấu+xấu → nặng. Luận hạn năm phải neo cả hai tầng đã tính (đại/tiểu/lưu trên payload) — " +
      "không chỉ một năm đẹp/xấu lẻ, không tự an hạn ngoài dữ liệu.",
  },
  {
    id: "kn-han-5-cung-tuan-triet",
    tags: ["hạn", "tuần", "triệt", "tam phương", "đại hạn", "tiểu hạn"],
    title: "Hạn xấu/đẹp gặp Tuần–Triệt",
    source: SRC,
    requireAny: ["tuần", "triệt"],
    content:
      "Hạn 5 cung (tam phương tứ chính quanh hạn) đều xấu mà gặp Triệt ngay đó: có thể đỡ. " +
      "Hạn 5 cung đều đẹp gặp Tuần: mất vẻ đẹp. Chỉ khi báo cáo hạn + nhãn Tuần/Triệt trên đúng cung hạn.",
  },
  {
    id: "kn-han-luc-sat-bai",
    tags: [
      "hạn", "lục sát", "kình dương", "đà la", "không", "kiếp", "hỏa", "linh",
      "hao", "tang", "hổ", "khốc", "hư", "tuần", "triệt",
    ],
    title: "Hạn đẹp gặp Lục sát / Lục bại",
    source: SRC,
    requireAny: [
      "kình dương", "đà la", "địa không", "địa kiếp", "hỏa tinh", "linh tinh",
      "đại hao", "tiểu hao", "tang môn", "bạch hổ", "thiên khốc", "thiên hư",
    ],
    content:
      "Hạn trông đẹp mà ngộ Lục sát (Kình–Đà–Không–Kiếp–Linh–Hỏa) hoặc bại tinh (Hao–Tang–Hổ–Khốc–Hư…) " +
      "hãm thì lực tốt giảm nhiều. Tuần/Triệt cản sát hãm có thể đỡ; sát đắc mà bị Tuần/Triệt cản " +
      "lại có thể rất xấu. Kiểm đắc/hãm + sao lưu/gốc thật trên cung hạn trước khi báo hung.",
  },
  {
    id: "kn-nam-tuoi",
    tags: ["năm tuổi", "cung tuổi", "đại hạn", "tiểu hạn", "sinh", "hạn"],
    title: "Năm tuổi / hạn vào cung tuổi",
    source: SRC,
    content:
      "Năm tuổi không mặc định hung nếu nhiều sao tốt — đôi khi còn hoành đạt. " +
      "Đáng để ý khi đại/tiểu hạn đi vào đúng cung chi tuổi (cung sinh): xấu thì lủng củng hơn " +
      "năm xấu thường; tốt thì nhấn mạnh cơ hội. Chỉ áp khi đã biết chi năm sinh / cung tuổi từ lá.",
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
      "Xu hướng — CHỈ khi đủ sao trên cung hạn/lá: Tuế+Phá+Hóa Kỵ → miệng tiếng; Hồng+Kiếp → tình trắc; " +
      "Hao+Phá → tán tài; Cự+Kỵ → bực mình, đề phòng đường thủy; Mã+Triệt → ngã / đổi chỗ; " +
      "Tham+Song Hao → thất vọng tình–tiền; Quan Phù+Hình → quan tụng; Tuế+Quan Phù → khẩu thiệt. " +
      "Gặp Khoa/Giải/Phúc thì hạ mức. Thiếu sao → bỏ qua mẩu, không suy diễn.",
  },
  {
    id: "kn-han-xau-bo-sung",
    tags: [
      "hạn", "hỏa tinh", "linh tinh", "thiên việt", "trường sinh", "triệt", "hình",
      "đào hoa", "hồng loan", "cô thần", "quả tú", "lưu",
    ],
    title: "Thêm tổ hợp hạn xấu (rút)",
    source: SRC,
    content:
      "Chỉ khi đủ sao: Việt+Linh → đề phòng điện/lửa; Hỏa+Mộc Dục → nước nóng/dầu; " +
      "Trường Sinh+Triệt → công vụ trắc; Tướng+Phá+Ấn+Triệt → tiểu nhân/vu; Thai+Kiếp/Sát → thai nghén bất an; " +
      "Tang+Đào (phân cung Phụ/Mệnh) → rạn đôi lứa (cẩn trọng giọng hiện đại); Lộc/Mã đảo kỵ Tuế+Kiếp/Không. " +
      "Có Giải/Khoa/Phúc quý nhân thì giảm. Không đủ sao trên lá/hạn → không dùng.",
  },
  {
    id: "kn-luu-trung-phung",
    tags: [
      "lưu", "kình dương", "thiên khốc", "thiên hư", "đại hao", "tiểu hao",
      "thái tuế", "tang môn", "lộc tồn", "hạn",
    ],
    title: "Lưu trùng phùng (gốc + lưu cùng loại)",
    source: SRC,
    requireAny: ["kình dương", "lưu kình", "thiên khốc", "thiên hư", "đại hao", "lưu thái tuế"],
    content:
      "Khi lưu niên an trùng loại sao đã có gốc (vd 2 Kình, 2 Khốc–Hư, 2 Hao + Tuế/Tang): mức báo động tăng " +
      "— sách ví 'mã đội kiếm trùng phùng'. Chỉ nêu khi báo cáo lưu/sao lưu trên payload thật chồng lớp; " +
      "không tự nhân đôi sao.",
  },
  {
    id: "kn-menh-van-phuc",
    tags: ["mệnh", "vận", "hạn", "phúc", "tu dưỡng", "đại hạn"],
    title: "Mệnh × vận × phúc dày",
    source: SRC,
    content:
      "Mệnh tốt + vận tốt như cỏ gặp mưa. Vận/hạn xấu nhưng ăn ở phúc hậu có thể giảm một phần " +
      "(kinh nghiệm sách — không thay sao). Luận vẫn neo sao hạn thật; phần 'phúc' chỉ là giọng khuyên, không bịa cát tinh.",
  },

  // ===== NÂNG CẤP: LƯU / VẬN / TUẦN–TRIỆT / CÁCH CỤC (gate theo sao trên lá) =====
  {
    id: "kn-luu-khoi-viet-nam",
    tags: [
      "lưu khôi", "lưu việt", "thiên khôi", "thiên việt", "quý nhân", "lưu niên",
      "cơ hội", "thăng tiến", "thi cử",
    ],
    title: "Lưu Khôi / Lưu Việt năm xem",
    source: SRC,
    requireAny: ["lưu khôi", "lưu việt", "thiên khôi", "thiên việt"],
    content:
      "Khôi–Việt là quý nhân cơ hội/đề bạt. Lưu Khôi–Việt năm xem = cơ hội năm đó đậu đúng cung: " +
      "Quan → sếp/công danh/thi; Mệnh → được nâng; Tật → gặp thầy thuốc; Nô → bạn bè đỡ. " +
      "Chỉ luận khi payload có [SAO LƯU] Lưu Khôi/Việt (hoặc gốc Khôi–Việt nếu nói bẩm sinh). " +
      "Trùng gốc + lưu cùng cung thì nhấn mạnh; vô Lộc/Khoa thì cơ hội mỏng, đừng thổi 'đổi đời'.",
  },
  {
    id: "kn-sao-van-dai-han",
    tags: [
      "vận lộc", "vận khôi", "vận mã", "vận dương", "vận đà", "sao vận", "đại hạn",
      "vận hạn", "10 năm",
    ],
    title: "Sao Vận (đại hạn 10 năm)",
    source: SRC,
    requireAny: ["vận lộc", "vận khôi", "vận mã", "vận dương", "vận đà", "vận xương", "vận khúc"],
    content:
      "Sao Vận là khí đại hạn đậu cung — khác Lưu niên (1 năm). Vận Lộc/Mã → 10 năm nghiêng động–tài; " +
      "Vận Dương/Đà → rèn/trì hoãn; Vận Khôi–Việt → cơ hội dài hơi. Luận theo cung Vận đậu + chính tinh gốc " +
      "cung đó. Chỉ khi payload có [SAO VẬN]; không gọi nhầm 'vận hỷ dụng' Bát Tự thành sao Vận.",
  },
  {
    id: "kn-tuan-triet-khoa-hai-cung",
    tags: ["tuần", "triệt", "không vong", "khóa", "hai cung", "giảm lực", "mệnh", "tài", "quan"],
    title: "Tuần / Triệt — luôn khóa 2 cung",
    source: SRC,
    requireAny: ["tuần", "triệt", "không vong"],
    content:
      "Tuần và Triệt mỗi loại khóa ĐỦ HAI cung (không chỉ 1 nhãn engine). Luận phải nhắc cả cặp; " +
      "Không Vong thường là nửa khóa Triệt/Tuần. Giảm lực/chặn lộ ở cả hai cung — hạ giọng cách quý " +
      "khi khóa dính Mệnh/Thân/Tài/Quan. Chỉ dùng cung trong cheat sheet máy đã liệt; cấm bịa thêm cung.",
  },
  {
    id: "kn-sat-pha-tham-han",
    patternIds: ["sat-pha-tham", "sat-pha-tham-dc", "sat-pha", "pha-tham"],
    tags: [
      "thất sát", "phá quân", "tham lang", "sát phá tham", "hạn", "biến động", "mệnh", "quan lộc",
    ],
    title: "Sát Phá Tham trên hạn / Mệnh",
    source: SRC,
    requireAll: ["thất sát", "phá quân"],
    requireAny: ["tham lang"],
    content:
      "Bộ Sát–Phá–Tham: biến động, khai phá, thăng trầm mạnh. Hạn/đại hạn vào bộ này: đổi việc, đổi chỗ, " +
      "đầu tư mạo hiểm — có Lộc/Mã thì hướng động có lộc; có Kỵ/Không/Kiếp thì vỡ kế hoạch. " +
      "Chỉ khi tam phương/cung hạn thật đủ sao (iztro + báo cáo cách cục).",
  },
  {
    id: "kn-vo-chinh-muon-tinh",
    tags: ["vô chính diệu", "mệnh", "bàng tinh", "tam phương", "xung chiếu", "mượn tinh"],
    title: "Vô chính diệu — mượn tinh tam phương",
    source: SRC,
    content:
      "Mệnh vô chính diệu: lấy chính tinh xung chiếu + tam hợp làm 'chủ mượn', bàng tinh đồng cung làm " +
      "sắc thái. Không kết 'cô độc cả đời' chỉ vì VCD. Có Phủ/Tướng/Lộc hội thì vẫn thủ thành được; " +
      "toàn sát/Kỵ thì lao đao. Chỉ khi Mệnh thật không chính tinh trên payload.",
  },
  {
    id: "kn-loc-ma-giao-tri",
    tags: ["lộc tồn", "thiên mã", "hóa lộc", "lộc mã", "tài bạch", "thiên di", "xuất ngoại"],
    title: "Lộc Mã giao trì",
    source: SRC,
    requireAny: ["lộc tồn", "thiên mã", "hóa lộc", "lưu lộc", "lưu mã", "vận lộc", "vận mã"],
    content:
      "Lộc (Lộc Tồn/Hóa Lộc/Lưu–Vận Lộc) hội Mã: động mà sinh tài, hợp xa nhà/đa điểm. " +
      "Mã + sát/Kiếp/Không → chiết túc, bôn ba hao. Chỉ nêu khi Lộc và Mã (gốc hoặc lưu/vận) " +
      "thật đồng hội/tam phương trên lá — không gán 'xuất ngoại giàu' mù quáng.",
  },
  {
    id: "kn-hoa-ky-cung-trong",
    tags: ["hóa kỵ", "mệnh", "tài bạch", "quan lộc", "phu thê", "tật ách", "lưu hóa kỵ"],
    title: "Hóa Kỵ (gốc/lưu) vào cung trọng",
    source: SRC,
    requireAny: ["hóa kỵ", "lưu hóa kỵ"],
    content:
      "Kỵ vào Mệnh → chấp niệm/tâm lý; Tài → hao–siết chi; Quan → thị phi công việc; Phối → rạn tình; " +
      "Tật → lo sức khỏe. Lưu Kỵ năm = ải ngắn hạn đúng cung. Có Khoa/Giải/Phúc thì hạ mức. " +
      "Chỉ khi bảng Tứ Hóa/Lưu Hóa máy đã chỉ đúng sao–cung — không tự tra can bịa.",
  },
  {
    id: "kn-cu-ky-khau-thiet",
    tags: ["cự môn", "hóa kỵ", "khẩu thiệt", "thị phi", "nô bộc", "thiên di", "quan lộc"],
    title: "Cự Môn + Hóa Kỵ — khẩu thiệt",
    source: SRC,
    requireAll: ["cự môn"],
    requireAny: ["hóa kỵ", "lưu hóa kỵ"],
    content:
      "Cự Kỵ: miệng tiếng, cam kết miệng, hiểu lầm — lưu chứng từ, tránh nói quá. " +
      "Ở Nô/Di/Quan dễ thị phi đồng nghiệp/đối tác. Hướng nghề dùng miệng (luật, sale, content) " +
      "nếu có Khoa/Xương đỡ. Chỉ khi Cự thật + Kỵ thật trên lá/hạn.",
  },
  {
    id: "kn-thien-phu-thu-thanh",
    tags: ["thiên phủ", "thủ thành", "tài khố", "mệnh", "tài bạch", "ổn định"],
    title: "Thiên Phủ thủ thành",
    source: SRC,
    requireAny: ["thiên phủ"],
    content:
      "Phủ: tích lũy, tín nhiệm, ngại mạo hiểm quá mức. Hội Tướng/Lộc → quản–giữ của tốt; " +
      "gặp Phá/Sát/Không → bị đẩy ra sóng. Khuyên kỷ luật dòng tiền hơn 'đổ hết vốn'. " +
      "Chỉ khi Phủ thật trên cung đang luận.",
  },
  {
    id: "kn-nien-giai-hoa-giai",
    tags: ["niên giải", "giải thần", "hóa khoa", "hóa giải", "lưu niên", "tai ách"],
    title: "Niên Giải / Giải Thần năm",
    source: SRC,
    requireAny: ["niên giải", "giải thần", "hóa khoa"],
    content:
      "Niên Giải/Giải trên lưu: cửa hóa giải năm đó (gặp thầy, được gỡ, giảm hung). " +
      "Không xóa sạch sát — chỉ giảm mức. Hội Khoa càng đỡ. Chỉ khi sao Giải/Niên Giải/Hóa Khoa " +
      "thật có trên payload năm xem.",
  },

  // ===== CUNG ĐỜI SỐNG =====
  {
    id: "kn-tat-ach-tu-dung",
    tags: [
      "tật ách", "sức khỏe", "bệnh", "thất sát", "phá quân", "thiên không",
      "song hao", "tham lang", "trường sinh", "đại hao", "tiểu hao",
    ],
    title: "Tật Ách — tứ dũng tinh",
    source: SRC,
    content:
      "Tật Ách cần tứ dũng: Sát (giết bệnh), Phá (phá bệnh), Không (không bệnh), Hao (hao bệnh). " +
      "Tham ở Tật Ách dễ 'tham bệnh vào' — xấu trừ khi gặp bộ dũng chế. Trường Sinh không mặc định tốt: " +
      "gặp sao xấu có thể nuôi bệnh lâu. Chỉ liệt kê sao THỰC CÓ ở cung Tật trên lá.",
  },
  {
    id: "kn-trang-sinh-nuoi",
    tags: ["trường sinh", "tật ách", "hao", "khốc", "hư", "bệnh", "nuôi"],
    title: "Trường Sinh gặp sao xấu — nuôi bệnh/hao",
    source: SRC,
    requireAny: ["trường sinh"],
    content:
      "Trường Sinh gặp Khốc–Hư dễ 'nuôi' bệnh dai; gặp Hao dễ nuôi sự hao. Không khen Trường Sinh " +
      "mù quáng ở Tật/hạn xấu. Chỉ khi nhãn Trường Sinh (vòng trường sinh iztro) thật có + sao xấu kèm.",
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
      "Mệnh xấu mà Tử Tức tốt → về già có thể nhờ con; ngược lại dễ giảm phúc dòng dõi (xu hướng). " +
      "Cung Tử Sát–Phá–Tham + con cùng bộ thủ Mệnh = truyền tinh, sau dễ nhờ; Sát–Phá–Tham Tử + con Cơ–Nguyệt: kỵ nuôi. " +
      "Chỉ khi user hỏi con/tuổi và đã đọc đúng cung Tử + (nếu có) lá con — không bịa lá con.",
  },
  {
    id: "kn-tu-tuc-sao-xau",
    tags: [
      "tử tức", "cô thần", "quả tú", "thiên hình", "hóa kỵ", "đà la", "địa kiếp",
      "linh", "hỏa", "khốc", "hư", "bạch hổ", "lộc tồn", "con cái",
    ],
    title: "Sao xấu hay gặp ở Tử Tức",
    source: SRC,
    content:
      "Sách liệt kê sao xấu hay đóng Tử: Cô–Quả–Hình–Kỵ–Đà–Kiếp–Linh–Hỏa–Khốc–Hư–Hổ–Lộc Tồn (tùy cục). " +
      "Chỉ cảnh báo khi các sao này THỰC CÓ ở cung Tử trên lá; gặp Khoa/Giải/Phúc thì hạ giọng. " +
      "Không suy 'khó con' nếu cung Tử không có các sao đó.",
  },
  {
    id: "kn-menh-hung-13",
    tags: ["mệnh", "trẻ em", "sát tinh", "hung tinh", "13 tuổi", "hạn"],
    title: "Mệnh nhiều hung sát — sau 13 tuổi",
    source: SRC,
    requireAny: ["kình dương", "đà la", "thất sát", "phá quân", "hỏa tinh", "linh tinh"],
    content:
      "Trẻ Mệnh đầy hung sát mà qua ~13 tuổi thì thường 'quen' bộ sao đó, bớt lo tuyệt mệnh kiểu " +
      "cực đoan. Hạn về bản Mệnh ít khi là chỗ 'chết' theo kinh nghiệm sách. Chỉ khi Mệnh thật nhiều sát; " +
      "người đã trưởng thành: cảnh báo sức khỏe sớm, không gieo sợ.",
  },
  {
    id: "kn-phu-the-co-linh-hoa",
    tags: [
      "phu thê", "hôn nhân", "thiên cơ", "linh tinh", "hỏa tinh", "thiên tướng",
      "vợ lẽ", "gia đạo",
    ],
    title: "Cơ / Tướng + Linh Hỏa — gia đạo",
    source: SRC,
    requireAny: ["thiên cơ", "thiên tướng"],
    content:
      "Nữ Cơ thủ Mệnh gặp Linh–Hỏa: xu hướng rạn từ ghen tuông / đa mối (diễn đạt hiện đại, không khích lệ đa thê). " +
      "Thiên Tướng thủ Mệnh nữ gặp sát: ồn gia đạo; gặp Tử Vi đỡ. Chỉ khi Mệnh nữ + Cơ/Tướng + sát/Linh/Hỏa thật có.",
  },
  {
    id: "kn-phu-mau-luc-hop",
    tags: ["phụ mẫu", "cha mẹ", "lục hợp", "mệnh", "gia cảnh"],
    title: "Phụ mẫu / lục hợp gia cảnh",
    source: SRC,
    content:
      "Cung Phụ (và lục hợp liên quan) nhiều sao tốt: xu hướng nhờ cha mẹ / gia cảnh đỡ; xấu: nghèo, chia ly, " +
      "đau về gia cảnh. Chỉ đọc sao THỰC trên cung Phụ + quan hệ đã tính — không kết án chỉ vì một sát lẻ.",
  },
  {
    id: "kn-tuoi-gia",
    tags: [
      "tuổi già", "hậu vận", "tử vi", "thiên phủ", "trường sinh", "đế vượng",
      "hóa lộc", "đào hồng", "lộc tồn", "không", "tả", "hữu", "kiếp",
    ],
    title: "Hậu vận / tuổi già",
    source: SRC,
    content:
      "Già gặp Tử–Phủ–Trường Sinh–Đế Vượng–Hóa Lộc: đỡ. Đào–Hồng–Lộc Tồn–Thiên Không về già dễ tạp " +
      "(trừ Mệnh đã có sẵn từ trẻ). Tả–Hữu chủ trung vận, già giảm lực. Địa Kiếp–Không (gậy–bị): " +
      "sa sút — Hóa Khoa khả giải. Chỉ nêu sao/hạn hậu vận thật có trên lá khi user hỏi hậu vận/hưu trí.",
  },
  {
    id: "kn-bach-ho-dau",
    tags: ["bạch hổ", "dậu", "oai", "hình", "kình dương", "mệnh"],
    title: "Bạch Hổ đắc / hội",
    source: SRC,
    requireAny: ["bạch hổ"],
    content:
      "Hổ cư Dậu đắc, oai dũng; hội Hình/Kình tăng oai vệ; hội Tấu/văn tinh thiên về văn. " +
      "Chỉ khi Bạch Hổ (gốc hoặc lưu) thật có + chi/cung khớp — không gán oai khi Hổ hãm/vắng.",
  },

  // ===== NGHỀ / HƯỚNG =====
  {
    id: "kn-huong-nghe-mau",
    tags: [
      "quan lộc", "nghề", "sự nghiệp", "học hành", "vũ khúc", "thái dương",
      "văn xương", "văn khúc", "tham lang", "cự môn", "thiên lương",
    ],
    title: "Gợi hướng nghề theo tinh (kinh nghiệm, không mã ngành)",
    source: SRC,
    content:
      "Chỉ gợi HƯỚNG khi sao/cung Quan–Mệnh trên lá đủ: Dương/Lương–Xương–Khúc → học thuật, " +
      "y–luật–giáo–truyền thông; Vũ–Phủ → tài chính, quản tài, kỹ thuật; Cự–Cơ → biện luận, nội dung; " +
      "Tham–Hỏa/Linh → thương mại, giải trí; Sát–Phá → võ–quân–phẫu–xây–khủng hoảng. " +
      "Thiếu sao → không chỉ nghề. Không chắc một nghề duy nhất.",
  },
  {
    id: "kn-tinh-khi-thien-ac",
    tags: [
      "tính cách", "mệnh", "kình dương", "phá quân", "cự môn", "thiên phủ",
      "thiên tướng", "thiên đồng", "thiên lương", "thất sát", "tham lang",
    ],
    title: "Tính khí theo thiện/ác tinh (rút)",
    source: SRC,
    content:
      "Kình–Phá–Cự đắc: xu hướng cương, can. Phủ–Tướng–Đồng–Lương: hiền hậu — gặp Kiếp/Không dễ lệch tham. " +
      "Tham–Liêm–Phá ác; Sát–Kình–Đà hùng; Hỏa–Linh + Kiếp/Không họa chồng. Chỉ mô tả khi các sao " +
      "đắc/hãm trên Mệnh/Thân khớp lá — không gán tính cách ngoài sao.",
  },

  // ===== BỘ BÀNG TINH ĐẸP/XẤU =====
  {
    id: "kn-bo-dep-menh",
    tags: [
      "long trì", "phượng các", "bạch hổ", "hoa cái", "tả phù", "tả phụ", "hữu bật",
      "thiên khôi", "thiên việt", "hóa lộc", "hóa quyền", "hóa khoa", "cách đẹp",
    ],
    title: "Bộ bàng tinh đẹp ở Mệnh/Thân (rút)",
    source: SRC,
    content:
      "Xu hướng tốt khi ĐÓNG/CHIẾU Mệnh–Thân–Phúc và sao thật có: Tứ linh Long–Phượng–Hổ–Cái; " +
      "Tả–Hữu–Long–Phượng; Khôi–Khoa; Lộc hội Đào–Hồng–Tả–Hữu; Tử hội Khoa–Quyền–Lộc; " +
      "Cơ–Cự hội Song Hao đúng cung; Xương–Khúc đồng cung; Quyền–Sát; Tham–Đà (Dần quý). " +
      "Ngộ Tuần/Triệt giảm hay. Chỉ nêu 1–2 bộ KHỚP lá — cấm liệt kê bộ không có sao.",
  },
  {
    id: "kn-bo-dep-van-vu",
    tags: [
      "văn xương", "văn khúc", "tử vi", "thiên mã", "hóa quyền", "thất sát",
      "thiên cơ", "tham lang", "hóa khoa", "quan lộc", "học hành",
    ],
    title: "Vài cách văn–vũ (chỉ khi đủ sao)",
    source: SRC,
    content:
      "Chỉ khi đủ sao trên lá: Tuế+Xương–Khúc → thiên văn; Tử+Mã đồng cung → động đạt; " +
      "Quyền+Sát → vũ/quyền; Cơ+Quyền → quyền biến; Tham+Khoa → quyền biến; " +
      "Xương+Liêm / Khúc+Vũ → văn vũ toàn tài (xu hướng). Thiếu một sao trong cặp → bỏ mẩu.",
  },
  {
    id: "kn-giai-than-giam",
    tags: [
      "giải thần", "thiên giải", "địa giải", "hóa khoa", "phúc đức", "hạn xấu", "giảm",
    ],
    title: "Giải / Khoa / Phúc — giảm hạn xấu",
    source: SRC,
    requireAny: ["giải", "hóa khoa", "phúc"],
    content:
      "Các tổ hợp hạn/cung xấu giảm mức khi có Quan–Phúc quý nhân, Thiên/Địa Giải, Nguyệt Đức, " +
      "Phúc đức tinh, Hóa Khoa. Chỉ hạ mức báo động khi các sao giải THỰC CÓ trên lá/hạn — " +
      "không bịa 'có giải' để làm dịu.",
  },
  {
    id: "kn-luc-hop-han",
    tags: ["lục hợp", "hạn", "đại hạn", "tiểu hạn", "tháng", "cung"],
    title: "Lục hợp khi xem hạn",
    source: SRC,
    content:
      "Xem đại hạn / tiểu hạn / tháng cũng cần lục hợp cung đó (không chỉ cung hạn đứng). " +
      "Thiếu lục hợp dễ bỏ mất lực cát–hung phụ. Dùng quan hệ cung đã có trong báo cáo/chartRelations — " +
      "không nhẩm lục hợp sai chi.",
  },
  {
    id: "kn-loc-ma-tue",
    tags: ["lộc tồn", "thiên mã", "thái tuế", "địa kiếp", "địa không", "hạn", "bôn ba"],
    title: "Lộc–Mã kỵ Tuế / Kiếp–Không",
    source: SRC,
    requireAny: ["lộc tồn", "thiên mã"],
    content:
      "Lộc Tồn / Thiên Mã ngộ Thái Tuế hoặc Kiếp–Không: xu hướng không tốt (trở ngại động–lộc). " +
      "Chỉ khi các sao này cùng hội/hạn trên dữ liệu lưu hoặc gốc — không gán mặc định mọi năm.",
  },
  // —— P1: mẩu gắn master cách cục / gap logic ——
  {
    id: "kn-phu-tuong-on-dinh",
    patternIds: ["phu-tuong", "tu-phu", "tu-phu-dc", "tu-phu-vu-tuong"],
    tags: ["thiên phủ", "thiên tướng", "tử vi", "phủ tướng", "ổn định", "quản trị", "cách cục"],
    title: "Phủ Tướng / Tử Phủ — thủ thành không mạo hiểm",
    source: SRC,
    requireAny: ["thiên phủ", "thiên tướng", "tử vi"],
    content:
      "Phủ–Tướng / Tử–Phủ: xu hướng quản trị, thủ thành, uy tín tổ chức. Hạn/đại hạn vào bộ này " +
      "thường ổn định hơn Sát Phá Tham — ưu tiên chuyên sâu, ê-kíp, không đổ hết vốn vào tài sản rủi ro/đầu cơ (chứng khoán, coin, forex...). " +
      "Thiếu Tả Hữu/Xương Khúc: dễ cô quân. Chỉ khi máy/cách cục đã nhận hoặc sao đủ trên lá.",
  },
  {
    id: "kn-vu-tham-tai",
    patternIds: ["vu-tham", "vu-pha", "vu-sat"],
    tags: ["vũ khúc", "tham lang", "vũ tham", "tài bạch", "tiền", "cắt lỗ", "cách cục"],
    title: "Vũ Tham / Vũ Sát — tiền qua quyết đoán",
    source: SRC,
    requireAny: ["vũ khúc", "tham lang", "thất sát"],
    content:
      "Vũ hội Tham/Sát/Phá: dòng tiền gắn quyết đoán và biến động ngắn hạn theo tài sản rủi ro. Có Lộc/Mã thì động có lộc; " +
      "gặp Hao/Không/Kỵ thì dễ kiếm được–giữ kém. Luận tiền: bắt buộc nhắc quy tắc cắt lỗ / tách ví. " +
      "Chỉ khi tổ hợp sao thật (iztro + báo cáo cách cục).",
  },
  {
    id: "kn-cu-nhat-danh",
    patternIds: ["cu-nhat", "cu-nhat-dc", "dong-cu"],
    tags: ["cự môn", "thái dương", "cự nhật", "danh", "thị phi", "miệng", "cách cục"],
    title: "Cự Nhật / Đồng Cự — danh và miệng một kênh",
    source: SRC,
    requireAny: ["cự môn", "thái dương", "thiên đồng"],
    content:
      "Cự hội Nhật/Đồng: lời nói = tài sản + rủi ro (danh–thị phi). Dương/Cự hãm: dễ cháy danh; " +
      "đắc: hợp nghề miệng có chứng từ. Mọi cam kết lớn → văn bản. Chỉ khi sao khớp lá.",
  },
  {
    id: "kn-nhat-nguyet-can-bang",
    patternIds: ["am-duong-hoi", "nhat-luong"],
    tags: ["thái dương", "thái âm", "nhật nguyệt", "cân bằng", "danh", "tình cảm", "cách cục"],
    title: "Nhật–Nguyệt hội — nhịp danh và cảm",
    source: SRC,
    requireAny: ["thái dương", "thái âm"],
    content:
      "Nhật–Nguyệt hội tam phương: cần cân bằng việc/danh và nhà/cảm. Một bên hãm + Kỵ: lệch sóng " +
      "tình–danh. Không kết 'ly hôn/thất bại' tuyệt đối; nói xu hướng và điều kiện. Sao thật trên lá.",
  },
  {
    id: "kn-liem-tuong-ky-luat",
    patternIds: ["liem-tuong", "liem-tuong-dc", "liem-sat"],
    tags: ["liêm trinh", "thiên tướng", "thất sát", "kỷ luật", "pháp độ", "cách cục"],
    title: "Liêm Tướng / Liêm Sát — pháp độ và van nóng",
    source: SRC,
    requireAny: ["liêm trinh", "thiên tướng", "thất sát"],
    content:
      "Liêm hội Tướng: kỷ luật–ấn tín; Liêm hội Sát: dứt khoát–hung túc. Liêm hãm: cứng/độc đoán. " +
      "Khuyên: quyết nóng + 24h nguội; nghề tuân thủ/quản trị hợp tạng. Chỉ khi tổ hợp có trên lá.",
  },
  {
    id: "kn-tu-phu-vu-tuong-toan",
    patternIds: ["tu-phu-vu-tuong"],
    tags: ["tử vi", "thiên phủ", "vũ khúc", "thiên tướng", "tử phủ vũ tướng", "quyền uy", "cách cục"],
    title: "Tử Phủ Vũ Tướng — đế khố tài ấn hội đủ",
    source: SRC,
    requireAll: ["tử vi", "thiên phủ"],
    requireAny: ["vũ khúc", "thiên tướng"],
    content:
      "Bốn sao hội đủ một khối: đế–khố–tài–ấn — xu hướng uy quyền quản trị, thủ thành có lực; hội thêm Tả/Hữu/Xương/Khúc mới “đủ triều”. " +
      "Thiếu phụ tá: uy hẹp, dễ ôm việc. Chỉ luận khi máy đã nhận đủ bốn sao trong tam phương; thiếu thì hạ về Tử Phủ / Phủ Tướng đúng như máy.",
  },
  {
    id: "kn-vu-tuong-vo-nghiep",
    patternIds: ["vu-tuong", "vu-tuong-dc"],
    tags: ["vũ khúc", "thiên tướng", "vũ tướng", "kỷ luật", "võ nghiệp", "cách cục"],
    title: "Vũ Tướng — quyết đoán trong khuôn khổ",
    source: SRC,
    requireAll: ["vũ khúc", "thiên tướng"],
    content:
      "Vũ–Tướng: quyết đoán tài chính đi với ấn khuôn khổ; nhóm Vũ đắc địa xu hướng bền hơn Sát Phá Liêm Tham gặp hung sát. " +
      "Đời nay đọc là nghề kỷ luật cao (quân–cảnh, an ninh, điều hành, tài chính có quy trình); hãm: công danh nhỏ, thăng giáng — đi chuyên môn hẹp. " +
      "Chỉ nêu “võ” khi lá nghiêng quân–cảnh; còn lại luận kỷ luật–điều hành.",
  },
  {
    id: "kn-co-cu-dong",
    patternIds: ["co-cu", "co-cu-dc"],
    tags: ["thiên cơ", "cự môn", "cơ cự", "đa hứng thú", "gia đạo", "cách cục"],
    title: "Cơ Cự — cơ động, miệng là điểm nóng",
    source: SRC,
    requireAll: ["thiên cơ", "cự môn"],
    content:
      "Cơ–Cự (Mão/Dậu): động, đa hứng thú, đổi hướng nhanh, thiếu kiên trì; rất kỵ Hỏa/Linh (nóng vội + thị phi). " +
      "Gia đạo: bất hòa thường ở miệng lưỡi — nói xu hướng + bước đệm, không kết ly tán. " +
      "Luận: một mũi nhọn nghề, cam kết có chữ. Chỉ khi hai sao thật đồng cung/hội trên lá.",
  },

  // ===== PHÚ/CÁCH CỔ + TỔ HỢP HẠN (bổ sung từ chương cách + chương hạn của cùng nguồn) =====
  // Trích nguyên văn các mục đánh số (cách 40–48, hạn 40–65) trong
  // src/knowledge/data/so-tu-vi-kinh-nghiem-quyen-ha.txt. Needle chọn lọc tránh
  // 1 âm tiết dễ khớp nhầm (vd "tử" sẽ khớp "tử vi" — dùng "tuyệt" thay thế).
  {
    id: "kn-cach-van-vu-toan-tai",
    tags: ["văn xương", "văn khúc", "liêm trinh", "vũ khúc", "văn vũ", "cách cục"],
    title: "Văn vũ toàn tài (Xương–Liêm / Khúc–Vũ)",
    source: SRC,
    requireAll: ["liêm trinh"],
    requireAny: ["văn xương", "văn khúc"],
    content:
      "Phú cách: Văn vũ toàn tài — Xương với Liêm, Khúc với Vũ (đồng cung hoặc hội tam phương). " +
      "Cách thượng: văn kiêm võ, danh thực song toàn. CHỈ nêu khi cặp thật sự có trên lá: Xương+Liêm, " +
      "hoặc Khúc+Vũ; chỉ có Xương hoặc Khúc đơn lẻ thì không nêu.",
  },
  {
    id: "kn-cach-tham-trang-sinh",
    tags: ["tham lang", "trường sinh", "thọ", "cách cục"],
    title: "Tham ngộ Trường Sinh (thọ)",
    source: SRC,
    requireAll: ["tham lang", "trường sinh"],
    content:
      "Phú cách: Tham ngộ Trường Sinh — chủ THỌ. Tham Lang vốn đa dục đa cầu, gặp vòng Trường Sinh " +
      "thì sức sống bền, tiêu hóa tốt, sống lâu. Lưu ý: chỉ nêu khi nhãn Trường Sinh (vòng iztro) thật " +
      "có cùng/hội Tham Lang; càng đẹp khi Tham có hóa cát.",
  },
  {
    id: "kn-cach-nhat-xuat-phu-tang",
    tags: ["thái dương", "tang môn", "thượng cách", "cách cục"],
    title: "Nhật xuất phù Tang (Dương Mão gặp Tang)",
    source: SRC,
    requireAll: ["thái dương", "tang môn"],
    content:
      "Phú cách: Nhật xuất phù Tang — Thái Dương cư Mão (bình minh) gặp Tang Môn: THƯỢNG CÁCH. " +
      "Tang vốn là tinh tang thương, nhưng Mão là cổng mặt trời mọc: tang sẽ đi (tân tang cũng hóa " +
      "thường), chủ phát đạt nhanh như mặt trời lên. Chỉ khi Dương thật ở Mão/Dần kèm Tang; Dương hãm " +
      "gặp Tang thì luận ngược lại.",
  },
  {
    id: "kn-cach-oai-quyen",
    tags: ["hóa quyền", "thất sát", "phá quân", "kình dương", "hỏa tinh", "linh tinh", "địa không", "địa kiếp", "oai quyền", "cách cục"],
    title: "Bộ Oai quyền — Quyền gặp Sát/Không (Kiếp-Không Tỵ-Hợi, Tử-Phá-Kình-Đà, Linh Hỏa phùng Tham)",
    source: SRC,
    requireAll: ["hóa quyền"],
    requireAny: ["địa kiếp", "địa không", "hỏa tinh", "linh tinh", "kình dương", "thất sát", "phá quân", "tham lang"],
    content:
      "Phú cách nhóm OAI QUYỀN: Kiếp/Khống ở Tỵ-Hợi ngộ Quyền — oai dũng; Tử-Phá-Kình-Đà — oai quyền; " +
      "Linh Hỏa phùng Tham — oai quyền. Quyền cần sát/không mới thành uy (quyền không sát là quyền " +
      "trên giấy). CHỈ nêu khi Hóa Quyền thật cùng/chiếu đúng bộ kể trên; gặp thêm Kỵ/hãm thì bớt mức.",
  },
  {
    id: "kn-han-tuong-tuyet",
    tags: ["tướng tinh", "tuyệt", "xuất ngoại", "hạn"],
    title: "Tướng Quân ngộ Tuyệt — xuất ngoại bất lợi",
    source: SRC,
    requireAll: ["tướng tinh", "tuyệt"],
    content:
      "Hạn: Tướng Quân ngộ Tử/Tuyệt — xuất ngoại bất lợi. Tướng vốn oai phong, chạm vòng Suy-Tuyệt thì " +
      "uy lực cụt: năm/chặng đó hạn chế ký hợp đồng xa, khởi sự mới ở xa; ưu tiên củng cố nội địa. " +
      "Chỉ khi nhãn Tướng Tinh thật có cùng cung/trục với Tuyệt (vòng iztro).",
  },
  {
    id: "kn-han-quan-phu-hinh",
    tags: ["quan phù", "quan phủ", "thiên hình", "quan tụng", "hạn"],
    title: "Quan Phù ngộ Thiên Hình — đề phòng quan tụng",
    source: SRC,
    requireAll: ["thiên hình"],
    requireAny: ["quan phù", "quan phủ"],
    content:
      "Hạn: Quan Phù (tuế tiền) hay Quan Phủ (boshi) ngộ Thiên Hình — ĐỀ PHÒNG QUAN TỤNG. Hai tinh " +
      "giấy-tưởng-án gặp hình khí: năm đó cẩn trọng hợp đồng, chữ ký, quy định; tranh chấp nhỏ dễ thành " +
      "án. Có Khoa/Giải Thần hội thì giảm thành thủ tục phiền. Chỉ khi 2 tinh thật có cùng trục lá/hạn.",
  },
  {
    id: "kn-han-tue-hinh",
    tags: ["thái tuế", "tuế kiện", "tuế kiến", "thiên hình", "quan phi", "khẩu thiệt", "hạn"],
    title: "Tuế ngộ Thiên Hình — quan phi khẩu thiệt",
    source: SRC,
    requireAll: ["thiên hình"],
    requireAny: ["thái tuế", "tuế kiện", "tuế kiến"],
    content:
      "Hạn: Tuế (Thái Tuế/Tuế Kiến) ngộ Thiên Hình — QUAN PHI KHẨU THIỆT. Thái Tuế chủ năm, Hình chủ " +
      "hình pháp: năm đó dễ va luật lệ, thị phi miệng tiếng, tranh chấp nhỏ. Ứng xử: tránh cãi vã, " +
      "đi đứng theo khung pháp lý. Giảm khi có Khoa/Giải/Nguyệt Đức hội. Chỉ khi thật có cùng trục.",
  },
  {
    id: "kn-han-tue-da",
    tags: ["thái tuế", "đà la", "bực mình", "hạn"],
    title: "Thái Tuế ngộ Đà La — nhiều chuyện bực mình",
    source: SRC,
    requireAll: ["thái tuế", "đà la"],
    content:
      "Hạn: Thái Tuế ngộ Đà La — NHIỀU CHUYỆN BỰC MÌNH. Đà la kéo chậm, Thái Tuế muốn nhanh: năm đó " +
      "việc gì cũng dây dưa, giấy tờ chậm, người khác làm mình khó chịu. Không phải đại hung — chủ " +
      "phiền muộn hơn là tổn thất. Chỉ khi Tuế (gốc/lưu) thật cùng trục Đà (gốc/lưu).",
  },
  {
    id: "kn-han-kinh-da-ma",
    tags: ["kình dương", "đà la", "thiên mã", "bôn ba", "hạn"],
    title: "Kình/Đà ngộ Mã — bôn ba hoán cải",
    source: SRC,
    requireAll: ["thiên mã"],
    requireAny: ["kình dương", "đà la"],
    content:
      "Hạn: Kình hoặc Đà ngộ Thiên Mã — BÔN BA, HOÁN CẢI. Mã gặp sát thì động mạnh: đi lại gấp gáp, " +
      "đổi việc/đổi nơi, xông pha xa; có Lộc đi kèm thì động mà có lãi, thiếu Lộc là mệt vì đường. " +
      "Chỉ khi Mã thật cùng tam phương với Kình/Đà trong hạn/năm xem.",
  },
  {
    id: "kn-han-am-duong-kinh-ky",
    tags: ["thái dương", "thái âm", "kình dương", "hóa kỵ", "đau mắt", "hạn"],
    title: "Âm/Dương ngộ Kình, Kỵ — hạn đau mắt, phụ mẫu bất an",
    source: SRC,
    requireAll: ["thái dương"],
    requireAny: ["kình dương", "hóa kỵ"],
    content:
      "Hạn: Âm/Dương ngộ Kình hoặc Hóa Kỵ — HẠN ĐAU MẮT, PHỤ MẪU BẤT AN. Nhật nguyệt chủ mắt và cha " +
      "mẹ; gặp sát kỵ thì năm đó chú ý mắt (mỏi, viêm) và sức khỏe/bận lòng của cha mẹ. Dương kỵ nặng " +
      "hơn cho cha, Âm kỵ nặng hơn cho mẹ. Chỉ khi Nhật/Nguyệt thật có cùng trục Kình/Kỵ trong hạn.",
  },
  {
    id: "kn-han-tham-song-hao",
    tags: ["tham lang", "đại hao", "tiểu hao", "tình duyên", "tiền bạc", "hạn"],
    title: "Tham ngộ Song Hao — thất vọng tình duyên, ai oán tiền bạc",
    source: SRC,
    requireAll: ["tham lang"],
    requireAny: ["đại hao", "tiểu hao"],
    content:
      "Hạn: Tham Lang ngộ Song Hao (Đại/Tiểu Hao) — THẤT VỌNG VỀ TÌNH DUYÊN, AI OÁN VỀ TIỀN BẠC. Tham " +
      "nhiều muốn, Hao hao mòn: kỳ vọng cảm xúc chát, tiền kỳ vọng vào hụt. Khác mẩu Song Hao cách " +
      "(khen khi đúng cách): mẩu này cảnh báo khi Tham là chủ trong hạn. Chỉ khi Tham + Hao thật cùng trục.",
  },
  {
    id: "kn-han-tang-khong-khoc",
    tags: ["tang môn", "địa không", "thiên khốc", "hoán cải", "tán tài", "hạn"],
    title: "Tang ngộ Không, Khốc — hoán cải, tán tài",
    source: SRC,
    requireAll: ["tang môn"],
    requireAny: ["địa không", "thiên khốc"],
    content:
      "Hạn: Tang Môn ngộ Không hoặc Khốc — HẠN THAY ĐỔI HOÁN CẢI, TÁN TÀI. Tang + Khốc = tang thương " +
      "đen; thêm Không thì kèm xuất vốn, thay đổi lớn (đổi việc, chuyển nhà, chia tay). Khuyên: năm đó " +
      "giữ tiền, chớ đầu tư lớn; lo tang sự gia tộc nếu có tin buồn. Chỉ khi Tang thật cùng trục Khốc/Không.",
  },
  {
    id: "kn-han-linh-sat-phat",
    tags: ["linh tinh", "thất sát", "phá quân", "quan phi", "khẩu thiệt", "hạn"],
    title: "Linh phùng Sát Phá — quan phi khẩu thiệt",
    source: SRC,
    requireAll: ["linh tinh"],
    requireAny: ["thất sát", "phá quân"],
    content:
      "Hạn: Linh Tinh phùng Sát/Phá — QUAN PHI KHẨU THIỆT. Linh âm hỏa nấp sau lưng, Sát-Phá dám làm: " +
      "năm đó dễ va chạm quyền uy, bị chèn, thị phi leo thang thành chuyện cơ quan. Ứng xử: đừng đánh " +
      "bài ngược, giữ chứng từ. Chỉ khi Linh thật cùng trục Sát/Phá trong hạn.",
  },

  // ===== BỔ SUNG LỄCH 100 MẨU (cách cổ 1–39 + hạn 1–39 của cùng nguồn) =====
  // Chọn lọc từ các mục đánh số 1–39 chưa biên; needle tránh 1 âm tiết dễ khớp nhầm.
  {
    id: "kn-cach-tu-linh",
    tags: ["long trì", "phụng các", "phượng các", "hoa cái", "bạch hổ", "bệ vệ", "cách cục"],
    title: "Tứ Linh (Long, Phượng, Hổ, Cái) — bệ vệ",
    source: SRC,
    requireAny: ["long trì", "phụng các", "phượng các", "hoa cái", "bạch hổ"],
    content:
      "Cách cổ: Tứ Linh — Long Trì, Phượng Các, Bạch Hổ, Hoa Cái hội tụ thì BỆ VỆ (dung mạo, phong thái " +
      "khác người, được kính nể). Thực dụng: cần ≥3 trong 4 trên lá/tam phương mới nêu; đủ 2 thì chỉ " +
      "ghi 'khí phách khá hơn người'. Chỉ khi các sao thật có trên lá.",
  },
  {
    id: "kn-cach-thanh-long-hoa-ky",
    tags: ["thanh long", "hóa kỵ", "bệ vệ", "cách cục"],
    title: "Thanh Long ngộ Hóa Kỵ — bệ vệ",
    source: SRC,
    requireAll: ["thanh long", "hóa kỵ"],
    content:
      "Cách cổ: Thanh Long ngộ Hóa Kỵ — vẫn BỆ VỆ. Kỵ làm Thanh Long thành 'rồng gặp mây mù': uy danh " +
      "có nhưng kèm rắc rối giấy tờ; quyền lực đi cùng phiền phức. Luận kèm miếu/hãm và cung; chỉ khi " +
      "2 yếu tố thật có cùng trục.",
  },
  {
    id: "kn-cach-bach-ho-phi-liem",
    tags: ["bạch hổ", "phi liêm", "oai dũng", "cách cục"],
    title: "Bạch Hổ ngộ Phi Liêm — oai dũng",
    source: SRC,
    requireAll: ["bạch hổ", "phi liêm"],
    content:
      "Cách cổ: Bạch Hổ ngộ Phi Liêm — OAI DŨNG. Hổ cầm binh, Phi Liêm như tên lửa: quyết liệt, chấp " +
      "pháp, hợp nghề quân/cảnh sát/thi hành án. Kỵ nhất cùng Kỵ-hình thì oai biến hung. Chỉ khi 2 sao " +
      "thật có cùng cung/trục (Hổ ở vòng Tuế Tiền cũng kể).",
  },
  {
    id: "kn-cach-bach-ho-tau-thu",
    tags: ["bạch hổ", "tấu thư", "văn chương", "cách cục"],
    title: "Bạch Hổ, Tấu Thư (Hổ đội hùm sắc) — văn chương",
    source: SRC,
    requireAll: ["bạch hổ", "tấu thư"],
    content:
      "Cách cổ: Bạch Hổ, Tấu Thư — 'Hổ đội hùm sắc' chủ VĂN CHƯƠNG. Hổ oai + Tấu thư văn tự: viết sắc " +
      "lệnh, giọng văn có lực, hợp nghề pháp lý/văn thư quyền hành. Chỉ khi 2 sao thật có cùng trục " +
      "(Tấu Thư boshi, Hổ tuế tiền đều kể).",
  },
  {
    id: "kn-cach-ma-trang-sinh",
    tags: ["thiên mã", "trường sinh", "phong lưu", "cách cục"],
    title: "Mã ngộ Trường Sinh — phong lưu",
    source: SRC,
    requireAll: ["thiên mã", "trường sinh"],
    content:
      "Cách cổ: Mã ngộ Trường Sinh — PHONG LƯU. Mã động + Sinh là sức sống bền: bôn ba mà không kiệt, " +
      "du lịch giao du rộng. Khác mẩu Tân Biên 'Dần/Thân/Tỵ Mã + Sinh chóng thành tựu': mẩu này nhấn " +
      "sắc phong lưu. Chỉ khi Mã thật cùng/hội nhãn Trường Sinh (vòng iztro).",
  },
  {
    id: "kn-cach-quan-than-khanh-hoi",
    tags: ["tử vi", "tả phù", "hữu bật", "long trì", "phượng các", "quý cách", "cách cục"],
    title: "Quần thần khánh hội (Tử Vi phùng Tả, Hữu, Long, Phượng) — quý cách",
    source: SRC,
    requireAll: ["tử vi"],
    requireAny: ["tả phù", "hữu bật"],
    content:
      "Cách cổ: Quần thần khánh hội — Tử Vi được Tả/Hữu (và thêm Long Trì, Phượng Các) phò tá: QUÝ CÁCH. " +
      "Vua có bề tôi: lãnh đạo được người, phúc quý. Đẹp nhất khi cả 4 trợ tinh hội; đủ Tả-Hữu đã đủ " +
      "nêu, Long-Phượng thêm thì thượng cách. Chỉ khi Tử Vi thật có cùng các sao đó.",
  },
  {
    id: "kn-cach-tu-ma-nhat-ban",
    tags: ["tử vi", "thiên mã", "thượng cách", "cách cục"],
    title: "Tử, Mã nhất ban (Tử Vi, Thiên Mã đồng cung) — thượng cách",
    source: SRC,
    requireAll: ["tử vi", "thiên mã"],
    content:
      "Cách cổ: Tử Mã nhất ban — Tử Vi đồng cung Thiên Mã: THƯỢNG CÁCH. Đế tinh cưỡi ngựa: quý mà động, " +
      "danh vọng theo sự dịch chuyển (nghề nhiều đi lại, kinh doanh xa). Đế tinh cần phụ tá kèm, nếu " +
      "không thành 'vua đi bộ'. Chỉ khi 2 sao thật đồng cung trên lá.",
  },
  {
    id: "kn-cach-khoi-khoa",
    tags: ["thiên khôi", "hóa khoa", "văn cách", "cách cục"],
    title: "Khôi, Khoa cách — văn cách",
    source: SRC,
    requireAll: ["thiên khôi", "hóa khoa"],
    content:
      "Cách cổ: Khôi, Khoa cách — sao quý và sao danh gặp nhau: VĂN CÁCH. Học hành thi cử thuận, được " +
      "người trên trọng; đẹp nhất thủ Mệnh/Quan, mãi đến trung vận vẫn phát. Chỉ khi Khôi thật có cùng " +
      "trục Hóa Khoa (bẩm sinh hoặc vận hạn).",
  },
  {
    id: "kn-cach-co-quyen",
    tags: ["thiên cơ", "hóa quyền", "quyền biến", "cách cục"],
    title: "Cơ, Quyền cách — quyền biến",
    source: SRC,
    requireAll: ["thiên cơ", "hóa quyền"],
    content:
      "Cách cổ: Cơ, Quyền cách — QUYỀN BIẾN. Cơ là mưu lược, Quyền là thực quyền: mưu kế có chỗ phát — " +
      "quyền biến trong kinh doanh, đàm phán, kế hoạch. Kỵ nhất gặp Kỵ/sát dày: biến thành xảo trá. " +
      "Chỉ khi Cơ thật cùng trục Hóa Quyền.",
  },
  {
    id: "kn-cach-tham-khoa",
    tags: ["tham lang", "hóa khoa", "quyền biến", "cách cục"],
    title: "Tham, Khoa cách — quyền biến",
    source: SRC,
    requireAll: ["tham lang", "hóa khoa"],
    content:
      "Cách cổ: Tham, Khoa cách — QUYỀN BIẾN. Tham đa nghệ + Khoa danh dự: tài năng nhiều mặt được ghi " +
      "nhận — hợp nghề giao tiếp, giải trí, kinh doanh đa ngành. Kỵ nhất Kỵ/sát dày: danh vì thị phi. " +
      "Chỉ khi Tham thật cùng trục Hóa Khoa.",
  },
  {
    id: "kn-cach-tham-da",
    tags: ["tham lang", "đà la", "phong lưu", "cách cục"],
    title: "Tham, Đà cách — phong lưu (cư Dần tối quý)",
    source: SRC,
    requireAll: ["tham lang", "đà la"],
    content:
      "Cách cổ: Tham, Đà cách — PHONG LƯU; cư Dần thì TỐI QUÝ. Tham dục vọng + Đà bền bỉ: đam mê sâu, " +
      "nghiệp dài — tại Dần thành cách quý (phát về chuyên môn/kinh doanh lớn), cung khác chủ sắc tài " +
      "phong lưu. Chỉ khi 2 sao thật đồng cung; kiểm chi trước khi phán.",
  },
  {
    id: "kn-han-hinh-hao-kiep-sat",
    tags: ["thiên hình", "đại hao", "tiểu hao", "kiếp sát", "hao tán", "hạn"],
    title: "Hình, Hao ngộ Kiếp, Sát — hao tán, ốm đau",
    source: SRC,
    requireAll: ["kiếp sát"],
    requireAny: ["thiên hình", "đại hao", "tiểu hao"],
    content:
      "Hạn: Hình hoặc Hao ngộ Kiếp/Sát — HAO TÁN, ỐM ĐAU. Kiếp Sát cướp + hình hao mòn: năm đó tiền vào " +
      "ít ra nhiều, sức khỏe xuống, tiểu phẫu có thể. Khuyên: giữ tiền, khám định kỳ. Chỉ khi Kiếp Sát " +
      "thật cùng trục Hình/Hao trong hạn.",
  },
  {
    id: "kn-han-tue-pha-hoa-ky",
    tags: ["thái tuế", "phá quân", "hóa kỵ", "miệng tiếng", "hạn"],
    title: "Tuế, Phá, Hóa Kỵ — miệng tiếng, cãi nhau",
    source: SRC,
    requireAll: ["hóa kỵ", "phá quân"],
    requireAny: ["thái tuế", "tuế kiện", "tuế kiến"],
    content:
      "Hạn: Tuế + Phá + Hóa Kỵ hội — MIỆNG TIẾNG, CÃI NHAU. Phá làm vỡ, Kỵ làm ám, Tuế phơi ra: năm đó " +
      "dễ cãi vã, hợp đồng rách, tin xấu lan. Ứng xử: nói ít làm nhiều, tránh đứng ra kiện tụng. Chỉ " +
      "khi cả 3 yếu tố thật có trên trục hạn/năm.",
  },
  {
    id: "kn-han-trang-sinh-triet",
    tags: ["trường sinh", "triệt lộ", "triệt không", "công vụ", "hạn"],
    title: "Tràng Sinh ngộ Triệt — công vụ trắc trở",
    source: SRC,
    requireAll: ["trường sinh"],
    requireAny: ["triệt lộ", "triệt không"],
    content:
      "Hạn: Trường Sinh ngộ Triệt — CÔNG VỤ TRẮC TRỞ. Sinh là mầm mới, Triệt chặn đường: việc mới nổ ra " +
      "bị chặn giấy tờ, dự án khởi sự lùi. Khuyên: hoãn khởi sự mới, hoàn thiện cái đang dở. Chỉ khi " +
      "nhãn Trường Sinh thật ở cung/trục bị Triệt án ngữ trong hạn.",
  },
  {
    id: "kn-han-thai-kiep-sat",
    tags: ["thai", "kiếp sát", "thai nghén", "hạn"],
    title: "Thai ngộ Kiếp, Sát — khó đẻ, thai nghén bất an",
    source: SRC,
    requireAll: ["thai", "kiếp sát"],
    content:
      "Hạn: Thai ngộ Kiếp/Sát — KHÓ ĐẺ, THAI NGHIÉN BẤT AN. Thai chủ sinh nở, Kiếp-Sát cướp phá: trong " +
      "gia đình năm đó lo thai sản — khám thai đều, chọn bác sĩ tin được; dự án 'sinh sản' (ra mắt sản " +
      "phẩm mới) cũng dễ trắc trở. Chỉ khi nhãn Thai thật cùng trục Kiếp/Sát.",
  },
  {
    id: "kn-han-hao-tuyet",
    tags: ["đại hao", "tiểu hao", "tuyệt", "phá sản", "hạn"],
    title: "Hao ngộ Tuyệt — đại phá sản",
    source: SRC,
    requireAll: ["tuyệt"],
    requireAny: ["đại hao", "tiểu hao"],
    content:
      "Hạn: Hao ngộ Tuyệt — ĐẠI PHÁ SẢN (mức cảnh báo cao nhất nhóm Hao). Hao mòn + Tuyệt cạn kiệt: " +
      "năm đó tuyệt đối tránh vay nợ lớn, bảo lãnh, đầu tư đòn bẩy; cắt chi, giữ tiền mặt. Chỉ khi " +
      "nhãn Tuyệt thật cùng trục Hao (gốc hoặc lưu) — nêu đúng mức, không hù dọa.",
  },
  {
    id: "kn-han-tu-vi-dia-kiep",
    tags: ["tử vi", "địa kiếp", "ốm đau", "mắc lừa", "hạn"],
    title: "Tử Vi ngộ Địa Kiếp — ốm đau, mắc lừa",
    source: SRC,
    requireAll: ["tử vi", "địa kiếp"],
    content:
      "Hạn: Tử Vi ngộ Địa Kiếp — ỐM ĐAU, MẮC LỪA. Đế tinh gặp cướp tinh: quý nhân bị kẻ dưới lừa, dự " +
      "án bị 'đào móng'; sức khỏe chủ quan yếu đi. Khuyên: soát kỹ đối tác, chớ tin lời ngọt; đề " +
      "phòng bệnh âm thầm. Chỉ khi Tử Vi thật cùng trục Địa Kiếp trong hạn.",
  },
  {
    id: "kn-han-thien-phu-tam-khong",
    tags: ["thiên phủ", "tuần không", "triệt lộ", "địa không", "hao tán", "hạn"],
    title: "Thiên Phủ ngộ Tam Không — hao tán",
    source: SRC,
    requireAll: ["thiên phủ"],
    requireAny: ["tuần không", "triệt lộ", "địa không"],
    content:
      "Hạn: Thiên Phủ ngộ Tam Không — HAO TÁN. Phủ là kho, Không-Kiếp mở nắp kho: của tích lũy dễ rút " +
      "ra vì việc lớn (nhà cửa, tang gia, giúp họ hàng). Không phải hà tất xấu — nhưng phải là 'chi có " +
      "kế hoạch'. Chỉ khi Phủ thật cùng trục Tuần/Triệt/Không trong hạn.",
  },
  {
    id: "kn-han-kinh-da-khong-kiep",
    tags: ["kình dương", "đà la", "địa không", "địa kiếp", "tán tài", "tang thương", "hạn"],
    title: "Kình, Đà, Không, Kiếp — tán tài, tang thương",
    source: SRC,
    requireAll: ["kình dương"],
    requireAny: ["đà la", "địa không", "địa kiếp"],
    content:
      "Hạn: Kình hội thêm Đà/Không/Kiếp — TÁN TÀI, TANG THƯƠNG. Bộ sát dày trong hạn: va chạm, tiền hao " +
      "vì sự bất ngờ; gia đạo có tin buồn. Khuyên: năm đó lái xe chậm, tránh nóng giận, giữ hòa khí. " +
      "Mức nặng tùy số sao thật hội; đủ 4 thì cảnh báo cao nhất.",
  },

  // ===== 5 BỘ SAO — HỆ QUY TẮC TOÀN CỤC (Quản Xuân Thịnh, cuối chương 1) =====
  // Quy tắc HỆ THỐNG (không phải combo lẻ): bộ sao nào cần Hóa gì, kỵ gì.
  // Gate neo theo Hóa/yếu tố kỵ để mẩu chỉ hiện khi điều kiện phát huy/cản trở thật có.
  {
    id: "kn-bo-sat-pha-tham-liem",
    tags: ["thất sát", "phá quân", "tham lang", "liêm trinh", "hóa khoa", "bộ sao", "cách cục"],
    title: "Bộ Sát–Phá–Tham–Liêm: tối cần Hóa Khoa",
    source: SRC,
    requireAll: ["hóa khoa"],
    requireAny: ["thất sát", "phá quân", "tham lang", "liêm trinh"],
    content:
      "Hệ quy tắc Quản Xuân Thịnh: BỘ Sát–Phá–Tham–Liêm TỐI CẦN HÓA KHOA. Bộ dám làm, liều lĩnh; Khoa " +
      "là danh dự và đốn lại: có Khoa thì liều mà thành danh, thiếu Khoa dễ liều mà gãy. Lá này có Khoa " +
      "→ nhấn 'liều có đốn'; nếu lá KHÔNG có Khoa mà bộ này dày → khuyên bớt liều, tìm Khoa (học, bằng " +
      "cấp, danh chính) trước khi mở rộng.",
  },
  {
    id: "kn-bo-co-nguyet-dong-luong",
    tags: ["thiên cơ", "thái âm", "thiên đồng", "thiên lương", "hóa lộc", "bộ sao", "cách cục"],
    title: "Bộ Cơ–Nguyệt–Đồng–Lương: tối cần Hóa Lộc",
    source: SRC,
    requireAll: ["hóa lộc"],
    requireAny: ["thiên cơ", "thái âm", "thiên đồng", "thiên lương"],
    content:
      "Hệ quy tắc: BỘ Cơ–Nguyệt–Đồng–Lương TỐI CẦN HÓA LỘC. Bộ mưu-tâm-lương là bản chất 'nghĩ nhiều " +
      "làm chậm'; Lộc là động lực biến mưu thành của. Lá này có Hóa Lộc → mưu mà ra tiền; không có → " +
      "mưu giỏi nhưng chuyển hóa tài kém, khuyên gắn kế hoạch với một dòng tiền cụ thể.",
  },
  {
    id: "kn-bo-tu-phu-vu-tuong",
    tags: ["tử vi", "thiên phủ", "vũ khúc", "thiên tướng", "kình dương", "đà la", "địa không", "địa kiếp", "song hao", "bộ sao"],
    title: "Bộ Tử–Phủ–Vũ–Tướng: tối kỵ Kình, Đà, Không, Kiếp và Song Hao",
    source: SRC,
    requireAny: ["kình dương", "đà la", "địa không", "địa kiếp", "đại hao", "tiểu hao"],
    content:
      "Hệ quy tắc: BỘ Tử–Phủ–Vũ–Tướng TỐI Kỵ Kình/Đà/Không/Kiếp và Song Hao. Tử-Phủ-Vũ-Tướng là bộ " +
      "'chính quyền + kho' — sát/không/hao chạm vào thì quyền và kho cùng rỉ. Lá này có ít nhất 1 yếu " +
      "tố kỵ → kiểm xem nó cùng trục sao nào của bộ để định vị hư hỏng (Kình với Vũ: vì tiền va đập; " +
      "Không-Kiếp với Phủ: kho lộ).",
  },
  {
    id: "kn-bo-co-cu-song-hao",
    tags: ["cự môn", "thiên cơ", "song hao", "hóa lộc", "bộ sao", "cách cục"],
    title: "Bộ Cơ–Cự (Mão/Dậu, Tý/Ngọ): tối cần Song Hao hoặc Hóa Lộc",
    source: SRC,
    requireAll: ["cự môn"],
    requireAny: ["đại hao", "tiểu hao", "hóa lộc"],
    content:
      "Hệ quy tắc: BỘ Cơ–Cự (tại Mão/Dậu, Tý/Ngọ) TỐI CẦN SONG HAO HOẶC HÓA LỘC. Cự là khẩu + thị phi, " +
      "Cơ là mưu: bộ này 'hòa giải' bằng Hao (nói nhiều mà ra công) hoặc Lộc (nói mà có lãi). Lá này có " +
      "Hao/Lộc → khẩu thiệt chuyển thành nghề/công; thiếu cả hai → khuyên hạn chế tranh luận công khai.",
  },
  {
    id: "kn-bo-am-duong-ta-huu",
    tags: ["thái dương", "thái âm", "tả phù", "hữu bật", "đào hoa", "hồng loan", "hóa quyền", "hóa lộc", "bộ sao"],
    title: "Bộ Âm–Dương: cần Tả Hữu/Đào Hồng/Quyền Lộc; kỵ Đà, Riêu, Hình, Kiếp, Hỏa",
    source: SRC,
    requireAll: ["thái dương"],
    requireAny: ["tả phù", "hữu bật", "đào hoa", "hồng loan", "hóa quyền", "hóa lộc"],
    content:
      "Hệ quy tắc: BỘ Âm–Dương TỐI CẦN Tả Hữu, Đào Hồng, Quyền-Lộc; TỐI Kỵ Đà, Riêu, Hình, Kiếp, Hỏa " +
      "Tinh. Nhật-Nguyệt sáng cần người trợ và hóa trợ lực thì huy hoàng; gặp bộ kỵ thì ánh sáng mờ — " +
      "cha mẹ/tình cảm/nghề ban đêm rối. Lá này có cát trợ → nêu mặt sáng; kiểm đồng thời bộ kỵ để hạ " +
      "giọng.",
  },

  // ===== MẠCH A — SAO NHẬP HẠN (Tân Biên 1956 mục 3.2 + Mạch A2 cơ chế sao vận VDC) =====
  // Mỗi mẩu = 1 quy tắc "sao X nhập đại/tiểu hạn" — CHỈ áp khi X là sao thủ cung hạn
  // đang xét (đại hạn/tiểu hạn máy đã tính sẵn trong payload); mờ/sáng quyết định nhánh.
  {
    id: "kn-han2-tu-vi-trung-phung-tuan-triet",
    tags: ["tử vi", "tuần không", "triệt lộ", "trùng phùng", "hạn"],
    title: "Tử Vi nhập hạn — trùng phùng đại-tiểu hạn gặp Tuần/Triệt: tính mạng lâm nguy",
    source: SRC_TANBIEN,
    requireAll: ["tử vi"],
    requireAny: ["tuần không", "tuần trung", "triệt lộ", "triệt không"],
    content:
      "Hạn: Tử Vi nhập hạn mà ĐẠI-TIỂU HẠN TRÙNG PHÙNG (cùng một cung) lại gặp Tuần/Triệt án ngữ — " +
      "TÍNH MẠNG LÂM NGUY, rất đáng lo ngại. Quy tắc nặng nhất nhóm Tử Vi; chỉ nêu khi máy xác nhận " +
      "đại hạn và tiểu hạn cùng cung + Tuần/Triệt thật có.",
  },
  {
    id: "kn-han2-tu-vi-tam-khong-kiep",
    tags: ["tử vi", "tuần không", "triệt lộ", "địa không", "địa kiếp", "hóa kỵ", "hạn"],
    title: "Tử Vi nhập hạn + Tam Không/Kiếp/Kỵ — đau ốm nặng, mất của phá sản",
    source: SRC_TANBIEN,
    requireAll: ["tử vi"],
    requireAny: ["tuần không", "triệt lộ", "địa không", "địa kiếp", "hóa kỵ"],
    content:
      "Hạn: Tử Vi (dù vô hãm) nhập hạn cùng Tam Không/Kiếp/Kỵ — ĐAU ỐM NẶNG, MẤT CỦ PHÁ SẢN; tại " +
      "Tỵ/Hợi/Mão/Dậu thì sự tốt đẹp còn suy giảm, có tai họa khó giải. Gặp Phủ-Vũ-Tướng-Tả-Hữu-" +
      "Khoa-Quyền-Lộc thì ngược lại hoạnh phát danh tài. Chỉ khi Tử Vi thật là sao trục hạn.",
  },
  {
    id: "kn-han2-liem-hinh-ky-kinh-da",
    tags: ["liêm trinh", "thiên hình", "hóa kỵ", "kình dương", "đà la", "đao thương", "hạn"],
    title: "Liêm nhập hạn + Hình/Kỵ/Kình/Đà — tai nạn đao thương, lưu huyết",
    source: SRC_TANBIEN,
    requireAll: ["liêm trinh"],
    requireAny: ["thiên hình", "hóa kỵ"],
    content:
      "Hạn: Liêm Trinh hãm (Tỵ/Hợi/Sửu/Mùi) gặp Hỏa/Linh — tai nạn khủng khiếp hay bị lừa đảo hãm " +
      "hại; gặp Hình-Kỵ-Kình-Đà hội — TAI NẠN ĐAO THƯƠNG hay súng đạn, khó tránh lưu huyết. Liêm " +
      "sáng nhập hạn thì ngược lại danh vị thăng, tài lộc dồi dào. Chỉ khi Liêm là sao trục hạn.",
  },
  {
    id: "kn-han2-dong-thay-doi",
    tags: ["thiên đồng", "thay đổi", "công việc", "hạn"],
    title: "Thiên Đồng nhập hạn — thay đổi chỗ ở hay công việc",
    source: SRC_TANBIEN,
    requireAll: ["thiên đồng"],
    content:
      "Hạn: Thiên Đồng nhập hạn (sáng hay hãm) — THAY ĐỔI CHỖ Ở hay CÔNG VIỆC. Đồng sáng: mọi sự hành " +
      "thông, danh tài hưng vượng. Đồng hãm: trước thông sau bế tắc, hao tán, có quan chức bị bãi " +
      "truất. Chỉ khi Đồng là sao trục hạn đang xét.",
  },
  {
    id: "kn-han2-vu-ta-huu-xuong-khuc",
    tags: ["vũ khúc", "tả phù", "hữu bật", "văn xương", "văn khúc", "tài quan", "hạn"],
    title: "Vũ nhập hạn + Tả Hữu Xương Khúc — tài quan song mỹ",
    source: SRC_TANBIEN,
    requireAll: ["vũ khúc"],
    requireAny: ["tả phù", "hữu bật", "văn xương", "văn khúc"],
    content:
      "Hạn: Vũ Khúc sáng nhập hạn — tài lộc hưng vượng; gặp thêm Tả/Hữu/Xương/Khúc càng phát đạt — " +
      "TÀI QUAN SONG MỸ; gặp thêm Quyền có thể được điều đi trọng trấn. Vũ hãm nhập hạn: bế tắc, hao " +
      "tán, truất giáng. Chỉ khi Vũ là sao trục hạn.",
  },
  {
    id: "kn-han2-duong-mo-tang-ky-da",
    tags: ["thái dương", "tang môn", "hóa kỵ", "đà la", "cha", "hạn"],
    title: "Thái Dương mờ nhập hạn — mắt/đầu, sức khỏe cha hay chồng; +Tang/Kỵ/Đà quyết đoán tang",
    source: SRC_TANBIEN,
    requireAll: ["thái dương"],
    requireAny: ["tang môn", "hóa kỵ", "đà la"],
    content:
      "Hạn: Thái Dương mờ ám — đau yếu, bệnh mắt hay đầu (nhức), hao tán, sức khỏe cha/chồng (nữ mệnh) " +
      "suy kém. Nếu gặp thêm Tang-Kỵ-Đà: phải quyết đoán là CHA CHẾT hay CHỒNG CHẾT (câu phán nặng " +
      "nhất nhóm Dương — nêu đúng mức, kèm khuyên thăm khám/đề phòng thay vì phán tuyệt đối). Dương " +
      "sáng nhập hạn: hoạnh phát danh tài. Chỉ khi Dương là sao trục hạn.",
  },
  {
    id: "kn-han2-tuong-tuan-triet",
    tags: ["thiên tướng", "tuần không", "triệt lộ", "tai nạn", "đao thương", "hạn"],
    title: "Thiên Tướng nhập hạn + Tuần/Triệt — tai nạn xe cộ, đao thương, đầu mặt",
    source: SRC_TANBIEN,
    requireAll: ["thiên tướng"],
    requireAny: ["tuần không", "tuần trung", "triệt lộ", "triệt không"],
    content:
      "Hạn: Thiên Tướng bị Tuần/Triệt án ngữ — ĐAU ỐM, TIỂU NHÂN MƯU HẠI, TAI NẠN XE CỘ hay đao " +
      "thương, đầu và mặt đau đớn; hạn vào Thiên Di càng nặng, võ quan dễ giáng cấp, ra trận khó toàn " +
      "tính mạng. Tướng sáng nhập hạn: mưu sự toại lòng, hoạnh tài. Chỉ khi Tướng là sao trục hạn.",
  },
  {
    id: "kn-han2-luong-giai-tru",
    tags: ["thiên lương", "giải trừ", "quý nhân", "hạn"],
    title: "Thiên Lương nhập hạn — giải trừ tai họa (sáng: quý nhân cứu)",
    source: SRC_TANBIEN,
    requireAll: ["thiên lương"],
    content:
      "Hạn: Thiên Lương GIẢI TRỪ TAI HỌA. Lương sáng: danh tài hưng vượng, có vui mừng, đau ốm chóng " +
      "khỏi, mắc nạn sớm có quý nhân giải cứu. Lương mờ: tài hao, sức kém; tại Tý/Hợi chắc chắn đi xa " +
      "hay đổi việc. Lương gặp Sát tinh: khuynh gia bại sản — hạ nặng. Chỉ khi Lương là sao trục hạn.",
  },
  {
    id: "kn-han2-sat-kinh-da",
    tags: ["thất sát", "kình dương", "đà la", "tai nạn", "đao thương", "hạn"],
    title: "Thất Sát nhập hạn mờ + Kình/Đà — khó thoát tai nạn xe cộ đao thương",
    source: SRC_TANBIEN,
    requireAll: ["thất sát"],
    requireAny: ["kình dương", "đà la"],
    content:
      "Hạn: Thất Sát mờ ám + thêm Sát tinh nhất là Kình/Đà — KHÓ THOÁT TAI NẠN XE CỘ hay đao thương. " +
      "Sát sáng nhập hạn (nhất là Dần/Thân): trong nhà hòa khí, tài quan song mỹ, mưu sự nhanh thành. " +
      "Sát hãm Thìn/Tuất + gốc đại hạn xấu: phán nặng. Chỉ khi Sát là sao trục hạn.",
  },
  {
    id: "kn-han2-sat-pha-hao-ky",
    tags: ["thất sát", "phá quân", "đại hao", "hóa kỵ", "ung thư", "mổ xẻ", "hạn"],
    title: "Sát nhập hạn + Phá/Hao/Kỵ — chứng ung thư hay mụn nhọt mổ xẻ",
    source: SRC_TANBIEN,
    requireAll: ["thất sát"],
    requireAny: ["phá quân", "đại hao", "hóa kỵ"],
    content:
      "Hạn: Thất Sát gặp Phá-Hao-Kỵ — mắc chứng UNG THƯ hay mụn nhọt phải MỔ XẼ, châm chích. Quy tắc " +
      "yếu gốc lớn của nhóm Sát; nêu đúng mức kèm khuyên khám sớm, không phán tuyệt đối. Chỉ khi Sát " +
      "là sao trục hạn và Phá/Hao/Kỵ thật có cùng trục.",
  },
  {
    id: "kn-han2-pha-xuong-khuc-khoi-viet",
    tags: ["phá quân", "văn xương", "văn khúc", "thiên khôi", "thiên việt", "phú quý", "hạn"],
    title: "Phá Quân nhập hạn sáng + Xương Khúc Khôi Việt — phú quý đến cực độ",
    source: SRC_TANBIEN,
    requireAll: ["phá quân"],
    requireAny: ["văn xương", "văn khúc", "thiên khôi", "thiên việt"],
    content:
      "Hạn: Phá Quân sáng nhập hạn — tài lộc dồi dào, công danh hiến đạt; thêm Xương/Khúc/Khôi/Việt — " +
      "TÀI QUAN SONG MỸ, PHÚ QUÝ ĐẾN CỰC ĐỘ. Phá mờ: đau ốm nặng, tù tội, có tang, bãi truất, vợ con " +
      "không yên (nữ mệnh: bệnh khí huyết). Chỉ khi Phá là sao trục hạn.",
  },
  {
    id: "kn-han2-pha-tue",
    tags: ["phá quân", "thái tuế", "tuế kiện", "kiện tụng", "hạn"],
    title: "Phá Quân nhập hạn ngộ Tuế — mắc kiện tụng",
    source: SRC_TANBIEN,
    requireAll: ["phá quân"],
    requireAny: ["thái tuế", "tuế kiện", "tuế kiến"],
    content:
      "Hạn: Phá Quân ngộ Tuế (Thái Tuế/Tuế Kiến) — MẮC KIỆN TỤNG trong năm. Phá vốn phá vỡ + Tuế phơi " +
      "ra giấy tờ: tranh chấp thành vụ việc. Khuyên: tránh đứng tên kiện, hòa giải sớm. Chỉ khi Phá " +
      "là sao trục hạn và Tuế thật có cùng trục.",
  },
  {
    id: "kn-han2-kinh-sat-day",
    tags: ["kình dương", "tai nạn", "đao thương", "tù đày", "hạn"],
    title: "Kình Dương nhập hạn mờ + Sát dày — đao thương, tù đày",
    source: SRC_TANBIEN,
    requireAll: ["kình dương"],
    content:
      "Hạn: Kình Dương mờ ám + nhiều Sát tinh — KHÓ TRÁNH TAI HỌA ĐAO THƯƠNG súng đạn hay TÙ ĐÀY ở " +
      "xa. Kình sáng nhập hạn: mưu sự nhanh thành nhưng may kèm rủi, dễ phá tán ngay; riêng tuổi " +
      "Thìn-Tuất-Sửu-Mùi gặp Kình mờ cũng không đáng lo ngại lắm (quy tắc riêng theo tuổi). Chỉ khi " +
      "Kình là sao trục hạn.",
  },
  {
    id: "kn-han2-kinh-kiep-ky",
    tags: ["kình dương", "địa kiếp", "hóa kỵ", "đâm chém", "hạn"],
    title: "Kình nhập hạn ngộ Kiếp, Kỵ — bị đâm chém",
    source: SRC_TANBIEN,
    requireAll: ["kình dương"],
    requireAny: ["địa kiếp", "hóa kỵ"],
    content:
      "Hạn: Kình Dương ngộ Kiếp hoặc Kỵ — BỊ ĐÂM CHÉM (mức đao thương trực tiếp). Kèm Lưu Hà thì chủ " +
      "mưu sát. Ứng xử: năm đó tránh xung đột vật lý, nơi vũ khí, lái xe chậm. Chỉ khi Kình là sao " +
      "trục hạn và Kiếp/Kỵ thật có cùng trục.",
  },
  {
    id: "kn-han2-da-tue-ky",
    tags: ["đà la", "thái tuế", "tuế kiện", "hóa kỵ", "tang lớn", "hạn"],
    title: "Đà La nhập hạn + Tuế, Kỵ — tang lớn, đau nặng, kiện tụng",
    source: SRC_TANBIEN,
    requireAll: ["đà la"],
    requireAny: ["thái tuế", "tuế kiện", "tuế kiến", "hóa kỵ"],
    content:
      "Hạn: Đà La + Tuế — có tang, thị phi khẩu thiệt; Đà + Tuế + Kỵ — TANG LỚN, ĐAU YẾU NẶNG, KIỆN " +
      "TỤNG, có quan chức bị truất giáng. Đà mờ đơn độc: tai họa khủng khiếp, kiện cáo tù tội; Đà " +
      "sáng: mưu nhanh thành nhưng may kèm rủi. Chỉ khi Đà là sao trục hạn.",
  },
  {
    id: "kn-han2-hoa-tang",
    tags: ["hỏa tinh", "tang môn", "cháy nhà", "hạn"],
    title: "Hỏa Tinh nhập hạn ngộ Tang — nhà cửa bị cháy lớn",
    source: SRC_TANBIEN,
    requireAll: ["hỏa tinh"],
    requireAny: ["tang môn"],
    content:
      "Hạn: Hỏa Tinh ngộ Tang Môn — NHÀ CỬA BỊ CHÁY LỚN (sách: cung nhập hạn ứng phương nào thì cháy " +
      "từ phương đó). Hỏa sáng nhập hạn: trong nhà có vui, tiền phong túc, mưu nhanh thành (tại " +
      "Mão/Ngọ danh tài hưng nhưng cuối hạn phòng cháy). Hỏa mờ: tang, đau yếu thiếu máu/thần kinh, " +
      "kiện tụng. Chỉ khi Hỏa là sao trục hạn.",
  },
  {
    id: "kn-han2-linh-sat-phat",
    tags: ["linh tinh", "thất sát", "phá quân", "tù tội", "hạn"],
    title: "Linh Tinh nhập hạn mờ + Sát/Phá — tù tội",
    source: SRC_TANBIEN,
    requireAll: ["linh tinh"],
    requireAny: ["thất sát", "phá quân"],
    content:
      "Hạn: Linh Tinh mờ ám phùng Sát/Phá — TÙ TỘI. Linh mờ: đau yếu có thể phát cuồng, tai nạn đao " +
      "súng điện lửa, kiện tụng, có tang. Linh sáng: danh tài hưng vượng xa gần biết tiếng. Chỉ khi " +
      "Linh là sao trục hạn.",
  },
  {
    id: "kn-han2-khong-kiep-khi-huyet",
    tags: ["địa không", "địa kiếp", "khí huyết", "mắc lừa", "hạn"],
    title: "Không, Kiếp nhập hạn mờ — bệnh khí huyết, mắc lừa mất của",
    source: SRC_TANBIEN,
    requireAll: ["địa không"],
    requireAny: ["địa kiếp"],
    content:
      "Hạn: Không-Kiếp mờ ám — ĐAU YẾU (BỆNH KHÍ HUYẾT), MẮC LỪA MẤT CỦ, có quan chức bị truất giáng. " +
      "Không-Kiếp sáng nhập hạn: mưu sự nhanh thành, hoạnh phát danh tài nhưng hay đau yếu có mụn " +
      "nhọt. Chỉ khi Không/Kiếp là sao trục hạn.",
  },
  {
    id: "kn-han2-khong-kiep-tham",
    tags: ["địa không", "địa kiếp", "tham lang", "bế tắc", "hao tán", "hạn"],
    title: "Không, Kiếp nhập hạn ngộ Tham Lang — bế tắc, hao tán",
    source: SRC_TANBIEN,
    requireAll: ["tham lang"],
    requireAny: ["địa không", "địa kiếp"],
    content:
      "Hạn: Không-Kiếp ngộ Tham Lang — MỌI SỰ BẾ TẮC, HAO TÁN TIỀN TÀI. Tham nhiều muốn + Không Kiếp " +
      "cướp: dự án đa đầu tư cùng đổ, tham chơi cùng tán. Khuyên: năm đó dồn về một mục tiêu duy " +
      "nhất. Chỉ khi Tham là sao trục hạn và Không/Kiếp thật cùng trục.",
  },
  {
    id: "kn-han2-loc-ton-khong-kiep-tue",
    tags: ["lộc tồn", "địa không", "địa kiếp", "thái tuế", "tù tội", "hạn"],
    title: "Lộc Tồn nhập hạn + Không, Kiếp, Tuế — tính mạng lâm nguy hay tù tội",
    source: SRC_TANBIEN,
    requireAll: ["lộc tồn"],
    requireAny: ["địa không", "địa kiếp", "thái tuế", "tuế kiện", "tuế kiến"],
    content:
      "Hạn: Lộc Tồn + Không-Kiếp — đau yếu, mắc lừa, mất của; thêm Tuế — TÍNH MẠNG LÂM NGUY hoặc tù " +
      "tội (nếu gốc đại hạn xấu xa). Lộc Tồn nhập hạn thường: mọi sự hành thông, thăng chức, quý nhân " +
      "phù trợ. Chỉ khi Lộc Tồn là sao trục hạn.",
  },
  {
    id: "kn-han2-ta-huu-khoa-quyen-loc",
    tags: ["tả phù", "hữu bật", "hóa khoa", "hóa quyền", "hóa lộc", "thăng chức", "hạn"],
    title: "Tả/Hữu nhập hạn + Khoa-Quyền-Lộc — quan chức cao thăng, gần nguyên thủ",
    source: SRC_TANBIEN,
    requireAll: ["hóa khoa"],
    requireAny: ["tả phù", "hữu bật", "hóa quyền", "hóa lộc"],
    content:
      "Hạn: Tả/Hữu + Khoa-Quyền-Lộc — QUAN CHỨC CAO THĂNG, được lui tới gần bậc nguyên thủ, tài lộc " +
      "phong túc; Tả Hữu tại Tứ Mộ nhập hạn rực rỡ nhất. Tả Hữu mờ + sát: nhân ly tài tán, ra ngoài " +
      "bị khinh. Chỉ khi Tả/Hữu là sao trục hạn.",
  },
  {
    id: "kn-han2-xuong-khuc-liem-kinh-da",
    tags: ["văn xương", "văn khúc", "liêm trinh", "kình dương", "đà la", "tai nạn", "tù tội", "hạn"],
    title: "Xương/Khúc nhập hạn + Liêm, Kình, Đà — tai nạn khủng khiếp hay tù tội",
    source: SRC_TANBIEN,
    requireAll: ["văn khúc"],
    requireAny: ["liêm trinh", "kình dương", "đà la"],
    content:
      "Hạn: Xương/Khúc + Liêm-Kình-Đà — MẮC TAI NẠN KHỦNG KHIẾP, không thì không thoát tù tội; nếu " +
      "gốc đại hạn xấu phải quyết đoán là chết. Kèm Linh: khó tránh tù. Xương Khúc sáng nhập hạn: thi " +
      "cử đỗ cao; + Đồng-Tả-Hữu: tài lộc dồi dào. Chỉ khi Xương/Khúc là sao trục hạn.",
  },
  {
    id: "kn-han2-xuong-tue",
    tags: ["văn xương", "văn khúc", "thái tuế", "tuế kiện", "văn chương", "hạn"],
    title: "Xương/Khúc nhập hạn ngộ Tuế — quan chức lớn, viết văn nổi tiếng",
    source: SRC_TANBIEN,
    requireAll: ["văn xương"],
    requireAny: ["thái tuế", "tuế kiện", "tuế kiến"],
    content:
      "Hạn: Xương/Khúc ngộ Tuế — CÓ QUAN CHỨC LỚN, CẦU DANH TOẠI LỌNG; nếu viết văn chắc chắn nổi " +
      "tiếng xa gần. Xương Khúc mờ + Kỵ: công danh trắc trở, giấy tờ nhầm lẫn. Chỉ khi Xương/Khúc là " +
      "sao trục hạn.",
  },
  {
    id: "kn-han2-khoi-tu-phu-viet-xuong-khuc",
    tags: ["thiên khôi", "tử vi", "thiên phủ", "thiên việt", "văn xương", "văn khúc", "hoạnh phát", "hạn"],
    title: "Khôi nhập hạn + Tử Phủ Việt Xương Khúc — hoạnh phát danh tài, tranh chấp thắng",
    source: SRC_TANBIEN,
    requireAll: ["thiên khôi"],
    requireAny: ["tử vi", "thiên phủ", "thiên việt", "văn xương", "văn khúc"],
    content:
      "Hạn: Thiên Khôi + Tử/Phủ/Việt/Xương/Khúc — HOẠNH PHÁT DANH TÀI, PHÚ QUÝ CỰC ĐỘ; có tranh chấp " +
      "với ai cũng THẮNG LỢI. Khôi + Hình: thương tích đầu/đao thương. Khôi + Tuần/Triệt: tai nạn " +
      "khủng khiếp đầu bị thương nặng, bãi truất. Chỉ khi Khôi là sao trục hạn.",
  },
  {
    id: "kn-han2-hoa-loc-giai-tru",
    tags: ["hóa lộc", "lộc tồn", "giải trừ", "thăng chức", "hạn"],
    title: "Hóa Lộc nhập hạn — giải trừ tai họa, cần Lộc Tồn chiếu hơn đồng cung",
    source: SRC_TANBIEN,
    requireAll: ["hóa lộc"],
    content:
      "Hạn: Hóa Lộc — GIẢI TRỪ TAI HỌA, tài lộc phong túc (giữ nguyên), ốm đau chóng khỏi, có quan chức thăng. " +
      "Quy tắc tinh: Hóa Lộc cần LỘC TỒN CHIẾU mới thật tốt đẹp hơn là đồng cung (đồng cung thì sự " +
      "tốt đẹp bị chiết giảm). + Tham/Vũ: kinh doanh càng phát đạt. Chỉ khi Hóa Lộc (bẩm sinh/lưu) " +
      "rơi vào trục hạn.",
  },
  {
    id: "kn-han2-hoa-quyen-tuan-triet",
    tags: ["hóa quyền", "tuần không", "triệt lộ", "hữu danh vô thực", "hạn"],
    title: "Hóa Quyền nhập hạn + Tuần/Triệt — hữu danh vô thực",
    source: SRC_TANBIEN,
    requireAll: ["hóa quyền"],
    requireAny: ["tuần không", "tuần trung", "triệt lộ", "triệt không"],
    content:
      "Hạn: Hóa Quyền bị Tuần/Triệt án ngữ — CÔNG DANH TRẮC TRỞ, bị tiểu nhân gièm pha nói xấu; có uy " +
      "quyền cũng bị CHIẾT GIẢM hay HỮU DANH VÔ THỰC. Quyền sáng nhập hạn: khỏe mạnh, hoạnh phát, " +
      "thường đổi chỗ ở/chức vụ. Chỉ khi Quyền rơi vào trục hạn.",
  },
  {
    id: "kn-han2-hoa-ky-pha-tue",
    tags: ["hóa kỵ", "phá quân", "thái tuế", "cãi nhau", "hạn"],
    title: "Hóa Kỵ nhập hạn + Phá, Tuế — cãi nhau đánh lộn",
    source: SRC_TANBIEN,
    requireAll: ["hóa kỵ"],
    requireAny: ["phá quân", "thái tuế", "tuế kiện", "tuế kiến"],
    content:
      "Hạn: Hóa Kỵ + Phá + Tuế — CÃI NHAU ĐÁNH LỘN. Kỵ mờ ám: đau yếu liên miên, tang thương, mất " +
      "cứ, kiện cáo, bãi truất. Kỵ sáng nhập hạn: mưu sự toại lòng, danh tài hưng vượng nhưng kém sức " +
      "khỏe hay thị phi. Chỉ khi Kỵ (bẩm sinh/lưu/vận) rơi vào trục hạn.",
  },
  {
    id: "kn-han2-hoa-ky-da-ho",
    tags: ["hóa kỵ", "đà la", "bạch hổ", "tai nạn", "xe cộ", "hạn"],
    title: "Hóa Kỵ nhập hạn + Đà, Hổ — tai nạn khủng khiếp về xe cộ hay đao thương",
    source: SRC_TANBIEN,
    requireAll: ["hóa kỵ"],
    requireAny: ["đà la", "bạch hổ"],
    content:
      "Hạn: Hóa Kỵ + Đà La — đau yếu nặng, nhục nhã, đi xa mắc nạn dọc đường; Hóa Kỵ + Đà + HỔ — TAI " +
      "NẠN KHỦNG KHIẾP VỀ XE CỘ hay đao thương. Khuyên: năm đó tuyệt đối cẩn thận phương tiện. Chỉ " +
      "khi Kỵ thật cùng trục Đà/Hổ trong hạn.",
  },
  {
    id: "kn-han2-hoa-ky-hong-dao",
    tags: ["hóa kỵ", "hồng loan", "đào hoa", "tơ duyên", "hạn"],
    title: "Hóa Kỵ nhập hạn + Hồng, Đào — tơ duyên rắc rối",
    source: SRC_TANBIEN,
    requireAll: ["hóa kỵ"],
    requireAny: ["hồng loan", "đào hoa"],
    content:
      "Hạn: Hóa Kỵ + Hồng Loan/Đào Hoa — TƠ DUYÊN RẮC RỐI; nữ giới gặp hạn này (Kỵ + đào hoa) khó " +
      "giữ toàn danh tiết — sách nói thời xưa; nay luận là: năm đó tình cảm phức tạp, chớ kết hôn vội. " +
      "Chỉ khi Kỵ thật cùng trục Hồng/Đào trong hạn.",
  },
  {
    id: "kn-han2-song-hao-vu-phu-loc",
    tags: ["đại hao", "tiểu hao", "vũ khúc", "thiên phủ", "hóa lộc", "thua lỗ", "mất trộm", "hạn"],
    title: "Song Hao nhập hạn mờ + Vũ, Phủ hay Lộc — thua lỗ, mất trộm, tiêu hóa yếu",
    source: SRC_TANBIEN,
    requireAll: ["đại hao"],
    requireAny: ["tiểu hao", "vũ khúc", "thiên phủ", "hóa lộc"],
    content:
      "Hạn: Song Hao mờ + Vũ/Phủ/Lộc — CHẮC CHẴN TIỀN TÀI HAO TÁN NHIỀU, buôn bán thua lỗ, bị mất " +
      "trộm, mắc lừa; thường kèm bệnh máy tiêu hóa. Song Hao nhập hạn nói chung: THAY ĐỔI CHỖ Ở/CÔNG " +
      "VIỆC hoặc xa nhà; sáng thì hoạnh phát dễ kiếm tiền. Chỉ khi Hao là sao trục hạn.",
  },
  {
    id: "kn-han2-song-hao-tuyet",
    tags: ["đại hao", "tiểu hao", "tuyệt", "phá sản", "hạn"],
    title: "Song Hao nhập hạn ngộ Tuyệt — phá sản",
    source: SRC_TANBIEN,
    requireAll: ["tuyệt"],
    requireAny: ["đại hao", "tiểu hao"],
    content:
      "Hạn: Song Hao ngộ Tuyệt — PHÁ SẢN (quy tắc trùng với mẩu Hao-Tuyệt nhưng đặt ở lớp Song Hao " +
      "nhập hạn: cả hai Hao cùng chạm vòng Tuyệt). Năm đó dừng mọi khoản nợ/đầu tư, giữ tiền mặt, " +
      "không bảo lãnh. Chỉ khi nhãn Tuyệt thật cùng trục Hao trong hạn.",
  },
  {
    id: "kn-han2-tang-ho-khoc",
    tags: ["tang môn", "bạch hổ", "thiên khốc", "tang thương", "hạn"],
    title: "Tang Môn nhập hạn + Hổ, Khốc — trong nhà có người chết",
    source: SRC_TANBIEN,
    requireAll: ["tang môn"],
    requireAny: ["bạch hổ", "thiên khốc"],
    content:
      "Hạn: Tang Môn + Hổ + Khốc — TRONG NHÀ CÓ NGƯỜI CHẾT, của cải hao tán, nuôi súc vật không lợi. " +
      "Tang + Hổ-Khốc-Hư: buồn phiền, bệnh lao phổi ho nhiều. Tang + Hỏa: cháy nhà (hỏa nhập hạn tại " +
      "Mão/Ngọ càng rõ). Chỉ khi Tang là sao trục hạn và Hổ/Khốc thật có cùng trục.",
  },
  {
    id: "kn-han2-bach-ho-tham",
    tags: ["bạch hổ", "tham lang", "tai nạn xe cộ", "ác thú", "hạn"],
    title: "Bạch Hổ nhập hạn ngộ Tham Lang — tai nạn xe cộ hay ác thú cắn",
    source: SRC_TANBIEN,
    requireAll: ["bạch hổ"],
    requireAny: ["tham lang"],
    content:
      "Hạn: Bạch Hổ ngộ Tham Lang — TAI NẠN XE CỘ hay bị ác thú cắn đá (đáng lo nhất khi Hổ nhập hạn " +
      "tại Dần/Tuất). Hổ mờ: tang, mất của, bệnh khí huyết xương cốt. Chỉ khi Hổ (tuế tiền) là sao " +
      "trục hạn và Tham thật cùng trục.",
  },
  {
    id: "kn-han2-bach-ho-phi",
    tags: ["bạch hổ", "phi liêm", "hoạnh tài", "hạn"],
    title: "Bạch Hổ nhập hạn ngộ Phi Liêm — hoạnh phát hoạnh tài, trong nhà có chuyện vui",
    source: SRC_TANBIEN,
    requireAll: ["bạch hổ"],
    requireAny: ["phi liêm"],
    content:
      "Hạn: Bạch Hổ ngộ Phi Liêm — MỌI SỰ HÀNH THÔNG, HOẠNH PHÁT HOẠNH TÀI, trong nhà có chuyện vui " +
      "mừng (quy tắc tích cực hiếm của nhóm Hổ — đối nghịch Bạch Hổ + Sát). Bạch Hổ mờ đơn độc: tang, " +
      "mất của, bệnh khí huyết. Chỉ khi Hổ là sao trục hạn.",
  },
  {
    id: "kn-han2-long-phuong-hi",
    tags: ["long trì", "phượng các", "thiên hỷ", "duyên vợ chồng", "hạn"],
    title: "Long, Phượng nhập hạn + Hỷ — nên duyên vợ chồng, hỷ khí đầy nhà",
    source: SRC_TANBIEN,
    requireAll: ["long trì"],
    requireAny: ["phượng các", "thiên hỷ"],
    content:
      "Hạn: Long Trì-Phượng Các + Thiên Hỷ — NÊN DUYÊN VỢ CHỒNG, mưu sự toại lòng; + Mã/Sinh/Vượng: có " +
      "con; + Thai: tin mừng có mang. Long + Không-Kiếp: nạn sông nước; + Điếu: ngã xuống sông ao. " +
      "Chỉ khi Long/Phượng là sao trục hạn.",
  },
  {
    id: "kn-han2-dao-khong-kiep-benh-phu",
    tags: ["hàm trì", "đào hoa", "địa không", "địa kiếp", "bệnh phù", "phong tình", "hạn"],
    title: "Nhóm đào hoa (Hàm Trì/Hồng/Đào…) nhập hạn + Không, Kiếp, Bệnh Phù — bệnh phong tình",
    source: SRC_TANBIEN,
    requireAll: ["hàm trì"],
    requireAny: ["địa không", "địa kiếp", "bệnh phù"],
    content:
      "Hạn: Đào Hoa + Không-Kiếp-Bệnh Phù — MẮC BỆNH PHONG TÌNH (sách phán thẳng: chuyện tình phức tạp cả năm). Đào + Tử-Phủ-Vũ-Tướng-Hồng: hỷ khí đầy nhà, danh tài hưng vượng. Đào mờ + sát: tang, rắc " +
      "rối tơ duyên. Chỉ khi Đào là sao trục hạn và Không/Kiếp/Bệnh Phù thật cùng trục.",
  },
  {
    id: "kn-han2-hoa-loc-tham-vu",
    tags: ["hóa lộc", "tham lang", "vũ khúc", "kinh doanh", "hạn"],
    title: "Hóa Lộc nhập hạn + Tham, Vũ — kinh doanh càng phát đạt",
    source: SRC_TANBIEN,
    requireAll: ["hóa lộc"],
    requireAny: ["tham lang", "vũ khúc"],
    content:
      "Hạn: Hóa Lộc + Tham/Vũ — MỌI SỰ HÀNH THÔNG, DANH TÀI HƯNG VƯỢNG; nếu kinh doanh lại càng phát " +
      "đạt. Tài tinh gặp Lộc trong hạn là chu kỳ gom hàng–mở rộng hợp lý. Chỉ khi Tham/Vũ là sao trục " +
      "hạn và Hóa Lộc (bẩm sinh/lưu) thật chiếu về trục đó.",
  },
  {
    id: "kn-han2-vu-mo-bet-tac",
    tags: ["vũ khúc", "bế tắc", "hao tán", "hạn"],
    title: "Vũ Khúc nhập hạn mờ — bế tắc, hao tán, truất giáng",
    source: SRC_TANBIEN,
    requireAll: ["vũ khúc"],
    content:
      "Hạn: Vũ Khúc mờ ám — MỌI SỰ BẾ TẮC: không mắc tai nạn cũng hao tán tiền tài, truất giáng quan " +
      "chức. Vũ sáng nhập hạn thì ngược lại (tài lộc hưng vượng; thêm Tả-Hữu-Xương-Khúc tài quan song " +
      "mỹ). Chỉ khi Vũ là sao trục hạn — mờ/sáng quyết định nhánh.",
  },
  {
    id: "kn-han2-tu-vi-hoanh-phat",
    tags: ["tử vi", "thiên phủ", "vũ khúc", "thiên tướng", "tả phù", "hữu bật", "hoạnh phát", "hạn"],
    title: "Tử Vi nhập hạn + Phủ-Vũ-Tướng-Tả-Hữu-K/Q/L — hoạnh phát danh tài",
    source: SRC_TANBIEN,
    requireAll: ["tử vi"],
    requireAny: ["thiên phủ", "vũ khúc", "thiên tướng", "tả phù", "hữu bật", "hóa khoa", "hóa quyền", "hóa lộc"],
    content:
      "Hạn: Tử Vi nhập hạn cùng Phủ/Vũ/Tướng/Tả-Hữu/Khoa-Quyền-Lộc — HOẠNH PHÁT DANH TÀI, gặp nhiều sự " +
      "may mắn (đế tinh + kho + ấn + trợ tinh hội đủ thì thượng cách). Tử Vi + Tam Không/Kiếp/Kỵ thì " +
      "luận mẩu cảnh báo ngược lại. Chỉ khi Tử Vi là sao trục hạn.",
  },
  {
    id: "kn-han2-dao-den-truoc-gio",
    tags: ["hồng loan", "đào hoa", "thiên cơ", "cự môn", "tả phù", "hữu bật", "thái tuế", "sức khỏe", "hạn"],
    title: "Nhóm đào hoa (Hồng Loan/Đào…) nhập hạn + Cơ, Cự, Tả-Hữu, Tuế — sức khỏe suy kém, mạng như ngọn đèn trước gió",
    source: SRC_TANBIEN,
    requireAll: ["hồng loan"],
    requireAny: ["thiên cơ", "cự môn", "tả phù", "hữu bật", "thái tuế", "tuế kiện", "tuế kiến"],
    content:
      "Hạn: Đào Hoa + Cơ/Cự/Tả-Hữu/Tuế — SỨC KHỎE SUY KÉM, TÍNH MẠNG NHƯ NGỌN ĐÈN TRƯỚC GIÓ (câu phán " +
      "nặng của sách cho tổ hợp đào hoa gặp văn khẩu trong hạn). Nêu đúng mức kèm khuyên khám tổng " +
      "quát, hạn chế đêm khuya; chớ dùng để dọa. Chỉ khi Đào là sao trục hạn và các sao kia thật cùng " +
      "trục.",
  },

  // ===== MẠCH A BỔ SUNG — các sao còn lại từ Tân Biên 3.2 chưa biên =====
  {
    id: "kn-han2-hong-loan-sang",
    tags: ["hồng loan", "thăng quan", "hỉ khí", "hạn"],
    title: "Hồng Loan nhập hạn sáng — thăng quan, hỷ khí đầy nhà",
    source: SRC_TANBIEN,
    requireAll: ["hồng loan"],
    content:
      "Hạn: Hồng Loan sáng — MỌI SỰ HÀNH THÔNG, THĂNG QUAN TIẾN CHỨC, hỷ khí đầy nhà. Hồng mờ: đau " +
      "yếu, buồn phiền, có tang, sức khỏe của mẹ/vợ/con gái suy kém. Chỉ khi Hồng là sao trục hạn.",
  },
  {
    id: "kn-han2-hong-loan-ta-huu",
    tags: ["hồng loan", "tả phù", "hữu bật", "long trì", "phượng các", "thiên riêu", "cưới hỏi", "hạn"],
    title: "Hồng Loan + Tả Hữu/Long Phượng/Riêu — hoạnh phát, cưới hỏi sinh con",
    source: SRC_TANBIEN,
    requireAll: ["hồng loan"],
    requireAny: ["tả phù", "hữu bật", "long trì", "phượng các", "thiên riêu"],
    content:
      "Hạn: Hồng Loan + Tả-Hữu/Long-Phượng/Riêu — HOẠNH PHÁT DANH TÀI, trong nhà có việc mừng (CƯỚI " +
      "HỎI, SINH CON). Chỉ khi Hồng là sao trục hạn và các sao kia thật cùng trục.",
  },
  {
    id: "kn-han2-hong-loan-thanh-long",
    tags: ["hồng loan", "thanh long", "tai nạn", "hạn"],
    title: "Hồng Loan + Thanh Long — tai nạn bất ngờ",
    source: SRC_TANBIEN,
    requireAll: ["hồng loan", "thanh long"],
    content:
      "Hạn: Hồng Loan + Thanh Long — TAI NẠN BẤT NGỜ. Hồng là hỉ tinh nhưng gặp Thanh Long (cũng là " +
      "hỉ) thì hai lực hỉ kích nhau thành động — di chuyển nhiều, cẩn thận va chạm. Chỉ khi 2 sao thật " +
      "cùng trục trong hạn.",
  },
  {
    id: "kn-han2-hong-loan-khong-kiep",
    tags: ["hồng loan", "địa không", "địa kiếp", "bệnh phù", "phong tình", "hạn"],
    title: "Hồng Loan + Không, Kiếp, Bệnh Phù — bệnh phong tình",
    source: SRC_TANBIEN,
    requireAll: ["hồng loan"],
    requireAny: ["địa không", "địa kiếp", "bệnh phù"],
    content:
      "Hạn: Hồng Loan + Không-Kiếp-Bệnh Phù — MẮC BỆNH PHONG TÌNH (trùng quy tắc Đào-Không-Kiếp). " +
      "Hồng và Đào cùng tính: tình cảm phức tạp kèm hao tán. Chỉ khi Hồng là sao trục hạn.",
  },
  {
    id: "kn-han2-quang-quy-sang",
    tags: ["ân quang", "thiên quý", "quý nhân", "hạn"],
    title: "Quang, Quý nhập hạn sáng — danh tài hưng vượng, luôn gặp quý nhân",
    source: SRC_TANBIEN,
    requireAll: ["ân quang"],
    requireAny: ["thiên quý"],
    content:
      "Hạn: Quang-Quý sáng — MỌI SỰ HÀNH THÔNG, DANH TÀI HƯNG VƯỢNG, LUÔN GẶP QUÝ NHÂN. Quang-Quý mờ: " +
      "đau ốm chóng khỏi (gặp thầy gặp thuốc), tai nạn cũng có người cứu. Chỉ khi Quang/Quý là sao " +
      "trục hạn.",
  },
  {
    id: "kn-han2-tuong-quan-thien-tuong",
    tags: ["tướng quân", "thiên tướng", "uy quyền", "hạn"],
    title: "Tướng Quân + Thiên Tướng — uy quyền lớn",
    source: SRC_TANBIEN,
    requireAll: ["tướng tinh", "thiên tướng"],
    content:
      "Hạn: Tướng Quân + Thiên Tướng — UY QUYỀN LỚN. Tướng Quân là đầu 12 thần Tướng Tiền, Thiên Tướng " +
      "là Ấn tinh: quyền + ấn = lực thi hành mạnh. Chỉ khi 2 sao thật cùng trục trong hạn.",
  },
  {
    id: "kn-han2-tuong-quan-hinh-an",
    tags: ["tướng quân", "thiên hình", "quốc ấn", "thăng chức", "hạn"],
    title: "Tướng Quân + Hình, Ấn — thăng chức, võ quan có binh quyền",
    source: SRC_TANBIEN,
    requireAll: ["tướng tinh"],
    requireAny: ["thiên hình", "quốc ấn"],
    content:
      "Hạn: Tướng Quân + Hình hoặc Ấn — có quan chức THĂNG CAO, võ quan CẮC CHẮN CÓ BINH QUYỀN. Tướng " +
      "quân chủ uy + Hình/Ấn chủ quyền pháp: lực chấp pháp mạnh. Chỉ khi các sao thật cùng trục.",
  },
  {
    id: "kn-han2-tuong-quan-tuan-triet",
    tags: ["tướng quân", "tuần không", "triệt lộ", "đao thương", "hạn"],
    title: "Tướng Quân + Tuần/Triệt — nạn đao thương, đầu mặt đau đớn",
    source: SRC_TANBIEN,
    requireAll: ["tướng tinh"],
    requireAny: ["tuần không", "tuần trung", "triệt lộ", "triệt không"],
    content:
      "Hạn: Tướng Quân bị Tuần/Triệt án ngữ — NẠN ĐAO THƯƠNG hay XE CỘ, ĐẦU VÀ MẶT ĐAU ĐỚN. Tướng có " +
      "uy nhưng bị chặn: quyền lực cụt, dễ va chạm vật lý. Chỉ khi Tướng thật cùng trục Tuần/Triệt.",
  },
  {
    id: "kn-han2-quoc-an-sang",
    tags: ["quốc ấn", "thăng quan", "uy quyền", "hạn"],
    title: "Quốc Ấn nhập hạn sáng — thăng quan tiến chức, uy quyền",
    source: SRC_TANBIEN,
    requireAll: ["quốc ấn"],
    content:
      "Hạn: Quốc Ấn sáng — THĂNG QUAN TIẾN CHỨC, CÓ UY QUYỀN. Ấn là con dấu quyền hành: năm đó được " +
      "trao thêm trách nhiệm/chức vụ. Quốc Ấn mờ: lo buồn, bối rối vì công việc, mưu sự chẳng toại. " +
      "Quốc Ấn + Tuần/Triệt: công danh trắc trở, truất giáng. Chỉ khi Ấn là sao trục hạn.",
  },
  {
    id: "kn-han2-duong-phu-sang",
    tags: ["đường phù", "danh tài", "nhà đất", "hạn"],
    title: "Đường Phù nhập hạn sáng — danh tài hưng vượng, mua tậu nhà đất",
    source: SRC_TANBIEN,
    requireAll: ["đường phù"],
    content:
      "Hạn: Đường Phù sáng — DANH TÀI HƯNG VƯỢNG, có uy quyền, MUA TẬU ĐƯỢC NHÀ ĐẤT. Đường Phù mờ: " +
      "kiện cáo, tù tội, đau ốm nặng. + Long-Phượng: mua tậu nhà đất; + Hổ: tang, tù, lưu đày. Chỉ khi " +
      "Đường Phù là sao trục hạn.",
  },
  {
    id: "kn-han2-thien-ma-thay-doi",
    tags: ["thiên mã", "thay đổi", "xa nhà", "hạn"],
    title: "Thiên Mã nhập hạn — thay đổi chỗ ở hay công việc, xa nhà",
    source: SRC_TANBIEN,
    requireAll: ["thiên mã"],
    content:
      "Hạn: Thiên Mã — THAY ĐỔI CHỖ Ở hay CÔNG VIỆC, hoặc phải xa nhà. Mã chủ động: di chuyển, chuyển " +
      "việc, xuất ngoại. Mã + Tử-Phủ: phú quý cực độ; + Không-Kiếp-Tuế: đau nặng tai nạn; + Đà-Thai: " +
      "bôn ba nay đây mai đó; + Hình: tai nạn xe cộ; + Tuyệt: bế tắc; + Tuần-Triệt: công danh trắc trở. " +
      "Chỉ khi Mã là sao trục hạn.",
  },
  {
    id: "kn-han2-giai-than-sang",
    tags: ["giải thần", "giải trừ", "tai họa", "hạn"],
    title: "Giải Thần nhập hạn — giải trừ tai họa, bệnh chóng khỏi",
    source: SRC_TANBIEN,
    requireAll: ["giải thần"],
    content:
      "Hạn: Giải Thần — GIẢI TRỪ TAI HỌA. Giải sáng: danh tài kém hưng vượng nhưng an. Giải mờ: giải " +
      "trừ bệnh tật, chóng khỏi vì gặp thầy thuốc. Gốc đại hạn rất xấu + tiểu hạn xấu + Giải Thần nhập " +
      "hạn: có thể giảm nặng thành nhẹ. Chỉ khi Giải Thần là sao trục hạn.",
  },
  {
    id: "kn-han2-thien-khong-mac-lua",
    tags: ["thiên không", "mắc lừa", "kinh doanh thất bại", "hạn"],
    title: "Thiên Không nhập hạn — cơ nghiệp sa sút, mắc lừa, kinh doanh thất bại",
    source: SRC_TANBIEN,
    requireAll: ["thiên không"],
    content:
      "Hạn: Thiên Không — MƯU SỰ CHẲNG ĐƯỢC TOẠI LÒNG, CƠ NGHIỆP SA SÚT, MẮC LỪA, MẤT CỦ, KINH DOANH " +
      "THẤT BẠI. Đang đau yếu gặp Thiên Không: chắc chắn qua khỏi (Thiên Không giải bệnh nhưng phá " +
      "tài). Chỉ khi Thiên Không là sao trục hạn.",
  },
  {
    id: "kn-han2-tuan-han-sang",
    tags: ["tuần không", "tuần trung", "hạn xấu", "bế tắc", "hạn"],
    title: "Tuần nhập hạn + hạn sáng — mưu sự trở ngại buổi đầu",
    source: SRC_TANBIEN,
    requireAll: ["tuần không"],
    content:
      "Hạn: Tuần án ngữ trên hạn SÁNG — mưu sự thường gặp TRỞ NGẠI BUỔI ĐẦU rồi thông; trên hạn XẤU — " +
      "mọi sự BẾ TẮC (Tuần chặn luôn hy vọng). Tuần ảnh hưởng mạnh suốt đời người, không chỉ năm. " +
      "Chỉ khi Tuần thật án ngữ cung hạn.",
  },
  {
    id: "kn-han2-triet-han-sang",
    tags: ["triệt lộ", "triệt không", "hạn xấu", "thất bại", "hạn"],
    title: "Triệt nhập hạn + hạn sáng — thất bại liên miên",
    source: SRC_TANBIEN,
    requireAll: ["triệt lộ"],
    content:
      "Hạn: Triệt án ngữ trên hạn SÁNG — mưu sự CHẲNG ĐƯỢC TOẠI LÒNG, THẤT BẠI LIÊN MIÊN; trên hạn " +
      "XẤU — trở ngại buổi đầu. Triệt mạnh hơn Tuần. Triệt + hỉ sự: cần Tả-Hữu/Long-Phượng/Hồng-Hỷ " +
      "trong cung hạn mới trụ được. Chỉ khi Triệt thật án ngữ cung hạn.",
  },
  {
    id: "kn-han2-triet-han-sinh-con",
    tags: ["triệt lộ", "tử tức", "sinh con", "hạn"],
    title: "Triệt + hạn sinh con — cần Tả-Hữu/Long-Phượng/Hồng-Hỷ/Sinh trong cung hạn",
    source: SRC_TANBIEN,
    requireAll: ["triệt lộ"],
    content:
      "Hạn: Triệt án ngữ + muốn đón con — CUNG NHẬP HẠN cần có Tả-Hữu, Long-Phượng, Hồng-Hỷ, hoặc " +
      "Trường Sinh/Đế Vượng mới trụ được; nếu cung hạn trống + Triệt thì khó đón con năm đó. Quy tắc " +
      "riêng của Tân Biên cho năm sinh con. Chỉ khi Triệt thật án ngữ cung Tử Tức hoặc hạn có ý sinh con.",
  },
  {
    id: "kn-han2-triet-han-gia",
    tags: ["triệt lộ", "tuổi già", "hậu vận", "hạn"],
    title: "Triệt + hạn người già (60+) — xem cung nhập hạn quyết định sức khỏe",
    source: SRC_TANBIEN,
    requireAll: ["triệt lộ"],
    content:
      "Hạn: Triệt + NGƯỜI GIÀ (60+): từ 60 tuổi trở đi, xem cung nhập hạn (đại hoặc tiểu hạn) để quyết " +
      "định sức khỏe — Triệt trên hạn sáng của người già vẫn chủ an; trên hạn hãm thì nguy hơn người " +
      "trẻ cùng tổ hợp. Quy tắc riêng cho hậu vận. Chỉ khi Triệt thật án ngữ cung hạn của bạn ở tuổi 60+.",
  },

  // ===== PER-PALACE — MỆNH/THÂN (Tân Biên 4.1.x) =====
  {
    id: "kn-pp-menh-than-dong-cung",
    tags: ["mệnh", "thân", "đồng cung", "cách cục"],
    title: "Mệnh Thân đồng cung — tính hành nhất quán, điểm mù khó lột xác",
    source: SRC_TANBIEN,
    content:
      "Mệnh Thân đồng cung: tính–hành nhất quán suốt đời, không phân hóa trước/sau 30. Điểm mù: khó " +
      "'lột xác', dễ cố chấp một hệ giá trị. Tại Tứ Mộ vô chính diệu: giảm thọ, cần Tuần/Triệt cứu " +
      "hoặc nhiều cát tinh hội. Tại Tý-Ngọ vô chính diệu + không Hóa Lộc: nghèo mà sống lâu. Chỉ khi " +
      "Mệnh-Thân thật đồng cung (máy xác nhận).",
  },
  {
    id: "kn-pp-menh-sang-than-mo",
    tags: ["mệnh", "thân", "thiếu thời", "hậu vận", "cách cục"],
    title: "Mệnh sáng Thân mờ — thiếu thời sung sướng, đứng tuổi sa sút",
    source: SRC_TANBIEN,
    content:
      "Mệnh sáng + Thân mờ: LÚC THIẾU THỜI sung sướng, đứng tuổi về già chẳng mấy khi toại ý. Ngược " +
      "lại Mệnh mờ + Thân sáng: thiếu thời lao tâm khổ tứ, đứng tuổi về già sung sướng. Mệnh nhược " +
      "Thân cường: xứng ý toại lòng nhưng không giàu lớn.",
  },
  {
    id: "kn-pp-menh-tuan-than-triet",
    tags: ["mệnh", "thân", "tuần không", "triệt lộ", "cách cục"],
    title: "Mệnh Tuần Thân Triệt — cần Cơ-Nguyệt-Đồng-Lương sáng hội hợp",
    source: SRC_TANBIEN,
    requireAll: ["tuần không"],
    requireAny: ["triệt lộ", "triệt không"],
    content:
      "Mệnh có Tuần án ngữ, Thân có Triệt án ngữ: CẦN Cơ-Nguyệt-Đồng-Lương sáng hội hợp mới xứng ý " +
      "toại lòng, về già danh giá an nhàn. Không có → đời lao khổ. Chỉ khi máy xác nhận Tuần ở Mệnh + " +
      "Triệt ở Thân (hoặc ngược: Mệnh Triệt Thân Tuần → cần vô chính diệu + tăng thọ).",
  },
  {
    id: "kn-pp-menh-khong-than-kiep",
    tags: ["mệnh", "thân", "địa không", "địa kiếp", "khôn ngoan", "cách cục"],
    title: "Mệnh Không Thân Kiếp — khôn ngoan sắc sảo nhưng vui ít buồn nhiều",
    source: SRC_TANBIEN,
    requireAny: ["địa không", "địa kiếp"],
    content:
      "Mệnh có Địa Không + Thân có Địa Kiếp (hoặc ngược): KHÔN NGOAN SẮC SẢO nhưng vui ít buồn nhiều, " +
      "mưu sự thành bại thất thường, không bền. + Song Hao hội: ít học nhưng công danh khá. + Thiên " +
      "Đồng/Lương/Phá tọa Mệnh/Thân: không sống lâu. Chỉ khi máy xác nhận Không ở Mệnh + Kiếp ở Thân " +
      "(hoặc ngược).",
  },
  {
    id: "kn-pp-sinh-vuong-bai-tuyet",
    tags: ["mệnh", "ngũ hành", "sinh địa", "vượng địa", "tuyệt địa", "cách cục"],
    title: "Mệnh Sinh/Vượng/Bại/Tuyệt địa — năm sinh quyết cung tốt xấu",
    source: SRC_TANBIEN,
    content:
      "Bản Mệnh Kim: Tỵ=Sinh, Dậu=Vượng, Ngọ=Bại, Dần=Tuyệt. Mộc: Hợi=Sinh, Mão=Vượng, Tý=Bại, " +
      "Thân=Tuyệt. Hỏa: Dần=Sinh, Ngọ=Vượng, Mão=Bại, Hợi=Tuyệt. Thủy-Thổ: Thân=Sinh, Tý=Vượng, " +
      "Dậu=Bại, Tỵ=Tuyệt. Bại địa + vận tốt: hào nở tối tàn. Tuyệt địa + không Chính diệu sinh Bản " +
      "Mệnh cứu: đáng lo. Tuyệt + Chính diệu sinh Mệnh: 'tuyệt xứ phùng sinh' — không lo nhiều. Chỉ " +
      "khi máy xác nhận Bản Mệnh + cung Mệnh.",
  },
  {
    id: "kn-pp-menh-vo-chinh-dieu",
    tags: ["mệnh", "vô chính diệu", "mượn sao", "cách cục"],
    title: "Mệnh vô Chính diệu — khôn ngoan, cần mượn sao chiếu + Tuần/Triệt cứu",
    source: SRC_TANBIEN,
    content:
      "Mệnh vô Chính diệu: KHÔN NGOAN SẮC SẢO nhưng thiếu thời vất vả phiêu bạt. Cần Tuần/Triệt án " +
      "ngữ + Thiên Không/Địa Không hội (Tam Không) HOẶC nhiều chính tinh sáng chiếu + trung tinh rực " +
      "rỡ → sống lâu. Không có cứu giải → đáng lo. Mệnh vô chính diệu + Hồng-Đào-Sát: chết non. Chỉ " +
      "khi máy xác nhận Mệnh vô chính diệu.",
  },
  {
    id: "kn-pp-than-cu-thien-di",
    tags: ["thân", "thiên di", "lập nghiệp xa", "hạn"],
    title: "Thân cư Thiên Di — lập nghiệp phương xa",
    source: SRC_TANBIEN,
    content:
      "Thân cư Thiên Di: LẬP NGHIỆP Ở PHƯƠNG XA. Sáng: thịnh vượng ở xa. + Tuần/Triệt/Sát dày: chết ở " +
      "xa nhà. Thân cư cung nào → sự quan trọng của cung đó tăng thêm trong đời. Chỉ khi máy xác nhận " +
      "Thân cư Thiên Di.",
  },
  {
    id: "kn-pp-than-cu-phuc-duc",
    tags: ["thân", "phúc đức", "sống lâu", "hạn"],
    title: "Thân cư Phúc Đức — sáng: sống lâu; mờ: giảm thọ",
    source: SRC_TANBIEN,
    content:
      "Thân cư Phúc Đức: sáng sủa → hưởng phúc SỐNG LÂU, tránh tai họa. Mờ ám → KHÓ TRÁNH TAI HỌA, " +
      "giảm thọ, dù Mệnh sáng cũng không sống lâu. Chỉ khi máy xác nhận Thân cư Phúc Đức.",
  },
  {
    id: "kn-pp-thuan-ly-nghich-ly",
    tags: ["mệnh", "năm sinh", "thuận lý", "nghịch lý", "cách cục"],
    title: "Thuận lý / Nghịch lý giữa năm sinh và cung Mệnh",
    source: SRC_TANBIEN,
    content:
      "Năm sinh thuộc Âm + cung Mệnh thuộc Âm = THUẬN LÝ → độ số gia tăng. Năm Dương + cung Âm (hoặc " +
      "ngược) = NGHỊCH LÝ → độ số giảm thiểu. Kiểm từ payload: birthHeavenlyStem âm/dương + palace " +
      "earthlyBranch âm/dương. Đây là quy tắc nền — đánh giá trước khi luận sâu.",
  },
  {
    id: "kn-pp-tu-tuc-truyen-tinh-chi-tiet",
    tags: ["tử tức", "truyền tinh", "con cái", "sát phá tham", "hạn"],
    title: "Tử Tức truyền tinh chi tiết — Sát-Phá-Tham đẻ con Sát-Phá-Tham thủ Mệnh",
    source: SRC,
    requireAny: ["thất sát", "phá quân", "tham lang"],
    content:
      "Tử Tức có Sát-Phá-Tham + con Sát-Phá-Tham thủ Mệnh = TRUYỀN TINH, sau được nhờ con. Con Tử-Phủ " +
      "hoặc Cơ-Nguyệt thủ Mệnh: KHÔNG truyền tinh, không nhờ. Tử Tức chồng có Tử-Phủ-Vũ-Tướng, vợ có " +
      "Sát-Phá-Tham-Liêm. Tử Tức mình Sát-Phá-Tham đẻ con Cơ-Nguyệt thủ Mệnh: khó nuôi. Chỉ khi Tử " +
      "Tức thật có bộ này và con thật có bộ tương ứng.",
  },
  {
    id: "kn-pp-tu-tuc-sao-xau",
    tags: ["tử tức", "cô thần", "quả tú", "thiên hình", "đẩu quân", "hóa kỵ", "đà la", "địa kiếp", "kiếp sát", "linh tinh", "hỏa tinh", "thiên khốc", "thiên hư", "hạn"],
    title: "Sao xấu đóng Tử Tức — Cô-Quả-Hình-Đẩu-Kỵ-Đà-Kiếp-Linh-Hỏa-Khốc-Hư",
    source: SRC,
    requireAny: ["cô thần", "quả tú", "thiên hình", "đẩu quân", "hóa kỵ", "đà la", "địa kiếp", "kiếp sát", "linh tinh", "hỏa tinh", "thiên khốc", "thiên hư"],
    content:
      "Những sao xấu đóng Tử Tức: Cô Thần, Quả Tú, Thiên Hình, Đẩu Quân, Hóa Kỵ, Đà La, Địa Kiếp, " +
      "Kiếp Sát, Linh Hỏa, Khốc Hư. Đóng nhiều → ít con, khó nuôi, con xa cách. Chỉ khi thật có cùng " +
      "cung.",
  },
  {
    id: "kn-pp-tat-ach-tu-dung",
    tags: ["tật ách", "sát phá không hao", "bệnh tật", "hạn"],
    title: "Tật Ách chỉ cần Tứ Dũng Tinh — Sát, Phá, Không, Hao",
    source: SRC,
    requireAny: ["thất sát", "phá quân", "địa không", "đại hao"],
    content:
      "Tật Ách chỉ cần TỨ DŨNG TINH: Sát (giết bệnh), Phá (phá bệnh), Không (không bệnh), Hao (hao " +
      "bệnh). Thất Sát = giết bệnh đi. Phá Quân = phá bệnh đi. Song Hao = hao bệnh đi. Thiên Không = " +
      "không có bệnh. Tham Lang = THAM BỆNH VÀO — rất xấu; gặp Tuần/Triệt/Phá/Sát/Hao/Không đóng " +
      "Tật Ách thì tốt; gặp Hóa Lộc/Khoa thì bệnh vào nhiều. Chỉ khi sao thật thủ Tật Ách.",
  },
  {
    id: "kn-pp-trang-sinh-sao-xau",
    tags: ["trường sinh", "sao xấu", "bệnh lâu khỏi", "hạn"],
    title: "Tràng Sinh gặp sao xấu — càng phù sao xấu, bệnh SỐNG LÂU",
    source: SRC,
    requireAll: ["trường sinh"],
    content:
      "Tràng Sinh đừng nhầm là tốt — gặp sao xấu thì TRÀNG SINH PHÙ CHO SAO XẤU, bệnh SỐNG GIAI (lâu " +
      "khỏi). Tràng Sinh + Khốc-Hư: nuôi bệnh tăng. Tràng Sinh + Hao: nuôi sự hao tăng. Tràng Sinh " +
      "gặp sao tốt thì ngược lại — phù cho cái tốt. Chỉ khi nhãn Trường Sinh thật cùng cung sao xấu.",
  },

  // ===== PER-PALACE — SAO TỌA THỦ MỆNH/THÂN + BỔ SUNG TỬ TỨC (Tân Biên 4.1-4.2, Sổ Hạ) =====
  {
    id: "kn-pp-cung-dieu-sinh-hoan",
    tags: ["mệnh", "chính diệu", "ngũ hành", "tương sinh", "độ số", "cách cục"],
    title: "Cung Mệnh sinh Chính diệu, Chính diệu sinh Bản Mệnh — thuận lý, độ số gia tăng",
    source: SRC_TANBIEN,
    content:
      "Cung Mệnh sinh Chính diệu tọa thủ, Chính diệu lại sinh Bản Mệnh: THUẬN LÝ — ĐỘ SỐ GIA TĂNG, " +
      "đời nhờ sao mà lên. Ngược lại Chính diệu sinh cung Mệnh, hay cung Mệnh khắc Chính diệu / " +
      "Chính diệu khắc Bản Mệnh: NGHỊCH LÝ — độ số giảm; cung khắc sao đáng lo hơn sao sinh cung. " +
      "Ví dụ Mệnh Mão (Mộc) có Thái Dương (Hỏa), Bản Mệnh Thổ: Mộc sinh Hỏa, Hỏa sinh Thổ. Luận theo " +
      "ngũ hành thật của cung — sao — cục trên lá.",
  },
  {
    id: "kn-pp-menh-sat-bai-xam",
    tags: ["mệnh", "sát tinh", "bại tinh", "phú quý", "thăng giáng", "lao tâm"],
    title: "Mệnh nhiều sao sáng nhưng bị Sát/Bại xâm phạm — phú quý thăng giáng thất thường",
    source: SRC_TANBIEN,
    requireAny: [
      "kình dương", "đà la", "địa không", "địa kiếp", "hỏa tinh", "linh tinh", "hóa kỵ", "thiên hình",
    ],
    content:
      "Cung Mệnh nhiều sao sáng sủa hội hợp nhưng bị nhiều Sát tinh, Bại tinh xâm phạm: vẫn được hưởng " +
      "phú quý NHƯNG thăng giáng thất thường — lúc lên lúc xuống — và hay lao tâm khổ tứ. Luận tài " +
      "chức, công danh phải kèm nhịp lên xuống này: khuyên giữ của lúc đỉnh, chớ dồn hết vốn vào chỗ " +
      "cao. Chỉ khi Mệnh thật nhiều cát và thật có sát xâm phạm.",
  },
  {
    id: "kn-pp-dan-ba-cu-menh",
    tags: ["mệnh", "nữ mệnh", "tứ mộ", "dậu", "tý", "ngọ", "đảm đang", "an nhàn"],
    title: "Nữ mệnh an Tứ Mộ / Dậu / Tý-Ngọ — nét nền theo chi cung Mệnh",
    source: SRC_TANBIEN,
    content:
      "Kinh nghiệm nữ mệnh: cung Mệnh an TỨ MỘ (Thìn-Tuất-Sửu-Mùi) — ĐẢM ĐANG, KHÔN NGOAN; Mệnh an " +
      "DẬU — ra ngoài được nhiều người yêu mến, vị nể; Mệnh an TÝ hay NGỌ — SUỐT ĐỜI AN NHÀN. Dùng " +
      "chấm nét nền trước, rồi đọc sao thật trong cung để chốt giọng khen chê, chớ kết luận chỉ vì chi.",
  },
  {
    id: "kn-pp-than-cu-phu-the",
    tags: ["thân", "phu thê", "hôn nhân", "thái âm", "tuần", "triệt"],
    title: "Thân cư Phu-Thê — nặng chuyện vợ chồng, đoán theo sao trong cung",
    source: SRC_TANBIEN,
    content:
      "Thân cư Thê Thiếp (hay Phu Quân): sự quan trọng của cung hôn nhân tăng hẳn trong đời. Thái Âm " +
      "tọa thủ: đàn ông NỂ VỢ, SỢ VỢ, thường nhờ vả nhà vợ. Tuần hay Triệt án ngữ: TRẮC TRỞ VỀ HÔN " +
      "PHỐI, hay buôn thương vị tình — chuyện tình cảm cản việc làm ăn. Luận kèm sao thật của cung " +
      "Phu-Thê. Chỉ khi máy xác nhận Thân cư cung Phu-Thê.",
  },
  {
    id: "kn-pp-than-cu-tai-bach",
    tags: ["thân", "tài bạch", "tiền bạc", "buôn bán", "song hao", "hỏa hoạn"],
    title: "Thân cư Tài Bạch — danh trước tài sau, hay giàu nhờ buôn bán",
    source: SRC_TANBIEN,
    content:
      "Thân cư Tài Bạch: có Cơ-Nguyệt-Đồng-Lương hay Sát-Phá-Liêm-Tham sáng sủa hội hợp — CÓ DANH " +
      "TRƯỚC, CÓ TIỀN TÀI SAU. Song Hao cùng Quyền-Lộc-Kiếp-Hỏa: BUÔN BÁN MÀ GIÀU; thêm Phục Bình, " +
      "Kình Dương: chớ buôn vải bông và ĐỀ PHÒNG HỎA HOẠI. Hạn có Lưu Kiếp mà sống bằng nghề đánh cá " +
      "hay buôn qua sông nước: cẩn trọng thủy nạn. Chỉ khi máy xác nhận Thân cư Tài Bạch + các sao thật.",
  },
  {
    id: "kn-pp-than-cu-quan-loc",
    tags: ["thân", "quan lộc", "công danh", "muộn", "tang môn", "bạch hổ", "hóa kỵ"],
    title: "Thân cư Quan Lộc — muộn đường công danh; nữ khó giữ danh tiết khi hội sát",
    source: SRC_TANBIEN,
    content:
      "Thân cư Quan Lộc: Tuần hay Triệt án ngữ + Kiếp Sát hoặc Hóa Kỵ hội hợp — đàn ông MUỘN ĐƯỜNG " +
      "CÔNG DANH; nếu thêm nhiều sao sáng thì ngoài 40 tuổi mới nhẹ bước thang mây. Tuần/Triệt + nhiều " +
      "Sát tinh: đàn bà KHÓ GIỮ TOÀN DANH TIẾT; thêm Tang Môn-Bạch Hổ: góa bụa cô đơn, hay muộn đường " +
      "chồng con. Chỉ khi máy xác nhận Thân cư Quan Lộc + các sao thật trong cung.",
  },
  {
    id: "kn-pp-menh-tu-vi",
    tags: [
      "mệnh", "tử vi", "đế tọa", "phú quý", "tứ sát", "hóa khoa", "hóa quyền", "hóa lộc",
    ],
    title: "Tử Vi thủ Mệnh — phúc thọ; cần Khoa-Quyền-Lộc, kỵ Tứ Sát vùi dập",
    source: SRC_TANBIEN,
    requireAll: ["tử vi"],
    content:
      "Tử Vi thủ Mệnh: dáng đẫy đà cao, mặt đầy, thông minh, PHÚC THỌ SONG TOÀN. Miếu/bình hòa: nhân " +
      "hậu thẳng thắn, về già khiêm cung; vượng/đắc: nhiều mưu cơ. Tử Vi cần Khoa-Quyền-Lộc và hội " +
      "Tử-Phủ-Vũ-Tướng-Xương-Khúc-Khôi-Việt-Tả-Hữu: UY QUYỀN HIỂN HÁCH, giàu sang trọn đời. Ngược lại " +
      "gặp Kình-Đà-Không-Kiếp: như hoa bị mưa gió vùi dập — công danh trắc trở. Chỉ khi Tử Vi thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-tu-vi-tham-lang",
    tags: ["mệnh", "tử vi", "tham lang", "mão", "dậu", "tu hành", "yếm thế"],
    title: "Tử Vi + Tham Lang đồng cung Mão/Dậu — bi quan, nghiêng đạo; tu hành yên thân",
    source: SRC_TANBIEN,
    requireAll: ["tử vi", "tham lang"],
    content:
      "Mệnh Mão/Dậu có Tử Vi-Tham Lang đồng cung: người YẾM THẾ, nhìn đời bằng con mắt bi quan, hay " +
      "muốn lánh mình khỏi chốn phồn tạp để học đạo, tu dưỡng. Còn lăn lộn phồn tạp thì vẫn lao khổ; " +
      "SỚM BIẾT TU HÀNH tất được yên thân và hưởng phúc. Khuyên theo hướng thiền, tâm linh, việc thiện " +
      "để giải bức bối. Chỉ khi máy xác nhận Tử-Tham thật đồng cung ở Mệnh.",
  },
  {
    id: "kn-pp-menh-liem-trinh",
    tags: ["mệnh", "liêm trinh", "kỹ nghệ", "tù tội", "tai nạn", "ly tổ"],
    title: "Liêm Trinh thủ Mệnh — sáng: liêm khiết dũng mãnh; hãm: vất vả, nên lập nghiệp xa",
    source: SRC_TANBIEN,
    requireAll: ["liêm trinh"],
    content:
      "Liêm Trinh thủ Mệnh: cao lớn, xương lộ, nét mặt nghiêm. Miếu/vượng/đắc: LIÊM KHIẾT THẲNG THẮN, " +
      "can đảm dũng mãnh, giàu sang sống lâu; thêm Kình-Đà-Hỏa-Linh thì hay bị bắt bớ giam cầm, thậm " +
      "chí bị ám hại. Hãm địa: khéo tay, thích đua chen, hay chuyên kỹ nghệ-máy móc, nhưng vất vả, " +
      "nhiều bệnh tật, khó tránh tù tội-tai nạn — NÊN LY TỔ LẬP NGHIỆP Ở PHƯƠNG XA. Chỉ khi Liêm thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-thien-dong",
    tags: ["mệnh", "thiên đồng", "khoan hòa", "thay đổi", "đồng lương", "dần", "thân"],
    title: "Thiên Đồng thủ Mệnh — khoan hòa nhưng hay thay đổi; Đồng-Lương Dần/Thân rất quý",
    source: SRC_TANBIEN,
    requireAll: ["thiên đồng"],
    content:
      "Thiên Đồng thủ Mệnh: nở nang, da trắng, KHOAN HÒA NHÂN HẬU nhưng không bền chí, hay thay đổi ý " +
      "kiến, công việc, chỗ ở. Miếu/vượng: giàu sang, phúc thọ song toàn; hãm: nông nổi, thích chơi " +
      "bời, hay mang tiếng thị phi, hợp đi buôn. Dần/Thân có Đồng-Lương đồng cung: RẤT RỰC RỠ — phú " +
      "quý tột bậc, phúc thọ song toàn. Chỉ khi Thiên Đồng thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-vu-khuc",
    tags: ["mệnh", "vũ khúc", "quả tú", "cách biệt", "kinh doanh", "tài chính"],
    title: "Vũ Khúc thủ Mệnh — tính Quả Tú cách biệt thân nhân; óc kinh doanh cương quyết",
    source: SRC_TANBIEN,
    requireAll: ["vũ khúc"],
    content:
      "Vũ Khúc thủ Mệnh mang tính QUẢ TÚ: hay cách biệt người thân — không khắc cha mẹ anh em thì " +
      "khắc vợ chồng, con, hoặc hiếm con. Miếu/vượng/đắc: có chí lớn, tài tổ chức, ÓC KINH DOANH, " +
      "cương quyết hiếu thắng mà thẳng — giàu sang, sống lâu; thêm Xương/Khúc: tài kiêm văn võ. Hãm: " +
      "kém sáng, tham lận, thường phải bỏ nhà đi làm thợ hay lập nghiệp xa. Chỉ khi Vũ Khúc thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-vu-tham-kiem-kiep",
    tags: ["mệnh", "vũ khúc", "tham lang", "sửu", "mùi", "địa kiếp", "kiếp sát", "sa sút"],
    title: "Vũ-Tham Sửu/Mùi gặp Kiếp — ngược lộ trình: trước giàu, sau 30 sa sút nghèo",
    source: SRC_TANBIEN,
    requireAll: ["vũ khúc", "tham lang"],
    requireAny: ["địa kiếp", "kiếp sát"],
    content:
      "Vũ Khúc-Tham Lang Sửu/Mùi vốn 'tiền bần hậu phú' — sau 30 mới phát. NHƯNG nếu đồng cung thêm " +
      "Địa Kiếp hay Kiếp Sát cùng nhiều sát tinh: ĐẢO NGƯỢC thành TRƯỚC GIÀU SAU NGHÈO — lúc thiếu " +
      "thời được hưởng giàu sang, từ ngoài 30 tuổi sa sút dần và càng về già càng nghèo túng. Khuyên " +
      "giữ vốn, tránh đầu tư mạo hiểm sau trung vận. Chỉ khi Vũ-Tham thật đồng cung + Kiếp thật có.",
  },
  {
    id: "kn-pp-menh-thai-duong",
    tags: ["mệnh", "thái dương", "mắt", "đau đầu", "ly tổ", "thiên hình"],
    title: "Thái Dương thủ Mệnh — sáng: cương nghị nhân hậu; hãm: mắt kém, đau đầu; kỵ Hình hại mắt",
    source: SRC_TANBIEN,
    requireAll: ["thái dương"],
    content:
      "Thái Dương thủ Mệnh: miếu/vượng — đẫy đà, mặt vuông uy nghi, THẲNG THẮN CƯƠNG NGHỊ hơi nóng " +
      "nảy nhưng nhân hậu, giàu sang sống lâu. Hãm: gầy, nét buồn, ương gàn, không bền chí, MẮT KÉM, " +
      "hay đau đầu-thần kinh-khí huyết, nên sớm ly tổ lập nghiệp xa. Dù miếu hay hãm mà có Thiên Hình " +
      "đồng cung: MẮT HAY BỊ TẬT do kim khí bén nhọn chạm vào. Chỉ khi Thái Dương thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-thien-co",
    tags: ["mệnh", "thiên cơ", "mưu trí", "y dược", "kỹ nghệ", "kinh doanh"],
    title: "Thiên Cơ thủ Mệnh — thông minh mưu trí; tổ hợp quyết hướng y dược hay kỹ nghệ",
    source: SRC_TANBIEN,
    requireAll: ["thiên cơ"],
    content:
      "Thiên Cơ thủ Mệnh: cao, xương lộ, RẤT THÔNG MINH, có óc kinh doanh, mưu trí, biết quyền biến — " +
      "giàu sang sống lâu. Cơ sáng + Tả-Hữu-Lộc-Hình-Y-Quang-Quý: hay chuyên Y KHOA-DƯỢC KHOA; + " +
      "Tả-Hữu-Linh-Hình: khéo tay, chuyên kỹ nghệ-máy móc-thủ công; + nhiều văn tinh: quý hiển. Hãm: " +
      "gian xảo, hay buôn bán ngược xuôi. Chọn nghề nên bám tổ hợp thật. Chỉ khi Thiên Cơ thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-thien-phu",
    tags: ["mệnh", "thiên phủ", "khoan hồng", "mưu cơ", "tuần", "triệt", "không kiếp"],
    title: "Thiên Phủ thủ Mệnh — khoan hồng chín chắn; kỵ Tuần-Triệt-Không-Kiếp 'phá kho'",
    source: SRC_TANBIEN,
    requireAll: ["thiên phủ"],
    content:
      "Thiên Phủ thủ Mệnh: đầy đặn da trắng, nét thanh tú, KHOAN HỒNG NHÂN HẬU, ưa từ thiện, biết suy " +
      "tính, có mưu cơ gỡ khó — phúc, giàu sang sống lâu. Phủ RẤT KỴ Tuần/Triệt án ngữ hay " +
      "Không-Kiếp hội: thành ương ngạnh, ăn hoang tiêu rộng, phiêu lưu viển vông — SUỐT ĐỜI TÚNG " +
      "THIẾU; nhiều Sát hội: hay đánh lừa nói dối. Phủ cần Tử-Tướng-Xương-Khúc-Khôi-Việt-Tả-Hữu cùng " +
      "Khoa-Quyền-Lộc. Chỉ khi Thiên Phủ thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-thai-am",
    tags: ["mệnh", "thái âm", "văn chương", "quyền hành", "hợi", "mắt", "thiên hình"],
    title: "Thái Âm thủ Mệnh — dịu dàng văn chương; Hợi nắm quyền; kỵ Hình hại mắt",
    source: SRC_TANBIEN,
    requireAll: ["thái âm"],
    content:
      "Thái Âm thủ Mệnh: to cao da trắng, THÔNG MINH KHOAN HÒA, ưa văn chương-mỹ thuật, giàu sang " +
      "sống lâu. Mệnh Hợi có Âm: NGUYỆT LÃNG THIÊN MÔN — nắm quyền hành lớn, đứng trên sai khiến " +
      "muôn người; Tý: đắc cách, có tài can gián. Hãm: ương ngạnh, chơi bời, vất vả, mắt kém. Dù " +
      "miếu hay hãm mà có Thiên Hình đồng cung: MẮT HAY BỊ TẬT. Chỉ khi Thái Âm thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-tham-lang",
    tags: [
      "mệnh", "tham lang", "tham dục", "kinh doanh", "30 tuổi", "đào hoa", "kình dương", "đà la",
    ],
    title: "Tham Lang thủ Mệnh — ham muốn lớn, siêng đầu rồi bỏ dở, phát sau 30; kỵ Kình/Đà Hợi-Tý",
    source: SRC_TANBIEN,
    requireAll: ["tham lang"],
    content:
      "Tham Lang thủ Mệnh: cao lớn rậm rạp, THAM DỤC KHÔNG BỜ BẾN, ưa hoạt động, có óc kinh doanh-tài " +
      "tổ chức; việc gì cũng siêng buổi đầu rồi LƯỜI BỎ DỞ. Miếu/vượng: từ ngoài 30 tuổi PHÚ QUÝ SONG " +
      "TOÀN, càng già càng an nhàn. Hãm Tý-Ngọ-Tỵ-Hợi: gian hiểm, chơi bời; Hợi-Tý thêm Kình/Đà: " +
      "PHIẾM THỦY ĐÀO HOA — hoang đàng, nay đây mai đó. Khuyên cắt bớt mục tiêu, hoàn thành từng việc. " +
      "Chỉ khi Tham Lang thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-tham-xuong",
    tags: ["mệnh", "tham lang", "văn xương", "bạch biến", "da", "sức khỏe"],
    title: "Tham Lang + Văn Xương đồng cung Mệnh — hay mắc bệnh da (bạch biến, lang ben)",
    source: SRC_TANBIEN,
    requireAll: ["tham lang", "văn xương"],
    content:
      "Mệnh có Tham Lang-Văn Xương đồng cung: hay mắc BỆNH DA — bạch biến, lang ben, da loang lổ " +
      "trông xấu. Khuyên chăm sóc da sớm: tránh nắng gắt, hóa chất, khám da liễu định kỳ; coi đây là " +
      "điểm yếu sức khỏe nền của lá. Chỉ khi máy xác nhận Tham-Xương thật đồng cung ở Mệnh.",
  },
  {
    id: "kn-pp-menh-cu-mon",
    tags: ["mệnh", "cự môn", "khẩu thiệt", "hóa lộc", "tuần", "triệt", "lộc tồn", "hóa kỵ"],
    title: "Cự Môn thủ Mệnh — ngọc trong đá cần Hóa Lộc/Tuần-Triệt; kỵ Lộc Tồn chìm, Kỵ gây nạn",
    source: SRC_TANBIEN,
    requireAll: ["cự môn"],
    content:
      "Cự Môn thủ Mệnh: ăn nói ĐANH THÉP, mưu cơ, trí xét đoán sáng, hợp nghề luật-giảng dạy-ngoại " +
      "giao. Tý-Ngọ là THẠCH TRUNG ẨN NGỌC: cần Hóa Lộc đồng cung hay Tuần-Triệt án ngữ thì ngọc lộ " +
      "sáng, phú quý; gặp Lộc Tồn đồng cung thì ngọc nằm lỳ — đa học đa năng mà KHÔNG GẶP THỜI. Hãm " +
      "Thìn-Tuất-Sửu-Mùi: đa nghi, nói lác, hay thị phi kiện cáo; + Hóa Kỵ đồng cung: khó tránh tai " +
      "nạn sông nước hay xe cộ. Chỉ khi Cự thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-thien-tuong",
    tags: ["mệnh", "thiên tướng", "đôn hậu", "bề ngoài", "tuần", "triệt", "kình dương", "đà la"],
    title: "Thiên Tướng thủ Mệnh — đôn hậu ưa bề ngoài; kỵ Tuần-Triệt; Kình-Đà hóa kinh doanh",
    source: SRC_TANBIEN,
    requireAll: ["thiên tướng"],
    content:
      "Thiên Tướng thủ Mệnh: nở nang da trắng, vẻ uy nghi, tính ĐÔN HẬU THẲNG THẮN nhưng thích ăn ngon " +
      "mặc đẹp, chuộng thanh sắc bề ngoài. Miếu/vượng + Tử-Phủ-Vũ-Xương-Khúc-Khôi-Việt-Tả-Hữu-Khoa-Quyền: " +
      "phú quý tột bậc, danh tiếng. Vượng + Kình-Đà: chuyên kỹ nghệ-kinh doanh, nhiều tiền của. GẶP " +
      "TUẦN hay TRIỆT án ngữ: khổ cực, công danh trắc trở, dễ tai họa dao gươm-súng đạn. Chỉ khi Tướng thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-thien-luong",
    tags: ["mệnh", "thiên lương", "thọ", "ngọ", "pháp lý", "sư phạm", "văn tài"],
    title: "Thiên Lương thủ Mệnh — khoan hòa thọ lâu; Ngọ quan tư hiển; + Xương-Khúc-Tuế dạy học",
    source: SRC_TANBIEN,
    requireAll: ["thiên lương"],
    content:
      "Thiên Lương thủ Mệnh: thon cao da trắng, KHOAN HÒA, được tuổi thọ lâu dài. Lương sáng: thông " +
      "minh nhân hậu, giàu sang trọn đời; Mệnh Ngọ có Lương: QUAN TƯ THANH HIỂN — hay làm pháp lý, " +
      "xét xử. + Xương-Khúc-Tuế: văn tài lỗi lạc, hay chuyên SƯ PHẠM, dạy học. Hãm Tỵ-Hợi-Dậu: chơi " +
      "bời phóng đãng, hay đổi chí hướng-nghề nghiệp, ly tổ bôn ba. Chỉ khi Thiên Lương thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-that-sat",
    tags: ["mệnh", "thất sát", "cương quyết", "thăng trầm", "võ nghiệp", "thiên hình", "tù tội"],
    title: "Thất Sát thủ Mệnh — dũng mãnh nhưng thăng trầm; + Hình oai phong; hãm dễ tai nạn",
    source: SRC_TANBIEN,
    requireAll: ["thất sát"],
    content:
      "Thất Sát thủ Mệnh: ương ngạnh, nóng nảy, làm gì cũng muốn chóng xong. Miếu/vượng/đắc: CAN ĐẢM " +
      "DŨNG MÃNH, có mưu, nói lớn mà được tin phục — giàu sang sống lâu nhưng ĐỜI NHIỀU BƯỚC THĂNG " +
      "TRẦM; + Thiên Hình: oai phong lẫm liệt, biệt tài quân sự, hay hiển đạt võ nghiệp. Hãm: hung " +
      "bạo, hay nghề đồ tể-thợ rèn; + Hình hãm: khó tránh tù tội hay tai nạn xe cộ-dao súng. Chỉ khi " +
      "Thất Sát thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-pha-quan",
    tags: ["mệnh", "phá quân", "thăng trầm", "hỏa tinh", "linh tinh", "bôn ba", "độc lập"],
    title: "Phá Quân thủ Mệnh — cương quả thích đi xa, tài như mây nổi; + Hỏa-Linh bôn ba",
    source: SRC_TANBIEN,
    requireAll: ["phá quân"],
    content:
      "Phá Quân thủ Mệnh: thông minh CƯƠNG QUẢ, hiếu thắng, ưa hoạt động, thích đi xa. Miếu/vượng: " +
      "giàu sang sống lâu nhưng CÔNG DANH TIỀN TÀI NHƯ MÂY NỔI — tụ tán thất thường; Tý-Ngọ: đắc cách, " +
      "phú quý song toàn. + Hỏa-Linh: SUỐT ĐỜI BÔN BA LAO KHỔ. Hãm: ương ngạnh nham hiểm, khéo tay, " +
      "hay kỹ nghệ-máy móc, vất vả nhiều bệnh tật, nên ly tổ. Chỉ khi Phá Quân thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-xuong-khuc",
    tags: ["mệnh", "văn xương", "văn khúc", "văn tài", "âm nhạc", "thi cử", "thủ công"],
    title: "Xương/Khúc thủ Mệnh — thanh tú thông minh văn tài; hãm khéo tay nghề thủ công",
    source: SRC_TANBIEN,
    requireAny: ["văn xương", "văn khúc"],
    content:
      "Văn Xương hay Văn Khúc thủ Mệnh: nét thanh khôi, tai thính mắt sáng, THÔNG MINH HỌC RỘNG, có " +
      "văn tài và năng khiếu âm nhạc, hay có nốt ruồi kín hợp quý tướng. Đắc địa + Tử-Phủ-Khôi-Việt-" +
      "Tả-Hữu-Khoa-Quyền-Lộc: THI ĐỖ CAO, sớm hiển đạt, phú quý sống lâu. Hãm: làm nghề thủ công-kỹ " +
      "nghệ-mỹ nghệ rất khéo, sau cùng khá giả. Chỉ khi Xương/Khúc thật tọa Mệnh.",
  },
  {
    id: "kn-pp-menh-hung-13-tuoi",
    tags: ["mệnh", "trẻ em", "ác sát", "hung tinh", "13 tuổi"],
    title: "Mệnh trẻ đầy Ác Sát — sống qua 13 tuổi thì không lo ngại nữa",
    source: SRC,
    content:
      "Mệnh đứa trẻ đầy rẫy Ác Sát-Hung tinh: NẾU ĐÃ SỐNG ĐƯỢC NGOÀI 13 TUỔI thì không lo ngại nữa — " +
      "vì nó đã 'quen' với các vị ấy; người ta hầu như không chết ở hạn đi tới Bản Mệnh trong vòng 13 " +
      "tuổi. Luận số trẻ em: đừng vội kết án nặng từ tổ hợp sát, chỉ nêu xu hướng và khuyên theo dõi. " +
      "Chỉ dùng khi máy xác nhận Mệnh thật nhiều sát.",
  },
  {
    id: "kn-pp-tu-tuc-cu-nguyet-40",
    tags: [
      "tử tức", "cơ nguyệt đồng lương", "kình dương", "đà la", "cô thần", "quả tú", "khó nuôi",
    ],
    title: "Tử Tức Cơ-Nguyệt-Đồng-Lương hội Kình-Đà-Cô-Quả — con khó nuôi, mẹ ngoài 40 nuôi được",
    source: SRC,
    requireAny: ["kình dương", "đà la", "cô thần", "quả tú"],
    content:
      "Cung Tử Tức có bộ Cơ-Nguyệt-Đồng-Lương mà hội Kình-Đà-Cô-Quả: đứa con sinh ra cũng theo bộ sao " +
      "đó thủ Mệnh — XẤU, KHÓ NUÔI. Kinh nghiệm: người mẹ NGOÀI 40 TUỔI thì nuôi được, vì các sao đã " +
      "'yếu' đi sau bốn mươi năm, đỡ hung. Mẹ còn trong 40 mà nuôi được thì đứa trẻ ấy cũng bền vì đã " +
      "quen. Dùng khi luận chuyện sinh con-nuôi dưỡng. Chỉ khi Tử Tức thật có cả bộ + sát.",
  },
  {
    id: "kn-pp-tu-tuc-cuu-menh",
    tags: ["tử tức", "mệnh", "cát", "nhờ con", "hậu vận"],
    title: "Mệnh hung mà Tử cung cát — đời hóa tốt nhờ con cái",
    source: SRC,
    content:
      "Cổ nhân: MỆNH HUNG NHI CÁT, DO HỮU TỬ CUNG CÁT; Mệnh cát mà hung, do Tử cung hung. Mệnh xấu " +
      "mà cung con cái tốt: đời HÓA TỐT NHỜ CON — nghèo nhưng con cái hay thì về già được nhờ, dòng " +
      "giống bền. Ngược lại Mệnh tốt mà Tử Tức xấu thì kém cái cốt tử nhất. Luận mệnh-xấu đừng vội " +
      "chốt: soi Tử Tức trước. Chỉ khi máy xác nhận cung Tử Tức + sao thật của cung.",
  },
  {
    id: "kn-pp-menh-net-mat",
    tags: [
      "mệnh", "nét mặt", "ngoại hình", "cơ nguyệt đồng lương", "sát phá tham liêm", "tử phủ vũ tướng",
    ],
    title: "Nét mặt theo bộ sao thủ Mệnh — hiền hậu / oai nghiêm / bệ vệ",
    source: SRC,
    content:
      "Kinh nghiệm nét mặt theo bộ sao thủ Mệnh: Cơ-Nguyệt-Đồng-Lương HIỀN HẬU; Sát-Phá-Tham-Liêm OAI " +
      "NGHIÊM; Tử-Phủ-Vũ-Tướng BỆ VỆ; Bạch Hổ: oai, trán cao, mắt to; Hồng-Đào: vui buồn thất thường; " +
      "Hỏa-Linh: hay nhăn nhó; Kiếp-Không: đen tái; Khốc-Hư: trán đen bóng; Đồng-Âm đắc địa: xuân sắc " +
      "lâu phai; Âm-Dương đắc địa: càng già mắt càng sáng. Dùng khớp miêu tả con người cho tự nhiên.",
  },

  // ===== MẠCH B — HỆ THỐNG ĐẠI HẠN × TIỂU HẠN (Sổ TVKN Quyển Hạ) =====
  {
    id: "kn-han2-ma-tran-dai-tieu",
    tags: ["đại hạn", "tiểu hạn", "lưu niên", "thái tuế", "hệ thống", "hạn"],
    title: "Ma trận ĐẠI hạn 10 năm × TIỂU hạn 1 năm — 4 tổ hợp đọc hạn",
    source: SRC,
    content:
      "Hệ quy tắc đọc hạn: 10 năm XẤU gặp 1 năm tốt → bình thường; 10 năm TỐT gặp 1 năm xấu → đỡ xấu " +
      "(vẫn tốt); 10 năm tốt gặp 1 năm tốt → ĐẠI PHÁT ĐẠT; 10 năm xấu gặp 1 năm xấu → ĐẠI CƠ CỰC. " +
      "Luận năm nào cũng phải đặt tiểu hạn VÀO nền đại hạn trước — chớ chấm điểm năm cô lập.",
  },
  {
    id: "kn-han2-nghi-ly-tuan-triet-han",
    tags: ["tuần không", "triệt lộ", "nghịch lý", "hệ thống", "hạn"],
    title: "Nghịch lý Tuần/Triệt trong hạn — 5 cung xấu gặp Triệt: không sao; 5 cung đẹp gặp Tuần: mất vẻ đẹp",
    source: SRC,
    requireAny: ["tuần không", "tuần trung", "triệt lộ", "triệt không"],
    content:
       "Hệ quy tắc nghịch lý: HẠN 5 CUNG ĐỀU XẤU mà gặp Triệt ngay đấy — KHÔNG SAO (Triệt chặn luôn " +
       "họa); HẠN 5 CUNG ĐỀU ĐẸP mà gặp Tuần ngay đấy — MẤT VẺ ĐẸP (Tuần khóa luôn phúc). Phụ: tam " +
       "phương đầy sát gặp Triệt có thể cứu, tứ hướng hội Tuần-Không đối trực. Quy tắc đảo chiều — " +
       "Triệt/Tuần không luôn là xấu trong hạn.",
  },

  // ===== MẠCH A2 — CƠ CHẾ SAO VẬN/LƯU (12 mẩu, nguồn Vương Đình Chi) =====
  // Vận X = Lưu bản-sao của đại vận (Vận Xương chính là Lưu Văn Xương). Gate nhắm
  // ĐÚNG nhãn iztro "[SAO VẬN] Vận X" (poolHas khớp substring nên "vận xương"
  // khớp "[SAO VẬN] Vận Xương"). VDC nói rõ cơ chế vận: ĐIỆP (Khôi Việt), XUNG
  // (Mã × Thiên Mã/Tuế Dịch), GIAO TRỜI (Mã × Lộc), THỦY HIỂM (Xương Đà Kỵ).
  {
    id: "kn-han2-van-khoi-viet-diep",
    tags: ["vận khôi", "vận việt", "lưu khôi", "lưu việt", "quý nhân", "điệp", "hạn"],
    title: "Vận Khôi điệp Vận Việt — quý lực lớn, xem cung trùng để biết hỷ sự",
    source: SRC_VDC,
    requireAll: ["vận khôi", "vận việt"],
    content:
      "Hạn: Vận Khôi điệp Vận Việt (Lưu Thiên Khôi/Việt của đại vận trùng nhau) — phải ĐIỆP mới " +
      "phát lực lớn; trùng ở cung nào thì hỷ sự ở đó: Phu Thê chủ năm cưới/than hỏi, Tử Tức chủ tin " +
      "sinh con. Khôi Việt bẩm sinh GIÁP cung nào, lưu điệp xung kích đúng cung đó thì lực phát " +
      "đầy đủ nhất. CHỈ nêu khi cả hai nhãn Vận Khôi + Vận Việt thật có.",
  },
  {
    id: "kn-han2-van-khoi-viet-don",
    tags: ["vận khôi", "vận việt", "lưu khôi", "lưu việt", "quý nhân", "cơ hội", "hạn"],
    title: "Vận/Lưu Khôi Việt đơn — quý nhân mức vừa, cơ hội gắn quy chế",
    source: SRC_VDC_REL,
    requireAny: ["vận khôi", "vận việt", "lưu khôi", "lưu việt"],
    content:
      "Hạn: Vận Khôi/Việt hoặc Lưu Khôi/Việt đơn thủ — quý nhân mức vừa, hai nghĩa chắc nhất: cơ hội " +
      "thăng tiến/việc làm và thi cử–tuyển chọn gắn quy chế. Điệp cả hai (mẩu trên) thì mạnh hơn hẳn. " +
      "Nói nhẹ tay, gắn đúng cung trùng; không khẳng định chắc chắn có người giúp đỡ.",
  },
  {
    id: "kn-han2-van-ma-cham-thien-ma",
    tags: ["vận mã", "lưu thiên mã", "thiên mã", "xung", "dịch chuyển", "động", "hạn"],
    title: "Vận/Lưu Mã chạm/xung Thiên Mã bẩm sinh — động: đi xa, xê dịch dồn",
    source: SRC_VDC,
    requireAll: ["thiên mã"],
    requireAny: ["vận mã", "lưu thiên mã"],
    content:
      "Hạn: Vận Mã (đại hạn) hoặc Lưu Thiên Mã (lưu niên) cùng độ hoặc XUNG Thiên Mã bẩm sinh — ĐỘNG " +
      "CHÂN, hai nghĩa chắc nhất: chuyến đi xa kéo dài và thay đổi chỗ ở hoặc chỗ làm. Lưu niên Phúc " +
      "Đức gặp cũng chủ tương tự. Nói đúng domain xê dịch theo cung; không phóng đại thành chuyển nhà.",
  },
  {
    id: "kn-han2-van-ma-xung-tue-dich",
    tags: ["vận mã", "lưu thiên mã", "tuế dịch", "xung", "xê dịch", "hạn"],
    title: "Vận/Lưu Mã xung Tuế Dịch — động xa rõ, đi lại nhiều lần",
    source: SRC_VDC,
    requireAll: ["tuế dịch"],
    requireAny: ["vận mã", "lưu thiên mã"],
    content:
      "Hạn: Vận Mã (đại hạn) hoặc Lưu Thiên Mã xung Tuế Dịch (vòng Tuế Tiền) — động tượng RÕ: đi xa " +
      "dài ngày hoặc di chuyển nhiều lần trong chặng/năm. Gặp sát kỵ cùng trục thì xê dịch mệt mỏi, " +
      "cẩn trọng chuyện lộn xộn trên đường. Neo cung trùng để nói đúng chuyện đời.",
  },
  {
    id: "kn-han2-van-ma-loc-giao-tri",
    tags: ["vận mã", "lưu thiên mã", "lộc tồn", "lộc mã giao trì", "xa phương phát tài", "hạn"],
    title: "Vận/Lưu Mã + Lộc Tồn — Lộc Mã giao trì: động mà có tài, phát xa phương",
    source: SRC_VDC,
    requireAll: ["lộc tồn"],
    requireAny: ["vận mã", "lưu thiên mã"],
    content:
      "Hạn: Vận Mã (đại hạn) hoặc Lưu Thiên Mã gặp Lộc Tồn (bẩm sinh hoặc bản lưu) — LỘC MÃ GIAO " +
      "TRỜI, hai nghĩa chắc nhất: động mà có tài và phát ở xa phương (kinh doanh bán ra ngoài vùng " +
      "quen thuộc). Khuyên may đo: cơ hội xuất cảnh đáng cân nhắc; không động thì lộc cũng nằm im.",
  },
  {
    id: "kn-han2-van-xuong-khuc-dong",
    tags: ["vận xương", "vận khúc", "lưu văn xương", "lưu văn khúc", "động", "văn thư", "hạn"],
    title: "Vận/Lưu Xương Khúc — bản vận/lưu của Văn Xương/Khúc cũng chủ động",
    source: SRC_VDC,
    requireAny: ["vận xương", "vận khúc", "lưu văn xương", "lưu văn khúc"],
    content:
      "Hạn: Vận Xương/Khúc (đại vận) hoặc Lưu Văn Xương/Khúc (lưu niên) cũng chủ ĐỘNG, hai nghĩa chắc " +
      "nhất: giấy tờ văn thư sôi động lại và thi cử–học hành có tin. Đan với thẻ sự kiện lưu niên để " +
      "ra chuyện đời cụ thể; cấm kể sao khô.",
  },
  {
    id: "kn-han2-van-xuong-da-thuy-hiem",
    tags: ["vận xương", "vận đà", "hóa kỵ", "thủy hiểm", "linh xương đà vũ", "hạn"],
    title: "Vận Xương + Vận Đà + Kỵ — Linh Xương Đà Vũ bản vận: cảnh giắc thủy hiểm",
    source: SRC_VDC,
    requireAll: ["vận xương", "vận đà"],
    requireAny: ["hóa kỵ", "vận hóa kỵ", "lưu hóa kỵ"],
    content:
      "Hạn: Vận Xương + Vận Đà xung kích mà gặp Hóa Kỵ (bẩm sinh/lưu) — bản vận của Linh Xương Đà Vũ: " +
      "rủi ro THỦY HIỂM rất lớn (sông nước, lặn lội, đường thủy). Gốc chỉ Vũ Khúc + Linh Tinh ở " +
      "Thìn/Tuất thì giảm mức. Khuyên tỉnh táo: cẩn trọng hoạt động dưới nước, chuyến đi đường thủy " +
      "trong chặng này — không hù dọa.",
  },
  {
    id: "kn-han2-van-hoa-ky-xung",
    tags: ["vận hóa kỵ", "lưu hóa kỵ", "xung", "bất an", "ám trệ", "hạn"],
    title: "Vận/Lưu Hóa Kỵ xung — tinh thần không vui, nặng thì ám trệ",
    source: SRC_VDC,
    requireAny: ["vận hóa kỵ", "lưu hóa kỵ"],
    content:
      "Hạn: Vận Hóa Kỵ (đại vận) hoặc Lưu Hóa Kỵ (lưu niên) xung kích, hai nghĩa chắc nhất: tinh thần " +
      "không vui và nặng thì vận/năm ám trệ. Đọc kèm sao thụ Hóa thật (máy ghi trong ngoặc) và block " +
      "Phi Đại vận / Phi Lưu niên để nói đúng domain; không gộp nhầm với Hóa Kỵ bẩm sinh.",
  },
  {
    id: "kn-han2-van-loc-nen",
    tags: ["vận lộc", "lưu lộc tồn", "lộc tồn", "y lộc", "hạn"],
    title: "Vận/Lưu Lộc — nền y lộc của chặng vận/năm",
    source: SRC_VDC_REL,
    requireAny: ["vận lộc", "lưu lộc tồn"],
    content:
      "Hạn: Vận Lộc (bản vận Lộc Tồn) hoặc Lưu Lộc Tồn — nền y lộc chặng vận/năm: thu nhập ổn định " +
      "hơn, có của ăn theo. Thích gặp Mã thành Lộc Mã giao trì (mẩu riêng); gặp Không/Kiếp hoặc Kỵ " +
      "thì lộc bị khoét — hạ giọng, nói đủ thực.",
  },
  {
    id: "kn-han2-van-loan-hy-hi-su",
    tags: ["vận loan", "vận hỷ", "lưu hồng loan", "lưu thiên hỷ", "tin vui", "hạn"],
    title: "Vận/Lưu Loan Hỷ — tin vui hỷ tín trong chặng vận/năm",
    source: SRC_VDC_REL,
    requireAny: ["vận loan", "vận hỷ", "lưu hồng loan", "lưu thiên hỷ"],
    content:
      "Hạn: Vận Loan/Hỷ (đại vận) hoặc Lưu Hồng Loan/Thiên Hỷ (lưu niên) — hai nghĩa chắc nhất: cưới " +
      "hỏi/thêm thành viên và tin vui bất ngờ trong nhà. Ghép cung trùng để nói đúng lĩnh vực; gặp sát " +
      "kỵ thì vui mang hao — nói hai mặt, không tung hô một chiều.",
  },
  {
    id: "kn-han2-van-duong-va-cham",
    tags: ["vận dương", "lưu kình dương", "kình dương", "va chạm", "hạn"],
    title: "Vận/Lưu Dương — chặng vận/năm thêm sắc va chạm",
    source: SRC_VDC_REL,
    requireAny: ["vận dương", "lưu kình dương"],
    content:
      "Hạn: Vận Dương (bản vận Kình Dương) hoặc Lưu Kình Dương — hai nghĩa chắc nhất: cạnh tranh–kiện " +
      "cạnh gay gắt và va vấp xe cộ. Đã có Kình bẩm sinh cùng trục thì nhân đôi mức — nói có chọn theo " +
      "thẻ sự kiện; cấm liệt kê khô và cấm khẳng định tai nạn chắc xảy ra.",
  },
  {
    id: "kn-han2-van-da-tri-tre",
    tags: ["vận đà", "lưu đà la", "đà la", "trì trệ", "hạn"],
    title: "Vận/Lưu Đà — chặng vận/năm nhuốm trì trệ",
    source: SRC_VDC_REL,
    requireAny: ["vận đà", "lưu đà la"],
    content:
      "Hạn: Vận Đà (bản vận Đà La) hoặc Lưu Đà La — hai nghĩa chắc nhất: việc chậm chốt và kế hoạch " +
      "kéo dài. Kết hợp Xương + Kỵ cùng lớp (vận hay lưu) thì thành bộ thủy hiểm (mẩu riêng). Nhẹ " +
      "giọng — trì là chậm, không phải phá; khuyên chia nhỏ mốc để giữ đà.",
  },
  {
    id: "kn-han2-van-hoa-loc",
    tags: ["vận hóa lộc", "lưu hóa lộc", "hóa lộc", "tiến tài", "duyên", "hạn"],
    title: "Vận/Lưu Hóa Lộc — tiến tài trong chặng/năm, duyên khởi thuận",
    source: SRC_VDC_REL,
    requireAny: ["vận hóa lộc", "lưu hóa lộc"],
    content:
      "Hạn: Vận Hóa Lộc (đại vận) hoặc Lưu Hóa Lộc (lưu niên) — hai nghĩa chắc nhất: TIẾN TÀI (tiền " +
      "vào hơn ra trong chặng/năm) và DUYÊN KHỞI (quan hệ/mối việc mới dễ bắt đầu). Đọc kèm sao thụ " +
      "Hóa và cung đích máy ghi trong Phi Đại vận / Phi Lưu niên để nói đúng domain; gộp Mã thì xem " +
      "mẩu Lộc Mã giao trì.",
  },
  {
    id: "kn-han2-van-hoa-quyen",
    tags: ["vận hóa quyền", "lưu hóa quyền", "hóa quyền", "thăng chức", "nắm quyền", "hạn"],
    title: "Vận/Lưu Hóa Quyền — thăng chức nắm quyền trong chặng/năm",
    source: SRC_VDC_REL,
    requireAny: ["vận hóa quyền", "lưu hóa quyền"],
    content:
      "Hạn: Vận Hóa Quyền (đại vận) hoặc Lưu Hóa Quyền (lưu niên) — hai nghĩa chắc nhất: THĂNG CHỨC/" +
      "NẮM QUYỀN (được giao thêm chức trách, tiếng nói nặng hơn) và khởi sự mở việc mới CÓ LỰC. Đọc " +
      "kèm sao thụ Hóa và cung đích để nói đúng domain; gặp Kỵ đồng trục thì quyền mang áp lực.",
  },
  {
    id: "kn-han2-van-hoa-khoa",
    tags: ["vận hóa khoa", "lưu hóa khoa", "hóa khoa", "danh vọng", "thi tuyển", "hạn"],
    title: "Vận/Lưu Hóa Khoa — danh vọng, thi tuyển thuận",
    source: SRC_VDC_REL,
    requireAny: ["vận hóa khoa", "lưu hóa khoa"],
    content:
      "Hạn: Vận Hóa Khoa (đại vận) hoặc Lưu Hóa Khoa (lưu niên) — hai nghĩa chắc nhất: DANH VỌNG (được " +
      "nể trọng, tiếng tốt lan ra) và THI TUYỂN–THI CỬ THUẬN (kỳ thi, tuyển chọn, xét duyệt đi êm). " +
      "Cấm nói rộng sang may mắn tiền bạc — Khoa chủ danh không chủ phú.",
  },
  {
    id: "kn-han2-luu-khoi-viet-diep",
    tags: ["lưu khôi", "lưu việt", "quý nhân", "điệp", "hạn", "lưu niên"],
    title: "Lưu Khôi điệp Lưu Việt — quý lực lớn trong năm, xem cung trùng để biết hỷ sự",
    source: SRC_VDC,
    requireAll: ["lưu khôi", "lưu việt"],
    content:
      "Hạn: Lưu Khôi điệp Lưu Việt (bản lưu của Thiên Khôi/Việt trùng nhau trong năm) — phải ĐIỆP mới " +
      "phát lực lớn; trùng ở cung nào thì hỷ sự năm đó ở đó: Phu Thê chủ năm cưới/than hỏi, Tử Tức chủ " +
      "tin sinh con. CHỈ nêu khi cả hai nhãn Lưu Khôi + Lưu Việt thật có trên payload.",
  },
  {
    id: "kn-han2-luu-xuong-da-thuy-hiem",
    tags: ["lưu văn xương", "lưu đà la", "hóa kỵ", "thủy hiểm", "hạn", "lưu niên"],
    title: "Lưu Xương + Lưu Đà + Kỵ — Linh Xương Đà Vũ bản lưu: cảnh giắc thủy hiểm trong năm",
    source: SRC_VDC,
    requireAll: ["lưu văn xương", "lưu đà la"],
    requireAny: ["hóa kỵ", "vận hóa kỵ", "lưu hóa kỵ"],
    content:
      "Hạn: Lưu Văn Xương + Lưu Đà La xung kích mà gặp Hóa Kỵ (bẩm sinh/vận/lưu) — bản lưu của Linh " +
      "Xương Đà Vũ: rủi ro THỦY HIỂM trong năm (sông nước, lặn lội, đường thủy). Gốc chỉ Vũ Khúc + " +
      "Linh Tinh ở Thìn/Tuất thì giảm mức. Khuyên tỉnh táo: cẩn trọng hoạt động dưới nước, chuyến đi " +
      "đường thủy năm này — không hù dọa.",
  },
  {
    id: "kn-han2-tang-mon-han",
    tags: ["tang môn", "tin buồn", "khẩu thiệt", "hạn"],
    title: "Tang Môn ngộ tiểu hạn/lưu niên Mệnh–Phụ Mẫu–Điền — dấu hiệu tin buồn, phải soi cảnh",
    source: SRC_VDC,
    requireAny: ["tang môn"],
    content:
      "Hạn: Tang Môn rơi tiểu hạn hoặc lưu niên Mệnh/Phụ Mẫu/Điền Trạch — hai nghĩa chắc nhất: TIN " +
      "BUỒN/tang phục và KHẨU THIỆT thị phi nhỏ. Đây chỉ là DẤU HIỆU: bắt buộc xem sao đồng cung + tam " +
      "phương rồi mới nói; gặp cát/hóa giải thì hạ hẳn. Cấm hù dọa, cấm khẳng định chuyện buồn chắc xảy ra.",
  },

  // ===== MẠCH B — SAO NHẬP MỆNH CHI TIẾT (nguồn: 5 file sách nhập Mệnh, trích có chọn) =====
  // Quy tắc ứng nghiệm hạn + tổ hợp cách + nữ mệnh. Quan niệm cổ về nữ mệnh giữ kèm
  // caveat "quan niệm xưa"; khẳng định đắt (chết yểu/tàn tật) được hạ giọng thành cảnh báo.
  // --- Hạn ứng nghiệm ---
  {
    id: "kn-han2-nm-xuong-mieu-khoa-bang",
    tags: ["văn xương", "khoa bảng", "đỗ đạt", "hạn"],
    title: "Văn Xương miếu + hạn trực chiếu — có tên khoa bảng",
    source: SRC_NM_XUONG,
    requireAll: ["văn xương"],
    content:
      "Hạn: Văn Xương nhập miếu (Sửu/Tỵ/Dậu) mà Lưu niên hoặc Đại Hạn trực chiếu — chủ có tên khoa " +
      "bảng, thi cử đỗ đạt, nổi danh khi còn trẻ. CHỈ nêu khi Văn Xương thật miếu và là sao trục hạn; " +
      "Văn Xương hãm (Dần/Ngọ/Tuất) thì luận theo mẩu thị phi dưới, không nêu đỗ đạt.",
  },
  {
    id: "kn-han2-nm-xuong-ham-thi-phi",
    tags: ["văn xương", "thị phi", "công quyền", "giấy tờ", "hạn"],
    title: "Văn Xương hãm + sát Kỵ trong hạn — thị phi công quyền, dễ thị phi",
    source: SRC_NM_XUONG,
    requireAll: ["văn xương"],
    requireAny: ["kình dương", "đà la", "hỏa tinh", "linh tinh", "hóa kỵ"],
    content:
      "Hạn: hạn đến nơi Văn Xương hãm (Dần/Ngọ/Tuất) lại gặp Dương/Đà/Hỏa/Linh/Hóa Kỵ — thị phi chốn " +
      "công quyền, cơ quan, lời nói mang họa, phá tài, vận trì trệ. Nói tỉnh: cẩn trọng hợp đồng, tài " +
      "liệu, phát ngôn trong chặng này; không hù dọa.",
  },
  {
    id: "kn-han2-nm-pha-quan-doi-cu-thay-moi",
    tags: ["phá quân", "đổi cũ thay mới", "cơ hội mới", "hạn"],
    title: "Phá Quân nhập hạn — thay cũ bằng mới, tìm cơ hội",
    source: SRC_NM_PHA,
    requireAll: ["phá quân"],
    content:
      "Hạn: Phá Quân nhập Đại Hạn/Lưu Niên — thay cái cũ bằng cái mới: chuyển việc, tìm cơ hội mới " +
      "hoặc đi xa du hành. Can Quý hóa Phá Quân Lộc → cơ hội mới nảy ra ngay trong nghề cũ; gặp sát " +
      "tinh hoặc Vũ Khúc Hóa Kỵ tương hội → điêu tàn, sự nghiệp đình trệ như thuyền mắc cạn; Tham Lang " +
      "Hóa Kỵ → có cơ hội nhưng bị người tranh giành. Nói theo thẻ sự kiện, không phóng đại.",
  },
  {
    id: "kn-han2-nm-xuong-khuc-han-quy-nhan",
    tags: ["văn xương", "văn khúc", "quý nhân", "hạn"],
    title: "Xương Khúc cư Sửu/Mùi + hạn Dậu/Mão + cát hóa — gần quý nhân",
    source: SRC_NM_XUONG,
    requireAll: ["văn xương", "văn khúc"],
    requireAny: ["hóa lộc", "hóa quyền", "hóa khoa", "lộc tồn"],
    content:
      "Hạn: Xương Khúc nhập Mệnh tại Sửu/Mùi, hạn (đại/lưu) đến Dậu khi Mệnh ở Sửu hoặc Mão khi Mệnh " +
      "ở Mùi, mệnh cục và vận hạn đều gặp cát hóa — được gần quý nhân, kết thân người giúp đỡ. Máy " +
      "không đếm cung hạn — bắt buộc soi vị trí hạn rồi mới nêu; thiếu cát hóa thì không nói.",
  },
  {
    id: "kn-han2-nm-vu-xuong-khuc-thuy-hiem",
    tags: ["vũ khúc", "văn xương", "văn khúc", "hóa kỵ", "thủy hiểm", "hạn"],
    title: "Vũ Khúc + Xương/Khúc + Kỵ (can Kỷ/Tân/Nhâm) — sự việc ngoài ý muốn, đề phòng thủy hiểm",
    source: SRC_NM_XUONG,
    requireAll: ["vũ khúc", "hóa kỵ"],
    requireAny: ["văn xương", "văn khúc"],
    content:
      "Hạn: Vũ Khúc thủ Mệnh có Xương/Khúc đồng cung, can Kỷ/Tân/Nhâm (Hóa Kỵ rơi vào bộ sao này), đi " +
      "vào Thìn/Tuất hoặc hạn gặp — sự việc ngoài ý muốn lớn, cổ cảnh giắc thủy hiểm; Hỏa/Linh đồng " +
      "cung càng ứng nghiệm. Nói khéo: cẩn trọng sông nước, chuyến đi đường thủy, việc nước — không " +
      "khẳng định tai họa chắc xảy ra.",
  },
  {
    id: "kn-han2-nm-xuong-khuc-ky-ngan-phieu",
    tags: ["văn xương", "văn khúc", "hóa kỵ", "ngân phiếu", "chi phiếu", "lưu nguyệt", "hạn"],
    title: "Xương/Khúc Hóa Kỵ trong tháng (lưu nguyệt) — soát ngân phiếu, chi phiếu",
    source: SRC_NM_XUONG,
    requireAny: ["văn xương", "văn khúc"],
    content:
      "Hạn tháng/ngày: tháng có Văn Xương Hóa Kỵ (can lưu nguyệt Tân) hoặc Văn Khúc Hóa Kỵ (can Kỷ) — " +
      "soát dòng tiền giấy tờ: ngân phiếu, chi phiếu đến-đi, đối soát hóa đơn; không nhúng tay vào việc " +
      "riêng, không ký bảo lãnh trong tháng đó; song Kỵ xếp chồng càng phải kiểm kỹ kẻo phải hoàn trả. " +
      "Chỉ dùng khi bạn hỏi về tháng và Xương/Khúc thật có trên lá; nói mức cẩn trọng, không phóng đại.",
  },
  // --- Tổ hợp Tử Vi + chính tinh (gate cấu trúc tự khớp đúng tổ hợp) ---
  {
    id: "kn-nm-tu-tuong-thin-tuat",
    tags: ["tử vi", "thiên tướng", "tài quan", "quyền lộc", "cách cục"],
    title: "Tử Tướng Thìn/Tuất — Ất Kỷ Giáp Canh Quý nhân tài quan cách",
    source: SRC_NM_TUVI,
    requireAll: ["tử vi", "thiên tướng"],
    content:
      "Tử Tướng đồng cung Thìn/Tuất: Tử Vi Thìn Tuất cung đắc địa — người can Ất/Kỷ/Giáp/Canh/Quý là " +
      "tài quan cách (Tứ Hóa rơi đúng bộ); tối hỷ Quyền Lộc tương phùng — gặp Lộc Mã mới đoán được " +
      "mức phú; Hóa Lộc tốt nhất, Lộc Tồn thứ hai, Tả Hữu Xương Khúc cũng quý. Kỵ Kình (kiện tụng, phá " +
      "tướng) và Đà (thủy hiểm); gặp Dương Đà thì hợp kinh doanh hơn chính trị.",
  },
  {
    id: "kn-nm-tu-sat-hoa-sat-quyen",
    tags: ["tử vi", "thất sát", "hóa sát vi quyền", "cách cục"],
    title: "Tử Sát Tỵ/Hợi + Lộc — hóa sát vi quyền sinh anh hùng",
    source: SRC_NM_TUVI,
    requireAll: ["tử vi", "thất sát"],
    requireAny: ["lộc tồn", "hóa lộc"],
    content:
      "Tử Sát đồng cung (Tỵ/Hợi) gặp Lộc Tồn hoặc Hóa Lộc — hóa sát vi quyền: anh hùng có đất dụng võ, " +
      "có quyền có thế; Xương Khúc đồng cung thì không quý mà đại phú. Không có Lộc → thảo khấu ngang " +
      "ngược, phát bất ngờ rồi hư danh; gặp tứ sát hội chiếu mà không chế hóa → cô độc hình thương, " +
      "hạ giọng khi luận.",
  },
  {
    id: "kn-nm-tu-pha-chinh-tri",
    tags: ["tử vi", "phá quân", "chính trị", "thăng trầm", "cách cục"],
    title: "Tử Phá — hợp chính trị, giáp Ất Mậu Kỷ Canh phú quý",
    source: SRC_NM_TUVI,
    requireAll: ["tử vi", "phá quân"],
    content:
      "Tử Phá tọa Mệnh/hội chiếu không sát tinh: hợp phát triển giới chính trị; hội Lộc Mã thì kinh " +
      "doanh phát — ưu việc công/doanh nghiệp liên quan nhà nước. Người can Giáp/Ất/Mậu/Kỷ/Canh → phú " +
      "quý kham kỳ; không tam cát hóa + không cát tinh trợ → chức vụ không lớn, hung ác tư lại. Riêng " +
      "Tử Vi ở Thìn/Tuất đối Phá Quân (Thiên La Địa Võng) không cát tinh → tinh thần dễ kích động, " +
      "thăng trầm, không bình yên — hạ giọng, nói khả năng vượt lên khi có cát tinh.",
  },
  {
    id: "kn-nm-tu-phu-kinh-doanh",
    tags: ["tử vi", "thiên phủ", "kinh doanh", "cách cục"],
    title: "Tử Phủ — tổ hợp Tử Vi duy nhất hợp kinh doanh",
    source: SRC_NM_TUVI,
    requireAll: ["tử vi", "thiên phủ"],
    content:
      "Tử Phủ: tổ hợp Tử Vi duy nhất hợp kinh doanh; có Hữu Bật hội ngộ → phú quý song toàn. Hỏa Tinh " +
      "hoặc Hóa Kỵ xông phá ở cung đối diện → kết cục không đẹp. Không cát tinh chiếu → ích kỷ bủn xỉn, " +
      "coi trọng tiền, hay tính toán — nói hai mặt tính cách, không chỉ khen.",
  },
  {
    id: "kn-nm-tu-tham-dao-hoa",
    tags: ["tử vi", "tham lang", "đào hoa", "tôn giáo", "cách cục"],
    title: "Tử Tham — tướng đào hoa, gặp Không Diêu sát nghiêng tôn giáo",
    source: SRC_NM_TUVI,
    requireAll: ["tử vi", "tham lang"],
    content:
      "Tử Tham nhập Mệnh: tướng đào hoa — yêu cầu cao trong tình cảm và giao tiếp, đuổi theo dục vọng " +
      "và quyền lực; thiếu cát tinh đồng cung → xảo trá đạo đức giả (nói khéo: lời nói cần kiểm tra). " +
      "Gặp Không Diêu (Không/Kiếp) + sát tinh → dễ chịu ảnh hưởng tín ngưỡng, tôn giáo, triết học.",
  },
  {
    id: "kn-nm-pha-quan-ty-ngo-anh-tinh",
    tags: ["phá quân", "anh tinh nhập miếu", "sáng lập", "cách cục"],
    title: "Phá Quân Tý/Ngọ vô sát + Giáp/Quý — Anh tinh nhập miếu, sáng lập doanh nghiệp",
    source: SRC_NM_PHA,
    requireAll: ["phá quân"],
    requireAny: ["hóa lộc", "hóa quyền"],
    content:
      "Phá Quân độc tọa Tý/Ngọ, đối Liêm Tướng, cung vô sát — Hóa Lộc (can Quý) hoặc Hóa Quyền (can " +
      "Giáp) → Anh tinh nhập miếu: quan tư thanh hiển, thời nay hợp sáng lập doanh nghiệp lớn. Thêm " +
      "Lộc Tồn vào Phúc Đức/Mệnh, không ác sát hội → phúc trạch lớn. Cấm nêu khi có sát tinh đồng " +
      "cung; kỵ tổ hợp Tham Lang Hóa Lộc hội chiếu (phóng đãng). Máy không đếm cung — soi vị trí rồi mới nêu.",
  },
  {
    id: "kn-nm-xuong-khuc-hoc-van",
    tags: ["văn xương", "văn khúc", "lộc tồn", "đại học", "học vấn", "cách cục"],
    title: "Xương Khúc + Lộc Tồn — trình độ đại học, Lộc Văn củng mệnh",
    source: SRC_NM_XUONG,
    requireAll: ["văn xương", "văn khúc", "lộc tồn"],
    content:
      "Xương Khúc giáp Mệnh, hoặc miếu vượng nhập Mệnh, hoặc cùng Lộc Tồn nhập Mệnh — học lực đến trình " +
      "độ đại học và người có phần đặc biệt; Lộc Tồn thủ Mệnh tam hợp có Xương Khúc là Lộc Văn củng " +
      "mệnh — thành tích xuất chúng văn học nghệ thuật, vừa phú vừa quý. LƯU Ý: Xương Khúc nhập Mệnh " +
      "không gặp Lộc Tồn/cát hóa thì chỉ hư danh — cấm khen trình độ khi thiếu Lộc.",
  },
  {
    id: "kn-nm-pha-xuong-khuc-thuy-ach",
    tags: ["phá quân", "văn xương", "văn khúc", "sát tinh", "thủy ách", "cách cục"],
    title: "Phá Quân + Xương Khúc + sát — nạn sông nước, đặc biệt Dần/Mão",
    source: SRC_NM_PHA,
    requireAll: ["phá quân", "văn xương", "văn khúc"],
    requireAny: ["kình dương", "đà la", "hỏa tinh", "linh tinh"],
    content:
      "Phá Quân đồng cung Xương Khúc gặp sát tinh — phần lớn có chặng hạn sông nước, thủy ách; đặc " +
      "biệt lưu ý Phá Quân + Xương Khúc đồng nhập Mệnh tại Dần/Mão có tứ sát xung phá → bôn ba, đề " +
      "phòng đường thủy. Nói khéo như mẩu thủy hiểm khác: cẩn trọng, không khẳng định nạn.",
  },
  {
    id: "kn-nm-pha-duong-da-suc-khoe",
    tags: ["phá quân", "kình dương", "đà la", "sức khỏe", "tổ hợp"],
    title: "Phá Quân + Dương Đà — chú ý bệnh tật kéo dài",
    source: SRC_NM_PHA,
    requireAll: ["phá quân"],
    requireAny: ["kình dương", "đà la"],
    content:
      "Phá Quân hội Dương Đà — chủ bệnh tật, chú ý bệnh kéo dài ở thần kinh/tim/thận/dạ dày; nặng hơn " +
      "khi Dương Đà kẹp Thìn/Tuất. Quan niệm cổ nói đến tàn tật/chết yểu — hạ giọng thành: theo dõi " +
      "sức khỏe định kỳ, tránh chủ quan; có Hóa Lộc thì điều hòa bớt, nói mặt sáng kèm theo.",
  },
  {
    id: "kn-nm-tu-vi-doc-toa-co-quan",
    tags: ["tử vi", "độc tọa", "cô quân", "bách quan triều củng", "tâm linh", "cách cục"],
    title: "Tử Vi độc tọa thiếu bách quan — 'cô quân': tự gánh việc, thẳng, hướng tâm linh",
    source: SRC_NM_TUVI,
    requireAll: ["tử vi"],
    content:
      "Tử Vi ĐỘC TỌA hoặc tam phương thiếu Phủ/Tướng/Tả/Hữu/Khôi/Việt/Lộc Tồn — 'Bất nhập miếu, vô tả " +
      "hữu, vi cô quân': quyền danh tự gánh, việc gì cũng tự làm, thành bại bất nhất; người thẳng, nghĩ gì " +
      "nói vậy, thiên hướng triết học/tâm linh. CHỈ nêu khi máy cho thấy không cát tinh triều củng — đã có " +
      "bách quan/Lộc thì BỎ mẩu; không áp cho các tổ hợp Tử Phủ/Tử Tướng/Tử Sát/Tử Phá/Tử Tham.",
  },
  {
    id: "kn-nm-tu-vi-tu-sat",
    tags: ["tử vi", "tứ sát", "kình dương", "đà la", "hỏa tinh", "linh tinh", "thân tín"],
    title: "Tử Vi ngộ tứ sát không cát bù — quyền danh chịu ma sát, đề phòng thân tín lừa",
    source: SRC_NM_TUVI,
    requireAll: ["tử vi"],
    requireAny: ["kình dương", "đà la", "hỏa tinh", "linh tinh"],
    content:
      "Tử Vi hội/đồng Kình-Đà-Hỏa-Linh mà thiếu cát tinh, cát hóa chế — cổ gọi 'nô lệ lừa chủ': quyền danh " +
      "bị ma sát từ cấp dưới/đồng đội, dễ tin nhầm người thân tín; cổ phê 'ngụy quân tử' nay đọc: bề ngoài " +
      "tử tế nhưng dễ bị lợi ích thúc đẩy, chi tiêu tính toán hơn. Có Hóa Quyền/Hóa Khoa/Lộc Tồn chế → giảm " +
      "mạnh, nói kèm mặt sáng; hạn tương tự tổ hợp thì cật vấn lại quan hệ thân tín.",
  },
  {
    id: "kn-nm-thien-tuong-tai-am-giap-an",
    tags: ["thiên tướng", "tài ấm giáp ấn", "vũ khúc", "thiên lương", "hóa lộc", "cách cục"],
    title: "Thiên Tướng được Tài–Ấm giáp (Vũ Khúc/Thiên Lương kẹp) — Tài Ấm giáp ấn cách",
    source: SRC_NM_TUONG,
    requireAll: ["thiên tướng"],
    requireAny: ["vũ khúc", "thiên lương", "hóa lộc"],
    content:
      "Thiên Tướng là ấn tinh; được hai cung kẹp là Tài (Vũ Khúc hoặc Hóa Lộc) và Ấn (Thiên Lương) — 'Tài " +
      "ấm giáp ấn cách': vừa có tài năng vừa có hậu thuẫn phúc ấm, sự nghiệp có người nâng. CHỈ nêu khi hai " +
      "sao giáp THẬT (cung trước + sau Thiên Tướng); chỉ đồng cung hoặc tam hợp thì KHÔNG phải cách này — " +
      "soi vị trí máy rồi mới nói, thiếu giáp thật thì bỏ mẩu.",
  },
  {
    id: "kn-nm-thien-tuong-sau-to-hop",
    tags: ["thiên tướng", "tổ hợp", "cung vị", "liêm trinh", "vũ khúc", "tử vi", "phá quân"],
    title: "Thiên Tướng 6 tổ hợp theo cung — Tý/Ngọ, Mão/Dậu, Sửu/Mùi, Dần/Thân, Thìn/Tuất, Tỵ/Hợi",
    source: SRC_NM_TUONG,
    requireAll: ["thiên tướng"],
    content:
      "Thiên Tướng tùy cung: Tý/Ngọ đồng Liêm Trinh, đối Phá Quân (Tướng hóa giải được Liêm — nhánh tốt); " +
      "Mão/Dậu độc tọa đối Liêm Phá (nhạy bén nhưng trắc trở; thêm Sát Kỵ dễ đạo đức giả); Sửu/Mùi độc tọa " +
      "đối Tử Phá (nổi loạn mạnh); Dần/Thân đồng Vũ Khúc (giảm lực lẫn nhau, không bằng đối chiếu); " +
      "Thìn/Tuất đồng Tử Vi (hợp chính trị; kinh doanh thành tài phiệt); Tỵ/Hợi độc tọa đối Vũ Phá (hay nghĩ " +
      "tiêu cực, dễ thay lòng). BẮT BUỘC soi đúng cung vị trên lá rồi mới nêu nhánh tương ứng.",
  },
  {
    id: "kn-nm-thien-tuong-ky-duong-da",
    tags: ["thiên tướng", "kình dương", "đà la", "thị phi", "pháp lý", "hình thương"],
    title: "Thiên Tướng ngộ Kình/Đà — thị phi pháp lý trong hạn; Đà La đồng cung thì do dự",
    source: SRC_NM_TUONG,
    requireAll: ["thiên tướng"],
    requireAny: ["kình dương", "đà la"],
    content:
      "Thiên Tướng kháng sát yếu: hạn (đại/tiểu/lưu) ngộ Kình Dương — cổ 'Hạn lâm Thiên Tướng ngộ Kình " +
      "Dương, tác hoạ hình ương' nay hạ giọng: giai đoạn dễ va chạm pháp lý, thị phi tốn của vì tranh chấp " +
      "— giữ chứng từ, tránh đứng tên giùm; thêm Hỏa/Linh càng phải chậm. Đà La ĐỒNG cung Mệnh — do dự, " +
      "quyết lặp đi lặp lại; có Lộc Tồn/Hóa Lộc đồng cung thì giảm nhiều, nói kèm điều kiện.",
  },
  {
    id: "kn-nm-pha-quan-thuy-vuc-ky",
    tags: ["phá quân", "văn khúc", "hóa kỵ", "thủy vực", "ly hương", "sức khỏe"],
    title: "Phá Quân + Văn Khúc (Kỵ) tại thủy vực Hợi/Tý/Sửu — tật bệnh ly hương",
    source: SRC_NM_PHA,
    requireAll: ["phá quân", "văn khúc"],
    requireAny: ["hóa kỵ", "kình dương", "đà la", "hỏa tinh", "linh tinh"],
    content:
      "Phá Quân + Văn Khúc (nhất là Văn Khúc Hóa Kỵ) nhập Mệnh tại Hợi/Tý/Sửu ('thủy vực') có sát chi " +
      "phối — cổ 'Dữ Văn Khúc nhập vu thủy vực, tật bệnh ly hương': rời quê sớm, sức khỏe cần chủ động " +
      "chăm; cổ phê 'tàn tật' hạ thành cảnh báo đường thủy + khám bệnh định kỳ. CHỈ nêu khi đủ tổ hợp và " +
      "đúng cung; thiếu Kỵ/sát thì chỉ nói nhánh ly hương để phát triển.",
  },
  {
    id: "kn-nm-van-khuc-thai-am",
    tags: ["văn khúc", "thái âm", "nghề nghiệp", "chuyên môn", "thuật sĩ", "thầy thuốc"],
    title: "Văn Khúc + Thái Âm đồng cung — nghề chuyên môn sâu: nghiên cứu, y, thuật số",
    source: SRC_NM_KHUC,
    requireAll: ["văn khúc", "thái âm"],
    content:
      "Văn Khúc đồng cung Thái Âm — mẫn cảm, hiểu biết rộng; cổ gọi 'cửu lưu thuật sĩ hoặc thầy thuốc' " +
      "nay đọc: hợp nghề chuyên môn sâu cần tinh tế và kiên nhẫn — nghiên cứu, y/dược, tư vấn, thuật số, " +
      "nghệ thuật; Thái Âm miếu thêm hợp mảng đêm, tài chính nội bộ. Nói ĐỊNH HƯỚNG nghề, không phán 'nhất " +
      "định làm thầy thuốc'; kết hợp cung Quan Lộc/Tài để khuyên cụ thể.",
  },
  // --- Nữ mệnh (onlyGender "nữ" — quan niệm xưa, giữ kèm caveat) ---
  {
    id: "kn-nm-nu-tu-vi",
    tags: ["tử vi", "nữ mệnh", "phu nhân", "hôn nhân"],
    title: "Nữ mệnh Tử Vi — bách quan triều củng là phu nhân, sát hội thì tự quyết",
    source: SRC_NM_TUVI,
    onlyGender: "nữ",
    requireAll: ["tử vi"],
    content:
      "Nữ mệnh Tử Vi (quan niệm xưa — đọc có chọn lọc): đồng cung Thiên Phủ + hội cát tinh → mệnh phu " +
      "nhân; hội Kình/Đà/Hỏa/Linh/Không/Kiếp và Phá Quân chiếu → thích tự mình quyết định, kiếm được " +
      "tiền nhưng đời quan hệ lăng nhăng khó một chồng (nay đọc là: độc lập, quan hệ tình cảm phức tạp " +
      "cần chọn kỹ). Tử Phá/Tử Tướng nữ mệnh hôn nhân khó viên mãn nếu thiếu trợ tinh — nói cẩn trọng, " +
      "không phán kết.",
  },
  {
    id: "kn-nm-nu-thien-tuong",
    tags: ["thiên tướng", "nữ mệnh", "hiền phu", "hôn nhân"],
    title: "Nữ mệnh Thiên Tướng — hiền phu quý tử, kỵ Xương Khúc + sát Kỵ",
    source: SRC_NM_TUONG,
    onlyGender: "nữ",
    requireAll: ["thiên tướng"],
    content:
      "Nữ mệnh Thiên Tướng (quan niệm xưa): hội Phù/Bật/Khôi/Việt/Lộc/Mã + tam cát Hóa → mệnh phu nhân, " +
      "vượng phu giáo tử, hiền phu quý tử; hợp lấy chồng hơn tuổi. Kỵ Xương Khúc + sát Kỵ hội → hôn " +
      "nhân bất lợi, cổ nói vợ hai/thiếp (nay đọc: quan hệ không chính thức, hôn lễ trễ). Nói nhẹ tay, " +
      "không phán đạo đức.",
  },
  {
    id: "kn-nm-nu-pha-quan",
    tags: ["phá quân", "nữ mệnh", "kết hôn muộn", "tâm tính"],
    title: "Nữ mệnh Phá Quân — cát chỉ ở Tý/Ngọ, nên kết hôn muộn",
    source: SRC_NM_PHA,
    onlyGender: "nữ",
    requireAll: ["phá quân"],
    content:
      "Nữ mệnh Phá Quân (quan niệm xưa): cát lợi nhất ở Tý/Ngọ — phú quý, làm ăn phát đạt, vượng phu, " +
      "nên kết hôn muộn; Dần/Thân → tự lập sớm, khắc phạt chồng con, cổ khuyên làm chính thất khó (nay " +
      "đọc: độc lập tài chính, chọn bạn đời kỹ). Tâm tính khó hiểu với người xung quanh — nói là bản " +
      "sắc mạnh, không phán.",
  },
  {
    id: "kn-nm-nu-van-khuc",
    tags: ["văn khúc", "nữ mệnh", "đào hoa", "hôn nhân"],
    title: "Nữ mệnh Văn Khúc — thông minh giàu cảm xúc, Lộc Tồn hóa giải đào hoa",
    source: SRC_NM_KHUC,
    onlyGender: "nữ",
    requireAll: ["văn khúc"],
    content:
      "Nữ mệnh Văn Khúc (quan niệm xưa): thông minh, giàu có, ngoại hình mảnh mai nhưng tính thủy dễ " +
      "dao động tình cảm; gặp thủy tinh + Lộc Tồn đồng cung thì được hóa giải — nói mặt sáng: duyên " +
      "dáng, khéo léo. Thiên Tướng + Văn Khúc đồng nhập Mệnh → khuynh hướng lăng nhăng (nay đọc: dễ " +
      "rung động, cần ranh giới rõ trong quan hệ). Cấm dùng từ miệt thị cổ.",
  },
  {
    id: "kn-nm-nu-van-xuong",
    tags: ["văn xương", "nữ mệnh", "ngoại hình", "hôn nhân"],
    title: "Nữ mệnh Văn Xương — xinh đẹp thanh tú, hãm địa cần giữ danh thể",
    source: SRC_NM_XUONG,
    onlyGender: "nữ",
    requireAll: ["văn xương"],
    content:
      "Nữ mệnh Văn Xương (quan niệm xưa): nhất định xinh đẹp, mi thanh mục tú, ai nhìn cũng yêu; cung " +
      "miếu + cát tinh → danh tiếng sớm. Hãm địa (Dần/Ngọ/Tuất) + sát tinh hội → cổ cảnh báo danh thể " +
      "và quan hệ (nay đọc: cẩn trọng chuyện tình được người lợi dụng, giữ ranh giới). Nói duyên dáng " +
      "và cảnh báo tỉnh táo, tuyệt đối không từ miệt thị.",
  },
];

// ----------------------------------------------------------------------------
// TRUY HỒI
// ----------------------------------------------------------------------------

export interface RetrieveKinhNghiemContext {
  /** Tên sao chính/phụ thực có trên lá (chuẩn vi-VN) — nguồn iztro / payload. */
  stars?: string[];
  /** Tên cung liên quan câu hỏi hoặc đang luận. */
  palaces?: string[];
  /** Chủ đề: sự nghiệp, hôn nhân, sức khỏe, hạn, con cái... */
  topics?: string[];
  /** Câu hỏi tự do. */
  query?: string;
  /** patternId cách cục máy — ưu tiên mẩu map */
  patternIds?: string[];
  /** Chỉ lấy mẩu có id bắt đầu bằng prefix này (tách layer "sao nhập hạn"). */
  idPrefix?: string;
  /** Loại bỏ mẩu có id bắt đầu bằng prefix này. */
  excludePrefix?: string;
  /** Loại nhiều prefix cùng lúc (vd tách cả "sao nhập hạn" lẫn "nhập Mệnh" khỏi KN chính). */
  excludePrefixes?: string[];
  /** Giới tính đương số ("Nam"/"Nữ") — lọc mẩu onlyGender. Không rõ → giữ tất cả. */
  gender?: string;
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
  "cha mẹ": ["phụ mẫu"],
  "gia đình": ["phụ mẫu", "phu thê", "huynh"],
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

/** Kim (require*) có mặt trong pool sao/cung đã chuẩn hóa chưa.
 *  CHỈ khớp một chiều p.includes(n) (pool chứa needle) + exact — KHÔNG dùng
 *  n.includes(p): nhãn "Lưu Văn Xương" chứa nguyên tên bẩm sinh "Văn Xương",
 *  chiều ngược làm sao bẩm sinh TỰ THỎA gate lưu (bug A3 — mẩu thủy hiểm
 *  bản lưu kích sai trên mọi lá). Prefix "[SAO LƯU]/[SAO VẬN]" đứng TRƯỚC
 *  needle nên p.includes(n) vẫn khớp đúng nhãn iztro. */
function poolHas(pool: string[], needle: string): boolean {
  const n = norm(needle);
  if (!n) return false;
  return pool.some((p) => p === n || p.includes(n));
}

function passesStarGate(entry: KinhNghiemEntry, starPool: string[]): boolean {
  if (entry.requireAll?.length) {
    if (!entry.requireAll.every((k) => poolHas(starPool, k))) return false;
  }
  if (entry.requireAny?.length) {
    if (!entry.requireAny.some((k) => poolHas(starPool, k))) return false;
  }
  return true;
}

/**
 * Top-N mẩu kinh nghiệm khớp lá + câu hỏi.
 * - Gate requireAll/requireAny theo sao/cung trên lá (iztro payload).
 * - Không dump lý thuyết khi không khớp.
 * - Fallback: 1 mẩu trình tự đoán.
 */
export function retrieveKinhNghiem(
  ctx: RetrieveKinhNghiemContext,
  topN = 8,
): KinhNghiemEntry[] {
  // Filter layer (tách "sao nhập hạn" khỏi cách cục chính)
  let pool = KINH_NGHIEM_KNOWLEDGE;
  if (ctx.idPrefix) pool = pool.filter((e) => e.id.startsWith(ctx.idPrefix!));
  if (ctx.excludePrefix) pool = pool.filter((e) => !e.id.startsWith(ctx.excludePrefix!));
  if (ctx.excludePrefixes?.length) {
    pool = pool.filter((e) => !ctx.excludePrefixes!.some((p) => e.id.startsWith(p)));
  }
  // Lọc giới tính: mẩu onlyGender chỉ ra khi khớp; không rõ giới tính → giữ tất cả.
  {
    const g = norm(ctx.gender || "");
    const isFemale = g.includes("nữ");
    const isMale = !isFemale && g.includes("nam");
    if (isFemale || isMale) {
      pool = pool.filter(
        (e) =>
          !e.onlyGender || (e.onlyGender === "nữ" ? isFemale : isMale),
      );
    }
  }

  const queryNorm = ctx.query ? norm(ctx.query) : "";
  const queryWords = queryNorm
    ? queryNorm
        .split(/\s+/)
        .filter((w) => w.length >= 2 && !QUERY_STOPWORDS.has(w))
    : [];

  const starLikeNeedles = expandNeedles([...(ctx.stars ?? []), ...(ctx.palaces ?? [])]);
  const topicNeedles = new Set(expandNeedles([...(ctx.topics ?? [])]));
  if (queryNorm) {
    for (const key of Object.keys(TOPIC_ALIASES)) {
      if (queryNorm.includes(norm(key))) {
        expandNeedles([key]).forEach((x) => topicNeedles.add(x));
      }
    }
  }

  const patternSet = new Set((ctx.patternIds ?? []).map((p) => String(p).trim()).filter(Boolean));
  const picked: KinhNghiemEntry[] = [];
  const seen = new Set<string>();

  // Ưu tiên mẩu map cách cục (đã qua gate sao)
  if (patternSet.size) {
    for (const entry of pool) {
      if (picked.length >= topN) break;
      if (!entry.patternIds?.some((p) => patternSet.has(p))) continue;
      if (!passesStarGate(entry, starLikeNeedles)) continue;
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      picked.push(entry);
    }
  }

  const scored = pool
    .filter((entry) => passesStarGate(entry, starLikeNeedles) && !seen.has(entry.id))
    .map((entry) => {
      const tagSet = entry.tags.map(norm);
      let starScore = 0;
      let queryScore = 0;
      for (const n of starLikeNeedles) {
        if (tagSet.some((t) => t.includes(n) || n.includes(t))) starScore += 2;
        if (norm(entry.title).includes(n)) starScore += 1;
      }
      // Trần điểm từ sao: lá nào cũng đầy sát/cát → không cho sao lấn át câu hỏi.
      starScore = Math.min(starScore, 8);
      // Thưởng gate chặt (cách cục cụ thể) khi đã qua require*
      if (entry.requireAll?.length) starScore += 2;
      if (entry.patternIds?.some((p) => patternSet.has(p))) starScore += 6;
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
  for (const s of sorted) {
    if (picked.length >= topN) break;
    if (seen.has(s.entry.id)) continue;
    seen.add(s.entry.id);
    picked.push(s.entry);
  }

  if (picked.length === 0) {
    const fallback = pool.find((e) => e.id === "kn-trinh-tu-doan");
    return fallback ? [fallback] : [];
  }
  return picked;
}

/** Gói text chèn prompt — neo lá/iztro, chống tự phát triển.
 *  opts: override header/dòng nguồn cho mạch riêng (vd kn-nm-* — nguồn 5 file nhập Mệnh). */
export function kinhNghiemToPromptText(
  entries: KnowledgeEntry[],
  opts?: { header?: string; sourceLine?: string },
): string {
  if (!entries.length) return "";
  const body = entries.map((e) => `• [${e.title}]: ${e.content}`).join("\n");
  return (
    (opts?.header ?? "=== KINH NGHIỆM ỨNG DỤNG (lớp B — đã truy hồi theo SAO/CUNG TRÊN LÁ) ===\n") +
    (opts?.sourceLine ??
      "(Nguồn: Sổ TVKN Quản Xuân Thịnh Quyển Hạ + Tử Vi Đẩu Số Tân Biên 1956 — trích có chọn. ") +
    `BẮT BUỘC: chỉ áp mẩu khi sao/cung/tổ hợp đã có trong dữ liệu lá số (iztro + báo cáo đã tính sẵn). ` +
    `CẤM tự bịa cách cục, hạn, hoặc "phát triển" thêm sao ngoài lá. ` +
    `CẤM dùng mẩu nếu thiếu dù chỉ một sao then chốt trong tổ hợp. ` +
    `Ưu tiên: lá số thực > Đàm Tinh (tinh tình) > mẩu này. ` +
    `Chỉ "CÓ XU HƯỚNG"; văn gọn, đời thực; CẤM hoa mỹ và CẤM khẳng định tuyệt đối. ` +
    `Không nhắc tên sách trừ khi bạn hỏi nguồn.)\n` +
    body
  );
}
