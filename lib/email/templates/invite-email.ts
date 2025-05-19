// lib/email/templates/invite-email.ts

interface InviteEmailParams {
  companyName: string;
  inviteUrl: string;
}

export function getInviteEmailTemplate(params: InviteEmailParams) {
  const { companyName, inviteUrl } = params;
  const siteName = 'Share';

  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; font-size: 24px; margin-top: 15px; margin-bottom: 5px;">${companyName}からの招待</h1>
          <p style="color: #666; margin-top: 5px;">シンプルにつながる、スマートにシェア</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4A89DC;">
          <p style="margin-top: 0; color: #333; font-size: 16px;">
            ${companyName}に招待されました。<br>
            以下のボタンをクリックして、アカウント情報を設定してください。
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="background-color: #4A89DC; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: all 0.3s ease;">招待を受け入れる</a>
        </div>
        
        <div style="margin: 25px 0; text-align: center;">
          <p style="color: #666; font-size: 14px;">または、以下のURLをブラウザに貼り付けてアクセスしてください：</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 13px; color: #555;">${inviteUrl}</p>
        </div>
        
        <div style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #333; font-size: 14px;">このリンクは72時間有効です。期限が切れた場合は、招待者に再送信を依頼してください。</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
          <p>${siteName} サポートチーム<br>
          お問い合わせ: <a href="mailto:support@sns-share.com" style="color: #4A89DC; text-decoration: none;">support@sns-share.com</a></p>
          
          <div style="margin-top: 15px; font-size: 11px; color: #999;">
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
  const text = `${companyName}からの招待
  
  ${companyName}に招待されました。
  以下のリンクからアクセスして、アカウント情報を設定してください。
  
  ${inviteUrl}
  
  このリンクは72時間有効です。期限が切れた場合は、招待者に再送信を依頼してください。
  
  ---------------------
  ${siteName} サポートチーム
  お問い合わせ: support@sns-share.com
  ウェブサイト: https://app.sns-share.com
  
  すべてのSNS、ワンタップでShare
  
  〒730-0046 広島県広島市中区昭和町6-11
  運営: ビイアルファ株式会社
  
  プライバシーポリシー: https://app.sns-share.com/legal/privacy
  利用規約: https://app.sns-share.com/legal/terms`;

  return {
    subject: `【${siteName}】${companyName}からの招待`,
    html,
    text,
  };
}