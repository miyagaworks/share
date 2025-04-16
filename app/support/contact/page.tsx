// app/support/contact/page.tsx
'use client';

<<<<<<< HEAD
import { Suspense } from 'react';
import ContactPageContent from './ContactPageContent';

export default function ContactPage() {
=======
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

// お問い合わせの種類
type ContactType =
  | 'account'
  | 'billing'
  | 'technical'
  | 'feature'
  | 'feedback'
  | 'corporate'
  | 'other';

// ローディング表示用のコンポーネント
function LoadingFallback() {
  return (
    <PageLayout
      title="お問い合わせ"
      breadcrumbs={[
        { name: 'ホーム', href: '/' },
        { name: 'お問い合わせ', href: '/support/contact' },
      ]}
    >
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    </PageLayout>
  );
}

// useSearchParamsを使用するコンテンツコンポーネント
function ContactContent() {
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactType, setContactType] = useState<ContactType>('feature');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URLパラメータからの初期値設定
  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    const planParam = searchParams.get('plan');

    if (subjectParam) {
      setSubject(subjectParam);
    }

    // 法人プラン申し込みの場合
    if (subjectParam === '法人プラン申し込み') {
      setContactType('corporate');

      // プランパラメータがある場合、メッセージに自動追加
      if (planParam) {
        const planName = planParam === 'business' ? 'スタータープラン (¥3,000/月)' : planParam;

        setMessage(
          `法人プラン「${planName}」について詳細を知りたいです。\n\n会社の規模やご要望を記載いただくとスムーズです。`,
        );
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // フォームのバリデーション
      if (!name || !email || !subject || !message || !privacyAgreed) {
        throw new Error('すべての必須項目を入力してください');
      }

      // 法人プランの場合は会社名必須
      if (contactType === 'corporate' && !companyName) {
        throw new Error('法人プランのお問い合わせには会社名が必須です');
      }

      // お問い合わせ送信処理
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          companyName,
          contactType,
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'お問い合わせの送信に失敗しました');
      }

      // 成功
      setSuccess(true);
      toast.success('お問い合わせが送信されました');

      // フォームをリセット（法人プラン申し込みの場合は残す）
      if (contactType !== 'corporate') {
        setName('');
        setEmail('');
        setCompanyName('');
        setSubject('');
        setMessage('');
        setPrivacyAgreed(false);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('お問い合わせの送信に失敗しました');
      }
      toast.error('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setError(null);
    if (contactType !== 'corporate') {
      setName('');
      setEmail('');
      setCompanyName('');
      setSubject('');
      setMessage('');
    }
    setPrivacyAgreed(false);
  };

>>>>>>> a20d17fb3f2293468ead8460ba8a1d377c3cb583
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <ContactPageContent />
    </Suspense>
  );
}

// メインのページコンポーネント
export default function ContactPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ContactContent />
    </Suspense>
  );
}