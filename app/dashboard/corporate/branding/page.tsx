// app/dashboard/corporate/branding/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { toast } from 'react-hot-toast';
import { HiSave, HiRefresh } from 'react-icons/hi';
import Image from 'next/image';

// テナント情報の型定義
interface TenantData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

// プレビューカードのプロパティ
interface PreviewCardProps {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  name: string;
}

// プレビューカードコンポーネント
const PreviewCard = ({ logoUrl, primaryColor, secondaryColor, name }: PreviewCardProps) => {
  return (
    <div className="rounded-lg overflow-hidden shadow-lg w-72 mx-auto">
      {/* ヘッダー部分 */}
      <div
        className="h-24 flex items-center justify-center"
        style={{ backgroundColor: primaryColor || '#3B82F6' }}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`${name}のロゴ`}
            width={64}
            height={64}
            className="h-16 w-16 object-contain"
          />
        ) : (
          <div className="text-white text-xl font-bold">{name}</div>
        )}
      </div>

      {/* コンテンツ部分 */}
      <div className="bg-white p-4">
        <div className="mb-4">
          <h3 className="font-bold" style={{ color: primaryColor || '#3B82F6' }}>
            田中 太郎
          </h3>
          <p className="text-sm text-gray-500">営業部 - マネージャー</p>
        </div>

        {/* ボタン */}
        <button
          className="w-full py-2 rounded-md text-white mb-2"
          style={{ backgroundColor: primaryColor || '#3B82F6' }}
        >
          連絡先を追加
        </button>

        <button
          className="w-full py-2 rounded-md mb-2"
          style={{
            backgroundColor: 'white',
            color: secondaryColor || '#1E40AF',
            borderWidth: '1px',
            borderColor: secondaryColor || '#1E40AF',
          }}
        >
          プロフィールを見る
        </button>
      </div>
    </div>
  );
};

export default function CorporateBrandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#1E40AF');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // テナント情報を取得
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);

        // テナント情報取得API
        const response = await fetch('/api/corporate/tenant');

        if (!response.ok) {
          throw new Error('テナント情報の取得に失敗しました');
        }

        const data = await response.json();
        setTenantData(data.tenant);
        setIsAdmin(data.userRole === 'admin');

        // 色情報を設定
        if (data.tenant.primaryColor) {
          setPrimaryColor(data.tenant.primaryColor);
        }
        if (data.tenant.secondaryColor) {
          setSecondaryColor(data.tenant.secondaryColor);
        }

        // ロゴURLを設定
        setLogoUrl(data.tenant.logoUrl);

        setError(null);
      } catch (err) {
        console.error('テナント情報取得エラー:', err);
        setError('テナント情報を読み込めませんでした');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, [session]);

  // ブランディング設定を保存
  const handleSaveBranding = async () => {
    if (!tenantData) return;

    try {
      setIsSaving(true);

      // ブランディング設定更新API
      const response = await fetch('/api/corporate/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryColor,
          secondaryColor,
          logoUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ブランディング設定の更新に失敗しました');
      }

      const data = await response.json();

      toast.success('ブランディング設定を保存しました');

      // テナントデータを更新
      if (data.tenant) {
        setTenantData({
          ...tenantData,
          primaryColor: data.tenant.primaryColor,
          secondaryColor: data.tenant.secondaryColor,
          logoUrl: data.tenant.logoUrl,
        });
      }
    } catch (err) {
      console.error('ブランディング更新エラー:', err);
      toast.error(err instanceof Error ? err.message : 'ブランディング設定の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ロゴアップロード完了時の処理
  const handleLogoUpload = (url: string | null) => {
    setLogoUrl(url);
  };

  // 読み込み中
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">エラーが発生しました</h3>
        <p className="text-red-700">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          再読み込み
        </Button>
      </div>
    );
  }

  // テナントデータがない場合
  if (!tenantData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">法人プランが有効ではありません</h3>
        <p className="text-yellow-700">法人プランにアップグレードしてこの機能をご利用ください。</p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/subscription')}>
          プランを見る
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー部分 */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">ブランディング設定</h1>
          <p className="text-gray-500 mt-1">
            会社のロゴとカラーを設定して、統一感のあるプロフィールを作成します
          </p>
        </div>

        {isAdmin && (
          <Button onClick={handleSaveBranding} disabled={isSaving} className="flex items-center">
            {isSaving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                保存中...
              </>
            ) : (
              <>
                <HiSave className="mr-2 h-4 w-4" />
                変更を保存
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 設定フォーム */}
        <div className="space-y-6">
          {/* ロゴ設定 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">企業ロゴ</h2>
            <p className="text-sm text-gray-500 mb-4">
              プロフィールに表示する企業ロゴをアップロードしてください。
              推奨サイズは400x400ピクセルです。
            </p>

            <ImageUpload value={logoUrl} onChange={handleLogoUpload} disabled={!isAdmin} />

            {!isAdmin && (
              <p className="text-sm text-amber-600 mt-2">
                ※ブランディング設定の変更には管理者権限が必要です
              </p>
            )}
          </div>

          {/* カラー設定 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">企業カラー</h2>
            <p className="text-sm text-gray-500 mb-4">
              プロフィールのカラースキームを設定します。
              プライマリーカラーはヘッダーやボタンに、セカンダリーカラーはアクセントに使用されます。
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  プライマリーカラー
                </label>
                <EnhancedColorPicker
                  color={primaryColor}
                  onChange={setPrimaryColor}
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  セカンダリーカラー
                </label>
                <EnhancedColorPicker
                  color={secondaryColor}
                  onChange={setSecondaryColor}
                  disabled={!isAdmin}
                />
              </div>
            </div>

            {/* カラーリセットボタン */}
            {isAdmin && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPrimaryColor('#3B82F6');
                    setSecondaryColor('#1E40AF');
                  }}
                  className="flex items-center"
                >
                  <HiRefresh className="mr-2 h-4 w-4" />
                  デフォルトに戻す
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* プレビュー */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4 text-center">プレビュー</h2>
            <p className="text-sm text-gray-500 mb-6 text-center">
              設定がユーザープロフィールにどのように表示されるかのプレビューです
            </p>

            <PreviewCard
              logoUrl={logoUrl}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              name={tenantData.name}
            />
          </div>

          {/* ブランディングの活用方法 */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
            <h3 className="font-medium text-blue-800 mb-2">企業ブランディングのポイント</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• ロゴは背景色との対比が明確なものを選ぶと視認性が高まります</li>
              <li>• プライマリーカラーとセカンダリーカラーは補色関係にすると効果的です</li>
              <li>• 企業のブランドガイドラインに沿った色を選ぶことで統一感が生まれます</li>
              <li>• シンプルで識別しやすいデザインがモバイル端末でも見やすくなります</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}