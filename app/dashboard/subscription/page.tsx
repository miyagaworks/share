// app/dashboard/subscription/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SubscriptionSettings from '@/components/subscription/SubscriptionSettings';
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus';
import TrialBanner from '@/components/subscription/TrialBanner';
import { Spinner } from '@/components/ui/Spinner';
import { HiCreditCard, HiExclamation } from 'react-icons/hi';
import { motion } from 'framer-motion';

// ユーザーデータの型定義
interface UserData {
  id: string;
  trialEndsAt?: string | null;
  subscriptionStatus?: string | null;
  // 他に必要なフィールドがあれば追加
}

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ユーザーデータを元にトライアル状態を判定する関数
  const getSubscriptionState = (userData: UserData | null) => {
    if (!userData) return { isLoading: true };

    const now = new Date();
    const trialEndsAt = userData.trialEndsAt ? new Date(userData.trialEndsAt) : null;

    // トライアル有効期間中
    if (trialEndsAt && now < trialEndsAt) {
      return {
        isTrialActive: true,
        trialEndDate: trialEndsAt,
      };
    }

    // トライアル終了後
    if (trialEndsAt && now > trialEndsAt) {
      // アクティブなサブスクリプションがあるか
      const hasActiveSubscription = userData.subscriptionStatus === 'active';

      if (!hasActiveSubscription) {
        // 猶予期間終了日
        const gracePeriodEndDate = new Date(trialEndsAt);
        gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 7);

        // 猶予期間中
        if (now < gracePeriodEndDate) {
          const diffTime = gracePeriodEndDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return {
            isInGracePeriod: true,
            daysRemaining: diffDays,
            gracePeriodEndDate,
          };
        }
        // 猶予期間終了
        else {
          return {
            isGracePeriodExpired: true,
            gracePeriodEndDate,
          };
        }
      }
      // アクティブなサブスクリプションあり
      else {
        return {
          hasActiveSubscription: true,
        };
      }
    }

    // デフォルト状態
    return { noSubscriptionInfo: true };
  };

  // ユーザーデータを取得する関数
  const fetchUserData = async (): Promise<UserData | null> => {
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('プロフィール情報の取得に失敗しました');
      }
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('データ取得エラー:', error);
      return null;
    }
  };

  const handleUpdate = async () => {
    const data = await fetchUserData();
    setUserData(data);
  };

  useEffect(() => {
    setMounted(true);

    // ユーザーデータの取得
    if (session?.user?.id) {
      const loadUserData = async () => {
        const data = await fetchUserData();
        setUserData(data);
        setIsLoading(false);
      };
      loadUserData();
    } else {
      setIsLoading(false); // セッションがない場合もローディング終了
    }
  }, [session]);

  if (!mounted || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  // subscriptionState計算 - データが取得された後に計算する
  const subscriptionState = getSubscriptionState(userData);

  // ページアニメーション設定
  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="w-full" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
      {/* トライアルバナー */}
      {userData?.trialEndsAt && subscriptionState.isTrialActive && (
        <div className="relative">
          <TrialBanner trialEndDate={userData.trialEndsAt} />
        </div>
      )}

      {/* 猶予期間警告表示 - ここでsubscriptionStateを使用する */}
      {'isInGracePeriod' in subscriptionState && subscriptionState.isInGracePeriod && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <HiExclamation className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">重要なお知らせ: 猶予期間中です</h3>
              <div className="mt-2 text-md text-red-700">
                <p>
                  トライアル期間が終了し、現在{subscriptionState.daysRemaining}
                  日間の猶予期間中です。 お支払い手続きをされない場合、
                  {new Date(subscriptionState.gracePeriodEndDate).toLocaleDateString('ja-JP')}
                  にアカウントが削除され、公開プロフィールが表示されなくなります。
                </p>
                <p className="mt-2 font-semibold">
                  下記からご希望のプランを選択して、お支払い手続きを完了してください。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 猶予期間終了警告表示 */}
      {'isGracePeriodExpired' in subscriptionState && subscriptionState.isGracePeriodExpired && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-800 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <HiExclamation className="h-6 w-6 text-red-800" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">重要警告: アカウント削除予定</h3>
              <div className="mt-2 text-md text-red-700">
                <p>
                  猶予期間が終了しました。アカウントは近日中に削除される予定です。
                  引き続きサービスをご利用になりたい場合は、今すぐお支払い手続きを完了してください。
                </p>
                <p className="mt-2 font-semibold">
                  下記からご希望のプランを選択して、アカウントを復活させてください。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={pageVariants}
        id="subscription-plans"
      >
        <div className="flex items-center mb-6">
          <HiCreditCard className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ご利用プラン</h1>
            <p className="text-muted-foreground">
              プランの管理、支払い設定、請求履歴の確認ができます
            </p>
          </div>
        </div>

        {/* SubscriptionStatusコンポーネントにuserDataも渡す */}
        <div className="mb-6">
          <SubscriptionStatus onReloadSubscription={handleUpdate} userData={userData} />
        </div>

        <SubscriptionSettings />
      </motion.div>
    </div>
  );
}