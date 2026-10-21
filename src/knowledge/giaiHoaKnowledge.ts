// ============================================================================
// LỚP GIẢI HÓA — MẪU CÓ KIỂM SOÁT (không dump sách).
//
// Vai trò mass-market:
//   - NÊN / KHÔNG NÊN / CƠ CHẾ gắn đúng tổ hợp sao-cung trên lá
//   - Giọng khách quan, hành vi, không cúng bái / không chắc chắn tuyệt đối
//
// Nguồn cảm hứng (biên soạn lại, không copy nguyên văn):
//   Sổ Tử Vi Kinh Nghiệm, Tử Vi Thực Hành, luận chính-phụ tinh, nguyên tắc app.
// File .txt full trong data/ KHÔNG inject ở đây — chỉ mẩu curated.
// ============================================================================

import type { KnowledgeEntry } from "./chineseKnowledge";

const SRC = "Giải hóa thực hành (biên soạn từ Kinh Nghiệm + Thực Hành + rule app)";

export interface GiaiHoaEntry extends KnowledgeEntry {
  /** Lá phải có đủ mọi kim (sao/cụm/cung) */
  requireAll?: string[];
  /** Lá có ít nhất 1 kim */
  requireAny?: string[];
  /** mức gợi ý cho UI/prompt */
  level?: "thap" | "vua" | "cao";
  /**
   * patternId cách cục máy (cachCuc) — khi lá khớp cách này, mẩu được ưu tiên inject
   * dù gate sao lỏng. Không thay require*; chỉ boost retrieve.
   */
  patternIds?: string[];
}

