import { createServer } from 'http';
import { Server } from 'socket.io';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as GameRulesModule from '../shared/rules';
import * as CardMasterModule from '../shared/cardMaster';
import * as CardsModule from '../shared/cards';
import type { GameState, PlayCardPayload, Player, Card } from '../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ESM/CommonJS interop helper
const GameRules = GameRulesModule;
const CardMaster = CardMasterModule;
const Cards = CardsModule;

// Render.com などのホスティング向けに環境変数 PORT を使用
const PORT = Number(process.env.PORT) || 10000;

console.log('[Server] 🚀 Starting server...');
console.log('[Server] Port:', PORT);
console.log('[Server] Environment:', process.env.NODE_ENV || 'development');
console.log('[Server] 🔍 GameRules type:', typeof GameRules);
console.log('[Server] 🔍 GameRules keys:', GameRules ? Object.keys(GameRules) : 'undefined');

const httpServer = createServer(async (req, res) => {
  // リクエストのOriginヘッダを取得
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || '';
  
  // CORSを許可するオリジンを確認
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];
  
  // GitHub Codespacesの動的ドメイン対応
  const isCodespacesOrigin = origin.includes('app.github.dev');
  const isAllowedOrigin = allowedOrigins.includes(origin);
  
  if (isCodespacesOrigin || isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // キャッシュ対策
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // OPTIONSリクエストへの対応（プリフライト）
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Content-Type': 'text/plain' });
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // AI技生成エンドポイント
  if (req.url === '/api/generate-skill' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { prompt } = JSON.parse(body);
        
        // OpenAI API呼び出し（APIキーは環境変数から取得）
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
        if (!OPENAI_API_KEY) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'OpenAI API key not configured' }));
          return;
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'あなたはゴッドフィールド風のカードゲームの技を生成するAIです。面白くて強力な技名と効果を日本語で作成してください。'
              },
              {
                role: 'user',
                content: prompt || 'ゴッドフィールド風の面白い技名と効果を1つJSONで返して。フォーマット: {"name": "技名", "cost": 2-5の数値, "effect": "効果説明", "attack": 0-30の数値, "defense": 0-20の数値}'
              }
            ],
            temperature: 0.9,
            max_tokens: 200
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        
        // JSON抽出（GPTが余計なテキストを返す場合に対応）
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Invalid JSON response from AI');
        }
        
        const skillData = JSON.parse(jsonMatch[0]);
        
        // Card型に整形（必須フィールドにデフォルトを補完）
        const baseAttack = Math.max(0, Math.min(30, skillData.attack || 0));
        const baseDefense = Math.max(0, Math.min(20, skillData.defense || 0));
        const baseCost = Math.max(1, Math.min(5, skillData.cost || 3));
        const value = Math.max(1, Math.min(50, baseAttack + baseDefense + baseCost * 2));
        const card: Card = {
          id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: skillData.name || '錬成されし技',
          type: 'miracle',
          category: 'miracle',
          value,
          cost: baseCost,
          element: 'none',
          description: skillData.effect || '神秘的な効果を発動する',
          effect: skillData.effect || '神秘的な効果を発動する',
          attack: baseAttack,
          defense: baseDefense
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ card }));
      } catch (error) {
        console.error('[Server] Error generating skill:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Failed to generate skill',
          details: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    });
    return;
  }

  // 静的ファイル配信（SPA対応）
  try {
    // クライアントのdistディレクトリパス（コンパイル後はserver/dist/server/index.jsから見る）
    const clientDistPath = join(__dirname, '../../../client/dist');
    
    // URLパスからファイルパスを取得
    let filePath = join(clientDistPath, req.url === '/' ? 'index.html' : req.url!);
    
    // ファイルの存在確認とMIMEタイプの設定
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    
    const ext = extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    try {
      const content = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (fileErr) {
      // ファイルが見つからない場合はSPAなのでindex.htmlを返す
      const indexPath = join(clientDistPath, 'index.html');
      const indexContent = await readFile(indexPath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(indexContent);
    }
  } catch (error) {
    console.error('[Server] Static file error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

// GitHub Codespaces環境に特化したSocket.IO設定
const io = new Server(httpServer, {
  path: '/socket.io/',
  cors: {
    // すべてのオリジンを許可（最大互換性 / Render公開対応）
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600
  },
  // EIO3との互換性を最大化
  allowEIO3: true,
  // Polling と WebSocket の両方を許可（Polling を優先）
  transports: ['polling', 'websocket'],
  // 接続の安定性向上
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  // 最大接続数制限を緩和
  maxHttpBufferSize: 1e6,
  allowUpgrades: true,
  perMessageDeflate: false,
  // Codespacesプロキシ対応
  serveClient: false
});

console.log('[Server] ✅ Socket.IO initialized with maximum compatibility');
console.log('[Server] - path: /socket.io/');
console.log('[Server] - CORS: origin=* (all origins allowed)');
console.log('[Server] - credentials: true');
console.log('[Server] - Transports: [polling, websocket] (polling first)');
console.log('[Server] - EIO3 compatibility: enabled');
console.log('[Server] - allowUpgrades: true (can upgrade from polling to websocket)');
console.log('[Server] - Port:', PORT);

type RoomState = {
  gameState: GameState;
  started: boolean;
  deck: Card[];  // 山札
  discardPile: Card[];  // 捨て札
};

type LobbyPlayer = {
  id: string;
  name: string;
  ready: boolean;
  socketId: string;
};

type LobbyRoom = {
  id: string;
  gameMode: '1v1' | '4way';
  players: LobbyPlayer[];
  maxPlayers: number;
  messages: { id: string; playerId: string; playerName: string; message: string; timestamp: number }[];
};

const rooms = new Map<string, RoomState>();
const lobbies = new Map<string, LobbyRoom>();

// ===== マッチング機能: 待機中プレイヤー管理 =====
interface WaitingPlayer {
  socketId: string;
  playerId: string;
  playerName: string;
  timestamp: number;
}

const waitingPlayers: WaitingPlayer[] = [];

/**
 * マッチング: 2人揃ったら自動でルームを生成
 */
function tryMatchmaking(): void {
  if (waitingPlayers.length >= 2) {
    const player1 = waitingPlayers.shift()!;
    const player2 = waitingPlayers.shift()!;
    
    const roomId = `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('[Server] 🎮 Matchmaking success! Creating room:', {
      roomId,
      player1: player1.playerName,
      player2: player2.playerName
    });
    
    // 両プレイヤーをルームに参加させる
    const socket1 = io.sockets.sockets.get(player1.socketId);
    const socket2 = io.sockets.sockets.get(player2.socketId);
    
    if (socket1 && socket2) {
      socket1.join(roomId);
      socket2.join(roomId);
      
      // ゲーム状態を初期化（初期ドロー5枚含む）
      const players: Player[] = [
        { id: player1.playerId, name: player1.playerName, hp: 100, mp: 50, hand: [], equipment: [], isTurn: true },
        { id: player2.playerId, name: player2.playerName, hp: 100, mp: 50, hand: [], equipment: [], isTurn: false }
      ];
      
      const gameState = GameRules.createInitialGameState(players);
      const initialDeck = Cards.createDeck ? Cards.createDeck(60) : CardMaster.createDeck(60);
      
      // 各プレイヤーに初期手札5枚をドロー
      const room: RoomState = {
        gameState,
        started: true,
        deck: initialDeck,
        discardPile: []
      };
      
      rooms.set(roomId, room);
      
      // 初期ドロー処理
      room.gameState.players = room.gameState.players.map(player => {
        const initialHand = drawCards(roomId, 5);
        console.log('[Server] 🎴 Initial hand dealt to:', player.name, '- Cards:', initialHand.length);
        return { ...player, hand: initialHand };
      });
      
      rooms.set(roomId, room);
      
      // 両プレイヤーに通知
      io.to(roomId).emit('game:matched', { roomId, gameState: room.gameState });
      io.to(roomId).emit('game:start', room.gameState);
      io.to(roomId).emit('state:update', room.gameState);
      
      console.log('[Server] ✓ Match complete:', roomId);
    }
  }
}

/**
 * 山札からカードをドローする（null/undefined安全版）
 * @param roomId ルームID
 * @param count ドロー枚数
 * @returns ドローしたカードの配列
 */
const drawCards = (roomId: string, count: number): Card[] => {
  const room = rooms.get(roomId);
  if (!room) {
    console.log('[Server] ⚠️ Room not found for draw:', roomId);
    return [];
  }

  // デッキと捨て札の初期化チェック
  if (!Array.isArray(room.deck)) {
    console.error('[Server] ❌ Deck is not an array, initializing:', roomId);
    room.deck = [];
  }
  if (!Array.isArray(room.discardPile)) {
    console.error('[Server] ❌ Discard pile is not an array, initializing:', roomId);
    room.discardPile = [];
  }

  const drawnCards: Card[] = [];
  
  for (let i = 0; i < count; i++) {
    // 山札が空の場合、捨て札をシャッフルして山札に戻す
    if (room.deck.length === 0) {
      if (room.discardPile.length === 0) {
        console.log('[Server] ⚠️ No cards left to draw in room:', roomId);
        break;
      }
      console.log('[Server] 🔄 Reshuffling discard pile into deck:', roomId);
      try {
        room.deck = CardMaster.shuffleDeck([...room.discardPile]);
        room.discardPile = [];
      } catch (error) {
        console.error('[Server] ❌ Error shuffling deck:', error);
        break;
      }
    }

    // 山札の一番上からカードを引く
    const card = room.deck.shift();
    if (card && typeof card === 'object' && card.id) {
      drawnCards.push(card);
    } else {
      console.warn('[Server] ⚠️ Invalid card drawn:', card);
    }
  }

  rooms.set(roomId, room);
  
  console.log('[Server] 🎴 Drew cards:', {
    roomId,
    count: drawnCards.length,
    deckRemaining: room.deck.length
  });

  return drawnCards;
};

/**
 * カードを捨て札に追加
 */
const discardCard = (roomId: string, card: Card): void => {
  const room = rooms.get(roomId);
  if (!room) return;
  
  room.discardPile.push(card);
  rooms.set(roomId, room);
  
  console.log('[Server] 🗑️ Card discarded:', {
    roomId,
    cardName: card.name,
    discardPileSize: room.discardPile.length
  });
};

const upsertPlayer = (roomId: string, player: Player): GameState => {
  const room = rooms.get(roomId);
  
  // プレイヤーデータの検証と初期化
  const validatedPlayer: Player = {
    id: player.id || `player-${Date.now()}`,
    name: player.name || 'Unknown Player',
    hp: player.hp ?? 100,
    mp: player.mp ?? 50,
    hand: Array.isArray(player.hand) ? player.hand : [],
    equipment: Array.isArray(player.equipment) ? player.equipment : [],
    isTurn: player.isTurn ?? false,
    statusEffects: Array.isArray(player.statusEffects) ? player.statusEffects : []
  };
  
  const nextPlayers = room?.gameState.players ?? [];
  const existingIndex = nextPlayers.findIndex((p) => p.id === validatedPlayer.id);
  const updatedPlayers = existingIndex >= 0
    ? nextPlayers.map((p, idx) => (idx === existingIndex ? validatedPlayer : p))
    : [...nextPlayers, validatedPlayer];

  const gameState: GameState = room?.gameState
    ? { ...room.gameState, players: updatedPlayers }
    : GameRules.createInitialGameState(updatedPlayers);

  // ルームが新規作成の場合、デッキも初期化
  if (!room) {
    // cards.ts から50種類のカードを使用（フォールバック付き）
    let initialDeck: Card[] = [];
    try {
      if (Cards.createDeck && typeof Cards.createDeck === 'function') {
        initialDeck = Cards.createDeck(60);
      } else if (Cards.getRandomCards && typeof Cards.getRandomCards === 'function') {
        initialDeck = Cards.getRandomCards(60);
      } else if (CardMaster.createDeck && typeof CardMaster.createDeck === 'function') {
        initialDeck = CardMaster.createDeck(60);
      }
      
      // デッキが空の場合のフォールバック
      if (!Array.isArray(initialDeck) || initialDeck.length === 0) {
        console.warn('[Server] ⚠️ Failed to create deck, using fallback');
        initialDeck = Array.from({ length: 60 }, (_, i) => ({
          id: `fallback-${i}`,
          name: `カード${i + 1}`,
          type: 'attack' as const,
          value: 10,
          element: 'none' as const
        }));
      }
    } catch (error) {
      console.error('[Server] ❌ Error creating deck:', error);
      // エラー時のフォールバック
      initialDeck = Array.from({ length: 60 }, (_, i) => ({
        id: `emergency-${i}`,
        name: `緊急カード${i + 1}`,
        type: 'attack' as const,
        value: 10,
        element: 'none' as const
      }));
    }
    
    rooms.set(roomId, { 
      gameState, 
      started: false,
      deck: initialDeck,
      discardPile: []
    });
    console.log('[Server] 🎴 New deck created for room:', roomId, '- Cards:', initialDeck.length);
  } else {
    rooms.set(roomId, { ...room, gameState });
  }

  return gameState;
};

io.on('connection', (socket) => {
  try {
    const totalConnections = io.sockets.sockets.size;
    console.log('Socket connected:', socket.id);
    console.log('[Server] ✅ New connection:', {
      socketId: socket.id,
      remoteAddress: socket.request?.socket?.remoteAddress,
      transport: socket.conn?.transport?.name,
      timestamp: new Date().toISOString(),
      totalConnections
    });
    
    // 接続時に全ルーム情報をログ出力
    console.log('[Server] 📊 Current rooms status:');
    rooms.forEach((room, roomId) => {
      console.log(`  - Room ${roomId}: ${room.gameState.players.length} players`, {
        players: room.gameState.players.map(p => ({ id: p.id, name: p.name, handSize: p.hand.length })),
        started: room.started,
        deckSize: room.deck.length
      });
    });
  } catch (error) {
    console.error('[Server] ❌ Error in connection handler:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      socketId: socket.id
    });
  }
  
  // 通常のエラー監視（内部パケットフックは使用しない）
  
  socket.on('error', (err) => {
    console.error('[Socket] Error event:', {
      socketId: socket.id,
      error: err,
      message: err?.message
    });
  });
  
  // ===== マッチング要求（待機リストに追加） =====
  socket.on('matchmaking:join', ({ playerId, playerName }: { playerId: string; playerName: string }) => {
    try {
      console.log('[Server] 🎯 Matchmaking join request:', {
        socketId: socket.id,
        playerId,
        playerName
      });
      
      // 既に待機中か確認
      const alreadyWaiting = waitingPlayers.find(p => p.socketId === socket.id || p.playerId === playerId);
      if (alreadyWaiting) {
        console.log('[Server] ⚠️ Player already in matchmaking queue');
        socket.emit('matchmaking:status', { status: 'waiting', position: waitingPlayers.indexOf(alreadyWaiting) + 1 });
        return;
      }
      
      // 待機リストに追加
      waitingPlayers.push({
        socketId: socket.id,
        playerId,
        playerName,
        timestamp: Date.now()
      });
      
      console.log('[Server] ✓ Added to matchmaking queue. Total waiting:', waitingPlayers.length);
      socket.emit('matchmaking:status', { status: 'waiting', position: waitingPlayers.length });
      
      // マッチング試行
      tryMatchmaking();
      
    } catch (error) {
      console.error('[Server] ❌ Error in matchmaking:join:', error);
      socket.emit('error', { message: 'Failed to join matchmaking' });
    }
  });
  
  // ===== マッチングキャンセル =====
  socket.on('matchmaking:cancel', () => {
    const index = waitingPlayers.findIndex(p => p.socketId === socket.id);
    if (index >= 0) {
      const removed = waitingPlayers.splice(index, 1);
      console.log('[Server] 🚫 Matchmaking cancelled:', removed[0].playerName);
      socket.emit('matchmaking:status', { status: 'cancelled' });
    }
  });
  
  // ロビーに参加
  socket.on('lobby:join', ({ lobbyId, playerName, gameMode }: { lobbyId: string; playerName: string; gameMode: '1v1' | '4way' }) => {
    try {
      console.log('[Server] 🏛️ lobby:join:', {
        socketId: socket.id,
        lobbyId,
        playerName,
        gameMode
      });

      if (!lobbyId || !playerName) {
        console.error('[Server] ❌ Invalid lobby:join parameters:', { lobbyId, playerName });
        return;
      }

      socket.join(lobbyId);

      // ロビーが存在しない場合は作成
      if (!lobbies.has(lobbyId)) {
        lobbies.set(lobbyId, {
          id: lobbyId,
          gameMode,
          players: [],
          maxPlayers: gameMode === '1v1' ? 2 : 4,
          messages: []
        });
      }

      const lobby = lobbies.get(lobbyId)!;

    // プレイヤーが既に存在するか確認
    const existingPlayerIndex = lobby.players.findIndex(p => p.id === playerName || p.socketId === socket.id);
    if (existingPlayerIndex >= 0) {
      // 既存プレイヤーの情報を更新
      lobby.players[existingPlayerIndex] = {
        ...lobby.players[existingPlayerIndex],
        socketId: socket.id
      };
    } else {
      // 新しいプレイヤーを追加
      lobby.players.push({
        id: playerName,
        name: playerName,
        ready: false,
        socketId: socket.id
      });
    }

    lobbies.set(lobbyId, lobby);

    // 全員に更新された参加者リストを送信
    io.to(lobbyId).emit('lobby:update', {
      players: lobby.players,
      maxPlayers: lobby.maxPlayers,
      gameMode: lobby.gameMode
    });

    console.log('[Server] ✓ Lobby updated:', {
      lobbyId,
      playerCount: lobby.players.length,
      maxPlayers: lobby.maxPlayers,
      players: lobby.players.map(p => ({ name: p.name, ready: p.ready }))
    });

    // システムメッセージ
    const joinMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      playerId: 'system',
      playerName: 'System',
      message: `${playerName} が参加しました`,
      timestamp: Date.now()
    };
    lobby.messages.push(joinMessage);
    io.to(lobbyId).emit('lobby:message', joinMessage);
    } catch (error) {
      console.error('[Server] ❌ Error in lobby:join:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        socketId: socket.id,
        lobbyId
      });
      socket.emit('error', { message: 'Failed to join lobby', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // 準備完了状態を切り替え
  socket.on('lobby:ready', ({ lobbyId, playerId }: { lobbyId: string; playerId: string }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;

    const player = lobby.players.find(p => p.id === playerId || p.socketId === socket.id);
    if (player) {
      player.ready = !player.ready;
      lobbies.set(lobbyId, lobby);

      console.log('[Server] ✓ Player ready status changed:', {
        lobbyId,
        playerId: player.id,
        ready: player.ready
      });

      // 全員に更新を送信
      io.to(lobbyId).emit('lobby:update', {
        players: lobby.players,
        maxPlayers: lobby.maxPlayers,
        gameMode: lobby.gameMode
      });

      // 全員準備完了または定員に達した場合、ゲーム開始
      const allReady = lobby.players.every(p => p.ready);
      const isFull = lobby.players.length === lobby.maxPlayers;

      if ((allReady && lobby.players.length >= (lobby.gameMode === '1v1' ? 2 : 2)) || isFull) {
        console.log('[Server] 🎮 Starting game:', {
          lobbyId,
          reason: isFull ? 'room full' : 'all ready'
        });

        // 3秒後にゲーム開始
        setTimeout(() => {
          io.to(lobbyId).emit('lobby:startGame', {
            lobbyId,
            players: lobby.players
          });
        }, 3000);
      }
    }
  });

  // チャットメッセージ送信
  socket.on('lobby:sendMessage', ({ lobbyId, playerId, playerName, message }: { lobbyId: string; playerId: string; playerName: string; message: string }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;

    const chatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      playerId,
      playerName,
      message: message.trim(),
      timestamp: Date.now()
    };

    lobby.messages.push(chatMessage);
    // メッセージ履歴を最新50件に制限
    if (lobby.messages.length > 50) {
      lobby.messages = lobby.messages.slice(-50);
    }

    lobbies.set(lobbyId, lobby);

    console.log('[Server] 💬 Chat message:', {
      lobbyId,
      playerName,
      message: message.substring(0, 30)
    });

    // 全員にブロードキャスト
    io.to(lobbyId).emit('lobby:message', chatMessage);
  });

  // AI生成技の同期＋デッキ/手札反映
  socket.on('send-skill', (data: { roomId: string; card: Card; generatedBy: string; playerId?: string }) => {
    try {
      const { roomId, card, generatedBy, playerId } = data;
      const now = Date.now();

      console.log('[Server] 🎴 send-skill received:', {
        roomId,
        cardName: card?.name,
        generatedBy,
        playerId
      });

      if (!roomId || !card) {
        console.error('[Server] ❌ send-skill: Invalid data:', { roomId, card: !!card });
        socket.emit('error', { message: 'Invalid skill data' });
        return;
      }

      const room = rooms.get(roomId);

      if (!room) {
        console.log('[Server] ❌ Room not found for generated skill:', roomId);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // 一意なIDを保証
      const cardWithId: Card = {
        ...card,
        id: card.id || `ai-${now}-${Math.random().toString(36).slice(2, 8)}`
      };

      // 山札に混ぜる（シャッフル）
      room.deck = CardMaster.shuffleDeck([...room.deck, cardWithId]);

      // 生成者の手札に直接追加（プレイヤーIDが送られている場合）
      if (playerId) {
        room.gameState.players = room.gameState.players.map((p) =>
          p.id === playerId ? { ...p, hand: [...p.hand, cardWithId] } : p
        );
      }

      rooms.set(roomId, room);

      console.log('[Server] 🎴 Skill generated & injected:', {
        roomId,
        cardName: cardWithId.name,
        generatedBy,
        addedTo: playerId ? 'hand+deck' : 'deck',
        deckSize: room.deck.length,
        timestamp: now
      });

      // 状態を全員に同期
      io.to(roomId).emit('state:update', room.gameState);

      // 他プレイヤーに通知（手札に直接は加えない）
      socket.to(roomId).emit('skill-received', {
        card: cardWithId,
        generatedBy,
        timestamp: now
      });

      // 送信者への確認
      socket.emit('skill-sent', {
        success: true,
        card: cardWithId,
        deckRemaining: room.deck.length
      });
    } catch (error) {
      console.error('[Server] ❌ Error in send-skill:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        socketId: socket.id,
        data
      });
      socket.emit('error', { message: 'Failed to process skill', details: error instanceof Error ? error.message : String(error) });
    }
  });
  
  socket.on('joinRoom', ({ roomId, player }: { roomId: string; player: Player }) => {
    try {
      console.log('[Server] 🚪 joinRoom event:', {
        socketId: socket.id,
        roomId,
        playerId: player?.id,
        playerName: player?.name,
        timestamp: new Date().toISOString()
      });

      // 入力検証
      if (!roomId) {
        console.error('[Server] ❌ joinRoom: roomId is missing');
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      if (!player || !player.id) {
        console.error('[Server] ❌ joinRoom: Invalid player data:', player);
        socket.emit('error', { message: 'Invalid player data' });
        return;
      }

      socket.join(roomId);
      console.log('[Server] ✓ Player joined room:', {
        roomId,
        playerId: player.id,
        totalPlayersInRoom: io.sockets.adapter.rooms.get(roomId)?.size || 0
      });

      const state = upsertPlayer(roomId, { 
        ...player, 
        hand: player.hand ?? [], 
        equipment: player.equipment ?? [], 
        isTurn: false, 
        mp: player.mp ?? 50, 
        hp: player.hp ?? 100 
      });
      
      const room = rooms.get(roomId);
      if (!room) {
        console.error('[Server] ❌ joinRoom: Room not found after upsert:', roomId);
        socket.emit('error', { message: 'Failed to create/join room' });
        return;
      }

      // 最新の状態を全員に送信（接続確認用）
      console.log('[Server] 📤 Broadcasting state to room:', {
        roomId,
        playerCount: room.gameState.players.length,
        players: room.gameState.players.map(p => ({ id: p.id, name: p.name, handSize: p.hand.length }))
      });
      io.to(roomId).emit('state:update', state);

      // 2人揃ったらゲーム開始
      if (!room.started && room.gameState.players.length >= 2) {
        console.log('[Server] 🎮 Starting game with 2 players in room:', roomId);
        room.started = true;
        room.gameState = GameRules.createInitialGameState(room.gameState.players);
        
        // ゲーム開始時に各プレイヤーに初期手札を配る
        console.log('[Server] 🎴 Dealing initial hands to both players...');
        room.gameState.players = room.gameState.players.map(player => {
          const initialHand = drawCards(roomId, 5);  // 各プレイヤーに5枚配る
          console.log('[Server] ✓ Initial hand dealt to player:', {
            playerId: player.id,
            playerName: player.name,
            cardCount: initialHand.length,
            cards: initialHand.map(c => c.name)
          });
          return {
            ...player,
            hand: initialHand
          };
        });
        
        rooms.set(roomId, room);
        
        console.log('[Server] 🚀 Broadcasting game:start to all players in room:', roomId);
        io.to(roomId).emit('game:start', room.gameState);
        io.to(roomId).emit('state:update', room.gameState);
        
        console.log('[Server] ✅ Game started successfully:', {
          roomId,
          players: room.gameState.players.map(p => ({ 
            id: p.id, 
            name: p.name, 
            handSize: p.hand.length,
            hp: p.hp,
            mp: p.mp
          }))
        });
      }
    } catch (error) {
      console.error('[Server] ❌ Error in joinRoom:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        socketId: socket.id,
        roomId,
        playerId: player?.id
      });
      socket.emit('error', { message: 'Failed to join room', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // カードドロー要求
  socket.on('drawCard', ({ roomId, playerId, count = 1 }: { roomId: string; playerId: string; count?: number }) => {
    try {
      console.log('[Server] 🎴 Draw card request:', {
        roomId,
        playerId,
        count
      });

      if (!roomId || !playerId) {
        console.error('[Server] ❌ drawCard: Invalid parameters:', { roomId, playerId });
        socket.emit('error', { message: 'Invalid draw card parameters' });
        return;
      }

      const room = rooms.get(roomId);
      if (!room) {
        console.log('[Server] ❌ Room not found:', roomId);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // カードをドロー
      const drawnCards = drawCards(roomId, count);
      
      if (drawnCards.length === 0) {
        socket.emit('draw:failed', { 
          message: '山札にカードがありません' 
        });
        return;
      }

      // プレイヤーの手札に追加
      const updatedPlayers = room.gameState.players.map(p => {
        if (p.id === playerId) {
          return {
            ...p,
            hand: [...p.hand, ...drawnCards]
          };
        }
        return p;
      });

      room.gameState = {
      ...room.gameState,
      players: updatedPlayers
    };
    rooms.set(roomId, room);

    // 全員に状態を更新
    io.to(roomId).emit('state:update', room.gameState);
    
    // ドローしたプレイヤーにカード情報を送信
    socket.emit('cards:drawn', {
      cards: drawnCards,
      deckRemaining: room.deck.length
    });

    console.log('[Server] ✅ Cards drawn successfully:', {
      playerId,
      cardCount: drawnCards.length,
      deckRemaining: room.deck.length
    });
    } catch (error) {
      console.error('[Server] ❌ Error in drawCard:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        socketId: socket.id,
        roomId,
        playerId
      });
      socket.emit('error', { message: 'Failed to draw card', details: error instanceof Error ? error.message : String(error) });
    }
  });

  socket.on('playerAction', ({ action, payload }: { action: 'playCard'; payload: PlayCardPayload }) => {
    try {
      if (!payload || !payload.roomId) {
        console.error('[Server] ❌ playerAction: Invalid payload:', payload);
        socket.emit('error', { message: 'Invalid action payload' });
        return;
      }

      const { roomId } = payload;
      const room = rooms.get(roomId);
      if (!room) {
        console.log('[Server] ❌ Room not found:', roomId);
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (action === 'playCard') {
        console.log('[Server] 🃏 playCard received:', {
          socketId: socket.id,
          roomId,
          playerId: payload.playerId,
          cardId: payload.cardId,
          cardName: '[Card name not in payload]',
          targetId: payload.targetId,
          timestamp: new Date().toISOString()
        });

        // 使用されたカードを取得して捨て札に追加
        const player = room.gameState.players.find(p => p.id === payload.playerId);
      const usedCard = player?.hand.find(c => c.id === payload.cardId);
      
      if (usedCard) {
        discardCard(roomId, usedCard);
        console.log('[Server] 🗑️ Card moved to discard pile:', usedCard.name);
      }

      const prevState = JSON.parse(JSON.stringify(room.gameState)); // Deep copy for comparison
      room.gameState = GameRules.applyPlayCard(room.gameState, payload);
      
      // カード使用後、自動的に1枚ドロー
      const currentPlayer = room.gameState.players.find(p => p.id === payload.playerId);
      if (currentPlayer) {
        const drawnCards = drawCards(roomId, 1);
        if (drawnCards.length > 0) {
          room.gameState.players = room.gameState.players.map(p => {
            if (p.id === payload.playerId) {
              return {
                ...p,
                hand: [...p.hand, ...drawnCards]
              };
            }
            return p;
          });
          console.log('[Server] 🎴 Auto-drew 1 card after play:', {
            playerId: payload.playerId,
            drawnCard: drawnCards[0].name
          });
        }
      }
      
      rooms.set(roomId, room);
      
      // HPの変化を追跡
      const playerBefore = prevState.players.find((p: Player) => p.id === payload.targetId);
      const playerAfter = room.gameState.players.find((p: Player) => p.id === payload.targetId);
      
      console.log('[Server] 📊 State updated after card play:', {
        playerId: payload.playerId,
        targetId: payload.targetId,
        targetHpBefore: playerBefore?.hp,
        targetHpAfter: playerAfter?.hp,
        damage: (playerBefore?.hp || 0) - (playerAfter?.hp || 0),
        allPlayersHP: room.gameState.players.map(p => ({ id: p.id, hp: p.hp, mp: p.mp }))
      });
      
      // 全員にブロードキャスト
      io.to(roomId).emit('state:update', room.gameState);
      console.log('[Server] 📡 Broadcasted state:update to room:', {
        roomId,
        playersInRoom: io.sockets.adapter.rooms.get(roomId)?.size || 0
      });
      
      const loser = room.gameState.players.find((p) => p.hp <= 0);
      if (loser) {
        const winner = room.gameState.players.find((p) => p.id !== loser.id);
        console.log('[Server] 🏆 Game Over:', {
          winnerId: winner?.id,
          loserId: loser.id,
          finalHPs: room.gameState.players.map(p => ({ id: p.id, hp: p.hp }))
        });
        io.to(roomId).emit('gameOver', { winnerId: winner?.id, loserId: loser.id });
      }
    }
    } catch (error) {
      console.error('[Server] ❌ Error in playerAction:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        socketId: socket.id,
        action,
        payload
      });
      socket.emit('error', { message: 'Failed to process action', details: error instanceof Error ? error.message : String(error) });
    }
  });

  socket.on('disconnecting', () => {
    console.log('[Server] 👋 Client disconnecting:', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      roomsBeingLeft: Array.from(socket.rooms)
    });
    
    socket.rooms.forEach((roomId) => {
      if (roomId === socket.id) return;
      
      // ロビーから削除
      const lobby = lobbies.get(roomId);
      if (lobby) {
        const playerIndex = lobby.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex >= 0) {
          const playerName = lobby.players[playerIndex].name;
          lobby.players.splice(playerIndex, 1);
          lobbies.set(roomId, lobby);

          console.log('[Server] ℹ️ Player removed from lobby:', {
            lobbyId: roomId,
            playerName,
            remainingPlayers: lobby.players.length
          });

          // システムメッセージ
          const leaveMessage = {
            id: `msg-${Date.now()}-${Math.random()}`,
            playerId: 'system',
            playerName: 'System',
            message: `${playerName} が退出しました`,
            timestamp: Date.now()
          };
          lobby.messages.push(leaveMessage);
          io.to(roomId).emit('lobby:message', leaveMessage);

          // 全員に更新を送信
          io.to(roomId).emit('lobby:update', {
            players: lobby.players,
            maxPlayers: lobby.maxPlayers,
            gameMode: lobby.gameMode
          });

          // ロビーが空になったら削除
          if (lobby.players.length === 0) {
            lobbies.delete(roomId);
            console.log('[Server] 🗑️ Empty lobby removed:', roomId);
          }
        }
      }
      
      console.log('[Server] ℹ️ Notifying room of disconnect:', {
        roomId,
        disconnectedSocketId: socket.id
      });
      io.to(roomId).emit('playerLeft', { socketId: socket.id });
    });
  });
});

const pingUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}/health`;
setInterval(() => {
  fetch(pingUrl).catch(() => {
    // ignore
  });
}, 5 * 60 * 1000);

// すべてのネットワークインターフェースで待機（0.0.0.0）
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is listening on 0.0.0.0:${PORT}`);
  console.log(`[Server] 🌐 Socket.IO server running on 0.0.0.0:${PORT}`);
  console.log('[Server] ✓ Listening on all network interfaces');
  console.log('[Server] ✓ Ready for connections from any origin');
});
