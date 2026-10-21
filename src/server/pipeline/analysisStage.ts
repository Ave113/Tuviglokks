/**
 * A1 — CHẶNG 1: PHÂN TÍCH (ANALYSIS SKELETON) + CẮM KHUNG CHO CHẶNG 2.
 *
 * Tách "đọc lá" khỏi "viết bài": chặng 1 dùng model nhẹ đọc nguyên bộ dữ liệu
 * lá số và xuất MỘT khối JSON bộ khung — cách cục then chốt, sao neo từng
 * domain, đường bay phi (bắt buộc có Mệnh/Phúc Đức), điểm mù, thẻ sự kiện,
 * kích hoạt hạn, tóm năm và brief cho TỪNG phần 1..N của bài luận.
 *
 * Nguyên tắc an toàn:
 *  - Rơi (lỗi API / JSON hỏng sau loạt retry) → trả null, route quay về đúng
 *    đường 1-call cũ. Pipeline không bao giờ làm hỏng UX hiện tại.
 *  - JSON key ASCII, giá trị tiếng Việt; parser khoan dung (fence / prose).
 *  - Chống bịa sao: chỉ nhắc sao/cung thực có trong dữ liệu; block skeleton
 *    gửi chặng 2 tuyên bố rõ "khung tham chiếu — lá số vẫn là chuẩn".
 */

import type { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_FLASH, GEMINI_MODEL_FLASH_LITE } from "../../constants/geminiModels";
import {
  ANALYSIS_ATTEMPT_CAP_MS,
  ANALYSIS_MAX_OUTPUT_TOKENS,
  ANALYSIS_STAGE_BUDGET_MS,
  buildAiConfig,
} from "../aiConfig";
import { interpretResponse } from "../gemini";
import { INTERPRET_FRAMEWORK_MARKER, interpretPartTitles } from "../../prompt/interpretFrameworkPrompt";
import { expectedInterpretPartCount } from "./narrativeStructure";

// ----------------------------------------------------------------------------
// Kiểu dữ liệu bộ khung phân tích (key ASCII, value tiếng Việt)
// ----------------------------------------------------------------------------

export interface AnalysisFlight {
  tu: string;
  hoa: string;
  den: string;
  y_nghia: string;
}

export interface AnalysisEventCard {
  domain: string;
  headline: string;
  neo: string;
}

export interface AnalysisYearTrend {
  domain: string;
  xu_the: string;
}

export interface AnalysisPartBrief {
  phan: number;
  huong_viet: string;
  neo_sao: string[];
}

export interface InterpretAnalysis {
  de_tai_la_so: string;
  cach_cuc: string[];
  sao_then_chot: { domain: string; sao: string[] }[];
  duong_bay_phi: AnalysisFlight[];
  diem_mu: string[];
  the_su_kien: AnalysisEventCard[];
  trigger_han: string[];
  tong_nam: AnalysisYearTrend[];
  phan_brief: AnalysisPartBrief[];
}

export interface AnalysisStageResult {
  analysis: InterpretAnalysis;
  model: string;
  attempts: number;
}

// ----------------------------------------------------------------------------
// Chỉ đạo chặng 1 (appended SAU khung viết bài → thắng nhờ vị trí cuối)
// ----------------------------------------------------------------------------

const buildPartTitles = (): string[] => interpretPartTitles();

