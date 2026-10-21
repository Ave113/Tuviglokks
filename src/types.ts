export type { BirthplaceRegion } from "./constants/birthplace";
export type { GeminiModelSelection } from "./constants/geminiModels";
import type { BirthplaceRegion } from "./constants/birthplace";
import type { GeminiModelSelection } from "./constants/geminiModels";
import type { EnrichedPalacePayload } from "./schools/enrichPalace";
import type { LayerTuHoa } from "./utils/tuHoa";

export interface BirthInput {
  name: string;
  solarDate: string; // YYYY-MM-DD
  solarTime: string; // HH:MM
  birthplace: BirthplaceRegion;
  gender: "Nam" | "Nữ";
  customApiKey: string;
  modelSelection: GeminiModelSelection;
  originalTimezoneOffset?: number; // for overseas births
}

// Một lượt hỏi đáp follow-up trên lá số đã luận giải.
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Hậu kiểm cấu trúc bài luận từ /api/interpret (chỉ gồm phần/heading bị thiếu). */
export interface InterpretStructureIssues {
  missingParts: number[];
  missingHeadings: string[];
}

/**
 * Payload lá số gửi /api/interpret và /api/chat (và bền hóa trong hồ sơ).
 * Shape tối thiểu server validate; các field bổ sung (baZi, schoolMeta…) tuỳ chọn.
 */
export interface InterpretChartData {
  solarDate?: string;
  solarTime?: string;
  lunarDate?: string;
  chineseDate?: string;
  gender?: string;
  fiveElementsClass?: string;
  zodiac?: string;
  sign?: string;
  soul?: string;
  body?: string;
  birthHeavenlyStem?: string;
  /** Năm âm lịch (iztro) — dùng recompute Tuần/Triệt khóa 2 cung. */
  birthLunarYear?: number;
  transitYear?: number;
  transitLunarAge?: number;
  transitDecadalPalace?: string;
  transitYearlyPalace?: string;
  transitLuuThaiTuePalace?: string;
  transitLuuThaiTueIndex?: number;
  /** Can–chi + range đại hạn đang đứng */
  transitDecadalStem?: string;
  transitDecadalBranch?: string;
  transitDecadalRange?: [number, number] | null;
  /** ages tiểu hạn của cung tiểu hạn hiện tại */
  transitTieuHanAges?: number[];
  /** Tứ Hóa đại hạn / lưu niên (4 sao + nhãn + cung đích) */
  transitDecadalTuHoa?: LayerTuHoa | null;
  transitYearlyTuHoa?: LayerTuHoa | null;
  birthLunarMonth?: number;
  birthHourIndex?: number;
  schoolMeta?: Record<string, unknown>;
  baZi?: unknown;
  palaces: EnrichedPalacePayload[];
}

// Bản luận giải đã lưu kèm hồ sơ (bền hóa vào localStorage cùng SavedProfile),
// để mở lại hồ sơ không phải gọi AI lại.
export interface SavedInterpretation {
  content: string;
  modelUsed: string;
  transitYear: number;
  createdAt: string;
  chat: ChatTurn[];
  // Payload lá số (12 cung + sao + transit) đã gửi khi luận giải, bền hóa để phần
  // hỏi đáp tra cứu sao/cung đúng khi mở lại hồ sơ (không phải luận giải lại).
  chartData?: InterpretChartData;
}

export interface SavedProfile extends Omit<BirthInput, "customApiKey"> {
  id: string;
  createdAt: string;
  // Đính kèm bản luận giải + lịch sử hỏi đáp gần nhất (nếu có).
  savedInterpretation?: SavedInterpretation;
}
