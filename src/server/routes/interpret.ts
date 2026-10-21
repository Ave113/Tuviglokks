import type { Express, Request, Response } from "express";
import { buildInterpretSystemInstruction } from "../../knowledge/interpretSystemInstruction";
import { buildChartPromptContext } from "../../prompt/buildChartPromptContext";
import { buildInterpretUserPrompt } from "../../prompt/formatInterpretPrompt";
import { extractBirthHeavenlyStem, normalizeHeavenlyStem } from "../../utils/tuHoa";
import { isSecondaryModel } from "../../constants/geminiModels";
import { jsonChartPayload } from "../bodyLimits";
import { assertChart12Palaces, requireApiKey } from "../chartGuards";
import { applyStarHallucinationGuard } from "../applyStarHallucinationGuard";
import { validateInterpretation } from "../interpretValidation";
import { INTERPRET_STAR_GUARD_DEADLINE_MS, isInterpretPipelineEnabled } from "../aiConfig";
import {
  buildSkeletonBlock,
  injectSkeletonBlock,
  runAnalysisStage,
} from "../pipeline/analysisStage";
import { expectedInterpretPartCount, validateNarrativeStructure, validateStarCoverage } from "../pipeline/narrativeStructure";
import { collectChartStarUniverse, computeStarMusicBed } from "../pipeline/starCoverage";
import {
  createGeminiClient,
  generateWithFallback,
  interpretResponse,
  resolveModelName,
  sendInterpretAiError,
} from "../gemini";
import { aiRateLimit } from "../rateLimit";

const INTERPRET_SYSTEM_INSTRUCTION = buildInterpretSystemInstruction();
const MIN_VALID_LENGTH = 200;

