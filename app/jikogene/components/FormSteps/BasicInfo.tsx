// app/jikogene/components/FormSteps/BasicInfo.tsx
'use client';

import { memo } from 'react';
import { Input } from '@/components/ui/Input';
import { FormData, BasicInfo as BasicInfoType } from '@/app/jikogene/types';
import { cn } from '@/lib/utils';

interface BasicInfoProps {
  formData: FormData;
  updateBasicInfo: (field: keyof BasicInfoType, value: string) => void;
  sectionIcon: React.ReactNode;
  fieldErrors: Record<string, string>;
}

/**
 * 基本情報入力フォームステップ
 * メモ化してパフォーマンスを最適化
 */
const BasicInfo = memo(function BasicInfo({
  formData,
  updateBasicInfo,
  fieldErrors,
}: BasicInfoProps) {
  return (
    <div className="fade-in">
      <p className="text-gray-500 mb-4">自己紹介文に含める基本的な情報を入力してください。</p>

      <div className="space-y-4">
        <div>
          <label htmlFor="ageGroup" className="text-sm font-medium text-gray-700 mb-1">
            年齢層<span className="text-red-500">*</span>
          </label>
          <select
            id="ageGroup"
            value={formData.basicInfo.ageGroup}
            onChange={(e) => updateBasicInfo('ageGroup', e.target.value)}
            className={cn(
              'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
              fieldErrors.ageGroup && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            )}
            aria-invalid={!!fieldErrors.ageGroup}
          >
            <option value="">選択してください</option>
            <option value="10代">10代</option>
            <option value="20代">20代</option>
            <option value="30代">30代</option>
            <option value="40代">40代</option>
            <option value="50代">50代</option>
            <option value="60代以上">60代以上</option>
          </select>
          {fieldErrors.ageGroup && (
            <p className="mt-1 text-sm text-red-500">{fieldErrors.ageGroup}</p>
          )}
        </div>

        <div>
          <label htmlFor="gender" className="text-sm font-medium text-gray-700 mb-1">
            性別（任意）
          </label>
          <select
            id="gender"
            value={formData.basicInfo.gender || ''}
            onChange={(e) => updateBasicInfo('gender', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">選択してください</option>
            <option value="男性">男性</option>
            <option value="女性">女性</option>
            <option value="その他">その他</option>
            <option value="回答しない">回答しない</option>
          </select>
        </div>

        <div>
          <label htmlFor="occupation" className="text-sm font-medium text-gray-700 mb-1">
            職業<span className="text-red-500">*</span>
          </label>
          <Input
            id="occupation"
            value={formData.basicInfo.occupation}
            onChange={(e) => updateBasicInfo('occupation', e.target.value)}
            placeholder="例: エンジニア、学生、会社員"
            className={cn(
              fieldErrors.occupation && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            )}
            error={fieldErrors.occupation}
          />
        </div>

        <div>
          <label htmlFor="location" className="text-sm font-medium text-gray-700 mb-1">
            居住地域
          </label>
          <Input
            id="location"
            value={formData.basicInfo.location}
            onChange={(e) => updateBasicInfo('location', e.target.value)}
            placeholder="例: 東京、大阪、海外"
          />
          <p className="mt-1 text-xs text-gray-500">
            詳細な住所は必要ありません。都道府県名や国名程度で構いません。
          </p>
        </div>
      </div>
    </div>
  );
});

export default BasicInfo;