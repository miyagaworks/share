// app/api/admin/notifications/create/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access';

export async function POST(request: Request) {
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

    // リクエストボディを取得
    const body = await request.json();
    const { title, content, type, priority, imageUrl, startDate, endDate, targetGroup, active } =
      body;

    // 必須項目のバリデーション
    if (!title || !content || !type) {
      return NextResponse.json({ error: 'タイトル、内容、タイプは必須です' }, { status: 400 });
    }

    // お知らせを作成
    const notification = await prisma.notification.create({
      data: {
        title,
        content,
        type,
        priority: priority || 'normal',
        imageUrl,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        targetGroup: targetGroup || 'all',
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json({
      success: true,
      notification,
      message: 'お知らせを作成しました',
    });
  } catch (error) {
    console.error('お知らせ作成エラー:', error);
    return NextResponse.json({ error: 'お知らせの作成に失敗しました' }, { status: 500 });
  }
}