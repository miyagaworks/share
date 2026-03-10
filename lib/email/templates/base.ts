// lib/email/templates/base.ts
// メールテンプレート共通のヘッダー・フッター生成関数
// getBrandConfig() を使い、ブランドを動的に切り替える

import { getBrandConfig } from '@/lib/brand/config';

/**
 * メール共通HTMLヘッダー
 * @param subtitle ヘッダー下のサブタイトル（例: "管理者通知", "解約申請受付のお知らせ"）
 * @param headerColor ヘッダー背景色（省略時は brand.primaryColor）
 */
export function emailHeader(options?: {
  subtitle?: string;
  headerColor?: string;
}): string {
  const brand = getBrandConfig();
  const color = options?.headerColor || brand.primaryColor;

  return `
              <!-- ヘッダー -->
              <tr>
                <td style="background-color: ${color}; padding: 40px 20px; text-align: center;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <div style="background-color: #ffffff; display: inline-block; padding: 12px 24px; border-radius: 8px; margin-bottom: 20px;">
                          <h1 style="color: ${color}; margin: 0; font-size: 28px; font-weight: bold;">${brand.name}</h1>
                        </div>
                        ${options?.subtitle ? `<p style="color: #ffffff; margin: 0; font-size: 16px;">${options.subtitle}</p>` : ''}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

/**
 * メール共通HTMLフッター
 * @param teamName チーム名（省略時は "${brand.name} サポートチーム"）
 * @param showSupportEmail サポートメールリンクの表示（デフォルト: true）
 * @param showPrivacyLinks プライバシーポリシー・利用規約リンクの表示（デフォルト: true）
 */
export function emailFooter(options?: {
  teamName?: string;
  showSupportEmail?: boolean;
  showPrivacyLinks?: boolean;
}): string {
  const brand = getBrandConfig();
  const teamName = options?.teamName || `${brand.name} サポートチーム`;
  const showSupport = options?.showSupportEmail !== false;
  const showPrivacy = options?.showPrivacyLinks !== false;
  const privacyFullUrl = brand.privacyUrl.startsWith('http') ? brand.privacyUrl : `${brand.appUrl}${brand.privacyUrl}`;
  const termsFullUrl = brand.termsUrl.startsWith('http') ? brand.termsUrl : `${brand.appUrl}${brand.termsUrl}`;

  return `
              <!-- フッター -->
              <tr>
                <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding-bottom: 20px;">
                        <p style="color: #6b7280; margin: 0 0 10px; font-size: 14px;">${teamName}</p>
                        ${showSupport ? `<a href="mailto:${brand.supportEmail}"
                           style="color: ${brand.primaryColor}; text-decoration: none; font-weight: 600;">
                          ${brand.supportEmail}
                        </a>` : ''}
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
                        ${showPrivacy ? `<div style="margin-top: 15px;">
                          <a href="${privacyFullUrl}"
                             style="color: #9ca3af; text-decoration: none; font-size: 11px; margin: 0 10px;">
                            プライバシーポリシー
                          </a>
                          <span style="color: #d1d5db;">|</span>
                          <a href="${termsFullUrl}"
                             style="color: #9ca3af; text-decoration: none; font-size: 11px; margin: 0 10px;">
                            利用規約
                          </a>
                        </div>` : ''}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

/**
 * メール共通テキストフッター（サポート情報 + 運営会社情報）
 * @param teamName チーム名
 * @param showSupportInfo サポート情報の表示（デフォルト: true）
 * @param showCompanyInfo 運営会社情報の表示（デフォルト: true）
 * @param showPrivacyLinks プライバシー・利用規約リンクの表示（デフォルト: true）
 */
export function textFooter(options?: {
  teamName?: string;
  showSupportInfo?: boolean;
  showCompanyInfo?: boolean;
  showPrivacyLinks?: boolean;
}): string {
  const brand = getBrandConfig();
  const teamName = options?.teamName || `${brand.name} サポートチーム`;
  const showSupport = options?.showSupportInfo !== false;
  const showCompany = options?.showCompanyInfo !== false;
  const showPrivacy = options?.showPrivacyLinks !== false;
  const privacyFullUrl = brand.privacyUrl.startsWith('http') ? brand.privacyUrl : `${brand.appUrl}${brand.privacyUrl}`;
  const termsFullUrl = brand.termsUrl.startsWith('http') ? brand.termsUrl : `${brand.appUrl}${brand.termsUrl}`;

  let text = '';

  if (showSupport) {
    text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 サポート情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${teamName}
✉️ メール: ${brand.supportEmail}
🌐 ウェブサイト: ${brand.appUrl}
`;
  }

  if (showCompany) {
    text += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 運営会社情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${brand.companyAddress}
運営: ${brand.companyName}
${brand.tagline}${brand.name}
`;
  }

  if (showPrivacy) {
    text += `
📋 プライバシーポリシー: ${privacyFullUrl}
📋 利用規約: ${termsFullUrl}`;
  }

  return text;
}

/**
 * メール共通HTML署名ブロック（contact route用）
 * ブランド情報を使った署名フッター
 */
export function emailSignatureBlock(): string {
  const brand = getBrandConfig();
  const privacyFullUrl = brand.privacyUrl.startsWith('http') ? brand.privacyUrl : `${brand.appUrl}${brand.privacyUrl}`;
  const termsFullUrl = brand.termsUrl.startsWith('http') ? brand.termsUrl : `${brand.appUrl}${brand.termsUrl}`;

  return `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 550px; color: #333; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <div style="font-size: 16px; font-weight: bold; margin: 0; color: #1E40AF;">${brand.name} サポートチーム</div>
    <div style="font-size: 14px; margin: 2px 0 8px; color: #4B5563;">${brand.companyName} ${brand.name}運営事務局</div>
    <div style="border-top: 2px solid ${brand.primaryColor}; margin: 12px 0; width: 100px;"></div>
    <div style="font-size: 13px; margin: 4px 0;">
      メール: <a href="mailto:${brand.supportEmail}" style="color: ${brand.primaryColor}; text-decoration: none;">${brand.supportEmail}</a><br>
      ウェブ: <a href="${brand.appUrl}" style="color: ${brand.primaryColor}; text-decoration: none;">${brand.appUrl}</a>
    </div>
    <div style="margin: 12px 0; font-style: italic; color: #4B5563; font-size: 13px; border-left: 3px solid ${brand.primaryColor}; padding-left: 10px;">
      ${brand.tagline}${brand.name}
    </div>
    <div style="font-size: 12px; color: #6B7280; margin-top: 8px;">
      ${brand.companyAddress}<br>
      運営: <a href="${brand.companyUrl}" style="color: ${brand.primaryColor}; text-decoration: none; font-weight: 500;" target="_blank">${brand.companyName}</a>
    </div>
    <div style="margin-top: 10px;">
      <a href="${privacyFullUrl}" style="display: inline-block; margin-right: 8px; color: ${brand.primaryColor}; text-decoration: none;">プライバシーポリシー</a> |
      <a href="${termsFullUrl}" style="display: inline-block; margin-right: 8px; color: ${brand.primaryColor}; text-decoration: none;">利用規約</a>
    </div>
  </div>`;
}
