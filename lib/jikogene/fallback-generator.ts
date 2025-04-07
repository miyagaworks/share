// lib/jikogene/fallback-generator.ts
import { FormData } from '@/app/jikogene/types';

/**
 * APIが失敗した場合のフォールバック自己紹介文生成
 * シンプルなテンプレートベースの生成機能
 * @param formData フォームデータ
 * @returns 生成された自己紹介文
 */
export function generateFallbackIntroduction(formData: FormData): string {
  const { basicInfo, hobbies, personalityTraits, purpose, length } = formData;

  // 年齢層
  const ageGroup = basicInfo.ageGroup || '不明';

  // 職業
  const occupation = basicInfo.occupation || '不明な職業';

  // 居住地
  const location = basicInfo.location ? `${basicInfo.location}在住` : '';

  // 趣味（最大3つ）
  const hobbyList = hobbies.slice(0, 3).join('、');
  const hobbyText = hobbyList ? `趣味は${hobbyList}です。` : '';

  // 性格特性（最大3つ）
  const personalityList = personalityTraits.slice(0, 3).join('、');
  const personalityText = personalityList
    ? `自分では${personalityList}な性格だと思っています。`
    : '';

  // 文の長さに応じたテンプレート
  let template = '';

  // 用途に応じた調整
  let greeting = '';
  let closing = '';

  switch (purpose) {
    case 'business':
      greeting = 'はじめまして。';
      closing = 'どうぞよろしくお願いいたします。';
      break;
    case 'social':
      greeting = 'こんにちは！';
      closing = 'よろしくお願いします！';
      break;
    default: // general
      greeting = 'はじめまして。';
      closing = 'よろしくお願いします。';
  }

  // 文の長さに応じたテンプレート
  switch (length) {
    case 'short':
      template = `${greeting}${ageGroup}の${occupation}です。${location} ${hobbyText}${closing}`;
      break;

    case 'long':
      // 長めのテンプレート
      template = `
${greeting}${ageGroup}の${occupation}です。${location}

${personalityText}

${hobbyText}
${hobbyList ? `${hobbyList}を通じて、日々新しい発見や楽しみを見つけています。` : ''}

${formData.keywords ? `${formData.keywords}を大切にしながら、日々過ごしています。` : ''}

${closing}
      `.trim();
      break;

    default: // medium
      template = `
${greeting}${ageGroup}の${occupation}です。${location}

${personalityText} ${hobbyText}

${closing}
      `.trim();
  }

  // 余分な空白行を削除
  return template.replace(/\n\s*\n/g, '\n\n').trim();
}

/**
 * APIエラー時にフォールバック生成を試みる
 * @param formData フォームデータ
 * @param error エラー情報
 * @returns 生成結果と警告メッセージ
 */
export function tryFallbackGeneration(
  formData: FormData,
  error: unknown,
): {
  text: string;
  warning: string;
} {
  console.log('フォールバック生成を実行します', {
    errorMessage: error instanceof Error ? error.message : 'Unknown error',
  });

  try {
    const fallbackText = generateFallbackIntroduction(formData);
    return {
      text: fallbackText,
      warning:
        'AIサービスでエラーが発生したため、簡易的な自己紹介文を生成しました。必要に応じて編集してください。',
    };
  } catch (fallbackError) {
    console.error('フォールバック生成でもエラーが発生:', fallbackError);
    // 最終手段の簡易テンプレート
    return {
      text: `はじめまして。${formData.basicInfo.occupation || ''}です。よろしくお願いします。`,
      warning:
        '自己紹介文の生成に問題が発生しました。こちらの簡易テンプレートを編集してお使いください。',
    };
  }
}
