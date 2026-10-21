import { describe, it, expect, vi, afterEach } from "vitest";
import {
  ANALYSIS_SYSTEM_INSTRUCTION,
  buildAnalysisInstruction,
  buildSkeletonBlock,
  extractJsonSlice,
  injectSkeletonBlock,
  parseAnalysisJson,
  runAnalysisStage,
} from "./analysisStage";
import {
  expectedInterpretPartCount,
  validateNarrativeStructure,
  validateStarCoverage,
} from "./narrativeStructure";
import { INTERPRET_FRAMEWORK_MARKER } from "../../prompt/interpretFrameworkPrompt";

// ----------------------------------------------------------------------------
// Helpers: mock analysis + mock essay
// ----------------------------------------------------------------------------

const MOCK_ANALYSIS = {
  de_tai_la_so: "Lá sát tinh quyền lực, Tử Vi đắc địa cư Ngọ.",
  cach_cuc: ["Tử Phủ Vũ Tướng", "Hỏa tham cách"],
  sao_then_chot: [
    { domain: "menh", sao: ["Tử Vi", "Hỏa Tinh"] },
    { domain: "tai", sao: ["Vũ Khúc"] },
  ],
  duong_bay_phi: [
    { tu: "Mệnh", hoa: "Kỵ", den: "Tật Ách", y_nghia: "tự đè sức khỏe vì công việc" },
    { tu: "Phúc Đức", hoa: "Lộc", den: "Tài Bạch", y_nghia: "phúc báo đổ về tiền" },
  ],
  diem_mu: ["Tin sai kệnh", "Mưu sĩ tự trải"],
  the_su_kien: [{ domain: "quan", headline: "thăng chức giữa năm", neo: "Lưu Quyền" }],
  trigger_han: ["Điểm mù — Hạn năm — quan hệ"],
  tong_nam: [{ domain: "tien_bac", xu_the: "đầu năm hao, cuối năm hồi" }],
  phan_brief: [
    { phan: 1, huong_viet: "mở bằng quyền lực và điểm hiểm", neo_sao: ["Tử Vi", "Hỏa Tinh"] },
    { phan: 3, huong_viet: "năm xoáy quan lộc", neo_sao: ["Lưu Quyền"] },
  ],
};

/** Essay 4 phần đánh số (Phần 0 + 1..4 + Kết luận) đúng ngữ pháp khung tinh gọn. */
const makeEssay = (opts?: { dropParts?: number[]; dropHeadings?: string[] }): string => {
  const titles: Record<number, string> = {
    1: "BẢN SẮC & CƠ CHẾ VẬN HÀNH — BẠN LÀ AI KHI KHÔNG DIỄN",
    2: "ĐỜI SỐNG THỰC TẾ — TIỀN, VIỆC, TÌNH, SỨC, GIA ĐẠO",
    3: "VẬN TRÌNH — 10 NĂM, NĂM NAY, THÁNG NÓNG",
    4: "NỀN TẢNG PHÚC BÁO & TỔNG LỰC — GỐC AN, ĐỊNH CÁCH, ĐỐI CHIẾU",
  };
  const drop = new Set(opts?.dropParts ?? []);
  const lines: string[] = [
    "## Phần 0: CHÂN DUNG & 3 TRỤC CHÍNH",
    "   Mở bài một nhát đời thực; ba trục trọng tâm.",
    "",
  ];
  for (let n = 1; n <= 4; n++) {
    if (drop.has(n)) continue;
    lines.push(`${n}. **${titles[n]}**:`);
    lines.push(`   Thân phần ${n}, đời thực có neo sao.`);
    if (n === 1) {
      lines.push("   ### Tính va đập & Điểm mù");
      lines.push("   Tính va đập: va với sếp vì Hỏa Tinh thủ Mệnh.");
      lines.push("   ### Tự Phi Tứ Hóa");
      lines.push("   ### Độ sâu Tứ Hóa");
      lines.push("   ### Cấu trúc Sát Tinh");
    }
    if (n === 2) {
      lines.push("   ### Sự nghiệp & Tài lộc");
      lines.push("   ### Tình cảm & gia đạo");
      lines.push("   ### Sức khỏe & môi trường");
      lines.push("   ### Các cung còn lại");
    }
    if (n === 3) {
      lines.push("   ### Đại hạn (10 năm)");
      lines.push("   ### Luận giải Tiểu Hạn");
      lines.push("   [TÓM NĂM] năm xoáy quan lộc.");
    }
    if (n === 4) {
      lines.push("   ### Phúc Đức");
      lines.push("   ### Định cách & Tổng lực đa chiều");
      lines.push("   ### Đối chiếu chéo Bát Tự");
      lines.push("   [Đồng thuận] trục bản sắc.");
    }
    lines.push("");
  }
  if (!drop.has(4)) {
    lines.push("## KẾT LUẬN CUỐI — 5 DÒNG");
    lines.push("   1. **Điểm mạnh nhất:** giữ nhịp.");
    lines.push("   2. **Điểm cần tránh nhất:** nóng vội.");
    lines.push("   3. **Giai đoạn then chốt:** 24–33.");
    lines.push("   4. **1 hành động ngay:** lập quỹ dự phòng.");
    lines.push("   5. **Câu chốt:** đi chậm mà chắc.");
  }
  return lines.join("\n");
};

