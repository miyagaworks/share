// lib/email.ts の開発環境設定を確認・修正

import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

// Resendのインスタンスを作成
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * メールを送信する関数
 */
export async function sendEmail(options: EmailOptions) {
  // デフォルトの送信元メールアドレス
  const defaultFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  // 開発環境でもメール送信を強制する環境変数
  const forceEmailInDev = process.env.FORCE_EMAIL_IN_DEV === 'true';

  // 開発環境の場合の詳細ログ出力
  console.log('📧 メール送信リクエスト:', {
    to: options.to,
    subject: options.subject,
    env: process.env.NODE_ENV,
    forceEmailInDev,
    hasResendKey: !!process.env.RESEND_API_KEY,
    from: options.from || defaultFrom,
  });

  // 開発環境でメール送信をスキップする場合
  if (process.env.NODE_ENV === 'development' && !forceEmailInDev) {
    console.log(
      '🔧 開発環境: メール送信をスキップ（強制送信するには FORCE_EMAIL_IN_DEV=true を設定）',
    );
    console.log('📝 メール内容プレビュー:', {
      from: options.from || defaultFrom,
      to: options.to,
      subject: options.subject,
      textPreview: options.text.substring(0, 200) + '...',
    });

    // 開発環境でも成功として返す
    return { success: true, messageId: 'dev-environment-skip' };
  }

  // Resend APIキーの確認
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY が設定されていません');
    throw new Error('RESEND_API_KEY が設定されていません');
  }

  try {
    console.log('📨 Resend APIを使用してメール送信中...');

    // Resend APIを使用してメールを送信
    const result = await resend.emails.send({
      from: options.from || defaultFrom,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    if (result?.error) {
      console.error('❌ Resend API エラー:', result.error);
      throw new Error(`Resend API error: ${result.error.message}`);
    }

    console.log('✅ メール送信成功:', {
      messageId: result?.data?.id,
      to: options.to,
    });

    return { success: true, messageId: result?.data?.id || 'unknown' };
  } catch (error) {
    console.error('❌ メール送信エラー:', error);

    // 開発環境では詳細エラー情報を出力
    if (process.env.NODE_ENV === 'development') {
      console.error('📋 エラー詳細:', {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    throw error;
  }
}

// 開発環境用のテストメール送信関数
export async function testEmailInDevelopment(email: string) {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('この関数は開発環境でのみ使用できます');
  }

  console.log('🧪 開発環境でのメール送信テスト開始');

  try {
    const result = await sendEmail({
      to: email,
      subject: '【Share】開発環境テストメール',
      text: `これは開発環境でのテストメールです。

時刻: ${new Date().toLocaleString()}
環境: ${process.env.NODE_ENV}
Resend APIキー: ${process.env.RESEND_API_KEY ? '設定済み' : '未設定'}

このメールが届いている場合、メール送信機能は正常に動作しています。`,
      html: `
        <h2>開発環境テストメール</h2>
        <p>これは開発環境でのテストメールです。</p>
        <ul>
          <li>時刻: ${new Date().toLocaleString()}</li>
          <li>環境: ${process.env.NODE_ENV}</li>
          <li>Resend APIキー: ${process.env.RESEND_API_KEY ? '✅ 設定済み' : '❌ 未設定'}</li>
        </ul>
        <p>このメールが届いている場合、メール送信機能は正常に動作しています。</p>
      `,
    });

    console.log('✅ テストメール送信成功:', result);
    return result;
  } catch (error) {
    console.error('❌ テストメール送信失敗:', error);
    throw error;
  }
}