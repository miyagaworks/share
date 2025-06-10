// app/dashboard/corporate/branding/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker';
import { BrandingPreview } from '@/components/corporate/BrandingPreview';
import { toast } from 'react-hot-toast';
import { HiSave, HiRefresh, HiInformationCircle, HiUpload, HiX } from 'react-icons/hi';
import { corporateAccessState, checkCorporateAccess } from '@/lib/corporateAccess';
import Image from 'next/image';
import tinycolor from 'tinycolor2';

// テナント情報の型定義
interface TenantData {
  id: string;
  name: string;
  logoUrl: string | null;
  logoWidth?: number;
  logoHeight?: number;
  primaryColor: string | null;
  secondaryColor: string | null;
  headerText?: string | null; // 追加
  textColor?: string | null; // 追加
}

export default function ImprovedCorporateBrandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState<{ width: number; height: number }>({
    width: 400,
    height: 400,
  });
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [sizeSlider, setSizeSlider] = useState(100);
  const originalLogoSize = useRef<{ width: number; height: number } | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#1E40AF');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customWidth, setCustomWidth] = useState<number>(400);
  const [customHeight, setCustomHeight] = useState<number>(400);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [headerText, setHeaderText] = useState<string>('');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [remainingChars, setRemainingChars] = useState(60);

  // ファイル選択トリガー
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // ロゴの削除
  const handleRemoveLogo = () => {
    setLogoUrl(null);
    // デフォルトサイズに戻す
    setLogoSize({ width: 400, height: 400 });
    setCustomWidth(400);
    setCustomHeight(400);
    setSizeSlider(100);
    // originalLogoSize をリセット
    originalLogoSize.current = null;
  };

  // ファイルアップロード処理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 画像タイプの検証
    if (!file.type.startsWith('image/')) {
      setUploadError('画像ファイルのみアップロードできます');
      return;
    }

    // ファイルサイズの検証（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('ファイルサイズは5MB以下にしてください');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // FileReaderでファイルをBase64に変換
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          // ロゴURLを設定
          setLogoUrl(event.target.result);
          // 新しい画像のサイズを取得
          const img = new window.Image();
          img.onload = () => {
            // 最大サイズを制限（例: 最大幅400px）
            let width = img.width;
            let height = img.height;
            if (width > 400) {
              const ratio = height / width;
              width = 400;
              height = Math.round(width * ratio);
            }
            // ここが重要: originalLogoSize を設定
            originalLogoSize.current = { width, height };
            setLogoSize({ width, height });
            setCustomWidth(width);
            setCustomHeight(height);
            // スライダーをリセット
            setSizeSlider(100);
          };
          img.src = event.target.result;
          toast.success('ロゴをアップロードしました');
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError('画像の読み込みに失敗しました');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadError('アップロードに失敗しました。もう一度お試しください');
      setIsUploading(false);
    }
  };

  // テナント情報とユーザー情報を取得
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!session?.user?.id) return;
      try {
        setIsLoading(true);
        // まずグローバル状態をチェック
        await checkCorporateAccess({ force: true }); // 強制的に最新の状態を取得

        // テナント情報取得API
        const response = await fetch('/api/corporate/tenant');
        if (!response.ok) {
          throw new Error('テナント情報の取得に失敗しました');
        }
        const data = await response.json();
        setTenantData(data.tenant);
        // APIから直接isAdminフラグを取得
        setIsAdmin(data.isAdmin === true);

        // 色情報を設定
        if (data.tenant.primaryColor) {
          setPrimaryColor(data.tenant.primaryColor);
        }
        if (data.tenant.secondaryColor) {
          setSecondaryColor(data.tenant.secondaryColor);
        }

        // ヘッダーテキストとテキストカラーを設定
        if (data.tenant.headerText) {
          setHeaderText(data.tenant.headerText);
        }
        if (data.tenant.textColor) {
          setTextColor(data.tenant.textColor);
        }

        // ロゴURLを設定
        setLogoUrl(data.tenant.logoUrl);

        // ロゴURLが変更された時に画像サイズを取得
        if (data.tenant.logoUrl && (!data.tenant.logoWidth || !data.tenant.logoHeight)) {
          // 画像のサイズを取得するためのHelper関数
          const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
            return new Promise((resolve) => {
              const img = new window.Image();
              img.onload = () => {
                resolve({
                  width: img.width,
                  height: img.height,
                });
              };
              img.src = url;
            });
          };

          // 画像サイズの取得を試みる
          getImageDimensions(data.tenant.logoUrl)
            .then((dimensions) => {
              // 最大サイズを制限（例: 最大幅400px）
              let width = dimensions.width;
              let height = dimensions.height;
              if (width > 400) {
                const ratio = height / width;
                width = 400;
                height = Math.round(width * ratio);
              }
              setLogoSize({ width, height });
              setCustomWidth(width);
              setCustomHeight(height);
            })
            .catch(() => {
              // デフォルトサイズを設定
              setLogoSize({ width: 400, height: 400 });
              setCustomWidth(400);
              setCustomHeight(400);
            });
        }

        // ロゴサイズが保存されている場合は設定
        if (data.tenant.logoWidth && data.tenant.logoHeight) {
          // ロゴサイズを設定
          setLogoSize({
            width: data.tenant.logoWidth,
            height: data.tenant.logoHeight,
          });
          setCustomWidth(data.tenant.logoWidth);
          setCustomHeight(data.tenant.logoHeight);
          // 元のサイズも記録（スライダーの基準にするため）
          originalLogoSize.current = {
            width: data.tenant.logoWidth,
            height: data.tenant.logoHeight,
          };
        }

        // ユーザー情報取得API（追加）
        try {
          const userResponse = await fetch('/api/corporate-member/profile');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setCurrentUser(userData.user);
          }
        } catch {
          // ユーザー情報取得エラーは致命的ではないので、エラー表示はしない
        }

        setError(null);
      } catch {
        // グローバル状態から取得
        if (corporateAccessState.hasAccess && corporateAccessState.tenantId) {
          setIsAdmin(corporateAccessState.isAdmin);
          // フォールバックデータの設定
          setTenantData({
            id: corporateAccessState.tenantId || 'unknown',
            name: '接続エラー - データ取得中',
            logoUrl: null,
            primaryColor: null,
            secondaryColor: null,
          });
          setError('テナント情報を取得できませんでした。一部機能が制限されます。');
        } else {
          setError('テナント情報を読み込めませんでした');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();
  }, [session]);

  // 文字数カウント用のuseEffect
  useEffect(() => {
    if (headerText) {
      // 全角文字は2文字としてカウント
      const count = [...headerText].reduce((acc, char) => {
        return acc + (char.match(/[^\x01-\x7E]/) ? 2 : 1);
      }, 0);
      setRemainingChars(60 - count);
    } else {
      setRemainingChars(60);
    }
  }, [headerText]);

  // ブランディング設定を保存
  const handleSaveBranding = async () => {
    if (!tenantData) return;
    try {
      setIsSaving(true);
      // 数値型であることを確認
      const logoWidth = Number(logoSize.width);
      const logoHeight = Number(logoSize.height);

      // ブランディング設定更新API
      const response = await fetch('/api/corporate/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryColor,
          secondaryColor,
          logoUrl,
          logoWidth,
          logoHeight,
          headerText, // 追加
          textColor, // 追加
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
        // 保存後のロゴサイズを確認
        // undefined の場合は現在のサイズを使用
        const savedLogoWidth = data.tenant.logoWidth || logoSize.width;
        const savedLogoHeight = data.tenant.logoHeight || logoSize.height;

        // テナントデータを更新
        setTenantData({
          ...tenantData,
          primaryColor: data.tenant.primaryColor,
          secondaryColor: data.tenant.secondaryColor,
          logoUrl: data.tenant.logoUrl,
          logoWidth: savedLogoWidth,
          logoHeight: savedLogoHeight,
        });

        // ロゴサイズも保存された値で更新
        setLogoSize({
          width: savedLogoWidth,
          height: savedLogoHeight,
        });
        setCustomWidth(savedLogoWidth);
        setCustomHeight(savedLogoHeight);

        // 元のサイズも更新
        originalLogoSize.current = {
          width: savedLogoWidth,
          height: savedLogoHeight,
        };
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ブランディング設定の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ユーザー情報の状態を追加
  const [currentUser, setCurrentUser] = useState<{
    name: string | null;
    nameEn: string | null;
    department?: {
      id: string;
      name: string;
    } | null;
    position?: string | null;
    // 他に必要なプロパティがあれば追加
  } | null>(null);

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
        <Button
          variant="corporateOutline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
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
        <Button
          variant="corporate"
          className="mt-4"
          onClick={() => router.push('/dashboard/subscription')}
        >
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
          <p className="text-gray-500 mt-1 text-justify">
            会社のロゴとカラーを設定して、統一感のあるプロフィールを作成します
          </p>
          {/* 管理者ステータスの表示（デバッグ用） */}
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-gray-400 mt-1">
              管理者権限: {isAdmin ? 'あり' : 'なし'}
              (グローバル状態: {corporateAccessState.isAdmin ? 'あり' : 'なし'})
            </p>
          )}
        </div>
        {isAdmin && (
          <Button
            variant="corporate"
            onClick={handleSaveBranding}
            disabled={isSaving}
            className="flex items-center"
            loading={isSaving}
            loadingText="保存中..."
          >
            <HiSave className="mr-2 h-4 w-4" />
            変更を保存
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 設定フォーム */}
        <div className="space-y-6">
          {/* カラー設定 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <HiColorSwatch className="mr-2 h-5 w-5 text-gray-600" />
              企業カラー
            </h2>
            <p className="text-sm text-gray-500 mb-4 text-justify">
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
                  variant="corporateOutline"
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

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mt-6">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <HiColorSwatch className="mr-2 h-5 w-5 text-gray-600" />
              テキスト設定
            </h2>
            <p className="text-sm text-gray-500 mb-4 text-justify">
              プロフィールのヘッダーテキストとその色を設定します。
              ヘッダーテキストはすべてのメンバーのプロフィールページに統一して表示されます。
            </p>
            <div className="space-y-4">
              {/* ヘッダーテキスト設定 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  ヘッダーテキスト（最大｜半角60文字）
                </label>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <p className="text-xs text-gray-500 mt-1 mb-2 mr-3">
                    プロフィールページのヘッダー部分に表示されるテキストです。
                  </p>
                  <span
                    className={`text-xs whitespace-nowrap ${
                      remainingChars < 0 ? 'text-red-500 font-bold' : 'text-gray-500'
                    }`}
                  >
                    残り：{remainingChars < 0 ? `-${Math.abs(remainingChars)}` : remainingChars}文字
                  </span>
                </div>
                <textarea
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="例：シンプルにつながる、スマートにシェア。"
                  maxLength={60}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-corporate-primary focus:border-corporate-primary"
                  disabled={!isAdmin || isLoading || isSaving}
                />
              </div>
              {/* テキストカラー設定 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">テキストカラー</label>
                <p className="text-xs text-gray-500 mt-1 mb-2 text-justify">
                  ヘッダーテキストとプライマリーボタンの色を設定します。
                </p>
                <EnhancedColorPicker
                  color={textColor}
                  onChange={setTextColor}
                  disabled={!isAdmin || isLoading || isSaving}
                />
                {tinycolor(primaryColor).isLight() && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 mt-2">
                    <p className="text-xs text-yellow-700 flex items-start text-justify">
                      <HiInformationCircle className="h-4 w-4 text-yellow-500 mr-1 flex-shrink-0 mt-0.5" />
                      プライマリーカラーが明るいため、テキストには濃い色（#333333など）の使用をおすすめします。
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ロゴ設定 */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <HiUpload className="mr-2 h-5 w-5 text-gray-600" />
              企業ロゴ
            </h2>
            <p className="text-sm text-gray-500 mb-4 text-justify">
              プロフィールに表示する企業ロゴをアップロードしてください。
              サイズをカスタマイズすることも可能です。
            </p>
            {/* 現在のロゴ表示 */}
            {logoUrl && (
              <div className="relative border border-gray-200 rounded-lg p-4 flex justify-center bg-white mb-4">
                <div
                  className="max-w-full"
                  style={{
                    maxWidth: `${logoSize.width}px`,
                    maxHeight: `${logoSize.height}px`,
                  }}
                >
                  <Image
                    src={logoUrl}
                    alt="企業ロゴ"
                    width={logoSize.width || 400}
                    height={logoSize.height || 400}
                    className="object-contain max-h-40"
                  />
                </div>
                {isAdmin && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleRemoveLogo}
                    disabled={!isAdmin}
                    className="absolute top-2 right-2 h-[32px] w-[32px]"
                  >
                    <HiX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            {/* ロゴアップロード機能 */}
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*"
                disabled={!isAdmin || isUploading}
              />
              <div className="flex space-x-2">
                <Button
                  variant={logoUrl ? 'corporateOutline' : 'corporate'}
                  onClick={triggerFileInput}
                  disabled={!isAdmin || isUploading}
                  className="flex items-center"
                  loading={isUploading}
                  loadingText="アップロード中..."
                >
                  <HiUpload className="mr-2 h-4 w-4" />
                  {logoUrl ? 'ロゴを変更' : 'ロゴをアップロード'}
                </Button>
              </div>
              {/* ロゴサイズ設定 */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ロゴサイズ調整
                </label>
                {/* スライダー */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 mb-1">サイズ: {sizeSlider}%</label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={sizeSlider}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setSizeSlider(newSize);
                      // ロゴが存在する場合のみ処理
                      if (logoUrl) {
                        // originalLogoSize が未設定の場合は現在のサイズを保存
                        if (!originalLogoSize.current) {
                          originalLogoSize.current = {
                            width: customWidth,
                            height: customHeight,
                          };
                        }
                        const scale = newSize / 100;
                        const newWidth = Math.round(originalLogoSize.current.width * scale);
                        const newHeight = Math.round(originalLogoSize.current.height * scale);
                        setCustomWidth(newWidth);
                        setCustomHeight(newHeight);
                        setLogoSize({
                          width: newWidth,
                          height: newHeight,
                        });
                      }
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    disabled={!isAdmin || !logoUrl}
                  />
                </div>
                {/* アスペクト比維持オプション */}
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="maintain-aspect"
                    checked={maintainAspectRatio}
                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                    className="mr-2"
                    disabled={!isAdmin}
                  />
                  <label htmlFor="maintain-aspect" className="text-sm text-gray-700">
                    アスペクト比を維持する
                  </label>
                </div>
                {/* 数値入力 */}
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
                          // アスペクト比を維持
                          const aspectRatio = logoSize.height / logoSize.width;
                          const newHeight = Math.round(newWidth * aspectRatio);
                          setCustomHeight(newHeight);
                          setLogoSize({ width: newWidth, height: newHeight });
                        } else {
                          setLogoSize({ width: newWidth, height: logoSize.height });
                        }
                      }}
                      className="px-2 py-1 border border-gray-300 rounded w-24 text-sm"
                      disabled={!isAdmin || !logoUrl}
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
                          // アスペクト比を維持
                          const aspectRatio = logoSize.width / logoSize.height;
                          const newWidth = Math.round(newHeight * aspectRatio);
                          setCustomWidth(newWidth);
                          setLogoSize({ width: newWidth, height: newHeight });
                        } else {
                          setLogoSize({ width: logoSize.width, height: newHeight });
                        }
                      }}
                      className="px-2 py-1 border border-gray-300 rounded w-24 text-sm"
                      disabled={!isAdmin || !logoUrl}
                    />
                  </div>
                </div>
              </div>
              {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
              <p className="text-xs text-gray-500">
                推奨形式: PNG, JPG, SVG (透過背景推奨)
                <br />
                最大サイズ: 5MB
              </p>
              {!isAdmin && (
                <p className="text-sm text-amber-600 mt-2">
                  ※ブランディング設定の変更には管理者権限が必要です
                </p>
              )}
            </div>
          </div>
        </div>

        {/* プレビュー */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4 text-center flex items-center justify-center">
              <HiEye className="mr-2 h-5 w-5 text-gray-600" />
              プレビュー
            </h2>
            <p className="text-sm text-gray-500 mb-6 text-center">
              設定がユーザープロフィールにどのように表示されるかのプレビューです
            </p>
            <BrandingPreview
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              logoUrl={logoUrl}
              logoWidth={logoSize.width}
              logoHeight={logoSize.height}
              tenantName={tenantData.name}
              userName={currentUser?.name || session?.user?.name || '名前未設定'}
              userNameEn={currentUser?.nameEn || null}
              headerText={headerText}
              textColor={textColor}
              snsIconColor="original"
              department={currentUser?.department?.name || null}
              position={currentUser?.position || null}
            />
            {/* 保存ボタン（プレビューの下に移動） */}
            {isAdmin && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="corporate"
                  onClick={handleSaveBranding}
                  disabled={isSaving}
                  className="w-full sm:w-auto flex items-center justify-center"
                  loading={isSaving}
                  loadingText="保存中..."
                >
                  <HiSave className="mr-2 h-4 w-4" />
                  変更を保存
                </Button>
              </div>
            )}
          </div>

          {/* ブランディングの活用方法 */}
          <div
            className="mt-6 rounded-md p-4"
            style={{
              backgroundColor: '#1E3A8A10',
              borderColor: '#1E3A8A30',
              borderWidth: '1px',
            }}
          >
            <div className="flex flex-row items-start">
              <HiInformationCircle className="text-[#1E3A8A] h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
              <div className="w-full">
                <h3 className="font-medium text-[#1E3A8A] mb-1">企業ブランディングについて</h3>
                <p className="text-sm text-corporate-secondary break-words hyphens-auto text-justify">
                  企業ロゴとカラースキームを設定して統一感のあるプロフィールを作成できます。ロゴは背景色との対比が明確なものを選ぶと視認性が高まります。プライマリーカラーとセカンダリーカラーは補色関係にすると効果的で、企業のブランドガイドラインに沿った色を選ぶことで統一感が生まれます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// HiColorSwatch, HiEyeコンポーネント
function HiColorSwatch(props: { className: string }) {
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
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
      />
    </svg>
  );
}

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