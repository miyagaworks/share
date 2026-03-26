'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { fadeUpVariants, staggerContainer } from './AnimationUtils';
import { PartnerEvents } from '../utils/analytics';

const badges = [
  { label: '開発費0円' },
  { label: '最短30日' },
  { label: '自社ブランド' },
];

export default function HeroSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-[#F5F3EF] to-white">
      <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-6 lg:py-28">
        {/* 左カラム：コピー */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* バッジ */}
          <motion.div variants={fadeUpVariants} className="mb-6 flex flex-wrap justify-center gap-2 lg:justify-start">
            {badges.map((b) => (
              <span
                key={b.label}
                className="rounded-full border border-[#B8860B]/30 bg-[#B8860B]/10 px-4 py-1.5 text-sm font-semibold text-[#B8860B]"
              >
                {b.label}
              </span>
            ))}
          </motion.div>

          {/* メインキャッチ */}
          <motion.h1
            variants={fadeUpVariants}
            className="mb-4 text-3xl font-bold leading-tight text-[#1B2A4A] sm:text-4xl lg:text-[3.3rem] lg:leading-tight"
          >
            御社のブランドで、
            <br />
            デジタル名刺事業を。
          </motion.h1>

          {/* サブキャッチ */}
          <motion.p
            variants={fadeUpVariants}
            className="mb-4 text-xl font-semibold text-[#8B7355] lg:text-2xl"
          >
            開発費ゼロ、最短30日でスタート。
          </motion.p>

          <motion.p
            variants={fadeUpVariants}
            className="mb-8 text-base leading-relaxed text-[#5A6577] lg:text-lg"
          >
            「Share」のホワイトラベルなら、システム開発なしで
            御社オリジナルのデジタル名刺サービスを立ち上げられます。
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeUpVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <motion.a
              href="#cta"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('partner-preference', { detail: '補助金活用ガイドを受け取りたい' }));
                document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
                PartnerEvents.ctaClick('hero', 'download');
              }}
              whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#B8860B] px-8 py-3 text-base font-bold text-white shadow-md transition-colors hover:bg-[#A0750A]"
            >
              DX補助金ガイドを無料で入手
            </motion.a>
            <motion.a
              href="#cta"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('partner-preference', { detail: 'オンライン相談を希望（30分・無料）' }));
                document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
                PartnerEvents.ctaClick('hero', 'consultation');
              }}
              whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border-2 border-[#1B2A4A] px-8 py-3 text-base font-bold text-[#1B2A4A] transition-colors hover:bg-[#1B2A4A]/5"
            >
              まずは30分の無料相談
            </motion.a>
          </motion.div>

          {/* マイクロコピー */}
          <motion.p variants={fadeUpVariants} className="mt-3 text-sm text-[#7B8794]">
            ※ 営業電話は一切いたしません
          </motion.p>
        </motion.div>

        {/* 右カラム：ビジュアル（プレースホルダー） */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          className="relative hidden lg:block"
        >
          <div className="relative mx-auto aspect-square max-w-md rounded-2xl bg-gradient-to-br from-[#1B2A4A]/5 to-[#B8860B]/10 p-8">
            {/* スマホモックアップ風 */}
            <div className="mx-auto flex h-full w-48 flex-col items-center justify-center rounded-3xl border-2 border-[#1B2A4A]/20 bg-white shadow-lg">
              <div className="mb-3 h-16 w-16 rounded-full bg-[#1B2A4A]/10" />
              <div className="mb-2 h-3 w-24 rounded-full bg-[#1B2A4A]/15" />
              <div className="mb-4 h-2 w-20 rounded-full bg-[#1B2A4A]/10" />
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-full bg-[#B8860B]/20" />
                <div className="h-8 w-8 rounded-full bg-[#4A6FA5]/20" />
                <div className="h-8 w-8 rounded-full bg-[#2D8659]/20" />
              </div>
            </div>
            {/* 管理画面風オーバーレイ */}
            <div className="absolute -bottom-4 -right-4 w-48 rounded-lg border border-[#E8E6E1] bg-white p-3 shadow-md">
              <div className="mb-2 h-2 w-16 rounded-full bg-[#1B2A4A]/20" />
              <div className="mb-1 h-2 w-full rounded-full bg-[#B8860B]/15" />
              <div className="mb-1 h-2 w-3/4 rounded-full bg-[#4A6FA5]/15" />
              <div className="h-2 w-1/2 rounded-full bg-[#2D8659]/15" />
            </div>
          </div>
        </motion.div>
      </div>

    </section>
  );
}
