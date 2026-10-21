import React from "react";
import { Moon, Sun } from "lucide-react";

const THEME_STORAGE_KEY = "tuvi_theme";
/** Class tạm trên <html> để toàn trang crossfade màu khi đổi theme — xem index.css. */
const THEME_TRANSITION_CLASS = "theme-transition";
/** Khớp thời lượng crossfade CSS (320ms) + biên an toàn. */
const THEME_TRANSITION_MS = 380;
/** Thời gian icon "nảy" (340ms) + biên — sau đó gỡ class để lần bấm sau phát lại. */
const ICON_POP_MS = 420;

export type ThemeMode = "light" | "dark";

/** Theme đang áp thật tế — class .dark trên <html> đã được set trước paint bởi script trong index.html. */
const readCurrentTheme = (): ThemeMode =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";

const prefersReducedMotion = (): boolean => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

/**
 * Nút Light/Dark cho header.
 * - Đổi theme = toggle class .dark trên <html> (Tailwind dark: theo class).
 * - Đổi theme có crossfade màu toàn trang (~320ms) thay vì "cái rụp"; tôn trọng reduced-motion.
 * - Lưu lựa chọn vào localStorage; chưa chọn bao giờ thì mặc định theo hệ điều hành.
 */
export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = React.useState<ThemeMode>(readCurrentTheme);
  /** Theme vừa bấm — icon tương ứng "nảy" một nhịp để phản hồi rõ. */
  const [justPicked, setJustPicked] = React.useState<ThemeMode | null>(null);
  const crossfadeTimerRef = React.useRef<number | null>(null);
  const iconPopTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Dọn timer nếu unmount giữa chừng
  React.useEffect(
    () => () => {
      if (crossfadeTimerRef.current !== null) window.clearTimeout(crossfadeTimerRef.current);
      if (iconPopTimerRef.current !== null) window.clearTimeout(iconPopTimerRef.current);
    },
    [],
  );

  const choose = (next: ThemeMode) => {
    if (next === theme) return; // bấm lại đúng theme đang chọn — không đổi gì

    // Crossfade màu: gắn class TRƯỚC khi flip .dark (effect bên trên), ép style kịp áp
    // để transition đăng ký trước lúc màu đổi — tránh "đổi trước, transition sau".
    if (!prefersReducedMotion()) {
      const root = document.documentElement;
      root.classList.add(THEME_TRANSITION_CLASS);
      void root.offsetWidth;
      if (crossfadeTimerRef.current !== null) window.clearTimeout(crossfadeTimerRef.current);
      crossfadeTimerRef.current = window.setTimeout(() => {
        root.classList.remove(THEME_TRANSITION_CLASS);
        crossfadeTimerRef.current = null;
      }, THEME_TRANSITION_MS);
    }

    setTheme(next);
    setJustPicked(next);
    if (iconPopTimerRef.current !== null) window.clearTimeout(iconPopTimerRef.current);
    iconPopTimerRef.current = window.setTimeout(() => {
      setJustPicked(null);
      iconPopTimerRef.current = null;
    }, ICON_POP_MS);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* chế độ private / chặn storage — bỏ qua, theme vẫn đổi trong phiên */
    }
  };

  const btnBase =
    "group flex items-center justify-center p-1.5 rounded-xl transition-all cursor-pointer select-none active:scale-90";
  const btnActive = "bg-stone-700 text-white shadow-sm";
  const btnIdle = "text-stone-400 hover:text-stone-200 hover:bg-stone-800/70";
  const iconBase = "w-3.5 h-3.5 transition-transform duration-300";
  /** Icon: vừa bấm → "nảy"; đang chọn → tĩnh; còn lại → xoay nhẹ khi hover nút. */
  const iconMotion = (mode: ThemeMode, hoverFx: string) =>
    `${iconBase} ${justPicked === mode ? "icon-pop" : theme === mode ? "" : hoverFx}`;

  return (
    <div
      role="group"
      aria-label="Chế độ sáng/tối"
      className="inline-flex items-center gap-1 rounded-2xl bg-stone-800/70 border border-stone-700/60 p-1"
    >
      <button
        type="button"
        onClick={() => choose("light")}
        aria-pressed={theme === "light"}
        aria-label="Giao diện sáng"
        title="Giao diện sáng"
        className={`${btnBase} ${theme === "light" ? btnActive : btnIdle}`}
      >
        <Sun className={iconMotion("light", "group-hover:rotate-45")} />
      </button>
      <button
        type="button"
        onClick={() => choose("dark")}
        aria-pressed={theme === "dark"}
        aria-label="Giao diện tối"
        title="Giao diện tối"
        className={`${btnBase} ${theme === "dark" ? btnActive : btnIdle}`}
      >
        <Moon className={iconMotion("dark", "group-hover:-rotate-12")} />
      </button>
    </div>
  );
};
