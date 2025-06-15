// app/dashboard/page.tsx (完全修正版)
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import Image from 'next/image';
import { HiUser, HiLink, HiColorSwatch, HiShare, HiQrcode } from 'react-icons/hi';
import SessionDebug from '@/components/debug/SessionDebug';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectChecked, setRedirectChecked] = useState(false);

  // 型定義
  interface UserData {
    id: string;
    name?: string | null;
    email?: string;
    image?: string | null;
    profile?: {
      slug?: string;
      isPublic?: boolean;
    } | null;
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const [snsCount, setSnsCount] = useState(0);

  // ナビゲーション関数
  const handleNavigation = (path: string) => {
    console.log('Navigation clicked:', path);
    try {
      router.push(path);
    } catch (error) {
      console.error('Navigation error:', error);
      // フォールバック: window.location を使用
      window.location.href = path;
    }
  };

  // ユーザータイプ判定とリダイレクト処理
  useEffect(() => {
    const checkUserTypeAndRedirect = async () => {
      // 既にチェック済みまたはリダイレクト中の場合は何もしない
      if (redirectChecked || isRedirecting) {
        return;
      }

      // セッションがロード中は何もしない
      if (status === 'loading') {
        return;
      }

      // 未認証ならログインページへ
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      // リダイレクトチェック完了フラグを設定
      setRedirectChecked(true);

      try {
        // 特定の管理者メールアドレスは強制的に管理者ページへ
        if (session.user?.email === 'admin@sns-share.com') {
          setIsRedirecting(true);
          router.push('/dashboard/admin');
          return;
        }

        // 法人アクセス権チェック
        const corporateAccessResponse = await fetch('/api/corporate/access', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (corporateAccessResponse.ok) {
          const corporateData = await corporateAccessResponse.json();

          // 法人管理者の場合
          if (corporateData.isAdmin && corporateData.hasCorporateAccess) {
            setIsRedirecting(true);
            router.push('/dashboard/corporate');
            return;
          }

          // 法人招待メンバーの場合
          if (corporateData.userRole === 'member' && corporateData.hasCorporateAccess) {
            setIsRedirecting(true);
            router.push('/dashboard/corporate-member');
            return;
          }

          // 永久利用権ユーザーの場合
          if (corporateData.tenantId && corporateData.tenantId.startsWith('virtual-tenant-')) {
            setIsRedirecting(true);
            router.push('/dashboard/corporate');
            return;
          }
        }

        // ダッシュボード情報APIチェック
        const dashboardInfoResponse = await fetch('/api/user/dashboard-info', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (dashboardInfoResponse.ok) {
          const dashboardInfo = await dashboardInfoResponse.json();

          // API側でリダイレクトが推奨されている場合
          if (dashboardInfo.navigation?.shouldRedirect && dashboardInfo.navigation?.redirectPath) {
            setIsRedirecting(true);
            router.push(dashboardInfo.navigation.redirectPath);
            return;
          }
        }

        // ここまで来たら個人ユーザーとして処理
        // ユーザープロフィール情報を取得
        const [profileResponse, linksResponse] = await Promise.all([
          fetch('/api/profile', {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }),
          fetch('/api/links', {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }),
        ]);

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserData(profileData.user);
        }

        if (linksResponse.ok) {
          const linksData = await linksResponse.json();
          setSnsCount(linksData.snsLinks?.length || 0);
        }
      } catch (error) {
        console.error('User type check error:', error);
        // エラー時も個人ダッシュボードを表示
      }

      // ダッシュボードの表示を許可
      setIsLoading(false);
    };

    checkUserTypeAndRedirect();
  }, [session, status, router, redirectChecked, isRedirecting]);

  // ローディング状態
  if (status === 'loading' || (isLoading && !redirectChecked)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">読み込み中...</span>
      </div>
    );
  }

  // リダイレクト中の表示
  if (isRedirecting) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">適切なダッシュボードにリダイレクト中...</span>
      </div>
    );
  }

  // 未認証
  if (!session) {
    return null; // useEffectでリダイレクト処理済み
  }

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">個人ダッシュボード</h1>
          <p className="text-muted-foreground">あなたのプロフィールの概要と管理</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* プロフィールカード */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden relative">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <HiUser className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">プロフィール</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">基本情報や自己紹介を設定できます</p>
          </div>
          <div className="p-6 relative z-20">
            <div className="flex items-center mb-6">
              {userData?.image ? (
                <Image
                  src={userData.image}
                  alt={userData.name || 'ユーザー'}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <HiUser className="h-6 w-6" />
                </div>
              )}
              <div className="ml-4">
                <h3 className="text-xl font-medium">
                  {userData?.name || session?.user?.name || '名前未設定'}
                </h3>
                <p className="text-sm text-gray-500">{userData?.email || session?.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => handleNavigation('/dashboard/profile')}
              className="relative w-full py-3 md:py-2 px-4 bg-blue-600 border border-blue-600 rounded-md text-base md:text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] transition-all duration-150 min-h-[48px] md:min-h-0 flex items-center justify-center cursor-pointer select-none z-30"
              style={{
                WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.3)',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
              }}
            >
              編 集
            </button>
          </div>
          {/* 右下のアイコン */}
          <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
            <HiUser className="h-52 w-52 text-blue-600" />
          </div>
        </div>

        {/* SNSリンクカード */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden relative">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <HiLink className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">SNSリンク</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              SNSアカウントとWebサイトリンクを管理できます
            </p>
          </div>
          <div className="p-6 relative z-20">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-700 font-medium">{snsCount}</span>
              </div>
              <span className="ml-3 text-gray-600">/ 12 SNS設定済み</span>
            </div>
            <button
              onClick={() => handleNavigation('/dashboard/links')}
              className="relative w-full py-3 md:py-2 px-4 bg-blue-600 border border-blue-600 rounded-md text-base md:text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] transition-all duration-150 min-h-[48px] md:min-h-0 flex items-center justify-center cursor-pointer select-none z-30"
              style={{
                WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.3)',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
              }}
            >
              管 理
            </button>
          </div>
          {/* 右下のアイコン */}
          <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
            <HiLink className="h-47 w-47 text-blue-600" />
          </div>
        </div>

        {/* デザイン設定カード */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden relative">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <HiColorSwatch className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">デザイン設定</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              プロフィールのカラーやデザインをカスタマイズできます
            </p>
          </div>
          <div className="p-6 relative z-20">
            <button
              onClick={() => handleNavigation('/dashboard/design')}
              className="relative w-full py-3 md:py-2 px-4 bg-blue-600 border border-blue-600 rounded-md text-base md:text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] transition-all duration-150 min-h-[48px] md:min-h-0 flex items-center justify-center cursor-pointer select-none z-30"
              style={{
                WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.3)',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
              }}
            >
              設定する
            </button>
          </div>
          {/* 右下のアイコン */}
          <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
            <HiColorSwatch className="h-45 w-45 text-blue-600" />
          </div>
        </div>

        {/* 共有設定カード */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden relative">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <HiShare className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">共有設定</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              プロフィールの公開設定や共有方法を管理できます
            </p>
          </div>
          <div className="p-6 relative z-20">
            <button
              onClick={() => handleNavigation('/dashboard/share')}
              className="relative w-full py-3 md:py-2 px-4 bg-blue-600 border border-blue-600 rounded-md text-base md:text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] transition-all duration-150 min-h-[48px] md:min-h-0 flex items-center justify-center cursor-pointer select-none z-30"
              style={{
                WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.3)',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
              }}
            >
              設定する
            </button>
          </div>
          {/* 右下のアイコン */}
          <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
            <HiShare className="h-45 w-45 text-blue-600" />
          </div>
        </div>

        {/* QRコードカード */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden relative">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <HiQrcode className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">QRコード</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">プロフィール共有用のQRコードを作成できます</p>
          </div>
          <div className="p-6 relative z-20">
            <button
              onClick={() => handleNavigation('/qrcode')}
              className="relative w-full py-3 md:py-2 px-4 bg-blue-600 border border-blue-600 rounded-md text-base md:text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] transition-all duration-150 min-h-[48px] md:min-h-0 flex items-center justify-center cursor-pointer select-none z-30"
              style={{
                WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.3)',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
              }}
            >
              作成する
            </button>
          </div>
          {/* 右下のアイコン */}
          <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
            <HiQrcode className="h-45 w-45 text-blue-600" />
          </div>
        </div>
      </div>
      {/* 一時的なデバッグコンポーネント */}
      <SessionDebug />
    </div>
  );
}