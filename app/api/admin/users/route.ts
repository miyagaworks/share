// app/api/admin/users/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access';
import { addDays } from 'date-fns';

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

    // すべてのユーザーを取得（updatedAtとsubscription.currentPeriodEndを追加）
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        nameKana: true,
        email: true,
        createdAt: true,
        updatedAt: true, // 追加
        trialEndsAt: true,
        subscription: {
          select: {
            status: true,
            plan: true,
            currentPeriodEnd: true, // 追加
          },
        },
        subscriptionStatus: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 現在の日付
    const now = new Date();

    // 猶予期間終了判定とフォーマット
    const formattedUsers = users.map((user) => {
      // トライアル終了日が存在して、現在日時が（トライアル終了日+7日）を過ぎている場合
      const isGracePeriodExpired = user.trialEndsAt
        ? now > addDays(new Date(user.trialEndsAt), 7)
        : false;

      // 永久利用権を持つかどうか判定
      const isPermanentUser = user.subscriptionStatus === 'permanent';

      return {
        id: user.id,
        name: user.name,
        nameKana: user.nameKana,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(), // 追加
        trialEndsAt: user.trialEndsAt?.toISOString() || null,
        isPermanentUser,
        isGracePeriodExpired,
        subscription: user.subscription,
        subscriptionStatus: user.subscriptionStatus,
      };
    });

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    return NextResponse.json({ error: 'ユーザー一覧の取得に失敗しました' }, { status: 500 });
  }
}