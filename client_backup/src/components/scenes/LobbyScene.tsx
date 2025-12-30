import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useScene } from '../../contexts/SceneContext';
import { socket } from '../../socket';

type LobbyPlayer = {
  id: string;
  name: string;
  ready: boolean;
  socketId: string;
};

type ChatMessage = {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
};

export const LobbyScene = () => {
  const { goToBattle, goToHome, playerInfo, setRoomId } = useScene();
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lobbyId = `lobby-${playerInfo.gameMode || '1v1'}`;

  useEffect(() => {
    if (!playerInfo.name || !playerInfo.gameMode) {
      goToHome();
      return;
    }

    // ロビーに参加
    socket.emit('lobby:join', {
      lobbyId,
      playerName: playerInfo.name,
      gameMode: playerInfo.gameMode
    });

    // ロビー更新イベント
    const handleLobbyUpdate = (data: { players: LobbyPlayer[]; maxPlayers: number; gameMode: string }) => {
      console.log('[Lobby] Update received:', data);
      setPlayers(data.players);
      setMaxPlayers(data.maxPlayers);
      
      // 自分の Ready 状態を更新
      const me = data.players.find(p => p.name === playerInfo.name);
      if (me) {
        setIsReady(me.ready);
      }
    };

    // チャットメッセージイベント
    const handleMessage = (msg: ChatMessage) => {
      console.log('[Lobby] Message received:', msg);
      setMessages(prev => [...prev, msg]);
    };

    // ゲーム開始イベント
    const handleStartGame = (data: { lobbyId: string; players: LobbyPlayer[]; roomId?: string }) => {
      console.log('[Lobby] Game starting:', data);
      setCountdown(3);
      // サーバーからroomIdが来ていればそれを、無ければlobbyIdを採用
      const battleRoomId = data.roomId || data.lobbyId;
      setRoomId(battleRoomId);
      
      // バトル画面に遷移する前にjoinRoomを呼び出してプレイヤー情報を登録
      socket.emit('joinRoom', {
        roomId: battleRoomId,
        player: {
          id: 'you',
          name: playerInfo.name,
          hp: 100,
          mp: 50,
          hand: [],
          equipment: [],
          isTurn: false,
          statusEffects: []
        }
      });
      
      // カウントダウン後にバトル画面へ
      setTimeout(() => setCountdown(2), 1000);
      setTimeout(() => setCountdown(1), 2000);
      setTimeout(() => {
        setCountdown(null);
        goToBattle();
      }, 3000);
    };

    socket.on('lobby:update', handleLobbyUpdate);
    socket.on('lobby:message', handleMessage);
    socket.on('lobby:startGame', handleStartGame);

    return () => {
      socket.off('lobby:update', handleLobbyUpdate);
      socket.off('lobby:message', handleMessage);
      socket.off('lobby:startGame', handleStartGame);
    };
  }, [playerInfo, lobbyId, goToHome, goToBattle]);

  // チャットを自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReady = () => {
    socket.emit('lobby:ready', {
      lobbyId,
      playerId: playerInfo.name
    });
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      socket.emit('lobby:sendMessage', {
        lobbyId,
        playerId: playerInfo.name,
        playerName: playerInfo.name,
        message: chatInput.trim()
      });
      setChatInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* 背景 */}
      <div className="fixed inset-0 bg-gradient-to-br from-midnight-950 via-midnight-900 to-midnight-800 z-0" />

      {/* カウントダウンオーバーレイ */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-9xl font-black text-neon-blue"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* メインコンテンツ */}
      <div className="relative z-10 min-h-screen px-8 py-12">
        {/* ヘッダー */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                  {playerInfo.gameMode === '1v1' ? '1v1' : '4人乱闘'} ロビー
                </span>
              </h2>
              <p className="text-white/60 mt-2">プレイヤーを待っています... ({players.length} / {maxPlayers})</p>
            </motion.div>

            <motion.button
              onClick={goToHome}
              className="px-6 py-2 rounded-full bg-white/10 border border-white/15 text-sm hover:bg-white/15 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← ホームに戻る
            </motion.button>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: プレイヤーリスト */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xl font-semibold text-white/80 mb-4">参加者</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-panel p-6 rounded-2xl backdrop-blur-xl border-2 ${
                    player.ready
                      ? 'border-neon-blue bg-neon-blue/10'
                      : 'border-white/20 bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        player.ready ? 'bg-neon-blue/20' : 'bg-white/10'
                      }`}>
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">{player.name}</p>
                        <p className="text-sm text-white/60">
                          {player.name === playerInfo.name ? 'あなた' : 'プレイヤー'}
                        </p>
                      </div>
                    </div>
                    {player.ready && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-neon-blue text-2xl"
                      >
                        ✓
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* 空きスロット */}
              {[...Array(maxPlayers - players.length)].map((_, index) => (
                <motion.div
                  key={`empty-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (players.length + index) * 0.1 }}
                  className="glass-panel p-6 rounded-2xl backdrop-blur-xl border-2 border-white/10 bg-white/5 border-dashed"
                >
                  <div className="flex items-center gap-3 opacity-40">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                      ?
                    </div>
                    <div>
                      <p className="text-lg text-white/60">待機中...</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Ready ボタン */}
            <motion.button
              onClick={handleReady}
              disabled={players.length < 2}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                isReady
                  ? 'bg-white/10 border-2 border-white/30 text-white/60'
                  : 'bg-gradient-to-r from-neon-blue to-neon-purple text-white border-2 border-transparent'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              whileHover={{ scale: players.length >= 2 ? 1.02 : 1 }}
              whileTap={{ scale: players.length >= 2 ? 0.98 : 1 }}
              style={{ touchAction: 'manipulation' }}
            >
              {isReady ? '準備完了！ ✓' : '準備完了'}
            </motion.button>
          </div>

          {/* 右側: チャット */}
          <div className="glass-panel p-6 rounded-2xl backdrop-blur-xl border-2 border-white/20 bg-white/5 flex flex-col h-[600px]">
            <h3 className="text-xl font-semibold text-white/80 mb-4">チャット</h3>
            
            {/* メッセージリスト */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg ${
                    msg.playerId === 'system'
                      ? 'bg-white/5 text-white/60 text-center text-sm italic'
                      : msg.playerId === playerInfo.name
                      ? 'bg-neon-blue/20 text-white ml-4'
                      : 'bg-white/10 text-white mr-4'
                  }`}
                >
                  {msg.playerId !== 'system' && (
                    <p className="text-xs text-white/60 mb-1">{msg.playerName}</p>
                  )}
                  <p className="text-sm break-words">{msg.message}</p>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 入力欄 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="メッセージを入力..."
                maxLength={200}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-neon-blue focus:outline-none"
                style={{ touchAction: 'manipulation' }}
              />
              <motion.button
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                className="px-4 py-2 rounded-lg bg-neon-blue text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ touchAction: 'manipulation' }}
              >
                送信
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