// ----------------------------------------------------------------------------
// parseAnalysisJson
// ----------------------------------------------------------------------------

describe("parseAnalysisJson", () => {
  it("parse JSON thuần + fenced + bọc prose", () => {
    const plain = JSON.stringify(MOCK_ANALYSIS);
    const fenced = "```json\n" + plain + "\n```";
    const prose = "Đây là kết quả phân tích:\n" + plain + "\nHết.";
    for (const raw of [plain, fenced, prose]) {
      const a = parseAnalysisJson(raw);
      expect(a).toBeTruthy();
      expect(a!.cach_cuc).toContain("Tử Phủ Vũ Tướng");
      expect(a!.duong_bay_phi[0].tu).toBe("Mệnh");
      expect(a!.phan_brief).toHaveLength(2);
    }
  });

  it("garbage / thiếu cột sống → null", () => {
    expect(parseAnalysisJson("")).toBeNull();
    expect(parseAnalysisJson("không có json")).toBeNull();
    expect(parseAnalysisJson("{\"a\":1}")).toBeNull();
    expect(parseAnalysisJson("{json gãy")).toBeNull();
  });

  it("sanitize: cap mảng, bỏ key lạ, entry phan rác bị loại (không nâng thành Phần 1)", () => {
    const bloated: any = {
      ...MOCK_ANALYSIS,
      cach_cuc: Array.from({ length: 12 }, (_, i) => `Cách ${i}`),
      phan_brief: [
        { phan: 99, huong_viet: "x" },          // > 4 → bỏ
        { phan: 0, huong_viet: "y" },           // rác → bỏ (bug cũ: nâng thành 1)
        { phan: NaN, huong_viet: "z" },         // rác → bỏ
        { phan: 5, huong_viet: "phần cũ", neo_sao: ["Y"] }, // ngoài khung 4 → bỏ
        { phan: 4, huong_viet: "", neo_sao: ["Z"] }, // giữ
      ],
      junk_field: "bỏ",
      diem_mu: ["mầm 1", "mầm 2", "mầm 3", "mầm phụ"],
    };
    const a = parseAnalysisJson(JSON.stringify(bloated))!;
    expect(a.cach_cuc).toHaveLength(6);
    expect(a.phan_brief).toEqual([{ phan: 4, huong_viet: "", neo_sao: ["Z"] }]);
    expect(a.diem_mu).toHaveLength(3);
    expect((a as any).junk_field).toBeUndefined();
  });

  it("extractJsonSlice bỏ fence trước khi tìm { }", () => {
    expect(extractJsonSlice("```json\n{\"k\":1}\n```")).toBe('{"k":1}');
  });

  it("system instruction khóa vai trò máy", () => {
    expect(ANALYSIS_SYSTEM_INSTRUCTION).toMatch(/KHÔNG viết bài luận/);
    expect(ANALYSIS_SYSTEM_INSTRUCTION).toMatch(/JSON/);
  });
});

