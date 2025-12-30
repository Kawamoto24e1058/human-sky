// Shared typesからエクスポート
export * from '../../../shared/types';

// クライアント専用の型定義
export type {
  Card,
  CardType,
  Element,
  Player,
  GameState,
  GameLog,
  Phase,
  PlayCardPayload
} from '../../../shared/types';
