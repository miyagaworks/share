// app/api/admin/users/search/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/utils/admin-access-server';
import { SUPER_ADMIN_EMAIL } from '@/lib/auth/constants';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // スーパー管理者チェック
    const isSuper = await isSuperAdmin(session.user.id);
    if (!isSuper) {
      return NextResponse.json({ error: 'スーパー管理者権限が必要です' }, { status: 403 });
    }

    // クエリパラメータを取得（フロントエンドは'q'を使用）
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q'); // 🔧 修正: 'query' → 'q'

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        users: [],
        message: '2文字以上で検索してください',
      });
    }

    // 既存の財務管理者IDを取得
    const existingFinancialAdmins = await prisma.financialAdmin.findMany({
      where: { isActive: true },
      select: { userId: true },
    });

    const excludeIds = existingFinancialAdmins.map((fa: { userId: string }) => fa.userId);

    // ユーザー検索（財務管理者、永久利用権ユーザー、スーパー管理者を除外）
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { email: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
            ],
          },
          {
            id: { notIn: excludeIds },
          },
          {
            email: { not: SUPER_ADMIN_EMAIL },
          },
          {
            subscriptionStatus: { not: 'permanent' },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        subscriptionStatus: true,
      },
      take: 10,
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    });

    logger.info('ユーザー検索成功:', {
      executorUserId: session.user.id,
      query: query.trim(),
      resultCount: users.length,
    });

    return NextResponse.json({
      success: true,
      users,
      query: query.trim(),
      count: users.length,
    });
  } catch (error: any) {
    logger.error('ユーザー検索エラー:', error);
    return NextResponse.json(
      {
        error: 'ユーザー検索に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}