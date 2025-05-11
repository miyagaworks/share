// app/api/auth/forgot-password/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { sendPasswordResetEmailWithSES } from '@/lib/ses';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ message: 'メールアドレスが必要です' }, { status: 400 });
    }

    // 大文字小文字を区別しないメールアドレス検索に変更
    const user = await prisma.user.findFirst({
      where: {
        email: {
          mode: 'insensitive',
          equals: email,
        },
      },
    });

    // ユーザーが見つからない場合
    if (!user) {
      console.log(`ユーザーが見つかりません: ${email}`);
      return NextResponse.json(
        { message: 'パスワードリセット用のリンクをメールで送信しました' },
        { status: 200 },
      );
    }

    // リセットトークンの生成
    const resetToken = randomUUID();
    const expires = new Date(Date.now() + 3600 * 1000); // 1時間後

    // 既存のリセットトークンがあれば削除
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // 新しいリセットトークンを保存
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expires,
      },
    });

    console.log(`リセットトークンを生成しました: ${resetToken}`);

    // メールの送信処理を明示的にエラーハンドリング
    try {
      // SESを使用してパスワードリセットメールを送信
      await sendPasswordResetEmailWithSES(user.email, resetToken);
      console.log(`パスワードリセットメールを送信しました: ${user.email}`);

      return NextResponse.json(
        { message: 'パスワードリセット用のリンクをメールで送信しました' },
        { status: 200 },
      );
    } catch (emailError) {
      // エラーの詳細なログ
      console.error('メール送信に失敗しました:', emailError);

      // エラー詳細を返す
      return NextResponse.json(
        {
          message: 'メール送信に失敗しました',
          error: emailError instanceof Error ? emailError.message : String(emailError),
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('パスワードリセットエラー:', error);
    return NextResponse.json({ message: '処理中にエラーが発生しました' }, { status: 500 });
  }
}