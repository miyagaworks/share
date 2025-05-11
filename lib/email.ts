// lib/email.ts（シンプルなテキストメール版）
import nodemailer from 'nodemailer';

// SMTPトランスポーターの設定
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  secure: process.env.EMAIL_SERVER_PORT === '465',
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  // デバッグ設定を追加（送信問題の詳細を把握するため）
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development',
});

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

/**
 * メールを送信する関数
 */
export async function sendEmail(options: EmailOptions) {
  // メール送信元設定をENV変数から取得
  const fromAddress = process.env.EMAIL_FROM || 'noreply@sns-share.com';

  try {
    // テキストメールのみ送信する設定
    const mailOptions = {
      from: `"Share" <${fromAddress}>`, // 送信元表示名を追加
      to: options.to,
      subject: options.subject,
      text: options.text,
      // デバッグ用設定
      envelope: {
        from: fromAddress,
        to: options.to,
      },
    };

    console.log('メール送信を試みます:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const result = await transporter.sendMail(mailOptions);
    console.log('メール送信成功:', result.messageId, result.envelope);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('メール送信エラー:', error);
    throw error;
  }
}

/**
 * パスワードリセットメールを送信する関数（テキストのみ）
 */
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  // ベースURL
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    'https://app.sns-share.com';

  // リセットURL
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

  // 極めてシンプルなテキストメール
  const textContent = `
Shareをご利用いただきありがとうございます。

パスワードリセットのリクエストを受け付けました。
以下のリンクをクリックして、新しいパスワードを設定してください。

${resetUrl}

このリンクは1時間のみ有効です。
心当たりがない場合は、このメールを無視してください。

メールが届かない場合は、迷惑メールフォルダもご確認ください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Share サポートチーム
${process.env.SUPPORT_EMAIL || 'support@sns-share.com'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  // デバッグログ
  console.log('パスワードリセットURL:', resetUrl);

  // メール送信（テキストのみ）
  return sendEmail({
    to: email,
    subject: `【Share】パスワードリセットのご案内`,
    text: textContent,
  });
}