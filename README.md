# human-sky

ゴッドフィールド風カードバトルゲーム - Glassmorphic UI with Socket.IO Multiplayer

## 特徴

- **Glassmorphismデザイン**: 最新のガラス表現UIとネオンエフェクト
- **リアルタイム対戦**: Socket.IOによる複数人対戦サポート
- **アニメーション**: Framer Motionによる滑らかなカード動作
- **効果音**: Web Audio APIによるプロシージャル音声生成
- **GitHub Codespaces対応**: ポートフォワーディング自動検出

## プロジェクト構造

```
├── client/          # Vite + React + TypeScript + Tailwind CSS
├── server/          # Node.js + Socket.IO + TypeScript
├── shared/          # 共有型定義とゲームロジック
└── .devcontainer/   # GitHub Codespaces設定
```

## 開発環境セットアップ

### GitHub Codespacesで実行（推奨）

1. このリポジトリをCodespacesで開く
2. **重要**: ポート3001を**Public**に設定
   - VS Code下部の「ポート」タブを開く
   - ポート3001を右クリック → 「ポートの表示範囲」 → 「Public」
3. ブラウザでフロントエンドにアクセス（自動的にポート5173が開きます）

### ローカル開発

#### サーバー起動

```bash
cd server
npm install
npm start  # http://localhost:3001
```

#### クライアント起動

```bash
cd client
npm install
npm run dev  # http://localhost:5173
```

## 技術スタック

### フロントエンド
- **React 18** - UIライブラリ
- **TypeScript** - 型安全性
- **Vite** - 高速ビルドツール
- **Tailwind CSS** - ユーティリティファーストCSS
- **Framer Motion** - アニメーションライブラリ
- **Socket.IO Client** - リアルタイム通信

### バックエンド
- **Node.js** - サーバーランタイム
- **Socket.IO** - WebSocket通信
- **tsx** - TypeScript実行環境

### 共有
- **TypeScript** - 型定義の共有
- **ESM** - モジュールシステム

## ゲーム機能

- ✅ カードを使った攻撃システム
- ✅ 属性相性によるダメージ補正（1.5倍）
- ✅ 防具による軽減
- ✅ ステータス異常（25%確率）
- ✅ HPシェイクアニメーション
- ✅ フライングカード演出
- ✅ 効果音（ダメージ/カード/ターン）
- ✅ 被ダメージ時の赤フラッシュ
- ✅ トースト通知
- ✅ デバッグログパネル

## Socket.IO接続について

クライアントは自動的に環境を検出します：

- **Codespaces**: `https://<codespace>-5173.app.github.dev` → `https://<codespace>-3001.app.github.dev`
- **ローカル**: `http://localhost:5173` → `http://localhost:3001`

接続URLは現在のブラウザURLから動的に生成され、ポート番号のみを3001に置換します。

## トラブルシューティング

### WebSocket接続エラー

1. **ポート3001がPublicか確認**
   - Codespacesの「ポート」タブで確認
   
2. **サーバーが起動しているか確認**
   ```bash
   curl http://localhost:3001/health
   # {"ok":true} が返ればOK
   ```

3. **ブラウザのコンソールでログ確認**
   - F12 → Console
   - `[Socket] ✓ GitHub Codespaces detected` が表示されるはず
   - `[Socket] Connected: <id>` で接続成功

4. **サーバーログ確認**
   ```bash
   tail -f server/server.log
   ```

## ライセンス

MIT
