import { describe, it, expect } from "vitest";
import { distillInterpretation } from "./zenDistill";

// Fixture kiểm tra khả năng tách heading linh hoạt (khung cũ nhiều phần + mục con):
// heading phần, heading mục con, [TÓM NĂM] và thẻ máy [Đồng thuận].
const FIXTURE_ESSAY = [
  "Đương số là người đi giữa hai bờ: muốn và giữ. ",
  "Linh hồn mệnh của lá này là kiếm được mà giữ kém.",
  "",
  "## Phần 1: Tam phương tứ chính",
  "### Tính va đập & Điểm mù",
  "Cốt cách của đương số là quyết liệt trong tư duy, mưu nhiều hơn hành. ",
  "Điểm mù lớn nhất là tin rằng nghĩ kỹ đã là làm.",
  "NÊN: đặt 1 quyết định/ngày và 24h nguội với quyết nóng để hóa giải overthink.",
  "",
  "### Tự Phi Tứ Hóa",
  "Cung Mệnh phi Hóa Kỵ vào Quan Lộc: tự sinh áp lực lên công danh.",
  "Tự Hóa Khoa tại bản cung: biết tự hạ nhiệt nhưng dễ tự nói giảm.",
  "",
  "### Độ sâu Tứ Hóa",
  "Độ sâu của các đường bay này nằm ở lớp vô thức, không phải chiến lược lộ.",
  "",
  "### Cấu trúc Sát Tinh",
  "Sát tập trung ở trục Tài–Phúc: áp lực tiền đi kèm bất an nội tại.",
  "",
  "## Phần 4: Vận hạn",
  "### Đại hạn (10 năm)",
  "Đại vận hiện tại mở đường lớn nhưng đòi kỷ luật dòng tiền.",
  "",
  "### Luận giải Tiểu Hạn",
  "[TÓM NĂM] Kênh nóng của năm:",
  "1. [TIỀN BẠC] · ÁP LỰC · nhiệt 42",
  "2. [CÔNG VIỆC / HỌC] · HỖN HỢP · nhiệt 35",
  "",
  "## Phần 5: Quan hệ",
  "### Cung Phu Thê",
  "Phu Thê lệch sóng giao tiếp: nói lý thay vì nói tình.",
  "Không nên kéo cam kết lớn vào năm có Kỵ chiếu.",
  "",
  "### Tật Ách",
  "Thần kinh và dạ dày là hai điểm gánh stress.",
  "",
  "### Cung Phúc Đức",
  "Phúc Đức có Không: an tâm phải tự dựng từ quy trình, không tự nhiên đến.",
  "",
  "## Phần 8: Tổng lực",
  "### ĐỊNH CÁCH PHÚ QUÝ",
  "Tầng phúc lộc trung bình khá: đủ ăn đủ làm, phat phải nhờ kỷ luật.",
  "",
  "### Đối chiếu Bát Tự",
  "[Đồng thuận] Về tính cách, Bát Tự cùng hướng nội lực.",
].join("\n");

