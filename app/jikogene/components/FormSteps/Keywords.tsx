// app/jikogene/components/FormSteps/Keywords.tsx
'use client';
import { cn } from '@/lib/utils';
import { FormData, FormDataValue } from '@/app/jikogene/types';
import { suggestedKeywords } from '@/app/jikogene/lib/constants';
import { memo } from 'react';
interface KeywordsProps {
  formData: FormData;
  updateFormData: <K extends keyof FormData>(section: K, value: FormDataValue<K>) => void;
  sectionIcon: React.ReactNode;
  fieldErrors: Record<string, string>;
}
/**
 * キーワード入力フォームステップ
 * メモ化してパフォーマンスを最適化
 */
const Keywords = memo(function Keywords({ formData, updateFormData }: KeywordsProps) {
  // テキストエリアの値を更新する
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFormData('keywords', e.target.value);
  };
  // キーワード提案をクリックしたときの処理
  const handleKeywordSuggestion = (keyword: { id: string; name: string }) => {
    // 現在のキーワードをカンマ区切りで配列に変換
    const currentKeywords = formData.keywords
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k !== '');
    // すでに含まれていないか確認
    if (!currentKeywords.includes(keyword.name)) {
      // 新しいキーワードを追加
      const newKeywords = [...currentKeywords, keyword.name].join(', ');
      updateFormData('keywords', newKeywords);
    }
  };
  // キーワードがすでに含まれているかチェック
  const isKeywordIncluded = (keywordName: string): boolean => {
    return formData.keywords
      .split(',')
      .map((k) => k.trim())
      .includes(keywordName);
  };
  return (
    <div className="fade-in">
      {/* キーワード入力フィールド */}
      <div className="mb-6">
        <label
          htmlFor="keywords"
          className="text-sm font-medium text-gray-700 mb-1 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          キーワード（任意）
        </label>
        <textarea
          id="keywords"
          value={formData.keywords}
          onChange={handleTextareaChange}
          placeholder="例: チームワーク, リーダーシップ, 新しい挑戦"
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
          aria-describedby="keywords-description"
        />
        <p id="keywords-description" className="mt-1 text-xs text-gray-500">
          入力したキーワードは、AIが自己紹介文を生成する際の参考にされます。
        </p>
      </div>
      {/* キーワード提案 */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">キーワード提案:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedKeywords.map((keyword) => (
            <button
              key={keyword.id}
              type="button"
              onClick={() => handleKeywordSuggestion(keyword)}
              className={cn(
                'flex items-center px-3 py-1.5 rounded-full text-sm border transition-colors',
                isKeywordIncluded(keyword.name)
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
              )}
            >
              {keyword.icon && <span className="mr-1.5">{keyword.icon}</span>}
              {keyword.name}
            </button>
          ))}
        </div>
      </div>
      {/* キーワードのヒント */}
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              適切なキーワードを選ぶことで、より魅力的で個性的な自己紹介文が生成されます。
              特に強調したい特徴やスキルを入力しましょう。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
export default Keywords;