/**
 * Metadata tags formatting and synchronization.
 * Handles bracketed tags like [Đồng thuận], [Bổ sung], [Mâu thuẫn – thận trọng],
 * [CUNG THÂN ĐỒNG CUNG], [TÓM NĂM], etc.
 */

export const METADATA_TAG_REGEX =
  /\[(Đồng thuận(?:\s*mạnh)?|Bổ sung|Mâu thuẫn(?:\s*[–-]\s*thận trọng)?|CUNG THÂN ĐỒNG CUNG|THÂN MỆNH ĐỒNG CUNG|TÓM NĂM|BẢN SẮC|TÀI|QUAN|HẠN NĂM|ĐẠI HẠN|TIỂU HẠN)\]/gi;

/**
 * Filter or style metadata tags based on user visibility preference.
 */
export function processMetadataInText(text: string | null | undefined, showTags: boolean): string {
  if (!text) return "";
  const raw = String(text);

  if (!showTags) {
    // Hide metadata tags cleanly while keeping prose punctuation intact
    return raw
      .replace(METADATA_TAG_REGEX, "")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n[ \t]+/g, "\n");
  }

  // When visible, return the text with tags intact
  return raw;
}
