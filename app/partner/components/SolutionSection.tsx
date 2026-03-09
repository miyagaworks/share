'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Server,
  Building2,
  Users,
  ArrowRight,
  Settings,
  DollarSign,
  Shield,
  EyeOff,
  CreditCard,
  Smartphone,
  Eye,
  BookmarkCheck,
} from 'lucide-react';
import { fadeUpVariants, staggerContainer, useScrollInView } from './AnimationUtils';

const flowSteps = [
  {
    icon: Server,
    title: 'Share',
    subtitle: '（裏方として）',
    items: ['システム開発', '保守・更新', 'インフラ管理'],
  },
  {
    icon: Building2,
    title: '御社',
    subtitle: '（自社ブランド）',
    items: ['サービス運営', '営業・サポート', '価格設定'],
  },
  {
    icon: Users,
    title: '御社のお客様',
    subtitle: '（エンドユーザー）',
    items: ['デジタル名刺利用', 'NFCシール使用', '御社ブランドで体験'],
  },
];

const keyPoints = [
  { icon: Building2, text: '「代理店」ではない。御社の"自社サービス"として展開できる' },
  { icon: EyeOff, text: 'エンドユーザーからはShareの名前は一切見えない' },
  { icon: Settings, text: '管理画面で顧客の登録・管理がすべて完結' },
  { icon: DollarSign, text: '価格設定は完全に御社の自由' },
  { icon: Shield, text: '技術的なこと（サーバー管理、アップデート、セキュリティ）はすべてShareが担当' },
];

const beforeAfter = [
  {
    label: '売上構造',
    before: '名刺印刷の売り切り',
    after: '紙＋デジタルの月額ストック収入',
  },
  {
    label: '顧客提案',
    before: '「紙の名刺いかがですか」のみ',
    after: '「紙＋デジタル名刺のセット提案」',
  },
  {
    label: '顧客離脱',
    before: 'ネット印刷に奪われる',
    after: 'デジタルサービスで差別化、囲い込み',
  },
  {
    label: '新規営業',
    before: '価格競争しかない',
    after: 'DX提案という新しい切り口',
  },
  {
    label: '将来性',
    before: '市場縮小の不安',
    after: '成長市場への参入',
  },
];

const userExperience = [
  {
    icon: CreditCard,
    step: '01',
    title: '名刺を渡す',
    desc: 'いつも通りの名刺交換。まずは紙の名刺を渡すところから始まります。',
  },
  {
    icon: Smartphone,
    step: '02',
    title: 'スマホをかざしてもらう',
    desc: 'スマホケースに貼ったNFCシールを見せて「かざしてみてください」——それだけ。',
  },
  {
    icon: Eye,
    step: '03',
    title: 'デジタル名刺が開く',
    desc: 'SNS、連絡先、自己紹介、顔写真——紙では伝えきれなかったすべてが届きます。',
  },
  {
    icon: BookmarkCheck,
    step: '04',
    title: 'ワンタップで保存',
    desc: '電話番号を手打ちする必要なし。連絡先をワンタップでスマホに保存。',
  },
];

