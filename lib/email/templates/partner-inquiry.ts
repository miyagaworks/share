// lib/email/templates/partner-inquiry.ts
// パートナー資料請求: お客様向け自動返信 + 管理者通知

interface PartnerAutoReplyParams {
  name: string;
  companyName: string;
  preferences: string[];
}

interface PartnerAdminNotifyParams {
  name: string;
  companyName: string;
  email: string;
  phone?: string;
  preferences: string[];
  consultationDates?: string[];
  question?: string;
}

export function getPartnerAutoReplyTemplate(params: PartnerAutoReplyParams) {
  const { name, companyName, preferences } = params;
  const siteUrl = process.env.NEXTAUTH_URL || 'https://sns-share.com';
  const downloadUrl = `${siteUrl}/docs/share-partner-guide.pdf`;
  const preferencesText = preferences.map((p) => `- ${p}`).join('\n');

  const subject = '【Share】パートナー資料をお送りします';

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

              <!-- Header -->
              <tr>
                <td style="background-color: #1B2A4A; padding: 40px 20px; text-align: center;">
                  <div style="background-color: #ffffff; display: inline-block; padding: 12px 24px; border-radius: 8px; margin-bottom: 20px;">
                    <h1 style="color: #1B2A4A; margin: 0; font-size: 28px; font-weight: bold;">Share</h1>
                  </div>
                  <p style="color: #ffffff; margin: 0; font-size: 16px;">パートナープログラム</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <p style="color: #374151; margin: 0; font-size: 16px;">
                          ${companyName}<br>${name} 様
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.8;">
                          この度はShareパートナープログラムにご興味をお持ちいただき、<br>
                          誠にありがとうございます。
                        </p>
                      </td>
                    </tr>

                    <!-- Download button -->
                    <tr>
                      <td align="center" style="padding: 30px 0;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="background-color: #B8860B; border-radius: 8px;">
                              <a href="${downloadUrl}"
                                 style="background-color: #B8860B;
                                        color: #ffffff;
                                        text-decoration: none;
                                        padding: 14px 32px;
                                        border-radius: 8px;
                                        font-weight: bold;
                                        display: block;
                                        text-align: center;
                                        font-size: 16px;">
                                パートナー資料をダウンロード
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Preferences -->
                    <tr>
                      <td style="background-color: #f3f4f6; border-radius: 12px; padding: 20px;">
                        <p style="color: #374151; margin: 0 0 10px; font-size: 14px; font-weight: bold;">ご希望内容：</p>
                        <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.8;">
                          ${preferences.map((p) => `・${p}`).join('<br>')}
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding-top: 24px;">
                        <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.8;">
                          ご不明な点がございましたら、お気軽にご返信ください。<br>
                          担当者よりご連絡させていただきます。
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">Share パートナー担当</p>
                        <a href="mailto:info@sns-share.com" style="color: #1B2A4A; text-decoration: none; font-weight: 600;">
                          info@sns-share.com
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                        <p style="color: #9ca3af; margin: 0 0 5px; font-size: 12px;">
                          〒731-0137 広島県広島市安佐南区山本2-3-35
                        </p>
                        <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                          株式会社Senrigan
                        </p>
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

  const text = `${companyName}
${name} 様

この度はShareパートナープログラムにご興味をお持ちいただき、
誠にありがとうございます。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
パートナー資料ダウンロード
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

以下のURLからダウンロードいただけます。
${downloadUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ご希望内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${preferencesText}

ご不明な点がございましたら、お気軽にご返信ください。
担当者よりご連絡させていただきます。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Share パートナー担当
info@sns-share.com
株式会社Senrigan
〒731-0137 広島県広島市安佐南区山本2-3-35`;

  return { subject, html, text };
}

export function getPartnerAdminNotifyTemplate(params: PartnerAdminNotifyParams) {
  const { name, companyName, email, phone, preferences, consultationDates, question } = params;

  const subject = `【パートナー問い合わせ】${companyName} - ${name} 様`;

  const consultationHtml = consultationDates?.filter(Boolean).length
    ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <strong>相談希望日時：</strong><br>
        ${consultationDates.filter(Boolean).map((d, i) => `第${i + 1}候補: ${d.replace('T', ' ')}`).join('<br>')}
      </td></tr>`
    : '';

  const questionHtml = question
    ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <strong>ご質問：</strong><br>
        <div style="white-space: pre-line; margin-top: 4px;">${question}</div>
      </td></tr>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head><meta charset="UTF-8"><title>${subject}</title></head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">
              <tr>
                <td style="background-color: #B8860B; padding: 20px; text-align: center;">
                  <h2 style="color: #ffffff; margin: 0; font-size: 18px;">パートナー資料請求</h2>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>会社名：</strong>${companyName}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>お名前：</strong>${name}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>メール：</strong><a href="mailto:${email}">${email}</a></td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>電話番号：</strong>${phone || '未入力'}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>ご希望：</strong><br>${preferences.map((p) => `・${p}`).join('<br>')}</td></tr>
                    ${consultationHtml}
                    ${questionHtml}
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

  const consultationText = consultationDates?.filter(Boolean).length
    ? `\n相談希望日時：\n${consultationDates.filter(Boolean).map((d, i) => `  第${i + 1}候補: ${d.replace('T', ' ')}`).join('\n')}`
    : '';

  const questionText = question ? `\nご質問：\n${question}` : '';

  const text = `パートナー資料請求がありました。

会社名：${companyName}
お名前：${name}
メール：${email}
電話番号：${phone || '未入力'}
ご希望：
${preferences.map((p) => `- ${p}`).join('\n')}${consultationText}${questionText}`;

  return { subject, html, text };
}
