// lib/email.ts
import { Resend } from 'resend';
import { logger } from '@/lib/utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * メールを送信する関数
 */
export async function sendEmail(options: EmailOptions) {
  const defaultFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const forceEmailInDev = process.env.FORCE_EMAIL_IN_DEV === 'true';

  // 開発環境でメール送信をスキップする場合
  if (process.env.NODE_ENV === 'development' && !forceEmailInDev) {
    logger.info('開発環境: メール送信をスキップ');
    return { success: true, messageId: 'dev-environment-skip' };
  }

  if (!process.env.RESEND_API_KEY) {
    logger.error('RESEND_API_KEY が設定されていません');
    throw new Error('RESEND_API_KEY が設定されていません');
  }

  try {
    const result = await resend.emails.send({
      from: options.from || defaultFrom,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    if (result?.error) {
      logger.error('Resend API エラー:', result.error);
      throw new Error(`Resend API error: ${result.error.message}`);
    }

    logger.info('メール送信成功:', {
      messageId: result?.data?.id,
      to: options.to,
    });

    return { success: true, messageId: result?.data?.id || 'unknown' };
  } catch (error) {
    logger.error('メール送信エラー:', error);
    throw error;
  }
}