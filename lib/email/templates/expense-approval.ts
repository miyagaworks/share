// lib/email/templates/expense-approval.ts
import { getBrandConfig } from '@/lib/brand/config';

interface ExpenseApprovalEmailParams {
  expenseId: string;
  title: string;
  amount: number;
  category: string;
  submitterName: string;
  submitterEmail: string;
  description?: string;
  expenseDate: string;
  approvalUrl: string;
}

export function getExpenseApprovalEmailTemplate(params: ExpenseApprovalEmailParams) {
  const brand = getBrandConfig();
  const {
    expenseId,
    title,
    amount,
    category,
    submitterName,
    submitterEmail,
    description,
    expenseDate,
    approvalUrl,
  } = params;

  const categoryLabels: Record<string, string> = {
    operational: '運営費',
    marketing: '広告・マーケティング',
    system: 'システム・IT',
    legal: '法務・コンプライアンス',
    office: 'オフィス・設備',
    travel: '交通・出張',
    communication: '通信・インターネット',
    other: 'その他',
  };

  const categoryLabel = categoryLabels[category] || category;
  const formattedAmount = `¥${amount.toLocaleString()}`;
  const subject = `【${brand.name}】経費承認が必要です - ${title}（${formattedAmount}）`;

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
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- ヘッダー -->
                <tr>
                  <td style="background-color: #f59e0b; padding: 40px 20px; text-align: center;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <div style="background-color: #ffffff; display: inline-block; padding: 12px 24px; border-radius: 8px; margin-bottom: 20px;">
                            <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: bold;">${brand.name}</h1>
                          </div>
                          <p style="color: #ffffff; margin: 0; font-size: 16px;">経費承認通知</p>
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
                                <div style="background-color: #f59e0b; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; text-align: center; line-height: 60px;">
                                  <span style="color: white; font-size: 24px;">📋</span>
                                </div>
                                <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 24px; font-weight: 600;">経費承認のお願い</h2>
                                <p style="color: #6b7280; margin: 0; font-size: 16px;">承認待ちの経費があります</p>
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
                            受託者から経費の承認申請がありました。以下の内容をご確認の上、承認または否認をお願いいたします。
                          </p>
                        </td>
                      </tr>
  
                      <!-- 経費詳細 -->
                      <tr>
                        <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0;">
                          <h3 style="color: #92400e; margin: 0 0 15px; font-size: 18px; font-weight: 600;">📋 経費詳細</h3>
                          
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px; font-weight: 600;">タイトル</td>
                              <td style="padding: 8px 0; color: #374151; font-size: 14px; font-weight: 600;">${title}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">金額</td>
                              <td style="padding: 8px 0; color: #dc2626; font-size: 18px; font-weight: bold; border-top: 1px solid #e5e7eb;">${formattedAmount}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">カテゴリー</td>
                              <td style="padding: 8px 0; color: #374151; font-size: 14px; border-top: 1px solid #e5e7eb;">${categoryLabel}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">発生日</td>
                              <td style="padding: 8px 0; color: #374151; font-size: 14px; border-top: 1px solid #e5e7eb;">${expenseDate}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">申請者</td>
                              <td style="padding: 8px 0; color: #374151; font-size: 14px; border-top: 1px solid #e5e7eb;">${submitterName}（${submitterEmail}）</td>
                            </tr>
                            ${
                              description
                                ? `
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; vertical-align: top;">説明</td>
                              <td style="padding: 8px 0; color: #374151; font-size: 14px; border-top: 1px solid #e5e7eb; line-height: 1.5;">${description}</td>
                            </tr>
                            `
                                : ''
                            }
                          </table>
                        </td>
                      </tr>
  
                      <!-- アクションボタン -->
                      <tr>
                        <td align="center" style="padding: 40px 0;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-right: 10px;">
                                <table cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="background-color: #10b981; border-radius: 8px;">
                                      <a href="${approvalUrl}&action=approve" 
                                         style="background-color: #10b981; 
                                                color: #ffffff; 
                                                text-decoration: none; 
                                                padding: 14px 24px; 
                                                border-radius: 8px; 
                                                font-weight: bold; 
                                                font-size: 16px; 
                                                display: block;
                                                text-align: center;
                                                width: 120px;
                                                box-sizing: border-box;">
                                        ✓ 承認する
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="padding-left: 10px;">
                                <table cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <td style="background-color: #dc2626; border-radius: 8px;">
                                      <a href="${approvalUrl}&action=reject" 
                                         style="background-color: #dc2626; 
                                                color: #ffffff; 
                                                text-decoration: none; 
                                                padding: 14px 24px; 
                                                border-radius: 8px; 
                                                font-weight: bold; 
                                                font-size: 16px; 
                                                display: block;
                                                text-align: center;
                                                width: 120px;
                                                box-sizing: border-box;">
                                        ✗ 否認する
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
  
                      <!-- 管理画面リンク -->
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="background-color: ${brand.primaryColor}; border-radius: 8px;">
                                <a href="${approvalUrl}"
                                   style="background-color: ${brand.primaryColor};
                                          color: #ffffff; 
                                          text-decoration: none; 
                                          padding: 12px 24px; 
                                          border-radius: 8px; 
                                          font-weight: bold; 
                                          font-size: 14px; 
                                          display: block;
                                          text-align: center;
                                          width: 200px;
                                          box-sizing: border-box;">
                                  🛠️ 管理画面で詳細を確認
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
  
                      <!-- 注意事項 -->
                      <tr>
                        <td style="background-color: #eff6ff; border-left: 4px solid ${brand.primaryColor}; padding: 16px 20px; border-radius: 8px;">
                          <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.5;">
                            <strong>📌 承認ルール</strong><br>
                            • 5,000円以上の経費は委託者の承認が必要です<br>
                            • 承認後、経費が正式に計上されます<br>
                            • 承認・否認の結果は申請者に自動通知されます
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
                          <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">${brand.name} 経費管理システム</p>
                          <p style="color: #6b7280; margin: 0; font-size: 13px;">本メールは自動送信されています</p>
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
  
  受託者から経費の承認申請がありました。
  以下の内容をご確認の上、承認または否認をお願いいたします。
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 経費詳細
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  タイトル: ${title}
  金額: ${formattedAmount}
  カテゴリー: ${categoryLabel}
  発生日: ${expenseDate}
  申請者: ${submitterName}（${submitterEmail}）
  ${description ? `説明: ${description}` : ''}
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚡ 承認アクション
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  ✓ 承認する: ${approvalUrl}&action=approve
  ✗ 否認する: ${approvalUrl}&action=reject
  
  🛠️ 管理画面で詳細確認: ${approvalUrl}
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📌 承認ルール
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  • 5,000円以上の経費は委託者の承認が必要です
  • 承認後、経費が正式に計上されます
  • 承認・否認の結果は申請者に自動通知されます
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🏢 運営会社情報
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  ${brand.name} 経費管理システム
  本メールは自動送信されています

  ${brand.companyAddress}
  運営: ${brand.companyName}`;

  return { subject, html, text };
}