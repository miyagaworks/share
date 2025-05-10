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
      from: `"Share サポートチーム" <${options.from || defaultFrom}>`, // 名前付きの差出人
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      headers: {
        'X-Priority': '1', // メールの優先度を高く設定
        'X-MSMail-Priority': 'High',
        Importance: 'High',
        'X-Mailer': 'Share Application Mailer', // メーラー名を追加
        'Reply-To': options.from || defaultFrom, // 返信先アドレス
      },
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

  // HTMLメール署名
  const htmlSignature = `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 550px; color: #333; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
  <div style="font-size: 16px; font-weight: bold; margin: 0; color: #1E40AF;">Share サポートチーム</div>
  <div style="font-size: 14px; margin: 2px 0 8px; color: #4B5563;">ビイアルファ株式会社 Share運営事務局</div>
  <div style="border-top: 2px solid #3B82F6; margin: 12px 0; width: 100px;"></div>
  
  <div style="font-size: 13px; margin: 4px 0;">
    メール: <a href="mailto:support@sns-share.com" style="color: #3B82F6; text-decoration: none;">support@sns-share.com</a><br>
    電話: 082-208-3976（平日10:00〜18:00 土日祝日休業）<br>
    ウェブ: <a href="https://app.sns-share.com" style="color: #3B82F6; text-decoration: none;">app.sns-share.com</a>
  </div>
  
  <div style="margin: 12px 0; font-style: italic; color: #4B5563; font-size: 13px; border-left: 3px solid #3B82F6; padding-left: 10px;">
    すべてのSNS、ワンタップでShare
  </div>
  
  <div style="font-size: 12px; color: #6B7280; margin-top: 8px;">
    〒730-0046 広島県広島市中区昭和町6-11<br>
    運営: <a href="https://bialpha.com" style="color: #3B82F6; text-decoration: none; font-weight: 500;" target="_blank">ビイアルファ株式会社</a>
  </div>
  
  <div style="margin-top: 10px;">
    <a href="https://app.sns-share.com/legal/privacy" style="display: inline-block; margin-right: 8px; color: #3B82F6; text-decoration: none;">プライバシーポリシー</a> | 
    <a href="https://app.sns-share.com/legal/terms" style="display: inline-block; margin-right: 8px; color: #3B82F6; text-decoration: none;">利用規約</a>
  </div>
</div>
  `;

  // テキストメール署名
  const textSignature = `
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

  // メール本文（テキスト形式）
  const textContent = `
${siteName}をご利用いただきありがとうございます。

パスワードリセットのリクエストを受け付けました。
以下のリンクをクリックして、新しいパスワードを設定してください。

${resetUrl}

このリンクは1時間のみ有効です。
心当たりがない場合は、このメールを無視してください。

※メールが届かない場合は、迷惑メールフォルダもご確認ください。
${textSignature}
  `;

  // メール本文（HTML形式）
  const htmlContent = `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
  <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">パスワードリセットのご案内</h1>
  <p>${siteName}をご利用いただきありがとうございます。</p>
  <p>パスワードリセットのリクエストを受け付けました。<br>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" style="background-color: #4A89DC; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">パスワードをリセットする</a>
  </div>
  
  <p>または、以下のURLをブラウザに貼り付けてアクセスしてください：</p>
  <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${resetUrl}</p>
  
  <p>このリンクは<strong>1時間のみ有効</strong>です。<br>心当たりがない場合は、このメールを無視してください。</p>
  
  <div style="margin: 20px 0; padding: 10px; background-color: #fffbea; border-left: 4px solid #f59e0b; color: #92400e;">
    <p style="margin: 0; font-size: 14px;">
      ※メールが届かない場合は、迷惑メールフォルダもご確認ください。
    </p>
  </div>
  
  ${htmlSignature}
</div>
  `;

  // デバッグログ
  console.log('パスワードリセットURL:', resetUrl);

  // メール送信
  return sendEmail({
    to: email,
    subject: `【${siteName}】パスワードリセットのご案内`,
    text: textContent,
    html: htmlContent,
  });
}