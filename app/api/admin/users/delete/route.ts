// app/api/admin/users/delete/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access';

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
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }

    // 削除対象ユーザーが存在するか確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // 管理者自身は削除不可
    if (user.email === 'admin@sns-share.com') {
      return NextResponse.json({ error: '管理者アカウントは削除できません' }, { status: 403 });
    }

    try {
      // ユーザーのプロフィールを削除
      await prisma.profile.deleteMany({
        where: { userId: userId },
      });

      // ユーザーのSNSリンクを削除
      await prisma.snsLink.deleteMany({
        where: { userId: userId },
      });

      // ユーザーのカスタムリンクを削除
      await prisma.customLink.deleteMany({
        where: { userId: userId },
      });

      // ユーザーのサブスクリプションを削除
      await prisma.subscription.deleteMany({
        where: { userId: userId },
      });

      // ユーザーの請求履歴を削除
      await prisma.billingRecord.deleteMany({
        where: { userId: userId },
      });

      // ユーザーのアカウントを削除
      await prisma.account.deleteMany({
        where: { userId: userId },
      });

      // 最後にユーザー自体を削除
      await prisma.user.delete({
        where: { id: userId },
      });

      console.log(`ユーザー削除完了: ${user.email}`);

      return NextResponse.json({
        success: true,
        message: `ユーザー ${user.name || user.email} を削除しました`,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (dbError) {
      console.error('ユーザー削除中のデータベースエラー:', dbError);
      return NextResponse.json(
        {
          error: 'ユーザー削除中にエラーが発生しました',
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    return NextResponse.json({ error: 'ユーザー削除に失敗しました' }, { status: 500 });
  }
}