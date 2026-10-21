import React from "react";
import type { ChatTurn, InterpretChartData, SavedInterpretation, SavedProfile } from "../types";
import { safeSetLocalStorage } from "../utils/storage";

export interface SaveProfileInput {
  profileName: string;
  solarDate: string;
  solarTime: string;
  birthplace: SavedProfile["birthplace"];
  gender: "Nam" | "Nữ";
  originalTimezoneOffset: number;
  modelSelection: SavedProfile["modelSelection"];
  interpretation: string | null;
  modelUsedResult: string;
  transitYear: number;
  chatTurns: ChatTurn[];
  /** Payload lá số đã luận — bắt buộc để chat restore đúng sau refresh. */
  chartData?: InterpretChartData | null;
}

export function useProfiles(transitYear: number) {
  const [savedProfiles, setSavedProfiles] = React.useState<SavedProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const storedProfiles = localStorage.getItem("tuvi_profiles");
    if (!storedProfiles) return;
    try {
      setSavedProfiles(JSON.parse(storedProfiles));
    } catch (e) {
      console.error("Lỗi parse dữ liệu hồ sơ đã lưu:", e);
    }
  }, []);

  /**
   * Cập nhật sớ/chat/chartData trên hồ sơ.
   * `profileId` tuỳ chọn — truyền tường minh khi vừa setActiveProfileId (state chưa flush).
   */
  const persistInterpretationToProfile = React.useCallback(
    (patch: Partial<SavedInterpretation>, profileId?: string | null) => {
      const id = profileId ?? activeProfileId;
      if (!id) return;
      setSavedProfiles((prev) => {
        const updated = prev.map((p) => {
          if (p.id !== id) return p;
          const base: SavedInterpretation = p.savedInterpretation || {
            content: "",
            modelUsed: "",
            transitYear,
            createdAt: new Date().toISOString(),
            chat: [],
          };
          return { ...p, savedInterpretation: { ...base, ...patch } };
        });
        safeSetLocalStorage("tuvi_profiles", JSON.stringify(updated));
        return updated;
      });
    },
    [activeProfileId, transitYear],
  );

  const handleSaveProfile = React.useCallback((input: SaveProfileInput) => {
    if (!input.profileName.trim()) return;

    const newProfile: SavedProfile = {
      id: crypto.randomUUID(),
      name: input.profileName,
      solarDate: input.solarDate,
      solarTime: input.solarTime,
      birthplace: input.birthplace,
      gender: input.gender,
      modelSelection: input.modelSelection,
      originalTimezoneOffset: input.originalTimezoneOffset,
      createdAt: new Date().toLocaleDateString("vi-VN"),
      ...(input.interpretation
        ? {
            savedInterpretation: {
              content: input.interpretation,
              modelUsed: input.modelUsedResult,
              transitYear: input.transitYear,
              createdAt: new Date().toISOString(),
              chat: input.chatTurns,
              ...(input.chartData ? { chartData: input.chartData } : {}),
            },
          }
        : {}),
    };

    const updated = [
      newProfile,
      ...savedProfiles.filter(
        (p) =>
          !(
            p.name === input.profileName &&
            p.solarDate === input.solarDate &&
            p.solarTime === input.solarTime &&
            p.gender === input.gender
          ),
      ),
    ];
    setSavedProfiles(updated);
    safeSetLocalStorage("tuvi_profiles", JSON.stringify(updated));
    setActiveProfileId(newProfile.id);
  }, [savedProfiles]);

  const handleDeleteProfile = React.useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedProfiles.filter((p) => p.id !== id);
    setSavedProfiles(updated);
    safeSetLocalStorage("tuvi_profiles", JSON.stringify(updated));
    if (activeProfileId === id) {
      setActiveProfileId(null);
    }
  }, [savedProfiles, activeProfileId]);

  return {
    savedProfiles,
    activeProfileId,
    setActiveProfileId,
    persistInterpretationToProfile,
    handleSaveProfile,
    handleDeleteProfile,
  };
}