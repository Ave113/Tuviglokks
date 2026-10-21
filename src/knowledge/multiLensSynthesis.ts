// ============================================================================
// ĐA CHIỀU LUẬN GIẢI — 7 DẢI QUANG PHỔ → 1 CHÙM THIÊN TÀI
//
// Không viết 7 bài rời. Mỗi đoạn trọng = đan tối thiểu 3 dải.
// Máy/cheat sheet = đo lường; AI = tổng hợp logic, không một phía.
// ============================================================================

/** 7 dải — id ổn định cho test / map. */
export const MULTI_LENS_IDS = [
  "phuong_phap_do_luong",
  "tam_ly_chuyen_hoa",
  "dinh_huong_can_bang",
  "ky_thuat_he_thong",
  "sac_mong",
  "hinh_tuong",
  "thuc_chien_may_do",
] as const;

export type MultiLensId = (typeof MULTI_LENS_IDS)[number];

export interface MultiLensDef {
  id: MultiLensId;
  /** Tên ngắn trên sheet */
  short: string;
  /** Tên đầy */
  title: string;
  /** Việc dải này làm */
  job: string;
  /** Cấm lệch một phía */
  ban: string;
  /** Neo máy ưu tiên (tên cheat sheet / dữ liệu) */
  machineAnchors: string[];
}

/**
 * Bảy dải — đầy đủ như user yêu cầu, cô đọng để AI nội hóa.
 */
