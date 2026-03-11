import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PartnerHeader from './components/PartnerHeader';
import { features } from '@/lib/features';
import { getBrandConfig } from '@/lib/brand/config';

export const metadata: Metadata = {
  title: 'パートナー募集 | デジタル名刺を自社ブランドで提供 - Share',
  description:
    '名刺印刷会社・Web制作会社向け。Shareのホワイトラベルで、開発費ゼロ・最短30日で自社ブランドのデジタル名刺サービスを立ち上げ。3ヶ月無料トライアル実施中。',
  manifest: null,
  openGraph: {
    title: '御社のブランドで、デジタル名刺事業を。| Share パートナー募集',
    description: '開発費ゼロ、最短30日でスタート。名刺印刷会社のための新収益モデル。',
    type: 'website',
    url: 'https://sns-share.com/partner',
    // TODO: OGP画像を作成して /public/images/partner-og.png に配置（1200x630px）
    images: [{ url: '/images/partner-og.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  alternates: {
    canonical: 'https://sns-share.com/partner',
  },
};

function PartnerFooter() {
  return (
    <footer className="border-t border-[#E8E6E1] bg-white pb-24 pt-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4 text-sm text-[#5A6577]">
            <Link href="/legal/privacy" className="transition-colors hover:text-[#4A6FA5]">
              プライバシーポリシー
            </Link>
            <Link href="/legal/terms" className="transition-colors hover:text-[#4A6FA5]">
              利用規約
            </Link>
          </div>
          <p className="text-sm text-[#7B8794]">
            &copy; {new Date().getFullYear()} {getBrandConfig().companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  // パートナーモジュールが無効化されている場合は404
  if (!features.partnerModule) {
    notFound();
  }

  return (
    <>
      <PartnerHeader />
      <main className="partner-main pt-[57px]">{children}</main>
      <PartnerFooter />
    </>
  );
}
