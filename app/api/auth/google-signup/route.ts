// app/api/auth/google-signup/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  // 本番環境のURL
  const baseUrl = process.env.NEXTAUTH_URL || 'https://app.sns-share.com';

  // 新規登録フラグをCookieに設定してGoogleログインへリダイレクト
  const response = NextResponse.redirect(
    `${baseUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent('/dashboard')}`,
  );

  // 重要: このCookieをauth.tsで読み取る
  response.cookies.set('is_signup_flow', 'true', {
    httpOnly: true,
    secure: true, // 本番環境では必須
    sameSite: 'lax',
    maxAge: 300, // 5分間有効
    path: '/',
    // domainは設定しない（同一ドメインで十分）
  });

  return response;
}