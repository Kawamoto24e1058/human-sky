import type { Card } from './types';
import { weaponCards, armorCards, miracleCards, itemCards, CARD_MASTER } from './cardMaster';

// カテゴリ別のマスターデータを再エクスポート
export const WEAPON_CARDS: Card[] = weaponCards;
export const ARMOR_CARDS: Card[] = armorCards;
export const MIRACLE_CARDS: Card[] = miracleCards;
export const ITEM_CARDS: Card[] = itemCards;

// 全カードまとめ
export const ALL_CARDS: Card[] = CARD_MASTER;
