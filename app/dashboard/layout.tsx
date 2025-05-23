// app/dashboard/layout.tsx
'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui/Spinner';
import {
  HiHome,
  HiUser,
  HiLink,
  HiColorSwatch,
  HiShare,
  HiCreditCard,
  HiOfficeBuilding,
  HiUsers,
  HiTemplate,
  HiCog,
  HiShieldCheck,
  HiKey,
  HiBell,
  HiOutlineMail,
} from 'react-icons/hi';
import { PermanentPlanType } from '@/lib/corporateAccess';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  isDivider?: boolean;
}

interface DashboardLayoutWrapperProps {
  children: ReactNode;
}

// 個人用サイドバー項目
const personalSidebarItems: SidebarItem[] = [
  {
    title: 'ダッシュボード',
    href: '/dashboard',
    icon: <HiHome className="h-5 w-5" />,
  },
  {
    title: 'プロフィール編集',
    href: '/dashboard/profile',
    icon: <HiUser className="h-5 w-5" />,
  },
  {
    title: 'SNS・リンク管理',
    href: '/dashboard/links',
    icon: <HiLink className="h-5 w-5" />,
  },
  {
    title: 'デザイン設定',
    href: '/dashboard/design',
    icon: <HiColorSwatch className="h-5 w-5" />,
  },
  {
    title: '共有設定',
    href: '/dashboard/share',
    icon: <HiShare className="h-5 w-5" />,
  },
  {
    title: 'ご利用プラン',
    href: '/dashboard/subscription',
    icon: <HiCreditCard className="h-5 w-5" />,
  },
];

// 法人プラン用サイドバー項目（修正版）
const corporateSidebarItems = [
  {
    title: '法人ダッシュボード',
    href: '/dashboard/corporate',
    icon: <HiOfficeBuilding className="h-5 w-5" />,
  },
  {
    title: 'ユーザー管理',
    href: '/dashboard/corporate/users',
    icon: <HiUsers className="h-5 w-5" />,
  },
  {
    title: '部署管理',
    href: '/dashboard/corporate/departments',
    icon: <HiTemplate className="h-5 w-5" />,
  },
  {
    title: '共通SNS設定',
    href: '/dashboard/corporate/sns',
    icon: <HiLink className="h-5 w-5" />,
  },
  {
    title: 'ブランディング設定',
    href: '/dashboard/corporate/branding',
    icon: <HiColorSwatch className="h-5 w-5" />,
  },
  {
    title: 'アカウント設定',
    href: '/dashboard/corporate/settings',
    icon: <HiCog className="h-5 w-5" />,
  },
  // 🔧 法人メンバープロフィールメニューを追加
  {
    title: '法人メンバープロフィール',
    href: '/dashboard/corporate-member',
    icon: <HiUser className="h-5 w-5" />,
  },
  {
    title: 'ご利用プラン',
    href: '/dashboard/subscription',
    icon: <HiCreditCard className="h-5 w-5" />,
  },
];

// 管理者メニュー項目
const adminSidebarItems: SidebarItem[] = [
  {
    title: '管理者ダッシュボード',
    href: '/dashboard/admin',
    icon: <HiShieldCheck className="h-5 w-5" />,
  },
  {
    title: 'ユーザー管理',
    href: '/dashboard/admin/users',
    icon: <HiUsers className="h-5 w-5" />,
  },
  {
    title: 'サブスクリプション管理',
    href: '/dashboard/admin/subscriptions',
    icon: <HiCreditCard className="h-5 w-5" />,
  },
  {
    title: '永久利用権管理',
    href: '/dashboard/admin/permissions',
    icon: <HiKey className="h-5 w-5" />,
  },
  {
    title: 'お知らせ管理',
    href: '/dashboard/admin/notifications',
    icon: <HiBell className="h-5 w-5" />,
  },
  {
    title: 'メール配信管理',
    href: '/dashboard/admin/email',
    icon: <HiOutlineMail className="h-5 w-5" />,
  },
];

