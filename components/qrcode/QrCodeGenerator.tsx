// components/qrcode/QrCodeGenerator.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { FaMobile, FaLink, FaCopy } from 'react-icons/fa';
import { HiColorSwatch, HiEye } from 'react-icons/hi';
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker';
import { QrCodePreview } from './QrCodePreview';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';

// 不要な型定義は削除

export function QrCodeGenerator() {
  const [primaryColor, setPrimaryColor] = useState('#3B82F6'); // デフォルトカラー
  const [textColor, setTextColor] = useState('#FFFFFF'); // テキストカラー
  const [showSaveInstructions, setShowSaveInstructions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [userProfileName, setUserProfileName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [customUrlSlug, setCustomUrlSlug] = useState('');
  const [isSlugAvailable, setIsSlugAvailable] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const [userProfileNameEn, setUserProfileNameEn] = useState('');
  const [headerText, setHeaderText] = useState('シンプルにつながる、スマートにシェア。');
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
  const [isExistingQrCode, setIsExistingQrCode] = useState(false);
  const [existingQrCodeId, setExistingQrCodeId] = useState<string | null>(null);

  // ユーザーのプロフィールURLとQRコード情報を読み込む
  useEffect(() => {
    const loadProfileAndQrCode = async () => {
      try {
        // プロフィール情報の取得
        const profileResponse = await fetch('/api/profile');
        if (!profileResponse.ok) {
          throw new Error('プロフィール情報の取得に失敗しました');
        }

        const profileData = await profileResponse.json();
        if (profileData?.user?.profile?.slug) {
          const baseUrl = `${window.location.origin}/${profileData.user.profile.slug}`;
          setProfileUrl(baseUrl);
          setUserId(profileData.user.id);

          // ユーザー情報を設定
          if (profileData?.user?.name) {
            setUserProfileName(profileData.user.name);
          }
          if (profileData?.user?.nameEn) {
            setUserProfileNameEn(profileData.user.nameEn);
          }
          if (profileData?.user?.image) {
            setProfileImage(profileData.user.image);
          }
          if (profileData?.user?.mainColor) {
            setPrimaryColor(profileData.user.mainColor);
          }
          if (profileData?.user?.headerText) {
            setHeaderText(profileData.user.headerText);
          }
          if (profileData?.user?.textColor) {
            setTextColor(profileData.user.textColor);
          }

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
              setPrimaryColor(latestQrCode.primaryColor);
              setTextColor(latestQrCode.textColor || '#FFFFFF');
              setIsExistingQrCode(true);
              setExistingQrCodeId(latestQrCode.id);

              // 自分のQRコードなので編集可能
              setIsSlugAvailable(true);
            } else {
              // QRコードがない場合はランダムスラグを設定
              const randomSlug = Math.random().toString(36).substring(2, 7);
              setCustomUrlSlug(randomSlug);
              checkSlugAvailability(randomSlug);
            }
          } catch (err) {
            console.error('QRコード取得エラー:', err);
            // QRコード取得に失敗した場合もランダムスラグを設定
            const randomSlug = Math.random().toString(36).substring(2, 7);
            setCustomUrlSlug(randomSlug);
            checkSlugAvailability(randomSlug);
          }
        }
      } catch (err) {
        console.error('プロフィールURLの取得に失敗しました', err);
        toast.error('プロフィール情報の取得に失敗しました');
      }
    };

    loadProfileAndQrCode();
  }, []);

  // カスタムURLスラグの利用可能性をチェック
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setIsSlugAvailable(false);
      setIsExistingQrCode(false);
      return;
    }

    setIsCheckingSlug(true);

    try {
      // APIエンドポイントを呼び出してスラグが利用可能かどうかをチェック
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
    } catch (err) {
      console.error('スラグチェックエラー:', err);
      setIsSlugAvailable(false);
      setIsExistingQrCode(false);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  // スラグ入力の変更を処理
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

  // QRコードページを生成または更新する
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
        userName: userProfileName,
        profileUrl,
      };

      console.log('Sending QR code data:', qrCodeData);

      // 既存QRコードの更新または新規作成
      const endpoint =
        isExistingQrCode && existingQrCodeId
          ? `/api/qrcode/update/${existingQrCodeId}`
          : '/api/qrcode/create';

      console.log(`Using endpoint: ${endpoint}`);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(qrCodeData),
        });

        const responseData = await response.json();
        console.log('Response from API:', responseData);

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
        console.error('API呼び出しエラー:', err);
        toast.error(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
      }
    } catch (err) {
      console.error('QRコードページ作成/更新エラー:', err);
      toast.error('QRコードページの作成に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // URLをコピーする関数
  const copyGeneratedUrl = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      toast.success('URLをコピーしました');
    }
  };

  // 以下、コンポーネントのレンダリング部分（変更なし）
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <HiColorSwatch className="h-8 w-8 text-gray-700 mr-3" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QRコードデザイナー</h1>
          <p className="text-muted-foreground text-justify">
            あなた専用のQRコードページを作成しましょう
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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

          {/* カスタムURLスラグ入力 */}
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
                  <p className="text-xs text-amber-600">※ このURLは既に使用中です。更新されます</p>
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

          {/* カラーピッカー - メインカラーとテキストカラー */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">メインカラー</label>
              <p className="text-xs text-gray-500 mb-2">ヘッダーとボタンに適用されます</p>
              <EnhancedColorPicker color={primaryColor} onChange={setPrimaryColor} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">テキストカラー</label>
              <p className="text-xs text-gray-500 mb-2">
                ヘッダーとボタン内のテキストカラーに適用されます
              </p>
              <EnhancedColorPicker color={textColor} onChange={setTextColor} />
            </div>
          </div>

          {/* QRコードページ生成ボタン */}
          <div className="mt-6 space-y-3">
            <Button
              className="w-full flex items-center gap-2 justify-center bg-blue-700 hover:bg-blue-800 text-white"
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

            {/* 生成されたURLコピーボタン - 常に表示するが無効/有効状態を切り替え */}
            <Button
              className="w-full flex items-center gap-2 justify-center"
              onClick={copyGeneratedUrl}
              disabled={!generatedUrl}
              variant="outline"
            >
              <FaCopy className="h-4 w-4" />
              {generatedUrl ? 'URLをコピー' : 'QRコードページを先に作成してください'}
            </Button>

            {generatedUrl && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm font-medium mb-2">QRコードページが作成されました:</p>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={generatedUrl}
                    readOnly
                    className="flex-1 text-sm p-2 border border-gray-300 rounded-l-md"
                  />
                  <Button className="rounded-l-none bg-gray-800" onClick={copyGeneratedUrl}>
                    コピー
                  </Button>
                </div>
                <div className="mt-2">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => window.open(generatedUrl, '_blank')}
                  >
                    QRコードページを開く
                  </Button>
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center gap-2 justify-center"
              onClick={() => setShowSaveInstructions(true)}
            >
              <FaMobile className="h-4 w-4" />
              スマホに保存する方法
            </Button>
          </div>
        </motion.div>

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
            profileUrl={profileUrl}
            userName={userProfileName}
            nameEn={userProfileNameEn}
            templateId="simple" // テンプレートは固定
            primaryColor={primaryColor}
            secondaryColor={primaryColor} // メインカラーと同じに
            accentColor="#FFFFFF" // 使用しない
            headerText={headerText}
            textColor={textColor}
            profileImage={profileImage}
          />
        </motion.div>
      </div>

      {/* モーダル部分（変更なし） */}
      {showSaveInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">スマホのホーム画面に追加する方法</h3>

            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-medium text-lg mb-2">iPhoneの場合:</h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>作成したQRコードページをSafariで開きます</li>
                  <li>共有ボタン（□に↑のアイコン）をタップ</li>
                  <li>「ホーム画面に追加」を選択</li>
                  <li>追加をタップ</li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium text-lg mb-2">Androidの場合:</h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>作成したQRコードページをChromeで開きます</li>
                  <li>メニューボタン（⋮）をタップ</li>
                  <li>「ホーム画面に追加」を選択</li>
                  <li>追加をタップ</li>
                </ol>
              </div>

              <p className="text-sm text-gray-600 italic">
                ホーム画面に追加すると、ワンタップでQRコードページを表示できます。
                スマホを取り出してアイコンをタップし、「反転」ボタンを押せば相手にスムーズにQRコードを見せられます。
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setShowSaveInstructions(false)}
                className="bg-blue-700 hover:bg-blue-800 text-white"
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