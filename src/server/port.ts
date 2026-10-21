/** Cổng mặc định khi chạy local (`npm run dev` / `npm start`). */
export const DEFAULT_SERVER_PORT = 3000;

const MAX_TCP_PORT = 65535;

/**
 * Đọc cổng lắng nghe từ biến môi trường (Railway, Render, Docker…)
 * với fallback an toàn cho dev local.
 */
export function resolveServerPort(
  envPort?: string,
  fallback: number = DEFAULT_SERVER_PORT,
): number {
  const rawPort = arguments.length === 0 ? process.env.PORT : envPort;
  if (rawPort == null || rawPort.trim() === "") {
    return fallback;
  }

  const parsed = Number(rawPort);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_TCP_PORT) {
    console.warn(
      `[server] PORT="${rawPort}" không hợp lệ (cần số nguyên 1–${MAX_TCP_PORT}), dùng fallback ${fallback}`,
    );
    return fallback;
  }

  return parsed;
}