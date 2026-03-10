// lib/email/templates/cancel-request.ts
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getBrandConfig } from '@/lib/brand/config';

interface CancelRequestEmailParams {
  userName: string;
  currentPlan: string;
  currentInterval: string;
  cancelDate: Date;
  paidAmount: number;
  refundAmount: number;
  usedMonths: number;
  reason?: string;
}

export function getCancelRequestEmailTemplate(params: CancelRequestEmailParams) {
  const {
    userName,
    currentPlan,
    currentInterval,
    cancelDate,
    paidAmount,
    refundAmount,
    usedMonths,
    reason,
  } = params;
  const brand = getBrandConfig();
  const formattedCancelDate = format(cancelDate, 'yyyy年MM月dd日', { locale: ja });
  const intervalText = currentInterval === 'year' ? '年額' : '月額';

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>【${brand.name}】解約申請を受け付けました</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- ヘッダー -->
              <tr>
                <td style="background-color: ${brand.primaryColor}; padding: 40px 20px; text-align: center;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <div style="background-color: #ffffff; display: inline-block; padding: 12px 24px; border-radius: 8px; margin-bottom: 20px;">
                          <h1 style="color: ${brand.primaryColor}; margin: 0; font-size: 28px; font-weight: bold;">${brand.name}</h1>
                        </div>
                        <p style="color: #ffffff; margin: 0; font-size: 16px;">解約申請受付のお知らせ</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- メインコンテンツ -->
              <tr>
                <td style="padding: 40px 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    
                    <!-- タイトル -->
                    <tr>
                      <td align="center" style="padding-bottom: 30px;">
                        <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 24px; font-weight: 600;">解約申請を受け付けました</h2>
                        <p style="color: #6b7280; margin: 0; font-size: 16px;">内容を確認の上、順次処理いたします</p>
                      </td>
                    </tr>

                    <!-- 挨拶 -->
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
                          <strong>${userName}</strong> 様
                        </p>
                        <p style="color: #374151; margin: 15px 0 0; font-size: 16px; line-height: 1.6;">
                          この度は解約のお申し出をいただき、誠にありがとうございます。<br>
                          以下の内容で解約申請を受け付けいたしました。
                        </p>
                      </td>
                    </tr>

                    <!-- 申請内容 -->
                    <tr>
                      <td style="background-color: #f9fafb; border-radius: 8px; padding: 25px; border: 1px solid #e5e7eb;">
                        <h3 style="color: #1f2937; margin: 0 0 20px; font-size: 18px; font-weight: 600;">申請内容</h3>
                        
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">現在のプラン</td>
                            <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">${currentPlan}（${intervalText}）</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">解約希望日</td>
                            <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">${formattedCancelDate}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">支払い済み金額</td>
                            <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">¥${paidAmount.toLocaleString()}</td>
                          </tr>
                          ${
                            refundAmount > 0
                              ? `
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">利用済み月数</td>
                            <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">${usedMonths}ヶ月</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #10b981; font-size: 14px; font-weight: 600;">返金予定金額</td>
                            <td style="padding: 8px 0; color: #10b981; font-size: 14px; font-weight: 600;">¥${refundAmount.toLocaleString()}</td>
                          </tr>
                          `
                              : ''
                          }
                        </table>
                        
                        ${
                          reason
                            ? `
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                          <h4 style="color: #1f2937; margin: 0 0 10px; font-size: 14px; font-weight: 600;">解約理由</h4>
                          <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5;">${reason}</p>
                        </div>
                        `
                            : ''
                        }
                      </td>
                    </tr>

                    <!-- 処理について -->
                    <tr>
                      <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 30px 0;">
                        <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px; font-weight: 600;">今後の流れ</h3>
                        <div style="color: #92400e; font-size: 14px; line-height: 1.6;">
                          <p style="margin: 0 0 10px;">1. 管理者が申請内容を確認いたします（1-3営業日）</p>
                          <p style="margin: 0 0 10px;">2. 解約処理を実行いたします</p>
                          <p style="margin: 0 0 10px;">3. 解約完了とご返金についてご連絡いたします</p>
                          ${refundAmount > 0 ? `<p style="margin: 0; font-weight: 600;">※ご返金がある場合、処理完了まで5-10営業日程度お時間をいただきます</p>` : ''}
                        </div>
                      </td>
                    </tr>

                    <!-- 注意事項 -->
                    <tr>
                      <td style="padding: 30px 0;">
                        <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.6;">
                          解約処理が完了するまでは、引き続きサービスをご利用いただけます。<br>
                          ご不明な点がございましたら、お気軽にお問い合わせください。
                        </p>
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
                        <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">${brand.name} サポートチーム</p>
                        <a href="mailto:${brand.supportEmail}" 
                           style="color: ${brand.primaryColor}; text-decoration: none; font-weight: 600;">
                          ${brand.supportEmail}
                        </a>
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

  const text = `${userName} 様

この度は解約のお申し出をいただき、誠にありがとうございます。
以下の内容で解約申請を受け付けいたしました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 申請内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

現在のプラン: ${currentPlan}（${intervalText}）
解約希望日: ${formattedCancelDate}
支払い済み金額: ¥${paidAmount.toLocaleString()}
${refundAmount > 0 ? `利用済み月数: ${usedMonths}ヶ月\n返金予定金額: ¥${refundAmount.toLocaleString()}` : ''}

${reason ? `解約理由: ${reason}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 今後の流れ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 管理者が申請内容を確認いたします（1-3営業日）
2. 解約処理を実行いたします
3. 解約完了とご返金についてご連絡いたします
${refundAmount > 0 ? '※ご返金がある場合、処理完了まで5-10営業日程度お時間をいただきます' : ''}

解約処理が完了するまでは、引き続きサービスをご利用いただけます。
ご不明な点がございましたら、お気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 サポート情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${brand.name} サポートチーム
✉️ メール: ${brand.supportEmail}

${brand.companyAddress}
運営: ${brand.companyName}`;

  return {
    subject: `【${brand.name}】解約申請を受け付けました`,
    html,
    text,
  };
}