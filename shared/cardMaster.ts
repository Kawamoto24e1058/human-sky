import type { Card, Element, CardType } from './types';

/**
 * ゴッドフィールド風カードマスターデータ
 * 合計50種類以上の神器カード
 */

// Weaponカード（攻撃）: 15種類
export const weaponCards: Card[] = [
  // 火属性武器
  { id: 'w001', name: '炎帝の剣', type: 'weapon', value: 28, cost: 5, element: 'fire', description: '灼熱の刃が敵を焼き尽くす' },
  { id: 'w002', name: '紅蓮の槍', type: 'weapon', value: 25, cost: 4, element: 'fire', description: '業火を纏った槍で貫く' },
  { id: 'w003', name: '焔の短剣', type: 'weapon', value: 18, cost: 3, element: 'fire', description: '素早く燃える刃で切り裂く' },
  
  // 水属性武器
  { id: 'w004', name: '氷晶の剣', type: 'weapon', value: 26, cost: 4, element: 'water', description: '凍てつく刃が敵を凍らせる' },
  { id: 'w005', name: '蒼海の三叉槍', type: 'weapon', value: 30, cost: 5, element: 'water', description: '海神の力を宿す三叉の槍' },
  { id: 'w006', name: '水流の短剣', type: 'weapon', value: 20, cost: 3, element: 'water', description: '流水のように滑らかに斬る' },
  
  // 木属性武器
  { id: 'w007', name: '世界樹の弓', type: 'weapon', value: 24, cost: 4, element: 'earth', description: '生命の力を矢に込めて放つ' },
  { id: 'w008', name: '森羅の杖', type: 'weapon', value: 22, cost: 3, element: 'earth', description: '自然の怒りを呼び起こす' },
  { id: 'w009', name: '翠玉の鞭', type: 'weapon', value: 19, cost: 3, element: 'earth', description: '蔦のように敵を拘束する' },
  
  // 光属性武器
  { id: 'w010', name: '聖剣エクスカリバー', type: 'weapon', value: 32, cost: 6, element: 'light', description: '選ばれし者だけが扱える聖剣' },
  { id: 'w011', name: '天使の弓', type: 'weapon', value: 27, cost: 4, element: 'light', description: '聖なる光の矢を射る' },
  { id: 'w012', name: '煌めきの槍', type: 'weapon', value: 23, cost: 3, element: 'light', description: '輝く穂先が闇を貫く' },
  
  // 闇属性武器
  { id: 'w013', name: '魔剣グラム', type: 'weapon', value: 30, cost: 5, element: 'dark', description: '呪われた魔剣、使用者の魂を喰らう' },
  { id: 'w014', name: '冥府の鎌', type: 'weapon', value: 29, cost: 5, element: 'dark', description: '死神の鎌が魂を刈り取る' },
  { id: 'w015', name: '闇夜の短剣', type: 'weapon', value: 21, cost: 3, element: 'dark', description: '影に潜んで急所を狙う' },
];

// Armorカード（防御）: 15種類
export const armorCards: Card[] = [
  // 火属性防具
  { id: 'a001', name: '炎竜の鎧', type: 'armor', value: 15, cost: 0, element: 'fire', description: '竜の鱗で作られた灼熱の鎧' },
  { id: 'a002', name: '業火の盾', type: 'armor', value: 12, cost: 0, element: 'fire', description: '炎を纏う盾で攻撃を防ぐ' },
  { id: 'a003', name: '紅蓮の籠手', type: 'armor', value: 10, cost: 0, element: 'fire', description: '燃える拳で反撃する' },
  
  // 水属性防具
  { id: 'a004', name: '氷河の盾', type: 'armor', value: 14, cost: 0, element: 'water', description: '永久凍土の氷で作られた盾' },
  { id: 'a005', name: '深海の鎧', type: 'armor', value: 16, cost: 0, element: 'water', description: '水圧に耐える深海の鎧' },
  { id: 'a006', name: '水晶の兜', type: 'armor', value: 11, cost: 0, element: 'water', description: '透明な水晶で頭部を守る' },
  
  // 木属性防具
  { id: 'a007', name: '大地の鎧', type: 'armor', value: 18, cost: 0, element: 'earth', description: '岩盤のように硬い鎧' },
  { id: 'a008', name: '森の盾', type: 'armor', value: 13, cost: 0, element: 'earth', description: '生命力が宿る木の盾' },
  { id: 'a009', name: '樹皮の鎧', type: 'armor', value: 12, cost: 0, element: 'earth', description: '古木の樹皮で作られた鎧' },
  
  // 光属性防具
  { id: 'a010', name: '天使の鎧', type: 'armor', value: 17, cost: 0, element: 'light', description: '聖なる光が身を守る' },
  { id: 'a011', name: '聖なる盾', type: 'armor', value: 15, cost: 0, element: 'light', description: '邪悪を跳ね返す聖盾' },
  { id: 'a012', name: '光の結界', type: 'armor', value: 14, cost: 0, element: 'light', description: '光の膜が全身を包む' },
  
  // 闇属性防具
  { id: 'a013', name: '魔王の鎧', type: 'armor', value: 19, cost: 0, element: 'dark', description: '闇の力を纏う漆黒の鎧' },
  { id: 'a014', name: '冥府の盾', type: 'armor', value: 16, cost: 0, element: 'dark', description: '死者の魂が守る盾' },
  { id: 'a015', name: '影の外套', type: 'armor', value: 13, cost: 0, element: 'dark', description: '影に身を隠す外套' },
];