export const GIAI_HOA_KNOWLEDGE: GiaiHoaEntry[] = [
  {
    id: "gh-khong-kiep-no",
    tags: ["địa không", "địa kiếp", "nô bộc", "bạn bè", "hợp tác", "tiền", "giải hóa"],
    title: "Không–Kiếp ở Nô Bộc — kỷ luật quan hệ tiền",
    source: SRC,
    level: "cao",
    requireAny: ["địa không", "địa kiếp", "không kiếp"],
    content:
      "XU HƯỚNG: hao mòn lòng tin qua bạn bè–đối tác–cấp dưới, nhất khi Nô liên Tài. " +
      "KHÔNG: chung vốn miệng, bảo lãnh, đa cấp, đứng tên nợ cho người thân sơ. " +
      "NÊN: hợp đồng/phân quyền tiền rõ; nghề độc lập hoặc chuyên môn sâu, ít phụ thuộc “hội nhóm lợi ích”. " +
      "CƠ CHẾ: siết kênh quan hệ trước khi siết “làm giàu nhanh”. Chỉ áp khi lá có Không/Kiếp đúng cung liên quan.",
  },
  {
    id: "gh-sinh-tai-thu-tai",
    tags: ["tài bạch", "điền trạch", "phúc đức", "hóa lộc", "triệt", "không vong", "giữ tiền", "giải hóa"],
    title: "Sinh tài mạnh – Thủ tài yếu",
    source: SRC,
    level: "cao",
    requireAny: ["triệt", "không vong", "hóa lộc", "tài bạch"],
    content:
      "XU HƯỚNG: kiếm bằng chất xám/cơ hội được, giữ/tích kém (kho rỗng, tự hao, tản nhanh). " +
      "KHÔNG: gánh đòn bẩy lớn, giữ full tiền mặt “cảm hứng chi”. " +
      "NÊN: trích tự động % thu nhập vào kênh khó rút (định kỳ, tài sản dài hạn); tách ví chi / ví tích. " +
      "CƠ CHẾ: sửa thói quen dòng tiền, không chỉ “kiếm thêm”.",
  },
  {
    id: "gh-thien-co-tuan",
    tags: ["thiên cơ", "tuần", "mệnh", "overthink", "quyết đoán", "giải hóa"],
    title: "Thiên Cơ + Tuần — nghĩ nhiều, làm có nhịp",
    source: SRC,
    level: "vua",
    requireAll: ["thiên cơ"],
    requireAny: ["tuần", "tuần không"],
    content:
      "XU HƯỚNG: mưu sĩ, ý tưởng nhiều, đầu đời dễ chậm bung / tự nghi. " +
      "KHÔNG: ôm dự án mạo hiểm một mình khi chưa có khung; trì quyết định đến hết hạn chót. " +
      "NÊN: vai chuyên môn–tham mưu–hệ thống; deadline ngắn + review 1 người tin cậy; ghi “quyết trong 48h”. " +
      "CƠ CHẾ: biến trí tuệ thành quy trình, không thành vòng lo.",
  },
  {
    id: "gh-hoa-ky-van-khuc-phu",
    tags: ["hóa kỵ", "văn khúc", "phu thê", "giao tiếp", "hôn nhân", "giải hóa"],
    title: "Văn Khúc Hóa Kỵ (Phu Thê) — lệch sóng lời nói",
    source: SRC,
    level: "vua",
    requireAny: ["hóa kỵ", "văn khúc"],
    content:
      "XU HƯỚNG: hiểu lầm, cam kết miệng vỡ, giấy tờ/điều khoản tình–hôn dễ rối. " +
      "KHÔNG: im lặng lạnh / mỉa mai kéo dài; hứa miệng chuyện lớn. " +
      "NÊN: nói rõ–viết rõ (tin nhắn/điều khoản); hẹn giờ nói chuyện khi bình tĩnh; với tuổi trẻ chỉ luận giao tiếp–ranh giới, không kết “ly hôn”. " +
      "CƠ CHẾ: sửa kênh thông tin trước khi đổ lỗi tính cách.",
  },
  {
    id: "gh-kinh-da-menh",
    tags: ["kình dương", "đà la", "mệnh", "xung đột", "bốc đồng", "giải hóa"],
    title: "Kình / Đà chạm Mệnh hoặc hạn Mệnh",
    source: SRC,
    level: "vua",
    requireAny: ["kình dương", "đà la", "lưu kình"],
    content:
      "XU HƯỚNG: quyết liệt / trì kéo, dễ va chạm miệng hoặc tự làm tổn thân. " +
      "KHÔNG: cãi nóng với cấp trên–thầy–cha mẹ cùng lúc quyết định lớn; lái xe khi bực. " +
      "NÊN: ngủ đủ, trì hoãn 24h quyết định nóng; ưu tiên văn bản hơn khẩu chiến. " +
      "CƠ CHẾ: kênh xả = vận động / deadline nhỏ, không xả vào quan hệ.",
  },
  {
    id: "gh-thien-hinh-tat",
    tags: ["thiên hình", "tật ách", "dao kéo", "giao thông", "sức khỏe", "giải hóa"],
    title: "Thiên Hình Tật Ách — phòng hơn chữa",
    source: SRC,
    level: "vua",
    requireAny: ["thiên hình", "tật ách"],
    content:
      "XU HƯỚNG: chú ý thương tích sắc, thủ thuật nhỏ, va chạm khi đi lại (không phải chẩn đoán bệnh). " +
      "KHÔNG: chủ quan giao thông; tự ý bỏ khám khi có chỉ định y khoa. " +
      "NÊN: đội mũ/bảo hộ khi cần; khám đúng chuyên khoa nếu có triệu chứng; ngủ và giảm thức khuya nếu hay đau đầu căng thần kinh. " +
      "CƠ CHẾ: phòng ngừa hành vi; không thay thế bác sĩ.",
  },
  {
    id: "gh-cu-mon-khau",
    tags: ["cự môn", "hóa kỵ", "thị phi", "miệng", "thiên di", "giải hóa"],
    title: "Cự Môn / khẩu thiệt — giữ lời, giữ chứng",
    source: SRC,
    level: "vua",
    patternIds: ["cu-nhat", "cu-nhat-dc", "dong-cu"],
    requireAny: ["cự môn"],
    content:
      "XU HƯỚNG: miệng là lợi khí cũng là họa (thị phi, tranh luận, hiểu nhầm). " +
      "KHÔNG: khẩu chiến MXH; cam kết miệng hợp đồng. " +
      "NÊN: nghề dùng lời có khung (thuyết trình, tư vấn, luật, dạy) + lưu chứng từ; im khi không cần thắng. " +
      "CƠ CHẾ: hướng Cự thành công cụ nghề, không thành sân si.",
  },
  {
    id: "gh-co-nguyet-chuyen-mon",
    tags: ["thiên cơ", "thái âm", "thiên đồng", "thiên lương", "cách cục", "chuyên môn", "giải hóa"],
    title: "Cơ Nguyệt Đồng Lương — đường chuyên gia",
    source: SRC,
    level: "vua",
    patternIds: ["co-nguyet-dong-luong", "co-luong", "nguyet-luong", "dong-luong-hoi", "dong-luong-dc"],
    requireAny: ["thiên cơ", "thiên lương", "thiên đồng", "thái âm"],
    content:
      "XU HƯỚNG: hợp tham mưu, chuyên môn, quản trị ổn, cố vấn; kém hợp đầu cơ cảm tính. " +
      "KHÔNG: bỏ khung ổn định lao vào đổ hết vốn vào tài sản rủi ro/đầu cơ (chứng khoán, coin, forex...) khi thân/khí chưa vững. " +
      "NÊN: sâu một nghề, chứng chỉ/uy tín, thu nhập từ chất xám + danh. " +
      "CƠ CHẾ: phú quý kiểu thanh quý/chuyên gia hơn phú nhanh.",
  },
  {
    id: "gh-hoa-ky-no-liem",
    tags: ["hóa kỵ", "liêm trinh", "nô bộc", "bạn bè", "thị phi", "giải hóa"],
    title: "Hóa Kỵ chạm Liêm / Nô — thị phi tập thể",
    source: SRC,
    level: "cao",
    requireAny: ["hóa kỵ", "liêm trinh"],
    content:
      "XU HƯỚNG: năm/hạn dễ hiểu nhầm trong nhóm, bị lôi vào chuyện không phải của mình. " +
      "KHÔNG: ký/bảo lãnh thay bạn; group chat bức xúc. " +
      "NÊN: giảm joint-venture; ưu tiên việc một mình hoặc team có quy chế. " +
      "CƠ CHẾ: giảm bề mặt dính thị phi hơn là “chứng minh trong sạch” ồn ào.",
  },
  {
    id: "gh-tu-hoa-loc-tai",
    tags: ["tự hóa", "hóa lộc", "thiên đồng", "tài bạch", "tiêu xài", "giải hóa"],
    title: "Tự Hóa Lộc tại Tài — vào dễ, ra nhanh",
    source: SRC,
    level: "vua",
    requireAny: ["hóa lộc", "thiên đồng", "tài bạch"],
    content:
      "XU HƯỚNG: lộc tự thân/nhịp đều nhưng dễ tản (chi cảm hứng, giúp người, mua sắm). " +
      "KHÔNG: coi mọi khoản vào là “được tiêu”. " +
      "NÊN: rule 50/30/20 hoặc khóa % ngay khi tiền vào; hạn chế cho mượn. " +
      "CƠ CHẾ: Tự Hóa = tự sinh cũng tự xài — thắng bằng kỷ luật ví.",
  },
  {
    id: "gh-triet-phuc",
    tags: ["triệt", "phúc đức", "nội tâm", "tự chữa lành", "giải hóa"],
    title: "Triệt Phúc Đức — nuôi gốc an",
    source: SRC,
    level: "thap",
    requireAny: ["triệt", "phúc đức"],
    content:
      "XU HƯỚNG: gốc phúc/gia nâng đỡ đứt đoạn lúc sớm; nội tâm dễ trống nhưng tự bù bằng tri thức. " +
      "KHÔNG: tự cô lập tuyệt đối; dựa hết vào “may quý nhân” mà không có kỹ năng. " +
      "NÊN: thói quen tĩnh (ngủ, đọc, vận động); giúp việc thiện nhỏ có ranh giới; xây 1–2 quan hệ sâu. " +
      "CƠ CHẾ: an lạc đến từ kỷ luật tinh thần, không từ phô diễn.",
  },
  {
    id: "gh-than-nhuoc-bt",
    tags: ["thân nhược", "bát tự", "dụng thần", "quá tải", "giải hóa"],
    title: "Thân nhược (BT) — đừng gánh quá vai",
    source: SRC,
    level: "vua",
    requireAny: ["thân nhược", "ấn", "tỷ kiếp"],
    content:
      "XU HƯỚNG: thấy nhiều cơ hội (Tài) nhưng sức gánh kém → mệt, stress, hỏng việc giờ chót. " +
      "KHÔNG: ôm 3 dự án lớn song song; học dồn/thức trắng kéo dài. " +
      "NÊN: môi trường có nâng đỡ (mentor, team, ấn); nghỉ xen kẽ; ưu tiên 1 mục tiêu/quý. " +
      "CƠ CHẾ: BT bổ Tử Vi — giảm tải trước khi tăng tham vọng.",
  },
  {
    id: "gh-luu-thai-tue-menh",
    tags: ["thái tuế", "lưu", "mệnh", "năm bản lề", "giải hóa"],
    title: "Lưu Thái Tuế trùng Mệnh — năm bản lề",
    source: SRC,
    level: "vua",
    requireAny: ["thái tuế", "lưu thái tuế"],
    content:
      "XU HƯỚNG: bị đẩy ra ánh đèn, phải chọn hướng (học/nghề); áp lực cái tôi. " +
      "KHÔNG: quyết định nóng vì sĩ diện; cãi để “thắng” người lớn. " +
      "NÊN: 1–2 mục tiêu năm; checklist giấy tờ; người review trước khi nộp/ký. " +
      "CƠ CHẾ: năm trung tâm → giảm biến số, tăng quy trình.",
  },
  {
    id: "gh-hoa-linh-ap-luc",
    tags: ["hỏa tinh", "linh tinh", "quan lộc", "áp lực", "thần kinh", "giải hóa"],
    title: "Hỏa / Linh — áp lực ngầm & nóng",
    source: SRC,
    level: "vua",
    requireAny: ["hỏa tinh", "linh tinh"],
    content:
      "XU HƯỚNG: căng thần kinh, đố kỵ ngầm, bùng nổ muộn. " +
      "KHÔNG: caffeine + thức khuya + cãi nhóm. " +
      "NÊN: giờ ngủ cố định; sport; tách việc “gấp” vs “quan trọng”. " +
      "CƠ CHẾ: hạ nhiệt sinh lý trước khi “sửa người khác”.",
  },
  {
    id: "gh-vo-chinh-dai-han",
    tags: ["vô chính diệu", "đà la", "đại hạn", "định hướng", "giải hóa"],
    title: "Đại hạn VCD + Đà — ma luyện định hướng",
    source: SRC,
    level: "vua",
    requireAny: ["đà la", "vô chính diệu"],
    content:
      "XU HƯỚNG: mông lung ngành nghề, trì, dễ theo bạn bè. " +
      "KHÔNG: nhảy việc/ngành mỗi quý vì FOMO. " +
      "NÊN: thử có kỳ hạn (3–6 tháng) + tiêu chí đo; bám 1 kỹ năng lõi. " +
      "CƠ CHẾ: hạn mờ = cần khung ngoài (mentor, deadline), không cần thêm lựa chọn.",
  },
  // ----- Mở rộng: cách cục / quan hệ / hạn / điểm mù -----
  {
    id: "gh-sat-pha-tham",
    tags: ["thất sát", "phá quân", "tham lang", "cách cục", "biến động", "giải hóa"],
    title: "Sát Phá Tham — kỷ luật hóa biến động",
    source: SRC,
    level: "cao",
    patternIds: ["sat-pha-tham", "sat-pha-tham-dc", "sat-pha", "pha-tham"],
    requireAny: ["thất sát", "phá quân", "tham lang"],
    content:
      "XU HƯỚNG: thích khai phá, đổi hướng, rủi ro cao kèm cơ hội. " +
      "KHÔNG: đổ hết vốn không cắt lỗ; ôm 3 dự án nóng cùng lúc. " +
      "NÊN: quy tắc % vốn rủi ro; chốt lời/cắt lỗ viết sẵn; giữ 1 trụ thu nhập ổn. " +
      "CƠ CHẾ: hóa “biến” thành quy trình, không cấm bản năng khai phá.",
  },
  {
    id: "gh-phu-tuong",
    tags: ["thiên phủ", "thiên tướng", "tử vi", "ổn định", "quản trị", "giải hóa"],
    title: "Phủ Tướng / đế ấn — sâu chuyên môn, thủ thành",
    source: SRC,
    level: "vua",
    patternIds: ["phu-tuong", "tu-phu", "tu-phu-dc", "liem-tuong", "liem-tuong-dc", "tu-phu-vu-tuong", "vu-tuong", "vu-tuong-dc"],
    requireAny: ["thiên phủ", "thiên tướng", "tử vi"],
    content:
      "XU HƯỚNG: hợp quản trị, thủ thành, hệ thống, uy tín tổ chức. " +
      "KHÔNG: bỏ khung nhảy startup mạo hiểm chỉ vì FOMO. " +
      "NÊN: leo bậc chuyên môn/quản lý; xây đội; quy trình giữ của. " +
      "CƠ CHẾ: phú quý kiểu ổn + danh, không kiểu bùng nổ một phát.",
  },
  {
    id: "gh-luu-ky-no",
    tags: ["hóa kỵ", "lưu hóa kỵ", "nô bộc", "thị phi", "bạn bè", "giải hóa"],
    title: "Lưu/Hóa Kỵ chạm Nô — siết mạng xã hội & nhóm",
    source: SRC,
    level: "cao",
    requireAny: ["hóa kỵ", "nô bộc", "liêm trinh"],
    content:
      "XU HƯỚNG: năm/hạn dễ dính thị phi nhóm, bị lôi vào chuyện không phải của mình. " +
      "KHÔNG: tranh cãi MXH; ký/bảo lãnh thay bạn; group chat bức xúc. " +
      "NÊN: giảm joint-venture; ưu tiên việc một mình/team có quy chế; im khi không cần thắng. " +
      "CƠ CHẾ: giảm bề mặt dính hơn là “chứng minh trong sạch” ồn ào.",
  },
  {
    id: "gh-thai-tue-menh-han",
    tags: ["thái tuế", "lưu thái tuế", "mệnh", "kình dương", "năm bản lề", "giải hóa"],
    title: "Thái Tuế (+Kình) trùng Mệnh — năm chọn hướng",
    source: SRC,
    level: "cao",
    requireAny: ["thái tuế", "lưu thái tuế", "kình dương"],
    content:
      "XU HƯỚNG: bị đẩy ra ánh đèn, phải quyết (học/nghề); dễ bốc đồng–hiếu thắng. " +
      "KHÔNG: quyết nóng vì sĩ diện; cãi để thắng người lớn. " +
      "NÊN: 1–2 mục tiêu năm; checklist giấy tờ; người review trước khi nộp/ký. " +
      "CƠ CHẾ: năm trung tâm → giảm biến số, tăng quy trình.",
  },
  {
    id: "gh-phu-mau-kinh",
    tags: ["kình dương", "phụ mẫu", "cấp trên", "gia đình", "giải hóa"],
    title: "Kình/áp tại Phụ Mẫu — kênh với cha mẹ–sếp",
    source: SRC,
    level: "vua",
    requireAny: ["kình dương", "phụ mẫu"],
    content:
      "XU HƯỚNG: ngột ngạt vì áp đặt; dễ phản kháng cứng hoặc im lặng độc. " +
      "KHÔNG: cãi đỉnh điểm lúc nóng; tuyệt giao miệng. " +
      "NÊN: hẹn giờ nói việc (không cảm xúc); văn bản mục tiêu; 1 người trung gian nếu cần. " +
      "CƠ CHẾ: tách “kỷ luật hữu ích” khỏi “cái tôi hai phía”.",
  },
  {
    id: "gh-di-cu-mon",
    tags: ["cự môn", "thiên di", "xuất ngoại", "thị phi", "giải hóa"],
    title: "Cự Môn Thiên Di — đi xa & miệng",
    source: SRC,
    level: "vua",
    requireAny: ["cự môn", "thiên di"],
    content:
      "XU HƯỚNG: ra ngoài dễ khẩu thiệt; cũng dễ danh nhờ miệng nếu có khung. " +
      "KHÔNG: tranh luận đất khách; cam kết miệng khi đi công tác/du học. " +
      "NÊN: nghề dùng lời có quy trình; chuẩn bị thuốc–an toàn giao thông; im khi không cần. " +
      "CƠ CHẾ: hướng Cự thành công cụ, không thành sân si nơi lạ.",
  },
  {
    id: "gh-tu-hoa-ky-menh",
    tags: ["tự hóa", "hóa kỵ", "mệnh", "tài bạch", "thiên đồng", "giải hóa", "điểm mù"],
    title: "Mệnh/phi Kỵ tự siết — overthink tài & an toàn",
    source: SRC,
    level: "cao",
    requireAny: ["hóa kỵ", "thiên cơ", "thiên đồng"],
    content:
      "XU HƯỚNG: tự tạo áp lực tiền/an ninh; lo trước khi sự việc xảy ra. " +
      "KHÔNG: trì quyết định đến hết hạn vì “chưa đủ data”. " +
      "NÊN: quyết trong 48h với 3 tiêu chí viết sẵn; tách ví an toàn vs ví thử. " +
      "CƠ CHẾ: Kỵ nội sinh = sửa thói quen quyết, không chỉ kiếm thêm.",
  },
  {
    id: "gh-dao-hoa-ranh-gioi",
    tags: ["tham lang", "đào hoa", "hồng loan", "phu thê", "ranh giới", "giải hóa"],
    title: "Đào hoa / Tham — ranh giới tình–nghề",
    source: SRC,
    level: "vua",
    requireAny: ["tham lang", "đào hoa", "hồng loan", "thiên hỉ"],
    content:
      "XU HƯỚNG: duyên rộng, dễ mờ ranh nghề–tình, FOMO quan hệ. " +
      "KHÔNG: trộn bạn–tiền–tình không khung; cam kết mập mờ. " +
      "NÊN: ranh giới rõ; nếu nghề giao tiếp thì biến duyên thành thương hiệu/khách, không thành scandal. " +
      "CƠ CHẾ: quản biên, không cấm duyên.",
  },
  {
    id: "gh-an-than-nhuoc",
    tags: ["ấn", "thân nhược", "bát tự", "học", "quá tải", "giải hóa"],
    title: "Thiếu Ấn / thân nhược — đừng đốt Ấn",
    source: SRC,
    level: "vua",
    requireAny: ["thân nhược", "ấn", "học"],
    content:
      "XU HƯỚNG: học/chứng chỉ dễ bị Hỏa–áp lực bào; kiêu chủ quan phút chót. " +
      "KHÔNG: thức trắng dồn thi; cãi thầy/sếp khi thiếu ngủ. " +
      "NÊN: lịch ngủ; ôn theo chặng; mentor/ấn (người nâng); check giấy tờ 2 lần. " +
      "CƠ CHẾ: bảo vệ kênh học–sức trước khi tăng tham vọng.",
  },
  {
    id: "gh-ma-giao-thong",
    tags: ["thiên mã", "thiên hình", "thiên di", "giao thông", "giải hóa"],
    title: "Mã / Hình / Di — đi lại an toàn",
    source: SRC,
    level: "vua",
    requireAny: ["thiên mã", "thiên hình", "thiên di"],
    content:
      "XU HƯỚNG: động, xa nhà, dễ chủ quan đường xá khi nóng/vội. " +
      "KHÔNG: lái khi bực; phóng; bỏ bảo hộ. " +
      "NÊN: checklist xe–đường; nghỉ giữa chặng; nghề di động ok nếu có quy trình an toàn. " +
      "CƠ CHẾ: giữ động lực Mã, cắt rủi ro Hình.",
  },
  {
    id: "gh-co-nguyet-muu-si",
    tags: ["thiên cơ", "thái âm", "mưu sĩ", "overthink", "điểm mù", "giải hóa"],
    title: "Cơ–Nguyệt mưu sĩ — execution > kế hoạch",
    source: SRC,
    level: "cao",
    patternIds: ["co-nguyet", "co-nguyet-dc", "co-dong", "sat-co", "co-cu", "co-cu-dc"],
    requireAny: ["thiên cơ", "thái âm"],
    content:
      "XU HƯỚNG: kế hoạch đẹp, chậm bung; mù = tin “nghĩ kỹ = đã làm”. " +
      "KHÔNG: ôm dự án một mình không deadline. " +
      "NÊN: vai tham mưu/chuyên môn; sprint 1–2 tuần; 1 người accountability. " +
      "CƠ CHẾ: lấp khoảng trống plan→ship.",
  },
  {
    id: "gh-van-khuc-ky-giay-to",
    tags: ["văn khúc", "hóa kỵ", "giấy tờ", "hợp đồng", "phu thê", "giải hóa"],
    title: "Văn Khúc Kỵ — giấy tờ & lời hứa",
    source: SRC,
    level: "cao",
    requireAny: ["văn khúc", "hóa kỵ"],
    content:
      "XU HƯỚNG: lệch sóng lời nói, cam kết miệng vỡ, sự bỏ ngỏ các kịch bản phát sinh. " +
      "KHÔNG: hứa miệng chuyện lớn; ký vội không đọc. " +
      "NÊN: mọi cam kết quan trọng có chữ; checklist trước hạn nộp; nói rõ–viết rõ. " +
      "CƠ CHẾ: sửa kênh thông tin/giấy tờ trước khi đổ lỗi người.",
  },
  {
    id: "gh-tuan-triet-ha-giong",
    tags: ["tuần", "triệt", "mệnh", "phát cách", "giải hóa", "điểm mù"],
    title: "Tuần/Triệt cung trọng — hạ giọng, không tự xóa",
    source: SRC,
    level: "vua",
    requireAny: ["tuần", "triệt"],
    content:
      "XU HƯỚNG: lực quý/phát bị lọc; dễ cảm “chưa tới lúc” (điểm mù tự giảm lực). " +
      "KHÔNG: phủ nhận cả cách; cũng không ảo tưởng phú quý full. " +
      "NÊN: phát phần còn sáng (Khoa/chuyên môn); kiên nhẫn nhịp; chứng minh bằng sản phẩm nhỏ. " +
      "CƠ CHẾ: Tuần/Triệt = giảm volume, không = xóa bản ngã.",
  },
  {
    id: "gh-loc-ton-tieu-xai",
    tags: ["lộc tồn", "hóa lộc", "tiêu xài", "giữ tiền", "giải hóa"],
    title: "Lộc Tồn / Lộc — có lộc vẫn cần van",
    source: SRC,
    level: "thap",
    requireAny: ["lộc tồn", "hóa lộc"],
    content:
      "XU HƯỚNG: dễ có khoản vào; cũng dễ “thấy có là tiêu”. " +
      "KHÔNG: coi mọi khoản lộc là free-spend. " +
      "NÊN: rule trích % ngay khi vào; quỹ mục tiêu đặt tên. " +
      "CƠ CHẾ: Lộc là dòng, van là thói quen.",
  },
  // —— Gap / cách cục master (P1) ——
  {
    id: "gh-vu-tham-cat-lo",
    tags: ["vũ khúc", "tham lang", "vũ tham", "tiền", "cắt lỗ", "giải hóa"],
    title: "Vũ Tham — kiếm quyết, giữ bằng rule",
    source: SRC,
    level: "cao",
    patternIds: ["vu-tham", "vu-pha", "vu-sat"],
    requireAny: ["vũ khúc", "tham lang"],
    content:
      "XU HƯỚNG: tiền qua quyết đoán/ham muốn; biến động lớn khi đánh ngắn hạn theo tài sản rủi ro nếu không có van kỷ luật. " +
      "KHÔNG: đổ hết vốn cảm hứng, đòn bẩy vượt sức, gộp ví chi–tích. " +
      "NÊN: cắt lỗ/chốt lời viết sẵn; chỉ đánh phần vốn “chết được”; trích % cứng vào kênh khó rút. " +
      "CƠ CHẾ: Vũ–Tham là động cơ, rule là thắng cách — không thắng bằng máu lạnh.",
  },
  {
    id: "gh-nhat-nguyet-lech",
    tags: ["thái dương", "thái âm", "nhật nguyệt", "cân bằng", "danh", "tình", "giải hóa"],
    title: "Nhật–Nguyệt hội — cân bằng danh và cảm",
    source: SRC,
    level: "vua",
    patternIds: ["am-duong-hoi", "nhat-luong", "cu-nhat"],
    requireAny: ["thái dương", "thái âm"],
    content:
      "XU HƯỚNG: một bên sáng (danh/việc) một bên cảm (nhà/lòng) — lệch hãm = lệch sóng. " +
      "KHÔNG: hy sinh hết nội tâm vì danh, hoặc chìm cảm xúc bỏ việc. " +
      "NÊN: lịch nghỉ cố định; một kênh xả cảm; việc quan trọng không quyết lúc kiệt. " +
      "CƠ CHẾ: Nhật–Nguyệt là nhịp đôi — sửa lịch trước khi sửa “tính cách”.",
  },
  {
    id: "gh-tu-pha-vi-the",
    tags: ["tử vi", "phá quân", "tử phá", "quyền lực", "cải tổ", "giải hóa"],
    title: "Tử Phá — cải tổ vị thế, đừng đập bàn cờ",
    source: SRC,
    level: "vua",
    patternIds: ["tu-pha", "tu-tham"],
    requireAny: ["tử vi", "phá quân"],
    content:
      "XU HƯỚNG: uy gặp phá — thăng trầm vị trí; muốn đập đi xây lại. " +
      "KHÔNG: sa thải/đốt cầu quan hệ một lúc; tuyên bố lớn khi nóng. " +
      "NÊN: cải tổ theo phase (30–90 ngày); giữ ê-kíp lõi; văn bản quyết định. " +
      "CƠ CHẾ: Phá là công cụ tái tạo, không phải bản năng xả.",
  },
  {
    id: "gh-liem-sat-24h",
    tags: ["liêm trinh", "thất sát", "liêm sát", "nóng", "quyết đoán", "giải hóa"],
    title: "Liêm Sát — dứt khoát sau 24h nguội",
    source: SRC,
    level: "cao",
    patternIds: ["liem-sat", "liem-sat-dc", "liem-tham"],
    requireAny: ["liêm trinh", "thất sát"],
    content:
      "XU HƯỚNG: cương nghị, chốt nhanh, dễ hiếu thắng / tự chuốc va. " +
      "KHÔNG: cãi + quyết lớn cùng lúc (sếp–người thân–đối tác). " +
      "NÊN: rule 24h với quyết nóng; kênh xả = vận động/deadline nhỏ; giữ chứng từ. " +
      "CƠ CHẾ: Sát khí cần van thời gian, không cần “hiền” giả.",
  },
];

