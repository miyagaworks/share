'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  TrendingDown,
  Globe,
  UserX,
  TrendingUp,
  Check,
  Square,
} from 'lucide-react';
import {
  CountUpNumber,
  fadeUpVariants,
  staggerContainer,
  useScrollInView,
} from './AnimationUtils';

const stats = [
  {
    icon: TrendingDown,
    value: 15,
    suffix: '%',
    label: '名刺印刷市場',
    desc: '過去5年間で市場規模が縮小',
    color: 'text-[#9B4D3A]',
    bg: 'bg-[#9B4D3A]/10',
  },
  {
    icon: Globe,
    value: 40,
    suffix: '%',
    label: 'ネット印刷シェア',
    desc: '低価格ネット印刷の台頭',
    color: 'text-[#9B4D3A]',
    bg: 'bg-[#9B4D3A]/10',
  },
  {
    icon: UserX,
    value: 35,
    suffix: '%',
    label: '名刺不要派の増加',
    desc: 'リモートワーク普及が加速',
    color: 'text-[#9B4D3A]',
    bg: 'bg-[#9B4D3A]/10',
  },
  {
    icon: TrendingUp,
    value: 6.8,
    suffix: '%',
    label: 'デジタル名刺市場',
    desc: '年間成長率（CAGR）',
    color: 'text-[#2D8659]',
    bg: 'bg-[#2D8659]/10',
  },
];

const checklistItems = [
  '名刺の注文ロット数が年々減っている',
  '「ネット印刷でいいや」と離れていく顧客がいる',
  '若い担当者から「名刺、要りますか？」と聞かれた',
  '新規の法人営業をしても、価格でしか勝負できない',
  'このまま10年、同じ商売を続けられるか不安がある',
  '何か新しいことを始めたいが、何から手をつければいいかわからない',
];

