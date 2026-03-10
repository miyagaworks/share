// components/subscription/EnhancedTrialBanner.tsx
'use client';
import { useState, useEffect } from 'react';
import { HiArrowRight, HiSparkles, HiClock } from 'react-icons/hi';
import { DEFAULT_PRIMARY_COLOR } from '@/lib/brand/defaults';

interface EnhancedTrialBannerProps {
  trialEndDate: string | null;
}

export default function EnhancedTrialBanner({ trialEndDate }: EnhancedTrialBannerProps) {
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    if (trialEndDate) {
      const end = new Date(trialEndDate);
      const now = new Date();
      const diffTime = end.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays);
    }
  }, [trialEndDate]);

  // プラン選択のクリックハンドラー
  const handlePlanSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    // 現在のページが subscription ページかチェック
    if (window.location.pathname === '/dashboard/subscription') {
      // 既に subscription ページにいる場合、直接スクロール
      const targetElement = document.getElementById('subscription-plans');
      if (targetElement) {
        const elementRect = targetElement.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset;
        const headerHeight = 80;
        const offset = 30;
        const scrollPosition = absoluteElementTop - headerHeight - offset;

        window.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        });
        return;
      }
    }
    // subscription ページに遷移
    window.location.href = '/dashboard/subscription#subscription-plans';
  };

  // 残り日数が0以下またはトライアル期間でない場合は表示しない
  if (!trialEndDate || daysRemaining <= 0) return null;

  return (
    <div className="relative mb-10 sm:mb-12 overflow-hidden rounded-xl shadow-xl">
      {/* 🔧 修正：青系グラデーション背景に変更 */}
      <div
        className="relative px-4 sm:px-6 py-4 sm:py-6"
        style={{
          background: `linear-gradient(135deg, ${DEFAULT_PRIMARY_COLOR} 0%, #1E40AF 50%, #1E3A8A 100%)`,
        }}
      >
        {/* スマホ対応のレイアウト */}
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* 🔧 修正：アイコンを確実に表示 */}
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-lg">
              <HiClock className="h-8 w-8 sm:h-8 sm:w-8 text-blue-100 drop-shadow-md" />
            </div>
            <div className="text-white">
              <h3 className="text-lg sm:text-xl font-bold mb-1 flex items-center">
                無料トライアル期間中
                <HiSparkles className="ml-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-200 animate-pulse" />
              </h3>
              <p className="text-white/90 text-sm text-justify">
                あと
                <span className="font-bold text-base sm:text-lg mx-1 text-yellow-300">
                  {daysRemaining}
                </span>
                日で終了します。プランをアップグレードして継続利用できます。
              </p>
            </div>
          </div>
          {/* ボタンエリア */}
          <div className="flex items-center justify-center sm:justify-end">
            <button
              onClick={handlePlanSelection}
              className="h-[48px] bg-white text-blue-600 px-4 sm:px-6 rounded-lg font-semibold hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2 text-base sm:text-sm"
            >
              <span>プランを選択</span>
              <HiArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* プログレスバー */}
        <div className="mt-4 relative">
          <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
            <div
              className="bg-gradient-to-r from-yellow-300 to-yellow-400 h-2 rounded-full transition-all duration-1000 ease-out shadow-lg"
              style={{
                width: `${Math.max(10, ((7 - daysRemaining) / 7) * 100)}%`,
              }}
            />
          </div>
          <p className="text-white/80 text-xs mt-1 text-right">
            7日間のうち {7 - daysRemaining}日経過
          </p>
        </div>
      </div>
    </div>
  );
}