// app/qrcode/page.tsx - 修正版
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image'; // 追加
import { Spinner } from '@/components/ui/Spinner';
import { QrCodeGenerator } from '@/components/qrcode/QrCodeGenerator';
import { DEFAULT_PRIMARY_COLOR, DEFAULT_TAGLINE } from '@/lib/brand/defaults';
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

  // デバイス判定用の状態を追加
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  // デバイス判定のuseEffectを追加
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // デバイス判定
    const userAgent = navigator.userAgent;
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(userAgent) &&
      !(window as unknown as { MSStream: unknown }).MSStream === undefined;
    const isAndroidDevice = /Android/.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
  }, []);

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
      } catch {
        // 法人アクセス権チェックエラーは無視（非重要）
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
            headerText: data.tenant.headerText || DEFAULT_TAGLINE,
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
    } catch {
      // 法人データ取得エラーは無視（非重要）
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
                primaryColor: DEFAULT_PRIMARY_COLOR,
                logoUrl: null,
                textColor: '#FFFFFF',
                headerText: DEFAULT_TAGLINE,
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
    } catch {
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
        // マニフェストのパスを確認
        const link = document.querySelector('link[rel="manifest"]');
        if (!link) {
          // マニフェストリンクがない場合は追加
          const manifestLink = document.createElement('link');
          manifestLink.rel = 'manifest';
          manifestLink.href = '/manifest.webmanifest'; // Next.js app/manifest.ts が生成するパス
          document.head.appendChild(manifestLink);
        }
        navigator.serviceWorker
          .register('/sw.js')
          .then(() => {
            // Service Worker登録成功
          })
          .catch(() => {
            // Service Worker登録失敗（サイレント失敗）
          });
      });
    }
  }, [session, status, router, isCorporateMember, fetchCorporateData, checkProfileExists]);

  // ユーザー固有のQRコードパスを記憶
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 現在のURLパスが /qr/ から始まるかチェック
    const pathMatch = window.location.pathname.match(/\/qr\/([a-zA-Z0-9-]+)/);
    if (pathMatch) {
      const userQrPath = '/qr/' + pathMatch[1];
      localStorage.setItem('userQrPath', userQrPath);
      // Service Workerにパスを通知
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'USER_QR_PATH_UPDATE',
          path: userQrPath,
        });
      }
    }
    // Service Workerからのメッセージリスナー
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'GET_USER_QR_PATH') {
          const savedPath = localStorage.getItem('userQrPath');
          navigator.serviceWorker.controller?.postMessage({
            type: 'USER_QR_PATH_RESPONSE',
            path: savedPath || '/qrcode',
          });
        } else if (event.data && event.data.type === 'PWA_INSTALLED') {
          localStorage.setItem('pwaInstalled', 'true');
        }
      });
    }
    // ホーム画面から開かれた場合の処理
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      const savedPath = localStorage.getItem('userQrPath');
      if (savedPath && window.location.pathname !== savedPath) {
        // 保存されたユーザー固有のQRコードパスへリダイレクト
        window.location.href = savedPath;
      }
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
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream: unknown }).MSStream === undefined;
    // 既にスタンドアロンモードで実行されているかチェック
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    // インストールバナーを表示するかの判定
    if (isIOSDevice && !isStandalone && !localStorage.getItem('installPromptShown')) {
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
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
          style={{
            color: isCorporateMember ? corporateData?.primaryColor || '#1E3A8A' : undefined,
          }}
        >
          <FaArrowLeft className="mr-2" />
          共有設定に戻る
        </Link>
      </div>

      {/* PWA インストールプロンプト - 修正版 */}
      {showInstallPrompt && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-bold text-blue-800 mb-2 flex items-center">
            <span className="mr-2 text-xl">📱</span>
            あなたのQRコードをホーム画面に追加しましょう！
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            <strong>このページを今すぐホーム画面に追加</strong>
            すると、いつでもワンタップであなたの専用QRコードを表示できます。
          </p>

          <div className="bg-white p-4 rounded mb-3 border border-blue-100">
            {isIOS && (
              <>
                <h4 className="font-semibold text-blue-800 mb-3">iPhoneの場合：</h4>
                <ol className="text-sm text-blue-600 list-decimal pl-5 space-y-2">
                  <li className="flex items-center">
                    <span className="mr-3">Safariでこのページを開きます</span>
                  </li>
                  <li className="flex items-center">
                    <Image
                      src="/images/icons/share_iphone.svg"
                      alt="共有ボタン"
                      width={18}
                      height={18}
                      className="mr-2 flex-shrink-0"
                    />
                    <span>共有ボタンをタップ</span>
                  </li>
                  <li className="flex items-center">
                    <Image
                      src="/images/icons/addition_iphone.svg"
                      alt="ホーム画面に追加"
                      width={18}
                      height={18}
                      className="mr-2 flex-shrink-0"
                    />
                    <span>
                      <strong>「ホーム画面に追加」</strong>を選択
                    </span>
                  </li>
                  <li>
                    名前は変更せず、そのまま<strong>「追加」</strong>をタップ
                  </li>
                  <li className="text-red-600 font-semibold">
                    重要：追加後は必ずホーム画面から開いてください
                  </li>
                </ol>
              </>
            )}

            {isAndroid && (
              <>
                <h4 className="font-semibold text-blue-800 mb-3">Androidの場合：</h4>
                <ol className="text-sm text-blue-600 list-decimal pl-5 space-y-2">
                  <li>作成したQRコードページをChromeで開きます</li>
                  <li className="flex items-center">
                    <Image
                      src="/images/icons/menu_android.svg"
                      alt="メニューボタン"
                      width={16}
                      height={16}
                      className="mr-2 flex-shrink-0"
                    />
                    <span>メニューボタンをタップ</span>
                  </li>
                  <li className="flex items-center">
                    <Image
                      src="/images/icons/home_android.svg"
                      alt="ホーム画面に追加"
                      width={18}
                      height={18}
                      className="mr-2 flex-shrink-0"
                    />
                    <span>
                      <strong>「ホーム画面に追加」</strong>を選択
                    </span>
                  </li>
                  <li>
                    <strong>「追加」</strong>をタップ
                  </li>
                </ol>
              </>
            )}

            {!isIOS && !isAndroid && (
              <p className="text-sm text-blue-600">
                デスクトップまたは他のデバイスをお使いの場合は、ブラウザのメニューから「ホーム画面に追加」または「アプリとしてインストール」を選択してください。
              </p>
            )}

            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
              💡 ホーム画面に追加すると、ワンタップでQRコードページを表示できます。
              スマホを取り出してアイコンをタップし、「反転」ボタンを押せば相手にスムーズにQRコードを見せられます。
            </div>
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
                headerText: corporateData?.headerText || DEFAULT_TAGLINE,
              }
            : undefined
        }
        userProfile={{
          profileUrl,
          userName: userName || '',
          nameEn: nameEn || '',
          profileImage: profileImage || undefined,
          headerText: headerText || DEFAULT_TAGLINE, // ここでheaderTextを使用
        }}
      />
    </div>
  );
}