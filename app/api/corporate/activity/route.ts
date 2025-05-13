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

    // ユーザーのテナント情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        adminOfTenant: true,
        tenant: true,
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
    });

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
