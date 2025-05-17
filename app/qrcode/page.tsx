// app/qrcode/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { QrCodeGenerator } from '@/components/qrcode/QrCodeGenerator';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export default function QrCodePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isCorporateMember, setIsCorporateMember] = useState(false);
  const [corporateData, setCorporateData] = useState<{
    primaryColor: string | null;
    logoUrl: string | null;
    textColor: string | null;
    headerText: string | null;
  } | null>(null);
  const [profileUrl, setProfileUrl] = useState<string>('');
  const [userName, setUserName] = useState<string | null>(null);
  const [nameEn, setNameEn] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [headerText, setHeaderText] = useState<string | null>(null);
  // PWAインストールプロンプト用の状態
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // 法人アクセス権チェック
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // API経由で企業メンバーかどうかを確認
        const response = await fetch('/api/corporate/access');
        if (response.ok) {
          const data = await response.json();
          setIsCorporateMember(data.hasAccess === true);
        }
      } catch (err) {
        console.error('法人アクセス権チェックエラー:', err);
      }
    };

    if (session) {
      checkAccess();
    }
  }, [session]);

  // 法人データの取得
  const fetchCorporateData = useCallback(async () => {
    if (!isCorporateMember) return;

    try {
      const response = await fetch('/api/corporate-member/profile');
      if (response.ok) {
        const data = await response.json();

        // 法人テナントデータを設定
        if (data.tenant) {
          setCorporateData({
            primaryColor: data.tenant.primaryColor || '#1E3A8A',
            logoUrl: data.tenant.logoUrl,
            textColor: data.tenant.textColor || '#FFFFFF',
            headerText: data.tenant.headerText || 'シンプルにつながる、スマートにシェア。',
          });
        }

        // ユーザー情報を設定
        if (data.user) {
          if (data.user.name) setUserName(data.user.name);
          if (data.user.nameEn) setNameEn(data.user.nameEn);
          if (data.user.image) setProfileImage(data.user.image);

          // プロフィールがあれば設定
          if (data.user.profile?.slug) {
            const url = `${window.location.origin}/${data.user.profile.slug}`;
            setProfileUrl(url);
          }
        }
      }
    } catch (err) {
      console.error('法人データ取得エラー:', err);
    }
  }, [isCorporateMember]);

  // 一般プロフィールの確認
  const checkProfileExists = useCallback(async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();

        if (data.user) {
          // 既存の処理...
          if (data.user.name) setUserName(data.user.name);
          if (data.user.nameEn) setNameEn(data.user.nameEn);
          if (data.user.image) setProfileImage(data.user.image);

          // ヘッダーテキストを設定（追加）
          if (data.user.headerText) {
            setHeaderText(data.user.headerText);
          }

          // その他の情報があれば設定（オプショナル）
          if (data.user.nameEn) setNameEn(data.user.nameEn);
          if (data.user.image) setProfileImage(data.user.image);

          // プロフィールURLがあれば設定
          if (data.user.profile?.slug) {
            const url = `${window.location.origin}/${data.user.profile.slug}`;
            setProfileUrl(url);
          } else {
            // スラグがない場合はデフォルトのURLを設定
            setProfileUrl(`${window.location.origin}/user/${data.user.id}`);
          }

          // headerTextの設定部分も修正が必要
          if (data.user.headerText) {
            // setCorporateDataを含むロジックを修正
            // setCorporateData関数自体を依存配列に入れるべき
            setCorporateData((prevState) => ({
              ...(prevState || {
                primaryColor: '#3B82F6',
                logoUrl: null,
                textColor: '#FFFFFF',
                headerText: 'シンプルにつながる、スマートにシェア。',
              }),
              headerText: data.user.headerText,
            }));
          }
        } else {
          // ユーザー名がない場合のみリダイレクト
          toast.error('ユーザー名が設定されていません。プロフィール設定を完了してください。');
          router.push(
            isCorporateMember ? '/dashboard/corporate-member/profile' : '/dashboard/profile',
          );
          return;
        }
      } else {
        // APIエラー処理
        toast.error('プロフィール情報の取得に失敗しました');
      }
    } catch (error) {
      console.error('Profile check error:', error);
      toast.error('エラーが発生しました。再度お試しください。');
    } finally {
      setIsLoading(false);
    }
    // 修正: corporateDataを依存配列から削除し、setCorporateDataを追加
  }, [router, isCorporateMember, setCorporateData]);

  // 適切な戻り先URLを取得
  const getBackToShareUrl = () => {
    // 法人メンバーの場合は法人メンバー共有設定ページへ
    if (isCorporateMember) {
      return '/dashboard/corporate-member/share';
    }
    // 通常ユーザーの場合は個人共有設定ページへ
    return '/dashboard/share';
  };

  // 初期データ読み込み
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    // 法人メンバーかどうかで処理を分岐
    if (isCorporateMember) {
      fetchCorporateData().then(() => {
        // 法人データ取得後にプロフィール確認
        checkProfileExists();
      });
    } else {
      // 一般ユーザーの場合はプロフィール確認のみ
      checkProfileExists();
    }

    // Service Worker の登録 (PWA対応)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('ServiceWorker registration successful:', registration.scope);
          })
          .catch((error) => {
            console.log('ServiceWorker registration failed:', error);
          });
      });
    }
  }, [session, status, router, isCorporateMember, fetchCorporateData, checkProfileExists]);

  // PWAとして実行されているかチェックし、必要に応じてページを更新
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // サービスワーカーからのメッセージを受け取る
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PWA_INSTALLED') {
          // PWAとしてインストールされたことをローカルストレージに記録
          localStorage.setItem('pwaInstalled', 'true');
          localStorage.setItem('pwaStartUrl', '/qrcode');
        }
      });
    }

    // ホーム画面から起動された場合、常に/qrcodeにリダイレクト
    const isPwa = localStorage.getItem('pwaInstalled') === 'true';
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isPwa && isStandalone && window.location.pathname !== '/qrcode') {
      window.location.href = '/qrcode';
    }
  }, []);

  // ホーム画面追加の効果をより強調
  const handleInstallClick = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('installPromptShown', 'true');

    // PWAインストール後の通知
    toast.success('ホーム画面に追加すると、常にQRコードページが表示されます', {
      duration: 5000,
      icon: '📱',
    });
  };

  // iOSホーム画面追加プロンプト表示の useEffect (追加)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // iOSデバイス判定
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream: unknown }).MSStream === undefined;
    // 既にスタンドアロンモードで実行されているかチェック
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // インストールバナーを表示するかの判定
    if (isIOS && !isStandalone && !localStorage.getItem('installPromptShown')) {
      // 数秒後に表示
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`container mx-auto py-8 px-4 ${isCorporateMember ? 'corporate-theme' : ''}`}>
      <div className="mb-6">
        <Link
          href={getBackToShareUrl()}
          className="flex items-center text-blue-600 hover:text-blue-800"
          style={{
            color: isCorporateMember ? corporateData?.primaryColor || '#1E3A8A' : undefined,
          }}
        >
          <FaArrowLeft className="mr-2" />
          共有設定に戻る
        </Link>
      </div>

      {/* PWA インストールプロンプト */}
      {showInstallPrompt && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-bold text-blue-800 mb-2 flex items-center">
            <span className="mr-2 text-xl">📱</span>
            QRコードをホーム画面に追加しましょう！
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            このページをホーム画面に追加すると、いつでもワンタップで
            <strong>このQRコードを表示</strong>できます。
          </p>
          <div className="bg-white p-3 rounded mb-3 border border-blue-100">
            <ol className="text-sm text-blue-600 list-decimal pl-5 mb-0">
              <li className="mb-1">
                画面下部の<strong>「共有」ボタン</strong>（□に↑のアイコン）をタップ
              </li>
              <li className="mb-1">
                <strong>「ホーム画面に追加」</strong>を選択
              </li>
              <li className="mb-1">
                名前はそのままで<strong>「追加」</strong>をタップ
              </li>
              <li>
                <strong>ホーム画面のアイコンから開く</strong>と、常にQRコードページが表示されます
              </li>
            </ol>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleInstallClick}
              className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium"
            >
              理解しました
            </button>
          </div>
        </div>
      )}

      <QrCodeGenerator
        corporateBranding={
          isCorporateMember
            ? {
                primaryColor: corporateData?.primaryColor || '#1E3A8A',
                textColor: corporateData?.textColor || '#FFFFFF',
                headerText: corporateData?.headerText || 'シンプルにつながる、スマートにシェア。',
              }
            : undefined
        }
        userProfile={{
          profileUrl,
          userName: userName || '',
          nameEn: nameEn || '',
          profileImage: profileImage || undefined,
          headerText: headerText || 'シンプルにつながる、スマートにシェア。', // ここでheaderTextを使用
        }}
      />
    </div>
  );
}