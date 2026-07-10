export type { BirthplaceRegion } from "./constants/birthplace";
export type { GeminiModelSelection } from "./constants/geminiModels";
import type { BirthplaceRegion } from "./constants/birthplace";
import type { GeminiModelSelection } from "./constants/geminiModels";

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
  chartData?: any;
}

export interface SavedProfile extends Omit<BirthInput, "customApiKey"> {
  id: string;
  createdAt: string;
  // Đính kèm bản luận giải + lịch sử hỏi đáp gần nhất (nếu có).
  savedInterpretation?: SavedInterpretation;
}
