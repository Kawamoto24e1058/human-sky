import { Card } from '../types';

// OpenAI APIで技を生成
async function generateWithOpenAI(keyword1: string, keyword2: string): Promise<Card> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('VITE_OPENAI_API_KEY not set');

  const prompt = `2つのキーワード「${keyword1}」と「${keyword2}」を組み合わせて、ゴッドフィールド風のカードゲーム用の技を1つ作成してください。

以下のJSON形式で出力してください：
{
  "name": "技名（日本語、かっこいい名前）",
  "value": 技の威力（10〜50の整数）,
  "element": "属性（fire, water, wind, earth, light, dark のいずれか）",
  "description": "技の説明文（20文字以内）"
}

JSONのみを出力し、それ以外の文章は含めないでください。`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたはゴッドフィールド風カードゲームの技を生成するAIです。必ずJSON形式で回答してください。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 200
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  
  // JSON部分を抽出（```json ``` で囲まれている場合に対応）
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid JSON response from API');
  
  const cardData = JSON.parse(jsonMatch[0]);

  return {
    id: `generated-${Date.now()}`,
    name: cardData.name,
    type: 'weapon',
    element: cardData.element,
    value: Number(cardData.value),
    cost: Math.floor(Number(cardData.value) / 6), // 威力に応じてコスト設定
    description: cardData.description
  };
}

// Gemini APIで技を生成
async function generateWithGemini(keyword1: string, keyword2: string): Promise<Card> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not set');

  const prompt = `2つのキーワード「${keyword1}」と「${keyword2}」を組み合わせて、ゴッドフィールド風のカードゲーム用の技を1つ作成してください。

以下のJSON形式で出力してください：
{
  "name": "技名（日本語、かっこいい名前）",
  "value": 技の威力（10〜50の整数）,
  "element": "属性（fire, water, wind, earth, light, dark のいずれか）",
  "description": "技の説明文（20文字以内）"
}

JSONのみを出力し、それ以外の文章は含めないでください。`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 200
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.candidates[0]?.content?.parts[0]?.text || '{}';
  
  // JSON部分を抽出
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid JSON response from API');
  
  const cardData = JSON.parse(jsonMatch[0]);

  return {
    id: `generated-${Date.now()}`,
    name: cardData.name,
    type: 'weapon',
    element: cardData.element,
    value: Number(cardData.value),
    cost: Math.floor(Number(cardData.value) / 6),
    description: cardData.description
  };
}

// 技を生成（環境変数に応じてOpenAIまたはGeminiを使用）
export async function generateCard(keyword1: string, keyword2: string): Promise<Card> {
  console.log('[GenerateCard] Generating card from:', keyword1, keyword2);

  // 入力検証
  if (!keyword1 || !keyword2) {
    throw new Error('両方のキーワードを入力してください');
  }

  if (keyword1.length > 20 || keyword2.length > 20) {
    throw new Error('キーワードは20文字以内で入力してください');
  }

  // 利用可能なAPIを判定
  const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY;
  const hasGemini = !!import.meta.env.VITE_GEMINI_API_KEY;

  if (!hasOpenAI && !hasGemini) {
    throw new Error('VITE_OPENAI_API_KEY または VITE_GEMINI_API_KEY を設定してください');
  }

  try {
    // OpenAIを優先、なければGemini
    if (hasOpenAI) {
      console.log('[GenerateCard] Using OpenAI API');
      return await generateWithOpenAI(keyword1, keyword2);
    } else {
      console.log('[GenerateCard] Using Gemini API');
      return await generateWithGemini(keyword1, keyword2);
    }
  } catch (error) {
    console.error('[GenerateCard] Error:', error);
    throw error;
  }
}
