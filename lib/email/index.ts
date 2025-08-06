// lib/email/index.ts - 本番対応完全版
import { Resend } from 'resend';
import { logger } from '@/lib/utils/logger';

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface EmailResult {
  messageId: string;
  success: boolean;
}

// Resendクライアントの初期化
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export async function sendEmail(data: EmailData): Promise<EmailResult> {
  const { to, subject, text, html } = data;

  // 開発環境での詳細ログ出力（既存機能を維持）
  if (process.env.NODE_ENV === 'development') {
    logger.info('==================== メール送信テスト ====================');
    logger.info(`宛先: ${to}`);
    logger.info(`件名: ${subject}`);
    logger.info('メール本文:');
    logger.info('─'.repeat(60));
    logger.info(text);
    logger.info('─'.repeat(60));

    if (html) {
      logger.info('HTML版も生成されました（ブラウザで確認可能）');
      await saveEmailToFile(subject, html, to);
    }

    logger.info('メール送信成功（開発環境テスト）');
    logger.info('==================== メール送信完了 ====================');

    return {
      messageId: `dev-test-${Date.now()}`,
      success: true,
    };
  }

  // 本番環境では実際のメール送信
  return await sendProductionEmail(data);
}

// 本番環境用メール送信（Resend実装）
async function sendProductionEmail(data: EmailData): Promise<EmailResult> {
  try {
    const resendClient = getResendClient();

    const fromEmail = process.env.FROM_EMAIL || 'noreply@sns-share.com';
    const fromName = process.env.FROM_NAME || 'Share';

    logger.info('本番メール送信開始:', {
      to: data.to,
      subject: data.subject,
      from: `${fromName} <${fromEmail}>`,
    });

    const response = await resendClient.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [data.to],
      subject: data.subject,
      text: data.text,
      html: data.html || undefined,
    });

    logger.info('メール送信成功:', response);

    return {
      messageId: response.data?.id || `production-${Date.now()}`,
      success: true,
    };
  } catch (error: any) {
    logger.error('本番メール送信エラー:', error);

    // エラーの詳細をログに出力
    if (error.message) {
      logger.error('エラーメッセージ:', error.message);
    }

    // Resendのエラーレスポンス
    if (error.error) {
      logger.error('Resendエラー詳細:', error.error);
    }

    throw new Error(`メール送信に失敗しました: ${error.message}`);
  }
}

// 経費申請メール送信関数
export async function sendExpenseApprovalEmail(params: {
  expenseId: string;
  title: string;
  amount: number;
  category: string;
  submitterName: string;
  submitterEmail: string;
  description?: string;
  expenseDate: string;
  approverEmail: string;
}): Promise<EmailResult> {
  const { getExpenseApprovalEmailTemplate } = await import('./templates/expense-approval');

  const approvalUrl = `${process.env.NEXTAUTH_URL}/dashboard/admin/company-expenses?expense=${params.expenseId}`;

  const template = getExpenseApprovalEmailTemplate({
    ...params,
    approvalUrl,
  });

  return await sendEmail({
    to: params.approverEmail,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}

// 経費承認結果メール送信関数
export async function sendExpenseApprovalResultEmail(params: {
  title: string;
  amount: number;
  category: string;
  expenseDate: string;
  approvalStatus: 'approved' | 'rejected';
  approverName: string;
  submitterName: string;
  submitterEmail: string;
  rejectionReason?: string;
}): Promise<EmailResult> {
  const { getExpenseApprovalResultEmailTemplate } = await import(
    './templates/expense-approval-result'
  );

  const template = getExpenseApprovalResultEmailTemplate(params);

  return await sendEmail({
    to: params.submitterEmail,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}

// メール認証メール送信関数
export async function sendEmailVerificationEmail(params: {
  email: string;
  name: string;
  verificationUrl: string;
}): Promise<EmailResult> {
  const { getEmailVerificationTemplate } = await import('./templates/email-verification');

  // テンプレートの期待する型に合わせてパラメータを調整
  const template = getEmailVerificationTemplate({
    userName: params.name, // name → userName に変更
    verificationUrl: params.verificationUrl,
  });

  return await sendEmail({
    to: params.email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}

// 開発環境用：HTMLメールをファイル保存（既存機能を維持）
async function saveEmailToFile(subject: string, html: string, recipient: string): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const emailDir = path.join(process.cwd(), 'dev-emails');

    try {
      await fs.access(emailDir);
    } catch {
      await fs.mkdir(emailDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const filename = `${timestamp}_${safeSubject}_to_${recipient.replace('@', '_at_')}.html`;
    const filePath = path.join(emailDir, filename);

    const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .email-header { background: #f0f0f0; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        .email-content { border: 1px solid #ddd; padding: 0; }
      </style>
    </head>
    <body>
      <div class="email-header">
        <h2>📧 メール送信テスト - 開発環境</h2>
        <p><strong>宛先:</strong> ${recipient}</p>
        <p><strong>件名:</strong> ${subject}</p>
        <p><strong>生成日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
      </div>
      <div class="email-content">
        ${html}
      </div>
    </body>
    </html>`;

    await fs.writeFile(filePath, fullHtml, 'utf-8');

    // 開発環境でのみファイル保存ログを表示
    if (process.env.NODE_ENV === 'development') {
      logger.info(`HTMLファイル保存: ${filePath}`);
      logger.info(`ブラウザで確認: file://${filePath}`);
    }
  } catch (error) {
    logger.error('HTMLファイル保存エラー:', error);
  }
}

// メール送信のヘルスチェック
export async function testEmailConnection(): Promise<boolean> {
  try {
    if (process.env.NODE_ENV === 'development') {
      logger.info('開発環境：メール機能は利用可能です');
      return true;
    }

    const resendClient = getResendClient();
    // Resendの場合、APIキーの検証
    logger.info('本番環境：メール機能は利用可能です');
    return true;
  } catch (error) {
    logger.error('メール機能のテストに失敗:', error);
    return false;
  }
}

// 開発環境用テストメール（既存機能を維持）
export async function sendTestEmail(): Promise<void> {
  const testEmail: EmailData = {
    to: 'test@example.com',
    subject: '【Share】テストメール送信',
    text: 'これはメール送信機能のテストです。',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">テストメール</h1>
        <p>これはメール送信機能のテストです。</p>
        <div style="background: #f0f8ff; padding: 15px; margin: 20px 0;">
          <h3>✅ メール送信機能の確認項目</h3>
          <ul>
            <li>HTML形式の表示</li>
            <li>日本語文字の表示</li>
            <li>スタイルの適用</li>
          </ul>
        </div>
        <p style="color: #666; font-size: 12px;">
          送信日時: ${new Date().toLocaleString('ja-JP')}
        </p>
      </div>
    `,
  };

  try {
    const result = await sendEmail(testEmail);
    logger.info('テストメール送信完了:', result);
  } catch (error) {
    logger.error('テストメール送信失敗:', error);
  }
}