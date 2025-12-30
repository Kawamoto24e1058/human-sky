import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, useMemo, useRef } from 'react';
// import { BackgroundParticles } from '../BackgroundParticles';
import { SkillCutin } from '../SkillCutin';
import { ToastStack } from '../Toast';
import { useGameLogic } from '../../hooks/useGameLogic';
import type { Card, GameState, Player } from '../../types';
import { useScene } from '../../contexts/SceneContext';
import { socket } from '../../socket';

const now = () => Date.now();
// ROOM_IDはシーンコンテキストに保存された値を優先
const FALLBACK_ROOM_ID = 'demo-room';
const LONG_PRESS_DURATION = 500; // 長押し判定時間（ミリ秒）
const DOUBLE_TAP_DELAY = 300; // ダブルタップ判定時間（ミリ秒）

const mockCards: Card[] = [
  {
    id: 'c1',
    name: '烈火の剣',
    type: 'weapon',
    element: 'fire',
    value: 24,
    cost: 4,
    description: '火属性の剣で切りつける'
  },
  {
    id: 'c2',
    name: '蒼き短剣',
    type: 'weapon',
    element: 'water',
    value: 18,
    cost: 3,
    description: '冷たい刃で正確に突く'
  },
  {
    id: 'c3',
    name: '風紋の盾',
    type: 'armor',
    element: 'wind',
    value: 9,
    cost: 0,
    description: '風の加護で衝撃を散らす'
  },
  {
    id: 'c4',
    name: '大地の鎧',
    type: 'armor',
    element: 'earth',
    value: 11,
    cost: 0,
    description: '硬い土の鎧'
  }
];

const initialState: GameState = {
  players: [
    {
      id: 'rival',
      name: 'バルドル',
      hp: 120,
      mp: 40,
      money: 1200,
      hand: [],
      equipment: [mockCards[2]],
      statusEffects: [],
      isTurn: false
    },
    {
      id: 'you',
      name: 'あなた',
      hp: 110,
      mp: 50,
      money: 980,
      hand: [mockCards[0], mockCards[1], mockCards[3]],
      equipment: [mockCards[3]],
      statusEffects: [],
      isTurn: true
    }
  ],
  currentTurnIndex: 1,
  phase: 'select',
  gameLog: [
    { id: 'l1', message: 'バトル開始！', timestamp: now() - 12000 },
    { id: 'l2', message: 'バルドルが守りを固めている…', timestamp: now() - 7000 }
  ]
};

const glass = 'glass-panel rounded-2xl border border-white/10 shadow-2xl';

const statusChip = (text: string) => (
  <span
    key={text}
    className="px-2 py-1 text-xs rounded-full bg-white/10 text-neon-blue border border-white/10"
  >
    {text}
  </span>
);

const hpShakeTransition = {
  duration: 0.5,
  repeat: 0,
  ease: 'easeOut'
};

