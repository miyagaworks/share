// components/subscription/SubscriptionStatus.tsx
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { addDays } from 'date-fns';
import CancelRequestForm from './CancelRequestForm';
import {
  HiCheck,
  HiRefresh,
  HiXCircle,
  HiExclamation,
  HiClock,
  HiShieldCheck,
} from 'react-icons/hi';
// 新APIをインポート
import {
  checkCorporateAccess,
  fetchPermanentPlanType,
  PermanentPlanType,
  PLAN_TYPE_DISPLAY_NAMES,
} from '@/lib/corporateAccess';

// 型定義を修正
interface SubscriptionData {
  id: string;
  status: string;
  plan: string;
  currentPeriodEnd: string;
  currentPeriodStart: string; // 追加
  cancelAtPeriodEnd: boolean;
  trialEnd?: string | null;
  isPermanentUser?: boolean;
  displayStatus?: string;
  interval?: string;
}

interface SubscriptionStatusProps {
  onReloadSubscription?: () => void;
  userData?: {
    trialEndsAt?: string | null;
    subscriptionStatus?: string | null;
  } | null;
}

// GracePeriodInfo型
interface GracePeriodInfo {
  isInGracePeriod?: boolean;
  isGracePeriodExpired?: boolean;
  daysRemaining?: number;
  gracePeriodEndDate?: Date;
}

// StatusDisplay型
interface StatusDisplay {
  text: string;
  className: string;
}

