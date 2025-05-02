// app/dashboard/corporate-member/design/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { HiColorSwatch, HiInformationCircle } from 'react-icons/hi';
import { Spinner } from '@/components/ui/Spinner';
import { CorporateMemberGuard } from '@/components/guards/CorporateMemberGuard';
import { BrandingPreview } from '@/components/corporate/BrandingPreview';
import { ImprovedMemberDesignSettings } from '@/components/corporate/ImprovedMemberDesignSettings';

// 型定義
interface TenantData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null; // 表示用に残す
  logoWidth?: number;
  logoHeight?: number;
  headerText?: string | null;
  textColor?: string | null;
}

interface DesignData {
  mainColor: string | null;
  snsIconColor: string | null;
}

interface UserData {
  id: string;
  name: string | null;
  nameEn?: string | null;
  bio?: string | null;
  image: string | null;
  department?: string | null;
  position?: string | null;
}

export default function ImprovedCorporateMemberDesignPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [designData, setDesignData] = useState<DesignData | null>(null);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
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

        // プロフィール情報を取得
        const profileResponse = await fetch('/api/corporate-member/profile');
        if (!profileResponse.ok) {
          throw new Error('プロフィール情報の取得に失敗しました');
        }
        const profileData = await profileResponse.json();

        // デザイン設定情報を取得
        const designResponse = await fetch('/api/corporate-member/design');
        if (!designResponse.ok) {
          throw new Error('デザイン設定の取得に失敗しました');
        }
        const designData = await designResponse.json();

        // ユーザー情報を設定
        setUserData({
          id: profileData.user.id,
          name: profileData.user.name,
          nameEn: profileData.user.nameEn,
          bio: profileData.user.bio,
          image: profileData.user.image,
          department: profileData.user.department?.name || '営業部',
          position: profileData.user.position || '',
        });

        // デザイン情報を設定
        setDesignData({
          ...designData.design,
          // デフォルトのセカンダリーカラーをテナントから取得
          secondaryColor: designData.design.secondaryColor || designData.tenant.secondaryColor,
        });

        setTenantData(designData.tenant);

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

  // デザイン設定保存処理
  const handleSaveDesign = async (values: {
    snsIconColor?: string | null;
    mainColor?: string | null;
  }) => {
    try {
      const response = await fetch('/api/corporate-member/design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'デザイン設定の更新に失敗しました');
      }

      const updatedData = await response.json();

      // 更新されたデータをセット
      setDesignData({
        ...updatedData.design,
      });

      toast.success('デザイン設定を更新しました');
    } catch (error) {
      console.error('設定更新エラー:', error);
      toast.error(error instanceof Error ? error.message : 'デザイン設定の更新に失敗しました');
      throw error;
    }
  };

  return (
    <CorporateMemberGuard>
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <HiColorSwatch className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">デザイン設定</h1>
            <p className="text-muted-foreground">
              法人ブランディングに合わせたデザインのカスタマイズ
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-gray-500">デザイン情報を読み込んでいます...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 text-white rounded-md"
              style={{ backgroundColor: 'var(--color-corporate-primary)' }}
            >
              再読み込み
            </button>
          </div>
        ) : (
          <>
            {/* メインコンテンツ */}
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {/* 左: 設定フォーム */}
              <div className="rounded-lg border border-[#1E3A8A]/40 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <HiColorSwatch className="mr-2 h-5 w-5 text-gray-600" />
                  カスタマイズ設定
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  法人ブランディングの範囲内で、個人プロフィールのデザインをカスタマイズできます。
                </p>

                {designData && tenantData && (
                  <ImprovedMemberDesignSettings
                    initialValues={designData}
                    primaryColor={tenantData.primaryColor || '#1E3A8A'}
                    secondaryColor={tenantData.secondaryColor || '#1E40AF'}
                    isLoading={isLoading}
                    onSave={handleSaveDesign}
                  />
                )}
              </div>

              {/* 右: プレビュー */}
              <div className="rounded-lg border border-[#1E3A8A]/40 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <HiInformationCircle className="mr-2 h-5 w-5 text-gray-600" />
                    プレビュー
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  設定が反映されたプロフィールのプレビューです。リアルタイムに変更が表示されます。
                </p>

                {userData && tenantData && designData && (
                  <BrandingPreview
                    primaryColor={tenantData.primaryColor || '#1E3A8A'}
                    secondaryColor={tenantData.secondaryColor || '#1E40AF'} // テナントから取得
                    logoUrl={tenantData.logoUrl}
                    logoWidth={tenantData.logoWidth}
                    logoHeight={tenantData.logoHeight}
                    tenantName={tenantData.name}
                    userName={userData.name || '名前未設定'}
                    userNameEn={userData.nameEn}
                    userImage={userData.image}
                    headerText={tenantData.headerText} // テナントのヘッダーテキストを使用
                    textColor={tenantData.textColor || '#FFFFFF'} // テナントのテキストカラーを使用
                    snsIconColor={designData.snsIconColor}
                    bio={
                      userData.bio
                        ? userData.bio
                        : `${userData.department || '営業部'} ${userData.position ? '- ' + userData.position : ''}`
                    }
                    department={userData.department}
                    position={userData.position}
                  />
                )}
              </div>
            </div>

            {/* デザインガイドライン */}
            <div className="rounded-lg border border-[#1E3A8A]/40 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">デザインのガイドライン</h2>
              <p className="text-sm text-gray-600 mb-4">
                法人プロファイルでは以下の要素をカスタマイズできます:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-md p-4">
                  <h3 className="font-medium mb-2">カスタマイズ可能な項目</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• SNSアイコンの色</li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-md p-4">
                  <h3 className="font-medium mb-2">法人設定による固定項目</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• プライマリーカラー (ヘッダー背景色など)</li>
                    <li>• セカンダリーカラー (アイコン背景色など)</li>
                    <li>• ヘッダーテキスト</li>
                    <li>• ヘッダーテキストの色</li>
                    <li>• 法人ロゴ</li>
                    <li>• プライマリーボタン背景色</li>
                    <li>• 法人共通SNSリンク</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mt-6">
                <p className="text-sm text-blue-900 text-justify">
                  <strong>ヒント:</strong>{' '}
                  自分のブランドや個性を表現したい場合は、プロフィール編集ページで自己紹介文を編集するとともに、
                  SNSアイコンカラーを工夫することで、法人ブランディングの統一感を保ちながらも個性を出すことができます。
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </CorporateMemberGuard>
  );
}