// カード詳細ポップアップ
function CardDetailPopup({ card, onClose }: { card: Card; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      style={{ touchAction: 'manipulation' }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`${glass} p-6 max-w-sm w-full bg-white/10 border-2 border-neon-blue`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-1">
              {card.type} • {card.element}
            </p>
            <h2 className="text-2xl font-bold text-neon-blue text-neon">{card.name}</h2>
          </div>

          <div className="space-y-2">
            <p className="text-white/90 leading-relaxed">{card.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
            <div className="space-y-1">
              <p className="text-xs text-white/60">攻撃力</p>
              <p className="text-2xl font-bold text-neon-blue">{card.value}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white/60">消費MP</p>
              <p className="text-2xl font-bold text-neon-purple">{card.cost}</p>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold hover:shadow-lg hover:shadow-neon-blue/50 transition"
            style={{ touchAction: 'manipulation' }}
          >
            閉じる
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HPBadge({ hp, playerId, prevHp }: { hp: number; playerId: string; prevHp?: number }) {
  const shouldShake = prevHp !== undefined && hp !== prevHp;

  return (
    <motion.span
      key={shouldShake ? `hp-${playerId}-${hp}-${Date.now()}` : `hp-${playerId}-${hp}`}
      animate={shouldShake ? { x: [0, -6, 6, -6, 6, 0] } : {}}
      transition={hpShakeTransition}
      className="text-lg font-semibold text-neon-blue"
    >
      HP {hp}
    </motion.span>
  );
}

function PlayerPanel({ player, isYou, prevHp }: { player: Player; isYou?: boolean; prevHp?: number }) {
  return (
    <div
      className={`${glass} px-6 py-4 flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/15`}
    >
      <div>
        <p className="text-sm uppercase tracking-wide text-white/60">{isYou ? 'You' : 'Enemy'}</p>
        <p className="text-2xl font-semibold text-neon-blue text-neon">{player.name}</p>
      </div>
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-blue shadow-glow"
          animate={{ width: `${Math.max(player.hp, 0)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className="flex flex-col text-sm text-white/80">
        <HPBadge hp={player.hp} playerId={player.id} prevHp={prevHp} />
        <span className="text-xs text-white/60">MP {player.mp}</span>
        {player.money !== undefined && <span className="text-xs text-white/60">G {player.money}</span>}
      </div>
      <div className="flex gap-2">{(player.statusEffects || []).map(statusChip)}</div>
    </div>
  );
}

// モバイル対応カードビュー（タップで上昇、詳細表示）
function CardView({ 
  card, 
  onPlay, 
  isSelected, 
  onSelect,
  onShowDetail
}: { 
  card: Card; 
  onPlay: (card: Card) => void; 
  isSelected: boolean;
  onSelect: (cardId: string) => void;
  onShowDetail: (card: Card) => void;
}) {
  const longPressTimer = useRef<number | null>(null);
  const lastTapTime = useRef<number>(0);

  const handleTouchStart = () => {
    // 長押し検出
    longPressTimer.current = setTimeout(() => {
      onShowDetail(card);
      navigator.vibrate?.(50); // 触覚フィードバック（対応デバイスのみ）
    }, LONG_PRESS_DURATION);
  };

  const handleTouchEnd = () => {
    // 長押しタイマーをキャンセル
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;

    // ダブルタップ検出
    if (timeSinceLastTap < DOUBLE_TAP_DELAY && timeSinceLastTap > 0) {
      onShowDetail(card);
      lastTapTime.current = 0; // リセット
      return;
    }

    lastTapTime.current = now;

    // 通常のタップ処理
    if (isSelected) {
      onPlay(card); // 発動
    } else {
      onSelect(card.id); // 選択
    }
  };

  return (
    <motion.div
      layout
      animate={{
        y: isSelected ? -20 : 0,
        scale: isSelected ? 1.08 : 1,
        boxShadow: isSelected 
          ? '0 20px 50px rgba(74,240,255,0.4), 0 0 30px rgba(74,240,255,0.3)' 
          : '0 4px 12px rgba(0,0,0,0.3)'
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`${glass} card-shine p-3 md:p-4 w-36 md:w-48 flex-shrink-0 cursor-pointer bg-white/8 border-2 ${
        isSelected ? 'border-neon-blue' : 'border-white/10'
      }`}
      style={{ touchAction: 'manipulation' }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/60 mb-1 md:mb-2">
        {card.type}
      </p>
      <h3 className="text-sm md:text-lg font-semibold text-neon-blue text-neon truncate">
        {card.name}
      </h3>
      <p className="text-xs md:text-sm text-white/70 mt-1 line-clamp-2 md:line-clamp-none">
        {card.description}
      </p>
      <div className="mt-2 md:mt-3 flex items-center justify-between text-xs md:text-sm">
        <span className="text-white/80 font-semibold">ATK {card.value}</span>
        <span className="text-white/60">MP {card.cost}</span>
      </div>
      <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-white/60">
        Element: {card.element}
      </div>
      
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 pt-2 border-t border-white/20"
        >
          <p className="text-xs text-neon-blue font-semibold text-center">
            タップで使用 • 長押しで詳細
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

function FlyingCard({ card }: { card: Card }) {
  return (
    <AnimatePresence>
      <motion.div
        key={card.id}
        initial={{ opacity: 0, scale: 0.9, y: 80 }}
        animate={{ opacity: 1, scale: 1.1, y: -20 }}
        exit={{ opacity: 0, scale: 0.6, y: -120 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`${glass} fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-6 w-56 text-center card-shine bg-white/10 relative`}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [0.8, 1.2, 1],
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'easeOut'
          }}
          className="absolute inset-0 rounded-2xl border-2 border-neon-blue blur-sm"
        />

        <p className="text-sm text-white/70 relative z-10">{card.name}</p>
        <p className="text-3xl font-semibold text-neon-blue text-neon mt-1 relative z-10">{card.value}</p>
        <p className="text-xs text-white/60 relative z-10">{card.description}</p>
      </motion.div>
    </AnimatePresence>
  );
}

function LogPanel({ logs }: { logs: { id: string; message: string }[] }) {
  return (
    <div className={`${glass} w-80 h-[70vh] p-4 flex flex-col gap-2 overflow-y-auto bg-white/5`}>
      <h4 className="text-sm uppercase tracking-[0.2em] text-white/60">Log</h4>
      {logs.map((log) => (
        <div key={log.id} className="text-sm text-white/80 bg-white/5 rounded-lg px-3 py-2">
          {log.message}
        </div>
      ))}
    </div>
  );
}

// 相手のコンパクトステータス（モバイル上部用）
function OpponentCompact({ player, prevHp }: { player: Player; prevHp?: number }) {
  const initial = player.name?.charAt(0) || '敵';
  const hpPercent = Math.max(0, Math.min(100, player.hp));
  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md"
      animate={player.isTurn ? { boxShadow: ['0 0 0 rgba(74,240,255,0.0)', '0 0 16px rgba(74,240,255,0.6)', '0 0 0 rgba(74,240,255,0.0)'] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-xs font-semibold border ${player.isTurn ? 'border-neon-blue' : 'border-white/20'}`}>
        {initial}
      </div>
      <div className="w-28">
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-neon-blue to-neon-purple"
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-white/60">
          <span className="font-semibold text-white/80">HP {player.hp}</span>
          <span>MP {player.mp}</span>
        </div>
      </div>
    </motion.div>
  );
}

// 個別プレイヤーセクション（パルスアニメーション付き）
function PlayerSection({ 
  player, 
  isActive, 
  isYou, 
  prevHp, 
  onPlayCard,
  selectedCardId,
  onSelectCard,
  onShowCardDetail
}: { 
  player: Player; 
  isActive: boolean; 
  isYou: boolean; 
  prevHp?: number;
  onPlayCard?: (card: Card) => void;
  selectedCardId?: string;
  onSelectCard?: (cardId: string) => void;
  onShowCardDetail?: (card: Card) => void;
}) {
  return (
    <motion.div
      animate={
        isActive
          ? {
              borderColor: [
                'rgba(74, 240, 255, 0.2)',
                'rgba(74, 240, 255, 1)',
                'rgba(74, 240, 255, 0.2)'
              ],
              boxShadow: [
                '0 0 20px rgba(74, 240, 255, 0.3)',
                '0 0 40px rgba(74, 240, 255, 0.8)',
                '0 0 20px rgba(74, 240, 255, 0.3)'
              ]
            }
          : {}
      }
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      className={`${glass} p-4 flex flex-col gap-4 bg-white/5 border-2 ${
        isActive ? 'border-neon-blue' : 'border-white/10'
      }`}
    >
      <PlayerPanel player={player} isYou={isYou} prevHp={prevHp} />
      
      {isYou && onPlayCard && onSelectCard && onShowCardDetail && player.hand.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Your Hand</p>
          
          {/* PC: 横並びグリッド */}
          <div className="hidden md:flex md:flex-wrap gap-2">
            {player.hand.map((card: Card) => (
              <CardView 
                key={card.id} 
                card={card} 
                onPlay={onPlayCard} 
                isSelected={selectedCardId === card.id}
                onSelect={onSelectCard}
                onShowDetail={onShowCardDetail}
              />
            ))}
          </div>
          
          {/* モバイル: 横スクロールカルーセル */}
          <div 
            className="md:hidden flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
            style={{ touchAction: 'pan-x' }}
          >
            {player.hand.map((card: Card) => (
              <CardView 
                key={card.id} 
                card={card} 
                onPlay={onPlayCard} 
                isSelected={selectedCardId === card.id}
                onSelect={onSelectCard}
                onShowDetail={onShowCardDetail}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export const BattleScene = () => {
  const { goToLobby, roomId } = useScene();
  const [flyingCard, setFlyingCard] = useState<Card | null>(null);
  const [keyword1, setKeyword1] = useState('');
  const [keyword2, setKeyword2] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prevHpMap, setPrevHpMap] = useState<Record<string, number>>({});
  const [cutinSkillName, setCutinSkillName] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [detailCard, setDetailCard] = useState<Card | null>(null);
  const [vvh, setVvh] = useState<number>(typeof window !== 'undefined' ? (window.visualViewport?.height ?? window.innerHeight) : 0);
  const [inputOverlayActive, setInputOverlayActive] = useState(false);
  const input1Ref = useRef<HTMLInputElement | null>(null);
  const input2Ref = useRef<HTMLInputElement | null>(null);

  const activeRoomId = roomId || FALLBACK_ROOM_ID;
  const { state, you, rival, playCard, flashActive, toasts, removeToast, reset, addCardToHand } = useGameLogic({
    roomId: activeRoomId,
    selfId: 'you',
    targetId: 'rival',
    initialState
  });

  // ゲームデータが読み込まれているか確認（null安全チェック）
  const isLoading = !state?.players || state.players.length === 0;
  const currentPlayer = state?.players?.find((p: Player) => p?.id === 'you');
  const opponents = state?.players?.filter((p: Player) => p?.id !== 'you') || [];

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-midnight-950 via-midnight-900 to-midnight-800">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-neon-blue border-t-neon-purple rounded-full mx-auto mb-4"
          />
          <p className="text-white text-lg">ゲーム読み込み中...</p>
          <p className="text-white/60 text-sm mt-2">サーバーに接続しています</p>
        </div>
      </div>
    );
  }

  // currentPlayerが見つからない場合のエラーハンドリング
  if (!currentPlayer) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-midnight-950 via-midnight-900 to-midnight-800">
        <div className="text-center text-white">
          <p className="text-xl font-bold mb-4">⚠️ プレイヤー情報が見つかりません</p>
          <button
            onClick={() => goToLobby()}
            className="px-6 py-2 bg-neon-blue text-white rounded-lg hover:bg-neon-blue/80 transition"
          >
            ロビーに戻る
          </button>
        </div>
      </div>
    );
  }

  // visualViewportに合わせた高さ調整（キーボード表示時でも崩れない）
  useEffect(() => {
    const updateVvh = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      setVvh(height);
      document.documentElement.style.setProperty('--vvh', `${height}px`);
    };
    updateVvh();
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', updateVvh);
      vv.addEventListener('scroll', updateVvh);
    } else {
      window.addEventListener('resize', updateVvh);
    }
    return () => {
      const vv2 = window.visualViewport;
      if (vv2) {
        vv2.removeEventListener('resize', updateVvh);
        vv2.removeEventListener('scroll', updateVvh);
      } else {
        window.removeEventListener('resize', updateVvh);
      }
    };
  }, []);

  // 各プレイヤーのHP変化を追跡
  useEffect(() => {
    (state?.players || []).forEach((player: Player) => {
      if (player?.hp !== undefined && player?.hp !== prevHpMap[player?.id]) {
        setTimeout(() => {
          setPrevHpMap((prev) => ({ ...prev, [player?.id]: player?.hp }));
        }, 600);
      }
    });
  }, [(state?.players || []).map((p: Player) => p?.hp).join(',')]);

  // Socket.IOで他プレイヤーが生成した技を受信
  useEffect(() => {
    const handleSkillReceived = (data: { card: Card; generatedBy: string; timestamp: number }) => {
      console.log('[BattleScene] 🎴 他プレイヤーが技を生成:', {
        cardName: data.card.name,
        generatedBy: data.generatedBy,
        timestamp: new Date(data.timestamp).toLocaleTimeString()
      });

      // デッキにはサーバー側で混入済み。手札追加は行わずログのみ。
    };

    const handleSkillSent = (data: { success: boolean; card: Card }) => {
      console.log('[BattleScene] ✅ 技の配信確認:', {
        success: data.success,
        cardName: data.card.name
      });
    };

    // ===== 重要：既存リスナー削除 → 新規登録（重複防止） =====
    socket.off('skill-received');
    socket.off('skill-sent');
    
    socket.on('skill-received', handleSkillReceived);
    socket.on('skill-sent', handleSkillSent);

    return () => {
      socket.off('skill-received', handleSkillReceived);
      socket.off('skill-sent', handleSkillSent);
    };
  }, []);

  // プレイヤー数を判定してレイアウトを決定
  const playerCount = state?.players?.length || 0;
  const isOneVsOne = playerCount === 2;

  const handlePlay = (card: Card) => {
    setFlyingCard(card);
    setCutinSkillName(card.name);
    playCard(card);
    setSelectedCardId(null); // 使用後は選択解除
    setTimeout(() => setFlyingCard(null), 600);
    setTimeout(() => setCutinSkillName(null), 1500);
  };

  const handleSelectCard = (cardId: string) => {
    setSelectedCardId((prev) => (prev === cardId ? null : cardId));
  };

  const handleShowCardDetail = (card: Card) => {
    setDetailCard(card);
  };

  const handleCloseDetail = () => {
    setDetailCard(null);
  };

  const closeKeyboard = () => {
    try {
      input1Ref.current?.blur();
      input2Ref.current?.blur();
    } catch {}
  };

  const handleGenerateCard = async () => {
    if (!keyword1.trim() || !keyword2.trim()) {
      console.log('[BattleScene] キーワードが未入力です');
      return;
    }

    setIsGenerating(true);
    console.log('[BattleScene] 技の錬成を開始...', { keyword1, keyword2 });
    
    try {
      // サーバーの /api/generate-skill エンドポイントを呼び出し
      // Viteプロキシ経由で window.location.origin を使用
      const apiUrl = `${window.location.origin}/api/generate-skill`;
      
      console.log('[BattleScene] API呼び出し:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `${keyword1}と${keyword2}を組み合わせたゴッドフィールド風の面白い技名と効果を1つJSONで返して。フォーマット: {"name": "技名", "cost": 2-5の数値, "effect": "効果説明", "attack": 0-30の数値, "defense": 0-20の数値}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[BattleScene] APIエラー:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const newCard: Card = data.card;
      
      console.log('[BattleScene] ✅ 技の生成成功:', newCard);
      
      // 自分の手札に追加
      addCardToHand(newCard);
      
      // Socket.IOでルーム内の他プレイヤーに同期
      console.log('[BattleScene] Socket.IOで技を配信:', {
        roomId: activeRoomId,
        cardName: newCard.name,
        generatedBy: 'you'
      });
      
      socket.emit('send-skill', {
        roomId: activeRoomId,
        card: newCard,
        generatedBy: 'you',
        playerId: currentPlayer.id
      });
      
      // 入力欄をクリア
      setKeyword1('');
      setKeyword2('');
      
      console.log('[BattleScene] 技の錬成完了');
    } catch (error) {
      console.error('[BattleScene] ❌ 技の生成に失敗:', error);
      console.error('[BattleScene] エラー詳細:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // エラーメッセージを表示（既存のToastシステムを使用していれば追加可能）
      // pushToast('技の錬成に失敗しました', 'error');
    } finally {
      setIsGenerating(false);
      // 入力完了後にキーボードを閉じて、オーバーレイも閉じる
      closeKeyboard();
      setInputOverlayActive(false);
    }
  };

  return (
    <div className="min-h-screen text-white px-4 py-4 md:px-8 md:py-6 bg-gradient-to-br from-midnight-900 via-midnight-800 to-midnight-900 relative overflow-hidden">
      {/* <BackgroundParticles /> */}

      {currentPlayer?.isTurn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            boxShadow: 'inset 0 0 100px 40px rgba(74, 240, 255, 0.4)',
            border: '2px solid rgba(74, 240, 255, 0.6)'
          }}
        />
      )}

      {flashActive && <div className="fixed inset-0 bg-red-500/25 pointer-events-none animate-pulse z-10" />}

      <SkillCutin skillName={cutinSkillName} />

      <div className="max-w-7xl mx-auto relative z-20">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Glassmorphic Arena</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-neon-blue text-neon">ゴッドフィールド風バトル</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`${glass} px-3 py-2 flex items-center gap-2 bg-white/5`}>
              <input
                type="text"
                placeholder="キーワード1"
                value={keyword1}
                onChange={(e) => setKeyword1(e.target.value)}
                className="w-20 md:w-24 px-2 py-1 text-sm bg-white/10 border border-white/20 rounded focus:border-neon-blue focus:outline-none text-white placeholder-white/40"
                maxLength={20}
                disabled={isGenerating}
                style={{ touchAction: 'manipulation' }}
                onFocus={() => setInputOverlayActive(true)}
              />
              <span className="text-white/40 text-sm">+</span>
              <input
                type="text"
                placeholder="キーワード2"
                value={keyword2}
                onChange={(e) => setKeyword2(e.target.value)}
                className="w-20 md:w-24 px-2 py-1 text-sm bg-white/10 border border-white/20 rounded focus:border-neon-blue focus:outline-none text-white placeholder-white/40"
                maxLength={20}
                disabled={isGenerating}
                style={{ touchAction: 'manipulation' }}
                onFocus={() => setInputOverlayActive(true)}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerateCard}
                disabled={isGenerating || !keyword1.trim() || !keyword2.trim()}
                className="px-2 md:px-3 py-1 text-xs md:text-sm rounded bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-neon-blue/50 transition"
                style={{ touchAction: 'manipulation' }}
              >
                {isGenerating ? '錬成中...' : '技を錬成'}
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={reset}
              className="px-3 md:px-4 py-2 text-sm rounded-full bg-white/10 border border-white/15 hover:bg-white/15 transition"
              style={{ touchAction: 'manipulation' }}
            >
              リセット
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={goToLobby}
              className="px-3 md:px-4 py-2 text-sm rounded-full bg-white/10 border border-white/15 hover:bg-white/15 transition"
              style={{ touchAction: 'manipulation' }}
            >
              ロビー
            </motion.button>
          </div>
        </header>

        {/* 1v1レイアウト（縦並び） */}
        {isOneVsOne && opponents[0] && (
          <div className="grid grid-rows-[1fr_auto_1fr] gap-4" style={{ height: `calc(${vvh}px - 140px)` }}>
            {/* 相手エリア（上部） */}
            <PlayerSection
              player={opponents[0]}
              isActive={opponents[0].isTurn}
              isYou={false}
              prevHp={prevHpMap[opponents[0].id]}
            />

            {/* 中央アリーナ */}
            <div className={`${glass} relative h-32 md:h-40 flex items-center justify-center bg-white/5 overflow-hidden`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(74,240,255,0.06),transparent_40%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(192,132,252,0.05),transparent_45%)]" />
              <div className="z-10 text-center">
                <p className="text-xs md:text-sm text-white/70">アリーナ</p>
                <p className="text-3xl md:text-4xl font-semibold text-neon-blue text-neon">VS</p>
                <p className="text-xs md:text-sm text-white/60">カードをクリックして攻撃！</p>
              </div>
              {flyingCard && <FlyingCard card={flyingCard} />}
            </div>

            {/* 自分エリア（下部） */}
            <PlayerSection
              player={currentPlayer}
              isActive={currentPlayer.isTurn}
              isYou={true}
              prevHp={prevHpMap[currentPlayer.id]}
              onPlayCard={handlePlay}
              selectedCardId={selectedCardId ?? undefined}
              onSelectCard={handleSelectCard}
              onShowCardDetail={handleShowCardDetail}
            />
          </div>
        )}

        {/* 複数人レイアウト */}
        {!isOneVsOne && (
          <>
            {/* デスクトップ: Bento Grid 4分割 */}
            <div className="hidden md:grid grid-cols-2 grid-rows-2 gap-4" style={{ height: `calc(${vvh}px - 140px)` }}>
              {/* 左上 - 相手1 */}
              {opponents[0] && (
                <PlayerSection
                  player={opponents[0]}
                  isActive={opponents[0].isTurn}
                  isYou={false}
                  prevHp={prevHpMap[opponents[0].id]}
                />
              )}

              {/* 右上 - 相手2 */}
              {opponents[1] && (
                <PlayerSection
                  player={opponents[1]}
                  isActive={opponents[1].isTurn}
                  isYou={false}
                  prevHp={prevHpMap[opponents[1].id]}
                />
              )}

              {/* 左下 - 相手3 or 自分 */}
              {opponents[2] ? (
                <PlayerSection
                  player={opponents[2]}
                  isActive={opponents[2].isTurn}
                  isYou={false}
                  prevHp={prevHpMap[opponents[2].id]}
                />
              ) : (
                <PlayerSection
                  player={currentPlayer}
                  isActive={currentPlayer.isTurn}
                  isYou={true}
                  prevHp={prevHpMap[currentPlayer.id]}
                  onPlayCard={handlePlay}
                  selectedCardId={selectedCardId ?? undefined}
                  onSelectCard={handleSelectCard}
                  onShowCardDetail={handleShowCardDetail}
                />
              )}

              {/* 右下 - 自分 or 相手3 */}
              {opponents.length >= 3 ? (
                <PlayerSection
                  player={currentPlayer}
                  isActive={currentPlayer.isTurn}
                  isYou={true}
                  prevHp={prevHpMap[currentPlayer.id]}
                  onPlayCard={handlePlay}
                  selectedCardId={selectedCardId ?? undefined}
                  onSelectCard={handleSelectCard}
                  onShowCardDetail={handleShowCardDetail}
                />
              ) : (
                <div className={`${glass} p-4 flex items-center justify-center bg-white/5 border border-white/10`}>
                  <p className="text-white/40 text-sm">空き席</p>
                </div>
              )}
            </div>

            {/* モバイル: 縦型スタック */}
            <div className="md:hidden flex flex-col gap-3" style={{ height: `calc(${vvh}px - 140px)` }}>
              {/* 上部: 相手のコンパクトステータス */}
              <div className="flex items-center justify-center gap-2">
                {opponents.map((p: Player) => (
                  <OpponentCompact key={p.id} player={p} prevHp={prevHpMap[p.id]} />
                ))}
              </div>

              {/* 中央: メインの場（aspect-ratio対応） */}
              <div className={`${glass} relative w-full max-h-[42vh] flex items-center justify-center bg-white/5 overflow-hidden aspect-[16/9] sm:aspect-[4/3]`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(74,240,255,0.06),transparent_40%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(192,132,252,0.05),transparent_45%)]" />
                <div className="z-10 text-center">
                  <p className="text-xs text-white/70">アリーナ</p>
                  <p className="text-3xl font-semibold text-neon-blue text-neon">VS</p>
                  <p className="text-xs text-white/60">カードをタップして攻撃！</p>
                </div>
                {flyingCard && <FlyingCard card={flyingCard} />}
              </div>

              {/* 下部: 自分の情報と手札 */}
              <PlayerSection
                player={currentPlayer}
                isActive={currentPlayer.isTurn}
                isYou={true}
                prevHp={prevHpMap[currentPlayer.id]}
                onPlayCard={handlePlay}
                selectedCardId={selectedCardId ?? undefined}
                onSelectCard={handleSelectCard}
                onShowCardDetail={handleShowCardDetail}
              />
            </div>

            {/* フライングカードは全レイアウト共通で中央に固定 */}
            {flyingCard && (
              <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                <FlyingCard card={flyingCard} />
              </div>
            )}
          </>
        )}

        {/* ログは右端オーバーレイ（モバイルでは非表示） */}
        <div className="hidden lg:block fixed right-4 top-24 z-30">
          <LogPanel logs={state.gameLog} />
        </div>
      </div>

      {/* カード詳細ポップアップ */}
      <AnimatePresence>
        {detailCard && (
          <CardDetailPopup card={detailCard} onClose={handleCloseDetail} />
        )}
      </AnimatePresence>

      {/* 入力フォームオーバーレイ（キーボード表示時） */}
      <AnimatePresence>
        {inputOverlayActive && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed inset-x-0 bottom-0 z-50 p-3 pointer-events-auto"
          >
            <div className={`${glass} bg-white/20 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-3 flex items-center gap-2`}>
              <input
                ref={input1Ref}
                type="text"
                placeholder="キーワード1"
                value={keyword1}
                onChange={(e) => setKeyword1(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded focus:border-neon-blue focus:outline-none text-white placeholder-white/40"
                maxLength={20}
                style={{ touchAction: 'manipulation' }}
              />
              <span className="text-white/40 text-sm">+</span>
              <input
                ref={input2Ref}
                type="text"
                placeholder="キーワード2"
                value={keyword2}
                onChange={(e) => setKeyword2(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-white/10 border border-white/20 rounded focus:border-neon-blue focus:outline-none text-white placeholder-white/40"
                maxLength={20}
                style={{ touchAction: 'manipulation' }}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerateCard}
                disabled={isGenerating || !keyword1.trim() || !keyword2.trim()}
                className="px-3 py-2 text-sm rounded bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ touchAction: 'manipulation' }}
              >
                錬成
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { closeKeyboard(); setInputOverlayActive(false); }}
                className="px-3 py-2 text-sm rounded bg-white/10 border border-white/20 text-white"
                style={{ touchAction: 'manipulation' }}
              >
                閉じる
              </motion.button>
            </div>
            <p className="text-center text-xs text-white/60 mt-2">入力中でもステータスはそのまま見えます</p>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastStack toasts={toasts} onClose={removeToast} />
    </div>
  );
};
