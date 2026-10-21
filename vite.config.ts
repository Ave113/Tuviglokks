import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // Vitest: timeout 20s/test — các test dựng buildChartPromptContext trả chi phí
    // index sách + KN 147 mẩu lần đầu trong worker; mặc định 5s bị flake khi chạy
    // song song với các file nặng (benchmark20, golden 10 lá).
    test: {
      testTimeout: 20_000,
      hookTimeout: 20_000,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
