'use client';

import { motion } from 'framer-motion';
import { Check, Gift } from 'lucide-react';
import {
  fadeUpVariants,
  staggerContainer,
  useScrollInView,
} from './AnimationUtils';

const benefits = [
  {
    title: 'システム利用料 3ヶ月間完全無料',
    original: '通常 月額30,000円〜',
    free: '0円',
  },
  {
    title: 'NFCシール サンプル20枚を無償提供',
    original: '通常 1枚550円 × 20枚 = 11,000円相当',
    free: '0円',
  },
  {
    title: '御社ブランドの初期設定を無料代行',
    original: '通常 初期設定費 100,000円',
    free: '0円',
  },
  {
    title: '営業支援ツール一式を無料提供',
    original: '提案書テンプレート・デモ環境・営業台本',
    free: '無料',
  },
  {
    title: '専任担当による導入サポート',
    original: 'オンライン相談 月2回まで',
    free: '無料',
  },
];

export default function OfferSection() {
  const { ref: headRef, inView: headInView } = useScrollInView();
  const { ref: cardRef, inView: cardInView } = useScrollInView();

  return (
    <section id="offer" className="bg-[#F5F3EF] py-20 lg:py-28">
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
            まずは3ヶ月、無料で体験してください。
          </h2>
          <p className="text-left text-[#5A6577] lg:text-center lg:text-lg">
            本気で検討いただける方に、本気の特典をご用意しました。
          </p>
        </motion.div>

        {/* オファーカード */}
        <motion.div
          ref={cardRef}
          initial="hidden"
          animate={cardInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="mx-auto max-w-2xl"
        >
          <div className="overflow-hidden rounded-2xl border border-[#E8E6E1] shadow-lg">
            {/* カードヘッダー - 濃紺に変更 */}
            <div className="bg-[#1B2A4A] px-6 py-4">
              <div className="flex items-center justify-center gap-2 text-[#F5F3EF]">
                <Gift className="h-5 w-5" />
                <span className="text-lg font-bold">
                  パートナー無料トライアルプログラム
                </span>
              </div>
            </div>

            {/* 特典リスト */}
            <div className="bg-white p-6 lg:p-8">
              <motion.div
                initial="hidden"
                animate={cardInView ? 'visible' : 'hidden'}
                variants={staggerContainer}
                className="space-y-4"
              >
                {benefits.map((b) => (
                  <motion.div
                    key={b.title}
                    variants={fadeUpVariants}
                    className="flex gap-3"
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2D8659]">
                        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-[#2D3748] lg:text-lg">{b.title}</p>
                      <p className="text-sm text-[#5A6577] lg:text-base">
                        <span className="line-through">{b.original}</span>
                        <span className="ml-2 font-bold text-[#2D8659]">
                          → {b.free}
                        </span>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* 合計 */}
              <div className="mt-8 rounded-xl p-5 text-center" style={{ background: 'rgba(27, 42, 74, 0.04)' }}>
                <p className="mb-1 text-sm text-[#5A6577]">特典合計</p>
                <p className="text-[#2D3748]">
                  <span className="text-lg line-through lg:text-xl">201,000円相当</span>
                  <span className="mx-2 text-2xl lg:text-3xl">→</span>
                  <span className="text-3xl font-bold text-[#B8860B] lg:text-4xl">無料</span>
                </p>
              </div>

              {/* 注釈 */}
              <div className="mt-6 space-y-1 text-justify text-xs text-[#5A6577] lg:text-sm">
                <p>※ トライアル期間中に解約しても、費用は一切発生しません。</p>
                <p>
                  ※
                  トライアル中に登録されたデータはそのまま引き継がれます。
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
