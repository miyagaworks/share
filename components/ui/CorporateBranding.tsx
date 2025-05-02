// components/ui/CorporateBranding.tsx
import React, { ReactNode } from 'react';
import Image from 'next/image';

interface CorporateBrandingProps {
  children: ReactNode;
  primaryColor?: string;
  secondaryColor?: string; // セカンダリーカラーは維持
  logoUrl?: string | null;
  tenantName?: string;
  headerText?: string | null;
  textColor?: string | null;
  rounded?: boolean;
  shadow?: boolean;
  border?: boolean;
}

export function CorporateBranding({
  children,
  primaryColor = 'var(--color-corporate-primary)',
  secondaryColor = 'var(--color-corporate-secondary)', // セカンダリーカラーは維持
  logoUrl = null,
  tenantName = '',
  headerText = null,
  textColor = '#FFFFFF',
  rounded = true,
  shadow = true,
  border = true,
}: CorporateBrandingProps) {
  // スタイルの設定
  const containerClasses = `
    bg-white overflow-hidden
    ${rounded ? 'rounded-xl' : ''}
    ${shadow ? 'shadow-md' : ''}
    ${border ? `border border-gray-200` : ''}
  `;

  const headerClasses = 'w-full h-32 flex items-center justify-center relative';

  // 動的スタイル
  const headerStyle = {
    backgroundColor: primaryColor,
  };

  const borderStyle = border
    ? {
        borderColor: `${primaryColor}40`,
        // セカンダリーカラーをボーダーのホバー効果などに使用
        '--secondary-color': secondaryColor, // CSSカスタムプロパティとして使用
      }
    : {};

  // セカンダリーカラーは将来的に以下のようなコンポーネントで使用される可能性があります
  // 現時点では使用していませんが、将来の拡張性のために保持しています
  // 例: セカンダリーボタン、リンク、ボーダーアクセントなど

  return (
    <div className={containerClasses} style={borderStyle}>
      {/* ヘッダー部分 */}
      <div className={headerClasses} style={headerStyle}>
        {logoUrl && (
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

        {/* ヘッダーテキスト */}
        {headerText && (
          <div className="text-lg font-bold z-10" style={{ color: textColor || '#FFFFFF' }}>
            {headerText}
          </div>
        )}
      </div>

      {/* コンテンツ部分 */}
      <div className="p-6">{children}</div>
    </div>
  );
}