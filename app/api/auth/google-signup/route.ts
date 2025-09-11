// app/api/auth/google-signup/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recaptchaToken } = body;

    if (!recaptchaToken) {
      return NextResponse.json({ error: 'reCAPTCHA認証が必要です' }, { status: 400 });
    }

    // Cookieを設定してレスポンスを返す（リダイレクトしない）
    const response = NextResponse.json({ success: true });
    response.cookies.set('is_signup_flow', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5分間有効
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google signup route error:', error);
    return NextResponse.json({ error: 'エラーが発生しました' }, { status: 500 });
  }
}