export const MULTI_LENSES: MultiLensDef[] = [
  {
    id: "phuong_phap_do_luong",
    short: "Đo lường",
    title: "Chuẩn hóa Phương pháp & Đo lường",
    job:
      "Mọi kết luận neo dữ liệu máy: sao/cung/miếu–hãm, cách cục (thành/trung/phá/hãm), Tứ Hóa đã resolve, " +
      "thẻ năm, thẻ BT chéo, kích hoạt hạn. Có trọng số (mạnh/vừa/nhẹ); thiếu dữ liệu thì nói thiếu, không bịa.",
    ban: "Cấm luận bằng cảm hứng / 'tôi thấy' / bịa sao–cung–vận ngoài sheet.",
    machineAnchors: [
      "12 cung + quan hệ",
      "Cách cục (thành/trung/phá/hãm)",
      "Tứ Hóa bẩm sinh/phi/lưu",
      "Thẻ sự kiện năm",
      "Thẻ BT chéo",
      "Tuần/Triệt",
    ],
  },
  {
    id: "tam_ly_chuyen_hoa",
    short: "Tâm lý",
    title: "Chiều sâu Tâm lý & Động lực Chuyển hóa",
    job:
      "Từ sao×cung suy phản xạ vô thức, điểm mù, 'tự chuốc'. Chỉ ra động lực đổi được " +
      "(1–2 đòn bẩy hành vi), không chỉ mô tả tính cách tĩnh.",
    ban: "Cấm tâm lý suông không neo sao; cấm sỉ vả / hù dọa; cấm 'số phận đóng đinh'.",
    machineAnchors: ["Tính va đập & Điểm mù", "Tự Hóa", "Hóa Kỵ", "Lai Nhân", "Mệnh–Thân"],
  },
  {
    id: "dinh_huong_can_bang",
    short: "Định hướng",
    title: "Định hướng & Cân bằng",
    job:
      "Chỉ trục nên đẩy / nên hãm: nghề–tiền–tình–sức; Sinh tài vs Thủ tài; Mệnh vs Thân; " +
      "cát phát vs hung phòng. Cân bằng = biết chỗ nghiêng, không trung dung nhạt.",
    ban: "Cấm khuyên 'cân bằng mọi thứ' chung chung; cấm ép người đi ngược tạng lá.",
    machineAnchors: ["Hai trục tài", "Cách cục", "Phúc Đức", "Định cách phú quý", "BT chéo"],
  },
  {
    id: "ky_thuat_he_thong",
    short: "Hệ thống",
    title: "Kỹ thuật & Hệ thống hóa",
    job:
      "Nối mắt xích theo CỤM SAO → MẠCH MỘT NHỊP: Trục × (0–1 điều kiện) × (0–1 vector Hóa) = 1 cơ chế, " +
      "viết *thủ/hội/ngộ/phi Hóa* (cấm Sao@Cung). Gộp chân dung, không mục lục sao. Phân tầng bẩm sinh ≠ đại hạn ≠ lưu niên.",
    ban: "Cấm ≥4 tên sao/câu; cấm list catalog; cấm ký hiệu @; cấm gộp Kình=Đà=Không một giỏ; cấm nhầm tầng hạn.",
    machineAnchors: [
      "Tam phương tứ chính",
      "Phi Tứ Hóa",
      "Cấu trúc sát",
      "Cách cục logic",
      "Kích hoạt hạn",
    ],
  },
  {
    id: "sac_mong",
    short: "Sắc",
    title: "Sắc mỏng",
    job:
      "Dao mỏng: 1–2 câu chốt trúng, có trọng số, lạnh đủ để tỉnh. Ưu tiên điểm nóng " +
      "(va đập, kỵ, kích hoạt CAO, thẻ ÁP LỰC). Bớt từ, thêm lực.",
    ban: "Cấm dàn trải 12 cung đều; cấm bi kịch hóa lá êm; cấm sáo rỗng.",
    machineAnchors: ["Điểm mù", "Vùng sát/kỵ", "Thẻ năm ÁP LỰC", "Kích hoạt CAO"],
  },
  {
    id: "hinh_tuong",
    short: "Hình tượng",
    title: "Hình tượng",
    job:
      "1 hình ảnh/ẩn dụ sống bám đúng cơ chế sao (vd 'van tiền hở', 'máy phát không ắc quy') " +
      "— giúp nhớ, không thay đo lường. Tối đa 1 hình/đoạn trọng.",
    ban: "Cấm thơ mộng lan man; cấm hình tượng không neo được sao/cung.",
    machineAnchors: ["Đàm Tinh (tinh tình)", "Cách cục hint", "Tứ Hóa sắc thái"],
  },
  {
    id: "thuc_chien_may_do",
    short: "Thực chiến",
    title: "Thực chiến & May đo đúng",
    job:
      "Mỗi vùng hung/tài/tình: NÊN / KHÔNG cụ thể đời hiện đại, may đo đúng lá " +
      "(giải hóa + cách cục + tuổi mụ). Hành động 1 bước, không cúng bái.",
    ban: "Cấm khuyên ráp khuôn; cấm tuyệt đối hóa ('chắc chắn phá sản'); cấm nghi lễ mê tín.",
    machineAnchors: ["Giải hóa", "Kinh nghiệm", "Thẻ năm NÊN", "Tuổi mụ", "Cách cục"],
  },
];

/**
 * Protocol đan dải — system instruction (tĩnh).
 */
