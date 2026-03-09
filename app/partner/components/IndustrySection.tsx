'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { TrendingUp, Briefcase, Monitor } from 'lucide-react';
import {
  CountUpNumber,
  fadeUpVariants,
  staggerContainer,
  useScrollInView,
} from './AnimationUtils';

const dataPoints = [
  {
    icon: TrendingUp,
    value: 6.8,
    suffix: '%',
    label: 'デジタル名刺市場の年間成長率',
    desc: '世界的に毎年拡大を続けている成長市場です',
  },
  {
    icon: Monitor,
    value: 70,
    suffix: '%',
    label: 'リモートワーク経験者',
    desc: 'オンラインでの名刺交換ニーズが急拡大しています',
  },
  {
    icon: Briefcase,
    value: 7,
    suffix: '割以上',
    label: 'DXに取り組む企業',
    desc: '「紙からデジタルへ」の流れは止まりません',
  },
];

export default function IndustrySection() {
  const { ref: headRef, inView: headInView } = useScrollInView();
  const { ref: cardsRef, inView: cardsInView } = useScrollInView();
  const { ref: msgRef, inView: msgInView } = useScrollInView();

  return (
    <section id="industry" className="bg-white">
      {/* フルワイド画像 */}
      <div className="relative h-[200px] sm:h-[280px] lg:h-[360px] overflow-hidden">
        <Image
          src="/images/partner/cont_img2.png"
          alt="名刺業界の変化"
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
            名刺業界に、静かな地殻変動が起きています。
          </h2>
          <p className="text-left text-[#5A6577] lg:text-center lg:text-lg">
            変化はすでに始まっている。問題は、あなたが乗るかどうかだけ。
          </p>
        </motion.div>

        {/* データカード */}
        <motion.div
          ref={cardsRef}
          initial="hidden"
          animate={cardsInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mx-auto mb-16 grid max-w-5xl gap-6 sm:grid-cols-3"
        >
          {dataPoints.map((d) => (
            <motion.div
              key={d.label}
              variants={fadeUpVariants}
              className="rounded-xl border border-[#E8E6E1] bg-white p-6 text-center sm:text-left"
            >
              <div className="mb-3 inline-flex rounded-lg p-2.5 bg-[#4A6FA5]/10">
                <d.icon className="h-5 w-5 text-[#4A6FA5]" />
              </div>
              <div className="mb-1">
                <CountUpNumber
                  end={d.value}
                  className="font-[Inter] text-4xl font-bold text-[#1B2A4A]"
                />
                <span className="text-xl font-bold text-[#1B2A4A]">{d.suffix}</span>
              </div>
              <p className="mb-1 text-sm font-semibold text-[#2D3748] lg:text-lg">{d.label}</p>
              <p className="text-justify text-xs text-[#5A6577] lg:text-sm">{d.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* 転換メッセージ */}
        <motion.div
          ref={msgRef}
          initial="hidden"
          animate={msgInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="mx-auto max-w-2xl rounded-xl border border-[#4A6FA5]/10 px-6 py-8 text-center sm:px-8"
          style={{ background: 'rgba(74,111,165,0.06)' }}
        >
          <p className="mb-4 text-lg leading-relaxed text-[#2D3748] lg:text-xl">
            この変化は「脅威」ではなく
            <span className="font-bold text-[#2D8659]">「チャンス」</span>です。
          </p>
          <p className="text-justify text-base leading-relaxed text-[#2D3748] lg:text-lg">
            なぜなら——名刺のことを一番よく知っているのは、名刺屋だから。
            <br />
            長年かけて築いた
            <span className="font-bold">「顧客との信頼関係」</span>
            を持つ御社だからこそ、デジタル名刺を提案する最適なポジションにいるのです。
          </p>
        </motion.div>
      </div>
    </section>
  );
}
