// components/RecaptchaWrapper.tsx - シンプル版（エラーなし）
'use client';
import { useEffect, useState } from 'react';

interface RecaptchaWrapperProps {
  onVerify: (token: string | null) => void;
  onExpired?: () => void;
  action?: string;
}

export default function RecaptchaWrapper({
  onVerify,
  onExpired,
  action = 'submit',
}: RecaptchaWrapperProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExecuted, setHasExecuted] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      setError('reCAPTCHA Site Keyが設定されていません');
      return;
    }

    if (hasExecuted) {
      return;
    }

    const executeRecaptcha = async () => {
      if (!window.grecaptcha || hasExecuted) {
        return;
      }

      try {
        setHasExecuted(true);
        console.log('🚀 Executing reCAPTCHA v3...');
        const token = await window.grecaptcha.execute(siteKey, { action });
        console.log('✅ reCAPTCHA v3 token received');
        onVerify(token);
      } catch (err) {
        console.error('❌ reCAPTCHA execution error:', err);
        setError('reCAPTCHA実行エラーが発生しました');
        onVerify(null);
      }
    };

    const checkAndExecute = () => {
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => {
          setIsLoaded(true);
          setError(null);
          executeRecaptcha();
        });
      } else {
        // 3秒後に再試行（1回のみ）
        setTimeout(() => {
          if (window.grecaptcha && window.grecaptcha.ready && !hasExecuted) {
            window.grecaptcha.ready(() => {
              setIsLoaded(true);
              setError(null);
              executeRecaptcha();
            });
          } else if (!hasExecuted) {
            setError('reCAPTCHAの読み込みに失敗しました');
          }
        }, 3000);
      }
    };

    checkAndExecute();
  }, [siteKey, action, onVerify, hasExecuted]);

  if (!siteKey) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600 text-sm">reCAPTCHA設定エラー: サイトキーが見つかりません</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!isLoaded || !hasExecuted) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-600 text-sm">reCAPTCHA v3 読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="font-medium">reCAPTCHA認証完了</p>
          <p className="text-xs text-green-500 mt-1">セキュリティ認証が正常に実行されました</p>
        </div>
      </div>

      <div className="text-xs text-gray-500 leading-relaxed">
        このサイトはreCAPTCHA v3によって保護されており、Googleの
        <a
          href="https://policies.google.com/privacy"
          className="text-blue-600 hover:text-blue-800 underline mx-1"
          target="_blank"
          rel="noopener noreferrer"
        >
          プライバシーポリシー
        </a>
        と
        <a
          href="https://policies.google.com/terms"
          className="text-blue-600 hover:text-blue-800 underline mx-1"
          target="_blank"
          rel="noopener noreferrer"
        >
          利用規約
        </a>
        が適用されます。
      </div>
    </div>
  );
}