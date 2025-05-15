// components/qrcode/QrCodePreview.tsx
'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

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
}

export function QrCodePreview({
  profileUrl,
  userName,
  nameEn,
  primaryColor,
  headerText,
  textColor,
}: QrCodePreviewProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrSize = 200;

  // デフォルト値の設定
  const mainColor = primaryColor || '#3b82f6';
  const textCol = textColor || '#FFFFFF';
  const header = headerText || 'シンプルにつながる、スマートにシェア。';

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-xs bg-[#ebeeef] rounded-lg overflow-hidden">
        {/* ヘッダーテキスト */}
        <div
          style={{
            backgroundColor: mainColor,
            borderRadius: '20px',
            padding: '10px 20px',
            margin: '20px auto',
            maxWidth: '90%',
            textAlign: 'center',
          }}
        >
          <p style={{ color: textCol, margin: 0 }}>{header}</p>
        </div>

        {/* プロフィール部分 */}
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 bg-gray-600 rounded-full overflow-hidden mb-3 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* ユーザー名 */}
          <h2 className="text-xl font-bold mb-1">{userName || '宗光 徹'}</h2>
          {nameEn && <p className="text-sm text-gray-600 mb-4">{nameEn}</p>}
        </div>

        {/* QRコード */}
        <div className="flex justify-center px-4 py-2">
          <div className="bg-white p-4 rounded-lg" ref={qrRef}>
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

        {/* 反転ボタン */}
        <div className="p-5">
          <div
            className="w-full py-2 text-white rounded-md flex items-center justify-center"
            style={{ backgroundColor: mainColor }}
          >
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
        </div>

        {/* フッター */}
        <div className="text-center text-xs text-gray-500 pb-5 border-t border-gray-200 mt-4 pt-4">
          Powered by Share
        </div>
      </div>
    </div>
  );
}