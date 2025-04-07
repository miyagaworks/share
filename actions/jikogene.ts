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
    console.log('サーバーアクション開始', new Date().toISOString());

    // バリデーション
    console.log('フォームデータのバリデーション開始');
    const validationError = validateFormData(formData);
    if (validationError) {
      console.error('バリデーションエラー:', validationError);
      return validationError;
    }
    console.log('バリデーション成功');

    // データ内容を簡易ログ出力（機密情報は除外）
    console.log('送信データ概要:', {
      basicInfoFilled: Boolean(formData.basicInfo.ageGroup && formData.basicInfo.occupation),
      hobbiesCount: formData.hobbies.length,
      personalityTraitsCount: formData.personalityTraits.length,
      keywordsLength: formData.keywords.length,
      purpose: formData.purpose,
      length: formData.length,
    });

    // プロンプト生成
    console.log('プロンプト生成開始');
    const prompt = buildPrompt(formData);
    console.log('プロンプト生成完了', { promptLength: prompt.length });

    try {
      // AI生成
      console.log('AI生成開始');
      const generatedText = await generateIntroduction(prompt);
      console.log('AI生成完了', { textLength: generatedText.length });

      // 成功レスポンスを返す
      console.log('サーバーアクション成功');
      return {
        success: true,
        data: {
          generatedText,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (aiError) {
      // AI生成エラー時にフォールバック生成を試みる
      console.error('AI生成エラー発生、フォールバックに切り替えます:', aiError);
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
    console.error('Error in generateIntroductionAction:', {
      message: errorObj.message,
      name: errorObj.name,
      stack: errorObj.stack,
    });

    try {
      // 最終手段としてフォールバック生成を試みる
      console.error('サーバーアクション全体でエラー発生、最終フォールバックを試みます');
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
      console.error('フォールバックも失敗:', fallbackError);
      return {
        error: '自己紹介文の生成に失敗しました。お手数ですが、時間をおいて再度お試しください。',
      };
    }
  }
}
