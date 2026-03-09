'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Smartphone, Sparkles, ExternalLink } from 'lucide-react';
import { fadeUpVariants, staggerContainer, useScrollInView } from './AnimationUtils';

const valueCards = [
  {
    icon: Heart,
    title: '紙の名刺の信頼',
    desc: '手渡しの温もりと、30年の顧客関係',
  },
  {
    icon: Smartphone,
    title: 'NFCシールの便利さ',
    desc: 'かざすだけで、デジタル名刺を共有',
  },
  {
    icon: Sparkles,
    title: '新しい価値提案',
    desc: '紙＋デジタルで、御社だけのサービス',
  },
];

export default function AffinitySection() {
  const { ref: headRef, inView: headInView } = useScrollInView();
  const { ref: bodyRef, inView: bodyInView } = useScrollInView();
  const { ref: cardsRef, inView: cardsInView } = useScrollInView();
  const { ref: repRef, inView: repInView } = useScrollInView();

  return (
    <section id="affinity" className="bg-[#F5F3EF]">
      {/* フルワイド画像 */}
      <div className="relative h-[200px] sm:h-[280px] lg:h-[360px] overflow-hidden">
        <Image
          src="/images/partner/cont_img1.png"
          alt="印刷の現場"
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
            「紙をやめて下さい」なんて、言いません。
          </h2>
          <p className="text-left text-[#5A6577] lg:text-center lg:text-lg">
            私たちが提案するのは、「紙の代わり」ではありません。
          </p>
        </motion.div>

        {/* 本文 */}
        <motion.div
          ref={bodyRef}
          initial="hidden"
          animate={bodyInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="mx-auto mb-16 max-w-2xl"
        >
          <div className="rounded-xl bg-white/70 px-6 py-8 sm:px-8">
            <p className="mb-5 text-justify text-base leading-[1.9] text-[#2D3748] lg:text-lg">
              手渡しの名刺交換には、デジタルでは代替できない価値がある。
              <br />
              相手の目を見て、名前を伝える。その瞬間の信頼感は、紙の名刺だけのもの。
            </p>
            <p className="mb-5 text-justify text-base leading-[1.9] text-[#2D3748] lg:text-lg">
              でも、名刺交換のあとに——こんな経験はありませんか。
              <br />
              名刺を見ながら電話番号を手打ちする。SNSのアカウントは書いていない。
              <br />
              顔写真もないから、3日後にはもう誰だったか思い出せない。
            </p>
            <p className="mb-5 text-justify text-base leading-[1.9] text-[#2D3748] lg:text-lg">
              私たちが提案するのは、「紙の代わり」ではありません。
              <br />
              <span className="font-bold text-[#1B2A4A]">
                「紙の名刺に、デジタルを"足す"」
              </span>
              という考え方です。
            </p>
            <p className="mb-5 text-justify text-base leading-[1.9] text-[#2D3748] lg:text-lg">
              名刺を渡した後、スマホをかざしてもらう。
              <br />
              すると——SNS、連絡先、自己紹介、顔写真。
              <br />
              名刺では書ききれなかったすべてが、相手のスマホに届きます。
              <br />
              連絡先の保存はワンタップ。もう手打ちする必要はありません。
            </p>
            <p className="text-justify text-base leading-[1.9] text-[#2D3748] lg:text-lg">
              駅の改札やタッチ決済と同じ「かざす」技術。
              <br />
              12年にわたるICカード印刷の経験から、この技術を名刺に応用しました。
            </p>
          </div>
        </motion.div>

        {/* 等式カード */}
        <motion.div
          ref={cardsRef}
          initial="hidden"
          animate={cardsInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="mx-auto flex max-w-4xl flex-col items-center gap-2 sm:flex-row sm:gap-3"
        >
          {valueCards.map((card, i) => (
            <motion.div key={card.title} variants={fadeUpVariants} className="flex w-full flex-col items-center sm:w-auto sm:flex-row sm:gap-3">
              <div className="w-full rounded-xl border border-[#E8E6E1] bg-white px-5 py-5 text-center shadow-sm sm:min-w-[180px] lg:px-6 lg:py-6">
                <div className="mx-auto mb-2 inline-flex rounded-lg p-2.5 lg:p-3 bg-[#4A6FA5]/10">
                  <card.icon className="h-5 w-5 lg:h-7 lg:w-7 text-[#4A6FA5]" />
                </div>
                <p className="text-sm font-bold text-[#2D3748] lg:text-lg">{card.title}</p>
                <p className="mt-1 text-xs text-[#5A6577] lg:text-base">{card.desc}</p>
              </div>
              {i < valueCards.length - 1 && (
                <span className="py-1 text-2xl font-bold text-[#5A6577] sm:py-0 lg:text-4xl">
                  {i === 0 ? '+' : '='}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* 代表者メッセージ */}
        <motion.div
          ref={repRef}
          initial="hidden"
          animate={repInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="mx-auto mt-16 max-w-2xl"
        >
          <div className="flex flex-col items-center gap-4 rounded-xl bg-white/70 px-6 py-8 sm:flex-row sm:items-start sm:gap-6 sm:px-8">
            {/* 顔写真 */}
            <Image
              src="/images/partner/miyagawa.png"
              alt="宮川 清実"
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-full object-cover"
              unoptimized
            />
            <div>
              <p className="mb-1 text-sm text-[#5A6577]">株式会社Senrigan 代表</p>
              <p className="mb-3 text-lg font-semibold text-[#2D3748]">宮川 清実</p>
              <p className="text-justify text-base leading-[1.9] text-[#2D3748]">
                印刷の現場にいたから、御社の気持ちがわかります。
                <br />
                紙の名刺の価値は絶対になくならない。
                でも、紙の上にデジタルを足すだけで、届けられる価値がもっと広がる。
              </p>
              <a
                href="https://app.sns-share.com/miyagawa"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm text-[#8B7355] transition-opacity hover:opacity-70"
              >
                宮川のデジタル名刺を見る
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
