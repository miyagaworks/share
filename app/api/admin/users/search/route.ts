// app/api/admin/users/search/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access-server';

export async function GET(request: Request) {
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

    // クエリパラメータを取得
    const url = new URL(request.url);
    const query = url.searchParams.get('query');

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    // ユーザー検索（名前またはメールアドレスで部分一致）
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 20, // 最大20件まで
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('ユーザー検索エラー:', error);
    return NextResponse.json({ error: 'ユーザー検索に失敗しました' }, { status: 500 });
  }
}