// Miracleカード（奇跡）: 12種類
export const miracleCards: Card[] = [
  { id: 'm001', name: '炎神の怒り', type: 'miracle', value: 35, cost: 7, element: 'fire', description: '炎の神が天より火柱を降らせる' },
  { id: 'm002', name: '大洪水', type: 'miracle', value: 32, cost: 6, element: 'water', description: '全てを飲み込む津波を召喚' },
  { id: 'm003', name: '大地震', type: 'miracle', value: 30, cost: 6, element: 'earth', description: '大地を揺るがす地震を起こす' },
  { id: 'm004', name: '神の裁き', type: 'miracle', value: 40, cost: 8, element: 'light', description: '天からの光線が敵を裁く' },
  { id: 'm005', name: '魔王降臨', type: 'miracle', value: 38, cost: 8, element: 'dark', description: '魔王を召喚して敵を滅ぼす' },
  { id: 'm006', name: '火炎嵐', type: 'miracle', value: 28, cost: 5, element: 'fire', description: '炎の竜巻が敵を焼き尽くす' },
  { id: 'm007', name: '氷結世界', type: 'miracle', value: 26, cost: 5, element: 'water', description: '全てを凍らせる吹雪を起こす' },
  { id: 'm008', name: '森羅万象', type: 'miracle', value: 25, cost: 5, element: 'earth', description: '自然の力を総動員して攻撃' },
  { id: 'm009', name: '聖域展開', type: 'miracle', value: 0, cost: 4, element: 'light', description: '聖なる結界で味方全員を守る' },
  { id: 'm010', name: '暗黒領域', type: 'miracle', value: 27, cost: 5, element: 'dark', description: '闇の空間で敵の力を奪う' },
  { id: 'm011', name: '天罰', type: 'miracle', value: 33, cost: 7, element: 'light', description: '雷を伴う神の怒りが降り注ぐ' },
  { id: 'm012', name: '黒き終焉', type: 'miracle', value: 36, cost: 7, element: 'dark', description: '全てを終わらせる闇の波動' },
];

// Itemカード（道具）: 12種類
export const itemCards: Card[] = [
  { id: 'i001', name: '生命の薬', type: 'item', value: 0, cost: 2, element: 'none', description: 'HPを50回復する' },
  { id: 'i002', name: '魔力の薬', type: 'item', value: 0, cost: 1, element: 'none', description: 'MPを30回復する' },
  { id: 'i003', name: '万能薬', type: 'item', value: 0, cost: 3, element: 'none', description: 'HP・MPを全回復する' },
  { id: 'i004', name: '火炎石', type: 'item', value: 15, cost: 2, element: 'fire', description: '火の魔力を解放する石' },
  { id: 'i005', name: '水晶球', type: 'item', value: 15, cost: 2, element: 'water', description: '水の力を引き出す球' },
  { id: 'i006', name: '大地の結晶', type: 'item', value: 15, cost: 2, element: 'earth', description: '大地のエネルギーを込めた結晶' },
  { id: 'i007', name: '聖水', type: 'item', value: 12, cost: 2, element: 'light', description: '邪悪を浄化する聖なる水' },
  { id: 'i008', name: '呪いの人形', type: 'item', value: 18, cost: 3, element: 'dark', description: '敵に呪いをかける人形' },
  { id: 'i009', name: '速さの靴', type: 'item', value: 0, cost: 1, element: 'none', description: '次のターンまで先制攻撃' },
  { id: 'i010', name: '鋼の盾', type: 'item', value: 8, cost: 0, element: 'none', description: '一度だけダメージを軽減' },
  { id: 'i011', name: '不死鳥の羽', type: 'item', value: 0, cost: 4, element: 'fire', description: 'HPが0になっても一度だけ復活' },
  { id: 'i012', name: '時の砂時計', type: 'item', value: 0, cost: 5, element: 'none', description: 'ターンを1つ戻す' },
];

/**
 * 全カードマスターデータ（54種類）
 */
export const CARD_MASTER: Card[] = [
  ...weaponCards,
  ...armorCards,
  ...miracleCards,
  ...itemCards,
];

/**
 * カードIDからカードデータを取得
 */
export function getCardById(cardId: string): Card | undefined {
  return CARD_MASTER.find(card => card.id === cardId);
}

/**
 * タイプ別にカードを取得
 */
export function getCardsByType(type: CardType): Card[] {
  return CARD_MASTER.filter(card => card.type === type);
}

/**
 * 属性別にカードを取得
 */
export function getCardsByElement(element: Element): Card[] {
  return CARD_MASTER.filter(card => card.element === element);
}

/**
 * ランダムにカードを取得
 */
export function getRandomCard(): Card {
  const index = Math.floor(Math.random() * CARD_MASTER.length);
  return { ...CARD_MASTER[index] };
}

/**
 * ランダムに複数枚のカードを取得（重複あり）
 */
export function getRandomCards(count: number): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    cards.push(getRandomCard());
  }
  return cards;
}

/**
 * デッキをシャッフル（Fisher-Yatesアルゴリズム）
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 新しいデッキを作成（全カードマスターからランダムに構築）
 */
export function createDeck(size: number = 40): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < size; i++) {
    const card = getRandomCard();
    // ユニークなIDを生成（同じカードでも別インスタンスとして扱う）
    deck.push({
      ...card,
      id: `${card.id}-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
  }
  return shuffleDeck(deck);
}
