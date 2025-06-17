// components/qrcode/QrCodeGenerator.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { FaMobile, FaLink, FaCopy } from 'react-icons/fa';
import { HiColorSwatch, HiEye } from 'react-icons/hi'; // HiArrowLeftを削除
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker';
import { QrCodePreview } from './QrCodePreview';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import Image from 'next/image';

// 型定義 - 明確に分離（ベストプラクティス）
interface CorporateBranding {
  primaryColor: string;
  textColor: string;
  headerText: string;
}
interface UserProfile {
  profileUrl: string;
  userName: string;
  nameEn: string;
  profileImage?: string;
  headerText?: string;
}
interface QrCodeGeneratorProps {
  corporateBranding?: CorporateBranding;
  userProfile: UserProfile;
  hideBackButton?: boolean; // インターフェースとしては残す（他コンポーネントが使用）
  hideSlugInput?: boolean;
  customBackUrl?: string; // インターフェースとしては残す（他コンポーネントが使用）
  initialQrCodeSlug?: string;
  hideTitleHeader?: boolean;
}
// ユーザー設定を保存するためのローカルストレージキー（ベストプラクティス：定数化）
const USER_PRIMARY_COLOR_KEY = 'userPrimaryColor';
const USER_TEXT_COLOR_KEY = 'userTextColor';
export function QrCodeGenerator({
  corporateBranding,
  userProfile,
  // hideBackButton = false,
  hideSlugInput = false,
  // customBackUrl,
  initialQrCodeSlug,
  hideTitleHeader = false,
}: QrCodeGeneratorProps) {
  // const isCorporateMember = !!corporateBranding;
  // 初期値の設定
  const initialPrimaryColor = corporateBranding?.primaryColor || '#3B82F6';
  const initialTextColor = corporateBranding?.textColor || '#FFFFFF';
  const initialHeaderText =
    corporateBranding?.headerText ||
    userProfile.headerText ||
    'シンプルにつながる、スマートにシェア。';
  // 状態管理 - 関連する状態をグループ化（ベストプラクティス）
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor);
  const [textColor, setTextColor] = useState(initialTextColor);
  const [headerText, setHeaderText] = useState(initialHeaderText);
  const [useCorporateBranding, setUseCorporateBranding] = useState(!!corporateBranding);
  // QRコード関連の状態
  const [customUrlSlug, setCustomUrlSlug] = useState('');
  const [isSlugAvailable, setIsSlugAvailable] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isExistingQrCode, setIsExistingQrCode] = useState(false);
  const [existingQrCodeId, setExistingQrCodeId] = useState<string | null>(null);
  // UI関連の状態
  const [showSaveInstructions, setShowSaveInstructions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  // 参照
  const previewRef = useRef<HTMLDivElement>(null);
  // デバイス判定用の状態を追加
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  // デバイス判定のuseEffectを追加
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // デバイス判定を修正
    const userAgent = navigator.userAgent.toLowerCase();
    console.log('User Agent:', userAgent); // デバッグ用

    // より正確なiOS判定
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // より正確なAndroid判定
    const isAndroidDevice = /android/.test(userAgent);

    console.log('iOS detected:', isIOSDevice); // デバッグ用
    console.log('Android detected:', isAndroidDevice); // デバッグ用

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
  }, []);

  useEffect(() => {
    // 初期スラグが指定されていて、まだカスタムURLスラグが設定されていない場合のみ処理
    if (initialQrCodeSlug && initialQrCodeSlug.length > 0 && !customUrlSlug) {
      setCustomUrlSlug(initialQrCodeSlug);
      // スラグが3文字以上なら利用可能性をチェック
      if (initialQrCodeSlug.length >= 3) {
        checkSlugAvailability(initialQrCodeSlug);
      }
    }
  }, [initialQrCodeSlug, customUrlSlug]);
  // 初期データの読み込み（useEffectの依存配列を適切に設定）
  useEffect(() => {
    const loadQrCodeData = async () => {
      try {
        // プロフィール情報の取得
        const profileResponse = await fetch('/api/profile');
        if (!profileResponse.ok) {
          throw new Error('プロフィール情報の取得に失敗しました');
        }
        const profileData = await profileResponse.json();
        if (profileData?.user?.id) {
          setUserId(profileData.user.id);
          // 既存のQRコードを取得
          try {
            const qrCodesResponse = await fetch('/api/qrcode');
            if (!qrCodesResponse.ok) {
              throw new Error('QRコード情報の取得に失敗しました');
            }
            const qrCodesData = await qrCodesResponse.json();
            if (qrCodesData.qrCodes && qrCodesData.qrCodes.length > 0) {
              // 最新のQRコードを使用
              const latestQrCode = qrCodesData.qrCodes[0];
              setCustomUrlSlug(latestQrCode.slug);
              // 法人ブランディングが指定されていない場合のみ、QRコードの色設定を適用
              if (!corporateBranding) {
                setPrimaryColor(latestQrCode.primaryColor);
                setTextColor(latestQrCode.textColor || '#FFFFFF');
              }
              setIsExistingQrCode(true);
              setExistingQrCodeId(latestQrCode.id);
              // 自分のQRコードなので編集可能
              setIsSlugAvailable(true);
              // 既存のQRコードURLを設定
              const fullUrl = `${window.location.origin}/qr/${latestQrCode.slug}`;
              setGeneratedUrl(fullUrl);
            } else if (initialQrCodeSlug && initialQrCodeSlug.length >= 3) {
              // 初期スラグが指定されている場合はそれを使用
              setCustomUrlSlug(initialQrCodeSlug);
              checkSlugAvailability(initialQrCodeSlug);
            } else {
              // QRコードがない場合はランダムスラグを設定
              const randomSlug = Math.random().toString(36).substring(2, 7);
              setCustomUrlSlug(randomSlug);
              checkSlugAvailability(randomSlug);
            }
          } catch {
            // QRコード取得に失敗した場合もランダムスラグを設定
            const randomSlug = Math.random().toString(36).substring(2, 7);
            setCustomUrlSlug(randomSlug);
            checkSlugAvailability(randomSlug);
          }
        }
      } catch {
        toast.error('プロフィール情報の取得に失敗しました');
      }
    };
    loadQrCodeData();
  }, [corporateBranding, initialQrCodeSlug]);
  // カスタムURLスラグの利用可能性をチェック（APIリクエストをラップした関数）
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setIsSlugAvailable(false);
      setIsExistingQrCode(false);
      return;
    }
    setIsCheckingSlug(true);
    try {
      const response = await fetch(`/api/qrcode/check-slug?slug=${slug}`);
      const data = await response.json();
      if (!data.available) {
        // 既に使用されているスラグ
        if (data.ownedByCurrentUser) {
          // 自分のQRコードの場合は編集可能とする
          setIsSlugAvailable(true);
          setIsExistingQrCode(true);
          setExistingQrCodeId(data.qrCodeId);
        } else {
          // 他のユーザーのスラグは使用不可
          setIsSlugAvailable(false);
          setIsExistingQrCode(false);
          setExistingQrCodeId(null);
        }
      } else {
        // 新しいスラグは使用可能
        setIsSlugAvailable(true);
        setIsExistingQrCode(false);
        setExistingQrCodeId(null);
      }
    } catch {
      setIsSlugAvailable(false);
      setIsExistingQrCode(false);
    } finally {
      setIsCheckingSlug(false);
    }
  };
  // スラグ入力の変更を処理（イベントハンドラ関数）
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setCustomUrlSlug(newSlug);
    // 入力後にスラグの利用可能性をチェック
    if (newSlug.length >= 3) {
      checkSlugAvailability(newSlug);
    } else {
      setIsSlugAvailable(false);
      setIsExistingQrCode(false);
      setExistingQrCodeId(null);
    }
  };
  // 法人ブランディングの切り替え（ロジックを関数として分離）
  const toggleCorporateBranding = () => {
    if (corporateBranding) {
      if (useCorporateBranding) {
        // 法人ブランディングをOFFにする場合はユーザーのヘッダーテキストに戻す
        setUseCorporateBranding(false);
        // ローカルストレージから保存していた値を復元
        const storedPrimaryColor = localStorage.getItem(USER_PRIMARY_COLOR_KEY);
        const storedTextColor = localStorage.getItem(USER_TEXT_COLOR_KEY);
        setPrimaryColor(storedPrimaryColor || initialPrimaryColor);
        setTextColor(storedTextColor || initialTextColor);
        setHeaderText(userProfile.headerText || 'シンプルにつながる、スマートにシェア。');
      } else {
        // 現在の設定を保存
        localStorage.setItem(USER_PRIMARY_COLOR_KEY, primaryColor);
        localStorage.setItem(USER_TEXT_COLOR_KEY, textColor);
        // 法人ブランディングをONにして設定を復元
        setPrimaryColor(corporateBranding.primaryColor);
        setTextColor(corporateBranding.textColor);
        setHeaderText(corporateBranding.headerText);
        setUseCorporateBranding(true);
      }
    }
  };
  // QRコードページを生成または更新（APIリクエストをラップした関数）
  const generateQrCodePage = async () => {
    if (!customUrlSlug || customUrlSlug.length < 3) {
      toast.error('有効なURLスラグを入力してください');
      return;
    }
    // 既存のQRコードでない場合は、利用可能性をチェック
    if (!isExistingQrCode && !isSlugAvailable) {
      toast.error('このURLは既に使用されています');
      return;
    }
    // ユーザーIDが取得できているか確認
    if (!userId) {
      toast.error('ユーザーIDが取得できません');
      return;
    }
    setIsSaving(true);
    try {
      // QRコードページの設定データを準備
      const qrCodeData = {
        userId,
        slug: customUrlSlug,
        template: 'simple',
        primaryColor,
        secondaryColor: primaryColor,
        accentColor: '#FFFFFF',
        textColor: textColor,
        userName: userProfile.userName,
        profileUrl: userProfile.profileUrl,
      };
      // 既存QRコードの更新または新規作成
      const endpoint =
        isExistingQrCode && existingQrCodeId
          ? `/api/qrcode/update/${existingQrCodeId}`
          : '/api/qrcode/create';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(qrCodeData),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'QRコードページの作成に失敗しました');
      }
      // 成功
      const fullUrl = `${window.location.origin}/qr/${customUrlSlug}`;
      setGeneratedUrl(fullUrl);
      toast.success(
        isExistingQrCode ? 'QRコードページを更新しました！' : 'QRコードページを作成しました！',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'QRコードページの作成に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };
  // URLをコピーする関数（単一責任の原則）
  const copyGeneratedUrl = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      toast.success('URLをコピーしました');
    }
  };
  // 法人メンバー向けのUI調整（計算値を変数として抽出）
  const buttonStyle =
    useCorporateBranding && corporateBranding
      ? {
          backgroundColor: corporateBranding.primaryColor,
          color: corporateBranding.textColor || '#FFFFFF',
          borderColor: corporateBranding.primaryColor,
        }
      : undefined;
  const buttonVariant = corporateBranding && useCorporateBranding ? 'corporate' : undefined;
  const outlineButtonVariant =
    corporateBranding && useCorporateBranding ? 'corporateOutline' : 'outline';
  return (
    <div className="space-y-6">
      {/* 戻るボタンを完全に削除 */}
      {/* ヘッダー部分 - hideTitleHeaderがtrueの場合は非表示 */}
      {!hideTitleHeader && (
        <div className="flex items-center mb-6">
          <HiColorSwatch className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">QRコードデザイナー</h1>
            <p className="text-muted-foreground text-justify">
              あなた専用のQRコードページを作成しましょう
            </p>
          </div>
        </div>
      )}
      {/* メインコンテンツ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左側: 設定パネル */}
        <motion.div
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center mb-4">
            <HiColorSwatch className="h-5 w-5 text-gray-700 mr-2" />
            <h2 className="text-xl font-semibold">デザイン設定</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 text-justify">
            QRコードのデザインと色をカスタマイズできます
          </p>
          {/* 法人ブランディングの切り替え */}
          {corporateBranding && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                法人ブランディング
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={useCorporateBranding}
                  onChange={toggleCorporateBranding}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  style={{ accentColor: corporateBranding.primaryColor }}
                />
                <span className="ml-2 text-sm text-gray-700">法人カラーを適用する</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                法人カラーを適用すると、QRコードページは法人のブランディングに合わせたデザインになります。
              </p>
              {/* 法人ブランディング適用表示 */}
              {useCorporateBranding && (
                <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-xs text-gray-600 flex items-center">
                    <svg
                      className="w-4 h-4 mr-1 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                    法人ブランディングが適用されています
                  </p>
                </div>
              )}
            </div>
          )}
          {/* カスタムURLスラグ入力 */}
          {!hideSlugInput && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">カスタムURL</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  {window.location.origin}/qr/
                </span>
                <Input
                  value={customUrlSlug}
                  onChange={handleSlugChange}
                  className="rounded-l-none"
                  placeholder="your-custom-url"
                  minLength={3}
                  maxLength={20}
                />
              </div>
              <div className="mt-1">
                {isCheckingSlug ? (
                  <p className="text-xs text-gray-500">チェック中...</p>
                ) : customUrlSlug.length >= 3 ? (
                  isExistingQrCode ? (
                    <p className="text-xs text-amber-600">
                      ※ このURLは既に使用中です。更新されます
                    </p>
                  ) : isSlugAvailable ? (
                    <p className="text-xs text-green-600">✓ このURLは利用可能です</p>
                  ) : (
                    <p className="text-xs text-red-600">
                      ✗ このURLは既に他のユーザーに使用されています
                    </p>
                  )
                ) : (
                  <p className="text-xs text-gray-500">3文字以上入力してください</p>
                )}
              </div>
            </div>
          )}
          {/* カラーピッカー - メインカラーとテキストカラー */}
          {(!corporateBranding || !useCorporateBranding) && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">メインカラー</label>
                <p className="text-xs text-gray-500 mb-2">ヘッダーとボタンに適用されます</p>
                <EnhancedColorPicker color={primaryColor} onChange={setPrimaryColor} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  テキストカラー
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  ヘッダーとボタン内のテキストカラーに適用されます
                </p>
                <EnhancedColorPicker color={textColor} onChange={setTextColor} />
              </div>
            </div>
          )}
          {/* QRコードページ生成ボタン */}
          <div className="mt-6 space-y-3">
            <Button
              className="w-full flex items-center gap-2 justify-center"
              style={buttonStyle}
              variant={buttonVariant}
              onClick={generateQrCodePage}
              disabled={isSaving || (!isSlugAvailable && !isExistingQrCode)}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  {isExistingQrCode ? '更新中...' : '作成中...'}
                </>
              ) : (
                <>
                  <FaLink className="h-4 w-4" />
                  {isExistingQrCode ? 'QRコードページを更新' : 'QRコードページを作成'}
                </>
              )}
            </Button>
            {/* URLコピーボタン */}
            <Button
              className="w-full flex items-center gap-2 justify-center"
              onClick={copyGeneratedUrl}
              disabled={!generatedUrl}
              variant={outlineButtonVariant}
            >
              <FaCopy className="h-4 w-4" />
              {generatedUrl ? 'URLをコピー' : 'QRコードページを先に作成してください'}
            </Button>
            {/* 生成されたURL情報 */}
            {generatedUrl && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm font-medium mb-2">QRコードページが作成されました:</p>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={generatedUrl}
                    readOnly
                    className="flex-1 text-sm p-2 border border-gray-300 rounded-l-md h-10"
                  />
                  <Button
                    className="rounded-l-none h-10 px-3"
                    variant={buttonVariant}
                    style={buttonStyle}
                    onClick={copyGeneratedUrl}
                  >
                    コピー
                  </Button>
                </div>
                <div className="mt-2">
                  <Button
                    className="w-full"
                    variant={buttonVariant}
                    style={buttonStyle}
                    onClick={() => window.open(generatedUrl, '_blank')}
                  >
                    QRコードページを開く
                  </Button>
                </div>
              </div>
            )}
            {/* スマホに保存する方法のボタン */}
            <Button
              type="button"
              variant={outlineButtonVariant}
              className="w-full flex items-center gap-2 justify-center"
              onClick={() => setShowSaveInstructions(true)}
            >
              <FaMobile className="h-4 w-4" />
              スマホに保存する方法
            </Button>
          </div>
        </motion.div>
        {/* 右側: プレビューパネル */}
        <motion.div
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          ref={previewRef}
        >
          <div className="flex items-center mb-4">
            <HiEye className="h-5 w-5 text-gray-700 mr-2" />
            <h2 className="text-xl font-semibold">プレビュー</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 text-justify">
            設定したカラーとデザインがQRコードにどのように適用されるかを確認できます
          </p>
          <QrCodePreview
            profileUrl={generatedUrl || userProfile.profileUrl}
            userName={userProfile.userName}
            nameEn={userProfile.nameEn}
            templateId="simple"
            primaryColor={primaryColor}
            secondaryColor={primaryColor}
            accentColor="#FFFFFF"
            headerText={headerText}
            textColor={textColor}
            profileImage={userProfile.profileImage}
          />
        </motion.div>
      </div>
      {/* モーダル部分 - アクセシビリティのためにポータルを使用するべき */}
      {showSaveInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">スマホのホーム画面に追加する方法</h3>
            <div className="space-y-6 mb-6">
              {/* iPhoneの場合 */}
              <div>
                <h4 className="font-medium text-lg mb-3 text-blue-800 flex items-center">
                  iPhoneの場合:
                </h4>
                <ol className="list-decimal pl-5 space-y-3 text-sm">
                  <li>Safariでこのページを開きます</li>
                  <li className="flex items-center">
                    <span className="mr-3 flex items-center">
                      <Image
                        src="/images/icons/share_iphone.svg"
                        alt="共有ボタン"
                        width={18}
                        height={18}
                        className="flex-shrink-0"
                      />
                    </span>
                    <span>共有ボタンをタップ</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-3 flex items-center">
                      <Image
                        src="/images/icons/addition_iphone.svg"
                        alt="ホーム画面に追加"
                        width={18}
                        height={18}
                        className="flex-shrink-0"
                      />
                    </span>
                    <span>
                      <strong>「ホーム画面に追加」</strong>を選択
                    </span>
                  </li>
                  <li>
                    名前は変更せず、そのまま<strong>「追加」</strong>をタップ
                  </li>
                  <li>
                    <strong className="text-red-500">
                      重要: 追加後は必ずホーム画面から開いてください
                    </strong>
                  </li>
                </ol>
              </div>

              {/* Androidの場合 */}
              <div>
                <h4 className="font-medium text-lg mb-3 text-green-800 flex items-center">
                  Androidの場合:
                </h4>
                <ol className="list-decimal pl-5 space-y-3 text-sm">
                  <li>作成したQRコードページをChromeで開きます</li>
                  <li className="flex items-center">
                    <span className="mr-3 flex items-center">
                      <Image
                        src="/images/icons/menu_android.svg"
                        alt="メニューボタン"
                        width={16}
                        height={16}
                        className="flex-shrink-0"
                      />
                    </span>
                    <span>メニューボタンをタップ</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-3 flex items-center">
                      <Image
                        src="/images/icons/home_android.svg"
                        alt="ホーム画面に追加"
                        width={18}
                        height={18}
                        className="flex-shrink-0"
                      />
                    </span>
                    <span>
                      <strong>「ホーム画面に追加」</strong>を選択
                    </span>
                  </li>
                  <li>
                    <strong>「追加」</strong>をタップ
                  </li>
                </ol>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm text-blue-700">
                  💡 ホーム画面に追加すると、ワンタップでQRコードページを表示できます。
                  スマホを取り出してアイコンをタップし、「反転」ボタンを押せば相手にスムーズにQRコードを見せられます。
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setShowSaveInstructions(false)}
                variant={buttonVariant}
                style={buttonStyle}
              >
                閉じる
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
