import React from "react";
import {
  Compass,
  User,
  MapPin,
  Calendar,
  Trash2,
  Clock,
  Users,
  Moon,
  FileCheck,
  Mail,
} from "lucide-react";
import {
  BIRTHPLACE_OPTIONS,
  birthplaceShortLabel,
  isOverseasBirthplace,
} from "./constants/birthplace";
import { SavedProfile } from "./types";
import { formatToVietnameseDate } from "./utils/formatDate";
import { HoroscopeChart } from "./components/HoroscopeChart";
import { AIInterpreter } from "./components/AIInterpreter";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeToggle } from "./components/ThemeToggle";
import { buildInterpretPayload } from "./hooks/buildInterpretPayload";
import { useAI } from "./hooks/useAI";
import { useChart } from "./hooks/useChart";
import { useProfiles } from "./hooks/useProfiles";

export default function App() {
  const ai = useAI();
  const chart = useChart({ onRecalculate: ai.resetForRecalculation });
  const profiles = useProfiles(chart.transitYear);
  const [showMobileProfilePanel, setShowMobileProfilePanel] = React.useState(false);

  const handleSelectProfile = (p: SavedProfile) => {
    chart.applyProfileToForm(p);
    profiles.setActiveProfileId(p.id);
    const calculated = chart.triggerCalculation(
      p.name,
      p.solarDate,
      p.solarTime,
      p.birthplace,
      p.gender,
      p.originalTimezoneOffset ?? 7,
    );
    const savedTy = p.savedInterpretation?.transitYear;
    if (typeof savedTy === "number") {
      chart.setTransitYear(savedTy);
    }
    // Hồ sơ cũ thiếu chartData: rebuild từ lá vừa an để chat không 400.
    const fallbackChartData =
      !p.savedInterpretation?.chartData && calculated && p.savedInterpretation?.content
        ? buildInterpretPayload(
            calculated,
            typeof savedTy === "number" ? savedTy : chart.transitYear,
          )
        : null;
    ai.restoreFromSaved(p.savedInterpretation, fallbackChartData);
    // Bền hóa chartData đã rebuild — truyền p.id vì setActiveProfileId chưa flush.
    if (fallbackChartData && p.savedInterpretation?.content) {
      profiles.persistInterpretationToProfile({ chartData: fallbackChartData }, p.id);
    }
  };

  const handleSaveProfile = () => {
    profiles.handleSaveProfile({
      profileName: chart.profileName,
      solarDate: chart.solarDate,
      solarTime: chart.solarTime,
      birthplace: chart.birthplace,
      gender: chart.gender,
      originalTimezoneOffset: chart.originalTimezoneOffset,
      modelSelection: ai.modelSelection,
      interpretation: ai.interpretation,
      modelUsedResult: ai.modelUsedResult,
      transitYear: chart.transitYear,
      chatTurns: ai.chatTurns,
      chartData: ai.lastChartPayload,
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 text-stone-900 dark:text-neutral-150 font-sans antialiased tracking-tight pb-20">

      {/* Decorative Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-stone-900/95 text-white border-b border-stone-850 py-2 sm:py-2.5 px-3 sm:px-4 scrollbar-none">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2 md:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[0.5rem] overflow-hidden shrink-0 shadow-sm shadow-purple-950/50 bg-[#2a1540] leading-none">
              <img
                src="/app-icon-tight.png"
                alt="Tử Vi Sao AI"
                className="block w-full h-full object-cover object-center"
                width={28}
                height={28}
                draggable={false}
              />
            </div>
            <div>
              <h1 className="font-title text-[13.5px] flex items-center gap-1.5 leading-snug tracking-wide">
                TỬ VI SAO <span className="text-[8.5px] bg-red-600 px-1 py-0.5 rounded text-white tracking-wider font-bold font-sans">AI</span>
              </h1>
              <p className="text-[9px] text-stone-400 font-medium tracking-normal leading-tight">
                Giải mã điểm mù & Vận trình cuộc đời • <span className="text-amber-400 font-semibold tracking-wide">by khackhoa</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[10.5px] text-stone-300 shrink-0">
            <p className="hidden md:flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Độ chính xác thiên văn cao
            </p>
            <p className="hidden md:flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              Múi giờ Hà Nội (GMT+7)
            </p>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-8 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">

        {/* Left column (Form & Saved Profiles): grid span 4 */}
        <div className="lg:col-span-4 space-y-6">
          {chart.calculated && (
            <button
              type="button"
              onClick={() => setShowMobileProfilePanel((v) => !v)}
              className="lg:hidden w-full flex items-center justify-between gap-2 p-3.5 min-h-11 rounded-xl border border-stone-250 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-left shadow-sm"
            >
              <span className="text-xs font-bold text-stone-800 dark:text-neutral-200 truncate">
                {showMobileProfilePanel ? "Ẩn chỉnh hồ sơ" : "Chỉnh hồ sơ"}: {chart.profileName || "—"}
              </span>
              <span className="text-[10px] text-stone-400 shrink-0">
                {chart.solarDate} · {chart.solarTime}
              </span>
            </button>
          )}

          <div className={`space-y-6 ${chart.calculated && !showMobileProfilePanel ? "hidden lg:block" : ""}`}>

          {/* Main birth inputs card */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-stone-250 dark:border-neutral-800 shadow-lg space-y-5">
            <div className="border-b border-stone-200/80 dark:border-neutral-800/80 pb-3.5">
              <h2 className="font-title text-base text-stone-900 dark:text-white flex items-center gap-2.5 font-bold tracking-tight">
                <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-center shadow-xs">
                  <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </span>
                <span>Thiết Lập Thông Tin</span>
              </h2>
            </div>

            <form onSubmit={chart.handleCalculateClick} className="space-y-4">
              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 dark:text-stone-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-stone-400" />
                  Họ và tên
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Châu Khắc Khoa"
                  value={chart.profileName}
                  onChange={(e) => chart.setProfileName(e.target.value)}
                  className="w-full text-sm bg-stone-50 dark:bg-neutral-950 border border-stone-250 dark:border-neutral-800 focus:border-indigo-500 focus:outline-none rounded-xl p-3 text-stone-900 dark:text-white"
                  required
                />
              </div>

              {/* Gender and Region row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 dark:text-stone-300">
                    Giới tính
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-stone-100 dark:bg-neutral-950 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => chart.setGender("Nam")}
                      className={`text-xs py-2.5 min-h-11 font-bold rounded-lg transition-colors ${
                        chart.gender === "Nam"
                          ? "bg-indigo-650 text-white shadow-sm"
                          : "text-stone-500 hover:text-stone-855"
                      }`}
                    >
                      Nam
                    </button>
                    <button
                      type="button"
                      onClick={() => chart.setGender("Nữ")}
                      className={`text-xs py-2.5 min-h-11 font-bold rounded-lg transition-colors ${
                        chart.gender === "Nữ"
                          ? "bg-indigo-650 text-white shadow-sm"
                          : "text-stone-500 hover:text-stone-855"
                      }`}
                    >
                      Nữ
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 dark:text-stone-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    Địa danh sinh
                  </label>
                  <select
                    value={chart.birthplace}
                    onChange={(e) => chart.setBirthplace(e.target.value as typeof chart.birthplace)}
                    className="w-full text-xs font-bold bg-stone-50 dark:bg-neutral-950 border border-stone-250 dark:border-neutral-800 focus:border-indigo-500 focus:outline-none p-[11px] rounded-xl text-stone-800 dark:text-white"
                  >
                    {BIRTHPLACE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {isOverseasBirthplace(chart.birthplace) && (
                    <div className="space-y-1.5 mt-2.5">
                      <label className="text-[10px] font-extrabold text-stone-600 dark:text-stone-300 block uppercase tracking-wider">
                        Múi giờ gốc nơi sinh (GMT)
                      </label>
                      <select
                        value={chart.originalTimezoneOffset}
                        onChange={(e) => chart.setOriginalTimezoneOffset(Number(e.target.value))}
                        className="w-full text-xs font-bold bg-stone-50 dark:bg-neutral-950 border border-stone-250 dark:border-neutral-800 focus:border-indigo-500 focus:outline-none p-[11px] rounded-xl text-stone-800 dark:text-white"
                      >
                        <option value={-12}>GMT-12 (Kwajalein)</option>
                        <option value={-11}>GMT-11 (Samoa)</option>
                        <option value={-10}>GMT-10 (Hawaii)</option>
                        <option value={-9}>GMT-9 (Alaska)</option>
                        <option value={-8}>GMT-8 (Mỹ/Canada PST - San Francisco, Vancouver)</option>
                        <option value={-7}>GMT-7 (Mỹ MST - Denver)</option>
                        <option value={-6}>GMT-6 (Mỹ/Canada CST - Chicago)</option>
                        <option value={-5}>GMT-5 (Mỹ/Canada EST - New York, Toronto)</option>
                        <option value={-4}>GMT-4 (Mỹ AST)</option>
                        <option value={-3.5}>GMT-3.5 (Newfoundland)</option>
                        <option value={-3}>GMT-3 (Argentina, Brazil - Rio de Janeiro)</option>
                        <option value={-2}>GMT-2 (Trung Đại Tây Dương)</option>
                        <option value={-1}>GMT-1 (Azores)</option>
                        <option value={0}>GMT+0 (Anh - London, Bồ Đào Nha)</option>
                        <option value={1}>GMT+1 (Pháp - Paris, Đức - Berlin, Ý - Rome)</option>
                        <option value={2}>GMT+2 (Ai Cập, Hy Lạp, Nam Phi)</option>
                        <option value={3}>GMT+3 (Nga - Moscow, Thổ Nhĩ Kỳ, Ả Rập)</option>
                        <option value={3.5}>GMT+3.5 (Iran)</option>
                        <option value={4}>GMT+4 (Dubai, UAE)</option>
                        <option value={4.5}>GMT+4.5 (Afghanistan)</option>
                        <option value={5}>GMT+5 (Pakistan, Uzbekistan)</option>
                        <option value={5.5}>GMT+5.5 (Ấn Độ, Sri Lanka)</option>
                        <option value={5.75}>GMT+5.75 (Nepal)</option>
                        <option value={6}>GMT+6 (Bangladesh, Bhutan)</option>
                        <option value={6.5}>GMT+6.5 (Myanmar)</option>
                        <option value={7}>GMT+7 (Việt Nam, Thái Lan, Indonesia)</option>
                        <option value={8}>GMT+8 (Singapore, Trung Quốc - Bắc Kinh, Đài Loan, Tây Úc)</option>
                        <option value={9}>GMT+9 (Nhật Bản, Hàn Quốc)</option>
                        <option value={9.5}>GMT+9.5 (Úc - Darwin)</option>
                        <option value={10}>GMT+10 (Úc - Sydney, Melbourne)</option>
                        <option value={11}>GMT+11 (Solomon Islands)</option>
                        <option value={12}>GMT+12 (New Zealand, Fiji)</option>
                        <option value={13}>GMT+13 (Tonga)</option>
                        <option value={14}>GMT+14 (Line Islands)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Solar Date and Time row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-bold text-stone-600 dark:text-stone-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    Ngày Dương lịch
                  </label>
                  <input
                    type="date"
                    lang="vi-VN"
                    value={chart.solarDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        chart.setSolarDate(e.target.value);
                      }
                    }}
                    className="w-full text-xs font-bold bg-stone-50 dark:bg-neutral-950 border border-stone-250 dark:border-neutral-800 focus:border-indigo-500 focus:outline-none p-2.5 rounded-xl text-stone-800 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 dark:text-stone-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    Giờ Sinh gốc
                  </label>
                  <input
                    type="time"
                    value={chart.solarTime}
                    onChange={(e) => chart.setSolarTime(e.target.value)}
                    className="w-full text-xs font-bold bg-stone-50 dark:bg-neutral-950 border border-stone-250 dark:border-neutral-800 focus:border-indigo-500 focus:outline-none p-2.5 rounded-xl text-stone-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Submit calculations button */}
              <button
                type="submit"
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold p-3.5 rounded-xl text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 border border-stone-800 dark:bg-neutral-800 dark:hover:bg-neutral-700"
              >
                <Compass className="w-4 h-4 text-amber-500 motion-safe:animate-spin-slow" />
                An Sao Lập Lá Số
              </button>
            </form>
          </div>

          {/* Stored user profile manager */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-stone-250 dark:border-neutral-800 shadow-md space-y-4">
            <h3 className="font-title text-sm text-stone-900 dark:text-white flex items-center gap-2.5 border-b border-stone-200/80 dark:border-neutral-800/80 pb-2.5 font-bold tracking-tight">
              <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-center shadow-xs">
                <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </span>
              <span>Sổ Tay Hồ Sơ ({profiles.savedProfiles.length})</span>
            </h3>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {profiles.savedProfiles.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProfile(p)}
                  className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${
                    profiles.activeProfileId === p.id
                      ? "bg-indigo-50/50 border-indigo-300 text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400"
                      : "bg-stone-50 dark:bg-neutral-955 border-stone-200 dark:border-neutral-800 hover:bg-stone-100"
                  }`}
                >
                  <div className="space-y-0.5 text-left">
                    <p className="font-bold text-xs">{p.name} ({p.gender})</p>
                    <p className="text-[10px] text-stone-400 font-medium">
                      {formatToVietnameseDate(p.solarDate)} • {p.solarTime} • {birthplaceShortLabel(p.birthplace)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => profiles.handleDeleteProfile(p.id, e)}
                    aria-label={`Xóa hồ sơ ${p.name}`}
                    title="Xóa hồ sơ"
                    className="p-2.5 min-h-11 min-w-11 flex items-center justify-center text-stone-400 hover:text-red-500 rounded-lg hover:bg-stone-200/50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {profiles.savedProfiles.length === 0 && (
                <div className="p-8 text-center text-stone-400 space-y-1">
                  <Users className="w-6 h-6 mx-auto text-stone-300" />
                  <p className="text-xs font-medium">Chưa có hồ sơ nào được lưu</p>
                  <p className="text-[10px]">Nhập thông tin sinh, an sao lập lá số, rồi bấm &quot;Lưu Hồ Sơ&quot; để ghi nhớ.</p>
                </div>
              )}
            </div>
          </div>

          </div>

        </div>

        {/* Right column (Visual Horoscope grid list & AI panels): grid span 8 */}
        <div className="lg:col-span-8 space-y-8">
          {chart.calculated ? (
            <>
              {/* Palace map layout */}
              <div id="chart-section" className="space-y-2 text-left scroll-mt-24">
                <div className="flex justify-between items-center px-1">
                  <div>
                    <h2 className="font-title text-lg text-neutral-900 dark:text-white flex items-center gap-2.5 font-bold tracking-tight">
                      <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-center shadow-xs">
                        <FileCheck className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                      </span>
                      <span>Lá Số Tử Vi Thiên Bàn</span>
                    </h2>
                  </div>

                  <span className="text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full font-bold border border-indigo-200/50 dark:border-indigo-800/50 shadow-2xs">
                    Khung Trục Mệnh
                  </span>
                </div>

                <HoroscopeChart
                  calculated={chart.calculated}
                  profileName={chart.profileName || "Hồ Sơ Mẫu"}
                  onSaveProfile={handleSaveProfile}
                  isSaved={chart.isCurrentChartSaved(profiles.savedProfiles)}
                  transitYear={chart.transitYear}
                  setTransitYear={chart.setTransitYear}
                />
              </div>

              {/* AI interpretation layer */}
              <ErrorBoundary label="luận giải AI">
              <AIInterpreter
                interpretation={ai.interpretation}
                isLoading={ai.aiLoading}
                error={ai.aiError}
                onTriggerInterpret={() =>
                  ai.handleTriggerInterpret(
                    chart.calculated,
                    chart.transitYear,
                    profiles.persistInterpretationToProfile,
                  )
                }
                apiKey={ai.apiKey}
                setApiKey={ai.setApiKey}
                modelSelection={ai.modelSelection}
                setModelSelection={ai.setModelSelection}
                retryCountdown={ai.retryCountdown}
                fallbackUsedResult={ai.fallbackUsedResult}
                starAuditWarning={ai.starAuditWarning}
                starHallucinated={ai.starHallucinated}
                starAuditRetried={ai.starAuditRetried}
                truncated={ai.truncated}
                structureIssues={ai.structureIssues}
                chatTurns={ai.chatTurns}
                chatLoading={ai.chatLoading}
                chatError={ai.chatError}
                chatStarAuditWarning={ai.chatStarAuditWarning}
                onAskFollowUp={(q) =>
                  ai.handleAskFollowUp(q, profiles.persistInterpretationToProfile)
                }
              />
              </ErrorBoundary>
            </>
          ) : (
            <div className="p-20 text-center text-stone-400 space-y-4 bg-white dark:bg-neutral-900 rounded-3xl border border-stone-200 dark:border-neutral-800">
              <Compass className="w-12 h-12 mx-auto text-indigo-600 motion-safe:animate-spin-slow" />
              <div className="space-y-1 max-w-sm mx-auto">
                <p className="font-bold text-stone-800 dark:text-neutral-200 text-sm">Chưa có thiên bàn — hãy an lá số</p>
                <p className="text-xs">
                  Điền đầy đủ ngày giờ sinh, giới tính và nơi sinh ở cột bên trái, rồi bấm <strong>&quot;An Sao Lập Lá Số&quot;</strong> để dựng 12 cung và sao.
                </p>
              </div>
            </div>
          )}
        </div>

      </main>

      <footer className="max-w-7xl mx-auto px-4 mt-16 pt-8 pb-12 border-t border-stone-250/60 dark:border-neutral-800/80 text-xs text-stone-400 dark:text-neutral-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-semibold tracking-wide text-stone-500 dark:text-neutral-400 text-center sm:text-left">
            ỨNG DỤNG TỬ VI SAO BẢN MỆNH AI © 2026
          </p>
          <div className="flex flex-col items-center sm:items-end gap-2">
            <p className="flex items-center gap-1.5 font-sans font-medium text-stone-500 dark:text-neutral-400">
              <span>Thiết kế & Phát triển:</span>
              <span className="px-2.5 py-1 text-[10px] rounded-lg bg-stone-100 dark:bg-neutral-900 border border-stone-250 dark:border-neutral-800 text-stone-700 dark:text-neutral-300 font-bold tracking-widest font-mono uppercase">
                by khackhoa
              </span>
            </p>
            <a
              href="mailto:khackhoachau@gmail.com"
              className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-stone-700 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
              <span className="font-bold">contact:</span>
              <span className="font-mono font-extrabold tracking-wide">khackhoachau@gmail.com</span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}