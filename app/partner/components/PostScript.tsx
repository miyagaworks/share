'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { fadeUpVariants, useScrollInView } from './AnimationUtils';

export default function PostScript() {
  const { ref, inView } = useScrollInView();

  return (
    <section id="postscript" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
        >
          {/* 追伸ラベル */}
          <p className="mb-8 text-center text-sm font-medium tracking-widest text-[#8B7355]">
            追伸
          </p>

          {/* 手書きの手紙 */}
          <div className="flex justify-center">
            <Image
              src="/images/partner/tegami.png"
              alt="代表 宮川清実からの手書きの手紙"
              width={600}
              height={900}
              className="w-full sm:max-w-lg"
              unoptimized
            />
          </div>

          {/* 代表者のShare — 実物を見せる */}
          <div className="my-12 flex flex-col items-center gap-6 border-b border-t border-[#8B7355]/20 py-8">
            {/* スマホ閲覧時: リンクボタン */}
            <a
              href="https://app.sns-share.com/miyagawa"
              className="inline-flex items-center gap-2 rounded-lg bg-[#8B7355] px-6 py-3 text-[15px] text-white transition-opacity hover:opacity-90 md:hidden"
              target="_blank"
              rel="noopener noreferrer"
            >
              宮川のデジタル名刺を見る
            </a>

            {/* PC閲覧時: QRコード */}
            <div className="hidden flex-col items-center gap-4 md:flex">
              <Image
                src="/images/partner/miyagawa-share-qr.png"
                alt="宮川のデジタル名刺 QRコード"
                width={160}
                height={160}
                unoptimized
              />
              <p className="text-sm text-[#5A6577]">
                スマホで読み取ってください
              </p>
            </div>

            <p className="max-w-md text-center text-[15px] leading-relaxed text-[#2D3748]">
              顔も名前も連絡先も、すべてお見せしています。
              <br />
              このサービスを御社のお客様にも届けたい。
              <br />
              それが私の本気です。
            </p>
          </div>

          {/* 署名 */}
          <div className="mt-12 flex items-center gap-5">
            {/* 顔写真（共感セクションと同じ写真） */}
            <Image
              src="/images/partner/miyagawa.png"
              alt="宮川 清実"
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-full object-cover"
              unoptimized
            />
            <div>
              <a
                href="https://senrigan.systems/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#4A6FA5] underline decoration-[#4A6FA5]/30 underline-offset-2 transition-colors hover:text-[#3A5F95] lg:text-base"
              >
                株式会社Senrigan
              </a>
              <p className="text-sm text-[#5A6577] lg:text-base">代表取締役</p>
              <p className="text-lg font-semibold text-[#2D3748]">宮川 清実</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
