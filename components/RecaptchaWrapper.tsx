// components/RecaptchaWrapper.tsx
'use client';
import ReCAPTCHA from 'react-google-recaptcha';
import { useRef, useEffect, useState } from 'react';

interface RecaptchaWrapperProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
}

export default function RecaptchaWrapper({ onVerify, onExpired }: RecaptchaWrapperProps) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 環境変数の確認とデバッグ
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    // reCAPTCHAライブラリの読み込み確認
    const checkRecaptchaLoaded = () => {
      if (typeof window !== 'undefined' && (window as any).grecaptcha) {
        setIsLoaded(true);
      } else {
        setTimeout(checkRecaptchaLoaded, 100);
      }
    };

    checkRecaptchaLoaded();
  }, []);

  console.log('🔑 reCAPTCHA Site Key:', siteKey);
  console.log('📚 reCAPTCHA Loaded:', isLoaded);

  if (!siteKey) {
    console.error('❌ NEXT_PUBLIC_RECAPTCHA_SITE_KEY が設定されていません');
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600 text-sm">reCAPTCHA設定エラー: サイトキーが見つかりません</p>
        <p className="text-xs text-red-500 mt-1">
          環境変数 NEXT_PUBLIC_RECAPTCHA_SITE_KEY を確認してください
        </p>
      </div>
    );
  }

  const handleChange = (token: string | null) => {
    console.log('🔒 reCAPTCHA Token received:', token ? 'Valid Token' : 'Null Token');
    onVerify(token);
  };

  const handleExpired = () => {
    console.log('⏰ reCAPTCHA Token expired');
    onExpired?.();
  };

  const handleError = () => {
    console.log('❌ reCAPTCHA Error occurred');
    onVerify(null);
  };

  return (
    <div className="recaptcha-wrapper">
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleChange}
        onExpired={handleExpired}
        onErrored={handleError}
        theme="light"
        size="normal"
      />
      {!isLoaded && <p className="text-xs text-gray-500 mt-1">reCAPTCHAを読み込み中...</p>}
    </div>
  );
}