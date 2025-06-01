// app/api/user/check-email-verification/route.ts (修正版)
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(request: Request) {
  try {
    console.log('🔍 メール認証状況確認API開始');

    // 🔥 修正: ミドルウェアからの呼び出しにも対応
    let session;
    let userId;

    // まず通常のセッション取得を試行
    try {
      session = await auth();
      userId = session?.user?.id;
      console.log('✅ セッション取得成功:', { userId: userId ? '有効' : '無効' });
    } catch (sessionError) {
      console.log('⚠️ 通常のセッション取得失敗、トークンから取得を試行');
      console.log('セッションエラー詳細:', sessionError);
    }

    // セッションが取得できない場合はトークンから取得
    if (!userId) {
      try {
        const token = await getToken({
          req: request as Parameters<typeof getToken>[0]['req'],
          secret: process.env.NEXTAUTH_SECRET,
          secureCookie: process.env.NODE_ENV === 'production',
          cookieName: 'next-auth.session-token',
        });

        userId = token?.sub;
        console.log('🔑 トークンから取得:', { userId: userId ? '有効' : '無効' });
      } catch (tokenError) {
        console.log('⚠️ トークン取得も失敗:', tokenError);
      }
    }

    // 🚀 修正: セッションがない場合は適切なレスポンスを返す（401エラーにしない）
    if (!userId) {
      console.log('ℹ️ 認証情報なし - 未ログイン状態として処理');
      return NextResponse.json(
        {
          verified: false,
          message: '認証が必要です',
          requiresLogin: true,
        },
        { status: 200 },
      ); // 🔥 重要: 401ではなく200で返す
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerified: true,
        email: true,
      },
    });

    if (!user) {
      console.log('❌ ユーザーが見つかりません:', userId);
      return NextResponse.json(
        {
          verified: false,
          message: 'ユーザーが見つかりません',
          requiresLogin: true,
        },
        { status: 200 },
      ); // 🔥 重要: 404ではなく200で返す
    }

    const isVerified = !!user.emailVerified;
    console.log('✅ メール認証状況確認完了:', {
      email: user.email,
      verified: isVerified,
      verifiedAt: user.emailVerified,
    });

    return NextResponse.json({
      verified: isVerified,
      email: user.email,
      verifiedAt: user.emailVerified,
    });
  } catch (error) {
    console.error('💥 メール認証状況確認エラー:', error);

    // 🚀 修正: エラー時も500ではなく適切なレスポンスを返す
    return NextResponse.json(
      {
        verified: false,
        message: '処理中にエラーが発生しました',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 200 },
    ); // 🔥 重要: 500ではなく200で返す
  }
}