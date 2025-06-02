// lib/email/templates/grace-period-expired.ts (#3B82F6ベース)
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

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
  const siteName = 'Share';
  const today = format(new Date(), 'yyyy年MM月dd日', { locale: ja });
  const subject = `【管理者通知】${siteName} トライアル猶予期間終了ユーザー一覧（${today}）`;

  // ユーザーリストのHTMLを生成
  const userListHTML = expiredUsers
    .map((user) => {
      const trialEndDate = format(new Date(user.trialEndDate), 'yyyy年MM月dd日', { locale: ja });
      const gracePeriodEndDate = format(new Date(user.gracePeriodEndDate), 'yyyy年MM月dd日', {
        locale: ja,
      });
      const deleteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.sns-share.com'}/dashboard/admin/users?action=delete&userId=${user.id}`;

      return `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${user.name || '未設定'}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${user.email}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${trialEndDate}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151;">${gracePeriodEndDate}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <a href="${deleteUrl}" 
             style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); 
                    color: white; 
                    padding: 8px 12px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-size: 12px; 
                    font-weight: 600;
                    display: inline-block;
                    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);">
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
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <!-- ヘッダー -->
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); padding: 40px 20px; text-align: center;">
          <div style="background-color: rgba(255, 255, 255, 0.1); display: inline-block; padding: 12px 24px; border-radius: 50px; margin-bottom: 20px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">Share</h1>
          </div>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 16px; font-weight: 300;">管理者通知システム</p>
        </div>

        <!-- メインコンテンツ -->
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #dc2626; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 24px;">⚠️</span>
            </div>
            <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 24px; font-weight: 600;">トライアル猶予期間終了ユーザー通知</h2>
            <p style="color: #6b7280; margin: 0; font-size: 16px;">${today}</p>
          </div>

          <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; padding: 25px; margin: 30px 0;">
            <p style="color: #374151; margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
              <strong>管理者様</strong>
            </p>
            <p style="color: #374151; margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
              以下のユーザーのトライアル猶予期間が終了しました。
            </p>
            <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
              システムポリシーに基づき、これらのユーザーは削除対象となっています。
            </p>
          </div>

          <!-- 対象ユーザー数 -->
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #991b1b; margin: 0 0 10px; font-weight: bold; font-size: 14px;">【対象ユーザー数】</p>
            <p style="color: #991b1b; margin: 0; font-size: 18px; font-weight: 600;">${expiredUsers.length}ユーザー</p>
          </div>

          <p style="color: #374151; margin: 30px 0 20px; font-size: 16px; line-height: 1.6;">
            下記のリストから各ユーザーを確認し、必要に応じて削除してください：
          </p>

          <!-- ユーザーリストテーブル -->
          <div style="overflow-x: auto; margin: 30px 0;">
            <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <thead>
                <tr style="background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);">
                  <th style="padding: 16px 12px; text-align: left; color: white; font-weight: 600; font-size: 14px;">ユーザー名</th>
                  <th style="padding: 16px 12px; text-align: left; color: white; font-weight: 600; font-size: 14px;">メールアドレス</th>
                  <th style="padding: 16px 12px; text-align: left; color: white; font-weight: 600; font-size: 14px;">トライアル終了日</th>
                  <th style="padding: 16px 12px; text-align: left; color: white; font-weight: 600; font-size: 14px;">猶予期間終了日</th>
                  <th style="padding: 16px 12px; text-align: center; color: white; font-weight: 600; font-size: 14px;">操作</th>
                </tr>
              </thead>
              <tbody>
                ${userListHTML}
              </tbody>
            </table>
          </div>

          <!-- 管理者ダッシュボードリンク -->
          <div style="background-color: #eff6ff; border-left: 4px solid #3B82F6; padding: 16px 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #1e40af; margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
              管理者ダッシュボードからすべてのユーザーを一括で確認・管理することも可能です：
            </p>
          </div>

          <!-- CTA ボタン -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.sns-share.com'}/dashboard/admin/users" 
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
              🛠️ 管理者ダッシュボードを開く
            </a>
          </div>
        </div>

        <!-- フッター -->
        <div style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 20px;">
            <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">${siteName} システム通知</p>
            <p style="color: #6b7280; margin: 0; font-size: 13px;">本メールは自動送信されています。返信されても対応できませんのでご了承ください。</p>
          </div>
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; margin: 0 0 5px; font-size: 12px;">
              〒730-0046 広島県広島市中区昭和町6-11
            </p>
            <p style="color: #9ca3af; margin: 0 0 15px; font-size: 12px;">
              運営: ビイアルファ株式会社
            </p>
          </div>
        </div>
      </div>
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

${process.env.NEXT_PUBLIC_APP_URL || 'https://app.sns-share.com'}/dashboard/admin/users

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 運営会社情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${siteName} システム通知
本メールは自動送信されています。返信されても対応できませんのでご了承ください。

〒730-0046 広島県広島市中区昭和町6-11
運営: ビイアルファ株式会社
すべてのSNS、ワンタップでShare`;

  return { subject, html, text };
}