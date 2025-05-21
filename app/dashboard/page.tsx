// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
// import ImprovedDashboardPage from '@/components/dashboard/ImprovedDashboardPage';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { HiUser, HiLink, HiColorSwatch, HiShare, HiQrcode } from 'react-icons/hi';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [redirectComplete, setRedirectComplete] = useState(false);
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

  // ログイン状態と特別なユーザーのリダイレクト処理
  useEffect(() => {
    const checkUserAndRedirect = async () => {
      // セッションがロード中は何もしない
      if (status === 'loading') {
        return;
      }

      // 未認証ならログインページへ
      if (!session) {
        console.log('未認証ユーザー - ログインページへリダイレクト');
        router.push('/auth/signin');
        return;
      }

      // 特定の管理者メールアドレスは強制的に管理者ページへ
      if (session.user?.email === 'admin@sns-share.com') {
        console.log('管理者ユーザーを検出、管理者ページへリダイレクト');
        router.push('/dashboard/admin');
        return;
      }

      // ユーザープロフィール情報を取得
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        }
      } catch (error) {
        console.error('プロフィール取得エラー:', error);
      }

      // ダッシュボードの表示を許可
      console.log('ダッシュボード表示の準備完了');
      setIsLoading(false);
      setRedirectComplete(true);
    };

    checkUserAndRedirect();
  }, [session, status, router]);

  // デバッグ用ログ
  useEffect(() => {
    if (session) {
      console.log('セッション情報:', session);
      console.log('ローディング状態:', isLoading);
      console.log('リダイレクト完了状態:', redirectComplete);
    }
  }, [session, isLoading, redirectComplete]);

  // ページの内容
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">読み込み中...</span>
      </div>
    );
  }

  // 未認証
  if (!session) {
    return null; // useEffectでリダイレクト処理済み
  }

  // ImprovedDashboardPageコンポーネントを使用せず、直接シンプルなダッシュボードを表示
  // これにより、ImprovedDashboardPageからのリダイレクト問題を回避
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
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
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <HiUser className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-medium">{userData?.name || '未設定'}</h3>
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
                <span className="text-blue-700 font-medium">0</span>
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

        {/* その他のカード */}
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