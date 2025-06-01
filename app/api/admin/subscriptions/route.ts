// app/api/admin/subscriptions/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access-server';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }
    // 管理者チェック
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }
    // すべてのユーザーとそのサブスクリプション情報を取得
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        nameKana: true, // フリガナを追加
        email: true,
        createdAt: true,
        trialEndsAt: true,
        subscriptionStatus: true,
        subscription: {
          select: {
            id: true,
            status: true,
            plan: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    // レスポンス用にデータを整形
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      nameKana: user.nameKana, // フリガナを追加
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      trialEndsAt: user.trialEndsAt?.toISOString() || null,
      subscriptionStatus: user.subscriptionStatus,
      subscription: user.subscription
        ? {
            id: user.subscription.id,
            status: user.subscription.status,
            plan: user.subscription.plan,
            currentPeriodStart: user.subscription.currentPeriodStart.toISOString(),
            currentPeriodEnd: user.subscription.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
          }
        : null,
    }));
    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    logger.error('サブスクリプション一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'サブスクリプション一覧の取得に失敗しました' },
      { status: 500 },
    );
  }
}