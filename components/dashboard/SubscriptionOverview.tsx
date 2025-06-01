// components/dashboard/SubscriptionOverview.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Spinner } from '@/components/ui/Spinner';
import TrialBanner from '@/components/subscription/TrialBanner';
import {
  HiCreditCard,
  HiArrowRight,
  HiCalendar,
  HiClock,
  HiUser,
  HiOfficeBuilding,
} from 'react-icons/hi';
import { motion } from 'framer-motion';
// ご利用プランデータの型定義
interface SubscriptionData {
  id: string;
  status: string;
  plan: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string | null;
  // 追加: 永久利用権ユーザーかどうかのフラグ
  isPermanentUser?: boolean;
  // 追加: 表示用のステータス（オプショナル）
  displayStatus?: string;
}
// APIレスポンスの型定義
interface SubscriptionResponse {
  success: boolean;
  subscription: SubscriptionData | null;
  billingHistory: Array<{
    id: string;
    amount: number;
    status: string;
    description: string;
    paidAt: string | null;
    createdAt: string;
  }>;
  message?: string;
  error?: string;
}
interface SubscriptionOverviewProps {
  userId: string;
}
export default function SubscriptionOverview({ userId }: SubscriptionOverviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionResponse | null>(null);
  const [trialEndDate, setTrialEndDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setIsLoading(true);
        // ユーザープロファイル情報を取得
        const profileResponse = await fetch('/api/profile');
        if (!profileResponse.ok) {
          throw new Error('プロフィール情報の取得に失敗しました');
        }
        const profileData = await profileResponse.json();
        // トライアル終了日を設定
        if (profileData.user && profileData.user.trialEndsAt) {
          setTrialEndDate(profileData.user.trialEndsAt);
        }
        // 永久利用権ステータスをチェック
        const isPermanentUser =
          profileData.user && profileData.user.subscriptionStatus === 'permanent';
        // ご利用プラン情報を取得
        const subscriptionResponse = await fetch('/api/subscription');
        if (!subscriptionResponse.ok) {
          throw new Error('プラン情報の取得に失敗しました');
        }
        const subscriptionData = await subscriptionResponse.json();
        // 永久利用権ユーザーの場合、サブスクリプションデータを修正
        if (isPermanentUser && subscriptionData.subscription) {
          // isPermanentUser 変数を使用
          subscriptionData.subscription.isPermanentUser = isPermanentUser;
          // 表示用のステータスを設定
          subscriptionData.subscription.displayStatus = '永久利用';
        }
        setSubscriptionData(subscriptionData);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '情報の取得に失敗しました';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscriptionData();
  }, [userId]);
  // 読み込み中
  if (isLoading) {
    return (
      <DashboardCard
        title="ご利用プラン"
        className="flex items-center justify-center min-h-[120px]"
      >
        <Spinner size="md" />
        <span className="ml-3 text-sm text-gray-500">プラン情報を読み込み中...</span>
      </DashboardCard>
    );
  }
  // エラー発生時
  if (error) {
    return (
      <DashboardCard title="エラー" className="bg-red-50 border-red-200">
        <div className="text-red-800 text-sm">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            再読み込み
          </Button>
        </div>
      </DashboardCard>
    );
  }
  // トライアル中
  if (
    trialEndDate &&
    (!subscriptionData?.subscription || subscriptionData?.subscription?.status === 'trialing')
  ) {
    return (
      <>
        <TrialBanner trialEndDate={trialEndDate} />
        <DashboardCard title="無料トライアル">
          <div className="flex items-start">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <HiClock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">無料トライアル</h3>
              <p className="text-sm text-gray-500 mb-6">
                {new Date(trialEndDate).toLocaleDateString('ja-JP')}
                までトライアル期間をお楽しみください。
                すべての機能を引き続きご利用いただくには、有料プランにアップグレードしてください。
              </p>
              {/* プラン選択の説明 */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <HiUser className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-semibold text-blue-800">個人プラン</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">
                    個人でご利用される方向けのプランです。
                  </p>
                  <ul className="text-sm text-blue-600 space-y-1 font-medium">
                    <li>
                      • <span className="text-base font-bold">月額500円</span> または{' '}
                      <span className="text-base font-bold">年額5,000円</span>（2ヶ月分お得）
                    </li>
                    <li>• 全機能利用可能・いつでもキャンセル可能</li>
                  </ul>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <HiOfficeBuilding className="h-5 w-5 text-purple-600 mr-2" />
                    <h4 className="font-semibold text-purple-800">法人プラン</h4>
                  </div>
                  <p className="text-sm text-purple-700 mb-3">
                    チームや会社でご利用される方向けのプランです。
                  </p>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="bg-white rounded p-3 border border-purple-100">
                      <div className="font-bold text-purple-800 text-base">スタータープラン</div>
                      <div className="text-purple-600 font-semibold">
                        <span className="text-base font-bold">月額3,000円</span>・
                        <span className="text-base font-bold">最大10名</span>まで
                      </div>
                    </div>
                    <div className="bg-white rounded p-3 border border-purple-100">
                      <div className="font-bold text-purple-800 text-base">ビジネスプラン</div>
                      <div className="text-purple-600 font-semibold">
                        <span className="text-base font-bold">月額6,000円</span>・
                        <span className="text-base font-bold">最大30名</span>まで
                      </div>
                    </div>
                    <div className="bg-white rounded p-3 border border-purple-100">
                      <div className="font-bold text-purple-800 text-base">
                        エンタープライズプラン
                      </div>
                      <div className="text-purple-600 font-semibold">
                        <span className="text-base font-bold">月額9,000円</span>・
                        <span className="text-base font-bold">最大50名</span>まで
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">※年間プランは16%お得です</p>
                </div>
              </div>
              <Link href="/dashboard/subscription" className="inline-block mt-4">
                <Button variant="outline" className="flex items-center" size="sm">
                  <HiCreditCard className="mr-2 h-4 w-4" />
                  プランを選択
                  <HiArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </DashboardCard>
      </>
    );
  }
  // アクティブなご利用プラン
  if (
    subscriptionData?.subscription &&
    (subscriptionData.subscription.status === 'active' ||
      subscriptionData.subscription.isPermanentUser === true)
  ) {
    const subscription = subscriptionData.subscription;
    const planName =
      subscription.plan === 'monthly'
        ? '個人プラン（月額）'
        : subscription.plan === 'yearly'
          ? '個人プラン（年額）'
          : subscription.plan === 'starter'
            ? '法人スタータープラン'
            : subscription.plan === 'business'
              ? '法人ビジネスプラン'
              : subscription.plan === 'enterprise'
                ? '法人エンタープライズプラン'
                : 'カスタムプラン';
    // 永久利用権ユーザーかどうか
    const isPermanentUser = subscription.isPermanentUser === true;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <DashboardCard title="ご利用プラン">
          <div className="flex items-start">
            <div
              className={`rounded-full ${isPermanentUser ? 'bg-purple-100' : 'bg-green-100'} p-3 mr-4`}
            >
              <HiCreditCard
                className={`h-6 w-6 ${isPermanentUser ? 'text-purple-600' : 'text-green-600'}`}
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start gap-3 mb-2">
                <h3 className="text-lg font-semibold flex-1 leading-relaxed">{planName}</h3>
                <span
                  className={`${isPermanentUser ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'} text-xs font-medium px-3 py-2 rounded-lg min-h-[32px] flex items-center justify-center whitespace-nowrap flex-shrink-0`}
                >
                  {isPermanentUser ? '永久利用' : 'アクティブ'}
                </span>
              </div>
              {!isPermanentUser && (
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <HiCalendar className="h-4 w-4 mr-1" />
                  <span>
                    次回更新日：
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}
                  </span>
                </div>
              )}
              <Link href="/dashboard/subscription" className="inline-block">
                <Button variant="outline" className="flex items-center" size="sm" type="button">
                  <HiCreditCard className="mr-2 h-4 w-4" />
                  プラン詳細を見る
                  <HiArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </DashboardCard>
      </motion.div>
    );
  }
  // キャンセル済みまたはその他のステータス
  return (
    <DashboardCard title="ご利用プラン">
      <div className="flex items-start">
        <div className="rounded-full bg-gray-100 p-3 mr-4">
          <HiCreditCard className="h-6 w-6 text-gray-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">ご利用プラン</h3>
          <p className="text-sm text-gray-500 mb-6">
            現在アクティブなプランはありません。有料プランにアップグレードして、すべての機能をご利用ください。
          </p>
          {/* プラン選択の説明 */}
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <HiUser className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-blue-800">個人プラン</h4>
              </div>
              <p className="text-sm text-blue-700 mb-2">個人でご利用される方向けのプランです。</p>
              <ul className="text-sm text-blue-600 space-y-1 font-medium">
                <li>
                  • <span className="text-base font-bold">月額500円</span> または{' '}
                  <span className="text-base font-bold">年額5,000円</span>（2ヶ月分お得）
                </li>
                <li>• 全機能利用可能・いつでもキャンセル可能</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <HiOfficeBuilding className="h-5 w-5 text-purple-600 mr-2" />
                <h4 className="font-semibold text-purple-800">法人プラン</h4>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                チームや会社でご利用される方向けのプランです。
              </p>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="bg-white rounded p-2 border border-purple-100">
                  <div className="font-semibold text-purple-800">スタータープラン</div>
                  <div className="text-purple-600">月額3,000円・最大10名まで</div>
                </div>
                <div className="bg-white rounded p-2 border border-purple-100">
                  <div className="font-semibold text-purple-800">ビジネスプラン</div>
                  <div className="text-purple-600">月額6,000円・最大30名まで</div>
                </div>
                <div className="bg-white rounded p-2 border border-purple-100">
                  <div className="font-semibold text-purple-800">エンタープライズプラン</div>
                  <div className="text-purple-600">月額9,000円・最大50名まで</div>
                </div>
              </div>
              <p className="text-xs text-purple-600 mt-2">※年間プランは16%お得です</p>
            </div>
          </div>
          <Link href="/dashboard/subscription" className="inline-block">
            <Button className="flex items-center" size="sm" type="button">
              <HiCreditCard className="mr-2 h-4 w-4" />
              プランを選択
              <HiArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </DashboardCard>
  );
}