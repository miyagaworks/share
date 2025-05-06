// app/api/auth/signin/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { signIn } from '@/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, callbackUrl } = body;

    console.log('API route - サインイン試行:', email);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードを入力してください' },
        { status: 400 },
      );
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    // 結果をログに出力（重要な情報は除く）
    console.log(
      'API route - サインイン結果:',
      result ? { success: !!result.url, error: result.error } : 'No result',
    );

    if (result?.error) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 },
      );
    }

    // 成功した場合
    return NextResponse.json({
      success: true,
      url: callbackUrl || '/dashboard',
    });
  } catch (error) {
    console.error('API route - サインインエラー:', error);
    return NextResponse.json({ error: 'ログイン処理中にエラーが発生しました' }, { status: 500 });
  }
}