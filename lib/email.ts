// lib/email.ts
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
  // デフォルトの送信元メールアドレス
  const defaultFrom = process.env.EMAIL_FROM || 'support@sns-share.com';

  // 開発環境でもメール送信を強制する環境変数
  const forceEmailInDev = process.env.FORCE_EMAIL_IN_DEV === 'true';

  // 開発環境の場合はコンソールにログ出力のみ（FORCE_EMAIL_IN_DEV=true の場合を除く）
  if (process.env.NODE_ENV === 'development' && !forceEmailInDev) {
    console.log(
      '開発環境: メール送信をスキップします（強制送信するには FORCE_EMAIL_IN_DEV=true を設定）',
    );
    console.log({
      from: options.from || defaultFrom,
      to: options.to,
      subject: options.subject,
      text: options.text.substring(0, 100) + '...',
    });
    return { success: true, messageId: 'dev-environment-skip' };
  }

  try {
    const mailOptions = {
      from: options.from || defaultFrom,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    console.log('メール送信を試みます:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    const result = await transporter.sendMail(mailOptions);
    console.log('メール送信成功:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('メール送信エラー:', error);
    throw error;
  }
}

/**
 * 確認メールを送信する関数
 */
export async function sendVerificationEmail(email: string, verificationUrl: string) {
  return sendEmail({
    to: email,
    subject: 'メールアドレスの確認',
    text: `メールアドレスを確認するには、以下のリンクをクリックしてください。\n\n${verificationUrl}\n\n`,
    html: `
      <div>
        <h1>メールアドレスの確認</h1>
        <p>メールアドレスを確認するには、以下のリンクをクリックしてください。</p>
        <p><a href="${verificationUrl}">メールアドレスを確認する</a></p>
      </div>
    `,
  });
}

/**
 * パスワードリセットメールを送信する関数
 */
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  // 単純化したコード：トークンをそのまま使用
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    'https://app.sns-share.com';

  // URLの正規化（末尾のスラッシュを削除）
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  // シンプルにリセットURLを生成
  const resetUrl = `${normalizedBaseUrl}/auth/reset-password?token=${resetToken}`;

  // デバッグログ
  console.log('パスワードリセットURL:', resetUrl);

  return sendEmail({
    to: email,
    subject: 'パスワードリセットのご案内',
    text: `パスワードをリセットするには、以下のリンクをクリックしてください。\n\n${resetUrl}\n\nこのリンクは1時間有効です。心当たりがない場合は、このメールを無視してください。`,
    html: `
      <div>
        <h1>パスワードリセットのご案内</h1>
        <p>パスワードをリセットするには、以下のリンクをクリックしてください。</p>
        <p><a href="${resetUrl}">パスワードをリセットする</a></p>
        <p>このリンクは1時間有効です。心当たりがない場合は、このメールを無視してください。</p>
      </div>
    `,
  });
}