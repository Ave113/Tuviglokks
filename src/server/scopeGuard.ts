/**
 * Scope Guard for Horoscope Chatbot.
 * Detects questions outside the astrology / metaphysics scope (e.g. math formulas,
 * school homework, literature analysis, programming code, general science trivia)
 * and provides polite, standardized refusals.
 */

export interface ScopeCheckResult {
  isOutOfScope: boolean;
  category?: "math" | "science" | "literature" | "programming" | "trivia";
  refusalMessage?: string;
}

// Keywords indicating user is asking about their horoscope / life / chart context
// LƯU Ý: cấm dùng token bare 1 âm tiết ("tuần", "triệt") — "bảng tuần hoàn hóa
// học" / "phản ứng triệt tiêu" sẽ được coi là mệnh lý và LỠT QUA mọi chặn
// ngoài-đề. Chỉ nhận cụm thuật ngữ đẩu số đầy đủ.
const ASTROLOGY_CONTEXT_REGEX =
  /(lá\s*số|tử\s*vi|bát\s*tự|tứ\s*trụ|cung\s*(mệnh|thân|tài|quan|phu|thê|phúc|điền|tật|di|nô|tử|huynh)|chính\s*tinh|phụ\s*tinh|hóa\s*(lộc|quyền|khoa|kỵ)|tuần\s*(không|trung)|triệt\s*(lộ|không)|đại\s*hạn|tiểu\s*hạn|lưu\s*niên|vận\s*hạn|cách\s*cục|chiếu|tam\s*hợp|xung\s*chiếu|nhị\s*hợp|ngũ\s*hành|âm\s*dương|can\s*chi|đương\s*số|bản\s*mệnh|mạng\s*của\s*(tôi|em|mình)|số\s*(phận|mệnh)|tương\s*lai|vận\s*trình)/i;

