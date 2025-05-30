// lib/email/templates/email-verification.ts

interface EmailVerificationParams {
  verificationUrl: string;
  userName?: string;
  email: string;
  isResend?: boolean;
}

export function getEmailVerificationTemplate(params: EmailVerificationParams) {
  const { verificationUrl, userName, email, isResend = false } = params;
  const siteName = 'Share';

  const subject = isResend
    ? `【${siteName}】メールアドレス認証リンクの再送`
    : `【${siteName}】メールアドレスの認証をお願いします`;

  const titleText = isResend ? 'メールアドレス認証リンクの再送' : 'メールアドレスの認証';

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
        <!-- ヘッダー -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; font-size: 28px; margin: 0; font-weight: bold;">${siteName}</h1>
          <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 14px;">すべてのSNS、ワンタップでShare</p>
        </div>
        
        <!-- メインコンテンツ -->
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px 0;">${titleText}</h2>
          
          ${userName ? `<p style="color: #374151; margin: 0 0 16px 0;">${userName} 様</p>` : ''}
          
          ${
            isResend
              ? `
            <p style="color: #374151; margin: 0 0 16px 0; line-height: 1.5;">
              メールアドレス認証リンクを再送信いたします。
            </p>
          `
              : `
            <p style="color: #374151; margin: 0 0 16px 0; line-height: 1.5;">
              ${siteName}にご登録いただき、ありがとうございます。<br>
              アカウントのセットアップを完了するため、メールアドレスの認証をお願いいたします。
            </p>
          `
          }
          
          <p style="color: #374151; margin: 0 0 24px 0; line-height: 1.5;">
            以下のボタンをクリックして、メールアドレス（${email}）の認証を完了してください。
          </p>
          
          <!-- 認証ボタン -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                      color: white; 
                      padding: 16px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px; 
                      display: inline-block;
                      box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);
                      transition: all 0.2s ease;">
              ✉️ メールアドレスを認証する
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 24px 0 0 0; line-height: 1.5;">
            ボタンが機能しない場合は、以下のURLをコピーしてブラウザのアドレスバーに貼り付けてください：
          </p>
          <div style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; margin: 8px 0; word-break: break-all;">
            <a href="${verificationUrl}" style="color: #2563eb; text-decoration: none; font-size: 14px;">${verificationUrl}</a>
          </div>
        </div>
        
        <!-- 重要な注意事項 -->
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <div style="display: flex; align-items: flex-start;">
            <div style="color: #f59e0b; margin-right: 8px; font-size: 18px;">⚠️</div>
            <div>
              <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">重要な注意事項</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 16px; font-size: 14px; line-height: 1.5;">
                <li>このリンクは<strong>24時間のみ有効</strong>です</li>
                <li>セキュリティのため、リンクは一度のみ使用可能です</li>
                <li>認証が完了するまで、一部の機能が制限される場合があります</li>
                <li>心当たりがない場合は、このメールを無視してください</li>
              </ul>
            </div>
          </div>
        </div>
        
        <!-- サポート情報 -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <h3 style="color: #374151; font-size: 16px; margin: 0 0 12px 0;">ご不明な点がございましたら</h3>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0; line-height: 1.5;">
            メールが届かない場合や、認証でお困りの場合は、お気軽にサポートチームまでお問い合わせください。
          </p>
          
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; border-left: 4px solid #2563eb;">
            <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.6;">
              <strong>${siteName} サポートチーム</strong><br>
              📧 お問い合わせ: <a href="mailto:support@sns-share.com" style="color: #2563eb; text-decoration: none;">support@sns-share.com</a><br>
              🌐 ヘルプセンター: <a href="https://app.sns-share.com/support" style="color: #2563eb; text-decoration: none;">https://app.sns-share.com/support</a>
            </p>
          </div>
        </div>
        
        <!-- フッター -->
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
          <p style="margin: 0 0 8px 0;">
            <strong>${siteName}</strong> - すべてのSNS、ワンタップでShare
          </p>
          <p style="margin: 0 0 16px 0;">
            〒730-0046 広島県広島市中区昭和町6-11<br>
            運営: ビイアルファ株式会社
          </p>
          <p style="margin: 0;">
            <a href="https://app.sns-share.com/legal/privacy" style="color: #2563eb; text-decoration: none; margin: 0 8px;">プライバシーポリシー</a>
            <a href="https://app.sns-share.com/legal/terms" style="color: #2563eb; text-decoration: none; margin: 0 8px;">利用規約</a>
          </p>
        </div>
      </div>
    `;

  // テキスト形式のメール内容
  const text = `${siteName} - ${titleText}
  
  ${userName ? `${userName} 様` : 'お客様'}
  
  ${
    isResend
      ? 'メールアドレス認証リンクを再送信いたします。'
      : `${siteName}にご登録いただき、ありがとうございます。
  アカウントのセットアップを完了するため、メールアドレスの認証をお願いいたします。`
  }
  
  以下のリンクをクリックして、メールアドレス（${email}）の認証を完了してください。
  
  ${verificationUrl}
  
  【重要な注意事項】
  • このリンクは24時間のみ有効です
  • セキュリティのため、リンクは一度のみ使用可能です
  • 認証が完了するまで、一部の機能が制限される場合があります
  • 心当たりがない場合は、このメールを無視してください
  
  【サポート情報】
  メールが届かない場合や、認証でお困りの場合は、お気軽にサポートチームまでお問い合わせください。
  
  ${siteName} サポートチーム
  お問い合わせ: support@sns-share.com
  ヘルプセンター: https://app.sns-share.com/support
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${siteName} - すべてのSNS、ワンタップでShare
  
  〒730-0046 広島県広島市中区昭和町6-11
  運営: ビイアルファ株式会社
  
  プライバシーポリシー: https://app.sns-share.com/legal/privacy
  利用規約: https://app.sns-share.com/legal/terms
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return { subject, html, text };
}