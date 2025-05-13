// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access';

export const dynamic = 'force-dynamic';
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

    // すべてのユーザーを取得
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        subscription: {
          select: {
            status: true,
            plan: true,
          },
        },
        subscriptionStatus: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 永久利用権を持つユーザーIDのリストを取得
    const permanentUsers = await prisma.user.findMany({
      where: {
        // 永久利用権を持つユーザーの条件
        // この例では subscriptionStatus フィールドを使用
        subscriptionStatus: 'permanent',
      },
      select: { id: true },
    });

    const permanentUserIds = new Set(permanentUsers.map((user) => user.id));

    // レスポンス用に整形
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      isPermanentUser: permanentUserIds.has(user.id),
      subscription: user.subscription,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    return NextResponse.json({ error: 'ユーザー一覧の取得に失敗しました' }, { status: 500 });
  }
}