describe("distillInterpretation — chưng cất bài luận cho Zen Reader", () => {
  const r = distillInterpretation(FIXTURE_ESSAY);

  it("nhận diện được cấu trúc (ok) và giữ đúng thứ tự phần", () => {
    expect(r.ok).toBe(true);
    expect(r.passages.map((p) => p.id)).toEqual([
      "ban-sac",
      "tu-hoa",
      "sat-cuc",
      "dai-han",
      "van-nam",
      "phu-the",
      "tat-ach",
      "phuc-duc",
      "dinh-cach",
      "bat-tu",
    ]);
  });

  it("gộp 'Tự Phi Tứ Hóa' + 'Độ sâu Tứ Hóa' thành 1 passage (merged)", () => {
    const tuHoa = r.passages.find((p) => p.id === "tu-hoa")!;
    expect(tuHoa).toBeTruthy();
    expect(tuHoa.merged).toBe(true);
    expect(tuHoa.full).toContain("tự sinh áp lực");
    expect(tuHoa.full).toContain("lớp vô thức");
  });

  it("openingLine lấy câu linh hồn mệnh từ đầu bài (trước heading đầu)", () => {
    expect(r.openingLine).toContain("kiếm được mà giữ kém");
  });

  it("mỗi passage có 1-3 câu chốt; câu NÊN/KHÔNG được bắt", () => {
    for (const p of r.passages) {
      expect(p.breaths.length, `${p.id} phải có câu chốt`).toBeGreaterThan(0);
      expect(p.breaths.length).toBeLessThanOrEqual(3);
    }
    const banSac = r.passages.find((p) => p.id === "ban-sac")!;
    expect(banSac.breaths.some((b) => b.startsWith("NÊN:"))).toBe(true);
    const phuThe = r.passages.find((p) => p.id === "phu-the")!;
    expect(phuThe.breaths.some((b) => /không nên kéo cam kết/i.test(b))).toBe(true);
  });

  it("yearCards bắt đúng nhãn thẻ sau [TÓM NĂM]", () => {
    expect(r.yearCards).toEqual(["TIỀN BẠC", "CÔNG VIỆC / HỌC"]);
  });

  it("breaths đã strip thẻ máy [TAG] và markdown **", () => {
    const batTu = r.passages.find((p) => p.id === "bat-tu")!;
    expect(batTu.breaths.join(" ")).not.toContain("[Đồng thuận]");
    expect(batTu.breaths.join(" ")).not.toContain("**");
    // full vẫn giữ nội dung nhưng tag máy phải được ẩn
    expect(batTu.full).not.toContain("[Đồng thuận]");
    expect(batTu.full).toContain("Bát Tự cùng hướng nội lực");
  });

  it("full giữ nguyên văn phần để 'đọc sâu' (thẻ thẻ máy riêng vẫn còn trong full)", () => {
    const vanNam = r.passages.find((p) => p.id === "van-nam")!;
    expect(vanNam.full).toContain("TIỀN BẠC");
    expect(vanNam.full).toContain("ÁP LỰC");
    const daiHan = r.passages.find((p) => p.id === "dai-han")!;
    expect(daiHan.full).toContain("mở đường lớn");
  });

  it("câu chốt quá dài bị cắt tại biên từ có dấu …", () => {
    const longSentence =
      "Tư duy phân tích là con dao hai lưỡi của đương số khi mọi quyết định đều được soi đi soi lại nhiều lần cho tới khi cơ hội ngoài kia đã đi qua hết rồi mới nhận ra mình chưa hề bước chân, rồi lại gọi đó là sự thận trọng cần thiết của người cẩn trọng trong khi thực chất chỉ là sợ hãi mặc áo lý trí mỗi khi đứng trước một lựa chọn thật sự. ";
    const longEssay = FIXTURE_ESSAY.replace(
      "Điểm mù lớn nhất là tin rằng nghĩ kỹ đã là làm.",
      longSentence,
    );
    const r2 = distillInterpretation(longEssay);
    const banSac = r2.passages.find((p) => p.id === "ban-sac")!;
    expect(banSac.breaths.every((b) => b.length <= 242)).toBe(true);
    expect(banSac.breaths.some((b) => b.endsWith("…"))).toBe(true);
  });

  it("REGRESSION — 'nên' thường không bị nhặt làm câu khuyên NÊN (marker máy case-sensitive)", () => {
    // Regex cũ mang cờ /i nên câu thứ 3 chứa "nên" thường bị nhét vào breaths
    // thay vì chỉ 2 câu mở phần. Marker máy phải là "NÊN" viết hoa.
    const essay = [
      "Mở đầu bài luận.",
      "",
      "### Độ sâu Tứ Hóa",
      "Đường bay nội tâm của đương số sâu và kín đáo hơn bề ngoài cho thấy. ",
      "Lớp vô thức điều khiển cả cách chi tiêu lẫn cách yêu thương người thân thiết. ",
      "Cuộc đời nên được soi từng chặng thay vì soi một lượt tổng thể đại khái.",
    ].join("\n");
    const r = distillInterpretation(essay);
    const tuHoa = r.passages.find((p) => p.id === "tu-hoa")!;
    expect(tuHoa.breaths.some((b) => b.includes("nên được soi từng chặng"))).toBe(false);
  });
});

describe("distillInterpretation — dung sai (tolerance)", () => {
  it("bài không có heading → ok=false, 1 passage duy nhất, không ném lỗi", () => {
    const r = distillInterpretation("Chỉ một đoạn văn dài không có cấu trúc markdown heading nào cả. ".repeat(5));
    expect(r.ok).toBe(false);
    expect(r.passages).toHaveLength(1);
    expect(r.passages[0].id).toBe("toan-bo");
    expect(r.passages[0].breaths.length).toBeGreaterThan(0);
  });

  it("input rỗng/null → kết quả rỗng, không crash", () => {
    expect(distillInterpretation("")).toEqual({ passages: [], openingLine: "", yearCards: [], ok: false });
    expect(distillInterpretation(null as any).passages).toEqual([]);
    expect(distillInterpretation(undefined as any).passages).toEqual([]);
  });

  it("heading lạ (không khớp keyword) vẫn thành passage với title gốc", () => {
    const r = distillInterpretation(
      "Mở đầu ngắn.\n\n### Một mục gì đó đặc biệt\nNội dung mục lạ đủ dài để trở thành câu chốt của phần này.",
    );
    const muc = r.passages.find((p) => p.title.includes("Một mục gì đó đặc biệt"));
    expect(muc).toBeTruthy();
    expect(muc!.breaths.length).toBeGreaterThan(0);
  });
});
