// components/qrcode/QrCodeGenerator.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { FaSave, FaMobile } from 'react-icons/fa';
import { HiColorSwatch, HiTemplate, HiEye } from 'react-icons/hi';
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker';
import { QrCodePreview } from './QrCodePreview';
import { motion } from 'framer-motion';

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
  const previewRef = useRef<HTMLDivElement>(null);

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

            // ユーザー名を設定
            if (data?.user?.name) {
              setUserProfileName(data.user.name);
            }

            // ユーザーの設定色を取得
            if (data?.user?.mainColor) {
              setPrimaryColor(data.user.mainColor);
            }
          }
        }
      } catch (error) {
        console.error('プロフィールURLの取得に失敗しました', error);
      }
    };

    loadProfileUrl();
  }, []);

  // スタイルを保存する関数
  const saveQrStyle = async () => {
    if (!userId) {
      toast.error('ユーザー情報が取得できません');
      return;
    }

    setIsSaving(true);

    try {
      // APIリクエストを作成してスタイルを保存
      const styleData = {
        userId,
        template: selectedTemplate,
        primaryColor,
        secondaryColor,
        accentColor,
      };

      // 仮のAPIエンドポイント - 実際の実装に合わせて変更が必要
      const response = await fetch('/api/qrcode/save-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(styleData),
      });

      if (response.ok) {
        toast.success('QRコードスタイルを保存しました');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'スタイルの保存に失敗しました');
      }
    } catch (error) {
      console.error('スタイル保存エラー:', error);
      toast.error('スタイルの保存に失敗しました');
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
            あなたのプロフィールQRコードをカスタマイズできます
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

          {/* ボタン */}
          <div className="mt-6 space-y-3">
            <Button
              className="w-full flex items-center gap-2 justify-center bg-blue-700 hover:bg-blue-800 text-white"
              onClick={saveQrStyle}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  保存中...
                </>
              ) : (
                <>
                  <FaSave className="h-4 w-4" />
                  スタイルを保存
                </>
              )}
            </Button>

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
            templateId={selectedTemplate}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            accentColor={accentColor}
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
                  <li>Safariでこのページを開きます</li>
                  <li>共有ボタン（□に↑のアイコン）をタップ</li>
                  <li>「ホーム画面に追加」を選択</li>
                  <li>追加をタップ</li>
                </ol>
              </div>

              <div>
                <h4 className="font-medium text-lg mb-2">Androidの場合:</h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Chromeでこのページを開きます</li>
                  <li>メニューボタン（⋮）をタップ</li>
                  <li>「ホーム画面に追加」を選択</li>
                  <li>追加をタップ</li>
                </ol>
              </div>

              <p className="text-sm text-gray-600 italic">
                ホーム画面に追加すると、ワンタップでこのQRコードページを表示できます。
                スマホを取り出してアイコンをタップするだけで、すぐに相手にQRコードを読み取ってもらえます。
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