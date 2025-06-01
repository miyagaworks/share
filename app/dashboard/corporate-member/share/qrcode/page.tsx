// app/dashboard/corporate-member/share/qrcode/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation'; // URLパラメータを取得するために使用
import Link from 'next/link';
import { QrCodeGenerator } from '@/components/qrcode/QrCodeGenerator';
import { CorporateMemberGuard } from '@/components/guards/CorporateMemberGuard';
import { Spinner } from '@/components/ui/Spinner';
import { HiArrowLeft, HiQrcode } from 'react-icons/hi';
// 型定義
interface ProfileData {
  user?: {
    id?: string;
    name?: string;
    nameEn?: string;
    image?: string;
    headerText?: string;
    profileSlug?: string;
  };
}
interface TenantData {
  id?: string;
  name?: string;
  primaryColor?: string;
  textColor?: string;
  headerText?: string;
  logoUrl?: string;
}
// エラーメッセージコンポーネント
function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <p className="text-red-700">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-corporate-primary text-white rounded-md"
      >
        再読み込み
      </button>
    </div>
  );
}
export default function CorporateMemberQrcodePage() {
  // セッションチェック
  useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = '/auth/signin';
    },
  });
  // URLパラメータからスラグを取得
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get('slug') || '';
  // 状態管理
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // APIリクエストを並列に実行
        const [profileResponse, shareResponse] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/corporate-member/share'),
        ]);
        // エラーチェック
        if (!profileResponse.ok) {
          throw new Error('プロフィール情報の取得に失敗しました');
        }
        if (!shareResponse.ok) {
          throw new Error('共有設定の取得に失敗しました');
        }
        // データをパース
        const profileData = await profileResponse.json();
        const shareData = await shareResponse.json();
        // 状態を更新
        setProfileData(profileData);
        setTenantData(shareData.tenant);
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  // プロフィールURLの取得
  const getProfileUrl = () => {
    if (!profileData || !profileData.user) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    // URLパラメータから渡されたスラグがある場合はそれを優先
    const slug = initialSlug || profileData.user.profileSlug || '';
    return `${baseUrl}/${slug}`;
  };
  return (
    <CorporateMemberGuard>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <HiQrcode className="h-8 w-8 text-gray-700 mr-3" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">QRコードデザイナー</h1>
              <p className="text-muted-foreground">あなた専用のQRコードページを作成しましょう</p>
            </div>
          </div>
          <Link
            href="/dashboard/corporate-member/share"
            className="text-sm flex items-center font-medium text-blue-600 hover:text-blue-800"
            style={{
              color: tenantData?.primaryColor || '#1E3A8A',
            }}
          >
            <HiArrowLeft className="mr-1 h-4 w-4" />
            共有設定に戻る
          </Link>
        </div>
        {/* ローディングとエラー状態 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-gray-500">データを読み込んでいます...</p>
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => window.location.reload()} />
        ) : (
          <QrCodeGenerator
            corporateBranding={
              tenantData
                ? {
                    primaryColor: tenantData.primaryColor || '#1E3A8A',
                    textColor: tenantData.textColor || '#FFFFFF',
                    headerText: tenantData.headerText || 'シンプルにつながる、スマートにシェア。',
                  }
                : undefined
            }
            userProfile={{
              profileUrl: getProfileUrl(),
              userName: profileData?.user?.name || '',
              nameEn: profileData?.user?.nameEn || '',
              profileImage: profileData?.user?.image || undefined,
              headerText: profileData?.user?.headerText || undefined,
            }}
            hideBackButton={true} // ページ自体に戻るボタンがあるので非表示
            hideTitleHeader={true} // ページ自体にタイトルがあるので非表示
            initialQrCodeSlug={initialSlug} // URLパラメータから取得したスラグを初期値として設定
          />
        )}
      </div>
    </CorporateMemberGuard>
  );
}