// app/[slug]/page.tsx (型定義修正版)
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProfileSnsLink } from '@/components/profile/ProfileSnsLink';
import { ProfileCustomLink } from '@/components/profile/ProfileCustomLink';
import { Metadata } from 'next';
import Link from 'next/link';
import { addDays } from 'date-fns';

// 🔥 修正: Prismaスキーマに基づく正しい型定義
type ExtendedUser = {
  id: string;
  email: string;
  name: string | null;
  nameEn: string | null;
  nameKana: string | null;
  lastName: string | null;
  firstName: string | null;
  lastNameKana: string | null;
  firstNameKana: string | null;
  image: string | null;
  bio: string | null;
  mainColor: string;
  snsIconColor: string | null;
  bioBackgroundColor: string | null;
  bioTextColor: string | null;
  headerText: string | null;
  textColor: string | null;
  phone: string | null;
  company: string | null;
  companyUrl: string | null;
  companyLabel: string | null;
  trialEndsAt: Date | null;
  subscriptionStatus: string | null;
  corporateRole: string | null;
  position: string | null;
  departmentId: string | null;
  tenantId: string | null;
  tenant?: {
    id: string;
    name: string;
    logoUrl: string | null;
    logoWidth: number | null;
    logoHeight: number | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    headerText: string | null;
    textColor: string | null;
    customDomain: string | null;
  } | null;
  adminOfTenant?: {
    id: string;
    name: string;
    logoUrl: string | null;
    logoWidth: number | null;
    logoHeight: number | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    headerText: string | null;
    textColor: string | null;
    customDomain: string | null;
  } | null;
  department?: {
    id: string;
    name: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

// 🔥 修正: SNSリンクの型定義
type SnsLinkType = {
  id: string;
  userId: string;
  platform: string;
  username: string | null;
  url: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

// 🔥 修正: カスタムリンクの型定義
type CustomLinkType = {
  id: string;
  userId: string;
  name: string;
  url: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

// Next.js 15対応のparams型
type ProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[]>>;
};

// generateMetadata関数
export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const profile = await prisma.profile.findUnique({
    where: { slug },
    include: {
      user: true,
    },
  });

  if (!profile) {
    return {
      title: 'プロフィールが見つかりません',
      description: 'リクエストされたプロフィールは存在しないか、削除された可能性があります。',
    };
  }

  return {
    title: `${profile.user.name || 'ユーザー'} | Share`,
    description: profile.user.bio || 'Shareでプロフィールをチェックしましょう',
    openGraph: {
      images: profile.user.image ? [profile.user.image] : [],
    },
  };
}

// メイン関数
export default async function ProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // プロフィールデータの取得
  const profile = await prisma.profile.findUnique({
    where: { slug },
    include: {
      user: {
        include: {
          tenant: true,
          adminOfTenant: true,
          department: true,
        },
      },
    },
  });

  if (!profile || !profile.isPublic) {
    notFound();
  }

  // 🔥 修正: 型アサーションを使用
  const user = profile.user as ExtendedUser;
  const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const now = new Date();

  const hasActiveSubscription = user.subscriptionStatus === 'active';

  if (trialEndsAt && now > trialEndsAt && !hasActiveSubscription) {
    const gracePeriodEndDate = addDays(trialEndsAt, 7);
    if (now > gracePeriodEndDate) {
      notFound();
    }
  }

  // プロフィールの閲覧数を更新
  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      views: {
        increment: 1,
      },
      lastAccessed: new Date(),
    },
  });

  // 🔥 修正: 明示的に型を指定してSNSリンクを取得
  const snsLinks: SnsLinkType[] = await prisma.snsLink.findMany({
    where: { userId: profile.userId },
    orderBy: { displayOrder: 'asc' },
  });

  // 🔥 修正: 明示的に型を指定してカスタムリンクを取得
  const customLinks: CustomLinkType[] = await prisma.customLink.findMany({
    where: { userId: profile.userId },
    orderBy: { displayOrder: 'asc' },
  });

  // テナント情報の取得
  const tenant = user.tenant || user.adminOfTenant;

  // 色設定
  const mainColor = tenant?.primaryColor || user.mainColor || '#A88C3D';
  const secondaryColor = tenant?.secondaryColor || '#333333';
  const snsIconColor = user.snsIconColor || '#333333';

  // 会社関連情報
  const companyName = tenant?.name || user.company || '';
  const companyLabel = user.companyLabel || '会社HP';
  const hasCompanyUrl = tenant ? true : user.company && user.companyUrl;

  // ヘッダーテキストとテキストカラー
  const headerText =
    tenant?.headerText || user.headerText || 'シンプルにつながる、スマートにシェア。';
  const textColor = tenant?.textColor || user.textColor || '#FFFFFF';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '28rem',
          overflow: 'hidden',
          margin: '0',
        }}
      >
        {/* 上部のキャッチフレーズ */}
        <div
          style={{
            backgroundColor: mainColor,
            width: 'calc(100% - 40px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomLeftRadius: '15px',
            borderBottomRightRadius: '15px',
            margin: '0 auto',
            padding: '0.75rem 1rem',
          }}
        >
          <p
            style={{
              color: textColor,
              textAlign: 'center',
              fontWeight: '500',
              whiteSpace: 'pre-wrap',
            }}
            className="profile-text"
          >
            {headerText}
          </p>
        </div>

        <div style={{ padding: '1.5rem', paddingBottom: '120px' }}>
          {/* 法人ロゴ */}
          {tenant?.logoUrl && (
            <div
              style={{
                textAlign: 'center',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: tenant.logoWidth ? `${tenant.logoWidth}px` : 'auto',
                  height: tenant.logoHeight ? `${tenant.logoHeight}px` : 'auto',
                  maxWidth: '100%',
                  maxHeight: '120px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Image
                  src={tenant.logoUrl}
                  alt={`${tenant.name}のロゴ`}
                  width={tenant.logoWidth || 200}
                  height={tenant.logoHeight || 100}
                  style={{
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                />
              </div>
            </div>
          )}

          {/* テナント名 */}
          {tenant && (
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{tenant.name}</h3>
            </div>
          )}

          {/* 部署情報 */}
          {user.department && (
            <div style={{ textAlign: 'center', marginBottom: '0.1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#4B5563' }} className="profile-text">
                {user.department.name}
              </p>
            </div>
          )}

          {/* 役職情報 */}
          {user.position && (
            <div style={{ textAlign: 'center', marginBottom: '0.1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#4B5563' }} className="profile-text">
                {user.position}
              </p>
            </div>
          )}

          {/* ユーザー名 */}
          <div style={{ textAlign: 'center', marginTop: '0.3rem', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{user.name}</h1>
            {user.nameEn && (
              <p style={{ color: '#4B5563' }} className="profile-text">
                {user.nameEn}
              </p>
            )}
          </div>

          {/* SNSアイコングリッド */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '32px',
              width: '100%',
              maxWidth: '100%',
              padding: '0',
              boxSizing: 'border-box',
              justifyItems: 'center',
              alignItems: 'start',
              gridAutoRows: 'minmax(auto, auto)',
              gridGap: '16px',
            }}
          >
            {snsLinks.map((link) => (
              <div
                key={link.id}
                style={{
                  width: '100%',
                  maxWidth: '80px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  position: 'relative',
                  boxSizing: 'border-box',
                }}
              >
                <ProfileSnsLink link={link} snsIconColor={snsIconColor} />
              </div>
            ))}
          </div>

          {/* 丸いアイコン（自己紹介、会社HP、メール、電話） */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem',
              width: '100%',
              maxWidth: '100%',
              justifyItems: 'center',
              alignItems: 'center',
              boxSizing: 'border-box',
            }}
          >
            {/* 自己紹介ボタン */}
            <a
              href="#profile-info"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              data-modal-target="profile-modal"
            >
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.3rem',
                  backgroundColor: secondaryColor,
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#161b22' }} className="profile-text">
                自己紹介
              </span>
            </a>

            {/* 会社HPボタン */}
            {hasCompanyUrl && (
              <a
                href={
                  tenant?.customDomain
                    ? `https://${tenant.customDomain}`
                    : user.companyUrl || (user.company ? `https://${user.company}` : '#')
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div
                  style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.3rem',
                    backgroundColor: secondaryColor,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#161b22' }} className="profile-text">
                  {companyLabel}
                </span>
              </a>
            )}

            {/* メールボタン */}
            <a
              href={`mailto:${user.email}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.3rem',
                  backgroundColor: secondaryColor,
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#161b22' }} className="profile-text">
                メール
              </span>
            </a>

            {/* 電話ボタン */}
            {user.phone && (
              <a
                href={`tel:${user.phone}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div
                  style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.3rem',
                    backgroundColor: secondaryColor,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#161b22' }} className="profile-text">
                  電話
                </span>
              </a>
            )}
          </div>

          {/* カスタムリンク */}
          {customLinks.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              {customLinks.map((link) => (
                <ProfileCustomLink key={link.id} link={link} mainColor={mainColor} />
              ))}
            </div>
          )}

          {/* 主要アクションボタン */}
          <div style={{ marginBottom: '1rem' }}>
            {user.phone && (
              <a
                href={`tel:${user.phone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  fontWeight: '500',
                  color: textColor,
                  backgroundColor: mainColor,
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                  marginBottom: '0.75rem',
                }}
                className="profile-text"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: '0.5rem' }}
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                電話をかける
              </a>
            )}
            <a
              href={`/api/vcard/${profile.userId}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                fontWeight: '500',
                color: '#333',
                border: `1px solid ${secondaryColor}`,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                background: '#fff',
              }}
              className="profile-text"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: '0.5rem' }}
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              連絡先に追加
            </a>
          </div>

          {/* フッター */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <div
              style={{
                borderTop: '1px solid #B8B8B8',
                marginTop: '1rem',
                paddingTop: '1rem',
              }}
            >
              <p style={{ fontSize: '0.75rem', color: '#6B7280' }} className="profile-text">
                Powered by Share
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🆕 CTA（Call To Action）エリア */}
      <div
        style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          backgroundColor: 'rgb(29, 78, 216)',
          height: '100px',
          maxHeight: '100px',
          minHeight: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40,
          borderTop: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          boxSizing: 'border-box',
          padding: '20px',
          margin: '0',
          overflow: 'hidden',
        }}
      >
        <Link
          href="https://sns-share.com"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '16px',
          }}
          className="profile-text"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: '8px' }}
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          このサービスを使ってみる
        </Link>
      </div>

      {/* 文字拡大ボタン */}
      <button
        id="zoom-toggle-btn"
        style={{
          position: 'fixed',
          bottom: '120px',
          left: '20px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: 'rgb(29, 78, 216)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 50,
          border: 'none',
          cursor: 'pointer',
        }}
        aria-label="文字サイズを変更"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="11" y1="8" x2="11" y2="14"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </button>

      {/* 自己紹介モーダル */}
      <div id="profile-modal" className="fixed inset-0 z-50 hidden">
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div
            className="relative w-full max-w-md bg-white rounded-lg shadow-xl"
            style={{
              maxWidth: '360px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <button className="absolute top-4 right-4 z-10 text-gray-500" id="close-modal">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 2rem)' }}>
              <div className="flex flex-col items-center py-8">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden mb-4 flex items-center justify-center"
                  style={{ backgroundColor: secondaryColor || '#1E40AF' }}
                >
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || 'プロフィール画像'}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-center mb-1">{user.name}</h2>
                {user.nameEn && (
                  <p className="text-sm text-gray-500 mb-4 profile-text">{user.nameEn}</p>
                )}
                <div className="px-8 w-full mb-6">
                  <p className="text-base text-justify whitespace-pre-wrap profile-text">
                    {user.bio || '自己紹介がここに入ります。'}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-200 w-full"></div>
              <div
                className="p-6 text-base rounded-b-lg"
                style={{
                  backgroundColor: user.bioBackgroundColor || '#FFFFFF',
                  color: user.bioTextColor || '#333333',
                }}
              >
                <div className="space-y-4">
                  {companyName && (
                    <div>
                      <p
                        className="font-semibold profile-text"
                        style={{ color: mainColor || '#1E3A8A' }}
                      >
                        会社 / 組織：
                      </p>
                      <p className="profile-text">{companyName}</p>
                    </div>
                  )}
                  {user.department?.name && (
                    <div>
                      <p
                        className="font-semibold profile-text"
                        style={{ color: mainColor || '#1E3A8A' }}
                      >
                        部署：
                      </p>
                      <p className="profile-text">{user.department.name}</p>
                    </div>
                  )}
                  {user.position && (
                    <div>
                      <p
                        className="font-semibold profile-text"
                        style={{ color: mainColor || '#1E3A8A' }}
                      >
                        役職：
                      </p>
                      <p className="profile-text">{user.position}</p>
                    </div>
                  )}
                  {user.phone && (
                    <div>
                      <p
                        className="font-semibold profile-text"
                        style={{ color: mainColor || '#1E3A8A' }}
                      >
                        TEL：
                      </p>
                      <p className="profile-text">{user.phone}</p>
                    </div>
                  )}
                  {user.email && (
                    <div>
                      <p
                        className="font-semibold profile-text"
                        style={{ color: mainColor || '#1E3A8A' }}
                      >
                        メール：
                      </p>
                      <p className="profile-text">{user.email}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* スタイル定義 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
              .text-enlarged {
                font-size: 110% !important;
                line-height: 1.5 !important;
              }
              .text-enlarged-icon {
                transform: scale(1.1);
              }
              #zoom-toggle-btn:hover {
                background-color: rgb(29, 78, 216, 0.9);
                transform: scale(1.05);
              }
              #zoom-toggle-btn {
                transition: all 0.2s ease;
              }
              .modal-open {
                overflow: hidden;
              }
            `,
        }}
      />

      {/* モーダル用JavaScript */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
              document.addEventListener('DOMContentLoaded', function() {
                const modal = document.getElementById('profile-modal');
                const closeBtn = document.getElementById('close-modal');
                const profileBtn = document.querySelector('[data-modal-target="profile-modal"]');
                if (profileBtn) {
                  profileBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    modal.classList.remove('hidden');
                    document.body.classList.add('modal-open');
                  });
                }
                function closeModal() {
                  modal.classList.add('hidden');
                  document.body.classList.remove('modal-open');
                }
                if (closeBtn) {
                  closeBtn.addEventListener('click', closeModal);
                }
                window.addEventListener('click', function(e) {
                  if (e.target === modal) {
                    closeModal();
                  }
                });
                const zoomToggleBtn = document.getElementById('zoom-toggle-btn');
                let isTextEnlarged = false;
                if (zoomToggleBtn) {
                  zoomToggleBtn.addEventListener('click', function() {
                    isTextEnlarged = !isTextEnlarged;
                    const textElements = document.querySelectorAll('.profile-text');
                    textElements.forEach(function(element) {
                      if (isTextEnlarged) {
                        element.classList.add('text-enlarged');
                      } else {
                        element.classList.remove('text-enlarged');
                      }
                    });
                    const snsTextElements = document.querySelectorAll('.text-xs');
                    snsTextElements.forEach(function(element) {
                      if (isTextEnlarged) {
                        element.classList.add('text-enlarged');
                      } else {
                        element.classList.remove('text-enlarged');
                      }
                    });
                    const snsIcons = document.querySelectorAll('.w-16.h-16');
                    snsIcons.forEach(function(element) {
                      if (isTextEnlarged) {
                        element.classList.add('text-enlarged-icon');
                      } else {
                        element.classList.remove('text-enlarged-icon');
                      }
                    });
                    const svgIcon = zoomToggleBtn.querySelector('svg');
                    if (svgIcon) {
                      if (isTextEnlarged) {
                        svgIcon.innerHTML = \`
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          <line x1="8" y1="11" x2="14" y2="11"></line>
                        \`;
                      } else {
                        svgIcon.innerHTML = \`
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          <line x1="11" y1="8" x2="11" y2="14"></line>
                          <line x1="8" y1="11" x2="14" y2="11"></line>
                        \`;
                      }
                    }
                  });
                }
              });
            `,
        }}
      />
    </div>
  );
}