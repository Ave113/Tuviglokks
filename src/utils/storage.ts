/** Ghi localStorage an toàn — bắt QuotaExceededError, tránh lệch state vs refresh. */
export const safeSetLocalStorage = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22)) {
      alert(
        "Bộ nhớ lưu hồ sơ của trình duyệt đã đầy. Hãy xóa bớt hồ sơ cũ hoặc bản luận giải đính kèm rồi thử lại — nếu không, các thay đổi mới có thể không được lưu sau khi tải lại trang.",
      );
    } else {
      console.error("Lỗi ghi localStorage:", e);
    }
    return false;
  }
};