export function buildMultiLensSystemBlock(): string {
  const lensLines = MULTI_LENSES.map(
    (L, i) =>
      `${i + 1}. **${L.title}** — Việc: ${L.job} Cấm: ${L.ban} Neo: ${L.machineAnchors.join("; ")}.`,
  ).join("\n");

  return `--- ĐA CHIỀU THIÊN TÀI: 7 DẢI → 1 CHÙM (BẮT BUỘC — KHÔNG LUẬN MỘT PHÍA) ---
Không được chỉ một giọng (liệt sao / tâm lý / khuyên đời / hình tượng). Đan 7 dải thành **MỘT chùm logic**: mỗi đoạn trọng là ánh sáng trắng đã trộn, không phải 7 màu rời.

### BẢY DẢI
${lensLines}

### QUY TẮC ĐAN
1. **Thứ tự thắng nội bộ:** Đo lường (máy) → Hệ thống (mắt xích sao) → Tâm lý (phản xạ) → Định hướng (đẩy/hãm) → Sắc (chốt) → Hình tượng (1 ảnh nếu cần) → Thực chiến (NÊN/KHÔNG may đo).
2. **Mỗi phần lớn** đan tối thiểu 3 dải; Phần 1 và Phần 4 phải có **Sắc + Đo lường + Thực chiến**.
3. **CẤM 7 heading riêng** kiểu "Mục Đo lường / Mục Tâm lý…" — dải là lớp trong câu, không phải mục lục.
4. **CẤM một phía:** chỉ sao không đời (thiếu Thực chiến/Tâm lý); chỉ tâm lý không sao (thiếu Đo lường); chỉ khuyên không cơ chế (thiếu Hệ thống); chỉ hình tượng (thiếu Đo lường/Sắc).
5. **Công thức 1 đoạn chốt (lặp, biến tấu — STRUCTURE THỞ BẰNG ĐỜI):** **Trên giấy:** [Hệ quả đời 1 dòng] → [Cơ chế sao×cung dệt ngay] → [Phản xạ/điểm mù nếu có] → [NÊN/KHÔNG may đo] → (tuỳ) [1 hình tượng]. **Trong đầu:** kiểm đủ dữ kiện máy trước khi viết; CẤM catalog sao trước đời; CẤM thêm mục tóm tắt riêng.
6. **Cuối Phần 4:** 4–6 câu **TỔNG LỰC ĐA CHIỀU** — cốt cách · điểm mù · hướng đi · 1 hành động năm · (tuỳ) 1 hình tượng. Không mở mục lục 7 dải.

### TIÊU CHÍ BÀI ĐẠT
Người đọc thấy **mình & đời**, thấy **căn cứ lá**, biết **làm gì** — không ngợp thuật ngữ, không bớt độ đúng. Giọng đanh, mạch, có trọng số — không chatbot dán 7 template.`;
}

/**
 * Gợi ý trong khung user prompt (ngắn, neo từng phần chương trình).
 */
export function buildMultiLensFrameworkHint(): string {
  return `
**ĐA CHIỀU 7 DẢI → 1 CHÙM (đan trong phần sẵn — không tạo 7 mục riêng, không thêm tóm tắt)**:
Đan dải: Đo lường · Tâm lý/chuyển hóa · Định hướng/cân bằng · Hệ thống hóa · Sắc mỏng · Hình tượng · Thực chiến/may đo.
Mỗi đoạn: **đời mở** → sao/cơ chế (Đo+Hệ thống) → (tuỳ) NÊN — cùng một mạch chữ.
- Phần 1 (bản sắc + va đập + Tứ Hóa + sát): Tâm lý + Sắc + Đo + Hệ thống + Định hướng (+ 1 hình nếu trúng).
- Phần 2 (sự nghiệp, tài lộc, tình cảm, sức khỏe, cung còn lại): Đời + Đo + Hệ thống + Định hướng + Thực chiến + Tâm lý.
- Phần 3 (đại hạn / tiểu hạn / tháng nóng): Đời (năm mở/siết) + Đo (thẻ/kích hoạt) + Sắc + Thực chiến + Tâm lý.
- Phần 4 (Phúc Đức / định cách / Bát Tự): đời nội tâm–an + Tâm lý + Định hướng + May đo; chốt bằng **Tổng lực đa chiều** 4–6 câu (không checklist 7 dải).
CẤM luận một phía; CẤM 7 heading dải; CẤM bỏ neo máy; CẤM thêm phần ngoài khung.
`;
}

/** Marker regression. */
export const MULTI_LENS_MARKERS = {
  block: "ĐA CHIỀU THIÊN TÀI: 7 DẢI → 1 CHÙM",
  formula: "Công thức 1 đoạn chốt",
  totalForce: "TỔNG LỰC ĐA CHIỀU",
  noSevenHeadings: "CẤM 7 heading riêng",
} as const;
