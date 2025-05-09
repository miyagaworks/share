// app/api/debug-auth/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    // ヘッダー情報を取得（デバッグ用）
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'cookie' && key.toLowerCase() !== 'authorization') {
        headers[key] = value;
      } else {
        headers[key] = value.substring(0, 20) + '...';
      }
    });

    // 認証情報を取得
    const session = await auth();

    // クッキー情報（デバッグ用）
    let cookies: string[] = [];
    if (typeof request.headers.get('cookie') === 'string') {
      cookies = request.headers
        .get('cookie')!
        .split(';')
        .map((c) => c.trim());
    }

    // 基本的な認証情報のみを返す
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          }
        : null,
      expires: session?.expires,
      debug: {
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL?.substring(0, 20) + '...',
        headers: headers,
        hasCookies: cookies.length > 0,
        authCookies: cookies.filter((c) => c.includes('next-auth')).map((c) => c.split('=')[0]),
      },
    });
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json(
      {
        error: 'Authentication debug failed',
        errorDetails: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}