// lib/email/templates/grace-period-expired.ts (Yahooメール対応版)
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getBrandConfig } from '@/lib/brand/config';

interface GracePeriodExpiredEmailParams {
  expiredUsers: {
    id: string;
    name: string | null;
    email: string;
    trialEndDate: Date;
    gracePeriodEndDate: Date;
  }[];
}

export function getGracePeriodExpiredEmailTemplate(params: GracePeriodExpiredEmailParams) {
  const { expiredUsers } = params;
  const brand = getBrandConfig();
  const siteName = brand.name;
  const today = format(new Date(), 'yyyy年MM月dd日', { locale: ja });
  const subject = `【管理者通知】${siteName} トライアル猶予期間終了ユーザー一覧（${today}）`;

  // ユーザーリストのHTMLを生成（テーブル形式）
  const userListHTML = expiredUsers
    .map((user) => {
      const trialEndDate = format(new Date(user.trialEndDate), 'yyyy年MM月dd日', { locale: ja });
      const gracePeriodEndDate = format(new Date(user.gracePeriodEndDate), 'yyyy年MM月dd日', {
        locale: ja,
      });
      const deleteUrl = `${brand.appUrl}/dashboard/admin/users?action=delete&userId=${user.id}`;

      return `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${user.name || '未設定'}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${user.email}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${trialEndDate}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${gracePeriodEndDate}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <a href="${deleteUrl}" 
             style="background-color: #dc2626; 
                    color: white; 
                    padding: 8px 12px; 
                    text-decoration: none; 
                    border-radius: 4px; 
                    font-size: 12px; 
                    font-weight: bold;
                    display: inline-block;">
            削除する
          </a>
        </td>
      </tr>
    `;
    })
    .join('');

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
            <table width="800" cellpadding="0" cellspacing="0" border="0" style="max-width: 800px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- ヘッダー -->
              <tr>
                <td style="background-color: ${brand.primaryColor}; padding: 40px 20px; text-align: center;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <div style="background-color: #ffffff; display: inline-block; padding: 12px 24px; border-radius: 8px; margin-bottom: 20px;">
                          <h1 style="color: ${brand.primaryColor}; margin: 0; font-size: 28px; font-weight: bold;">${brand.name}</h1>
                        </div>
                        <p style="color: #ffffff; margin: 0; font-size: 16px;">管理者通知システム</p>
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
                              <div style="background-color: #dc2626; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; text-align: center; line-height: 60px;">
                                <span style="color: white; font-size: 24px;">⚠️</span>
                              </div>
                              <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 24px; font-weight: 600;">トライアル猶予期間終了ユーザー通知</h2>
                              <p style="color: #6b7280; margin: 0; font-size: 16px;">${today}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- メッセージ -->
                    <tr>
                      <td style="background-color: #f3f4f6; border-radius: 12px; padding: 25px;">
                        <p style="color: #374151; margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
                          <strong>管理者様</strong>
                        </p>
                        <p style="color: #374151; margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
                          以下のユーザーのトライアル猶予期間が終了しました。
                        </p>
                        <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
                          システムポリシーに基づき、これらのユーザーは削除対象となっています。
                        </p>
                      </td>
                    </tr>

                    <!-- 対象ユーザー数 -->
                    <tr>
                      <td style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px 20px; border-radius: 8px; margin: 30px 0;">
                        <p style="color: #991b1b; margin: 0 0 10px; font-weight: bold; font-size: 14px;">【対象ユーザー数】</p>
                        <p style="color: #991b1b; margin: 0; font-size: 18px; font-weight: 600;">${expiredUsers.length}ユーザー</p>
                      </td>
                    </tr>

                    <!-- 説明文 -->
                    <tr>
                      <td style="padding: 30px 0 20px;">
                        <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
                          下記のリストから各ユーザーを確認し、必要に応じて削除してください：
                        </p>
                      </td>
                    </tr>

                    <!-- ユーザーリストテーブル -->
                    <tr>
                      <td style="padding: 30px 0;">
                        <div style="overflow-x: auto;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                            <!-- テーブルヘッダー -->
                            <tr style="background-color: ${brand.primaryColor};">
                              <td style="padding: 16px 12px; color: white; font-weight: bold; font-size: 14px;">ユーザー名</td>
                              <td style="padding: 16px 12px; color: white; font-weight: bold; font-size: 14px;">メールアドレス</td>
                              <td style="padding: 16px 12px; color: white; font-weight: bold; font-size: 14px;">トライアル終了日</td>
                              <td style="padding: 16px 12px; color: white; font-weight: bold; font-size: 14px;">猶予期間終了日</td>
                              <td style="padding: 16px 12px; color: white; font-weight: bold; font-size: 14px; text-align: center;">操作</td>
                            </tr>
                            <!-- ユーザーデータ -->
                            ${userListHTML}
                          </table>
                        </div>
                      </td>
                    </tr>

                    <!-- 管理者ダッシュボード案内 -->
                    <tr>
                      <td style="background-color: #eff6ff; border-left: 4px solid ${brand.primaryColor}; padding: 16px 20px; border-radius: 8px;">
                        <p style="color: #1e40af; margin: 0; font-size: 16px; line-height: 1.6;">
                          管理者ダッシュボードからすべてのユーザーを一括で確認・管理することも可能です：
                        </p>
                      </td>
                    </tr>

                    <!-- CTAボタン -->
                    <tr>
                      <td align="center" style="padding: 40px 0;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="background-color: ${brand.primaryColor}; border-radius: 8px;">
                              <a href="${brand.appUrl}/dashboard/admin/users" 
                                 style="background-color: ${brand.primaryColor}; 
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
                                🛠️ 管理者ダッシュボードを開く
                              </a>
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
                        <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">${siteName} システム通知</p>
                        <p style="color: #6b7280; margin: 0; font-size: 13px;">本メールは自動送信されています。返信されても対応できませんのでご了承ください。</p>
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

  const text = `管理者様

以下のユーザーのトライアル猶予期間が終了しました。
システムポリシーに基づき、これらのユーザーは削除対象となっています。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 対象ユーザー数
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${expiredUsers.length}ユーザー

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 対象ユーザー一覧
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${expiredUsers
  .map((user) => {
    const trialEndDate = format(new Date(user.trialEndDate), 'yyyy年MM月dd日', { locale: ja });
    const gracePeriodEndDate = format(new Date(user.gracePeriodEndDate), 'yyyy年MM月dd日', {
      locale: ja,
    });
    return `- ${user.name || '未設定'} (${user.email})
  トライアル終了: ${trialEndDate}
  猶予期間終了: ${gracePeriodEndDate}`;
  })
  .join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️ 管理者ダッシュボード
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

管理者ダッシュボードからユーザーを管理するには以下のURLにアクセスしてください：

${brand.appUrl}/dashboard/admin/users

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 運営会社情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${siteName} システム通知
本メールは自動送信されています。返信されても対応できませんのでご了承ください。

${brand.companyAddress}
運営: ${brand.companyName}
${brand.tagline}${brand.name}`;

  return { subject, html, text };
}