// app/dashboard/share/page.tsx (更新版)
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';
import { ShareOptionClient } from '@/components/dashboard/ShareOptionClient';
import { QrCodeClient } from '@/components/dashboard/QrCodeClient';
import { PersonalShareSettings } from '@/components/dashboard/PersonalShareSettings';
import { HiShare, HiLink, HiQrcode, HiExclamation, HiExternalLink, HiCog } from 'react-icons/hi';

export default function SharePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <HiShare className="h-8 w-8 text-gray-700 mr-3" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">共有設定</h1>
          <p className="text-muted-foreground text-justify">
            公開プロフィールの設定とQRコードの生成ができます
          </p>
        </div>
      </div>

      <Suspense fallback={<SharePageSkeleton />}>
        <SharePageContent />
      </Suspense>
    </div>
  );
}

// 共有設定の型定義
interface ShareSettings {
  isPublic: boolean;
  slug: string | null;
  views: number;
  lastAccessed: string | null;
}

function SharePageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shareSettings, setShareSettings] = useState<ShareSettings | null>(null);
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
        const response = await fetch('/api/profile/share');
        if (!response.ok) {
          throw new Error('共有設定の取得に失敗しました');
        }

        const data = await response.json();
        setShareSettings(data.shareSettings);
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

  // ベースURLの取得
  const getBaseUrl = () => {
    return typeof window !== 'undefined' ? window.location.origin : '';
  };

  // プロフィールURLの生成
  const getProfileUrl = () => {
    const baseUrl = getBaseUrl();
    return `${baseUrl}/${shareSettings?.slug || ''}`;
  };

  if (isLoading) {
    return <SharePageSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (!shareSettings) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <HiExclamation className="h-5 w-5 text-amber-500 mr-2" />
          <h2 className="text-xl font-semibold">共有設定が必要です</h2>
        </div>
        <p className="text-muted-foreground mb-4 text-justify">
          プロフィールを共有するには、まず共有設定を行ってください。
        </p>
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          プロフィール設定へ
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 左側: 共有設定 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <HiCog className="h-5 w-5 text-gray-700 mr-2" />
          <h2 className="text-xl font-semibold">共有設定</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6 text-justify">
          プロフィールの公開範囲とカスタムURLを設定します
        </p>

        <PersonalShareSettings
          initialValues={shareSettings}
          baseUrl={getBaseUrl()}
          isLoading={isLoading}
        />

        {/* URLコピーセクション - 設定が完了している場合のみ表示 */}
        {hasProfile && shareSettings?.slug && shareSettings.isPublic && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex items-center mb-4">
              <HiLink className="h-5 w-5 text-gray-700 mr-2" />
              <h3 className="text-lg font-semibold">プロフィールURL</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4 text-justify">
              以下のURLであなたのプロフィールを共有できます
            </p>
            <div className="bg-muted p-3 rounded-md mb-4 break-all">
              <p className="font-mono text-sm">{getProfileUrl()}</p>
            </div>
            <ShareOptionClient profileUrl={getProfileUrl()} />
          </div>
        )}
      </div>

      {/* 右側: QRコード生成 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <HiQrcode className="h-5 w-5 text-gray-700 mr-2" />
          <h2 className="text-xl font-semibold">QRコード生成</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4 text-justify">
          プロフィールのQRコードを生成して共有できます。
        </p>

        {hasProfile && shareSettings?.slug && shareSettings.isPublic ? (
          <>
            {/* QRコードデザイナーボタン - 上部に移動 */}
            <div className="mb-6">
              <Link
                href="/qrcode"
                className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 hover:shadow-lg text-white px-4 py-3 rounded-md transition-all duration-200 transform hover:scale-105 qr-designer-button"
              >
                <HiQrcode className="mr-2 h-5 w-5" />
                QRコードデザイナーを使用する
                <HiExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </div>

            {/* 区切り線 */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* QRコードのみダウンロードのタイトル - 追加 */}
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <HiQrcode className="mr-2 h-5 w-5 text-gray-600" />
              QRコードのみダウンロード
            </h2>

            <p className="text-sm text-muted-foreground mb-4 text-justify">
              このQRコードをスキャンすると、あなたのプロフィールページにアクセスできます。
              読み取りやすくするために、黒または濃い色を選択してください。
            </p>

            <QrCodeClient profileUrl={getProfileUrl()} />
          </>
        ) : (
          <div className="bg-yellow-50 border border-yellow-100 rounded-md p-6 text-center">
            <HiExclamation className="h-8 w-8 text-yellow-600 mx-auto mb-4" />
            <p className="text-yellow-700 mb-4">
              QRコードを生成するには、プロフィールを公開設定にして、カスタムURLを設定してください。
            </p>
            <p className="text-sm text-yellow-600">左側の「共有設定」で設定を完了してください。</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SharePageSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground mt-4">共有情報を読み込んでいます...</p>
      </div>
    </div>
  );
}