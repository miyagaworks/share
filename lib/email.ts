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
  const defaultFrom = process.env.EMAIL_FROM || 'noreply@sns-share.com';

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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.sns-share.com';
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
  
  console.log('パスワードリセットURL:', resetUrl);
  
  // サイト名を追加（スパムフィルター対策）
  const siteName = 'Share';
  
  return sendEmail({
    to: email,
    subject: `【${siteName}】パスワードリセットのご案内`,
    text: `${siteName}をご利用いただきありがとうございます。

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
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
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
        </div>
      </div>
    `,
  });
}