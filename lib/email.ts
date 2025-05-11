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
    // テキストメールのみの送信設定
    const mailOptions = {
      from: options.from || defaultFrom,
      to: options.to,
      subject: options.subject,
      text: options.text,
      // HTMLメールに問題がある場合はコメントアウト
      // html: options.html,
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
 * パスワードリセットメールを送信する関数（テキストメールのみ）
 */
export async function sendPasswordResetEmail(email: string, resetToken: string) {
  // ベースURL
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    'https://app.sns-share.com';

  // URLの正規化（末尾のスラッシュを削除）
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  // リセットURL
  const resetUrl = `${normalizedBaseUrl}/auth/reset-password?token=${resetToken}`;

  // サイト名
  const siteName = 'Share';

  // テキストのみのシンプルなメール
  const textContent = `
  ${siteName}をご利用いただきありがとうございます。

  パスワードリセットのリクエストを受け付けました。
  以下のリンクをクリックして、新しいパスワードを設定してください。

  ${resetUrl}

  このリンクは1時間のみ有効です。
  心当たりがない場合は、このメールを無視してください。

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Share サポートチーム
  ビイアルファ株式会社 Share運営事務局

  メール: support@sns-share.com
  電話: 082-208-3976（平日10:00〜18:00 土日祝日休業）
  ウェブ: https://app.sns-share.com

  すべてのSNS、ワンタップでShare

  〒730-0046 広島県広島市中区昭和町6-11
  運営: ビイアルファ株式会社 (https://bialpha.com)

  プライバシーポリシー: https://app.sns-share.com/legal/privacy
  利用規約: https://app.sns-share.com/legal/terms
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;

  // デバッグログ
  console.log('パスワードリセットURL:', resetUrl);

  // メール送信（HTMLメールに問題がある場合はhtmlオプションを削除）
  return sendEmail({
    to: email,
    subject: `【${siteName}】パスワードリセットのご案内`,
    text: textContent,
    // html: htmlContent, // HTMLメールに問題がある場合はコメントアウト
  });
}