/** Mầm điểm mù (máy) → id giải hóa ưu tiên — dùng chung interpret/chat. */
export const BLIND_SPOT_TO_GH: Record<string, string[]> = {
  OVERTHINK: ["gh-thien-co-tuan", "gh-co-nguyet-muu-si", "gh-tu-hoa-ky-menh"],
  MUUSI: ["gh-co-nguyet-muu-si", "gh-thien-co-tuan"],
  MIENG: ["gh-cu-mon-khau", "gh-di-cu-mon"],
  DUC: ["gh-dao-hoa-ranh-gioi"],
  CUNG: ["gh-kinh-da-menh", "gh-phu-mau-kinh"],
  TUGIAM: ["gh-tuan-triet-ha-giong", "gh-thien-co-tuan"],
  TINSAI: ["gh-khong-kiep-no", "gh-hoa-ky-no-liem", "gh-luu-ky-no"],
  LECHSONG: ["gh-hoa-ky-van-khuc-phu", "gh-van-khuc-ky-giay-to"],
  KIEMGIU: ["gh-sinh-tai-thu-tai", "gh-tu-hoa-loc-tai", "gh-loc-ton-tieu-xai"],
  THANGANH: ["gh-thien-hinh-tat", "gh-hoa-linh-ap-luc"],
  CHAPAI: ["gh-van-khuc-ky-giay-to", "gh-hoa-ky-van-khuc-phu"],
  BANLE: ["gh-thai-tue-menh-han", "gh-luu-thai-tue-menh"],
};

