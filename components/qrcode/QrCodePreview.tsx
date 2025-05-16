// components/qrcode/QrCodePreview.tsx
'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';

interface QrCodePreviewProps {
  profileUrl: string;
  userName: string;
  nameEn?: string;
  templateId: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerText?: string;
  textColor?: string;
  profileImage?: string;
}

export function QrCodePreview({
  profileUrl,
  userName,
  nameEn,
  primaryColor,
  headerText,
  textColor,
  profileImage, // プロフィール画像を引数に追加
}: QrCodePreviewProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrSize = 180; // 小さくしたQRコードサイズ

  // デフォルト値の設定
  const mainColor = primaryColor || '#3b82f6';
  const textCol = textColor || '#FFFFFF';
  const header = headerText || 'シンプルにつながる、スマートにシェア。';

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-xs bg-[#ebeeef]">
        {/* ヘッダーテキスト - 上部にくっついて下側だけ角丸 */}
        <div
          style={{
            backgroundColor: mainColor,
            width: 'calc(100% - 40px)', // 左右に20pxずつの余白
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomLeftRadius: '15px',
            borderBottomRightRadius: '15px',
            margin: '0 auto', // 中央寄せ
            padding: '0.75rem 1rem', // paddingで調整
          }}
        >
          <p
            style={{
              color: textCol,
              textAlign: 'center',
              fontWeight: '500',
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}
          >
            {header}
          </p>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* プロフィール部分 - 条件付きで画像を表示 */}
          <div className="text-center mt-4 mb-6">
            <div
              className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 flex items-center justify-center"
              style={{ backgroundColor: profileImage ? 'transparent' : '#5e6372' }}
            >
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={userName || ''}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
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

            {/* ユーザー名 - フォントサイズ調整 */}
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{userName || '宗光 徹'}</h1>
            {/* 英語名 - 常に表示する */}
            <p style={{ color: '#4B5563', fontSize: '1rem' }}>{nameEn || 'Toru Munemitsu'}</p>
          </div>

          {/* QRコード - サイズを小さく */}
          <div className="flex justify-center my-6">
            <div
              className="bg-white p-4 rounded-lg"
              style={{
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
              ref={qrRef}
            >
              <QRCodeSVG
                value={profileUrl || 'https://example.com'}
                size={qrSize}
                level="M"
                bgColor={'#FFFFFF'}
                fgColor={'#000000'}
                includeMargin={false}
              />
            </div>
          </div>

          {/* 以下は変更なし */}
          {/* 反転ボタン */}
          <div className="mt-8">
            <button
              className="w-full py-3 rounded-md flex items-center justify-center"
              style={{
                backgroundColor: mainColor,
                color: textCol, // ここでテキストカラーを適用
              }}
            >
              <div className="flex items-center text-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor" // currentColorはボタンのcolorプロパティを継承
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

          {/* フッター - フォントサイズ調整 */}
          <div className="mt-8 text-center border-t border-gray-300 pt-4">
            <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Powered by Share</p>
          </div>
        </div>
      </div>
    </div>
  );
}