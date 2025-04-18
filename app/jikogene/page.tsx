// app/jikogene/page.tsx
'use client';

<<<<<<< HEAD
import { Suspense } from 'react';
import JikogeneContent from './components/JikogeneContent';

export default function JikogenePage() {
=======
import { useState, useEffect, Suspense } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormData } from './types';
import IntroductionForm from './components/IntroductionForm';
import Result from './components/Result';
import { generateIntroductionAction } from '@/actions/jikogene';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

// ローディング表示用のコンポーネント
function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-8 flex justify-center">
          <Image
            src="/jikogene.svg"
            alt="自己紹介文ジェネレーター"
            width={240}
            height={60}
            priority
          />
        </div>
        <div className="bg-white rounded-md shadow-md max-w-3xl mx-auto p-6 animate-fadeIn">
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-700 font-medium">読み込み中...</p>
            <p className="mt-2 text-gray-500 text-sm">少々お待ちください</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// useSearchParamsを使用するコンテンツコンポーネント
function JikogeneContent() {
  const [result, setResult] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [userInfo, setUserInfo] = useState<{
    name?: string;
    nameEn?: string;
    occupation?: string;
    phone?: string;
    currentBio?: string;
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromProfile = searchParams.get('fromProfile');

  // ユーザー情報を取得
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        // fromProfileパラメータがある場合のみユーザー情報を取得
        if (fromProfile === 'true') {
          const response = await fetch('/api/jikogene');

          if (!response.ok) {
            throw new Error('ユーザー情報の取得に失敗しました');
          }

          const data = await response.json();

          if (data.success && data.user) {
            setUserInfo(data.user);
          }
        }
      } catch (error) {
        console.error('ユーザー情報取得エラー:', error);
        // エラーがあっても処理は続行
      } finally {
        setInitialLoading(false);
      }
    }

    fetchUserInfo();
  }, [fromProfile]);

  const handleFormSubmit = async (data: FormData) => {
    console.log('フォーム送信開始', data);
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      // 必須フィールドの検証
      if (!data.basicInfo.ageGroup || !data.basicInfo.occupation) {
        throw new Error('基本情報の必須項目を入力してください');
      }
      if (data.hobbies.length === 0) {
        throw new Error('趣味・興味を少なくとも1つ選択してください');
      }
      if (data.personalityTraits.length === 0) {
        throw new Error('性格・特性を少なくとも1つ選択してください');
      }
      if (!data.purpose) {
        throw new Error('文章の用途を選択してください');
      }
      if (!data.length) {
        throw new Error('文章の長さを選択してください');
      }

      // サーバーアクションの呼び出し
      console.log('サーバーアクション呼び出し開始');
      const response = await generateIntroductionAction(data);
      console.log('サーバーアクション応答', response);

      if ('error' in response) {
        throw new Error(response.error);
      }

      if (response.success && response.data) {
        setResult(response.data.generatedText);

        // 警告メッセージがある場合
        if (response.data.warning) {
          setWarning(response.data.warning);
          toast.success('自己紹介文を生成しました（簡易版）', {
            icon: '⚠️',
            duration: 5000,
          });
        } else {
          toast.success('自己紹介文を生成しました！');
        }

        console.log('生成成功', {
          textLength: response.data.generatedText.length,
          hasWarning: !!response.data.warning,
        });
      } else {
        throw new Error('自己紹介文の生成に失敗しました。');
      }
    } catch (err: unknown) {
      console.error('生成エラー:', err);

      const errorMessage =
        err instanceof Error ? err.message : '自己紹介文の生成中にエラーが発生しました。';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setWarning(null);
    setError(null);
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);
  };

  const handleCopyAndReturn = () => {
    if (result) {
      navigator.clipboard
        .writeText(result)
        .then(() => {
          toast.success('クリップボードにコピーしました');
          // プロフィールページに戻る
          if (fromProfile === 'true') {
            router.push('/dashboard/profile');
          }
        })
        .catch(() => {
          toast.error('コピーに失敗しました');
        });
    }
  };

  // 初期ロード中の表示
  if (initialLoading) {
    return (
      <div className="min-h-screen flex flex-col py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-8 flex justify-center">
            <Image
              src="/jikogene.svg"
              alt="自己紹介文ジェネレーター"
              width={240}
              height={60}
              priority
            />
          </div>
          <div className="bg-white rounded-md shadow-md max-w-3xl mx-auto p-6 animate-fadeIn">
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-700 font-medium">ユーザー情報を読み込んでいます...</p>
              <p className="mt-2 text-gray-500 text-sm">少々お待ちください</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

>>>>>>> a20d17fb3f2293468ead8460ba8a1d377c3cb583
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center">
          <p className="text-gray-700">読み込み中...</p>
        </div>
      }
    >
      <JikogeneContent />
    </Suspense>
  );
<<<<<<< HEAD
=======
}

// メインのページコンポーネント
export default function JikogenePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <JikogeneContent />
    </Suspense>
  );
>>>>>>> a20d17fb3f2293468ead8460ba8a1d377c3cb583
}