export default function SolutionSection() {
  const { ref: headRef, inView: headInView } = useScrollInView();
  const { ref: flowRef, inView: flowInView } = useScrollInView();
  const { ref: pointsRef, inView: pointsInView } = useScrollInView();
  const { ref: tableRef, inView: tableInView } = useScrollInView();
  const { ref: uxRef, inView: uxInView } = useScrollInView();

  return (
    <section id="solution" className="bg-[#F5F3EF]">
      {/* フルワイド画像 */}
      <div className="relative h-[200px] sm:h-[280px] lg:h-[360px] overflow-hidden">
        <Image
          src="/images/partner/cont_img3.png"
          alt="御社のブランドで展開"
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F5F3EF]" />
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
            御社のブランドで。御社のお客様に。
            <br className="hidden sm:block" />
            御社の利益として。
          </h2>
          <p className="mb-2 text-left text-[#5A6577] lg:text-center lg:text-lg">
            「Share」のホワイトラベルという選択肢。
          </p>
          <p className="text-left text-sm text-[#5A6577] lg:text-center lg:text-base">
            ICカード印刷で培ったNFC技術の知見を、名刺に応用。
            <br className="hidden sm:block" />
            印刷業界を知るチームが、現場目線でサポートします。
          </p>
        </motion.div>

        {/* フロー図 */}
        <motion.div
          ref={flowRef}
          initial="hidden"
          animate={flowInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mb-16 flex flex-col items-center gap-2 lg:flex-row lg:gap-0"
        >
          {flowSteps.map((step, i) => (
            <motion.div
              key={step.title}
              variants={fadeUpVariants}
              className="flex w-full flex-col items-center lg:w-auto lg:flex-1 lg:flex-row lg:gap-0"
            >
              <div
                className="w-full rounded-xl border-t-4 border-[#1B2A4A] bg-white p-6 text-center shadow-sm sm:text-left"
              >
                <div className="mb-3 inline-flex rounded-lg p-2.5 bg-[#4A6FA5]/10">
                  <step.icon className="h-5 w-5 text-[#4A6FA5]" />
                </div>
                <h3 className="mb-0.5 text-lg font-bold text-[#2D3748] lg:text-xl">{step.title}</h3>
                <p className="mb-3 text-xs text-[#5A6577] lg:text-sm">{step.subtitle}</p>
                <ul className="space-y-1">
                  {step.items.map((item) => (
                    <li key={item} className="text-justify text-sm text-[#5A6577] lg:text-base">
                      ・{item}
                    </li>
                  ))}
                </ul>
              </div>
              {i < flowSteps.length - 1 && (
                <>
                  <ArrowRight className="hidden h-6 w-6 flex-shrink-0 text-[#D5D2CC] lg:mx-4 lg:block" />
                  <div className="py-1 lg:hidden">
                    <ArrowRight className="h-5 w-5 rotate-90 text-[#D5D2CC]" />
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* 強調ポイント */}
        <motion.div
          ref={pointsRef}
          initial="hidden"
          animate={pointsInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mx-auto mb-16 max-w-2xl"
        >
          <ul className="space-y-3">
            {keyPoints.map((p) => (
              <motion.li
                key={p.text}
                variants={fadeUpVariants}
                className="flex items-start gap-3 rounded-lg border border-[#E8E6E1] bg-white px-4 py-3"
              >
                <p.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#4A6FA5]" />
                <span className="text-justify text-sm leading-relaxed text-[#2D3748] lg:text-base">{p.text}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* ビフォーアフター */}
        <motion.div
          ref={tableRef}
          initial="hidden"
          animate={tableInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="mx-auto max-w-3xl"
        >
          <h3 className="mb-6 text-center text-xl font-bold text-[#2D3748] lg:text-2xl">
            導入前後の変化
          </h3>

          {/* PC: テーブル */}
          <div className="hidden overflow-hidden rounded-xl border border-[#E8E6E1] sm:block">
            <table className="w-full text-sm lg:text-base">
              <thead>
                <tr className="bg-[#F5F6F8]">
                  <th className="px-4 py-3 text-left font-semibold text-[#5A6577]" />
                  <th className="px-4 py-3 text-left font-semibold text-[#9B4D3A]">
                    Before（今の状態）
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-[#2D8659]">
                    After（導入後）
                  </th>
                </tr>
              </thead>
              <tbody>
                {beforeAfter.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-[#F5F6F8]/50'}
                  >
                    <td className="px-4 py-3 font-semibold text-[#2D3748]">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-[#5A6577]">{row.before}</td>
                    <td className="px-4 py-3 font-medium text-[#2D3748]">{row.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* モバイル: カード */}
          <div className="space-y-3 sm:hidden">
            {beforeAfter.map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-[#E8E6E1] bg-white p-4"
              >
                <p className="mb-2 text-xs font-semibold text-[#5A6577]">{row.label}</p>
                <div className="mb-1 flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#9B4D3A]" />
                  <span className="text-sm text-[#5A6577] lg:text-base">{row.before}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#2D8659]" />
                  <span className="text-sm font-medium text-[#2D3748]">{row.after}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* エンドユーザー体験 4ステップ */}
        <motion.div
          ref={uxRef}
          initial="hidden"
          animate={uxInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mx-auto mt-20 max-w-5xl"
        >
          <h3 className="mb-8 text-center text-xl font-bold text-[#2D3748] lg:text-2xl">
            お客様にはこう届きます
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {userExperience.map((ux) => (
              <motion.div
                key={ux.step}
                variants={fadeUpVariants}
                className="flex flex-col items-center px-4 py-6 text-center"
              >
                <div className="mb-3 inline-flex rounded-lg bg-[#4A6FA5]/10 p-3">
                  <ux.icon className="h-6 w-6 text-[#4A6FA5]" />
                </div>
                <span className="mb-1 text-xs font-semibold tracking-wider text-[#4A6FA5]">
                  STEP {ux.step}
                </span>
                <h4 className="mb-2 text-lg font-bold text-[#2D3748]">{ux.title}</h4>
                <p className="text-sm leading-relaxed text-[#5A6577]">{ux.desc}</p>
              </motion.div>
            ))}
          </div>

          <p className="mt-8 text-center text-lg font-semibold text-[#8B7355]">
            → このお客様は、もう御社のことを忘れません。
          </p>
        </motion.div>
      </div>
    </section>
  );
}
