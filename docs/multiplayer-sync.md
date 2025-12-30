# 複数人対戦の同期フロー

## 実装完了した機能

### 1. カードアクションの送信（クライアント → サーバー）

プレイヤーがカードをクリックすると：

```typescript
// client/src/hooks/useGameLogic.ts
const playCard = (card: Card) => {
  const payload: PlayCardPayload = {
    roomId,        // どの部屋か
    playerId,      // 誰が
    targetId,      // 誰に
    cardId         // どのカードを
  };
  
  // ローカルで即座に反映（楽観的更新）
  setState((s) => applyPlayCard(s, payload));
  
  // サーバーに送信
  socket.emit('playerAction', { action: 'playCard', payload });
};
```

### 2. サーバー側の状態計算とブロードキャスト

```typescript
// server/index.ts
socket.on('playerAction', ({ action, payload }) => {
  // 1. ゲーム状態を計算
  room.gameState = GameRules.applyPlayCard(room.gameState, payload);
  
  // 2. 全員にブロードキャスト
  io.to(roomId).emit('state:update', room.gameState);
  
  // 3. 勝敗判定
  if (loser) {
    io.to(roomId).emit('gameOver', { winnerId, loserId });
  }
});
```

### 3. クライアント側での状態同期とアニメーション

```typescript
// client/src/hooks/useGameLogic.ts
socket.on('state:update', (nextState) => {
  // Reactの状態を更新
  setState(nextState);
});

// 自分のHP変化を監視
useEffect(() => {
  if (you.hp < prevHp.current) {
    soundRef.current.playDamage();  // 効果音
    triggerFlash();                 // 赤フラッシュ
    addLogSink(`${damage}ダメージ受けた！`);
  }
}, [you.hp]);

// 相手のHP変化を監視
useEffect(() => {
  if (rival.hp < prevRivalHp.current) {
    soundRef.current.playDamage();
    addLogSink(`${rival.name}に${damage}ダメージ！`);
  }
}, [rival.hp]);
```

### 4. HPバーのアニメーション

```tsx
// client/src/App.tsx
function PlayerPanel({ player, prevHp }) {
  return (
    <motion.div
      className="h-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-blue"
      animate={{ width: `${Math.max(player.hp, 0)}%` }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
  );
}
```

## 動作確認

### コンソールログで確認

**クライアント側（ブラウザConsole）:**
```
[useGameLogic] 📤 Sending playerAction: { card: '烈火の剣', from: 'あなた', to: 'バルドル' }
[useGameLogic] 🔄 State update received: { players: [...], turnIndex: 1 }
[useGameLogic] 🎯 Rival received damage: 24
```

**サーバー側（server.log）:**
```
[Server] 🎮 Player action received: { playerId: 'you', targetId: 'rival', cardId: 'c1' }
[Server] 📊 State updated: { players: [{ id: 'you', hp: 110 }, { id: 'rival', hp: 96 }] }
[Server] 📡 Broadcasted state:update to room: demo-room
```

## 複数人対戦のテスト方法

1. **2つのブラウザウィンドウを開く**
   - ウィンドウ1: プレイヤー1（あなた）
   - ウィンドウ2: プレイヤー2（バルドル）

2. **同じROOM_IDに参加**
   - 現在は`demo-room`で固定
   - 両方のウィンドウでページをロード

3. **片方でカードをクリック**
   - プレイヤー1がカードを使用
   - 両方のウィンドウで状態が更新される
   - ダメージ、HP減少、ログが同期される

4. **確認ポイント:**
   - ✅ 相手のHPバーが減る
   - ✅ ログに「〇〇に△△ダメージ！」と表示
   - ✅ 効果音が鳴る
   - ✅ ターンが切り替わる

## トラブルシューティング

### 状態が同期されない場合

1. **サーバーログを確認:**
   ```bash
   tail -f /workspaces/human-sky/server/server.log
   ```
   - `[Server] 📡 Broadcasted state:update` が表示されているか？

2. **ブラウザコンソールを確認:**
   - `[Socket] Connected: <socket-id>` が表示されているか？
   - `[useGameLogic] 🔄 State update received` が表示されているか？

3. **ポート3001がPublicか確認:**
   - VS Codeの「ポート」タブで確認

### HPバーがアニメーションしない

- Framer Motionの`animate`プロパティが正しく設定されているか確認
- `prevHp`が正しく渡されているか確認

## 技術詳細

### 楽観的更新（Optimistic Update）

クライアント側で即座に状態を更新し、サーバーからの応答を待たずにUIを更新します。これにより遅延を感じさせません。

```typescript
// 即座にローカルで反映
setState((s) => applyPlayCard(s, payload));

// その後サーバーに送信
socket.emit('playerAction', { action: 'playCard', payload });

// サーバーから正式な状態を受け取る
socket.on('state:update', (authoritative) => setState(authoritative));
```

### ブロードキャスト vs Emit

- `socket.emit()`: 特定のクライアントにのみ送信
- `io.to(roomId).emit()`: ルーム内の全員にブロードキャスト（送信者含む）
- `socket.to(roomId).emit()`: ルーム内の全員（送信者を除く）

現在の実装では`io.to(roomId).emit()`を使用しているため、カードを使ったプレイヤーも含めて全員に状態が送られます。
