// app/jikogene/hooks/useIntroductionForm.ts
'use client';

import { useState, useCallback } from 'react';
import { FormData, FormDataValue, BasicInfo } from '../types';
import { validateField } from '@/lib/jikogene/validator';
import { toast } from 'react-hot-toast';

// フォームの初期値
const initialFormData: FormData = {
  basicInfo: {
    ageGroup: '',
    gender: '',
    occupation: '',
    location: '',
  },
  hobbies: [],
  personalityTraits: [],
  keywords: '',
  purpose: 'general',
  length: 'medium',
};

/**
 * 自己紹介フォームの状態と検証ロジックを管理するカスタムフック
 * ステップ間の遷移問題を修正するための強化版
 */
export function useIntroductionForm() {
  // フォームデータの状態
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // フィールドエラーの状態
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 基本情報の更新
  const updateBasicInfo = useCallback((field: keyof BasicInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        [field]: value,
      },
    }));

    // エラー状態を更新
    const error = validateField(field, value);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, []);

  // フォームデータの更新（汎用）
  const updateFormData = useCallback(
    <K extends keyof FormData>(section: K, value: FormDataValue<K>) => {
      setFormData((prev) => ({
        ...prev,
        [section]: value,
      }));

      // エラー状態を更新
      const error = validateField(section as string, value);
      if (error) {
        setFieldErrors((prev) => ({ ...prev, [section]: error }));
      } else {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[section as string];
          return newErrors;
        });
      }
    },
    [],
  );

  // 現在のステップが有効かどうかを確認
  const isStepValid = useCallback(
    (step: number) => {
      switch (step) {
        case 0: // 基本情報
          return !!formData.basicInfo.ageGroup && !!formData.basicInfo.occupation;
        case 1: // 趣味・興味
          return formData.hobbies.length > 0;
        case 2: // 性格・特性
          return formData.personalityTraits.length > 0;
        case 3: // キーワード
          return true; // キーワードは任意
        case 4: // 出力オプション
          return !!formData.purpose && !!formData.length;
        default:
          return false;
      }
    },
    [formData],
  );

  // 全てのステップが有効かどうかを確認
  const isFormValid = useCallback(() => {
    // 基本情報
    if (!formData.basicInfo.ageGroup || !formData.basicInfo.occupation) {
      return false;
    }

    // 趣味・興味
    if (formData.hobbies.length === 0) {
      return false;
    }

    // 性格・特性
    if (formData.personalityTraits.length === 0) {
      return false;
    }

    // 出力オプション
    if (!formData.purpose || !formData.length) {
      return false;
    }

    return true;
  }, [formData]);

  // 特定のステップに移動する前に全ステップの検証
  const validateSteps = useCallback(
    (targetStep: number) => {
      // 現在のステップからtargetStepまでの間のすべてのステップをチェック
      for (let i = 0; i <= targetStep; i++) {
        if (!isStepValid(i)) {
          toast.error(`ステップ ${i + 1} の必須項目を入力してください`);
          return false;
        }
      }
      return true;
    },
    [isStepValid],
  );

  return {
    formData,
    fieldErrors,
    updateBasicInfo,
    updateFormData,
    isStepValid,
    isFormValid,
    validateSteps,
  };
}
