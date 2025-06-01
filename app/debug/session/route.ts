// app/api/debug/session/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getToken } from 'next-auth/jwt';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    logger.debug('セッションデバッグ開始');

    // 1. auth()でセッション取得
    const session = await auth();
    logger.debug('auth()セッション', { session });

    // 2. JWTトークン取得
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    logger.debug('JWTトークン', { token });

    // 🔥 修正: cookies()をawaitで解決
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('next-auth.session-token');
    const callbackUrl = cookieStore.get('next-auth.callback-url');
    const csrfToken = cookieStore.get('next-auth.csrf-token');

    const cookieStatus = {
      sessionToken: sessionToken?.value ? '存在' : '未設定',
      callbackUrl: callbackUrl?.value ? '存在' : '未設定',
      csrfToken: csrfToken?.value ? '存在' : '未設定',
    };
    logger.debug('Cookies', cookieStatus);

    // 4. リクエストヘッダーの確認
    const headers = {
      'user-agent': request.headers.get('user-agent'),
      cookie: request.headers.get('cookie'),
      authorization: request.headers.get('authorization'),
    };
    logger.debug('リクエストヘッダー', headers);

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
    logger.error('セッションデバッグエラー', error);
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