// app/jikogene/components/FormSteps/Hobbies.tsx
'use client';
import { useState } from 'react';
import { FormData, FormDataValue } from '@/app/jikogene/types';
import { cn } from '@/lib/utils';
import { hobbyItems } from '@/app/jikogene/lib/constants';
import { memo } from 'react';
interface HobbiesProps {
  formData: FormData;
  updateFormData: <K extends keyof FormData>(section: K, value: FormDataValue<K>) => void;
  sectionIcon: React.ReactNode;
  fieldErrors: Record<string, string>;
}
/**
 * 趣味・興味入力フォームステップ
 * 入力フォームと追加ボタンを常に表示
 */
const Hobbies = memo(function Hobbies({ formData, updateFormData, fieldErrors }: HobbiesProps) {
  const [otherHobby, setOtherHobby] = useState('');
  // 趣味の選択/解除を処理
  const handleHobbyChange = (hobby: string) => {
    const currentHobbies = [...formData.hobbies];
    if (currentHobbies.includes(hobby)) {
      // すでに選択されている場合は削除
      const updatedHobbies = currentHobbies.filter((h) => h !== hobby);
      updateFormData('hobbies', updatedHobbies);
    } else {
      // 選択されていない場合は追加
      const updatedHobbies = [...currentHobbies, hobby];
      updateFormData('hobbies', updatedHobbies);
    }
  };
  // その他の趣味を追加
  const handleAddOtherHobby = () => {
    if (otherHobby.trim() && !formData.hobbies.includes(otherHobby.trim())) {
      const updatedHobbies = [...formData.hobbies, otherHobby.trim()];
      updateFormData('hobbies', updatedHobbies);
      setOtherHobby(''); // 入力をクリア
    }
  };
  // Enterキーが押されたときに趣味を追加
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // フォーム送信を防止
      handleAddOtherHobby();
    }
  };
  return (
    <div className="fade-in">
      <p className="text-gray-500 mb-4">あなたの趣味や興味を選択してください。複数選択可能です。</p>
      {/* アイコン付き趣味グリッド */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {hobbyItems.map((hobby) => (
          <div
            key={hobby.id}
            className={cn(
              'border rounded-md p-3 cursor-pointer transition-colors',
              formData.hobbies.includes(hobby.name)
                ? 'bg-blue-50 border-primary'
                : 'hover:bg-gray-50',
            )}
            onClick={() => handleHobbyChange(hobby.name)}
          >
            <div className="flex items-center">
              <div className="flex items-center">
                <span className="mr-2 text-xl">{hobby.icon}</span>
                <span>{hobby.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* その他の趣味入力フォーム - 常に表示 */}
      <div className="mb-6 mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">その他の趣味・興味</label>
        <div className="flex">
          <input
            type="text"
            value={otherHobby}
            onChange={(e) => setOtherHobby(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-grow px-3 py-3 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="例: ゴルフ、DIY、カフェ巡りなど"
          />
          <button
            type="button"
            onClick={handleAddOtherHobby}
            disabled={!otherHobby.trim()}
            className={cn(
              'px-4 py-3 bg-blue-600 text-white rounded-r-md transition-colors',
              !otherHobby.trim() ? 'bg-blue-600 cursor-not-allowed' : 'hover:bg-blue-800',
            )}
          >
            追加
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          リストにない趣味や興味を入力して「追加」ボタンをクリックしてください
        </p>
      </div>
      {/* 選択された趣味のタグ表示 */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          {formData.hobbies.length === 0 ? (
            <div className="w-full">
              <p className="text-gray-500">まだ何も選択されていません</p>
              {fieldErrors.hobbies && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.hobbies}</p>
              )}
            </div>
          ) : (
            formData.hobbies.map((hobby) => {
              // 趣味のアイコンを探す
              const hobbyItem = hobbyItems.find((item) => item.name === hobby);
              const hobbyIcon = hobbyItem ? hobbyItem.icon : null;
              return (
                <span
                  key={hobby}
                  className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center"
                >
                  {hobbyIcon && <span className="mr-1 text-lg">{hobbyIcon}</span>}
                  {hobby}
                  <button
                    type="button"
                    className="ml-2 text-blue-700 hover:text-blue-900 focus:outline-none"
                    onClick={() => handleHobbyChange(hobby)}
                    aria-label={`${hobby}を削除`}
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
export default Hobbies;