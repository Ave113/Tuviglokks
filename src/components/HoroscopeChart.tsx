import React from "react";
import { User, Calendar, ShieldAlert, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { type BirthplaceRegion } from "../constants/birthplace";
import { calculateTransitInfo, EARTHLY_BRANCHES, palaceIndexToBranchIndex } from "../utils/tuvi";
import { TU_HOA_BY_STEM, HOA_LABELS, stemNameByYear } from "../utils/tuHoa";
import { analyzeChartForUi, type PalaceQualityTone } from "../utils/palaceInspect";
import {
  palaceVoidKinds,
  resolveHoaBadgeKey,
  VOID_BADGE,
} from "../utils/chartStarUi";
import { classifyTuanTrietStar } from "../utils/tuanTriet";
import { NHI_HOP } from "../utils/chartRelations";

// Màu nhãn cho từng loại Hóa (khớp thứ tự HOA_LABELS: Lộc/Quyền/Khoa/Kỵ).
const HOA_BADGE_STYLE: Record<string, string> = {
  "Hóa Lộc": "bg-emerald-600 text-white",
  "Hóa Quyền": "bg-blue-600 text-white",
  "Hóa Khoa": "bg-violet-600 text-white",
  "Hóa Kỵ": "bg-rose-600 text-white",
};
const HOA_BADGE_SHORT: Record<string, string> = {
  "Hóa Lộc": "Lộc",
  "Hóa Quyền": "Quyền",
  "Hóa Khoa": "Khoa",
  "Hóa Kỵ": "Kỵ",
};

interface HoroscopeChartProps {
  calculated: {
    timezoneNormalization: {
      originalTime: string;
      originalDate: string;
      birthplace: BirthplaceRegion;
      timezoneLabel: string;
      note: string;
      normalizedDate: Date | string;
    };
    tuviGlobalHourResult: {
      branchName: string;
      timeIndex: number;
      rangeStr: string;
      warning: string | null;
      dateShift: number;
    };
    finalSolarDateUsed: string;
    chart: any;
  };
  profileName: string;
  onSaveProfile?: () => void;
  isSaved?: boolean;
  transitYear: number;
  setTransitYear: (yr: number) => void;
}

// 4x4 Grid positioning for the 12 Earthly Branches clockwise starting from Tý
// Row & col are 1-indexed for CSS grid positioning.
const EARTHLY_BRANCH_POSITIONS: Record<number, { row: number; col: number; id: string }> = {
  2: { row: 4, col: 1, id: "palace-dan" },  // Dần - Bottom Left Corner
  3: { row: 3, col: 1, id: "palace-mao" },  // Mão
  4: { row: 2, col: 1, id: "palace-thin" }, // Thìn
  5: { row: 1, col: 1, id: "palace-ty" },   // Tỵ - Top Left Corner
  6: { row: 1, col: 2, id: "palace-ngo" },  // Ngọ
  7: { row: 1, col: 3, id: "palace-mui" },  // Mùi
  8: { row: 1, col: 4, id: "palace-than" }, // Thân - Top Right Corner
  9: { row: 2, col: 4, id: "palace-dau" },  // Dậu
  10: { row: 3, col: 4, id: "palace-tuat" },// Tuất
  11: { row: 4, col: 4, id: "palace-hoi" }, // Hợi - Bottom Right Corner
  0: { row: 4, col: 3, id: "palace-ty-0" }, // Tý
  1: { row: 4, col: 2, id: "palace-suu" },  // Sửu
};

export const HoroscopeChart: React.FC<HoroscopeChartProps> = ({
  calculated,
  profileName,
  onSaveProfile,
  isSaved = false,
  transitYear,
  setTransitYear,
}) => {
  const { timezoneNormalization, tuviGlobalHourResult, finalSolarDateUsed, chart } = calculated;

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const [pinnedIdx, setPinnedIdx] = React.useState<number | null>(null);
  const [showSwipeHint, setShowSwipeHint] = React.useState(
    () => localStorage.getItem("tuvi_chart_swipe_hint_dismissed") !== "1",
  );
  // Mặc định zoom 90% để nhìn bao quát toàn bộ bản đồ lá số 12 cung — trần tối đa cũng là 90%
  const [chartZoom, setChartZoom] = React.useState<number>(() => {
    const saved = localStorage.getItem("tuvi_chart_zoom");
    if (saved) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed) && parsed >= 70 && parsed <= 90) return parsed;
    }
    return 90;
  });

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(70, Math.min(90, newZoom));
    setChartZoom(clamped);
    localStorage.setItem("tuvi_chart_zoom", String(clamped));
  };

  const activeIdx = pinnedIdx ?? hoverIdx;

  // Ref: vừa kéo ngang thì bỏ click chọn cung (tránh nuốt gesture kéo).
  const dragMovedRef = React.useRef(false);

  React.useEffect(() => {
    const ele = scrollContainerRef.current;
    if (!ele) return;

    let isDown = false;
    let startX = 0;
    let scrollLeftVal = 0;
    dragMovedRef.current = false;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Chỉ bỏ qua control form — cung vẫn cho phép bắt đầu kéo
      if (target.closest("select, button, input, a, [role='button']")) return;
      // Nút giữa / phải không kéo
      if (e.button !== 0) return;

      isDown = true;
      dragMovedRef.current = false;
      setIsDragging(true);
      startX = e.pageX;
      scrollLeftVal = ele.scrollLeft;
      ele.style.cursor = "grabbing";
      ele.style.userSelect = "none";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 4) dragMovedRef.current = true;
      e.preventDefault();
      ele.scrollLeft = scrollLeftVal - dx * 1.6;
    };

    const handleMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      setIsDragging(false);
      ele.style.cursor = "grab";
      ele.style.removeProperty("user-select");
    };

    ele.addEventListener("mousedown", handleMouseDown);
    // Gắn document để kéo ra ngoài container vẫn scroll được
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    ele.style.cursor = "grab";

    return () => {
      ele.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  React.useEffect(() => {
    const ele = scrollContainerRef.current;
    if (!ele || !showSwipeHint) return;
    const dismiss = () => {
      setShowSwipeHint(false);
      localStorage.setItem("tuvi_chart_swipe_hint_dismissed", "1");
    };
    ele.addEventListener("scroll", dismiss, { once: true });
    return () => ele.removeEventListener("scroll", dismiss);
  }, [showSwipeHint]);

  const birthYear = React.useMemo(() => {
    // Dùng năm ÂM LỊCH từ iztro để tránh sai con giáp/tuổi mụ với người sinh trước Tết (tháng 1-2 dương lịch)
    return chart?.rawDates?.lunarDate?.lunarYear ?? new Date(timezoneNormalization.normalizedDate).getFullYear();
  }, [chart, timezoneNormalization]);

  const birthBranchIndex = React.useMemo(() => {
    return ((birthYear - 4) % 12 + 12) % 12;
  }, [birthYear]);

  const birthZodiacName = React.useMemo(() => {
    return EARTHLY_BRANCHES[birthBranchIndex];
  }, [birthBranchIndex]);

  const transitInfo = React.useMemo(() => {
    if (!chart || !chart.palaces) return null;
    return calculateTransitInfo(
      birthYear,
      birthZodiacName,
      chart.gender,
      chart.palaces,
      transitYear,
      chart,
    );
  }, [birthYear, birthZodiacName, chart, transitYear]);

  // Group palaces by their indices (0 to 11) for quick grid cell injection
  const palacesByIndex = React.useMemo(() => {
    const list: Record<number, any> = {};
    if (!chart || !chart.palaces) return list;
    chart.palaces.forEach((p: any) => {
      // iztro đánh index cung gốc Dần=0; chuyển về index địa chi (Tý=0) cho khớp lưới EARTHLY_BRANCH_POSITIONS
      list[palaceIndexToBranchIndex(p.index)] = p;
    });
    return list;
  }, [chart]);

  // Tu Hoa BAM SINH: map ten sao (ha chu thuong) -> nhan Hoa. Tinh 1 lan theo can nam
  // sinh, KHONG tinh lai moi render (tranh lag). Dung de gan badge mau Loc/Quyen/Khoa/Ky.
  const natalHoaByStar = React.useMemo(() => {
    const map: Record<string, string> = {};
    const stem = stemNameByYear(birthYear);
    const quartet = TU_HOA_BY_STEM[stem];
    if (quartet) {
      quartet.forEach((starName, i) => {
        map[String(starName).trim().toLowerCase()] = HOA_LABELS[i];
      });
    }
    return map;
  }, [birthYear]);

  const linkedIdx = React.useMemo(() => {
    if (activeIdx === null) return null;
    return {
      trine1: (activeIdx + 4) % 12,
      trine2: (activeIdx + 8) % 12,
      opposite: (activeIdx + 6) % 12,
      // Nhị hợp tra bảng địa chi (không phải offset cố định): Tý-Sửu, Dần-Hợi...
      nhiHop: NHI_HOP[activeIdx] ?? null,
    };
  }, [activeIdx]);

  const handlePalaceActivate = (index: number) => {
    // Sau khi kéo ngang: không toggle chọn cung
    if (dragMovedRef.current || isDragging) {
      dragMovedRef.current = false;
      return;
    }
    setPinnedIdx((prev) => (prev === index ? null : index));
  };

  const chartUi = React.useMemo(() => {
    if (!chart?.palaces) return null;
    return analyzeChartForUi(chart.palaces);
  }, [chart]);

  // Early return đặt SAU toàn bộ hooks để không vi phạm Rules of Hooks
  if (!chart || !chart.palaces || !transitInfo) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-200">
        <ShieldAlert className="mx-auto mb-2 w-12 h-12 text-red-500" />
        <p className="font-semibold">Không thể kết xuất lá số.</p>
        <p className="text-xs">Dữ liệu tính toán từ thư viện có lỗi hoặc trống.</p>
      </div>
    );
  }

  const formatToVietnameseDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatLunarDateVi = () => {
    if (!chart || !chart.rawDates || !chart.rawDates.lunarDate) {
      if (!chart || !chart.lunarDate) return "";
      return chart.lunarDate.replace(/^\d+年/, "");
    }
    const { lunarDay, lunarMonth, lunarYear, isLeap } = chart.rawDates.lunarDate;
    const yearCanChi = chart.chineseDate ? chart.chineseDate.split(" - ")[0] : "";
    
    const dayStr = lunarDay <= 10 ? `Mùng ${lunarDay}` : `Ngày ${lunarDay}`;
    const monthStr = `tháng ${lunarMonth}${isLeap ? " nhuận" : ""}`;
    const yearStr = yearCanChi ? `năm ${yearCanChi}` : `năm ${lunarYear}`;
    
    return `${dayStr} ${monthStr} ${yearStr}`;
  };

  const cachCucToneClass = (tone?: PalaceQualityTone) => {
    if (tone === "thanh") return "shadow-[inset_0_0_0_2px_rgba(16,185,129,0.55)]";
    if (tone === "ham") return "shadow-[inset_0_0_0_2px_rgba(244,63,94,0.65)]";
    return "";
  };

  const highlightPalaceColor = (name: string, idx: number, cachTone?: PalaceQualityTone) => {
    let bg = "bg-stone-50/20";
    let border = "border-stone-200 dark:border-neutral-800";
    
    // Default Highlights
    if (name.includes("Mệnh")) {
      bg = "bg-red-50/20 dark:bg-red-950/10";
      border = "border-red-300 dark:border-red-900";
    } else if (name.includes("Quan Lộc")) {
      bg = "bg-blue-50/20 dark:bg-blue-950/10";
      border = "border-blue-200 dark:border-blue-900";
    } else if (name.includes("Tài Bạch")) {
      bg = "bg-amber-50/20 dark:bg-amber-950/10";
      border = "border-amber-200 dark:border-amber-900";
    }

    // Dynamic Hạn Overlays
    if (idx === transitInfo.daiHanPalaceIndex) {
      bg = "bg-indigo-50/30 dark:bg-indigo-950/25";
      border = "border-indigo-500 border-2 shadow-indigo-100 dark:shadow-none shadow-md ring-1 ring-indigo-400/30";
    } else if (idx === transitInfo.tieuHanPalaceIndex) {
      bg = "bg-emerald-50/25 dark:bg-emerald-950/20";
      border = "border-emerald-500 border-2 shadow-emerald-100 dark:shadow-none shadow-sm";
    } else if (idx === transitInfo.luuNienThaiTueIndex) {
      border = "border-amber-500 border-2 border-dashed shadow-amber-500/5";
    }

    return `${bg} ${border} ${cachCucToneClass(cachTone)}`;
  };

  return (
    <div className="space-y-6">
      {/* Traditional 12 Palaces Board (4x4 Grid) */}
      <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] text-stone-400 dark:text-neutral-500 font-black px-1 pb-1 tracking-wider">
        <div className="flex items-center gap-2">
          <span className="bg-stone-200/50 dark:bg-neutral-900 px-2.5 py-1 rounded-lg uppercase">BẢN ĐỒ LÁ SỐ 12 CUNG</span>
          
          {/* Bộ điều khiển thu phóng / Zoom Control */}
          <div className="inline-flex items-center bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleZoomChange(chartZoom - 5)}
              className="p-1 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded text-stone-600 dark:text-stone-300 transition-colors"
              title="Thu nhỏ bản đồ lá số"
              aria-label="Thu nhỏ"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleZoomChange(90)}
              className={`px-1.5 py-0.5 font-mono text-[9px] font-bold rounded transition-colors ${
                chartZoom === 90
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60"
                  : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-800"
              }`}
              title="Đặt lại zoom mặc định 90% (nhìn bao quát)"
            >
              {chartZoom}%
            </button>
            <button
              type="button"
              onClick={() => handleZoomChange(chartZoom + 5)}
              disabled={chartZoom >= 90}
              className="p-1 hover:bg-stone-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed rounded text-stone-600 dark:text-stone-300 transition-colors"
              title={chartZoom >= 90 ? "Đã đạt mức phóng to tối đa (90%)" : "Phóng to bản đồ lá số (tối đa 90%)"}
              aria-label="Phóng to"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            {chartZoom !== 90 && (
              <button
                type="button"
                onClick={() => handleZoomChange(90)}
                className="p-1 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors ml-0.5"
                title="Về mặc định 90%"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        <span className="hidden sm:flex items-center gap-1 text-indigo-650 dark:text-indigo-400 font-bold">
          <span>Kéo thả / vuốt ngang để xem hết</span>
          <span className="text-xs">↔</span>
        </span>
      </div>

      {/* Legend — chỉ UI, không đổi an sao */}
      <div
        className="mx-1 mb-2 flex flex-wrap gap-x-3 gap-y-1.5 rounded-xl border border-stone-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/60 px-2.5 py-2 text-[10px] text-stone-600 dark:text-neutral-300"
        role="note"
        aria-label="Chú thích màu sao trên lá"
      >
        <span className="font-black text-stone-500 dark:text-neutral-400 uppercase tracking-wide w-full sm:w-auto">
          Chú thích
        </span>
        <span className="inline-flex items-center gap-1 font-bold text-red-600 dark:text-red-400">
          <span className="w-2 h-2 rounded-sm bg-red-500" /> Chính tinh
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-sm bg-emerald-500" /> Phụ / cát
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
          <span className="w-2 h-2 rounded-sm bg-rose-600" /> Sát / tạp
        </span>
        <span className="inline-flex items-center gap-1 font-extrabold text-amber-700 dark:text-amber-400">
          <span className="w-2 h-2 rounded-sm bg-amber-500" /> ⚡ Sao lưu năm
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="text-[8px] font-black px-1 rounded bg-emerald-600 text-white">Lộc</span>
          <span className="text-[8px] font-black px-1 rounded bg-blue-600 text-white">Quyền</span>
          <span className="text-[8px] font-black px-1 rounded bg-violet-600 text-white">Khoa</span>
          <span className="text-[8px] font-black px-1 rounded bg-rose-600 text-white">Kỵ</span>
          <span className="text-stone-400">Tứ Hóa</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="text-[8px] font-black px-1 rounded bg-slate-600 text-white">Tuần</span>
          <span className="text-[8px] font-black px-1 rounded bg-zinc-800 text-amber-100">Triệt</span>
          <span className="text-[8px] font-black px-1 rounded bg-stone-500 text-white">KV</span>
        </span>
        <span className="text-stone-400 dark:text-neutral-500 font-medium">
          (Miếu)/(Vượng) = độ sáng · ĐH/TH/Lưu = hạn năm xem
        </span>
      </div>

      {showSwipeHint && (
        <p className="hidden text-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-full px-3 py-1.5 animate-pulse">
          ← Vuốt / kéo ngang để xem hết lá số →
        </p>
      )}

      {pinnedIdx !== null && (
        <div className="flex flex-wrap items-center gap-2 text-[10px] px-1 mb-1">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            Cung chọn · tam hợp · xung
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            Nhị hợp
          </span>
          <button
            type="button"
            onClick={() => setPinnedIdx(null)}
            className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline font-semibold min-h-11 px-2"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="relative max-sm:p-1 max-sm:border-2 p-2 bg-stone-100 dark:bg-neutral-900/50 rounded-2xl border-4 border-stone-800 dark:border-neutral-800 shadow-xl overflow-x-auto overflow-y-hidden chart-scroll-container touch-pan-x"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          className="chart-board-snap min-w-[900px] max-sm:min-w-0 max-sm:w-full max-sm:gap-0.5 grid grid-cols-4 grid-rows-4 gap-1 bg-stone-300 dark:bg-neutral-800 origin-top-left transition-transform duration-200"
          style={{
            zoom: `${chartZoom}%`,
          }}
        >
          
          {/* Palace Cells (0 to 11) */}
          {Object.entries(EARTHLY_BRANCH_POSITIONS).map(([branchIndexStr, layout]) => {
            const index = Number(branchIndexStr);
            const palace = palacesByIndex[index];

            if (!palace) return null;

            const isMệnh = palace.name.includes("Mệnh");
            const isThân = palace.isBodyPalace;

            const isHovered = activeIdx === index;
            const isTrine = !!linkedIdx && (linkedIdx.trine1 === index || linkedIdx.trine2 === index);
            const isOpposite = !!linkedIdx && linkedIdx.opposite === index;
            const isNhiHop = !!linkedIdx && linkedIdx.nhiHop === index;
            const cachTone = chartUi?.qualityMap[index];
            const linkClass = isHovered
              ? "ring-2 ring-indigo-500 ring-offset-1 z-10"
              : isTrine
              ? "ring-2 ring-amber-400/80"
              : isOpposite
              ? "ring-2 ring-sky-400/80 ring-dashed"
              : isNhiHop
              ? "ring-2 ring-violet-500/80"
              : "";

            return (
              <div
                key={index}
                id={layout.id}
                style={{ gridRow: layout.row, gridColumn: layout.col }}
                onMouseEnter={() => setHoverIdx(index)}
                onMouseLeave={() => setHoverIdx((cur) => (cur === index ? null : cur))}
                onClick={() => handlePalaceActivate(index)}
                className={`chart-palace-cell relative max-sm:p-0.5 max-sm:min-h-[104px] p-2 min-h-[160px] flex flex-col justify-between border cursor-pointer ${highlightPalaceColor(
                  palace.name,
                  index,
                  cachTone,
                )} ${linkClass} transition-[box-shadow]`}
              >
                {/* Cell Header: Title & Decade age limit */}
            <div className="flex justify-between items-start border-b border-stone-200 dark:border-neutral-800 pb-1 max-sm:pb-0.5">
            <div className="flex gap-1 items-center flex-wrap max-w-[72%] max-sm:gap-0.5">
            <span className="font-bold text-xs max-sm:text-[8px] max-sm:leading-none text-stone-500 dark:text-stone-400">
                      {palace.heavenlyStem} {palace.earthlyBranch}
                    </span>
                    {palaceVoidKinds(palace).map((k) => (
                      <span
                        key={k}
                        className={`text-[8px] font-black px-1 rounded shadow-sm ${VOID_BADGE[k].className}`}
                        title={VOID_BADGE[k].title}
                      >
                        {VOID_BADGE[k].short}
                      </span>
                    ))}
                    {index === transitInfo.daiHanPalaceIndex && (
                      <span className="bg-indigo-650 text-white text-[8px] font-black px-1 rounded shadow-sm" title="Đại Hạn 10 năm">
                        ĐH
                      </span>
                    )}
                    {index === transitInfo.tieuHanPalaceIndex && (
                      <span className="bg-emerald-650 text-white text-[8px] font-black px-1 rounded shadow-sm" title="Tiểu Hạn 1 năm">
                        TH
                      </span>
                    )}
                    {index === transitInfo.luuNienThaiTueIndex && (
                      <span className="bg-amber-600 text-white text-[8px] font-black px-1 rounded shadow-sm" title="Lưu Niên Thái Tuế">
                        Lưu
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] max-sm:text-[7px] max-sm:px-0.5 font-bold text-stone-400 bg-stone-200/50 px-1 rounded dark:bg-neutral-800 shrink-0">
                    {palace.decadal?.range?.[0] ?? "?"} - {palace.decadal?.range?.[1] ?? "?"}
                  </span>
                </div>

                {/* Stars Body — cùng dữ liệu iztro; ô nhỏ có scroll */}
                <div className="chart-star-major flex-1 my-1.5 max-sm:my-0.5 max-sm:max-h-[86px] grid grid-cols-2 gap-1 max-sm:gap-0.5 text-[11px] sm:text-[11px] max-sm:text-[7.5px] max-sm:leading-[1.2] leading-tight max-h-[120px] overflow-y-auto overscroll-contain">
                  <div className="space-y-1 pr-1 border-r border-stone-200/60 dark:border-neutral-800/40">
                    {palace.majorStars.map((s: any, idx: number) => {
                      const hoaKey = resolveHoaBadgeKey(s, natalHoaByStar);
                      const vk = classifyTuanTrietStar(String(s.name || "")) ?? undefined;
                      return (
                        <div key={idx} className="font-bold text-red-600 dark:text-red-400 flex flex-col">
                          <span className="flex items-center gap-1 flex-wrap">
                            {s.name}
                            {hoaKey && (
                              <span
                                className={`text-[8px] font-black px-1 rounded leading-tight ${HOA_BADGE_STYLE[hoaKey] || "bg-stone-500 text-white"}`}
                                title={`Tứ Hóa: ${hoaKey}`}
                              >
                                {HOA_BADGE_SHORT[hoaKey] || hoaKey}
                              </span>
                            )}
                            {vk && (
                              <span
                                className={`text-[7px] font-black px-0.5 rounded ${VOID_BADGE[vk].className}`}
                                title={VOID_BADGE[vk].title}
                              >
                                {VOID_BADGE[vk].short}
                              </span>
                            )}
                          </span>
                          {s.brightness && (
                            <span className="text-[9px] max-sm:text-[6.5px] font-semibold text-amber-600 dark:text-amber-500">
                              ({s.brightness})
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {palace.majorStars.length === 0 && (
                      <span className="text-[10px] italic text-stone-400">Vô Chính Diệu</span>
                    )}

                    <div className="pt-1 mt-1 max-sm:pt-0.5 max-sm:mt-0.5 border-t border-dashed border-stone-200/80 dark:border-neutral-800/80 text-[10px] max-sm:text-[7px] text-emerald-700 dark:text-emerald-400 space-y-0.5 max-sm:space-y-0">
                      {palace.minorStars.map((s: any, idx: number) => {
                        const hoaKey = resolveHoaBadgeKey(s, natalHoaByStar);
                        return (
                          <div key={idx} className="font-semibold leading-tight flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 flex-wrap">
                              {s.name}
                              {hoaKey && (
                                <span
                                  className={`text-[8px] font-black px-1 rounded leading-tight ${HOA_BADGE_STYLE[hoaKey] || "bg-stone-500 text-white"}`}
                                  title={`Tứ Hóa: ${hoaKey}`}
                                >
                                  {HOA_BADGE_SHORT[hoaKey] || hoaKey}
                                </span>
                              )}
                            </span>
                            {s.brightness ? (
                              <span className="text-[8px] font-semibold text-amber-600/90 dark:text-amber-500/90">
                                ({s.brightness})
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pl-1 text-[10px] max-sm:text-[7px] max-sm:pl-0.5 text-gray-500 dark:text-neutral-400 space-y-0.5 max-sm:space-y-0">
                    {palace.adjectiveStars.map((s: any, idx: number) => {
                      const hoaKey = resolveHoaBadgeKey(s, natalHoaByStar);
                      const nm = String(s.name || "");
                      const isSat = /Kình Dương|Đà La|Hỏa Tinh|Linh Tinh|Địa Không|Địa Kiếp|Hóa Kỵ|Hao|Hại/.test(nm);
                      const vk = classifyTuanTrietStar(nm) ?? undefined;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-1 flex-wrap leading-tight ${
                            isSat
                              ? "font-bold text-rose-700 dark:text-rose-400"
                              : "font-normal text-stone-500"
                          }`}
                        >
                          {s.name}
                          {hoaKey && (
                            <span
                              className={`text-[8px] font-black px-1 rounded leading-tight ${HOA_BADGE_STYLE[hoaKey] || "bg-stone-500 text-white"}`}
                              title={`Tứ Hóa: ${hoaKey}`}
                            >
                              {HOA_BADGE_SHORT[hoaKey] || hoaKey}
                            </span>
                          )}
                          {vk && (
                            <span
                              className={`text-[7px] font-black px-0.5 rounded ${VOID_BADGE[vk].className}`}
                              title={VOID_BADGE[vk].title}
                            >
                              {VOID_BADGE[vk].short}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {(transitInfo.saoLuuMap[index] || []).map((s: string, idx: number) => (
                      <div
                        key={`sao-luu-${idx}`}
                        className="font-extrabold text-[#d25c14] dark:text-amber-400 flex items-center gap-0.5 text-[9px] max-sm:text-[6.5px] max-sm:px-0.5 max-sm:mt-0.5 bg-amber-50 dark:bg-amber-950/20 p-0.5 rounded px-1.5 mt-1 border border-amber-200 dark:border-amber-900/40 tracking-tight"
                      >
                        ⚡ {s}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cell Footer: Palace Title (Mệnh, Di, v.v.) and Trường Sinh */}
                <div className="mt-1 pt-1 max-sm:mt-0.5 max-sm:pt-0.5 border-t border-stone-200/60 dark:border-neutral-800/60 flex items-end justify-between gap-1">
                  <div className="text-[9px] max-sm:text-[6.5px] max-sm:max-w-[60%] leading-tight text-stone-400 dark:text-neutral-500 space-y-0.5 max-sm:space-y-0">
                    {palace.changsheng12 && (
                      <span className="block italic" title="Vòng Trường Sinh 12 (Nam phái)">
                        TS: {palace.changsheng12}
                      </span>
                    )}
                    {palace.boshi12 && (
                      <span className="block" title="Vòng Bác Sỹ 12 (Nam phái)">
                        BS: {palace.boshi12}
                      </span>
                    )}
                    {(palace.jiangqian12 || palace.suiqian12) && (
                      <span className="block opacity-80" title="Tướng Tiền / Tuế Tiền gốc (năm sinh)">
                        Gốc: {[palace.jiangqian12, palace.suiqian12].filter(Boolean).join(" · ")}
                      </span>
                    )}
                    {(() => {
                      const yr = transitInfo?.yearlyDecRings;
                      if (!yr) return null;
                      const yJ = yr.yearJiangqianByBranch[index];
                      const yS = yr.yearSuiqianByBranch[index];
                      if (!yJ && !yS) return null;
                      return (
                        <span
                          className="block text-amber-700/90 dark:text-amber-400/90 font-semibold"
                          title={`Tướng Tiền / Tuế Tiền năm xem ${transitYear}`}
                        >
                          Năm: {[yJ, yS].filter(Boolean).join(" · ")}
                        </span>
                      );
                    })()}
                  </div>
                  
                  <div className="flex flex-col items-end">
                    {isThân && (
                      <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                        THÂN
                      </span>
                    )}
                  <span
                    className={`text-[11px] max-sm:text-[8px] max-sm:leading-none sm:text-xs ml-auto font-black tracking-wide ${
                        isMệnh
                          ? "text-red-600 dark:text-red-400"
                          : "text-indigo-800 dark:text-indigo-300"
                      }`}
                    >
                      {palace.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Central Information Block (Spans 2x2 cells in the center of the 4x4) */}
          <div className="row-start-2 row-end-4 col-start-2 col-end-4 max-sm:p-1 max-sm:border-2 p-4 bg-stone-50 dark:bg-neutral-950 flex flex-col justify-between border-4 border-double border-stone-400 dark:border-neutral-800 rounded-xl shadow-inner scrollbar-none overflow-y-auto">
            
            {/* Central Header */}
            <div className="pb-2 max-sm:pb-1 border-b border-stone-300 dark:border-neutral-800 flex justify-between items-start">
              <div>
                <h3 className="font-title text-lg max-sm:text-[11px] text-stone-950 dark:text-white flex items-center gap-1.5 max-sm:gap-1">
                  <User className="w-5 h-5 max-sm:w-3 max-sm:h-3 text-indigo-600 dark:text-indigo-400" />
                  {profileName || "Vô Danh Bản Mệnh"}
                </h3>
                <p className="text-xs max-sm:text-[8px] text-stone-500 mt-0.5 max-sm:mt-0">
                  Giới tính: <span className="font-bold text-neutral-800 dark:text-neutral-200">{chart.gender}</span> <span className="max-sm:hidden">({chart.gender === "Nam" ? "Dương Nam/Âm Nam" : "Dương Nữ/Âm Nữ"})</span>
                </p>
              </div>

              {onSaveProfile && (
                <button
                  onClick={onSaveProfile}
                  disabled={isSaved}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                    isSaved
                      ? "bg-stone-200 text-stone-400 dark:bg-neutral-800 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95"
                  }`}
                >
                  {isSaved ? "Đã Lưu Hồ Sơ" : "Lưu Hồ Sơ"}
                </button>
              )}
            </div>

            {/* Central Bio Details Grid */}
            <div className="flex-1 py-3 max-sm:py-1 grid grid-cols-2 gap-x-4 max-sm:gap-x-2 gap-y-3 max-sm:gap-y-1.5 text-xs max-sm:text-[8px] text-stone-700 dark:text-neutral-300">
              <div className="space-y-1.5 max-sm:space-y-0.5 min-w-0">
                <span className="text-[10px] max-sm:text-[6.5px] font-bold tracking-wider text-stone-400 uppercase block">Thời gian Dương Lịch</span>
                <span className="font-semibold text-stone-900 dark:text-white flex items-center gap-1 flex-wrap">
                  <Calendar className="w-3.5 h-3.5 max-sm:w-2.5 max-sm:h-2.5 text-stone-400 shrink-0" />
                  <span>{formatToVietnameseDate(timezoneNormalization.originalDate)} ({timezoneNormalization.originalTime})</span>
                </span>
                <span className="text-[10px] max-sm:text-[7px] text-stone-400 block italic leading-tight break-words">
                  Hiệu chỉnh: {formatToVietnameseDate(finalSolarDateUsed)} (GMT+7)
                </span>
              </div>

              <div className="space-y-1.5 max-sm:space-y-0.5 min-w-0">
                <span className="text-[10px] max-sm:text-[6.5px] font-bold tracking-wider text-stone-400 uppercase block">Thời gian Âm Lịch</span>
                <span className="font-bold text-stone-950 dark:text-white block break-words">
                  {formatLunarDateVi()}
                </span>
                <span className="text-[10px] max-sm:text-[7px] text-stone-400 block italic leading-tight break-words">
                  Khung giờ: Giờ {tuviGlobalHourResult.branchName} ({tuviGlobalHourResult.rangeStr})
                </span>
              </div>

              <div className="space-y-1.5 max-sm:space-y-0.5 min-w-0">
                <span className="text-[10px] max-sm:text-[6.5px] font-bold tracking-wider text-stone-400 uppercase block">Tứ Trụ Can Chi</span>
                <span className="font-semibold text-indigo-700 dark:text-indigo-400 block break-words text-xs max-sm:text-[8px] leading-normal">
                  {chart.chineseDate}
                </span>
              </div>

              <div className="space-y-1.5 max-sm:space-y-0.5 min-w-0">
                <span className="text-[10px] max-sm:text-[6.5px] font-bold tracking-wider text-stone-400 uppercase block">Bản Mệnh / Ngũ Hành</span>
                <span className="font-bold text-amber-700 dark:text-amber-500 block break-words text-xs max-sm:text-[8px] leading-normal">
                  {chart.fiveElementsClass}
                </span>
              </div>
            </div>

            {/* Transit Oracle Control Panel */}
            <div className="my-2 max-sm:my-1 p-2 max-sm:p-1 bg-indigo-50/45 dark:bg-indigo-950/10 rounded-xl border border-indigo-100 dark:border-indigo-950/60 space-y-2 max-sm:space-y-1">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] max-sm:text-[8px] font-extrabold text-indigo-900 dark:text-indigo-400">Luận Vận Hạn Năm:</span>
                  <select
                    value={transitYear}
                    onChange={(e) => setTransitYear(Number(e.target.value))}
                    className="text-[11px] max-sm:text-[22px] max-sm:leading-[20px] font-black bg-white dark:bg-neutral-900 border border-indigo-200 dark:border-neutral-800 rounded px-1.5 max-sm:px-[7px] py-0.5 text-indigo-800 dark:text-white cursor-pointer focus:ring-1 focus:ring-indigo-500 max-w-[75px] max-sm:max-w-[95px]"
                  >
                    {Array.from({ length: 31 }, (_, i) => 2015 + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="text-[10.5px] max-sm:text-[7.5px] text-stone-500 dark:text-neutral-400 font-semibold">
                  Tuổi Mụ: <span className="bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 max-sm:px-1 rounded shadow-sm text-[10px] max-sm:text-[7px]">{transitInfo.lunarAge}T</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] max-sm:text-[7px] leading-tight pt-1 border-t border-indigo-100/40 dark:border-indigo-950/25">
                <div className="space-y-0.5 border-r border-indigo-100 dark:border-neutral-800/60 pr-1">
                  <span className="text-[8px] max-sm:text-[6px] font-bold text-indigo-500 uppercase">Đại Hạn 10N</span>
                  <p className="font-extrabold text-indigo-950 dark:text-indigo-300 truncate">{transitInfo.daiHanPalaceName}</p>
                </div>
                <div className="space-y-0.5 border-r border-indigo-100 dark:border-neutral-800/60 px-1">
                  <span className="text-[8px] max-sm:text-[6px] font-bold text-emerald-500 uppercase">Tiểu Hạn 1N</span>
                  <p className="font-extrabold text-emerald-950 dark:text-emerald-300 truncate">{transitInfo.tieuHanPalaceName}</p>
                </div>
                <div className="space-y-0.5 pl-1">
                  <span className="text-[8px] max-sm:text-[6px] font-bold text-amber-500 uppercase">Lưu Thái Tuế</span>
                  <p className="font-extrabold text-amber-950 dark:text-amber-300 truncate">{transitInfo.luuNienThaiTueName}</p>
                </div>
              </div>
            </div>

            {/* Central Footer: Guardian and Secondary Stats */}
            <div className="pt-2 max-sm:pt-1 border-t border-stone-200 dark:border-neutral-800 grid grid-cols-2 gap-3 max-sm:gap-1.5 text-xs max-sm:text-[7.5px] text-stone-500">
              <div className="space-y-0.5">
                <p>Mệnh chủ: <strong className="text-stone-700 dark:text-stone-300">{chart.soul}</strong></p>
                <p>Thân chủ: <strong className="text-stone-700 dark:text-stone-300">{chart.body}</strong></p>
              </div>

              <div className="space-y-0.5 text-right">
                <p>Chòm sao: <strong className="text-stone-700 dark:text-stone-300">{chart.sign}</strong></p>
                <p>Sinh năm: <strong className="text-stone-700 dark:text-stone-300">{chart.zodiac}</strong></p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
