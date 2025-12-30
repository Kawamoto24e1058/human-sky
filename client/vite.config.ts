import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  server: {
    host: '0.0.0.0',  // GitHub Codespaces対応
    port: 5173,
    strictPort: true,   // ポート変更を禁止（Codespacesの5173固定に合わせる）
    fs: {
      allow: ['..']
    },
    // HMR安定化設定
    hmr: {
      overlay: false,  // エラー時のオーバーレイを無効化（フリーズ防止）
      // CodespacesではHTTPS + 443経由のHMRクライアントが安定
      clientPort: 443,
      timeout: 30000  // タイムアウトを30秒に延長
    },
    // Codespacesでのプロキシ設定（socket.ioをバックエンドに転送）
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path,
        logLevel: 'debug',
        timeout: 30000  // プロキシタイムアウト延長
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path,
        timeout: 30000
      }
    },
    // ウォッチ設定の最適化
    watch: {
      usePolling: false,  // ファイル監視をポーリングではなくネイティブに
      ignored: ['**/node_modules/**', '**/.git/**']  // 不要なファイルを監視対象外に
    }
  },
  // ビルド最適化
  optimizeDeps: {
    include: ['socket.io-client', 'debug']  // CommonJS依存関係を事前バンドル
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true  // ESM/CommonJS混在モジュールの変換を有効化
    }
  }
});
