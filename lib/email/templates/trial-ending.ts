// /lib/email/templates/trial-ending.ts
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">無料トライアル期間終了のお知らせ（あと2日）</h1>
      
      <p>${userName} 様</p>
      
      <p>いつも${siteName}をご利用いただき、誠にありがとうございます。<br>
      こちらは、${siteName}の無料トライアル期間が2日後に終了することをお知らせするメールです。</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="font-weight: bold; margin: 0 0 10px 0;">【トライアル終了日時】</p>
        <p style="margin: 0; font-size: 16px;">${formattedDate}</p>
      </div>
      
      <p>トライアル期間終了後も引き続き${siteName}の全機能をご利用いただくには、以下の手順でお支払い手続きをお願いいたします：</p>
      
      <ol style="margin: 20px 0; padding-left: 25px;">
        <li>ダッシュボードにログインする</li>
        <li>「ご利用プラン」ページに移動する</li>
        <li>ご希望のプランを選択してお支払い情報を入力する</li>
      </ol>
      
      <p style="font-style: italic;">※お支払いはクレジットカード決済のみとなります。</p>
      
      <div style="background-color: #ffeeee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff6666;">
        <p style="font-weight: bold; margin: 0 0 10px 0;">【重要】トライアル期間終了後について</p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>トライアル終了後、1週間の猶予期間があります。</li>
          <li>猶予期間中は公開プロフィールが表示されなくなります。</li>
          <li>猶予期間内にお支払いいただくと、すべての機能とプロフィール表示が復活します。</li>
          <li>猶予期間終了後はユーザー情報が削除され、復元することができません。</li>
        </ul>
      </div>
      
      <p>ご不明な点がございましたら、お気軽にカスタマーサポートまでお問い合わせください。<br>
      今後とも、${siteName}をよろしくお願いいたします。</p>
      
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

  // テキスト形式のメール内容も保持しておく
  const text = `${userName} 様

いつも${siteName}をご利用いただき、誠にありがとうございます。
こちらは、${siteName}の無料トライアル期間が2日後に終了することをお知らせするメールです。 

【トライアル終了日時】
${formattedDate}

トライアル期間終了後も引き続き${siteName}の全機能をご利用いただくには、以下の手順でお支払い手続きをお願いいたします：

1. ダッシュボードにログインする
2. 「ご利用プラン」ページに移動する
3. ご希望のプランを選択してお支払い情報を入力する

※お支払いはクレジットカード決済のみとなります。

【重要】トライアル期間終了後について
・トライアル終了後、1週間の猶予期間があります。
・猶予期間中は公開プロフィールが表示されなくなります。
・猶予期間内にお支払いいただくと、すべての機能とプロフィール表示が復活します。
・猶予期間終了後はユーザー情報が削除され、復元することができません。

ご不明な点がございましたら、お気軽にカスタマーサポートまでお問い合わせください。
今後とも、${siteName}をよろしくお願いいたします。

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