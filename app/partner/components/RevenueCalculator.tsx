'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, Info } from 'lucide-react';
import { fadeUpVariants, useScrollInView } from './AnimationUtils';
import { PartnerEvents } from '../utils/analytics';

/* ── プラットフォーム料金定義 ── */
const PLANS = [
  { name: 'ベーシック', limit: 300, monthly: 30_000 },
  { name: 'プロ', limit: 600, monthly: 50_000 },
  { name: 'プレミアム', limit: 1_000, monthly: 80_000 },
] as const;

const BUYOUT_PRICE = 600_000;
const BUYOUT_MAINTENANCE = 10_000;

const CORP_USERS_PER_ACCOUNT = 30; // 法人ビジネスプラン（最大30名）

/* ── 固定ランニングコスト ── */
const FIXED_COSTS = {
  supabase: 3_750,
  vercel: 3_000,
  domain: 250,
};
const TOTAL_FIXED = FIXED_COSTS.supabase + FIXED_COSTS.vercel + FIXED_COSTS.domain;

/* ── スライダー ── */
function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
  prefix = '',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  prefix?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-[#2D3748] lg:text-base">{label}</label>
        <span className="font-[Inter] text-sm font-bold text-[#1B2A4A]">
          {prefix}
          {value.toLocaleString()}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#4A6FA5]"
      />
      <div className="mt-1 flex justify-between text-[10px] text-[#7B8794]">
        <span>
          {prefix}
          {min.toLocaleString()}
          {suffix}
        </span>
        <span>
          {prefix}
          {max.toLocaleString()}
          {suffix}
        </span>
      </div>
    </div>
  );
}

/* ── プラン自動判定 ── */
function getMatchingPlan(totalAccounts: number) {
  for (const plan of PLANS) {
    if (totalAccounts <= plan.limit) return plan;
  }
  return PLANS[PLANS.length - 1];
}

