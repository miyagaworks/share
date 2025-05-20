// app/dashboard/corporate-member/design/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { HiColorSwatch, HiInformationCircle, HiSave } from 'react-icons/hi';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { CorporateMemberGuard } from '@/components/guards/CorporateMemberGuard';
import { BrandingPreview } from '@/components/corporate/BrandingPreview';
import { ImprovedMemberDesignSettings } from '@/components/corporate/ImprovedMemberDesignSettings';

// 型定義
interface TenantData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoWidth?: number;
  logoHeight?: number;
  headerText?: string | null;
  textColor?: string | null;
}

interface DesignData {
  mainColor: string | null;
  snsIconColor: string | null;
  bioBackgroundColor?: string | null;
  bioTextColor?: string | null;
}

interface UserData {
  id: string;
  name: string | null;
  nameEn?: string | null;
  bio?: string | null;
  image: string | null;
  department?: {
    id: string;
    name: string;
  } | null;
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
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'sns' | 'bio'>('sns');
  const handleTabChange = (tab: 'sns' | 'bio') => {
    setActiveTab(tab);
  };

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
          department: profileData.user.department,
          position: profileData.user.position || '',
        });

        // デザイン情報を設定
        setDesignData({
          ...designData.design,
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
    bioBackgroundColor?: string | null; // 追加
    bioTextColor?: string | null; // 追加
  }) => {
    try {
      setIsSaving(true);

      const response = await fetch('/api/corporate-member/design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values), // ここで追加したフィールドも送信されます
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'デザイン設定の更新に失敗しました');
      }

      const updatedData = await response.json();

      // 更新されたデータをセット
      setDesignData({
        ...designData,
        ...updatedData.design, // 更新されたデータですべてのフィールドを上書き
      });

      toast.success('デザイン設定を更新しました');
    } catch (error) {
      console.error('設定更新エラー:', error);
      toast.error(error instanceof Error ? error.message : 'デザイン設定の更新に失敗しました');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CorporateMemberGuard>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">デザイン設定</h1>
            <p className="text-gray-500 mt-1 text-justify">
              プロフィールのデザインを法人カラーに合わせて設定します
            </p>
          </div>

          <Button
            variant="corporate"
            onClick={() => handleSaveDesign(designData || {})}
            disabled={isSaving}
            className="flex items-center"
          >
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
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">エラーが発生しました</h3>
            <p className="text-red-700">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              再読み込み
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 設定フォーム */}
            <div className="space-y-6">
              {/* SNSアイコン設定 */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-medium mb-4 flex items-center">
                  <HiColorSwatch className="mr-2 h-5 w-5 text-gray-600" />
                  SNSアイコン設定
                </h2>
                <p className="text-sm text-gray-500 mb-4 text-justify">
                  プロフィールに表示するSNSアイコンのカラー設定をカスタマイズします。
                </p>

                {designData && tenantData && (
                  <ImprovedMemberDesignSettings
                    initialValues={designData}
                    primaryColor={tenantData.primaryColor || '#1E3A8A'}
                    secondaryColor={tenantData.secondaryColor || '#1E40AF'}
                    isLoading={isLoading}
                    onSave={handleSaveDesign}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                  />
                )}
              </div>

              {/* デザインガイドライン */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-medium mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  デザインガイドライン
                </h2>
                <p className="text-sm text-gray-500 mb-4 text-justify">
                  法人プロファイルでは以下の要素をカスタマイズできます:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-md p-4">
                    <h3 className="font-medium mb-2">カスタマイズ可能な項目</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• SNSアイコンの色</li>
                      <li>• 自己紹介ページの背景色</li>
                      <li>• 自己紹介ページの文字色</li>
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
              </div>
            </div>

            {/* プレビュー - こちらを branding/page.tsx と同じレイアウトに修正 */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-medium mb-4 text-center flex items-center justify-center">
                  <HiEye className="mr-2 h-5 w-5 text-gray-600" />
                  プレビュー
                </h2>
                <p className="text-sm text-gray-500 mb-6 text-center">
                  設定がユーザープロフィールにどのように表示されるかのプレビューです
                </p>

                {userData && tenantData && designData && (
                  <BrandingPreview
                    primaryColor={tenantData.primaryColor || '#1E3A8A'}
                    secondaryColor={tenantData.secondaryColor || '#1E40AF'}
                    logoUrl={tenantData.logoUrl}
                    logoWidth={tenantData.logoWidth} // デフォルト値を削除して実際の値を使用
                    logoHeight={tenantData.logoHeight} // デフォルト値を削除して実際の値を使用
                    tenantName={tenantData.name}
                    userName={userData.name || '名前未設定'}
                    userNameEn={userData.nameEn}
                    userImage={userData.image}
                    headerText={tenantData.headerText || ''} // 空文字をデフォルト値に
                    textColor={tenantData.textColor || '#FFFFFF'}
                    snsIconColor={designData.snsIconColor}
                    department={userData.department?.name || ''} // 未設定の場合は空文字
                    position={userData.position || ''} // 未設定の場合は空文字
                    bio={userData.bio || ''} // 未設定の場合は空文字
                    bioBackgroundColor={designData.bioBackgroundColor || '#FFFFFF'}
                    bioTextColor={designData.bioTextColor || '#333333'}
                    highlightSns={activeTab === 'sns'}
                    highlightBio={activeTab === 'bio'}
                  />
                )}

                {/* 保存ボタン（プレビューの下に配置） */}
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="corporate"
                    onClick={() => handleSaveDesign(designData || {})}
                    disabled={isSaving}
                    className="w-full sm:w-auto flex items-center justify-center"
                  >
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
                </div>
              </div>

              {/* ブランディングの活用方法 */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="flex flex-row items-start">
                  <HiInformationCircle className="text-blue-900 h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
                  <div className="w-full">
                    <h3 className="font-medium text-blue-900 mb-1">SNSアイコンカラーについて</h3>
                    <p className="text-sm text-corporate-secondary break-words hyphens-auto text-justify">
                      SNSアイコンの色は、オリジナルのSNSカラーを使用するか、単色で統一するかを選べます。
                      オリジナルカラーは視認性が高く親しみやすい一方、単色にすることで法人プロフィールとしての統一感が生まれます。
                      色選びの際は法人のブランドカラーに合わせることで洗練された印象になります。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CorporateMemberGuard>
  );
}

// HiEyeコンポーネント
function HiEye(props: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}