// components/corporate/ImprovedMemberDesignSettings.tsx
import React, { useState, useEffect } from 'react';
import { HiInformationCircle } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker';

interface DesignSettingsProps {
  initialValues: {
    snsIconColor: string | null;
    mainColor: string | null;
    // secondaryColor を削除
  };
  primaryColor: string;
  secondaryColor: string; // 表示用のプロパティとして残す
  isLoading: boolean;
  onSave: (values: {
    snsIconColor?: string | null;
    mainColor?: string | null;
    // secondaryColor を削除
  }) => Promise<void>;
}

export function ImprovedMemberDesignSettings({
  initialValues,
  primaryColor,
  secondaryColor: tenantSecondaryColor, // 表示用に利用
  isLoading,
  onSave,
}: DesignSettingsProps) {
  // フォーム状態から secondaryColor を削除
  const [snsIconColor, setSnsIconColor] = useState(initialValues.snsIconColor || '#333333');
  const [useOriginalSnsColors, setUseOriginalSnsColors] = useState(
    initialValues.snsIconColor === 'original',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [formChanged, setFormChanged] = useState(false);

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
  }, [initialValues]);

  // 変更検知
  useEffect(() => {
    const newSnsIconColor = useOriginalSnsColors ? 'original' : snsIconColor;
    const isChanged = newSnsIconColor !== (initialValues.snsIconColor || '#333333');

    setFormChanged(isChanged);
  }, [snsIconColor, useOriginalSnsColors, initialValues]);

  // 保存処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      await onSave({
        snsIconColor: useOriginalSnsColors ? 'original' : snsIconColor,
        // secondaryColor は送信しない
      });

      setFormChanged(false);
    } catch (error) {
      console.error('設定保存エラー:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* セカンダリーカラー設定を削除 */}

        {/* SNSアイコンカラー設定 */}
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
                  style={{ backgroundColor: primaryColor }}
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

        {/* 法人カラーに関する注意書きを修正 - tenantSecondaryColorを使用 */}
        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 mt-6">
          <div className="flex">
            <HiInformationCircle className="h-5 w-5 text-yellow-700 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-700 text-justify">
                プライマリーカラー、セカンダリーカラー、ヘッダーテキストは法人設定のブランディングカラーが適用されます。
                SNSアイコンカラーのみカスタマイズできます。法人ブランディングに合わせた色を選ぶことをおすすめします。
              </p>
            </div>
          </div>
        </div>

        {/* 送信ボタン - tenantSecondaryColorをホバー時に使用 */}
        <div className="flex justify-center sm:justify-end">
          <Button
            type="submit"
            disabled={!formChanged || isLoading || isSaving}
            loading={isSaving}
            loadingText="保存中..."
            style={{
              backgroundColor: primaryColor,
              borderColor: tenantSecondaryColor,
            }}
            className="w-full sm:w-auto hover:bg-opacity-90 transition-colors"
          >
            デザイン設定を保存
          </Button>
        </div>
      </div>
    </form>
  );
}