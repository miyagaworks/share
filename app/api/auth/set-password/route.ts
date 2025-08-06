// app/api/auth/set-password/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

const SetPasswordSchema = z.object({
  password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
});

export async function POST(req: Request) {
  try {
    // セッションの確認
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = SetPasswordSchema.parse(body);

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // パスワードを更新
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    logger.info('Password set for user:', user.email);

    return NextResponse.json({
      success: true,
      message: 'パスワードが正常に設定されました',
    });
  } catch (error) {
    logger.error('Set password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'パスワード設定中にエラーが発生しました' }, { status: 500 });
  }
}