// 1. Math formulas, equations, calculus, arithmetic problems
const MATH_PATTERNS = [
  /công\s*thức\s*(toán|log|lượng\s*giác|tích\s*phân|đạo\s*hàm|vận\s*tốc|chu\s*vi|diện\s*tích|thể\s*tích|xác\s*suất)/i,
  /\b(logarit|logarithm|ln\b|log_\w+|log\s*\()/i,
  /giải\s*(phương\s*trình|hệ\s*phương\s*trình|toán|bài\s*toán|bất\s*phương\s*trình)/i,
  /tính\s*(đạo\s*hàm|tích\s*phân|nguyên\s*hàm|lim|ma\s*trận|định\s*thức)/i,
  /định\s*lý\s*(pythagore|pitago|thales|talét|fermat|euler|newton)/i,
  /hàm\s*số\s*(bậc\s*hai|bậc\s*nhất|đồng\s*biến|nghịch\s*biến|cực\s*trị)/i,
  /\b(sin|cos|tan|cotan)\s*\(\s*\d+/i,
  /x\s*[\^²]\s*2|x\s*\+\s*y\s*=\s*\d+/i,
];

// 2. Natural sciences (physics, chemistry, biology)
const SCIENCE_PATTERNS = [
  /định\s*luật\s*(vạn\s*vật\s*hấp\s*dẫn|ohm|ôm|kenpler|bảo\s*toàn)/i,
  /công\s*thức\s*hóa\s*học|bảng\s*tuần\s*hoàn|phương\s*trình\s*hóa\s*học/i,
  /quang\s*hợp|nhiễm\s*sắc\s*thể|chu\s*trình\s*krebs|adn\s*rna|triệt\s*tiêu/i,
  /vận\s*tốc\s*ánh\s*sáng|hằng\s*số\s*planck|gia\s*tốc\s*trọng\s*trường/i,
];

// 3. Literature, poetry analysis, school essay questions
const LITERATURE_PATTERNS = [
  /phân\s*tích\s*(bài\s*thơ|tác\s*phẩm|đoạn\s*trích|nhân\s*vật|truyện\s*ngắn|tiểu\s*thuyết)/i,
  /cảm\s*nghĩ\s*về\s*(bài\s*thơ|nhân\s*vật|tác\s*phẩm)/i,
  /tóm\s*tắt\s*(truyện|tác\s*phẩm|văn\s*bản)/i,
  /soạn\s*bài\s*(văn|ngữ\s*văn|thơ)/i,
  /(?<![\p{L}])(truyện\s*kiều|chí\s*phèo|vợ\s*nhặt|tây\s*tiến|sóng\s*xuân\s*quỳnh|đất\s*nước\s*nguyễn\s*khoa\s*điềm)(?![\p{L}])/iu,
];

// 4. Programming, software engineering, coding questions
const PROGRAMMING_PATTERNS = [
  /viết\s*(code|mã\s*nguồn|script|function|hàm|chương\s*trình)\s*(bằng|python|javascript|typescript|c\+\+|java|php|rust|golang|c#)?/i,
  /lập\s*trình\s*(python|javascript|web|react|node|backend|frontend)/i,
  /câu\s*lệnh\s*sql|fix\s*bug|regex\s*cho|dockerfile/i,
];

// 5. General trivia / recipe / pop culture
const TRIVIA_PATTERNS = [
  /cách\s*(nấu|làm)\s*(món|phở|bún|bánh|kem|trà\s*sữa)/i,
  /thủ\s*đô\s*của\s*(nước|quốc\s*gia|pháp|mỹ|anh|nhật|hàn|đức)/i,
  /thời\s*tiết\s*(hôm\s*nay|ngày\s*mai)\s*(ở|tại)?/i,
  /kết\s*quả\s*bóng\s*đá|tỉ\s*số\s*trận/i,
];

export function checkOutOfScopeQuestion(question: string): ScopeCheckResult {
  const q = String(question || "").trim();
  if (!q) return { isOutOfScope: false };

  // If the user question explicitly connects to horoscope, chart, or destiny:
  // e.g. "Tôi muốn theo học ngành toán học/văn học/công nghệ thì lá số cung Quan Lộc có hợp không?"
  // We treat this as in-scope for horoscope consultation!
  const hasAstroContext = ASTROLOGY_CONTEXT_REGEX.test(q);
  if (hasAstroContext) {
    // If it mentions both, check if it's literally just asking to solve a formula while dropping a keyword
    // Usually hasAstroContext means they are asking about career, destiny, or palace
    return { isOutOfScope: false };
  }

  // Check Math
  for (const re of MATH_PATTERNS) {
    if (re.test(q)) {
      return {
        isOutOfScope: true,
        category: "math",
        refusalMessage:
          "Chào bạn, tôi là trợ lý chuyên trách luận giải lá số Mệnh lý (Tử Vi Đẩu Số & Bát Tự). Câu hỏi này thuộc lĩnh vực Toán học, nằm ngoài phạm vi tư vấn của tôi.\n\nXin vui lòng đặt các câu hỏi liên quan đến cung vị, tinh bàn, vận hạn hoặc định hướng cuộc sống trên lá số của bạn nhé!",
      };
    }
  }

  // Check Science
  for (const re of SCIENCE_PATTERNS) {
    if (re.test(q)) {
      return {
        isOutOfScope: true,
        category: "science",
        refusalMessage:
          "Chào bạn, tôi là trợ lý chuyên trách luận giải lá số Mệnh lý (Tử Vi Đẩu Số & Bát Tự). Câu hỏi này thuộc lĩnh vực Khoa học tự nhiên, nằm ngoài phạm vi tư vấn của tôi.\n\nXin vui lòng đặt các câu hỏi liên quan đến cung vị, tinh bàn, vận hạn hoặc định hướng cuộc sống trên lá số của bạn nhé!",
      };
    }
  }

  // Check Literature
  for (const re of LITERATURE_PATTERNS) {
    if (re.test(q)) {
      return {
        isOutOfScope: true,
        category: "literature",
        refusalMessage:
          "Chào bạn, tôi là trợ lý chuyên trách luận giải lá số Mệnh lý (Tử Vi Đẩu Số & Bát Tự). Câu hỏi này thuộc lĩnh vực Ngữ văn & Phân tích tác phẩm, nằm ngoài phạm vi tư vấn của tôi.\n\nXin vui lòng đặt các câu hỏi liên quan đến cung vị, tinh bàn, vận hạn hoặc định hướng cuộc sống trên lá số của bạn nhé!",
      };
    }
  }

  // Check Programming
  for (const re of PROGRAMMING_PATTERNS) {
    if (re.test(q)) {
      return {
        isOutOfScope: true,
        category: "programming",
        refusalMessage:
          "Chào bạn, tôi là trợ lý chuyên trách luận giải lá số Mệnh lý (Tử Vi Đẩu Số & Bát Tự). Câu hỏi này thuộc lĩnh vực Công nghệ & Lập trình, nằm ngoài phạm vi tư vấn của tôi.\n\nXin vui lòng đặt các câu hỏi liên quan đến cung vị, tinh bàn, vận hạn hoặc định hướng cuộc sống trên lá số của bạn nhé!",
      };
    }
  }

  // Check Trivia
  for (const re of TRIVIA_PATTERNS) {
    if (re.test(q)) {
      return {
        isOutOfScope: true,
        category: "trivia",
        refusalMessage:
          "Chào bạn, tôi là trợ lý chuyên trách luận giải lá số Mệnh lý (Tử Vi Đẩu Số & Bát Tự). Câu hỏi này nằm ngoài phạm vi chuyên môn mệnh lý của tôi.\n\nXin vui lòng đặt các câu hỏi liên quan đến cung vị, tinh bàn, vận hạn hoặc định hướng cuộc sống trên lá số của bạn nhé!",
      };
    }
  }

  return { isOutOfScope: false };
}