export const registerInterpretRoute = (app: Express) => {
  app.post("/api/interpret", jsonChartPayload, aiRateLimit, async (req: Request, res: Response) => {
    try {
      const { chartData, customApiKey, modelSelection } = req.body;

      if (!chartData) {
        return res.status(400).json({ error: "Thiếu dữ liệu lá số Tử Vi." });
      }

      if (!assertChart12Palaces(
        chartData,
        res,
        "Dữ liệu lá số không hợp lệ: thiếu thông tin 12 cung. Vui lòng an lại lá số đầy đủ trước khi yêu cầu AI luận giải.",
      )) {
        return;
      }

      const resolved = requireApiKey(customApiKey, res);
      if (!resolved) return;

      const { apiKey, source } = resolved;
      const modelName = resolveModelName(modelSelection);
      const ai = createGeminiClient(apiKey);

      // Khóa cứng Can năm sinh ngay từ đầu
      const canonicalStem =
        extractBirthHeavenlyStem(chartData, chartData.birthLunarYear) ||
        normalizeHeavenlyStem(chartData.birthHeavenlyStem);
      if (canonicalStem) {
        chartData.birthHeavenlyStem = canonicalStem;
      }

      const ctx = buildChartPromptContext(chartData);
      let prompt = buildInterpretUserPrompt(ctx, chartData);

      // ===== QUESTION ROUTING (A2) — lọc block theo focus người dùng chọn =====
      // Frontend gửi focus: "tinh-dam" | "han" | "tinh-duyen" | "tai-loc" | "suc-khoe" | undefined (full)
      const focus = typeof req.body?.focus === "string" ? req.body.focus.trim() : "";
      if (focus) {
        const FOCUS_BLOCKS: Record<string, { keep: RegExp[]; drop: RegExp[] }> = {
          "tinh-dam": {
            keep: [/TÍNH VA ĐẬP/, /ĐIỂM MÙ/, /TỰ PHI TỨ HÓA/, /BẢN SẮC/, /CÁCH CỤC/],
            drop: [/PHÚC ĐỨC/, /ĐỊNH CÁCH PHÚ QUÝ/, /THẺ TIN CẬY BÁT TỰ/, /SAO NHẬP HẠN/],
          },
          "han": {
            keep: [/KÍCH HOẠT HẠN/, /SAO NHẬP HẠN/, /LƯU NIÊN/, /THẺ SỰ KIỆN/, /TIỂU HẠN/],
            drop: [/TỰ PHI TỨ HÓA/, /CẤU TRÚC SÁT TINH/, /THẺ TIN CẬY BÁT TỰ/],
          },
          "tinh-duyen": {
            keep: [/PHU THÊ/, /ĐÀO|HỒN|HỈ/, /THÊ THIẾP/],
            drop: [/TẬT ÁCH/, /ĐIỀN TRẠCH/, /QUỐC ẤN/, /ĐƯỜNG PHÙ/],
          },
          "tai-loc": {
            keep: [/TÀI BẠCH/, /HÓA LỘC/, /ĐIỀN TRẠCH/, /SONG HAO/, /LỘC MÃ/],
            drop: [/TẬT ÁCH/, /PHU THÊ/, /TỬ NỮ/, /QUỐC ẤN/],
          },
          "suc-khoe": {
            keep: [/TẬT ÁCH/, /THIÊN DI/, /ĐÀM TINH/, /Bệnh/, /khỏe/],
            drop: [/PHU THÊ/, /ĐỊNH CÁCH PHÚ QUÝ/, /THẺ TIN CẬY BÁT TỰ/],
          },
        };
        const routing = FOCUS_BLOCKS[focus];
        if (routing) {
          // Strip sections whose heading matches drop patterns and doesn't match keep
          const sections = prompt.split(/\n(?=--- |\n\d+\. \*\*)/);
          const kept = sections.filter((sec) => {
            const head = sec.slice(0, 200);
            const isDrop = routing.drop.some((d) => d.test(head));
            const isKeep = routing.keep.some((k) => k.test(head));
            if (isKeep) return true;
            if (isDrop) return false;
            return true; // khớp không rõ → giữ
          });
          prompt = kept.join("\n");
        }
      }
      // ===== END QUESTION ROUTING =====

      // Gia cố dành riêng cho phân cấp model thứ 2 (secondary / lite models)
      if (isSecondaryModel(modelName)) {
        const secondaryReinforcement = `\n\n[LƯU Ý CHỐT KHÓA DÀNH CHO MODEL THỨ 2 - BẮT BUỘC TUÂN THỦ]:
1. KHÓA CỨNG BẢNG TỨ HÓA BẨM SINH: Tuyệt đối chỉ dùng 4 sao thụ phong Tứ Hóa bẩm sinh đã tra sẵn theo can ${ctx.stemKey || chartData.birthHeavenlyStem || "năm sinh"}: ${ctx.natalTuHoaStr}. Cấm tự đổi sang sao khác.
2. PHÂN TÁCH RẠCH RÒI: Tứ Hóa Bẩm Sinh (4 sao cố định theo năm sinh) KHÁC HOÀN TOÀN với Tự Hóa và Phi Tứ Hóa 12 Cung (động lực phát xuất theo can của từng cung).
3. ĐỘ SÂU TỰ PHI TỨ HÓA: NẾU dữ liệu có, phân tích ít nhất 1 đường bay Phi Tứ Hóa từ Cung Mệnh hoặc Cung Phúc Đức để tìm ra căn nguyên tâm lý cốt lõi dẫn dắt hành vi của bạn; nếu không có, nói rõ thiếu dữ liệu, KHÔNG bịa.
4. NĂM LUẬN HẠN: Toàn bộ phân tích vận hạn năm tập trung chính xác vào năm ${ctx.transitYearNum} (không viết nhầm sang năm khác).
5. VỊ TRÍ MỆNH/THÂN: Giữ đúng vị trí cung Mệnh và cung Thân đã an sẵn trong dữ liệu.`;
        prompt += secondaryReinforcement;
      }

      if (process.env.NODE_ENV !== "production") {
        console.log(`[Attempt] Initiating Gemini analysis with ${modelName} (key: ${source})...`);
      }

      // ===== A1 — PIPELINE 3 CHẶNG: CHẶNG 1 PHÂN TÍCH (khung JSON) =====
      // Model nhẹ đọc nguyên bộ dữ liệu lá → bộ khung chốt cho bài viết.
      // Rơi (lỗi API / JSON hỏng sau retry) → finalPrompt giữ nguyên = đường 1-call cũ.
      let finalPrompt = prompt;
      let pipelineMeta: Record<string, unknown> | null = null;
      // Mốc bắt đầu chuỗi AI (chặng 1 + chặng 2 + retry guard) — dùng cho chốt an toàn bên dưới.
      const requestStartedAt = Date.now();
      if (isInterpretPipelineEnabled()) {
        const t0 = Date.now();
        // Độ phủ sao: máy tự tính sao bị bỏ rơi (không có block tri thức nuôi) →
        // nhạc nền theo cung, bắt chặng 2 phủ 100%.
        const musicBed = computeStarMusicBed(chartData.palaces, ctx);
        const stage1 = await runAnalysisStage(ai, prompt, expectedInterpretPartCount());
        if (stage1) {
          const skeleton = buildSkeletonBlock(
            stage1.analysis,
            musicBed.musicBedStr,
            Boolean(ctx.baZiStr.trim()),
          );
          if (skeleton) {
            finalPrompt = injectSkeletonBlock(prompt, skeleton);
            pipelineMeta = {
              analysisModel: stage1.model,
              analysisAttempts: stage1.attempts,
              skeletonChars: skeleton.length,
              analysisMs: Date.now() - t0,
              ...(musicBed.orphanStars > 0
                ? { starFeed: { total: musicBed.totalStars, fed: musicBed.fedStars, orphan: musicBed.orphanStars } }
                : {}),
            };
            if (process.env.NODE_ENV !== "production") {
              console.log(`[Pipeline] Chặng 1 OK (${stage1.model}, ${stage1.attempts} attempt, skeleton ${skeleton.length} ký tự, nhạc nền ${musicBed.orphanStars} sao).`);
            }
          }
        } else {
          pipelineMeta = { analysisSkipped: true, analysisMs: Date.now() - t0 };
          if (process.env.NODE_ENV !== "production") {
            console.warn("[Pipeline] Chặng 1 rơi toàn bộ → fallback 1-call nguyên trạng.");
          }
        }
      }

      // ===== CHẶNG 2 — BIÊN SOẠN (model người dùng chọn, như cũ) =====
      const { response, finalModelName, fallbackUsed } = await generateWithFallback(
        ai,
        modelName,
        finalPrompt,
        INTERPRET_SYSTEM_INSTRUCTION,
      );

      const { text: rawText, truncated } = interpretResponse(response);

      if (rawText.length < MIN_VALID_LENGTH && !truncated) {
        return res.status(502).json({
          error: "Phản hồi trống bất thường. Vui lòng thử lại.",
          rateLimited: false,
        });
      }

      const guarded = await applyStarHallucinationGuard({
        ai,
        modelName: finalModelName,
        // Luận lại trên finalPrompt (đã có skeleton chặng 1) — bản retry giữ
        // nguyên khung phân tích, không rớt độ sâu so với bài gốc.
        prompt: finalPrompt,
        systemInstruction: INTERPRET_SYSTEM_INSTRUCTION,
        chartData,
        text: rawText,
        // Quá mốc → guard tự bỏ luận lại (tránh 504 khi regen rơi cuối cửa sổ function).
        deadlineMs: requestStartedAt + INTERPRET_STAR_GUARD_DEADLINE_MS,
      });

      // Bước 5: Chạy Validation Script (Check Nhất quán Tứ Hóa, Check Năm Luận Hạn, Check Mệnh/Thân, Check độ sâu đường bay)
      const validated = validateInterpretation(guarded.text, chartData);

      // ===== A1 — CHẶNG 3: KIỂM TRA CẤU TRÚC + ĐỘ PHỦ SAO (cục bộ, chỉ báo cáo) =====
      const structure = validateNarrativeStructure(validated.text, {
        // Khung cho phép bỏ mục Đối chiếu khi lá không có Bát Tự (payload cũ / thiếu ngày giờ).
        requireBaZi: Boolean(ctx.baZiStr.trim()),
      });
      // Chỉ cảnh báo khi thiếu MẠCH NỘI DUNG (nhận theo chủ đề), không bắt lỗi
      // định dạng "Phần N"/heading. missingParts vẫn giữ trong payload để log.
      const hasStructureIssues = structure.missingHeadings.length > 0;
      // Guard có thể thay hẳn bằng bản luận lại: chỉ báo truncated của bản đang dùng.
      const responseTruncated = guarded.retried ? guarded.truncated : truncated;
      // "Mỏng" thành con số: % sao trên lá được nhắc trong bài.
      const starUniverse = collectChartStarUniverse(chartData.palaces);
      const starCoverage = validateStarCoverage(validated.text, starUniverse);

      res.json({
        interpretation: validated.text,
        modelUsed: finalModelName,
        fallbackUsed,
        // Hậu kiểm minh bạch: UI/log có thể hiển thị cảnh báo (vd thiếu phân tích
        // đường bay Mệnh/Phúc Đức) — các mục "corrected" đã áp vào văn bản trước đó.
        ...(validated.issues.length ? { validationIssues: validated.issues } : {}),
        ...(hasStructureIssues
          ? {
              structureIssues: {
                missingParts: structure.missingParts,
                missingHeadings: structure.missingHeadings,
              },
            }
          : {}),
        ...(starCoverage.total > 0
          ? {
              starCoverage: {
                total: starCoverage.total,
                mentioned: starCoverage.mentioned,
                ratioPct: starCoverage.ratioPct,
                ...(starCoverage.missing.length ? { missing: starCoverage.missing } : {}),
              },
            }
          : {}),
        ...(pipelineMeta ? { pipeline: pipelineMeta } : {}),
        ...(responseTruncated ? { truncated: true } : {}),
        ...(guarded.audit.warning ? { starAuditWarning: guarded.audit.warning } : {}),
        ...(guarded.retried ? { starAuditRetried: true } : {}),
        ...(guarded.audit.hallucinated.length
          ? { starHallucinated: guarded.audit.hallucinated }
          : {}),
      });
    } catch (error: any) {
      sendInterpretAiError(res, error);
    }
  });
};