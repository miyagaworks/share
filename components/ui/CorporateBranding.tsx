// components/ui/CorporateBranding.tsx
import React, { ReactNode } from 'react';
import Image from 'next/image';

interface CorporateBrandingProps {
  children: ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string | null;
  tenantName?: string;
  headerText?: string | null;
  textColor?: string | null;
  rounded?: boolean;
  shadow?: boolean;
  border?: boolean;
  showLogo?: boolean; // ロゴ表示の制御用
}

export function CorporateBranding({
  children,
  primaryColor = 'var(--color-corporate-primary)',
  secondaryColor = 'var(--color-corporate-secondary)',
  logoUrl = null,
  tenantName = '',
  headerText = null,
  textColor = '#FFFFFF',
  rounded = true,
  shadow = true,
  border = true,
  showLogo = false, // デフォルトでロゴを非表示に変更
}: CorporateBrandingProps) {
  // スタイルの設定
  const containerClasses = `
    bg-white overflow-hidden
    ${rounded ? 'rounded-xl' : ''}
    ${shadow ? 'shadow-md' : ''}
    ${border ? `border border-gray-200` : ''}
  `;

  // ヘッダー高さを調整（スマホ表示を考慮）
  const headerClasses = 'w-full flex items-center justify-center relative py-4 px-2';

  // 動的スタイル
  const headerStyle = {
    backgroundColor: primaryColor,
  };

  const borderStyle = border
    ? {
        borderColor: `${primaryColor}40`,
        '--secondary-color': secondaryColor,
      }
    : {};

  return (
    <div className={containerClasses} style={borderStyle}>
      {/* ヘッダー部分 - 高さを調整して可変に */}
      <div className={headerClasses} style={headerStyle}>
        {/* ロゴ表示(showLogoがtrueの場合のみ表示) */}
        {showLogo && logoUrl && (
          <div className="absolute top-2 right-2 bg-white rounded-full p-1 h-10 w-10 flex items-center justify-center">
            <Image
              src={logoUrl}
              alt={tenantName || 'ロゴ'}
              width={24}
              height={24}
              className="max-h-6 max-w-6 object-contain"
            />
          </div>
        )}

        {/* ヘッダーテキスト - スマホ表示でもきれいに */}
        {headerText && (
          <div
            className="text-base sm:text-lg font-bold z-10 text-center break-words px-2"
            style={{ color: textColor || '#FFFFFF' }}
          >
            {headerText}
          </div>
        )}
      </div>

      {/* コンテンツ部分 */}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}