export default function ProblemSection() {
  const prefersReducedMotion = useReducedMotion();
  const { ref: headRef, inView: headInView } = useScrollInView();
  const { ref: statsRef, inView: statsInView } = useScrollInView();
  const { ref: checkRef, inView: checkInView } = useScrollInView();
  const { ref: storyRef, inView: storyInView } = useScrollInView();

  const [checked, setChecked] = useState<boolean[]>(new Array(checklistItems.length).fill(false));
  const checkedCount = checked.filter(Boolean).length;

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  return (
    <section id="problem" className="bg-white py-20 lg:py-28">
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
            名刺の注文、5年前と比べてどうですか？
          </h2>
          <p className="text-left text-[#5A6577] lg:text-center lg:text-lg">
            あなたが感じている不安は、データが裏付けています。
          </p>
        </motion.div>

        {/* 統計カード */}
        <motion.div
          ref={statsRef}
          initial="hidden"
          animate={statsInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mb-16"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUpVariants}
                className={`relative px-6 py-8 lg:py-10 text-center ${
                  i % 2 === 0 ? 'border-r border-[#E8E6E1]' : 'lg:border-r lg:border-[#E8E6E1]'
                } ${i === stats.length - 1 ? 'lg:border-r-0' : ''} ${i < 2 ? 'border-b border-[#E8E6E1] lg:border-b-0' : ''}`}
              >
                <div className="mb-3">
                  <CountUpNumber
                    end={s.value}
                    className={`font-[Inter] text-5xl font-bold lg:text-7xl ${s.color}`}
                  />
                  <span className={`text-xl font-bold lg:text-3xl ${s.color}`}>{s.suffix}</span>
                </div>
                <p className="text-base font-semibold text-[#2D3748] lg:text-lg">{s.label}</p>
                <p className="mt-1 text-sm text-[#7B8794] lg:text-base">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* チェックリスト */}
        <motion.div
          ref={checkRef}
          initial="hidden"
          animate={checkInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="mx-auto mb-10 max-w-2xl lg:mb-16"
        >
          <div className="mb-8 text-center">
            <span className="mb-2 inline-block text-xs font-bold tracking-widest text-[#7B8794]">CHECKLIST</span>
            <h3 className="text-xl font-bold text-[#1B2A4A] lg:text-2xl">
              こんなこと、感じていませんか？
            </h3>
          </div>
          <div className="divide-y divide-[#E8E6E1] rounded-2xl border border-[#E8E6E1] bg-white">
            {checklistItems.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUpVariants}
                onClick={() => toggle(i)}
                className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-[#FAFAF8]"
              >
                <span className="shrink-0">
                  {checked[i] ? (
                    <motion.span
                      initial={prefersReducedMotion ? false : { scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <Check className="h-5 w-5 text-[#1B2A4A]" />
                    </motion.span>
                  ) : (
                    <Square className="h-5 w-5 text-[#D5D2CC]" />
                  )}
                </span>
                <span
                  className={`text-sm leading-relaxed lg:text-base ${
                    checked[i] ? 'font-medium text-[#1B2A4A]' : 'text-[#5A6577]'
                  }`}
                >
                  {item}
                </span>
              </motion.div>
            ))}
          </div>

          {/* ブリッジテキスト */}
          <motion.p
            initial="hidden"
            animate={checkedCount >= 3 ? 'visible' : 'hidden'}
            variants={fadeUpVariants}
            className="mt-6 text-center text-sm font-semibold text-[#1B2A4A] lg:text-base"
          >
            {checkedCount >= 3
              ? '3つ以上当てはまった方へ——続きをお読みください。'
              : '\u00A0'}
          </motion.p>
        </motion.div>

        {/* エモーショナルストーリー */}
        <motion.div
          ref={storyRef}
          initial="hidden"
          animate={storyInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mx-auto max-w-2xl"
        >
          {/* 本文エリア — 薄暗い背景で不安感 */}
          <div className="border border-[#D5D2CC] bg-gradient-to-b from-[#EDEBE6] to-[#F5F3EF] px-6 py-8 sm:px-8 rounded-xl">
            <motion.p
              variants={fadeUpVariants}
              className="mb-5 text-justify text-base leading-[1.9] text-[#2D3748] lg:text-lg"
            >
              ある広島の印刷会社。創業40年、地元では知らない人はいない老舗だった。
            </motion.p>
            <motion.p
              variants={fadeUpVariants}
              className="mb-5 text-justify text-base leading-[1.9] text-[#2D3748] lg:text-lg"
            >
              社長の田中さん（仮名・62歳）のもとに、20年来の取引先から電話が入った。
            </motion.p>
            <motion.div
              variants={fadeUpVariants}
              className="my-6 rounded-lg border-l-4 border-[#9B4D3A]/40 bg-white/60 px-5 py-4"
            >
              <p className="text-justify text-base italic leading-[1.9] text-[#5A6577] lg:text-lg">
                「田中さん、長い間お世話になりました。<br className="hidden sm:block" />
                来期から名刺はネット印刷に切り替えることになりまして…」
              </p>
            </motion.div>
            <motion.p
              variants={fadeUpVariants}
              className="mb-2 text-justify text-base leading-[1.9] text-[#2D3748] lg:text-lg"
            >
              受話器を置いた田中さんは、しばらく動けなかった。
            </motion.p>
            <motion.p
              variants={fadeUpVariants}
              className="mb-5 text-justify text-sm text-[#5A6577] lg:text-base"
            >
              その取引先だけで、年間30万円の売上があった。
            </motion.p>
            <motion.p
              variants={fadeUpVariants}
              className="mb-5 text-justify text-base font-medium leading-[1.9] text-[#9B4D3A]/80 lg:text-lg"
            >
              翌週、もう1社から同じ連絡が入った。
            </motion.p>

            {/* 区切り線 */}
            <div className="my-6 flex items-center justify-center gap-2">
              <span className="h-px w-8 bg-[#D5D2CC]" />
              <span className="h-px w-8 bg-[#D5D2CC]" />
              <span className="h-px w-8 bg-[#D5D2CC]" />
            </div>

            <motion.p
              variants={fadeUpVariants}
              className="mb-5 text-justify text-base leading-[1.9] text-[#2D3748] lg:text-lg"
            >
              「価格じゃ勝てない。でも、うちには40年の信頼がある。
              <br />
              この信頼を活かせる<em className="not-italic font-semibold">&ldquo;何か&rdquo;</em>はないだろうか——」
            </motion.p>
            <motion.p
              variants={fadeUpVariants}
              className="text-center text-base font-semibold leading-[1.9] text-[#1B2A4A] lg:text-lg"
            >
              田中さんが見つけた答えは、意外にもシンプルなものだった。
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
