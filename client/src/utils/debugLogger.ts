import { GameState, PlayCardPayload } from '../types';

export type DebugEvent =
  | { kind: 'play'; payload: PlayCardPayload; cardName?: string; damage?: number }
  | { kind: 'turn'; playerId: string }
  | { kind: 'error'; message: string }
  | { kind: 'info'; message: string };

export const formatDebug = (event: DebugEvent): string => {
  switch (event.kind) {
    case 'play':
      return `PLAY ${event.payload.playerId} -> ${event.payload.targetId} card:${event.payload.cardId}`;
    case 'turn':
      return `TURN now ${event.playerId}`;
    case 'error':
      return `ERROR ${event.message}`;
    case 'info':
      return `INFO ${event.message}`;
    default:
      return 'unknown';
  }
};

export const logDebug = (event: DebugEvent, sink?: (message: string) => void) => {
  const msg = formatDebug(event);
  console.debug(msg, event);
  sink?.(msg);
};

export const logState = (state: GameState, label = 'STATE') => {
  console.debug(label, JSON.stringify(state, null, 2));
};
