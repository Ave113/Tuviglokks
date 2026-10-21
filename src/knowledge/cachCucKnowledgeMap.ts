// ============================================================================
// CẦU NỐI CÁCH CỤC MÁY → TRI THỨC (KINH NGHIỆM + GIẢI HÓA)
//
// Một nguồn sự thật: detect patternId ở cachCuc.ts → map sang mẩu kn-/gh-
// + chuỗi nhân quả cô đọng (máy viết sẵn, AI chỉ diễn, không tự đặt tên cách).
// ============================================================================

import type { CachCucQuality } from "../utils/cachCuc";

export interface CachCucKnowledgeLink {
  /** Khớp patternId gốc (không -dc) */
  patternId: string;
  /** Tên hiển thị (có thể khớp name trên match) */
  name: string;
  /**
   * Chuỗi nhân quả 1–2 câu: sao × cấu trúc → cơ chế → đời thực.
   * AI bám logic này, không chép như mục lục.
   */
  causal: string;
  /** Giọng luận theo quality máy */
  voiceByQuality: Partial<Record<CachCucQuality, string>>;
  knIds: string[];
  ghIds: string[];
  /** Lĩnh vực đời sống ưu tiên khi diễn */
  lifeDomains: string[];
}

/**
 * Master map — patternId base (bỏ hậu tố -dc).
 * Mỗi entry = “não” của cách: logic + neo tri thức.
 */
