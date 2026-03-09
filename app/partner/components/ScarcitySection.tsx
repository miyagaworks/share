'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, AlertCircle, TrendingUp, Users, Clock } from 'lucide-react';
import {
  fadeUpVariants,
  staggerContainer,
  useScrollInView,
} from './AnimationUtils';

type RegionStatus = 'available' | 'few' | 'closed';

const statusConfig: Record<RegionStatus, { label: string; color: string; bg: string }> = {
  available: { label: '受付中', color: '#2D8659', bg: '#2D8659' },
  few: { label: '残りわずか', color: '#B8860B', bg: '#B8860B' },
  closed: { label: '受付終了', color: '#7B8794', bg: '#7B8794' },
};

const reasons = [
  {
    icon: TrendingUp,
    title: '先行者メリット',
    desc: 'デジタル名刺市場はまだ黎明期。早く始めた会社が顧客を獲得します。',
  },
  {
    icon: Users,
    title: '地域の競合',
    desc: '同じエリアの名刺屋が先にパートナーになれば、その枠は埋まります。',
  },
  {
    icon: Clock,
    title: '無料トライアル',
    desc: 'この特典は予告なく終了する場合があります。',
  },
];

export default function ScarcitySection() {
  const { ref: headRef, inView: headInView } = useScrollInView();
  const { ref: bodyRef, inView: bodyInView } = useScrollInView();
  const { ref: reasonRef, inView: reasonInView } = useScrollInView();

  return (
    <section id="scarcity" className="bg-white">
      {/* フルワイド画像 */}
      <div className="relative h-[200px] sm:h-[280px] lg:h-[360px] overflow-hidden">
        <Image
          src="/images/partner/cont_img7.png"
          alt="地域パートナー制度"
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
            各エリア限定の、地域パートナー制度。
          </h2>
          <p className="mx-auto max-w-2xl text-left text-[#5A6577] lg:text-center lg:text-lg">
            エリアごとにパートナー企業数を制限しています。
            これは、同じエリアで御社の競合が同じサービスを展開することを防ぐため。
            先にパートナーになった企業が、そのエリアでの優先権を得られます。
          </p>
        </motion.div>

        {/* 地図 + 理由 */}
        <motion.div
          ref={bodyRef}
          initial="hidden"
          animate={bodyInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="mx-auto mb-16 grid max-w-5xl items-start gap-10 lg:grid-cols-2"
        >
          {/* 地図 */}
          <div className="rounded-xl border border-[#E8E6E1] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#1B2A4A]" />
              <h3 className="font-semibold text-[#2D3748] lg:text-lg">
                地域別パートナー受付状況
              </h3>
            </div>
            <Image
              src="/images/partner/map.svg"
              alt="地域別パートナー受付状況の日本地図"
              width={400}
              height={500}
              className="mx-auto h-auto w-full max-w-md"
              unoptimized
            />

            {/* 凡例 */}
            <div className="mt-4 flex justify-center gap-4">
              {(['available', 'few', 'closed'] as const).map((s) => (
                <div key={s} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: statusConfig[s].bg }}
                  />
                  <span className="text-[#5A6577] lg:text-sm">{statusConfig[s].label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 今すぐ動くべき理由 */}
          <div className="rounded-xl border border-[#1B2A4A]/10 bg-[#1B2A4A]/[0.02] p-6 lg:p-8">
            <h3 className="mb-6 text-center text-lg font-bold text-[#1B2A4A] lg:text-xl">
              今すぐ動くべき3つの理由
            </h3>
            <motion.div
              ref={reasonRef}
              initial="hidden"
              animate={reasonInView ? 'visible' : 'hidden'}
              variants={staggerContainer}
              className="space-y-5"
            >
              {reasons.map((r, i) => (
                <motion.div
                  key={r.title}
                  variants={fadeUpVariants}
                  className="flex gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1B2A4A] text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <div className={`flex-1 ${i < reasons.length - 1 ? 'border-b border-[#E8E6E1] pb-5' : ''}`}>
                    <div className="mb-1 flex items-center gap-2">
                      <r.icon className="h-4 w-4 text-[#B8860B]" />
                      <h4 className="font-bold text-[#1B2A4A] lg:text-lg">
                        {r.title}
                      </h4>
                    </div>
                    <p className="text-justify text-sm leading-relaxed text-[#5A6577] lg:text-base">
                      {r.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
