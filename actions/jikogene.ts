// actions/jikogene.ts
'use server';
import { FormData, ApiResponse, GenerationResult } from '@/app/jikogene/types';
import { validateFormData } from '@/lib/jikogene/validator';
import { buildPrompt } from '@/lib/jikogene/prompt-builder';
import { generateIntroduction } from '@/lib/jikogene/ai-service';
import { tryFallbackGeneration } from '@/lib/jikogene/fallback-generator';
/**
 * 自己紹介文を生成するサーバーアクション
 * フォールバック機能を組み込んで堅牢性を向上
 * @param formData フォームデータ
 * @returns 生成結果またはエラーレスポンス
 */
export async function generateIntroductionAction(
  formData: FormData,
): Promise<ApiResponse<GenerationResult>> {
  try {
    // バリデーション
    const validationError = validateFormData(formData);
    if (validationError) {
      return validationError;
    }
    // データ内容を簡易ログ出力（機密情報は除外）
    // 本番環境では不要
    // プロンプト生成
    const prompt = buildPrompt(formData);
    try {
      // AI生成
      const generatedText = await generateIntroduction(prompt);
      // 成功レスポンスを返す
      return {
        success: true,
        data: {
          generatedText,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (aiError) {
      // AI生成エラー時にフォールバック生成を試みる
      const { text, warning } = tryFallbackGeneration(formData, aiError);
      return {
        success: true,
        data: {
          generatedText: text,
          timestamp: new Date().toISOString(),
          warning: warning,
        },
      };
    }
  } catch (error: unknown) {
    // エラーの詳細情報を収集
    const errorObj = error instanceof Error ? error : new Error('不明なエラー');
    // 本番環境ではエラーログは不要
    try {
      // 最終手段としてフォールバック生成を試みる
      const { text, warning } = tryFallbackGeneration(formData, error);
      return {
        success: true,
        data: {
          generatedText: text,
          timestamp: new Date().toISOString(),
          warning: warning,
        },
      };
    } catch (fallbackError) {
      // フォールバックも失敗した場合
      return {
        error: '自己紹介文の生成に失敗しました。お手数ですが、時間をおいて再度お試しください。',
      };
    }
  }
}
