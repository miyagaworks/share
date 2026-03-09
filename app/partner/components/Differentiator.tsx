'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
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
  ChevronsRight,
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
    services: 'プレーリーカード / MEET 等',
    desc: 'NFCカードを別途持ち歩く必要がある。忘れたら使えない。',
  },
  {
    icon: CircleDot,
    label: 'シール型（Share）',
    services: '',
    desc: 'スマホケースに貼るだけ。常に持ち歩くスマホと一体化するから、忘れない。',
    highlight: true,
  },
  {
    icon: QrCode,
    label: 'QRコード / アプリ型',
    services: 'Eight / myBridge 等',
    desc: '相手もアプリが必要だったり、カメラで読み取る手間がかかる。',
  },
];

type CellValue = 'yes' | 'no' | 'partial' | string;

interface CompRow {
  label: string;
  share: CellValue;
  nfcCard: CellValue;
  qrApp: CellValue;
  highlight?: boolean;
}

const comparisonRows: CompRow[] = [
  {
    label: '提供方式',
    share: 'NFCシール + QR',
    nfcCard: 'NFCカード',
    qrApp: 'QRコード / アプリ',
  },
  {
    label: '持ち物',
    share: '不要（スマホに貼付）',
    nfcCard: 'カードを携帯',
    qrApp: 'アプリ必須',
  },
  {
    label: '名刺がない場面',
    share: 'いつでもシェア可能',
    nfcCard: 'カードがないと不可',
    qrApp: 'アプリを開く必要あり',
    highlight: true,
  },
  {
    label: '相手の操作',
    share: 'かざすだけ',
    nfcCard: 'かざすだけ',
    qrApp: 'カメラ起動→読取',
  },
  {
    label: '自社ブランド展開',
    share: 'yes',
    nfcCard: 'no',
    qrApp: 'no',
    highlight: true,
  },
  {
    label: '情報更新',
    share: 'リアルタイム',
    nfcCard: 'リアルタイム',
    qrApp: 'リアルタイム',
  },
  {
    label: '初期コスト（個人）',
    share: 'シール数百円',
    nfcCard: '3,000〜5,000円/枚',
    qrApp: '無料〜',
  },
  {
    label: '月額費用',
    share: '御社が自由に設定',
    nfcCard: '無料（法人は年額課金）',
    qrApp: '無料〜600円',
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
  const { ref: pointRef, inView: pointInView } = useScrollInView();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 8);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, tableInView]);

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
            日本の主要デジタル名刺サービスと比較してご覧ください。
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
                  m.highlight ? 'bg-[#1B2A4A]' : 'bg-gray-100'
                }`}
              >
                <m.icon
                  className={`h-7 w-7 ${m.highlight ? 'text-white' : 'text-[#5A6577]'}`}
                />
              </div>
              <h3
                className={`mb-1 text-lg font-bold lg:text-xl ${
                  m.highlight ? 'text-[#1B2A4A]' : 'text-[#2D3748]'
                }`}
              >
                {m.label}
              </h3>
              {m.services && (
                <p className="mb-3 text-xs text-[#7B8794]">{m.services}</p>
              )}
              {!m.services && <div className="mb-3" />}
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
          <div className="relative">
            {/* スクロールヒント（スマホのみ） */}
            {canScrollRight && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute -bottom-1 left-0 right-0 z-10 flex justify-center lg:hidden"
              >
                <div className="flex items-center gap-1 rounded-full bg-[#1B2A4A] px-4 py-1.5 shadow-md">
                  <span className="text-xs font-medium text-white">スクロール</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ChevronsRight className="h-4 w-4 text-white" />
                  </motion.div>
                </div>
              </motion.div>
            )}
          <div ref={scrollContainerRef} className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[580px] border-collapse overflow-hidden rounded-xl text-sm lg:text-base">
              <thead>
                <tr className="bg-[#F5F6F8]">
                  <th className="px-4 py-3.5 text-left font-medium text-[#5A6577]">
                    項目
                  </th>
                  <th className="bg-[#1B2A4A] px-4 py-3.5 text-center font-semibold text-white">
                    Share
                    <br />
                    <span className="text-xs font-normal text-[#F5F3EF]/70">
                      NFCシール + QR
                    </span>
                  </th>
                  <th className="px-4 py-3.5 text-center font-medium text-[#5A6577]">
                    カード型
                    <br />
                    <span className="text-xs">プレーリーカード等</span>
                  </th>
                  <th className="px-4 py-3.5 text-center font-medium text-[#5A6577]">
                    QR / アプリ型
                    <br />
                    <span className="text-xs">Eight・myBridge等</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-[#E8E6E1] ${
                      i % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
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
                      <CellContent value={row.nfcCard} />
                    </td>
                    <td className="px-4 py-3.5 text-center text-[#5A6577]">
                      <CellContent value={row.qrApp} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
          <p className="mt-3 text-right text-xs text-[#7B8794]">
            ※ NFC非対応機種はAndroidの一部のみ
          </p>
        </motion.div>

        {/* Shareの最大の強み */}
        <motion.div
          ref={pointRef}
          initial="hidden"
          animate={pointInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="mx-auto mt-12 max-w-2xl rounded-xl border-2 border-[#B8860B]/30 bg-white p-6 sm:p-8"
        >
          <h4 className="mb-4 text-center text-lg font-bold text-[#1B2A4A] lg:text-xl">
            Shareが選ばれる理由
          </h4>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B8860B]">
                <span className="text-xs font-bold text-white">1</span>
              </div>
              <p className="text-sm leading-relaxed text-[#2D3748] lg:text-base">
                <span className="font-bold">スマホに貼るから、忘れない。</span>
                <br />
                カード型は財布やケースに入れて別途持ち歩く必要がありますが、Shareのシールはスマホケースに貼るだけ。名刺入れを持っていない場面でも、いつでもシェアできます。
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B8860B]">
                <span className="text-xs font-bold text-white">2</span>
              </div>
              <p className="text-sm leading-relaxed text-[#2D3748] lg:text-base">
                <span className="font-bold">御社のブランドで提供できる。</span>
                <br />
                他社サービスは自社ブランドでの再販ができません。Shareのホワイトラベルなら、御社オリジナルのデジタル名刺サービスとして展開できます。
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B8860B]">
                <span className="text-xs font-bold text-white">3</span>
              </div>
              <p className="text-sm leading-relaxed text-[#2D3748] lg:text-base">
                <span className="font-bold">NFC + QRの二刀流。</span>
                <br />
                NFCに対応していないスマホでもQRコードで対応可能。どんな相手にも確実に届きます。
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
