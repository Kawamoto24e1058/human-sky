import { AnimatePresence, motion } from 'framer-motion';
import { SceneProvider, useScene } from './contexts/SceneContext';
import { HomeScene } from './components/scenes/HomeScene';
import { LobbyScene } from './components/scenes/LobbyScene';
import { BattleScene } from './components/scenes/BattleScene';
import { ErrorBoundary } from './components/ErrorBoundary';

// シーン管理コンポーネント
function SceneRenderer() {
  const { currentScene } = useScene();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentScene}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {currentScene === 'HOME' && <HomeScene />}
        {currentScene === 'LOBBY' && <LobbyScene />}
        {currentScene === 'BATTLE' && <BattleScene />}
      </motion.div>
    </AnimatePresence>
  );
}

// メインアプリケーション
export default function App() {
  return (
    <ErrorBoundary>
      <SceneProvider>
        <SceneRenderer />
      </SceneProvider>
    </ErrorBoundary>
  );
}
