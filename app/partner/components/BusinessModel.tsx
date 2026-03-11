'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Repeat, CreditCard } from 'lucide-react';
import {
  CountUpNumber,
  fadeUpVariants,
  staggerContainer,
  useScrollInView,
} from './AnimationUtils';
import RevenueCalculator from './RevenueCalculator';

export default function BusinessModel() {
  const { ref: headRef, inView: headInView } = useScrollInView();
  const { ref: chartRef, inView: chartInView } = useScrollInView();
  const { ref: planRef, inView: planInView } = useScrollInView();

  return (
    <section id="business-model" className="bg-white">
      {/* フルワイド画像 */}
      <div className="relative h-[200px] sm:h-[280px] lg:h-[360px] overflow-hidden">
        <Image
          src="/images/partner/cont_img4.png"
          alt="収益モデル"
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 lg:pb-28 lg:pt-12">
        {/* 見出し */}
        <motion.div
          ref={headRef}
          initial="hidden"
          animate={headInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="mb-14 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold leading-tight text-[#2D3748] lg:text-4xl">
            名刺1箱の利益と、デジタル名刺1年分の利益を
            <br className="hidden sm:block" />
            比べてみてください。
          </h2>
          <p className="text-left text-[#5A6577] lg:text-center lg:text-lg">
            紙と違って、毎月届く安定収入。その具体的なシミュレーション。
          </p>
        </motion.div>

        {/* 利益比較 */}
        <motion.div
          ref={chartRef}
          initial="hidden"
          animate={chartInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mx-auto mb-16 grid max-w-3xl gap-6 lg:grid-cols-2"
        >
          {/* 名刺印刷の場合 */}
          <motion.div
            variants={fadeUpVariants}
            className="rounded-xl border border-[#E8E6E1] bg-white p-6"
          >
            <p className="mb-4 text-sm font-bold text-[#5A6577] lg:text-base">名刺印刷の場合</p>
            <div className="mb-4 space-y-2 text-sm text-[#5A6577] lg:text-base">
              <p>名刺100枚 × 1箱 = 売上 2,000円</p>
              <p>年間10回注文 = 売上 20,000円</p>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <p className="mb-1 text-xs text-[#5A6577] lg:text-sm">年間利益（1社あたり）</p>
                <CountUpNumber
                  end={4000}
                  prefix="¥"
                  className="font-[Inter] text-3xl font-bold text-[#2D3748]"
                />
              </div>
              {/* 棒グラフ */}
              <div className="flex h-24 w-12 items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={chartInView ? { height: '30%' } : { height: 0 }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' as const }}
                  className="w-full rounded-t-md bg-[#7B8794]"
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-[#5A6577] lg:text-sm">
              → 売り切り型。注文がなければ売上ゼロ。
            </p>
          </motion.div>

          {/* デジタル名刺を足した場合 */}
          <motion.div
            variants={fadeUpVariants}
            className="rounded-xl border border-[#2D8659]/20 bg-[#2D8659]/5 p-6"
          >
            <p className="mb-4 text-sm font-bold text-[#2D8659] lg:text-base">
              デジタル名刺を"足した"場合
            </p>
            <div className="mb-4 space-y-2 text-sm text-[#2D3748] lg:text-base">
              <p>デジタル名刺 月額1,000円 × 12ヶ月 = 利益 8,400円</p>
              <p>NFCシール 5枚 = 利益 4,000円</p>
              <p className="text-[#5A6577] lg:text-lg">＋ 名刺印刷はそのまま継続</p>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <p className="mb-1 text-xs text-[#5A6577] lg:text-sm">年間利益（1社あたり）</p>
                <CountUpNumber
                  end={16400}
                  prefix="¥"
                  className="font-[Inter] text-3xl font-bold text-[#2D8659]"
                />
              </div>
              {/* 棒グラフ */}
              <div className="flex h-24 w-12 items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={chartInView ? { height: '100%' } : { height: 0 }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' as const }}
                  className="w-full rounded-t-md bg-[#2D8659]"
                />
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#2D8659] lg:text-base">
              → 利益が約4倍に。しかも毎月自動的に積み上がる。
            </p>
          </motion.div>
        </motion.div>

        {/* 収益シミュレーター */}
        <div className="mb-16">
          <RevenueCalculator />
        </div>

        {/* 料金モデル */}
        <motion.div
          ref={planRef}
          initial="hidden"
          animate={planInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
        >
          <motion.h3
            variants={fadeUpVariants}
            className="mb-2 text-center text-xl font-bold text-[#2D3748] lg:text-2xl"
          >
            2つの料金モデルをご用意
          </motion.h3>
          <motion.p
            variants={fadeUpVariants}
            className="mb-8 text-center text-sm text-[#5A6577] lg:text-base"
          >
            御社の事業規模に合わせてお選びいただけます
          </motion.p>

          <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
            {/* 月額型 */}
            <motion.div
              variants={fadeUpVariants}
              className="relative overflow-hidden rounded-xl border-2 border-[#1B2A4A] bg-white"
            >
              <div className="bg-[#1B2A4A] px-6 py-3 text-center">
                <span className="text-sm font-bold text-white">月額プラン</span>
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-baseline justify-center gap-1">
                  <span className="font-[Inter] text-3xl font-bold text-[#1B2A4A]">¥30,000</span>
                  <span className="text-sm text-[#5A6577]">〜/月</span>
                </div>
                <ul className="mb-5 space-y-2.5 text-sm text-[#2D3748] lg:text-base">
                  <li className="flex items-start gap-2">
                    <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-[#1B2A4A]" />
                    <span>初期費用ゼロで始められる</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-[#1B2A4A]" />
                    <span>3つのプランから選択<br /><span className="text-xs text-[#5A6577] lg:text-sm">ベーシック / プロ / プレミアム</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-[#1B2A4A]" />
                    <span>いつでもプラン変更可能</span>
                  </li>
                </ul>
                <p className="rounded-lg bg-[#1B2A4A]/5 px-3 py-2 text-center text-xs font-semibold text-[#1B2A4A]">
                  まずは小さく始めたい方に
                </p>
              </div>
            </motion.div>

            {/* 買取型 */}
            <motion.div
              variants={fadeUpVariants}
              className="relative overflow-hidden rounded-xl border-2 border-[#B8860B] bg-white"
            >
              <div className="bg-[#B8860B] px-6 py-3 text-center">
                <span className="text-sm font-bold text-white">買取プラン</span>
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-baseline justify-center gap-1">
                  <span className="font-[Inter] text-3xl font-bold text-[#1B2A4A]">¥600,000</span>
                  <span className="text-sm text-[#5A6577]">一括</span>
                </div>
                <ul className="mb-5 space-y-2.5 text-sm text-[#2D3748] lg:text-base">
                  <li className="flex items-start gap-2">
                    <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-[#B8860B]" />
                    <span>アカウント数の上限なし</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-[#B8860B]" />
                    <span>月額保守費 ¥10,000のみ<br /><span className="text-xs text-[#5A6577] lg:text-sm">アップデート・サポート込み</span></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-[#B8860B]" />
                    <span>長期運用ほどコストメリット大</span>
                  </li>
                </ul>
                <p className="rounded-lg bg-[#B8860B]/8 px-3 py-2 text-center text-xs font-semibold text-[#B8860B]">
                  本格的に展開したい方に
                </p>
              </div>
            </motion.div>
          </div>

          <motion.p
            variants={fadeUpVariants}
            className="mt-6 text-center text-sm text-[#5A6577]"
          >
            ※ 詳しい料金・プラン詳細は資料をご覧ください
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