export const CACH_CUC_KNOWLEDGE_LINKS: CachCucKnowledgeLink[] = [
  {
    patternId: "sat-pha-tham",
    name: "Sát Phá Tham",
    causal:
      "Thất Sát × Phá Quân × Tham Lang hội tam phương = động lực phá–khai–muốn: " +
      "sức bứt phá lớn nhưng biên độ thăng trầm rộng; thiếu kỷ luật = tự chuốc sóng.",
    voiceByQuality: {
      thanh: "Luận mạnh: hợp môi trường biến động có quy tắc (startup, sales, thị trường).",
      trung: "Có lực nhưng lệch nhịp — cần van rủi ro, không đổ hết vốn cảm hứng.",
      pha: "Hạ giọng phú quý; nhấn hao do bốc đồng / đổi hướng giữa chừng.",
      ham: "Khó phát cách; ưu tiên ổn định trước, khai phá liều nhỏ.",
    },
    knIds: ["kn-sat-pha-tham-han", "kn-sat-pha-tham-liem-vs-sat", "kn-hung-tinh-dac-cach"],
    ghIds: ["gh-sat-pha-tham", "gh-dao-hoa-ranh-gioi"],
    lifeDomains: ["sự nghiệp", "tiền bạc", "tính cách", "rủi ro"],
  },
  {
    patternId: "sat-pha",
    name: "Sát Phá",
    causal:
      "Sát + Phá không đủ Tham = phá cách / đổi hướng mạnh nhưng thiếu “muốn” kéo dài; " +
      "dễ nửa đường gãy nếu không có mục tiêu neo.",
    voiceByQuality: {
      thanh: "Hợp giai đoạn tái cấu trúc, cắt bỏ cũ.",
      pha: "Cẩn trọng đổ vỡ quan hệ–dự án do nóng vội.",
    },
    knIds: ["kn-hung-tinh-dac-cach", "kn-sat-pha-tham-han"],
    ghIds: ["gh-sat-pha-tham"],
    lifeDomains: ["sự nghiệp", "biến động"],
  },
  {
    patternId: "pha-tham",
    name: "Phá Tham",
    causal:
      "Phá Quân × Tham Lang = dục vọng đổi mới + ham muốn: dễ “muốn cái mới” liên tục; " +
      "cần khung giữ tiền/danh trước khi phá.",
    voiceByQuality: {
      thanh: "Hợp sáng tạo–thương mại có vòng lặp đo lường.",
      ham: "Dễ hao vì ham; siết chi tiêu và ranh giới tình–tiền.",
    },
    knIds: ["kn-tham-liem-ty-hoi", "kn-sat-pha-tham-han"],
    ghIds: ["gh-sat-pha-tham", "gh-dao-hoa-ranh-gioi"],
    lifeDomains: ["tiền bạc", "tình cảm", "đổi mới"],
  },
  {
    patternId: "co-nguyet-dong-luong",
    name: "Cơ Nguyệt Đồng Lương",
    causal:
      "Cơ–Nguyệt–Đồng–Lương = mưu sĩ hệ thống: giỏi tham mưu–hành chính–chuyên môn sâu; " +
      "yếu cầm đầu mạo hiểm một mình → đường sự nghiệp = chuyên gia / bộ máy, không cờ bạc vận.",
    voiceByQuality: {
      thanh: "Luận mạnh hướng ổn định–uy tín–tri thức.",
      trung: "Có chất mưu nhưng dễ overthink — deadline + đồng sự tin cậy.",
      ham: "Hạ giọng “quý”; vẫn giữ lợi thế kế hoạch nếu có Khoa/Xương.",
    },
    knIds: ["kn-co-luong-quyen", "kn-co-luong-mao-dau-tai", "kn-dong-luong-ty-hoi"],
    ghIds: ["gh-co-nguyet-chuyen-mon", "gh-co-nguyet-muu-si", "gh-thien-co-tuan"],
    lifeDomains: ["sự nghiệp", "học hành", "tính cách"],
  },
  {
    patternId: "co-nguyet",
    name: "Cơ Nguyệt",
    causal:
      "Thiên Cơ × Thái Âm = mưu + cảm: kế hoạch tài chính/tình cảm nhạy; " +
      "dễ lao tâm, cần khung quyết trong 48h.",
    voiceByQuality: {
      thanh: "Hợp tư vấn–phân tích–tài chính nhẹ.",
      ham: "Overthink + dao động cảm xúc — siết quy trình.",
    },
    knIds: ["kn-co-luong-quyen", "kn-am-duong-ham"],
    ghIds: ["gh-co-nguyet-muu-si", "gh-thien-co-tuan"],
    lifeDomains: ["tính cách", "tiền bạc", "tình cảm"],
  },
  {
    patternId: "nguyet-luong",
    name: "Nguyệt Lương",
    causal:
      "Thái Âm × Thiên Lương = nuôi–chữa–dạy: phúc hậu, hướng dẫn; " +
      "dễ gánh việc người khác — cần ranh giới.",
    voiceByQuality: {
      thanh: "Hợp giáo dục–chăm sóc–cố vấn.",
      pha: "Dễ hao phúc vì ôm đồm.",
    },
    knIds: ["kn-co-luong-quyen", "kn-dong-luong-ty-hoi"],
    ghIds: ["gh-co-nguyet-chuyen-mon"],
    lifeDomains: ["phúc đức", "quan hệ", "nghề phục vụ"],
  },
  {
    patternId: "dong-luong-hoi",
    name: "Đồng Lương (hội)",
    causal:
      "Đồng + Lương hội = ôn hòa phục vụ; lực nhẹ hơn full Cơ Nguyệt Đồng Lương — " +
      "hợp hỗ trợ/giáo dục, không hợp sát phạt thị trường.",
    voiceByQuality: { thanh: "Ổn định, ít sóng.", trung: "Phụ trợ tốt, chủ lực vừa." },
    knIds: ["kn-dong-luong-ty-hoi"],
    ghIds: ["gh-co-nguyet-chuyen-mon"],
    lifeDomains: ["nghề phục vụ", "phúc đức"],
  },
  {
    patternId: "co-dong",
    name: "Cơ Đồng",
    causal:
      "Cơ × Đồng = linh hoạt dịch vụ–kế hoạch ngắn; dễ đổi ý — neo OKR tuần.",
    voiceByQuality: { thanh: "Thích nghi tốt.", pha: "Thiếu kiên trì mục tiêu dài." },
    knIds: ["kn-dong-luong-ty-hoi", "kn-thien-dong-tuat-dinh"],
    ghIds: ["gh-co-nguyet-muu-si"],
    lifeDomains: ["sự nghiệp", "tính cách"],
  },
  {
    patternId: "tu-phu",
    name: "Tử Phủ",
    causal:
      "Tử Vi × Thiên Phủ = đế tọa thủ thành: quản trị, giữ vị, uy; " +
      "thiếu phụ tá / ngộ sát thì cô quân — khen quyền nhưng nhắc ê-kíp.",
    voiceByQuality: {
      thanh: "Luận mạnh quản trị–thủ thành–uy tín tổ chức.",
      pha: "Uy có, ê-kíp yếu — đừng ôm một mình.",
      ham: "Khó phát đế khí; làm chuyên sâu hẹp hơn cầm trùm.",
    },
    knIds: ["kn-thien-phu-thu-thanh", "kn-bo-dep-menh"],
    ghIds: ["gh-phu-tuong"],
    lifeDomains: ["sự nghiệp", "quyền lực", "tổ chức"],
  },
  {
    patternId: "phu-tuong",
    name: "Phủ Tướng triều viên",
    causal:
      "Phủ × Tướng = hỗ tá–triều viên: ổn định, phúc thủ, chuyên môn trong hệ thống; " +
      "KHÔNG ép dồn vốn vào tài sản rủi ro/đầu cơ (chứng khoán, coin, forex...) — trái tạng.",
    voiceByQuality: {
      thanh: "Đường công chức / quản trị / cố vấn cao cấp.",
      trung: "Ổn nhưng cần Tả Hữu/Xương Khúc mới “đủ triều”.",
    },
    knIds: ["kn-thien-phu-thu-thanh", "kn-bo-dep-van-vu"],
    ghIds: ["gh-phu-tuong", "gh-co-nguyet-chuyen-mon"],
    lifeDomains: ["sự nghiệp", "ổn định", "phúc đức"],
  },
  {
    patternId: "cu-nhat",
    name: "Cự Nhật",
    causal:
      "Cự Môn × Thái Dương = miệng × sáng: danh tiếng–biện luận–thị phi cùng một kênh; " +
      "lời nói = tài sản và rủi ro.",
    voiceByQuality: {
      thanh: "Hợp luật–truyền thông–bán hàng có chứng từ.",
      ham: "Dễ thị phi / cháy danh — im hơi văn bản.",
    },
    knIds: ["kn-cu-mon-thach-ngoc", "kn-cu-ky-khau-thiet", "kn-cu-dong-tran"],
    ghIds: ["gh-cu-mon-khau", "gh-di-cu-mon"],
    lifeDomains: ["danh tiếng", "miệng", "sự nghiệp"],
  },
  {
    patternId: "tu-tham",
    name: "Tử Tham",
    causal:
      "Tử Vi × Tham Lang = quyền lực × dục vọng: hút người/cơ hội mạnh; " +
      "điểm mù = biên giới tình–tiền–quyền.",
    voiceByQuality: {
      thanh: "Charisma + tài — quản ranh giới.",
      pha: "Dễ thị phi đào hoa / xung đột lợi ích.",
    },
    knIds: ["kn-tham-liem-ty-hoi", "kn-bo-dep-menh"],
    ghIds: ["gh-dao-hoa-ranh-gioi", "gh-phu-tuong"],
    lifeDomains: ["quyền lực", "tình cảm", "tiền bạc"],
  },
  {
    patternId: "liem-tuong",
    name: "Liêm Tướng",
    causal:
      "Liêm × Tướng = kỷ luật + ấn tín: pháp độ, chính trực; " +
      "Liêm hãm = cứng/độc đoán — Tướng miếu mới chế được.",
    voiceByQuality: {
      thanh: "Hợp quản trị–tuân thủ–an ninh quy trình.",
      trung: "Có khung nhưng dễ căng quan hệ cấp dưới.",
      ham: "Cứng nhắc gây vỡ — học mềm hóa giao tiếp.",
    },
    knIds: ["kn-kinh-da-phu", "kn-bo-dep-menh"],
    ghIds: ["gh-phu-tuong", "gh-kinh-da-menh"],
    lifeDomains: ["sự nghiệp", "kỷ luật", "quan hệ"],
  },
  {
    patternId: "liem-sat",
    name: "Liêm Trinh Thất Sát",
    causal:
      "Liêm × Sát = cương nghị sát phạt: quyết liệt, hung túc; " +
      "thành công qua áp lực — điểm mù hiếu thắng.",
    voiceByQuality: {
      thanh: "Hợp việc cần dứt khoát (khủng hoảng, đàm phán cứng).",
      ham: "Dễ tự chuốc thù — trì 24h quyết nóng.",
    },
    knIds: ["kn-sat-pha-tham-liem-vs-sat", "kn-hung-tinh-dac-cach"],
    ghIds: ["gh-kinh-da-menh", "gh-sat-pha-tham"],
    lifeDomains: ["sự nghiệp", "xung đột", "tính cách"],
  },
  {
    patternId: "liem-tham",
    name: "Liêm Tham",
    causal:
      "Liêm × Tham = dục + kỷ luật: quyền mưu–đào hoa có khung; " +
      "lệch = tham thủ đoạn / rối tình.",
    voiceByQuality: {
      thanh: "Điều hướng dục vọng thành thương hiệu/quan hệ có biên.",
      pha: "Siết ranh giới tình–tiền.",
    },
    knIds: ["kn-tham-liem-ty-hoi", "kn-phu-the-co-linh-hoa"],
    ghIds: ["gh-dao-hoa-ranh-gioi"],
    lifeDomains: ["tình cảm", "tiền bạc", "tính cách"],
  },
  {
    patternId: "vu-tham",
    name: "Vũ Tham",
    causal:
      "Vũ Khúc × Tham Lang = tài thực dụng × ham muốn: kiếm được qua quyết đoán; " +
      "điểm mù = giữ kém nếu gặp Hao/Không/Kỵ.",
    voiceByQuality: {
      thanh: "Hợp tài chính–thương mại có cắt lỗ.",
      pha: "Kiếm được–giữ kém: van tự động.",
    },
    knIds: ["kn-vu-pha-ty-hoi", "kn-tham-vu-suu-mui", "kn-song-loc"],
    ghIds: ["gh-sinh-tai-thu-tai", "gh-tu-hoa-loc-tai"],
    lifeDomains: ["tiền bạc", "sự nghiệp"],
  },
  {
    patternId: "vu-pha",
    name: "Vũ Phá",
    causal:
      "Vũ × Phá = tiền qua biến động: cơ hội trong khủng hoảng; " +
      "không có quy tắc = cháy tài khoản.",
    voiceByQuality: {
      thanh: "Trading/cơ cấu lại có rule.",
      ham: "Tránh đòn bẩy lớn.",
    },
    knIds: ["kn-vu-pha-ty-hoi", "kn-hung-tinh-dac-cach"],
    ghIds: ["gh-sinh-tai-thu-tai", "gh-sat-pha-tham"],
    lifeDomains: ["tiền bạc", "rủi ro"],
  },
  {
    patternId: "tu-pha",
    name: "Tử Phá",
    causal:
      "Tử × Phá = uy gặp phá: thăng trầm vị thế; " +
      "giữ đế khí bằng ê-kíp và không đập hết bàn cờ.",
    voiceByQuality: {
      thanh: "Tái tạo quyền lực qua cải tổ.",
      pha: "Mất vị do tự phá — chậm lại.",
    },
    knIds: ["kn-thien-phu-thu-thanh", "kn-hung-tinh-dac-cach"],
    ghIds: ["gh-phu-tuong", "gh-sat-pha-tham"],
    lifeDomains: ["quyền lực", "biến động"],
  },
  {
    patternId: "sat-co",
    name: "Sát Cơ",
    causal:
      "Sát × Cơ = quyết trong áp lực + mưu: hợp khủng hoảng; " +
      "dễ tính toán lạnh — giữ đạo đức nghề.",
    voiceByQuality: {
      thanh: "Chiến lược–an ninh–đàm phán cứng.",
      trung: "Đừng biến mưu thành đa nghi.",
    },
    knIds: ["kn-hung-tinh-dac-cach"],
    ghIds: ["gh-co-nguyet-muu-si", "gh-kinh-da-menh"],
    lifeDomains: ["sự nghiệp", "tính cách"],
  },
  {
    patternId: "dong-cu",
    name: "Đồng Cự",
    causal:
      "Đồng × Cự đồng cung = miệng–dịch vụ: biện luận, thị phi, nghề dùng lời; " +
      "mọi cam kết lớn → văn bản.",
    voiceByQuality: {
      thanh: "Hợp CSKH–giảng–luật nhẹ.",
      ham: "Khẩu thiệt — im và ghi.",
    },
    knIds: ["kn-cu-dong-tran", "kn-cu-ky-khau-thiet"],
    ghIds: ["gh-cu-mon-khau", "gh-di-cu-mon"],
    lifeDomains: ["miệng", "nghề giao tiếp"],
  },
  {
    patternId: "dong-luong-dc",
    name: "Đồng Lương (đồng cung)",
    causal: "Đồng Lương một cung = ôn hòa giữ của/nuôi dưỡng cục bộ — phúc nhẹ, ít sóng.",
    voiceByQuality: { thanh: "Ổn định nội tâm–gia đạo." },
    knIds: ["kn-dong-luong-ty-hoi"],
    ghIds: ["gh-co-nguyet-chuyen-mon"],
    lifeDomains: ["phúc đức", "gia đạo"],
  },
  {
    patternId: "co-nguyet-dc",
    name: "Cơ Nguyệt (đồng cung)",
    causal: "Cơ Nguyệt một cung = mưu cảm nén cục bộ — kế hoạch sâu, dễ trầm tư.",
    voiceByQuality: { thanh: "Phân tích sâu.", ham: "Overthink." },
    knIds: ["kn-co-luong-quyen"],
    ghIds: ["gh-co-nguyet-muu-si"],
    lifeDomains: ["tính cách", "tài chính cảm"],
  },
  {
    patternId: "liem-sat-dc",
    name: "Liêm Sát (đồng cung)",
    causal: "Liêm Sát một cung = hung túc tập trung — dứt khoát cực, va mạnh.",
    voiceByQuality: { thanh: "Việc khó cần chốt.", ham: "Tự chuốc thù." },
    knIds: ["kn-sat-pha-tham-liem-vs-sat"],
    ghIds: ["gh-kinh-da-menh"],
    lifeDomains: ["xung đột", "sự nghiệp"],
  },
  {
    patternId: "liem-tuong-dc",
    name: "Liêm Tướng (đồng cung)",
    causal: "Liêm Tướng một cung = kỷ luật + ấn tại chỗ — quản trị hẹp mà chắc.",
    voiceByQuality: { thanh: "Quy trình–tuân thủ." },
    knIds: ["kn-bo-dep-menh"],
    ghIds: ["gh-phu-tuong"],
    lifeDomains: ["kỷ luật", "sự nghiệp"],
  },
  {
    patternId: "cu-nhat-dc",
    name: "Cự Nhật (đồng cung)",
    causal: "Cự Nhật một cung = danh/miệng nén cục bộ — thị phi hoặc danh cùng chỗ.",
    voiceByQuality: { thanh: "Nghề miệng.", ham: "Cháy danh." },
    knIds: ["kn-cu-mon-thach-ngoc"],
    ghIds: ["gh-cu-mon-khau"],
    lifeDomains: ["danh tiếng", "miệng"],
  },
  {
    patternId: "tu-phu-dc",
    name: "Tử Phủ (đồng cung)",
    causal: "Tử Phủ một cung = đế tọa nén — uy/quản trị tại đúng cung đó.",
    voiceByQuality: { thanh: "Thủ thành tại cung." },
    knIds: ["kn-thien-phu-thu-thanh"],
    ghIds: ["gh-phu-tuong"],
    lifeDomains: ["quyền lực"],
  },
  {
    patternId: "sat-pha-tham-dc",
    name: "Sát Phá Tham (đồng cung)",
    causal: "Ba sát phá tham một cung = sóng cực mạnh tại đúng lĩnh vực cung — kỷ luật hóa hoặc vỡ.",
    voiceByQuality: {
      thanh: "Bứt phá đúng domain cung.",
      ham: "Biên độ nguy — van cứng.",
    },
    knIds: ["kn-sat-pha-tham-han"],
    ghIds: ["gh-sat-pha-tham"],
    lifeDomains: ["biến động", "rủi ro"],
  },
  // —— pattern mới (engine) ——
  {
    patternId: "co-luong",
    name: "Cơ Lương",
    causal:
      "Cơ × Lương = mưu + phúc thọ trí: cố vấn–kế hoạch dài hơi; " +
      "ít nóng vội, hợp nghề “nói có sách”.",
    voiceByQuality: {
      thanh: "Cố vấn–nghiên cứu–giáo huấn.",
      trung: "Chậm bung — OK nếu có deadline.",
    },
    knIds: ["kn-co-luong-quyen", "kn-co-luong-mao-dau-tai"],
    ghIds: ["gh-co-nguyet-chuyen-mon", "gh-co-nguyet-muu-si"],
    lifeDomains: ["sự nghiệp", "học hành"],
  },
  {
    patternId: "vu-sat",
    name: "Vũ Sát",
    causal:
      "Vũ × Sát = tiền × sát khí: quyết đoán tài chính trong áp lực; " +
      "thành thì đậm, thua thì đau — quy tắc cắt lỗ bắt buộc.",
    voiceByQuality: {
      thanh: "Tài chính–đàm phán cứng có khung.",
      ham: "Tránh cờ bạc vận / đòn bẩy.",
    },
    knIds: ["kn-vu-pha-ty-hoi", "kn-hung-tinh-dac-cach"],
    ghIds: ["gh-sinh-tai-thu-tai", "gh-sat-pha-tham"],
    lifeDomains: ["tiền bạc", "rủi ro"],
  },
  {
    patternId: "nhat-luong",
    name: "Nhật Lương",
    causal:
      "Thái Dương × Thiên Lương = sáng + che chở: danh chính, hướng dẫn công; " +
      "Dương hãm = hao danh/tình cha–cấp trên.",
    voiceByQuality: {
      thanh: "Uy tín–công chúng–che chở người dưới.",
      ham: "Hạ giọng danh; giữ sức và ranh giới gánh việc.",
    },
    knIds: ["kn-am-duong-ham", "kn-am-duong-dong-cung"],
    ghIds: ["gh-phu-tuong", "gh-co-nguyet-chuyen-mon"],
    lifeDomains: ["danh tiếng", "quan hệ cấp trên"],
  },
  {
    patternId: "am-duong-hoi",
    name: "Nhật Nguyệt hội",
    causal:
      "Thái Dương × Thái Âm hội tam phương = sáng–tối, danh–cảm: " +
      "nhịp đôi; lệch hãm một bên = lệch sóng tình–danh.",
    voiceByQuality: {
      thanh: "Cân bằng nội–ngoại, hợp nghề công chúng + chăm sóc.",
      pha: "Lệch nhịp tình cảm–danh tiếng — điều hòa lịch nghỉ.",
    },
    knIds: ["kn-am-duong-dong-cung", "kn-am-duong-hoa-ky", "kn-am-duong-ham"],
    ghIds: ["gh-hoa-ky-van-khuc-phu", "gh-dao-hoa-ranh-gioi"],
    lifeDomains: ["tình cảm", "danh tiếng", "cân bằng"],
  },
  {
    patternId: "tu-phu-vu-tuong",
    name: "Tử Phủ Vũ Tướng",
    causal:
      "Tử Vi × Thiên Phủ × Vũ Khúc × Thiên Tướng hội đủ = đế–khố–tài–ấn một khối: " +
      "uy quyền quản trị, thủ thành có lực; thiếu phụ tá (Tả/Hữu/Xương/Khúc) = uy hẹp, dễ ôm việc.",
    voiceByQuality: {
      thanh: "Luận mạnh điều hành tổng hợp–xây hệ thống; danh quyền đi đôi với giữ của.",
      trung: "Đủ bộ nhưng hẹp lực — chuyên sâu một mảng thay vì cầm trùm.",
      pha: "Hạ giọng đế khí — giữ vị bằng ê-kíp và quy trình, không mở rộng liều.",
      ham: "Khó phát bộ nặng; ưu tiên thủ thành nhỏ, tránh vay nợ mở rộng.",
    },
    knIds: ["kn-tu-phu-vu-tuong-toan", "kn-phu-tuong-on-dinh", "kn-thien-phu-thu-thanh"],
    ghIds: ["gh-phu-tuong"],
    lifeDomains: ["sự nghiệp", "quyền lực", "tổ chức"],
  },
  {
    patternId: "vu-tuong",
    name: "Vũ Tướng",
    causal:
      "Vũ Khúc × Thiên Tướng = tài thực dụng × ấn khuôn khổ: quyết đoán tài chính có kỷ luật; " +
      "đắc địa xu hướng bền hơn nhóm Sát Phá, hãm = công danh nhỏ, thăng giáng.",
    voiceByQuality: {
      thanh: "Hợp nghề kỷ luật–điều hành–tài chính có khung (quân–cảnh, an ninh, quản trị).",
      trung: "Đủ lực nhưng cần khuôn ngoài — chứng chỉ, cấp trên, quy trình.",
      pha: "Đi đường chuyên môn hẹp; tránh đòn bẩy và đổi hướng nóng.",
      ham: "Không thổi 'võ nghiệp'; giữ nhịp nhỏ, kỷ luật lịch trình.",
    },
    knIds: ["kn-vu-tuong-vo-nghiep", "kn-phu-tuong-on-dinh"],
    ghIds: ["gh-phu-tuong"],
    lifeDomains: ["sự nghiệp", "tiền bạc", "kỷ luật"],
  },
  {
    patternId: "co-cu",
    name: "Cơ Cự",
    causal:
      "Thiên Cơ × Cự Môn = mưu × miệng: cơ động, đa hứng thú, đổi hướng nhanh, giữ nhịp kém; " +
      "kỵ Hỏa/Linh (nóng vội + thị phi); gia đạo bất hòa thường ở miệng lưỡi — nên muộn/mềm.",
    voiceByQuality: {
      thanh: "Mưu nhanh + lợi khẩu — một mũi nhọn nghề, cam kết có chữ.",
      trung: "Nhiều tuyến dễ bỏ dở — sprint 1–2 tuần, 1 người nhắc.",
      pha: "Lệch nhịp kế hoạch–làm; siết quy trình, tránh hứa miệng.",
      ham: "Hạ giọng; giữ 1 việc chính, chậm 24h trước quyết.",
    },
    knIds: ["kn-co-cu-dong", "kn-cu-nhat-danh"],
    ghIds: ["gh-co-nguyet-muu-si", "gh-cu-mon-khau"],
    lifeDomains: ["tính cách", "sự nghiệp", "tình cảm"],
  },
];

