// lib/email.ts
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// AWS SES クライアントの設定
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
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
 * Amazon SESを使用してメールを送信する関数
 */
export async function sendEmail(options: EmailOptions) {
  // デフォルトの送信元メールアドレス
  const defaultFrom = process.env.SUPPORT_EMAIL || 'support@sns-share.com';

  // 開発環境の場合はコンソールにログ出力のみ
  if (process.env.NODE_ENV === 'development') {
    console.log('開発環境: メール送信をスキップします');
    console.log({
      from: options.from || defaultFrom,
      to: options.to,
      subject: options.subject,
      text: options.text.substring(0, 100) + '...',
    });
    return { success: true, messageId: 'dev-environment-skip' };
  }

  try {
    const command = new SendEmailCommand({
      Source: options.from || defaultFrom,
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: options.text,
            Charset: 'UTF-8',
          },
          // HTML版が提供されている場合は使用
          ...(options.html
            ? {
                Html: {
                  Data: options.html,
                  Charset: 'UTF-8',
                },
              }
            : {}),
        },
      },
    });

    const result = await sesClient.send(command);
    console.log('メール送信成功:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error('メール送信エラー:', error);
    throw error;
  }
}