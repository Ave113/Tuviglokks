/**
 * BYOK lưu localStorage — mặc định ghi nhớ trên máy (user chọn Lưu / Xóa).
 * sessionStorage đồng bộ tạm trong tab; clear xóa cả hai + cờ remember legacy.
 */

const KEY = "tuvi_byok_key";
const KEY_REMEMBER_LEGACY = "tuvi_byok_remember";

export function loadByokKey(): string {
  try {
    const local = localStorage.getItem(KEY)?.trim() ?? "";
    if (local) {
      try {
        sessionStorage.setItem(KEY, local);
      } catch {
        /* ignore */
      }
      return local;
    }
    // Tab-only fallback (hiếm)
    return sessionStorage.getItem(KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

/** true nếu ghi localStorage thành công. */
export function saveByokKey(key: string): boolean {
  const k = key.trim();
  if (!k) return false;
  try {
    localStorage.setItem(KEY, k);
    try {
      sessionStorage.setItem(KEY, k);
    } catch {
      /* ignore */
    }
    // Dọn cờ remember cũ (nếu có)
    localStorage.removeItem(KEY_REMEMBER_LEGACY);
    return true;
  } catch {
    return false;
  }
}

export function clearByokKey(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(KEY_REMEMBER_LEGACY);
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
