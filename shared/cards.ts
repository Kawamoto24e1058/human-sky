import { Card } from './types';

/**
 * ゴッドフィールド風カードデータベース
 * カテゴリ: 武器(Weapon)、防具(Armor)、奇跡(Miracle)、雑貨(Item)
 */

// ==================== 武器カード (20種類) ====================
const weaponCards: Card[] = [
  { id: 'w01', name: '鉄の剣', value: 15, element: 'physical', type: 'attack', category: 'weapon' },
  { id: 'w02', name: '炎の大剣', value: 25, element: 'fire', type: 'attack', category: 'weapon' },
  { id: 'w03', name: '氷結の槍', value: 22, element: 'water', type: 'attack', category: 'weapon' },
  { id: 'w04', name: '雷鳴のハンマー', value: 28, element: 'thunder', type: 'attack', category: 'weapon' },
  { id: 'w05', name: '風刃の短剣', value: 18, element: 'wind', type: 'attack', category: 'weapon' },
  { id: 'w06', name: '聖なる杖', value: 20, element: 'light', type: 'attack', category: 'weapon' },
  { id: 'w07', name: '闇の鎌', value: 30, element: 'dark', type: 'attack', category: 'weapon' },
  { id: 'w08', name: '大地の斧', value: 26, element: 'earth', type: 'attack', category: 'weapon' },
  { id: 'w09', name: 'ドラゴンスレイヤー', value: 35, element: 'fire', type: 'attack', category: 'weapon' },
  { id: 'w10', name: '魔導銃', value: 24, element: 'thunder', type: 'attack', category: 'weapon' },
  { id: 'w11', name: '妖刀ムラサメ', value: 32, element: 'water', type: 'attack', category: 'weapon' },
  { id: 'w12', name: 'エクスカリバー', value: 40, element: 'light', type: 'attack', category: 'weapon' },
  { id: 'w13', name: '呪いの剣', value: 27, element: 'dark', type: 'attack', category: 'weapon' },
  { id: 'w14', name: '竜巻の弓', value: 21, element: 'wind', type: 'attack', category: 'weapon' },
  { id: 'w15', name: '鋼鉄の槍', value: 19, element: 'physical', type: 'attack', category: 'weapon' },
  { id: 'w16', name: 'マグマソード', value: 29, element: 'fire', type: 'attack', category: 'weapon' },
  { id: 'w17', name: 'クリスタルロッド', value: 23, element: 'water', type: 'attack', category: 'weapon' },
  { id: 'w18', name: 'プラズマブレード', value: 31, element: 'thunder', type: 'attack', category: 'weapon' },
  { id: 'w19', name: '天使の剣', value: 33, element: 'light', type: 'attack', category: 'weapon' },
  { id: 'w20', name: '死神の鎌', value: 38, element: 'dark', type: 'attack', category: 'weapon' },
];

// ==================== 防具カード (15種類) ====================
const armorCards: Card[] = [
  { id: 'a01', name: '革の鎧', value: 8, element: 'physical', type: 'defense', category: 'armor' },
  { id: 'a02', name: '炎の盾', value: 12, element: 'fire', type: 'defense', category: 'armor' },
  { id: 'a03', name: '氷の鎧', value: 11, element: 'water', type: 'defense', category: 'armor' },
  { id: 'a04', name: '雷神の盾', value: 14, element: 'thunder', type: 'defense', category: 'armor' },
  { id: 'a05', name: '風の外套', value: 9, element: 'wind', type: 'defense', category: 'armor' },
  { id: 'a06', name: '聖騎士の鎧', value: 15, element: 'light', type: 'defense', category: 'armor' },
  { id: 'a07', name: '闇の鎧', value: 13, element: 'dark', type: 'defense', category: 'armor' },
  { id: 'a08', name: '大地の盾', value: 16, element: 'earth', type: 'defense', category: 'armor' },
  { id: 'a09', name: 'ドラゴンメイル', value: 18, element: 'fire', type: 'defense', category: 'armor' },
  { id: 'a10', name: 'ミスリルアーマー', value: 17, element: 'physical', type: 'defense', category: 'armor' },
  { id: 'a11', name: 'アイスバリア', value: 14, element: 'water', type: 'defense', category: 'armor' },
  { id: 'a12', name: '雷撃の鎧', value: 15, element: 'thunder', type: 'defense', category: 'armor' },
  { id: 'a13', name: '神聖なる盾', value: 20, element: 'light', type: 'defense', category: 'armor' },
  { id: 'a14', name: '暗黒の外套', value: 12, element: 'dark', type: 'defense', category: 'armor' },
  { id: 'a15', name: '鋼鉄の盾', value: 10, element: 'physical', type: 'defense', category: 'armor' },
];

// ==================== 奇跡カード (10種類) ====================
const miracleCards: Card[] = [
  { id: 'm01', name: 'ヒール', value: 20, element: 'light', type: 'heal', category: 'miracle' },
  { id: 'm02', name: 'リジェネレート', value: 15, element: 'light', type: 'heal', category: 'miracle' },
  { id: 'm03', name: '天使の祝福', value: 30, element: 'light', type: 'heal', category: 'miracle' },
  { id: 'm04', name: '炎の再生', value: 18, element: 'fire', type: 'heal', category: 'miracle' },
  { id: 'm05', name: '水の治癒', value: 22, element: 'water', type: 'heal', category: 'miracle' },
  { id: 'm06', name: '大地の恵み', value: 25, element: 'earth', type: 'heal', category: 'miracle' },
  { id: 'm07', name: '光の癒し', value: 28, element: 'light', type: 'heal', category: 'miracle' },
  { id: 'm08', name: 'フェニックスの涙', value: 35, element: 'fire', type: 'heal', category: 'miracle' },
  { id: 'm09', name: '生命の泉', value: 40, element: 'water', type: 'heal', category: 'miracle' },
  { id: 'm10', name: '復活の奇跡', value: 50, element: 'light', type: 'heal', category: 'miracle' },
];

// ==================== 雑貨カード (5種類) ====================
const itemCards: Card[] = [
  { id: 'i01', name: 'ポーション', value: 10, element: 'physical', type: 'heal', category: 'item' },
  { id: 'i02', name: 'エーテル', value: 15, element: 'physical', type: 'heal', category: 'item' },
  { id: 'i03', name: 'エリクサー', value: 30, element: 'physical', type: 'heal', category: 'item' },
  { id: 'i04', name: '魔力の結晶', value: 12, element: 'physical', type: 'buff', category: 'item' },
  { id: 'i05', name: '万能薬', value: 25, element: 'physical', type: 'heal', category: 'item' },
];

// 全カードをエクスポート（合計50枚）
export const ALL_CARDS: Card[] = [
  ...weaponCards,
  ...armorCards,
  ...miracleCards,
  ...itemCards,
];

/**
 * ランダムにカードを1枚取得
 */
export function getRandomCard(): Card {
  const index = Math.floor(Math.random() * ALL_CARDS.length);
  return { ...ALL_CARDS[index], id: `${ALL_CARDS[index].id}-${Date.now()}-${Math.random()}` }; // ユニークID生成
}

/**
 * 指定枚数のランダムカードを取得
 */
export function getRandomCards(count: number): Card[] {
  return Array.from({ length: count }, () => getRandomCard());
}

/**
 * デッキを作成（ランダムに指定枚数）
 */
export function createDeck(size: number): Card[] {
  return getRandomCards(size);
}

/**
 * デッキをシャッフル
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
