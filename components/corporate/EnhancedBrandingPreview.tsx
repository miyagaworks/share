// components/corporate/EnhancedBrandingPreview.tsx
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

interface EnhancedBrandingPreviewProps {
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

export function EnhancedBrandingPreview({
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
  department,
  position,
}: EnhancedBrandingPreviewProps) {
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

  // サンプルSNSアイコン（実際のデータがない場合用）
  const dummySnsLinks = [
    { platform: 'line', name: 'LINE' },
    { platform: 'youtube', name: 'YouTube' },
    { platform: 'x', name: 'X' },
    { platform: 'instagram', name: 'Instagram' },
  ];

  // 表示するSNSリンク
  const displaySnsLinks =
    corporateSnsLinks.length > 0 || personalSnsLinks.length > 0
      ? [...corporateSnsLinks, ...personalSnsLinks]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .slice(0, 4)
      : dummySnsLinks.map((link, index) => ({
          id: index.toString(),
          platform: link.platform,
          username: null,
          url: '#',
          displayOrder: index,
        }));

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm max-w-xs mx-auto">
      {/* ヘッダー部分 */}
      <div
        className="h-12 w-full relative overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: primaryColor }}
      >
        <p className="text-sm px-2 text-center" style={{ color: safeTextColor }}>
          {headerText || 'シンプルにつながる、スマートにシェア。'}
        </p>
      </div>

      <div className="p-5">
        {/* 法人ロゴと名前 */}
        {logoUrl && (
          <div className="flex justify-center mt-2 mb-4">
            <div
              style={{
                maxWidth: `${logoWidth}px`,
                maxHeight: `${logoHeight}px`,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Image
                src={logoUrl}
                alt={`${tenantName}のロゴ`}
                width={logoWidth}
                height={logoHeight}
                className="object-contain max-h-16"
                style={{
                  width: 'auto',
                  height: 'auto',
                }}
              />
            </div>
          </div>
        )}

        {/* テナント名 */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium" style={{ color: primaryColor }}>
            {tenantName}
          </h3>
        </div>

        {/* ユーザー名 */}
        <div className="text-center mt-2 mb-3">
          <h3 className="text-xl font-bold">{userName}</h3>
          {userNameEn && <p className="text-sm text-gray-500">{userNameEn}</p>}
        </div>

        {/* ユーザー画像 */}
        {userImage && (
          <div className="flex justify-center mt-2 mb-3">
            <Image
              src={userImage}
              alt={userName}
              width={80}
              height={80}
              className="rounded-full border-2 border-white shadow-sm object-cover"
            />
          </div>
        )}

        {/* 自己紹介文 */}
        {bio && (
          <div className="mt-2 mb-3 px-2">
            <p className="text-sm text-gray-600 text-center">{bio}</p>
          </div>
        )}

        {/* SNSリンク */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {displaySnsLinks.map((link) => (
            <div key={link.id} className="flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-sm mb-1 transition-transform hover:shadow-md">
                <ImprovedSnsIcon
                  platform={normalizeSnsPlatform(link.platform)}
                  size={30}
                  color={safeSnsIconColor}
                />
              </div>
              <span className="text-xs">{getPlatformDisplayName(link.platform)}</span>
            </div>
          ))}
        </div>

        {/* アクションボタン（プロフィール情報、会社HP、メール、電話） */}
        <div className="mt-6 grid grid-cols-4 gap-3">
          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
              style={{ backgroundColor: '#1f2937' }}
            >
              <HiUser className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs">自己紹介</span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
              style={{ backgroundColor: '#1f2937' }}
            >
              <HiGlobe className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs">会社HP</span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
              style={{ backgroundColor: '#1f2937' }}
            >
              <HiMail className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs">メール</span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
              style={{ backgroundColor: '#1f2937' }}
            >
              <HiPhone className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs">電話</span>
          </div>
        </div>

        {/* 主要アクションボタン */}
        <div className="mt-5 space-y-3">
          <button
            className="w-full py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center"
            style={{ backgroundColor: primaryColor, color: safeTextColor }}
          >
            <HiPhone className="mr-2 h-5 w-5" />
            電話をかける
          </button>

          <button
            className="w-full py-2 rounded-md text-sm font-medium border transition-all flex items-center justify-center"
            style={{ borderColor: secondaryColor, color: secondaryColor }}
          >
            <HiPlus className="mr-2 h-5 w-5" />
            連絡先に追加
          </button>
        </div>

        {/* フッター */}
        <div className="mt-6 pt-2 text-center">
          <a href="#" className="text-xs text-blue-600">
            このサービスを使ってみる
          </a>
          <p className="text-xs text-gray-400 mt-2">Powered by Share</p>
        </div>
      </div>
    </div>
  );
}