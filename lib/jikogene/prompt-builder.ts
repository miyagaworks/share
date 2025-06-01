// lib/jikogene/prompt-builder.ts
import { logger } from "@/lib/utils/logger";
import { FormData } from '@/app/jikogene/types';
/**
 * 自己紹介生成用のプロンプトを構築する
 * APIエラーを防ぐために最適化
 * @param formData フォームデータ
 * @returns 構築されたプロンプト
 */
export function buildPrompt(formData: FormData): string {
  const { basicInfo, hobbies, personalityTraits, keywords, purpose, length } = formData;
  // 文章の長さパラメータ
  const lengthParams: Record<string, number> = {
    short: 100,
    medium: 250,
    long: 450,
  };
  // 用途別のトーン設定
  const toneMapping: Record<string, string> = {
    general: '一般的で親しみやすい',
    business: 'ビジネスにふさわしい、プロフェッショナルな',
    social: 'カジュアルでフレンドリーな',
  };
  // 安全な文字列抽出（undefined や null の場合は空文字列を返す）
  const safeStr = (str: string | undefined | null): string => {
    if (!str) return '';
    // 特殊文字をエスケープ
    return str.replace(/[\\'"]/g, '');
  };
  // 安全な配列結合（空の場合は「指定なし」を返す）
  const safeJoin = (arr: string[]): string => {
    if (!arr || arr.length === 0) return '指定なし';
    return arr.map((item) => safeStr(item)).join('、');
  };
  // プロンプトの長さを制限するための最大文字数
  const maxPromptLength = 4000;
  // プロンプト構築（シンプルな形式に）
  const prompt = `
以下の情報を基にして、${safeStr(toneMapping[purpose] || '一般的な')}自己紹介文を${lengthParams[length] || 250}文字程度で作成してください。
【基本情報】
年齢層: ${safeStr(basicInfo.ageGroup) || '指定なし'}
${basicInfo.gender ? `性別: ${safeStr(basicInfo.gender)}` : ''}
職業: ${safeStr(basicInfo.occupation) || '指定なし'}
居住地域: ${safeStr(basicInfo.location) || '指定なし'}
【趣味・興味】
${safeJoin(hobbies)}
【性格・特性】
${safeJoin(personalityTraits)}
【キーワード】
${safeStr(keywords) || '指定なし'}
【指示】
- 一人称は「私」を使用
- 読みやすく自然な文体
- 簡潔な文章と適度な改行で読みやすさを確保
- 最後に簡単な挨拶や結びの言葉を入れる
`;
  // プロンプトが長すぎる場合は切り詰める
  if (prompt.length > maxPromptLength) {
    logger.warn(`プロンプトが長すぎるため切り詰めます: ${prompt.length} > ${maxPromptLength}`);
    return prompt.substring(0, maxPromptLength);
  }
  return prompt;
}
