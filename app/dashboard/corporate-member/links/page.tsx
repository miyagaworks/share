// app/dashboard/corporate-member/links/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { HiLink } from 'react-icons/hi';
import { Spinner } from '@/components/ui/Spinner';
import { CorporateMemberGuard } from '@/components/guards/CorporateMemberGuard';
import { CorporateSnsIntegration } from '@/components/corporate/CorporateSnsIntegration';
import { MemberSnsManager } from '@/components/corporate/MemberSnsManager';

// SNSリンクの型定義
interface SnsLink {
  id: string;
  platform: string;
  username: string | null;
  url: string;
  displayOrder: number;
}

// 法人SNSリンクの型定義
interface CorporateSnsLink extends SnsLink {
  isRequired: boolean;
}

// カスタムリンクの型定義
interface CustomLink {
  id: string;
  name: string;
  url: string;
  displayOrder: number;
}

// テナント情報の型定義
interface TenantData {
  id: string;
  name: string;
  primaryColor: string | null;
  secondaryColor: string | null;
}

interface CorporatePlatformUrls {
  [key: string]: {
    username: string | null;
    url: string;
  };
}

interface CorporateSnsLink {
  id: string;
  platform: string;
  username: string | null;
  url: string;
  displayOrder: number;
  isRequired: boolean;
  description: string | null;
}

export default function CorporateMemberLinksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [corporateSnsLinks, setCorporateSnsLinks] = useState<CorporateSnsLink[]>([]);
  const [personalSnsLinks, setPersonalSnsLinks] = useState<SnsLink[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [corporatePlatformUrls, setCorporatePlatformUrls] = useState<CorporatePlatformUrls>({});

  // 個人SNSリンク更新時のハンドラ
  const handleSnsLinkUpdate = (updatedLinks: SnsLink[]) => {
    setPersonalSnsLinks(updatedLinks);
    // 必要に応じてここでページ全体のリロードなども可能
  };

  // 初期データ取得
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // APIを並列に呼び出し
        const [profileResponse, linksResponse, corporateSnsResponse] = await Promise.all([
          fetch('/api/corporate-profile'),
          fetch('/api/corporate-member/links'),
          fetch('/api/corporate/sns'), // 法人共通SNS情報を取得
        ]);

        // 各レスポンスを処理
        if (!profileResponse.ok) {
          throw new Error('法人プロフィール情報の取得に失敗しました');
        }
        if (!linksResponse.ok) {
          throw new Error('リンク情報の取得に失敗しました');
        }
        if (!corporateSnsResponse.ok) {
          throw new Error('法人共通SNS情報の取得に失敗しました');
        }

        const profileData = await profileResponse.json();
        const linksData = await linksResponse.json();
        const corporateSnsData = await corporateSnsResponse.json();

        setTenantData(profileData.tenant);
        setCorporateSnsLinks(linksData.corporateSnsLinks || []);
        setPersonalSnsLinks(linksData.personalSnsLinks);
        setCustomLinks(linksData.customLinks);

        // 法人共通SNSのURLマップを作成
        const urlMap: CorporatePlatformUrls = {};
        (corporateSnsData.snsLinks as CorporateSnsLink[]).forEach((link) => {
          urlMap[link.platform] = {
            username: link.username, // 元のユーザー名をそのまま使用
            url: link.url,
          };
        });
        setCorporatePlatformUrls(urlMap);

        setError(null);
      } catch {
        setError('リンク情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

  // URL上のハッシュフラグメントを処理
  useEffect(() => {
    // URL上のハッシュフラグメントをチェック
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      // #add-sns-[プラットフォーム名] 形式のハッシュがある場合、対応するSNSのセクションにスクロール
      if (hash.startsWith('#add-sns-')) {
        const element = document.getElementById('member-sns-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, [searchParams]);

  // テナントデータを変換して渡す
  const adjustedTenantData = tenantData
    ? {
        ...tenantData,
        corporatePrimary: tenantData.primaryColor || 'var(--color-corporate-primary)',
        corporateSecondary: tenantData.secondaryColor || 'var(--color-corporate-secondary)',
      }
    : null;

  return (
    <CorporateMemberGuard>
      <div className="space-y-6 corporate-theme">
        <div className="flex items-center mb-6">
          <HiLink className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SNS・リンク管理</h1>
            <p className="text-muted-foreground">
              プロフィールに表示するSNSとカスタムリンクを管理します
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-gray-500">リンク情報を読み込んでいます...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-red-700">{error}</p>
            <Button
              variant="corporate"
              className="h-[48px] text-base sm:text-sm mt-4"
              onClick={() => window.location.reload()}
            >
              再読み込み
            </Button>
          </div>
        ) : (
          <>
            {/* 法人SNS統合コンポーネント */}
            <CorporateSnsIntegration
              corporateSnsLinks={corporateSnsLinks}
              personalSnsLinks={personalSnsLinks}
              tenantData={adjustedTenantData}
            />

            {/* 個人SNS管理コンポーネント */}
            <MemberSnsManager
              personalSnsLinks={personalSnsLinks}
              customLinks={customLinks}
              tenantData={adjustedTenantData}
              corporatePlatforms={corporateSnsLinks.map((link) => link.platform)}
              corporatePlatformUrls={corporatePlatformUrls} // この行を追加
              onSnsLinkUpdate={handleSnsLinkUpdate}
              onCustomLinkUpdate={(updatedLinks: CustomLink[]) => setCustomLinks(updatedLinks)}
            />
          </>
        )}
      </div>
    </CorporateMemberGuard>
  );
}