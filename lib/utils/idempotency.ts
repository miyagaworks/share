// lib/utils/idempotency.ts
import { prisma } from '@/lib/prisma';

/**
 * 冪等性を確保するための処理を行う関数
 * @param idempotencyKey 冪等性キー
 * @param endpoint エンドポイント名（区別用）
 * @param handler 実際の処理を行う関数
 * @param expirationMinutes 冪等性キーの有効期限（分）
 */
export async function processWithIdempotency<T>(
  idempotencyKey: string | null,
  endpoint: string,
  handler: () => Promise<T>,
  expirationMinutes: number = 30,
): Promise<T> {
  // 冪等性キーがない場合はそのまま処理
  if (!idempotencyKey) {
    return await handler();
  }

  // 既存のリクエスト結果を確認
  const existingRequest = await prisma.idempotencyRequest.findUnique({
    where: { id: idempotencyKey },
  });

  // 既存の結果がある場合はそれを返す
  if (existingRequest) {
    console.log(`処理済みリクエスト: ${idempotencyKey} (${endpoint})`);
    return existingRequest.result as unknown as T;
  }

  // 実際の処理を実行
  const result = await handler();

  // 有効期限を計算
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

  try {
    // resultをJSON文字列に変換
    const resultJson = JSON.stringify(result);

    // Prismaのクエリを実行
    await prisma.$executeRaw`
      INSERT INTO "IdempotencyRequest" ("id", "endpoint", "result", "createdAt", "expiresAt")
      VALUES (${idempotencyKey}, ${endpoint}, ${resultJson}::jsonb, NOW(), ${expiresAt})
    `;
  } catch (error) {
    console.error('冪等性リクエスト保存エラー:', error);
    // エラーが発生しても元の処理結果は返す（ロギングのみの失敗は許容）
  }

  return result;
}

/**
 * 期限切れの冪等性キーを削除する関数（定期的に実行）
 */
export async function cleanUpExpiredIdempotencyRequests() {
  const now = new Date();

  try {
    const result = await prisma.$executeRaw`
      DELETE FROM "IdempotencyRequest" 
      WHERE "expiresAt" < ${now}
    `;

    console.log(`期限切れ冪等性リクエスト削除: ${result}件`);
    return Number(result);
  } catch (error) {
    console.error('期限切れ冪等性リクエスト削除エラー:', error);
    return 0;
  }
}

/**
 * Next.js API Routes向けの冪等性ミドルウェア
 */
export function withIdempotency(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const idempotencyKey = request.headers.get('X-Idempotency-Key');

    if (!idempotencyKey) {
      // 冪等性キーがない場合は通常の処理
      return await handler(request);
    }

    // エンドポイント名を取得（URLから）
    const url = new URL(request.url);
    const endpoint = url.pathname;

    return await processWithIdempotency(
      idempotencyKey,
      endpoint,
      () => handler(request),
      30, // 30分
    );
  };
}