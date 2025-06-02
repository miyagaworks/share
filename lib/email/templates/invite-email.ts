// lib/email/templates/invite-email.ts (#3B82F6ベース)
interface InviteEmailParams {
  companyName: string;
  inviteUrl: string;
}

export function getInviteEmailTemplate(params: InviteEmailParams) {
  const { companyName, inviteUrl } = params;
  const siteName = 'Share';

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>【Share】${companyName}からの招待</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- ヘッダー -->
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); padding: 40px 20px; text-align: center;">
          <div style="background-color: rgba(255, 255, 255, 0.1); display: inline-block; padding: 12px 24px; border-radius: 50px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">Share</h1>
          </div>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 16px; font-weight: 300;">すべてのSNS、ワンタップで</p>
        </div>

        <!-- メインコンテンツ -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #3B82F6; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px;">✉️</span>
            </div>
            <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 24px; font-weight: 600;">${companyName}からの招待</h2>
            <p style="color: #6b7280; margin: 0; font-size: 16px;">チームに参加してください</p>
          </div>

          <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #3B82F6;">
            <p style="color: #374151; margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
              <strong>${companyName}</strong>に招待されました。
            </p>
            <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
              以下のボタンをクリックして、アカウント情報を設定してください。
            </p>
          </div>

          <!-- CTA ボタン -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${inviteUrl}" 
               style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); 
                      color: white; 
                      text-decoration: none; 
                      padding: 16px 32px; 
                      border-radius: 50px; 
                      font-weight: 600; 
                      font-size: 16px; 
                      display: inline-block; 
                      box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4); 
                      transition: all 0.3s ease;">
              🚀 招待を受け入れる
            </a>
          </div>

          <!-- URL表示 -->
          <div style="margin: 25px 0; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">または、以下のURLをブラウザに貼り付けてアクセスしてください：</p>
            <div style="word-break: break-all; background-color: #f5f5f5; padding: 15px; border-radius: 8px; font-size: 13px; color: #555; border: 1px solid #e5e7eb;">
              ${inviteUrl}
            </div>
          </div>

          <!-- 注意事項 -->
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
              <strong>⏰ 重要：</strong> このリンクは<strong>72時間</strong>有効です。<br>
              期限が切れた場合は、招待者に再送信を依頼してください。
            </p>
          </div>
        </div>

        <!-- フッター -->
        <div style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">サポートが必要な場合は</p>
            <a href="mailto:support@sns-share.com" 
               style="color: #3B82F6; text-decoration: none; font-weight: 600;">
              support@sns-share.com
            </a>
          </div>
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
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
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `【${siteName}】${companyName}からの招待

${companyName}に招待されました。

以下のリンクからアクセスして、アカウント情報を設定してください。

${inviteUrl}

このリンクは72時間有効です。期限が切れた場合は、招待者に再送信を依頼してください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 サポート情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✉️ メール: support@sns-share.com
🌐 ウェブサイト: https://app.sns-share.com

${siteName} サポートチーム

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 運営会社情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

〒730-0046 広島県広島市中区昭和町6-11
運営: ビイアルファ株式会社
すべてのSNS、ワンタップでShare

📋 プライバシーポリシー: https://app.sns-share.com/legal/privacy
📋 利用規約: https://app.sns-share.com/legal/terms`;

  return {
    subject: `【${siteName}】${companyName}からの招待`,
    html,
    text,
  };
}