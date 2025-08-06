// app/api/corporate/activity/route.ts（完全修正版）
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    logger.debug('🔄 法人アクティビティAPI - 開始');

    // 認証チェック
    const session = await auth();
    if (!session?.user?.id) {
      logger.debug('❌ 認証エラー');
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    logger.debug('✅ 認証成功:', session.user.email);

    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        subscriptionStatus: true,
        corporateRole: true,
        tenantId: true,
        adminOfTenant: {
          select: { id: true, name: true },
        },
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      logger.error('❌ ユーザーが見つかりません:', session.user.id);
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    logger.debug('📊 ユーザー情報:', {
      email: user.email,
      tenantId: user.tenantId,
      hasAdminTenant: !!user.adminOfTenant,
      hasTenant: !!user.tenant,
      subscriptionStatus: user.subscriptionStatus,
    });

    // クエリパラメータ取得
    const { searchParams } = req.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const skip = (page - 1) * limit;

    // 永久利用権ユーザーの場合は仮想データを返す
    if (user.subscriptionStatus === 'permanent') {
      logger.debug('🏆 永久利用権ユーザー向け仮想データ生成');
      const now = new Date();
      const virtualActivities = [
        {
          id: `virtual-${user.id}-1`,
          tenantId: `virtual-tenant-${user.id}`,
          userId: user.id,
          action: 'login',
          entityType: 'user',
          entityId: user.id,
          description: '永久利用権アカウントでログインしました',
          metadata: null,
          createdAt: now,
          user: {
            id: user.id,
            name: user.name || '永久利用権ユーザー',
            email: user.email,
            image: user.image,
            corporateRole: 'admin',
          },
        },
        {
          id: `virtual-${user.id}-2`,
          tenantId: `virtual-tenant-${user.id}`,
          userId: user.id,
          action: 'access_dashboard',
          entityType: 'tenant',
          entityId: `virtual-tenant-${user.id}`,
          description: '法人ダッシュボードにアクセスしました',
          metadata: null,
          createdAt: new Date(now.getTime() - 3600000),
          user: {
            id: user.id,
            name: user.name || '永久利用権ユーザー',
            email: user.email,
            image: user.image,
            corporateRole: 'admin',
          },
        },
      ];

      return NextResponse.json({
        activities: virtualActivities,
        pagination: {
          total: virtualActivities.length,
          page,
          limit,
          pages: 1,
        },
      });
    }

    // テナント情報取得
    const tenant = user.adminOfTenant || user.tenant;
    if (!tenant) {
      logger.debug('⚠️ テナント情報なし - 空のレスポンスを返す');
      return NextResponse.json({
        activities: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0,
        },
        message: 'テナント情報が見つかりません',
      });
    }

    logger.debug('✅ テナント情報:', { tenantId: tenant.id, tenantName: tenant.name });

    // アクティビティログ取得（接続問題対策版）
    let activities: any[] = [];
    let totalCount = 0;

    try {
      // 🔧 修正: クエリ前に接続を確実にする
      await prisma.$connect();

      // シンプルなクエリから開始
      totalCount = await prisma.corporateActivityLog.count({
        where: { tenantId: tenant.id },
      });

      logger.debug('📊 アクティビティ件数確認:', { totalCount, tenantId: tenant.id });

      if (totalCount > 0) {
        activities = await prisma.corporateActivityLog.findMany({
          where: { tenantId: tenant.id },
          select: {
            id: true,
            tenantId: true,
            userId: true,
            action: true,
            entityType: true,
            entityId: true,
            description: true,
            metadata: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                corporateRole: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        });
      }

      logger.debug('✅ アクティビティ取得成功:', {
        count: activities.length,
        totalCount,
        tenantId: tenant.id,
      });
    } catch (activityError: any) {
      logger.error('❌ アクティビティ取得エラー:', {
        error: activityError.message,
        code: activityError.code,
        tenantId: tenant.id,
        stack: activityError.stack,
      });

      // 🔧 Prisma接続をリセット
      try {
        await prisma.$disconnect();
        await new Promise((resolve) => setTimeout(resolve, 100));
        await prisma.$connect();
        logger.debug('🔄 Prisma接続をリセットしました');
      } catch (reconnectError) {
        logger.error('❌ Prisma再接続エラー:', reconnectError);
      }

      // エラーの場合は空のデータを返す
      activities = [] as any[];
      totalCount = 0;
    }

    return NextResponse.json({
      activities,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    logger.error('❌ 法人アクティビティAPI - 全体エラー:', {
      error: error.message,
      stack: error.stack,
      userId: req.headers.get('x-user-id'),
    });

    // エラー時も正常なレスポンス構造を返す
    return NextResponse.json(
      {
        error: 'アクティビティログの取得に失敗しました',
        activities: [] as any[],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0,
        },
      },
      { status: 500 },
    );
  }
}