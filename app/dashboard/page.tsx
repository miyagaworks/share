// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { corporateAccessState, checkCorporateAccess } from '@/lib/corporateAccessState';
import {
  HiHome,
  HiUser,
  HiLink,
  HiColorSwatch,
  HiShare,
  HiCreditCard,
  HiPlus,
  HiPencil,
  HiEye,
  HiQrcode,
  HiOfficeBuilding,
  HiDeviceMobile,
} from 'react-icons/hi';

// QRコードデータの型定義を追加
interface QrCodeData {
  id: string;
  slug: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  // 他の必要なプロパティも追加
}

// ユーザーデータの型定義
interface UserWithProfile {
    id: string;
    name?: string | null;
    nameEn?: string | null;
    image?: string | null;
    profile?: {
        slug: string;
        isPublic: boolean;
    } | null;
}

export default function ImprovedDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserWithProfile | null>(null);
  const [snsCount, setSnsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeSlug, setQrCodeSlug] = useState<string | null>(null);

  // APIからデータを取得する関数
  const fetchData = async () => {
    try {
      // プロフィール情報の取得
      const profileResponse = await fetch('/api/profile');
      if (!profileResponse.ok) {
        throw new Error('プロフィール情報の取得に失敗しました');
      }
      const profileData = await profileResponse.json();

      // リンク情報の取得
      const linksResponse = await fetch('/api/links');
      if (!linksResponse.ok) {
        throw new Error('リンク情報の取得に失敗しました');
      }
      const linksData = await linksResponse.json();

      // QRコード情報の取得
      const qrCodeResponse = await fetch('/api/qrcode');
      let qrCodeData: { qrCodes: QrCodeData[] } = { qrCodes: [] };
      if (qrCodeResponse.ok) {
        qrCodeData = await qrCodeResponse.json();
      }

      return {
        user: profileData.user,
        snsLinks: linksData.snsLinks || [],
        customLinks: linksData.customLinks || [],
        qrCodes: qrCodeData.qrCodes || [],
      };
    } catch (error) {
      console.error('データ取得エラー:', error);
      throw error;
    }
  };

  // 初期データ取得
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      console.log('セッションなし、サインインページへリダイレクト');
      router.push('/auth/signin');
      return;
    }

    console.log('セッション情報:', session);

    const loadData = async () => {
      try {
        const data = await fetchData();
        setUserData(data.user);
        setSnsCount(data.snsLinks.length);

        // 最新のQRコードの取得（存在する場合）
        if (data.qrCodes && data.qrCodes.length > 0) {
          // 型アサーションを追加して型エラーを回避
          const qrCodes = data.qrCodes as QrCodeData[];
          // 最新のQRコードを取得（作成日時で降順ソート）
          const latestQrCode = qrCodes.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )[0];
          setQrCodeSlug(latestQrCode.slug);
        }
      } catch (error) {
        console.error('データロードエラー:', error);
        setError('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [session, status, router]);

  useEffect(() => {
    // 法人アクセス権を確認（一度だけ実行）
    const checkAccess = async () => {
      try {
        // APIアクセスは一度だけ実行し、エラーは抑制
        await checkCorporateAccess(false).catch((err) => {
          console.log('アクセス権確認中の非クリティカルエラー:', err);
        });
      } catch {
        // エラー変数なしでキャッチ（TypeScriptはこの構文もサポート）
        // エラーは無視
      }
    };

    if (session && status === 'authenticated') {
      // セッションが確立されたら一度だけ実行
      checkAccess();
    }
  }, [session, status]);

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

  const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // ローディング表示
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <HiHome className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
            <p className="text-muted-foreground">あなたのプロフィールの概要と管理</p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
            <p className="mt-4 text-muted-foreground">データを読み込んでいます...</p>
          </div>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error || !userData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <HiHome className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
            <p className="text-muted-foreground">あなたのプロフィールの概要と管理</p>
          </div>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <p className="text-destructive">
            エラーが発生しました: {error || 'データを取得できませんでした'}
          </p>
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

  // ボタンのスタイルを統一するためのクラス定義
  const primaryButtonClass =
    'flex items-center justify-center w-full py-2.5 px-4 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-800 transition-colors';
  const secondaryButtonClass =
    'flex items-center justify-center w-full py-2.5 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700 transition-colors';
  const buttonGroupClass = 'space-y-1';

  // プロフィールURLの取得
  const profileUrl = userData.profile ? `/${userData.profile.slug}` : null;

  return (
    <motion.div initial="hidden" animate="visible" variants={pageVariants} className="space-y-6">
      <div className="flex items-center mb-6">
        <HiHome className="h-8 w-8 text-gray-700 mr-3" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground">あなたのプロフィールの概要と管理</p>
        </div>
      </div>

      <motion.div
        variants={staggerContainerVariants}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {/* プロフィールカード */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          transition={{ duration: 0.3 }}
        >
          <div className="border-b border-gray-200 px-6 py-4">
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
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center">
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
            <Link href="/dashboard/profile">
              <button className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 border border-gray-300 rounded-md text-sm font-medium text-white hover:bg-blue-800 transition-colors">
                <HiPencil className="mr-2 h-4 w-4" />
                編集
              </button>
            </Link>
          </div>
        </motion.div>

        {/* SNSリンクカード */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          transition={{ duration: 0.3 }}
        >
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
                <HiPlus className="mr-2 h-4 w-4" />
                管理
              </button>
            </Link>
          </div>
        </motion.div>

        {/* 公開プロフィールカード */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden md:col-span-2 lg:col-span-1"
          transition={{ duration: 0.3 }}
        >
          <div className="border-b border-gray-200 px-6 py-4">
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
                    <button className="flex items-center justify-center py-2 px-4 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-800 transition-colors">
                      <HiEye className="mr-2 h-4 w-4" />
                      表示
                    </button>
                  </Link>
                  <Link href="/dashboard/share">
                    <button className="flex items-center justify-center py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700 transition-colors">
                      <HiShare className="mr-2 h-4 w-4" />
                      共有設定
                    </button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">プロフィールがまだ作成されていません</p>
                <Link href="/dashboard/profile">
                  <button className="flex items-center justify-center py-2 px-4 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-800 transition-colors">
                    <HiPlus className="mr-2 h-4 w-4" />
                    プロフィール作成
                  </button>
                </Link>
              </>
            )}
          </div>
        </motion.div>

        {/* 公開QRコードカード */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden md:col-span-1"
          transition={{ duration: 0.3 }}
        >
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <HiQrcode className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">公開QRコード</h2>
            </div>
          </div>
          <div className="p-6">
            {qrCodeSlug ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    {/* QRコードを表示 - シンプルな画像として表示 */}
                    <div className="w-32 h-32 relative">
                      <Image
                        src={`/api/qr-image?url=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/qr/${qrCodeSlug}`)}`}
                        alt="QRコード"
                        width={128}
                        height={128}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
                <div className={`flex flex-col ${buttonGroupClass}`}>
                  <Link href={`/qr/${qrCodeSlug}`} target="_blank" className="mb-1">
                    <button className={primaryButtonClass}>
                      <HiEye className="mr-2 h-4 w-4" />
                      表示
                    </button>
                  </Link>
                  <Link href="/qrcode" className="mb-1">
                    <button className={secondaryButtonClass}>
                      <HiColorSwatch className="mr-2 h-4 w-4" />
                      デザイン変更
                    </button>
                  </Link>
                  <button
                    onClick={() => {
                      router.push('/qrcode?showSaveInstructions=true');
                    }}
                    className={secondaryButtonClass}
                  >
                    <HiDeviceMobile className="mr-2 h-4 w-4" />
                    スマホに保存する方法
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center py-4 mb-4">
                  <HiQrcode className="h-16 w-16 text-gray-300 mx-auto" />
                  <p className="text-gray-600 mt-2 mb-4">QRコードが作成されていません</p>
                </div>
                <div className={buttonGroupClass}>
                  <Link href="/qrcode">
                    <button className={primaryButtonClass}>
                      <HiPlus className="mr-2 h-4 w-4" />
                      QRコードを作成
                    </button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* クイックアクションカード */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden md:col-span-1"
          transition={{ duration: 0.3 }}
        >
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <HiLink className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">クイックアクション</h2>
            </div>
          </div>
          <div className="p-6">
            <div className={`flex flex-col ${buttonGroupClass}`}>
              <Link href="/dashboard/design" className="mb-1">
                <button className={primaryButtonClass}>
                  <HiColorSwatch className="mr-2 h-4 w-4" />
                  デザインをカスタマイズする
                </button>
              </Link>

              <Link href="/dashboard/links" className="mb-1">
                <button className={secondaryButtonClass}>
                  <HiPlus className="mr-2 h-4 w-4" />
                  SNSを追加する
                </button>
              </Link>

              <Link href="/dashboard/share">
                <button className={secondaryButtonClass}>
                  <HiQrcode className="mr-2 h-4 w-4" />
                  QRコードを生成する
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ご利用プランカード */}
        <motion.div
          variants={cardVariants}
          className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden md:col-span-1"
          transition={{ duration: 0.3 }}
        >
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <HiCreditCard className="h-5 w-5 text-gray-700" />
              <h2 className="ml-2 text-lg font-semibold">ご利用プラン</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="font-medium">有効なプラン</h3>
              </div>
            </div>
            <div className={buttonGroupClass}>
              <Link href="/dashboard/subscription">
                <button className={primaryButtonClass}>詳細</button>
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 法人プランユーザー向けのカード - 最後のコンテンツの後に追加 */}
      {
        // windowオブジェクトへの直接アクセスを避け、インポートしたstateを使用
        corporateAccessState.hasAccess === true && (
          <motion.div
            variants={cardVariants}
            className="rounded-xl border border-blue-100 bg-blue-50 shadow-sm overflow-hidden col-span-full mt-4"
            transition={{ duration: 0.3 }}
          >
            <div className="border-b border-blue-200 px-6 py-4">
              <div className="flex items-center">
                <HiOfficeBuilding className="h-5 w-5 text-blue-900" />
                <h2 className="ml-2 text-lg font-semibold text-blue-900">法人プロフィール管理</h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-blue-900 mb-4 text-justify">
                あなたは法人プランのメンバーです。法人プロフィールを管理するには、
                以下のリンクから法人メンバーダッシュボードにアクセスしてください。
              </p>
              <div className={buttonGroupClass}>
                <Link href="/dashboard/corporate-member">
                  <button className={primaryButtonClass}>
                    <HiOfficeBuilding className="mr-2 h-4 w-4" />
                    法人メンバーダッシュボードへ
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )
      }
    </motion.div>
  );
}