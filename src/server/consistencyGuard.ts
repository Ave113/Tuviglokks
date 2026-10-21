/**
 * Consistency Guard for Chatbot (Especially Secondary / Lite Models).
 * Enforces 4 Core Principles:
 * 1. Verdict Anchors Extraction: Extracts core judgments from base interpretation.
 * 2. Consistency Hard-Lock Prompting: Locks verdict stance so secondary model cannot reverse it.
 * 3. Context Trimming & Base Interpretation Weight Boost (+35% prominence).
 * 4. Post-Generation Polarity Audit: Verifies tone & direction consistency before user delivery.
 */

export interface VerdictAnchorSummary {
  topic: string;
  excerpt: string;
  verdictTone: "positive" | "negative" | "caution" | "neutral";
}

/**
 * Scan base interpretation for topic sections or keywords.
 */
export function extractVerdictAnchors(
  baseInterpretation: string,
  question: string = "",
): string {
  if (!baseInterpretation || baseInterpretation.trim().length < 100) {
    return "";
  }

  const raw = baseInterpretation.trim();
  const q = question.toLowerCase();

  // Try extracting paragraphs or sections relevant to common horoscope domains
  const sections: { title: string; text: string; keywords: RegExp }[] = [
    {
      title: "CUNG MỆNH & ĐIỂM MÙ BẢN TÍNH",
      text: "",
      keywords: /mệnh|thân|tính cách|điểm mù|cốt cách|bản tính/i,
    },
    {
      title: "TÀI CHÍNH & DÒNG TIỀN (TÀI BẠCH)",
      text: "",
      keywords: /tài bạch|tiền bạc|tài chính|dòng tiền|đầu tư|chi tiêu/i,
    },
    {
      title: "SỰ NGHIỆP & CÔNG DANH (QUAN LỘC)",
      text: "",
      keywords: /quan lộc|sự nghiệp|công danh|nghề nghiệp|thăng tiến/i,
    },
    {
      title: "HÔN NHÂN & TÌNH CẢM (PHU THÊ)",
      text: "",
      keywords: /phu thê|hôn nhân|tình cảm|vợ chồng|kết hôn/i,
    },
    {
      title: "VẬN TRÌNH & NĂM NAY (VẬN HẠN)",
      text: "",
      keywords: /vận hạn|năm nay|đại hạn|tiểu hạn|lưu niên|bước ngoặt/i,
    },
  ];

  // Split base interpretation into paragraphs or markdown sections
  const paragraphs = raw.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 30);

  for (const p of paragraphs) {
    for (const sec of sections) {
      if (!sec.text && sec.keywords.test(p)) {
        // Grab up to first 280 chars of the key paragraph
        sec.text = p.slice(0, 300).replace(/\n/g, " ").trim();
      }
    }
  }

  // Check which section matches the user's question directly
  const focusedSections = sections.filter((s) => s.text);
  if (focusedSections.length === 0) return "";

  // Prioritize the section matching user question
  focusedSections.sort((a, b) => {
    const aMatch = a.keywords.test(q);
    const bMatch = b.keywords.test(q);
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  const anchorLines = focusedSections.slice(0, 3).map(
    (s) => `• [${s.title}]: "${s.text}${s.text.length >= 300 ? "..." : ""}"`,
  );

  return [
    "--- SỔ NEO PHÁN QUYẾT TỪ BẢN LUẬN GỐC (BẮT BUỘC ĐỒNG NHẤT — CẤM LẬT NGƯỢC) ---",
    ...anchorLines,
    "-> QUY TẮC BẮT BUỘC: Bạn phải kế thừa trọn vẹn lập trường/sắc thái của các phán quyết trên. Tuyệt đối không phán trái ngược.",
  ].join("\n");
}

/**
 * Build hard-lock prompt rules specifically designed for secondary / lightweight model tier.
 */
export function buildSecondaryModelHardLockBlock(): string {
  return `--- CHỐT KHÓA QUAN ĐIỂM (CONSISTENCY HARD-LOCK — QUY TẮC BẮT BUỘC CHO MODEL THỨ 2) ---
1. BẢO TOÀN LẬP TRƯỜNG TUYỆT ĐỐI: Không bao giờ mâu thuẫn hay đá nhau với Bản Luận Giải Gốc.
   - Nếu bản luận giải gốc đánh giá khía cạnh là [BẤT LỢI / CẦN THẬN TRỌNG / HAO TỔN / CHẬM TRỄ]: TUYỆT ĐỐI KHÔNG được trả lời thành [THUẬN LỢI / AN TÂM / PHÁT TÀI DỄ DÀNG / VỘI VÀNG].
   - Nếu bản luận giải gốc đánh giá là [CÁT LỢI / THỜI CƠ]: TUYỆT ĐỐI KHÔNG được trả lời thành [HUNG HẠI / ĐẦY NGUY HIỂM].
2. NGUYÊN TẮC KẾ THỪA CƠ CHẾ: Nhiệm vụ của bạn là LÀM RÕ HƠN CƠ CHẾ VÌ SAO BÀI GỐC LẠI KẾT LUẬN NHƯ VẬY (dựa trên sao thực có trên lá số), KHÔNG được tự ý lật ngược quan điểm.
3. KẾT CẤU 3 NHỊP GỌN GÀNG:
   - Nhịp 1: 1 câu tái khẳng định lập trường nhất quán với bài luận gốc.
   - Nhịp 2: 1-2 mạch sao thực có trên lá số chứng minh lý do.
   - Nhịp 3: 1 lời khuyên thực tế đồng điệu với giải pháp của bài gốc.`;
}

/**
 * Post-Generation Polarity Consistency Audit.
 * Detects if the model's answer contradicts the base interpretation on key topics.
 */
export interface ConsistencyAuditResult {
  isConsistent: boolean;
  adjustedAnswer: string;
  auditNote?: string;
}

export function auditChatConsistency(
  answer: string,
  baseInterpretation: string,
  question: string,
): ConsistencyAuditResult {
  if (!answer || !baseInterpretation || baseInterpretation.trim().length < 50) {
    return { isConsistent: true, adjustedAnswer: answer };
  }

  const ans = answer.toLowerCase();
  const q = question.toLowerCase();
  const base = baseInterpretation.toLowerCase();

  // Financial domain contradiction check
  const isFinance = /tiền|tài chính|đầu tư|làm ăn|kinh doanh|tài bạch/i.test(q);
  if (isFinance) {
    const baseWarnsLoss =
      /hao tài|tán tài|tránh đầu tư|rủi ro cao|thận trọng tài chính|không nên góp vốn|dễ mất trắng|áp lực tiền bạc/i.test(
        base,
      );
    const ansPromisesWealth =
      /hoàn toàn yên tâm|đầu tư lớn|thắng lớn|phát tài rực rỡ|không có rủi ro|tha hồ đầu tư|vận may tài lộc bùng nổ/i.test(
        ans,
      );

    if (baseWarnsLoss && ansPromisesWealth) {
      // Direct contradiction detected! Adjust answer to preserve consistency with base interpretation
      const correction =
        "\n\n*(Lưu ý nhất quán với bản luận giải chính: Dù có một số tín hiệu vận hành, xu hướng chủ đạo vẫn là đề phòng hao tán dòng tiền; bạn cần ưu tiên phòng thủ và kiểm soát rủi ro theo đúng đánh giá của lá số).*";
      return {
        isConsistent: false,
        adjustedAnswer: `${answer.trim()}${correction}`,
        auditNote: "Detected financial polarity clash with base interpretation.",
      };
    }
  }

  // Marriage / Romance domain contradiction check
  const isMarriage = /hôn nhân|phu thê|tình cảm|kết hôn|người yêu/i.test(q);
  if (isMarriage) {
    const baseWarnsDelay =
      /kết hôn muộn|trắc trở tình duyên|xung khắc|dễ đổ vỡ|thận trọng hôn nhân|chậm lại/i.test(
        base,
      );
    const ansUrgesRush =
      /kết hôn ngay|rất thuận lợi không trở ngại gì|hoàn hảo êm ấm tuyệt đối|cưới sớm/i.test(
        ans,
      );

    if (baseWarnsDelay && ansUrgesRush) {
      const correction =
        "\n\n*(Lưu ý nhất quán với bản luận giải chính: Về phương diện tình cảm và hôn nhân, tinh bàn khuyên nên cẩn trọng, thấu hiểu sâu sắc trước khi cam kết lâu dài thay vì quyết định vội vàng).*";
      return {
        isConsistent: false,
        adjustedAnswer: `${answer.trim()}${correction}`,
        auditNote: "Detected relationship polarity clash with base interpretation.",
      };
    }
  }

  return { isConsistent: true, adjustedAnswer: answer };
}
