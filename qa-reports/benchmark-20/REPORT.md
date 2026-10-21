# QA Benchmark 20 la

- Time: 2026-10-10T05:46:44.689Z
- Mode: pipeline only (no Gemini)
- Pipeline OK: 20/20
- Avg score: 100/100
- Hour branch match: 20/20

> Điểm pipeline/skeleton ≠ phần trăm đúng cuộc đời. Chỉ đo an lá + sẵn sàng luận + (tuỳ) coverage bài AI.

| ID | Label | Hour | Pipeline | Total | AI |
|----|-------|------|----------|-------|----|
| B01 | Nữ 1988-03-12 22:45 Bắc | OK | OK | 100 | - |
| B02 | Nam 2001-07-08 05:15 Nam | OK | OK | 100 | - |
| B03 | Nam 2009-06-09 23:05 Trung QT vào | OK | OK | 100 | - |
| B04 | Nữ 2004-07-15 19:30 Trung QT vào | OK | OK | 100 | - |
| B05 | Nữ 1980-11-19 02:45 Trung QT vào | OK | OK | 100 | - |
| B06 | Nam 2011-04-23 11:00 Nam | OK | OK | 100 | - |
| B07 | Nữ 1996-01-02 18:15 Nam | OK | OK | 100 | - |
| B08 | Nam 2023-08-05 04:45 Bắc | OK | OK | 100 | - |
| B09 | Nam 1975-09-02 08:20 Bắc | OK | OK | 100 | - |
| B10 | Nữ 1990-12-25 14:00 Nam | OK | OK | 100 | - |
| B11 | Nam 1985-05-01 16:40 Trung QT ra | OK | OK | 100 | - |
| B12 | Nữ 2000-02-29 00:30 Nam (năm nhuận) | OK | OK | 100 | - |
| B13 | Nam 1999-10-10 21:10 Overseas | OK | OK | 100 | - |
| B14 | Nữ 1972-06-18 09:55 Bắc | OK | OK | 100 | - |
| B15 | Nam 2007-03-21 12:00 Trung QT vào | OK | OK | 100 | - |
| B16 | Nữ 2015-11-11 06:06 Nam | OK | OK | 100 | - |
| B17 | Nam 1968-01-30 20:20 Bắc | OK | OK | 100 | - |
| B18 | Nữ 1993-08-08 15:30 Trung QT ra | OK | OK | 100 | - |
| B19 | Nam 2002-04-04 03:33 Nam | OK | OK | 100 | - |
| B20 | Nữ 1987-07-07 13:13 Overseas | OK | OK | 100 | - |

## Chay

```bash
npx tsx scripts/qa-benchmark-20.mts
npx tsx scripts/qa-benchmark-20.mts --with-ai
```

## Y nghia diem

- chart_health: an 12 cung, Menh, can nam
- prompt_readiness: Tinh va dap, Tu Hoa, tu tinh hoa, ...
- ai_text: heading + star audit + overclaim (khi --with-ai)
- KHONG phai % dung so phan doi nguoi