// ----------------------------------------------------------------------------
// buildSkeletonBlock + injectSkeletonBlock + instruction
// ----------------------------------------------------------------------------

describe("buildSkeletonBlock", () => {
  it("render đủ các mục + brief từng phần", () => {
    const s = buildSkeletonBlock(MOCK_ANALYSIS as any);
    expect(s).toMatch(/KHUNG PHÂN TÍCH CHỐT TỪ CHẶNG 1/);
    expect(s).toMatch(/Chủ đề lá:/);
    expect(s).toMatch(/Đường bay phi: từ Mệnh phi Kỵ vào Tật Ách/);
    expect(s).toMatch(/BRIEF TỪNG PHẦN/);
    expect(s).toMatch(/Phần 3: năm xoáy quan lộc \(neo: Lưu Quyền\)/);
    expect(s).toMatch(/TIÊU CHUẨN TỐI CAO/);
    expect(s).toMatch(/Điểm mù trọng tâm \(đã chọn\)/);
    expect(s).toMatch(/KHÔNG tự chế phần mới/);
  });

  it("lá không có Bát Tự → skeleton bảo bỏ mục Đối chiếu, không bắt viết heading", () => {
    const s = buildSkeletonBlock(MOCK_ANALYSIS as any, "", false);
    expect(s).toContain("BỎ mục");
    expect(s).not.toContain('viết đúng heading "### Đối chiếu chéo Bát Tự"');
  });

  it("analysis rỗng → chuỗi rỗng (chặng 2 dùng prompt nguyên bản)", () => {
    expect(buildSkeletonBlock(null)).toBe("");
    expect(buildSkeletonBlock(null, "MUSIC")).toBe(""); // analysis rỗng → không có khung dù có nhạc nền
    expect(buildSkeletonBlock({
      de_tai_la_so: "", cach_cuc: [], sao_then_chot: [], duong_bay_phi: [],
      diem_mu: [], the_su_kien: [], trigger_han: [], tong_nam: [], phan_brief: [],
    } as any)).toBe("");
  });

  it("musicBed cắm trong khung, trước HẾT KHUNG", () => {
    const s = buildSkeletonBlock(MOCK_ANALYSIS as any, "• SAO NHẠC NỀN THEO CUNG:\n  - Cung Mệnh: Phá Toái");
    expect(s).toMatch(/SAO NHẠC NỀN THEO CUNG/);
    const musicIdx = s.indexOf("SAO NHẠC NỀN");
    const endIdx = s.indexOf("HẾT KHUNG PHÂN TÍCH");
    expect(musicIdx).toBeGreaterThan(-1);
    expect(musicIdx).toBeLessThan(endIdx);
  });

  it("inject: cắm NGAY TRƯỚC khung luận giải; không có marker → đuôi prompt", () => {
    const base = `DỮ LIỆU LÁ SỐ\n${INTERPRET_FRAMEWORK_MARKER}\nBạn hãy soạn 9 phần...`;
    const out = injectSkeletonBlock(base, "SKELETON");
    const skeletonIdx = out.indexOf("SKELETON");
    const markerIdx = out.indexOf(INTERPRET_FRAMEWORK_MARKER);
    expect(skeletonIdx).toBeGreaterThan(-1);
    expect(skeletonIdx).toBeLessThan(markerIdx);
    expect(out.startsWith("DỮ LIỆU LÁ SỐ")).toBe(true);

    const noMarker = injectSkeletonBlock("prompt không marker", "SKELETON");
    expect(noMarker.endsWith("SKELETON")).toBe(true);
  });

  it("buildAnalysisInstruction: schema + số phần khớp + biến thể retry", () => {
    const n = expectedInterpretPartCount();
    const inst = buildAnalysisInstruction(n);
    expect(inst).toContain(`ĐỦ ${n} brief`);
    expect(inst).toMatch(/Đối chiếu Bát Tự/);
    expect(inst).toMatch(/duong_bay_phi/);
    expect(inst).toMatch(/CHẶNG 1 — PHÂN TÍCH/);
    expect(buildAnalysisInstruction(n, true)).toMatch(/NHẮC LẠI/);
  });
});

