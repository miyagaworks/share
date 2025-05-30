// middleware/emailVerificationHandler.ts (JWTベース版)
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function checkEmailVerification(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 認証が不要なパスはスキップ
  const publicPaths = [
    '/auth',
    '/api/auth',
    '/api/auth/verify-email',
    '/api/auth/send-verification-email',
    '/auth/email-verification',
    '/auth/email-verified',
  ];

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // ダッシュボードやAPI エンドポイントへのアクセス時のみチェック
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
      cookieName: 'next-auth.session-token',
    });

    if (token && token.sub) {
      // 🔥 JWTトークンからemailVerified情報を取得
      const emailVerified = token.emailVerified;

      // メールアドレスが未認証の場合
      if (emailVerified === false || emailVerified === null || emailVerified === undefined) {
        console.log('メール未認証ユーザー: 認証画面にリダイレクト');
        return NextResponse.redirect(new URL('/auth/email-verification', request.url));
      }
    }
  }

  return NextResponse.next();
}

// この方法を使用する場合は、auth.config.ts のJWTコールバックで
// emailVerified情報をトークンに含める必要があります：

/*
auth.config.ts に以下を追加:

async jwt({ token, user, trigger }) {
  // ... 既存のコード

  if (user || trigger === 'update') {
    try {
      const userId = user?.id || token.sub;
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          emailVerified: true,
          // ... 他のフィールド
        },
      });

      if (dbUser) {
        token.emailVerified = !!dbUser.emailVerified;
        // ... 他の設定
      }
    } catch (error) {
      console.error('JWTコールバックエラー:', error);
    }
  }

  return token;
}
*/