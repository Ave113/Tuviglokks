const MIN_YEAR = 1900;
const MAX_YEAR = 2200;

/** Năm xem hạn mặc định — năm hiện tại theo máy chủ, không hardcode. */
export function defaultTransitYear(): number {
  return new Date().getFullYear();
}

/**
 * Chuẩn hóa năm xem vận hạn từ client.
 * Client là nguồn sự thật; server validate biên rồi fallback động nếu thiếu/sai.
 */
export function resolveTransitYear(raw: unknown): number {
  const n = Number(raw);
  if (Number.isInteger(n) && n >= MIN_YEAR && n <= MAX_YEAR) return n;
  return defaultTransitYear();
}