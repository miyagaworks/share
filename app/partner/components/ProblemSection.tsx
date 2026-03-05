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
          className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeUpVariants}
              className="rounded-xl border border-[#E8E6E1] bg-white p-6 text-center shadow-sm sm:text-left"
            >
              <div className={`mb-3 inline-flex rounded-lg p-2.5 ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="mb-1">
                <CountUpNumber
                  end={s.value}
                  className={`font-[Inter] text-4xl font-bold ${s.color}`}
                />
                <span className={`text-xl font-bold ${s.color}`}>{s.suffix}</span>
              </div>
              <p className="mb-1 text-sm font-semibold text-[#2D3748] lg:text-lg">{s.label}</p>
              <p className="text-justify text-xs text-[#5A6577] lg:text-sm">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* チェックリスト */}
        <motion.div
          ref={checkRef}
          initial="hidden"
          animate={checkInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="mx-auto mb-16 max-w-2xl"
        >
          <h3 className="mb-6 text-center text-xl font-bold text-[#2D3748] lg:text-2xl">
            こんなこと、感じていませんか？
          </h3>
          <ul className="space-y-3">
            {checklistItems.map((item, i) => (
              <motion.li
                key={i}
                variants={fadeUpVariants}
                onClick={() => toggle(i)}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-all ${
                  checked[i]
                    ? 'border-[#4A6FA5]/30 bg-[#4A6FA5]/5'
                    : 'border-[#E8E6E1] bg-white hover:border-[#D5D2CC]'
                }`}
              >
                <span className="mt-0.5 flex-shrink-0">
                  {checked[i] ? (
                    <motion.span
                      initial={prefersReducedMotion ? false : { scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <Check className="h-5 w-5 text-[#4A6FA5]" />
                    </motion.span>
                  ) : (
                    <Square className="h-5 w-5 text-[#D5D2CC]" />
                  )}
                </span>
                <span
                  className={`text-sm leading-relaxed lg:text-base ${
                    checked[i] ? 'text-[#2D3748]' : 'text-[#5A6577]'
                  }`}
                >
                  {item}
                </span>
              </motion.li>
            ))}
          </ul>

          {/* ブリッジテキスト */}
          <motion.p
            initial="hidden"
            animate={checkedCount >= 3 ? 'visible' : 'hidden'}
            variants={fadeUpVariants}
            className="mt-6 text-center text-sm font-semibold text-[#4A6FA5] lg:text-base"
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
          variants={fadeUpVariants}
          className="mx-auto max-w-2xl rounded-xl border-l-4 border-[#8B7355] bg-[#FAF8F3] px-6 py-8 sm:px-8"
        >
          <p className="mb-4 text-justify text-base leading-[1.9] text-[#2D3748] lg:text-lg">
            ある地方の名刺印刷会社。創業40年、地元では知らない人はいない老舗だった。
          </p>
          <p className="mb-4 text-justify text-base leading-[1.9] text-[#2D3748] lg:text-lg">
            社長の田中さん（仮名・62歳）のもとに、20年来の取引先から電話が入った。
            <br />
            「田中さん、長い間お世話になりました。来期から名刺はネット印刷に切り替えることになりまして…」
          </p>
          <p className="mb-4 text-justify text-base leading-[1.9] text-[#2D3748] lg:text-lg">
            受話器を置いた田中さんは、しばらく動けなかった。
            <br />
            その取引先だけで、年間30万円の売上があった。
          </p>
          <p className="mb-4 text-justify text-base leading-[1.9] text-[#2D3748] lg:text-lg">
            翌週、もう1社から同じ連絡が入った。
          </p>
          <p className="mb-4 text-justify text-base leading-[1.9] text-[#2D3748] lg:text-lg">
            「価格じゃ勝てない。でも、うちには40年の信頼がある。
            <br />
            この信頼を活かせる<em className="not-italic font-semibold">"何か"</em>はないだろうか——」
          </p>
          <p className="text-base font-semibold leading-[1.9] text-[#2D3748]">
            田中さんが見つけた答えは、意外にもシンプルなものだった。
          </p>
        </motion.div>
      </div>
    </section>
  );
}
