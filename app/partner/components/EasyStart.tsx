'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Palette,
  Rocket,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import {
  fadeUpVariants,
  staggerContainer,
  useScrollInView,
} from './AnimationUtils';
import { PartnerEvents } from '../utils/analytics';

const steps = [
  {
    icon: Phone,
    title: '無料相談',
    desc: '30分のオンライン相談で、御社に最適なプランをご提案します。',
    duration: '最短当日',
  },
  {
    icon: Palette,
    title: '設定',
    desc: 'ロゴとカラーをお知らせください。御社ブランドの管理画面を構築します。',
    duration: '最短3営業日',
  },
  {
    icon: Rocket,
    title: '販売開始',
    desc: 'お客様への提案をスタート。営業ツール一式もご提供します。',
    duration: '設定完了後すぐ',
  },
];

const faqs = [
  {
    q: 'ITに詳しくないけど、運用できる？',
    a: '管理画面は日本語で、直感的に操作できます。マニュアルと動画もご用意。困ったらいつでもサポートに相談できます。',
  },
  {
    q: '本当に印刷業界のことをわかっているの？',
    a: '代表の宮川は2013年から12年間、プラスチックカード印刷のサービス「カードの達人」を運営してきました。オフセット印刷の色校正から箔押し加工まで、印刷の現場を知っている人間がサポートします。',
  },
  {
    q: 'お客様にどうやって説明すればいい？',
    a: '営業トーク台本、提案書テンプレート、デモ用アカウントをご提供します。そのまま使えます。',
  },
  {
    q: 'NFCシールの在庫管理が面倒では？',
    a: 'ご注文ごとに弊社から直接お客様へ発送することも可能です。在庫リスクゼロで始められます。',
  },
  {
    q: '最低契約期間はある？',
    a: '月額プランに最低契約期間はありません。いつでも解約可能です。',
  },
  {
    q: '既存のお客様に嫌がられない？',
    a: '押し売りではなく「新しい選択肢」としてのご提案です。紙の名刺の注文はそのまま継続できます。',
  },
  {
    q: 'うまくいかなかったら？',
    a: '3ヶ月の無料トライアルがあります。リスクなしでお試しいただけます。',
  },
  {
    q: 'NFCって難しそうですが、どういう仕組みですか？',
    a: '駅の改札でスマホをかざしたり、コンビニでタッチ決済したりするのと同じ仕組みです。代表の宮川がICチップ入りカードの印刷を長年手がけていた経験から、この技術を名刺に応用しました。スマホに小さなシールを貼るだけで、かざした相手にデジタル名刺のページが瞬時に開きます。QRコードのようにカメラを起動する手間もありません。',
  },
];

export default function EasyStart() {
  const { ref: headRef, inView: headInView } = useScrollInView();
  const { ref: stepRef, inView: stepInView } = useScrollInView();
  const { ref: faqRef, inView: faqInView } = useScrollInView();
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());

  const toggleFaq = (index: number) => {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        PartnerEvents.faqOpen(faqs[index].q);
      }
      return next;
    });
  };

  return (
    <section id="easy-start" className="bg-white py-20 lg:py-28">
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
            パソコンでメールが打てれば、大丈夫です。
          </h2>
          <p className="text-left text-[#5A6577] lg:text-center lg:text-lg">
            ITの専門知識は、一切必要ありません。
          </p>
        </motion.div>

        {/* 3ステップ */}
        <motion.div
          ref={stepRef}
          initial="hidden"
          animate={stepInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mx-auto mb-20 grid max-w-5xl gap-10 sm:grid-cols-3"
        >
          {steps.map((step, i) => (
            <motion.div key={step.title} variants={fadeUpVariants} className="flex flex-col items-center">
              <div className="relative flex w-full flex-col items-center">
                {/* 矢印（モバイルは下向き、PCは右向き） */}
                {i < steps.length - 1 && (
                  <>
                    <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 sm:hidden">
                      <ArrowRight className="h-5 w-5 rotate-90 text-[#7B8794]" />
                    </div>
                    <div className="absolute -right-8 top-1/2 hidden -translate-y-1/2 sm:block">
                      <ArrowRight className="h-6 w-6 text-[#7B8794]" />
                    </div>
                  </>
                )}

                <div className="w-full rounded-xl border border-[#E8E6E1] bg-white p-6 text-center shadow-sm">
                  <div className="mb-1 text-xs font-semibold tracking-wider text-[#4A6FA5]">
                    STEP {i + 1}
                  </div>
                  <div className="mx-auto mb-3 inline-flex rounded-lg bg-[#4A6FA5]/10 p-3">
                    <step.icon className="h-6 w-6 text-[#4A6FA5]" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[#2D3748] lg:text-xl">
                    {step.title}
                  </h3>
                  <p className="mb-3 text-justify text-sm leading-relaxed text-[#5A6577] lg:text-base">
                    {step.desc}
                  </p>
                  <span className="inline-block rounded-full bg-[#4A6FA5]/10 px-3 py-1 text-xs font-medium text-[#4A6FA5]">
                    {step.duration}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Q&A */}
        <motion.div
          ref={faqRef}
          initial="hidden"
          animate={faqInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="mx-auto max-w-3xl"
        >
          <h3 className="mb-6 text-center text-xl font-bold text-[#2D3748] lg:text-2xl">
            よくある不安にお答えします
          </h3>
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openIndexes.has(i);
              return (
                <div
                  key={i}
                  className="rounded-xl border border-[#E8E6E1] bg-white shadow-sm"
                >
                  <button
                    onClick={() => toggleFaq(i)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="pr-4 font-medium text-[#2D3748] lg:text-lg">
                      Q. {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="shrink-0"
                    >
                      <ChevronDown className="h-5 w-5 text-[#5A6577]" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[#E8E6E1] px-5 py-4">
                          <p className="text-justify text-sm leading-relaxed text-[#5A6577] lg:text-base">
                            {faq.a}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
