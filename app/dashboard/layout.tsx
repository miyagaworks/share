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

// 法人プラン用サイドバー項目
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
  const [isLoading, setIsLoading] = useState(true);

  // 権限状態
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasCorpAccess, setHasCorpAccess] = useState(false);
  const [isCorpAdmin, setIsCorpAdmin] = useState(false);
  const [isPermanentUser, setIsPermanentUser] = useState(false);
  const [permanentPlanType, setPermanentPlanType] = useState<PermanentPlanType | null>(null);

  // 明示的にユーザータイプを追跡
  const [userType, setUserType] = useState<'admin' | 'corporate' | 'personal' | 'permanent'>(
    'personal',
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
      setIsLoading(false);

      // 管理者は/dashboard/adminに直接移動
      if (pathname === '/dashboard') {
        console.log('管理者ユーザーをダッシュボードから管理者ページへリダイレクト');
        router.push('/dashboard/admin');
      }
      return;
    }

    setIsLoading(false);
  }, [session, status, router, pathname]);

  // セッションとコーポレートアクセス状態をデバッグログ
  useEffect(() => {
    if (session && !isLoading) {
      console.log('現在のセッション:', session);
      console.log('現在のユーザータイプ:', userType);
      console.log('現在のパス:', pathname);
    }
  }, [session, isLoading, userType, pathname]);

  // アクセス権チェック関数 - 管理者チェック後に実行
  useEffect(() => {
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
            return;
          }
        }

        // ステップ2: 法人アクセス権のチェック
        const corpResponse = await fetch('/api/corporate/access');
        if (corpResponse.ok) {
          const corpData = await corpResponse.json();

          // 明示的にhasAccessを確認、true以外は全てfalseとして扱う
          const hasAccess = corpData.hasAccess === true;
          setHasCorpAccess(hasAccess);

          // 法人ユーザーロールを取得
          const role = corpData.userRole;
          console.log('法人ユーザーロール:', role);

          // hasAccessがtrueかつroleがadminまたはmemberの場合にcorporateタイプに設定
          if (hasAccess && (role === 'admin' || role === 'member')) {
            setUserType('corporate');
            setIsCorpAdmin(role === 'admin');
          } else {
            // それ以外は個人ユーザー
            setUserType('personal');
            setHasCorpAccess(false);
            setIsCorpAdmin(false);
          }
        } else {
          // APIエラー時は安全側に倒して個人ユーザーとして扱う
          console.log('法人アクセスAPI呼び出しエラー - 個人ユーザーと見なします');
          setUserType('personal');
          setHasCorpAccess(false);
          setIsCorpAdmin(false);
        }
      } catch (error) {
        console.error('アクセスチェックエラー:', error);
        // エラー時も個人ユーザーとして扱う
        setUserType('personal');
        setHasCorpAccess(false);
        setIsCorpAdmin(false);
      }
    };

    if (!isAdmin) {
      // 管理者チェックが完了していない場合のみ
      checkAccessRights();
    }
  }, [session, status, router, isAdmin]);

  // 権限に基づく強制リダイレクト - ページロード時に一度だけ実行
  useEffect(() => {
    // isLoadingがtrueの間は何もしない
    if (isLoading || !pathname) return;

    // 管理者ページへのアクセスチェック
    if (pathname.startsWith('/dashboard/admin') && !isAdmin) {
      console.log('管理者ページへのアクセス拒否 -> ダッシュボードへリダイレクト');
      router.push('/dashboard');
      return;
    }

    // 法人ページへのアクセスチェック
    const isCorporateSection = pathname.startsWith('/dashboard/corporate');
    const isCorporateMemberSection = pathname.startsWith('/dashboard/corporate-member');

    if (
      (isCorporateSection || isCorporateMemberSection) &&
      !hasCorpAccess &&
      userType !== 'admin' &&
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
    userType,
    permanentPlanType,
    router,
    isLoading,
    isPermanentUser,
  ]);

  // ローディング表示
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
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
        // 法人管理画面は法人メニュー表示
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