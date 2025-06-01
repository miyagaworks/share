// lib/jikogene/validator.ts
import { FormData, ErrorResponse } from '@/app/jikogene/types';
/**
 * フォームデータのバリデーション
 * @param formData 検証するフォームデータ
 * @returns エラーレスポンスまたはnull
 */
export function validateFormData(formData: FormData): ErrorResponse | null {
  const fieldErrors: Record<string, string> = {};
  // 基本情報のバリデーション
  if (!formData.basicInfo) {
    return {
      error: '基本情報が不足しています',
    };
  }
  // 年齢層
  if (!formData.basicInfo.ageGroup) {
    fieldErrors.ageGroup = '年齢層は必須です';
  }
  // 職業
  if (!formData.basicInfo.occupation) {
    fieldErrors.occupation = '職業は必須です';
  }
  // 趣味
  if (formData.hobbies.length === 0) {
    fieldErrors.hobbies = '趣味・興味を1つ以上選択してください';
  }
  // 性格特性
  if (formData.personalityTraits.length === 0) {
    fieldErrors.personalityTraits = '性格・特性を1つ以上選択してください';
  }
  // 用途のバリデーション
  const validPurposes = ['general', 'business', 'social'];
  if (!validPurposes.includes(formData.purpose)) {
    fieldErrors.purpose = `無効な用途です: ${formData.purpose}`;
  }
  // 長さのバリデーション
  const validLengths = ['short', 'medium', 'long'];
  if (!validLengths.includes(formData.length)) {
    fieldErrors.length = `無効な長さです: ${formData.length}`;
  }
  // フィールドエラーがあればエラーオブジェクトを返す
  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: 'フォームの入力内容に問題があります',
      fieldErrors,
    };
  }
  // バリデーション成功
  return null;
}
/**
 * 個別フィールドのバリデーション
 * リアルタイムバリデーション用
 */
export function validateField(field: string, value: unknown): string | null {
  switch (field) {
    case 'ageGroup':
      return typeof value === 'string' && value ? null : '年齢層を選択してください';
    case 'occupation':
      return typeof value === 'string' && value ? null : '職業を入力してください';
    case 'hobbies':
      return Array.isArray(value) && value.length > 0
        ? null
        : '趣味・興味を1つ以上選択してください';
    case 'personalityTraits':
      return Array.isArray(value) && value.length > 0
        ? null
        : '性格・特性を1つ以上選択してください';
    default:
      return null;
  }
}
