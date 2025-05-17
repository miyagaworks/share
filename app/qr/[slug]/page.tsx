// app/qr/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { QRCodeSVG } from 'qrcode.react';
import { useParams } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import Image from 'next/image';

// QRCodePageインターフェースを実際のモデルに合わせて修正
interface QrCodePage {
  id: string;
  slug: string;
  userId: string;
  userName: string;
  profileUrl: string;
  template: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor?: string; // QRCodePageモデルに存在する場合
  views: number;
  lastAccessed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function QrCodeViewPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [qrData, setQrData] = useState<QrCodePage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const [headerText, setHeaderText] = useState<string>('シンプルにつながる、スマートにシェア。');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [nameEn, setNameEn] = useState<string>('Taro Yamada'); // 英語名の状態変数

  useEffect(() => {
    const fetchQrCodeData = async () => {
      try {
        console.log(`Fetching QR code data for slug: ${slug}`);

        // QRコード情報を取得
        const response = await fetch(`/api/qrcode/${slug}`);
        if (!response.ok) {
          throw new Error(`QRコードの取得に失敗しました: ${response.status}`);
        }

        const data = await response.json();
        console.log('QR code data received:', data.qrCode);

        setQrData(data.qrCode);

        // textColorはQRCodePageから取得
        if (data.qrCode && data.qrCode.textColor) {
          console.log(`Setting text color from QR data: ${data.qrCode.textColor}`);
          setTextColor(data.qrCode.textColor);
        } else {
          console.log('No text color in QR data, using default #FFFFFF');
          setTextColor('#FFFFFF');
        }

        // QRコードの所有者のプロフィール情報を取得
        if (data.qrCode && data.qrCode.userId) {
          try {
            console.log(`Fetching user profile for userId: ${data.qrCode.userId}`);

            const userResponse = await fetch(`/api/user/${data.qrCode.userId}/profile`);
            if (!userResponse.ok) {
              throw new Error(`ユーザープロフィール取得エラー: ${userResponse.status}`);
            }

            const userData = await userResponse.json();
            console.log('User data received:', userData.user);

            // ユーザー情報を設定
            if (userData.user) {
              // プロフィール画像
              if (userData.user.image) {
                setUserProfileImage(userData.user.image);
              }

              // 英語名
              if (userData.user.nameEn) {
                setNameEn(userData.user.nameEn);
                console.log(`Name En set from user data: ${userData.user.nameEn}`);
              }

              // ヘッダーテキストはユーザーモデルから取得
              if (userData.user.headerText) {
                setHeaderText(userData.user.headerText);
                console.log(`Header text set from user data: ${userData.user.headerText}`);
              }
            }
          } catch (userError) {
            console.error('ユーザー情報取得エラー:', userError);
          }
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchQrCodeData();
    } else {
      setError('QRコードが見つかりません');
      setIsLoading(false);
    }
  }, [slug]);

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !qrData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">エラー</h1>
          <p className="text-gray-700">{error || 'QRコードが見つかりません'}</p>
        </div>
      </div>
    );
  }

  // メインカラーとテキストカラーを設定
  const mainColor = qrData.primaryColor || '#3b82f6';

  // ログ出力
  console.log('==== QR CODE PAGE RENDER DATA ====');
  console.log('Main color:', mainColor);
  console.log('Text color state:', textColor);
  console.log('Text color from QR data:', qrData.textColor);
  console.log('Header text state:', headerText);
  console.log('Name En state:', nameEn);
  console.log('=================================');

  const containerStyle = {
    transform: isFlipped ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.5s ease-in-out',
  };

  const buttonContentStyle = {
    transform: isFlipped ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.5s ease-in-out',
  };

  return (
    <>
      <Head>
        <title>Share QR</title>
        <meta name="apple-mobile-web-app-title" content="Share QR" />
      </Head>
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
                  color: textColor, // 明示的に状態変数を使用
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
                {/* 英語名 - 状態変数から取得 */}
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

              {/* 反転ボタン - テキストカラーを適用 */}
              <div className="mt-8">
                <button
                  onClick={handleFlip}
                  className="w-full py-3 rounded-md flex items-center justify-center"
                  style={{
                    backgroundColor: mainColor,
                    color: textColor, // 明示的に状態変数を使用
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

        {/* 開発環境用のデバッグ情報表示 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-0 left-0 bg-black bg-opacity-75 text-white p-2 text-xs max-w-xs overflow-auto max-h-40">
            <div>Main color: {mainColor}</div>
            <div>Text color: {textColor}</div>
            <div>Header text: {headerText}</div>
            <div>Name En: {nameEn}</div>
          </div>
        )}
      </div>
    </>
  );
}