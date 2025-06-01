// app/qr/[slug]/page.tsx (修正版)
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { QrCodeClient } from './QrCodeClient';

// 🔥 修正1: Next.js 15対応の型定義
type QrPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[]>>;
};

// 🔥 修正2: generateMetadata関数を追加（SEO対応）
export async function generateMetadata({ params }: QrPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const qrPage = await prisma.qrCodePage.findUnique({
    where: { slug },
    include: { user: true },
  });

  if (!qrPage) {
    return {
      title: 'QRコードページが見つかりません | Share',
    };
  }

  return {
    title: `${qrPage.userName || qrPage.user.name} | Share QR`,
    description: 'QRコードからアクセスされたプロフィールページです',
    openGraph: {
      title: `${qrPage.userName || qrPage.user.name} | Share QR`,
      description: 'QRコードからアクセスされたプロフィールページです',
    },
  };
}

// 🔥 修正3: Server Componentとして実装
export default async function QrPage({ params }: QrPageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // QRページデータを取得
  const qrPage = await prisma.qrCodePage.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          image: true,
          headerText: true,
        },
      },
    },
  });

  if (!qrPage) {
    notFound();
  }

  // QRページの閲覧数を更新
  await prisma.qrCodePage.update({
    where: { id: qrPage.id },
    data: {
      views: {
        increment: 1,
      },
      lastAccessed: new Date(),
    },
  });

  // 🔥 修正4: Client Componentに必要なデータを渡す
  return <QrCodeClient qrData={qrPage} userData={qrPage.user} />;
}