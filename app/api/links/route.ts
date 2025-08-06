// app/api/links/route.ts (修正版 - 型エラー完全解決)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import type { SnsLink, CustomLink } from '@prisma/client';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    const userId = session.user.id;
    logger.debug('リンクAPI: データ取得開始', {
      userId,
      timestamp: new Date().toISOString(),
    });

    try {
      // 🔧 修正: Prisma生成型を使用
      let snsLinks: SnsLink[] = [];
      try {
        snsLinks = await prisma.snsLink.findMany({
          where: { userId },
          orderBy: { displayOrder: 'asc' },
        });
      } catch (snsError) {
        logger.error('リンクAPI: SNSリンク取得エラー:', snsError);
        // SNSリンクが取得できなくても空配列で続行
      }

      let customLinks: CustomLink[] = [];
      try {
        customLinks = await prisma.customLink.findMany({
          where: { userId },
          orderBy: { displayOrder: 'asc' },
        });
      } catch (customError) {
        logger.error('リンクAPI: カスタムリンク取得エラー:', customError);
        // カスタムリンクが取得できなくても空配列で続行
      }

      logger.debug('リンクAPI: データ取得完了', {
        snsCount: snsLinks.length,
        customCount: customLinks.length,
        userId,
      });

      // レスポンスを作成
      const response = NextResponse.json({
        success: true,
        snsLinks,
        customLinks,
      });

      // 🔧 修正: キャッシュ無効化ヘッダーを簡素化
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

      return response;
    } catch (dbError) {
      logger.error('リンクAPI: データベースエラー:', dbError);

      // 🔧 修正: エラー時でも基本的なレスポンスを返す（Prisma型使用）
      return NextResponse.json(
        {
          success: false,
          error: 'リンク情報の取得に失敗しました',
          snsLinks: [] as SnsLink[],
          customLinks: [] as CustomLink[],
          details:
            process.env.NODE_ENV === 'development'
              ? dbError instanceof Error
                ? dbError.message
                : String(dbError)
              : undefined,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error('リンクAPI: 全体エラー:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'リンク情報の取得に失敗しました',
        snsLinks: [] as SnsLink[],
        customLinks: [] as CustomLink[],
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 },
    );
  }
}