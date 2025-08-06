// lib/email/templates/expense-approval-result.ts

interface ExpenseApprovalResultEmailParams {
  title: string;
  amount: number;
  category: string;
  expenseDate: string;
  approvalStatus: 'approved' | 'rejected';
  approverName: string;
  submitterName: string;
  rejectionReason?: string;
}

export function getExpenseApprovalResultEmailTemplate(params: ExpenseApprovalResultEmailParams) {
  const {
    title,
    amount,
    category,
    expenseDate,
    approvalStatus,
    approverName,
    submitterName,
    rejectionReason,
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
  const isApproved = approvalStatus === 'approved';
  const statusText = isApproved ? '承認されました' : '否認されました';
  const subject = `【Share】経費申請が${statusText} - ${title}`;

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
                  <td style="background-color: ${isApproved ? '#10b981' : '#dc2626'}; padding: 40px 20px; text-align: center;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <div style="background-color: #ffffff; display: inline-block; padding: 12px 24px; border-radius: 8px; margin-bottom: 20px;">
                            <h1 style="color: ${isApproved ? '#10b981' : '#dc2626'}; margin: 0; font-size: 28px; font-weight: bold;">Share</h1>
                          </div>
                          <p style="color: #ffffff; margin: 0; font-size: 16px;">経費申請結果通知</p>
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
                                <div style="background-color: ${isApproved ? '#10b981' : '#dc2626'}; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; text-align: center; line-height: 60px;">
                                  <span style="color: white; font-size: 24px;">${isApproved ? '✓' : '✗'}</span>
                                </div>
                                <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 24px; font-weight: 600;">経費申請が${statusText}</h2>
                                <p style="color: #6b7280; margin: 0; font-size: 16px;">${approverName}による判定</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
  
                      <!-- メッセージ -->
                      <tr>
                        <td style="background-color: #f3f4f6; border-radius: 12px; padding: 25px;">
                          <p style="color: #374151; margin: 0 0 15px; font-size: 16px; line-height: 1.6;">
                            <strong>${submitterName}</strong> 様
                          </p>
                          <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
                            ご申請いただいた経費について、委託者による審査が完了いたしました。
                          </p>
                        </td>
                      </tr>
  
                      <!-- 結果表示 -->
                      <tr>
                        <td style="background-color: ${isApproved ? '#ecfdf5' : '#fef2f2'}; border-left: 4px solid ${isApproved ? '#10b981' : '#dc2626'}; padding: 20px; border-radius: 8px; margin: 30px 0;">
                          <h3 style="color: ${isApproved ? '#065f46' : '#991b1b'}; margin: 0 0 15px; font-size: 18px; font-weight: 600;">
                            📋 申請結果: ${statusText}
                          </h3>
                          
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
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">承認者</td>
                              <td style="padding: 8px 0; color: #374151; font-size: 14px; border-top: 1px solid #e5e7eb;">${approverName}</td>
                            </tr>
                            ${
                              rejectionReason
                                ? `
                            <tr>
                              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; vertical-align: top;">否認理由</td>
                              <td style="padding: 8px 0; color: #dc2626; font-size: 14px; border-top: 1px solid #e5e7eb; line-height: 1.5;">${rejectionReason}</td>
                            </tr>
                            `
                                : ''
                            }
                          </table>
                        </td>
                      </tr>
  
                      <!-- 次のステップ -->
                      <tr>
                        <td style="background-color: #eff6ff; border-left: 4px solid #3B82F6; padding: 16px 20px; border-radius: 8px;">
                          <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.5;">
                            <strong>📌 ${isApproved ? '承認後の対応' : '否認後の対応'}</strong><br>
                            ${
                              isApproved
                                ? '• 経費が正式に計上されました<br>• 経費管理画面で確認できます<br>• 必要に応じて領収書等の保管をお願いします'
                                : '• 経費は計上されませんでした<br>• 修正が必要な場合は再申請してください<br>• ご不明な点は管理者までお問い合わせください'
                            }
                          </p>
                        </td>
                      </tr>
  
                      <!-- 管理画面リンク -->
                      <tr>
                        <td align="center" style="padding: 40px 0;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="background-color: #3B82F6; border-radius: 8px;">
                                <a href="https://app.sns-share.com/dashboard/admin/company-expenses" 
                                   style="background-color: #3B82F6; 
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
                                  📊 経費管理画面を確認
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
                          <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">Share 経費管理システム</p>
                          <p style="color: #6b7280; margin: 0; font-size: 13px;">本メールは自動送信されています</p>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                          <p style="color: #9ca3af; margin: 0 0 5px; font-size: 12px;">
                            〒731-0137 広島県広島市安佐南区山本2-3-35
                          </p>
                          <p style="color: #9ca3af; margin: 0 0 15px; font-size: 12px;">
                            運営: 株式会社Senrigan
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

  const text = `${submitterName} 様
  
  ご申請いただいた経費について、委託者による審査が完了いたしました。
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📋 申請結果: ${statusText}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  タイトル: ${title}
  金額: ${formattedAmount}
  カテゴリー: ${categoryLabel}
  発生日: ${expenseDate}
  承認者: ${approverName}
  ${rejectionReason ? `否認理由: ${rejectionReason}` : ''}
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📌 ${isApproved ? '承認後の対応' : '否認後の対応'}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  ${
    isApproved
      ? '• 経費が正式に計上されました\n• 経費管理画面で確認できます\n• 必要に応じて領収書等の保管をお願いします'
      : '• 経費は計上されませんでした\n• 修正が必要な場合は再申請してください\n• ご不明な点は管理者までお問い合わせください'
  }
  
  📊 経費管理画面: https://app.sns-share.com/dashboard/admin/company-expenses
  
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🏢 運営会社情報
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  Share 経費管理システム
  本メールは自動送信されています
  
  〒731-0137 広島県広島市安佐南区山本2-3-35
  運営: 株式会社Senrigan`;

  return { subject, html, text };
}