export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get('error');

  // エラーメッセージの整形
  let errorMessage = '認証エラーが発生しました';
  if (error === 'CredentialsSignin') {
    errorMessage = 'メールアドレスまたはパスワードが間違っています';
  } else if (error === 'SessionRequired') {
    errorMessage = 'このページにアクセスするにはログインが必要です';
  }

  return NextResponse.json({ error: errorMessage }, { status: 400 });
}