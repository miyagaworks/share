// app/api/admin/cancel-requests/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { checkAdminAccess } from '@/lib/utils/admin-access-api';

// 解約申請一覧取得
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 管理者権限チェック（スーパー管理者 + 財務管理者）
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