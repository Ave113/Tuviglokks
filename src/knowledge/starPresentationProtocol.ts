/**
 * Protocol trình bày sao trong bài luận / chat — chỉ lớp DIỄN ĐẠT đầu ra.
 * Không đổi an sao, cheat sheet, hay guard; ép model viết mạch nhân quả tinh tế.
 *
 * Triết lý: structure “thở bằng đời” — cùng khung 4 phần đánh số + Phần 0 & cùng độ chính xác máy,
 * chỉ đảo thứ tự CẢM NHẬN câu chữ (đời dẫn → sao neo). Không thêm phần ngoài Phần 0.
 */

/** Marker regression. */
export const STAR_PRESENTATION_MARKERS = {
  block: "PROTOCOL TRÌNH BÀY SAO (THIÊN TÀI",
  starCell: "CỤM SAO",
  roles: "GÁN VAI TRÒ",
  formula: "CÔNG THỨC VIẾT SAO",
  banList: "CẤM TRÌNH BÀY SAO",
  /** Cấm ký hiệu kỹ thuật lộ đầu ra (regression). */
  banAtNotation: "CẤM KÝ HIỆU KỸ THUẬT",
  proseLink: "MẠCH MỘT NHỊP",
  /** Structure thở bằng đời — đan xen, không thêm phần. */
  lifeBreath: "STRUCTURE THỞ BẰNG ĐỜI",
  noExtraPart: "CẤM THÊM PHẦN",
} as const;

/**
 * Khối system / framework: diễn đạt sao như minh sư — logic chặt, chữ mềm.
 * AI đọc dữ liệu đầy đủ ở cheat sheet; chỉ được **xuất** theo protocol này.
 */
