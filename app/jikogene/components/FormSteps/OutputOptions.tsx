// app/jikogene/components/FormSteps/OutputOptions.tsx
'use client';
import { cn } from '@/lib/utils';
import { FormData, FormDataValue } from '@/app/jikogene/types';
import { memo } from 'react';
interface OutputOptionsProps {
  formData: FormData;
  updateFormData: <K extends keyof FormData>(section: K, value: FormDataValue<K>) => void;
  sectionIcon: React.ReactNode;
  fieldErrors: Record<string, string>;
}
/**
 * 出力オプション入力フォームステップ
 * メモ化してパフォーマンスを最適化
 */
const OutputOptions = memo(function OutputOptions({
  formData,
  updateFormData,
  fieldErrors,
}: OutputOptionsProps) {
  return (
    <div className="fade-in">
      <p className="text-gray-500 mb-4">生成される自己紹介文の用途と長さを選択してください。</p>
      {/* 文章の用途 */}
      <div className="mb-6">
        <label
          htmlFor="purpose"
          className="text-sm font-medium text-gray-700 mb-3 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z"
              clipRule="evenodd"
            />
          </svg>
          文章の用途
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            className={cn(
              'border rounded-md p-4 cursor-pointer transition-colors',
              formData.purpose === 'general' ? 'bg-blue-50 border-primary' : 'hover:bg-gray-50',
            )}
            onClick={() => updateFormData('purpose', 'general')}
          >
            <div className="flex items-center mb-2">
              <input
                type="radio"
                id="purpose-general"
                name="purpose"
                value="general"
                checked={formData.purpose === 'general'}
                onChange={() => updateFormData('purpose', 'general')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <label htmlFor="purpose-general" className="ml-2 font-medium text-gray-900">
                一般的
              </label>
            </div>
            <p className="text-sm text-gray-500 pl-6">日常的な場面での簡潔な自己紹介</p>
          </div>
          <div
            className={cn(
              'border rounded-md p-4 cursor-pointer transition-colors',
              formData.purpose === 'business' ? 'bg-blue-50 border-primary' : 'hover:bg-gray-50',
            )}
            onClick={() => updateFormData('purpose', 'business')}
          >
            <div className="flex items-center mb-2">
              <input
                type="radio"
                id="purpose-business"
                name="purpose"
                value="business"
                checked={formData.purpose === 'business'}
                onChange={() => updateFormData('purpose', 'business')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <label htmlFor="purpose-business" className="ml-2 font-medium text-gray-900">
                ビジネス
              </label>
            </div>
            <p className="text-sm text-gray-500 pl-6">仕事関連の場面に適した自己紹介</p>
          </div>
          <div
            className={cn(
              'border rounded-md p-4 cursor-pointer transition-colors',
              formData.purpose === 'social' ? 'bg-blue-50 border-primary' : 'hover:bg-gray-50',
            )}
            onClick={() => updateFormData('purpose', 'social')}
          >
            <div className="flex items-center mb-2">
              <input
                type="radio"
                id="purpose-social"
                name="purpose"
                value="social"
                checked={formData.purpose === 'social'}
                onChange={() => updateFormData('purpose', 'social')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <label htmlFor="purpose-social" className="ml-2 font-medium text-gray-900">
                ソーシャル
              </label>
            </div>
            <p className="text-sm text-gray-500 pl-6">SNSや交流目的のカジュアルな自己紹介</p>
          </div>
        </div>
        {fieldErrors.purpose && <p className="mt-1 text-sm text-red-500">{fieldErrors.purpose}</p>}
      </div>
      {/* 文章の長さ */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
          文章の長さ
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div
            className={cn(
              'border rounded-md p-4 cursor-pointer transition-colors',
              formData.length === 'short' ? 'bg-blue-50 border-primary' : 'hover:bg-gray-50',
            )}
            onClick={() => updateFormData('length', 'short')}
          >
            <div className="flex items-center mb-2">
              <input
                type="radio"
                id="length-short"
                name="length"
                value="short"
                checked={formData.length === 'short'}
                onChange={() => updateFormData('length', 'short')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <label htmlFor="length-short" className="ml-2 font-medium text-gray-900">
                短め
              </label>
            </div>
            <p className="text-sm text-gray-500 pl-6">約100文字の簡潔な自己紹介</p>
          </div>
          <div
            className={cn(
              'border rounded-md p-4 cursor-pointer transition-colors',
              formData.length === 'medium' ? 'bg-blue-50 border-primary' : 'hover:bg-gray-50',
            )}
            onClick={() => updateFormData('length', 'medium')}
          >
            <div className="flex items-center mb-2">
              <input
                type="radio"
                id="length-medium"
                name="length"
                value="medium"
                checked={formData.length === 'medium'}
                onChange={() => updateFormData('length', 'medium')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <label htmlFor="length-medium" className="ml-2 font-medium text-gray-900">
                標準
              </label>
            </div>
            <p className="text-sm text-gray-500 pl-6">約250文字の標準的な自己紹介</p>
          </div>
          <div
            className={cn(
              'border rounded-md p-4 cursor-pointer transition-colors',
              formData.length === 'long' ? 'bg-blue-50 border-primary' : 'hover:bg-gray-50',
            )}
            onClick={() => updateFormData('length', 'long')}
          >
            <div className="flex items-center mb-2">
              <input
                type="radio"
                id="length-long"
                name="length"
                value="long"
                checked={formData.length === 'long'}
                onChange={() => updateFormData('length', 'long')}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
              />
              <label htmlFor="length-long" className="ml-2 font-medium text-gray-900">
                長め
              </label>
            </div>
            <p className="text-sm text-gray-500 pl-6">約450文字の詳細な自己紹介</p>
          </div>
        </div>
        {fieldErrors.length && <p className="mt-1 text-sm text-red-500">{fieldErrors.length}</p>}
      </div>
      {/* 生成のヒント */}
      <div className="mt-6 rounded-md bg-green-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-green-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">
              自己紹介文の生成はAIによって行われます。生成された文章は、必要に応じて編集してご利用ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
export default OutputOptions;