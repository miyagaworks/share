// app/api/admin/notifications/[id]/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access-server';

// 🔥 修正: params型をPromiseに変更
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 🔥 修正: paramsを await で解決
    const resolvedParams = await params;
    const notificationId = resolvedParams.id;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 管理者チェック
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

    // お知らせの存在確認
    const existingNotification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!existingNotification) {
      return NextResponse.json({ error: 'お知らせが見つかりません' }, { status: 404 });
    }

    // リクエストボディを取得
    const body = await request.json();
    const { title, content, type, priority, imageUrl, startDate, endDate, targetGroup, active } =
      body;

    // お知らせを更新
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        title: title !== undefined ? title : undefined,
        content: content !== undefined ? content : undefined,
        type: type !== undefined ? type : undefined,
        priority: priority !== undefined ? priority : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : endDate === null ? null : undefined,
        targetGroup: targetGroup !== undefined ? targetGroup : undefined,
        active: active !== undefined ? active : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      notification: updatedNotification,
      message: 'お知らせを更新しました',
    });
  } catch (error) {
    logger.error('お知らせ更新エラー:', error);
    return NextResponse.json({ error: 'お知らせの更新に失敗しました' }, { status: 500 });
  }
}

// 🔥 修正: params型をPromiseに変更
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 🔥 修正: paramsを await で解決
    const resolvedParams = await params;
    const notificationId = resolvedParams.id;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 管理者チェック
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

    // お知らせの存在確認
    const existingNotification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!existingNotification) {
      return NextResponse.json({ error: 'お知らせが見つかりません' }, { status: 404 });
    }

    // 関連する既読状態も含めて削除
    await prisma.$transaction([
      prisma.notificationRead.deleteMany({
        where: { notificationId },
      }),
      prisma.notification.delete({
        where: { id: notificationId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'お知らせを削除しました',
    });
  } catch (error) {
    logger.error('お知らせ削除エラー:', error);
    return NextResponse.json({ error: 'お知らせの削除に失敗しました' }, { status: 500 });
  }
}