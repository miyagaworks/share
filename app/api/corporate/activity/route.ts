// app/api/corporate/activity/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    console.log('アクティビティログAPI - リクエスト受信');

    // 認証情報の取得
    const session = await auth();

    if (!session?.user?.id) {
      console.log('アクティビティログAPI - 認証エラー: セッションまたはユーザーIDがありません');
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    console.log('アクティビティログAPI - 認証済みユーザーID:', session.user.id);

    // ユーザーのテナント情報を取得 - selectステートメント修正
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        subscriptionStatus: true, // 永久利用権ユーザー判定用
        adminOfTenant: {
          select: {
            id: true,
            name: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        tenantId: true,
        corporateRole: true,
      },
    });

    if (!user) {
      console.log('アクティビティログAPI - ユーザーが見つかりません');
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    console.log('アクティビティログAPI - ユーザー情報:', {
      id: user.id,
      email: user.email,
      hasAdminOfTenant: !!user.adminOfTenant,
      hasTenant: !!user.tenant,
      tenantId: user.tenantId,
      subscriptionStatus: user.subscriptionStatus,
    });

    // 永久利用権ユーザーの場合は仮想アクティビティログを返す
    if (user.subscriptionStatus === 'permanent') {
      console.log('アクティビティログAPI - 永久利用権ユーザー用仮想データを生成');

      // クエリパラメータから取得（仮想データでも同じパラメータを使用）
      const searchParams = req.nextUrl.searchParams;
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const page = parseInt(searchParams.get('page') || '1', 10);

      // 仮想アクティビティログを生成
      const now = new Date();
      const virtualActivities = [
        {
          id: `virtual-activity-1-${user.id}`,
          tenantId: `virtual-tenant-${user.id}`,
          userId: user.id,
          action: 'login',
          entityType: 'user',
          entityId: user.id,
          description: '永久利用権アカウントでログインしました',
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
          id: `virtual-activity-2-${user.id}`,
          tenantId: `virtual-tenant-${user.id}`,
          userId: user.id,
          action: 'access',
          entityType: 'tenant',
          entityId: `virtual-tenant-${user.id}`,
          description: '法人ダッシュボードにアクセスしました',
          createdAt: new Date(now.getTime() - 3600000), // 1時間前
          user: {
            id: user.id,
            name: user.name || '永久利用権ユーザー',
            email: user.email,
            image: user.image,
            corporateRole: 'admin',
          },
        },
        {
          id: `virtual-activity-3-${user.id}`,
          tenantId: `virtual-tenant-${user.id}`,
          userId: user.id,
          action: 'create',
          entityType: 'tenant',
          entityId: `virtual-tenant-${user.id}`,
          description: '永久利用権が付与され、仮想テナントが作成されました',
          createdAt: new Date(now.getTime() - 86400000), // 1日前
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

    // テナント情報を取得（管理者または一般メンバーのいずれか）
    const tenant = user.adminOfTenant || user.tenant;

    if (!tenant) {
      console.log('アクティビティログAPI - テナント情報が見つかりません');
      return NextResponse.json({ error: '法人テナント情報が見つかりません' }, { status: 404 });
    }

    // デバッグログを追加
    console.log('アクティビティAPI - テナント情報:', {
      tenantId: tenant.id,
      userId: session.user.id,
      isAdmin: !!user.adminOfTenant,
      tenantName: tenant.name,
      userRole: user.corporateRole,
    });

    // クエリパラメータから取得
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    console.log('アクティビティログAPI - クエリパラメータ:', { limit, page, skip });

    // アクティビティログを取得（最新順）
    const activities = await prisma.corporateActivityLog.findMany({
      where: {
        tenantId: tenant.id,
      },
      include: {
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
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    console.log('アクティビティログAPI - 取得結果:', {
      count: activities.length,
      firstActivityId: activities.length > 0 ? activities[0].id : null,
      lastActivityId: activities.length > 0 ? activities[activities.length - 1].id : null,
    });

    // 総件数を取得
    const totalCount = await prisma.corporateActivityLog.count({
      where: {
        tenantId: tenant.id,
      },
    });

    console.log('アクティビティログAPI - 総件数:', totalCount);

    return NextResponse.json({
      activities,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('アクティビティログAPI - 取得エラー:', error);
    return NextResponse.json({ error: 'アクティビティログの取得に失敗しました' }, { status: 500 });
  }
}