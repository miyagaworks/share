// app/api/auth/forgot-password/route.ts
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';

// Resendインスタンスを初期化
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };

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
      // セキュリティのため、ユーザーが存在しなくても同じメッセージを返す
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

    // 環境変数からベースURLを取得
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.sns-share.com';
    // リセットリンクを生成
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
    console.log(`リセットリンク: ${resetUrl}`);

    // サイト名を追加（スパムフィルター対策）
    const siteName = 'Share';

    try {
      // Resendを使用してメール送信
      const { error } = await resend.emails.send({
        from: `${siteName} <noreply@sns-share.com>`, // 検証済みドメインのメールアドレス
        to: [user.email],
        subject: `【${siteName}】パスワードリセットのご案内`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">パスワードリセットのご案内</h1>
            <p>${siteName}をご利用いただきありがとうございます。</p>
            <p>パスワードリセットのリクエストを受け付けました。<br>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4A89DC; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">パスワードをリセットする</a>
            </div>
            
            <p>または、以下のURLをブラウザに貼り付けてアクセスしてください：</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${resetUrl}</p>
            
            <p>このリンクは<strong>1時間のみ有効</strong>です。<br>心当たりがない場合は、このメールを無視してください。</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
              <p>${siteName}サポートチーム<br>
              お問い合わせ: <a href="mailto:support@sns-share.com">support@sns-share.com</a></p>
              
              <div style="margin-top: 10px; font-size: 11px; color: #999;">
                <p>すべてのSNS、ワンタップでShare</p>
                <p>〒730-0046 広島県広島市中区昭和町6-11<br>
                運営: ビイアルファ株式会社</p>
                <p>
                  <a href="https://app.sns-share.com/legal/privacy" style="color: #4A89DC; text-decoration: none;">プライバシーポリシー</a> | 
                  <a href="https://app.sns-share.com/legal/terms" style="color: #4A89DC; text-decoration: none;">利用規約</a>
                </p>
              </div>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('メール送信エラー:', error);
        return NextResponse.json(
          { message: 'メール送信に失敗しました', error: error.message },
          { status: 500, headers },
        );
      }

      console.log(`パスワードリセットメールを送信しました: ${user.email}`);
      return NextResponse.json(
        { message: 'パスワードリセット用のリンクをメールで送信しました' },
        { status: 200, headers },
      );
    } catch (emailError) {
      // エラーの詳細なログ
      console.error('メール送信に失敗しました:', emailError);

      // 本番環境でも開発者が問題を特定できるようエラー詳細を返す（一時的）
      return NextResponse.json(
        {
          message: 'メール送信に失敗しました',
          error: emailError instanceof Error ? emailError.message : String(emailError),
        },
        { status: 500, headers },
      );
    }
  } catch (error) {
    console.error('パスワードリセットエラー:', error);
    return NextResponse.json({ message: '処理中にエラーが発生しました' }, { status: 500 });
  }
}