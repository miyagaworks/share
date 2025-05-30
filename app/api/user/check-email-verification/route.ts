// app/api/user/check-email-verification/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(request: Request) {
  try {
    // 🔥 修正: ミドルウェアからの呼び出しにも対応
    let session;
    let userId;

    // まず通常のセッション取得を試行
    try {
      session = await auth();
      userId = session?.user?.id;
    } catch {
      console.log('通常のセッション取得失敗、トークンから取得を試行');
    }

    // セッションが取得できない場合はトークンから取得
    if (!userId) {
      const token = await getToken({
        req: request as Parameters<typeof getToken>[0]['req'],
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === 'production',
        cookieName: 'next-auth.session-token',
      });

      userId = token?.sub;
    }

    if (!userId) {
      return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerified: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      verified: !!user.emailVerified,
      email: user.email,
      verifiedAt: user.emailVerified,
    });
  } catch (error) {
    console.error('メール認証状況確認エラー:', error);
    return NextResponse.json({ message: '処理中にエラーが発生しました' }, { status: 500 });
  }
}