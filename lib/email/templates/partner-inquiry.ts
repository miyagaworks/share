// lib/email/templates/partner-inquiry.ts
// パートナー資料請求: お客様向け自動返信 + 管理者通知
import { getBrandConfig } from '@/lib/brand/config';

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
  const brand = getBrandConfig();
  const logoUrl = `${brand.appUrl}/images/partner/logo_white.png`;
  const { name, companyName, preferences } = params;
  const downloadUrl = `${brand.appUrl}/docs/share-partner-guide.pdf`;
  const preferencesText = preferences.map((p) => `- ${p}`).join('\n');

  const subject = `【${brand.name}】パートナー資料をお送りします`;

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F5F3EF; font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F3EF;">
        <tr>
          <td align="center" style="padding: 40px 16px;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1B2A4A 0%, #2D4A7A 100%); padding: 36px 40px; border-radius: 12px 12px 0 0; text-align: center;">
                  <img src="${logoUrl}" alt="${brand.name}" width="150" height="45" style="display: inline-block; max-width: 150px; height: auto;" />
                  <p style="color: rgba(255,255,255,0.7); margin: 12px 0 0; font-size: 13px; letter-spacing: 2px; font-weight: 300;">PARTNER PROGRAM</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="background-color: #ffffff; padding: 0;">
                  <!-- Accent line -->
                  <div style="height: 3px; background: linear-gradient(90deg, #B8860B 0%, #D4A832 50%, #B8860B 100%);"></div>

                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 40px 36px;">
                    <!-- Greeting -->
                    <tr>
                      <td style="padding-bottom: 24px;">
                        <p style="color: #2D3748; margin: 0; font-size: 15px; line-height: 1.8;">
                          ${companyName}<br>
                          <strong>${name}</strong> 様
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 32px;">
                        <p style="color: #4A5568; margin: 0; font-size: 15px; line-height: 2;">
                          この度は${brand.name}パートナープログラムに<br>
                          ご興味をお持ちいただき、誠にありがとうございます。
                        </p>
                      </td>
                    </tr>

                    <!-- Download CTA -->
                    <tr>
                      <td style="padding-bottom: 36px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FAFAF8; border-radius: 12px; border: 1px solid #E8E6E1;">
                          <tr>
                            <td style="padding: 32px 28px; text-align: center;">
                              <p style="color: #2D3748; margin: 0 0 6px; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">DOWNLOAD</p>
                              <p style="color: #5A6577; margin: 0 0 20px; font-size: 14px;">パートナー資料をご用意しました</p>
                              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                <tr>
                                  <td style="border-radius: 8px; background: linear-gradient(135deg, #B8860B 0%, #D4A832 100%); box-shadow: 0 4px 12px rgba(184, 134, 11, 0.3);">
                                    <a href="${downloadUrl}"
                                       style="color: #ffffff;
                                              text-decoration: none;
                                              padding: 14px 36px;
                                              display: inline-block;
                                              font-weight: 600;
                                              font-size: 15px;
                                              letter-spacing: 0.5px;">
                                      資料をダウンロード
                                    </a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Preferences -->
                    <tr>
                      <td style="padding-bottom: 32px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left: 3px solid #B8860B; padding-left: 0;">
                          <tr>
                            <td style="padding-left: 16px;">
                              <p style="color: #2D3748; margin: 0 0 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">ご希望内容</p>
                              <p style="color: #5A6577; margin: 0; font-size: 14px; line-height: 2;">
                                ${preferences.map((p) => `${p}`).join('<br>')}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                      <td style="padding-bottom: 28px;">
                        <div style="height: 1px; background-color: #E8E6E1;"></div>
                      </td>
                    </tr>

                    <!-- Next steps -->
                    <tr>
                      <td style="padding-bottom: 12px;">
                        <p style="color: #4A5568; margin: 0; font-size: 14px; line-height: 2;">
                          ご不明な点がございましたら、<br>
                          お気軽にこのメールへご返信ください。<br>
                          担当者よりご連絡させていただきます。
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #1B2A4A; padding: 32px 36px; border-radius: 0 0 12px 12px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding-bottom: 16px;">
                        <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 13px;">${brand.name} パートナー担当</p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-bottom: 16px;">
                        <a href="mailto:${brand.supportEmail}" style="color: #D4A832; text-decoration: none; font-size: 14px; font-weight: 500;">
                          ${brand.supportEmail}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
                        <p style="color: rgba(255,255,255,0.4); margin: 0 0 4px; font-size: 11px;">
                          ${brand.companyName}
                        </p>
                        <p style="color: rgba(255,255,255,0.3); margin: 0; font-size: 11px;">
                          ${brand.companyAddress}
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

この度は${brand.name}パートナープログラムにご興味をお持ちいただき、
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
${brand.name} パートナー担当
${brand.supportEmail}
${brand.companyName}
${brand.companyAddress}`;

  return { subject, html, text };
}

export function getPartnerAdminNotifyTemplate(params: PartnerAdminNotifyParams) {
  const { name, companyName, email, phone, preferences, consultationDates, question } = params;

  const subject = `【パートナー問い合わせ】${companyName} - ${name} 様`;

  const consultationHtml = consultationDates?.filter(Boolean).length
    ? `<tr><td style="padding: 12px 16px; border-bottom: 1px solid #E8E6E1;">
        <strong style="color: #2D3748; font-size: 13px;">相談希望日時</strong><br>
        <span style="color: #4A5568; font-size: 14px;">${consultationDates.filter(Boolean).map((d, i) => `第${i + 1}候補: ${d.replace('T', ' ')}`).join('<br>')}</span>
      </td></tr>`
    : '';

  const questionHtml = question
    ? `<tr><td style="padding: 12px 16px; border-bottom: 1px solid #E8E6E1;">
        <strong style="color: #2D3748; font-size: 13px;">ご質問</strong><br>
        <div style="white-space: pre-line; margin-top: 4px; color: #4A5568; font-size: 14px;">${question}</div>
      </td></tr>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head><meta charset="UTF-8"><title>${subject}</title></head>
    <body style="margin: 0; padding: 0; background-color: #F5F3EF; font-family: 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F3EF;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
              <tr>
                <td style="background: linear-gradient(135deg, #B8860B 0%, #D4A832 100%); padding: 20px; text-align: center;">
                  <h2 style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 600; letter-spacing: 1px;">パートナー資料請求</h2>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #E8E6E1; border-radius: 8px; overflow: hidden;">
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #E8E6E1; background-color: #FAFAF8;"><strong style="color: #2D3748; font-size: 13px;">会社名</strong><br><span style="color: #4A5568; font-size: 14px;">${companyName}</span></td></tr>
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #E8E6E1;"><strong style="color: #2D3748; font-size: 13px;">お名前</strong><br><span style="color: #4A5568; font-size: 14px;">${name}</span></td></tr>
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #E8E6E1; background-color: #FAFAF8;"><strong style="color: #2D3748; font-size: 13px;">メール</strong><br><a href="mailto:${email}" style="color: #4A6FA5; font-size: 14px;">${email}</a></td></tr>
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #E8E6E1;"><strong style="color: #2D3748; font-size: 13px;">電話番号</strong><br><span style="color: #4A5568; font-size: 14px;">${phone || '未入力'}</span></td></tr>
                    <tr><td style="padding: 12px 16px; border-bottom: 1px solid #E8E6E1; background-color: #FAFAF8;"><strong style="color: #2D3748; font-size: 13px;">ご希望</strong><br><span style="color: #4A5568; font-size: 14px;">${preferences.map((p) => `${p}`).join('<br>')}</span></td></tr>
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
