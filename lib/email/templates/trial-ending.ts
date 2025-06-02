// lib/email/templates/trial-ending.ts (#3B82F6ベース)
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TrialEndingEmailParams {
  userName: string;
  trialEndDate: Date;
}

export function getTrialEndingEmailTemplate(params: TrialEndingEmailParams) {
  const { userName, trialEndDate } = params;
  const siteName = 'Share';
  const formattedDate = format(trialEndDate, 'yyyy年MM月dd日 HH:mm', { locale: ja });
  const subject = `【重要】${siteName} 無料トライアル期間終了のお知らせ（あと2日）`;

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
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
            <div style="background-color: #f59e0b; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px;">⏰</span>
            </div>
            <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 24px; font-weight: 600;">無料トライアル期間終了のお知らせ</h2>
            <p style="color: #6b7280; margin: 0; font-size: 16px;">（あと2日）</p>
          </div>

          <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 25px; margin: 30px 0;">
            <p style="color: #374151; margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
              <strong>${userName}</strong> 様
            </p>
            <p style="color: #374151; margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
              いつも${siteName}をご利用いただき、誠にありがとうございます。
            </p>
            <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
              ${siteName}の無料トライアル期間が2日後に終了することをお知らせいたします。
            </p>
          </div>

          <!-- トライアル終了日時 -->
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #92400e; margin: 0 0 10px; font-weight: bold; font-size: 14px;">【トライアル終了日時】</p>
            <p style="color: #92400e; margin: 0; font-size: 16px; font-weight: 600;">${formattedDate}</p>
          </div>

          <!-- 継続手順 -->
          <div style="margin: 30px 0;">
            <p style="color: #374151; margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
              トライアル期間終了後も引き続き${siteName}の全機能をご利用いただくには、以下の手順でお支払い手続きをお願いいたします：
            </p>
            <ol style="margin: 20px 0; padding-left: 25px; color: #374151; font-size: 15px; line-height: 1.6;">
              <li style="margin-bottom: 8px;">ダッシュボードにログインする</li>
              <li style="margin-bottom: 8px;">「ご利用プラン」ページに移動する</li>
              <li style="margin-bottom: 8px;">ご希望のプランを選択してお支払い情報を入力する</li>
            </ol>
            <p style="color: #6b7280; margin: 0; font-size: 14px; font-style: italic;">
              ※お支払いはクレジットカード決済のみとなります。
            </p>
          </div>

          <!-- CTA ボタン -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="https://app.sns-share.com/dashboard/subscription" 
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
              💳 プランを選択する
            </a>
          </div>

          <!-- 重要な注意事項 -->
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #991b1b; margin: 0 0 10px; font-weight: bold; font-size: 14px;">【重要】トライアル期間終了後について</p>
            <ul style="margin: 0; padding-left: 20px; color: #991b1b; font-size: 14px; line-height: 1.5;">
              <li style="margin-bottom: 5px;">トライアル終了後、1週間の猶予期間があります。</li>
              <li style="margin-bottom: 5px;">猶予期間中は公開プロフィールが表示されなくなります。</li>
              <li style="margin-bottom: 5px;">猶予期間内にお支払いいただくと、すべての機能とプロフィール表示が復活します。</li>
              <li style="margin-bottom: 5px;">猶予期間終了後はユーザー情報が削除され、復元することができません。</li>
            </ul>
          </div>

          <p style="color: #374151; margin: 30px 0 0; font-size: 16px; line-height: 1.6;">
            ご不明な点がございましたら、お気軽にカスタマーサポートまでお問い合わせください。<br>
            今後とも、${siteName}をよろしくお願いいたします。
          </p>
        </div>

        <!-- フッター -->
        <div style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">${siteName} サポートチーム</p>
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

  const text = `${userName} 様

いつも${siteName}をご利用いただき、誠にありがとうございます。
${siteName}の無料トライアル期間が2日後に終了することをお知らせするメールです。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ トライアル終了日時
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${formattedDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 継続利用の手順
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

トライアル期間終了後も引き続き${siteName}の全機能をご利用いただくには、以下の手順でお支払い手続きをお願いいたします：

1. ダッシュボードにログインする
2. 「ご利用プラン」ページに移動する
3. ご希望のプランを選択してお支払い情報を入力する

※お支払いはクレジットカード決済のみとなります。

🔗 プラン選択: https://app.sns-share.com/dashboard/subscription

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 重要：トライアル期間終了後について
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

・トライアル終了後、1週間の猶予期間があります。
・猶予期間中は公開プロフィールが表示されなくなります。
・猶予期間内にお支払いいただくと、すべての機能とプロフィール表示が復活します。
・猶予期間終了後はユーザー情報が削除され、復元することができません。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 サポート情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ご不明な点がございましたら、お気軽にカスタマーサポートまでお問い合わせください。
今後とも、${siteName}をよろしくお願いいたします。

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