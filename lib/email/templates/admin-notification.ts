// lib/email/templates/admin-notification.ts (Yahooメール対応版)
import { getBrandConfig } from '@/lib/brand/config';

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
  const brand = getBrandConfig();
  const siteName = brand.name;

  const ctaButtonHTML =
    ctaText && ctaUrl
      ? `<tr>
         <td align="center" style="padding: 30px 0;">
           <table cellpadding="0" cellspacing="0" border="0">
             <tr>
               <td style="background-color: ${brand.primaryColor}; border-radius: 8px;">
                 <a href="${ctaUrl}"
                    style="background-color: ${brand.primaryColor}; 
                           color: #ffffff; 
                           text-decoration: none; 
                           padding: 12px 24px; 
                           border-radius: 8px; 
                           font-weight: bold; 
                           display: block;
                           text-align: center;
                           width: 240px;
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
                <td style="background-color: ${brand.primaryColor}; padding: 40px 20px; text-align: center;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <div style="background-color: #ffffff; display: inline-block; padding: 12px 24px; border-radius: 8px; margin-bottom: 20px;">
                          <h1 style="color: ${brand.primaryColor}; margin: 0; font-size: 28px; font-weight: bold;">${brand.name}</h1>
                        </div>
                        <p style="color: #ffffff; margin: 0; font-size: 16px;">管理者通知</p>
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
                        <a href="mailto:${brand.supportEmail}"
                           style="color: ${brand.primaryColor}; text-decoration: none; font-weight: 600;">
                          ${brand.supportEmail}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                        <p style="color: #9ca3af; margin: 0 0 5px; font-size: 12px;">
                          ${brand.companyAddress}
                        </p>
                        <p style="color: #9ca3af; margin: 0 0 15px; font-size: 12px;">
                          運営: ${brand.companyName}
                        </p>
                        <div style="margin-top: 15px;">
                          <a href="${brand.appUrl}${brand.privacyUrl}"
                             style="color: #9ca3af; text-decoration: none; font-size: 11px; margin: 0 10px;">
                            プライバシーポリシー
                          </a>
                          <span style="color: #d1d5db;">|</span>
                          <a href="${brand.appUrl}${brand.termsUrl}"
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
✉️ メール: ${brand.supportEmail}
🌐 ウェブサイト: ${brand.appUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 運営会社情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${brand.companyAddress}
運営: ${brand.companyName}
${brand.tagline}${brand.name}

📋 プライバシーポリシー: ${brand.appUrl}${brand.privacyUrl}
📋 利用規約: ${brand.appUrl}${brand.termsUrl}`;

  return { subject, html, text };
}