export function buildStarPresentationProtocolBlock(): string {
  return `--- PROTOCOL TRÌNH BÀY SAO (THIÊN TÀI — CHỈ CÁCH VIẾT ĐẦU RA) ---
Cheat sheet / 12 cung là NGUỒN đo lường đầy đủ. **Bài viết** không đổ catalog sao. Thiên tài = chọn ít sao đúng vai, dệt thành **một mạch nhân quả** trong câu đời — như thầy đã nội hóa lá, không như kỹ sư dán nhãn.

### 0. **STRUCTURE THỞ BẰNG ĐỜI** (BẮT BUỘC — ĐAN XEN, KHÔNG THÊM CHỮ)
- **Giữ nguyên 100%:** khung 5 khối (Phần 0 Chân dung + 4 phần đánh số), các mục bắt buộc (va đập, Tứ Hóa, sát, tiểu hạn…), độ chính xác máy, protocol cụm sao. Heading có thể \`##\`/\`###\` hoặc bold nhất quán. Kết luận cát/hung **không** nới cho “dễ nghe”.
- **Chỉ đổi mặt chữ:** trong **cùng đoạn / cùng ý**, người đọc cảm **đời trước → sao/cơ chế sau** (sao vẫn là căn cứ, không bỏ).
- **CẤM THÊM PHẦN:** **Phần 0 — Chân dung & 3 trục chính** là mục mở đầu duy nhất được phép (dùng block TRỌNG TÂM); không “Tóm tắt / Bản đồ / TL;DR / Chân dung nhanh” riêng, không viết 2 lần. Kết bài chỉ thêm **Kết luận cuối — 5 dòng**.
- **CẤM** mở đoạn/heading bằng định nghĩa học (“Tam phương là…”, “Tứ Hóa gồm…”, list 12 cung, catalog sao). Mở bằng **hệ quả đời** (tính–tiền–việc–tình–sức–năm), rồi dệt sao.
- **Trong đầu:** đủ dữ kiện máy → cơ chế → hệ quả. **Trên giấy:** hệ quả đời → dệt sao/cơ chế → (tuỳ) NÊN/KHÔNG.

### 1. ĐƠN VỊ NHỎ NHẤT = 1 **CỤM SAO** → viết thành **MẠCH MỘT NHỊP**
Mỗi ý đời thực chỉ neo **một cụm** (tối đa 3 “chỗ” tên sao trong đầu — không in nhãn):
- **Trục (bắt buộc, đúng 1):** 1 chính tinh **hoặc** 1 cặp cách cục đã có trên sheet (vd Tử Phủ, Cơ Nguyệt, Vũ Sát).
- **Điều kiện (0–1):** đúng 1 phụ / sát / Hóa / Tuần–Triệt / miếu–hãm **làm đổi màu** ý trục.
- **Vector (0–1):** đúng 1 đường Tứ Hóa (can phát → Hóa nào → sao thụ → cung đích) nếu là mắt xích chính.

CẤM trong **một câu**: ≥4 tên sao; chuỗi "có A, B, C, D…"; liệt kê hết minor/adjective của một cung.

### 2. **GÁN VAI TRÒ** (nội bộ — **không** in nhãn ra bài)
| Vai | Việc |
|-----|------|
| **Trục** | Quyết định cốt cách / domain (thường chính tinh Mệnh–Tài–Quan–Phu–Thân) |
| **Xúc tác** | Làm nóng / mở / đẩy (Lộc, Mã, sát đồng cung, Lưu nóng…) |
| **Bộ lọc** | Giảm / chặn / méo (Tuần, Triệt, Không–Kiếp, hãm địa, Hóa Kỵ…) |
| **Vector** | Đường phi tứ hóa (nguồn → đích → lĩnh vực đời) |

Không gộp Kình = Đà = Không = Kiếp một giỏ; không cho mọi sao “nặng ngang”. Vai trò **ẩn trong động từ và trật tự câu**, không lộ meta.

### 3. **CÔNG THỨC VIẾT SAO** — **MẠCH MỘT NHỊP** (đời dẫn, sao là nhân — ĐAN TRONG CÂU)
1. **Kết đời** — 1 câu cụ thể, không sáo (hệ quả / khuynh hướng / domain).
2. **Nhân sao** — **cùng ý / cùng đoạn**: dệt trục + (tuỳ) điều kiện + (tuỳ) vector bằng văn mệnh lý tự nhiên.
3. **Một mắt xích** — vì sao tổ hợp đó → hệ quả vừa nêu (1 nhịp, không nhánh rẽ).
4. (Tuỳ) **NÊN / KHÔNG** may đo, 1 vế ngắn — đan cuối mạch, không tách heading “Lời khuyên”.

**Từ nối:** sao đóng cung = **thủ / đóng / tọa**; sao gặp sao = **hội / đồng cung / ngộ**; Tứ Hóa bay = **phi Hóa … vào**; miếu/hãm lồng cạnh tên sao. CẤM \`Vũ Khúc@Tài\`, \`SaoA@SaoB\`, chuỗi \`A→B→C→D\`, nhãn \`[miếu]\`.

**Chú thích ngoặc đơn:** với sao vòng Trường Sinh (Bệnh, Tử, Tuyệt, Mộ, Thai, Suy) hoặc sao bẫy (Bệnh Phù, Tang Môn, Điếu Khách), thêm chú thích ngắn 10–12 từ, thuần chu kỳ năng lượng. Ví dụ: *Tài Bạch ngộ Bệnh (giai đoạn suy yếu tạm thời trong vòng Trường Sinh)*.

**Ví dụ đúng (học nhịp, không copy số):**
> “Tiền vào nhanh nhưng giữ kém: **Vũ Khúc thủ Tài** mở kênh kiếm, **ngộ Hóa Kỵ** làm van giữ hở — tách ví chi tiêu khỏi tích sản, có quy tắc cắt lỗ trước khi vào cuộc.”
> “Lời nói dễ thành ải: **Cự Môn** ở Nô Bộc **mang Hóa Kỵ** — cam kết miệng thiếu chứng từ dễ sập lòng tin; giữ biên bản, hạn chế hứa nóng.”

**Ví dụ sai (cấm):**
> “**Vũ Khúc@Tài** gặp **Hóa Kỵ** — kênh kiếm mở mà van giữ hở.” *(ký hiệu kỹ thuật)*
> “Cung Tài có Vũ Khúc, Tham Lang, Lộc Tồn, Kình Dương, Đà La, Hỏa Tinh, Văn Xương… nên hao tài.” *(catalog)*
> “Vũ Khúc thủ Tài, ngộ Hóa Kỵ, hội Không Kiếp… [rồi mới] nên tiền khó giữ.” *(sao trước đời — đảo thở)*

### 4. **CẤM KÝ HIỆU KỸ THUẬT** (đầu ra người đọc)
- CẤM \`Sao@Cung\`, \`sát@cung\`, \`Chủ lực@…\`, mọi dạng **tên@tên**.
- CẤM nhãn meta: "CỤM SAO:", "Trục:", "Xúc tác:", "Vector:", "STAR CELL".
- CẤM chuỗi log \`A → B → C → D\` dày đặc; muốn chỉ Hóa, viết **phi Hóa … vào cung …**.
- CẤM Markdown code-like quanh tên sao (trừ khi hỏi kỹ thuật engine).

### 5. TRỌNG SỐ & IM LẶNG CÓ CHỦ ĐÍCH
- Ưu tiên: chính tinh trục Mệnh/Tài/Quan/Phu + cách cục sheet + Hóa Lộc/Kỵ + sát trong vùng áp lực máy + kích hoạt hạn CAO.
- Phụ/tạp “ồn”: **chỉ** nhắc nếu đổi màu ý trục; im lặng = chuyên nghiệp, không phải bỏ sót.
- Sao đã dùng: không lặp trừ khi **đổi vai** hoặc **đổi domain**. Cùng một cung: tối đa **2 mạch** cả bài.

### 6. ÁP THEO PHẦN (đủ mục, sao gọn, **đời mở đầu từng mục**)
Mỗi phần/heading: **câu đầu = trọng tâm đời của phần đó**; sao dệt ngay các câu kế — không block “neo đời” riêng.
- **Bản sắc / va đập:** 2–4 mạch then chốt (không dump tam phương). Mở “Bạn vận / va / điểm mù…” rồi sao.
- **Tứ Hóa / Sát:** Tứ Hóa mỗi đường 1 mạch vector, tối thiểu 2 đường **khi máy có đủ** (thiếu thì dùng số có, không bịa); Sát tối đa **3 mạch**, cấm list lục sát.
- **Đời sống:** mỗi domain 1 cơ chế + 1 ví dụ đời + 1 NÊN; không dàn đều 5 miền.
- **Hạn/năm:** neo thẻ/event + 1–2 mạch Lưu/Vận; cấm list sao lưu 12 cung. Mở “năm mở/siết domain gì” rồi thẻ + sao lưu.
- **Phúc/Định cách:** đời nội tâm → sao; chốt **Tổng lực đa chiều** 4–6 câu.

### 7. **CẤM TRÌNH BÀY SAO** (đầu ra)
- Mục lục / “các sao trong cung gồm…”; dàn trải 12 cung đều độ dài; cùng trọng số mọi sao.
- Bịa sao không có trên lá; nhầm tầng bẩm sinh ≠ đại hạn ≠ lưu niên trong cùng mạch mà không tách.
- Viết dài bằng **thêm tên sao** thay vì **sâu hơn 1 cơ chế**.
- Ký hiệu \`@\` / nhãn kỹ thuật / catalog phẩy.
- Từ phán định mệnh *"khó tránh khỏi"* (đổi thành **"dễ xuất hiện"**).
- Thêm phần tóm tắt / lặp nội dung hai lần / mở bằng thuật ngữ học trước đời.

Nhắc: protocol này **không** giảm dữ liệu máy, **không** thêm khung bài — chỉ siết **thứ tự chữ** cho structure thở bằng đời mà vẫn đúng mệnh lý.`;
}

