// app/api/links/route.ts (修正版 - キャッシュタグ対応)
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    logger.debug('リンクデータを取得中', {
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    });
    // SNSリンクとカスタムリンクを取得
    const snsLinks = await prisma.snsLink.findMany({
      where: { userId: session.user.id },
      orderBy: { displayOrder: 'asc' },
    });
    const customLinks = await prisma.customLink.findMany({
      where: { userId: session.user.id },
      orderBy: { displayOrder: 'asc' },
    });
    logger.debug('データ取得完了', {
      snsCount: snsLinks.length,
      customCount: customLinks.length,
      userId: session.user.id,
    });
    // レスポンスを作成
    const response = NextResponse.json({
      success: true,
      snsLinks,
      customLinks,
    });
    // 🚀 強力なキャッシュ無効化ヘッダーを設定
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    response.headers.set('CDN-Cache-Control', 'no-store');
    // 🔥 重要: ETagを無効化してブラウザキャッシュを回避
    response.headers.set('ETag', `"${Date.now()}-${Math.random()}"`);
    // 🚀 追加: カスタムヘッダーで更新時刻を付与
    response.headers.set('X-Data-Updated', new Date().toISOString());
    response.headers.set('X-User-ID', session.user.id);
    return response;
  } catch (error) {
    logger.error('リンク取得エラー:', error);
    return NextResponse.json({ error: 'リンク情報の取得に失敗しました' }, { status: 500 });
  }
}