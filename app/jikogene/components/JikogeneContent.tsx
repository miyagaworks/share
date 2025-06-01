// app/jikogene/components/JikogeneContent.tsx
'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormData } from '../types';
import IntroductionForm from './IntroductionForm';
import Result from './Result';
import { generateIntroductionAction } from '@/actions/jikogene';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
export default function JikogeneContent() {
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
        // ユーザー情報取得エラーは処理を続行（必須ではないため）
      } finally {
        setInitialLoading(false);
      }
    }
    fetchUserInfo();
  }, [fromProfile]);
  const handleFormSubmit = async (data: FormData) => {
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
      const response = await generateIntroductionAction(data);
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
      } else {
        throw new Error('自己紹介文の生成に失敗しました。');
      }
    } catch (err: unknown) {
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
  return (
    <div className="min-h-screen flex flex-col py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-8 flex justify-center">
          {/* タイトルをSVGロゴに変更 */}
          <Image
            src="/jikogene.svg"
            alt="自己紹介文ジェネレーター"
            width={240}
            height={60}
            priority
          />
        </div>
        {!result && !loading && !error && (
          <div className="animate-fadeIn">
            <div className="bg-white rounded-md shadow-md max-w-3xl mx-auto p-6">
              <IntroductionForm
                onSubmit={handleFormSubmit}
                key={`form-${retryCount}`}
                initialUserInfo={userInfo || undefined}
              />
            </div>
          </div>
        )}
        {loading && (
          <div className="bg-white rounded-md shadow-md max-w-3xl mx-auto p-6 animate-fadeIn">
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-700 font-medium">あなたの自己紹介文を生成中です...</p>
              <p className="mt-2 text-gray-500 text-sm">少々お待ちください</p>
            </div>
          </div>
        )}
        {error && (
          <Card className="max-w-3xl mx-auto p-6 animate-fadeIn">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-red-800">エラーが発生しました</h3>
                  <p className="mt-2 text-md text-red-700">{error}</p>
                  <p className="mt-2 text-sm text-gray-600">
                    しばらく経ってからもう一度お試しください。
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              <Button onClick={handleRetry} className="flex items-center" variant="default">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                もう一度試す
              </Button>
            </div>
          </Card>
        )}
        {result && !loading && (
          <>
            <Result text={result} warning={warning || undefined} onReset={handleReset} />
            {/* プロフィールページから来た場合のボタン表示 */}
            {fromProfile === 'true' && (
              <div className="max-w-3xl mx-auto mt-6 text-center">
                <Button
                  onClick={handleCopyAndReturn}
                  className="w-full sm:w-auto py-3 px-6"
                  variant="default"
                >
                  コピーしてプロフィールページに戻る
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}