const norm = (s: string) =>
  String(s || "")
    .normalize("NFC")
    .toLowerCase()
    .trim();

const fold = (s: string) =>
  norm(s)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d");

function poolHas(pool: Set<string>, key: string): boolean {
  const k = fold(key);
  if (!k) return false;
  for (const p of pool) {
    if (p.includes(k) || k.includes(p)) return true;
  }
  return false;
}

function buildPool(stars: string[]): Set<string> {
  const pool = new Set<string>();
  for (const s of stars) {
    const f = fold(s.replace(/\(.*\)/g, ""));
    if (f.length >= 2) pool.add(f);
    // tách "Hóa Kỵ", "Địa Không"
    for (const part of f.split(/[\s,/|+]+/)) {
      if (part.length >= 2) pool.add(part);
    }
  }
  return pool;
}

function passesGate(entry: GiaiHoaEntry, pool: Set<string>): boolean {
  if (entry.requireAll?.length) {
    if (!entry.requireAll.every((k) => poolHas(pool, k))) return false;
  }
  if (entry.requireAny?.length) {
    if (!entry.requireAny.some((k) => poolHas(pool, k))) return false;
  }
  return true;
}

export interface RetrieveGiaiHoaContext {
  stars?: string[];
  query?: string;
  topics?: string[];
  /** patternId từ detect cách cục máy — boost + force-include mẩu map */
  patternIds?: string[];
  /** id gh-* ép lấy (blind spot / map) — vẫn nên khớp gate nếu có require* */
  forcedIds?: string[];
}

