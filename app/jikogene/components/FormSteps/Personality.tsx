// app/jikogene/components/FormSteps/Personality.tsx
'use client';
import { useState } from 'react';
import { FormData, FormDataValue } from '@/app/jikogene/types';
import { cn } from '@/lib/utils';
import { personalityItems } from '@/app/jikogene/lib/constants';
import { memo } from 'react';
interface PersonalityProps {
  formData: FormData;
  updateFormData: <K extends keyof FormData>(section: K, value: FormDataValue<K>) => void;
  sectionIcon: React.ReactNode;
  fieldErrors: Record<string, string>;
}
/**
 * 性格・特性入力フォームステップ
 * 入力フォームと追加ボタンを常に表示
 */
const Personality = memo(function Personality({
  formData,
  updateFormData,
  fieldErrors,
}: PersonalityProps) {
  const [otherTrait, setOtherTrait] = useState('');
  // 特性の選択/解除を処理
  const handleTraitChange = (trait: string) => {
    const currentTraits = [...formData.personalityTraits];
    if (currentTraits.includes(trait)) {
      // すでに選択されている場合は削除
      const updatedTraits = currentTraits.filter((t) => t !== trait);
      updateFormData('personalityTraits', updatedTraits);
    } else {
      // 選択されていない場合は追加
      const updatedTraits = [...currentTraits, trait];
      updateFormData('personalityTraits', updatedTraits);
    }
  };
  // その他の特性を追加
  const handleAddOtherTrait = () => {
    if (otherTrait.trim() && !formData.personalityTraits.includes(otherTrait.trim())) {
      const updatedTraits = [...formData.personalityTraits, otherTrait.trim()];
      updateFormData('personalityTraits', updatedTraits);
      setOtherTrait(''); // 入力をクリア
    }
  };
  // Enterキーが押されたときに特性を追加
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // フォーム送信を防止
      handleAddOtherTrait();
    }
  };
  return (
    <div className="fade-in">
      <p className="text-gray-500 mb-4">
        あなたの性格や特性を選択してください。自己紹介に反映させたい特徴を3〜5つ程度選ぶとバランスが良いでしょう。
      </p>
      {/* アイコン付き性格特性グリッド */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {personalityItems.map((trait) => (
          <div
            key={trait.id}
            className={cn(
              'border rounded-md p-3 cursor-pointer transition-colors',
              formData.personalityTraits.includes(trait.name)
                ? 'bg-blue-50 border-primary'
                : 'hover:bg-gray-50',
            )}
            onClick={() => handleTraitChange(trait.name)}
          >
            <div className="flex items-center">
              <div className="flex items-center">
                <span className="mr-2 text-xl">{trait.icon}</span>
                <span>{trait.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* その他の特性入力フォーム - 常に表示 */}
      <div className="mb-6 mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">その他の性格・特性</label>
        <div className="flex">
          <input
            type="text"
            value={otherTrait}
            onChange={(e) => setOtherTrait(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-grow px-3 py-3 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="例: 誠実、社交的、直感的など"
          />
          <button
            type="button"
            onClick={handleAddOtherTrait}
            disabled={!otherTrait.trim()}
            className={cn(
              'px-4 py-3 bg-blue-600 text-white rounded-r-md transition-colors',
              !otherTrait.trim() ? 'bg-blue-600 cursor-not-allowed' : 'hover:bg-blue-800',
            )}
          >
            追加
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          リストにない性格や特性を入力して「追加」ボタンをクリックしてください
        </p>
      </div>
      {/* 選択された特性のタグ表示 */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          {formData.personalityTraits.length === 0 ? (
            <div className="w-full">
              <p className="text-gray-500">まだ何も選択されていません</p>
              {fieldErrors.personalityTraits && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.personalityTraits}</p>
              )}
            </div>
          ) : (
            formData.personalityTraits.map((trait) => {
              // 特性のアイコンを探す
              const traitItem = personalityItems.find((item) => item.name === trait);
              const traitIcon = traitItem ? traitItem.icon : null;
              return (
                <span
                  key={trait}
                  className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {traitIcon && <span className="mr-1 text-lg">{traitIcon}</span>}
                  {trait}
                  <button
                    type="button"
                    className="ml-2 text-blue-700 hover:text-blue-900 focus:outline-none"
                    onClick={() => handleTraitChange(trait)}
                    aria-label={`${trait}を削除`}
                  >
                    ×
                  </button>
                </span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});
export default Personality;
