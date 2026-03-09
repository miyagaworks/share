'use client';

import { useState } from 'react';
import Image from 'next/image';
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
    <section id="easy-start" className="bg-white">
      {/* フルワイド画像 */}
      <div className="relative h-[200px] sm:h-[280px] lg:h-[360px] overflow-hidden">
        <Image
          src="/images/partner/cont_img6.png"
          alt="簡単スタート"
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
          className="mx-auto mb-20 max-w-4xl"
        >
          <div className="relative">
            {/* 接続線（PC） */}
            <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-[#D5D2CC] to-transparent sm:block" />

            <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
              {steps.map((step, i) => (
                <motion.div key={step.title} variants={fadeUpVariants} className="relative flex flex-col items-center">
                  {/* ステップ番号 */}
                  <div className="relative z-10 mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#1B2A4A] bg-white">
                    <div className="text-center">
                      <span className="block text-[10px] font-bold tracking-widest text-[#5A6577]">STEP</span>
                      <span className="block font-[Inter] text-2xl font-bold leading-none text-[#1B2A4A]">{i + 1}</span>
                    </div>
                  </div>

                  {/* 矢印（モバイルのみ） */}
                  {i < steps.length - 1 && (
                    <div className="mb-4 sm:hidden">
                      <ArrowRight className="h-4 w-4 rotate-90 text-[#D5D2CC]" />
                    </div>
                  )}

                  {/* コンテンツ */}
                  <div className="text-center">
                    <div className="mx-auto mb-3 inline-flex rounded-full bg-[#1B2A4A]/[0.04] p-3">
                      <step.icon className="h-5 w-5 text-[#1B2A4A]" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-[#1B2A4A] lg:text-xl">
                      {step.title}
                    </h3>
                    <p className="mx-auto mb-3 max-w-[240px] text-sm leading-relaxed text-[#5A6577] lg:text-base">
                      {step.desc}
                    </p>
                    <span className="inline-block rounded-full border border-[#1B2A4A]/15 px-4 py-1 text-xs font-medium text-[#1B2A4A]">
                      {step.duration}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Q&A */}
        <motion.div
          ref={faqRef}
          initial="hidden"
          animate={faqInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="mx-auto max-w-3xl"
        >
          <div className="mb-8 text-center">
            <span className="mb-2 inline-block text-xs font-bold tracking-widest text-[#5A6577]">FAQ</span>
            <h3 className="text-xl font-bold text-[#1B2A4A] lg:text-2xl">
              よくある不安にお答えします
            </h3>
          </div>
          <div className="divide-y divide-[#E8E6E1] rounded-2xl border border-[#E8E6E1] bg-white">
            {faqs.map((faq, i) => {
              const isOpen = openIndexes.has(i);
              return (
                <div key={i}>
                  <button
                    onClick={() => toggleFaq(i)}
                    className="flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-[#FAFAF8]"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B2A4A] text-xs font-bold text-white">
                      Q
                    </span>
                    <span className="flex-1 text-sm font-medium text-[#2D3748] lg:text-base">
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="shrink-0"
                    >
                      <ChevronDown className="h-4 w-4 text-[#7B8794]" />
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
                        <div className="flex gap-4 px-6 pb-5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#B8860B]/30 text-xs font-bold text-[#B8860B]">
                            A
                          </span>
                          <p className="flex-1 text-justify text-sm leading-relaxed text-[#5A6577] lg:text-base">
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
