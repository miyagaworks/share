// app/api/admin/cancel-requests/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

// 管理者権限チェック
async function checkAdminAccess(userId: string) {
  // 簡単な管理者チェック（実際の実装に合わせて調整）
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  return user?.email === process.env.ADMIN_EMAIL || user?.email === 'admin@sns-share.com';
}

// 解約申請一覧取得
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 管理者権限チェック
    const isAdmin = await checkAdminAccess(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
    }

    // 解約申請一覧を取得
    const cancelRequests = await prisma.cancelRequest.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      requests: cancelRequests,
    });
  } catch (error) {
    logger.error('解約申請一覧取得エラー:', error);
    return NextResponse.json({ error: '解約申請の取得に失敗しました' }, { status: 500 });
  }
}