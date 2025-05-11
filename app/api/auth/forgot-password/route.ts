// app/api/auth/forgot-password/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

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

    // ダイレクトにリンクを生成して返す（メール送信を一時的にスキップ）
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.sns-share.com';
    const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    try {
      // 例外処理を厳格に行い、メールが送信できなくてもリセットトークンは生成
      await sendPasswordResetEmail(user.email, resetToken);
      console.log(`パスワードリセットメールを送信しました: ${user.email}`);

      return NextResponse.json(
        {
          message: 'パスワードリセット用のリンクをメールで送信しました',
          // デバッグ目的で一時的にリンクも返す（本番環境では削除すること）
          debug: process.env.NODE_ENV === 'development' ? { resetLink } : undefined,
        },
        { status: 200 },
      );
    } catch (emailError) {
      console.error('メール送信に失敗しました:', emailError);

      // メール送信に失敗しても、リセットトークンは生成済みなので成功レスポンスを返す
      // ユーザーにはデバッグモードの場合のみリンクを直接表示
      return NextResponse.json(
        {
          message: 'パスワードリセット用のリンクをメールで送信しました',
          // デバッグ目的で一時的にリンクも返す（本番環境では削除すること）
          debug:
            process.env.NODE_ENV === 'development'
              ? {
                  resetLink,
                  error: emailError instanceof Error ? emailError.message : String(emailError),
                }
              : undefined,
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error('パスワードリセットエラー:', error);
    return NextResponse.json({ message: '処理中にエラーが発生しました' }, { status: 500 });
  }
}