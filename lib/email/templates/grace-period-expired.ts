// /lib/email/templates/grace-period-expired.ts
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
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${user.name || '未設定'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${user.email}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${trialEndDate}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${gracePeriodEndDate}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">
          <a href="${deleteUrl}" style="background-color: #DC4A58; color: white; padding: 6px 10px; text-decoration: none; border-radius: 4px; font-size: 12px;">削除する</a>
        </td>
      </tr>
    `;
    })
    .join('');
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">トライアル猶予期間終了ユーザー通知</h1>
      <p>管理者様</p>
      <p>以下のユーザーのトライアル猶予期間が終了しました。<br>
      システムポリシーに基づき、これらのユーザーは削除対象となっています。</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="font-weight: bold; margin: 0 0 10px 0;">【対象ユーザー数】</p>
        <p style="margin: 0; font-size: 16px;">${expiredUsers.length}ユーザー</p>
      </div>
      <p>下記のリストから各ユーザーを確認し、必要に応じて削除してください：</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">ユーザー名</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">メールアドレス</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">トライアル終了日</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">猶予期間終了日</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">操作</th>
          </tr>
        </thead>
        <tbody>
          ${userListHTML}
        </tbody>
      </table>
      <p style="margin-top: 20px;">また、管理者ダッシュボードからすべてのユーザーを一括で確認・管理することも可能です：</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.sns-share.com'}/dashboard/admin/users" style="background-color: #4A89DC; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">管理者ダッシュボードを開く</a>
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
        <p>${siteName} システム通知<br>
        本メールは自動送信されています。返信されても対応できませんのでご了承ください。</p>
        <div style="margin-top: 10px; font-size: 11px; color: #999;">
          <p>すべてのSNS、ワンタップでShare</p>
          <p>〒730-0046 広島県広島市中区昭和町6-11<br>
          運営: ビイアルファ株式会社</p>
        </div>
      </div>
    </div>
  `;
  // テキスト形式のメール内容
  const text = `管理者様
以下のユーザーのトライアル猶予期間が終了しました。
システムポリシーに基づき、これらのユーザーは削除対象となっています。
【対象ユーザー数】
${expiredUsers.length}ユーザー
対象ユーザー一覧:
${expiredUsers
  .map((user) => {
    const trialEndDate = format(new Date(user.trialEndDate), 'yyyy年MM月dd日', { locale: ja });
    const gracePeriodEndDate = format(new Date(user.gracePeriodEndDate), 'yyyy年MM月dd日', {
      locale: ja,
    });
    return `- ${user.name || '未設定'} (${user.email}) - トライアル終了: ${trialEndDate} - 猶予期間終了: ${gracePeriodEndDate}`;
  })
  .join('\n')}
管理者ダッシュボードからユーザーを管理するには以下のURLにアクセスしてください：
${process.env.NEXT_PUBLIC_APP_URL || 'https://app.sns-share.com'}/dashboard/admin/users
---------------------
${siteName} システム通知
本メールは自動送信されています。返信されても対応できませんのでご了承ください。
すべてのSNS、ワンタップでShare
〒730-0046 広島県広島市中区昭和町6-11
運営: ビイアルファ株式会社`;
  return { subject, html, text };
}