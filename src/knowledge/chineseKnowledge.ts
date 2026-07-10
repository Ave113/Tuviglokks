// ============================================================================
// LỚP TRI THỨC TRUNG HOA cho AI — RAG-lite (truy hồi theo thẻ/từ khoá).
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
      "Nhật Chủ (can ngày) là bản thân đương số. Xét đắc lệnh (sinh đúng mùa), đắc địa " +
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

/**
 * Trả về top-N mẩu tri thức liên quan nhất tới bối cảnh lá số.
 * Điểm = số thẻ trùng (khớp lỏng, không phân biệt hoa thường) + bắt từ khoá trong query.
 * Luôn kèm vài mẩu "nền tảng" (ngũ hành, thân vượng nhược, phong cách) nếu còn chỗ.
 */
export function retrieveKnowledge(ctx: RetrieveContext, topN = 6): KnowledgeEntry[] {
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
    return { entry, score };
  });

  // Mẩu nền tảng luôn nên có mặt khi luận tổng thể.
  const ALWAYS = new Set(["nguhanh-sinh-khac", "than-vuong-nhuoc", "phong-cach-doi-song-hoa"]);

  const sorted = scored
    .sort((a, b) => b.score - a.score || (ALWAYS.has(b.entry.id) ? 1 : 0) - (ALWAYS.has(a.entry.id) ? 1 : 0));

  const picked: KnowledgeEntry[] = [];
  for (const { entry, score } of sorted) {
    if (score > 0 || ALWAYS.has(entry.id)) picked.push(entry);
    if (picked.length >= topN) break;
  }
  return picked;
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
