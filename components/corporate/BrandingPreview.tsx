// components/corporate/BrandingPreview.tsx
import React, { useState } from 'react';
import Image from 'next/image';
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

interface BrandingPreviewProps {
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
  bioBackgroundColor?: string | null; // 追加: 自己紹介ページの背景色
  bioTextColor?: string | null; // 追加: 自己紹介ページのテキスト色
  corporateSnsLinks?: CorporateSnsLink[];
  personalSnsLinks?: SnsLink[];
  department?: string | null;
  position?: string | null;
  highlightSns?: boolean; // SNSアイコンのハイライト表示
  highlightBio?: boolean; // 自己紹介のハイライト表示
}

export function BrandingPreview({
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
  bioBackgroundColor = '#FFFFFF',
  bioTextColor = '#333333',
  corporateSnsLinks = [],
  personalSnsLinks = [],
  department = '', // デフォルト値を'営業部'から空に変更
  position,
  highlightSns = false,
  highlightBio = false,
}: BrandingPreviewProps) {
  // 状態管理
  const [showBioModal, setShowBioModal] = useState(false);

  // 安全な値を設定
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

  // デモ用SNSリンク
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
    <div
      className="border border-gray-200 rounded-lg overflow-hidden shadow-sm max-w-xs mx-auto"
      style={{ backgroundColor: '#e8eaee' }}
    >
      {/* ヘッダー部分 */}
      <div
        className="w-full relative overflow-hidden flex items-center justify-center py-3"
        style={{ backgroundColor: primaryColor }}
      >
        <div
          className="text-sm px-4 text-center whitespace-pre-wrap"
          style={{ color: safeTextColor }}
        >
          {headerText || 'シンプルにつながる、スマートにシェア。'}
        </div>
      </div>
      <div className="p-5">
        {/* 法人ロゴと名前 */}
        {logoUrl && (
          <div className="flex justify-center mt-2 mb-4">
            <div
              style={{
                width: `${logoWidth}px`,
                height: `${logoHeight}px`,
                maxWidth: '100%',
                maxHeight: '80px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
              }}
            >
              <Image
                src={logoUrl}
                alt={`${tenantName}のロゴ`}
                width={logoWidth}
                height={logoHeight}
                className="object-contain"
                style={{
                  width: logoWidth ? `${logoWidth}px` : 'auto', // 実際のサイズを指定
                  height: logoHeight ? `${logoHeight}px` : 'auto', // 実際のサイズを指定
                  maxWidth: '100%',
                  maxHeight: '80px', // コンテナの高さに合わせて調整
                }}
                priority
              />
            </div>
          </div>
        )}

        {/* テナント名 - 改行防止のために whitespace-nowrap を追加 */}
        <div className="text-center mb-4 px-2">
          <h3 className="text-base font-medium max-w-full whitespace-nowrap">{tenantName}</h3>
        </div>

        {/* 部署情報 */}
        <div className="text-center mb-2">
          <p className="text-sm text-gray-600">{department}</p>
          {position && <p className="text-sm text-gray-600">{position}</p>}
        </div>

        {/* ユーザー名 */}
        <div className="text-center mt-2 mb-3">
          <h3 className="text-xl font-bold text-gray-900">{userName}</h3>
          {userNameEn && <p className="text-sm text-gray-500">{userNameEn}</p>}
        </div>

        {/* SNSリンク */}
        <div className="mt-4 grid grid-cols-4 gap-3 relative">
          {/* SNSアイコン全体を囲むハイライト枠 */}
          {highlightSns && (
            <div
              className="absolute inset-0 border-2 border-red-500 rounded-lg animate-pulse"
              style={{ top: '-8px', left: '-8px', right: '-8px', bottom: '-8px', zIndex: 5 }}
            ></div>
          )}

          {/* 個別のSNSアイコン（ハイライト枠は削除） */}
          {displaySnsLinks.map((link, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-sm mb-1 transition-transform hover:shadow-md">
                <ImprovedSnsIcon
                  platform={normalizeSnsPlatform(link.platform)}
                  size={30}
                  color={safeSnsIconColor}
                />
              </div>
              <span className="text-xs text-center w-full">
                {getPlatformDisplayName(link.platform)}
              </span>
            </div>
          ))}
        </div>

        {/* アクションボタン部分 */}
        <div className="mt-6 grid grid-cols-4 gap-3">
          {/* 自己紹介ボタンにハイライト表示を追加 */}
          <div className="flex flex-col items-center relative">
            {highlightBio && (
              <div
                className="absolute border-2 border-red-500 rounded-xl animate-pulse pointer-events-none"
                style={{
                  top: '-8px',
                  left: '-8px',
                  right: '-8px',
                  bottom: '-8px',
                  zIndex: 5,
                }}
              ></div>
            )}
            <button
              onClick={() => setShowBioModal(true)}
              className="w-12 h-12 rounded-full flex items-center justify-center mb-1 cursor-pointer z-10"
              style={{ backgroundColor: secondaryColor }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
            <span className="text-xs">自己紹介</span>
          </div>

          {/* 会社HPボタン */}
          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
              style={{ backgroundColor: secondaryColor }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <span className="text-xs">会社HP</span>
          </div>

          {/* メールボタン */}
          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
              style={{ backgroundColor: secondaryColor }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <span className="text-xs">メール</span>
          </div>

          {/* 電話ボタン */}
          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-1"
              style={{ backgroundColor: secondaryColor }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            電話をかける
          </button>

          <button
            className="w-full py-2 rounded-md text-sm font-medium border transition-all flex items-center justify-center bg-white"
            style={{ borderColor: secondaryColor, color: secondaryColor }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            連絡先に追加
          </button>
        </div>

        {/* フッター - サービスリンクの色を修正 */}
        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-[#2563EB]">
            このサービスを使ってみる
          </a>
          <div className="mt-2 pt-2 border-t border-gray-300">
            <p className="text-xs text-gray-500">Powered by Share</p>
          </div>
        </div>
      </div>
      {/* 自己紹介モーダル */}
      {showBioModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0">
            <div className="max-w-[100%] w-full h-full mx-auto flex items-center justify-center">
              <div
                className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden relative"
                style={{ maxWidth: '360px' }}
              >
                {/* モーダルを閉じるボタン */}
                <button
                  className="absolute top-4 right-4 z-10 text-gray-500"
                  onClick={() => setShowBioModal(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                {/* ユーザー情報部分 */}
                <div className="flex flex-col items-center py-8">
                  {/* プロフィール画像 */}
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-600 mb-4 flex items-center justify-center">
                    {userImage ? (
                      <Image
                        src={userImage}
                        alt={userName}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </div>

                  {/* ユーザー名 */}
                  <h2 className="text-2xl font-bold text-center mb-1">{userName}</h2>
                  {userNameEn && <p className="text-sm text-gray-500 mb-4">{userNameEn}</p>}

                  {/* 自己紹介文 */}
                  <div className="px-8 w-full">
                    <p className="text-base text-justify whitespace-pre-wrap">
                      {bio ||
                        '自己紹介文がここに入ります。'}
                    </p>
                  </div>
                </div>

                {/* 区切り線 */}
                <div className="border-t border-gray-200 w-full"></div>

                {/* 会社情報と連絡先 */}
                <div
                  className="p-6 text-base"
                  style={{
                    color: bioTextColor || '#333333',
                    backgroundColor: bioBackgroundColor || '#FFFFFF',
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold">会社 / 組織：</p>
                      <p>{tenantName}</p>
                    </div>

                    <div>
                      <p className="font-semibold">部署：</p>
                      <p>{department}</p>
                    </div>

                    {position && (
                      <div>
                        <p className="font-semibold">役職：</p>
                        <p>{position}</p>
                      </div>
                    )}

                    <div>
                      <p className="font-semibold">TEL：</p>
                      <p>09016868728</p>
                    </div>

                    <div>
                      <p className="font-semibold">メール：</p>
                      <p>moe@yamaguchi.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}