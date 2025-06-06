// lib/email/templates/admin-notification.ts (Yahooメール対応版)
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

  const ctaButtonHTML =
    ctaText && ctaUrl
      ? `<tr>
         <td align="center" style="padding: 30px 0;">
           <table cellpadding="0" cellspacing="0" border="0">
             <tr>
               <td>
                 <a href="${ctaUrl}" 
                    style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); 
                           color: white !important; 
                           text-decoration: none; 
                           padding: 12px 24px; 
                           border-radius: 50px; 
                           font-weight: 600; 
                           display: inline-block;
                           text-align: center;
                           min-width: 180px;
                           box-sizing: border-box;">
                   ${ctaText}
                 </a>
               </td>
             </tr>
           </table>
         </td>
       </tr>`
      : '';

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- ヘッダー -->
              <tr>
                <td style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <div style="background-color: rgba(255, 255, 255, 0.1); display: inline-block; padding: 12px 24px; border-radius: 50px; margin-bottom: 20px;">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">Share</h1>
                        </div>
                        <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 16px; font-weight: 300;">管理者通知</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- メインコンテンツ -->
              <tr>
                <td style="padding: 40px 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    
                    <!-- タイトル -->
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <h2 style="color: #1f2937; margin: 0; font-size: 24px; font-weight: 600;">${title}</h2>
                      </td>
                    </tr>
                    
                    <!-- 宛先 -->
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <p style="color: #374151; margin: 0; font-size: 16px;">
                          ${userName ? `${userName} 様` : '管理者様'}
                        </p>
                      </td>
                    </tr>

                    <!-- メッセージ -->
                    <tr>
                      <td style="background-color: #f3f4f6; border-radius: 12px; padding: 25px;">
                        <div style="white-space: pre-line; color: #374151; font-size: 16px; line-height: 1.6;">
                          ${message}
                        </div>
                      </td>
                    </tr>

                    ${ctaButtonHTML}
                  </table>
                </td>
              </tr>

              <!-- フッター -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">${siteName} サポートチーム</p>
                        <a href="mailto:support@sns-share.com" 
                           style="color: #3B82F6; text-decoration: none; font-weight: 600;">
                          support@sns-share.com
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                        <p style="color: #9ca3af; margin: 0 0 5px; font-size: 12px;">
                          〒730-0046 広島県広島市中区昭和町6-11
                        </p>
                        <p style="color: #9ca3af; margin: 0 0 15px; font-size: 12px;">
                          運営: ビイアルファ株式会社
                        </p>
                        <div style="margin-top: 15px;">
                          <a href="https://app.sns-share.com/legal/privacy" 
                             style="color: #9ca3af; text-decoration: none; font-size: 11px; margin: 0 10px;">
                            プライバシーポリシー
                          </a>
                          <span style="color: #d1d5db;">|</span>
                          <a href="https://app.sns-share.com/legal/terms" 
                             style="color: #9ca3af; text-decoration: none; font-size: 11px; margin: 0 10px;">
                            利用規約
                          </a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `${userName ? `${userName} 様` : '管理者様'}

${title}

${message}

${ctaText ? `${ctaText}: ${ctaUrl}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 サポート情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${siteName} サポートチーム
✉️ メール: support@sns-share.com
🌐 ウェブサイト: https://app.sns-share.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 運営会社情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

〒730-0046 広島県広島市中区昭和町6-11
運営: ビイアルファ株式会社
すべてのSNS、ワンタップでShare

📋 プライバシーポリシー: https://app.sns-share.com/legal/privacy
📋 利用規約: https://app.sns-share.com/legal/terms`;

  return { subject, html, text };
}