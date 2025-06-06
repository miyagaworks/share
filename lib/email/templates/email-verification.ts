// lib/email/templates/email-verification.ts (Yahooメール対応版)
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
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- ヘッダー -->
              <tr>
                <td style="background-color: #3B82F6; padding: 40px 20px; text-align: center;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <div style="background-color: #ffffff; display: inline-block; padding: 12px 24px; border-radius: 8px; margin-bottom: 20px;">
                          <h1 style="color: #3B82F6; margin: 0; font-size: 28px; font-weight: bold;">Share</h1>
                        </div>
                        <p style="color: #ffffff; margin: 0; font-size: 16px;">すべてのSNS、ワンタップで</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- メインコンテンツ -->
              <tr>
                <td style="padding: 40px 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    
                    <!-- アイコンとタイトル -->
                    <tr>
                      <td align="center" style="padding-bottom: 30px;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td align="center">
                              <div style="background-color: #10b981; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; text-align: center; line-height: 60px;">
                                <span style="color: white; font-size: 24px;">✓</span>
                              </div>
                              <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 24px; font-weight: 600;">アカウント登録完了！</h2>
                              <p style="color: #6b7280; margin: 0; font-size: 16px;">あと一歩で利用開始できます</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- メッセージ -->
                    <tr>
                      <td style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
                        <p style="color: #374151; margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
                          <strong>${userName}</strong> 様
                        </p>
                        <p style="color: #374151; margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
                          この度は<strong>Share</strong>にご登録いただき、誠にありがとうございます。🎉
                        </p>
                        <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
                          メールアドレスの認証を完了して、すべての機能をお楽しみください。
                        </p>
                      </td>
                    </tr>

                    <!-- CTAボタン -->
                    <tr>
                      <td align="center" style="padding: 40px 0;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="background-color: #3B82F6; border-radius: 8px;">
                              <a href="${verificationUrl}" 
                                 style="background-color: #3B82F6; 
                                        color: #ffffff; 
                                        text-decoration: none; 
                                        padding: 16px 32px; 
                                        border-radius: 8px; 
                                        font-weight: bold; 
                                        font-size: 16px; 
                                        display: block;
                                        text-align: center;
                                        width: 280px;
                                        box-sizing: border-box;">
                                🔐 メールアドレスを認証する
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- URLフォールバック -->
                    <tr>
                      <td style="padding: 20px 0;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px; text-align: center;">ボタンが機能しない場合は、以下のURLをコピーしてブラウザに貼り付けてください：</p>
                        <div style="word-break: break-all; background-color: #f5f5f5; padding: 15px; border-radius: 8px; font-size: 13px; color: #555; border: 1px solid #e5e7eb; text-align: center;">
                          ${verificationUrl}
                        </div>
                      </td>
                    </tr>

                    <!-- 注意事項 -->
                    <tr>
                      <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px;">
                        <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                          <strong>⏰ 重要：</strong> このリンクは<strong>24時間のみ</strong>有効です。<br>
                          期限を過ぎた場合は、お手数ですが再度ご登録をお願いいたします。
                        </p>
                      </td>
                    </tr>

                    <!-- 機能紹介 -->
                    <tr>
                      <td style="padding: 40px 0 20px;">
                        <h3 style="color: #1f2937; margin: 0 0 20px; font-size: 18px; font-weight: 600; text-align: center;">Shareでできること</h3>
                        
                        <!-- 機能1 -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 15px;">
                          <tr>
                            <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                              <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td style="width: 50px; vertical-align: top;">
                                    <div style="background-color: #3B82F6; color: white; width: 32px; height: 32px; border-radius: 50%; text-align: center; line-height: 32px; font-size: 16px;">📱</div>
                                  </td>
                                  <td style="vertical-align: top; padding-left: 15px;">
                                    <strong style="color: #1f2937; font-size: 14px;">SNSを一括管理</strong><br>
                                    <span style="color: #6b7280; font-size: 13px;">すべてのSNSアカウントを一つのプロフィールで</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- 機能2 -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 15px;">
                          <tr>
                            <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                              <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td style="width: 50px; vertical-align: top;">
                                    <div style="background-color: #10b981; color: white; width: 32px; height: 32px; border-radius: 50%; text-align: center; line-height: 32px; font-size: 16px;">🎨</div>
                                  </td>
                                  <td style="vertical-align: top; padding-left: 15px;">
                                    <strong style="color: #1f2937; font-size: 14px;">カスタマイズ可能</strong><br>
                                    <span style="color: #6b7280; font-size: 13px;">あなたらしいプロフィールデザインを作成</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- 機能3 -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                              <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td style="width: 50px; vertical-align: top;">
                                    <div style="background-color: #8b5cf6; color: white; width: 32px; height: 32px; border-radius: 50%; text-align: center; line-height: 32px; font-size: 16px;">📊</div>
                                  </td>
                                  <td style="vertical-align: top; padding-left: 15px;">
                                    <strong style="color: #1f2937; font-size: 14px;">QRコード生成</strong><br>
                                    <span style="color: #6b7280; font-size: 13px;">オフラインでも簡単にシェア</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- フッター -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">サポートが必要な場合は</p>
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