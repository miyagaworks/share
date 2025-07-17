// app/support/contact/ContactPageContent.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import Link from 'next/link';
// お問い合わせの種類
type ContactType =
  | 'account'
  | 'billing'
  | 'technical'
  | 'feature'
  | 'feedback'
  | 'corporate'
  | 'other';
export default function ContactPageContent() {
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
  return (
    <PageLayout
      title="お問い合わせ"
      breadcrumbs={[
        { name: 'ホーム', href: '/' },
        { name: 'お問い合わせ', href: '/support/contact' },
      ]}
    >
      <div className="space-y-6">
        <p className="mb-6 text-justify">
          Shareに関するお問い合わせは、以下のフォームからお願いいたします。通常2営業日以内にご返信いたします。
        </p>
        {success && contactType === 'corporate' ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <h3 className="text-lg font-medium text-green-800 mb-2">
              お問い合わせありがとうございます
            </h3>
            <p className="text-green-700 mb-4">
              法人プランに関するお問い合わせを受け付けました。担当者より1営業日以内にご連絡いたします。
            </p>
            <Button
              type="button"
              onClick={resetForm}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              新しいお問い合わせをする
            </Button>
          </div>
        ) : success ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <h3 className="text-lg font-medium text-green-800 mb-2">送信完了</h3>
            <p className="text-green-700 mb-4 text-justify">
              お問い合わせありがとうございます。内容を確認の上、必要に応じてご連絡いたします。
            </p>
            <Button
              type="button"
              onClick={resetForm}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              新しいお問い合わせをする
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                お問い合わせカテゴリ <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={contactType}
                onChange={(e) => setContactType(e.target.value as ContactType)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="account">アカウントについて</option>
                <option value="billing">お支払いについて</option>
                <option value="technical">技術的な問題</option>
                <option value="feature">機能に関する質問</option>
                <option value="feedback">フィードバック</option>
                <option value="corporate">法人プランについて</option>
                <option value="other">その他</option>
              </select>
            </div>
            {/* 法人プランの場合のみ会社名フィールドを表示 */}
            {contactType === 'corporate' && (
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  会社名 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                件名 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                お問い合わせ内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-justify"
              ></textarea>
            </div>
            {/* 法人プランの場合の追加説明 */}
            {contactType === 'corporate' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">法人プランについて</h4>
                <p className="text-sm text-blue-700">
                  法人プランに関するお問い合わせをありがとうございます。
                  内容を確認後、担当者より1営業日以内にご連絡いたします。
                  お急ぎの場合は、電話番号も記載いただけますとスムーズです。
                </p>
              </div>
            )}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="privacy"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="privacy" className="ml-2 block text-sm text-gray-700">
                <span className="text-red-500">*</span>{' '}
                <Link
                  href="/legal/privacy"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  プライバシーポリシー
                </Link>
                に同意します
              </label>
            </div>
            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-6 py-3 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" /> 送信中...
                  </>
                ) : (
                  '送信する'
                )}
              </Button>
            </div>
          </form>
        )}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-xl font-semibold mb-4">その他のお問い合わせ方法</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">メールでのお問い合わせ</h3>
              <p className="mt-1">support@sns-share.com</p>
            </div>
            <div>
              <h3 className="font-medium">お電話でのお問い合わせ</h3>
              <p className="mt-1 text-justify">082-208-3976（平日10:00〜18:00 土日祝日休業）</p>
            </div>
            <div>
              <h3 className="font-medium">郵送でのお問い合わせ</h3>
              <p className="mt-1 text-justify">
                〒731-0137
                <br />
                広島県広島市安佐南区山本2-3-35
                <br />
                株式会社Senrigan Share運営事務局宛
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}