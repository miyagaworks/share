// components/corporate/ImprovedBrandingPreview.tsx
import React from 'react';
import Image from 'next/image';
import { HiUser, HiGlobe, HiMail, HiPhone, HiPlus } from 'react-icons/hi';
import { ImprovedSnsIcon } from '@/components/shared/ImprovedSnsIcon';
import { type SnsPlatform } from '@/types/sns';

// SNSリンクタイプ
interface SnsLink {
  id: string;
  platform: string;
  username: string | null;
  url: string;
  displayOrder: number;
}

// 法人SNSリンクタイプ
interface CorporateSnsLink extends SnsLink {
  isRequired: boolean;
  description: string | null;
}

interface ImprovedBrandingPreviewProps {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  logoWidth?: number;
  logoHeight?: number;
  tenantName: string;
  userName: string;
  userNameEn?: string | null;
  userImage?: string | null;
  headerText?: string | null;
  textColor?: string | null;
  snsIconColor?: string | null;
  bio?: string | null;
  corporateSnsLinks?: CorporateSnsLink[];
  personalSnsLinks?: SnsLink[];
  department?: string | null;
  position?: string | null;
}

export function ImprovedBrandingPreview({
  primaryColor,
  secondaryColor,
  logoUrl,
  logoWidth = 400,
  logoHeight = 400,
  tenantName,
  userName,
  userNameEn,
  userImage,
  headerText,
  textColor = '#FFFFFF',
  snsIconColor = '#333333',
  bio,
  corporateSnsLinks = [],
  personalSnsLinks = [],
  department = '営業部',
  position,
}: ImprovedBrandingPreviewProps) {
  // null チェックを行い、デフォルト値を設定
  const safeTextColor = textColor || '#FFFFFF';
  const safeSnsIconColor = snsIconColor === 'original' ? 'original' : snsIconColor || '#333333';

  // プラットフォーム名を正規化する関数
  const normalizeSnsPlatform = (platform: string): SnsPlatform => {
    const platformMap: { [key: string]: SnsPlatform } = {
      line: 'line',
      公式line: 'official-line',
      youtube: 'youtube',
      x: 'x',
      instagram: 'instagram',
      tiktok: 'tiktok',
      facebook: 'facebook',
      pinterest: 'pinterest',
      threads: 'threads',
      note: 'note',
      bereal: 'bereal',
    };

    return platformMap[platform.toLowerCase()] || 'line';
  };

  // プラットフォーム名を表示用に変換
  const getPlatformDisplayName = (platform: string) => {
    const platformMap: { [key: string]: string } = {
      line: 'LINE',
      'official-line': '公式LINE',
      youtube: 'YouTube',
      x: 'X',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      facebook: 'Facebook',
      pinterest: 'Pinterest',
      threads: 'Threads',
      note: 'note',
      bereal: 'BeReal',
    };
    return platformMap[platform.toLowerCase()] || platform;
  };

  // 全SNSリンク
  const allSnsLinks = [
    ...corporateSnsLinks.map((link) => ({ ...link, isCorporate: true })),
    ...personalSnsLinks.map((link) => ({ ...link, isCorporate: false })),
  ].sort((a, b) => a.displayOrder - b.displayOrder);

  // SNSアイコン表示用の最大数
  const maxSnsDisplayCount = 4;
  const displaySnsLinks = allSnsLinks.slice(0, maxSnsDisplayCount);
  const moreSnsCount = allSnsLinks.length - maxSnsDisplayCount;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm max-w-xs mx-auto">
      {/* ヘッダー部分 */}
      <div className="relative" style={{ backgroundColor: primaryColor }}>
        {/* ヘッダーテキスト（設定されている場合） */}
        {headerText && (
          <div className="p-4 pb-2 text-center">
            <span className="font-bold text-lg block" style={{ color: safeTextColor }}>
              {headerText}
            </span>
          </div>
        )}

        {/* 会社ロゴと名前 */}
        <div className="px-4 pb-6 pt-4 text-center flex justify-center items-center">
          {logoUrl ? (
            <div className="flex justify-center items-center">
              <div
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Image
                  src={logoUrl}
                  alt={`${tenantName}のロゴ`}
                  width={logoWidth}
                  height={logoHeight}
                  className="object-contain"
                  style={{
                    maxHeight: '120px',
                    maxWidth: '100%',
                    width: 'auto',
                    height: 'auto',
                  }}
                />
              </div>
            </div>
          ) : (
            <div
              className="font-bold text-xl mb-2 px-4 py-2 bg-white/10 rounded-lg"
              style={{ color: safeTextColor }}
            >
              {tenantName}
            </div>
          )}
        </div>
      </div>

      {/* プロフィール情報 */}
      <div className="p-4 bg-white">
        {/* 部署情報 */}
        <div className="text-center mb-2">
          <p className="text-sm text-gray-600">{department}</p>
          {position && <p className="text-sm text-gray-600">{position}</p>}
        </div>

        {/* 名前 */}
        <h3 className="text-xl font-bold text-center break-words" style={{ color: primaryColor }}>
          {userName || '名前未設定'}
        </h3>
        {userNameEn && <p className="text-sm text-gray-500 text-center">{userNameEn}</p>}

        {/* ユーザー画像の表示 */}
        {userImage && (
          <div className="flex justify-center mt-3 mb-3">
            <Image
              src={userImage}
              alt={userName || 'ユーザー'}
              width={80}
              height={80}
              className="rounded-full border-2 border-white shadow-sm object-cover"
            />
          </div>
        )}

        {/* 自己紹介文の表示 */}
        {bio && (
          <div className="mt-3 mb-3 px-2">
            <p className="text-sm text-gray-600 text-center">{bio}</p>
          </div>
        )}

        {/* SNSアイコン */}
        {displaySnsLinks.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2 px-2">
            {displaySnsLinks.map((link) => (
              <div key={link.id} className="flex flex-col items-center">
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center mb-1"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <ImprovedSnsIcon
                    platform={normalizeSnsPlatform(link.platform)}
                    size={28}
                    color={safeSnsIconColor}
                  />
                </div>
                <span className="text-xs text-center truncate w-full">
                  {getPlatformDisplayName(link.platform)}
                </span>
              </div>
            ))}

            {/* さらに表示するSNSがある場合 */}
            {moreSnsCount > 0 && (
              <div className="flex flex-col items-center">
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center mb-1"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <span className="text-lg font-semibold" style={{ color: primaryColor }}>
                    +{moreSnsCount}
                  </span>
                </div>
                <span className="text-xs text-center">もっと見る</span>
              </div>
            )}
          </div>
        )}

        {/* 追加機能アイコン */}
        <div className="mt-5 grid grid-cols-4 gap-2 px-2">
          <div className="flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-1"
              style={{ backgroundColor: secondaryColor }}
            >
              <HiUser className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs">自己紹介</span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-1"
              style={{ backgroundColor: secondaryColor }}
            >
              <HiGlobe className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs">会社HP</span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-1"
              style={{ backgroundColor: secondaryColor }}
            >
              <HiMail className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs">メール</span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-1"
              style={{ backgroundColor: secondaryColor }}
            >
              <HiPhone className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs">電話</span>
          </div>
        </div>

        {/* コンタクトボタン */}
        <div className="mt-5 space-y-3 px-4">
          <button
            className="w-full py-2.5 rounded-md font-medium flex items-center justify-center text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <HiPhone className="mr-2 h-5 w-5" />
            電話をかける
          </button>
        </div>

        {/* 連絡先追加ボタン */}
        <div className="mt-3 px-4">
          <button
            className="w-full py-2.5 rounded-md font-medium flex items-center justify-center bg-white"
            style={{
              color: secondaryColor,
              borderWidth: '1px',
              borderColor: secondaryColor,
            }}
          >
            <HiPlus className="mr-2 h-5 w-5" />
            連絡先に追加
          </button>
        </div>

        {/* フッター */}
        <div className="mt-6 pt-2 text-center">
          <p className="text-xs text-gray-400 mt-2">Powered by Share</p>
        </div>
      </div>
    </div>
  );
}