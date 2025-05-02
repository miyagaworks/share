// app/[slug]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileSnsLink } from "@/components/profile/ProfileSnsLink";
import { ProfileCustomLink } from "@/components/profile/ProfileCustomLink";
import { Metadata } from "next";
import Link from "next/link";
import type { User, CorporateTenant } from "@prisma/client";

interface ExtendedUser extends User {
  snsIconColor: string | null;
  companyUrl: string | null;
  companyLabel: string | null;
  tenant?: CorporateTenant | null;
  adminOfTenant?: CorporateTenant | null;
  department?: {
    id: string;
    name: string;
  } | null;
}

type ProfileParams = {
    params: {
        slug: string;
    };
    searchParams?: Record<string, string | string[]>;
};

// 動的メタデータ生成
export async function generateMetadata({ params }: ProfileParams): Promise<Metadata> {
    const profile = await prisma.profile.findUnique({
        where: { slug: params.slug },
        include: {
            user: true,
        },
    });

    if (!profile) {
        return {
            title: "プロフィールが見つかりません",
            description: "リクエストされたプロフィールは存在しないか、削除された可能性があります。",
        };
    }

    return {
        title: `${profile.user.name || "ユーザー"} | Share`,
        description: profile.user.bio || "Shareでプロフィールをチェックしましょう",
        openGraph: {
            images: profile.user.image ? [profile.user.image] : [],
        },
    };
}

