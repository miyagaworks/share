'use client';

import { motion } from 'framer-motion';
import { Building2, Globe, Users, TrendingUp } from 'lucide-react';
import {
  CountUpNumber,
  fadeUpVariants,
  staggerContainer,
  useScrollInView,
} from './AnimationUtils';

// プレースホルダー数値（あとから差し替え可能）
const METRICS = {
  partnerCount: { value: 0, label: 'パートナー企業数', suffix: '社', placeholder: '○' },
  endUsers: { value: 0, label: 'エンドユーザー総数', suffix: '人', placeholder: '○' },
  nfcTaps: { value: 0, label: 'NFCタップ回数', suffix: '回', placeholder: '○' },
  retention: { value: 97, label: 'パートナー継続率', suffix: '%', placeholder: null },
} as const;

const cases = [
  {
    icon: Building2,
    type: '名刺印刷会社',
    location: '従業員12名・愛知県',
    quote:
      '正直、最初は半信半疑でした。でも、既存のお客様5社に提案したら、3社がその場で導入を決めてくれた。"名刺屋さんがやるなら安心"と言ってもらえたのが嬉しかった。紙の名刺の注文も減っていません。むしろ、セットで頼んでくれるようになった。',
    results: [
      { label: '導入企業', value: '法人15社' },
      { label: 'エンドユーザー', value: '83名' },
      { label: '月額ストック収入', value: '62,000円', highlight: true },
    ],
    period: '導入3ヶ月',
  },
  {
    icon: Globe,
    type: 'Web制作会社',
    location: '従業員5名・東京都',
    quote:
      'Web制作の顧客にデジタル名刺をセット提案したら、"ホームページと名刺が連動するのは便利"と好評。制作費とは別に月額収入ができて、キャッシュフローが安定しました。',
    results: [
      { label: '導入企業', value: '法人8社' },
      { label: 'エンドユーザー', value: '45名' },
      { label: '月額ストック収入', value: '36,000円', highlight: true },
    ],
    period: '導入2ヶ月',
  },
];

export default function SocialProof() {
  const { ref: headRef, inView: headInView } = useScrollInView();
  const { ref: caseRef, inView: caseInView } = useScrollInView();
  const { ref: metRef, inView: metInView } = useScrollInView();

  const metricIcons = [Building2, Users, TrendingUp, TrendingUp];

  // TODO: 実績データが揃ったら hidden を外して表示する
  return (
    <section id="social-proof" className="hidden bg-[#F8F7F4] py-20 lg:py-28">
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
            先行パートナーが手にした、最初の3ヶ月の成果。
          </h2>
          <p className="text-left text-[#5A6577] lg:text-center lg:text-lg">
            ※ 初期段階のシナリオです。実績データが揃い次第、差し替えます。
          </p>
        </motion.div>

        {/* 導入事例 */}
        <motion.div
          ref={caseRef}
          initial="hidden"
          animate={caseInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mx-auto mb-16 grid max-w-4xl gap-8 lg:grid-cols-2"
        >
          {cases.map((c) => (
            <motion.div
              key={c.type}
              variants={fadeUpVariants}
              className="rounded-xl border border-[#E8E6E1] bg-white p-6 text-center shadow-sm sm:text-left"
            >
              {/* ヘッダー */}
              <div className="mb-4 flex items-center gap-3">
                <div className="inline-flex rounded-lg bg-[#4A6FA5]/10 p-2.5">
                  <c.icon className="h-5 w-5 text-[#4A6FA5]" />
                </div>
                <div>
                  <p className="font-semibold text-[#2D3748] lg:text-lg">{c.type}</p>
                  <p className="text-xs text-[#5A6577] lg:text-sm">{c.location}</p>
                </div>
              </div>

              {/* 引用 */}
              <blockquote className="mb-5 border-l-2 border-[#8B7355] pl-4 text-justify text-sm italic leading-relaxed text-[#5A6577] lg:text-base">
                「{c.quote}」
              </blockquote>

              {/* 成果数字 */}
              <div className="rounded-lg bg-[#F8F7F4] p-4">
                <p className="mb-2 text-xs font-medium text-[#5A6577]">
                  {c.period}の成果
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {c.results.map((r) => (
                    <div key={r.label} className="text-center">
                      <p
                        className={`text-lg font-bold lg:text-xl ${
                          r.highlight ? 'text-[#2D8659]' : 'text-[#2D3748]'
                        }`}
                      >
                        {r.value}
                      </p>
                      <p className="text-xs text-[#5A6577] lg:text-sm">{r.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 数字で見る実績 */}
        <motion.div
          ref={metRef}
          initial="hidden"
          animate={metInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
        >
          <h3 className="mb-6 text-center text-xl font-bold text-[#2D3748] lg:text-2xl">
            数字で見る実績
          </h3>
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 lg:grid-cols-4">
            {Object.values(METRICS).map((m, i) => {
              const Icon = metricIcons[i];
              return (
                <motion.div
                  key={m.label}
                  variants={fadeUpVariants}
                  className="rounded-xl border border-[#E8E6E1] bg-white p-5 text-center shadow-sm"
                >
                  <Icon className="mx-auto mb-2 h-5 w-5 text-[#4A6FA5]" />
                  {m.placeholder ? (
                    <p className="text-2xl font-bold text-[#1B2A4A]">
                      {m.placeholder}
                      {m.suffix}
                    </p>
                  ) : (
                    <CountUpNumber
                      end={m.value}
                      suffix={m.suffix}
                      className="text-2xl font-bold text-[#1B2A4A]"
                    />
                  )}
                  <p className="mt-1 text-xs text-[#5A6577] lg:text-sm">{m.label}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
