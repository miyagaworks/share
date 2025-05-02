// app/dashboard/corporate-member/share/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { HiShare, HiQrcode, HiLink, HiLightBulb, HiInformationCircle } from 'react-icons/hi';
import { Spinner } from '@/components/ui/Spinner';
import { CorporateMemberGuard } from '@/components/guards/CorporateMemberGuard';
import { QrCodeGenerator } from '@/components/corporate/QrCodeGenerator';
import { MemberShareSettings } from '@/components/corporate/MemberShareSettings';

// テナント情報の型定義
interface TenantData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

// 共有設定の型定義
interface ShareSettings {
  isPublic: boolean;
  slug: string | null;
  views: number;
  lastAccessed: string | null;
}

export default function CorporateMemberSharePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shareSettings, setShareSettings] = useState<ShareSettings | null>(null);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // 共有設定情報を取得
        const response = await fetch('/api/corporate-member/share');
        if (!response.ok) {
          throw new Error('共有設定の取得に失敗しました');
        }

        const data = await response.json();
        setShareSettings(data.shareSettings);
        setTenantData(data.tenant);
        setHasProfile(data.hasProfile);
        setError(null);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

  // 共有設定保存処理
  const handleSaveShareSettings = async (values: { isPublic?: boolean; slug?: string | null }) => {
    try {
      const response = await fetch('/api/corporate-member/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '共有設定の更新に失敗しました');
      }

      const updatedData = await response.json();
      setShareSettings(updatedData.shareSettings);
      setHasProfile(true);
      toast.success('共有設定を更新しました');
    } catch (error) {
      console.error('設定更新エラー:', error);
      toast.error(error instanceof Error ? error.message : '共有設定の更新に失敗しました');
      throw error;
    }
  };

  // プロフィールURLの生成
  const getProfileUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/${shareSettings?.slug || ''}`;
  };

  // ベースURLの取得
  const getBaseUrl = () => {
    return typeof window !== 'undefined' ? window.location.origin : '';
  };

  return (
    <CorporateMemberGuard>
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <HiShare className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">共有設定</h1>
            <p className="text-muted-foreground">プロフィールの公開設定とQRコード生成</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-gray-500">共有設定を読み込んでいます...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-corporate-primary text-white rounded-md"
            >
              再読み込み
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {/* 左: 共有設定フォーム */}
              <div className="rounded-lg border border-[#1E3A8A]/40 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <HiLink className="mr-2 h-5 w-5 text-gray-600" />
                  共有設定
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  プロフィールの公開範囲とURLを設定します。
                </p>

                {shareSettings && tenantData && (
                  <MemberShareSettings
                    initialValues={shareSettings}
                    baseUrl={getBaseUrl()}
                    primaryColor={tenantData.primaryColor || '#1E3A8A'}
                    isLoading={isLoading}
                    onSave={handleSaveShareSettings}
                  />
                )}
              </div>

              {/* 右: QRコードジェネレーター */}
              <div className="rounded-lg border border-[#1E3A8A]/40 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <HiQrcode className="mr-2 h-5 w-5 text-gray-600" />
                  QRコード生成
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  プロフィールのQRコードを生成して共有できます。
                </p>

                {hasProfile && shareSettings?.slug ? (
                  <QrCodeGenerator
                    profileUrl={getProfileUrl()}
                    primaryColor={tenantData?.primaryColor || '#1E3A8A'}
                  />
                ) : (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-md p-6 text-center">
                    <p className="text-yellow-700 mb-4">
                      プロフィールが作成されていないか、URLが設定されていません。
                      まず、「共有設定」セクションでURLを設定してください。
                    </p>
                    <button
                      onClick={() => {
                        const element = document.querySelector('[name="slug"]');
                        if (element instanceof HTMLElement) {
                          element.focus();
                        }
                      }}
                      className="px-4 py-2 rounded-md text-white"
                      style={{ backgroundColor: tenantData?.primaryColor || '#1E3A8A' }}
                    >
                      URLを設定する
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 共有のヒント */}
            <div className="rounded-lg border border-[#1E3A8A]/40 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-[#1E3A8A]">
                <HiLightBulb className="mr-2 h-5 w-5 text-[#1E3A8A]" />
                共有のヒント
              </h2>
              <p className="text-sm text-gray-600 mb-4">効果的なプロフィール共有のためのヒント:</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border rounded-md p-4" style={{ borderColor: '#1E3A8A30' }}>
                  <h3 className="font-medium mb-2 flex items-center">
                    <HiLink className="mr-2 h-4 w-4 text-[#1E3A8A]" />
                    <span className="text-[#1E3A8A]">カスタムURLの活用</span>
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 覚えやすく、シンプルなURLを設定する</li>
                    <li>• 名前やニックネームを使用すると識別しやすい</li>
                    <li>• ビジネスカードやメール署名に追加する</li>
                  </ul>
                </div>

                <div className="border rounded-md p-4" style={{ borderColor: '#1E3A8A30' }}>
                  <h3 className="font-medium mb-2 flex items-center">
                    <HiQrcode className="mr-2 h-4 w-4 text-[#1E3A8A]" />
                    <span className="text-[#1E3A8A]">QRコードの活用方法</span>
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 名刺やパンフレットに印刷する</li>
                    <li>• プレゼン資料の最後のスライドに表示する</li>
                    <li>• イベントや展示会のブースに掲示する</li>
                  </ul>
                </div>
              </div>

              <div
                className="mt-6 rounded-md p-4"
                style={{
                  backgroundColor: '#1E3A8A10',
                  borderColor: '#1E3A8A30',
                  borderWidth: '1px',
                }}
              >
                <p className="text-sm flex items-start text-justify text-[#1E3A8A]">
                  <HiInformationCircle className="h-5 w-5 flex-shrink-0 mr-2 mt-0.5 text-[#1E3A8A]" />
                  <span className="text-justify">
                    <strong>プロのヒント:</strong> 法人メンバーとしてのアイデンティティを示すため、
                    プロフィールには企業のロゴと企業カラーが自動的に適用されます。これにより、
                    企業のブランドイメージを維持しながら、個人の専門性をアピールできます。
                  </span>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </CorporateMemberGuard>
  );
}