export default function SubscriptionStatus({
  onReloadSubscription,
  userData,
}: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactivating, setReactivating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [previousPlan, setPreviousPlan] = useState<string | null>(null);
  const [previousInterval, setPreviousInterval] = useState<string | null>(null);
  const [showCancelForm, setShowCancelForm] = useState(false);

  // 永久利用権関連の状態
  const [permanentPlanType, setPermanentPlanType] = useState<PermanentPlanType | null>(null);
  const [permanentPlanLoaded, setPermanentPlanLoaded] = useState(false);

  // onReloadSubscriptionの参照を保持するためのref
  const onReloadSubscriptionRef = useRef(onReloadSubscription);

  // プラン選択のクリックハンドラー
  const handlePlanSelection = () => {
    // 現在のページが subscription ページかチェック
    if (window.location.pathname === '/dashboard/subscription') {
      // 既に subscription ページにいる場合、直接スクロール
      let targetElement = document.getElementById('subscription-plans');
      // subscription-plans が見つからない場合、個人プラン・法人プランのタブを探す
      if (!targetElement) {
        const tabContainer = document.querySelector(
          '.bg-white.rounded-lg.border.border-gray-200.overflow-hidden.flex',
        );
        if (tabContainer) {
          targetElement = tabContainer as HTMLElement;
        }
      }
      if (targetElement) {
        // より精密なスクロール位置の計算
        const elementRect = targetElement.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const headerHeight = 80; // ヘッダーの高さを考慮
        const offset = 30; // タブボタンがよく見えるように少し余裕を持たせる
        const scrollPosition = absoluteElementTop - headerHeight - offset;

        // スムーズスクロールを実行
        window.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        });
        return;
      } else {
        // 要素が見つからない場合、少し待ってからリトライ
        setTimeout(() => {
          let retryElement = document.getElementById('subscription-plans');
          if (!retryElement) {
            const tabContainer = document.querySelector(
              '.bg-white.rounded-lg.border.border-gray-200.overflow-hidden.flex',
            );
            if (tabContainer) {
              retryElement = tabContainer as HTMLElement;
            }
          }
          if (retryElement) {
            const elementRect = retryElement.getBoundingClientRect();
            const absoluteElementTop = elementRect.top + window.pageYOffset;
            const headerHeight = 80;
            const offset = 30;
            const scrollPosition = absoluteElementTop - headerHeight - offset;
            window.scrollTo({
              top: scrollPosition,
              behavior: 'smooth',
            });
          }
        }, 500);
        return;
      }
    }
    // subscription ページに遷移
    window.location.href = '/dashboard/subscription#subscription-plans';
  };

  // onReloadSubscriptionが変更されたらrefを更新
  useEffect(() => {
    onReloadSubscriptionRef.current = onReloadSubscription;
  }, [onReloadSubscription]);

  // 永久利用権プラン種別を取得
  const loadPermanentPlanType = useCallback(async () => {
    if (!userData?.subscriptionStatus || userData.subscriptionStatus !== 'permanent') {
      setPermanentPlanLoaded(true);
      return;
    }
    try {
      const planType = await fetchPermanentPlanType();
      setPermanentPlanType(planType);
    } catch {
    } finally {
      setPermanentPlanLoaded(true);
    }
  }, [userData]);

  // 日付のフォーマット関数
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // 法人アクセス権をリフレッシュする関数
  const refreshCorporateAccess = useCallback(async () => {
    try {
      const result = await checkCorporateAccess({ force: true });
      // イベントをディスパッチして他のコンポーネントに通知
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('corporateAccessChanged', {
            detail: { ...result },
          }),
        );
      }
      return result;
    } catch {
      return null;
    }
  }, []);

  // ご利用プラン情報を取得
  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription');
      if (!response.ok) {
        throw new Error('プラン情報の取得に失敗しました');
      }
      const data = await response.json();
      if (data.subscription) {
        setSubscription(data.subscription);
        // 初回読み込み時は前回のプラン情報を設定
        if (previousPlan === null) {
          setPreviousPlan(data.subscription.plan);
          setPreviousInterval(data.subscription.interval || 'month');
        }
      }
      setError(null);
    } catch {
      setError('プラン情報を読み込めませんでした');
      toast.error('プラン情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [previousPlan]);

  // 初回読み込み
  useEffect(() => {
    fetchSubscription();
    loadPermanentPlanType();
  }, [fetchSubscription, loadPermanentPlanType]);

  // プラン変更を検知して法人アクセス権を更新
  useEffect(() => {
    if (!subscription) return;

    const currentPlan = subscription.plan;
    const currentInterval = subscription.interval || 'month';

    // 初回読み込み時
    if (previousPlan === null) {
      setPreviousPlan(currentPlan);
      setPreviousInterval(currentInterval);
      return;
    }

    // プランまたは契約期間が変更された場合
    if (previousPlan !== currentPlan || previousInterval !== currentInterval) {
      // 法人プラン関連のプラン変更の場合のみアクセス権をリフレッシュ
      const isCorporateRelated =
        currentPlan.includes('business') ||
        currentPlan.includes('enterprise') ||
        currentPlan.includes('starter') ||
        currentPlan.includes('corp') ||
        (previousPlan &&
          (previousPlan.includes('business') ||
            previousPlan.includes('enterprise') ||
            previousPlan.includes('starter') ||
            previousPlan.includes('corp')));

      if (isCorporateRelated) {
        // 少し遅延させてリフレッシュする（UI更新の完了を待つため）
        setTimeout(() => {
          refreshCorporateAccess().then(() => {
            // サイドバーやメニューを強制的に更新するために画面をリロード
            toast.success('プランが更新されました。メニューを更新します...', {
              duration: 2000,
            });
            // 少し遅延させてからリロード
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          });
        }, 500);
      }

      // 前回のプラン情報を更新
      setPreviousPlan(currentPlan);
      setPreviousInterval(currentInterval);
    }
  }, [subscription, previousPlan, previousInterval, refreshCorporateAccess]);

  // 拡張された再読み込み処理を作成
  const enhancedReload = useCallback(() => {
    // 元の再読み込み処理を実行
    if (onReloadSubscriptionRef.current) {
      onReloadSubscriptionRef.current();
    }
    // 少し遅延させてからプラン情報を再取得
    setTimeout(() => {
      fetchSubscription().then(() => {
        // プラン情報取得後に法人アクセス権も更新
        refreshCorporateAccess();
      });
    }, 1000);
  }, [fetchSubscription, refreshCorporateAccess]);

  // ご利用プランステータスに基づいた表示情報を取得
  const getStatusDisplay = useCallback(
    (sub: SubscriptionData | null): StatusDisplay => {
      // 🔧 修正: trialEndsAtがあり、トライアル期間中の場合を最初にチェック
      if (userData?.trialEndsAt && userData?.subscriptionStatus === 'trialing') {
        const now = new Date();
        const trialEndDate = new Date(userData.trialEndsAt);

        // トライアル期間中の場合
        if (now < trialEndDate) {
          return { text: '無料トライアル中', className: 'bg-blue-100 text-blue-800' };
        }
      }

      if (!sub) return { text: '無料トライアル中', className: 'bg-blue-100 text-blue-800' };

      // 永久利用権ユーザーの場合
      if (sub.isPermanentUser) {
        return {
          text: '永久利用',
          className: 'bg-blue-100 text-blue-800',
        };
      }

      // 🔧 修正: トライアル中の判定を追加
      if (sub.status === 'trialing' || sub.plan === 'trialing') {
        return {
          text: '無料トライアル中',
          className: 'bg-blue-100 text-blue-800',
        };
      }

      // 無料トライアル中（従来の判定も維持）
      if (sub.plan === 'trial' || sub.plan === 'none') {
        return { text: '無料トライアル中', className: 'bg-blue-100 text-blue-800' };
      }

      // アクティブなプラン
      if (sub.status === 'active') {
        let planType = '';
        let renewalInfo = '';

        // プランの種類を判定（修正版）
        const planName = sub.plan.toLowerCase();
        const interval = sub.interval || 'month';

        // 法人プランの判定
        if (planName.includes('starter') || planName === 'starter') {
          planType = 'スタータープラン';
          renewalInfo = interval === 'year' ? '（年額/10名）' : '（月額/10名）';
        } else if (planName.includes('business') && !planName.includes('enterprise')) {
          planType = 'ビジネスプラン';
          renewalInfo = interval === 'year' ? '（年額/30名）' : '（月額/30名）';
        } else if (planName.includes('enterprise') || planName === 'enterprise') {
          planType = 'エンタープライズプラン';
          renewalInfo = interval === 'year' ? '（年額/50名）' : '（月額/50名）';
        }
        // 古いプランIDとの互換性
        else if (planName === 'business_legacy') {
          planType = 'スタータープラン';
          renewalInfo = '（10名まで）';
        } else if (planName === 'business_plus' || planName === 'business-plus') {
          planType = 'ビジネスプラン';
          renewalInfo = '（30名まで）';
        }
        // 個人プラン
        else if (planName === 'monthly' || planName.includes('monthly')) {
          planType = '個人プラン';
          renewalInfo = '（月額）';
        } else if (planName === 'yearly' || planName.includes('yearly')) {
          planType = '個人プラン';
          renewalInfo = '（年額）';
        }

        // 法人プランの場合は「法人」をプレフィックス
        if (
          planName.includes('starter') ||
          planName.includes('business') ||
          planName.includes('enterprise')
        ) {
          planType = `法人${planType}`;
        }

        // プラン名が決定できた場合
        if (planType) {
          return {
            text: `${planType} ${renewalInfo}`,
            className:
              planName.includes('starter') ||
              planName.includes('business') ||
              planName.includes('enterprise')
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800',
          };
        }
      }

      // キャンセル済み・猶予期間
      if (sub.status === 'past_due' || sub.cancelAtPeriodEnd) {
        return { text: 'キャンセル予定', className: 'bg-yellow-100 text-yellow-800' };
      }

      if (sub.status === 'canceled') {
        return { text: 'キャンセル済み', className: 'bg-red-100 text-red-800' };
      }

      if (sub.status === 'incomplete') {
        return { text: '支払い未完了', className: 'bg-red-100 text-red-800' };
      }

      // 🔧 修正: その他の場合のデフォルト（以前の「不明」を回避）
      return {
        text: 'プラン確認中',
        className: 'bg-gray-100 text-gray-800',
      };
    },
    [userData],
  );

  // ご利用プランを再アクティブ化
  const handleReactivate = async () => {
    // 永久利用権ユーザーはプラン変更不可
    if (isPermanentUser()) {
      toast.error('永久利用権ユーザーはプランを変更できません');
      return;
    }
    if (!subscription) return;

    try {
      setReactivating(true);
      const response = await fetch('/api/subscription/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'プランの再アクティブ化に失敗しました');
      }

      const data = await response.json();
      // 結果を反映
      setSubscription(data.subscription);
      toast.success('プランを再アクティブ化しました');

      // 法人アクセス権も更新
      await refreshCorporateAccess();
      // 拡張された再読み込み処理を実行
      enhancedReload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'プランの再アクティブ化に失敗しました');
    } finally {
      setReactivating(false);
    }
  };

  // ご利用プランをキャンセル
  const handleCancel = async () => {
    // 永久利用権ユーザーはプラン変更不可
    if (userData?.subscriptionStatus === 'permanent') {
      toast.error('永久利用権ユーザーはプランを変更できません');
      return;
    }
    if (!subscription) return;

    // 解約フォームを表示
    setShowCancelForm(true);
  };

  // 解約申請成功後の処理
  const handleCancelRequestSuccess = () => {
    // サブスクリプション情報を再取得
    fetchSubscription();
    // 拡張された再読み込み処理を実行
    enhancedReload();
  };

  // JSXの最後（return文の直前）に追加
  {
    showCancelForm && subscription && (
      <CancelRequestForm
        subscription={{
          plan: subscription.plan,
          interval: subscription.interval,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }}
        onClose={() => setShowCancelForm(false)}
        onSuccess={handleCancelRequestSuccess}
      />
    );
  }

  // 永久利用権ユーザーかどうかを確認
  const isPermanentUser = () => {
    // サブスクリプションの状態から判定
    if (subscription?.isPermanentUser) {
      return true;
    }
    // または、ユーザーデータから直接判定
    return userData?.subscriptionStatus === 'permanent';
  };

  // 猶予期間の計算関数
  const getGracePeriodInfo = useCallback((): GracePeriodInfo | null => {
    if (!userData?.trialEndsAt) return null;

    const trialEndDate = new Date(userData.trialEndsAt);
    const now = new Date();
    const gracePeriodEndDate = addDays(trialEndDate, 7); // 7日間の猶予期間

    // トライアル終了後の判定
    if (now > trialEndDate) {
      // アクティブなサブスクリプションの判定
      const hasActiveSubscription =
        subscription && subscription.status === 'active' && !subscription.cancelAtPeriodEnd;

      // アクティブなサブスクリプションがない場合
      if (!hasActiveSubscription) {
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
            isInGracePeriod: false,
            isGracePeriodExpired: true,
            daysRemaining: 0,
            gracePeriodEndDate,
          };
        }
      }
    }
    return null;
  }, [userData, subscription]);

  // 永久利用権プラン情報表示コンポーネント
  const PermanentPlanInfo = () => {
    const displayName = permanentPlanType
      ? PLAN_TYPE_DISPLAY_NAMES[permanentPlanType]
      : '永久利用権プラン';

    return (
      <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mt-4">
        <div className="flex items-center mb-2">
          <HiShieldCheck className="h-5 w-5 text-blue-700 mr-2" />
          <h3 className="font-medium text-blue-800">{displayName}</h3>
        </div>
        <p className="text-sm text-blue-700">
          特別会員ステータスです。料金を支払わずに永続的に全ての機能をご利用いただけます。
        </p>
        {permanentPlanType && (
          <div className="mt-2 text-xs text-blue-600 bg-blue-100 p-2 rounded">
            <strong>注意:</strong>{' '}
            永久利用権のため、プランの変更やキャンセルはできません。ご不明点は管理者にお問い合わせください。
          </div>
        )}
      </div>
    );
  };

  const gracePeriodInfo = getGracePeriodInfo();

  // 🔧 修正: トライアル状態を正しく判定してstatusDisplayを取得
  const statusDisplay = (() => {
    // トライアル中の場合
    if (userData?.trialEndsAt && userData?.subscriptionStatus === 'trialing') {
      const now = new Date();
      const trialEndDate = new Date(userData.trialEndsAt);
      const daysRemaining = Math.ceil(
        (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (now < trialEndDate) {
        return {
          text: `無料トライアル中 (残り${daysRemaining}日)`,
          className: 'bg-blue-100 text-blue-800',
        };
      }
    }

    // その他の場合は既存のgetStatusDisplay関数を使用
    return subscription
      ? getStatusDisplay(subscription)
      : { text: '読み込み中...', className: 'bg-gray-100 text-gray-800' };
  })();

  // 🔧 修正: トライアル中の正しい判定を追加
  const isCurrentlyInTrial = () => {
    if (!userData?.trialEndsAt) return false;

    const now = new Date();
    const trialEndDate = new Date(userData.trialEndsAt);
    return now < trialEndDate && userData.subscriptionStatus === 'trialing';
  };

  // 🔧 修正: メインのreturn文の条件を修正
  // ご利用プランなし（無料トライアル中）- 条件を修正
  if (!subscription || subscription.status === 'trialing' || isCurrentlyInTrial()) {
    // トライアル期間が終了しているかどうかの判定を追加
    const now = new Date();
    const trialEndDate = userData?.trialEndsAt ? new Date(userData.trialEndsAt) : null;
    const isTrialActive = trialEndDate && now < trialEndDate;

    // トライアル残日数計算
    const daysRemaining = trialEndDate
      ? Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-blue-500 mr-3">
            <HiClock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium">
              {isTrialActive
                ? `無料トライアル中 (残り${daysRemaining}日)`
                : 'プランが選択されていません'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 text-justify">
              {isTrialActive
                ? `現在、無料トライアル期間をご利用中です。有料プランにアップグレードすると、すべての機能を継続してご利用いただけます。`
                : `現在、プランが選択されていません。プランを選択して、すべての機能をご利用ください。`}
            </p>
            <div className="mt-4">
              <button
                className="h-[48px] px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base sm:text-sm flex items-center justify-center"
                onClick={handlePlanSelection}
              >
                プランを選択
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // エラー発生時
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 shadow-sm p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-red-500 mr-3">
            <HiExclamation className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-800">エラーが発生しました</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => fetchSubscription()}>
              <HiRefresh className="mr-2 h-4 w-4" />
              再読み込み
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 猶予期間中の警告表示
  if (gracePeriodInfo?.isInGracePeriod && gracePeriodInfo.gracePeriodEndDate) {
    return (
      <div className="bg-white rounded-lg border border-red-200 shadow-sm p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-red-500 mr-3">
            <HiExclamation className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-800">トライアル期間が終了しました</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                現在、<strong>{gracePeriodInfo.daysRemaining}日間</strong>
                の猶予期間中です。このままお支払い手続きをされない場合、
                <strong>{formatDate(gracePeriodInfo.gracePeriodEndDate.toISOString())}</strong>
                にアカウントが削除され、公開プロフィールが表示されなくなります。
              </p>
              <div className="mt-4">
                <button
                  className="h-[48px] px-6 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-base sm:text-sm flex items-center justify-center"
                  onClick={handlePlanSelection}
                >
                  今すぐプランを選択する
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 猶予期間終了後（未削除のアカウント）
  if (gracePeriodInfo?.isGracePeriodExpired) {
    return (
      <div className="bg-white rounded-lg border border-red-200 shadow-sm p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-red-500 mr-3">
            <HiExclamation className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-800">アカウント削除予定</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                猶予期間が終了しました。アカウントは近日中に削除される予定です。引き続きサービスをご利用になりたい場合は、今すぐお支払い手続きを完了してください。
              </p>
              <div className="mt-4">
                <button
                  className="h-[48px] px-6 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-base sm:text-sm flex items-center justify-center"
                  onClick={handlePlanSelection}
                >
                  今すぐプランを選択して復活する
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 永久利用権ユーザーの場合は特別表示
  if (isPermanentUser()) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <HiShieldCheck className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h3 className="text-lg font-medium mb-2 sm:mb-0">現在のプラン</h3>
                <span className="text-sm font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800 inline-block">
                  永久利用
                </span>
              </div>
              {/* 永久利用権プラン情報 */}
              <PermanentPlanInfo />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ご利用プランなし（無料トライアル中）
  if (!subscription || subscription.status === 'trialing') {
    // トライアル期間が終了しているかどうかの判定を追加
    const now = new Date();
    const trialEndDate = userData?.trialEndsAt ? new Date(userData.trialEndsAt) : null;
    const isTrialActive = trialEndDate && now < trialEndDate;

    // トライアル残日数計算
    const daysRemaining = trialEndDate
      ? Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-blue-500 mr-3">
            <HiClock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium">
              {isTrialActive
                ? `無料トライアル中 (残り${daysRemaining}日)`
                : 'プランが選択されていません'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 text-justify">
              {isTrialActive
                ? `現在、無料トライアル期間をご利用中です。有料プランにアップグレードすると、すべての機能を継続してご利用いただけます。`
                : `現在、プランが選択されていません。プランを選択して、すべての機能をご利用ください。`}
            </p>
            <div className="mt-4">
              <button
                className="h-[48px] px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base sm:text-sm flex items-center justify-center"
                onClick={handlePlanSelection}
              >
                プランを選択
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // アクティブなご利用プラン
  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {subscription?.isPermanentUser ? (
                <div className="bg-blue-100 p-2 rounded-full">
                  <HiCheck className="h-5 w-5 text-blue-600" />
                </div>
              ) : subscription?.status === 'active' &&
                (subscription.plan.includes('business') ||
                  subscription.plan === 'business_plus') ? (
                // 法人プランの場合は青色
                <div className="bg-blue-100 p-2 rounded-full">
                  <HiCheck className="h-5 w-5 text-blue-600" />
                </div>
              ) : subscription?.status === 'active' ? (
                // 個人プランの場合は緑色
                <div className="bg-green-100 p-2 rounded-full">
                  <HiCheck className="h-5 w-5 text-green-600" />
                </div>
              ) : subscription?.status === 'trialing' ? (
                <div className="bg-blue-100 p-2 rounded-full">
                  <HiClock className="h-5 w-5 text-blue-600" />
                </div>
              ) : (
                <div className="bg-red-100 p-2 rounded-full">
                  <HiXCircle className="h-5 w-5 text-red-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-lg font-medium leading-relaxed flex-1">現在のプラン</h3>
                <span
                  className={`text-sm sm:text-base font-medium px-3 py-2 rounded-lg text-justify leading-tight break-words max-w-[220px] sm:max-w-none inline-block ${statusDisplay.className}`}
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                >
                  {statusDisplay.text}
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {!isPermanentUser() && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">次回更新日</span>
                    <span className="text-sm font-medium">
                      {subscription?.currentPeriodEnd
                        ? formatDate(subscription.currentPeriodEnd)
                        : '-'}
                    </span>
                  </div>
                )}

                {subscription?.status === 'trialing' && !isPermanentUser() && (
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mt-4">
                    <p className="text-sm text-blue-800 text-justify">
                      無料トライアル期間中です。
                      <strong>
                        {formatDate(subscription.trialEnd || subscription.currentPeriodEnd)}
                      </strong>
                      まで
                      {subscription.plan === 'monthly'
                        ? '月額'
                        : subscription.plan === 'yearly'
                          ? '年額'
                          : ''}
                      プランをお試しいただけます。
                    </p>
                  </div>
                )}

                {subscription?.cancelAtPeriodEnd && !isPermanentUser() && (
                  <div className="bg-amber-50 border border-amber-100 rounded-md p-4 mt-4">
                    <p className="text-sm text-amber-800 mb-3">
                      このプランは
                      <strong>{formatDate(subscription.currentPeriodEnd)}</strong>
                      にキャンセルされる予定です。それまではすべての機能をご利用いただけます。
                    </p>
                    <button
                      className="h-[48px] px-4 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-base sm:text-sm flex items-center justify-center"
                      onClick={handleReactivate}
                      disabled={reactivating}
                    >
                      {reactivating ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          処理中...
                        </>
                      ) : (
                        <>
                          <HiRefresh className="mr-2 h-4 w-4" />
                          プランを継続する
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {!isPermanentUser() &&
                !subscription?.cancelAtPeriodEnd &&
                (subscription?.status === 'active' || subscription?.status === 'trialing') && (
                  <div className="mt-8 pt-4 border-t border-gray-100">
                    <button
                      className="h-[48px] px-4 border border-gray-300 bg-white text-gray-400 rounded-md hover:text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors text-base sm:text-sm flex items-center justify-center"
                      onClick={handleCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          処理中...
                        </>
                      ) : (
                        <>
                          <HiXCircle className="mr-2 h-4 w-4" />
                          このプランを解約
                        </>
                      )}
                    </button>
                  </div>
                )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 🔥 解約申請フォームモーダル - 正しい位置に配置 */}
      {showCancelForm && subscription && (
        <CancelRequestForm
          subscription={{
            plan: subscription.plan,
            interval: subscription.interval || 'month',
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }}
          onClose={() => setShowCancelForm(false)}
          onSuccess={handleCancelRequestSuccess}
        />
      )}
    </>
  );
}