import { useEffect, useMemo, useRef, useState } from 'react';
import { applyPlayCard } from '../../../shared/rules';
import { Card, GameState, PlayCardPayload, Player } from '../types';
import { SoundManager } from '../audio/SoundManager';
import { useHitFlash } from './useHitFlash';
import { logDebug } from '../utils/debugLogger';
import { ToastItem, useToast } from '../components/Toast';
import { socket as defaultSocket } from '../socket';

interface Params {
  roomId: string;
  selfId: string;
  targetId: string;
  initialState: GameState;
  socket?: typeof defaultSocket;
}

export const useGameLogic = ({ roomId, selfId, targetId, initialState, socket = defaultSocket }: Params) => {
  const [state, setState] = useState<GameState>(initialState);
  const { active: flashActive, trigger: triggerFlash } = useHitFlash();
  const { toasts, push, remove } = useToast();
  const soundRef = useRef(new SoundManager());
  const prevHp = useRef<number | null>(null);
  const prevRivalHp = useRef<number | null>(null);
  const prevTurn = useRef<number>(initialState.currentTurnIndex);
  
  // 初期状態から固定のプレイヤー名を取得（無限ループ防止）
  const playerNameRef = useRef(initialState.players.find((p: Player) => p.id === selfId)?.name ?? 'You');
  // 現在の roomId/selfId を参照保持（リスナーは一度だけ登録し、その中で最新値を参照）
  const roomIdRef = useRef(roomId);
  const selfIdRef = useRef(selfId);
  useEffect(() => {
    roomIdRef.current = roomId;
    selfIdRef.current = selfId;
  }, [roomId, selfId]);

  const you = useMemo(() => state.players.find((p: Player) => p.id === selfId), [state.players, selfId]);
  const rival = useMemo(() => state.players.find((p: Player) => p.id === targetId), [state.players, targetId]);

  // ログメッセージ追加関数（useEffect内で使用するため先に定義）
  const addLogSink = (message: string) =>
    setState((s: GameState) => ({ ...s, gameLog: [...s.gameLog, { id: crypto.randomUUID(), message, timestamp: Date.now() }] }));

  // Socketのイベントリスナーは一度だけ登録（マウント時のみ）
  useEffect(() => {
    let isMounted = true;

    const handleConnect = () => {
      if (!isMounted) return;
      console.log('[useGameLogic] 🔌 Socket connected, joining room:', {
        socketId: socket.id,
        roomId: roomIdRef.current,
        selfId: selfIdRef.current,
        timestamp: new Date().toISOString()
      });
      socket.emit('joinRoom', { 
        roomId: roomIdRef.current, 
        player: { 
          id: selfIdRef.current, 
          name: playerNameRef.current,
          hp: 100,
          mp: 50,
          hand: [],
          equipment: [],
          isTurn: false
        } 
      });
    };

    const handleState = (next: GameState) => {
      if (!isMounted) return;
      console.log('[useGameLogic] 🔄 State update received:', {
        timestamp: new Date().toISOString(),
        roomId: roomIdRef.current,
        selfId: selfIdRef.current,
        playerCount: next?.players?.length || 0,
        players: (next?.players || []).map((p: Player) => ({ 
          id: p?.id, 
          name: p?.name, 
          hp: p?.hp, 
          mp: p?.mp, 
          isTurn: p?.isTurn,
          handSize: p?.hand?.length || 0,
          equipmentSize: p?.equipment?.length || 0,
          isSelf: p?.id === selfIdRef.current
        })),
        turnIndex: next?.currentTurnIndex,
        currentTurnPlayer: next?.players?.[next.currentTurnIndex]?.name
      });
      setState(next || initialState);
      logDebug({ kind: 'info', message: 'state synced' });
    };

    const handleStart = (next: GameState) => {
      if (!isMounted) return;
      console.log('[useGameLogic] 🎮 Game started:', {
        timestamp: new Date().toISOString(),
        roomId: roomIdRef.current,
        playerCount: next?.players?.length || 0,
        players: (next?.players || []).map((p: Player) => ({ 
          id: p?.id, 
          name: p?.name,
          handSize: p?.hand?.length || 0,
          isSelf: p?.id === selfIdRef.current
        }))
      });
      setState(next || initialState);
      addLogSink('マッチ開始');
    };

    const handleError = (message: string) => {
      if (!isMounted) return;
      console.error('[useGameLogic] ⚠️ Server error:', {
        message,
        timestamp: new Date().toISOString()
      });
      addLogSink(`エラー: ${message}`);
      logDebug({ kind: 'error', message });
    };

    const handleConnectError = (err: Error) => {
      if (!isMounted) return;
      console.error('[useGameLogic] 🔌 Connection error:', {
        message: err?.message,
        timestamp: new Date().toISOString()
      });
      handleError(`接続エラー: ${err?.message}`);
    };

    // 既存リスナーを一度だけ削除（重複防止）
    socket.off('connect', handleConnect);
    socket.off('state:update', handleState);
    socket.off('game:start', handleStart);
    socket.off('error:server', handleError);
    socket.off('connect_error', handleConnectError);

    // リスナーを登録
    socket.on('connect', handleConnect);
    socket.on('state:update', handleState);
    socket.on('game:start', handleStart);
    socket.on('error:server', handleError);
    socket.on('connect_error', handleConnectError);

    // 既に接続済みなら即時処理
    if (socket.connected) {
      handleConnect();
    }

    // クリーンアップ：コンポーネントがアンマウントされたら自動で削除
    return () => {
      isMounted = false;
      socket.off('connect', handleConnect);
      socket.off('state:update', handleState);
      socket.off('game:start', handleStart);
      socket.off('error:server', handleError);
      socket.off('connect_error', handleConnectError);
    };
  }, []);  // 空の依存配列で一度だけ実行

  // 自分のHP変化を監視（ダメージ受けた時にフラッシュ＋効果音）
  useEffect(() => {
    if (!you) return;
    if (prevHp.current !== null && you.hp < prevHp.current) {
      const damage = prevHp.current - you.hp;
      console.log('[useGameLogic] 💥 You received damage:', damage);
      soundRef.current.playDamage();
      triggerFlash();
      addLogSink(`${damage}ダメージを受けた！`);
    }
    prevHp.current = you.hp;
  }, [you, triggerFlash]);

  // 相手のHP変化を監視（相手がダメージ受けた時に効果音）
  useEffect(() => {
    if (!rival) return;
    if (prevRivalHp.current !== null && rival.hp < prevRivalHp.current) {
      const damage = prevRivalHp.current - rival.hp;
      console.log('[useGameLogic] 🎯 Rival received damage:', damage);
      soundRef.current.playDamage();
      addLogSink(`${rival.name}に${damage}ダメージ！`);
    }
    prevRivalHp.current = rival.hp;
  }, [rival]);

  useEffect(() => {
    if (state.currentTurnIndex !== prevTurn.current) {
      soundRef.current.playTurn();
      prevTurn.current = state.currentTurnIndex;
    }
  }, [state.currentTurnIndex]);

  const playCard = (card: Card) => {
    if (!you || !rival) return;
    const payload: PlayCardPayload = {
      roomId,
      playerId: you.id,
      targetId,
      cardId: card.id
    };
    
    console.log('[useGameLogic] 🎴 Playing card:', {
      timestamp: new Date().toISOString(),
      cardId: card.id,
      cardName: card.name,
      cardValue: card.value,
      cardElement: card.element,
      fromPlayer: { id: you.id, name: you.name, hp: you.hp, mp: you.mp },
      toPlayer: { id: rival.id, name: rival.name, hp: rival.hp, mp: rival.mp },
      roomId
    });
    
    // ローカルで即座に反映（楽観的更新）
    setState((s: GameState) => applyPlayCard(s, payload));
    soundRef.current.playCard();
    logDebug({ kind: 'play', payload, cardName: card.name });
    
    // サーバーに送信（全員に同期される）
    console.log('[useGameLogic] 📤 Emitting playerAction to server...');
    socket.emit('playerAction', { action: 'playCard', payload });
  };

  const reset = () => setState(initialState);

  const addCardToHand = (card: Card) => {
    console.log('[useGameLogic] ✨ Adding card to hand:', {
      timestamp: new Date().toISOString(),
      cardId: card.id,
      cardName: card.name,
      cardValue: card.value,
      cardElement: card.element,
      cardType: card.type,
      playerId: selfId
    });
    
    setState((s: GameState) => {
      const updatedPlayers = s.players.map((p: Player) =>
        p.id === selfId ? { ...p, hand: [...p.hand, card] } : p
      );
      return { ...s, players: updatedPlayers };
    });
    
    soundRef.current.playCard();
    push(`新しい技『${card.name}』を錬成しました！`);
    addLogSink(`${card.name}（威力${card.value}）を錬成した！`);
    logDebug({ kind: 'info', message: `Card generated: ${card.name}` });
  };

  return {
    state,
    you,
    rival,
    playCard,
    flashActive,
    toasts,
    pushToast: push,
    removeToast: remove,
    addLogSink,
    addCardToHand,
    reset
  };
};
