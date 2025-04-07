// lib/jikogene/ai-service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

// 環境変数からAPIキーを取得
const apiKey = process.env.GEMINI_API_KEY;
const modelId = process.env.GEMINI_MODEL_ID || 'gemini-1.5-pro';

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

// Gemini API の初期化
const genAI = new GoogleGenerativeAI(apiKey);

interface GeminiErrorResponse {
  status?: number;
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Google Gemini API を使用して自己紹介文を生成する
 * エラーハンドリングを強化し、リトライロジックを追加
 * @param prompt - AIへのプロンプト
 * @returns 生成された文章
 */
export async function generateIntroduction(prompt: string): Promise<string> {
  // リトライ回数
  const maxRetries = 2;
  let lastError: unknown = null;

  // リトライループ
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Gemini API呼び出し - リトライ ${attempt}/${maxRetries}`);
      } else {
        console.log('Gemini API呼び出し開始');
      }

      // モデルを取得
      const model = genAI.getGenerativeModel({
        model: modelId,
        // より保守的な設定に変更
        generationConfig: {
          temperature: 0.6, // 低めの温度
          maxOutputTokens: 800, // 出力トークン数を制限
          topK: 40,
          topP: 0.95,
        },
      });

      // 設定が異なるからチャットよりもテキスト生成を使用
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      console.log('Gemini API呼び出し成功', {
        attemptNumber: attempt + 1,
        responseLength: text.length,
      });

      return text;
    } catch (error) {
      lastError = error;
      console.error(`Gemini API呼び出しエラー (試行 ${attempt + 1}/${maxRetries + 1}):`, error);

      // 最後のリトライでなければ少し待機
      if (attempt < maxRetries) {
        const waitTime = 1000 * (attempt + 1); // 1秒、2秒と増加
        console.log(`${waitTime}ms待機してリトライします...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  // すべてのリトライが失敗した場合
  console.error('すべてのリトライが失敗しました。エラー処理を実行します。');
  return handleGeminiError(lastError);
}

/**
 * Gemini APIエラーを処理する関数
 * より詳細なエラーメッセージを返す
 */
function handleGeminiError(error: unknown): never {
  // エラーをGeminiErrorResponseとして扱う
  const geminiError = error as GeminiErrorResponse;
  console.error('Gemini詳細エラー情報:', geminiError);

  // ステータスコードによるエラー処理
  if (geminiError.status) {
    switch (geminiError.status) {
      case 400:
        throw new Error('AI生成エラー: リクエストの内容を簡略化してお試しください。');
      case 401:
        throw new Error('AI生成エラー: 認証に失敗しました。システム管理者にお問い合わせください。');
      case 403:
        throw new Error(
          'AI生成エラー: アクセス権限の問題が発生しました。システム管理者にお問い合わせください。',
        );
      case 429:
        throw new Error(
          'AI生成エラー: 現在サービスが混雑しています。しばらく時間をおいてお試しください。',
        );
      case 500:
      case 502:
      case 503:
        throw new Error(
          'AI生成エラー: AIサービス側で問題が発生しています。しばらく経ってからお試しください。',
        );
      default:
        throw new Error(
          `AI生成エラー: サービスに問題が発生しました。(コード: ${geminiError.status})`,
        );
    }
  } else if (geminiError.code === 'ECONNREFUSED' || geminiError.code === 'ENOTFOUND') {
    throw new Error('AIサービスに接続できませんでした。ネットワーク接続を確認してください。');
  } else if (geminiError.message && geminiError.message.includes('content_filter')) {
    throw new Error('AIサービスで内容に関する制限が発生しました。別の表現でお試しください。');
  } else {
    throw new Error(
      '自己紹介文の生成中にエラーが発生しました。しばらく経ってから再度お試しください。',
    );
  }
}
