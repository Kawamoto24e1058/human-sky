import { motion } from 'framer-motion';
import { useState } from 'react';
import { useScene } from '../../contexts/SceneContext';

export const HomeScene = () => {
  const { goToLobby, setPlayerInfo } = useScene();
  const [playerName, setPlayerName] = useState('');

  const handleStartGame = (mode: '1v1' | '4way') => {
    if (playerName.trim()) {
      setPlayerInfo({ name: playerName.trim(), gameMode: mode });
      setTimeout(() => goToLobby(), 300);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' }
    },
    hover: {
      scale: 1.05,
      boxShadow: '0 0 40px rgba(74, 240, 255, 0.6), inset 0 0 20px rgba(74, 240, 255, 0.2)',
      transition: { duration: 0.3 }
    },
    tap: { scale: 0.95 }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* 背景グラデーション */}
      <div className="fixed inset-0 bg-gradient-to-br from-midnight-950 via-midnight-900 to-midnight-800 z-0" />

      {/* 背景装飾 - 宇宙的な光 */}
      <motion.div
        className="fixed inset-0 z-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        {/* 左上の大きな光 */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial from-neon-blue/10 to-transparent rounded-full blur-3xl" />

        {/* 右下の大きな光 */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-neon-purple/10 to-transparent rounded-full blur-3xl" />

        {/* 浮遊する小さな光点 */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-neon-blue rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 2
            }}
          />
        ))}
      </motion.div>

      {/* メインコンテンツ */}
      <motion.div
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* タイトル */}
        <motion.div className="text-center mb-16" variants={itemVariants}>
          <motion.h1
            className="text-7xl md:text-8xl font-black mb-4"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="bg-gradient-to-r from-neon-blue via-neon-purple to-neon-blue bg-clip-text text-transparent">
              ゴッドフィールド
            </span>
          </motion.h1>
          <motion.p
            className="text-2xl text-white/70 tracking-[0.3em] font-light"
            variants={itemVariants}
          >
            BATTLE ARENA
          </motion.p>
          <motion.div
            className="h-1 w-48 bg-gradient-to-r from-transparent via-neon-blue to-transparent mx-auto mt-6"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>

        {/* 名前入力フォーム */}
        <motion.div className="mb-16 w-full max-w-md" variants={itemVariants}>
          <label className="block text-sm text-white/60 mb-3 tracking-widest">
            プレイヤー名
          </label>
          <motion.div
            className="relative"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="text"
              placeholder="あなたの名前を入力..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              className="w-full px-6 py-4 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder-white/40 focus:border-neon-blue focus:outline-none focus:bg-white/15 transition-all duration-300 backdrop-blur-xl text-center text-lg"
              style={{ touchAction: 'manipulation' }}
            />
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon-blue/0 via-neon-blue/20 to-neon-blue/0 opacity-0 pointer-events-none"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          {playerName && (
            <motion.p
              className="mt-2 text-sm text-neon-blue text-center"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ✓ {playerName} でプレイします
            </motion.p>
          )}
        </motion.div>

        {/* バトルモード選択カード */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mb-12"
          variants={itemVariants}
        >
          {/* 1v1バトル */}
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleStartGame('1v1')}
            disabled={!playerName.trim()}
            className="group relative disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {/* 背景グラス効果 */}
            <div className="absolute inset-0 rounded-2xl bg-white/10 border-2 border-white/20 backdrop-blur-xl group-hover:bg-white/15 transition-all duration-300" />

            {/* ネオンホバー効果 */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-neon-blue opacity-0 group-hover:opacity-100"
              animate={{ boxShadow: [
                '0 0 0 0 rgba(74, 240, 255, 0.6)',
                '0 0 20px 0 rgba(74, 240, 255, 0.3)'
              ] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* コンテンツ */}
            <div className="relative z-10 p-8 text-center">
              <motion.div
                className="text-5xl mb-4"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                ⚔️
              </motion.div>
              <h3 className="text-3xl font-bold mb-2 text-white group-hover:text-neon-blue transition-colors">
                1v1バトル
              </h3>
              <p className="text-white/60 group-hover:text-white/80 transition-colors">
                1人の強敵と激戦を繰り広げろ
              </p>
              <motion.div
                className="mt-4 h-0.5 w-12 bg-gradient-to-r from-neon-blue to-neon-purple mx-auto group-hover:w-24 transition-all duration-300"
              />
            </div>
          </motion.button>

          {/* 4人乱闘バトル */}
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleStartGame('4way')}
            disabled={!playerName.trim()}
            className="group relative disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {/* 背景グラス効果 */}
            <div className="absolute inset-0 rounded-2xl bg-white/10 border-2 border-white/20 backdrop-blur-xl group-hover:bg-white/15 transition-all duration-300" />

            {/* ネオンホバー効果 */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-neon-purple opacity-0 group-hover:opacity-100"
              animate={{ boxShadow: [
                '0 0 0 0 rgba(192, 132, 252, 0.6)',
                '0 0 20px 0 rgba(192, 132, 252, 0.3)'
              ] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* コンテンツ */}
            <div className="relative z-10 p-8 text-center">
              <motion.div
                className="text-5xl mb-4"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              >
                🎭
              </motion.div>
              <h3 className="text-3xl font-bold mb-2 text-white group-hover:text-neon-purple transition-colors">
                4人乱闘バトル
              </h3>
              <p className="text-white/60 group-hover:text-white/80 transition-colors">
                4人の戦士が入り乱れるカオス
              </p>
              <motion.div
                className="mt-4 h-0.5 w-12 bg-gradient-to-r from-neon-purple to-neon-blue mx-auto group-hover:w-24 transition-all duration-300"
              />
            </div>
          </motion.button>
        </motion.div>

        {/* フッター情報 */}
        <motion.div
          className="text-center text-white/40 text-xs space-y-1"
          variants={itemVariants}
        >
          <p>⚡ リアルタイム multiplayer powered by Socket.IO</p>
          <p>🎨 Glassmorphism Design × Framer Motion</p>
        </motion.div>
      </motion.div>
    </div>
  );
};