/**
 * Chỉ lấy mẩu giải hóa khớp gate sao trên lá.
 * topN nhỏ (mặc định 5) — đủ hành động, không chiếm prompt.
 * patternIds: ưu tiên mẩu gắn cách cục máy (máy nhận cách → inject mẩu đúng).
 */
export function retrieveGiaiHoa(ctx: RetrieveGiaiHoaContext, topN = 5): GiaiHoaEntry[] {
  const pool = buildPool([...(ctx.stars ?? []), ...(ctx.topics ?? [])]);
  const q = fold(ctx.query || "");
  const patternSet = new Set((ctx.patternIds ?? []).map((p) => String(p).trim()).filter(Boolean));
  const forcedSet = new Set((ctx.forcedIds ?? []).map((p) => String(p).trim()).filter(Boolean));

  const byId = new Map(GIAI_HOA_KNOWLEDGE.map((e) => [e.id, e]));
  const picked: GiaiHoaEntry[] = [];
  const seen = new Set<string>();

  const tryPush = (e: GiaiHoaEntry | undefined, relaxGate = false) => {
    if (!e || seen.has(e.id) || picked.length >= topN) return;
    // Luôn gate sao — trừ forcedId khi pool đã có kim khớp requireAny lỏng
    if (!passesGate(e, pool)) {
      if (!relaxGate) return;
      // forced: chỉ nới nếu không có requireAll
      if (e.requireAll?.length) return;
    }
    seen.add(e.id);
    picked.push(e);
  };

  // 1) Forced ids (blind / map)
  for (const id of forcedSet) tryPush(byId.get(id), true);

  // 2) Mẩu gắn patternIds máy
  if (patternSet.size) {
    for (const e of GIAI_HOA_KNOWLEDGE) {
      if (!e.patternIds?.some((p) => patternSet.has(p))) continue;
      tryPush(e);
    }
  }

  // 3) Score thường
  const scored = GIAI_HOA_KNOWLEDGE.filter((e) => passesGate(e, pool) && !seen.has(e.id)).map(
    (entry) => {
      let score = 1;
      if (entry.level === "cao") score += 2;
      if (entry.level === "vua") score += 1;
      for (const t of entry.tags) {
        if (poolHas(pool, t)) score += 2;
      }
      if (entry.patternIds?.some((p) => patternSet.has(p))) score += 6;
      if (q) {
        for (const t of entry.tags) {
          if (q.includes(fold(t))) score += 2;
        }
        if (fold(entry.title).split(" ").some((w) => w.length > 3 && q.includes(w))) score += 1;
      }
      return { entry, score };
    },
  );

  scored.sort((a, b) => b.score - a.score);
  for (const s of scored) {
    if (picked.length >= topN) break;
    tryPush(s.entry);
  }
  return picked.slice(0, topN);
}

export function giaiHoaToPromptText(entries: GiaiHoaEntry[]): string {
  if (!entries.length) return "";
  const body = entries
    .map((e) => `• [${e.title}]${e.level ? ` (${e.level})` : ""}: ${e.content}`)
    .join("\n");
  return (
    `=== GIẢI HÓA THỰC HÀNH (PHỤ — BỔ SUNG HÀNH ĐỘNG) ===\n` +
    `Dưới máy (iztro/cheat sheet) + Đàm Tinh. Chỉ mẩu khớp sao trên lá. ` +
    `Nói ĐƠN GIẢN: xu hướng + KHÔNG + NÊN + cơ chế. ` +
    `CẤM đổi luận cốt / thêm sao / phủ nhận Đàm Tinh. ` +
    `CẤM cúng bái / “hết hạn 100%” / bịa ngoài list. ` +
    `Không thay tư vấn y tế / pháp lý / tài chính chuyên nghiệp.\n` +
    body
  );
}