export default async function ProfilePage({ params }: { params: { slug: string } }) {
    const { slug } = params;

    // プロフィールデータの取得（テナント情報も含める）
    const profile = await prisma.profile.findUnique({
      where: { slug },
      include: {
        user: {
          include: {
            tenant: true,
            adminOfTenant: true,
            department: true, // 部署情報を明示的に含める
          },
        },
      },
    });

    // プロフィールが存在しない場合は404
    if (!profile || !profile.isPublic) {
        notFound();
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

    // SNSリンクの取得
    const snsLinks = await prisma.snsLink.findMany({
        where: { userId: profile.userId },
        orderBy: { displayOrder: "asc" },
    });

    // カスタムリンクの取得
    const customLinks = await prisma.customLink.findMany({
        where: { userId: profile.userId },
        orderBy: { displayOrder: "asc" },
    });

    // 法人SNSリンクを取得（ユーザーが法人テナントに所属している場合）
    const tenant = profile.user.tenant || profile.user.adminOfTenant;

    const user = profile.user as ExtendedUser;
 
    // 色設定：テナントがある場合はテナントのprimaryColorを優先
    const mainColor = tenant?.primaryColor || user.mainColor || "#A88C3D";
    const secondaryColor = tenant?.secondaryColor || "#333333"; // セカンダリーカラー追加
    
    // SNSアイコン色：ユーザー設定を維持
    const snsIconColor = user.snsIconColor || "#333333";
    
    // 会社関連情報
    const companyName = tenant?.name || user.company || "";
    const companyLabel = user.companyLabel || "会社HP";
    const hasCompanyUrl = tenant ? true : (user.company && user.companyUrl);
    
    // ヘッダーテキストとテキストカラー（テナントからの取得を優先）
    const headerText = tenant?.headerText || "シンプルにつながる、スマートにシェア。";
    const headerTextColor = tenant?.textColor || "#FFFFFF";

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '28rem',
            overflow: 'hidden',
            margin: '0', // 上部の余白を削除
          }}
        >
          {/* 上部のキャッチフレーズ - 左右に余白あり */}
          <div
            style={{
              backgroundColor: mainColor,
              width: 'calc(100% - 40px)', // 左右に20pxずつの余白
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottomLeftRadius: '15px',
              borderBottomRightRadius: '15px',
              margin: '0 auto', // 中央寄せにするための設定
              padding: '0.75rem 1rem', // 固定高さ削除、paddingで調整
            }}
          >
            <p
              style={{
                color: headerTextColor,
                textAlign: 'center',
                fontWeight: '500',
                whiteSpace: 'pre-wrap', // 改行を保持
              }}
            >
              {headerText}
            </p>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* 法人ロゴ（テナントに所属している場合のみ表示） */}
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

            {/* テナント名または会社名（テナントに所属している場合のみ表示） */}
            {tenant && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{tenant.name}</h3>
              </div>
            )}

            {/* 部署と役職情報（ユーザーが法人テナントに所属している場合） */}
            {profile.user.department && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#4B5563' }}>
                  {profile.user.department.name}
                </p>
                {profile.user.position && (
                  <p style={{ fontSize: '0.875rem', color: '#4B5563' }}>{profile.user.position}</p>
                )}
              </div>
            )}

            {/* ユーザー名 */}
            <div style={{ textAlign: 'center', marginTop: '0.8rem', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{profile.user.name}</h1>
              {profile.user.nameEn && <p style={{ color: '#4B5563' }}>{profile.user.nameEn}</p>}
            </div>

            {/* SNSアイコングリッド（法人SNSリンクを優先） */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                marginBottom: '2rem',
              }}
            >
              {snsLinks.map((link) => (
                <ProfileSnsLink key={link.id} link={link} snsIconColor={snsIconColor} />
              ))}
            </div>

            {/* 丸いアイコン（自己紹介、会社HP、メール、電話） */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                marginBottom: '1.5rem',
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
                    backgroundColor: secondaryColor, // セカンダリーカラーを使用
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
                <span style={{ fontSize: '0.75rem', color: '#161b22' }}>自己紹介</span>
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
                      backgroundColor: secondaryColor, // セカンダリーカラーを使用
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
                  <span style={{ fontSize: '0.75rem', color: '#161b22' }}>{companyLabel}</span>
                </a>
              )}

              {/* メールボタン */}
              <a
                href={`mailto:${profile.user.email}`}
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
                    backgroundColor: secondaryColor, // セカンダリーカラーを使用
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
                <span style={{ fontSize: '0.75rem', color: '#161b22' }}>メール</span>
              </a>

              {/* 電話ボタン */}
              {profile.user.phone && (
                <a
                  href={`tel:${profile.user.phone}`}
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
                      backgroundColor: secondaryColor, // セカンダリーカラーを使用
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
                  <span style={{ fontSize: '0.75rem', color: '#161b22' }}>電話</span>
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
              {profile.user.phone && (
                <a
                  href={`tel:${profile.user.phone}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    fontWeight: '500',
                    color: headerTextColor,
                    backgroundColor: mainColor,
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    marginBottom: '0.75rem',
                  }}
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

            {/* フッター - 順序修正 */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <Link
                href="https://sns-share.com"
                style={{ color: '#2563EB', fontSize: '0.875rem', textDecoration: 'none' }}
                className="hover:underline"
              >
                このサービスを使ってみる
              </Link>

              <div
                style={{
                  borderTop: '1px solid #B8B8B8',
                  marginTop: '1rem',
                  paddingTop: '1rem',
                }}
              >
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Powered by Share</p>
              </div>
            </div>
          </div>
        </div>

        {/* 自己紹介モーダル (クライアント側でJavaScriptで制御) */}
        <div id="profile-modal" className="fixed inset-0 bg-transparent z-50 hidden">
          <div className="bg-white rounded-xl max-w-md mx-auto mt-20 overflow-hidden shadow-lg">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div></div>
                <button
                  className="text-2xl font-bold text-gray-500 hover:text-gray-700"
                  id="close-modal"
                >
                  &times;
                </button>
              </div>

              <div className="flex flex-col items-center mb-4">
                {profile.user.image ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-3">
                    <Image
                      src={profile.user.image}
                      alt={profile.user.name || 'プロフィール画像'}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold mb-3 text-white"
                    style={{ backgroundColor: secondaryColor }} // セカンダリーカラーを使用
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-10 h-10"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                )}

                <h2 className="text-xl font-bold text-center">{profile.user.name}</h2>

                {profile.user.nameEn && (
                  <p className="text-sm text-muted-foreground text-center">{profile.user.nameEn}</p>
                )}
              </div>

              <div className="mb-6">
                {profile.user.bio && (
                  <p className="text-sm leading-relaxed text-justify">{profile.user.bio}</p>
                )}
              </div>

              <div className="border-t pt-4">
                {companyName && (
                  <p className="text-sm mb-2">
                    <span className="font-medium">会社 / 組織：</span> {companyName}
                  </p>
                )}

                {/* 部署と役職情報 */}
                {user.department?.name && (
                  <p className="text-sm mb-2">
                    <span className="font-medium">部署：</span> {user.department.name}
                  </p>
                )}

                {user.position && (
                  <p className="text-sm mb-2">
                    <span className="font-medium">役職：</span> {user.position}
                  </p>
                )}

                {profile.user.phone && (
                  <p className="text-sm mb-2">
                    <span className="font-medium">TEL：</span> {profile.user.phone}
                  </p>
                )}

                {profile.user.email && (
                  <p className="text-sm mb-2">
                    <span className="font-medium">メール：</span> {profile.user.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

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
                            setTimeout(() => {
                                const modalContent = modal.querySelector('.bg-white');
                                if (modalContent) {
                                    modalContent.classList.add('modal-transition-in');
                                }
                            }, 10);
                        });
                    }
                    
                    function closeModal() {
                        const modalContent = modal.querySelector('.bg-white');
                        if (modalContent) {
                            modalContent.classList.remove('modal-transition-in');
                            modalContent.classList.add('modal-transition-out');
                            setTimeout(() => {
                                modal.classList.add('hidden');
                                document.body.classList.remove('modal-open');
                                modalContent.classList.remove('modal-transition-out');
                            }, 200);
                        } else {
                            modal.classList.add('hidden');
                            document.body.classList.remove('modal-open');
                        }
                    }
                    
                    if (closeBtn) {
                        closeBtn.addEventListener('click', closeModal);
                    }
                    
                    window.addEventListener('click', function(e) {
                        if (e.target === modal) {
                            closeModal();
                        }
                    });
                });
                `,
          }}
        />
      </div>
    );
}