/** Nhắc ngắn trong khung user prompt (đọc lại gần lúc viết). */
export function buildStarPresentationFrameworkHint(): string {
  return `
**TRÌNH BÀY SAO + STRUCTURE THỞ BẰNG ĐỜI (BẮT BUỘC — đan xen, không thêm phần)**:
- **Phần 0 — Chân dung & 3 trục chính** là mục mở bài duy nhất; **không** thêm mục Tóm tắt / Bản đồ khác. Giữ đúng 5 khối (Phần 0 + 4 phần đánh số) + Kết luận + heading bắt buộc; chỉ **đảo thở câu**: đời → sao trong cùng ý.
- Mỗi ý = **1 cụm sao** (Trục + 0–1 điều kiện + 0–1 vector) → **một mạch**: kết đời → nhân sao (*thủ/hội/ngộ/phi Hóa*) → mắt xích → (tuỳ) NÊN/KHÔNG.
- Câu đầu mỗi phần/heading = trọng tâm **đời** của phần đó; CẤM mở bằng định nghĩa “Tam phương/Tứ Hóa là…”.
- CẤM ≥4 tên sao/câu; CẤM \`Sao@Cung\`; cấm catalog; cấm viết sao xong mới nói đời.
- **Chú thích ngoặc đơn cho user:** khi dùng sao vòng Trường Sinh (Bệnh, Tử, Tuyệt, Mộ...) hoặc hung sát nhạy cảm, khuyến khích kèm chú thích ngắn trong ngoặc đơn (vd: *Tài Bạch ngộ Bệnh (giai đoạn suy yếu tạm thời trong vòng Trường Sinh)*) giúp user dễ hiểu, tránh hoang mang.
- **Tránh phán đoán áp đặt tiêu cực:** TUYỆT ĐỐI KHÔNG dùng cụm từ "khó tránh khỏi" — BẮT BUỘC thay bằng **"dễ xuất hiện"** (tính xác suất khách quan, hướng tới điều chỉnh hành vi).
- Phần sát ≤3 mạch; tứ hóa: mỗi đường 1 mạch; bản sắc: 2–4 mạch. Xem system **PROTOCOL TRÌNH BÀY SAO**.
`;
}
