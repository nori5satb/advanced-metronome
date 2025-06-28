import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  build: {
    // バンドル最適化
    rollupOptions: {
      output: {
        manualChunks: {
          // ベンダーライブラリを分離
          vendor: ['react', 'react-dom'],
          // メトロノーム関連を分離
          metronome: [
            './app/lib/metronome.ts',
            './app/lib/metronome-context.tsx',
            './app/components/metronome/MetronomeControls.tsx',
            './app/components/metronome/MetronomeDisplay.tsx'
          ],
          // データ管理関連を分離
          data: [
            './app/lib/songs.ts',
            './app/lib/db.ts',
            './app/lib/practice-sessions.ts'
          ]
        }
      }
    },
    // 圧縮設定（esbuildを使用）
    minify: 'esbuild',
    // チャンクサイズ警告の調整
    chunkSizeWarningLimit: 1000,
  },
  // 開発サーバー最適化
  server: {
    hmr: true,
  },
  // CSS最適化
  css: {
    postcss: {
      plugins: [
        // PurgeCSS相当の最適化はTailwindCSSが自動で行う
      ],
    },
  },
});
