// app/api/user/check-email-verification/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
export async function GET(request: Request) {
  try {
    let session;
    let userId;
    // セッション取得を試行
    try {
      session = await auth();
      userId = session?.user?.id;
    } catch {
      // セッション取得失敗時はトークンから取得を試行
    }
    // セッションが取得できない場合はトークンから取得
    if (!userId) {
      try {
        const token = await getToken({
          req: request as Parameters<typeof getToken>[0]['req'],
          secret: process.env.NEXTAUTH_SECRET, // cspell:disable-line
          secureCookie: process.env.NODE_ENV === 'production',
          cookieName: 'next-auth.session-token',
        });
        userId = token?.sub;
      } catch {
        // トークン取得も失敗
      }
    }
    if (!userId) {
      return NextResponse.json(
        {
          verified: false,
          message: '認証が必要です',
          requiresLogin: true,
        },
        { status: 200 },
      );
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerified: true,
        email: true,
      },
    });
    if (!user) {
      return NextResponse.json(
        {
          verified: false,
          message: 'ユーザーが見つかりません',
          requiresLogin: true,
        },
        { status: 200 },
      );
    }
    const isVerified = !!user.emailVerified;
    return NextResponse.json({
      verified: isVerified,
      email: user.email,
      verifiedAt: user.emailVerified,
    });
  } catch {
    return NextResponse.json(
      {
        verified: false,
        message: '処理中にエラーが発生しました',
      },
      { status: 200 },
    );
  }
}