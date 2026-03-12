// app/dashboard/partner/branding/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { HiSave, HiRefresh, HiUpload, HiX, HiInformationCircle } from 'react-icons/hi';
import Image from 'next/image';
import { DEFAULT_PRIMARY_COLOR } from '@/lib/brand/defaults';

interface BrandingData {
  brandName: string;
  logoUrl: string | null;
  logoWidth: number | null;
  logoHeight: number | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  customDomain: string | null;
  domainVerified: boolean;
  companyName: string | null;
  companyAddress: string | null;
  privacyPolicyUrl: string | null;
  termsUrl: string | null;
  emailFromName: string | null;
  supportEmail: string | null;
}

export default function PartnerBrandingPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ブランド設定
  const [brandName, setBrandName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState<{ width: number; height: number }>({ width: 400, height: 400 });
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [secondaryColor, setSecondaryColor] = useState<string>('');
  const [customDomain, setCustomDomain] = useState<string | null>(null);
  const [domainVerified, setDomainVerified] = useState(false);

  // フッター情報
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('');
  const [termsUrl, setTermsUrl] = useState('');

  // メール設定
  const [emailFromName, setEmailFromName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');

  // ロゴアップロード
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);
  const [sizeSlider, setSizeSlider] = useState(100);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [customWidth, setCustomWidth] = useState(400);
  const [customHeight, setCustomHeight] = useState(400);
  const originalLogoSize = useRef<{ width: number; height: number } | null>(null);

  // データ取得
  useEffect(() => {
    const fetchBranding = async () => {
      if (!session?.user?.id) return;
      try {
        setIsLoading(true);
        const response = await fetch('/api/partner/branding');
        if (!response.ok) throw new Error('ブランディング情報の取得に失敗しました');
        const data = await response.json();
        const b: BrandingData = data.branding;

        setBrandName(b.brandName);
        setLogoUrl(b.logoUrl);
        if (b.logoWidth && b.logoHeight) {
          setLogoSize({ width: b.logoWidth, height: b.logoHeight });
          setCustomWidth(b.logoWidth);
          setCustomHeight(b.logoHeight);
          originalLogoSize.current = { width: b.logoWidth, height: b.logoHeight };
        }
        setFaviconUrl(b.faviconUrl);
        setPrimaryColor(b.primaryColor);
        setSecondaryColor(b.secondaryColor || '');
        setCustomDomain(b.customDomain);
        setDomainVerified(b.domainVerified);
        setCompanyName(b.companyName || '');
        setCompanyAddress(b.companyAddress || '');
        setPrivacyPolicyUrl(b.privacyPolicyUrl || '');
        setTermsUrl(b.termsUrl || '');
        setEmailFromName(b.emailFromName || '');
        setSupportEmail(b.supportEmail || '');
        setError(null);
      } catch {
        setError('ブランディング情報を読み込めませんでした');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBranding();
  }, [session]);

  // 画像アップロード処理（共通）
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (dataUrl: string, width: number, height: number) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('画像ファイルのみアップロードできます');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('ファイルサイズは5MB以下にしてください');
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        const img = new window.Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > 400) {
            const ratio = height / width;
            width = 400;
            height = Math.round(width * ratio);
          }
          onSuccess(event.target!.result as string, width, height);
          setIsUploading(false);
        };
        img.src = event.target.result;
      }
    };
    reader.onerror = () => {
      setUploadError('画像の読み込みに失敗しました');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e, (dataUrl, width, height) => {
      setLogoUrl(dataUrl);
      originalLogoSize.current = { width, height };
      setLogoSize({ width, height });
      setCustomWidth(width);
      setCustomHeight(height);
      setSizeSlider(100);
      toast.success('ロゴをアップロードしました');
    });
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e, (dataUrl) => {
      setFaviconUrl(dataUrl);
      toast.success('ファビコンをアップロードしました');
    });
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    setLogoSize({ width: 400, height: 400 });
    setCustomWidth(400);
    setCustomHeight(400);
    setSizeSlider(100);
    originalLogoSize.current = null;
  };

  // 保存
  const handleSave = async () => {
    if (!brandName.trim()) {
      toast.error('ブランド名は必須です');
      return;
    }
    try {
      setIsSaving(true);
      const response = await fetch('/api/partner/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName,
          logoUrl,
          logoWidth: logoSize.width,
          logoHeight: logoSize.height,
          faviconUrl,
          primaryColor,
          secondaryColor: secondaryColor || null,
          companyName: companyName || null,
          companyAddress: companyAddress || null,
          privacyPolicyUrl: privacyPolicyUrl || null,
          termsUrl: termsUrl || null,
          emailFromName: emailFromName || null,
          supportEmail: supportEmail || null,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存に失敗しました');
      }
      toast.success('ブランディング設定を保存しました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">エラー</h3>
        <p className="text-red-700">{error}</p>
        <Button variant="corporateOutline" className="mt-4" onClick={() => window.location.reload()}>
          再読み込み
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">ブランディング設定</h1>
          <p className="text-gray-500 mt-1 text-justify">
            パートナーブランドの外観を設定します。設定した内容はお客様のプロフィールページやメールに反映されます。
          </p>
        </div>
        <Button
          variant="corporate"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center"
          loading={isSaving}
          loadingText="保存中..."
        >
          <HiSave className="mr-2 h-4 w-4" />
          変更を保存
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左カラム: 設定フォーム */}
        <div className="space-y-6">
          {/* ブランド基本情報 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">ブランド基本情報</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ブランド名 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="ブランド名を入力"
                />
              </div>
            </div>
          </div>

          {/* カラー設定 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">カラー設定</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メインカラー</label>
                <EnhancedColorPicker color={primaryColor} onChange={setPrimaryColor} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">サブカラー</label>
                <EnhancedColorPicker color={secondaryColor || '#1E40AF'} onChange={setSecondaryColor} />
              </div>
              <Button
                variant="corporateOutline"
                onClick={() => {
                  setPrimaryColor(DEFAULT_PRIMARY_COLOR);
                  setSecondaryColor('');
                }}
                className="flex items-center"
              >
                <HiRefresh className="mr-2 h-4 w-4" />
                デフォルトに戻す
              </Button>
            </div>
          </div>

          {/* ロゴ設定 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">ロゴ</h2>
            <p className="text-sm text-gray-500 mb-4 text-justify">
              ブランドロゴをアップロードしてください。プロフィールページのヘッダーに表示されます。
            </p>
            {logoUrl && (
              <div className="relative border border-gray-200 rounded-lg p-4 flex justify-center bg-white mb-4">
                <div className="max-w-full" style={{ maxWidth: `${logoSize.width}px`, maxHeight: `${logoSize.height}px` }}>
                  <Image
                    src={logoUrl}
                    alt="ブランドロゴ"
                    width={logoSize.width || 400}
                    height={logoSize.height || 400}
                    className="object-contain max-h-40"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleRemoveLogo}
                  className="absolute top-2 right-2 h-[32px] w-[32px]"
                >
                  <HiX className="h-4 w-4" />
                </Button>
              </div>
            )}
            <input ref={logoFileRef} type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" disabled={isUploading} />
            <Button
              variant={logoUrl ? 'corporateOutline' : 'corporate'}
              onClick={() => logoFileRef.current?.click()}
              disabled={isUploading}
              className="flex items-center"
              loading={isUploading}
              loadingText="アップロード中..."
            >
              <HiUpload className="mr-2 h-4 w-4" />
              {logoUrl ? 'ロゴを変更' : 'ロゴをアップロード'}
            </Button>

            {/* ロゴサイズ調整 */}
            {logoUrl && (
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700">ロゴサイズ調整</label>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">サイズ: {sizeSlider}%</label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={sizeSlider}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setSizeSlider(newSize);
                      if (!originalLogoSize.current) {
                        originalLogoSize.current = { width: customWidth, height: customHeight };
                      }
                      const scale = newSize / 100;
                      const newWidth = Math.round(originalLogoSize.current.width * scale);
                      const newHeight = Math.round(originalLogoSize.current.height * scale);
                      setCustomWidth(newWidth);
                      setCustomHeight(newHeight);
                      setLogoSize({ width: newWidth, height: newHeight });
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={!logoUrl}
                  />
                </div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="maintain-aspect"
                    checked={maintainAspectRatio}
                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="maintain-aspect" className="text-sm text-gray-700">アスペクト比を維持する</label>
                </div>
                <div className="flex items-end gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">幅 (px)</label>
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      value={customWidth}
                      onChange={(e) => {
                        const newWidth = Number(e.target.value);
                        setCustomWidth(newWidth);
                        if (maintainAspectRatio && logoSize.width > 0) {
                          const aspectRatio = logoSize.height / logoSize.width;
                          const newHeight = Math.round(newWidth * aspectRatio);
                          setCustomHeight(newHeight);
                          setLogoSize({ width: newWidth, height: newHeight });
                        } else {
                          setLogoSize({ width: newWidth, height: logoSize.height });
                        }
                      }}
                      className="px-2 py-1 border border-gray-300 rounded w-24 text-sm"
                      disabled={!logoUrl}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">高さ (px)</label>
                    <input
                      type="number"
                      min="50"
                      max="1000"
                      value={customHeight}
                      onChange={(e) => {
                        const newHeight = Number(e.target.value);
                        setCustomHeight(newHeight);
                        if (maintainAspectRatio && logoSize.height > 0) {
                          const aspectRatio = logoSize.width / logoSize.height;
                          const newWidth = Math.round(newHeight * aspectRatio);
                          setCustomWidth(newWidth);
                          setLogoSize({ width: newWidth, height: newHeight });
                        } else {
                          setLogoSize({ width: logoSize.width, height: newHeight });
                        }
                      }}
                      className="px-2 py-1 border border-gray-300 rounded w-24 text-sm"
                      disabled={!logoUrl}
                    />
                  </div>
                </div>
              </div>
            )}
            {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
            <p className="text-xs text-gray-500 mt-2">推奨形式: PNG, JPG, SVG (透過背景推奨) / 最大: 5MB</p>
          </div>

          {/* ファビコン設定 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">ファビコン</h2>
            <p className="text-sm text-gray-500 mb-4 text-justify">
              ブラウザのタブに表示される小さなアイコンです。
            </p>
            {faviconUrl && (
              <div className="relative border border-gray-200 rounded-lg p-4 flex justify-center bg-white mb-4">
                <Image src={faviconUrl} alt="ファビコン" width={64} height={64} className="object-contain" />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setFaviconUrl(null)}
                  className="absolute top-2 right-2 h-[32px] w-[32px]"
                >
                  <HiX className="h-4 w-4" />
                </Button>
              </div>
            )}
            <input ref={faviconFileRef} type="file" className="hidden" onChange={handleFaviconUpload} accept="image/*" disabled={isUploading} />
            <Button
              variant={faviconUrl ? 'corporateOutline' : 'corporate'}
              onClick={() => faviconFileRef.current?.click()}
              disabled={isUploading}
              className="flex items-center"
            >
              <HiUpload className="mr-2 h-4 w-4" />
              {faviconUrl ? 'ファビコンを変更' : 'ファビコンをアップロード'}
            </Button>
            <p className="text-xs text-gray-500 mt-2">推奨サイズ: 32x32px または 64x64px</p>
          </div>
        </div>

        {/* 右カラム: フッター・メール設定 */}
        <div className="space-y-6">
          {/* カスタムドメイン（表示のみ） */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">カスタムドメイン</h2>
            <p className="text-sm text-gray-500 mb-4 text-justify">
              カスタムドメインの設定はSuper Admin（運営）にお問い合わせください。
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">ドメイン:</span>
                <span className="text-sm font-mono">{customDomain || '未設定'}</span>
                {customDomain && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${domainVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {domainVerified ? '認証済み' : '未認証'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* フッター情報 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">フッター情報</h2>
            <p className="text-sm text-gray-500 mb-4 text-justify">
              法的ページやフッターに表示される会社情報です。
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会社名</label>
                <Input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="会社名" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
                <Input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="住所" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">プライバシーポリシーURL</label>
                <Input type="url" value={privacyPolicyUrl} onChange={(e) => setPrivacyPolicyUrl(e.target.value)} placeholder="https://example.com/privacy" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">利用規約URL</label>
                <Input type="url" value={termsUrl} onChange={(e) => setTermsUrl(e.target.value)} placeholder="https://example.com/terms" />
              </div>
            </div>
          </div>

          {/* メール設定 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">メール設定</h2>
            <p className="text-sm text-gray-500 mb-4 text-justify">
              メール送信時の差出人名やサポート用メールアドレスを設定します。
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">差出人名</label>
                <Input type="text" value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} placeholder="差出人名" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">サポートメールアドレス</label>
                <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="support@example.com" />
              </div>
            </div>
          </div>

          {/* ヒント */}
          <div className="rounded-md p-4" style={{ backgroundColor: '#3B82F610', borderColor: '#3B82F630', borderWidth: '1px' }}>
            <div className="flex flex-row items-start">
              <HiInformationCircle className="text-blue-600 h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
              <div className="w-full">
                <h3 className="font-medium text-blue-800 mb-1">パートナーブランディングについて</h3>
                <p className="text-sm text-blue-700 text-justify">
                  ここで設定したブランド情報は、パートナー配下のユーザーのプロフィールページに反映されます。
                  ロゴやカラーを設定すると、お客様のプロフィールページが貴社ブランドのデザインで表示されます。
                </p>
              </div>
            </div>
          </div>

          {/* 保存ボタン（下部） */}
          <div className="flex justify-center">
            <Button
              variant="corporate"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto flex items-center justify-center"
              loading={isSaving}
              loadingText="保存中..."
            >
              <HiSave className="mr-2 h-4 w-4" />
              変更を保存
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