const byId = new Map(
  CACH_CUC_KNOWLEDGE_LINKS.map((l) => [l.patternId, l] as const),
);

/** Bỏ hậu tố -dc / biến thể để tra map. */
export function normalizePatternId(patternId: string): string {
  const id = String(patternId || "").trim();
  if (!id) return "";
  if (id.endsWith("-dc")) return id.slice(0, -3);
  return id;
}

export function resolveCachCucKnowledge(patternId: string): CachCucKnowledgeLink | undefined {
  const raw = String(patternId || "").trim();
  if (!raw) return undefined;
  return byId.get(raw) || byId.get(normalizePatternId(raw));
}

export function collectKnowledgeIdsFromPatterns(patternIds: string[]): {
  knIds: string[];
  ghIds: string[];
  links: CachCucKnowledgeLink[];
} {
  const kn = new Set<string>();
  const gh = new Set<string>();
  const links: CachCucKnowledgeLink[] = [];
  const seenLink = new Set<string>();

  for (const pid of patternIds) {
    const link = resolveCachCucKnowledge(pid);
    if (!link) continue;
    if (!seenLink.has(link.patternId)) {
      seenLink.add(link.patternId);
      links.push(link);
    }
    link.knIds.forEach((id) => kn.add(id));
    link.ghIds.forEach((id) => gh.add(id));
  }
  return { knIds: [...kn], ghIds: [...gh], links };
}

/** Giọng ngắn theo quality — fallback nếu map thiếu. */
export function voiceForQuality(quality: CachCucQuality, link?: CachCucKnowledgeLink): string {
  const fromLink = link?.voiceByQuality?.[quality];
  if (fromLink) return fromLink;
  switch (quality) {
    case "thanh":
      return "Luận quả quyết trên trục cách này (cách thành).";
    case "trung":
      return "Luận vừa — có lực có hạn, không thổi phồng.";
    case "pha":
      return "Hạ giọng phát cách; nhấn chỗ lực giảm / dễ vỡ.";
    case "ham":
      return "Khó phát — ưu tiên phòng thủ + tu dưỡng, không hứa phú quý.";
    default:
      return "Luận có kiểm soát.";
  }
}
