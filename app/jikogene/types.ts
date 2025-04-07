// app/jikogene/types.ts
import { ReactNode } from 'react';

export interface BasicInfo {
  ageGroup: string;
  gender?: string;
  occupation: string;
  location: string;
}

export interface FormData {
  basicInfo: BasicInfo;
  hobbies: string[];
  personalityTraits: string[];
  keywords: string;
  purpose: 'general' | 'business' | 'social';
  length: 'short' | 'medium' | 'long';
}

// フォームのセクションごとの値の型
export type FormDataValue<K extends keyof FormData> = K extends 'basicInfo'
  ? BasicInfo
  : K extends 'hobbies'
    ? string[]
    : K extends 'personalityTraits'
      ? string[]
      : K extends 'keywords'
        ? string
        : K extends 'purpose'
          ? 'general' | 'business' | 'social'
          : K extends 'length'
            ? 'short' | 'medium' | 'long'
            : never;

export interface GenerationResult {
  generatedText: string;
  timestamp: string;
  warning?: string; // 警告メッセージを追加
}

export interface FormStep {
  id: string;
  label: string;
  icon: ReactNode;
}

// エラーハンドリングのための共通型
export interface ErrorResponse {
  error: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// キーワード提案の型
export interface SuggestedKeyword {
  id: string;
  name: string;
  icon: ReactNode;
}
