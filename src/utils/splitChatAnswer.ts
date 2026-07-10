/**
 * Tách câu trả lời chat: kết luận (đọc nhanh) vs căn cứ chi tiết (thu gọn).
 * Khớp nhãn "Căn cứ" (chuẩn) hoặc "Cân cứ" (typo cũ từ bản trước).
 */
export const CHAT_DETAIL_HEADING_PATTERN = /\n\s*(Căn cứ\b|Cân cứ\b)/i;

export interface SplitChatAnswer {
  lead: string;
  detail: string | null;
}

export function splitChatAnswer(content: string): SplitChatAnswer {
  const trimmed = content.trim();
  if (!trimmed) return { lead: "", detail: null };

  const canCuMatch = trimmed.match(CHAT_DETAIL_HEADING_PATTERN);
  if (canCuMatch && canCuMatch.index != null && canCuMatch.index > 0) {
    const lead = trimmed.slice(0, canCuMatch.index).trim();
    const detail = trimmed.slice(canCuMatch.index).trim();
    if (lead.length >= 12) {
      return { lead, detail: detail || null };
    }
  }

  const blankSplit = trimmed.split(/\n\n+/);
  if (blankSplit.length > 1) {
    const lead = blankSplit[0].trim();
    const detail = blankSplit.slice(1).join("\n\n").trim();
    if (lead.length >= 12 && lead.length <= 520) {
      return { lead, detail: detail || null };
    }
  }

  if (trimmed.length > 320) {
    const sentenceEnd = trimmed.search(/[.!?。]\s+/);
    if (sentenceEnd > 40 && sentenceEnd < 280) {
      const lead = trimmed.slice(0, sentenceEnd + 1).trim();
      const detail = trimmed.slice(sentenceEnd + 1).trim();
      if (detail.length > 40) {
        return { lead, detail };
      }
    }
  }

  return { lead: trimmed, detail: null };
}