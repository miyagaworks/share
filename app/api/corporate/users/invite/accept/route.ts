// app/api/corporate/users/invite/accept/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { token, password, lastName, firstName, lastNameKana, firstNameKana, name } =
      await request.json();

    // デバッグログ
    console.log('招待受け入れリクエスト:', {
      token: token ? '存在します' : '存在しません',
      password: password ? 'セットされています' : 'セットされていません',
      lastName,
      firstName,
      lastNameKana,
      firstNameKana,
      name,
    });

    if (!token || !password) {
      return NextResponse.json({ error: 'トークンとパスワードが必要です' }, { status: 400 });
    }

    // トークンを検証
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json({ error: 'トークンが無効または期限切れです' }, { status: 400 });
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // 姓名を結合したname値の生成（必要な場合）
    const fullName = name || `${lastName || ''} ${firstName || ''}`.trim();

    // トランザクションでユーザー情報を更新
    await prisma.$transaction([
      // ユーザー情報を更新
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          // 必須フィールド
          password: hashedPassword,
          emailVerified: new Date(), // 認証済みにする

          // 姓名と関連フィールド - 送信されていれば更新
          name: fullName || undefined,
          lastName: lastName || undefined,
          firstName: firstName || undefined,
          lastNameKana: lastNameKana || undefined,
          firstNameKana: firstNameKana || undefined,
        },
      }),
      // 使用済みトークンを削除
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    // デバッグログ
    console.log('ユーザー更新完了:', {
      userId: resetToken.userId,
      name: fullName,
      lastName,
      firstName,
      lastNameKana,
      firstNameKana,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('招待受け入れエラー:', error);
    return NextResponse.json({ error: '招待の受け入れ中にエラーが発生しました' }, { status: 500 });
  }
}