export const buildAnalysisInstruction = (partCount: number, retry = false): string => {
  const titles = buildPartTitles();

  return `

--- CHỈ ĐẠO CHẶNG PHÂN TÍCH (GHI ĐÈ MỌI CHỈ ĐẠO VIẾT BÀI Ở TRÊN) ---
Bạn đang ở CHẶNG 1 — PHÂN TÍCH. KHÔNG viết bài luận, KHÔNG theo khung viết bài. Nhiệm vụ duy nhất: đọc toàn bộ dữ liệu lá số ở trên và trả về MỘT khối JSON duy nhất theo đúng schema:

{
  "de_tai_la_so": "1 câu tóm chất liệu chủ đạo của lá (cách cục/bản sắc)",
  "cach_cuc": ["tên cách cục ĐÚNG như mục CÁCH CỤC CHÍNH TINH liệt kê"],
  "sao_then_chot": [{ "domain": "menh|tai|quan|tinh|gia_dao|suc_khoe|han", "sao": ["sao thật trên lá"] }],
  "duong_bay_phi": [{ "tu": "cung phát", "hoa": "Lộc|Quyền|Khoa|Kỵ", "den": "cung đích", "y_nghia": "1 câu đời thực" }],
  "diem_mu": ["2–3 tên mầm điểm mù TRỌNG TÂM NHẤT đúng sheet TÍNH VA ĐẬP & ĐIỂM MÙ — bỏ mầm phụ/trùng ý; nếu sheet ghi KHÔNG CÓ MẦM TRỌNG TÂM thì để []"],
  "the_su_kien": [{ "domain": "domain đúng thẻ", "headline": "1 câu chuyện đời", "neo": "sao lưu/Lưu Hóa neo" }],
  "trigger_han": ["kích hoạt CAO ĐÚNG sheet KÍCH HOẠT HẠN ↔ ĐIỂM MÙ"],
  "tong_nam": [{ "domain": "tien_bac|suc_khoe|cong_viec|tinh_cam", "xu_the": "1 câu xu hướng năm" }],
  "phan_brief": [{ "phan": 1, "huong_viet": "1-2 câu hướng đi cho phần này", "neo_sao": ["sao/cung thật làm xương sống phần"] }]
}

Quy tắc cứng:
1. CHỈ dùng sao/cung/cách/thẻ/kích hoạt THỰC CÓ trong dữ liệu trên. Không suy diễn sao ngoài lá.
2. "duong_bay_phi" ưu tiên ít nhất 1 đường từ Cung Mệnh hoặc Cung Phúc Đức (block ĐƯỜNG BAY TÂM LÝ CỐT LÕI); thêm 1-3 đường Tài/Quan/Phu nếu có. Dữ liệu thiếu → để rỗng, không bịa.
3. Sheet/thẻ nào rỗng → mảng rỗng, không bịa bù.
4. "phan_brief" phải ĐỦ ${partCount} brief cho ${partCount} phần đánh số (Đối chiếu Bát Tự nằm trong Phần ${partCount}, không tách phần). Danh sách: ${titles.join("; ")}.
5. "diem_mu" tối đa 3 mầm trọng tâm nhất; không liệt kê mầm phụ chỉ để đủ số; sheet ghi KHÔNG CÓ MẦM TRỌNG TÂM → mảng rỗng.
6. JSON hợp lệ tuyệt đối: không markdown fence, không chú thích, chuỗi escape chuẩn.
${retry ? "\nNHẮC LẠI: Trả về CHỈ khối JSON hợp lệ — không bất kỳ ký tự nào khác ngoài JSON." : ""}`;
};

/** System instruction riêng cho chặng phân tích — khóa vai trò máy, không viết văn. */
export const ANALYSIS_SYSTEM_INSTRUCTION = `Bạn là module phân tích lá số Tử Vi (chặng 1 của pipeline luận giải). Nhiệm vụ DUY NHẤT: đọc dữ liệu lá số được cung cấp và xuất ra MỘT khối JSON duy nhất theo đúng schema được yêu cầu trong đề bài. KHÔNG viết bài luận, KHÔNG diễn giải văn xuôi, KHÔNG xuất bất kỳ nội dung nào ngoài JSON. Chỉ được nhắc sao/cung/cách cục/thẻ/kích hoạt thực sự có trong dữ liệu. JSON phải parse được ngay: không markdown fence, không chú thích, chuỗi escape chuẩn.`;

// ----------------------------------------------------------------------------
// Parser khoan dung + sanitizer
// ----------------------------------------------------------------------------

const asStr = (v: unknown, max: number): string => {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : "";
};

const asStrArr = (v: unknown, cap: number, maxLen: number): string[] => {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    const s = asStr(item, maxLen);
    if (s) out.push(s);
    if (out.length >= cap) break;
  }
  return out;
};

