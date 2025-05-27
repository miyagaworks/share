// app/api/debug/session/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getToken } from 'next-auth/jwt';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 セッションデバッグ開始');

    // 1. auth()でセッション取得
    const session = await auth();
    console.log('🔧 auth()セッション:', JSON.stringify(session, null, 2));

    // 2. JWTトークン取得
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    console.log('🔧 JWTトークン:', JSON.stringify(token, null, 2));

    // 3. Cookieの確認
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('next-auth.session-token');
    const callbackUrl = cookieStore.get('next-auth.callback-url');
    const csrfToken = cookieStore.get('next-auth.csrf-token');

    console.log('🔧 Cookies:', {
      sessionToken: sessionToken?.value ? '存在' : '未設定',
      callbackUrl: callbackUrl?.value ? '存在' : '未設定',
      csrfToken: csrfToken?.value ? '存在' : '未設定',
    });

    // 4. リクエストヘッダーの確認
    const headers = {
      'user-agent': request.headers.get('user-agent'),
      cookie: request.headers.get('cookie'),
      authorization: request.headers.get('authorization'),
    };
    console.log('🔧 リクエストヘッダー:', headers);

    return NextResponse.json({
      debug: {
        session: session,
        token: token,
        cookies: {
          sessionToken: !!sessionToken,
          callbackUrl: !!callbackUrl,
          csrfToken: !!csrfToken,
        },
        headers: headers,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('🔧 セッションデバッグエラー:', error);
    return NextResponse.json(
      {
        error: 'Debug session error',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}