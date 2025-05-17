// components/qrcode/QrCodePreview.tsx
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';

interface QrCodePreviewProps {
  profileUrl: string;
  userName: string;
  nameEn?: string | null;
  templateId?: string; // オプショナルに
  primaryColor: string;
  secondaryColor?: string; // オプショナルに
  accentColor?: string; // オプショナルに
  headerText?: string | null;
  textColor?: string;
  profileImage?: string;
}

export function QrCodePreview({
  profileUrl,
  userName,
  nameEn = '',
  // templateId = 'simple', // 使わない場合はコメントアウト
  primaryColor,
  // secondaryColor, // 使わない場合はコメントアウト
  // accentColor, // 使わない場合はコメントアウト
  headerText = 'シンプルにつながる、スマートにシェア。',
  textColor = '#FFFFFF', // nullではなく文字列のデフォルト値を設定
  profileImage,
}: QrCodePreviewProps) {
  // プレビューのサイズ設定
  const containerStyle = {
    width: '100%',
    maxWidth: '320px',
    margin: '0 auto',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#ebeeef',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  // ヘッダースタイル
  const headerStyle = {
    backgroundColor: primaryColor,
    color: textColor || '#FFFFFF', // null の場合は #FFFFFF を使用
    width: 'calc(100% - 40px)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderBottomLeftRadius: '15px',
    borderBottomRightRadius: '15px',
    margin: '0 auto',
    padding: '0.75rem 1rem',
  };

  // ヘッダーテキストスタイル
  const headerTextStyle = {
    color: textColor,
    textAlign: 'center' as const,
    fontWeight: '500' as const,
    whiteSpace: 'pre-wrap' as const,
    margin: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={{ minHeight: '480px' }}>
        {/* ヘッダーテキスト */}
        <div style={headerStyle}>
          <p style={headerTextStyle}>{headerText || 'シンプルにつながる、スマートにシェア。'}</p>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* プロフィール部分 */}
          <div className="text-center mt-4 mb-6">
            <div
              className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 flex items-center justify-center"
              style={{
                backgroundColor: profileImage ? 'transparent' : '#5e6372',
                border: profileImage ? '1px solid #e5e7eb' : 'none',
              }}
            >
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={userName || ''}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="36"
                  height="36"
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
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{userName || 'ユーザー名'}</h1>
            {/* 英語名 */}
            {nameEn && <p style={{ color: '#4B5563', fontSize: '1rem' }}>{nameEn}</p>}
          </div>

          {/* QRコード */}
          <div className="flex justify-center my-6">
            <div
              className="bg-white p-6 rounded-lg"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <QRCodeSVG
                value={profileUrl || 'https://example.com'}
                size={140}
                level="M"
                bgColor={'#FFFFFF'}
                fgColor={'#000000'}
                includeMargin={false}
              />
            </div>
          </div>

          {/* 反転ボタン */}
          <div className="mt-8">
            <button
              className="w-full py-3 rounded-md flex items-center justify-center"
              style={{
                backgroundColor: primaryColor,
                color: textColor || '#FFFFFF', // null の場合は #FFFFFF を使用
              }}
            >
              <div className="flex items-center text-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                反 転
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}