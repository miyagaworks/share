// lib/email/index.ts
// 開発環境でもメールテストが可能な実装

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

export async function sendEmail(data: EmailData): Promise<EmailResult> {
  const { to, subject, text, html } = data;

  // 🆕 開発環境での詳細ログ出力
  if (process.env.NODE_ENV === 'development') {
    // コンソールで見やすい形式で出力
    console.log('\n📧 ==================== メール送信テスト ====================');
    console.log('🎯 宛先:', to);
    console.log('📝 件名:', subject);
    console.log('📄 メール本文:');
    console.log('─'.repeat(60));
    console.log(text);
    console.log('─'.repeat(60));

    if (html) {
      console.log('🌐 HTML版も生成されました（ブラウザで確認可能）');
      // 🆕 HTMLをファイルに保存してブラウザで確認可能にする
      await saveEmailToFile(subject, html, to);
    }

    console.log('✅ メール送信成功（開発環境テスト）');
    console.log('==================== メール送信完了 ====================\n');

    return {
      messageId: `dev-test-${Date.now()}`,
      success: true,
    };
  }

  // 本番環境では実際のメール送信
  return await sendProductionEmail(data);
}

// 🆕 開発環境用：HTMLメールをファイル保存
async function saveEmailToFile(subject: string, html: string, recipient: string): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    // プロジェクトルートにdev-emailsディレクトリを作成
    const emailDir = path.join(process.cwd(), 'dev-emails');

    try {
      await fs.access(emailDir);
    } catch {
      await fs.mkdir(emailDir, { recursive: true });
    }

    // タイムスタンプ付きのファイル名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const filename = `${timestamp}_${safeSubject}_to_${recipient.replace('@', '_at_')}.html`;
    const filePath = path.join(emailDir, filename);

    // HTMLファイルとして保存
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
    console.log(`📁 HTMLファイル保存: ${filePath}`);
    console.log(`🌐 ブラウザで確認: file://${filePath}`);
  } catch (error) {
    console.error('HTMLファイル保存エラー:', error);
  }
}

// 本番環境用のメール送信（後で実装）
async function sendProductionEmail(data: EmailData): Promise<EmailResult> {
  try {
    // TODO: 実際のメール送信サービス（SendGrid、Resend等）を実装
    console.log('🚀 本番環境メール送信:', data.to);

    // 仮の実装
    return {
      messageId: `production-${Date.now()}`,
      success: true,
    };
  } catch (error) {
    console.error('本番メール送信エラー:', error);
    throw error;
  }
}

// 🆕 開発環境用：テストメール送信関数
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
    console.log('✅ テストメール送信完了:', result);
  } catch (error) {
    console.error('❌ テストメール送信失敗:', error);
  }
}