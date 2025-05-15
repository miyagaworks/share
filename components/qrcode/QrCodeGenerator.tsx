// components/qrcode/QrCodeGenerator.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { FaMobile, FaLink } from 'react-icons/fa';
import { HiColorSwatch, HiTemplate, HiEye } from 'react-icons/hi';
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker';
import { QrCodePreview } from './QrCodePreview';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';

// クライアント側の型定義
interface QrCodeCreateData {
  userId: string;
  slug: string;
  template: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  userName: string;
  nameEn?: string;
  profileUrl: string;
  headerText: string;
  textColor: string;
}

// デザインテンプレート
const DESIGN_TEMPLATES = [
  {
    id: 'simple',
    name: 'シンプル',
    description: 'シンプルでクリーンなデザイン',
    previewClass: 'bg-white border border-gray-200 shadow-sm',
  },
  {
    id: 'modern',
    name: 'モダン',
    description: 'モダンなグラデーション背景',
    previewClass: 'bg-gradient-to-br from-primary-100 to-primary-500 shadow-md',
  },
  {
    id: 'bold',
    name: 'ボールド',
    description: '力強い印象的なデザイン',
    previewClass: 'bg-black text-white shadow-lg',
  },
];

export function QrCodeGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState(DESIGN_TEMPLATES[0].id);
  const [primaryColor, setPrimaryColor] = useState('#3B82F6'); // デフォルトカラー
  const [secondaryColor, setSecondaryColor] = useState('#1E40AF'); // デフォルト二次カラー
  const [accentColor, setAccentColor] = useState('#FFFFFF'); // アクセントカラー
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
  const [textColor, setTextColor] = useState('#FFFFFF');

  // ユーザーのプロフィールURLを読み込む
  useEffect(() => {
    const loadProfileUrl = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          if (data?.user?.profile?.slug) {
            const baseUrl = `${window.location.origin}/${data.user.profile.slug}`;
            setProfileUrl(baseUrl);
            setUserId(data.user.id);

            // ヘッダーテキストとテキストカラーを設定
            if (data?.user?.headerText) {
              setHeaderText(data.user.headerText);
            }
            if (data?.user?.textColor) {
              setTextColor(data.user.textColor);
            }

            // ユーザー名を設定
            if (data?.user?.name) {
              setUserProfileName(data.user.name);
            }

            // 英語名を設定（新しく追加）
            if (data?.user?.nameEn) {
              setUserProfileNameEn(data.user.nameEn);
            }

            // ユーザーの設定色を取得
            if (data?.user?.mainColor) {
              setPrimaryColor(data.user.mainColor);
            }

            // カスタムURLスラグのデフォルト値を設定（ランダム値）
            const randomSlug = Math.random().toString(36).substring(2, 7);
            setCustomUrlSlug(randomSlug);

            // 利用可能性をチェック
            checkSlugAvailability(randomSlug);
          }
        }
      } catch (error) {
        console.error('プロフィールURLの取得に失敗しました', error);
      }
    };

    loadProfileUrl();
  }, []);
  
  // カスタムURLスラグの利用可能性をチェック
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setIsSlugAvailable(false);
      return;
    }

    setIsCheckingSlug(true);

    try {
      // APIエンドポイントを呼び出してスラグが利用可能かどうかをチェック
      const response = await fetch(`/api/qrcode/check-slug?slug=${slug}`);
      const data = await response.json();

      setIsSlugAvailable(data.available);
    } catch (error) {
      console.error('スラグチェックエラー:', error);
      setIsSlugAvailable(false);
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
    }
  };

  // QRコードページを生成する
  const generateQrCodePage = async () => {
    if (!isSlugAvailable || !customUrlSlug || customUrlSlug.length < 3) {
      toast.error('有効なURLスラグを入力してください');
      return;
    }

    // userId が null でないことを確認
    if (!userId) {
      toast.error('ユーザーIDが取得できません');
      return;
    }

    setIsSaving(true);

    try {
      // QRコードページの設定を保存
      const qrCodeData: QrCodeCreateData = {
        userId,
        slug: customUrlSlug,
        template: selectedTemplate,
        primaryColor,
        secondaryColor,
        accentColor,
        userName: userProfileName,
        profileUrl: profileUrl,
        headerText: headerText,
        textColor: textColor,
      };

      // nameEnが存在する場合のみ追加
      if (userProfileNameEn) {
        qrCodeData.nameEn = userProfileNameEn;
      }

      // QRコードページ作成APIを呼び出し
      const response = await fetch('/api/qrcode/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(qrCodeData),
      });

      if (response.ok) {
        // サーバーからのレスポンスからURLを生成
        const fullUrl = `${window.location.origin}/qr/${customUrlSlug}`;
        setGeneratedUrl(fullUrl);

        toast.success('QRコードページを作成しました！');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'QRコードページの作成に失敗しました');
      }
    } catch (error) {
      console.error('QRコードページ作成エラー:', error);
      toast.error('QRコードページの作成に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

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
            <HiTemplate className="h-5 w-5 text-gray-700 mr-2" />
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
                isSlugAvailable ? (
                  <p className="text-xs text-green-600">✓ このURLは利用可能です</p>
                ) : (
                  <p className="text-xs text-red-600">✗ このURLは既に使用されています</p>
                )
              ) : (
                <p className="text-xs text-gray-500">3文字以上入力してください</p>
              )}
            </div>
          </div>

          {/* テンプレート選択 - モダンなカード表示 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              テンプレートスタイル
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DESIGN_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-3 border rounded-lg text-center transition-all transform hover:scale-105 ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md scale-105'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className={`h-20 mb-2 rounded-md ${template.previewClass}`}></div>
                  <span className="block font-medium">{template.name}</span>
                  <span className="block text-xs text-gray-500">{template.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* カラーピッカー */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">メインカラー</label>
              <EnhancedColorPicker color={primaryColor} onChange={setPrimaryColor} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                セカンダリカラー
              </label>
              <EnhancedColorPicker color={secondaryColor} onChange={setSecondaryColor} />
            </div>

            {selectedTemplate === 'modern' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  アクセントカラー
                </label>
                <EnhancedColorPicker color={accentColor} onChange={setAccentColor} />
              </div>
            )}
          </div>

          {/* QRコードページ生成ボタン */}
          <div className="mt-6 space-y-3">
            <Button
              className="w-full flex items-center gap-2 justify-center bg-blue-700 hover:bg-blue-800 text-white"
              onClick={generateQrCodePage}
              disabled={isSaving || !isSlugAvailable}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  作成中...
                </>
              ) : (
                <>
                  <FaLink className="h-4 w-4" />
                  QRコードページを作成
                </>
              )}
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
                  <Button
                    className="rounded-l-none bg-gray-800"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedUrl);
                      toast.success('URLをコピーしました');
                    }}
                  >
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
            templateId={selectedTemplate}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            accentColor={accentColor}
            headerText={headerText}
            textColor={textColor}
          />
        </motion.div>
      </div>

      {/* スマホ保存説明モーダル */}
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