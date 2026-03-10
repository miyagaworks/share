// app/qr/[slug]/QrCodeClient.tsx (新規作成)
'use client';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';
import { DEFAULT_PRIMARY_COLOR } from '@/lib/brand/defaults';

// 🔥 修正: Prismaスキーマに合わせた型定義
interface QrCodePageData {
  id: string;
  slug: string;
  userId: string;
  userName: string;
  profileUrl: string;
  template: string;
  primaryColor: string;
  secondaryColor: string | null;
  accentColor: string | null;
  textColor: string | null;
  views: number;
  lastAccessed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UserData {
  id: string;
  name: string | null;
  nameEn: string | null;
  image: string | null;
  headerText: string | null;
}

interface QrCodeClientProps {
  qrData: QrCodePageData;
  userData: UserData;
}

export function QrCodeClient({ qrData, userData }: QrCodeClientProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // 🔥 修正: null値を適切にハンドリング
  const userProfileImage = userData.image;
  const headerText = userData.headerText || 'シンプルにつながる、スマートにシェア。';
  const textColor = qrData.textColor || '#FFFFFF';
  const nameEn = userData.nameEn || 'Taro Yamada';
  const mainColor = qrData.primaryColor || DEFAULT_PRIMARY_COLOR;
  const secondaryColor = qrData.secondaryColor || '#333333';
  const accentColor = qrData.accentColor || '#FFFFFF';

  // 画面の向きが変わったときにFlipの状態をリセット
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsFlipped(false);
    };
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // 反転ボタンのクリックハンドラ
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const containerStyle = {
    transform: isFlipped ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.5s ease-in-out',
  };

  const buttonContentStyle = {
    transform: isFlipped ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.5s ease-in-out',
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center" style={containerStyle}>
      <div className="w-full max-w-md" style={{ backgroundColor: '#ebeeef' }}>
        <div style={{ minHeight: '100vh' }}>
          {/* ヘッダーテキスト */}
          <div
            style={{
              backgroundColor: mainColor,
              width: 'calc(100% - 40px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottomLeftRadius: '15px',
              borderBottomRightRadius: '15px',
              margin: '0 auto',
              padding: '0.75rem 1rem',
            }}
          >
            <p
              style={{
                color: textColor,
                textAlign: 'center',
                fontWeight: '500',
                whiteSpace: 'pre-wrap',
                margin: 0,
              }}
            >
              {headerText}
            </p>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* プロフィール部分 */}
            <div className="text-center mt-4 mb-6">
              <div
                className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: userProfileImage ? 'transparent' : '#5e6372' }}
              >
                {userProfileImage ? (
                  <Image
                    src={userProfileImage}
                    alt={qrData.userName || ''}
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
              <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{qrData.userName}</h1>
              {/* 英語名 */}
              <p style={{ color: '#4B5563', fontSize: '1rem' }}>{nameEn}</p>
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
                  value={qrData.profileUrl}
                  size={200}
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
                onClick={handleFlip}
                className="w-full py-3 rounded-md flex items-center justify-center"
                style={{
                  backgroundColor: mainColor,
                  color: textColor,
                }}
              >
                <div style={buttonContentStyle} className="flex items-center text-xl">
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
    </div>
  );
}