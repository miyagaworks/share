// app/api/auth/signin/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { LoginSchema } from '@/schemas/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    console.log('API route - サインイン試行:', email);

    // バリデーション
    const validatedFields = LoginSchema.safeParse({ email, password });
    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: '入力が正しくありません',
        },
        { status: 400 },
      );
    }

    // ユーザーを直接データベースで検索
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        {
          error: 'メールアドレスまたはパスワードが正しくありません',
        },
        { status: 401 },
      );
    }

    // パスワード検証
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: 'メールアドレスまたはパスワードが正しくありません',
        },
        { status: 401 },
      );
    }

    // 認証成功
    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
    });
  } catch (error: unknown) {
    // エラータイプの明示
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    console.error('API route - サインインエラー詳細:', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'ログイン処理中にエラーが発生しました',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}