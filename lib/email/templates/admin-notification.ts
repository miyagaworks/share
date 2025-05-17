// lib/email/templates/admin-notification.ts

interface AdminNotificationEmailParams {
  subject: string;
  title: string;
  message: string;
  userName?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function getAdminNotificationEmailTemplate(params: AdminNotificationEmailParams) {
  const { subject, title, message, userName, ctaText, ctaUrl } = params;
  const siteName = 'Share';

  // CTAボタン用HTML
  const ctaButtonHTML =
    ctaText && ctaUrl
      ? `<div style="text-align: center; margin: 30px 0;">
        <a href="${ctaUrl}" style="background-color: #4A89DC; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">${ctaText}</a>
      </div>`
      : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">${title}</h1>
      
      <p>${userName ? `${userName} 様` : '会員様'}</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <div style="white-space: pre-line;">${message}</div>
      </div>
      
      ${ctaButtonHTML}
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
        <p>${siteName} サポートチーム<br>
        お問い合わせ: <a href="mailto:support@sns-share.com" style="color: #4A89DC; text-decoration: none;">support@sns-share.com</a></p>
        
        <div style="margin-top: 10px; font-size: 11px; color: #999;">
          <p>すべてのSNS、ワンタップでShare</p>
          <p>〒730-0046 広島県広島市中区昭和町6-11<br>
          運営: ビイアルファ株式会社</p>
          <p>
            <a href="https://app.sns-share.com/legal/privacy" style="color: #4A89DC; text-decoration: none;">プライバシーポリシー</a> | 
            <a href="https://app.sns-share.com/legal/terms" style="color: #4A89DC; text-decoration: none;">利用規約</a>
          </p>
        </div>
      </div>
    </div>
  `;

  // テキスト形式のメール内容
  const text = `${userName ? `${userName} 様` : '会員様'}

${title}

${message}

${ctaText ? `${ctaText}: ${ctaUrl}` : ''}

---------------------
${siteName} サポートチーム
お問い合わせ: support@sns-share.com
ウェブサイト: https://app.sns-share.com

すべてのSNS、ワンタップでShare

〒730-0046 広島県広島市中区昭和町6-11
運営: ビイアルファ株式会社

プライバシーポリシー: https://app.sns-share.com/legal/privacy
利用規約: https://app.sns-share.com/legal/terms`;

  return { subject, html, text };
}