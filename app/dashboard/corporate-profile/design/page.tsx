// app/dashboard/corporate-profile/design/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { HiColorSwatch, HiLockClosed, HiEye } from 'react-icons/hi';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface TenantData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

interface UserData {
  id: string;
  name: string | null;
  nameEn: string | null;
  bio: string | null;
  image: string | null;
  mainColor: string;
  snsIconColor: string | null;
  corporateRole: string | null;
  companyLabel: string | null;
}

export default function CorporateDesignPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // データを取得
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/corporate-profile');

        if (!response.ok) {
          throw new Error('プロフィール情報の取得に失敗しました');
        }

        const data = await response.json();
        setUserData(data.user);
        setTenantData(data.tenant);
        setIsAdmin(data.user.corporateRole === 'admin');
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('プロフィール情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

  // ローディング表示
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-500">デザイン情報を読み込んでいます...</p>
      </div>
    );
  }

  // エラー表示
  if (error || !userData || !tenantData) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">
          エラーが発生しました: {error || 'データを取得できませんでした'}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          再読み込み
        </Button>
      </div>
    );
  }

  const primaryColor = tenantData.primaryColor || '#3B82F6';
  const secondaryColor = tenantData.secondaryColor || '#1E40AF';

  // プレビューカード用のサンプルSNSアイコン
  const snsIcons = [
    { name: 'Twitter', icon: 'X' },
    { name: 'Instagram', icon: 'Instagram' },
    { name: 'LinkedIn', icon: 'LinkedIn' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <HiColorSwatch className="h-8 w-8 text-gray-700 mr-3" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">デザイン設定</h1>
          <p className="text-muted-foreground">法人ブランディングに基づいたデザイン設定</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* デザイン情報カード */}
        <div
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          style={{ borderColor: `${primaryColor}40` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <HiColorSwatch className="mr-2 h-5 w-5 text-gray-600" />
              カラー設定
            </h2>
            <div className="text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full text-xs flex items-center">
              <HiLockClosed className="mr-1 h-3 w-3" />
              法人設定で管理
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            法人ブランディングに基づいてカラーが設定されています。これらの設定は法人管理者によって管理されています。
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プライマリーカラー
              </label>
              <div className="flex items-center">
                <div
                  className="h-10 w-10 rounded-md mr-2"
                  style={{ backgroundColor: primaryColor }}
                ></div>
                <div className="font-mono text-sm bg-gray-100 px-3 py-2 rounded">
                  {primaryColor}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                セカンダリーカラー
              </label>
              <div className="flex items-center">
                <div
                  className="h-10 w-10 rounded-md mr-2"
                  style={{ backgroundColor: secondaryColor }}
                ></div>
                <div className="font-mono text-sm bg-gray-100 px-3 py-2 rounded">
                  {secondaryColor}
                </div>
              </div>
            </div>

            {/* ロゴ表示 */}
            {tenantData.logoUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">企業ロゴ</label>
                <div className="h-20 w-20 border border-gray-200 rounded-md flex items-center justify-center p-2">
                  <Image
                    src={tenantData.logoUrl}
                    alt={`${tenantData.name}のロゴ`}
                    width={64}
                    height={64}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mt-6">
              <p className="text-sm text-blue-700">
                これらの設定は法人ダッシュボードの「ブランディング設定」で管理されています。
                変更が必要な場合は、法人管理者にお問い合わせください。
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-blue-600 border-blue-300"
                onClick={() => router.push('/dashboard/corporate/branding')}
                disabled={!isAdmin}
              >
                {isAdmin ? 'ブランディング設定を編集' : 'ブランディング設定（管理者のみ）'}
              </Button>
            </div>
          </div>
        </div>

        {/* プレビューカード */}
        <motion.div
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          style={{ borderColor: `${primaryColor}40` }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center mb-4">
            <HiEye className="h-5 w-5 text-gray-700 mr-2" />
            <h2 className="text-xl font-semibold">プレビュー</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            法人ブランディングが適用されたプロフィールのプレビュー
          </p>

          {/* プレビューコンテンツ */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* ヘッダー部分 */}
            <div
              className="h-32 flex items-center justify-center relative"
              style={{ backgroundColor: primaryColor }}
            >
              {tenantData.logoUrl && (
                <div className="absolute top-2 right-2 bg-white rounded-full p-1 h-10 w-10 flex items-center justify-center">
                  <Image
                    src={tenantData.logoUrl}
                    alt={`${tenantData.name}のロゴ`}
                    width={24}
                    height={24}
                    className="max-h-6 max-w-6 object-contain"
                  />
                </div>
              )}
              <div className="text-center">
                {userData.image ? (
                  <div className="h-20 w-20 rounded-full border-4 border-white overflow-hidden">
                    <Image
                      src={userData.image}
                      alt={userData.name || 'ユーザー'}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full border-4 border-white mx-auto flex items-center justify-center bg-gray-100">
                    <span className="text-2xl font-semibold text-gray-700">
                      {userData.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* プロフィール情報 */}
            <div className="p-4">
              <h3 className="text-xl font-semibold text-center" style={{ color: primaryColor }}>
                {userData.name || '名前未設定'}
              </h3>
              {userData.nameEn && (
                <p className="text-sm text-gray-500 text-center">{userData.nameEn}</p>
              )}
              <p className="text-sm text-gray-600 mt-2 text-center">
                {userData.bio || '自己紹介が設定されていません'}
              </p>

              {/* SNSアイコン */}
              <div className="flex justify-center gap-4 mt-4">
                {snsIcons.map((sns, index) => (
                  <div
                    key={index}
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <span style={{ color: primaryColor }}>{sns.icon.charAt(0)}</span>
                  </div>
                ))}
              </div>

              {/* コンタクトボタン */}
              <div className="mt-6">
                <button
                  className="w-full py-2 rounded-md text-white font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  連絡先を追加
                </button>
              </div>

              {/* 会社情報 */}
              <div className="mt-4">
                <button
                  className="w-full py-2 rounded-md font-medium border"
                  style={{
                    color: secondaryColor,
                    borderColor: secondaryColor,
                  }}
                >
                  {userData.companyLabel || '会社HP'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 法人設定情報 */}
      <div
        className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        style={{ borderColor: `${primaryColor}40` }}
      >
        <h2 className="text-lg font-semibold mb-4">カラー設定のガイドライン</h2>
        <p className="text-sm text-gray-600 mb-4">
          法人プロファイルでは以下の要素に法人ブランディングカラーが適用されます:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-md p-4">
            <h3 className="font-medium mb-2">プライマリーカラーの適用箇所</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• プロフィールヘッダー背景</li>
              <li>• ボタン背景</li>
              <li>• アクセントカラー</li>
              <li>• ユーザー名の表示</li>
              <li>• SNSアイコンの背景色</li>
            </ul>
          </div>

          <div className="border border-gray-200 rounded-md p-4">
            <h3 className="font-medium mb-2">セカンダリーカラーの適用箇所</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• セカンダリボタンの色</li>
              <li>• リンクのカラー</li>
              <li>• ボーダーのアクセント</li>
              <li>• リンクホバー時の色</li>
            </ul>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 mt-6">
          <p className="text-sm text-yellow-700">
            <strong>注意:</strong>{' '}
            プロフィールの見た目は法人ブランディング設定に基づいて自動的に調整されます。
            個別のカラー設定はできませんが、プロフィール情報などは編集可能です。
          </p>
        </div>
      </div>
    </div>
  );
}