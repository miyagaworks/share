// app/api/auth/signin/route.ts
import { NextResponse } from 'next/server';
import { signIn } from '@/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    console.log('API route - サインイン試行:', email);

    // サーバーサイドでの認証処理
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    console.log('API route - サインイン結果:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API route - サインインエラー:', error);
    return NextResponse.json({ error: 'ログイン処理中にエラーが発生しました' }, { status: 500 });
  }
}