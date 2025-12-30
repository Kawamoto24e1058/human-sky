#!/bin/bash

echo "🔧 クリーン再起動スクリプト"
echo "=============================="

# ステップ1: 既存プロセスを停止
echo "【ステップ 1】既存プロセスを停止中..."
lsof -ti:3001 | xargs -r kill -9 2>/dev/null || true
lsof -ti:5173 | xargs -r kill -9 2>/dev/null || true
pkill -9 tsx 2>/dev/null || true
pkill -9 vite 2>/dev/null || true
sleep 2
echo "✅ プロセス停止完了"

# ステップ2: ポート確認
echo ""
echo "【ステップ 2】ポート状態を確認中..."
if lsof -ti:3001 > /dev/null 2>&1; then
  echo "❌ ポート 3001 がまだ使用中です"
  exit 1
fi
if lsof -ti:5173 > /dev/null 2>&1; then
  echo "❌ ポート 5173 がまだ使用中です"
  exit 1
fi
echo "✅ ポート 3001 と 5173 は空いています"

# ステップ3: キャッシュをクリア
echo ""
echo "【ステップ 3】キャッシュをクリア中..."
rm -rf /workspaces/human-sky/client/node_modules/.vite 2>/dev/null || true
rm -rf /workspaces/human-sky/client/dist 2>/dev/null || true
rm -rf /workspaces/human-sky/server/dist 2>/dev/null || true
echo "✅ キャッシュクリア完了"

echo ""
echo "=============================="
echo "✅ 準備完了！以下のコマンドで起動してください："
echo ""
echo "  ターミナル1（サーバー）:"
echo "  cd /workspaces/human-sky/server && npm run start:clean"
echo ""
echo "  ターミナル2（クライアント）:"
echo "  cd /workspaces/human-sky/client && npm run dev:clean"
echo ""