export default function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // 🔧 初期状態を修正: ローディング状態を明確に管理
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);

  // 権限状態
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasCorpAccess, setHasCorpAccess] = useState(false);
  const [isCorpAdmin, setIsCorpAdmin] = useState(false);
  const [isPermanentUser, setIsPermanentUser] = useState(false);
  const [permanentPlanType, setPermanentPlanType] = useState<PermanentPlanType | null>(null);
  const [isInvitedMember, setIsInvitedMember] = useState(false);

  // 🔧 ユーザータイプを初期状態nullに変更（個人ダッシュボード表示を防ぐ）
  const [userType, setUserType] = useState<
    'admin' | 'corporate' | 'personal' | 'permanent' | 'invited-member' | null
  >(
    null, // 🔧 'personal' から null に変更
  );

  // 管理者またはメールアドレスによる早期チェック
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // 管理者メールアドレスの直接判定 - 最高優先
    if (session.user?.email === 'admin@sns-share.com') {
      console.log('管理者メールアドレスを検出');
      setIsAdmin(true);
      setUserType('admin');
      setIsAuthCheckComplete(true); // 🔧 認証チェック完了をマーク
      setIsInitializing(false); // 🔧 初期化完了をマーク

      // 管理者は/dashboard/adminに直接移動
      if (pathname === '/dashboard') {
        console.log('管理者ユーザーをダッシュボードから管理者ページへリダイレクト');
        router.push('/dashboard/admin');
      }
      return;
    }

    // 管理者でない場合は次のステップへ
    setIsAuthCheckComplete(true);
  }, [session, status, router, pathname]);

  // アクセス権チェック関数 - 管理者チェック後に実行
  useEffect(() => {
    // 認証チェックが完了していない場合は実行しない
    if (!isAuthCheckComplete) return;

    const checkAccessRights = async () => {
      if (status === 'loading') return;
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      // 管理者メールアドレスは上のuseEffectで処理済み
      if (session.user?.email === 'admin@sns-share.com') {
        return;
      }

      try {
        // 🔧 並行処理から直列処理に変更（競合状態を回避）
        console.log('🔧 アクセス権チェック開始（直列処理）');

        // ステップ1: プロフィール情報取得とユーザータイプの判定
        const profileResponse = await fetch('/api/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const userData = profileData.user;

          // 永久利用権ユーザーのチェック
          if (userData?.subscriptionStatus === 'permanent') {
            console.log('永久利用権ユーザーを検出しました');
            setIsPermanentUser(true);
            setUserType('permanent');

            // 永久利用権プラン種別を取得
            try {
              const permanentResponse = await fetch('/api/user/permanent-plan-type');
              if (permanentResponse.ok) {
                const permanentData = await permanentResponse.json();
                setPermanentPlanType(permanentData.planType);
                console.log('永久利用権プラン種別:', permanentData.planType);

                // 個人プラン以外なら法人アクセス権も付与
                if (permanentData.planType !== 'personal') {
                  setHasCorpAccess(true);
                  setIsCorpAdmin(true);
                } else {
                  // 個人プランの場合は法人アクセス権なし
                  setHasCorpAccess(false);
                  setIsCorpAdmin(false);
                }
              } else {
                // APIエラー時はデフォルト値を使用
                setPermanentPlanType(PermanentPlanType.PERSONAL);
                setHasCorpAccess(false);
                setIsCorpAdmin(false);
              }
            } catch (error) {
              console.error('永久利用権プラン種別取得エラー:', error);
              setPermanentPlanType(PermanentPlanType.PERSONAL);
              setHasCorpAccess(false);
              setIsCorpAdmin(false);
            }

            // 🔧 永久利用権ユーザーの処理完了後に初期化完了をマーク
            setIsInitializing(false);
            return;
          }
        }

        // ステップ2: 法人アクセス権のチェック（永久利用権でない場合のみ）
        console.log('🔧 法人アクセス権チェック開始');
        const corpResponse = await fetch('/api/corporate/access');
        if (corpResponse.ok) {
          const corpData = await corpResponse.json();

          // 明示的にhasAccessを確認、true以外は全てfalseとして扱う
          const hasAccess = corpData.hasAccess === true;
          setHasCorpAccess(hasAccess);

          // 法人ユーザーロールを取得
          const role = corpData.userRole;
          console.log('🔧 法人ユーザーロール:', role, 'hasAccess:', hasAccess);

          // 🔧 招待メンバーの判定（最優先）
          if (hasAccess && role === 'member') {
            console.log('🔧 招待メンバーを検出しました');
            setIsInvitedMember(true);
            setUserType('invited-member');
            setIsCorpAdmin(false);

            // 招待メンバーは法人メンバーページに強制リダイレクト
            if (pathname === '/dashboard') {
              console.log('🔧 招待メンバーを法人メンバーページにリダイレクト');
              router.push('/dashboard/corporate-member');
            }

            // 🔧 招待メンバーの処理完了後に初期化完了をマーク
            setIsInitializing(false);
            return;
          }

          // hasAccessがtrueかつroleがadminまたはcorporate-memberの場合にcorporateタイプに設定
          if (hasAccess && (role === 'admin' || role === 'corporate-member')) {
            console.log('🔧 法人管理者またはメンバーを検出');
            setUserType('corporate');
            setIsCorpAdmin(role === 'admin');
          } else {
            // それ以外は個人ユーザー
            console.log('🔧 個人ユーザーに設定');
            setUserType('personal');
            setHasCorpAccess(false);
            setIsCorpAdmin(false);
          }
        } else {
          // APIエラー時は安全側に倒して個人ユーザーとして扱う
          console.log('🔧 法人アクセスAPI呼び出しエラー - 個人ユーザーと見なします');
          setUserType('personal');
          setHasCorpAccess(false);
          setIsCorpAdmin(false);
        }
      } catch (error) {
        console.error('🔧 アクセスチェックエラー:', error);
        // エラー時も個人ユーザーとして扱う
        setUserType('personal');
        setHasCorpAccess(false);
        setIsCorpAdmin(false);
      } finally {
        // 🔧 必ず初期化完了をマーク
        setIsInitializing(false);
      }
    };

    // 管理者チェックが完了していて、まだ初期化中の場合のみ実行
    if (isAuthCheckComplete && isInitializing) {
      checkAccessRights();
    }
  }, [session, status, router, pathname, isAuthCheckComplete, isInitializing]);

  // 権限に基づく強制リダイレクト - ページロード時に一度だけ実行
  useEffect(() => {
    // 🔧 初期化が完了していない間は何もしない
    if (isInitializing || !pathname) return;

    // 管理者ページへのアクセスチェック
    if (pathname.startsWith('/dashboard/admin') && !isAdmin) {
      console.log('管理者ページへのアクセス拒否 -> ダッシュボードへリダイレクト');
      router.push('/dashboard');
      return;
    }

    // 🔧 法人管理者の場合、/dashboardアクセス時に法人ダッシュボードへリダイレクト
    if (pathname === '/dashboard' && (isCorpAdmin || (userType === 'corporate' && isCorpAdmin))) {
      console.log('法人管理者を法人ダッシュボードへリダイレクト');
      router.push('/dashboard/corporate');
      return;
    }

    // 🔧 永久利用権ユーザー（法人プラン）の場合も法人ダッシュボードへリダイレクト
    if (
      pathname === '/dashboard' &&
      isPermanentUser &&
      permanentPlanType &&
      permanentPlanType !== 'personal'
    ) {
      console.log('法人プラン永久利用権ユーザーを法人ダッシュボードへリダイレクト');
      router.push('/dashboard/corporate');
      return;
    }

    // 招待メンバーの制限（重要な追加）
    if (isInvitedMember) {
      // 招待メンバーは法人メンバーページ以外にアクセス不可
      if (!pathname.startsWith('/dashboard/corporate-member')) {
        console.log('招待メンバーを法人メンバーページ以外からリダイレクト');
        router.push('/dashboard/corporate-member');
        return;
      }
    }

    // 法人ページへのアクセスチェック
    const isCorporateSection = pathname.startsWith('/dashboard/corporate');
    const isCorporateMemberSection = pathname.startsWith('/dashboard/corporate-member');

    if (
      (isCorporateSection || isCorporateMemberSection) &&
      !hasCorpAccess &&
      userType !== 'admin' &&
      userType !== 'invited-member' &&
      !(isPermanentUser && permanentPlanType !== 'personal')
    ) {
      console.log('法人ページへのアクセス拒否 -> ダッシュボードへリダイレクト');
      router.push('/dashboard');
      return;
    }
  }, [
    pathname,
    isAdmin,
    hasCorpAccess,
    isCorpAdmin,
    userType,
    permanentPlanType,
    router,
    isInitializing, // 🔧 isLoadingをisInitializingに変更
    isPermanentUser,
    isInvitedMember,
  ]);

  // 🔧 ローディング表示の条件を修正
  if (status === 'loading' || isInitializing) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">
          {status === 'loading' ? 'セッション確認中...' : 'アクセス権限確認中...'}
        </span>
      </div>
    );
  }

  // 🔧 userTypeがnullの場合はローディングを表示（安全措置）
  if (userType === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">ユーザータイプ判定中...</span>
      </div>
    );
  }

  // サイドバー項目の決定
  let sidebarItems: SidebarItem[] = [];

  // ユーザータイプに基づいてメニューを選択
  switch (userType) {
    case 'admin':
      // 管理者は管理者メニューのみ
      sidebarItems = [...adminSidebarItems];
      break;

    case 'invited-member':
      // 招待メンバーは法人メンバーメニューのみ（個人機能なし）
      sidebarItems = [
        {
          title: '概要',
          href: '/dashboard/corporate-member',
          icon: <HiOfficeBuilding className="h-5 w-5" />,
        },
        {
          title: 'プロフィール編集',
          href: '/dashboard/corporate-member/profile',
          icon: <HiUser className="h-5 w-5" />,
        },
        {
          title: 'SNS・リンク管理',
          href: '/dashboard/corporate-member/links',
          icon: <HiLink className="h-5 w-5" />,
        },
        {
          title: 'デザイン設定',
          href: '/dashboard/corporate-member/design',
          icon: <HiColorSwatch className="h-5 w-5" />,
        },
        {
          title: '共有設定',
          href: '/dashboard/corporate-member/share',
          icon: <HiShare className="h-5 w-5" />,
        },
      ];
      break;

    case 'permanent':
      // 永久利用権ユーザー
      // 基本は個人メニュー
      sidebarItems = [...personalSidebarItems];

      // 法人プランの永久利用権ユーザーのみ法人機能も表示
      if (permanentPlanType && permanentPlanType !== 'personal') {
        sidebarItems.push({
          title: '永久利用権法人機能',
          href: '#permanent-divider',
          icon: <></>,
          isDivider: true,
        });

        sidebarItems.push({
          title: '法人管理ダッシュボード',
          href: '/dashboard/corporate',
          icon: <HiOfficeBuilding className="h-5 w-5" />,
        });
      }
      break;

    case 'corporate':
      // 法人所属ユーザー
      const isCorporateSection = pathname?.startsWith('/dashboard/corporate');
      if (isCorporateSection) {
        // 🔧 法人管理画面では修正されたcorporateSidebarItems（法人メンバープロフィール含む）を使用
        sidebarItems = [...corporateSidebarItems];
      } else {
        // それ以外は個人メニュー＋法人リンク
        sidebarItems = [...personalSidebarItems];

        if (hasCorpAccess) {
          sidebarItems.push({
            title: '法人機能アクセス',
            href: '#corporate-divider',
            icon: <></>,
            isDivider: true,
          });

          // 法人管理者のみ法人管理画面へのリンクを表示
          if (isCorpAdmin) {
            sidebarItems.push({
              title: '法人管理ダッシュボード',
              href: '/dashboard/corporate',
              icon: <HiOfficeBuilding className="h-5 w-5" />,
            });
          } else {
            sidebarItems.push({
              title: '法人メンバーページ',
              href: '/dashboard/corporate-member',
              icon: <HiOfficeBuilding className="h-5 w-5" />,
            });
          }
        }
      }
      break;

    case 'personal':
    default:
      // 個人ユーザーは個人メニューのみ
      sidebarItems = [...personalSidebarItems];
      break;
  }

  return <DashboardLayout items={sidebarItems}>{children}</DashboardLayout>;
}