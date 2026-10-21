# Lá Số Tử Vi và Luận Giải AI (`tuvi-app`)

Ứng dụng lập **lá số Tử Vi Đẩu Số** (iztro + hiệu chỉnh múi giờ VN) và **luận giải / hỏi đáp** bằng Google Gemini.

## Yêu cầu

- Node.js 20+ (khuyến nghị 22/24)
- (Tuỳ chọn) Gemini API key — [Google AI Studio](https://aistudio.google.com/apikey)

## Chạy local

```bash
cd tuvi-app-source
npm install
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux
```

Sửa `.env.local` (tối thiểu cho AI không BYOK):

```env
GEMINI_API_KEY=your_key_here
```

Hoặc để trống key server và **dán API key cá nhân (BYOK)** trên UI.

```bash
npm run dev
```

Mở URL log in ra (thường `http://localhost:3000` — xem `PORT`).

### Scripts

| Lệnh | Việc |
|------|------|
| `npm run dev` | Dev: Express + Vite middleware |
| `npm run build` | Build FE (`dist/`) + bundle server (`dist/server.cjs`) |
| `npm start` | Production Node: serve `dist/` + API |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | Vitest (unit + integration mock) |
| `npm run clean` | Xóa `dist/` |

## Biến môi trường

Chi tiết mẫu: [`.env.example`](.env.example).

| Biến | Ý nghĩa |
|------|---------|
| `GEMINI_API_KEY` | Key Gemini phía server |
| `ALLOW_SERVER_KEY` | `0` cấm / `1` bật fallback key server. **Không set:** dev = bật; **production & Vercel = cấm** |
| `PORT` | Cổng listen (local / Node host) |
| `RATE_LIMIT_FORCE` | `0` = tắt rate-limit; mặc định **bật** (kể cả Vercel per-instance, vẫn yếu hơn Redis) |
| `VERCEL` | Do platform set — bật mode serverless API |
| `NODE_ENV` | `production` khi `npm start` / deploy |

### Policy key (hardening)

```
BYOK (customApiKey trên UI)  → luôn được dùng nếu có
Key server                   → chỉ khi isServerKeyAllowed()
```

- **Local dev:** có `GEMINI_API_KEY` → AI chạy không cần BYOK.
- **Production / Vercel (mặc định an toàn):** cần BYOK **hoặc** set rõ `ALLOW_SERVER_KEY=1` (không khuyến nghị nếu app public).

Log lúc start:

```text
[security] Server Gemini key: ...
[security] AI rate-limit: ON|OFF ...
```

## API

| Method | Path | Mô tả |
|--------|------|--------|
| `POST` | `/api/interpret` | Luận giải lá số |
| `POST` | `/api/chat` | Hỏi đáp follow-up |

Body chung: `chartData` (12 cung), `customApiKey?`, `modelSelection?`.  
Guard: body JSON ≤ 4MB, thiếu 12 cung → 400, thiếu key → 400, rate-limit server-key → 429 (+ `rateLimited`, `retryAfter`).

## Rate limit

- **Mặc định bật** (Node + Vercel): **5 request / 60s / IP** khi dùng **key server** hoặc BYOK **không hợp lệ** (quá ngắn / rác).
- **BYOK hợp lệ** (đủ dài, shape kiểu `AIza…` / `AQ.…` / secret dài): **bypass** (quota user).
- **Vercel:** counter in-memory **per-instance** (không thay Firewall/Redis). Production public nên thêm **Vercel Firewall** hoặc **Upstash Redis**.
- `RATE_LIMIT_FORCE=0` tắt hẳn.

## Deploy

### Node VPS / Docker-ish

```bash
npm run build
# production: ép BYOK (khuyến nghị)
set ALLOW_SERVER_KEY=0
set NODE_ENV=production
npm start
```

### Vercel

- `vercel.json` chốt cứng:
  - **buildCommand:** `npm run build` (Vite FE + esbuild `dist/server.cjs` + copy `knowledge-data`)
  - **outputDirectory:** `dist` (tránh serve nhầm `index.html` dev trỏ `/src/main.tsx`)
  - rewrite `/api/*` → `api/index.ts` (load Express từ `dist/server.cjs`)
- Env trên dashboard:
  - **Khuyến nghị public:** không set `ALLOW_SERVER_KEY`, hoặc `ALLOW_SERVER_KEY=0`; user dùng BYOK.
  - **Cố ý free shared key:** `GEMINI_API_KEY` + `ALLOW_SERVER_KEY=1` + bật Firewall.
- Rate-limit in-app trên Vercel **không đủ** — xem mục Rate limit.
- Dashboard nếu còn override Build/Output thủ công: nên **Clear** để lấy giá trị từ `vercel.json`.

## Bảo mật & privacy (ngắn)

- **Đừng** commit `.env` / `.env.local`.
- BYOK lưu **localStorage** khi bấm Lưu (ghi nhớ trên máy); bấm Xóa để gỡ. Máy dùng chung / XSS có thể lộ key.
- Ngày giờ sinh + lá số + câu hỏi được gửi lên **Google Gemini** khi gọi AI.
- Public mà bật `ALLOW_SERVER_KEY=1` = ai cũng có thể đốt quota Gemini của bạn.

## Kiểm tra chất lượng

```bash
npm run lint
npm test
npm run build
```

Smoke checklist từng bước: [`docs/SMOKE_CHECKLIST.md`](docs/SMOKE_CHECKLIST.md).

## Kiến trúc nhanh

```
src/App.tsx          UI
src/utils/tuvi.ts    An lá số (iztro + TZ)
src/hooks/useAI.ts   Gọi /api/*
src/server/routes/   interpret | chat
src/server/*         guards, rate limit, Gemini, star hallucination guard
server.ts            Entry Node
api/index.ts         Entry Vercel
```

## License / nguồn

Private app build; thư viện: iztro, Gemini, React, Express, v.v. theo `package.json`.
