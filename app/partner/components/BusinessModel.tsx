'use client';

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
    <section id="business-model" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4">
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
            className="mb-6 text-center text-xl font-bold text-[#2D3748] lg:text-2xl"
          >
            2つの料金モデルをご用意
          </motion.h3>
          <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
            <motion.div
              variants={fadeUpVariants}
              className="rounded-xl border border-[#E8E6E1] bg-white p-6 text-center sm:text-left"
            >
              <div className="mb-3 inline-flex rounded-lg bg-[#4A6FA5]/10 p-2.5">
                <Repeat className="h-5 w-5 text-[#4A6FA5]" />
              </div>
              <h4 className="mb-2 text-lg font-bold text-[#2D3748] lg:text-xl">月額型</h4>
              <p className="mb-3 text-justify text-sm text-[#5A6577] lg:text-base">
                初期費用を抑えて始められる。ユーザー数に応じたプラン制。
              </p>
              <p className="text-xs text-[#4A6FA5]">小規模スタートに最適</p>
            </motion.div>

            <motion.div
              variants={fadeUpVariants}
              className="rounded-xl border border-[#E8E6E1] bg-white p-6 text-center sm:text-left"
            >
              <div className="mb-3 inline-flex rounded-lg bg-[#4A6FA5]/10 p-2.5">
                <CreditCard className="h-5 w-5 text-[#4A6FA5]" />
              </div>
              <h4 className="mb-2 text-lg font-bold text-[#2D3748] lg:text-xl">買取型</h4>
              <p className="mb-3 text-sm text-[#5A6577] lg:text-base">
                システムを完全に自社所有。大規模展開向け。
              </p>
              <p className="text-xs text-[#4A6FA5]">大規模展開に最適</p>
            </motion.div>
          </div>
          <motion.p
            variants={fadeUpVariants}
            className="mt-4 text-center text-sm text-[#5A6577]"
          >
            ※ 詳細な料金表は資料に記載しています
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
