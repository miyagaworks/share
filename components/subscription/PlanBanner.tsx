// components/subscription/PlanBanner.tsx - 完全修正版
'use client';
import React from 'react';
import { usePlanInfo } from '@/hooks/usePlanInfo';
import { HiClock } from 'react-icons/hi';
interface PlanBannerProps {
  className?: string;
}
export function PlanBanner({ className = '' }: PlanBannerProps) {
  const planInfo = usePlanInfo();
  // データ取得中またはエラー時は非表示
  if (!planInfo) return null;
  // 🚀 トライアルバナー（個人ユーザーのみ）
  if (planInfo.shouldShowTrialBanner) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* 🔧 修正：アニメーション付きの時計アイコン */}
            <div className="w-8 h-8 bg-blue-500 rounded-full mr-3 flex items-center justify-center flex-shrink-0">
              <HiClock className="h-4 w-4 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-1">無料トライアル期間中</h3>
              <p className="text-sm text-blue-700">
                あと○日で終了します。プランをアップグレードして継続利用できます。
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              // スクロール処理
              const targetElement = document.getElementById('subscription-plans');
              if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            プランを選択
          </button>
        </div>
      </div>
    );
  }
  // 🚀 法人プラン表示（法人ユーザー・管理者）- プレミアム機能バナーを削除
  if (planInfo.shouldShowCorporateFeatures && planInfo.hasActivePlan) {
    const getBannerStyle = () => {
      if (planInfo.isPermanentUser) {
        return {
          bgClass: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200',
          iconClass: 'bg-gradient-to-r from-amber-500 to-yellow-500',
          textClass: 'text-amber-900',
          subTextClass: 'text-amber-700',
        };
      } else {
        return {
          bgClass: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
          iconClass: 'bg-gradient-to-r from-green-500 to-emerald-500',
          textClass: 'text-green-900',
          subTextClass: 'text-green-700',
        };
      }
    };
    const style = getBannerStyle();
    return (
      <div className={`${style.bgClass} border rounded-lg p-4 mb-6 ${className}`}>
        <div className="flex items-center">
          <div
            className={`w-8 h-8 ${style.iconClass} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-medium ${style.textClass} mb-1`}>
              {planInfo.displayName}が有効です
            </h3>
            <p className={`text-sm ${style.subTextClass}`}>
              {planInfo.isPermanentUser
                ? '永久利用権により全ての機能をご利用いただけます。'
                : planInfo.isCorpAdmin
                  ? '法人管理者として全ての機能をご利用いただけます。'
                  : '法人メンバーとして法人機能をご利用いただけます。'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  // その他の場合は何も表示しない（プレミアム機能バナーを削除）
  return null;
}