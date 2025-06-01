// app/api/admin/permissions/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access-server';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
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
    const { userId, isPermanent } = body;
    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }
    // ユーザーが存在するか確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    // 永久利用権を付与または解除
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // subscriptionStatus を 'permanent' に設定または解除
        subscriptionStatus: isPermanent ? 'permanent' : null,
        // トライアル期間もクリア/設定
        trialEndsAt: isPermanent ? null : user.trialEndsAt,
      },
    });
    return NextResponse.json({
      success: true,
      message: isPermanent ? '永久利用権を付与しました' : '永久利用権を解除しました',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscriptionStatus: updatedUser.subscriptionStatus,
      },
    });
  } catch (error) {
    logger.error('永久利用権の更新エラー:', error);
    return NextResponse.json({ error: '永久利用権の更新に失敗しました' }, { status: 500 });
  }
}