/** Lấy JSON từ text bất kỳ: bỏ fence, cắt từ "{" đầu đến "}" cuối. */
export const extractJsonSlice = (raw: string): string | null => {
  const s = String(raw ?? "").replace(/```(?:json)?/gi, "");
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  return s.slice(start, end + 1);
};

export const parseAnalysisJson = (raw: string): InterpretAnalysis | null => {
  const slice = extractJsonSlice(raw);
  if (!slice) return null;
  let obj: any;
  try {
    obj = JSON.parse(slice);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;

  const saoThenChot = Array.isArray(obj.sao_then_chot)
    ? obj.sao_then_chot
      .slice(0, 7)
      .map((g: any) => ({
        domain: asStr(g?.domain, 24),
        sao: asStrArr(g?.sao, 6, 40),
      }))
      .filter((g: { domain: string; sao: string[] }) => g.domain && g.sao.length)
    : [];

  const duongBayPhi = Array.isArray(obj.duong_bay_phi)
    ? obj.duong_bay_phi
      .slice(0, 4)
      .map((f: any) => ({
        tu: asStr(f?.tu, 40),
        hoa: asStr(f?.hoa, 12),
        den: asStr(f?.den, 40),
        y_nghia: asStr(f?.y_nghia, 220),
      }))
      .filter((f: AnalysisFlight) => f.tu && f.hoa && f.den)
    : [];

  const theSuKien = Array.isArray(obj.the_su_kien)
    ? obj.the_su_kien
      .slice(0, 4)
      .map((c: any) => ({
        domain: asStr(c?.domain, 30),
        headline: asStr(c?.headline, 180),
        neo: asStr(c?.neo, 120),
      }))
      .filter((c: AnalysisEventCard) => c.domain && c.headline)
    : [];

  const tongNam = Array.isArray(obj.tong_nam)
    ? obj.tong_nam
      .slice(0, 4)
      .map((t: any) => ({
        domain: asStr(t?.domain, 20),
        xu_the: asStr(t?.xu_the, 240),
      }))
      .filter((t: AnalysisYearTrend) => t.domain && t.xu_the)
    : [];

  const maxInterpretPart = expectedInterpretPartCount();
  const phanBrief = Array.isArray(obj.phan_brief)
    ? obj.phan_brief
      // Đọc dư để không mất brief hợp lệ nếu model chèn entry rác phía trước.
      .slice(0, maxInterpretPart * 3)
      .map((p: any): AnalysisPartBrief | null => {
        // Lọc TRƯỚC khi kẹp: phan không phải số nguyên 1..4 → bỏ nguyên entry,
        // tránh brief rác bị max(1,…) nâng thành Phần 1 đè lên brief thật.
        const n = Math.round(Number(p?.phan));
        if (!Number.isFinite(n) || n < 1 || n > maxInterpretPart) return null;
        const huong = asStr(p?.huong_viet, 320);
        const neo = asStrArr(p?.neo_sao, 5, 40);
        return huong || neo.length ? { phan: n, huong_viet: huong, neo_sao: neo } : null;
      })
      .filter((p: AnalysisPartBrief | null): p is AnalysisPartBrief => p !== null)
      .slice(0, maxInterpretPart)
    : [];

  const analysis: InterpretAnalysis = {
    de_tai_la_so: asStr(obj.de_tai_la_so, 300),
    cach_cuc: asStrArr(obj.cach_cuc, 6, 80),
    sao_then_chot: saoThenChot,
    duong_bay_phi: duongBayPhi,
    diem_mu: asStrArr(obj.diem_mu, 3, 60),
    the_su_kien: theSuKien,
    trigger_han: asStrArr(obj.trigger_han, 5, 80),
    tong_nam: tongNam,
    phan_brief: phanBrief,
  };

  const hasContent =
    analysis.de_tai_la_so ||
    analysis.cach_cuc.length ||
    analysis.sao_then_chot.length ||
    analysis.duong_bay_phi.length ||
    analysis.phan_brief.length;
  return hasContent ? analysis : null;
};

// ----------------------------------------------------------------------------
// Renderer skeleton → block cắm chặng 2
// ----------------------------------------------------------------------------

export const buildSkeletonBlock = (
  analysis: InterpretAnalysis | null,
  musicBedStr = "",
  hasBaZi = true,
): string => {
  if (!analysis) return "";
  const lines: string[] = [];

  if (analysis.de_tai_la_so) lines.push(`• Chủ đề lá: ${analysis.de_tai_la_so}`);
  if (analysis.cach_cuc.length) lines.push(`• Cách cục then chốt: ${analysis.cach_cuc.join(" · ")}`);
  if (analysis.sao_then_chot.length) {
    lines.push(`• Sao neo theo domain: ${analysis.sao_then_chot.map((g) => `${g.domain}: ${g.sao.join(", ")}`).join(" | ")}`);
  }
  if (analysis.duong_bay_phi.length) {
    lines.push(`• Đường bay phi: ${analysis.duong_bay_phi.map((f) => `từ ${f.tu} phi ${f.hoa} vào ${f.den} — ${f.y_nghia}`).join(" | ")}`);
  }
  if (analysis.diem_mu.length) lines.push(`• Điểm mù trọng tâm (đã chọn): ${analysis.diem_mu.slice(0, 3).join(" · ")}`);
  if (analysis.the_su_kien.length) {
    lines.push(`• Thẻ sự kiện năm: ${analysis.the_su_kien.map((c) => `[${c.domain}] ${c.headline} (neo: ${c.neo})`).join(" | ")}`);
  }
  if (analysis.trigger_han.length) lines.push(`• Kích hoạt hạn CAO: ${analysis.trigger_han.join(" · ")}`);
  if (analysis.tong_nam.length) {
    lines.push(`• Tóm năm: ${analysis.tong_nam.map((t) => `${t.domain}: ${t.xu_the}`).join(" | ")}`);
  }
  if (analysis.phan_brief.length) {
    lines.push("• BRIEF TỪNG PHẦN (viết bám, đủ mọi phần):");
    for (const p of analysis.phan_brief) {
      const neo = p.neo_sao.length ? ` (neo: ${p.neo_sao.join(", ")})` : "";
      lines.push(`  - Phần ${p.phan}: ${p.huong_viet}${neo}`);
    }
  }

  if (!lines.length && !musicBedStr) return "";
  return `--- KHUNG PHÂN TÍCH CHỐT TỪ CHẶNG 1 (BỘ KHUNG CHO BÀI VIẾT) ---
Bộ khung dưới do máy phân tích chốt từ chính dữ liệu lá ở trên. BẮT BUỘC: mỗi phần bám đúng brief tương ứng, mọi MỤC bắt buộc đang áp dụng cho lá này đều phải có mặt; heading có thể dùng ##/### hoặc bold nhất quán. Mọi sao/cung trong khung phải là sao lá thật; LÁ SỐ VẪN LÀ TIÊU CHUẨN TỐI CAO — nếu khung lệch lá thì bỏ mục lệch và làm theo lá. Lưu ý: mở bài bằng mục "Phần 0 — CHÂN DUNG & 3 TRỤC CHÍNH" (## hoặc bold, không đánh số 0 vào dãy 1..${expectedInterpretPartCount()}); ${hasBaZi ? `Đối chiếu Bát Tự là mục con của Phần ${expectedInterpretPartCount()}, viết đúng mục "Đối chiếu chéo Bát Tự"` : `lá không có dữ liệu Bát Tự nên BỎ mục "Đối chiếu chéo Bát Tự", không bịa`}; kết bằng "KẾT LUẬN CUỐI — 5 DÒNG"; KHÔNG tự chế phần mới:
${lines.join("\n")}${musicBedStr ? `\n\n${musicBedStr}` : ""}
--- HẾT KHUNG PHÂN TÍCH ---`;
};

/** Cắm skeleton vào prompt chặng 2 — NGAY TRƯỚC khung luận giải để khung vẫn đứng cuối. */
export const injectSkeletonBlock = (prompt: string, skeleton: string): string => {
  if (!skeleton) return prompt;
  const idx = prompt.indexOf(INTERPRET_FRAMEWORK_MARKER);
  if (idx < 0) return `${prompt}\n\n${skeleton}`;
  return `${prompt.slice(0, idx)}${skeleton}\n\n${prompt.slice(idx)}`;
};

// ----------------------------------------------------------------------------
// Runner chặng 1: lite → lite(strict) → primary; rơi toàn bộ → null
// Toàn chặng bị chặn bởi ANALYSIS_STAGE_BUDGET_MS — attempt treo bị cắt theo
// thời gian còn lại của budget (request mồ côi tiếp tục chạy phía Gemini nhưng
// kết quả bị bỏ qua — không có cách abort sạch với SDK hiện tại).
// ----------------------------------------------------------------------------

const withTimeout = <T,>(p: Promise<T>, ms: number, label: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label}: quá ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });

export const runAnalysisStage = async (
  ai: GoogleGenAI,
  fullPrompt: string,
  partCount: number,
): Promise<AnalysisStageResult | null> => {
  const attempts: { model: string; retry: boolean }[] = [
    { model: GEMINI_MODEL_FLASH_LITE, retry: false },
    { model: GEMINI_MODEL_FLASH_LITE, retry: true },
    { model: GEMINI_MODEL_FLASH, retry: true },
  ];

  const deadline = Date.now() + ANALYSIS_STAGE_BUDGET_MS;
  let n = 0;
  for (const attempt of attempts) {
    const remaining = deadline - Date.now();
    if (remaining < 500) break;
    n++;
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: attempt.model,
          contents: `${fullPrompt}${buildAnalysisInstruction(partCount, attempt.retry)}`,
          config: buildAiConfig(ANALYSIS_SYSTEM_INSTRUCTION, {
            maxOutputTokens: ANALYSIS_MAX_OUTPUT_TOKENS,
            responseMimeType: "application/json",
          }),
        }),
        Math.min(remaining, ANALYSIS_ATTEMPT_CAP_MS),
        "Chặng 1 phân tích",
      );
      const { text } = interpretResponse(response);
      const analysis = parseAnalysisJson(text);
      if (analysis) return { analysis, model: attempt.model, attempts: n };
    } catch {
      // Lỗi API/bị chặn/JSON hỏng/hết giờ attempt → thử attempts kế. Hết budget → null (fallback 1-call).
    }
  }
  return null;
};
