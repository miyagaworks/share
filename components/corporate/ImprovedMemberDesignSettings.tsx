// components/corporate/ImprovedMemberDesignSettings.tsx
import React, { useState, useEffect } from 'react';
import { HiInformationCircle } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker';
interface DesignSettingsProps {
  initialValues: {
    snsIconColor: string | null;
    mainColor: string | null;
    bioBackgroundColor?: string | null;
    bioTextColor?: string | null;
  };
  primaryColor: string;
  secondaryColor: string;
  isLoading: boolean;
  onSave: (values: {
    snsIconColor?: string | null;
    mainColor?: string | null;
    bioBackgroundColor?: string | null;
    bioTextColor?: string | null;
  }) => Promise<void>;
  activeTab?: 'sns' | 'bio';
  onTabChange?: (tab: 'sns' | 'bio') => void;
}
export function ImprovedMemberDesignSettings({
  initialValues,
  isLoading,
  onSave,
  activeTab: externalActiveTab, // 親コンポーネントから渡されたタブ状態
  onTabChange, // 親コンポーネントに通知する関数
}: DesignSettingsProps) {
  // フォーム状態
  const [snsIconColor, setSnsIconColor] = useState(initialValues.snsIconColor || '#333333');
  const [useOriginalSnsColors, setUseOriginalSnsColors] = useState(
    initialValues.snsIconColor === 'original',
  );
  // 追加: 自己紹介ページの色設定
  const [bioBackgroundColor, setBioBackgroundColor] = useState(
    initialValues.bioBackgroundColor || '#FFFFFF',
  );
  const [bioTextColor, setBioTextColor] = useState(initialValues.bioTextColor || '#333333');
  const [isSaving, setIsSaving] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  // タブ状態
  const [internalActiveTab, setInternalActiveTab] = useState<'sns' | 'bio'>(
    externalActiveTab || 'sns',
  );
  useEffect(() => {
  // 外部から渡されたタブ状態があり、かつ内部状態と異なる場合のみ更新
  if (externalActiveTab !== undefined && externalActiveTab !== internalActiveTab) {
    setInternalActiveTab(externalActiveTab);
  }
}, [externalActiveTab, internalActiveTab]);
  const handleTabChange = (tab: 'sns' | 'bio') => {
    setInternalActiveTab(tab);
    // 親コンポーネントに通知
    if (onTabChange) {
      onTabChange(tab);
    }
  };
  // SNSアイコンカラーのトグル切り替え関数
  const handleSnsIconColorToggle = () => {
    setUseOriginalSnsColors(!useOriginalSnsColors);
  };
  // 初期値が変更された場合、フォームを更新
  useEffect(() => {
    setSnsIconColor(
      initialValues.snsIconColor === 'original'
        ? '#333333'
        : initialValues.snsIconColor || '#333333',
    );
    setUseOriginalSnsColors(initialValues.snsIconColor === 'original');
    // 追加: 自己紹介ページの色設定を初期化
    setBioBackgroundColor(initialValues.bioBackgroundColor || '#FFFFFF');
    setBioTextColor(initialValues.bioTextColor || '#333333');
  }, [initialValues]);
  // 変更検知
  useEffect(() => {
    const newSnsIconColor = useOriginalSnsColors ? 'original' : snsIconColor;
    // 追加: 自己紹介ページの色設定も変更検知に含める
    const isChanged =
      newSnsIconColor !== (initialValues.snsIconColor || '#333333') ||
      bioBackgroundColor !== (initialValues.bioBackgroundColor || '#FFFFFF') ||
      bioTextColor !== (initialValues.bioTextColor || '#333333');
    setFormChanged(isChanged);
  }, [snsIconColor, useOriginalSnsColors, bioBackgroundColor, bioTextColor, initialValues]);
  // 保存処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSave({
        snsIconColor: useOriginalSnsColors ? 'original' : snsIconColor,
        // 追加: 自己紹介ページの設定も保存
        bioBackgroundColor,
        bioTextColor,
      });
      setFormChanged(false);
    } catch {
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="flex border-b border-gray-200 mb-4">
          <button
            type="button"
            className={`py-3 px-6 text-sm font-medium flex items-center relative transition-all duration-200 ${
              internalActiveTab === 'sns'
                ? 'text-white bg-[#1E3A8A] rounded-t-lg shadow-sm border-b-0 z-10'
                : 'text-gray-500 bg-gray-100 hover:text-white hover:bg-[#1E3A8A] rounded-t-lg'
            }`}
            onClick={() => handleTabChange('sns')} // 修正したハンドラを使用
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            SNSアイコン設定
          </button>
          <button
            type="button"
            className={`py-3 px-6 text-sm font-medium flex items-center relative transition-all duration-200 ${
              internalActiveTab === 'bio'
                ? 'text-white bg-[#1E3A8A] rounded-t-lg shadow-sm border-b-0 z-10'
                : 'text-gray-500 bg-gray-100 hover:text-white hover:bg-[#1E3A8A] rounded-t-lg'
            }`}
            onClick={() => handleTabChange('bio')} // 修正したハンドラを使用
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            自己紹介ページ設定
          </button>
        </div>
        {/* SNSアイコン設定 */}
        {internalActiveTab === 'sns' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">SNSアイコンカラー</label>
            <p className="text-xs text-gray-500 mt-1 mb-2">
              プロフィールに表示されるSNSアイコンの色を設定します。
            </p>
            {/* トグルスイッチ */}
            <div className="relative h-14 rounded-md border border-gray-200 bg-white mt-3">
              <div
                className={`absolute inset-0 flex ${useOriginalSnsColors ? 'justify-end' : 'justify-start'}`}
                onClick={handleSnsIconColorToggle}
              >
                <div className="w-1/2 h-full p-1 cursor-pointer transition-all duration-200">
                  <div
                    className="w-full h-full rounded-md flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: '#1E3A8A' }}
                  >
                    {useOriginalSnsColors ? (
                      <div className="flex items-center">
                        <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 bg-green-500 rounded-full"></span>
                        <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 bg-blue-500 rounded-full"></span>
                        <span className="inline-block w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></span>
                        <span className="ml-1 sm:ml-2 text-xs sm:text-sm">カラー</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-800 rounded-full mr-1 sm:mr-2"></div>
                        <span className="text-xs sm:text-sm">シンプル</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex justify-between pointer-events-none">
                <div className="w-1/2 h-full flex items-center justify-center text-xs sm:text-sm text-gray-400">
                  <div className="flex items-center opacity-50">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded-full mr-1 sm:mr-2"></div>
                    <span>シンプル</span>
                  </div>
                </div>
                <div className="w-1/2 h-full flex items-center justify-center text-xs sm:text-sm text-gray-400">
                  <div className="flex items-center opacity-50">
                    <span className="inline-block w-2 h-2 mr-0.5 sm:mr-1 bg-green-300 rounded-full"></span>
                    <span className="inline-block w-2 h-2 mr-0.5 sm:mr-1 bg-blue-300 rounded-full"></span>
                    <span className="inline-block w-2 h-2 bg-red-300 rounded-full"></span>
                    <span className="ml-1 sm:ml-2">カラー</span>
                  </div>
                </div>
              </div>
            </div>
            {!useOriginalSnsColors && (
              <div className="mt-4">
                <EnhancedColorPicker
                  color={snsIconColor}
                  onChange={setSnsIconColor}
                  disabled={isLoading || isSaving || useOriginalSnsColors}
                />
              </div>
            )}
          </div>
        )}
        {/* 追加: 自己紹介ページ設定 */}
        {internalActiveTab === 'bio' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">背景色</label>
              <p className="text-xs text-gray-500 mt-1 mb-2">
                自己紹介ページの背景色を設定します。
              </p>
              <EnhancedColorPicker
                color={bioBackgroundColor}
                onChange={setBioBackgroundColor}
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">文字色</label>
              <p className="text-xs text-gray-500 mt-1 mb-2">
                自己紹介ページの文字色を設定します。
              </p>
              <EnhancedColorPicker
                color={bioTextColor}
                onChange={setBioTextColor}
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mt-4">
              <div className="flex">
                <HiInformationCircle className="h-5 w-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-700 text-sm text-justify">
                    自己紹介ページのヘッダーは法人のプライマリーカラーに合わせて自動的に調整されます。
                    コンテンツ部分の背景色と文字色をカスタマイズできます。
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-2">プレビュー</h3>
              <div
                className="rounded-lg shadow-sm p-4"
                style={{ backgroundColor: bioBackgroundColor }}
              >
                <p className="text-sm font-semibold" style={{ color: bioTextColor }}>
                  自己紹介:
                </p>
                <p className="text-sm" style={{ color: bioTextColor }}>
                  自己紹介テキストのサンプルです。ここに表示される文字色を設定できます。
                </p>
              </div>
            </div>
          </div>
        )}
        {/* 法人カラーに関する注意書き - 自己紹介ページのカスタマイズにも言及 */}
        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 sm:p-4 mt-6 text-sm">
          <div className="flex">
            <HiInformationCircle className="h-5 w-5 text-yellow-700 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-700 text-xs sm:text-sm text-justify">
                プライマリーカラー、セカンダリーカラー、ヘッダーテキストは法人設定のブランディングカラーが適用されます。
                SNSアイコンカラーと自己紹介ページの色はカスタマイズできます。法人ブランディングに合わせた色を選ぶことをおすすめします。
              </p>
            </div>
          </div>
        </div>
        {/* 送信ボタン */}
        <div className="flex justify-center sm:justify-end mt-6">
          <Button
            type="submit"
            disabled={!formChanged || isLoading || isSaving}
            loading={isSaving}
            loadingText="保存中..."
            className="w-full sm:w-auto bg-[#1E3A8A] text-white hover:bg-opacity-90 transition-colors"
          >
            デザイン設定を保存
          </Button>
        </div>
      </div>
    </form>
  );
}