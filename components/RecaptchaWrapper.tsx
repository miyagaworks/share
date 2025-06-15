// components/RecaptchaWrapper.tsx - 完璧なv3対応版
'use client';
import { useRef, useEffect, useState, useCallback } from 'react';

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
  const [isReady, setIsReady] = useState(false);
  const executeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 環境変数の確認
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // reCAPTCHA実行関数をuseCallbackで定義
  const executeRecaptcha = useCallback(async () => {
    if (!window.grecaptcha || !siteKey || !isReady) {
      console.log('❌ reCAPTCHA not ready yet');
      return;
    }

    try {
      console.log('🚀 Executing reCAPTCHA v3 with action:', action);
      const token = await window.grecaptcha.execute(siteKey, { action });
      console.log('✅ reCAPTCHA v3 token received successfully');
      onVerify(token);

      // v3では2分でトークンが期限切れになるため、1分45秒後に再実行
      if (executeTimeoutRef.current) {
        clearTimeout(executeTimeoutRef.current);
      }

      executeTimeoutRef.current = setTimeout(() => {
        executeRecaptcha();
      }, 105000); // 1分45秒後
    } catch (error) {
      console.error('❌ reCAPTCHA execution error:', error);
      setError('reCAPTCHA実行エラーが発生しました');
      onVerify(null);
    }
  }, [siteKey, action, onVerify, isReady]);

  // リフレッシュ関数
  const handleRefresh = useCallback(() => {
    setError(null);
    if (isReady) {
      executeRecaptcha();
    }
  }, [executeRecaptcha, isReady]);

  // reCAPTCHA初期化
  useEffect(() => {
    console.log('🔑 reCAPTCHA Site Key:', siteKey ? `${siteKey.substring(0, 10)}...` : 'undefined');

    if (!siteKey) {
      setError('reCAPTCHA Site Keyが設定されていません');
      return;
    }

    // grecaptchaの読み込み確認
    const checkGrecaptcha = () => {
      if (window.grecaptcha && window.grecaptcha.ready) {
        console.log('📜 grecaptcha script found, initializing...');

        window.grecaptcha.ready(() => {
          console.log('✅ reCAPTCHA v3 ready');
          setIsLoaded(true);
          setIsReady(true);
          setError(null);

          // 初回実行
          executeRecaptcha();
        });

        // インターバルをクリア
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
      }
    };

    // 初回チェック
    checkGrecaptcha();

    // 定期的にチェック（最大30秒間）
    let attempts = 0;
    const maxAttempts = 60; // 30秒間（500ms × 60回）

    checkIntervalRef.current = setInterval(() => {
      attempts++;

      if (attempts >= maxAttempts) {
        console.error('❌ reCAPTCHA script loading timeout');
        setError('reCAPTCHA読み込みがタイムアウトしました');
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        return;
      }

      checkGrecaptcha();
    }, 500);

    // クリーンアップ
    return () => {
      if (executeTimeoutRef.current) {
        clearTimeout(executeTimeoutRef.current);
        executeTimeoutRef.current = null;
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [siteKey, executeRecaptcha]);

  // エラー時のUIレンダリング
  if (!siteKey) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-red-600 text-sm font-medium">reCAPTCHA設定エラー</p>
            <p className="text-red-500 text-xs mt-1">
              環境変数 NEXT_PUBLIC_RECAPTCHA_SITE_KEY が設定されていません
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-yellow-600 text-sm font-medium">reCAPTCHAエラー</p>
              <p className="text-yellow-600 text-xs mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="text-yellow-700 hover:text-yellow-800 text-sm underline focus:outline-none"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded || !isReady) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center">
          <svg className="animate-spin h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <div>
            <p className="text-blue-600 text-sm font-medium">reCAPTCHA v3 読み込み中</p>
            <p className="text-blue-500 text-xs mt-1">セキュリティ認証を準備しています...</p>
          </div>
        </div>
      </div>
    );
  }

  // 成功時のUIレンダリング
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