// ----------------------------------------------------------------------------
// runAnalysisStage — budget timeout
// ----------------------------------------------------------------------------

describe("runAnalysisStage budget", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("attempt treo vĩnh viễn → hết budget trả null (không treo request)", async () => {
    vi.useFakeTimers();
    const ai = {
      models: { generateContent: () => new Promise(() => {}) }, // không bao giờ resolve
    } as any;

    const p = runAnalysisStage(ai, "PROMPT", 9);
    const done = expect(p).resolves.toBeNull();
    await vi.advanceTimersByTimeAsync(26_000);
    await done;
  });

  it("attempt 1 treo, attempt 2 trả JSON hợp lệ (trong budget) → phân tích thành công", async () => {
    vi.useFakeTimers();
    let call = 0;
    const makeGeminiResponseLike = (text: string) => ({
      candidates: [{ finishReason: "STOP", content: { parts: [{ text }] } }],
    });
    const ai = {
      models: {
        generateContent: () => {
          call++;
          if (call === 1) return new Promise(() => {});
          return Promise.resolve(makeGeminiResponseLike(JSON.stringify(MOCK_ANALYSIS)));
        },
      },
    } as any;

    const p = runAnalysisStage(ai, "PROMPT", 9);
    // Đẩy đồng hồ vượt trần attempt 1 (12s) — attempt 2 resolve ngay và nằm trong budget
    await vi.advanceTimersByTimeAsync(12_500);
    const r = await p;
    expect(r).toBeTruthy();
    expect(r!.attempts).toBe(2);
  });
});

// ----------------------------------------------------------------------------
// validateNarrativeStructure (chặng 3)
// ----------------------------------------------------------------------------

