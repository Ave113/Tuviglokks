import React from "react";
import { generateTuviAstrolabe } from "../utils/tuvi";
import { BIRTHPLACE } from "../constants/birthplace";
import { defaultTransitYear } from "../utils/transitYear";
import type { BirthplaceRegion, SavedProfile } from "../types";

export interface UseChartOptions {
  /** Gọi khi lá số được tính lại — thường để reset AI. */
  onRecalculate?: () => void;
}

export function useChart(options: UseChartOptions = {}) {
  const { onRecalculate } = options;

  const [profileName, setProfileName] = React.useState("");
  const [solarDate, setSolarDate] = React.useState("1995-10-25");
  const [solarTime, setSolarTime] = React.useState("12:30");
  const [birthplace, setBirthplace] = React.useState<BirthplaceRegion>(BIRTHPLACE.SOUTH);
  const [gender, setGender] = React.useState<"Nam" | "Nữ">("Nam");
  const [originalTimezoneOffset, setOriginalTimezoneOffset] = React.useState(7);
  const [transitYear, setTransitYear] = React.useState(defaultTransitYear);
  const [calculated, setCalculated] = React.useState<any | null>(null);
  const userTriggeredCalc = React.useRef(false);

  const triggerCalculation = React.useCallback(
    (
      nameVal: string,
      dateVal: string,
      timeVal: string,
      placeVal: BirthplaceRegion,
      genderVal: "Nam" | "Nữ",
      tzOffsetVal?: number,
    ) => {
      try {
        const result = generateTuviAstrolabe(dateVal, timeVal, placeVal, genderVal, tzOffsetVal);
        setCalculated(result);
        onRecalculate?.();
        if (userTriggeredCalc.current) {
          userTriggeredCalc.current = false;
          requestAnimationFrame(() => {
            document.getElementById("chart-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }
      } catch (error: any) {
        alert(`Lỗi khi tạo lá số: ${error?.message || error}`);
      }
    },
    [onRecalculate],
  );

  const initialCalcDone = React.useRef(false);
  React.useEffect(() => {
    if (initialCalcDone.current) return;
    initialCalcDone.current = true;
    triggerCalculation("Hồ Sơ Mẫu", "1995-10-25", "12:30", BIRTHPLACE.SOUTH, "Nam");
  }, [triggerCalculation]);

  const applyProfileToForm = React.useCallback((p: SavedProfile) => {
    setProfileName(p.name);
    setSolarDate(p.solarDate);
    setSolarTime(p.solarTime);
    setBirthplace(p.birthplace);
    setGender(p.gender);
    setOriginalTimezoneOffset(p.originalTimezoneOffset ?? 7);
  }, []);

  const handleCalculateClick = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!profileName.trim()) {
        alert("Vui lòng điền tên chủ nhân lá số.");
        return;
      }
      const yearNum = parseInt(solarDate.split("-")[0], 10);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        alert("Vui lòng nhập năm sinh hợp lệ trong khoảng 1900 - 2100.");
        return;
      }
      userTriggeredCalc.current = true;
      triggerCalculation(profileName, solarDate, solarTime, birthplace, gender, originalTimezoneOffset);
    },
    [profileName, solarDate, solarTime, birthplace, gender, originalTimezoneOffset, triggerCalculation],
  );

  const isCurrentChartSaved = React.useCallback(
    (savedProfiles: SavedProfile[]) =>
      savedProfiles.some(
        (p) => p.name === profileName && p.solarDate === solarDate && p.solarTime === solarTime,
      ),
    [profileName, solarDate, solarTime],
  );

  return {
    profileName,
    setProfileName,
    solarDate,
    setSolarDate,
    solarTime,
    setSolarTime,
    birthplace,
    setBirthplace,
    gender,
    setGender,
    originalTimezoneOffset,
    setOriginalTimezoneOffset,
    transitYear,
    setTransitYear,
    calculated,
    triggerCalculation,
    handleCalculateClick,
    applyProfileToForm,
    isCurrentChartSaved,
  };
}