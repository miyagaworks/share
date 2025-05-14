// app/api/admin/access/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          isSuperAdmin: false,
          error: '認証されていません',
        },
        { status: 401 },
      );
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          isSuperAdmin: false,
          error: 'ユーザーが見つかりません',
        },
        { status: 404 },
      );
    }

    // 管理者メールアドレスリスト
    const ADMIN_EMAILS = ['admin@sns-share.com'];
    const isAdminEmail = ADMIN_EMAILS.includes(user.email.toLowerCase());

    // 永久利用権ユーザーは管理者になれない
    if (user.subscriptionStatus === 'permanent' && !isAdminEmail) {
      console.log('永久利用権ユーザーには管理者権限を付与しません:', {
        userId: session.user.id,
        email: session.user.email,
      });

      return NextResponse.json({
        isSuperAdmin: false,
        userId: session.user.id,
        email: session.user.email,
        message: '永久利用権ユーザーには管理者権限は付与されません',
      });
    }

    // 管理者チェック - メールアドレスで判定
    const isAdmin = isAdminEmail || user.subscriptionStatus === 'admin';

    console.log('管理者チェック結果:', {
      userId: session.user.id,
      email: session.user.email,
      isAdmin,
    });

    return NextResponse.json({
      isSuperAdmin: isAdmin,
      userId: session.user.id,
      email: session.user.email,
      message: isAdmin ? '管理者権限が確認されました' : '管理者権限がありません',
    });
  } catch (error) {
    console.error('管理者アクセスチェックエラー:', error);
    return NextResponse.json(
      {
        isSuperAdmin: false,
        error: '管理者アクセスチェック中にエラーが発生しました',
      },
      { status: 500 },
    );
  }
}