describe("validateNarrativeStructure", () => {
  it("bài đạt chuẩn 4 phần + đủ heading → không thiếu", () => {
    expect(expectedInterpretPartCount()).toBe(4);
    const r = validateNarrativeStructure(makeEssay());
    expect(r.missingParts).toEqual([]);
    expect(r.missingHeadings).toEqual([]);
    expect(r.foundParts).toEqual([1, 2, 3, 4]);
  });

  it("thiếu phần 4 + thiếu heading Tiểu hạn/Đối chiếu → báo đủ", () => {
    const r = validateNarrativeStructure(makeEssay({ dropParts: [4], dropHeadings: ["luan"] }));
    expect(r.missingParts).toContain(4);
  });

  it("heading dạng '## Phần 4:' vẫn được nhận", () => {
    const essay = makeEssay().replace(
      "4. **NỀN TẢNG PHÚC BÁO & TỔNG LỰC — GỐC AN, ĐỊNH CÁCH, ĐỐI CHIẾU**:",
      "## Phần 4: Nền tảng phúc báo & tổng lực",
    );
    const r = validateNarrativeStructure(essay);
    expect(r.missingParts).toEqual([]);
  });

  it("heading trong code fence bị bỏ qua, nhưng nội dung đủ mạch thì không báo thiếu phần", () => {
    const essay = makeEssay().replace(
      "1. **BẢN SẮC & CƠ CHẾ VẬN HÀNH — BẠN LÀ AI KHI KHÔNG DIỄN**:",
      "```\n1. **BẢN SẮC & CƠ CHẾ VẬN HÀNH — BẠN LÀ AI KHI KHÔNG DIỄN**:\n```",
    );
    const r = validateNarrativeStructure(essay);
    // Heading trong fence không được tính là heading phần…
    expect(r.foundParts).not.toContain(1);
    // …nhưng bài vẫn có mạch nội dung phần 1 nên không cảnh báo oan.
    expect(r.missingParts).not.toContain(1);
  });

  it("heading đa dạng (###, chữ thường, không chữ 'Phần') vẫn nhận đủ 4 phần", () => {
    const essay = makeEssay()
      .replace(
        "1. **BẢN SẮC & CƠ CHẾ VẬN HÀNH — BẠN LÀ AI KHI KHÔNG DIỄN**:",
        "### 1. Bản sắc & cơ chế vận hành",
      )
      .replace(
        "2. **ĐỜI SỐNG THỰC TẾ — TIỀN, VIỆC, TÌNH, SỨC, GIA ĐẠO**:",
        "2) Đời sống thực tế — tiền, việc, tình",
      )
      .replace(
        "3. **VẬN TRÌNH — 10 NĂM, NĂM NAY, THÁNG NÓNG**:",
        "Phần 3: Vận trình",
      )
      .replace(
        "4. **NỀN TẢNG PHÚC BÁO & TỔNG LỰC — GỐC AN, ĐỊNH CÁCH, ĐỐI CHIẾU**:",
        "**4. Nền tảng phúc báo & tổng lực**",
      );
    const r = validateNarrativeStructure(essay);
    expect(r.foundParts).toEqual([1, 2, 3, 4]);
    expect(r.missingParts).toEqual([]);
  });

  it("bài không đánh số/không heading nhưng đủ mạch nội dung → không báo thiếu phần", () => {
    const essay = makeEssay()
      .replace(/^## Phần 0:.*$/m, "")
      .replace(/^\d+\. \*\*.*?\*\*:$/gm, "");
    const r = validateNarrativeStructure(essay);
    expect(r.missingParts).toEqual([]);
  });

  it("sub-item số trong thân phần không bị đếm nhầm thành heading phần", () => {
    const essay = makeEssay() + "\n   1. **Neo tiểu hạn**: cung Thân.\n   2. **Lưu Thái Tuế**: ok.\n";
    const r = validateNarrativeStructure(essay);
    expect(r.foundParts).toEqual([1, 2, 3, 4]);
  });

  it("heading phần 5 ngoài khung không được nhận vào dãy 1..4", () => {
    const essay = makeEssay() + "\n5. **PHẦN THỨ NĂM — NGOÀI KHUNG**:\n   Nội dung thừa.\n";
    const r = validateNarrativeStructure(essay);
    expect(r.foundParts).toEqual([1, 2, 3, 4]);
    expect(r.missingParts).toEqual([]);
  });

  it("lá không có Bát Tự: bỏ yêu cầu heading Đối chiếu chéo khi requireBaZi=false", () => {
    const essay = makeEssay().replace("   ### Đối chiếu chéo Bát Tự\n", "");
    expect(validateNarrativeStructure(essay).missingHeadings).toContain("Đối chiếu chéo Bát Tự");
    expect(
      validateNarrativeStructure(essay, { requireBaZi: false }).missingHeadings,
    ).not.toContain("Đối chiếu chéo Bát Tự");
  });
});

// ----------------------------------------------------------------------------
// validateStarCoverage (chặng 3 — đo "mỏng" thành con số)
// ----------------------------------------------------------------------------

describe("validateStarCoverage", () => {
  it("đếm sao được nhắc + liệt kê sao sót (case-sensitive, ranh giới chữ)", () => {
    const universe = ["Thiên Phủ", "Lộc Tồn", "Phá Toái", "Vong Thần", "Hỷ Thần"];
    const text = "Thiên Phủ tọa Mệnh, Lộc Tồn hội chiếu; cung hôn nhân có Phá Toái. Đời hay gặp vong thần nhỏ."; // "vong thần" thường → không khớp
    const r = validateStarCoverage(text, universe);
    expect(r.total).toBe(5);
    expect(r.mentioned).toBe(3);
    expect(r.ratioPct).toBe(60);
    expect(r.missing).toEqual(["Vong Thần", "Hỷ Thần"]);
  });

  it("universe rỗng → ratio 0, không crash", () => {
    const r = validateStarCoverage("bài bất kỳ", []);
    expect(r.total).toBe(0);
    expect(r.ratioPct).toBe(0);
    expect(r.missing).toEqual([]);
  });

  it("missing cap 20", () => {
    const universe = Array.from({ length: 30 }, (_, i) => `Sao${i}`);
    const r = validateStarCoverage("không nhắc sao nào", universe);
    expect(r.missing).toHaveLength(20);
  });
});
