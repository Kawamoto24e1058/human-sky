import { createContext, useContext, useState, ReactNode } from 'react';

export type SceneType = 'HOME' | 'LOBBY' | 'BATTLE';
export type GameMode = '1v1' | '4way';

interface PlayerInfo {
  name: string;
  gameMode: GameMode | null;
}

interface SceneContextType {
  currentScene: SceneType;
  playerInfo: PlayerInfo;
  roomId: string | null;
  setPlayerInfo: (info: PlayerInfo) => void;
  setRoomId: (id: string | null) => void;
  goToHome: () => void;
  goToLobby: () => void;
  goToBattle: () => void;
  goToScene: (scene: SceneType) => void;
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export const SceneProvider = ({ children }: { children: ReactNode }) => {
  const [currentScene, setCurrentScene] = useState<SceneType>('HOME');
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo>({ name: '', gameMode: null });
  const [roomId, setRoomId] = useState<string | null>(null);

  const value: SceneContextType = {
    currentScene,
    playerInfo,
    roomId,
    setPlayerInfo,
    setRoomId,
    goToHome: () => setCurrentScene('HOME'),
    goToLobby: () => setCurrentScene('LOBBY'),
    goToBattle: () => setCurrentScene('BATTLE'),
    goToScene: (scene: SceneType) => setCurrentScene(scene)
  };

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
};

export const useScene = () => {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within SceneProvider');
  }
  return context;
};
