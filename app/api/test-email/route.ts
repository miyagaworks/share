// app/api/test-email/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import nodemailer from 'nodemailer';
import { sendEmail } from '@/lib/email';
export async function GET() {
  // 環境変数の出力（機密情報は伏せる）
  logger.debug({
    NODE_ENV: process.env.NODE_ENV,
    EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
    EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
    EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
    EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD ? '設定あり' : 'なし',
    EMAIL_FROM: process.env.EMAIL_FROM,
  });
  // 一時的なトランスポーターを作成してテスト
  const testTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT) || 587,
    secure: process.env.EMAIL_SERVER_PORT === '465',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
  try {
    // SMTP接続テスト
    const verify = await testTransporter.verify();
    logger.debug('SMTP接続テスト結果:', verify);
    // 実際にテストメールを送信
    try {
      const result = await sendEmail({
        to: process.env.EMAIL_SERVER_USER || 'support@sns-share.com', // 自分自身にテストメール
        subject: 'テストメール',
        text: 'これはテストメールです。送信時刻: ' + new Date().toISOString(),
      });
      return NextResponse.json({
        success: true,
        message: 'テストメール送信成功',
        smtpVerify: verify,
        emailResult: result,
      });
    } catch (emailError) {
      logger.error('メール送信エラー:', emailError);
      return NextResponse.json(
        {
          success: false,
          message: 'メール送信失敗',
          smtpVerify: verify,
          error: String(emailError),
        },
        { status: 500 },
      );
    }
  } catch (error) {
    logger.error('SMTP接続エラー:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'SMTP接続失敗',
        error: String(error),
      },
      { status: 500 },
    );
  }
}