export default function RevenueCalculator() {
  const { ref, inView } = useScrollInView();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInteracted = useRef(false);

  // 入力値
  const [individualUsers, setIndividualUsers] = useState(50);
  const [individualPrice, setIndividualPrice] = useState(500);
  const [corpAccounts, setCorpAccounts] = useState(5);
  const [corpPrice, setCorpPrice] = useState(6_000);
  const [isBuyout, setIsBuyout] = useState(false);

  // 総アカウント数
  const totalAccounts = individualUsers + corpAccounts * CORP_USERS_PER_ACCOUNT;
  const plan = useMemo(() => getMatchingPlan(totalAccounts), [totalAccounts]);
  const overLimit = totalAccounts > PLANS[PLANS.length - 1].limit;

  // 月間売上
  const monthlyRevenue = individualUsers * individualPrice + corpAccounts * corpPrice;

  // 月間コスト
  const platformFee = isBuyout ? BUYOUT_MAINTENANCE : plan.monthly;
  const monthlyCost = platformFee + TOTAL_FIXED;

  // 利益
  const monthlyProfit = monthlyRevenue - monthlyCost;
  const yearlyProfit = monthlyProfit * 12;

  // 買取の回収期間
  const buyoutPayback = monthlyProfit > 0 ? Math.ceil(BUYOUT_PRICE / monthlyProfit) : null;

  // 月額との比較
  const monthlyPlanCost = plan.monthly + TOTAL_FIXED;
  const buyoutMonthlyCost = BUYOUT_MAINTENANCE + TOTAL_FIXED;
  const monthlySaving = monthlyPlanCost - buyoutMonthlyCost;
  const buyoutBreakeven = monthlySaving > 0 ? Math.ceil(BUYOUT_PRICE / monthlySaving) : null;

  // GA4 tracking
  const trackCalculator = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      PartnerEvents.calculatorUse(totalAccounts, monthlyRevenue);
    }, 1000);
  }, [totalAccounts, monthlyRevenue]);

  useEffect(() => {
    if (!hasInteracted.current) return;
    trackCalculator();
  }, [trackCalculator]);

  const handleChange = (setter: (v: number) => void) => (v: number) => {
    hasInteracted.current = true;
    setter(v);
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUpVariants}
      className="mx-auto max-w-4xl rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex rounded-lg bg-[#1B2A4A]/5 p-2.5">
          <Calculator className="h-5 w-5 text-[#1B2A4A]" />
        </div>
        <h3 className="text-lg font-bold text-[#2D3748] lg:text-xl">
          収益シミュレーター
        </h3>
      </div>

      <p className="mb-6 text-justify text-sm text-[#5A6577] lg:text-base">
        スライダーを動かすだけで、月間利益がすぐに分かります。
      </p>

      {/* 契約タイプ切替 */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <button
          onClick={() => setIsBuyout(false)}
          className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-bold transition-all ${
            !isBuyout
              ? 'border-[#1B2A4A] bg-[#1B2A4A] text-white shadow-md'
              : 'border-[#D5D2CC] bg-white text-[#5A6577] hover:border-[#1B2A4A]/40 hover:text-[#2D3748]'
          }`}
        >
          月額プラン
        </button>
        <button
          onClick={() => setIsBuyout(true)}
          className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-bold transition-all ${
            isBuyout
              ? 'border-[#1B2A4A] bg-[#1B2A4A] text-white shadow-md'
              : 'border-[#D5D2CC] bg-white text-[#5A6577] hover:border-[#1B2A4A]/40 hover:text-[#2D3748]'
          }`}
        >
          買取プラン
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 入力 */}
        <div className="space-y-5">
          {/* 個人プラン */}
          <div className="rounded-lg bg-[#F5F3EF] p-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#5A6577]">
              個人プラン
            </p>
            <div className="space-y-5">
              <SliderInput
                label="月額料金"
                value={individualPrice}
                onChange={handleChange(setIndividualPrice)}
                min={300}
                max={1500}
                step={50}
                prefix="¥"
              />
              <SliderInput
                label="ユーザー数"
                value={individualUsers}
                onChange={handleChange(setIndividualUsers)}
                min={0}
                max={500}
                step={10}
                suffix="人"
              />
            </div>
          </div>

          {/* 法人ビジネスプラン */}
          <div className="rounded-lg bg-[#F5F3EF] p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#5A6577]">
              法人ビジネスプラン
            </p>
            <p className="mb-4 text-[10px] text-[#7B8794]">1社あたり最大{CORP_USERS_PER_ACCOUNT}名</p>
            <div className="space-y-5">
              <SliderInput
                label="月額料金（1社）"
                value={corpPrice}
                onChange={handleChange(setCorpPrice)}
                min={3000}
                max={15000}
                step={500}
                prefix="¥"
              />
              <SliderInput
                label="契約数"
                value={corpAccounts}
                onChange={handleChange(setCorpAccounts)}
                min={0}
                max={50}
                step={1}
                suffix="社"
              />
            </div>
          </div>

          {/* 総アカウント数 & プラン判定 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-[#4A6FA5]/20 bg-[#4A6FA5]/5 px-4 py-3">
              <span className="text-sm text-[#2D3748]">総アカウント数</span>
              <span className="font-[Inter] text-lg font-bold text-[#1B2A4A]">
                {totalAccounts.toLocaleString()}
              </span>
            </div>
            {!isBuyout && (
              <div className="flex items-center justify-between rounded-lg border border-[#4A6FA5]/20 bg-[#4A6FA5]/5 px-4 py-3">
                <span className="text-sm text-[#2D3748]">適用プラン</span>
                <span className="text-sm font-bold text-[#1B2A4A]">
                  {overLimit ? '上限超過（要相談）' : `${plan.name}（¥${plan.monthly.toLocaleString()}/月）`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 結果 */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* 月間収支 */}
          <div className="rounded-xl bg-[#1B2A4A] p-5 text-white">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/60">
              月間収支
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">売上</span>
                <span className="font-[Inter] text-lg font-bold">
                  ¥{monthlyRevenue.toLocaleString()}
                </span>
              </div>
              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">プラットフォーム料金</span>
                  <span className="font-[Inter] text-sm text-white/80">
                    -¥{platformFee.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm text-white/80">インフラ費用</span>
                  <span className="font-[Inter] text-sm text-white/80">
                    -¥{TOTAL_FIXED.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="border-t border-white/20 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">月間利益</span>
                  <span
                    className={`font-[Inter] text-2xl font-bold ${
                      monthlyProfit >= 0 ? 'text-[#6DD4A0]' : 'text-[#FF8A80]'
                    }`}
                  >
                    {monthlyProfit >= 0 ? '' : '-'}¥{Math.abs(monthlyProfit).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 年間見通し */}
          <div className="rounded-xl bg-[#2D8659]/10 p-5">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#2D8659]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2D8659]">
                年間見通し
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#2D3748]">年間利益</span>
                <span className="font-[Inter] text-lg font-bold text-[#2D3748]">
                  ¥{yearlyProfit.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#2D3748]">3年累計利益</span>
                <span className="font-[Inter] text-xl font-bold text-[#2D8659]">
                  ¥{(yearlyProfit * 3).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 買取プラン情報 */}
          {isBuyout && (
            <div className="rounded-xl border border-[#B8860B]/20 bg-[#B8860B]/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-[#B8860B]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#B8860B]">
                  買取プラン詳細
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#2D3748]">初期費用（買取）</span>
                  <span className="font-[Inter] font-bold text-[#2D3748]">
                    ¥{BUYOUT_PRICE.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#2D3748]">月額保守費</span>
                  <span className="font-[Inter] font-bold text-[#2D3748]">
                    ¥{BUYOUT_MAINTENANCE.toLocaleString()}/月
                  </span>
                </div>
                {buyoutPayback && monthlyProfit > 0 && (
                  <div className="mt-2 border-t border-[#B8860B]/20 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#2D3748]">初期費用の回収</span>
                      <span className="font-[Inter] font-bold text-[#B8860B]">
                        約{buyoutPayback}ヶ月
                      </span>
                    </div>
                  </div>
                )}
                {buyoutBreakeven && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#2D3748]">月額プランよりお得になるまで</span>
                    <span className="font-[Inter] font-bold text-[#2D8659]">
                      {buyoutBreakeven}ヶ月
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 月額との比較 */}
          {!isBuyout && (
            <div className="rounded-xl border border-[#B8860B]/20 bg-[#B8860B]/5 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-[#B8860B]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#B8860B]">
                  買取プランとの比較
                </p>
              </div>
              <p className="text-sm leading-relaxed text-[#2D3748]">
                買取プラン（¥{BUYOUT_PRICE.toLocaleString()} + 保守¥{BUYOUT_MAINTENANCE.toLocaleString()}/月）なら、
                {buyoutBreakeven ? (
                  <span className="font-bold text-[#2D8659]">
                    {buyoutBreakeven}ヶ月目からお得
                  </span>
                ) : (
                  <span>同等のコスト</span>
                )}
                になります。
              </p>
            </div>
          )}

          {/* コスト内訳 */}
          <details className="rounded-xl border border-[#E8E6E1] bg-[#FAFAF8] px-5 py-3">
            <summary className="cursor-pointer text-xs font-semibold text-[#5A6577]">
              コスト内訳を見る
            </summary>
            <div className="mt-3 space-y-1.5 text-xs text-[#5A6577]">
              <div className="flex justify-between">
                <span>プラットフォーム料金</span>
                <span>¥{platformFee.toLocaleString()}/月</span>
              </div>
              <div className="flex justify-between">
                <span>Supabase Pro</span>
                <span>¥{FIXED_COSTS.supabase.toLocaleString()}/月</span>
              </div>
              <div className="flex justify-between">
                <span>Vercel Pro</span>
                <span>¥{FIXED_COSTS.vercel.toLocaleString()}/月</span>
              </div>
              <div className="flex justify-between">
                <span>ドメイン</span>
                <span>¥{FIXED_COSTS.domain.toLocaleString()}/月</span>
              </div>
              <div className="flex justify-between border-t border-[#E8E6E1] pt-1.5 font-semibold text-[#2D3748]">
                <span>月間コスト合計</span>
                <span>¥{monthlyCost.toLocaleString()}/月</span>
              </div>
            </div>
          </details>

          <p className="text-xs text-[#5A6577]">
            ※ NFCシール販売利益は含まれていません（別途上乗せされます）
          </p>
        </div>
      </div>
    </motion.div>
  );
}
