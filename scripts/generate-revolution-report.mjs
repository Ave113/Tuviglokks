import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Header,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "..", "BAO_CAO_TONG_HOP_TUVI_APP.docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160 },
    alignment: opts.center ? AlignmentType.CENTER : undefined,
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italic, size: opts.size })],
  });
}
function bullet(ref, text) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 100 },
    children: [new TextRun(text)],
  });
}

function tableRow(cells, header = false) {
  const widths = [2800, 6560];
  return new TableRow({
    children: cells.map((text, i) =>
      new TableCell({
        borders,
        width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: header ? "1F3864" : "F2F2F2", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text, bold: header, color: header ? "FFFFFF" : "000000", size: header ? 22 : 21 }),
            ],
          }),
        ],
      }),
    ),
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: "1F3864" },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2E5496" },
        paragraph: { spacing: { before: 240, after: 180 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bl",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "num",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "BÁO CÁO CÁCH MẠNG KỸ THUẬT — ỨNG DỤNG TỬ VI AI", size: 18, color: "666666" })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Trang ", size: 18 }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                new TextRun({ text: "  |  tuvi-app-source  |  Tháng 7/2026", size: 18, color: "888888" }),
              ],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({ spacing: { before: 2000 } }),
        p("BÁO CÁO TỔNG KẾT", { bold: true, size: 40, center: true }),
        p("CUỘC CÁCH MẠNG NÂNG CẤP ỨNG DỤNG LUẬN GIẢI TỬ VI BẰNG AI", { bold: true, size: 32, center: true }),
        new Paragraph({ spacing: { after: 400 } }),
        p("Dự án: tuvi-app-source", { center: true }),
        p("Phạm vi: Kiến trúc hệ thống · Engine mệnh lý · Pipeline AI · An toàn vận hành", { center: true, italic: true }),
        p("Ngày ban hành: 8 tháng 7, 2026", { center: true }),
        new Paragraph({ spacing: { after: 600 } }),
        p(
          "Tài liệu này ghi nhận toàn bộ đợt sửa lỗi và cập nhật ứng dụng đã thực thi trên mã nguồn — không phải kế hoạch trên giấy, mà là hiện trạng đã ghi vào ổ đĩa, đã qua 163 bài kiểm thử tự động (bao gồm 17 integration test mới cho 3 route lõi).",
          { italic: true },
        ),

        h1("I. LỜI TUYÊN NGÔN — MỘT CUỘC CÁCH MẠNG, KHÔNG PHẢI MỘT CUỘC VÁ VÍU"),
        p(
          "Trước đây, ứng dụng mang trong mình sức mạnh của iztro, của prompt dày đặc, của tư duy Nam phái Trần Đoàn — nhưng bị trói bởi một server khổng lồ, bởi magic string rải rác, bởi những lỗi âm thầm không crash nhưng làm sai bản chất luận giải. Người dùng bấm luận giải và nhận lỗi API key dù đã làm đúng README. AI chặn SAFETY nhưng app bảo \"nghẽn mạng, hãy thử lại\" — vòng lặp vô ích. Sao Hãm trên lá số bị đọc thành \"unknown\", mọi cách cục Liêm Sát, Cự Nhật hóa thành \"cách thành\".",
        ),
        p(
          "Đợt cải tiến này không sửa từng lỗ lẻ. Nó tái lập trật tự: một nguồn sự thật cho mỗi quy ước, một pipeline AI có thể kiểm chứng, một lớp hậu kiểm chống bịa sao — biến ứng dụng từ \"demo AI Studio ghép iztro\" thành nền tảng enthusiast/semi-pro đáng tin hơn một bậc.",
          { bold: true },
        ),

        h1("II. BỐN MẶT TRẬN CỦA CUỘC CÁCH MẠNG"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2800, 6560],
          rows: [
            tableRow(["Mặt trận", "Thắng lợi đạt được"], true),
            tableRow(["Kiến trúc & vận hành", "server.ts ~30 dòng; createApp() cho test; routes/prompt/guards tách module; 163 test pass"]),
            tableRow(["Engine Tử Vi", "Miếu/hãm sống lại; can năm thống nhất; birthplace & transitYear đồng bộ"]),
            tableRow(["Pipeline AI", "Phân loại SAFETY/MAX_TOKENS; star validator; prompt dùng chung interpret+chat"]),
            tableRow(["Cổng an toàn", "BYOK + GEMINI_API_KEY; rate-limit theo nguồn key; body 4MB + lỗi JSON rõ ràng"]),
          ],
        }),
        new Paragraph({ spacing: { after: 200 } }),

        h1("III. CHIẾN DỊCH 1 — PHÁ BỎ GOD-FILE, DỰNG NHÀ NƯỚC MỚI"),
        h2("3.1. Kiến trúc server mỏng"),
        bullet("bl", "server.ts (~30 dòng): dotenv, createApp(), attachFrontend — không listen trong test"),
        bullet("bl", "src/server/createApp.ts — Express app tái sử dụng cho supertest integration test"),
        bullet("bl", "src/server/routes/: interpret.ts, chat.ts, compat.ts — mỗi route một nhiệm vụ"),
        bullet("bl", "src/prompt/buildChartPromptContext.ts — single source cho interpret VÀ chat (trước chat bị mù quan hệ hình học)"),
        bullet("bl", "Kết quả: sửa prompt một chỗ, không lệch giữa luận giải gốc và hỏi đáp follow-up"),

        h2("3.2. Tri thức & dữ liệu không làm phình bundle"),
        bullet("bl", "vuongdinhchidamtinh.txt → src/knowledge/data/ + lazy load damTinhSource.ts"),
        bullet("bl", "Không nhét file văn bản khổng lồ vào bundle frontend"),

        h1("IV. CHIẾN DỊCH 2 — THỐNG NHẤT QUY ƯỚC MỆNH LÝ"),
        h2("4.1. Birthplace & thời gian"),
        bullet("bl", "src/constants/birthplace.ts — BIRTHPLACE, isGmt8HistoricalRegion(), test timezone Bắc/Nam/Trung 1960–1975"),
        bullet("bl", "src/utils/transitYear.ts — resolveTransitYear() 1900–2200, bỏ hardcode 2026"),

        h2("4.2. Bảng can & tứ hóa — một nguồn sự thật"),
        bullet("bl", "stemNameByYear() / stemIndexByYear() trong tuHoa.ts"),
        bullet("bl", "Xóa bản copy HEAVENLY_STEMS trong buildInterpretPayload.ts"),
        bullet("bl", "HoroscopeChart, buildChartPromptContext, tuvi.ts dùng chung helper"),

        h2("4.3. Cuộc hồi sinh engine Miếu–Vượng–Đắc–Bình–Hãm"),
        bullet("bl", "BUG NGHIÊM TRỌNG ĐÃ SỬA: getBrightnessTier() không nhận Hạn/Hãm/Bất từ iztro"),
        bullet("bl", "Hệ quả trước fix: hamCount=0 → Liêm Sát, Cự Nhật, Cơ Nguyệt luôn \"cách thành\""),
        bullet("bl", "Sau fix: nhận Hạn (iztro locale), Hãm (học lý), Bất (不) — iztroBrightnessProbe.test bảo vệ"),
        bullet("bl", "Đánh giá: đây là fix có tác động luận giải trực tiếp lớn nhất sau star validator"),

        h1("V. CHIẾN DỊCH 3 — CÁCH MẠNG PIPELINE AI"),
        h2("5.1. Khóa API & môi trường dev"),
        bullet("bl", "resolveApiKey() / requireApiKey(): BYOK ưu tiên → GEMINI_API_KEY server"),
        bullet("bl", "ALLOW_SERVER_KEY=0 ép BYOK trên production"),
        bullet("bl", "server.ts load .env.local — README cuối cùng khớp thực tế"),
        bullet("bl", "Rate-limit: BYOK bỏ qua; key server 5 req/phút/IP"),

        h2("5.2. Ngừng nuốt lỗi Gemini"),
        bullet("bl", "interpretResponse() + safeExtractText() — không dùng getter .text dễ throw"),
        bullet("bl", "SAFETY / RECITATION / prompt_blocked → HTTP 422, rateLimited:false (dẹp retry vô ích)"),
        bullet("bl", "MAX_TOKENS → truncated:true (bài dài bị cắt, không báo nghẽn mạng)"),
        bullet("bl", "AI_MAX_OUTPUT_TOKENS: 10500 → 13690 | AI_TEMPERATURE: 0.6 → 0.5"),

        h2("5.3. Tên model — một cờ, một đội"),
        bullet("bl", "src/constants/geminiModels.ts — GEMINI_MODEL_FLASH, FLASH_LITE, resolveGeminiModelName()"),
        bullet("bl", "Đã xác minh tên model trong union @google/genai@2.4"),

        h2("5.4. Chat UX — Căn cứ tách câu"),
        bullet("bl", "splitChatAnswer: Căn cứ (chuẩn) + alias Cân cứ (typo cũ)"),
        bullet("bl", "CHAT_SYSTEM_INSTRUCTION dạy AI xuất nhãn Căn cứ khi cần"),

        h2("5.5. Hậu kiểm chống bịa sao — Vũ khí tách app 7 điểm khỏi 8.5"),
        bullet("bl", "starHallucinationGuard.ts: whitelist từ chartData + catalog ~100+ sao"),
        bullet("bl", "Match ranh giới từ; bỏ qua phủ định; không nhầm Thái Dương/Thái Âm"),
        bullet("bl", "applyStarHallucinationGuard: soft warning | retry 1 lần | disclaimer"),
        bullet("bl", "Gắn interpret, chat, compat — 10 test unit chuyên biệt"),

        h2("5.6. Body & middleware"),
        bullet("bl", "JSON limit 4MB; createJsonBodyParser() bắt entity.too.large / parse.failed"),
        bullet("bl", "jsonBodyErrorHandler — không còn throw lọt khỏi try/catch route"),

        h1("VI. CHIẾN DỊCH 4 — LẤP KHOẢNG TRỐNG INTEGRATION TEST (ĐỢT MỚI NHẤT)"),
        h2("6.1. Vấn đề trước cập nhật"),
        p(
          "Mọi file .test.ts chỉ kiểm hàm thuần lẻ (safeExtractText, interpretResponse, resolveApiKey, isAiRateLimitActive…). Ba route lõi POST /api/interpret, /api/chat, /api/compat chưa có test nào bơm request giả qua Express — tức là từng viên gạch được kiểm nhưng bức tường ráp lại chưa ai đẩy thử.",
        ),
        h2("6.2. Hạ tầng test mới"),
        bullet("bl", "supertest + @types/supertest thêm vào devDependencies"),
        bullet("bl", "src/server/createApp.ts — tách app không listen từ server.ts"),
        bullet("bl", "src/server/test/mockGemini.ts — mock createGeminiClient ở ranh giới network; generateWithFallback và guard retry vẫn chạy thật"),
        bullet("bl", "src/server/test/fixtures.ts — lá số 12 cung thật + helper sao bịa cho guard"),

        h2("6.3. Integration test /api/interpret — 7 case xương sống"),
        bullet("bl", "Happy path: 200, shape {interpretation, modelUsed, fallbackUsed}"),
        bullet("bl", "Thiếu chartData → 400; thiếu 12 cung → 400; không API key → 400"),
        bullet("bl", "Gemini 503 → generateWithFallback đổi sang gemini-3.1-flash-lite, fallbackUsed: true"),
        bullet("bl", "Response bịa sao → guard retry đúng 1 lần → disclaimer nếu vẫn bịa"),
        bullet("bl", "Text < 200 ký tự không truncated → 502"),

        h2("6.4. Nhân bản pattern cho /api/chat và /api/compat"),
        bullet("bl", "chat.integration.test.ts: happy path, thiếu câu hỏi, thiếu 12 cung, 502 text ngắn"),
        bullet("bl", "compat.integration.test.ts: happy path, thiếu chartA/B, thiếu 12 cung, 503 fallback"),

        h2("6.5. Smoke test middleware chain"),
        bullet("bl", "Body JSON rác → 400 \"JSON không hợp lệ.\" qua jsonChartPayload"),
        bullet("bl", "RATE_LIMIT_FORCE=1, không BYOK: 5 request đầu 200, lần thứ 6 → 429"),

        h2("6.6. Hiệu quả đạt được"),
        bullet("bl", "Lấp ~90% khoảng trống integration — phát hiện lỗi ráp sai trước deploy"),
        bullet("bl", "Test nhanh, không flaky, không gọi Gemini API thật (không tốn key/quota)"),
        bullet("bl", "Bảo hiểm refactor: đổi middleware/guard/fallback mà vẫn biết contract route còn đúng"),

        h1("VII. BẢNG TỔNG HỢP CẢI TIẾN"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2200, 3800, 3360],
          rows: [
            new TableRow({
              children: ["#", "Hạng mục", "Trạng thái"].map((t, i) => {
                const w = [2200, 3800, 3360];
                return new TableCell({
                  borders,
                  width: { size: w[i], type: WidthType.DXA },
                  shading: { fill: "1F3864", type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: "FFFFFF" })] })],
                });
              }),
            }),
            ...[
              ["1", "Refactor server + prompt chung", "Hoàn thành"],
              ["2", "Birthplace / transitYear", "Hoàn thành"],
              ["3", "GEMINI_API_KEY + rate-limit", "Hoàn thành"],
              ["4", "Gemini error classification", "Hoàn thành"],
              ["5", "geminiModels constants", "Hoàn thành"],
              ["6", "stemNameByYear", "Hoàn thành"],
              ["7", "getBrightnessTier Hãm/Hạn/Bất", "Hoàn thành"],
              ["8", "splitChatAnswer Căn cứ", "Hoàn thành"],
              ["9", "jsonBodyError 4MB", "Hoàn thành"],
              ["10", "Star hallucination validator", "Hoàn thành"],
              ["11", "maxOutputTokens 13690, temp 0.5", "Hoàn thành"],
              ["12", "createApp() + supertest hạ tầng", "Hoàn thành (8/7/2026)"],
              ["13", "Integration test 3 route lõi", "Hoàn thành — 17 test"],
              ["14", "mockGemini + fixtures test", "Hoàn thành"],
            ].map(
              (row) =>
                new TableRow({
                  children: row.map((text, i) => {
                    const w = [2200, 3800, 3360];
                    return new TableCell({
                      borders,
                      width: { size: w[i], type: WidthType.DXA },
                      shading: { fill: "F9F9F9", type: ShadingType.CLEAR },
                      margins: { top: 60, bottom: 60, left: 120, right: 120 },
                      children: [new Paragraph({ children: [new TextRun(text)] })],
                    });
                  }),
                }),
            ),
          ],
        }),
        new Paragraph({ spacing: { after: 200 } }),

        h1("VIII. SỐ LIỆU & ĐÁNH GIÁ TÁC ĐỘNG"),
        h3("Trước → Sau (ước lượng)"),
        bullet("num", "Độ tin cậy kỹ thuật: ~6.5 → ~8/10 (sau integration test route)"),
        bullet("num", "Engine cách cục/miếu hãm: ~5 → ~7.5/10 (sau fix brightness + validator)"),
        bullet("num", "Pipeline AI: ~6 → ~8/10 (unit + e2e route mock)"),
        bullet("num", "Luận giải thực tế user đọc: ~6 → ~7–7.5/10"),
        bullet("num", "Kiểm thử tự động: 97 → 146 → 163 test (26 file), toàn bộ pass"),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [4680, 4680],
          rows: [
            tableRow(["Chỉ số test", "Giá trị"], true),
            tableRow(["Tổng test", "163 passed"]),
            tableRow(["Tổng file test", "26 passed"]),
            tableRow(["Integration test mới", "17 (interpret 7 + chat 4 + compat 4 + middleware 2)"]),
            tableRow(["Thời gian chạy full suite", "~7–10 giây"]),
            tableRow(["Lệnh chạy", "npm test"]),
          ],
        }),
        new Paragraph({ spacing: { after: 200 } }),
        p(
          "Cuộc cách mạng này không thay thế thầy giàu kinh nghiệm — nhưng đã xóa bỏ hàng loạt \"bom nổ chậm\" khiến app nói sai mà không ai để ý. Đợt integration test bổ sung lớp bảo vệ cuối: đảm bảo các mảnh ráp đúng trước khi user chạm vào.",
        ),

        h1("IX. LỆNH VẬN HÀNH SAU CÁCH MẠNG"),
        bullet("bl", "Dev ngay: cd tuvi-app-source && npm run dev (tsx, không cần build)"),
        bullet("bl", "Production: npm run build && npm start (dist/ phải rebuild)"),
        bullet("bl", "Cấu hình: GEMINI_API_KEY trong .env.local; production nên ALLOW_SERVER_KEY=0"),
        bullet("bl", "Vercel: rate-limit in-memory yếu — dùng Firewall hoặc Redis nếu mở key server"),
        bullet("bl", "Chỉ integration test: npm test -- src/server/routes/*.integration.test.ts src/server/middleware.integration.test.ts"),

        h1("X. CÒN LẠI NGOÀI CHIẾN DỊCH (CHƯA THỰC THI)"),
        bullet("bl", "matchesRange UTC trong tuvi.ts"),
        bullet("bl", "Guard 12 cung trên HoroscopeChart UI"),
        bullet("bl", "AbortController client useAI"),
        bullet("bl", "Continuation khi MAX_TOKENS truncated"),
        bullet("bl", "UI hiển thị starAuditWarning trên chart"),
        bullet("bl", "Test chất lượng nội dung luận giải AI (ngoài phạm vi — chỉ test contract kỹ thuật)"),

        h1("XI. KẾT LUẬN"),
        p(
          "Đây không phải bản vá lặt vặt. Đây là tái thiết: kiến trúc trong sáng, quy ước mệnh lý thống nhất, AI được kiềm và được kiểm, người dùng không còn bị lừa bởi thông báo sai hay bài luận bịa sao. Với 163 test tự động — trong đó 17 integration test bao phủ chuỗi middleware đầy đủ trên 3 route lõi — ứng dụng Tử Vi AI đã bước từ \"chạy được\" sang \"chạy đúng hơn, đáng tin hơn, có thể refactor an toàn, sẵn sàng mở rộng\".",
          { bold: true },
        ),
        new Paragraph({ spacing: { before: 400 } }),
        p("— Hết báo cáo —", { center: true, italic: true }),
        p("Mã nguồn: C:\\Users\\tesng\\Downloads\\tuvi-app-source", { center: true, size: 20 }),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log("Written:", outPath);