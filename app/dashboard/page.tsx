// app/dashboard/page.tsx (法人ユーザー動線対応版)
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import Image from 'next/image';
import { HiUser, HiLink, HiColorSwatch, HiShare, HiQrcode } from 'react-icons/hi';

export default function DashboardPage() {
  // デバッグ
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('🏠 Dashboard page loaded');
    console.log('🔍 Dashboard session status:', status);
    console.log('🔍 Dashboard session data:', session);

    if (status === 'unauthenticated') {
      console.log('❌ Dashboard: No session, user should be redirected to login');
    } else if (status === 'authenticated') {
      console.log('✅ Dashboard: User is authenticated');
    } else {
      console.log('⏳ Dashboard: Session loading...');
    }
  }, [session, status]);

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // 型定義を追加
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

  // 🚀 新機能: 法人ユーザーの早期検出とリダイレクト
  useEffect(() => {
    const checkUserTypeAndRedirect = async () => {
      // セッションがロード中は何もしない
      if (status === 'loading') {
        return;
      }

      // 未認証ならログインページへ
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      // 特定の管理者メールアドレスは強制的に管理者ページへ
      if (session.user?.email === 'admin@sns-share.com') {
        setIsRedirecting(true);
        router.push('/dashboard/admin');
        return;
      }

      try {
        // 🔥 新機能: ユーザーの法人アクセス権をチェック
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
            console.log('法人管理者を検出: 法人ダッシュボードにリダイレクト');
            setIsRedirecting(true);
            router.push('/dashboard/corporate');
            return;
          }

          // 法人招待メンバーの場合
          if (corporateData.userRole === 'member' && corporateData.hasCorporateAccess) {
            console.log('法人招待メンバーを検出: 法人メンバーページにリダイレクト');
            setIsRedirecting(true);
            router.push('/dashboard/corporate-member');
            return;
          }

          // 永久利用権ユーザーの場合 (APIレスポンスから判定)
          if (corporateData.tenantId && corporateData.tenantId.startsWith('virtual-tenant-')) {
            console.log('永久利用権ユーザーを検出: 法人ダッシュボードにリダイレクト');
            setIsRedirecting(true);
            router.push('/dashboard/corporate');
            return;
          }
        }

        // 🔥 追加: ダッシュボード情報APIからのリダイレクト指示をチェック
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
            console.log(
              'ダッシュボード情報APIからリダイレクト指示:',
              dashboardInfo.navigation.redirectPath,
            );
            setIsRedirecting(true);
            router.push(dashboardInfo.navigation.redirectPath);
            return;
          }
        }

        // ここまで来たら個人ユーザーとして処理
        console.log('個人ユーザーとして個人ダッシュボードを表示');

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
        console.error('ユーザータイプ判定エラー:', error);
        // エラー時も個人ダッシュボードを表示
      }

      // ダッシュボードの表示を許可
      setIsLoading(false);
    };

    checkUserTypeAndRedirect();
  }, [session, status, router]);

  // ページの内容
  if (status === 'loading' || isLoading) {
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
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">個人ダッシュボード</h1>
          <p className="text-muted-foreground">あなたのプロフィールの概要と管理</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* プロフィールカード */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <HiUser className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">プロフィール</h2>
            </div>
          </div>
          <div className="p-6">
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
            <Link href="/dashboard/profile">
              <button className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 border border-gray-300 rounded-md text-sm font-medium text-white hover:bg-blue-800 transition-colors">
                編集
              </button>
            </Link>
          </div>
        </div>

        {/* SNSリンクカード */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <HiLink className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">SNSリンク</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-700 font-medium">{snsCount}</span>
              </div>
              <span className="ml-3 text-gray-600">/ 12 SNS設定済み</span>
            </div>
            <Link href="/dashboard/links">
              <button className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 border border-gray-300 rounded-md text-sm font-medium text-white hover:bg-blue-800 transition-colors">
                管理
              </button>
            </Link>
          </div>
        </div>

        {/* デザイン設定カード */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <HiColorSwatch className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">デザイン設定</h2>
            </div>
          </div>
          <div className="p-6">
            <Link href="/dashboard/design">
              <button className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 border border-gray-300 rounded-md text-sm font-medium text-white hover:bg-blue-800 transition-colors">
                設定する
              </button>
            </Link>
          </div>
        </div>

        {/* 共有設定カード */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <HiShare className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">共有設定</h2>
            </div>
          </div>
          <div className="p-6">
            <Link href="/dashboard/share">
              <button className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 border border-gray-300 rounded-md text-sm font-medium text-white hover:bg-blue-800 transition-colors">
                設定する
              </button>
            </Link>
          </div>
        </div>

        {/* QRコードカード */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <HiQrcode className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">QRコード</h2>
            </div>
          </div>
          <div className="p-6">
            <Link href="/qrcode">
              <button className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 border border-gray-300 rounded-md text-sm font-medium text-white hover:bg-blue-800 transition-colors">
                作成する
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}