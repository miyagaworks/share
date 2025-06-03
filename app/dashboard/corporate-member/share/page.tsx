// app/dashboard/corporate-member/share/page.tsx (修正版)
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  HiShare,
  HiQrcode,
  HiLink,
  HiLightBulb,
  HiInformationCircle,
  HiExternalLink,
  HiClipboardCopy,
} from 'react-icons/hi';
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
  textColor?: string | null;
  headerText?: string | null;
}

// 共有設定の型定義
interface ShareSettings {
  isPublic: boolean;
  slug: string | null;
  views: number;
  lastAccessed: string | null;
}

// QRコードページの型定義
interface QrCodePage {
  id: string;
  slug: string;
  primaryColor: string;
  textColor: string;
  createdAt: string;
  updatedAt: string;
}

export default function CorporateMemberSharePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shareSettings, setShareSettings] = useState<ShareSettings | null>(null);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QRコード関連の状態
  const [qrCodePages, setQrCodePages] = useState<QrCodePage[]>([]);
  const [selectedQrCode, setSelectedQrCode] = useState<QrCodePage | null>(null);
  const [qrCodeSlug, setQrCodeSlug] = useState('');
  const [isCheckingQrSlug, setIsCheckingQrSlug] = useState(false);
  const [isQrSlugAvailable, setIsQrSlugAvailable] = useState(false);

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

        // QRコードページ一覧を取得
        try {
          const qrResponse = await fetch('/api/qrcode');
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            setQrCodePages(qrData.qrCodes || []);
            if (qrData.qrCodes && qrData.qrCodes.length > 0) {
              const latestQrCode = qrData.qrCodes[0];
              setSelectedQrCode(latestQrCode);
              setQrCodeSlug(latestQrCode.slug);
              setIsQrSlugAvailable(true);
            }
          }
        } catch (qrError) {
          console.warn('QRコード情報の取得に失敗しました:', qrError);
          // QRコード取得失敗は致命的でないため、処理を続行
        }
      } catch {
        setError('データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

  // スラグの利用可能性をチェック
  const checkQrSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setIsQrSlugAvailable(false);
      return;
    }
    setIsCheckingQrSlug(true);
    try {
      const response = await fetch(`/api/qrcode/check-slug?slug=${slug}`);
      const data = await response.json();
      // 自分のものか新規作成可能な場合
      setIsQrSlugAvailable(data.available || data.ownedByCurrentUser);
    } catch {
      setIsQrSlugAvailable(false);
    } finally {
      setIsCheckingQrSlug(false);
    }
  };

  // QRコードスラグ変更ハンドラー
  const handleQrCodeSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setQrCodeSlug(newSlug);
    if (newSlug.length >= 3) {
      checkQrSlugAvailability(newSlug);
    } else {
      setIsQrSlugAvailable(false);
    }
  };

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
      return updatedData;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '共有設定の更新に失敗しました');
      throw err;
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

  // QRコードページURLの生成
  const getQrCodePageUrl = () => {
    if (!selectedQrCode) return '';
    const baseUrl = getBaseUrl();
    return `${baseUrl}/qr/${selectedQrCode.slug}`;
  };

  // URLをクリップボードにコピー
  const copyUrlToClipboard = () => {
    navigator.clipboard
      .writeText(getProfileUrl())
      .then(() => toast.success('URLをコピーしました'))
      .catch(() => toast.error('URLのコピーに失敗しました'));
  };

  // QRコードページURLをコピー
  const copyQrCodePageUrl = () => {
    const url = getQrCodePageUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success('QRコードページURLをコピーしました');
    }
  };

  // QRコードページを開く
  const openQrCodePage = () => {
    const url = getQrCodePageUrl();
    if (url) {
      window.open(url, '_blank');
    }
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
              className="mt-4 px-4 py-2 bg-[#1E3A8A] hover:bg-[#122153] text-white rounded-md transition-colors"
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

                {/* URLコピーボタンを追加 - 保存ボタンの下部 */}
                {hasProfile && shareSettings?.slug && (
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <p className="text-sm text-gray-500 mb-4">
                      以下のURLであなたのプロフィールを共有できます
                    </p>
                    <div className="bg-gray-50 p-3 rounded-md mb-4 break-all">
                      <p className="font-mono text-sm">{getProfileUrl()}</p>
                    </div>
                    <Button
                      variant="corporate"
                      onClick={copyUrlToClipboard}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <HiLink className="h-4 w-4" />
                      URLをコピー
                    </Button>
                  </div>
                )}
              </div>

              {/* 右: QRコードジェネレーター */}
              <div className="rounded-lg border border-[#1E3A8A]/40 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <HiQrcode className="mr-2 h-5 w-5 text-gray-600" />
                  公開QRコード生成
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  プロフィールのQRコードを生成して共有できます。
                </p>

                {hasProfile && shareSettings?.slug ? (
                  <>
                    {/* QRコードカスタムURL設定フォーム（1つのみ） */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        QRコードページのURL
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          {getBaseUrl()}/qr/
                        </span>
                        <input
                          type="text"
                          value={qrCodeSlug}
                          onChange={handleQrCodeSlugChange}
                          className="flex-1 text-sm p-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="your-custom-url"
                          minLength={3}
                          maxLength={20}
                        />
                      </div>
                      {isCheckingQrSlug ? (
                        <p className="text-xs text-gray-500 mt-1">チェック中...</p>
                      ) : qrCodeSlug.length >= 3 ? (
                        isQrSlugAvailable ? (
                          <p className="text-xs text-green-600 mt-1">✓ このURLは利用可能です</p>
                        ) : (
                          <p className="text-xs text-red-600 mt-1">
                            ✗ このURLは既に他のユーザーに使用されています
                          </p>
                        )
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">3文字以上入力してください</p>
                      )}
                    </div>

                    {/* QRコードデザイナーボタン */}
                    <div className="mb-6">
                      <Link
                        href={`/dashboard/corporate-member/share/qrcode?slug=${shareSettings?.slug || ''}`}
                        className="inline-flex items-center justify-center w-full bg-[#1E3A8A] hover:bg-[#122153] hover:shadow-lg text-white px-4 py-3 rounded-md transition-all duration-200 transform hover:scale-105 qr-designer-button"
                        aria-label="QRコードデザイナーを開く"
                      >
                        <HiQrcode className="mr-2 h-5 w-5 text-white" />
                        <span className="text-white">QRコードデザイナーを使用する</span>
                        <HiExternalLink className="ml-2 h-4 w-4 text-white" />
                      </Link>
                    </div>

                    {/* QRコードページ管理セクション */}
                    {selectedQrCode ? (
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                        <h3 className="text-sm font-medium text-green-800 mb-2">
                          QRコードページが作成されています
                        </h3>
                        <p className="text-sm text-green-600 mb-3">
                          作成日: {new Date(selectedQrCode.createdAt).toLocaleDateString('ja-JP')}
                        </p>
                        <div className="bg-white p-3 rounded-md mb-3 break-all border border-green-200">
                          <p className="font-mono text-sm">{getQrCodePageUrl()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={copyQrCodePageUrl}
                            variant="corporate"
                            size="sm"
                            className="flex-1 flex items-center justify-center gap-2"
                          >
                            <HiClipboardCopy className="h-4 w-4" />
                            コピー
                          </Button>
                          <Button
                            onClick={openQrCodePage}
                            variant="corporate"
                            size="sm"
                            className="flex-1 flex items-center justify-center gap-2"
                          >
                            <HiExternalLink className="h-4 w-4" />
                            開く
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <h3 className="text-sm font-medium text-yellow-800 mb-2">
                          QRコードページを作成してください
                        </h3>
                        <p className="text-sm text-yellow-600 text-justify">
                          上記の「QRコードデザイナーを使用する」ボタンからQRコードページを作成すると、ここでQRコードページのURLを管理できます。
                        </p>
                      </div>
                    )}

                    {/* 区切り線 */}
                    <div className="border-t border-gray-200 my-6"></div>

                    {/* QRコードのみダウンロードのタイトル */}
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <HiQrcode className="mr-2 h-5 w-5 text-gray-600" />
                      QRコードのみダウンロード
                    </h2>

                    {/* QrCodeGenerator - URLスラグ入力部分を非表示 */}
                    <QrCodeGenerator
                      profileUrl={getProfileUrl()}
                      primaryColor={tenantData?.primaryColor || '#1E3A8A'}
                      textColor={tenantData?.textColor || '#FFFFFF'}
                      qrCodeSlug={qrCodeSlug}
                      onQrCodeSlugChange={(slug) => {
                        setQrCodeSlug(slug);
                        checkQrSlugAvailability(slug);
                      }}
                      hideSlugInput={true}
                      hideGenerateButton={true}
                    />
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-md p-6 text-center">
                    <p className="text-yellow-700 mb-4">
                      プロフィールが作成されていないか、URLが設定されていません。
                      まず、「共有設定」セクションでURLを設定してください。
                    </p>
                    <Button
                      variant="corporate"
                      onClick={() => {
                        const element = document.querySelector('[name="slug"]');
                        if (element instanceof HTMLElement) {
                          element.focus();
                        }
                      }}
                    >
                      URLを設定する
                    </Button>
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