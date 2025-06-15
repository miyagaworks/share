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

  return (
    <ReCAPTCHA
      ref={recaptchaRef}
      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
      onChange={onVerify}
      onExpired={onExpired}
      theme="light" // または "dark"
    />
  );
}