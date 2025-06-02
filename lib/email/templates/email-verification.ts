// lib/email/templates/email-verification.ts (#3B82F6ベース)
interface EmailVerificationParams {
  userName: string;
  verificationUrl: string;
}

export function getEmailVerificationTemplate(params: EmailVerificationParams) {
  const { userName, verificationUrl } = params;

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>【Share】アカウント登録完了・メールアドレス認証のお願い</title>
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
            <div style="background-color: #10b981; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px;">✓</span>
            </div>
            <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 24px; font-weight: 600;">アカウント登録完了！</h2>
            <p style="color: #6b7280; margin: 0; font-size: 16px;">あと一歩で利用開始できます</p>
          </div>

          <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 25px; margin: 30px 0;">
            <p style="color: #374151; margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
              <strong>${userName}</strong> 様
            </p>
            <p style="color: #374151; margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
              この度は<strong>Share</strong>にご登録いただき、誠にありがとうございます。🎉
            </p>
            <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
              メールアドレスの認証を完了して、すべての機能をお楽しみください。
            </p>
          </div>

          <!-- CTA ボタン -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}" 
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
              🔐 メールアドレスを認証する
            </a>
          </div>

          <!-- 注意事項 -->
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
              <strong>⏰ 重要：</strong> このリンクは<strong>24時間のみ</strong>有効です。<br>
              期限を過ぎた場合は、お手数ですが再度ご登録をお願いいたします。
            </p>
          </div>

          <!-- 機能紹介 -->
          <div style="margin: 40px 0;">
            <h3 style="color: #1f2937; margin: 0 0 20px; font-size: 18px; font-weight: 600; text-align: center;">Shareでできること</h3>
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; align-items: center; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                <span style="background-color: #3B82F6; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px;">📱</span>
                <div>
                  <strong style="color: #1f2937; font-size: 14px;">SNSを一括管理</strong>
                  <p style="color: #6b7280; margin: 5px 0 0; font-size: 13px;">すべてのSNSアカウントを一つのプロフィールで</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                <span style="background-color: #10b981; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px;">🎨</span>
                <div>
                  <strong style="color: #1f2937; font-size: 14px;">カスタマイズ可能</strong>
                  <p style="color: #6b7280; margin: 5px 0 0; font-size: 13px;">あなたらしいプロフィールデザインを作成</p>
                </div>
              </div>
              <div style="display: flex; align-items: center; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                <span style="background-color: #8b5cf6; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px;">📊</span>
                <div>
                  <strong style="color: #1f2937; font-size: 14px;">QRコード生成</strong>
                  <p style="color: #6b7280; margin: 5px 0 0; font-size: 13px;">オフラインでも簡単にシェア</p>
                </div>
              </div>
            </div>
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

  const text = `
🎉 【Share】アカウント登録完了・メールアドレス認証のお願い

${userName} 様

この度はShareにご登録いただき、誠にありがとうございます！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 メールアドレス認証のお願い
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

アカウントの登録が完了しました。
以下のリンクをクリックして、メールアドレスの認証を完了してください。

👉 認証URL: ${verificationUrl}

⏰ 重要：このリンクは24時間のみ有効です
   期限を過ぎた場合は、お手数ですが再度ご登録をお願いいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Shareでできること
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 SNSを一括管理
   → すべてのSNSアカウントを一つのプロフィールで管理

🎨 カスタマイズ可能
   → あなたらしいプロフィールデザインを作成

📊 QRコード生成
   → オフラインでも簡単にシェア

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 サポート情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ご不明な点やお困りのことがございましたら、
お気軽にお問い合わせください。

✉️ メール: support@sns-share.com
🌐 ウェブサイト: https://app.sns-share.com

Share サポートチーム

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 運営会社情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

〒730-0046 広島県広島市中区昭和町6-11
運営: ビイアルファ株式会社
すべてのSNS、ワンタップでShare

📋 プライバシーポリシー: https://app.sns-share.com/legal/privacy
📋 利用規約: https://app.sns-share.com/legal/terms

このメールに心当たりがない場合は、お手数ですが削除をお願いいたします。
  `;

  return {
    subject: '【Share】アカウント登録完了・メールアドレス認証のお願い',
    html,
    text,
  };
}