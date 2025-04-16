// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { corporateAccessState, checkCorporateAccess } from '@/lib/corporateAccessState';
import { CorporateDebugPanel } from '@/components/debug/CorporateDebugPanel';
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
    HiQrcode
} from "react-icons/hi";

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
    const [showDebugPanel, setShowDebugPanel] = useState(false);

    // APIからデータを取得する関数
    const fetchData = async () => {
        try {
            // プロフィール情報の取得
            const profileResponse = await fetch('/api/profile');
            if (!profileResponse.ok) {
                throw new Error("プロフィール情報の取得に失敗しました");
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

    const staggerContainerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    // ローディング表示
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center">
                    <HiHome className="h-8 w-8 text-gray-700 mr-3" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
                        <p className="text-muted-foreground">
                            あなたのプロフィールの概要と管理
                        </p>
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
                        <p className="text-muted-foreground">
                            あなたのプロフィールの概要と管理
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
              <div className="mb-2">
                <Link href="/dashboard/design">
                  <button className="flex items-center justify-center w-full py-3 px-4 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-800 transition-colors">
                    <HiColorSwatch className="mr-2 h-4 w-4" />
                    デザインをカスタマイズする
                  </button>
                </Link>
              </div>

              <div className="mb-2">
                <Link href="/dashboard/links">
                  <button className="flex items-center justify-center w-full py-3 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700 transition-colors">
                    <HiPlus className="mr-2 h-4 w-4" />
                    SNSを追加する
                  </button>
                </Link>
              </div>

              <div>
                <Link href="/dashboard/share">
                  <button className="flex items-center justify-center w-full py-3 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700 transition-colors">
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
              <Link href="/dashboard/subscription">
                <button className="flex items-center justify-center w-full py-2 px-4 bg-blue-600 border border-gray-300 rounded-md text-sm font-medium text-white hover:bg-blue-800 transition-colors">
                  詳細
                </button>
              </Link>
            </div>
          </motion.div>

          {process.env.NODE_ENV === 'development' && (
            <motion.div
              variants={cardVariants}
              className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden col-span-full mt-6"
              transition={{ duration: 0.3 }}
            >
              <div className="border-b border-gray-200 px-6 py-4 bg-yellow-50">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-yellow-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h2 className="ml-2 text-lg font-semibold">
                    法人アクセス診断ツール（開発者モード）
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2">現在の法人アクセス状態:</h3>
                  <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-auto max-h-32">
                    {JSON.stringify(corporateAccessState, null, 2)}
                  </pre>
                </div>

                <div className="flex flex-wrap gap-3 mb-4">
                  <button
                    onClick={() => setShowDebugPanel(!showDebugPanel)}
                    className="flex items-center justify-center py-2 px-4 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-800 transition-colors"
                  >
                    {showDebugPanel ? 'デバッグパネルを閉じる' : 'デバッグパネルを表示'}
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        const result = await checkCorporateAccess(true);
                        alert('アクセスチェック完了: ' + (result.hasAccess ? '許可' : '拒否'));
                      } catch (err) {
                        alert('エラー発生: ' + (err instanceof Error ? err.message : String(err)));
                      }
                    }}
                    className="flex items-center justify-center py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700 transition-colors"
                  >
                    アクセス状態を再チェック
                  </button>

                  <button
                    onClick={() => {
                      // 強制的にアクセス許可
                      corporateAccessState.hasAccess = true;
                      corporateAccessState.isAdmin = true;
                      corporateAccessState.tenantId = 'debug-tenant-id';
                      corporateAccessState.lastChecked = Date.now();
                      corporateAccessState.error = null;

                      // イベントをディスパッチ
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(
                          new CustomEvent('corporateAccessChanged', {
                            detail: { ...corporateAccessState },
                          }),
                        );
                      }

                      alert('法人アクセスを強制的に許可しました');
                    }}
                    className="flex items-center justify-center py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-700 transition-colors"
                  >
                    アクセスを強制許可（デバッグ用）
                  </button>
                </div>

                {showDebugPanel && <CorporateDebugPanel />}
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
}