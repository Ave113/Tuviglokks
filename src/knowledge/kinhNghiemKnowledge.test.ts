import { describe, expect, it } from "vitest";
import {
  KINH_NGHIEM_KNOWLEDGE,
  retrieveKinhNghiem,
  kinhNghiemToPromptText,
  KINH_NGHIEM_SOURCE_RELATIVE,
} from "./kinhNghiemKnowledge";

describe("kinhNghiemKnowledge", () => {
  it("có nguồn file B trong repo path note", () => {
    expect(KINH_NGHIEM_SOURCE_RELATIVE).toContain("so-tu-vi-kinh-nghiem-quyen-ha");
  });

  it("catalog mở rộng: mỗi entry có id/tags/source/content gọn", () => {
    expect(KINH_NGHIEM_KNOWLEDGE.length).toBeGreaterThanOrEqual(60);
    const ids = new Set<string>();
    for (const e of KINH_NGHIEM_KNOWLEDGE) {
      expect(e.id).toMatch(/^kn-/);
      expect(ids.has(e.id), `trùng id ${e.id}`).toBe(false);
      ids.add(e.id);
      expect(e.tags.length).toBeGreaterThan(0);
      expect(e.source).toMatch(/Kinh Nghiệm|Tân Biên|Vương Đình Chi|Nhập Mệnh/i);
      expect(e.content.length).toBeGreaterThan(40);
      expect(e.content.length).toBeLessThan(600);
    }
  });

  it("retrieve theo sao Kình Dương + query hạn → Mã đầu / hạn", () => {
    const got = retrieveKinhNghiem(
      { stars: ["Kình Dương", "Thất Sát"], query: "hạn năm nay có sao không" },
      8,
    );
    expect(got.length).toBeGreaterThan(0);
    expect(got.length).toBeLessThanOrEqual(8);
    const ids = got.map((e) => e.id);
    expect(
      ids.some((id) => id.includes("ma-dau") || id.includes("han") || id.includes("sat")),
    ).toBe(true);
  });

  it("retrieve Lưu Khôi / Vận Lộc → mẩu nâng cấp Lưu–Vận", () => {
    const got = retrieveKinhNghiem(
      { stars: ["Lưu Khôi", "Vận Lộc", "Thiên Mã"], query: "năm nay quý nhân và đại hạn" },
      10,
    );
    const ids = got.map((e) => e.id);
    expect(ids.some((id) => id.includes("luu-khoi") || id.includes("sao-van") || id.includes("loc-ma"))).toBe(
      true,
    );
  });

  it("gate Song Lộc: cần đủ Lộc Tồn + Hóa Lộc trên pool lá", () => {
    expect(
      retrieveKinhNghiem(
        { stars: ["Lộc Tồn", "Tử Vi"], query: "tiền bạc tài lộc" },
        10,
      ).some((e) => e.id === "kn-song-loc"),
    ).toBe(false);
    expect(
      retrieveKinhNghiem(
        { stars: ["Hóa Lộc", "Tử Vi"], query: "tiền bạc tài lộc" },
        10,
      ).some((e) => e.id === "kn-song-loc"),
    ).toBe(false);
    expect(
      retrieveKinhNghiem(
        { stars: ["Lộc Tồn", "Hóa Lộc", "Tử Vi"], query: "tiền bạc tài lộc" },
        10,
      ).some((e) => e.id === "kn-song-loc"),
    ).toBe(true);
  });

  it("gate requireAny: Mã đầu cần Kình Dương trên lá", () => {
    const noKinh = retrieveKinhNghiem(
      { stars: ["Thất Sát", "Hỏa Tinh"], query: "tai nạn tật ách" },
      10,
    );
    expect(noKinh.some((e) => e.id === "kn-ma-dau-doi-kiem")).toBe(false);

    const hasKinh = retrieveKinhNghiem(
      { stars: ["Kình Dương", "Thất Sát", "Ngọ"], query: "tai nạn tật ách" },
      10,
    );
    expect(hasKinh.some((e) => e.id === "kn-ma-dau-doi-kiem")).toBe(true);
  });

  it("vòng Trường Sinh (changsheng12) vào pool → mẫu nuôi bệnh/hao mở khóa, đủ điểm", () => {
    // Trước regression: "Trường Sinh" chỉ là nhãn changsheng12 (ngoài minor/adjectiveStars)
    // nên mẫu kn-trang-sinh-nuoi chết vĩnh viễn — gate không bao giờ pass.
    const khongTruongSinh = retrieveKinhNghiem(
      { stars: ["Thiên Lương", "Lưu Thiên Khốc", "Lưu Thiên Hư"], query: "tật ách bệnh tật" },
      10,
    );
    expect(khongTruongSinh.some((e) => e.id === "kn-trang-sinh-nuoi")).toBe(false);

    // Có nhãn Trường Sinh (như collectCycleStarLabels bơm từ 12 cung) → mở khóa
    // + điểm > 0 nhờ tự khớp tag/title (needle "trường sinh" ∈ pool).
    const coTruongSinh = retrieveKinhNghiem(
      {
        stars: ["Thiên Lương", "Lưu Thiên Khốc", "Lưu Thiên Hư", "Trường Sinh"],
        query: "tật ách bệnh tật",
      },
      10,
    );
    expect(coTruongSinh.some((e) => e.id === "kn-trang-sinh-nuoi")).toBe(true);
  });

  it("retrieve theo chủ đề nghề → có mẩu hướng nghề hoặc quan lộc", () => {
    const got = retrieveKinhNghiem(
      { stars: ["Vũ Khúc", "Thái Dương"], query: "nên học ngành gì làm nghề gì" },
      8,
    );
    const blob = got.map((e) => e.title + e.content).join(" ");
    expect(/nghề|quan|học|tài/i.test(blob)).toBe(true);
  });

  it("query nghề không bị ụp bởi đống sát tinh phụ trên lá", () => {
    const noisyStars = [
      "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh",
      "Kình Dương", "Đà La", "Địa Không", "Địa Kiếp", "Hỏa Tinh", "Linh Tinh",
      "Đại Hao", "Tiểu Hao", "Tang Môn", "Bạch Hổ",
    ];
    const got = retrieveKinhNghiem(
      { stars: noisyStars, query: "nên học ngành gì làm nghề gì" },
      8,
    );
    expect(got.some((e) => e.id === "kn-huong-nghe-mau")).toBe(true);
    // Mẩu nghề phải nằm trong top (không bị đẩy xuống dưới toàn hạn/sát).
    expect(got.slice(0, 4).some((e) => e.id === "kn-huong-nghe-mau")).toBe(true);
  });

  it("không khớp gì vẫn trả fallback trình tự đoán", () => {
    const got = retrieveKinhNghiem({ stars: [], query: "xyzabc không liên quan 123" }, 8);
    expect(got.length).toBe(1);
    expect(got[0].id).toBe("kn-trinh-tu-doan");
  });

  it("mẩu phú/hạn bổ sung (batch phú): mở gate đúng tổ hợp mới", () => {
    // Tham ngộ Trường Sinh — chỉ khả thi nhờ nhãn vòng (collectCycleStarLabels) vào pool
    const thamSinh = retrieveKinhNghiem(
      { stars: ["Tham Lang", "Trường Sinh"], query: "thọ tuổi thọ" },
      10,
    );
    expect(thamSinh.some((e) => e.id === "kn-cach-tham-trang-sinh")).toBe(true);
    // Thiếu 1 trong 2 kim → không mở
    expect(
      retrieveKinhNghiem({ stars: ["Tham Lang"], query: "thọ" }, 10).some(
        (e) => e.id === "kn-cach-tham-trang-sinh",
      ),
    ).toBe(false);

    // Tổ hợp hạn: Tuế (cả biến thể Lưu) + Thiên Hình → quan phi khẩu thiệt
    const tueHinh = retrieveKinhNghiem(
      { stars: ["Lưu Thái Tuế", "Thiên Hình"], query: "quan phi kiện tụng" },
      10,
    );
    expect(tueHinh.some((e) => e.id === "kn-han-tue-hinh")).toBe(true);

    // Needle 1 âm tiết không khớp nhầm: lá có Tử Vi nhưng KHÔNG có Tuyệt → mẩu Tướng-Tuyệt khóa
    expect(
      retrieveKinhNghiem({ stars: ["Tướng Tinh", "Tử Vi"], query: "xuất ngoại" }, 10).some(
        (e) => e.id === "kn-han-tuong-tuyet",
      ),
    ).toBe(false);
  });

  it("prompt text có luật ưu tiên lớp B + neo lá/cấm tự phát triển", () => {
    const text = kinhNghiemToPromptText(KINH_NGHIEM_KNOWLEDGE.slice(0, 2));
    expect(text).toContain("KINH NGHIỆM ỨNG DỤNG");
    expect(text).toContain("Đàm Tinh");
    expect(text).toContain("CÓ XU HƯỚNG");
    expect(text).toContain("CẤM hoa mỹ");
    expect(text).toMatch(/iztro|lá số thực|CẤM tự bịa/i);
  });

  it("prompt rỗng khi không có entry", () => {
    expect(kinhNghiemToPromptText([])).toBe("");
  });

  // ===== MẠCH A2 — CƠ CHẾ SAO VẬN (Vận X = Lưu bản-sao; nguồn VDC) =====
  it("mạch A2: đủ 15 mẩu kn-han2-van-* với gate đúng nhãn iztro", () => {
    const van = KINH_NGHIEM_KNOWLEDGE.filter((e) => e.id.startsWith("kn-han2-van-"));
    expect(van.length).toBe(15);
    for (const e of van) {
      expect(e.source, `${e.id} nguồn phải là VDC`).toMatch(/Vương Đình Chi/);
      const gate = [...(e.requireAll || []), ...(e.requireAny || [])].join(" ");
      expect(gate, `${e.id} phải neo nhãn Vận`).toMatch(/vận /);
    }
  });

  it("mạch A2: 4 Hóa kín bộ + Tang Môn có mẩu riêng (quy tắc ≤2 nghĩa chắc nhất)", () => {
    for (const id of [
      "kn-han2-van-hoa-loc",
      "kn-han2-van-hoa-quyen",
      "kn-han2-van-hoa-khoa",
      "kn-han2-van-hoa-ky-xung",
    ]) {
      expect(
        KINH_NGHIEM_KNOWLEDGE.some((e) => e.id === id),
        `thiếu mẩu ${id}`,
      ).toBe(true);
    }
    expect(KINH_NGHIEM_KNOWLEDGE.some((e) => e.id === "kn-han2-tang-mon-han")).toBe(true);
    // Quy tắc 2 nghĩa: mẩu Hóa Khoa phải nêu đúng 2 nghĩa và cấm lan sang phú
    const khoa = KINH_NGHIEM_KNOWLEDGE.find((e) => e.id === "kn-han2-van-hoa-khoa")!;
    expect(khoa.content).toMatch(/DANH VỌNG/);
    expect(khoa.content).toMatch(/THI TUYỂN/);
    expect(khoa.content).toMatch(/không chủ phú/);
  });

  it("mạch A2 Tang Môn: kích khi lá có Tang Môn (mọi lá) — content có luật soi cảnh", () => {
    const got = retrieveKinhNghiem({ stars: ["Tang Môn"], idPrefix: "kn-han2-" }, 60);
    const tang = got.find((e) => e.id === "kn-han2-tang-mon-han");
    expect(tang).toBeTruthy();
    expect(tang!.content).toMatch(/DẤU HIỆU/);
    expect(tang!.content).toMatch(/Cấm hù dọa/);
  });

  // ===== MẠCH A3 — GATE HAI LỚP (vận + lưu) =====
  it("mạch A3: đủ 2 mẩu kn-han2-luu-* với gate đúng nhãn Lưu iztro", () => {
    const luu = KINH_NGHIEM_KNOWLEDGE.filter((e) => e.id.startsWith("kn-han2-luu-"));
    expect(luu.map((e) => e.id).sort()).toEqual([
      "kn-han2-luu-khoi-viet-diep",
      "kn-han2-luu-xuong-da-thuy-hiem",
    ]);
    for (const e of luu) {
      expect(e.source).toMatch(/Vương Đình Chi/);
      const gate = [...(e.requireAll || []), ...(e.requireAny || [])].join(" ");
      expect(gate).toMatch(/lưu /);
    }
  });

  it("mạch A3: 10 mẩu đơn mở gate hai lớp — nhãn [SAO LƯU] kích được mạch", () => {
    // Lưu Thiên Mã kích mẩu Mã chạm Thiên Mã + xung Tuế Dịch (qua form lưu)
    const got = retrieveKinhNghiem(
      { stars: ["[SAO LƯU] Lưu Thiên Mã", "Thiên Mã", "Tuế Dịch", "Lộc Tồn"], idPrefix: "kn-han2-" },
      77,
    );
    const ids = got.map((e) => e.id);
    expect(ids).toContain("kn-han2-van-ma-cham-thien-ma");
    expect(ids).toContain("kn-han2-van-ma-xung-tue-dich");
    expect(ids).toContain("kn-han2-van-ma-loc-giao-tri");

    // Lưu Văn Xương + Lưu Đà + Kỵ → thủy hiểm bản lưu
    const thuy = retrieveKinhNghiem(
      { stars: ["[SAO LƯU] Lưu Văn Xương", "[SAO LƯU] Lưu Đà La", "Lưu Hóa Kỵ (Liêm Trinh)"], idPrefix: "kn-han2-" },
      77,
    );
    expect(thuy.some((e) => e.id === "kn-han2-luu-xuong-da-thuy-hiem")).toBe(true);

    // Lưu Khôi đơn → mẩu đơn hai lớp kích; điệp lưu chỉ khi đủ cặp
    const don = retrieveKinhNghiem({ stars: ["[SAO LƯU] Lưu Khôi"], idPrefix: "kn-han2-" }, 77);
    expect(don.some((e) => e.id === "kn-han2-van-khoi-viet-don")).toBe(true);
    expect(don.some((e) => e.id === "kn-han2-luu-khoi-viet-diep")).toBe(false);
    const diep = retrieveKinhNghiem(
      { stars: ["[SAO LƯU] Lưu Khôi", "[SAO LƯU] Lưu Việt"], idPrefix: "kn-han2-" },
      77,
    );
    expect(diep.some((e) => e.id === "kn-han2-luu-khoi-viet-diep")).toBe(true);
  });

  it("REGRESSION A3 — sao bẩm sinh không tự thỏa gate lưu (poolHas một chiều)", () => {
    // Natal Văn Xương + Đà La + Hóa Kỵ (bẩm sinh) trên lá, KHÔNG có nhãn Lưu/Vận:
    // mẩu thủy hiểm bản lưu và Vận/Lưu Hóa Kỵ KHÔNG được kích
    const natalOnly = retrieveKinhNghiem(
      { stars: ["Văn Xương", "Đà La", "Hóa Kỵ"], idPrefix: "kn-han2-" },
      77,
    );
    expect(natalOnly.some((e) => e.id === "kn-han2-luu-xuong-da-thuy-hiem")).toBe(false);
    expect(natalOnly.some((e) => e.id === "kn-han2-van-hoa-ky-xung")).toBe(false);

    // Nhưng đúng nhãn iztro thì vẫn kích (p.includes(n) một chiều)
    const withLuu = retrieveKinhNghiem(
      { stars: ["[SAO LƯU] Lưu Văn Xương", "[SAO LƯU] Lưu Đà La", "Hóa Kỵ"], idPrefix: "kn-han2-" },
      77,
    );
    expect(withLuu.some((e) => e.id === "kn-han2-luu-xuong-da-thuy-hiem")).toBe(true);

    // Cross-layer chặn: nhãn Lưu không kích gate Vận và ngược lại
    const cross = retrieveKinhNghiem(
      { stars: ["[SAO LƯU] Lưu Thiên Mã"], idPrefix: "kn-han2-" },
      77,
    );
    // Lưu Mã kích các mẩu hai lớp qua form "lưu thiên mã"...
    expect(cross.some((e) => e.id === "kn-han2-van-ma-cham-thien-ma")).toBe(true);
    // ...nhưng gate "vận lộc" KHÔNG khớp nhầm "Lưu Hóa Lộc" hay ngược lại
    const hoaLocOnly = retrieveKinhNghiem(
      { stars: ["Lưu Hóa Lộc (Tham Lang)"], idPrefix: "kn-han2-" },
      77,
    );
    expect(hoaLocOnly.some((e) => e.id === "kn-han2-van-loc-nen")).toBe(false);
    expect(hoaLocOnly.some((e) => e.id === "kn-han2-van-hoa-loc")).toBe(true);
  });

  // ===== MẠCH B — SAO NHẬP MỆNH CHI TIẾT (5 file sách, nguồn = tên file) =====
  it("mạch B: đủ 27 mẩu kn-nm-*/kn-han2-nm-* với nguồn = tên file sách", () => {
    const nm = KINH_NGHIEM_KNOWLEDGE.filter(
      (e) => e.id.startsWith("kn-nm-") || e.id.startsWith("kn-han2-nm-"),
    );
    expect(nm.length).toBe(27);
    // Phân mạch: 21 tổ hợp nhập Mệnh + 6 hạn ứng nghiệm
    expect(nm.filter((e) => e.id.startsWith("kn-nm-")).length).toBe(21);
    expect(nm.filter((e) => e.id.startsWith("kn-han2-nm-")).length).toBe(6);
    for (const e of nm) {
      expect(e.source, `${e.id} nguồn phải là tên file sách`).toMatch(/\.txt/);
      expect(e.content.length, `${e.id} content quá dài`).toBeLessThanOrEqual(600);
    }
    // Nữ mệnh: đúng 5 mẩu onlyGender "nữ"
    const nu = nm.filter((e) => e.onlyGender === "nữ");
    expect(nu.length).toBe(5);
    for (const e of nu) expect(e.tags.join(" ")).toMatch(/nữ mệnh/);
  });

  it("mạch B: lọc giới tính — mẩu nữ mệnh ẩn với Nam, hiện với Nữ, giữ khi không rõ", () => {
    const nuMale = retrieveKinhNghiem(
      { stars: ["Tử Vi", "Thiên Tướng", "Phá Quân", "Văn Khúc", "Văn Xương"], gender: "Nam", excludePrefix: "kn-han2-" },
      30,
    );
    expect(nuMale.some((e) => e.onlyGender === "nữ")).toBe(false);

    const nuFemale = retrieveKinhNghiem(
      { stars: ["Tử Vi", "Thiên Tướng", "Phá Quân", "Văn Khúc", "Văn Xương"], gender: "Nữ", excludePrefix: "kn-han2-" },
      30,
    );
    expect(nuFemale.some((e) => e.id === "kn-nm-nu-tu-vi")).toBe(true);
    expect(nuFemale.some((e) => e.id === "kn-nm-nu-thien-tuong")).toBe(true);

    // Không rõ giới tính → mẩu nữ mệnh vẫn giữ (content tự có caveat)
    const unknown = retrieveKinhNghiem(
      { stars: ["Tử Vi"], excludePrefix: "kn-han2-" },
      30,
    );
    expect(unknown.some((e) => e.id === "kn-nm-nu-tu-vi")).toBe(true);
  });

  it("mạch B: tổ hợp Tử Vi gate cấu trúc tự khớp đúng tổ hợp trên lá", () => {
    // Lá Tử Sát (Tỵ/Hợi): mẩu Tử Sát kích, mẩu Tử Tướng/Tử Phá/Tử Phủ KHÔNG
    const tuSat = retrieveKinhNghiem({ stars: ["Tử Vi", "Thất Sát", "Lộc Tồn"], excludePrefix: "kn-han2-" }, 30);
    expect(tuSat.some((e) => e.id === "kn-nm-tu-sat-hoa-sat-quyen")).toBe(true);
    expect(tuSat.some((e) => e.id === "kn-nm-tu-tuong-thin-tuat")).toBe(false);
    expect(tuSat.some((e) => e.id === "kn-nm-tu-pha-chinh-tri")).toBe(false);
    expect(tuSat.some((e) => e.id === "kn-nm-tu-phu-kinh-doanh")).toBe(false);
  });

  it("mạch A2 kích trên nhãn iztro thô '[SAO VẬN] Vận Xương' (poolHas substring)", () => {
    const han = retrieveKinhNghiem(
      { stars: ["[SAO VẬN] Vận Xương", "[SAO VẬN] Vận Khúc"], idPrefix: "kn-han2-" },
      50,
    );
    expect(han.some((e) => e.id === "kn-han2-van-xuong-khuc-dong")).toBe(true);
  });

  it("mạch A2 điệp: cả Vận Khôi + Vận Việt mới kích mẩu điệp", () => {
    const diep = retrieveKinhNghiem(
      { stars: ["[SAO VẬN] Vận Khôi", "[SAO VẬN] Vận Việt"], idPrefix: "kn-han2-" },
      50,
    );
    expect(diep.some((e) => e.id === "kn-han2-van-khoi-viet-diep")).toBe(true);

    // Khôi đơn → mẩu đơn kích, mẩu điệp KHÔNG kích
    const don = retrieveKinhNghiem({ stars: ["[SAO VẬN] Vận Khôi"], idPrefix: "kn-han2-" }, 50);
    expect(don.some((e) => e.id === "kn-han2-van-khoi-viet-don")).toBe(true);
    expect(don.some((e) => e.id === "kn-han2-van-khoi-viet-diep")).toBe(false);
  });

  it("mạch A2 nhãn Vận Hóa Kỵ kèm đuôi '(Sao)' vẫn kích mẩu", () => {
    const got = retrieveKinhNghiem(
      { stars: ["[SAO VẬN] Vận Hóa Kỵ (Thiên Cơ)"], idPrefix: "kn-han2-" },
      50,
    );
    expect(got.some((e) => e.id === "kn-han2-van-hoa-ky-xung")).toBe(true);
  });

  it("mạch A2 KHÔNG lọt vào KN chính (excludePrefix kn-han2-)", () => {
    const main = retrieveKinhNghiem(
      { stars: ["[SAO VẬN] Vận Xương", "[SAO VẬN] Vận Mã", "Lộc Tồn"], excludePrefix: "kn-han2-" },
      30,
    );
    expect(main.every((e) => !e.id.startsWith("kn-han2-"))).toBe(true);
  });

  it("pattern mới (VĐ1): mẩu kn mới hút theo patternIds + gate sao đủ", () => {
    const cu = retrieveKinhNghiem({ stars: ["Thiên Cơ", "Cự Môn"], patternIds: ["co-cu"] }, 10);
    expect(cu.some((e) => e.id === "kn-co-cu-dong")).toBe(true);

    const vt = retrieveKinhNghiem({ stars: ["Vũ Khúc", "Thiên Tướng"], patternIds: ["vu-tuong"] }, 10);
    expect(vt.some((e) => e.id === "kn-vu-tuong-vo-nghiep")).toBe(true);

    const tpt = retrieveKinhNghiem(
      { stars: ["Tử Vi", "Thiên Phủ", "Vũ Khúc", "Thiên Tướng"], patternIds: ["tu-phu-vu-tuong"] },
      12,
    );
    expect(tpt.some((e) => e.id === "kn-tu-phu-vu-tuong-toan")).toBe(true);

    // Gate chặn: thiếu sao trong pool thì mẩu không mở
    const blocked = retrieveKinhNghiem({ stars: ["Thiên Cơ"], patternIds: ["co-cu"] }, 10);
    expect(blocked.some((e) => e.id === "kn-co-cu-dong")).toBe(false);
  });
});
