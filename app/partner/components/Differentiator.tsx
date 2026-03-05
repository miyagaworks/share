'use client';

import { motion } from 'framer-motion';
import {
  Smartphone,
  CreditCard,
  QrCode,
  Check,
  X,
  Minus,
  Crown,
  CircleDot,
} from 'lucide-react';
import {
  fadeUpVariants,
  staggerContainer,
  useScrollInView,
} from './AnimationUtils';

const methods = [
  {
    icon: CreditCard,
    label: 'カード型',
    desc: '財布やケースに入れて持ち歩く必要がある。忘れることが多い。',
  },
  {
    icon: CircleDot,
    label: 'シール型（Share）',
    desc: 'スマホに貼るだけ。毎日持ち歩くスマホと一体化するから、忘れない。',
    highlight: true,
  },
  {
    icon: QrCode,
    label: 'QRコード',
    desc: 'カメラアプリを起動して読み取る手間がかかる。',
  },
];

type CellValue = 'yes' | 'no' | 'partial' | string;

interface CompRow {
  label: string;
  share: CellValue;
  icCard: CellValue;
  app: CellValue;
  paper: CellValue;
  highlight?: boolean;
}

const comparisonRows: CompRow[] = [
  {
    label: 'NFC媒体コスト',
    share: '550円（シール）',
    icCard: '3,480〜4,480円',
    app: 'なし',
    paper: '2,000円/箱',
  },
  {
    label: '持ち物',
    share: '不要（スマホに貼付）',
    icCard: 'カードを携帯',
    app: 'アプリが必要',
    paper: '名刺入れ',
  },
  {
    label: '情報更新',
    share: 'リアルタイム',
    icCard: 'リアルタイム',
    app: 'リアルタイム',
    paper: '再印刷が必要',
  },
  {
    label: '自社ブランド展開',
    share: 'yes',
    icCard: 'no',
    app: 'no',
    paper: 'yes',
    highlight: true,
  },
  {
    label: '電話帳登録',
    share: 'ワンタップ',
    icCard: 'partial',
    app: 'partial',
    paper: '手入力',
  },
  {
    label: 'QRコード併用',
    share: 'yes',
    icCard: 'partial',
    app: 'yes',
    paper: 'no',
  },
];

function CellContent({ value }: { value: CellValue }) {
  if (value === 'yes')
    return <Check className="mx-auto h-5 w-5 text-[#2D8659]" />;
  if (value === 'no') return <X className="mx-auto h-5 w-5 text-[#9B4D3A]" />;
  if (value === 'partial')
    return <Minus className="mx-auto h-5 w-5 text-[#7B8794]" />;
  return <span>{value}</span>;
}

export default function Differentiator() {
  const { ref: headRef, inView: headInView } = useScrollInView();
  const { ref: cardRef, inView: cardInView } = useScrollInView();
  const { ref: tableRef, inView: tableInView } = useScrollInView();

  return (
    <section id="differentiator" className="bg-[#F5F3EF] py-20 lg:py-28">
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
            なぜカードではなく、シールなのか。
          </h2>
          <p className="text-left text-[#5A6577] lg:text-center lg:text-lg">
            NFCデジタル名刺の方式を比較して、最適な選択肢をご紹介します。
          </p>
        </motion.div>

        {/* 3カラム比較 */}
        <motion.div
          ref={cardRef}
          initial="hidden"
          animate={cardInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mx-auto mb-20 grid max-w-4xl items-stretch gap-6 sm:grid-cols-3"
        >
          {methods.map((m) => (
            <motion.div
              key={m.label}
              variants={fadeUpVariants}
              className={`relative overflow-hidden rounded-2xl border-2 p-6 text-center transition-shadow ${
                m.highlight
                  ? 'border-[#B8860B] bg-white shadow-lg shadow-[#B8860B]/10'
                  : 'border-[#E8E6E1] bg-white shadow-sm'
              }`}
            >
              {/* おすすめバッジ */}
              {m.highlight && (
                <div className="mb-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#B8860B] px-4 py-1.5 text-xs font-bold text-white">
                    <Crown className="h-3.5 w-3.5" />
                    おすすめ
                  </span>
                </div>
              )}

              <div
                className={`mx-auto mb-4 inline-flex rounded-full p-4 ${
                  m.highlight
                    ? 'bg-[#1B2A4A]'
                    : 'bg-gray-100'
                }`}
              >
                <m.icon
                  className={`h-7 w-7 ${m.highlight ? 'text-white' : 'text-[#5A6577]'}`}
                />
              </div>
              <h3
                className={`mb-3 text-lg font-bold lg:text-xl ${
                  m.highlight ? 'text-[#1B2A4A]' : 'text-[#2D3748]'
                }`}
              >
                {m.label}
              </h3>
              <p className="text-justify text-sm leading-relaxed text-[#5A6577] lg:text-base">
                {m.desc}
              </p>
              {m.highlight && (
                <div className="mt-5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2D8659]/10 px-4 py-2 text-sm font-semibold text-[#2D8659]">
                    <Smartphone className="h-4 w-4" />
                    かざすだけ、1秒で完了
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* 競合比較表 */}
        <motion.div
          ref={tableRef}
          initial="hidden"
          animate={tableInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
        >
          <h3 className="mb-6 text-center text-xl font-bold text-[#2D3748] lg:text-2xl">
            サービス比較
          </h3>
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[640px] border-collapse overflow-hidden rounded-xl text-sm lg:text-base">
              <thead>
                <tr className="bg-[#F5F6F8]">
                  <th className="px-4 py-3.5 text-left font-medium text-[#5A6577]">
                    項目
                  </th>
                  <th className="bg-[#1B2A4A] px-4 py-3.5 text-center font-semibold text-white">
                    Share
                    <br />
                    <span className="text-xs font-normal text-[#F5F3EF]/70">
                      （御社ブランド）
                    </span>
                  </th>
                  <th className="px-4 py-3.5 text-center font-medium text-[#5A6577]">
                    A社
                    <br />
                    <span className="text-xs">（ICカード型）</span>
                  </th>
                  <th className="px-4 py-3.5 text-center font-medium text-[#5A6577]">
                    B社
                    <br />
                    <span className="text-xs">（アプリ型）</span>
                  </th>
                  <th className="px-4 py-3.5 text-center font-medium text-[#5A6577]">
                    紙の名刺
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-[#E8E6E1] ${
                      i % 2 === 1 ? 'bg-[#F5F6F8]/50' : 'bg-white'
                    }`}
                  >
                    <td
                      className={`px-4 py-3.5 text-[#2D3748] ${
                        row.highlight ? 'font-bold' : ''
                      }`}
                    >
                      {row.label}
                    </td>
                    <td
                      className={`bg-[#1B2A4A]/5 px-4 py-3.5 text-center ${
                        row.highlight ? 'font-bold text-[#1B2A4A]' : 'text-[#2D3748]'
                      }`}
                    >
                      <CellContent value={row.share} />
                    </td>
                    <td className="px-4 py-3.5 text-center text-[#5A6577]">
                      <CellContent value={row.icCard} />
                    </td>
                    <td className="px-4 py-3.5 text-center text-[#5A6577]">
                      <CellContent value={row.app} />
                    </td>
                    <td className="px-4 py-3.5 text-center text-[#5A6577]">
                      <CellContent value={row.paper} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
