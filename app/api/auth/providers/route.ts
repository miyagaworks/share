// app/api/auth/providers/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 静的なプロバイダーリストを返す
    return NextResponse.json({
      google: {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        signinUrl: '/api/auth/signin/google',
        callbackUrl: '/api/auth/callback/google',
      },
      credentials: {
        id: 'credentials',
        name: 'メールアドレス/パスワード',
        type: 'credentials',
        signinUrl: '/api/auth/signin/credentials',
        callbackUrl: '/api/auth/callback/credentials',
      },
    });
  } catch (error) {
    console.error('Providers API error:', error);
    return NextResponse.json({ error: '認証エラーが発生しました' }, { status: 500 });
  }
}
