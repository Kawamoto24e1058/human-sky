export type CardType = 'weapon' | 'armor' | 'item' | 'miracle' | 'attack' | 'defense' | 'heal' | 'buff';
export type CardCategory = 'weapon' | 'armor' | 'miracle' | 'item';
export type Element = 'physical' | 'fire' | 'water' | 'earth' | 'wind' | 'thunder' | 'light' | 'dark' | 'none';
export type Phase = 'select' | 'battle' | 'result';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  category?: CardCategory;
  value: number;
  cost?: number;
  element: Element;
  description?: string;
  // AI生成カード用の追加属性（オプショナル）
  attack?: number;
  defense?: number;
  effect?: string;
}

export interface Player {
  id: string;
  name: string;
  hp: number;
  mp: number;
  hand: Card[];
  equipment: Card[];
  isTurn: boolean;
  // Optional fields used by UI
  statusEffects?: string[];
  money?: number;
}

export interface GameLog {
  id: string;
  message: string;
  timestamp: number;
}

export interface GameState {
  players: Player[];
  currentTurnIndex: number;
  phase: Phase;
  gameLog: GameLog[];
}

export interface PlayCardPayload {
  roomId: string;
  playerId: string;
  targetId: string;
  cardId: string;
}
