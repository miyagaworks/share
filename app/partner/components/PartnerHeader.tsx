'use client';

import Image from 'next/image';
import { PartnerEvents } from '../utils/analytics';

function scrollToTop(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToCta(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  window.dispatchEvent(new CustomEvent('partner-preference', { detail: '資料をダウンロードしたい' }));
  document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
  PartnerEvents.ctaClick('header', 'download');
}

export default function PartnerHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-[#E8E6E1] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-2 py-3 sm:px-4">
        <a href="#" onClick={scrollToTop} className="block">
          <Image src="/logo.svg" alt="Share" width={120} height={38} priority unoptimized />
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="https://sns-share.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#2D3748] transition-colors hover:text-[#4A6FA5]"
          >
            Shareとは
          </a>
          <a
            href="https://app.sns-share.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#2D3748] transition-colors hover:text-[#4A6FA5]"
          >
            Shareを試してみる
          </a>
          <a
            href="#cta"
            onClick={scrollToCta}
            className="rounded-lg bg-[#B8860B] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A0750A]"
          >
            資料請求
          </a>
        </nav>

        {/* モバイル: CTAのみ表示 */}
        <a
          href="#cta"
          onClick={scrollToCta}
          className="rounded-lg bg-[#B8860B] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#A0750A] md:hidden"
        >
          資料請求
        </a>
      </div>
    </header>
  );
}
