// app/dashboard/corporate-profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  HiUser,
  HiOfficeBuilding,
  HiLink,
  HiColorSwatch,
  HiShare,
  HiQrcode
} from 'react-icons/hi';
import { Spinner } from '@/components/ui/Spinner';

// テナント情報の型定義
interface TenantData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

// ユーザーデータの型定義
interface UserWithProfile {
  id: string;
  name?: string | null;
  nameEn?: string | null;
  image?: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
  corporateRole?: string | null;
  profile?: {
    slug: string;
    isPublic: boolean;
  } | null;
}

export default function CorporateProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserWithProfile | null>(null);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [snsCount, setSnsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // APIからデータを取得する関数
  const fetchData = async () => {
    try {
      // プロフィール情報の取得
      const profileResponse = await fetch('/api/corporate-profile');
      if (!profileResponse.ok) {
        throw new Error("法人プロフィール情報の取得に失敗しました");
      }
      const profileData = await profileResponse.json();

      // リンク情報の取得
      const linksResponse = await fetch('/api/links');
      if (!linksResponse.ok) {
        throw new Error("リンク情報の取得に失敗しました");
      }
      const linksData = await linksResponse.json();

      return {
        user: profileData.user,
        tenant: profileData.tenant,
        snsLinks: linksData.snsLinks || [],
        customLinks: linksData.customLinks || []
      };
    } catch (error) {
      console.error("データ取得エラー:", error);
      throw error;
    }
  };

  // 初期データ取得
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchData();
        setUserData(data.user);
        setTenantData(data.tenant);
        setSnsCount(data.snsLinks.length);
      } catch (error) {
        console.error("データロードエラー:", error);
        setError("データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [session, status, router]);

  // アニメーション設定
  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        when: "beforeChildren"
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0
    }
  };

  // ローディング表示
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <HiUser className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">法人プロフィール</h1>
            <p className="text-muted-foreground">
              あなたの法人プロフィールの概要と管理
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-muted-foreground">データを読み込んでいます...</p>
          </div>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error || !userData || !tenantData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <HiUser className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">法人プロフィール</h1>
            <p className="text-muted-foreground">
              あなたの法人プロフィールの概要と管理
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <p className="text-destructive">エラーが発生しました: {error || "データを取得できませんでした"}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    );
  }

  // プロフィールURLの取得
  const profileUrl = userData.profile ? `/${userData.profile.slug}` : null;

  // 法人テーマカラーを適用するためのスタイル
  const corporateStyle = {
    primaryColor: tenantData.primaryColor || '#3B82F6',
    secondaryColor: tenantData.secondaryColor || 'var(--color-corporate-secondary)',
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={pageVariants} className="space-y-6">
      <div className="flex items-center mb-6">
        <HiUser className="h-8 w-8 text-gray-700 mr-3" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">法人プロフィール</h1>
          <p className="text-muted-foreground">法人ブランディングを適用したプロフィール管理</p>
        </div>
      </div>

      {/* 法人情報カード */}
      <motion.div
        variants={cardVariants}
        className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      >
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <HiOfficeBuilding className="h-5 w-5 text-gray-700" />
            <h2 className="ml-2 text-lg font-semibold">法人情報</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center mb-6">
            {tenantData.logoUrl ? (
              <div className="w-12 h-12 rounded-full border border-gray-200 bg-gray-300 flex items-center justify-center">
                <Image
                  src={tenantData.logoUrl}
                  alt={tenantData.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            ) : (
              <div
                className="w-12 h-12 rounded-full text-white flex items-center justify-center"
                style={{ backgroundColor: corporateStyle.primaryColor }}
              >
                <HiOfficeBuilding className="h-6 w-6" />
              </div>
            )}
            <div className="ml-4">
              <h3 className="text-xl font-medium">{tenantData.name}</h3>
              {userData.department && (
                <p className="text-sm text-gray-500">{userData.department.name}</p>
              )}
            </div>
          </div>
          <Link href="/dashboard/corporate">
            <button
              className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
              style={{
                color: corporateStyle.primaryColor,
                borderColor: corporateStyle.primaryColor,
              }}
            >
              <HiOfficeBuilding className="mr-2 h-4 w-4" />
              法人ダッシュボードへ
            </button>
          </Link>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* プロフィールカード */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
        >
          <div
            className="border-b border-gray-200 px-6 py-4"
            style={{ borderColor: corporateStyle.primaryColor }}
          >
            <div className="flex items-center">
              <HiUser className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">プロフィール</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center mb-6">
              {userData.image ? (
                <Image
                  src={userData.image}
                  alt={userData.name || 'ユーザー'}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full text-white flex items-center justify-center"
                  style={{ backgroundColor: corporateStyle.primaryColor }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              )}
              <div className="ml-4">
                <h3 className="text-xl font-medium">{userData.name || '未設定'}</h3>
                {userData.nameEn && <p className="text-sm text-gray-500">{userData.nameEn}</p>}
                <p className="text-sm text-gray-500">
                  {userData.corporateRole === 'admin' ? '管理者' : 'メンバー'}
                </p>
              </div>
            </div>
            <Link href="/dashboard/corporate-profile/profile">
              <button
                className="flex items-center justify-center w-full py-2 px-4 text-white rounded-md"
                style={{ backgroundColor: corporateStyle.primaryColor }}
              >
                <HiUser className="mr-2 h-4 w-4" />
                編集
              </button>
            </Link>
          </div>
        </motion.div>

        {/* SNSリンクカード */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
        >
          <div
            className="border-b border-gray-200 px-6 py-4"
            style={{ borderColor: corporateStyle.primaryColor }}
          >
            <div className="flex items-center">
              <HiLink className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">SNSリンク</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${corporateStyle.primaryColor}20`,
                  color: corporateStyle.primaryColor,
                }}
              >
                <span className="font-medium">{snsCount}</span>
              </div>
              <span className="ml-3 text-gray-600">/ 12 SNS設定済み</span>
            </div>
            <Link href="/dashboard/corporate-profile/links">
              <button
                className="flex items-center justify-center w-full py-2 px-4 text-white rounded-md"
                style={{ backgroundColor: corporateStyle.primaryColor }}
              >
                <HiLink className="mr-2 h-4 w-4" />
                管理
              </button>
            </Link>
          </div>
        </motion.div>

        {/* 公開プロフィールカード */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden md:col-span-2 lg:col-span-1"
        >
          <div
            className="border-b border-gray-200 px-6 py-4"
            style={{ borderColor: corporateStyle.primaryColor }}
          >
            <div className="flex items-center">
              <HiShare className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">公開プロフィール</h2>
            </div>
          </div>
          <div className="p-6">
            {profileUrl ? (
              <>
                <p className="text-gray-600 text-sm mb-2">あなたのプロフィールURLは:</p>
                <div className="bg-gray-50 p-3 rounded-md mb-4 font-mono text-sm break-all">
                  {typeof window !== 'undefined'
                    ? window.location.origin + profileUrl
                    : '' + profileUrl}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={profileUrl} target="_blank">
                    <button
                      className="flex items-center justify-center py-2 px-4 text-white rounded-md"
                      style={{ backgroundColor: corporateStyle.primaryColor }}
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      表示
                    </button>
                  </Link>
                  <Link href="/dashboard/corporate-profile/share">
                    <button
                      className="flex items-center justify-center py-2 px-4 border rounded-md text-sm font-medium"
                      style={{
                        color: corporateStyle.primaryColor,
                        borderColor: corporateStyle.primaryColor,
                      }}
                    >
                      <HiShare className="mr-2 h-4 w-4" />
                      共有設定
                    </button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">プロフィールがまだ作成されていません</p>
                <Link href="/dashboard/corporate-profile/profile">
                  <button
                    className="flex items-center justify-center py-2 px-4 text-white rounded-md"
                    style={{ backgroundColor: corporateStyle.primaryColor }}
                  >
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    プロフィール作成
                  </button>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* クイックアクションカード */}
      <motion.div
        variants={cardVariants}
        className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      >
        <div
          className="border-b border-gray-200 px-6 py-4"
          style={{ borderColor: corporateStyle.primaryColor }}
        >
          <div className="flex items-center">
            <HiLink className="h-5 w-5 text-gray-700" />
            <h2 className="ml-2 text-lg font-semibold">クイックアクション</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/corporate-profile/design">
              <button
                className="flex items-center justify-center w-full py-3 px-4 text-white rounded-md"
                style={{ backgroundColor: corporateStyle.primaryColor }}
              >
                <HiColorSwatch className="mr-2 h-4 w-4" />
                デザインをカスタマイズする
              </button>
            </Link>

            <Link href="/dashboard/corporate-profile/links">
              <button
                className="flex items-center justify-center w-full py-3 px-4 border rounded-md text-sm font-medium"
                style={{
                  color: corporateStyle.primaryColor,
                  borderColor: corporateStyle.primaryColor,
                }}
              >
                <HiLink className="mr-2 h-4 w-4" />
                SNSを追加する
              </button>
            </Link>

            <Link href="/dashboard/corporate-profile/share">
              <button
                className="flex items-center justify-center w-full py-3 px-4 border rounded-md text-sm font-medium"
                style={{
                  color: corporateStyle.primaryColor,
                  borderColor: corporateStyle.primaryColor,
                }}
              >
                <HiQrcode className="mr-2 h-4 w-4" />
                QRコードを生成する
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}