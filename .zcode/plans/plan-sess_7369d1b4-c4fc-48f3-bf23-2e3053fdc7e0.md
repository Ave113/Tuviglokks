# Zen Reader — "Đúng nghĩa Zen": đọc bản chưng cất, không push 1:1

## Vấn đề hiện tại
Zen Reader (overlay trong `src/components/AIInterpreter.tsx` dòng 742–904) chỉ là **da trang trí** (theme/font/ambient/scroll) bọc quanh nguyên văn `interpretation` — push 1:1 bài luận giải. Zen đúng nghĩa = đọc **lượng tối thiểu, chất tối đa**, trong tĩnh, đào sâu khi muốn.

## Thiết kế đã chốt với user
- Nguồn nội dung: **chưng cất client-side deterministic** (không gọi AI, không tốn token, test được).
- Trải nghiệm: **cuộn liên tục, thuần đọc** — không nghi thức "hơi thở/một ý một màn"; giữ nguyên chrome hiện có (font size, serif/sans, 3 theme, ambient toggle, progress).
- Đào sâu: **"đọc sâu" tại chỗ** cho từng phần + nút **"Xem toàn văn"** chuyển nguyên bài gốc trong Zen.

## Thay đổi

### 1. Mới: `src/utils/zenDistill.ts` (pure function, test được)
`distillInterpretation(md: string): ZenDistillResult` với:
```ts
interface ZenPassage { id: string; title: string; breaths: string[]; full: string; }
interface ZenDistillResult {
  passages: ZenPassage[];
  openingLine: string;   // câu "linh hồn mệnh" từ đoạn đầu bài
  yearCards: string[];   // nhãn thẻ [TÓM NĂM] (TIỀN BẠC, VIEC...)
  ok: boolean;           // parser nhận diện được cấu trúc heading không
}
```
- **Chia phần theo heading bắt buộc** mà prompt đã neo (map keyword → id): "Tính va đập"→bản-sắc, "Tự Phi Tứ Hóa"+"Độ sâu Tứ Hóa"→gộp tu-hoa, "Cấu trúc Sát"→sat, "Đại hạn"→dai-han, "Luận giải Tiểu Hạn"→van-nam, "Tháng"→luu-nguyet (tùy cờ), "Phu Thê", "Tật Ách", "Phúc Đức", "ĐỊNH CÁCH"→dinh-cach. Đoạn trước heading đầu tiên = mở đầu.
- **Rút câu chốt mỗi phần**: đoạn mở đầu → 1–2 câu; cộng câu chứa "NÊN/KHÔNG" (prompt bắt buộc mỗi phần hung có lời khuyên); cap 3 câu/phần; cắt dài ≤ ~220 ký tự/câu.
- **Thẻ năm**: bắt nhãn `[TÊN THẺ]` ngay sau dòng `[TÓM NĂM]` → `yearCards`.
- **Ẩn thẻ máy**: dùng `processMetadataInText(text, false)` từ `src/utils/metadataTags.ts` (hiện là dead code — giờ có consumer thật) lên breaths/full sau khi đã bắt thẻ [TÓM NĂM].
- **Dung sai**: không nhận diện được heading nào → fallback chia `##`; vẫn không → 1 passage duy nhất `ok=false` (Zen vẫn chạy, user bấm "Xem toàn văn"); input rỗng/garbage → không ném lỗi.

### 2. Sửa: `AIInterpreter.tsx` — chỉ lớp nội dung của overlay
- State mới: `zenView: "distilled" | "full"` (mặc định distilled), `expandedPassages: Set<string>`.
- Nội dung overlay thay `<SafeMarkdown>{interpretation}</SafeMarkdown>` bằng:
  - `openingLine` làm câu mở (serif, lớn hơn, italic).
  - Từng passage: tiêu đề nhỏ in hoa + các câu chốt (line-height rộng) + nút **"đọc sâu ▾"** → mở `full` của phần đó tại chỗ (SafeMarkdown, gập lại được).
  - Vận năm: render `yearCards` dạng danh sách gọn dưới passage.
  - Nút **"Xem toàn văn"** ở header → `zenView="full"` → nguyên trạng thái hiện tại; nút "Về bản chưng cất" quay lại.
- `distillInterpretation` bọc `useMemo` theo `interpretation` (chỉ string ops, rẻ).
- Giữ nguyên: chrome, title card, standard view bên dưới, chat follow-up, hành vi không persist zen mode.

### 3. Mới: `src/utils/zenDistill.test.ts`
Fixture bài luận theo đúng khung heading bắt buộc (kèm `[TÓM NĂM]`, thẻ, `[Đồng thuận]`): assert số/thứ tự passage, openingLine, breaths (≤3, có câu NÊN, đã strip thẻ máy), yearCards đúng nhãn, `full` giữ nguyên văn phần. Dung sai: bài không heading → ok=false + 1 passage; rỗng → không ném lỗi.

## Không làm
Không gọi AI mới, không đổi server/prompt, không key localStorage mới, không đụng view chuẩn và chat.

## Rủi ro & biên
- AI có thể lệch heading → parser theo keyword + fallback nhiều tầng, luôn có "Xem toàn văn" thoát.
- Thang đo thành công: mở Zen thấy ~15–20 câu chốt thay vì ~2000 từ; mọi câu chốt truy vết được về phần gốc; 0 token phát sinh.