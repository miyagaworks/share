// middleware/prisma-connection-handler.ts
import type { NextRequest, NextResponse } from 'next/server';
import { disconnectPrisma } from '@/lib/prisma';
/**
 * Prisma接続プールを管理するミドルウェア
 */
export async function handlePrismaConnections(
  req: NextRequest,
  res: NextResponse,
  next: () => Promise<void>,
) {
  try {
    // ミドルウェアを実行
    await next();
  } finally {
    // 非同期処理完了後にデータベース接続をリリース
    await disconnectPrisma();
  }
}
// 型定義を追加
type ApiHandler = (req: Request, res: Response) => Promise<Response>;
// APIルートエンドポイントのラッパー関数
export function withPrismaConnection(handler: ApiHandler): ApiHandler {
  return async (req: Request, res: Response) => {
    try {
      return await handler(req, res);
    } finally {
      await disconnectPrisma();
    }
  };
}