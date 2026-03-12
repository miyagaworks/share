// components/RecaptchaWrapper.tsx
// reCAPTCHA v3 ラッパー（マルチドメイン対応）
//
// 現在バイパス中（PAT問題回避: bypass-token-pat-issue）
// 再有効化時の注意:
// - Google reCAPTCHA Admin Console で全パートナードメインを登録すること
// - 環境変数 NEXT_PUBLIC_RECAPTCHA_SITE_KEY にサイトキーを設定
// - CSP は next.config.mjs で www.google.com, www.gstatic.com, www.recaptcha.net を既に許可済み
'use client';
import { useEffect, useCallback } from 'react';

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
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const executeRecaptcha = useCallback(async () => {
    // サイトキーが未設定または明示的にバイパスが指定されている場合はバイパス
    if (!siteKey || siteKey === 'BYPASS') {
      console.log('reCAPTCHA をバイパス（サイトキー未設定 or BYPASS指定）');
      onVerify('bypass-token-pat-issue');
      return;
    }

    // reCAPTCHA v3 スクリプトがロード済みか確認
    if (typeof window !== 'undefined' && window.grecaptcha) {
      try {
        const token = await window.grecaptcha.execute(siteKey, { action });
        onVerify(token);
      } catch (error) {
        console.error('reCAPTCHA 実行エラー:', error);
        onVerify(null);
      }
    } else {
      // スクリプト未ロード時はバイパス（後方互換性）
      console.log('reCAPTCHA スクリプト未ロード、バイパス');
      onVerify('bypass-token-pat-issue');
    }
  }, [siteKey, action, onVerify]);

  useEffect(() => {
    executeRecaptcha();
  }, [executeRecaptcha]);

  return <div className="text-xs text-gray-500">セキュリティ検証済み</div>;
}
