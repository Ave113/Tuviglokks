# knowledge/data — sách gốc (offline)

## Quy tắc bắt buộc

1. **Không** inject nguyên file vào prompt luận giải.
2. Runtime chỉ dùng:
   - `bookCorpus.ts` — whitelist + index + **top-N đoạn ngắn** theo sao trên lá
   - `giaiHoaKnowledge.ts` / `kinhNghiemKnowledge.ts` / `damTinh.ts` — **mẩu đã biên soạn**
3. File raw ở đây = kho tra cứu / nguồn để **chẻ thêm mẩu**, không phải context Gemini.

## File hiện có

| File | Pipeline |
|------|----------|
| `luangiaichinhtinhphutinh.txt` | `bookCorpus` mode `star-sections` (bật) |
| `tuvi_fixed.txt` | `bookCorpus` mode `window` (bật, priority thấp hơn star-sections) |
| `tan-bien-1956.txt` | Vân Đằng Thái Thứ Lang 1956 — `bookCorpus` mode `window` (bật, priority thấp nhất) + nguồn biên entry vòng Trường Sinh/Tuế tiền trong `damTinh.ts` |
| `binhgiaicaccach.txt` | Bình giải các cách theo chủ đề, 22 mục (user, 2026-10) — `bookCorpus` mode `window` (bật, priority 2, ngang tuvi-fixed — nền "cách"); + block riêng cho `/api/chat` (12 mục ≈ 50% trần interpret) |
| `so-tu-vi-kinh-nghiem-quyen-ha.txt` | `kinhNghiemKnowledge` mẩu; raw **tắt** trong corpus |
| `vuongdinhchidamtinh.txt` | `damTinh` / `damTinhSource`; raw **tắt** trong corpus |

## Thêm sách mới

1. Đặt `.txt` UTF-8 vào thư mục này (PDF phải convert trước).
2. Thêm 1 dòng vào `BOOK_CORPUS_MANIFEST` trong `bookCorpus.ts` (`enabled: true` chỉ khi đã test).
3. Chạy test corpus: `npm test -- bookCorpus` hoặc `./node_modules/.bin/vitest run src/knowledge/bookCorpus.test.ts`.
4. (Khuyến nghị) chẻ 5–10 mẩu `gh-*` vào `giaiHoaKnowledge.ts` thay vì dựa raw.

## Trần an toàn (khớp `MODE_LIMITS` trong `tinhHoaCabinet.ts`)

- **Tủ tinh hoa (per-star):** interpret **24 mục** × ~**542** ký tự, tổng ≤ **~6.9k**; chat **14** × ~**403** ≤ **3k**; chat-light **9** × ~**332** ≤ **1.8k** — đủ hội tủ theo lá, **không** full 300kB sách
- Giải hóa: interpret **≤ 8 mẩu**, chat **≤ 5**, chat-light **≤ 3** (gate `requireAll` / `requireAny`)
- AI nhận **lệnh diễn đạt bậc thầy**: tiêu hóa nguyên liệu → viết mạch logic; **dùng toàn bộ kiến thức**, chỉ **câu chữ trùng nguyên văn tối đa 40%** độ dài câu/cách trích (trần trùng câu chữ toàn bài, không phải mỗi khối và không phải trần kiến thức); phần câu chữ còn lại hạ giọng + diễn đạt lại

## Triết lý

```
Hội tủ offline (đầy)  →  mở đúng ngăn theo lá (cô đọng)  →  Gemini diễn như thiên tài
```

## Bộ "sao nhập Mệnh chi tiết" (nguồn = tên file, user cung cấp 2026-10)

- saotuvi.txt — Tử Vi nhập Mệnh (6 tổ hợp, nữ mệnh)
- saothientuong.txt — Thiên Tướng nhập Mệnh (Tài Ấm giáp ấn, nữ mệnh)
- saophaquan.txt — Phá Quân nhập Mệnh (Anh tinh nhập miếu, ứng nghiệm hạn)
- saovanxuong.txt — Văn Xương nhập Mệnh (cung vị, Hóa Kỵ ngân phiếu, nữ mệnh)
- saovankhuc.txt — Văn Khúc nhập Mệnh (cung vị, nữ mệnh)

Đã biên 19 mạch mẩu (kn-nm-* / kn-han2-nm-*) + 5 entry window trong bookCorpus manifest. Quan niệm cổ về nữ mệnh giữ kèm caveat; khẳng định đắt được hạ giọng.
