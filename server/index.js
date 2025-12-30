import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const rooms = new Map();

const upsertPlayer = (roomId, player) => {
  const entry = rooms.get(roomId) || { players: [] };
  const exists = entry.players.find((p) => p.id === player.id);
  const nextPlayers = exists
    ? entry.players.map((p) => (p.id === player.id ? player : p))
    : [...entry.players, player];
  rooms.set(roomId, { players: nextPlayers });
  return nextPlayers;
};

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ roomId, player }) => {
    socket.join(roomId);
    const players = upsertPlayer(roomId, { ...player, socketId: socket.id });
    if (players.length === 2) {
      io.to(roomId).emit('gameStart', { players });
    }
  });

  socket.on('playCard', ({ roomId, card, playerId, targetId, targetHp }) => {
    // Relay the action to the opponent
    socket.to(roomId).emit('opponentPlayed', { card, playerId, targetId, targetHp });

    const nextTurn = targetId;
    io.to(roomId).emit('turnChanged', { nextPlayerId: nextTurn });

    if (typeof targetHp === 'number' && targetHp <= 0) {
      io.to(roomId).emit('gameOver', { winnerId: playerId, loserId: targetId });
    }
  });

  socket.on('disconnecting', () => {
    socket.rooms.forEach((roomId) => {
      if (roomId === socket.id) return;
      io.to(roomId).emit('playerLeft', { socketId: socket.id });
    });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on :${PORT}`);
});
