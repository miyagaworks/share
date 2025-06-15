// components/RecaptchaWrapper.tsx
'use client';
import ReCAPTCHA from 'react-google-recaptcha';
import { useRef } from 'react';

interface RecaptchaWrapperProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
}

export default function RecaptchaWrapper({ onVerify, onExpired }: RecaptchaWrapperProps) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // 環境変数の確認とデバッグ
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  console.log('🔑 reCAPTCHA Site Key:', siteKey);

  if (!siteKey) {
    console.error('❌ NEXT_PUBLIC_RECAPTCHA_SITE_KEY が設定されていません');
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600 text-sm">reCAPTCHA設定エラー: サイトキーが見つかりません</p>
      </div>
    );
  }

  return (
    <ReCAPTCHA
      ref={recaptchaRef}
      sitekey={siteKey}
      onChange={onVerify}
      onExpired={onExpired}
      theme="light"
    />
  );
}