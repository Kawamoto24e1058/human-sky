import type { Card, GameLog, GameState, PlayCardPayload, Player, Element } from './types';

/**
 * 属性相性マップ（攻撃側 → 有利な防御側属性）
 * 火→土、水→火、土→水、風→土、雷→水、光→闇、闇→光、物理→なし
 */
const ELEMENT_ADVANTAGE: Record<Element, Element | null> = {
  physical: null,  // 物理は相性なし
  fire: 'earth',   // 火は土に強い
  water: 'fire',   // 水は火に強い
  earth: 'water',  // 土は水に強い
  wind: 'earth',   // 風は土に強い
  thunder: 'water',// 雷は水に強い
  light: 'dark',   // 光は闇に強い
  dark: 'light',   // 闇は光に強い
  none: null       // 無属性は相性なし
};

/**
 * 属性相性によるダメージ倍率を計算
 * @param attackElement 攻撃側の属性
 * @param defenseElement 防御側の属性
 * @returns ダメージ倍率（0.5 / 1.0 / 1.5）
 */
export function getElementMultiplier(attackElement: Element, defenseElement: Element): number {
  // 無属性の場合は等倍
  if (attackElement === 'none' || defenseElement === 'none') {
    return 1.0;
  }
  
  // 攻撃側が有利な場合は1.5倍
  if (ELEMENT_ADVANTAGE[attackElement] === defenseElement) {
    return 1.5;
  }
  
  // 防御側が有利な場合は0.5倍
  if (ELEMENT_ADVANTAGE[defenseElement] === attackElement) {
    return 0.5;
  }
  
  // それ以外は等倍
  return 1.0;
}

const STATUS_POOL = ['気絶', '炎上', '凍結', '呪い'];

const randomStatus = (): string => STATUS_POOL[Math.floor(Math.random() * STATUS_POOL.length)];

const getPlayer = (players: Player[], id: string): Player => {
  const player = players.find((p) => p.id === id);
  if (!player) throw new Error('Player not found');
  return player;
};

const totalArmor = (equipment: Card[]): number =>
  equipment.filter((c) => c.type === 'armor').reduce((sum, c) => sum + c.value, 0);

/**
 * 装備品から主要な属性を取得（最初の装備の属性を使用）
 */
const getMainElement = (equipment: Card[]): Element => {
  return equipment.length > 0 ? equipment[0].element : 'none';
};

const applyDamageAndStatus = (defender: Player, damage: number) => {
  const statusApplied = damage > 0 && Math.random() < 0.25 ? randomStatus() : null;
  const hp = Math.max(defender.hp - damage, 0);
  const statusEffects = statusApplied
    ? [...(defender.statusEffects || []), statusApplied]
    : defender.statusEffects;
  return { hp, statusEffects, statusApplied };
};

export const applyPlayCard = (state: GameState, payload: PlayCardPayload): GameState => {
  const attacker = getPlayer(state.players, payload.playerId);
  const defender = getPlayer(state.players, payload.targetId);
  const card = attacker.hand.find((c) => c.id === payload.cardId);
  if (!card) return state;

  const remainingHand = attacker.hand.filter((c) => c.id !== payload.cardId);
  const armorValue = totalArmor(defender.equipment);
  
  // 防御側の主要属性を取得
  const defenderElement = getMainElement(defender.equipment);
  
  // 属性相性によるダメージ倍率を計算
  const elementMultiplier = getElementMultiplier(card.element, defenderElement);
  
  // ダメージ計算：(カード威力 - 防御力) × 属性倍率
  const baseDamage = Math.max(card.value - armorValue, 0);
  const damage = Math.floor(baseDamage * elementMultiplier);

  const { hp, statusEffects, statusApplied } = applyDamageAndStatus(defender, damage);

  const updatedPlayers = state.players.map((p, idx) => {
    if (p.id === attacker.id) {
      return {
        ...p,
        mp: Math.max(p.mp - (card.cost ?? 0), 0),
        hand: remainingHand,
        isTurn: false
      };
    }
    if (p.id === defender.id) {
      return {
        ...p,
        hp,
        statusEffects,
        isTurn: idx === ((state.currentTurnIndex + 1) % state.players.length)
      };
    }
    return { ...p, isTurn: idx === ((state.currentTurnIndex + 1) % state.players.length) };
  });

  // ログメッセージに属性倍率情報を追加
  let logMessage = `${attacker.name}が${defender.name}に${damage}のダメージを与えた`;
  if (elementMultiplier === 1.5) {
    logMessage += '（効果抜群！）';
  } else if (elementMultiplier === 0.5) {
    logMessage += '（効果今一つ...）';
  }
  
  const gameLog: GameLog = {
    id: crypto.randomUUID(),
    message: statusApplied ? `${logMessage}（${statusApplied}付与）` : logMessage,
    timestamp: Date.now()
  };

  return {
    ...state,
    players: updatedPlayers,
    phase: 'battle',
    currentTurnIndex: (state.currentTurnIndex + 1) % state.players.length,
    gameLog: [...state.gameLog, gameLog]
  };
};

export const createInitialGameState = (players: Player[]): GameState => {
  const indexed = players.map((p, idx) => ({ ...p, isTurn: idx === 0 }));
  return {
    players: indexed,
    currentTurnIndex: 0,
    phase: 'select',
    gameLog: []
  };
};
