// app/dashboard/corporate-member/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';
import { corporateAccessState } from '@/lib/corporateAccess';
import {
  HiUser,
  HiOfficeBuilding,
  HiLink,
  HiColorSwatch,
  HiShare,
  HiQrcode,
  HiUserGroup,
  HiBriefcase,
  HiEye,
  HiDeviceMobile,
  HiPlus,
} from 'react-icons/hi';
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
  position?: string | null;
  profile?: {
    slug: string;
    isPublic: boolean;
  } | null;
}
export default function CorporateMemberPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserWithProfile | null>(null);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [snsCount, setSnsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 初期データ取得
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const loadData = async () => {
      try {
        // fetchData を直接定義するか、useCallback でメモ化
        const response = await fetch('/api/corporate-profile');
        if (!response.ok) {
          throw new Error('法人プロフィール情報の取得に失敗しました');
        }
        const profileData = await response.json();

        const linksResponse = await fetch('/api/links');
        if (!linksResponse.ok) {
          throw new Error('リンク情報の取得に失敗しました');
        }
        const linksData = await linksResponse.json();

        setUserData(profileData.user);
        setTenantData(profileData.tenant);
        setSnsCount(linksData.snsLinks?.length || 0);
      } catch {
        setError('データの取得に失敗しました');
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
        when: 'beforeChildren',
      },
    },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };
  // ローディング表示
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <HiOfficeBuilding className="h-8 w-8 mr-3" style={{ color: '#1E3A8A' }} />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">法人メンバープロフィール</h1>
            <p className="text-muted-foreground">あなたの法人メンバープロフィールの概要</p>
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
          <HiOfficeBuilding className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">法人メンバープロフィール</h1>
            <p className="text-muted-foreground">あなたの法人メンバープロフィールの概要</p>
          </div>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <p className="text-destructive">
            エラーが発生しました: {error || 'データを取得できませんでした'}
          </p>
          <Button variant="corporate" onClick={() => window.location.reload()} className="mt-4">
            ページを再読み込み
          </Button>
        </div>
      </div>
    );
  }
  // プロフィールURLの取得
  const profileUrl = userData.profile ? `/${userData.profile.slug}` : null;
  // 法人テーマカラーを適用するためのスタイル
  // const primaryColor = tenantData.primaryColor || 'var(--color-corporate-primary)';
  // secondaryColorは必要な場合にだけコメントを外して使用
  // const secondaryColor = tenantData.secondaryColor || 'var(--color-corporate-secondary)';
  // 管理者権限の確認
  const isAdmin = userData.corporateRole === 'admin' || corporateAccessState.isAdmin;
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="space-y-6 corporate-theme"
    >
      <div className="flex items-center mb-6">
        <HiOfficeBuilding className="h-8 w-8 text-gray-700 mr-3" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">法人メンバープロフィール</h1>
          <p className="text-muted-foreground">法人ブランディングを適用したプロフィール管理</p>
        </div>
      </div>
      {/* 法人テナント情報カード */}
      <motion.div
        variants={cardVariants}
        className="rounded-xl border border-[#1E3A8A]/40 bg-white shadow-sm overflow-hidden"
      >
        <div className="border-b border-[#1E3A8A]/40 px-6 py-4">
          <div className="flex items-center">
            <HiOfficeBuilding className="h-5 w-5 text-gray-700" />
            <h2 className="ml-2 text-lg font-semibold">法人テナント情報</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center mb-6">
            {tenantData.logoUrl ? (
              <div className="w-16 h-16 rounded-full border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                <Image
                  src={tenantData.logoUrl}
                  alt={tenantData.name}
                  width={40} // サイズを縮小
                  height={40} // サイズを縮小
                  className="object-contain w-10 h-10" // 明示的にサイズを制限
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                />
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-full text-white flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-corporate-primary)' }}
              >
                <HiOfficeBuilding className="h-8 w-8" />
              </div>
            )}
            <div className="ml-4">
              <h3 className="text-xl font-medium">{tenantData.name}</h3>
              {userData.department && (
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-600 mr-2">部署:</span>
                  <span className="text-sm font-medium px-2 py-0.5 bg-gray-100 rounded-full">
                    {userData.department.name}
                  </span>
                </div>
              )}
              {userData.position && (
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-600 mr-2">役職:</span>
                  <span className="text-sm">{userData.position}</span>
                </div>
              )}
              <div className="mt-1 flex items-center">
                <span className="text-sm text-gray-600 mr-2">権限:</span>
                <span
                  className={`text-sm px-2 py-0.5 rounded-full ${
                    isAdmin ? 'bg-blue-100' : 'bg-gray-100'
                  }`}
                  style={{
                    color: isAdmin ? '#1e3a8a' : '#4b5563', // 固定の青色と灰色を使用
                  }}
                >
                  {isAdmin ? '管理者' : 'メンバー'}
                </span>
              </div>
            </div>
          </div>
          {isAdmin && (
            <Link href="/dashboard/corporate">
              <Button variant="corporateOutline" className="w-full">
                <HiUserGroup className="mr-2 h-4 w-4" />
                法人管理ダッシュボードへ
              </Button>
            </Link>
          )}
        </div>
      </motion.div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* プロフィールカード */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-[#1E3A8A]/40 bg-white shadow-sm overflow-hidden"
        >
          <div className="border-b border-[#1E3A8A]/40 px-6 py-4">
            <div className="flex items-center">
              <HiUser className="h-5 w-5" />
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
                  style={{ backgroundColor: '#1E3A8A' }}
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
              </div>
            </div>
            <Link href="/dashboard/corporate-member/profile">
              <Link href="/dashboard/corporate-member/profile">
                <Button variant="corporate">
                  <HiUser className="mr-2 h-4 w-4" />編 集
                </Button>
              </Link>
            </Link>
          </div>
        </motion.div>
        {/* SNSリンクカード */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-[#1E3A8A]/40 bg-white shadow-sm overflow-hidden"
        >
          <div className="border-b border-[#1E3A8A]/40 px-6 py-4">
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
                  backgroundColor: 'var(--color-corporate-primary)20',
                  color: 'var(--color-corporate-primary)',
                }}
              >
                <span className="font-medium">{snsCount}</span>
              </div>
              <span className="ml-3 text-gray-600">/ 12 SNS設定済み</span>
            </div>
            <Link href="/dashboard/corporate-member/links">
              <Link href="/dashboard/corporate-member/links">
                <Button variant="corporate">
                  <HiLink className="mr-2 h-4 w-4" />管 理
                </Button>
              </Link>
            </Link>
          </div>
        </motion.div>
        {/* 公開プロフィールカード */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-[#1E3A8A]/40 bg-white shadow-sm overflow-hidden"
        >
          <div className="border-b border-[#1E3A8A]/40 px-6 py-4">
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
                    <Button variant="corporate" className="w-full">
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
                    </Button>
                  </Link>
                  <Link href="/dashboard/corporate-member/share">
                    <Button variant="corporateOutline">
                      <HiShare className="mr-2 h-4 w-4" />
                      共有設定
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">プロフィールがまだ作成されていません</p>
                <Link href="/dashboard/corporate-member/profile">
                  <Button variant="corporate" className="w-full">
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
                  </Button>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>
      {/* 公開QRコードカード */}
      <motion.div
        variants={cardVariants}
        className="rounded-xl border border-[#1E3A8A]/40 bg-white shadow-sm overflow-hidden"
        transition={{ duration: 0.3 }}
      >
        <div className="border-b border-[#1E3A8A]/40 px-6 py-4">
          <div className="flex items-center">
            <HiQrcode className="h-5 w-5 text-gray-700" />
            <h2 className="ml-2 text-lg font-semibold">公開QRコード</h2>
          </div>
        </div>
        <div className="p-6">
          {profileUrl ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  {/* QRコードを表示 - シンプルな画像として表示 */}
                  <div className="w-32 h-32 relative">
                    <Image
                      src={`/api/qr-image?url=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/qr/${userData.profile?.slug}`)}`}
                      alt="QRコード"
                      width={128}
                      height={128}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <Link href={`/qr/${userData.profile?.slug}`} target="_blank">
                  <Button variant="corporate" className="w-full">
                    <HiEye className="mr-2 h-4 w-4" />表 示
                  </Button>
                </Link>
                <Link href="/qrcode">
                  <Button variant="corporateOutline" className="w-full">
                    <HiColorSwatch className="mr-2 h-4 w-4" />
                    デザイン変更
                  </Button>
                </Link>
                <Button
                  variant="corporateOutline"
                  onClick={() => {
                    router.push('/qrcode?showSaveInstructions=true');
                  }}
                  className="w-full"
                >
                  <HiDeviceMobile className="mr-2 h-4 w-4" />
                  スマホに保存する方法
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-4 mb-4">
                <HiQrcode className="h-16 w-16 text-gray-300 mx-auto" />
                <p className="text-gray-600 mt-2 mb-4">QRコードが作成されていません</p>
              </div>
              <div className="flex flex-col">
                <Link href="/qrcode">
                  <Button variant="corporate" className="w-full">
                    <HiPlus className="mr-2 h-4 w-4" />
                    QRコードを作成
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
      {/* クイックアクションカード */}
      <motion.div
        variants={cardVariants}
        className="rounded-xl border border-[#1E3A8A]/40 bg-white shadow-sm overflow-hidden"
      >
        <div className="border-b border-[#1E3A8A]/40 px-6 py-4">
          <div className="flex items-center">
            <HiBriefcase className="h-5 w-5 text-gray-700" />
            <h2 className="ml-2 text-lg font-semibold">クイックアクション</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <Link href="/dashboard/corporate-member/design">
              <Button variant="corporate" className="w-full">
                <HiColorSwatch className="mr-2 h-4 w-4" />
                デザインをカスタマイズする
              </Button>
            </Link>
            <Link href="/dashboard/corporate-member/links">
              <Button variant="corporateOutline" className="w-full">
                <HiLink className="mr-2 h-4 w-4" />
                SNSを追加する
              </Button>
            </Link>
            <Link href="/dashboard/corporate-member/share">
              <Button variant="corporateOutline" className="w-full sm:col-span-2 lg:col-span-1">
                <HiQrcode className="mr-2 h-4 w-4" />
                QRコードを生成する
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}